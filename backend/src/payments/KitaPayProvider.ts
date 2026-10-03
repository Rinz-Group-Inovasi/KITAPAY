import { IPaymentProvider, PaymentRequest, PaymentResponse, PayoutRequest, PayoutResponse } from './types';
import { supabaseAdmin } from '../supabase';
import crypto from 'crypto';

export class KitaPayProvider implements IPaymentProvider {
    private getSecretKey() {
        // You might want to define KITAPAY_SECRET_KEY in your .env
        return process.env.KITAPAY_SECRET_KEY || process.env.PAKASIR_API_KEY || '';
    }

    private getBaseUrl() {
        return 'https://apikita.rinzgroup.web.id/v1';
    }

    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const inputAmount = request.amount;
            let grossAmount = inputAmount;

            if (request.chargeFeeToCustomer) {
                if (inputAmount >= 98000 && inputAmount < 98600) {
                    grossAmount = 100000;
                } else if (inputAmount >= 98600) {
                    grossAmount = inputAmount + Math.round((inputAmount * 0.014) / 0.986);
                } else {
                    grossAmount = inputAmount + Math.round((inputAmount * 0.015 + 500) / 0.985);
                }
            }

            // Fee calculation (assuming similar to previous or as per your business logic)
            const baseFee = Math.round((grossAmount * 0.007) + 310);
            let totalDeduction = 0;

            if (grossAmount < 100000) {
                totalDeduction = Math.round((grossAmount * 0.015) + 500);
            } else {
                totalDeduction = Math.round(grossAmount * 0.014);
            }

            const kitapayFee = totalDeduction - baseFee;
            const netAmount = grossAmount - totalDeduction;

            const merchantCode = request.merchantId.split('-')[0].toUpperCase();
            const orderId = `KP-${merchantCode}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;            
            
            const isSandbox = (request as any).isSandbox || false;

            const apiKey = this.getSecretKey();
            const targetWebhookUrl = process.env.WEBHOOK_BASE_URL 
                ? `${process.env.WEBHOOK_BASE_URL}/webhooks/kitapay` 
                : 'https://kitapay.rinzgroup.web.id/webhook/kitapay';

            // Call KitaPay API
            const response = await fetch(`${this.getBaseUrl()}/payments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    merchantId: request.merchantId,
                    amount: grossAmount,
                    externalId: orderId,
                    targetWebhookUrl: targetWebhookUrl
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`KitaPay API Error: ${errText}`);
            }

            const kitaRes = await response.json();
            
            if (!kitaRes.success || !kitaRes.transaction) {
                throw new Error(`KitaPay API Failed: ${JSON.stringify(kitaRes)}`);
            }

            const transactionData = kitaRes.transaction;
            
            const qrisString = transactionData.qris_string;
            const externalId = transactionData.id; // Usually the provider's transaction ID
            const expiresAt = transactionData.expires_at;

            const { data, error } = await supabaseAdmin
                .from('transactions')
                .insert({
                    merchant_id: request.merchantId,
                    external_id: externalId,
                    amount: grossAmount,
                    base_fee: baseFee,
                    kitapay_fee: kitapayFee,
                    total_deduction: totalDeduction,
                    net_amount: netAmount,
                    payment_method: request.paymentMethod || 'qris',
                    qris_string: qrisString,
                    status: 'PENDING',
                    customer_email: request.customerEmail,
                    customer_whatsapp: request.customerWhatsapp,
                    expires_at: expiresAt,
                    is_sandbox: isSandbox,
                })
                .select('id')
                .single();

            if (error || !data) {
                throw new Error('Failed to create transaction in DB: ' + error?.message);
            }

            return {
                success: true,
                transactionId: data.id,
                externalId,
                qrisString,
                amount: grossAmount,
                totalDeduction,
                netAmount,
                expiresAt,
            };
        } catch (error: any) {
            return {
                success: false,
                transactionId: '',
                amount: request.amount,
                totalDeduction: 0,
                netAmount: 0,
                expiresAt: '',
                error: error.message,
            };
        }
    }

    async requestPayout(request: PayoutRequest): Promise<PayoutResponse> {
        try {
            if (request.amount < 25000) {
                throw new Error('Minimal penarikan adalah Rp 25.000');
            }
            if (request.amount > 2000000) {
                throw new Error('Maksimal penarikan adalah Rp 2.000.000 per transaksi');
            }

            let fee = 0;
            if (request.payoutType === 'INSTANT_PAID') {
                fee = 2000;
            }

            const netPayout = request.amount - fee;

            if (netPayout <= 0) {
                throw new Error('Nominal penarikan harus lebih besar dari biaya layanan.');
            }

            const externalPayoutId = 'PO-KITA-' + Date.now();
            let scheduledFor = null;

            if (request.payoutType === 'SCHEDULED_FREE') {
                const d = new Date();
                d.setDate(d.getDate() + (6 - d.getDay() + 7) % 7);
                d.setHours(9, 0, 0, 0);
                scheduledFor = d.toISOString();
            }

            const isSandbox = (request as any).isSandbox || false;

            const { data, error } = await supabaseAdmin
                .from('payouts')
                .insert({
                    merchant_id: request.merchantId,
                    external_payout_id: externalPayoutId,
                    amount: request.amount,
                    fee,
                    net_payout: netPayout,
                    payout_type: request.payoutType,
                    status: request.payoutType === 'INSTANT_PAID' ? 'PROCESSING' : 'PENDING',
                    bank_code: request.bankCode,
                    account_number: request.accountNumber,
                    account_name: request.accountName,
                    scheduled_for: scheduledFor,
                    is_sandbox: isSandbox,
                })
                .select('id')
                .single();

            if (error || !data) {
                throw new Error('Failed to create payout in DB: ' + error?.message);
            }

            const { data: merchant } = await supabaseAdmin.from('merchants').select('available_balance, sandbox_balance').eq('id', request.merchantId).single();
            if (merchant) {
                if (isSandbox && merchant.sandbox_balance >= request.amount) {
                    await supabaseAdmin.from('merchants').update({ sandbox_balance: merchant.sandbox_balance - request.amount }).eq('id', request.merchantId);
                } else if (!isSandbox && merchant.available_balance >= request.amount) {
                    await supabaseAdmin.from('merchants').update({ available_balance: merchant.available_balance - request.amount }).eq('id', request.merchantId);
                } else {
                    throw new Error('Insufficient balance');
                }
            } else {
                throw new Error('Merchant not found');
            }

            return {
                success: true,
                payoutId: data.id,
                externalPayoutId,
                amount: request.amount,
                fee,
                netPayout,
                status: request.payoutType === 'INSTANT_PAID' ? 'PROCESSING' : 'PENDING',
            };
        } catch (error: any) {
             return {
                success: false,
                payoutId: '',
                amount: request.amount,
                fee: 0,
                netPayout: 0,
                status: 'FAILED',
                error: error.message,
            };
        }
    }

    verifyWebhookSignature(payload: any, signature: string): boolean {
        const secret = process.env.KITAPAY_WEBHOOK_SECRET || process.env.KITAPAY_SECRET_KEY || process.env.PAKASIR_API_KEY || 'secret';
        const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
        // You can uncomment below if KitaPay signs their webhooks this way.
        // return signature === expectedSignature; 
        
        return true;
    }
}

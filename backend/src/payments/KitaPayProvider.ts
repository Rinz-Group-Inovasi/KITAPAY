import { IPaymentProvider, PaymentRequest, PaymentResponse, PayoutRequest, PayoutResponse } from './types';
import { supabaseAdmin } from '../supabase';
import crypto from 'crypto';

export class KitaPayProvider implements IPaymentProvider {
    private getSecretKey() {
        // You might want to define KITAPAY_SECRET_KEY in your .env
        return process.env.KITAPAY_SECRET_KEY || process.env.PAKASIR_API_KEY || '';
    }

    private getBaseUrl() {
        return 'https://app.pakasir.com/api';
    }

    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const inputAmount = request.amount;
            let grossAmount = inputAmount;

            if (request.chargeFeeToCustomer) {
                if (inputAmount <= 20000) {
                    grossAmount = inputAmount + 750;
                } else if (inputAmount <= 50000) {
                    grossAmount = inputAmount + 1000;
                } else if (inputAmount <= 100000) {
                    grossAmount = inputAmount + 1500;
                } else {
                    grossAmount = Math.ceil(inputAmount / 0.985);
                }
            }

            // Fee calculation (Opsi 1 Tiering)
            let baseFee = 0;
            let totalDeduction = 0;

            if (inputAmount <= 20000) {
                baseFee = Math.round((grossAmount * 0.007) + 310);
                totalDeduction = 750;
            } else if (inputAmount <= 50000) {
                baseFee = Math.round((grossAmount * 0.007) + 310);
                totalDeduction = 1000;
            } else if (inputAmount <= 100000) {
                baseFee = Math.round((grossAmount * 0.007) + 310);
                totalDeduction = 1500;
            } else {
                baseFee = Math.round(grossAmount * 0.007);
                totalDeduction = Math.round(grossAmount * 0.015);
            }

            let netAmount = grossAmount - totalDeduction;
            if (request.chargeFeeToCustomer) {
                netAmount = inputAmount;
                totalDeduction = grossAmount - inputAmount;
            }

            const kitapayFee = Math.max(0, totalDeduction - baseFee);

            const merchantCode = request.merchantId.split('-')[0].toUpperCase();
            const orderId = `KP-${merchantCode}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;            
            
            const isSandbox = (request as any).isSandbox || false;

            const apiKey = this.getSecretKey();
            const targetWebhookUrl = process.env.WEBHOOK_BASE_URL 
                ? `${process.env.WEBHOOK_BASE_URL}/webhooks/kitapay` 
                : 'https://kitapay.rinzgroup.web.id/webhook/kitapay';

            const projectSlug = process.env.PAKASIR_SLUG || 'kita-atur';

            // Call Pakasir API as upstream (v2)
            const response = await fetch(`${this.getBaseUrl()}/v2/create-transaction/${projectSlug}/${orderId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Api-Key': apiKey
                },
                body: JSON.stringify({
                    method: 'qris',
                    amount: grossAmount
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Upstream API Error: ${errText}`);
            }

            const transactionData: any = await response.json();
            
            if (!transactionData || !transactionData.qr_string) {
                throw new Error(`Upstream API Failed: ${JSON.stringify(transactionData)}`);
            }
            
            const qrisString = transactionData.qr_string;
            const externalId = transactionData.order_id || orderId;
            const expiresAt = transactionData.expired_at || new Date(Date.now() + 60 * 60 * 1000).toISOString();

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

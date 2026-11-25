import { IPaymentProvider, PaymentRequest, PaymentResponse, PayoutRequest, PayoutResponse } from '../types';
import { supabaseAdmin } from '../../supabase';
import { DokuSecurity } from './DokuSecurity';
import { DokuTokenManager } from './DokuTokenManager';

export class DokuProvider implements IPaymentProvider {
    private getClientSecret(): string {
        return process.env.DOKU_SECRET_KEY || '';
    }

    private getClientId(): string {
        return process.env.DOKU_CLIENT_ID || '';
    }

    private getMerchantId(): string {
        return process.env.DOKU_MERCHANT_ID || '101749';
    }

    private getTerminalId(): string {
        return process.env.DOKU_TERMINAL_ID || 'A01';
    }

    private getPostalCode(): string {
        return process.env.DOKU_POSTAL_CODE || '17142';
    }

    async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
        try {
            const inputAmount = request.amount;
            let grossAmount = inputAmount;

            if (request.chargeFeeToCustomer) {
                if (inputAmount <= 100000) {
                    grossAmount = inputAmount + 1500;
                } else {
                    grossAmount = Math.ceil(inputAmount / 0.985);
                }
            }

            // Fee calculation (Upstream DOKU: Rp 1.110 [Rp 1.000 + PPN 11%] untuk <= 100k, 0.7% untuk > 100k)
            let baseFee = 0;
            let totalDeduction = 0;

            if (inputAmount <= 100000) {
                // Tier 1: Rp 1 - Rp 100.000 (Fee Rp 1.500 flat, Modal DOKU Rp 1.110, Margin Rp 390)
                baseFee = 1110;
                totalDeduction = 1500;
            } else {
                // Tier 2: > Rp 100.000 (Fee 1.5%, Modal DOKU 0.7%, Margin 0.8%)
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

            // 1. Prepare SNAP QRIS MPM Generate Request
            const endpointPath = '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate';
            const validityPeriod = DokuSecurity.formatExpiryTimestamp(60);
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

            const requestBody = {
                partnerReferenceNo: orderId,
                amount: {
                    value: grossAmount.toFixed(2),
                    currency: 'IDR'
                },
                merchantId: this.getMerchantId(),
                terminalId: this.getTerminalId(),
                validityPeriod,
                additionalInfo: {
                    postalCode: this.getPostalCode(),
                    feeType: 1
                }
            };

            const baseUrl = DokuTokenManager.getBaseUrl();
            const sendQrRequest = async (forceRefreshToken: boolean) => {
                const accessToken = await DokuTokenManager.getB2BToken(forceRefreshToken);
                const timestamp = DokuSecurity.getLocalTimestamp();
                const externalId = `EXT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                const signature = DokuSecurity.generateSymmetricSignature(
                    'POST',
                    endpointPath,
                    accessToken,
                    requestBody,
                    timestamp,
                    this.getClientSecret()
                );

                return fetch(`${baseUrl}${endpointPath}`, {
                    method: 'POST',
                    headers: {
                        'X-PARTNER-ID': this.getClientId(),
                        'X-EXTERNAL-ID': externalId,
                        'X-TIMESTAMP': timestamp,
                        'X-SIGNATURE': signature,
                        'Authorization': `Bearer ${accessToken}`,
                        'CHANNEL-ID': 'H2H',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            };

            // 2. Execute QRIS generation with automatic 1x token refresh retry on 401 / 4014701
            let response = await sendQrRequest(false);
            let errText = !response.ok ? await response.text() : '';

            if (response.status === 401 || errText.includes('4014701')) {
                console.warn('[DokuProvider] B2B Access Token rejected (401), refreshing token and retrying once...');
                response = await sendQrRequest(true);
                errText = !response.ok ? await response.text() : '';
            }

            if (!response.ok) {
                throw new Error(`DOKU API Error [HTTP ${response.status}]: ${errText}`);
            }

            const transactionData: any = await response.json();

            if (!transactionData || !transactionData.qrContent) {
                throw new Error(`DOKU API did not return qrContent: ${JSON.stringify(transactionData)}`);
            }

            const qrisString = transactionData.qrContent;
            const externalIdToSave = transactionData.partnerReferenceNo || orderId;

            // Save to database
            const { data, error } = await supabaseAdmin
                .from('transactions')
                .insert({
                    merchant_id: request.merchantId,
                    external_id: externalIdToSave,
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
                externalId: externalIdToSave,
                qrisString,
                amount: grossAmount,
                totalDeduction,
                netAmount,
                expiresAt,
            };
        } catch (error: any) {
            console.error('[DokuProvider] createPayment error:', error);
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

            const { data: merchant } = await supabaseAdmin
                .from('merchants')
                .select('available_balance, sandbox_balance')
                .eq('id', request.merchantId)
                .single();

            if (merchant) {
                if (isSandbox && merchant.sandbox_balance >= request.amount) {
                    await supabaseAdmin
                        .from('merchants')
                        .update({ sandbox_balance: merchant.sandbox_balance - request.amount })
                        .eq('id', request.merchantId);
                } else if (!isSandbox && merchant.available_balance >= request.amount) {
                    await supabaseAdmin
                        .from('merchants')
                        .update({ available_balance: merchant.available_balance - request.amount })
                        .eq('id', request.merchantId);
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

    verifyWebhookSignature(payload: any, signature: string, headers?: any, rawBody?: string): boolean {
        const effectiveSig = signature || headers?.['x-signature'] || headers?.['signature'] || '';
        if (!effectiveSig) return false;

        const timestamp = headers?.['x-timestamp'] || headers?.['request-timestamp'] || '';
        const endpoint = headers?.['x-request-target'] || headers?.['request-target'] || '/api/webhooks/doku';

        return DokuSecurity.verifyWebhookSignature(
            'POST',
            endpoint,
            payload,
            timestamp,
            effectiveSig,
            this.getClientSecret(),
            rawBody,
            headers
        );
    }

    /**
     * Authoritative server-to-server order status check to DOKU API (/orders/v1/status/:invoiceNumber)
     * Prevents any forged webhook from ever crediting live merchant balance.
     */
    async verifyOrderStatusAtDoku(invoiceNumber: string, expectedAmount: number): Promise<{ verified: boolean; dokuStatus?: string }> {
        try {
            const crypto = await import('crypto');
            const clientId = this.getClientId();
            const secretKey = this.getClientSecret();
            if (!clientId || !secretKey || !invoiceNumber) return { verified: false };

            const requestId = `VER-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            const timestamp = DokuSecurity.getUtcTimestamp();
            const targetPath = `/orders/v1/status/${encodeURIComponent(invoiceNumber)}`;
            const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}`;
            const hmac = crypto.createHmac('sha256', secretKey).update(component).digest('base64');

            const baseUrl = DokuTokenManager.getBaseUrl();
            const res = await fetch(`${baseUrl}${targetPath}`, {
                method: 'GET',
                headers: {
                    'Client-Id': clientId,
                    'Request-Id': requestId,
                    'Request-Timestamp': timestamp,
                    'Signature': `HMACSHA256=${hmac}`
                }
            });

            if (!res.ok) {
                console.warn(`[DokuProvider] Upstream status check HTTP ${res.status} for ${invoiceNumber}`);
                return { verified: false };
            }

            const data: any = await res.json();
            const txStatus = String(data?.transaction?.status || '').toUpperCase();
            const paidAmt = Number(data?.order?.amount ?? data?.transaction?.amount ?? 0);

            if (txStatus === 'SUCCESS' && Math.round(paidAmt) === Math.round(Number(expectedAmount))) {
                return { verified: true, dokuStatus: 'SUCCESS' };
            }

            return { verified: false, dokuStatus: txStatus };
        } catch (err: any) {
            console.error('[DokuProvider] verifyOrderStatusAtDoku error:', err.message);
            return { verified: false };
        }
    }
}

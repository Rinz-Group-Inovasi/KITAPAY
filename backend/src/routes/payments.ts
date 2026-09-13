import { Router, Request, Response, NextFunction } from 'express';
import { PakasirProvider } from '../payments/PakasirProvider';
import { PaymentRequest } from '../payments/types';
import { supabaseAdmin } from '../supabase';
import crypto from 'crypto';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { redis, qstashClient } from '../upstash';

const router = Router();

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "5 m"),
});

const createPaymentLimiter = async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'anonymous';
    const { success } = await ratelimit.limit(identifier);
    if (!success) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
};

const PaymentRequestSchema = z.object({
    merchantId: z.string().uuid("Invalid merchant ID"),
    amount: z.number().min(1000, "Minimum transaction amount is Rp 1.000"),
    customerEmail: z.string().email("Invalid email format"),
    customerWhatsapp: z.string().regex(/^(08|628)[0-9]{7,12}$/, "Invalid WhatsApp format. Must start with 08 or 628."),
    paymentMethod: z.string().min(1),
    chargeFeeToCustomer: z.boolean().optional()
});

router.post('/create', createPaymentLimiter, async (req: Request, res: Response): Promise<any> => {
    try {
        let isSandbox = req.query.env === 'sandbox';
        let merchantId = req.body.merchantId;

        // Check for API Key in headers (Authorization: Bearer <key> or x-api-key: <key>)
        const authHeader = req.headers.authorization;
        const apiKeyHeader = req.headers['x-api-key'];
        const providedKey = (authHeader && authHeader.startsWith('Bearer ')) 
            ? authHeader.split(' ')[1] 
            : (apiKeyHeader as string);

        if (providedKey) {
            // Find merchant by API key
            const isLiveKey = providedKey.startsWith('sk_live_');
            const isTestKey = providedKey.startsWith('sk_test_');
            
            if (isLiveKey || isTestKey) {
                const searchColumn = isLiveKey ? 'live_secret_key' : 'sandbox_secret_key';
                const hashedKey = crypto.createHash('sha256').update(providedKey).digest('hex');
                
                const { data: authMerchant } = await supabaseAdmin
                    .from('merchants')
                    .select('id')
                    .eq(searchColumn, hashedKey)
                    .single();
                    
                if (!authMerchant) {
                    return res.status(401).json({ error: 'Invalid API Key' });
                }
                
                merchantId = authMerchant.id;
                isSandbox = isTestKey;
            } else {
                return res.status(401).json({ error: 'Invalid API Key format' });
            }
        }

        const validation = PaymentRequestSchema.safeParse({
            ...req.body,
            merchantId
        });

        if (!validation.success) {
            return res.status(400).json({ 
                error: validation.error.issues[0].message, 
                details: validation.error.issues 
            });
        }

        const validatedBody = validation.data;
        const { amount, customerEmail, customerWhatsapp, paymentMethod } = validatedBody;

        // KYC Check
        const { data: merchant } = await supabaseAdmin.from('merchants').select('verification_status, charge_fee_to_customer').eq('id', merchantId).single();
        if (!isSandbox && (!merchant || merchant.verification_status !== 'VERIFIED')) {
            return res.status(403).json({ error: 'Akun Anda belum terverifikasi (Unverified). Anda tidak dapat menerima pembayaran sebelum menyelesaikan KYC.' });
        }

        const provider = new PakasirProvider();
        const chargeFee = validatedBody.chargeFeeToCustomer !== undefined 
            ? validatedBody.chargeFeeToCustomer 
            : (merchant?.charge_fee_to_customer || false);

        const paymentRequest = { ...validatedBody, merchantId, isSandbox, chargeFeeToCustomer: chargeFee } as PaymentRequest & { isSandbox: boolean };
        const paymentRes = await provider.createPayment(paymentRequest);

        if (!paymentRes.success) {
            return res.status(500).json({ error: paymentRes.error });
        }

        return res.status(201).json(paymentRes);

    } catch (error: any) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { data: transaction, error } = await supabaseAdmin
            .from('transactions')
            .select(`
                *,
                merchants ( business_name )
            `)
            .eq('id', id)
            .single();

        if (error || !transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        return res.json(transaction);
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:id/simulate', async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Internal Auth Check: Only allow if there's a valid JWT from Supabase
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized. Only logged-in users can simulate.' });
        }
        const token = authHeader.split(' ')[1];
        const { data: userAuth, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !userAuth.user) {
            return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
        }

        // Use RPC for ACID transaction
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('simulate_payment_transaction', {
            p_transaction_id: id
        });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        const result = rpcResult as any;
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        const transaction = result.transaction;
        const targetUrl = result.target_webhook_url;

        let responseStatus = 200;
        let responseBody = 'OK (Simulated Local)';
        const payload = { 
            transactionId: transaction.id, 
            externalId: transaction.external_id, 
            status: 'PAID', 
            amount: transaction.amount,
            is_sandbox: transaction.is_sandbox
        };

        if (targetUrl) {
            try {
                const resQStash = await qstashClient.publishJSON({
                    url: targetUrl,
                    body: payload,
                    retries: 5 // Retry up to 5 times for resilience
                });
                responseStatus = 202; // 202 Accepted (Queued)
                responseBody = `Queued in QStash. MessageID: ${resQStash.messageId}`;
            } catch (err: any) {
                responseStatus = 500;
                responseBody = `QStash Error: ${err.message}`;
            }
        }

        // Create webhook log entry
        await supabaseAdmin
            .from('webhook_logs')
            .insert({
                merchant_id: transaction.merchant_id,
                event_type: 'PAYMENT_COMPLETED',
                payload,
                response_status: responseStatus,
                response_body: responseBody
            });

        return res.json({ success: true, message: 'Payment simulated successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

import { Router, Request, Response } from 'express';
import { getPaymentProvider } from '../payments';
import { supabaseAdmin } from '../supabase';

const router = Router();

router.post('/kitapay', async (req: Request, res: Response): Promise<any> => {
    try {
        const signature = (req.headers['x-kitapay-signature'] as string) || '';

        const payload = req.body;
        const provider = getPaymentProvider();
        
        if (!provider.verifyWebhookSignature(payload, signature)) {
            return res.status(401).json({ error: 'Invalid payload' });
        }

        const { order_id, status } = payload; 

        if (!order_id || !status) {
            return res.status(400).json({ error: 'Missing required webhook fields' });
        }

        const { data: tx, error: fetchError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('external_id', order_id)
            .single();

        if (fetchError || !tx) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (tx.status === 'PAID' || tx.status === 'EXPIRED') {
            return res.status(200).json({ message: 'Already processed' });
        }

        if (status === 'completed') {
            const { error: updateError } = await supabaseAdmin
                .from('transactions')
                .update({ status: 'PAID', updated_at: new Date().toISOString() })
                .eq('id', tx.id);

            if (updateError) {
                throw new Error('Failed to update transaction');
            }

            const { data: merchant } = await supabaseAdmin
                .from('merchants')
                .select('pending_balance, sandbox_pending_balance')
                .eq('id', tx.merchant_id)
                .single();

            if (merchant) {
                if (tx.is_sandbox) {
                    await supabaseAdmin
                        .from('merchants')
                        .update({
                            sandbox_pending_balance: (merchant.sandbox_pending_balance || 0) + tx.net_amount
                        })
                        .eq('id', tx.merchant_id);
                } else {
                    await supabaseAdmin
                        .from('merchants')
                        .update({
                            pending_balance: (merchant.pending_balance || 0) + tx.net_amount
                        })
                        .eq('id', tx.merchant_id);
                }
            }

        } else if (status === 'expired') {
             await supabaseAdmin
                .from('transactions')
                .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
                .eq('id', tx.id);
        }

        // Webhook Forwarding
        const { data: merchantData } = await supabaseAdmin
            .from('merchants')
            .select('webhook_url, sandbox_webhook_url')
            .eq('id', tx.merchant_id)
            .single();

        const targetUrl = tx.is_sandbox ? merchantData?.sandbox_webhook_url : merchantData?.webhook_url;

        if (targetUrl) {
            const forwardPayload = {
                transactionId: tx.id,
                externalId: tx.external_id,
                amount: tx.amount,
                status: status === 'completed' ? 'PAID' : 'EXPIRED',
                timestamp: new Date().toISOString(),
                is_sandbox: tx.is_sandbox
            };

            let responseStatus = 0;
            let responseBody = '';
            
            try {
                const axios = require('axios');
                const forwardRes = await axios.post(targetUrl, forwardPayload, { timeout: 15000 });
                responseStatus = forwardRes.status;
                responseBody = typeof forwardRes.data === 'object' ? JSON.stringify(forwardRes.data) : String(forwardRes.data);
            } catch (err: any) {
                responseStatus = err.response?.status || 500;
                responseBody = err.message;
            }

            await supabaseAdmin.from('webhook_logs').insert({
                merchant_id: tx.merchant_id,
                event_type: 'payment.' + (status === 'completed' ? 'success' : 'failed'),
                payload: forwardPayload,
                response_status: responseStatus,
                response_body: responseBody
            });
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/doku', async (req: Request, res: Response): Promise<any> => {
    try {
        const payload = req.body;
        const signature = (req.headers['x-signature'] as string) || '';
        const provider = getPaymentProvider();

        if (!provider.verifyWebhookSignature(payload, signature, req.headers)) {
            console.warn('[Webhook DOKU] Signature verification rejected');
            return res.status(401).json({
                responseCode: '4015600',
                responseMessage: 'Unauthorized. Signature'
            });
        }

        const orderId = payload.originalPartnerReferenceNo || payload.order?.invoice_number || payload.partnerReferenceNo;
        const dokuStatus = payload.latestTransactionStatus || payload.transaction?.status;

        if (!orderId) {
            return res.status(400).json({
                responseCode: '4005602',
                responseMessage: 'Missing partner reference number'
            });
        }

        const isSuccess = dokuStatus === '00' || dokuStatus === 'SUCCESS';
        const isExpired = dokuStatus === '05' || dokuStatus === '06' || dokuStatus === 'EXPIRED' || dokuStatus === 'FAILED';

        const { data: tx, error: fetchError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('external_id', orderId)
            .single();

        if (fetchError || !tx) {
            return res.status(404).json({
                responseCode: '4045601',
                responseMessage: 'Transaction not found'
            });
        }

        if (tx.status === 'PAID') {
            return res.status(200).json({
                responseCode: '2005600',
                responseMessage: 'Already processed'
            });
        }

        if (isSuccess) {
            await supabaseAdmin
                .from('transactions')
                .update({ status: 'PAID', updated_at: new Date().toISOString() })
                .eq('id', tx.id);

            const { data: merchant } = await supabaseAdmin
                .from('merchants')
                .select('pending_balance, sandbox_pending_balance')
                .eq('id', tx.merchant_id)
                .single();

            if (merchant) {
                if (tx.is_sandbox) {
                    await supabaseAdmin
                        .from('merchants')
                        .update({
                            sandbox_pending_balance: (merchant.sandbox_pending_balance || 0) + tx.net_amount
                        })
                        .eq('id', tx.merchant_id);
                } else {
                    await supabaseAdmin
                        .from('merchants')
                        .update({
                            pending_balance: (merchant.pending_balance || 0) + tx.net_amount
                        })
                        .eq('id', tx.merchant_id);
                }
            }
        } else if (isExpired) {
            await supabaseAdmin
                .from('transactions')
                .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
                .eq('id', tx.id);
        }

        // Webhook Forwarding to Merchant
        const { data: merchantData } = await supabaseAdmin
            .from('merchants')
            .select('webhook_url, sandbox_webhook_url')
            .eq('id', tx.merchant_id)
            .single();

        const targetUrl = tx.is_sandbox ? merchantData?.sandbox_webhook_url : merchantData?.webhook_url;

        if (targetUrl) {
            const forwardPayload = {
                transactionId: tx.id,
                externalId: tx.external_id,
                amount: tx.amount,
                status: isSuccess ? 'PAID' : (isExpired ? 'EXPIRED' : 'FAILED'),
                timestamp: new Date().toISOString(),
                is_sandbox: tx.is_sandbox
            };

            let responseStatus = 0;
            let responseBody = '';

            try {
                const axios = require('axios');
                const forwardRes = await axios.post(targetUrl, forwardPayload, { timeout: 15000 });
                responseStatus = forwardRes.status;
                responseBody = typeof forwardRes.data === 'object' ? JSON.stringify(forwardRes.data) : String(forwardRes.data);
            } catch (err: any) {
                responseStatus = err.response?.status || 500;
                responseBody = err.message;
            }

            await supabaseAdmin.from('webhook_logs').insert({
                merchant_id: tx.merchant_id,
                event_type: 'payment.' + (isSuccess ? 'success' : 'failed'),
                payload: forwardPayload,
                response_status: responseStatus,
                response_body: responseBody
            });
        }

        return res.status(200).json({
            responseCode: '2005600',
            responseMessage: 'Successful'
        });
    } catch (error: any) {
        console.error('[Webhook DOKU] Error:', error);
        return res.status(500).json({
            responseCode: '5005601',
            responseMessage: 'Internal Server Error'
        });
    }
});

router.get('/logs/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const env = req.query.env as string;

        let { data: logs, error } = await supabaseAdmin
            .from('webhook_logs')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false })
            .limit(200); // Fetch more to filter in memory
            
        if (error) throw error;

        if (logs) {
            logs = logs.filter(log => {
                const isSandbox = log.payload?.is_sandbox === true;
                if (env === 'sandbox') return isSandbox;
                return !isSandbox;
            }).slice(0, 50);
        }

        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/resend/:transactionId', async (req: Request, res: Response): Promise<any> => {
    try {
        const { transactionId } = req.params;

        const { data: tx, error: fetchError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (fetchError || !tx) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const { data: merchantData } = await supabaseAdmin
            .from('merchants')
            .select('webhook_url, sandbox_webhook_url')
            .eq('id', tx.merchant_id)
            .single();

        const targetUrl = tx.is_sandbox ? merchantData?.sandbox_webhook_url : merchantData?.webhook_url;

        if (!targetUrl) {
            return res.status(400).json({ error: 'No webhook URL configured for this merchant' });
        }

        const forwardPayload = {
            transactionId: tx.id,
            externalId: tx.external_id,
            amount: tx.amount,
            status: tx.status === 'COMPLETED' || tx.status === 'PAID' ? 'PAID' : (tx.status === 'EXPIRED' ? 'EXPIRED' : tx.status),
            timestamp: new Date().toISOString(),
            is_sandbox: tx.is_sandbox,
            is_resend: true
        };

        let responseStatus = 0;
        let responseBody = '';
        
        try {
            const axios = require('axios');
            const forwardRes = await axios.post(targetUrl, forwardPayload, { timeout: 5000 });
            responseStatus = forwardRes.status;
            responseBody = typeof forwardRes.data === 'object' ? JSON.stringify(forwardRes.data) : String(forwardRes.data);
        } catch (err: any) {
            responseStatus = err.response?.status || 500;
            responseBody = err.message;
        }

        await supabaseAdmin.from('webhook_logs').insert({
            merchant_id: tx.merchant_id,
            event_type: 'payment.resend',
            payload: forwardPayload,
            response_status: responseStatus,
            response_body: responseBody
        });

        return res.status(200).json({ success: true, responseStatus, responseBody });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

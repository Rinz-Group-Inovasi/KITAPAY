import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';

const router = Router();

router.get('/dashboard/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { liveUserId, env } = req.query;
        const isSandbox = env === 'sandbox';

        // Fetch real KYC status based on real user ID
        let kycStatus = 'UNVERIFIED';
        if (liveUserId) {
            const { data: userMerchant } = await supabaseAdmin
                .from('merchants')
                .select('verification_status')
                .eq('id', liveUserId as string)
                .single();
            if (userMerchant && userMerchant.verification_status) {
                kycStatus = userMerchant.verification_status;
            }
        }

        // --- LAZY SETTLEMENT ---
        // Find all PAID transactions older than 24 hours (or 1 minute in Sandbox) that are not settled
        const settleThreshold = new Date();
        if (isSandbox) {
            settleThreshold.setMinutes(settleThreshold.getMinutes() - 1);
        } else {
            settleThreshold.setDate(settleThreshold.getDate() - 1);
        }

        const { data: unsettledTxs } = await supabaseAdmin
            .from('transactions')
            .select('id, net_amount')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .in('status', ['PAID', 'COMPLETED'])
            .eq('settled', false)
            .lte('created_at', settleThreshold.toISOString()); // Note: ideally should use paid_at, but created_at is fine for now

        if (unsettledTxs && unsettledTxs.length > 0) {
            const totalToSettle = unsettledTxs.reduce((sum, tx) => sum + tx.net_amount, 0);
            const txIds = unsettledTxs.map(tx => tx.id);

            // Update transactions to settled
            await supabaseAdmin.from('transactions').update({ settled: true }).in('id', txIds);

            // Fetch current merchant balances
            const { data: currentMerchant } = await supabaseAdmin.from('merchants').select('*').eq('id', merchantId).single();
            if (currentMerchant) {
                if (isSandbox) {
                    await supabaseAdmin.from('merchants').update({
                        sandbox_balance: (currentMerchant.sandbox_balance || 0) + totalToSettle,
                        sandbox_pending_balance: Math.max(0, (currentMerchant.sandbox_pending_balance || 0) - totalToSettle)
                    }).eq('id', merchantId);
                } else {
                    await supabaseAdmin.from('merchants').update({
                        available_balance: (currentMerchant.available_balance || 0) + totalToSettle,
                        pending_balance: Math.max(0, (currentMerchant.pending_balance || 0) - totalToSettle)
                    }).eq('id', merchantId);
                }
            }
        }
        // --- END LAZY SETTLEMENT ---

        // --- LAZY EXPIRATION ---
        const now = new Date().toISOString();
        const { data: expiredTxs } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .eq('status', 'PENDING')
            .lt('expires_at', now);
            
        if (expiredTxs && expiredTxs.length > 0) {
            const expiredIds = expiredTxs.map(tx => tx.id);
            await supabaseAdmin.from('transactions').update({ status: 'EXPIRED' }).in('id', expiredIds);
        }
        // --- END LAZY EXPIRATION ---

        // Fetch active merchant balances
        const { data: merchant } = await supabaseAdmin
            .from('merchants')
            .select('available_balance, pending_balance, sandbox_balance, sandbox_pending_balance, charge_fee_to_customer')
            .eq('id', merchantId)
            .single();
            
        const balance = isSandbox ? (merchant?.sandbox_balance || 0) : (merchant?.available_balance || 0);
        const pendingBalance = isSandbox ? (merchant?.sandbox_pending_balance || 0) : (merchant?.pending_balance || 0);

        // Fetch transactions (Recent)
        const { data: txs } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .order('created_at', { ascending: false })
            .limit(5);
        
        // Fetch total uang masuk
        const { data: allTxs } = await supabaseAdmin
            .from('transactions')
            .select('amount, status')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox);
            
        const uangMasuk = allTxs ? allTxs.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0) : 0;
        const transactionCount = allTxs ? allTxs.length : 0;

        // Fetch total uang keluar
        const { data: pyts } = await supabaseAdmin
            .from('payouts')
            .select('amount')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .eq('status', 'COMPLETED');
        const uangKeluar = pyts ? pyts.reduce((sum, p) => sum + p.amount, 0) : 0;

        return res.status(200).json({
            balance,
            pendingBalance,
            transactionCount: txs?.length || 0,
            uangMasuk,
            uangKeluar,
            transactions: (txs || []).slice(0, 5),
            kycStatus,
            chargeFeeToCustomer: merchant?.charge_fee_to_customer || false
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

router.put('/settings/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { chargeFeeToCustomer } = req.body;
        const { error } = await supabaseAdmin
            .from('merchants')
            .update({ charge_fee_to_customer: Boolean(chargeFeeToCustomer) })
            .eq('id', merchantId);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Settings Update Error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

router.get('/webhook-settings/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { data: merchant } = await supabaseAdmin
            .from('merchants')
            .select('webhook_url, sandbox_webhook_url')
            .eq('id', merchantId)
            .single();
        res.json({ 
            webhookUrl: merchant?.webhook_url || '', 
            sandboxWebhookUrl: merchant?.sandbox_webhook_url || '' 
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/webhook-settings/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { webhookUrl, sandboxWebhookUrl } = req.body;
        const { error } = await supabaseAdmin
            .from('merchants')
            .update({ 
                webhook_url: webhookUrl,
                sandbox_webhook_url: sandboxWebhookUrl
            })
            .eq('id', merchantId);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

import crypto from 'crypto';

router.get('/api-keys/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { data: merchant } = await supabaseAdmin
            .from('merchants')
            .select('live_secret_key, sandbox_secret_key')
            .eq('id', merchantId)
            .single();
            
        res.json({
            liveSecretKey: merchant?.live_secret_key ? 'sk_live_************************' : null,
            sandboxSecretKey: merchant?.sandbox_secret_key ? 'sk_test_************************' : null
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/api-keys/:merchantId/generate', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { type } = req.body; // 'live' | 'sandbox'
        
        if (type !== 'live' && type !== 'sandbox') {
            return res.status(400).json({ error: 'Invalid key type' });
        }
        
        const prefix = type === 'live' ? 'sk_live_' : 'sk_test_';
        const randomStr = crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
        const rawKey = prefix + randomStr;
        
        // Hash key before storing in DB (SHA-256)
        const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
        
        const updateField = type === 'live' ? 'live_secret_key' : 'sandbox_secret_key';
        
        const { error } = await supabaseAdmin
            .from('merchants')
            .update({ [updateField]: hashedKey })
            .eq('id', merchantId);
            
        if (error) throw error;
        
        // Only return rawKey once
        res.json({ success: true, key: rawKey });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/invoices/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { env } = req.query;
        const isSandbox = env === 'sandbox';

        // --- LAZY EXPIRATION ---
        const now = new Date().toISOString();
        const { data: expiredTxs } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .eq('status', 'PENDING')
            .lt('expires_at', now);
            
        if (expiredTxs && expiredTxs.length > 0) {
            const expiredIds = expiredTxs.map(tx => tx.id);
            await supabaseAdmin.from('transactions').update({ status: 'EXPIRED' }).in('id', expiredIds);
        }
        // --- END LAZY EXPIRATION ---

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const { data: invoices, error } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: merchant } = await supabaseAdmin
            .from('merchants')
            .select('charge_fee_to_customer')
            .eq('id', merchantId)
            .single();

        if (error) throw error;
        res.json({ invoices, chargeFeeToCustomer: merchant?.charge_fee_to_customer || false });
    } catch (err) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/transactions/:merchantId', async (req: Request, res: Response): Promise<any> => {
    try {
        const { merchantId } = req.params;
        const env = req.query.env as string;
        const isSandbox = env === 'sandbox';

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const { data: transactions, error } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Transactions fetch error:', error);
            return res.status(500).json({ error: 'Failed to fetch transactions' });
        }

        return res.json({ transactions: transactions || [] });
    } catch (error: any) {
        console.error('Transactions route error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

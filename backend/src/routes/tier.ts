import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../supabase';

const router = Router();

router.get('/:merchantId', async (req: Request, res: Response): Promise<any> => {
    try {
        const merchantId = req.params.merchantId;
        const isSandbox = req.query.env === 'sandbox';

        // 1. Calculate transactions for current and previous month
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
        
        // Count for CURRENT month (for progress)
        const { count: currentTxCount, error: currentTxError } = await supabaseAdmin
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .gte('created_at', startOfCurrentMonth)
            .in('status', ['PAID', 'COMPLETED']);

        // Count for PREVIOUS month (for active tier)
        const { count: prevTxCount, error: prevTxError } = await supabaseAdmin
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', isSandbox)
            .gte('created_at', startOfPreviousMonth)
            .lte('created_at', endOfPreviousMonth)
            .in('status', ['PAID', 'COMPLETED']);

        if (currentTxError || prevTxError) {
            console.error('Tier tx count error:', currentTxError || prevTxError);
            return res.status(500).json({ error: 'Gagal menghitung transaksi bulanan', details: currentTxError || prevTxError });
        }

        const currentCount = currentTxCount || 0;
        const prevCount = prevTxCount || 0;

        // 2. Determine ACTIVE Tier & Quotas (based on previous month)
        let tier = 'KitaPay Rookie';
        let maxQuota = 1;

        if (prevCount >= 2000) {
            tier = 'KitaPay Platinum';
            maxQuota = 15;
        } else if (prevCount >= 1000) {
            tier = 'KitaPay Gold';
            maxQuota = 10;
        } else if (prevCount >= 500) {
            tier = 'KitaPay Silver';
            maxQuota = 5;
        }
        
        // Determine Progress Threshold (based on current month)
        let nextTierThreshold = 500;
        if (currentCount >= 2000) {
            nextTierThreshold = 0; // already reached max tier for next month
        } else if (currentCount >= 1000) {
            nextTierThreshold = 2000;
        } else if (currentCount >= 500) {
            nextTierThreshold = 1000;
        }

        // 3. Count used quotas for all banks this month
        // Check merchant_requests for details
        const { data: requests, error: reqError } = await supabaseAdmin
            .from('merchant_requests')
            .select('payload')
            .eq('merchant_id', merchantId)
            .eq('request_type', 'WITHDRAWAL')
            .gte('created_at', startOfCurrentMonth);

        let usedQuota = 0;
        if (!reqError && requests) {
            usedQuota = requests.filter(req => {
                const payload = req.payload as any;
                // Check if it was instant and had 0 fee
                return payload.payoutType === 'INSTANT_PAID' && payload.fee === 0 && payload.bankCode !== 'JAGO' && payload.bankCode !== 'ARTOS';
            }).length;
        }

        const remainingQuota = Math.max(0, maxQuota - usedQuota);

        return res.json({
            success: true,
            tier,
            currentMonthTransactions: currentCount,
            nextTierThreshold,
            freeQuota: {
                max: maxQuota,
                used: usedQuota,
                remaining: remainingQuota
            }
        });
    } catch (error: any) {
        console.error('Tier error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

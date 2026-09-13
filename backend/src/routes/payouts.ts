import { Router, Request, Response } from 'express';
import { PakasirProvider } from '../payments/PakasirProvider';
import { PayoutRequest } from '../payments/types';
import { supabaseAdmin } from '../supabase';

const router = Router();

router.post('/request', async (req: Request, res: Response): Promise<any> => {
    try {
        let body: Partial<PayoutRequest> & { isSandbox?: boolean } = req.body;
        const { amount, payoutType, bankCode, accountNumber, accountName } = body;
        let merchantId = body.merchantId;
        let isSandbox = req.query.env === 'sandbox';

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
                const { data: authMerchant } = await supabaseAdmin
                    .from('merchants')
                    .select('id')
                    .eq(searchColumn, providedKey)
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

        if (!merchantId || !amount || !payoutType || !bankCode || !accountNumber || !accountName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (amount < 10000) {
            return res.status(400).json({ error: 'Minimal penarikan adalah Rp 10.000' });
        }

        // Time Validation (WIB = UTC+7)
        const now = new Date();
        const wibDate = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const currentWibHour = wibDate.getUTCHours();
        const currentWibDay = wibDate.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri

        if (currentWibHour < 9 || currentWibHour >= 20) {
            return res.status(400).json({ error: 'Penarikan hanya dapat dilakukan antara pukul 09.00 hingga 20.00 WIB.' });
        }

        if (payoutType === 'SCHEDULED_FREE' && currentWibDay !== 5) {
            return res.status(400).json({ error: 'Penarikan Terjadwal hanya dapat dilakukan pada hari Jumat.' });
        }

        // KYC Check
        const { data: merchant } = await supabaseAdmin.from('merchants').select('verification_status, available_balance, sandbox_balance').eq('id', merchantId).single();
        if (!merchant) {
            return res.status(404).json({ error: 'Merchant not found' });
        }
        if (!isSandbox && merchant.verification_status !== 'VERIFIED') {
            return res.status(403).json({ error: 'Akun Anda belum terverifikasi (Unverified). Silakan lengkapi KYC untuk dapat melakukan penarikan dana.' });
        }


        if (payoutType !== 'SCHEDULED_FREE' && payoutType !== 'INSTANT_PAID') {
            return res.status(400).json({ error: 'Invalid payout type' });
        }

        // --- Calculate Free Quota & Jago Discount ---
        let fee = payoutType === 'INSTANT_PAID' ? 2000 : 0;
        let usedFreeQuota = false;
        
        if (payoutType === 'INSTANT_PAID') {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            
            // Count Tx
            const { count: txCount } = await supabaseAdmin
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('merchant_id', merchantId)
                .eq('is_sandbox', isSandbox)
                .gte('created_at', startOfMonth)
                .in('status', ['PAID', 'COMPLETED']);
                
            const c = txCount || 0;
            let maxQuota = 1; // Rookie
            if (c >= 2000) maxQuota = 15; // Platinum
            else if (c >= 1000) maxQuota = 10; // Gold
            else if (c >= 500) maxQuota = 5; // Silver

            // Count Used Quota
            const { data: requests } = await supabaseAdmin
                .from('merchant_requests')
                .select('payload')
                .eq('merchant_id', merchantId)
                .eq('request_type', 'WITHDRAWAL')
                .gte('created_at', startOfMonth);

            let usedQuota = 0;
            if (requests) {
                usedQuota = requests.filter(req => {
                    const p = req.payload as any;
                    return p.payoutType === 'INSTANT_PAID' && p.fee === 0;
                }).length;
            }

            if (usedQuota < maxQuota) {
                fee = 0; // Free!
                usedFreeQuota = true;
            } else if (bankCode === 'JAGO' || bankCode === 'ARTOS') {
                fee = 1000; // 50% discount for Jago if no quota
            }
        }

        // 1. Deduct balance immediately (Escrow)
        const totalDeduction = amount; // Fee is deducted from the nominal amount on frontend side
        const payoutReceived = amount - fee;

        if (merchant.available_balance < totalDeduction) {
            return res.status(400).json({ error: 'Saldo tidak mencukupi untuk penarikan ini.' });
        }

        const { error: deductError } = await supabaseAdmin
            .from('merchants')
            .update({ available_balance: merchant.available_balance - totalDeduction })
            .eq('id', merchantId);

        if (deductError) {
            return res.status(500).json({ error: 'Gagal memotong saldo' });
        }

        // 2. Create merchant_request for WITHDRAWAL
        const payload = {
            amount: payoutReceived, // The amount they will receive in bank
            requestedAmount: amount, // The original deduction from balance
            fee,
            totalDeduction: amount,
            payoutType,
            bankCode,
            accountNumber,
            accountName
        };

        const { data: request, error: reqError } = await supabaseAdmin
            .from('merchant_requests')
            .insert({
                merchant_id: merchantId,
                request_type: 'WITHDRAWAL',
                payload: payload,
                status: 'PENDING'
            })
            .select()
            .single();

        if (reqError) {
            // Rollback balance if failed
            await supabaseAdmin.from('merchants').update({ available_balance: merchant.available_balance }).eq('id', merchantId);
            return res.status(500).json({ error: 'Gagal membuat pengajuan penarikan' });
        }

        // Also create a PENDING entry in payouts table for history tracking
        await supabaseAdmin
            .from('payouts')
            .insert({
                id: request.id, // match ID so we can update it later
                merchant_id: merchantId,
                amount: payoutReceived, // the actual transferred amount
                bank_code: bankCode,
                account_number: accountNumber,
                account_name: accountName,
                payout_type: payoutType,
                status: 'PENDING'
            });

        return res.status(201).json({ success: true, request });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;

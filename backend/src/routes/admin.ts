import { Router } from 'express';
import { supabaseAdmin } from '../supabase';

const router = Router();

// 1. Admin Login (Basic)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Simple plain text check for demo purposes
        const { data, error } = await supabaseAdmin
            .from('admin_users')
            .select('id, email, password_hash')
            .eq('email', email)
            .single();

        if (error || !data || data.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const role = email === 'superadmin@kitapay.com' ? 'SUPER_ADMIN' : 'ADMIN';
        return res.status(200).json({ success: true, admin: { id: data.id, email: data.email, role } });
    } catch (err: any) {
        console.error('Admin login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Fetch Pending Requests
router.get('/requests', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('merchant_requests')
            .select(`
                *,
                merchants (
                    business_name,
                    email
                )
            `)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch requests' });
        }
        return res.status(200).json({ requests: data });
    } catch (err: any) {
        console.error('Fetch requests error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 2.2 Fetch Processed Requests (History)
router.get('/requests/history', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('merchant_requests')
            .select(`
                *,
                merchants (
                    business_name,
                    email
                )
            `)
            .neq('status', 'PENDING')
            .order('updated_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch request history' });
        }
        return res.status(200).json({ requests: data });
    } catch (err: any) {
        console.error('Fetch request history error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 2b. Fetch Withdrawal History for Super Admin
router.get('/withdrawals/history', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('merchant_requests')
            .select(`
                *,
                merchants (
                    business_name,
                    email
                )
            `)
            .eq('request_type', 'WITHDRAWAL')
            .order('updated_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch history' });
        }
        return res.status(200).json({ history: data });
    } catch (err: any) {
        console.error('Fetch history error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 2.5 Fetch All Merchants with KYC details
router.get('/merchants', async (req, res) => {
    try {
        const { data: merchants, error: mError } = await supabaseAdmin
            .from('merchants')
            .select('*')
            .order('created_at', { ascending: false });

        if (mError) {
            return res.status(500).json({ error: 'Failed to fetch merchants' });
        }

        const { data: requests, error: rError } = await supabaseAdmin
            .from('merchant_requests')
            .select('merchant_id, payload')
            .eq('request_type', 'KYC')
            .eq('status', 'APPROVED');

        if (rError) {
            return res.status(500).json({ error: 'Failed to fetch KYC requests' });
        }

        // Map latest KYC data to merchant
        const merchantsWithKyc = merchants.map(m => {
            // Find all KYC requests for this merchant
            const merchantKycs = requests.filter(r => r.merchant_id === m.id);
            // Assuming the last one in the array is the most recent, or we just take the first matched one
            const latestKyc = merchantKycs.length > 0 ? merchantKycs[merchantKycs.length - 1] : null;
            return {
                ...m,
                kyc_data: latestKyc ? latestKyc.payload?.data : null
            };
        });

        return res.status(200).json({ merchants: merchantsWithKyc });
    } catch (err: any) {
        console.error('Fetch merchants error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Approve Request
router.post('/requests/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { bukti_transfer } = req.body;
        
        const { data: request, error: reqError } = await supabaseAdmin
            .from('merchant_requests')
            .select('*, merchants(email, business_name)')
            .eq('id', id)
            .single();
            
        if (reqError || !request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        if (request.status !== 'PENDING') {
            return res.status(400).json({ error: 'Request is not pending' });
        }

        // Apply changes based on request type
        if (request.request_type === 'KYC') {
            await supabaseAdmin
                .from('merchants')
                .update({ verification_status: 'VERIFIED' })
                .eq('id', request.merchant_id);
                
            // Send email notification
            const { Resend } = await import('resend');
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey && resendApiKey !== 're_dummy_key_12345') {
                const resend = new Resend(resendApiKey);
                const merchantEmail = request.merchants?.email;
                if (merchantEmail) {
                    await resend.emails.send({
                        from: 'Admin Kitapay <noreply@kitapay.com>',
                        to: merchantEmail,
                        subject: 'Verifikasi KYC Kitapay - BERHASIL',
                        html: `
                            <h2>Halo ${request.merchants?.business_name || 'Merchant'},</h2>
                            <p>Selamat! Pengajuan verifikasi KYC Anda telah <strong>Disetujui</strong>.</p>
                            <p>Fitur Live Mode Anda kini telah aktif. Anda sudah dapat memproses transaksi.</p>
                            <br/><p>Terima kasih,<br/>Tim Kitapay</p>
                        `
                    }).catch(e => console.error(e));
                }
            } else {
                console.log(`[Simulated Email] To: ${request.merchants?.email} | Subject: KYC Approved`);
            }
        } else if (request.request_type === 'PROFILE_EDIT') {
            const payload = request.payload;
            const updateData: any = { business_name: payload.businessName };
            
            if (payload.businessTypeChangedToPerseroan) {
                updateData.verification_status = 'UNVERIFIED';
            }

            await supabaseAdmin
                .from('merchants')
                .update(updateData)
                .eq('id', request.merchant_id);
                
            // Send email notification
            const { Resend } = await import('resend');
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey && resendApiKey !== 're_dummy_key_12345') {
                const resend = new Resend(resendApiKey);
                const merchantEmail = request.merchants?.email;
                if (merchantEmail) {
                    await resend.emails.send({
                        from: 'Admin Kitapay <noreply@kitapay.com>',
                        to: merchantEmail,
                        subject: 'Pembaruan Profil Kitapay - BERHASIL',
                        html: `
                            <h2>Halo ${payload.businessName || 'Merchant'},</h2>
                            <p>Pengajuan pembaruan profil Anda telah <strong>Disetujui</strong>.</p>
                            <br/><p>Terima kasih,<br/>Tim Kitapay</p>
                        `
                    }).catch(e => console.error(e));
                }
            } else {
                console.log(`[Simulated Email] To: ${request.merchants?.email} | Subject: Profile Edit Approved`);
            }
        } else if (request.request_type === 'WITHDRAWAL') {
            if (!bukti_transfer) {
                return res.status(400).json({ error: 'Bukti transfer harus diunggah untuk penarikan' });
            }
            
            // Update payload with bukti_transfer
            const updatedPayload = { ...request.payload, bukti_transfer };
            
            // Mark request as APPROVED with updated payload
            await supabaseAdmin
                .from('merchant_requests')
                .update({ status: 'APPROVED', payload: updatedPayload })
                .eq('id', id);
                
            // Mark payouts as COMPLETED
            await supabaseAdmin
                .from('payouts')
                .update({ status: 'COMPLETED' })
                .eq('id', id);
                
            return res.status(200).json({ success: true });
        }

        // Mark request as APPROVED
        await supabaseAdmin
            .from('merchant_requests')
            .update({ status: 'APPROVED' })
            .eq('id', id);

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('Approve request error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Reject Request
router.post('/requests/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        const { data: request, error: reqError } = await supabaseAdmin
            .from('merchant_requests')
            .select('*, merchants(email, business_name)')
            .eq('id', id)
            .single();
            
        if (reqError || !request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Mark request as REJECTED
        const { error } = await supabaseAdmin
            .from('merchant_requests')
            .update({ status: 'REJECTED', notes: notes || '' })
            .eq('id', id);

        if (error) {
            return res.status(500).json({ error: 'Failed to reject request' });
        }

        if (request.request_type === 'KYC') {
            await supabaseAdmin
                .from('merchants')
                .update({ verification_status: 'REJECTED' })
                .eq('id', request.merchant_id);
                
            // Send email notification
            const { Resend } = await import('resend');
            const resendApiKey = process.env.RESEND_API_KEY;
            
            if (resendApiKey && resendApiKey !== 're_dummy_key_12345') {
                const resend = new Resend(resendApiKey);
                const merchantEmail = request.merchants?.email;
                const merchantName = request.merchants?.business_name || 'Merchant';
                
                if (merchantEmail) {
                    await resend.emails.send({
                        from: 'Admin Kitapay <noreply@kitapay.com>',
                        to: merchantEmail,
                        subject: 'Pemberitahuan Verifikasi KYC Kitapay - DITOLAK',
                        html: `
                            <h2>Halo ${merchantName},</h2>
                            <p>Mohon maaf, pengajuan verifikasi KYC Anda saat ini <strong>Ditolak</strong> oleh sistem kami.</p>
                            <p><strong>Alasan penolakan:</strong><br/>${notes || 'Dokumen tidak valid atau kurang jelas.'}</p>
                            <p>Silakan login kembali ke Dashboard Kitapay dan lakukan pengajuan ulang KYC Anda.</p>
                            <br/>
                            <p>Terima kasih,<br/>Tim Kitapay</p>
                        `
                    }).catch(e => console.error('Failed to send email:', e));
                }
            } else {
                console.log(`[Simulated Email] To: ${request.merchants?.email} | Subject: KYC Rejected | Reason: ${notes}`);
            }
        } else if (request.request_type === 'PROFILE_EDIT') {
            const { Resend } = await import('resend');
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey && resendApiKey !== 're_dummy_key_12345') {
                const resend = new Resend(resendApiKey);
                const merchantEmail = request.merchants?.email;
                const merchantName = request.merchants?.business_name || 'Merchant';
                if (merchantEmail) {
                    await resend.emails.send({
                        from: 'Admin Kitapay <noreply@kitapay.com>',
                        to: merchantEmail,
                        subject: 'Pembaruan Profil Kitapay - DITOLAK',
                        html: `
                            <h2>Halo ${merchantName},</h2>
                            <p>Mohon maaf, pengajuan pembaruan profil Anda saat ini <strong>Ditolak</strong> oleh sistem kami.</p>
                            <p><strong>Alasan penolakan:</strong><br/>${notes || 'Ditolak oleh admin.'}</p>
                            <br/>
                            <p>Terima kasih,<br/>Tim Kitapay</p>
                        `
                    }).catch(e => console.error('Failed to send email:', e));
                }
            } else {
                console.log(`[Simulated Email] To: ${request.merchants?.email} | Subject: Profile Edit Rejected | Reason: ${notes}`);
            }
        } else if (request.request_type === 'WITHDRAWAL') {
            // Mark payouts as FAILED
            await supabaseAdmin
                .from('payouts')
                .update({ status: 'FAILED' })
                .eq('id', id);
                
            // Refund the balance (including fee)
            const payload = request.payload;
            const refundAmount = payload.totalDeduction || payload.amount;
            
            if (refundAmount) {
                const { data: merchant } = await supabaseAdmin
                    .from('merchants')
                    .select('available_balance')
                    .eq('id', request.merchant_id)
                    .single();
                    
                if (merchant) {
                    await supabaseAdmin
                        .from('merchants')
                        .update({ available_balance: merchant.available_balance + refundAmount })
                        .eq('id', request.merchant_id);
                }
            }
        }

        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('Reject request error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;

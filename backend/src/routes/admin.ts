import { Router } from 'express';
import { supabaseAdmin } from '../supabase';
import { generateKitaPayEmail } from '../utils/emailTemplate';

const router = Router();

// 1. Admin System Status (Check if claimed)
router.get('/status', async (req, res) => {
    try {
        const { count, error } = await supabaseAdmin
            .from('admin_users')
            .select('*', { count: 'exact', head: true });
            
        if (error) throw error;
        
        return res.status(200).json({ isClaimed: count !== null && count > 0 });
    } catch (err: any) {
        console.error('Status check error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 1.1 Claim Admin Account
router.post('/claim', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Verify no admin exists yet
        const { count, error: countError } = await supabaseAdmin
            .from('admin_users')
            .select('*', { count: 'exact', head: true });
            
        if (countError) throw countError;
        if (count !== null && count > 0) {
            return res.status(403).json({ error: 'Admin account has already been claimed' });
        }
        
        // Claim it
        const { data, error: insertError } = await supabaseAdmin
            .from('admin_users')
            .insert({ email, password_hash: password })
            .select('id, email')
            .single();
            
        if (insertError) throw insertError;
        
        return res.status(200).json({ success: true, admin: { id: data.id, email: data.email, role: 'SUPER_ADMIN' } });
    } catch (err: any) {
        console.error('Admin claim error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 1.2 Admin Login (Basic)
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
        
        // First user to claim or designated superadmin email is SUPER_ADMIN
        const role = 'SUPER_ADMIN'; 
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

// 2.6 Impersonate Merchant
router.post('/merchants/:id/impersonate', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Get the merchant's email
        const { data: merchant, error: mError } = await supabaseAdmin
            .from('merchants')
            .select('email')
            .eq('id', id)
            .single();

        if (mError || !merchant) {
            return res.status(404).json({ error: 'Merchant not found' });
        }

        // 2. Generate magic link using Supabase Admin
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: merchant.email,
        });

        if (error) {
            console.error('Generate link error:', error);
            return res.status(500).json({ error: 'Failed to generate impersonation link' });
        }

        // 3. Return the action_link to the frontend
        return res.status(200).json({ link: data.properties.action_link });
    } catch (err: any) {
        console.error('Impersonate error:', err);
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
                        from: 'Admin Kitapay <noreply@rinzgroup.web.id>',
                        to: merchantEmail,
                        subject: 'Verifikasi KYC Kitapay - BERHASIL',
                        html: generateKitaPayEmail(
                            `Halo ${request.merchants?.business_name?.toUpperCase() || 'MERCHANT'},`,
                            `<p>Selamat! Pengajuan verifikasi KYC Anda telah <strong>Disetujui</strong>.</p>
                             <p>Fitur Live Mode Anda kini telah aktif. Anda sudah dapat memproses transaksi melalui sistem kami dengan aman.</p>
                             <p>Silakan kembali ke dashboard untuk memulai.</p>`
                        )
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
                        from: 'Admin Kitapay <noreply@rinzgroup.web.id>',
                        to: merchantEmail,
                        subject: 'Pembaruan Profil Kitapay - BERHASIL',
                        html: generateKitaPayEmail(
                            `Halo ${(payload.businessName || 'MERCHANT').toUpperCase()},`,
                            `<p>Pengajuan pembaruan profil bisnis Anda telah berhasil <strong>Disetujui</strong>.</p>
                             <p>Informasi profil Anda kini sudah diperbarui di dalam sistem kami.</p>`
                        )
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
                
                // Send email notification
                const { Resend } = await import('resend');
                const resendApiKey = process.env.RESEND_API_KEY;
                if (resendApiKey && resendApiKey !== 're_dummy_key_12345') {
                    const resend = new Resend(resendApiKey);
                    const merchantEmail = request.merchants?.email;
                    if (merchantEmail) {
                        const amount = updatedPayload.amount || 0;
                        const bank = updatedPayload.bankCode || 'Bank';
                        const acc = updatedPayload.accountNumber || '';
                        
                        await resend.emails.send({
                            from: 'Admin Kitapay <noreply@rinzgroup.web.id>',
                            to: merchantEmail,
                            subject: 'Penarikan Dana Berhasil - Kitapay',
                            html: generateKitaPayEmail(
                                `Halo ${request.merchants?.business_name?.toUpperCase() || 'MERCHANT'},`,
                                `<p>Rp${amount.toLocaleString('id-ID')} telah berhasil ditarik ke rekening Anda (<strong>${bank} - ${acc}</strong>).</p>
                                 <p>Kamu dapat melihat detail penarikan lengkap dan bukti transfer kapan saja di rincian riwayat pada dashboard KitaPay.</p>`
                            )
                        }).catch(e => console.error(e));
                    }
                }

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
                        from: 'Admin Kitapay <noreply@rinzgroup.web.id>',
                        to: merchantEmail,
                        subject: 'Pemberitahuan Verifikasi KYC Kitapay - DITOLAK',
                        html: generateKitaPayEmail(
                            `Halo ${merchantName.toUpperCase()},`,
                            `<p>Mohon maaf, pengajuan verifikasi KYC Anda saat ini <strong>Ditolak</strong> oleh sistem kami.</p>
                             <div style="background-color: #fff3f3; border-left: 4px solid #ff4d4f; padding: 15px; margin: 20px 0;">
                                <strong>Alasan penolakan:</strong><br/>
                                ${notes || 'Dokumen tidak valid atau kurang jelas.'}
                             </div>
                             <p>Silakan login kembali ke Dashboard Kitapay dan lakukan pengajuan ulang KYC Anda sesuai dengan ketentuan yang berlaku.</p>`
                        )
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
                        from: 'Admin Kitapay <noreply@rinzgroup.web.id>',
                        to: merchantEmail,
                        subject: 'Pembaruan Profil Kitapay - DITOLAK',
                        html: generateKitaPayEmail(
                            `Halo ${merchantName.toUpperCase()},`,
                            `<p>Mohon maaf, pengajuan pembaruan profil bisnis Anda saat ini <strong>Ditolak</strong> oleh sistem kami.</p>
                             <div style="background-color: #fff3f3; border-left: 4px solid #ff4d4f; padding: 15px; margin: 20px 0;">
                                <strong>Alasan penolakan:</strong><br/>
                                ${notes || 'Ditolak oleh admin.'}
                             </div>
                             <p>Silakan login kembali ke Dashboard Kitapay dan lakukan pengajuan ulang pembaruan profil Anda.</p>`
                        )
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

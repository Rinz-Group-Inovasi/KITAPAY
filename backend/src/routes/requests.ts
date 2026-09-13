import { Router } from 'express';
import { supabaseAdmin } from '../supabase';
import { KycEngine } from '../services/KycEngine';

const router = Router();

// Submit a new request (KYC or PROFILE_EDIT)
router.post('/submit', async (req, res) => {
    try {
        const { merchantId, requestType, payload } = req.body;

        if (!merchantId || !requestType || !payload) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate requestType
        if (!['KYC', 'PROFILE_EDIT', 'BANK_ACCOUNT_ADD'].includes(requestType)) {
            return res.status(400).json({ error: 'Invalid requestType' });
        }

        // Auto-create merchant if missing (for demo purposes)
        const { data: existingMerchant } = await supabaseAdmin
            .from('merchants')
            .select('id')
            .eq('id', merchantId)
            .single();

        if (!existingMerchant) {
            await supabaseAdmin.from('merchants').insert({
                id: merchantId,
                email: req.body.email || 'merchant@kitapay.com',
                business_name: req.body.businessName || 'Merchant Baru',
                verification_status: 'UNVERIFIED',
                available_balance: 0
            });
        }

        let status = 'PENDING';
        let notes = '';

        if (requestType === 'KYC') {
            const ktpDoc = payload.documents?.find((d: any) => d.type === 'ktp');
            if (ktpDoc && payload.data?.nik && payload.data?.fullName) {
                const result = await KycEngine.verifyKTP(ktpDoc.url, payload.data.nik, payload.data.fullName);
                if (result.success) {
                    status = 'APPROVED';
                    notes = 'Auto-verified by OCR Engine';
                    
                    // Update merchant immediately
                    await supabaseAdmin
                        .from('merchants')
                        .update({ verification_status: 'VERIFIED' })
                        .eq('id', merchantId);
                } else {
                    notes = `OCR Mismatch: ${result.reason}`;
                    
                    // Update merchant to PENDING_REVIEW
                    await supabaseAdmin
                        .from('merchants')
                        .update({ verification_status: 'PENDING_REVIEW' })
                        .eq('id', merchantId);
                }
            }
        }

        // Insert into merchant_requests
        const { data, error } = await supabaseAdmin
            .from('merchant_requests')
            .insert({
                merchant_id: merchantId,
                request_type: requestType,
                payload: payload,
                status: status,
                notes: notes
            })
            .select()
            .single();

        if (error) {
            console.error('Error inserting request:', error);
            return res.status(500).json({ error: 'Failed to submit request' });
        }

        res.status(200).json({ success: true, request: data, autoVerified: status === 'APPROVED' });

    } catch (err: any) {
        console.error('Submit request error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get latest request and merchant status
router.get('/latest/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { requestType } = req.query;

        // Fetch merchant status
        const { data: merchant } = await supabaseAdmin
            .from('merchants')
            .select('verification_status')
            .eq('id', merchantId)
            .single();

        let query = supabaseAdmin
            .from('merchant_requests')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (requestType) {
            query = query.eq('request_type', requestType);
        }

        const { data, error } = await query.single();

        res.status(200).json({ 
            data: error ? null : data,
            merchantStatus: merchant ? merchant.verification_status : 'UNVERIFIED'
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all requests for a merchant
router.get('/all/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { requestType } = req.query;

        let query = supabaseAdmin
            .from('merchant_requests')
            .select('*')
            .eq('merchant_id', merchantId)
            .order('created_at', { ascending: false });

        if (requestType) {
            query = query.eq('request_type', requestType);
        }

        const { data, error } = await query;

        res.status(200).json({ 
            requests: error ? [] : data
        });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Simulate approval (for testing)
router.post('/simulate-approve', async (req, res) => {
    try {
        const { merchantId, requestType } = req.body;
        if (!merchantId || !requestType) return res.status(400).json({ error: 'Missing fields' });

        const { data: request } = await supabaseAdmin
            .from('merchant_requests')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('request_type', requestType)
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
        if (!request) return res.status(404).json({ error: 'No pending request found' });

        await supabaseAdmin
            .from('merchant_requests')
            .update({ status: 'APPROVED', updated_at: new Date().toISOString() })
            .eq('id', request.id);

        if (requestType === 'PROFILE_EDIT') {
            const payload = request.payload;
            const updateData: any = { business_name: payload.businessName };
            
            if (payload.businessTypeChangedToPerseroan) {
                updateData.verification_status = 'UNVERIFIED';
            }

            await supabaseAdmin
                .from('merchants')
                .update(updateData)
                .eq('id', merchantId);
        }

        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

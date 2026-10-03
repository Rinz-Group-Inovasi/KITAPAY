import { Router } from 'express';
import { supabaseAdmin } from '../supabase';

const router = Router();

// Get active or all support tickets for a merchant
router.get('/merchant/:merchantId', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { data, error } = await supabaseAdmin
            .from('requests')
            .select('*')
            .eq('merchant_id', merchantId)
            .eq('request_type', 'SUPPORT')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json({ tickets: data || [] });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new support ticket
router.post('/merchant/:merchantId/create', async (req, res) => {
    try {
        const { merchantId } = req.params;
        const { subject, message } = req.body;
        
        const payload = {
            subject,
            messages: [{
                sender: 'MERCHANT',
                text: message,
                timestamp: new Date().toISOString()
            }]
        };

        const { data, error } = await supabaseAdmin
            .from('requests')
            .insert({
                merchant_id: merchantId,
                request_type: 'SUPPORT',
                status: 'OPEN',
                payload
            })
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ ticket: data });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Reply to a ticket
router.post('/:ticketId/reply', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { sender, message } = req.body; // sender can be 'MERCHANT' or 'ADMIN'

        const { data: ticket, error: fetchError } = await supabaseAdmin
            .from('requests')
            .select('*')
            .eq('id', ticketId)
            .single();

        if (fetchError || !ticket) throw new Error('Ticket not found');

        const newMessages = [...(ticket.payload?.messages || []), {
            sender,
            text: message,
            timestamp: new Date().toISOString()
        }];

        const { data: updatedTicket, error: updateError } = await supabaseAdmin
            .from('requests')
            .update({ payload: { ...ticket.payload, messages: newMessages }, status: sender === 'ADMIN' ? 'ANSWERED' : 'OPEN' })
            .eq('id', ticketId)
            .select()
            .single();

        if (updateError) throw updateError;
        res.status(200).json({ ticket: updatedTicket });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get all support tickets for Admin
router.get('/admin/all', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('requests')
            .select(`
                *,
                merchants (business_name, email)
            `)
            .eq('request_type', 'SUPPORT')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json({ tickets: data || [] });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Admin close ticket
router.post('/admin/:ticketId/close', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { error } = await supabaseAdmin
            .from('requests')
            .update({ status: 'CLOSED' })
            .eq('id', ticketId);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    const { data: existing } = await supabaseAdmin.from('merchants').select('id').limit(1).single();
    if (existing) {
        console.log('Merchant ID:', existing.id);
        return;
    }

    const { data, error } = await supabaseAdmin.from('merchants').insert({
        email: 'demo@kitapay.com',
        business_name: 'Demo Store',
        whatsapp_number: '081234567890',
        verification_status: 'VERIFIED',
        available_balance: 1000000
    }).select('id').single();

    if (error) {
        console.error('Error seeding:', error);
    } else {
        console.log('Merchant ID:', data.id);
    }
}

seed();

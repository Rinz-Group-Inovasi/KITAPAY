require('dotenv').config();
const crypto = require('crypto');

async function simulatePayin() {
    console.log("Mencari transaksi PENDING terakhir...");
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/transactions?status=eq.PENDING&order=created_at.desc&limit=1`;
    const response = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
    });
    
    const data = await response.json();

    if (!data || data.length === 0) {
        console.error("Tidak ada transaksi PENDING yang ditemukan!");
        return;
    }

    const tx = data[0];

    console.log(`Ditemukan transaksi: ${tx.id} (External ID: ${tx.external_id})`);
    console.log(`Nominal: Rp ${tx.amount}`);

    const payload = {
        order_id: tx.external_id,
        status: 'completed',
        amount: tx.amount,
        project: 'kitabayar',
        payment_method: 'qris'
    };

    const apiKey = process.env.PAKASIR_API_KEY || '3kBuXbdiQEvEz5H2GAQPakgWXDAlaF1x';
    const signature = crypto.createHmac('sha256', apiKey).update(JSON.stringify(payload)).digest('hex');

    console.log("Mengirim webhook simulasi ke http://localhost:4000/api/webhooks/pakasir ...");
    
    const res = await fetch('http://localhost:4000/api/webhooks/pakasir', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-pakasir-signature': signature
        },
        body: JSON.stringify(payload)
    });

    const result = await res.json();
    console.log("Respons Webhook:", result);
    
    console.log("Simulasi selesai! Silakan cek saldo di dashboard Anda.");
}

simulatePayin().catch(console.error);

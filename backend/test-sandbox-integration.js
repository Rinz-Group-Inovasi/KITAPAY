require('dotenv').config();
const express = require('express');
const axios = require('axios');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PORT = 5000;
const app = express();
app.use(express.json());

async function runTest() {
  console.log('🔍 Mengambil data Merchant dari Database...');
  
  let merchants = [];
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/merchants?sandbox_secret_key=not.is.null&select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    merchants = res.data;
  } catch (error) {
    console.error('❌ Gagal mengambil data merchant', error.response ? error.response.data : error.message);
    process.exit(1);
  }

  if (!merchants || merchants.length === 0) {
    console.error('❌ Data merchant kosong atau belum ada Sandbox Secret Key.');
    process.exit(1);
  }

  const merchant = merchants[0];
  const sandboxSecretKey = merchant.sandbox_secret_key;

  console.log(`✅ Merchant ditemukan: ${merchant.business_name} (ID: ${merchant.id})`);
  console.log('🔄 Memperbarui Sandbox Webhook URL Merchant ke server lokal (Port 5000)...');

  try {
    await axios.patch(`${SUPABASE_URL}/rest/v1/merchants?id=eq.${merchant.id}`, 
      { sandbox_webhook_url: `http://localhost:${PORT}/webhook` },
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (updateError) {
    console.error('❌ Gagal update sandbox webhook URL', updateError.response ? updateError.response.data : updateError.message);
    process.exit(1);
  }

  console.log('✅ Sandbox Webhook URL berhasil diperbarui ke: http://localhost:5000/webhook');

  // Menjalankan server lokal Merchant (Port 5000)
  app.post('/webhook', (req, res) => {
    console.log('\n\n===========================================');
    console.log('🎉 [MERCHANT SERVER] WEBHOOK (SANDBOX) DITERIMA!');
    console.log('===========================================');
    console.log('Payload Webhook:');
    console.dir(req.body, { depth: null, colors: true });
    console.log('===========================================\n\n');
    res.status(200).send('OK');
    
    console.log('✅ TEST INTEGRASI SANDBOX SELESAI DAN BERHASIL!');
    process.exit(0);
  });

  app.listen(PORT, async () => {
    console.log(`\n🚀 [MERCHANT SERVER] Server berjalan dan siap menerima Webhook di Port ${PORT}`);
    
    // Melakukan request ke API KitaPay
    console.log('\n💳 Membuat Transaksi Sandbox ke API KitaPay...');
    let transactionId = null;

    try {
      const response = await axios.post('http://localhost:4000/api/payments/create?env=sandbox', {
        amount: 1500, // Rp 1.500
        customerEmail: 'test.sandbox@kitapay.id',
        customerWhatsapp: '081234567890',
        paymentMethod: 'QRIS'
      }, {
        headers: {
          'x-api-key': sandboxSecretKey
        }
      });

      const data = response.data;
      transactionId = data.transactionId;
      console.log('✅ [API KITAPAY] Transaksi Sandbox berhasil dibuat!');
      console.log(`   - Order ID  : ${data.externalId}`);
      console.log(`   - Net Amount: Rp ${data.netAmount}`);
      console.log('------------------------------------------------------------');
      
    } catch (err) {
      console.error('❌ Gagal membuat transaksi via API:');
      console.error(err.response ? err.response.data : err.message);
      process.exit(1);
    }

    if (transactionId) {
      console.log('\n🤖 Melakukan Simulasi Pembayaran (Auto Pay)...');
      try {
        await axios.post(`http://localhost:4000/api/payments/${transactionId}/simulate?env=sandbox`);
        console.log('✅ Simulasi berhasil! Menunggu webhook...');
      } catch (err) {
        console.error('❌ Gagal simulasi pembayaran:');
        console.error(err.response ? err.response.data : err.message);
      }
    }
  });
}

runTest();

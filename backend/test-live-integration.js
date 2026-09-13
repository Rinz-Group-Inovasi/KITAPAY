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
  
  // Ambil merchant pertama
  let merchants = [];
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/merchants?live_secret_key=not.is.null&select=*&limit=1`, {
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
    console.error('❌ Data merchant kosong');
    process.exit(1);
  }

  const merchant = merchants[0];
  const liveSecretKey = merchant.live_secret_key;
  
  if (!liveSecretKey) {
    console.error('❌ Merchant ini belum generate Live Secret Key. Silakan generate dulu di Dashboard API Keys!');
    process.exit(1);
  }

  console.log(`✅ Merchant ditemukan: ${merchant.business_name} (ID: ${merchant.id})`);
  console.log('🔄 Memperbarui Webhook URL Merchant ke server lokal (Port 5000)...');

  try {
    await axios.patch(`${SUPABASE_URL}/rest/v1/merchants?id=eq.${merchant.id}`, 
      { webhook_url: `http://localhost:${PORT}/webhook` },
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (updateError) {
    console.error('❌ Gagal update webhook URL', updateError.response ? updateError.response.data : updateError.message);
    process.exit(1);
  }

  console.log('✅ Webhook URL berhasil diperbarui ke: http://localhost:5000/webhook');

  // Menjalankan server lokal Merchant (Port 5000)
  app.post('/webhook', (req, res) => {
    console.log('\n\n===========================================');
    console.log('🎉 [MERCHANT SERVER] WEBHOOK DITERIMA!');
    console.log('===========================================');
    console.log('Payload Webhook:');
    console.dir(req.body, { depth: null, colors: true });
    console.log('===========================================\n\n');
    res.status(200).send('OK');
    
    console.log('✅ TEST INTEGRASI SELESAI DAN BERHASIL!');
    process.exit(0);
  });

  app.listen(PORT, async () => {
    console.log(`\n🚀 [MERCHANT SERVER] Server berjalan dan siap menerima Webhook di Port ${PORT}`);
    
    // Melakukan request ke API KitaPay
    console.log('\n💳 Membuat Transaksi Live ke API KitaPay...');
    try {
      const response = await axios.post('http://localhost:4000/api/payments/create', {
        amount: 1500, // Rp 1.500
        customerEmail: 'test.live@kitapay.id',
        customerWhatsapp: '081234567890',
        paymentMethod: 'QRIS'
      }, {
        headers: {
          'x-api-key': liveSecretKey
        }
      });

      const data = response.data;
      console.log('✅ [API KITAPAY] Transaksi berhasil dibuat!');
      console.log(`   - Order ID  : ${data.externalId}`);
      console.log(`   - Net Amount: Rp ${data.netAmount}`);
      console.log('\n👇 SILAKAN BUKA URL INI DI BROWSER DAN BAYAR QRIS-NYA 👇');
      console.log(`   http://localhost:3000/checkout/${data.transactionId}?env=live`);
      console.log('------------------------------------------------------------');
      console.log('⏳ Menunggu pembayaran dari Anda... (Server siap menerima webhook)\n');
      
    } catch (err) {
      console.error('❌ Gagal membuat transaksi via API:');
      console.error(err.response ? err.response.data : err.message);
      process.exit(1);
    }
  });
}

runTest();

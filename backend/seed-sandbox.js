require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LIVE_MERCHANT_ID = '34df3bc6-371a-4505-ac7e-85376a1f2dca';
const SANDBOX_MERCHANT_ID = '88888888-8888-8888-8888-888888888888';

async function seed() {
  console.log('Seeding sandbox merchant...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/merchants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      id: SANDBOX_MERCHANT_ID,
      business_name: 'Sandbox Merchant',
      email: 'sandbox@kitapay.id',
      available_balance: 0
    })
  });

  if (!res.ok) {
    console.error('Error seeding sandbox merchant:', await res.text());
  } else {
    console.log('Sandbox merchant seeded successfully.');
  }
}

seed();

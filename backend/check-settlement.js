const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: merchants, error: err1 } = await supabaseAdmin.from('merchants').select('*');
  if (err1) {
    console.error('Error fetching merchants', err1);
    return;
  }
  
  const merchantId = merchants[0].id;
  console.log('Merchant ID:', merchantId);

  const { data: txs, error: err2 } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('is_sandbox', true)
    .order('created_at', { ascending: false });
    
  if (err2) {
    console.error('Error fetching txs', err2);
    return;
  }
  
  console.log('Sandbox Txs:');
  txs.forEach(tx => {
    console.log(`- ID: ${tx.id}, Status: ${tx.status}, Settled: ${tx.settled}, Created: ${tx.created_at}`);
  });
  
  const settleThreshold = new Date();
  settleThreshold.setMinutes(settleThreshold.getMinutes() - 1);
  console.log('Threshold:', settleThreshold.toISOString());
  
  const { data: unsettledTxs } = await supabaseAdmin
            .from('transactions')
            .select('id, net_amount, created_at')
            .eq('merchant_id', merchantId)
            .eq('is_sandbox', true)
            .eq('status', 'PAID')
            .eq('settled', false)
            .lte('created_at', settleThreshold.toISOString());
            
  console.log('Unsettled Txs matching criteria:', unsettledTxs);
  console.log('Merchant balance:', merchants[0].sandbox_balance, merchants[0].sandbox_pending_balance);
}

run();

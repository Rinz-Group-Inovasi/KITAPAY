require('dotenv').config();

async function checkTxs() {
    console.log("Checking transactions...");
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/transactions?order=created_at.desc&limit=10`;
    const response = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
    });
    const data = await response.json();
    
    data.forEach(t => console.log(`[${t.created_at}] ID: ${t.id}, is_sandbox: ${t.is_sandbox}, status: ${t.status}, amount: ${t.amount}, merchant: ${t.merchant_id}`));
}
checkTxs();

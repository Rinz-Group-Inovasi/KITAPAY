import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { getPaymentProvider } from '../src/payments';
import { supabaseAdmin } from '../src/supabase';

async function main() {
    console.log('Testing active payment provider...');
    const provider = getPaymentProvider();
    console.log('Provider instance:', provider.constructor.name);

    // Fetch a real merchant ID from database
    const { data: merchants, error } = await supabaseAdmin
        .from('merchants')
        .select('id, business_name')
        .limit(1);

    if (error || !merchants || merchants.length === 0) {
        console.error('Failed to fetch merchant:', error);
        return;
    }

    const testMerchant = merchants[0];
    console.log('Using test merchant:', testMerchant.business_name, `(${testMerchant.id})`);

    const res = await provider.createPayment({
        merchantId: testMerchant.id,
        amount: 10000,
        customerEmail: 'test@rinzgroup.com',
        customerWhatsapp: '08123456789',
        paymentMethod: 'qris',
        chargeFeeToCustomer: false
    });

    console.log('\n--- PAYMENT RESULT ---');
    console.log('Success:', res.success);
    console.log('Transaction ID:', res.transactionId);
    console.log('External ID:', res.externalId);
    console.log('Amount:', res.amount);
    console.log('QRIS String (first 50 chars):', res.qrisString?.substring(0, 50) + '...');
    console.log('Full QRIS String:', res.qrisString);
    console.log('----------------------');
}

main().catch(console.error);

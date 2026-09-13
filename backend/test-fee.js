const merchantId = '253f3e50-7af3-4c64-a60d-6ea55d2c6160';

async function testFee() {
    console.log("=== Testing Sandbox Fee Toggle ===");

    // 1. Turn ON fee to customer
    console.log("\n1. Mengaktifkan fitur Bebankan Biaya ke Pelanggan (Global)...");
    await fetch(`http://localhost:4000/api/merchant/settings/${merchantId}?env=sandbox`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeFeeToCustomer: true })
    });
    console.log("-> Berhasil diaktifkan.");

    // 2. Create Payment 100k (Kategori Standar)
    console.log("\n2. Membuat invoice Rp 100.000 (Kategori Standar, Net 100k)");
    let res = await fetch(`http://localhost:4000/api/payments/create?env=sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            merchantId,
            amount: 100000,
            customerEmail: 'test@kitapay.id',
            customerWhatsapp: '081234567890',
            paymentMethod: 'QRIS'
        })
    });
    let data = await res.json();
    console.log(`-> Respons dari API:`, JSON.stringify(data, null, 2));

    // 3. Create Payment 25k (Kategori Mikro)
    console.log("\n3. Membuat invoice Rp 25.000 (Kategori Mikro, Net 50k)");
    res = await fetch(`http://localhost:4000/api/payments/create?env=sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            merchantId,
            amount: 25000,
            customerEmail: 'test@kitapay.id',
            customerWhatsapp: '081234567890',
            paymentMethod: 'QRIS'
        })
    });
    data = await res.json();
    console.log(`-> Respons dari API:`, JSON.stringify(data, null, 2));

    // 4. Turn OFF fee to customer
    console.log("\n4. Menonaktifkan fitur Bebankan Biaya ke Pelanggan (Ditanggung Merchant)...");
    await fetch(`http://localhost:4000/api/merchant/settings/${merchantId}?env=sandbox`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeFeeToCustomer: false })
    });
    console.log("-> Berhasil dinonaktifkan.");

    // 5. Create Payment 100k
    console.log("\n5. Membuat invoice Rp 100.000 (Ditanggung merchant)");
    res = await fetch(`http://localhost:4000/api/payments/create?env=sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            merchantId,
            amount: 100000,
            customerEmail: 'test@kitapay.id',
            customerWhatsapp: '081234567890',
            paymentMethod: 'QRIS'
        })
    });
    data = await res.json();
    console.log(`-> Respons dari API:`, JSON.stringify(data, null, 2));
}

testFee().catch(console.error);

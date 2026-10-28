const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const clientId = process.env.DOKU_CLIENT_ID;
const clientSecret = process.env.DOKU_SECRET_KEY;
const privateKeyPath = path.join(__dirname, '..', process.env.DOKU_PRIVATE_KEY_PATH || 'certs/doku_private_key.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

const baseUrl = process.env.DOKU_ENV === 'sandbox' ? 'https://api-sandbox.doku.com' : 'https://api.doku.com';

function getUtcTimestamp() {
    return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function getLocalTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const HH = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    
    // Timezone offset for Indonesia/WIB (+07:00)
    const offsetMin = -d.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const offsetH = pad(Math.floor(Math.abs(offsetMin) / 60));
    const offsetM = pad(Math.abs(offsetMin) % 60);
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}${sign}${offsetH}:${offsetM}`;
}

async function getB2BToken() {
    const timestamp = getUtcTimestamp();
    const stringToSign = `${clientId}|${timestamp}`;
    const sign = crypto.createSign('SHA256');
    sign.update(stringToSign);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');

    const response = await fetch(`${baseUrl}/authorization/v1/access-token/b2b`, {
        method: 'POST',
        headers: {
            'X-CLIENT-KEY': clientId,
            'X-TIMESTAMP': timestamp,
            'X-SIGNATURE': signature,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grantType: 'client_credentials' })
    });

    const data = await response.json();
    if (!response.ok || !data.accessToken) {
        throw new Error(`Failed to get B2B token: ${JSON.stringify(data)}`);
    }
    return data.accessToken;
}

function generateSymmetricSignature(httpMethod, endpointUrl, accessToken, requestBody, timestamp) {
    const minifiedBody = JSON.stringify(requestBody);
    const bodyHash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase();
    const stringToSign = `${httpMethod}:${endpointUrl}:${accessToken}:${bodyHash}:${timestamp}`;
    
    console.log('--- Symmetric stringToSign ---');
    console.log(stringToSign);
    console.log('------------------------------');

    const hmac = crypto.createHmac('sha512', clientSecret);
    hmac.update(stringToSign);
    return hmac.digest('base64');
}

async function testGenerateQris() {
    try {
        console.log('1. Getting B2B Token...');
        const accessToken = await getB2BToken();
        console.log('Token acquired successfully!');

        console.log('2. Preparing QRIS Request...');
        const endpointUrl = '/snap-adapter/b2b/v1.0/qr/qr-mpm-generate';
        const timestamp = getLocalTimestamp();
        const externalId = `KP${Date.now()}`;
        const partnerRefNo = `KP-TEST-${Date.now()}`;

        const requestBody = {
            partnerReferenceNo: partnerRefNo,
            amount: {
                value: '1000.00',
                currency: 'IDR'
            },
            merchantId: clientId,
            terminalId: 'A01',
            additionalInfo: {
                postalCode: '12345',
                feeType: 1
            }
        };

        const signature = generateSymmetricSignature('POST', endpointUrl, accessToken, requestBody, timestamp);

        console.log('3. Hitting QRIS MPM Generate API...');
        const response = await fetch(`${baseUrl}${endpointUrl}`, {
            method: 'POST',
            headers: {
                'X-PARTNER-ID': clientId,
                'X-EXTERNAL-ID': externalId,
                'X-TIMESTAMP': timestamp,
                'X-SIGNATURE': signature,
                'Authorization': `Bearer ${accessToken}`,
                'CHANNEL-ID': 'H2H',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('HTTP Status:', response.status);
        const resText = await response.text();
        console.log('Response body:', resText);
    } catch (e) {
        console.error('Error generating QRIS:', e);
    }
}

testGenerateQris();

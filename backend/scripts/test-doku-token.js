const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const clientId = process.env.DOKU_CLIENT_ID;
const privateKeyPath = path.join(__dirname, '..', process.env.DOKU_PRIVATE_KEY_PATH || 'certs/doku_private_key.pem');

if (!fs.existsSync(privateKeyPath)) {
    console.error('Private key file not found at:', privateKeyPath);
    process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Generate UTC timestamp: YYYY-MM-DDTHH:mm:ssZ
const now = new Date();
const timestamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

// String to sign for B2B token: client_ID + "|" + X-TIMESTAMP
const stringToSign = `${clientId}|${timestamp}`;

// Sign with SHA256withRSA
const sign = crypto.createSign('SHA256');
sign.update(stringToSign);
sign.end();
const signature = sign.sign(privateKey, 'base64');

console.log('Testing DOKU B2B Token Generation...');
console.log('Client ID:', clientId);
console.log('Timestamp:', timestamp);
console.log('String To Sign:', stringToSign);
console.log('Signature:', signature);

const baseUrl = process.env.DOKU_ENV === 'sandbox' ? 'https://api-sandbox.doku.com' : 'https://api.doku.com';
const url = `${baseUrl}/authorization/v1/access-token/b2b`;

console.log('Hitting endpoint:', url);

async function testToken() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CLIENT-KEY': clientId,
                'X-TIMESTAMP': timestamp,
                'X-SIGNATURE': signature,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grantType: 'client_credentials'
            })
        });

        const status = response.status;
        const text = await response.text();
        console.log(`HTTP Status: ${status}`);
        console.log('Response body:', text);
    } catch (err) {
        console.error('Error fetching token:', err);
    }
}

testToken();

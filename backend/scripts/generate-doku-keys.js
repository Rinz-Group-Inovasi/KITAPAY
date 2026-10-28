const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('Generating RSA 2048-bit key pair for DOKU...');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

const certsDir = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
}

const privateKeyPath = path.join(certsDir, 'doku_private_key.pem');
const publicKeyPath = path.join(certsDir, 'doku_public_key.pem');

fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log(' Successfully generated DOKU RSA keys!');
console.log('Private Key saved to:', privateKeyPath);
console.log('Public Key saved to:', publicKeyPath);
console.log('\n--- PUBLIC KEY TO COPY TO DOKU DASHBOARD ---');
console.log(publicKey);
console.log('--------------------------------------------');

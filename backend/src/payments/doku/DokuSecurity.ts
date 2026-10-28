import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class DokuSecurity {
    private static privateKeyCache: string | null = null;
    private static dokuPublicKeyCache: string | null = null;

    static getPrivateKey(): string {
        if (this.privateKeyCache) return this.privateKeyCache;

        const relPath = process.env.DOKU_PRIVATE_KEY_PATH || 'certs/doku_private_key.pem';
        const fullPath = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`DOKU private key not found at: ${fullPath}`);
        }

        this.privateKeyCache = fs.readFileSync(fullPath, 'utf8');
        return this.privateKeyCache;
    }

    static getDokuPublicKey(): string | null {
        if (this.dokuPublicKeyCache) return this.dokuPublicKeyCache;

        const relPath = process.env.DOKU_PUBLIC_KEY_PATH || 'certs/doku_server_public_key.pem';
        const fullPath = path.isAbsolute(relPath) ? relPath : path.join(process.cwd(), relPath);

        if (fs.existsSync(fullPath)) {
            this.dokuPublicKeyCache = fs.readFileSync(fullPath, 'utf8');
            return this.dokuPublicKeyCache;
        }

        return null;
    }

    static getUtcTimestamp(): string {
        return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    }

    static getLocalTimestamp(): string {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const YYYY = d.getFullYear();
        const MM = pad(d.getMonth() + 1);
        const DD = pad(d.getDate());
        const HH = pad(d.getHours());
        const mm = pad(d.getMinutes());
        const ss = pad(d.getSeconds());

        const offsetMin = -d.getTimezoneOffset();
        const sign = offsetMin >= 0 ? '+' : '-';
        const offsetH = pad(Math.floor(Math.abs(offsetMin) / 60));
        const offsetM = pad(Math.abs(offsetMin) % 60);
        return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}${sign}${offsetH}:${offsetM}`;
    }

    static formatExpiryTimestamp(minutesFromNow: number = 60): string {
        const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const YYYY = d.getFullYear();
        const MM = pad(d.getMonth() + 1);
        const DD = pad(d.getDate());
        const HH = pad(d.getHours());
        const mm = pad(d.getMinutes());
        const ss = pad(d.getSeconds());

        const offsetMin = -d.getTimezoneOffset();
        const sign = offsetMin >= 0 ? '+' : '-';
        const offsetH = pad(Math.floor(Math.abs(offsetMin) / 60));
        const offsetM = pad(Math.abs(offsetMin) % 60);
        return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}${sign}${offsetH}:${offsetM}`;
    }

    /**
     * Generate Asymmetric Signature for SNAP B2B Token
     * Formula: SHA256withRSA(PrivateKey, ClientId + "|" + Timestamp)
     */
    static generateAsymmetricSignature(clientId: string, timestamp: string): string {
        const privateKey = this.getPrivateKey();
        const stringToSign = `${clientId}|${timestamp}`;

        const sign = crypto.createSign('SHA256');
        sign.update(stringToSign);
        sign.end();
        return sign.sign(privateKey, 'base64');
    }

    /**
     * Generate Symmetric Signature for SNAP Transactions
     * Formula: HMAC_SHA512(ClientSecret, HTTPMethod + ":" + EndpointUrl + ":" + AccessToken + ":" + Lowercase(HexEncode(SHA256(minify(RequestBody)))) + ":" + Timestamp)
     */
    static generateSymmetricSignature(
        httpMethod: string,
        endpointUrl: string,
        accessToken: string,
        requestBody: any,
        timestamp: string,
        clientSecret: string
    ): string {
        const minifiedBody = JSON.stringify(requestBody);
        const bodyHash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase();
        const stringToSign = `${httpMethod.toUpperCase()}:${endpointUrl}:${accessToken}:${bodyHash}:${timestamp}`;

        const hmac = crypto.createHmac('sha512', clientSecret);
        hmac.update(stringToSign);
        return hmac.digest('base64');
    }

    /**
     * Verify SNAP Webhook Notification Signature
     */
    static verifyWebhookSignature(
        httpMethod: string,
        endpointPath: string,
        requestBody: any,
        timestamp: string,
        signature: string,
        clientSecret: string
    ): boolean {
        try {
            // For notification, SNAP stringToSign formula:
            // HTTPMethod + ":" + EndpointUrl + ":" + Lowercase(HexEncode(SHA256(minify(RequestBody)))) + ":" + Timestamp
            // Or with empty accessToken: HTTPMethod + ":" + EndpointUrl + "::" + Lowercase(...)
            const minifiedBody = JSON.stringify(requestBody);
            const bodyHash = crypto.createHash('sha256').update(minifiedBody).digest('hex').toLowerCase();

            // Try candidate formulas used by DOKU notification
            const candidates = [
                `${httpMethod.toUpperCase()}:${endpointPath}:${bodyHash}:${timestamp}`,
                `${httpMethod.toUpperCase()}:${endpointPath}::${bodyHash}:${timestamp}`,
            ];

            for (const candidate of candidates) {
                const hmac = crypto.createHmac('sha512', clientSecret);
                hmac.update(candidate);
                const expected = hmac.digest('base64');
                if (expected === signature) {
                    return true;
                }
            }

            return false;
        } catch {
            return false;
        }
    }
}

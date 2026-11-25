import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class DokuSecurity {
    private static privateKeyCache: string | null = null;
    private static dokuPublicKeyCache: string | null = null;

    static normalizePem(raw: string, defaultType: string = 'PRIVATE KEY'): string {
        if (!raw) return '';
        let str = raw.trim();

        // Strip surrounding quotes
        if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
            str = str.slice(1, -1).trim();
        }

        str = str.replace(/\\n/g, '\n').replace(/\\r/g, '');

        if (str.includes('BEGIN')) {
            const match = str.match(/-----BEGIN ([A-Z0-9 ]+)-----(.*)-----END ([A-Z0-9 ]+)-----/s);
            if (match) {
                const type = match[1];
                const body = match[2].replace(/\s+/g, '');
                const lines = body.match(/.{1,64}/g) || [];
                return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----\n`;
            }
        }

        // Handle raw base64 content without -----BEGIN ... ----- headers
        const body = str.replace(/\s+/g, '');
        const lines = body.match(/.{1,64}/g) || [];
        return `-----BEGIN ${defaultType}-----\n${lines.join('\n')}\n-----END ${defaultType}-----\n`;
    }

    static getPrivateKey(): string {
        if (this.privateKeyCache) return this.privateKeyCache;

        // 1. Prefer physical certificate file if it exists on disk (via .railwayignore deployment)
        const explicitPath = process.env.DOKU_PRIVATE_KEY_PATH;
        const defaultPath = path.join(process.cwd(), 'certs/doku_private_key.pem');
        const resolvedPath = (explicitPath && explicitPath.endsWith('.pem'))
            ? (path.isAbsolute(explicitPath) ? explicitPath : path.join(process.cwd(), explicitPath))
            : defaultPath;

        if (fs.existsSync(resolvedPath)) {
            this.privateKeyCache = this.normalizePem(fs.readFileSync(resolvedPath, 'utf8'), 'PRIVATE KEY');
            return this.privateKeyCache;
        }

        // 2. Check if base64 env is provided
        if (process.env.DOKU_PRIVATE_KEY_B64) {
            try {
                const decoded = Buffer.from(process.env.DOKU_PRIVATE_KEY_B64.trim(), 'base64').toString('utf8');
                this.privateKeyCache = this.normalizePem(decoded, 'PRIVATE KEY');
                return this.privateKeyCache;
            } catch (e: any) {
                console.warn('[DokuSecurity] Failed to decode DOKU_PRIVATE_KEY_B64:', e.message);
            }
        }

        // 3. Check candidate envs: DOKU_PRIVATE_KEY or DOKU_PRIVATE_KEY_PATH (if user pasted raw key into it)
        const candidateKey = process.env.DOKU_PRIVATE_KEY || process.env.DOKU_PRIVATE_KEY_PATH;
        if (candidateKey) {
            const clean = candidateKey.trim().replace(/^["']|["']$/g, '');
            // If it's raw key content rather than a short local file path
            if (clean.length > 80 || clean.includes('BEGIN') || clean.startsWith('MII')) {
                this.privateKeyCache = this.normalizePem(clean, 'PRIVATE KEY');
                return this.privateKeyCache;
            }
        }

        throw new Error(`DOKU private key tidak ditemukan di: ${resolvedPath} (dan tidak ada di env)`);
    }

    static getDokuPublicKey(): string | null {
        if (this.dokuPublicKeyCache) return this.dokuPublicKeyCache;

        // 1. Prefer physical certificate file if it exists on disk
        const explicitPath = process.env.DOKU_PUBLIC_KEY_PATH;
        const defaultPath = path.join(process.cwd(), 'certs/doku_server_public_key.pem');
        const resolvedPath = (explicitPath && explicitPath.endsWith('.pem'))
            ? (path.isAbsolute(explicitPath) ? explicitPath : path.join(process.cwd(), explicitPath))
            : defaultPath;

        if (fs.existsSync(resolvedPath)) {
            this.dokuPublicKeyCache = this.normalizePem(fs.readFileSync(resolvedPath, 'utf8'), 'PUBLIC KEY');
            return this.dokuPublicKeyCache;
        }

        // 2. Check if base64 env is provided
        if (process.env.DOKU_SERVER_PUBLIC_KEY_B64 || process.env.DOKU_PUBLIC_KEY_B64) {
            try {
                const b64 = (process.env.DOKU_SERVER_PUBLIC_KEY_B64 || process.env.DOKU_PUBLIC_KEY_B64)!.trim();
                const decoded = Buffer.from(b64, 'base64').toString('utf8');
                this.dokuPublicKeyCache = this.normalizePem(decoded, 'PUBLIC KEY');
                return this.dokuPublicKeyCache;
            } catch (e: any) {
                console.warn('[DokuSecurity] Failed to decode public key b64:', e.message);
            }
        }

        // 3. Check candidate envs: DOKU_PUBLIC_KEY, DOKU_SERVER_PUBLIC_KEY, or DOKU_PUBLIC_KEY_PATH
        const candidateKey = process.env.DOKU_PUBLIC_KEY || process.env.DOKU_SERVER_PUBLIC_KEY || process.env.DOKU_PUBLIC_KEY_PATH;
        if (candidateKey) {
            const clean = candidateKey.trim().replace(/^["']|["']$/g, '');
            if (clean.length > 80 || clean.includes('BEGIN') || clean.startsWith('MII')) {
                this.dokuPublicKeyCache = this.normalizePem(clean, 'PUBLIC KEY');
                return this.dokuPublicKeyCache;
            }
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

        try {
            const sign = crypto.createSign('SHA256');
            sign.update(stringToSign);
            sign.end();
            return sign.sign(privateKey, 'base64');
        } catch (err: any) {
            console.error('[DokuSecurity] Signature generation failed. Key preview:', privateKey.substring(0, 40));
            throw new Error(`Gagal menandatangani request DOKU (${err.message}). Pastikan nilai DOKU_PRIVATE_KEY_B64 atau DOKU_PRIVATE_KEY valid.`);
        }
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
     * Verify DOKU Webhook Notification Signature (supports HTTP HMACSHA256, SNAP Asymmetric RSA, and SNAP Symmetric HMAC-SHA512)
     */
    static verifyWebhookSignature(
        httpMethod: string,
        endpointPath: string,
        requestBody: any,
        timestamp: string,
        signature: string,
        clientSecret: string,
        rawBody?: string,
        headers?: any
    ): boolean {
        try {
            if (!signature || !clientSecret) return false;

            const bodyStr = rawBody || JSON.stringify(requestBody);
            const minifiedBody = JSON.stringify(requestBody);
            const candidatePaths = Array.from(new Set([
                endpointPath,
                '/api/webhooks/doku',
                '/webhooks/doku'
            ].filter(Boolean)));

            // 1. DOKU HTTP Notification format: Signature: "HMACSHA256=..."
            if (signature.startsWith('HMACSHA256=')) {
                const providedHmac = signature.slice('HMACSHA256='.length).trim();
                const clientId = headers?.['client-id'] || '';
                const requestId = headers?.['request-id'] || '';
                const reqTimestamp = headers?.['request-timestamp'] || timestamp || '';
                if (!clientId || !requestId || !reqTimestamp || !providedHmac) return false;

                for (const bodyCandidate of Array.from(new Set([bodyStr, minifiedBody]))) {
                    const digest = crypto.createHash('sha256').update(bodyCandidate, 'utf8').digest('base64');
                    for (const target of candidatePaths) {
                        const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${reqTimestamp}\nRequest-Target:${target}\nDigest:${digest}`;
                        const expected = crypto.createHmac('sha256', clientSecret).update(component).digest('base64');
                        if (expected.length === providedHmac.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(providedHmac))) {
                            return true;
                        }
                    }
                }
                return false;
            }

            if (!timestamp) return false;

            // 2. SNAP Asymmetric RSA-SHA256 (X-SIGNATURE signed by DOKU Server Private Key)
            const dokuPubKey = this.getDokuPublicKey();
            if (dokuPubKey) {
                for (const bodyCandidate of Array.from(new Set([minifiedBody, bodyStr]))) {
                    const bodyHash = crypto.createHash('sha256').update(bodyCandidate).digest('hex').toLowerCase();
                    for (const target of candidatePaths) {
                        for (const strToVerify of [
                            `${httpMethod.toUpperCase()}:${target}:${bodyHash}:${timestamp}`,
                            `${httpMethod.toUpperCase()}:${target}::${bodyHash}:${timestamp}`
                        ]) {
                            const verifier = crypto.createVerify('RSA-SHA256');
                            verifier.update(strToVerify);
                            verifier.end();
                            if (verifier.verify(dokuPubKey, signature, 'base64')) {
                                return true;
                            }
                        }
                    }
                }
            }

            // 3. SNAP Symmetric HMAC-SHA512
            for (const bodyCandidate of Array.from(new Set([minifiedBody, bodyStr]))) {
                const bodyHash = crypto.createHash('sha256').update(bodyCandidate).digest('hex').toLowerCase();
                for (const target of candidatePaths) {
                    const candidates = [
                        `${httpMethod.toUpperCase()}:${target}:${bodyHash}:${timestamp}`,
                        `${httpMethod.toUpperCase()}:${target}::${bodyHash}:${timestamp}`,
                    ];
                    for (const candidate of candidates) {
                        const expected = crypto.createHmac('sha512', clientSecret).update(candidate).digest('base64');
                        if (expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch {
            return false;
        }
    }
}

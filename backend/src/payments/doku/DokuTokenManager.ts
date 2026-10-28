import { DokuSecurity } from './DokuSecurity';
import { redis } from '../../upstash';

interface CachedToken {
    accessToken: string;
    expiresAt: number; // unix timestamp in ms
}

export class DokuTokenManager {
    private static memoryCache: CachedToken | null = null;
    private static REDIS_KEY = 'doku:b2b:access_token';

    static getBaseUrl(): string {
        const env = process.env.DOKU_ENV || 'production';
        return env === 'sandbox' ? 'https://api-sandbox.doku.com' : 'https://api.doku.com';
    }

    static async getB2BToken(): Promise<string> {
        const now = Date.now();

        // 1. Check in-memory cache first (with 60s buffer)
        if (this.memoryCache && this.memoryCache.expiresAt > now + 60000) {
            return this.memoryCache.accessToken;
        }

        // 2. Check Redis cache if configured
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                const cached = await redis.get<string>(this.REDIS_KEY);
                if (cached) {
                    this.memoryCache = {
                        accessToken: cached,
                        expiresAt: now + 700000 // estimate ~11 mins remaining
                    };
                    return cached;
                }
            }
        } catch (e) {
            console.warn('[DokuTokenManager] Redis get token failed, falling back to API:', (e as any).message);
        }

        // 3. Request new B2B token from DOKU
        const clientId = process.env.DOKU_CLIENT_ID || '';
        if (!clientId) {
            throw new Error('DOKU_CLIENT_ID is not configured');
        }

        const timestamp = DokuSecurity.getUtcTimestamp();
        const signature = DokuSecurity.generateAsymmetricSignature(clientId, timestamp);
        const baseUrl = this.getBaseUrl();
        const endpoint = `${baseUrl}/authorization/v1/access-token/b2b`;

        const response = await fetch(endpoint, {
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

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`DOKU B2B Token generation failed [HTTP ${response.status}]: ${errText}`);
        }

        const data: any = await response.json();
        if (!data || !data.accessToken) {
            throw new Error(`DOKU B2B Token invalid response: ${JSON.stringify(data)}`);
        }

        const token = data.accessToken;
        const expiresInSec = typeof data.expiresIn === 'number' ? data.expiresIn : 900;
        const safeTtlSec = Math.max(expiresInSec - 120, 300); // 13 minutes TTL

        // Update memory cache
        this.memoryCache = {
            accessToken: token,
            expiresAt: now + safeTtlSec * 1000
        };

        // Update Redis cache
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                await redis.set(this.REDIS_KEY, token, { ex: safeTtlSec });
            }
        } catch (e) {
            console.warn('[DokuTokenManager] Redis set token failed:', (e as any).message);
        }

        return token;
    }
}

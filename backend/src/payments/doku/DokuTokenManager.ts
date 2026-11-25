import { DokuSecurity } from './DokuSecurity';
import { redis } from '../../upstash';

interface CachedToken {
    accessToken: string;
    expiresAt: number; // unix timestamp in ms
}

export class DokuTokenManager {
    private static memoryCache: CachedToken | null = null;
    private static inflightPromise: Promise<string> | null = null;

    private static getRedisKey(): string {
        const env = process.env.DOKU_ENV || 'production';
        const clientId = process.env.DOKU_CLIENT_ID || 'default';
        return `doku:b2b:access_token:${env}:${clientId}`;
    }

    static getBaseUrl(): string {
        const env = process.env.DOKU_ENV || 'production';
        return env === 'sandbox' ? 'https://api-sandbox.doku.com' : 'https://api.doku.com';
    }

    static async invalidateToken(): Promise<void> {
        this.memoryCache = null;
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                await redis.del(this.getRedisKey(), 'doku:b2b:access_token');
            }
        } catch (e) {
            console.warn('[DokuTokenManager] Redis del token failed:', (e as any).message);
        }
    }

    static async getB2BToken(forceRefresh: boolean = false): Promise<string> {
        if (forceRefresh) {
            await this.invalidateToken();
        }

        const now = Date.now();

        // 1. Check in-memory cache (expiresAt already includes safety margin)
        if (!forceRefresh && this.memoryCache && this.memoryCache.expiresAt > now + 15000) {
            return this.memoryCache.accessToken;
        }

        // Deduplicate concurrent token requests under burst traffic
        if (this.inflightPromise) {
            return this.inflightPromise;
        }

        this.inflightPromise = this.fetchOrLoadToken(forceRefresh).finally(() => {
            this.inflightPromise = null;
        });

        return this.inflightPromise;
    }

    private static async fetchOrLoadToken(forceRefresh: boolean): Promise<string> {
        const now = Date.now();
        const redisKey = this.getRedisKey();

        // 2. Check Redis cache (stores exact expiresAt so reading Redis never extends token lifetime)
        if (!forceRefresh) {
            try {
                if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                    const cached = await redis.get<CachedToken | string>(redisKey);
                    if (cached && typeof cached === 'object' && cached.accessToken && cached.expiresAt > now + 15000) {
                        this.memoryCache = cached;
                        return cached.accessToken;
                    }
                }
            } catch (e) {
                console.warn('[DokuTokenManager] Redis get token failed, falling back to API:', (e as any).message);
            }
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
        const expiresInSec = Number(data.expiresIn) > 0 ? Number(data.expiresIn) : 900;
        const safeTtlSec = Math.max(Math.min(expiresInSec - 120, expiresInSec - 60), 60); // 13 minutes TTL for 15m token
        const tokenEntry: CachedToken = {
            accessToken: token,
            expiresAt: Date.now() + safeTtlSec * 1000
        };

        // Update memory cache
        this.memoryCache = tokenEntry;

        // Update Redis cache with exact expiresAt
        try {
            if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
                await redis.set(redisKey, tokenEntry, { ex: safeTtlSec });
            }
        } catch (e) {
            console.warn('[DokuTokenManager] Redis set token failed:', (e as any).message);
        }

        return token;
    }
}

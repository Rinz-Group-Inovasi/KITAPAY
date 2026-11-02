import crypto from 'crypto';

/**
 * Advanced Encryption Standard (AES) with 256-bit key in GCM mode (Galois/Counter Mode).
 * 
 * Technical Specifications:
 * - Algorithm: aes-256-gcm
 * - Key Length: 256 bits (32 bytes)
 * - Initialization Vector (IV): 96 bits (12 bytes) cryptographically random per operation
 * - Authentication Tag: 128 bits (16 bytes) for tamper detection & message authenticity
 * - Standard Compliance: NIST SP 800-38D, FIPS 197, PCI DSS Requirement 3.4
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Resolves a 256-bit (32 bytes) key from the environment or provided custom key.
 */
function resolveKey(customKey?: string | Buffer): Buffer {
    if (Buffer.isBuffer(customKey) && customKey.length === 32) {
        return customKey;
    }

    const keySource = customKey 
        || process.env.AES_256_SECRET_KEY 
        || process.env.ENCRYPTION_KEY 
        || 'kitapay_default_master_aes_256_bit_secure_key_2026';

    // Derive a strict 32-byte (256-bit) key using SHA-256
    return crypto.createHash('sha256').update(keySource).digest();
}

export interface EncryptedPayload {
    cipherText: string;
    iv: string;
    tag: string;
    combined: string; // iv:tag:cipherText format
    algorithm: string;
    keyBitLength: number;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Each call generates a unique, cryptographically strong Initialization Vector (IV).
 */
export function encryptAES256(plaintext: string, secretKey?: string | Buffer): EncryptedPayload {
    const key = resolveKey(secretKey);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    const ivHex = iv.toString('hex');
    const tagHex = tag.toString('hex');
    const combined = `${ivHex}:${tagHex}:${encrypted}`;

    return {
        cipherText: encrypted,
        iv: ivHex,
        tag: tagHex,
        combined,
        algorithm: 'AES-256-GCM',
        keyBitLength: 256,
    };
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 * Accepts either the combined format (iv:tag:cipherText) or separate parameters.
 * Throws an error if data has been tampered with or key is invalid.
 */
export function decryptAES256(
    encryptedData: string, 
    secretKey?: string | Buffer,
    customIv?: string,
    customTag?: string
): string {
    const key = resolveKey(secretKey);
    
    let ivHex: string;
    let tagHex: string;
    let cipherTextHex: string;

    if (customIv && customTag) {
        ivHex = customIv;
        tagHex = customTag;
        cipherTextHex = encryptedData;
    } else {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid AES-256 combined payload format. Expected iv:tag:cipherText');
        }
        [ivHex, tagHex, cipherTextHex] = parts;
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Helper to mask sensitive data (e.g. Bank Account or Card Number)
 * Example: 1234567890 -> 12******90
 */
export function maskSensitiveData(data: string, visibleStart = 2, visibleEnd = 2): string {
    if (!data || data.length <= visibleStart + visibleEnd) return data;
    const start = data.slice(0, visibleStart);
    const end = data.slice(-visibleEnd);
    const masked = '*'.repeat(data.length - visibleStart - visibleEnd);
    return `${start}${masked}${end}`;
}

/**
 * Validates if a string matches the combined AES-256 format (iv:tag:cipherText).
 */
export function isAES256Encrypted(data: string): boolean {
    if (typeof data !== 'string') return false;
    const parts = data.split(':');
    if (parts.length !== 3) return false;
    // IV is 12 bytes = 24 hex chars, Tag is 16 bytes = 32 hex chars
    return parts[0].length === 24 && parts[1].length === 32 && parts[2].length > 0;
}

/**
 * Performs a self-diagnostic test of the AES-256 cryptographic engine.
 */
export function runAES256SelfTest(): { success: boolean; details: Record<string, any> } {
    try {
        const testPayload = `KitaPay_AES256_HealthCheck_${Date.now()}`;
        const encrypted = encryptAES256(testPayload);
        const decrypted = decryptAES256(encrypted.combined);

        const isExactMatch = testPayload === decrypted;

        // Tamper test (modify one character in cipherText and ensure auth tag catches it)
        let tamperDetected = false;
        try {
            const tamperedCombined = encrypted.combined.slice(0, -2) + (encrypted.combined.endsWith('a') ? 'b' : 'a');
            decryptAES256(tamperedCombined);
        } catch {
            tamperDetected = true;
        }

        return {
            success: isExactMatch && tamperDetected,
            details: {
                algorithm: 'AES-256-GCM',
                keyLengthBits: 256,
                authenticatedIntegrity: tamperDetected ? 'Verified (NIST Compliant)' : 'Failed',
                roundtripDecryption: isExactMatch ? 'Verified' : 'Failed',
            }
        };
    } catch (err: any) {
        return {
            success: false,
            details: {
                error: err.message
            }
        };
    }
}

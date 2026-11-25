import dns from 'dns';
import net from 'net';

function isPrivateOrReservedIp(ip: string): boolean {
    const clean = ip.replace(/^::ffff:/i, '');
    if (net.isIPv4(clean)) {
        const parts = clean.split('.').map(Number);
        const [a, b] = parts;
        if (a === 0 || a === 10 || a === 127) return true;
        if (a === 169 && b === 254) return true; // Cloud metadata / link-local
        if (a === 172 && b >= 16 && b <= 31) return true;
        if (a === 192 && b === 168) return true;
        if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
        if (a >= 224) return true; // Multicast / reserved
        return false;
    }
    if (net.isIPv6(clean)) {
        const lower = clean.toLowerCase();
        if (lower === '::1' || lower === '::' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) {
            return true;
        }
    }
    return false;
}

export async function validateSafeWebhookUrl(urlStr: string): Promise<{ valid: boolean; reason?: string }> {
    if (!urlStr || !urlStr.trim()) return { valid: true };

    let parsed: URL;
    try {
        parsed = new URL(urlStr.trim());
    } catch {
        return { valid: false, reason: 'Format URL webhook tidak valid.' };
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { valid: false, reason: 'URL webhook wajib menggunakan protokol HTTPS atau HTTP.' };
    }

    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (
        host === 'localhost' ||
        host.endsWith('.localhost') ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        host.endsWith('.invalid')
    ) {
        return { valid: false, reason: 'Hostname internal/lokal tidak diizinkan untuk URL webhook.' };
    }

    if (net.isIP(host)) {
        if (isPrivateOrReservedIp(host)) {
            return { valid: false, reason: 'Alamat IP privat/loopback tidak diizinkan untuk URL webhook.' };
        }
        return { valid: true };
    }

    try {
        const records = await dns.promises.lookup(host, { all: true });
        if (!records || records.length === 0) {
            return { valid: false, reason: 'Domain webhook tidak dapat di-resolve.' };
        }
        for (const rec of records) {
            if (isPrivateOrReservedIp(rec.address)) {
                return { valid: false, reason: 'Domain webhook mengarah ke alamat IP internal/privat.' };
            }
        }
    } catch {
        return { valid: false, reason: 'Gagal memvalidasi DNS domain webhook.' };
    }

    return { valid: true };
}


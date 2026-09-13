import { createWorker } from 'tesseract.js';

export class KycEngine {
    /**
     * Verifies KTP data using OCR.
     * Returns true if NIK and Name match, false otherwise.
     */
    static async verifyKTP(ktpUrl: string, expectedNik: string, expectedName: string): Promise<{ success: boolean; reason?: string; extractedText?: string }> {
        let worker: any = null;
        try {
            console.log(`[KycEngine] Starting OCR for image: ${ktpUrl}`);
            worker = await createWorker('ind');
            
            const { data: { text } } = await worker.recognize(ktpUrl);
            const lowerText = text.toLowerCase();
            const lowerExpectedName = expectedName.toLowerCase();
            
            // Basic matching
            // NIK is 16 digits
            const nikMatch = text.match(/\b\d{16}\b/);
            const extractedNik = nikMatch ? nikMatch[0] : null;
            
            // Name matching
            // OCR might have minor typos, we check if at least significant parts of the name match
            const nameParts = lowerExpectedName.split(' ').filter(p => p.length > 2);
            let nameMatchedParts = 0;
            
            for (const part of nameParts) {
                if (lowerText.includes(part)) {
                    nameMatchedParts++;
                }
            }
            
            // Also check full name without spaces just in case
            const noSpaceName = lowerExpectedName.replace(/\s/g, '');
            const isNameMatch = nameMatchedParts >= 1 || lowerText.includes(noSpaceName) || nameParts.length === 0;

            const isNikMatch = extractedNik === expectedNik;
            
            await worker.terminate();

            if (!isNikMatch) {
                return { success: false, reason: 'NIK di KTP tidak terdeteksi atau tidak cocok dengan input', extractedText: text };
            }
            if (!isNameMatch) {
                 return { success: false, reason: 'Nama di KTP tidak terdeteksi (gambar mungkin kurang jelas)', extractedText: text };
            }

            return { success: true, extractedText: text };
            
        } catch (error: any) {
            console.error('[KycEngine] OCR Error:', error);
            if (worker) await worker.terminate();
            return { success: false, reason: 'Gagal memproses gambar KTP (' + error.message + ')' };
        }
    }
}

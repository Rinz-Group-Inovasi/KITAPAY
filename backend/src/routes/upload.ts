import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
        
        const folder = req.body?.folder || 'kitapay_promosi';
        const result = await cloudinary.uploader.upload(dataURI, {
            folder,
        });

        res.status(200).json({ secure_url: result.secure_url });
    } catch (err: any) {
        console.error('Cloudinary upload error:', err);
        res.status(500).json({ error: 'Upload failed', details: err.message });
    }
});

export default router;

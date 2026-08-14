import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../lib/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

// POST /api/upload  (multipart/form-data, field name "file")
//
// Zero-config default: returns a base64 data URL so the app works the moment
// you deploy, no object-storage account required. For production traffic,
// swap this out for S3 / Cloudinary / Vercel Blob — see README.md.
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const base64 = req.file.buffer.toString('base64');
    const file_url = `data:${req.file.mimetype};base64,${base64}`;
    res.json({ file_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;

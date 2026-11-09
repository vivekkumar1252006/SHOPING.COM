import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Disk Storage for persistent local files (when Cloudinary not configured)
const diskStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
    cb(null, `${cleanName}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|svg)$/i;
  const allowedMimetypes = /^image\/(jpeg|png|webp|svg\+xml)$/;

  if (!file.originalname.match(allowedExtensions) || !file.mimetype.match(allowedMimetypes)) {
    return cb(new Error('Only image files (jpg, jpeg, png, webp, svg) are allowed!'));
  }
  cb(null, true);
};

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter,
});

/**
 * Upload helper: Processes file via Cloudinary if configured; otherwise retains saved disk path
 */
const processUploadedFile = async (file) => {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const uploadResponse = await cloudinary.uploader.upload(file.path, {
        folder: 'smartcart_products',
      });

      // Remove temporary disk file after successful Cloudinary upload
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}

      return {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
        storage: 'cloudinary',
      };
    } catch (err) {
      console.warn('Cloudinary upload failed, falling back to local storage:', err.message);
    }
  }

  // Return static local URL
  const relativeUrl = `/uploads/${file.filename}`;
  return {
    url: relativeUrl,
    filename: file.filename,
    storage: 'disk',
  };
};

/**
 * Single Image Upload
 * POST /api/upload
 */
router.post('/', protect, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const result = await processUploadedFile(req.file);

    res.status(200).json({
      success: true,
      imageUrl: result.url,
      storage: result.storage,
      filename: result.filename,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Multiple Images Upload (up to 5 images)
 * POST /api/upload/multiple
 */
router.post('/multiple', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }

    const results = [];
    for (const file of req.files) {
      const processed = await processUploadedFile(file);
      results.push(processed.url);
    }

    res.status(200).json({
      success: true,
      imageUrls: results,
      count: results.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Delete Image (from local disk or Cloudinary)
 * DELETE /api/upload/:filename
 */
router.delete('/:filename', protect, admin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'Image deleted from disk successfully' });
    }

    if (process.env.CLOUDINARY_API_KEY) {
      try {
        await cloudinary.uploader.destroy(`smartcart_products/${filename}`);
        return res.json({ success: true, message: 'Image deleted from Cloudinary successfully' });
      } catch (_) {}
    }

    res.json({ success: true, message: 'Image cleanup processed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;


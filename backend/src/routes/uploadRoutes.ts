import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToCloudinary, isCloudinaryConfigured } from '../utils/cloudinary';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `pick-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP).'));
    }
  },
});

router.post('/image', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen.' });
  }

  // Si Cloudinary está configurado, subir allí y borrar copia local temporal
  if (isCloudinaryConfigured) {
    try {
      const cloudinaryUrl = await uploadToCloudinary(req.file.path);
      if (cloudinaryUrl) {
        // Borrar el archivo local para ahorrar almacenamiento del servidor
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Error al eliminar archivo local temporal:', err);
        }
        
        return res.status(201).json({
          message: 'Imagen subida a Cloudinary correctamente.',
          imageUrl: cloudinaryUrl,
          filename: req.file.filename,
        });
      }
    } catch (error) {
      console.error('Error al subir a Cloudinary, cayendo en fallback de almacenamiento local:', error);
    }
  }

  // Fallback: Retornar la ruta local para acceder al archivo
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.status(201).json({
    message: 'Imagen subida localmente.',
    imageUrl,
    filename: req.file.filename,
  });
});

export default router;

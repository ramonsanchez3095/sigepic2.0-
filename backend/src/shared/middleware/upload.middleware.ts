import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Crear directorios si no existen
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '../../../uploads/fotos'),
    path.join(__dirname, '../../../uploads/documentos'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

const fotoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/fotos/'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, 'uploads/documentos/'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const fotoUpload = multer({
  storage: fotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(null, extOk && mimeOk);
  },
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadFoto = (req: Request, res: Response, next: NextFunction) => {
  fotoUpload.single('foto')(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

export const uploadArchivos = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  docUpload.array('archivos', 5)(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

export const uploadPersonalCompleto = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, file, cb) => {
        if (file.fieldname === 'foto') {
          cb(null, 'uploads/fotos/');
        } else {
          cb(null, 'uploads/documentos/');
        }
      },
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  }).fields([
    { name: 'foto', maxCount: 1 },
    { name: 'archivos', maxCount: 5 },
  ]);

  upload(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

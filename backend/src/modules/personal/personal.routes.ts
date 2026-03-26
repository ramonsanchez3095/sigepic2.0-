import { Router } from 'express';
import * as personalController from './personal.controller';
import {
  verificarToken,
  verificarPermiso,
} from '../../shared/middleware/auth.middleware';
import { validarDatos } from '../../shared/middleware/validator';
import {
  schemaPersonal,
  schemaPersonalActualizar,
} from './personal.validators';
import {
  uploadFoto,
  uploadArchivos,
  uploadPersonalCompleto,
} from '../../shared/middleware/upload.middleware';
import { createLimiter } from '../../shared/middleware/rate-limiter';

const router = Router();

// All routes require authentication
router.use(verificarToken);

// GET /api/v1/personal - Search/List
router.get(
  '/',
  verificarPermiso('personal', 'read'),
  personalController.buscar
);

// GET /api/v1/personal/estadisticas
router.get(
  '/estadisticas',
  verificarPermiso('personal', 'read'),
  personalController.estadisticas
);

// GET /api/v1/personal/exportar
router.get(
  '/exportar',
  verificarPermiso('personal', 'read'),
  personalController.exportar
);

// POST /api/v1/personal/planillas
router.post(
  '/planillas',
  verificarPermiso('personal', 'read'),
  personalController.generarPlanillas
);

// GET /api/v1/personal/:id
router.get(
  '/:id',
  verificarPermiso('personal', 'read'),
  personalController.obtenerPorId
);

// POST /api/v1/personal - Create (with rate limiting)
router.post(
  '/',
  verificarPermiso('personal', 'create'),
  createLimiter,
  uploadPersonalCompleto,
  personalController.crear
);

// PUT /api/v1/personal/:id - Update (with rate limiting)
router.put(
  '/:id',
  verificarPermiso('personal', 'update'),
  createLimiter,
  validarDatos(schemaPersonalActualizar),
  personalController.actualizar
);

// DELETE /api/v1/personal/:id
router.delete(
  '/:id',
  verificarPermiso('personal', 'delete'),
  personalController.eliminar
);

// POST /api/v1/personal/:id/foto
router.post(
  '/:id/foto',
  verificarPermiso('personal', 'update'),
  uploadFoto,
  personalController.subirFoto
);

// POST /api/v1/personal/:id/archivos
router.post(
  '/:id/archivos',
  verificarPermiso('personal', 'update'),
  uploadArchivos,
  personalController.subirArchivos
);

// GET /api/v1/personal/:id/historial
router.get(
  '/:id/historial',
  verificarPermiso('auditoria', 'read'),
  personalController.obtenerHistorial
);

export default router;

import { Router } from 'express';
import * as licenciaController from './licencia.controller';
import {
  verificarToken,
  verificarPermiso,
} from '../../shared/middleware/auth.middleware';
import { createLimiter } from '../../shared/middleware/rate-limiter';

const router = Router({ mergeParams: true });

router.use(verificarToken);

// GET /api/v1/personal/:personalId/licencias
router.get(
  '/',
  verificarPermiso('licencia', 'read'),
  licenciaController.listar
);

// GET /api/v1/personal/:personalId/licencias/resumen
router.get(
  '/resumen',
  verificarPermiso('licencia', 'read'),
  licenciaController.resumenAnual
);

// GET /api/v1/personal/:personalId/licencias/:id
router.get(
  '/:id',
  verificarPermiso('licencia', 'read'),
  licenciaController.obtenerPorId
);

// POST /api/v1/personal/:personalId/licencias (with rate limiting)
router.post(
  '/',
  verificarPermiso('licencia', 'create'),
  createLimiter,
  licenciaController.crear
);

// PUT /api/v1/personal/:personalId/licencias/:id (with rate limiting)
router.put(
  '/:id',
  verificarPermiso('licencia', 'update'),
  createLimiter,
  licenciaController.actualizar
);

// DELETE /api/v1/personal/:personalId/licencias/:id
router.delete(
  '/:id',
  verificarPermiso('licencia', 'delete'),
  licenciaController.eliminar
);

export default router;

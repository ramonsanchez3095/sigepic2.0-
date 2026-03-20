const express = require('express');
const router = express.Router({ mergeParams: true });
const licenciaController = require('../controllers/licenciaController');
const {
  verificarToken,
  verificarPermiso,
} = require('../middlewares/authMiddleware');
const { validarDatos } = require('../middlewares/validator');
const {
  schemaLicencia,
  schemaLicenciaActualizar,
} = require('../utils/validators');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET /api/personal/:personalId/licencias - Listar licencias de un personal
router.get(
  '/',
  verificarPermiso('licencia', 'read'),
  licenciaController.listar
);

// GET /api/personal/:personalId/licencias/resumen - Resumen anual
router.get(
  '/resumen',
  verificarPermiso('licencia', 'read'),
  licenciaController.resumenAnual
);

// GET /api/personal/:personalId/licencias/:id - Obtener por ID
router.get(
  '/:id',
  verificarPermiso('licencia', 'read'),
  licenciaController.obtenerPorId
);

// POST /api/personal/:personalId/licencias - Crear licencia
router.post(
  '/',
  verificarPermiso('licencia', 'create'),
  validarDatos(schemaLicencia),
  licenciaController.crear
);

// PUT /api/personal/:personalId/licencias/:id - Actualizar licencia
router.put(
  '/:id',
  verificarPermiso('licencia', 'update'),
  validarDatos(schemaLicenciaActualizar),
  licenciaController.actualizar
);

// DELETE /api/personal/:personalId/licencias/:id - Eliminar licencia
router.delete(
  '/:id',
  verificarPermiso('licencia', 'delete'),
  licenciaController.eliminar
);

module.exports = router;

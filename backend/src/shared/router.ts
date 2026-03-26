import { Router } from 'express';
import personalRoutes from '../modules/personal/personal.routes';
import licenciaRoutes from '../modules/licencia/licencia.routes';

const router = Router();

// Modular routes - new structure
router.use('/personal', personalRoutes);
router.use('/personal/:personalId/licencias', licenciaRoutes);

// Legacy routes (will be migrated progressively)
// The auth, jerarquia, seccion, auditoria, and usuario routes
// remain in src/routes/ until they are migrated to modules
const authRoutes = require('../routes/auth.routes');
const jerarquiaRoutes = require('../routes/jerarquia.routes');
const seccionRoutes = require('../routes/seccion.routes');
const auditoriaRoutes = require('../routes/auditoria.routes');
const usuarioRoutes = require('../routes/usuario.routes');

router.use('/auth', authRoutes);
router.use('/jerarquias', jerarquiaRoutes);
router.use('/secciones', seccionRoutes);
router.use('/auditoria', auditoriaRoutes);
router.use('/usuarios', usuarioRoutes);

export default router;

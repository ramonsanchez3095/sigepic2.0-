require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// ===========================================
// MIDDLEWARES GLOBALES
// ===========================================

// Seguridad
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Logging HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: { write: message => logger.info(message.trim()) },
    })
  );
}

// Rate limiting
app.use(generalLimiter);

// Archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ===========================================
// RUTAS
// ===========================================

// API Routes - Legacy (non-versioned)
app.use('/api', routes);

// API Routes - New versioned modules (v1)
// These will progressively replace the legacy routes above
try {
  const v1Router = require('./shared/router').default;
  app.use('/api/v1', v1Router);
} catch (e) {
  // TS modules not compiled yet - skip in JS-only mode
  logger.info('Módulos v1 TypeScript aún no compilados, usando rutas legacy');
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
  });
});

// ===========================================
// ERROR HANDLER
// ===========================================
app.use(errorHandler);

module.exports = app;

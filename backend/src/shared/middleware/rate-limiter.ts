import rateLimit from 'express-rate-limit';
import logger from '../../utils/logger';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones, intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      error: 'Demasiadas peticiones, intenta más tarde',
    });
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Demasiados intentos de login, intenta más tarde',
});

export const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Límite de creación alcanzado, espera un minuto',
});

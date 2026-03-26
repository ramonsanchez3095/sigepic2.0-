import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import type { AuthenticatedRequest } from '../../types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: (req as AuthenticatedRequest).user?.id,
  });

  // Prisma Errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    message = `El ${field} ya existe`;
    statusCode = 400;
  }

  if (err.code === 'P2025') {
    message = 'Registro no encontrado';
    statusCode = 404;
  }

  if (err.code === 'P2003') {
    message = 'Error de referencia en base de datos';
    statusCode = 400;
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    message = 'Error de validación';
    statusCode = 400;
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Token inválido';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token expirado';
    statusCode = 401;
  }

  // Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Archivo muy grande';
      statusCode = 400;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Campo de archivo inesperado';
      statusCode = 400;
    }
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

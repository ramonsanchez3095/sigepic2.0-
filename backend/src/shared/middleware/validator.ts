import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validarDatos = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errores = error.details.map(detail => ({
        campo: detail.path.join('.'),
        mensaje: detail.message,
      }));

      return res.status(400).json({
        error: 'Error de validación',
        detalles: errores,
      });
    }

    next();
  };
};

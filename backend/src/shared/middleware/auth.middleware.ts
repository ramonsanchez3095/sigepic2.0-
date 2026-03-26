import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import type {
  AuthenticatedRequest,
  UserRole,
  ResourceName,
  ActionName,
} from '../../types';

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

const PERMISOS: Record<
  UserRole,
  Partial<Record<ResourceName, ActionName[]>>
> = {
  admin: {
    personal: ['create', 'read', 'update', 'delete'],
    jerarquia: ['create', 'read', 'update', 'delete'],
    seccion: ['create', 'read', 'update', 'delete'],
    usuario: ['create', 'read', 'update', 'delete'],
    licencia: ['create', 'read', 'update', 'delete'],
    auditoria: ['read'],
    reporte: ['read', 'create'],
  },
  supervisor: {
    personal: ['create', 'read', 'update'],
    jerarquia: ['read'],
    seccion: ['read'],
    usuario: ['read'],
    licencia: ['create', 'read', 'update'],
    auditoria: ['read'],
    reporte: ['read', 'create'],
  },
  usuario: {
    personal: ['read'],
    jerarquia: ['read'],
    seccion: ['read'],
    usuario: ['read'],
    licencia: ['read'],
    reporte: ['read'],
  },
  auditor: {
    personal: ['read'],
    jerarquia: ['read'],
    seccion: ['read'],
    usuario: ['read'],
    licencia: ['read'],
    auditoria: ['read'],
    reporte: ['read'],
  },
};

export const verificarToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error: any) {
    if (
      error.message === 'Token inválido' ||
      error.message === 'jwt malformed'
    ) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.message === 'jwt expired') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    next(error);
  }
};

export const verificarPermiso = (recurso: ResourceName, accion: ActionName) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { rol } = (req as AuthenticatedRequest).user;

    const permisosRol = PERMISOS[rol];

    if (!permisosRol) {
      return res.status(403).json({ error: 'Rol no válido' });
    }

    const permisosRecurso = permisosRol[recurso];

    if (!permisosRecurso || !permisosRecurso.includes(accion)) {
      return res
        .status(403)
        .json({ error: 'No tiene permisos para esta acción' });
    }

    next();
  };
};

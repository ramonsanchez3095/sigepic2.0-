import { Request, Response, NextFunction } from 'express';
import * as licenciaService from './licencia.service';
import type { AuthenticatedRequest } from '../../types';

function getSingleParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

export const listar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const personalId = parseInt(getSingleParam(req.params.personalId), 10);
    const params = {
      anio: req.query.anio ? parseInt(req.query.anio as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as string) || 'fechaInicio',
      sortOrder: (req.query.sortOrder as string) || 'desc',
    };

    const result = await licenciaService.listar(personalId, params);

    if (!result) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const resumenAnual = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const personalId = parseInt(getSingleParam(req.params.personalId), 10);
    const anio = req.query.anio
      ? parseInt(req.query.anio as string)
      : undefined;

    const result = await licenciaService.resumenAnual(personalId, anio);

    if (!result) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const obtenerPorId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const personalId = parseInt(getSingleParam(req.params.personalId), 10);
    const id = parseInt(getSingleParam(req.params.id), 10);

    const licencia = await licenciaService.obtenerPorId(personalId, id);

    if (!licencia) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    res.json(licencia);
  } catch (error) {
    next(error);
  }
};

export const crear = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const personalId = parseInt(getSingleParam(req.params.personalId), 10);

    const result = await licenciaService.crear(
      personalId,
      authReq.body,
      authReq.user.id,
      { ip: authReq.ip, userAgent: authReq.headers['user-agent'] }
    );

    if (!result) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const actualizar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const personalId = parseInt(getSingleParam(req.params.personalId), 10);
    const id = parseInt(getSingleParam(req.params.id), 10);

    const result = await licenciaService.actualizar(
      personalId,
      id,
      authReq.body,
      authReq.user.id,
      { ip: authReq.ip, userAgent: authReq.headers['user-agent'] }
    );

    if (!result) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const eliminar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const personalId = parseInt(getSingleParam(req.params.personalId), 10);
    const id = parseInt(getSingleParam(req.params.id), 10);

    const result = await licenciaService.eliminar(
      personalId,
      id,
      authReq.user.id,
      { ip: authReq.ip, userAgent: authReq.headers['user-agent'] }
    );

    if (!result) {
      return res.status(404).json({ error: 'Licencia no encontrada' });
    }

    res.json({ message: 'Licencia eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

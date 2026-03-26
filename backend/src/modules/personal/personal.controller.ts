import { Request, Response, NextFunction } from 'express';
import * as personalService from './personal.service';
import type { AuthenticatedRequest, PersonalSearchParams } from '../../types';

function getSingleParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

export const buscar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params: PersonalSearchParams = {
      search: req.query.search as string,
      tipoPersonal: req.query.tipoPersonal as string,
      jerarquia: req.query.jerarquia as string,
      seccion: req.query.seccion as string,
      estadoServicio: req.query.estadoServicio as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await personalService.buscar(params);
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
    const id = parseInt(getSingleParam(req.params.id), 10);
    const personal = await personalService.obtenerPorId(id);

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    res.json(personal);
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
    const personal = await personalService.crear(
      authReq.body,
      authReq.user.id,
      authReq.files as Record<string, Express.Multer.File[]> | undefined,
      { ip: authReq.ip, userAgent: authReq.headers['user-agent'] }
    );

    res.status(201).json(personal);
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
    const id = parseInt(getSingleParam(req.params.id), 10);
    const personal = await personalService.actualizar(
      id,
      authReq.body,
      authReq.user.id,
      authReq.files as Record<string, Express.Multer.File[]> | undefined,
      { ip: authReq.ip, userAgent: authReq.headers['user-agent'] }
    );

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    res.json(personal);
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
    const id = parseInt(getSingleParam(req.params.id), 10);
    const personal = await personalService.eliminar(id, authReq.user.id, {
      ip: authReq.ip,
      userAgent: authReq.headers['user-agent'],
    });

    if (!personal) {
      return res.status(404).json({ error: 'Personal no encontrado' });
    }

    res.json({ message: 'Personal eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
};

export const estadisticas = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await personalService.estadisticas();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

export const subirFoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getSingleParam(req.params.id);
    const prisma = require('../../config/database');

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const fotoUrl = `/uploads/fotos/${req.file.filename}`;

    const personal = await prisma.personal.update({
      where: { id: parseInt(id) },
      data: { fotoUrl },
    });

    res.json({ fotoUrl: personal.fotoUrl });
  } catch (error) {
    next(error);
  }
};

export const subirArchivos = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getSingleParam(req.params.id);
    const prisma = require('../../config/database');

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }

    const archivos = (req.files as Express.Multer.File[]).map(file => ({
      nombre: file.originalname,
      url: `/uploads/documentos/${file.filename}`,
      tipo: file.mimetype,
      tamano: file.size,
      fecha: new Date(),
    }));

    const personal = await prisma.personal.findUnique({
      where: { id: parseInt(id) },
    });

    const archivosActuales = personal.archivosAdjuntos || [];
    const archivosNuevos = [...archivosActuales, ...archivos];

    await prisma.personal.update({
      where: { id: parseInt(id) },
      data: { archivosAdjuntos: archivosNuevos },
    });

    res.json({ archivos: archivosNuevos });
  } catch (error) {
    next(error);
  }
};

export const obtenerHistorial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(getSingleParam(req.params.id), 10);
    const historial = await personalService.obtenerHistorial(id);
    res.json(historial);
  } catch (error) {
    next(error);
  }
};

export const generarPlanillas = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;
    const pdfService = require('../../services/pdfService');
    const prisma = require('../../config/database');

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs' });
    }

    const personal = await prisma.personal.findMany({
      where: { id: { in: ids.map((id: any) => parseInt(id)) } },
    });

    if (personal.length === 0) {
      return res.status(404).json({ error: 'No se encontró personal' });
    }

    const { filePath, fileName } =
      await pdfService.generarPlanillasPersonal(personal);

    res.download(filePath, fileName, (err: Error) => {
      if (err) next(err);
    });
  } catch (error) {
    next(error);
  }
};

export const exportar = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const params: PersonalSearchParams = {
      search: req.query.search as string,
      tipoPersonal: req.query.tipoPersonal as string,
      jerarquia: req.query.jerarquia as string,
      seccion: req.query.seccion as string,
      estadoServicio: req.query.estadoServicio as string,
      page: 1,
      limit: 10000,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const csvContent = await personalService.exportarCSV(params);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=personal_export.csv'
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

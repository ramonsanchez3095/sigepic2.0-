import prisma from '../../config/database';
import logger from '../../utils/logger';
import type { Prisma } from '@prisma/client';
import type { AuditoriaEntry } from '../../types';

// ============================================
// Core business logic - calcular días restantes
// ============================================

export async function calcularDiasRestantes(
  personalId: number,
  anioLicencia: number,
  diasNuevos: number,
  excludeLicenciaId?: number
): Promise<{
  diasLicenciaAnuales: number;
  diasUsados: number;
  diasRestantes: number;
}> {
  const personal = await prisma.personal.findUnique({
    where: { id: personalId },
    select: { diasLicenciaAnuales: true },
  });

  const diasLicenciaAnuales = personal?.diasLicenciaAnuales ?? 0;

  const where: any = {
    personalId,
    anioLicencia,
    estado: { not: 'RECHAZADA' },
  };

  if (excludeLicenciaId) {
    where.id = { not: excludeLicenciaId };
  }

  const licenciasAnio = await prisma.licencia.findMany({
    where,
    select: { dias: true },
  });

  const diasUsados = licenciasAnio.reduce((sum, lic) => sum + lic.dias, 0);
  const diasRestantes = diasLicenciaAnuales - diasUsados - diasNuevos;

  return { diasLicenciaAnuales, diasUsados, diasRestantes };
}

// ============================================
// Service Methods
// ============================================

export async function listar(
  personalId: number,
  params: {
    anio?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }
) {
  const {
    anio,
    page = 1,
    limit = 20,
    sortBy = 'fechaInicio',
    sortOrder = 'desc',
  } = params;

  const personal = await prisma.personal.findUnique({
    where: { id: personalId },
    select: {
      id: true,
      apellidos: true,
      nombres: true,
      diasLicenciaAnuales: true,
    },
  });

  if (!personal) return null;

  const skip = (page - 1) * limit;
  const where: any = { personalId };
  if (anio) where.anioLicencia = anio;

  const [licencias, total] = await Promise.all([
    prisma.licencia.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.licencia.count({ where }),
  ]);

  return {
    data: licencias,
    personal: {
      id: personal.id,
      apellidos: personal.apellidos,
      nombres: personal.nombres,
      diasLicenciaAnuales: personal.diasLicenciaAnuales,
    },
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export async function resumenAnual(personalId: number, anio?: number) {
  const anioConsulta = anio || new Date().getFullYear();

  const personal = await prisma.personal.findUnique({
    where: { id: personalId },
    select: {
      id: true,
      apellidos: true,
      nombres: true,
      diasLicenciaAnuales: true,
    },
  });

  if (!personal) return null;

  const { diasLicenciaAnuales, diasUsados, diasRestantes } =
    await calcularDiasRestantes(personalId, anioConsulta, 0);

  return {
    anio: anioConsulta,
    diasLicenciaAnuales,
    diasUsados,
    diasRestantes,
    personal: {
      id: personal.id,
      apellidos: personal.apellidos,
      nombres: personal.nombres,
    },
  };
}

export async function obtenerPorId(personalId: number, licenciaId: number) {
  return prisma.licencia.findFirst({
    where: { id: licenciaId, personalId },
    include: {
      personal: {
        select: {
          id: true,
          apellidos: true,
          nombres: true,
          diasLicenciaAnuales: true,
        },
      },
    },
  });
}

export async function crear(
  personalId: number,
  datos: any,
  usuarioId: number,
  meta?: { ip?: string; userAgent?: string }
) {
  const personal = await prisma.personal.findUnique({
    where: { id: personalId },
    select: {
      id: true,
      apellidos: true,
      nombres: true,
      diasLicenciaAnuales: true,
    },
  });

  if (!personal) return null;

  const { diasRestantes } = await calcularDiasRestantes(
    personalId,
    datos.anioLicencia,
    datos.dias
  );

  const licencia = await prisma.licencia.create({
    data: {
      personalId,
      tipo: datos.tipo,
      fechaInicio: new Date(datos.fechaInicio),
      fechaFin: new Date(datos.fechaFin),
      dias: datos.dias,
      anioLicencia: datos.anioLicencia,
      diasRestantes,
      motivo: datos.motivo || null,
      observaciones: datos.observaciones || null,
      estado: datos.estado || 'APROBADA',
    },
  });

  await registrarAuditoria({
    tabla: 'licencias',
    registroId: licencia.id,
    accion: 'CREATE',
    cambios: datos,
    usuarioId,
    personalId,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  logger.info(`Licencia creada: ID ${licencia.id} para personal ${personalId}`);

  return {
    ...licencia,
    diasRestantesAnio: diasRestantes,
    advertencia:
      diasRestantes < 0
        ? `El personal ha excedido sus días de licencia anuales por ${Math.abs(diasRestantes)} día(s)`
        : null,
  };
}

export async function actualizar(
  personalId: number,
  licenciaId: number,
  datos: any,
  usuarioId: number,
  meta?: { ip?: string; userAgent?: string }
) {
  const licenciaExistente = await prisma.licencia.findFirst({
    where: { id: licenciaId, personalId },
  });

  if (!licenciaExistente) return null;

  const anioLicencia = datos.anioLicencia || licenciaExistente.anioLicencia;
  const dias = datos.dias || licenciaExistente.dias;

  const { diasRestantes } = await calcularDiasRestantes(
    personalId,
    anioLicencia,
    dias,
    licenciaId
  );

  const updateData: any = {};
  if (datos.tipo) updateData.tipo = datos.tipo;
  if (datos.fechaInicio) updateData.fechaInicio = new Date(datos.fechaInicio);
  if (datos.fechaFin) updateData.fechaFin = new Date(datos.fechaFin);
  if (datos.dias) updateData.dias = datos.dias;
  if (datos.anioLicencia) updateData.anioLicencia = datos.anioLicencia;
  if (datos.motivo !== undefined) updateData.motivo = datos.motivo;
  if (datos.observaciones !== undefined)
    updateData.observaciones = datos.observaciones;
  if (datos.estado) updateData.estado = datos.estado;
  updateData.diasRestantes = diasRestantes;

  const licencia = await prisma.licencia.update({
    where: { id: licenciaId },
    data: updateData,
  });

  await registrarAuditoria({
    tabla: 'licencias',
    registroId: licencia.id,
    accion: 'UPDATE',
    cambios: { anterior: licenciaExistente, nuevo: datos },
    usuarioId,
    personalId,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  logger.info(`Licencia actualizada: ID ${licencia.id}`);

  return licencia;
}

export async function eliminar(
  personalId: number,
  licenciaId: number,
  usuarioId: number,
  meta?: { ip?: string; userAgent?: string }
) {
  const licencia = await prisma.licencia.findFirst({
    where: { id: licenciaId, personalId },
  });

  if (!licencia) return null;

  await prisma.licencia.delete({ where: { id: licenciaId } });

  await registrarAuditoria({
    tabla: 'licencias',
    registroId: licenciaId,
    accion: 'DELETE',
    cambios: licencia as any,
    usuarioId,
    personalId,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  logger.info(`Licencia eliminada: ID ${licenciaId}`);

  return licencia;
}

// ============================================
// Internal helpers
// ============================================

async function registrarAuditoria(entry: AuditoriaEntry) {
  try {
    await prisma.auditoria.create({
      data: {
        ...entry,
        cambios: entry.cambios as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    logger.error('Error registrando auditoría:', error);
  }
}

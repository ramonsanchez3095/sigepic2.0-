import prisma from '../../config/database';
import logger from '../../utils/logger';
import type { Prisma } from '@prisma/client';
import type {
  PersonalSearchParams,
  PaginatedResponse,
  ArchivoAdjunto,
  AuditoriaEntry,
} from '../../types';

// ============================================
// Boolean field conversion from FormData strings
// ============================================

const BOOLEAN_FIELDS = [
  'conduceAutos',
  'conduceMotos',
  'conduceOtros',
  'poseeCarnetManejo',
  'poseeCredencialPolicial',
  'poseeChalecoAsignado',
] as const;

function convertBooleanFields(datos: Record<string, any>): Record<string, any> {
  const result = { ...datos };
  for (const field of BOOLEAN_FIELDS) {
    if (result[field] !== undefined) {
      result[field] = result[field] === 'true' || result[field] === true;
    }
  }
  return result;
}

function resolveJerarquiaSeccion(
  datos: Record<string, any>
): Record<string, any> {
  const result = { ...datos };
  if (result.jerarquiaId) {
    result.jerarquia = result.jerarquiaId;
  }
  if (result.seccionId) {
    result.seccion = result.seccionId;
  }
  return result;
}

function cleanEmptyFields(datos: Record<string, any>): Record<string, any> {
  const result = { ...datos };
  for (const key of Object.keys(result)) {
    if (
      result[key] === '' ||
      result[key] === 'null' ||
      result[key] === 'undefined'
    ) {
      delete result[key];
    }
  }
  return result;
}

function parseContactosAdicionales(
  datos: Record<string, any>,
  fallback: unknown[] = []
): Record<string, any> {
  if (!datos.contactosAdicionales) return datos;
  const result = { ...datos };
  if (typeof result.contactosAdicionales === 'string') {
    try {
      result.contactosAdicionales = JSON.parse(result.contactosAdicionales);
    } catch {
      result.contactosAdicionales = fallback;
    }
  }
  return result;
}

function processUploadedFiles(
  files: Record<string, Express.Multer.File[]> | undefined,
  datos: Record<string, any>,
  existingArchivos: ArchivoAdjunto[] = []
): Record<string, any> {
  const result = { ...datos };

  if (files?.foto?.[0]) {
    result.fotoUrl = `/uploads/fotos/${files.foto[0].filename}`;
  }

  if (files?.archivos?.length) {
    const nuevosArchivos: ArchivoAdjunto[] = files.archivos.map(file => ({
      nombre: file.originalname,
      url: `/uploads/documentos/${file.filename}`,
      tipo: file.mimetype,
      tamano: file.size,
      fecha: new Date(),
    }));
    result.archivosAdjuntos = [...existingArchivos, ...nuevosArchivos];
  }

  return result;
}

// ============================================
// Service Methods
// ============================================

export async function buscar(
  params: PersonalSearchParams
): Promise<PaginatedResponse<any>> {
  const {
    search = '',
    tipoPersonal,
    jerarquia,
    seccion,
    estadoServicio,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const skip = (page - 1) * limit;
  const take = limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { apellidos: { contains: search, mode: 'insensitive' } },
      { nombres: { contains: search, mode: 'insensitive' } },
      { dni: { contains: search, mode: 'insensitive' } },
      { numeroAsignacion: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (tipoPersonal) where.tipoPersonal = tipoPersonal;
  if (jerarquia) where.jerarquia = jerarquia;
  if (seccion) where.seccion = seccion;
  if (estadoServicio) where.estadoServicio = estadoServicio;

  const [data, total] = await Promise.all([
    prisma.personal.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.personal.count({ where }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function obtenerPorId(id: number) {
  const personal = await prisma.personal.findUnique({
    where: { id },
    include: {
      licencias: { orderBy: { fechaInicio: 'desc' }, take: 10 },
      capacitaciones: { orderBy: { fechaInicio: 'desc' }, take: 10 },
      sanciones: { orderBy: { fecha: 'desc' }, take: 10 },
    },
  });

  if (!personal) {
    return null;
  }

  return personal;
}

export async function crear(
  datos: Record<string, any>,
  usuarioId: number,
  files?: Record<string, Express.Multer.File[]>,
  meta?: { ip?: string; userAgent?: string }
) {
  let processed = convertBooleanFields(datos);
  processed = resolveJerarquiaSeccion(processed);
  processed = processUploadedFiles(files, processed);
  processed = parseContactosAdicionales(processed);
  processed = cleanEmptyFields(processed);

  const personal = await prisma.personal.create({
    data: buildPersonalCreateData(processed, usuarioId),
  });

  await registrarAuditoria({
    tabla: 'personal',
    registroId: personal.id,
    accion: 'CREATE',
    cambios: processed,
    usuarioId,
    personalId: personal.id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  logger.info(`Personal creado: ${personal.id}`, { usuario: usuarioId });

  return personal;
}

export async function actualizar(
  id: number,
  datos: Record<string, any>,
  usuarioId: number,
  files?: Record<string, Express.Multer.File[]>,
  meta?: { ip?: string; userAgent?: string }
) {
  const anterior = await prisma.personal.findUnique({ where: { id } });

  if (!anterior) {
    return null;
  }

  let processed = convertBooleanFields(datos);
  processed = resolveJerarquiaSeccion(processed);

  const archivosAnteriores =
    anterior.archivosAdjuntos && Array.isArray(anterior.archivosAdjuntos)
      ? (anterior.archivosAdjuntos as unknown as ArchivoAdjunto[])
      : [];

  processed = processUploadedFiles(files, processed, archivosAnteriores);
  processed = parseContactosAdicionales(
    processed,
    Array.isArray(anterior.contactosAdicionales)
      ? (anterior.contactosAdicionales as unknown[])
      : []
  );
  processed = cleanEmptyFields(processed);

  const personal = await prisma.personal.update({
    where: { id },
    data: buildPersonalUpdateData(processed, usuarioId),
  });

  await registrarAuditoria({
    tabla: 'personal',
    registroId: personal.id,
    accion: 'UPDATE',
    cambios: { anterior, nuevo: processed },
    usuarioId,
    personalId: personal.id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  logger.info(`Personal actualizado: ${personal.id}`, { usuario: usuarioId });

  return personal;
}

export async function eliminar(
  id: number,
  usuarioId: number,
  meta?: { ip?: string; userAgent?: string }
) {
  const personal = await prisma.personal.findUnique({ where: { id } });

  if (!personal) {
    return null;
  }

  await prisma.personal.delete({ where: { id } });

  await registrarAuditoria({
    tabla: 'personal',
    registroId: id,
    accion: 'DELETE',
    cambios: personal as any,
    usuarioId,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  logger.info(`Personal eliminado: ${id}`, { usuario: usuarioId });

  return personal;
}

export async function estadisticas() {
  const [totalActivos, totalInactivos, porTipo, porJerarquia, porSeccion] =
    await Promise.all([
      prisma.personal.count({ where: { estadoServicio: 'ACTIVO' } }),
      prisma.personal.count({ where: { estadoServicio: { not: 'ACTIVO' } } }),
      prisma.personal.groupBy({ by: ['tipoPersonal'], _count: true }),
      prisma.personal.groupBy({
        by: ['jerarquia'],
        _count: true,
        orderBy: { _count: { jerarquia: 'desc' } },
        take: 10,
      }),
      prisma.personal.groupBy({
        by: ['seccion'],
        _count: true,
        where: { seccion: { not: null } },
        orderBy: { _count: { seccion: 'desc' } },
        take: 10,
      }),
    ]);

  return { totalActivos, totalInactivos, porTipo, porJerarquia, porSeccion };
}

export async function obtenerHistorial(personalId: number) {
  return prisma.auditoria.findMany({
    where: { personalId },
    orderBy: { timestamp: 'desc' },
    include: {
      usuario: {
        select: { username: true, nombreCompleto: true },
      },
    },
  });
}

export async function exportarCSV(
  params: PersonalSearchParams
): Promise<string> {
  const {
    search,
    tipoPersonal,
    jerarquia,
    seccion,
    estadoServicio,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const where: any = {};

  if (search) {
    where.OR = [
      { apellidos: { contains: search, mode: 'insensitive' } },
      { nombres: { contains: search, mode: 'insensitive' } },
      { dni: { contains: search, mode: 'insensitive' } },
      { numeroAsignacion: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (tipoPersonal) where.tipoPersonal = tipoPersonal;
  if (jerarquia) where.jerarquia = jerarquia;
  if (seccion) where.seccion = seccion;
  if (estadoServicio) where.estadoServicio = estadoServicio;

  const personal = await prisma.personal.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    select: {
      numeroAsignacion: true,
      apellidos: true,
      nombres: true,
      dni: true,
      jerarquia: true,
      seccion: true,
      estadoServicio: true,
      cargo: true,
      tipoPersonal: true,
    },
  });

  const campos = [
    'N° Asignación',
    'Apellidos',
    'Nombres',
    'DNI',
    'Jerarquía',
    'Sección',
    'Estado',
    'Cargo',
    'Tipo Personal',
  ];

  let csvContent = campos.join(',') + '\n';

  for (const p of personal) {
    const row = [
      p.numeroAsignacion || '',
      `"${(p.apellidos || '').replace(/"/g, '""')}"`,
      `"${(p.nombres || '').replace(/"/g, '""')}"`,
      p.dni,
      p.jerarquia || '',
      p.seccion || '',
      p.estadoServicio,
      p.cargo || '',
      p.tipoPersonal || '',
    ];
    csvContent += row.join(',') + '\n';
  }

  return csvContent;
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

function buildPersonalCreateData(
  processed: Record<string, any>,
  usuarioId: number
): Prisma.PersonalUncheckedCreateInput {
  return {
    apellidos: String(processed.apellidos),
    nombres: String(processed.nombres),
    dni: String(processed.dni),
    fechaNacimiento: String(processed.fechaNacimiento),
    tipoPersonal: String(processed.tipoPersonal),
    numeroAsignacion: toOptionalString(processed.numeroAsignacion),
    cuil: toOptionalString(processed.cuil),
    estadoCivil: toOptionalString(processed.estadoCivil),
    sexo: toOptionalString(processed.sexo),
    grupoSanguineo: toOptionalString(processed.grupoSanguineo),
    nacionalidad: toOptionalString(processed.nacionalidad),
    email: toOptionalString(processed.email),
    celular: toOptionalString(processed.celular),
    domicilio: toOptionalString(processed.domicilio),
    localidad: toOptionalString(processed.localidad),
    jerarquiaId: toOptionalString(processed.jerarquiaId),
    jerarquia: toOptionalString(processed.jerarquia),
    numeroCargo: toOptionalString(processed.numeroCargo),
    cargo: toOptionalString(processed.cargo),
    seccionId: toOptionalString(processed.seccionId),
    seccion: toOptionalString(processed.seccion),
    funcionDepto: toOptionalString(processed.funcionDepto),
    altaDependencia: toOptionalDate(processed.altaDependencia),
    altaReparticion: toOptionalString(processed.altaReparticion),
    altaDepartamental: toOptionalString(processed.altaDepartamental),
    bajaDependencia: toOptionalDate(processed.bajaDependencia),
    motivoBaja: toOptionalString(processed.motivoBaja),
    estadoServicio: toOptionalString(processed.estadoServicio) ?? 'ACTIVO',
    horarioLaboral: toOptionalString(processed.horarioLaboral),
    profesion: toOptionalString(processed.profesion),
    subsidioSalud: toOptionalString(processed.subsidioSalud),
    prontuario: toOptionalString(processed.prontuario),
    jurisdiccion: toOptionalString(processed.jurisdiccion),
    regional: toOptionalString(processed.regional),
    arma: toOptionalString(processed.arma),
    numeroArma: toOptionalString(processed.numeroArma),
    armaTipo: toOptionalString(processed.armaTipo),
    nroArma: toOptionalString(processed.nroArma),
    poseeChalecoAsignado: toOptionalBoolean(processed.poseeChalecoAsignado),
    nroSerieChalecoAsignado: toOptionalString(processed.nroSerieChalecoAsignado),
    poseeCarnetManejo: toOptionalBoolean(processed.poseeCarnetManejo),
    conduceAutos: toOptionalBoolean(processed.conduceAutos),
    conduceMotos: toOptionalBoolean(processed.conduceMotos),
    conduceOtros: toOptionalBoolean(processed.conduceOtros),
    poseeCredencialPolicial: toOptionalBoolean(processed.poseeCredencialPolicial),
    fotoUrl: toOptionalString(processed.fotoUrl),
    archivosAdjuntos: toJsonValue(processed.archivosAdjuntos),
    contactosAdicionales: toJsonValue(processed.contactosAdicionales),
    observaciones: toOptionalString(processed.observaciones),
    diasLicenciaAnuales: toOptionalNumber(processed.diasLicenciaAnuales),
    createdBy: usuarioId,
  };
}

function buildPersonalUpdateData(
  processed: Record<string, any>,
  usuarioId: number
): Prisma.PersonalUncheckedUpdateInput {
  return {
    ...processed,
    altaDependencia: toOptionalDate(processed.altaDependencia),
    bajaDependencia: toOptionalDate(processed.bajaDependencia),
    archivosAdjuntos:
      processed.archivosAdjuntos === undefined
        ? undefined
        : toJsonValue(processed.archivosAdjuntos),
    contactosAdicionales:
      processed.contactosAdicionales === undefined
        ? undefined
        : toJsonValue(processed.contactosAdicionales),
    diasLicenciaAnuales: toOptionalNumber(processed.diasLicenciaAnuales),
    updatedBy: usuarioId,
  };
}

function toOptionalString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

function toOptionalDate(value: unknown): Date | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  return value instanceof Date ? value : new Date(String(value));
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return (value ?? []) as Prisma.InputJsonValue;
}

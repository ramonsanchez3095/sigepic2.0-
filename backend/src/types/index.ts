import { Request } from 'express';

// ============================================
// Auth & User Types
// ============================================

export interface AuthUser {
  id: number;
  username: string;
  rol: UserRole;
  iat?: number;
  exp?: number;
}

export type UserRole = 'admin' | 'supervisor' | 'usuario' | 'auditor';

export type ResourceName =
  | 'personal'
  | 'jerarquia'
  | 'seccion'
  | 'usuario'
  | 'licencia'
  | 'auditoria'
  | 'reporte';

export type ActionName = 'create' | 'read' | 'update' | 'delete';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// ============================================
// Pagination
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// Personal Domain
// ============================================

export interface PersonalSearchParams extends PaginationParams {
  search?: string;
  tipoPersonal?: string;
  jerarquia?: string;
  seccion?: string;
  estadoServicio?: string;
}

export interface PersonalCreateData {
  apellidos: string;
  nombres: string;
  numeroAsignacion?: string;
  dni: string;
  cuil?: string;
  fechaNacimiento: string;
  estadoCivil?: string;
  sexo?: string;
  grupoSanguineo?: string;
  nacionalidad?: string;
  email?: string;
  celular?: string;
  domicilio?: string;
  localidad?: string;
  tipoPersonal: string;
  jerarquiaId?: string;
  jerarquia?: string;
  numeroCargo?: string;
  cargo?: string;
  seccionId?: string;
  seccion?: string;
  funcionDepto?: string;
  altaDependencia?: Date;
  altaReparticion?: string;
  altaDepartamental?: string;
  bajaDependencia?: Date;
  motivoBaja?: string;
  estadoServicio?: string;
  horarioLaboral?: string;
  profesion?: string;
  subsidioSalud?: string;
  prontuario?: string;
  jurisdiccion?: string;
  regional?: string;
  arma?: string;
  numeroArma?: string;
  armaTipo?: string;
  nroArma?: string;
  poseeChalecoAsignado?: boolean;
  nroSerieChalecoAsignado?: string;
  poseeCarnetManejo?: boolean;
  conduceAutos?: boolean;
  conduceMotos?: boolean;
  conduceOtros?: boolean;
  poseeCredencialPolicial?: boolean;
  fotoUrl?: string;
  archivosAdjuntos?: ArchivoAdjunto[];
  contactosAdicionales?: ContactoAdicional[];
  observaciones?: string;
  diasLicenciaAnuales?: number;
}

export interface ArchivoAdjunto {
  nombre: string;
  url: string;
  tipo: string;
  tamano: number;
  fecha: Date;
}

export interface ContactoAdicional {
  nombre: string;
  telefono?: string;
  relacion?: string;
}

// ============================================
// Licencia Domain
// ============================================

export type TipoLicencia =
  | 'LICENCIA_ORDINARIA'
  | 'LICENCIA_EXTRAORDINARIA'
  | 'LICENCIA_POR_ENFERMEDAD';

export type EstadoLicencia = 'APROBADA' | 'PENDIENTE' | 'RECHAZADA';

export interface LicenciaCreateData {
  tipo: TipoLicencia;
  fechaInicio: string | Date;
  fechaFin: string | Date;
  dias: number;
  anioLicencia: number;
  motivo?: string;
  observaciones?: string;
  estado?: EstadoLicencia;
}

export interface ResumenAnualLicencias {
  anio: number;
  diasLicenciaAnuales: number;
  diasUsados: number;
  diasRestantes: number;
  personal: {
    id: number;
    apellidos: string;
    nombres: string;
  };
}

// ============================================
// Auditoria Domain
// ============================================

export interface AuditoriaEntry {
  tabla: string;
  registroId: number;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  cambios: Record<string, unknown>;
  usuarioId: number;
  personalId?: number;
  ip?: string;
  userAgent?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiError {
  error: string;
  detalles?: Array<{ campo: string; mensaje: string }>;
  stack?: string;
}

export interface ApiSuccess<T = unknown> {
  data?: T;
  message?: string;
}

// ============================================
// Config Types
// ============================================

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

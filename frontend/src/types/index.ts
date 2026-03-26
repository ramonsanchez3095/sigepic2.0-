// ============================================
// Personal Domain Types
// ============================================

export type EstadoServicio =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'RETIRADO'
  | 'BAJA'
  | 'LICENCIA'
  | 'ART';
export type TipoPersonal = 'SUPERIOR' | 'SUBALTERNO';
export type Sexo = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export interface Personal {
  id: number;
  apellidos: string;
  nombres: string;
  numeroAsignacion?: string;
  dni: string;
  cuil?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  sexo?: Sexo;
  grupoSanguineo?: string;
  nacionalidad?: string;
  email?: string;
  celular?: string;
  domicilio?: string;
  localidad?: string;
  tipoPersonal: TipoPersonal;
  jerarquiaId?: string;
  jerarquia?: string;
  numeroCargo?: string;
  cargo?: string;
  seccionId?: string;
  seccion?: string;
  funcionDepto?: string;
  altaDependencia?: string;
  altaReparticion?: string;
  altaDepartamental?: string;
  bajaDependencia?: string;
  motivoBaja?: string;
  estadoServicio: EstadoServicio;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface ArchivoAdjunto {
  nombre: string;
  url: string;
  tipo: string;
  tamano: number;
  fecha: string;
}

export interface ContactoAdicional {
  nombre: string;
  telefono?: string;
  relacion?: string;
}

// ============================================
// Licencia Domain Types
// ============================================

export type TipoLicencia =
  | 'LICENCIA_ORDINARIA'
  | 'LICENCIA_EXTRAORDINARIA'
  | 'LICENCIA_POR_ENFERMEDAD';

export type EstadoLicencia = 'APROBADA' | 'PENDIENTE' | 'RECHAZADA';

export interface Licencia {
  id: number;
  personalId: number;
  tipo: TipoLicencia;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  anioLicencia: number;
  diasRestantes?: number;
  motivo?: string;
  observaciones?: string;
  estado: EstadoLicencia;
  createdAt?: string;
  updatedAt?: string;
  personal?: Pick<
    Personal,
    'id' | 'apellidos' | 'nombres' | 'diasLicenciaAnuales'
  >;
}

export interface ResumenAnualLicencias {
  anio: number;
  diasLicenciaAnuales: number;
  diasUsados: number;
  diasRestantes: number;
  personal: Pick<Personal, 'id' | 'apellidos' | 'nombres'>;
}

// ============================================
// Auth Types
// ============================================

export type UserRole = 'admin' | 'supervisor' | 'usuario' | 'auditor';

export interface User {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string;
  rol: UserRole;
  activo: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

// ============================================
// API Types
// ============================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  detalles?: Array<{ campo: string; mensaje: string }>;
}

// ============================================
// Jerarquia & Seccion
// ============================================

export interface Jerarquia {
  id: number;
  nombre: string;
  abreviatura?: string;
  tipo?: string;
  orden?: number;
}

export interface Seccion {
  id: number;
  nombre: string;
  descripcion?: string;
}

// ============================================
// Auditoria
// ============================================

export interface AuditoriaEntry {
  id: number;
  tabla: string;
  registroId: number;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  cambios: Record<string, unknown>;
  usuarioId: number;
  personalId?: number;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  usuario?: Pick<User, 'username' | 'nombreCompleto'>;
}

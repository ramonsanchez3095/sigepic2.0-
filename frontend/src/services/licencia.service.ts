import api from './api';
import type { AxiosResponse } from 'axios';
import type {
  Licencia,
  ResumenAnualLicencias,
  PaginatedResponse,
  Personal,
} from '../types';

export interface LicenciaListParams {
  anio?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LicenciaListResponse {
  data: Licencia[];
  personal: Pick<
    Personal,
    'id' | 'apellidos' | 'nombres' | 'diasLicenciaAnuales'
  >;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LicenciaCreateData {
  tipo: string;
  fechaInicio: string;
  fechaFin: string;
  dias: number;
  anioLicencia: number;
  motivo?: string;
  observaciones?: string;
  estado?: string;
}

export const licenciaService = {
  listar: (
    personalId: number | string,
    params?: LicenciaListParams
  ): Promise<AxiosResponse<LicenciaListResponse>> => {
    return api.get(`/personal/${personalId}/licencias`, { params });
  },

  resumenAnual: (
    personalId: number | string,
    anio?: number
  ): Promise<AxiosResponse<ResumenAnualLicencias>> => {
    return api.get(`/personal/${personalId}/licencias/resumen`, {
      params: { anio },
    });
  },

  obtenerPorId: (
    personalId: number | string,
    id: number | string
  ): Promise<AxiosResponse<Licencia>> => {
    return api.get(`/personal/${personalId}/licencias/${id}`);
  },

  crear: (
    personalId: number | string,
    datos: LicenciaCreateData
  ): Promise<
    AxiosResponse<
      Licencia & { diasRestantesAnio: number; advertencia: string | null }
    >
  > => {
    return api.post(`/personal/${personalId}/licencias`, datos);
  },

  actualizar: (
    personalId: number | string,
    id: number | string,
    datos: Partial<LicenciaCreateData>
  ): Promise<AxiosResponse<Licencia>> => {
    return api.put(`/personal/${personalId}/licencias/${id}`, datos);
  },

  eliminar: (
    personalId: number | string,
    id: number | string
  ): Promise<AxiosResponse<{ message: string }>> => {
    return api.delete(`/personal/${personalId}/licencias/${id}`);
  },
};

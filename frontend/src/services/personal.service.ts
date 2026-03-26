import api from './api';
import type { AxiosResponse } from 'axios';
import type { Personal, PaginatedResponse, AuditoriaEntry } from '../types';

export interface PersonalSearchParams {
  search?: string;
  tipoPersonal?: string;
  jerarquia?: string;
  seccion?: string;
  estadoServicio?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const personalService = {
  buscar: (
    params: PersonalSearchParams
  ): Promise<AxiosResponse<PaginatedResponse<Personal>>> => {
    return api.get('/personal', { params });
  },

  exportar: (params: PersonalSearchParams): Promise<AxiosResponse<Blob>> => {
    return api.get('/personal/exportar', { params, responseType: 'blob' });
  },

  obtenerPorId: (id: number | string): Promise<AxiosResponse<Personal>> => {
    return api.get(`/personal/${id}`);
  },

  crear: (datos: FormData): Promise<AxiosResponse<Personal>> => {
    return api.post('/personal', datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Alias for compatibility
  create: (datos: FormData): Promise<AxiosResponse<Personal>> => {
    return api.post('/personal', datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  actualizar: (
    id: number | string,
    datos: Partial<Personal>
  ): Promise<AxiosResponse<Personal>> => {
    return api.put(`/personal/${id}`, datos);
  },

  // Alias for compatibility
  update: (
    id: number | string,
    datos: Partial<Personal>
  ): Promise<AxiosResponse<Personal>> => {
    return api.put(`/personal/${id}`, datos);
  },

  eliminar: (
    id: number | string
  ): Promise<AxiosResponse<{ message: string }>> => {
    return api.delete(`/personal/${id}`);
  },

  estadisticas: (): Promise<
    AxiosResponse<{
      totalActivos: number;
      totalInactivos: number;
      porTipo: Array<{ tipoPersonal: string; _count: number }>;
      porJerarquia: Array<{ jerarquia: string; _count: number }>;
      porSeccion: Array<{ seccion: string; _count: number }>;
    }>
  > => {
    return api.get('/personal/estadisticas');
  },

  subirFoto: (
    id: number | string,
    formData: FormData
  ): Promise<AxiosResponse<{ fotoUrl: string }>> => {
    return api.post(`/personal/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  subirArchivos: (
    id: number | string,
    formData: FormData
  ): Promise<AxiosResponse<{ archivos: any[] }>> => {
    return api.post(`/personal/${id}/archivos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  obtenerHistorial: (
    id: number | string
  ): Promise<AxiosResponse<AuditoriaEntry[]>> => {
    return api.get(`/personal/${id}/historial`);
  },

  // Alias for compatibility
  getById: (id: number | string): Promise<AxiosResponse<Personal>> => {
    return api.get(`/personal/${id}`);
  },
};

import api from './api';

export const licenciaService = {
  listar: async (personalId, params) => {
    return await api.get(`/personal/${personalId}/licencias`, { params });
  },

  resumenAnual: async (personalId, anio) => {
    return await api.get(`/personal/${personalId}/licencias/resumen`, {
      params: { anio },
    });
  },

  obtenerPorId: async (personalId, id) => {
    return await api.get(`/personal/${personalId}/licencias/${id}`);
  },

  crear: async (personalId, datos) => {
    return await api.post(`/personal/${personalId}/licencias`, datos);
  },

  actualizar: async (personalId, id, datos) => {
    return await api.put(`/personal/${personalId}/licencias/${id}`, datos);
  },

  eliminar: async (personalId, id) => {
    return await api.delete(`/personal/${personalId}/licencias/${id}`);
  },
};

import api from './api';
import type { AxiosResponse } from 'axios';
import type { AuthResponse, User } from '../types';

export const authService = {
  login: (
    username: string,
    password: string
  ): Promise<AxiosResponse<AuthResponse>> => {
    return api.post('/auth/login', { username, password });
  },

  logout: (): Promise<AxiosResponse<void>> => {
    return api.post('/auth/logout');
  },

  cambiarPassword: (
    passwordActual: string,
    passwordNueva: string
  ): Promise<AxiosResponse<{ message: string }>> => {
    return api.post('/auth/cambiar-password', {
      passwordActual,
      passwordNueva,
    });
  },

  getPerfil: (): Promise<AxiosResponse<User>> => {
    return api.get('/auth/perfil');
  },
};

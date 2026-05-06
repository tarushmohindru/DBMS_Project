import axios, { AxiosInstance, AxiosResponse } from 'axios';

function getDefaultBaseUrl() {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
  }
  return 'http://localhost:3001/api';
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || getDefaultBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ccm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error) => {
    const isLoginRequest = error.config?.url === '/auth/login';
    if (error.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      localStorage.removeItem('ccm_token');
      localStorage.removeItem('ccm_user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;

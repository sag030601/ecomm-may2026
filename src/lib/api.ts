import axios, { type InternalAxiosRequestConfig } from 'axios';
import { saveIntendedRoute } from '@/lib/intendedRoute';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

const processQueue = (token: string | null) => {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/oauth/exchange');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
          { withCredentials: true }
        );
        const { accessToken, user } = data;
        useAuthStore.getState().setAuth(user, accessToken, data.refreshToken);
        processQueue(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        processQueue(null);
        useAuthStore.getState().clearAuth();
        if (!window.location.pathname.includes('/login')) {
          saveIntendedRoute(
            `${window.location.pathname}${window.location.search}${window.location.hash}`
          );
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

export const getApiBaseUrl = () => import.meta.env.VITE_API_URL || '/api';

export const getOAuthUrl = (provider: string, clientRedirect?: string) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const base = apiUrl.replace(/\/api\/?$/, '');
  const url = new URL(`${base}/api/auth/oauth/${provider}`);
  if (clientRedirect) {
    url.searchParams.set('redirect', clientRedirect);
  }
  return url.toString();
};

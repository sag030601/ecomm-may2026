import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import api from '@/lib/api';
import { flowLog } from '@/lib/flowLogger';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  logout: (allDevices?: boolean) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  isAdmin: () => boolean;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken: refreshToken ?? get().refreshToken });
        flowLog('auth-state-change', { event: 'set-auth', userId: user.id });
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        flowLog('auth-state-change', { event: 'clear-auth' });
      },

      logout: async (allDevices = false) => {
        try {
          if (allDevices) {
            await api.post('/auth/logout-all');
          } else {
            await api.post('/auth/logout');
          }
        } catch {
          // Clear local state even if API call fails
        } finally {
          get().clearAuth();
        }
      },

      refreshSession: async () => {
        try {
          const refreshToken = get().refreshToken;
          const { data } = await api.post<{ accessToken: string; refreshToken?: string; user: User }>(
            '/auth/refresh',
            refreshToken ? { refreshToken } : {}
          );
          get().setAuth(data.user, data.accessToken, data.refreshToken);
          return true;
        } catch {
          get().clearAuth();
          return false;
        }
      },

      isAdmin: () => get().user?.role === 'admin',
      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { waitForStoreHydration } from '@/lib/storeHydration';
import { flowLog } from '@/lib/flowLogger';
import api from '@/lib/api';

const PUBLIC_PATHS = [
  '/',
  '/products',
  '/cart',
  '/login',
  '/register',
  '/auth/callback',
];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/products/'));

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const location = useLocation();
  const { accessToken, setAuth, clearAuth } = useAuthStore();
  const isPublic = isPublicPath(location.pathname);

  useEffect(() => {
    const bootstrap = async () => {
      await waitForStoreHydration();

      if (location.pathname === '/auth/callback') {
        setReady(true);
        return;
      }

      try {
        if (accessToken) {
          const { data } = await api.get('/auth/me');
          setAuth(data.user, accessToken);
          flowLog('auth-state-change', { event: 'session-restored', userId: data.user.id });
        } else {
          const refreshed = await useAuthStore.getState().refreshSession();
          if (!refreshed) clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setReady(true);
      }
    };

    bootstrap();
  }, []);

  if (!ready && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

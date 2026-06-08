import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { accessToken, setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        if (accessToken) {
          const { data } = await api.get('/auth/me');
          setAuth(data.user, accessToken);
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}

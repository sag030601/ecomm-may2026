import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { completePostAuthFlow } from '@/lib/authFlow';
import { flowLog } from '@/lib/flowLogger';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

type ExchangeResult = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

const exchangePromises = new Map<string, Promise<ExchangeResult>>();

function exchangeOAuthCode(code: string): Promise<ExchangeResult> {
  const existing = exchangePromises.get(code);
  if (existing) return existing;

  const promise = api
    .post<ExchangeResult>('/auth/oauth/exchange', { code })
    .then(({ data }) => data)
    .finally(() => {
      setTimeout(() => exchangePromises.delete(code), 60_000);
    });

  exchangePromises.set(code, promise);
  return promise;
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState('Completing sign in...');

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');
      if (error) {
        toast.error('OAuth sign in failed');
        navigate('/login', { replace: true });
        return;
      }

      const code = searchParams.get('code');
      if (!code) {
        toast.error('Missing authorization code');
        navigate('/login', { replace: true });
        return;
      }

      setStatus('Establishing session...');
      try {
        const data = await exchangeOAuthCode(code);
        setAuth(data.user, data.accessToken, data.refreshToken);
        flowLog('auth-state-change', { event: 'oauth-login', userId: data.user.id });
        toast.success('Signed in successfully');

        setStatus('Syncing your cart...');
        await completePostAuthFlow({
          navigate,
          user: data.user,
          redirectParam: searchParams.get('redirect'),
          queryClient,
        });
      } catch {
        toast.error('Failed to complete sign in');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, queryClient, searchParams, setAuth]);

  return (
    <div className="container-custom py-24 flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}

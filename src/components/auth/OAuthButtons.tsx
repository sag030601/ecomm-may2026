import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import api, { getOAuthUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type OAuthProvider = 'google' | 'github' | 'microsoft';

interface OAuthConfig {
  google: boolean;
  github: boolean;
  microsoft: boolean;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

interface OAuthButtonsProps {
  className?: string;
  showDivider?: boolean;
}

export function OAuthButtons({ className, showDivider = true }: OAuthButtonsProps) {
  const [config, setConfig] = useState<OAuthConfig>({ google: false, github: false, microsoft: false });
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ oauth: OAuthConfig }>('/config')
      .then(({ data }) => {
        if (data.oauth) {
          setConfig(data.oauth);
        } else {
          const providers = (data as { oauthProviders?: OAuthProvider[] }).oauthProviders || [];
          setConfig({
            google: providers.includes('google'),
            github: providers.includes('github'),
            microsoft: providers.includes('microsoft'),
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleOAuth = (provider: OAuthProvider) => {
    const isConfigured = config[provider];
    if (!isConfigured) {
      toast.error(
        provider === 'google'
          ? 'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend .env and restart the server.'
          : `${provider} sign-in is not configured yet.`
      );
      return;
    }

    setLoading(provider);
    window.location.href = getOAuthUrl(provider);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3 font-medium border-input bg-background hover:bg-muted/50"
        onClick={() => handleOAuth('google')}
        disabled={loading !== null}
      >
        {loading === 'google' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        Continue with Google
      </Button>

      {(config.github || config.microsoft) && (
        <div className="grid grid-cols-1 gap-2">
          {config.github && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 gap-2"
              onClick={() => handleOAuth('github')}
              disabled={loading !== null}
            >
              {loading === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitHubIcon className="h-4 w-4" />}
              GitHub
            </Button>
          )}
          {config.microsoft && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 gap-2"
              onClick={() => handleOAuth('microsoft')}
              disabled={loading !== null}
            >
              {loading === 'microsoft' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicrosoftIcon className="h-4 w-4" />}
              Microsoft
            </Button>
          )}
        </div>
      )}

      {showDivider && (
        <div className="relative py-1">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground uppercase tracking-wide">
            or continue with email
          </span>
        </div>
      )}
    </div>
  );
}

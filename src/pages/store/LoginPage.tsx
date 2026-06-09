import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import { completePostAuthFlow } from '@/lib/authFlow';
import { resolveLoginReturnPath } from '@/lib/intendedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const returnPath = resolveLoginReturnPath(
    location.state as { from?: { pathname: string; search?: string; hash?: string } } | null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleAuthSuccess = async (user: User, accessToken: string, refreshToken?: string) => {
    setAuth(user, accessToken, refreshToken);
    toast.success('Welcome back!');
    await completePostAuthFlow({
      navigate,
      user,
      redirectParam: returnPath,
      queryClient,
    });
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken?: string;
        user: User;
      }>('/auth/login', data);
      await handleAuthSuccess(response.data.user, response.data.accessToken, response.data.refreshToken);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 to-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ShoppingBag className="h-7 w-7" />
          LUXE
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Welcome back to<br />premium shopping
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Sign in to track orders, save addresses, and checkout faster.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/60">
          Secure login with Google or email
        </p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md border-0 shadow-none lg:shadow-sm lg:border">
          <CardHeader className="text-center lg:text-left px-0 lg:px-6">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Choose your preferred sign in method</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 px-0 lg:px-6">
              <OAuthButtons redirectTo={returnPath} />

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className="mt-1.5 h-11"
                />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className="mt-1.5 h-11"
                />
                {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 px-0 lg:px-6">
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</>
                ) : (
                  'Sign in with Email'
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

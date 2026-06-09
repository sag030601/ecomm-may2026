import type { NavigateFunction } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cartStore';
import { getAndClearIntendedRoute } from '@/lib/intendedRoute';
import { resolvePostAuthRedirect } from '@/lib/safeRedirect';
import { flowLog } from '@/lib/flowLogger';
import type { User } from '@/types';

export async function completePostAuthFlow(options: {
  navigate: NavigateFunction;
  user: User;
  redirectParam?: string | null;
  queryClient?: QueryClient;
}): Promise<void> {
  const fromStorage = getAndClearIntendedRoute();
  const fromParam = options.redirectParam
    ? resolvePostAuthRedirect(options.redirectParam)
    : null;
  const intended = fromParam && fromParam !== '/' ? fromParam : fromStorage;

  flowLog('pre-login-route', { fromStorage, fromParam, intended });
  flowLog('cart-before-login', { items: useCartStore.getState().items });

  const cartResult = await useCartStore.getState().validateAndSync();

  flowLog('cart-merge-result', cartResult);
  flowLog('cart-after-login', { items: cartResult.after });

  if (cartResult.removed.length > 0) {
    toast.warning(
      `${cartResult.removed.length} item(s) were removed — no longer available.`
    );
  } else if (cartResult.updated.length > 0) {
    toast.info('Your cart was updated with the latest prices and stock.');
  }

  options.queryClient?.invalidateQueries({ queryKey: ['product'] });
  options.queryClient?.invalidateQueries({ queryKey: ['products'] });

  const destination = options.user.role === 'admin' ? '/admin' : intended;
  flowLog('post-login-route', { destination });

  options.navigate(destination, { replace: true });
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import type { Order } from '@/types';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((state) => state.clearCart);
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const confirmingRef = useRef(false);

  const confirmPayment = useCallback(async () => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    setStatus('loading');

    try {
      const { data } = await api.post<{ order: Order }>('/orders/confirm-checkout', {
        sessionId,
      });
      clearCart();
      setOrderId(data.order._id);
      setStatus('success');
      toast.success('Payment successful!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Could not confirm payment';

      if (message.toLowerCase().includes('already') || message.toLowerCase().includes('paid')) {
        clearCart();
        setStatus('success');
        toast.success('Payment already confirmed!');
        return;
      }

      setStatus('error');
      toast.error(message);
    } finally {
      confirmingRef.current = false;
    }
  }, [sessionId, clearCart]);

  useEffect(() => {
    confirmPayment();
  }, [confirmPayment]);

  if (status === 'loading') {
    return (
      <div className="container-custom py-24 flex flex-col items-center gap-4 text-center max-w-md mx-auto">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Confirming your payment</h1>
        <p className="text-muted-foreground text-sm">
          Please wait while we verify your payment with Stripe. Do not close this page.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container-custom py-24 text-center max-w-md mx-auto">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment confirmation issue</h1>
        <p className="text-muted-foreground mb-6">
          Your payment may have gone through on Stripe. Try confirming again, or check your order history.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={confirmPayment} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry confirmation
          </Button>
          <Button asChild variant="outline">
            <Link to="/profile?tab=orders">View Orders</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/checkout">Back to Checkout</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-24 text-center max-w-md mx-auto">
      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Thank you for your order!</h1>
      <p className="text-muted-foreground mb-6">Your payment was successful and your order is confirmed.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderId && (
          <Button onClick={() => navigate(`/orders/${orderId}`)}>View Order Details</Button>
        )}
        <Button asChild variant="outline">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

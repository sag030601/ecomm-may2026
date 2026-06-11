import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
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

  useEffect(() => {
    const confirmPayment = async () => {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const { data } = await api.post<{ order: Order }>('/orders/confirm-checkout', {
          sessionId,
        });
        clearCart();
        setOrderId(data.order._id);
        setStatus('success');
        toast.success('Payment successful!');
      } catch {
        setStatus('error');
        toast.error('Could not confirm your payment. Please check your orders or contact support.');
      }
    };

    confirmPayment();
  }, [sessionId, clearCart]);

  if (status === 'loading') {
    return (
      <div className="container-custom py-24 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Confirming your payment...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container-custom py-24 text-center max-w-md mx-auto">
        <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment confirmation issue</h1>
        <p className="text-muted-foreground mb-6">
          Your payment may have gone through. Check your order history or contact support if you were charged.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/profile?tab=orders">View Orders</Link>
          </Button>
          <Button asChild>
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
      <Button onClick={() => navigate(`/orders/${orderId}`)}>View Order Details</Button>
    </div>
  );
}

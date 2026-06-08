import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { CreditCard, Banknote, Tag, Loader2, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/images';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import type { Order } from '@/types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const shippingSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().default('US'),
  notes: z.string().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

function StripePaymentForm({
  orderId,
  onSuccess,
}: {
  orderId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await api.post(`/orders/${orderId}/confirm-payment`);
        onSuccess();
      } catch {
        toast.error('Payment received but order confirmation failed. Please contact support.');
      }
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4 mt-6">
      <PaymentElement />
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || processing}>
        {processing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
}

function DemoPaymentForm({
  orderId,
  total,
  onSuccess,
}: {
  orderId: string;
  total: number;
  onSuccess: () => void;
}) {
  const [processing, setProcessing] = useState(false);

  const handleDemoPay = async () => {
    setProcessing(true);
    try {
      await api.post(`/orders/${orderId}/demo-payment`);
      onSuccess();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Demo payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground mb-1">
          <Sparkles className="h-4 w-4" />
          Demo Stripe Payment
        </div>
        Stripe is not configured, so this simulates a successful card payment without charging a real card.
      </div>
      <Button type="button" className="w-full" size="lg" onClick={handleDemoPay} disabled={processing}>
        {processing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
        ) : (
          `Simulate Payment Success — ${formatPrice(total)}`
        )}
      </Button>
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();
  const shippingCost = subtotal >= 100 ? 0 : 9.99;

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cod'>('stripe');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: { country: 'US' },
  });

  const total = Math.max(0, subtotal - discount + shippingCost);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data } = await api.post<{ discount: number; coupon: { code: string } }>(
        '/coupons/validate',
        { code: couponCode.trim(), subtotal }
      );
      setDiscount(data.discount);
      setCouponApplied(data.coupon.code);
      toast.success(`Coupon applied! You save ${formatPrice(data.discount)}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setDiscount(0);
      setCouponApplied('');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const onSubmit = async (formData: ShippingFormData) => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const { notes, ...shippingAddress } = formData;
      const { data } = await api.post<{ order: Order; clientSecret?: string; demoMode?: boolean }>('/orders', {
        items: items.map((item) => ({
          product: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod,
        couponCode: couponApplied || undefined,
        notes,
      });

      if (paymentMethod === 'stripe' && data.demoMode) {
        setDemoMode(true);
        setPendingOrderId(data.order._id);
        toast.success('Order created. Complete demo payment below.');
      } else if (paymentMethod === 'stripe' && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPendingOrderId(data.order._id);
        toast.success('Order created. Complete your payment below.');
      } else {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${data.order._id}`);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    clearCart();
    toast.success('Payment successful!');
    navigate(`/orders/${pendingOrderId}`);
  };

  if (items.length === 0 && !clientSecret && !demoMode) {
    return (
      <div className="container-custom py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Nothing to checkout</h1>
        <p className="text-muted-foreground mb-6">Add items to your cart first.</p>
        <Button asChild><Link to="/products">Browse Products</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 md:py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {!clientSecret && !demoMode ? (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <section className="border rounded-lg p-6">
                  <h2 className="font-semibold text-lg mb-4">Shipping Address</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input id="street" {...register('street')} className="mt-1" />
                      {errors.street && <p className="text-sm text-destructive mt-1">{errors.street.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...register('city')} className="mt-1" />
                      {errors.city && <p className="text-sm text-destructive mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input id="state" {...register('state')} className="mt-1" />
                      {errors.state && <p className="text-sm text-destructive mt-1">{errors.state.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input id="zipCode" {...register('zipCode')} className="mt-1" />
                      {errors.zipCode && <p className="text-sm text-destructive mt-1">{errors.zipCode.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" {...register('country')} className="mt-1" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="notes">Order Notes (optional)</Label>
                      <Textarea id="notes" {...register('notes')} className="mt-1" rows={3} />
                    </div>
                  </div>
                </section>

                <section className="border rounded-lg p-6">
                  <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5" /> Coupon Code
                  </h2>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={!!couponApplied}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateCoupon}
                      disabled={validatingCoupon || !!couponApplied}
                    >
                      {validatingCoupon ? 'Validating...' : couponApplied ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
                  {couponApplied && (
                    <p className="text-sm text-green-600 mt-2">
                      Coupon {couponApplied} applied — saving {formatPrice(discount)}
                    </p>
                  )}
                </section>

                <section className="border rounded-lg p-6">
                  <h2 className="font-semibold text-lg mb-4">Payment Method</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={cn(
                        'flex items-center gap-3 p-4 border rounded-lg transition-colors text-left',
                        paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Credit / Debit Card</p>
                        <p className="text-sm text-muted-foreground">Secure payment via Stripe</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={cn(
                        'flex items-center gap-3 p-4 border rounded-lg transition-colors text-left',
                        paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      )}
                    >
                      <Banknote className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Cash on Delivery</p>
                        <p className="text-sm text-muted-foreground">Pay when you receive</p>
                      </div>
                    </button>
                  </div>
                </section>

                <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...</>
                  ) : paymentMethod === 'cod' ? (
                    `Place Order — ${formatPrice(total)}`
                  ) : (
                    'Continue to Payment'
                  )}
                </Button>
              </form>
            </>
          ) : demoMode ? (
            <section className="border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-2">Complete Payment</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Total: {formatPrice(total)}
              </p>
              <DemoPaymentForm
                orderId={pendingOrderId!}
                total={total}
                onSuccess={handlePaymentSuccess}
              />
            </section>
          ) : (
            <section className="border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-2">Complete Payment</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Total: {formatPrice(total)}
              </p>
              <Elements stripe={stripePromise} options={{ clientSecret: clientSecret! }}>
                <StripePaymentForm orderId={pendingOrderId!} onSuccess={handlePaymentSuccess} />
              </Elements>
            </section>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 text-sm">
                  <img
                    src={getProductImage(item.image)}
                    alt={item.name}
                    className="w-14 h-14 rounded object-cover bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.size}{item.color ? ` · ${item.color}` : ''} × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

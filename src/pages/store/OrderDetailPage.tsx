import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, CreditCard, Package } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { Order } from '@/types';

const orderStatusVariant: Record<Order['orderStatus'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'secondary',
  processing: 'secondary',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

const paymentStatusVariant: Record<Order['paymentStatus'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  paid: 'default',
  failed: 'destructive',
  refunded: 'secondary',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get<{ order: Order }>(`/orders/${id}`);
      return data.order;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container-custom py-8 md:py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container-custom py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn&apos;t find this order.</p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          <Button asChild><Link to="/profile">Back to Profile</Link></Button>
        </div>
      </div>
    );
  }

  const couponCode = typeof order.coupon === 'object' && order.coupon?.code ? order.coupon.code : null;

  return (
    <div className="container-custom py-8 md:py-12">
      <Button variant="ghost" size="sm" className="mb-6 gap-1 -ml-2" asChild>
        <Link to="/profile">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
          <p className="text-muted-foreground mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={orderStatusVariant[order.orderStatus]} className="capitalize">
            {order.orderStatus}
          </Badge>
          <Badge variant={paymentStatusVariant[order.paymentStatus]} className="capitalize">
            Payment: {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="border rounded-lg p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" /> Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <OptimizedImage
                    src={item.image}
                    preset="cart"
                    alt={item.name}
                    className="w-20 h-20 rounded-md object-cover bg-muted shrink-0"
                    responsive={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Size: {item.size}
                      {item.color && ` · Color: ${item.color}`}
                    </p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.price)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {order.notes && (
            <section className="border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-2">Order Notes</h2>
              <p className="text-muted-foreground">{order.notes}</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="border rounded-lg p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" /> Shipping Address
            </h2>
            <address className="text-sm text-muted-foreground not-italic leading-relaxed">
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}<br />
              {order.shippingAddress.country}
            </address>
          </section>

          <section className="border rounded-lg p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5" /> Payment
            </h2>
            <p className="text-sm text-muted-foreground">Credit / Debit Card (Stripe)</p>
          </section>

          <section className="border rounded-lg p-6">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount{couponCode ? ` (${couponCode})` : ''}</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

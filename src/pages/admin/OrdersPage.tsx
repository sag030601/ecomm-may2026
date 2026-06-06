import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Order } from '@/types';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

const orderStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

const paymentStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  failed: 'destructive',
  refunded: 'outline',
};

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await api.get<{ orders: Order[] }>('/orders/admin/all', {
        params: { limit: 100 },
      });
      return data.orders;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, orderStatus }: { id: string; orderStatus: string }) =>
      api.patch(`/orders/${id}/status`, { orderStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update order status'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Order #</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Items</th>
                  <th className="px-4 py-3 text-left font-medium">Payment</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {!orders?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const customer =
                      typeof order.user === 'object' ? order.user : null;
                    return (
                      <tr key={order._id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                        <td className="px-4 py-3">
                          {customer ? (
                            <div>
                              <div>{customer.name}</div>
                              <div className="text-xs text-muted-foreground">{customer.email}</div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">{order.items.length}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Badge variant={paymentStatusVariant[order.paymentStatus] ?? 'outline'}>
                              {order.paymentStatus}
                            </Badge>
                            <div className="text-xs text-muted-foreground uppercase">
                              {order.paymentMethod}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={order.orderStatus}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({ id: order._id, orderStatus: value })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <SelectValue>
                                <Badge variant={orderStatusVariant[order.orderStatus] ?? 'outline'}>
                                  {order.orderStatus}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatPrice(order.total)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

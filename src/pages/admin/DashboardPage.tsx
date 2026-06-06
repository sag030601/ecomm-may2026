import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Clock,
  Star,
} from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { StatCard } from '@/components/admin/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats, Order } from '@/types';

interface MonthlySale {
  _id: string;
  revenue: number;
  orders: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentOrders: Order[];
  monthlySales: MonthlySale[];
}

const orderStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  processing: 'default',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get<DashboardResponse>('/admin/dashboard');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
      </div>
    );
  }

  const { stats, recentOrders, monthlySales } = data;
  const chartData = monthlySales.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    orders: item.orders,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Revenue"
          value={formatPrice(stats.totalRevenue)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          description="Awaiting processing"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          description="Need moderation"
          icon={<Star className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No sales data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value: string) => {
                    const [, month, day] = value.split('-');
                    return `${month}/${day}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'revenue' ? formatPrice(value) : value
                  }
                  labelFormatter={(label) => formatDate(label)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Order</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No orders yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
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
                        <td className="px-4 py-3">
                          <Badge variant={orderStatusVariant[order.orderStatus] ?? 'outline'}>
                            {order.orderStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              order.paymentStatus === 'paid'
                                ? 'default'
                                : order.paymentStatus === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                          >
                            {order.paymentStatus}
                          </Badge>
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
        </CardContent>
      </Card>
    </div>
  );
}

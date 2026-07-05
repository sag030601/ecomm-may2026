import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import api from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SalesByDay {
  _id: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  _id: string;
  name: string;
  totalSold: number;
  revenue: number;
}

interface OrdersByStatus {
  _id: string;
  count: number;
}

interface AnalyticsResponse {
  salesByDay: SalesByDay[];
  topProducts: TopProduct[];
  ordersByStatus: OrdersByStatus[];
  revenueByCategory: { _id: string; revenue: number }[];
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
  'hsl(0 84% 60%)',
  'hsl(262 83% 58%)',
  'hsl(199 89% 48%)',
];

const PERIODS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsResponse>('/admin/analytics', {
        params: { period },
      });
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      </div>
    );
  }

  const salesChartData = data.salesByDay.map((item) => ({
    date: item._id,
    revenue: item.revenue,
    orders: item.orders,
  }));

  const topProductsData = data.topProducts.map((p) => ({
    name: p.name.length > 20 ? `${p.name.slice(0, 20)}…` : p.name,
    sold: p.totalSold,
    revenue: p.revenue,
  }));

  const ordersPieData = data.ordersByStatus.map((item) => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count,
  }));

  const categoryRevenueData = data.revenueByCategory.map((item) => ({
    name: item._id,
    revenue: item.revenue,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Sales and performance insights</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales by Day</CardTitle>
          </CardHeader>
          <CardContent>
            {salesChartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No sales data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const [, m, d] = v.split('-');
                      return `${m}/${d}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? formatPrice(value) : value
                    }
                    labelFormatter={(label) => formatDate(label)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(142 76% 36%)"
                    strokeWidth={2}
                    dot={false}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersPieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No order data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {ordersPieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No product data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? formatPrice(value) : value
                    }
                  />
                  <Legend />
                  <Bar dataKey="sold" fill="hsl(var(--primary))" name="Units Sold" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" fill="hsl(142 76% 36%)" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryRevenueData.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No category data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value: number) => formatPrice(value)} />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    name="Revenue"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import type { User } from '@/types';

export default function CustomersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data } = await api.get<{ users: User[]; count: number }>('/admin/customers');
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Registered customer accounts</p>
        </div>
        {data && (
          <Card>
            <CardContent className="flex items-center gap-2 py-3 px-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{data.count} total</span>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            Failed to load customers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Phone</th>
                  <th className="px-4 py-3 text-left font-medium">Addresses</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {!data?.users.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  data.users.map((user) => (
                    <tr key={user._id ?? user.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.phone || '—'}</td>
                      <td className="px-4 py-3">{user.addresses?.length ?? 0}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{user.role}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

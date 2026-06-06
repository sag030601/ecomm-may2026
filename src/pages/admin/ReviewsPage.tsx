import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product, Review, User } from '@/types';

type ReviewWithProduct = Omit<Review, 'product' | 'user'> & {
  product: Product | string;
  user: User | string;
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

function getProductName(product: Product | string): string {
  if (typeof product === 'object') return product.name;
  return 'Unknown Product';
}

function getProductImage(product: Product | string): string | undefined {
  if (typeof product === 'object') return product.images?.[0];
  return undefined;
}

function getUserName(user: User | string): string {
  if (typeof user === 'object') return user.name;
  return 'Unknown';
}

function getUserEmail(user: User | string): string {
  if (typeof user === 'object') return user.email;
  return '';
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const { data } = await api.get<{ reviews: ReviewWithProduct[] }>(
        '/reviews/admin/all',
        { params }
      );
      return data.reviews;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      api.patch(`/reviews/${id}/status`, { status }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success(`Review ${status}`);
    },
    onError: () => toast.error('Failed to update review'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted');
    },
    onError: () => toast.error('Failed to delete review'),
  });

  const pendingCount = reviews?.filter((r) => r.status === 'pending').length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            Moderate customer reviews
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Customer</th>
                  <th className="px-4 py-3 text-left font-medium">Rating</th>
                  <th className="px-4 py-3 text-left font-medium">Review</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!reviews?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  reviews.map((review) => {
                    const image = getProductImage(review.product);
                    return (
                      <tr key={review._id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {image && (
                              <img
                                src={image}
                                alt=""
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <span className="font-medium max-w-[120px] truncate">
                              {getProductName(review.product)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{getUserName(review.user)}</div>
                          <div className="text-xs text-muted-foreground">
                            {getUserEmail(review.user)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground/30'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {review.title && (
                            <div className="font-medium text-xs">{review.title}</div>
                          )}
                          <div className="text-muted-foreground line-clamp-2">
                            {review.comment}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[review.status] ?? 'outline'}>
                            {review.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {review.status !== 'approved' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600"
                                title="Approve"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: review._id,
                                    status: 'approved',
                                  })
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {review.status !== 'rejected' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                title="Reject"
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: review._id,
                                    status: 'rejected',
                                  })
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              title="Delete"
                              onClick={() => {
                                if (confirm('Delete this review?')) {
                                  deleteMutation.mutate(review._id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

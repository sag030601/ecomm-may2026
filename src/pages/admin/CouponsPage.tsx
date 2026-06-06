import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Coupon } from '@/types';

const couponSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().min(0),
  maxDiscount: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().min(1),
  expiresAt: z.string().min(1, 'Expiry date is required'),
  isActive: z.boolean(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

const defaultValues: CouponFormValues = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscount: undefined,
  usageLimit: 100,
  expiresAt: '',
  isActive: true,
};

function couponToForm(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    description: coupon.description ?? '',
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minOrderAmount: coupon.minOrderAmount,
    maxDiscount: coupon.maxDiscount,
    usageLimit: coupon.usageLimit,
    expiresAt: coupon.expiresAt.slice(0, 10),
    isActive: coupon.isActive,
  };
}

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data } = await api.get<{ coupons: Coupon[] }>('/coupons');
      return data.coupons;
    },
  });

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CouponFormValues) => api.post('/coupons', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created');
      closeDialog();
    },
    onError: () => toast.error('Failed to create coupon'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CouponFormValues }) =>
      api.patch(`/coupons/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon updated');
      closeDialog();
    },
    onError: () => toast.error('Failed to update coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
    onError: () => toast.error('Failed to delete coupon'),
  });

  const openCreate = () => {
    setEditingCoupon(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.reset(couponToForm(coupon));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCoupon(null);
    form.reset(defaultValues);
  };

  const onSubmit = (values: CouponFormValues) => {
    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon._id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const discountType = form.watch('discountType');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Coupon
        </Button>
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
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Discount</th>
                  <th className="px-4 py-3 text-left font-medium">Min Order</th>
                  <th className="px-4 py-3 text-left font-medium">Usage</th>
                  <th className="px-4 py-3 text-left font-medium">Expires</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!coupons?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No coupons found.
                    </td>
                  </tr>
                ) : (
                  coupons.map((coupon) => {
                    const isExpired = new Date(coupon.expiresAt) < new Date();
                    return (
                      <tr key={coupon._id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-mono font-medium">{coupon.code}</div>
                          {coupon.description && (
                            <div className="text-xs text-muted-foreground">{coupon.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}%`
                            : `$${coupon.discountValue}`}
                        </td>
                        <td className="px-4 py-3">${coupon.minOrderAmount}</td>
                        <td className="px-4 py-3">
                          {coupon.usedCount} / {coupon.usageLimit}
                        </td>
                        <td className="px-4 py-3">
                          <span className={isExpired ? 'text-destructive' : ''}>
                            {formatDate(coupon.expiresAt)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              !coupon.isActive || isExpired ? 'outline' : 'default'
                            }
                          >
                            {!coupon.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Delete this coupon?')) {
                                  deleteMutation.mutate(coupon._id);
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

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" className="uppercase" {...form.register('code')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} {...form.register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Controller
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Value</Label>
                <Input
                  id="discountValue"
                  type="number"
                  step="0.01"
                  {...form.register('discountValue')}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderAmount">Min Order ($)</Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  {...form.register('minOrderAmount')}
                />
              </div>
              {discountType === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Max Discount ($)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    {...form.register('maxDiscount')}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input id="usageLimit" type="number" {...form.register('usageLimit')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires</Label>
                <Input id="expiresAt" type="date" {...form.register('expiresAt')} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...form.register('isActive')} />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

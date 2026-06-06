import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Category, SizeVariant } from '@/types';

interface InventoryItem {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  category: Category | string;
  sizes: SizeVariant[];
  totalStock: number;
}

const inventorySchema = z.object({
  sizes: z.array(
    z.object({
      size: z.string(),
      stock: z.coerce.number().min(0),
      sku: z.string().optional(),
    })
  ),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await api.get<{ inventory: InventoryItem[] }>('/products/inventory');
      return data.inventory;
    },
  });

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: { sizes: [] },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, sizes }: { id: string; sizes: SizeVariant[] }) =>
      api.patch(`/products/${id}/inventory`, { sizes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Inventory updated');
      setEditingItem(null);
    },
    onError: () => toast.error('Failed to update inventory'),
  });

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    form.reset({
      sizes: item.sizes.map((s) => ({
        size: s.size,
        stock: s.stock,
        sku: s.sku ?? '',
      })),
    });
  };

  const onSubmit = (values: InventoryFormValues) => {
    if (!editingItem) return;
    updateMutation.mutate({
      id: editingItem._id,
      sizes: values.sizes.map((s) => ({
        size: s.size,
        stock: s.stock,
        sku: s.sku || undefined,
      })),
    });
  };

  const lowStockCount = inventory?.filter((item) => item.totalStock < 10).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">
          Manage stock levels per size variant
          {lowStockCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {lowStockCount} low stock
            </Badge>
          )}
        </p>
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
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Variants</th>
                  <th className="px-4 py-3 text-left font-medium">Total Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!inventory?.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No inventory data.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => {
                    const categoryName =
                      typeof item.category === 'object' ? item.category.name : '—';
                    return (
                      <tr key={item._id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            )}
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{categoryName}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.sizes.map((s) => (
                              <Badge
                                key={s.size}
                                variant={s.stock < 10 ? 'destructive' : 'secondary'}
                              >
                                {s.size}: {s.stock}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={item.totalStock < 10 ? 'destructive' : 'default'}>
                            {item.totalStock}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
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

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock — {editingItem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.watch('sizes').map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Label className="w-16 font-medium">{form.watch(`sizes.${index}.size`)}</Label>
                <Input
                  type="number"
                  min={0}
                  className="w-32"
                  {...form.register(`sizes.${index}.stock`)}
                />
                <Input
                  placeholder="SKU"
                  className="flex-1"
                  {...form.register(`sizes.${index}.sku`)}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

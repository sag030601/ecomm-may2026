import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
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
import type { Category } from '@/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  parent: z.string().optional(),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const defaultValues: CategoryFormValues = {
  name: '',
  description: '',
  image: '',
  parent: '',
  isActive: true,
};

function getParentName(category: Category): string {
  if (!category.parent) return '—';
  if (typeof category.parent === 'object') return category.parent.name;
  return '—';
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get<{ categories: Category[] }>('/categories/admin/all');
      return data.categories;
    },
  });

  const parentCategories = categories?.filter((c) => !c.parent) ?? [];

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CategoryFormValues) =>
      api.post('/categories', {
        ...payload,
        parent: payload.parent || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
      closeDialog();
    },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryFormValues }) =>
      api.patch(`/categories/${id}`, {
        ...payload,
        parent: payload.parent || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
      closeDialog();
    },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const openCreate = () => {
    setEditingCategory(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    const parentId =
      category.parent && typeof category.parent === 'object'
        ? category.parent._id
        : (category.parent as string) ?? '';
    form.reset({
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
      parent: parentId,
      isActive: category.isActive,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    form.reset(defaultValues);
  };

  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage categories and subcategories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Category
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
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Slug</th>
                  <th className="px-4 py-3 text-left font-medium">Parent</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!categories?.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category._id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {category.image && (
                            <img
                              src={category.image}
                              alt={category.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{category.name}</div>
                            {category.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{category.slug}</td>
                      <td className="px-4 py-3">{getParentName(category)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={category.isActive ? 'default' : 'outline'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Delete this category?')) {
                                deleteMutation.mutate(category._id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} {...form.register('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" placeholder="https://..." {...form.register('image')} />
            </div>
            <div className="space-y-2">
              <Label>Parent Category (optional — leave empty for top-level)</Label>
              <Controller
                control={form.control}
                name="parent"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {parentCategories
                        .filter((c) => c._id !== editingCategory?._id)
                        .map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
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
                {isSaving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

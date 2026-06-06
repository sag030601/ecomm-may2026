import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import type { Banner } from '@/types';

const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  image: z.string().min(1, 'Image URL is required'),
  link: z.string().optional(),
  position: z.coerce.number().min(0),
  isActive: z.boolean(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

const defaultValues: BannerFormValues = {
  title: '',
  subtitle: '',
  image: '',
  link: '',
  position: 0,
  isActive: true,
};

function bannerToForm(banner: Banner): BannerFormValues {
  return {
    title: banner.title,
    subtitle: banner.subtitle ?? '',
    image: banner.image,
    link: banner.link ?? '',
    position: banner.position,
    isActive: banner.isActive,
  };
}

export default function BannersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data } = await api.get<{ banners: Banner[] }>('/banners/admin/all');
      return data.banners;
    },
  });

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues,
  });

  const createMutation = useMutation({
    mutationFn: (payload: BannerFormValues) => api.post('/banners', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner created');
      closeDialog();
    },
    onError: () => toast.error('Failed to create banner'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BannerFormValues }) =>
      api.patch(`/banners/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner updated');
      closeDialog();
    },
    onError: () => toast.error('Failed to update banner'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success('Banner deleted');
    },
    onError: () => toast.error('Failed to delete banner'),
  });

  const openCreate = () => {
    setEditingBanner(null);
    form.reset({
      ...defaultValues,
      position: (banners?.length ?? 0) + 1,
    });
    setDialogOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    form.reset(bannerToForm(banner));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBanner(null);
    form.reset(defaultValues);
  };

  const onSubmit = (values: BannerFormValues) => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner._id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">Manage homepage hero banners</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Preview</th>
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium">Link</th>
                  <th className="px-4 py-3 text-left font-medium">Position</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!banners?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No banners found.
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr key={banner._id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="h-12 w-24 rounded object-cover"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{banner.title}</div>
                        {banner.subtitle && (
                          <div className="text-xs text-muted-foreground">{banner.subtitle}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {banner.link || '—'}
                      </td>
                      <td className="px-4 py-3">{banner.position}</td>
                      <td className="px-4 py-3">
                        <Badge variant={banner.isActive ? 'default' : 'outline'}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(banner)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Delete this banner?')) {
                                deleteMutation.mutate(banner._id);
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
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" {...form.register('subtitle')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" placeholder="https://..." {...form.register('image')} />
              {form.formState.errors.image && (
                <p className="text-xs text-destructive">{form.formState.errors.image.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input id="link" placeholder="/products" {...form.register('link')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input id="position" type="number" {...form.register('position')} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" {...form.register('isActive')} />
              Active
            </label>
            {form.watch('image') && (
              <img
                src={form.watch('image')}
                alt="Preview"
                className="w-full h-32 object-cover rounded-md border"
              />
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

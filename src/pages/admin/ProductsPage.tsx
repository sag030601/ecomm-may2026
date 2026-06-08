import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
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
import { MultiImageUpload } from '@/components/admin/ImageUpload';
import type { Category, Product } from '@/types';

const productFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be positive'),
  compareAtPrice: z.coerce.number().min(0).optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  images: z.string(),
  colors: z.string(),
  sizes: z.array(
    z.object({
      size: z.string().min(1, 'Size is required'),
      stock: z.coerce.number().min(0),
      sku: z.string().optional(),
    })
  ).min(1, 'At least one size is required'),
  isFeatured: z.boolean(),
  isBestSeller: z.boolean(),
  isSpecialCombo: z.boolean(),
  isCrazyDeal: z.boolean(),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const defaultValues: ProductFormValues = {
  name: '',
  description: '',
  price: 0,
  compareAtPrice: undefined,
  category: '',
  subcategory: '',
  images: '',
  colors: '',
  sizes: [{ size: 'M', stock: 0, sku: '' }],
  isFeatured: false,
  isBestSeller: false,
  isSpecialCombo: false,
  isCrazyDeal: false,
  isActive: true,
};

function parseList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function productToForm(product: Product): ProductFormValues {
  const categoryId =
    typeof product.category === 'object' ? product.category._id : product.category;
  const subcategoryId =
    product.subcategory
      ? typeof product.subcategory === 'object'
        ? product.subcategory._id
        : product.subcategory
      : '';

  return {
    name: product.name,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    category: categoryId,
    subcategory: subcategoryId,
    images: product.images.join('\n'),
    colors: product.colors.join(', '),
    sizes: product.sizes.length
      ? product.sizes.map((s) => ({ size: s.size, stock: s.stock, sku: s.sku ?? '' }))
      : [{ size: 'M', stock: 0, sku: '' }],
    isFeatured: product.isFeatured,
    isBestSeller: product.isBestSeller,
    isSpecialCombo: product.isSpecialCombo,
    isCrazyDeal: product.isCrazyDeal,
    isActive: product.isActive,
  };
}

function formToPayload(values: ProductFormValues) {
  return {
    name: values.name,
    description: values.description,
    price: values.price,
    compareAtPrice: values.compareAtPrice || undefined,
    category: values.category,
    subcategory: values.subcategory || undefined,
    images: parseList(values.images),
    colors: parseList(values.colors),
    sizes: values.sizes.map((s) => ({
      size: s.size,
      stock: s.stock,
      sku: s.sku || undefined,
    })),
    isFeatured: values.isFeatured,
    isBestSeller: values.isBestSeller,
    isSpecialCombo: values.isSpecialCombo,
    isCrazyDeal: values.isCrazyDeal,
    isActive: values.isActive,
  };
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>('/products/admin/all');
      return data.products;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ categories: Category[]; subcategories: Category[] }>(
        '/categories'
      );
      return data;
    },
  });

  const categories = categoriesData?.categories ?? [];
  const subcategories = categoriesData?.subcategories ?? [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sizes',
  });

  const selectedCategory = form.watch('category');
  const filteredSubcategories = subcategories.filter((sub) => {
    const parentId = typeof sub.parent === 'object' ? sub.parent?._id : sub.parent;
    return parentId === selectedCategory;
  });

  const createMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof formToPayload>) =>
      api.post('/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product created');
      closeDialog();
    },
    onError: () => toast.error('Failed to create product'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReturnType<typeof formToPayload> }) =>
      api.patch(`/products/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product updated');
      closeDialog();
    },
    onError: () => toast.error('Failed to update product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product deleted');
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const openCreate = () => {
    setEditingProduct(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset(productToForm(product));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    form.reset(defaultValues);
  };

  const onSubmit = (values: ProductFormValues) => {
    const payload = formToPayload(values);
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Product
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
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Price</th>
                  <th className="px-4 py-3 text-left font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Flags</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!products?.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const totalStock = product.sizes.reduce((sum, s) => sum + s.stock, 0);
                    const categoryName =
                      typeof product.category === 'object'
                        ? product.category.name
                        : '—';
                    return (
                      <tr key={product._id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.images[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-10 w-10 rounded-md object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{categoryName}</td>
                        <td className="px-4 py-3">{formatPrice(product.price)}</td>
                        <td className="px-4 py-3">{totalStock}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {product.isFeatured && <Badge variant="secondary">Featured</Badge>}
                            {product.isBestSeller && <Badge variant="secondary">Best Seller</Badge>}
                            {product.isSpecialCombo && <Badge variant="secondary">Combo</Badge>}
                            {product.isCrazyDeal && <Badge variant="secondary">Deal</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={product.isActive ? 'default' : 'outline'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                if (confirm('Delete this product?')) {
                                  deleteMutation.mutate(product._id);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} {...form.register('description')} />
                {form.formState.errors.description && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" {...form.register('price')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare At Price</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  {...form.register('compareAtPrice')}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Controller
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <Controller
                  control={form.control}
                  name="subcategory"
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubcategories.map((sub) => (
                          <SelectItem key={sub._id} value={sub._id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Product Images</Label>
                <Controller
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <MultiImageUpload value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="colors">Colors (comma separated)</Label>
                <Input id="colors" placeholder="Black, White, Navy" {...form.register('colors')} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Sizes & Stock</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ size: '', stock: 0, sku: '' })}
                >
                  <Plus className="h-3 w-3" />
                  Add Size
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <Input
                      placeholder="Size"
                      className="w-24"
                      {...form.register(`sizes.${index}.size`)}
                    />
                    <Input
                      type="number"
                      placeholder="Stock"
                      className="w-24"
                      {...form.register(`sizes.${index}.stock`)}
                    />
                    <Input
                      placeholder="SKU"
                      className="flex-1"
                      {...form.register(`sizes.${index}.sku`)}
                    />
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(
                [
                  ['isFeatured', 'Featured'],
                  ['isBestSeller', 'Best Seller'],
                  ['isSpecialCombo', 'Special Combo'],
                  ['isCrazyDeal', 'Crazy Deal'],
                  ['isActive', 'Active'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" {...form.register(key)} />
                  {label}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

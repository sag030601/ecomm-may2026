import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Minus, Plus, ShoppingCart, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/images';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/products/ProductCard';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import type { Product, Review, User } from '@/types';

const reviewSchema = z.object({
  rating: z.coerce.number().min(1, 'Rating is required').max(5),
  title: z.string().optional(),
  comment: z.string().min(1, 'Comment is required'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const addItem = useCartStore((s) => s.addItem);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const isValidId = !!id && /^[a-f\d]{24}$/i.test(id);

  const { data: product, isPending, isError, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get<{ product: Product }>(`/products/${id}`);
      return data.product;
    },
    enabled: isValidId,
    retry: 1,
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', id],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>(`/products/${id}/related`);
      return data.products;
    },
    enabled: isValidId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data } = await api.get<{ reviews: Review[] }>(`/reviews/product/${id}`);
      return data.reviews;
    },
    enabled: isValidId,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 5, title: '', comment: '' },
  });

  const reviewRating = watch('rating');

  const reviewMutation = useMutation({
    mutationFn: async (formData: ReviewFormData) => {
      await api.post('/reviews', { ...formData, product: id });
    },
    onSuccess: () => {
      toast.success('Review submitted! It will appear once approved.');
      reset();
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    const sizes = product.sizes ?? [];
    const colors = product.colors ?? [];
    const sizeVariant = sizes.find((s) => s.size === selectedSize);
    const stock = sizeVariant?.stock ?? 0;

    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    if (stock <= 0) {
      toast.error('Selected size is out of stock');
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: Number(product.price),
      size: selectedSize,
      color: selectedColor || colors[0] || undefined,
      quantity,
      maxStock: stock,
    });

    setAddedToCart(true);
    toast.success('Added to cart');
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (!id || !isValidId) {
    return (
      <div className="container-custom py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Invalid Product</h1>
        <p className="text-muted-foreground mb-6">The product link is malformed.</p>
        <Button asChild><Link to="/products">Browse Products</Link></Button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="container-custom py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-custom py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Unable to Load Product</h1>
        <p className="text-muted-foreground mb-6">Something went wrong while loading this product.</p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          <Button asChild><Link to="/products">Browse Products</Link></Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-custom py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          <Button asChild><Link to="/products">Browse Products</Link></Button>
        </div>
      </div>
    );
  }

  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  const images = product.images ?? [];
  const selectedSizeVariant = sizes.find((s) => s.size === selectedSize);
  const maxStock = selectedSizeVariant?.stock ?? 0;
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const categoryName =
    product.category && typeof product.category === 'object' && 'name' in product.category
      ? product.category.name
      : '';

  return (
    <div className="container-custom py-8 md:py-12">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-foreground">Products</Link>
        {categoryName && (
          <>
            <span className="mx-2">/</span>
            <span>{categoryName}</span>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={getProductImage(images[selectedImage])}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    'shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-colors',
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <img src={getProductImage(img)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {product.isBestSeller && <Badge variant="secondary">Best Seller</Badge>}
            {product.isCrazyDeal && <Badge variant="destructive">Deal</Badge>}
            {discount > 0 && <Badge>-{discount}% OFF</Badge>}
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>

          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Color Selection */}
          {colors.length > 0 && (
            <div className="mt-6">
              <Label className="mb-3 block">Color: {selectedColor || 'Select'}</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'px-4 py-2 rounded-md border text-sm transition-colors',
                      selectedColor === color
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:border-primary'
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div className="mt-6">
            <Label className="mb-3 block">Size: {selectedSize || 'Select'}</Label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((variant) => (
                <button
                  key={variant.size}
                  type="button"
                  disabled={variant.stock <= 0}
                  onClick={() => {
                    setSelectedSize(variant.size);
                    setQuantity(1);
                  }}
                  className={cn(
                    'min-w-[3rem] px-3 py-2 rounded-md border text-sm transition-colors',
                    variant.stock <= 0 && 'opacity-40 cursor-not-allowed line-through',
                    selectedSize === variant.size
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input hover:border-primary'
                  )}
                >
                  {variant.size}
                </button>
              ))}
            </div>
            {selectedSize && (
              <p className="text-sm text-muted-foreground mt-2">
                {maxStock > 0 ? `${maxStock} in stock` : 'Out of stock'}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <Label className="mb-3 block">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={quantity >= maxStock || maxStock <= 0}
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full mt-8 gap-2"
            onClick={handleAddToCart}
            disabled={maxStock <= 0 && !!selectedSize}
          >
            {addedToCart ? (
              <><Check className="h-5 w-5" /> Added to Cart</>
            ) : (
              <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
            )}
          </Button>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

        {isAuthenticated() && (
          <form
            onSubmit={handleSubmit((data) => reviewMutation.mutate(data))}
            className="border rounded-lg p-6 mb-8 space-y-4"
          >
            <h3 className="font-semibold">Write a Review</h3>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValue('rating', i + 1)}
                  >
                    <Star
                      className={cn(
                        'h-6 w-6 transition-colors',
                        i < reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                      )}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating.message}</p>}
            </div>
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input id="title" {...register('title')} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea id="comment" {...register('comment')} className="mt-1" rows={4} />
              {errors.comment && <p className="text-sm text-destructive mt-1">{errors.comment.message}</p>}
            </div>
            <Button type="submit" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        )}

        {!isAuthenticated() && (
          <p className="text-muted-foreground mb-6">
            <Link to="/login" state={{ from: location }} className="text-primary underline">Sign in</Link> to write a review.
          </p>
        )}

        {reviewsLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}

        {reviews && reviews.length === 0 && (
          <p className="text-muted-foreground py-8 text-center border rounded-lg">No reviews yet. Be the first!</p>
        )}

        {reviews && reviews.length > 0 && (
          <div className="space-y-6">
            {reviews.map((review) => {
              const reviewer = typeof review.user === 'object' ? (review.user as User) : null;
              return (
                <div key={review._id} className="border-b pb-6 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reviewer?.name || 'Customer'}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-3.5 w-3.5',
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.title && <p className="font-medium mb-1">{review.title}</p>}
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="mt-16">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts
              .filter((p) => p && Array.isArray(p.sizes) && p.sizes.length > 0)
              .map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

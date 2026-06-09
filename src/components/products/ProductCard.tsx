import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/images';
import { useCartStore } from '@/stores/cartStore';
import { useWishlist } from '@/hooks/useWishlist';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  priority?: boolean;
  variant?: 'default' | 'on-dark';
}

function getTotalStock(product: Product): number {
  return product.sizes.reduce((sum, s) => sum + s.stock, 0);
}

function getDefaultVariant(product: Product) {
  const inStock = product.sizes.find((s) => s.stock > 0);
  return inStock ?? product.sizes[0];
}

export function ProductCard({
  product,
  showQuickAdd = false,
  showWishlist = false,
  priority = false,
  variant = 'default',
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggle, isWishlisted } = useWishlist();

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const totalStock = getTotalStock(product);
  const lowStock = totalStock > 0 && totalStock <= 5;
  const outOfStock = totalStock <= 0;
  const wishlisted = isWishlisted(product._id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sizeVariant = getDefaultVariant(product);
    if (!sizeVariant || sizeVariant.stock <= 0) {
      toast.error('This product is out of stock');
      return;
    }
    addItem({
      productId: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      size: sizeVariant.size,
      color: product.colors[0],
      maxStock: sizeVariant.stock,
      quantity: 1,
    });
    toast.success('Added to cart');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product._id);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const isOnDark = variant === 'on-dark';

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden transition-all duration-300',
        isOnDark ? 'bg-white/5 hover:bg-white/10' : 'bg-card border border-transparent hover:border-border hover:shadow-lg'
      )}
    >
      <Link to={`/products/${product._id}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={getProductImage(product.images[0])}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          {...(priority ? { fetchpriority: 'high' as const } : {})}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground shadow-sm">-{discount}%</Badge>
          )}
          {product.isBestSeller && (
            <Badge variant="secondary" className="shadow-sm bg-white/90 text-foreground">
              Best Seller
            </Badge>
          )}
          {product.isCrazyDeal && (
            <Badge className="bg-orange-500 text-white shadow-sm">Flash Deal</Badge>
          )}
        </div>

        {/* Stock indicator */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <Badge variant="secondary" className="text-sm px-3 py-1">Sold Out</Badge>
          </div>
        )}
        {lowStock && !outOfStock && (
          <Badge className="absolute bottom-3 left-3 z-10 bg-amber-500 text-white shadow-sm">
            Only {totalStock} left
          </Badge>
        )}

        {/* Hover actions */}
        <div
          className={cn(
            'absolute top-3 right-3 z-10 flex flex-col gap-2 transition-all duration-300',
            showWishlist ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-x-0' : 'hidden'
          )}
        >
          {showWishlist && (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={cn('h-9 w-9 rounded-full shadow-md', wishlisted && 'text-red-500')}
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              aria-pressed={wishlisted}
            >
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
            </Button>
          )}
        </div>

        {showQuickAdd && !outOfStock && (
          <div className="absolute inset-x-3 bottom-3 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Button
              type="button"
              className="w-full gap-2 shadow-lg"
              size="sm"
              onClick={handleQuickAdd}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Quick Add
            </Button>
          </div>
        )}
      </Link>

      <div className={cn('flex flex-col flex-1 p-4', isOnDark && 'text-white')}>
        <Link to={`/products/${product._id}`}>
          <h3
            className={cn(
              'font-medium line-clamp-2 text-sm md:text-base leading-snug hover:underline',
              isOnDark ? 'text-white' : 'text-foreground'
            )}
          >
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-2" aria-label={`Rated ${product.rating} out of 5`}>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'h-3 w-3',
                  i < Math.round(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : isOnDark
                      ? 'text-white/30'
                      : 'text-muted-foreground/40'
                )}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className={cn('text-xs', isOnDark ? 'text-white/60' : 'text-muted-foreground')}>
            {product.rating} ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-center gap-2 mt-2 mt-auto pt-2">
          <span className={cn('font-bold text-base', isOnDark && 'text-white')}>
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className={cn('text-sm line-through', isOnDark ? 'text-white/50' : 'text-muted-foreground')}>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Mobile quick add */}
        {showQuickAdd && !outOfStock && (
          <Button
            type="button"
            variant={isOnDark ? 'secondary' : 'outline'}
            size="sm"
            className="w-full mt-3 gap-2 md:hidden"
            onClick={handleQuickAdd}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Add to Cart
          </Button>
        )}
      </div>
    </article>
  );
}

import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { getProductImage } from '@/lib/images';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
      <Link to={`/products/${product._id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={getProductImage(product.images[0])}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {discount > 0 && (
            <Badge className="absolute top-3 left-3 bg-destructive">-{discount}%</Badge>
          )}
          {product.isCrazyDeal && (
            <Badge className="absolute top-3 right-3" variant="secondary">Deal</Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-medium line-clamp-1 hover:underline">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-muted-foreground">{product.rating} ({product.reviewCount})</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        <Button className="w-full mt-3" size="sm" asChild>
          <Link to={`/products/${product._id}`}>View Product</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  queryKey: string;
  params: Record<string, string>;
  viewAllLink: string;
  limit?: number;
  variant?: 'default' | 'dark';
  columns?: 4 | 5;
  enableQuickAdd?: boolean;
}

export function ProductSection({
  title,
  subtitle,
  eyebrow,
  queryKey,
  params,
  viewAllLink,
  limit = 8,
  variant = 'default',
  columns = 4,
  enableQuickAdd = true,
}: ProductSectionProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [queryKey, params, limit],
    queryFn: async () => {
      const { data: res } = await api.get<{ products: Product[] }>('/products', {
        params: { ...params, limit: String(limit) },
      });
      return res.products;
    },
  });

  const gridClass =
    columns === 5
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5'
      : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6';

  return (
    <section
      className={cn('py-14 md:py-20', variant === 'dark' && 'bg-muted/40')}
      aria-labelledby={`section-${queryKey}`}
    >
      <div className="container-custom">
        <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            {eyebrow && (
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
                {eyebrow}
              </p>
            )}
            <h2 id={`section-${queryKey}`} className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="text-muted-foreground mt-2 max-w-lg">{subtitle}</p>}
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex gap-1 shrink-0">
            <Link to={viewAllLink}>
              View All <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className={gridClass}>
            {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-16 border rounded-2xl bg-muted/30">
            <p className="text-muted-foreground mb-4">Failed to load products.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        )}

        {data && data.length === 0 && (
          <div className="text-center py-16 border rounded-2xl border-dashed">
            <p className="text-muted-foreground">No products in this collection yet.</p>
            <Button variant="link" asChild className="mt-2">
              <Link to="/products">Browse all products</Link>
            </Button>
          </div>
        )}

        {data && data.length > 0 && (
          <>
            <div className={gridClass}>
              {data.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  showQuickAdd={enableQuickAdd}
                  showWishlist
                  priority={index < 4}
                />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button variant="outline" asChild>
                <Link to={viewAllLink}>View All</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

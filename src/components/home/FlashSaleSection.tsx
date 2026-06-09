import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import type { Product } from '@/types';

function useCountdown(hours = 24) {
  const [remaining, setRemaining] = useState(() => {
    const stored = sessionStorage.getItem('flash-sale-end');
    const end = stored ? parseInt(stored, 10) : Date.now() + hours * 60 * 60 * 1000;
    if (!stored) sessionStorage.setItem('flash-sale-end', String(end));
    return Math.max(0, end - Date.now());
  });

  useEffect(() => {
    const id = setInterval(() => {
      const stored = sessionStorage.getItem('flash-sale-end');
      const end = stored ? parseInt(stored, 10) : Date.now();
      setRemaining(Math.max(0, end - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);

  return { h, m, s };
}

export function FlashSaleSection() {
  const { h, m, s } = useCountdown();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products-flash-sale'],
    queryFn: async () => {
      const { data: res } = await api.get<{ products: Product[] }>('/products', {
        params: { crazyDeal: 'true', limit: '6' },
      });
      return res.products;
    },
  });

  return (
    <section className="py-14 md:py-20 bg-gradient-to-br from-red-950 via-red-900 to-black text-white" aria-labelledby="flash-sale-heading">
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium mb-4">
              <Zap className="h-4 w-4 text-yellow-400" aria-hidden="true" />
              Flash Sale
            </div>
            <h2 id="flash-sale-heading" className="text-3xl md:text-4xl font-bold tracking-tight">
              Limited Time Deals
            </h2>
            <p className="text-white/70 mt-2 max-w-md">
              Up to 50% off on handpicked items. Once they&apos;re gone, they&apos;re gone.
            </p>
          </div>

          <div className="flex items-center gap-4" aria-label="Sale ends in">
            <Clock className="h-5 w-5 text-white/60 hidden sm:block" aria-hidden="true" />
            <div className="flex gap-2 md:gap-3">
              {[
                { value: h, label: 'Hours' },
                { value: m, label: 'Min' },
                { value: s, label: 'Sec' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center min-w-[3.5rem] md:min-w-[4rem] rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <span className="text-2xl md:text-3xl font-bold tabular-nums">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] md:text-xs text-white/60 uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.map((product) => (
              <ProductCard key={product._id} product={product} showQuickAdd showWishlist variant="on-dark" />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/products?crazyDeal=true">Shop All Deals</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

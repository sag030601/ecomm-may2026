import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/products/ProductCard';
import type { Banner, Category, Product } from '@/types';

function ProductSectionSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  queryKey,
  params,
  viewAllLink,
}: {
  title: string;
  subtitle?: string;
  queryKey: string;
  params: Record<string, string>;
  viewAllLink: string;
}) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [queryKey, params],
    queryFn: async () => {
      const { data } = await api.get<{ products: Product[] }>('/products', { params: { ...params, limit: '8' } });
      return data.products;
    },
  });

  return (
    <section className="py-12 md:py-16">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex gap-1">
            <Link to={viewAllLink}>
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading && <ProductSectionSkeleton />}
        {isError && (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <p className="text-muted-foreground mb-4">Failed to load products.</p>
            <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
          </div>
        )}
        {data && data.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No products available.</p>
        )}
        {data && data.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {data.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="mt-6 text-center sm:hidden">
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

export default function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);

  const { data: banners, isLoading: bannersLoading, isError: bannersError } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data } = await api.get<{ banners: Banner[] }>('/banners');
      return data.banners;
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading, isError: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ categories: Category[] }>('/categories');
      return data.categories;
    },
  });

  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const prevBanner = () => {
    if (!banners?.length) return;
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const nextBanner = () => {
    if (!banners?.length) return;
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  return (
    <div>
      {/* Hero Carousel */}
      <section className="relative bg-muted">
        {bannersLoading && (
          <Skeleton className="aspect-[21/9] md:aspect-[21/7] w-full" />
        )}
        {bannersError && (
          <div className="container-custom py-24 text-center">
            <p className="text-muted-foreground">Unable to load banners.</p>
          </div>
        )}
        {banners && banners.length > 0 && (
          <div className="relative aspect-[21/9] md:aspect-[21/7] overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner._id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-700',
                  index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'
                )}
              >
                {banner.link ? (
                  <Link to={banner.link} className="block h-full">
                    <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                      <div className="container-custom text-white">
                        <h1 className="text-3xl md:text-5xl font-bold max-w-xl">{banner.title}</h1>
                        {banner.subtitle && (
                          <p className="mt-3 text-lg md:text-xl text-white/90 max-w-lg">{banner.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <>
                    <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                      <div className="container-custom text-white">
                        <h1 className="text-3xl md:text-5xl font-bold max-w-xl">{banner.title}</h1>
                        {banner.subtitle && (
                          <p className="mt-3 text-lg md:text-xl text-white/90 max-w-lg">{banner.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {banners.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full opacity-80 hover:opacity-100"
                  onClick={prevBanner}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full opacity-80 hover:opacity-100"
                  onClick={nextBanner}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Go to slide ${index + 1}`}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        index === currentBanner ? 'w-8 bg-white' : 'w-2 bg-white/50'
                      )}
                      onClick={() => setCurrentBanner(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {banners && banners.length === 0 && !bannersLoading && (
          <div className="container-custom py-24 text-center">
            <h1 className="text-4xl font-bold">Welcome to LUXE</h1>
            <p className="text-muted-foreground mt-3 text-lg">Discover premium fashion & lifestyle products</p>
            <Button className="mt-6" asChild>
              <Link to="/products">Shop Now</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="container-custom">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-8">Shop by Category</h2>
          {categoriesLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          )}
          {categoriesError && (
            <p className="text-center text-muted-foreground py-8">Failed to load categories.</p>
          )}
          {categoriesData && categoriesData.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoriesData.map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                    <span className="text-white font-medium text-sm md:text-base">{category.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <ProductSection
        title="Best Sellers"
        subtitle="Our most popular picks"
        queryKey="products-bestSeller"
        params={{ bestSeller: 'true' }}
        viewAllLink="/products?bestSeller=true"
      />

      <div className="bg-muted/50">
        <ProductSection
          title="Special Combos"
          subtitle="Curated bundles at great value"
          queryKey="products-specialCombo"
          params={{ specialCombo: 'true' }}
          viewAllLink="/products?specialCombo=true"
        />
      </div>

      <ProductSection
        title="Crazy Deals"
        subtitle="Limited time offers"
        queryKey="products-crazyDeal"
        params={{ crazyDeal: 'true' }}
        viewAllLink="/products?crazyDeal=true"
      />

      <div className="bg-muted/50">
        <ProductSection
          title="Featured"
          subtitle="Handpicked for you"
          queryKey="products-featured"
          params={{ featured: 'true' }}
          viewAllLink="/products?featured=true"
        />
      </div>
    </div>
  );
}

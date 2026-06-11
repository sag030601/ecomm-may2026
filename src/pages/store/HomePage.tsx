import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsBar } from '@/components/home/StatsBar';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductSection } from '@/components/home/ProductSection';
import { FlashSaleSection } from '@/components/home/FlashSaleSection';
import { PromoBanner } from '@/components/home/PromoBanner';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { TrustBadges } from '@/components/home/TrustBadges';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { BrandLogosSection } from '@/components/home/BrandLogosSection';
import { PROMO_IMAGES } from '@/lib/images';
import type { Banner, Category } from '@/types';

export default function HomePage() {
  const { data: banners, isLoading: bannersLoading, isError: bannersError } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data } = await api.get<{ banners: Banner[] }>('/banners');
      return data.banners;
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get<{ categories: Category[] }>('/categories');
      return data.categories.filter((c) => !c.parent);
    },
  });

  return (
    <div className="flex flex-col">
      {/* 1. Hero — 75–88vh premium banner with CTAs */}
      <HeroSection banners={banners} isLoading={bannersLoading} isError={bannersError} />

      {/* 2. Social proof strip */}
      <StatsBar />

      {/* 3. Category discovery */}
      <CategoryGrid categories={categories} isLoading={categoriesLoading} />

      {/* 4. Trending — above the fold product density */}
      <ProductSection
        eyebrow="Trending Now"
        title="Trending Products"
        subtitle="What everyone's adding to cart this week"
        queryKey="products-trending"
        params={{ bestSeller: 'true' }}
        viewAllLink="/products?bestSeller=true"
        limit={8}
      />

      {/* 5. Flash sale */}
      <FlashSaleSection />

      {/* 6. Best sellers */}
      <ProductSection
        eyebrow="Most Loved"
        title="Best Sellers"
        subtitle="Our community favorites, rated 4.5+ stars"
        queryKey="products-bestSeller"
        params={{ bestSeller: 'true', sort: 'rating' }}
        viewAllLink="/products?bestSeller=true"
        limit={8}
        variant="dark"
      />

      {/* 7. Seasonal promo banner */}
      <PromoBanner
        title="Summer Collection 2026"
        subtitle="Lightweight fabrics, bold silhouettes, and effortless style for the season ahead. Shop the edit before it sells out."
        cta="Shop the Collection"
        href="/products?featured=true"
        image={PROMO_IMAGES.summer}
      />

      {/* 8. New arrivals */}
      <ProductSection
        eyebrow="Just Dropped"
        title="New Arrivals"
        subtitle="Fresh picks added to our catalog this week"
        queryKey="products-newest"
        params={{ sort: 'newest' }}
        viewAllLink="/products?sort=newest"
        limit={8}
      />

      {/* 9. Featured / curated */}
      <ProductSection
        eyebrow="Curated For You"
        title="Featured Products"
        subtitle="Hand-selected pieces from our style editors"
        queryKey="products-featured"
        params={{ featured: 'true' }}
        viewAllLink="/products?featured=true"
        limit={8}
        variant="dark"
      />

      {/* 10. Second promo — special combos */}
      <PromoBanner
        title="Bundle & Save"
        subtitle="Curated combo packs with exclusive pricing. Build your wardrobe smarter."
        cta="View Combos"
        href="/products?specialCombo=true"
        image={PROMO_IMAGES.bundle}
        reversed
      />

      {/* 11. Recently added — all products newest */}
      <ProductSection
        eyebrow="Fresh Inventory"
        title="Recently Added"
        subtitle="The latest additions to the LUXE catalog"
        queryKey="products-recent"
        params={{ sort: 'newest' }}
        viewAllLink="/products"
        limit={12}
        columns={4}
      />

      {/* 12. Brand logos */}
      <BrandLogosSection />

      {/* 13. Testimonials */}
      <TestimonialsSection />

      {/* 14. Trust badges */}
      <TrustBadges />

      {/* 15. Newsletter */}
      <NewsletterSection />
    </div>
  );
}

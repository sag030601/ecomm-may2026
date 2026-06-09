import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

const CURATED_CATEGORIES = [
  {
    name: 'Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e3685b?w=800&q=80',
    link: '/products',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    link: '/products',
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80',
    link: '/products',
  },
  {
    name: 'Lifestyle',
    slug: 'lifestyle',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6a68737d2?w=800&q=80',
    link: '/products?featured=true',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780f723ebb1?w=800&q=80',
    link: '/products',
  },
  {
    name: 'Home',
    slug: 'home',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
    link: '/products',
  },
] as const;

interface CategoryGridProps {
  categories?: Category[];
  isLoading?: boolean;
}

export function CategoryGrid({ categories, isLoading }: CategoryGridProps) {
  const items =
    categories && categories.length > 0
      ? categories.slice(0, 6).map((c) => ({
          name: c.name,
          image: c.image || CURATED_CATEGORIES[0].image,
          link: `/products?category=${c._id}`,
        }))
      : CURATED_CATEGORIES.map((c) => ({ name: c.name, image: c.image, link: c.link }));

  return (
    <section className="py-14 md:py-20" aria-labelledby="categories-heading">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
              Browse
            </p>
            <h2 id="categories-heading" className="text-3xl md:text-4xl font-bold tracking-tight">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline underline-offset-4"
          >
            View all categories <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {items.map((cat, index) => (
              <Link
                key={cat.name}
                to={cat.link}
                className={cn(
                  'group relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted',
                  index === 0 && 'md:col-span-2 md:row-span-1 md:aspect-[16/10]'
                )}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 flex items-end justify-between">
                  <span className="text-white font-semibold text-sm md:text-base">{cat.name}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 backdrop-blur-sm">
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

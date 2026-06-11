import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Shield, Sparkles, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getHeroImage, HERO_SLIDE_IMAGES, onImageError } from '@/lib/images';
import type { Banner } from '@/types';

const FALLBACK_HERO = {
  image: HERO_SLIDE_IMAGES[0],
  title: 'Elevate Your Everyday',
  subtitle: 'Discover curated premium fashion & lifestyle pieces — crafted for those who demand more.',
};

const TRUST_PILLS = [
  { icon: Truck, label: 'Free shipping $100+' },
  { icon: Shield, label: 'Secure checkout' },
  { icon: Sparkles, label: 'Premium quality' },
] as const;

interface HeroSectionProps {
  banners?: Banner[];
  isLoading?: boolean;
  isError?: boolean;
}

export function HeroSection({ banners, isLoading, isError }: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const slides = banners?.length ? banners : isLoading ? [] : [{ ...FALLBACK_HERO, _id: 'fallback' } as Banner & { _id: string }];

  useEffect(() => {
    slides.forEach((banner, index) => {
      const img = new Image();
      img.src = getHeroImage(banner.image, index);
    });
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (isLoading) {
    return (
      <section className="relative min-h-[75vh] lg:min-h-[85vh]" aria-label="Loading hero">
        <Skeleton className="absolute inset-0 w-full h-full" />
      </section>
    );
  }

  const active = slides[current] ?? slides[0];

  return (
    <section className="relative min-h-[75vh] lg:min-h-[88vh] overflow-hidden" aria-label="Hero banner">
      {/* Background slides */}
      {slides.map((banner, index) => {
        const imageSrc = getHeroImage(banner.image, index);
        return (
          <div
            key={banner._id ?? `slide-${index}`}
            className={cn(
              'absolute inset-0 transition-opacity duration-1000 ease-in-out',
              index === current ? 'opacity-100 z-0' : 'opacity-0 z-0'
            )}
            aria-hidden={index !== current}
          >
            <img
              src={imageSrc}
              alt={banner.title || 'Hero banner'}
              className="h-full w-full object-cover scale-105"
              loading="eager"
              decoding="async"
              {...(index === 0 ? { fetchPriority: 'high' as const } : {})}
              onError={onImageError(HERO_SLIDE_IMAGES[index % HERO_SLIDE_IMAGES.length])}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        );
      })}

      {/* Content */}
      <div className="relative z-10 flex min-h-[75vh] lg:min-h-[88vh] items-center">
        <div className="container-custom w-full py-16 md:py-24">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs md:text-sm font-medium text-white/90 backdrop-blur-sm mb-6">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              New Season · Limited Edition Drops
            </p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05]">
              {active?.title || FALLBACK_HERO.title}
            </h1>

            <p className="mt-5 text-base md:text-xl text-white/85 max-w-lg leading-relaxed">
              {active?.subtitle || FALLBACK_HERO.subtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button size="lg" className="h-12 px-8 text-base bg-white text-black hover:bg-white/90" asChild>
                <Link to={active?.link || '/products'}>Shop Now</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm"
                asChild
              >
                <Link to="/products?featured=true">Explore Collection</Link>
              </Button>
            </div>

            <ul className="mt-10 flex flex-wrap gap-3" aria-label="Trust indicators">
              {TRUST_PILLS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs md:text-sm text-white/90 backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      {slides.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full h-11 w-11 opacity-70 hover:opacity-100"
            onClick={() => setCurrent((p) => (p - 1 + slides.length) % slides.length)}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full h-11 w-11 opacity-70 hover:opacity-100"
            onClick={() => setCurrent((p) => (p + 1) % slides.length)}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2" role="tablist" aria-label="Hero slides">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === current}
                aria-label={`Slide ${index + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  index === current ? 'w-10 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'
                )}
                onClick={() => setCurrent(index)}
              />
            ))}
          </div>
        </>
      )}

      {isError && (
        <p className="sr-only">Banner images could not be loaded. Showing default hero.</p>
      )}
    </section>
  );
}

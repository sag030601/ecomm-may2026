import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  reversed?: boolean;
}

export function PromoBanner({ title, subtitle, cta, href, image, reversed }: PromoBannerProps) {
  return (
    <section className="py-8 md:py-12" aria-label={title}>
      <div className="container-custom">
        <div
          className={`relative overflow-hidden rounded-3xl bg-muted min-h-[320px] md:min-h-[400px] flex items-center ${
            reversed ? 'md:flex-row-reverse' : ''
          }`}
        >
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="relative z-10 p-8 md:p-14 max-w-xl">
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">{title}</h2>
            <p className="mt-3 text-white/80 text-sm md:text-base leading-relaxed">{subtitle}</p>
            <Button className="mt-6 gap-2" size="lg" asChild>
              <Link to={href}>
                {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

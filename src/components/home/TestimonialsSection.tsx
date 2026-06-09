import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    role: 'Verified Buyer',
    rating: 5,
    quote:
      'The quality exceeded my expectations. Fast shipping, beautiful packaging, and the fit was perfect. LUXE is now my go-to for premium fashion.',
  },
  {
    name: 'James Chen',
    role: 'Verified Buyer',
    rating: 5,
    quote:
      'Incredible curation. Every piece feels thoughtfully selected. The checkout was seamless and returns were handled without any hassle.',
  },
  {
    name: 'Amelia Rodriguez',
    role: 'Verified Buyer',
    rating: 5,
    quote:
      'Finally a store that feels premium from landing to delivery. Love the new arrivals section — always finding something unique.',
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24" aria-labelledby="testimonials-heading">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-2">
            Customer Love
          </p>
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold tracking-tight">
            Trusted by thousands worldwide
          </h2>
          <div className="flex items-center justify-center gap-1 mt-4" aria-label="4.8 out of 5 average rating">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">4.8 from 2,400+ reviews</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.name}
              className="relative rounded-2xl border bg-card p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-0.5 mb-4" aria-label={`${t.rating} stars`}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 pt-6 border-t">
                <cite className="not-italic">
                  <span className="font-semibold block">{t.name}</span>
                  <span className="text-sm text-muted-foreground">{t.role}</span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

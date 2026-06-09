import { Headphones, RefreshCw, ShieldCheck, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: '256-bit SSL encryption on every order',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Free shipping on orders over $100',
  },
  {
    icon: RefreshCw,
    title: 'Easy Returns',
    description: '30-day hassle-free return policy',
  },
  {
    icon: Headphones,
    title: 'Customer Support',
    description: 'Dedicated support team, 24/7',
  },
] as const;

export function TrustBadges() {
  return (
    <section className="py-12 md:py-16 border-y bg-muted/20" aria-labelledby="trust-heading">
      <div className="container-custom">
        <h2 id="trust-heading" className="sr-only">
          Why shop with LUXE
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {TRUST_ITEMS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-3 sm:gap-4 p-4 rounded-xl hover:bg-background/80 transition-colors"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">{title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

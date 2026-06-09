import { Package, Star, Users } from 'lucide-react';

const STATS = [
  { icon: Users, value: '50K+', label: 'Happy Customers' },
  { icon: Package, value: '120K+', label: 'Orders Delivered' },
  { icon: Star, value: '4.8', label: 'Average Rating' },
] as const;

export function StatsBar() {
  return (
    <section className="py-8 bg-primary text-primary-foreground" aria-label="Store statistics">
      <div className="container-custom">
        <div className="grid grid-cols-3 gap-4 md:gap-8 divide-x divide-primary-foreground/20">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center text-center px-2">
              <Icon className="h-5 w-5 mb-2 opacity-80" aria-hidden="true" />
              <span className="text-2xl md:text-3xl font-bold tracking-tight">{value}</span>
              <span className="text-xs md:text-sm opacity-80 mt-1">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

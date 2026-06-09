import { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function NewsletterSection() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Welcome to LUXE! Check your inbox for 10% off your first order.');
    setEmail('');
  };

  return (
    <section className="py-16 md:py-20" aria-labelledby="newsletter-heading">
      <div className="container-custom">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-6 py-12 md:px-16 md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),_transparent_50%)]" />
          <div className="relative max-w-xl mx-auto text-center">
            <Mail className="h-10 w-10 mx-auto mb-4 opacity-80" aria-hidden="true" />
            <h2 id="newsletter-heading" className="text-2xl md:text-3xl font-bold tracking-tight">
              Join the LUXE insider list
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Get early access to new drops, exclusive deals, and 10% off your first order.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

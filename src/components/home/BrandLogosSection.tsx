const BRANDS = ['VOGUE', 'ESSENCE', 'HARPER', 'ELLE', 'GQ', 'FORBES'];

export function BrandLogosSection() {
  return (
    <section className="border-y bg-muted/20 py-10">
      <div className="container-custom">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
          As featured in
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="text-lg md:text-xl font-semibold tracking-wider text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

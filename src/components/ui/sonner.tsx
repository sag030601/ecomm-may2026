import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { X } from 'lucide-react';

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      richColors
      closeButton
      icons={{ close: <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> }}
      toastOptions={{
        classNames: {
          toast: 'sonner-toast group',
          title: 'text-sm font-medium leading-snug',
          description: 'text-sm opacity-90',
          actionButton:
            'rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90',
          cancelButton:
            'rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
        },
      }}
      {...props}
    />
  );
}

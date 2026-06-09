import { loadStripe, type Stripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ?? '';

/** Only initialize Stripe when a publishable key is configured. */
export const stripePromise: Promise<Stripe | null> | null = publishableKey
  ? loadStripe(publishableKey)
  : null;

export const isStripeConfigured = () => Boolean(publishableKey);

import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment');
}

export const stripe = new Stripe(key, {
  // Pin to the API version the SDK ships with so upgrades are deliberate.
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
  appInfo: {
    name: 'Studio On',
  },
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';

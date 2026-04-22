// Hardcoded source of truth for customer-facing plans.
// Prices here are displayed, but the server re-validates totals against the DB
// before creating a Stripe Checkout Session. Never trust client totals.

export type PlanSlug = 'quick' | 'portrait' | 'fisheye';

export type Plan = {
  slug: PlanSlug;
  name: string;
  price: number;
  duration: number;
  description: string;
  tagline: string;
};

export const PLANS: Plan[] = [
  {
    slug: 'quick',
    name: 'Quick Shot',
    price: 150,
    duration: 30,
    tagline: '30 minutes, one location',
    description:
      'A fast, energetic 30-minute session capturing you at one iconic Tokyo location.',
  },
  {
    slug: 'portrait',
    name: 'Portrait',
    price: 200,
    duration: 60,
    tagline: '1 hour, multiple setups',
    description:
      'A refined 1-hour portrait session with room for multiple setups and wardrobe changes.',
  },
  {
    slug: 'fisheye',
    name: 'Fish Eye',
    price: 250,
    duration: 60,
    tagline: '1 hour, signature fish-eye lens',
    description:
      'A creative 1-hour session using our signature fish-eye lens for cinematic, wide-angle storytelling.',
  },
];

export function findPlanBySlug(slug: string): Plan | null {
  return PLANS.find((p) => p.slug === slug) ?? null;
}

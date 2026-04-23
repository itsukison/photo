// Hardcoded source of truth for customer-facing plans.
// Prices here are displayed, but the server re-validates totals against the DB
// before creating a Stripe Checkout Session. Never trust client totals.

export type PlanSlug = 'quick' | 'portrait' | 'fisheye' | 'signature' | 'couple';

export type Plan = {
  slug: PlanSlug;
  name: string;
  price: number;
  duration: number;
  description: string;
  tagline: string;
  lens: string;
  photoCount: string;
};

export const PLANS: Plan[] = [
  {
    slug: 'quick',
    name: 'Quick Shot',
    price: 120,
    duration: 30,
    tagline: '30 minutes, portrait lens',
    description: 'A 30-minute portrait session capturing clean, cinematic shots of Tokyo.',
    lens: 'Portrait Lens Only',
    photoCount: '20 Edited Photos',
  },
  {
    slug: 'portrait',
    name: 'Full Portrait Session',
    price: 180,
    duration: 50,
    tagline: '50 minutes, portrait lens',
    description: "A 50-minute portrait session across Tokyo's most iconic backdrops.",
    lens: 'Portrait Lens Only',
    photoCount: '35 Edited Photos',
  },
  {
    slug: 'fisheye',
    name: 'Fish Eye Session',
    price: 230,
    duration: 50,
    tagline: '50 minutes, signature fish-eye',
    description: 'A 50-minute creative session with our signature fish-eye lens for bold, wide-angle shots.',
    lens: 'Fish Eye Lens Only',
    photoCount: '50 Edited Photos',
  },
  {
    slug: 'signature',
    name: 'Signature Session',
    price: 290,
    duration: 50,
    tagline: '50 minutes, both lenses',
    description: 'A 50-minute session combining both lenses for a full range of cinematic shots.',
    lens: 'Portrait + Fish Eye Lens',
    photoCount: '60 Edited Photos',
  },
  {
    slug: 'couple',
    name: 'Couple Session',
    price: 330,
    duration: 50,
    tagline: '50 minutes, couple story',
    description: 'A 50-minute couples shoot with both lenses, capturing your Tokyo story together.',
    lens: 'Portrait + Fish Eye Lens',
    photoCount: '70 Edited Photos',
  },
];

export function findPlanBySlug(slug: string): Plan | null {
  return PLANS.find((p) => p.slug === slug) ?? null;
}

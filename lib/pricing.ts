// Single source of truth for booking price composition.
// Mirrors the SQL logic in public.create_pending_booking so the review screen
// matches what Stripe will charge. Server always re-computes before charging.

import type { Plan } from './plans';
import type { Location, Addon } from './data';

export type PricingInput = {
  plan: Pick<Plan, 'price'>;
  location: Pick<Location, 'surcharge'>;
  extraDurationMinutes: number;
  groupSize: number;
  addons: Pick<Addon, 'price'>[];
};

export type PricingBreakdown = {
  baseCents: number;
  locationCents: number;
  extraTimeCents: number;
  extraPeopleCents: number;
  addonCents: number;
  totalCents: number;
  totalUsd: number;
};

// Dollar prices are stored as integers in the DB; we convert to cents here.
const toCents = (usd: number) => Math.round(usd * 100);

export function computePricing(input: PricingInput): PricingBreakdown {
  const baseCents = toCents(input.plan.price);
  const locationCents = toCents(input.location.surcharge);
  const extraTimeCents = Math.floor(input.extraDurationMinutes / 30) * toCents(100);
  const extraPeopleCents = input.groupSize > 1 ? (input.groupSize - 1) * toCents(7) : 0;
  const addonCents = input.addons.reduce((s, a) => s + toCents(a.price), 0);
  const totalCents =
    baseCents + locationCents + extraTimeCents + extraPeopleCents + addonCents;
  return {
    baseCents,
    locationCents,
    extraTimeCents,
    extraPeopleCents,
    addonCents,
    totalCents,
    totalUsd: totalCents / 100,
  };
}

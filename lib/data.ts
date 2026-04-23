import { supabase } from '@/lib/supabase';

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  lens: string;
  photoCount: string;
};

export type Location = {
  id: string;
  name: string;
  surcharge: number;
  isComingSoon?: boolean;
};

export type Addon = {
  id: string;
  slug: string;
  name: string;
  price: number;
};

export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('id, slug, name, price, duration_minutes, description, sort_order')
    .in('slug', ['quick', 'portrait', 'fisheye', 'signature', 'couple'])
    .order('sort_order', { ascending: true });
  if (error) throw error;

  const enrichedDescriptions: Record<string, string> = {
    quick: 'A 30-minute portrait session capturing clean, cinematic shots of Tokyo.',
    portrait: "A 50-minute portrait session across Tokyo's most iconic backdrops.",
    fisheye: 'A 50-minute creative session with our signature fish-eye lens for bold, wide-angle shots.',
    signature: 'A 50-minute session combining both lenses for a full range of cinematic shots.',
    couple: 'A 50-minute couples shoot with both lenses, capturing your Tokyo story together.',
  };

  const enrichedNames: Record<string, string> = {
    quick: 'Quick Shot',
    portrait: 'Full Portrait Session',
    fisheye: 'Fish Eye Session',
    signature: 'Signature Session',
    couple: 'Couple Session',
  };

  const enrichedPrices: Record<string, number> = {
    quick: 120,
    portrait: 180,
    fisheye: 230,
    signature: 290,
    couple: 330,
  };

  const enrichedMetadata: Record<string, { lens: string; photoCount: string }> = {
    quick: { lens: 'Portrait Lens Only', photoCount: '20 Edited Photos' },
    portrait: { lens: 'Portrait Lens Only', photoCount: '35 Edited Photos' },
    fisheye: { lens: 'Fish Eye Lens Only', photoCount: '50 Edited Photos' },
    signature: { lens: 'Portrait + Fish Eye Lens', photoCount: '60 Edited Photos' },
    couple: { lens: 'Portrait + Fish Eye Lens', photoCount: '70 Edited Photos' },
  };

  const dbSlugs = new Set((data ?? []).map((p) => p.slug as string));
  const missingSlugs = ['signature', 'couple'].filter((s) => !dbSlugs.has(s));

  // Combine DB results with fallback entries for missing packages
  const allResults = [...(data ?? [])];
  missingSlugs.forEach((slug, idx) => {
    allResults.push({
      id: `fallback-${slug}`,
      slug,
      name: enrichedNames[slug],
      price: enrichedPrices[slug],
      duration_minutes: 50,
      description: enrichedDescriptions[slug],
      sort_order: 100 + idx, // Ensure they appear at the end
    });
  });

  return allResults.map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: enrichedNames[p.slug as string] || (p.name as string),
    price: enrichedPrices[p.slug as string] || (p.price as number),
    duration: p.duration_minutes as number,
    description: enrichedDescriptions[p.slug as string] || ((p.description as string) ?? ''),
    lens: enrichedMetadata[p.slug as string]?.lens || 'Portrait Lens',
    photoCount: enrichedMetadata[p.slug as string]?.photoCount || 'Gallery Included',
  }));
}

// Deterministic UUIDs — must match migrate-locations.sql exactly.
// Both photo and Membercheck reference the same Supabase rows by these IDs.
const LOCATION_UUIDS = {
  shibuya:   '11111111-1111-1111-1111-111111111111',
  shinjuku:  '22222222-2222-2222-2222-222222222222',
  akihabara: '33333333-3333-3333-3333-333333333333',
} as const;

export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, surcharge, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw error;

  // Canonical list of Tokyo shooting locations shown to customers.
  // "Seoul" is listed as coming-soon (frontend-only, not in DB).
  const CANONICAL_LOCATIONS: Location[] = [
    { id: LOCATION_UUIDS.shibuya,   name: 'Shibuya',   surcharge: 0 },
    { id: LOCATION_UUIDS.shinjuku,  name: 'Shinjuku',  surcharge: 50 },
    { id: LOCATION_UUIDS.akihabara, name: 'Akihabara', surcharge: 100 },
    { id: 'coming-soon-seoul',      name: 'Seoul',      surcharge: 0, isComingSoon: true },
  ];

  // If a DB row exists for a location (matched by our known UUID), trust its
  // surcharge value from the DB so staff can update pricing without a code deploy.
  const dbById = new Map((data ?? []).map((l) => [l.id as string, l]));

  return CANONICAL_LOCATIONS.map((loc) => {
    const dbRow = dbById.get(loc.id);
    return {
      id: loc.id,
      name: loc.name,
      surcharge: dbRow ? (dbRow.surcharge as number) : loc.surcharge,
      isComingSoon: loc.isComingSoon,
    };
  });
}

export async function fetchAddons(): Promise<Addon[]> {
  const { data, error } = await supabase
    .from('addons')
    .select('id, slug, name, price');
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id as string,
    slug: a.slug as string,
    name: a.name as string,
    price: a.price as number,
  }));
}

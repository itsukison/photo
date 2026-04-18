import { supabase } from '@/lib/supabase';

export type Plan = {
  id: string;
  slug: string;
  name: string;
  price: number;
  duration: number;
  description: string;
};

export type Location = {
  id: string;
  name: string;
  surcharge: number;
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
    .in('slug', ['quick', 'portrait', 'fisheye'])
    .order('sort_order', { ascending: true });
  if (error) throw error;

  const enrichedDescriptions: Record<string, string> = {
    quick: "A refined, high-efficiency session designed for the modern traveler. We'll navigate one of Seoul's most iconic districts together, capturing effortless, cinematic street-style portraits that reflect your personal aesthetic in just 30 minutes.",
    portrait: "A narrative-driven 60-minute exploration across two distinct Seoul backdrops. This plan offers a comprehensive visual story, perfect for professional portfolios or fashion-forward social presence, with enough time for subtle outfit shifts and deeper creative direction.",
    fisheye: "A creative 60-minute session using our signature fish-eye lens. We'll utilize specialized lighting and ultra-wide angles to craft a bespoke cinematic gallery that distorts space for a unique, editorial edge."
  };

  return (data ?? []).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: p.name as string,
    price: p.price as number,
    duration: p.duration_minutes as number,
    description: enrichedDescriptions[p.slug as string] || ((p.description as string) ?? ''),
  }));
}

export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name, surcharge, sort_order')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((l) => ({
    id: l.id as string,
    name: l.name as string,
    surcharge: l.surcharge as number,
  }));
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

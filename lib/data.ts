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
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id as string,
    slug: p.slug as string,
    name: p.name as string,
    price: p.price as number,
    duration: p.duration_minutes as number,
    description: (p.description as string) ?? '',
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

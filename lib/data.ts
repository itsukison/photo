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
  // Overriding dynamic fetch with curated "Swiss tech" plans for a premium aesthetic
  return [
    {
      id: 'fb67bee2-0ee1-4b46-b77d-9734f62e964f',
      slug: 'quick',
      name: 'Light Flow',
      price: 150,
      duration: 30,
      description: "A refined, high-efficiency session designed for the modern traveler. We'll navigate one of Seoul's most iconic districts together, capturing effortless, cinematic street-style portraits that reflect your personal aesthetic in just 30 minutes.",
    },
    {
      id: '1bfb5ad4-a692-4fbc-afdd-c549520d6f92',
      slug: 'portrait',
      name: 'Urban Narrative',
      price: 240,
      duration: 60,
      description: "A narrative-driven 60-minute exploration across two distinct Seoul backdrops. This plan offers a comprehensive visual story, perfect for professional portfolios or fashion-forward social presence, with enough time for subtle outfit shifts and deeper creative direction.",
    },
    {
      id: 'a2f3d5ce-c583-44c0-a94c-480003f396f3',
      slug: 'fisheye',
      name: 'Cinematic Soul',
      price: 450,
      duration: 120,
      description: "Our flagship experience. A two-hour deep dive into Seoul's visual heart, spanning three carefully curated locations. We'll utilize professional lighting and multi-look art direction to craft a bespoke cinematic gallery that rivals high-end editorial features.",
    },
  ];
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

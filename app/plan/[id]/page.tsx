import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PlanClient from './PlanClient';
import JsonLd from '@/components/JsonLd';
import { findPlanBySlug, PLANS } from '@/lib/plans';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  serviceJsonLd,
  SITE_URL,
} from '@/lib/seo';

type Props = {
  params: Promise<{ id: string }>;
};

const planImages: Record<string, string> = {
  quick: '/mainportrait.jpg',
  portrait: '/redneonportrait3.jpg',
  fisheye: '/crossing_yellow.JPG',
  signature: '/blackman_crossing.JPG',
  couple: '/mighty_pink.JPG',
};

export function generateStaticParams() {
  return PLANS.map((plan) => ({ id: plan.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const plan = findPlanBySlug(id);

  if (!plan) {
    return {
      title: 'Plan not found',
      robots: { index: false, follow: false },
    };
  }

  const title = `${plan.name} — Tokyo Photoshoot ($${plan.price})`;
  const description = `${plan.description} ${plan.duration}-minute Tokyo session at Shibuya, Shinjuku, or Akihabara, ${plan.photoCount.toLowerCase()} delivered. Book online with @ Studio ON.`;
  const heroImage = planImages[plan.slug] ?? '/mainportrait.jpg';

  return {
    title,
    description,
    alternates: { canonical: `/plan/${plan.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/plan/${plan.slug}`,
      type: 'website',
      images: [{ url: heroImage, width: 1200, height: 1500, alt: plan.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [heroImage],
    },
  };
}

export default async function PlanPage({ params }: Props) {
  const { id } = await params;
  const plan = findPlanBySlug(id);

  if (!plan) notFound();

  const heroImage = planImages[plan.slug] ?? '/mainportrait.jpg';

  return (
    <>
      <PlanClient />
      <JsonLd
        data={serviceJsonLd({
          name: `${plan.name} — Tokyo Photoshoot`,
          description: plan.description,
          url: `/plan/${plan.slug}`,
          price: plan.price,
          duration: plan.duration,
          image: heroImage,
          areaServed: ['Shibuya', 'Shinjuku', 'Akihabara', 'Tokyo'],
        })}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: plan.name,
          description: plan.description,
          image: absoluteUrl(heroImage),
          brand: { '@type': 'Brand', name: '@ Studio ON' },
          category: 'Photography session',
          offers: {
            '@type': 'Offer',
            url: absoluteUrl(`/plan/${plan.slug}`),
            priceCurrency: 'USD',
            price: plan.price,
            availability: 'https://schema.org/InStock',
            seller: { '@id': `${SITE_URL}/#studio` },
          },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Plans', path: '/#plans' },
          { name: plan.name, path: `/plan/${plan.slug}` },
        ])}
      />
    </>
  );
}

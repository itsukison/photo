import type { Metadata } from 'next';
import BookClient from './BookClient';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Book a Tokyo Photoshoot — Plan, Location & Date',
  description:
    'Reserve a Tokyo photoshoot with @ Studio ON. Pick a plan, choose Shibuya, Shinjuku, or Akihabara, select a date, and pay securely via Stripe. From $150.',
  alternates: { canonical: '/book' },
  openGraph: {
    title: 'Book a Tokyo Photoshoot — @ Studio ON',
    description:
      'Reserve your Tokyo session — Shibuya, Shinjuku, or Akihabara. Sessions from $150.',
    url: `${SITE_URL}/book`,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const reserveActionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ReserveAction',
  name: 'Book a Tokyo photoshoot',
  target: {
    '@type': 'EntryPoint',
    urlTemplate: `${SITE_URL}/book`,
    actionPlatform: [
      'https://schema.org/DesktopWebPlatform',
      'https://schema.org/MobileWebPlatform',
    ],
  },
  result: {
    '@type': 'Reservation',
    name: '@ Studio ON Tokyo photoshoot session',
  },
  provider: { '@id': `${SITE_URL}/#studio` },
};

export default function BookPage() {
  return (
    <>
      <BookClient />
      <JsonLd data={reserveActionJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Book', path: '/book' },
        ])}
      />
    </>
  );
}

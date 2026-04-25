import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import CTASection from '@/components/CTASection';
import FAQ from '@/components/FAQ';
import JsonLd from '@/components/JsonLd';
import { PLANS } from '@/lib/plans';
import { absoluteUrl, faqJsonLd, SITE_URL, SITE_NAME, STUDIO } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Tokyo Photoshoot — Cinematic Portraits in Shibuya, Shinjuku & Harajuku',
  description:
    'Book a cinematic Tokyo photoshoot with @ Studio ON. English-speaking photographers, editorial portraits at Shibuya Crossing, Shinjuku, Harajuku, and Akihabara. Sessions from $150.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Tokyo Photoshoot — Cinematic Portraits in Shibuya, Shinjuku & Harajuku',
    description:
      'Editorial portrait sessions across Tokyo for travelers, couples, and creators. From $150.',
    url: SITE_URL,
    type: 'website',
  },
};

const HOME_FAQ = [
  {
    question: 'How much does a Tokyo photoshoot with @ Studio ON cost?',
    answer:
      'Sessions start at $150 for a 30-minute Quick Shot and run up to $300 for the Couple Session, which includes both portrait and fish-eye lenses across a 50-minute shoot. Shibuya is included; Shinjuku adds $50 and Akihabara adds $100 for travel time.',
  },
  {
    question: 'Where in Tokyo do you photograph?',
    answer:
      'Default locations are Shibuya, Shinjuku, and Akihabara, all bookable directly. Harajuku, Asakusa, and Ginza are available on request. Each location has a dedicated guide page covering the best spots, the recommended time of day, and what to wear.',
  },
  {
    question: 'Do I need to speak Japanese to book?',
    answer:
      'No. The studio operates in English, and direction during the shoot is given in English. The team also speaks Japanese and Korean for clients who prefer those languages.',
  },
  {
    question: 'How far in advance should I book?',
    answer:
      'Two to four weeks ahead is recommended for weekend slots and peak travel seasons (cherry blossom in late March, autumn foliage in November, and December holidays). Last-minute weekday slots are sometimes available — the booking flow shows live availability.',
  },
  {
    question: 'When will I receive my edited photos?',
    answer:
      'Edited photos are delivered within 5–7 days via a private cloud gallery. All originals are also included, and clients receive full commercial rights to the final images.',
  },
  {
    question: 'What is the cancellation policy?',
    answer:
      '100% refund if you cancel more than 48 hours before the shoot, 50% refund between 24 and 48 hours, and no refund within 24 hours. Bookings can be rescheduled once at no cost.',
  },
  {
    question: 'Do you handle proposal photoshoots in Tokyo?',
    answer:
      'Yes. Proposals are typically booked under the Couple Session and arranged in advance with a discreet meeting plan so the partner being proposed to does not see the photographer until the moment.',
  },
  {
    question: 'What should I wear for a Tokyo photoshoot?',
    answer:
      'Solid, mid-saturation colors read best across Shibuya and Shinjuku neon. Avoid all-white tops under saturated signage. For Harajuku, fashion-forward looks work well; for Asakusa, kimono or muted earth tones suit the temple grounds.',
  },
];

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Tokyo Photoshoot Plans',
  itemListElement: PLANS.map((plan, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: absoluteUrl(`/plan/${plan.slug}`),
    name: plan.name,
  })),
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: STUDIO.description,
  publisher: { '@id': `${SITE_URL}/#studio` },
  inLanguage: 'en',
};

export default function Home() {
  return (
    <>
      <HomeClient />
      <FAQ items={HOME_FAQ} title="Tokyo Photoshoot FAQ" eyebrow="Common Questions" />
      <CTASection />
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={faqJsonLd(HOME_FAQ)} />
    </>
  );
}

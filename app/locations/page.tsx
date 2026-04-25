import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { LOCATIONS } from '@/lib/locations-content';
import { absoluteUrl, breadcrumbJsonLd, SITE_URL } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Tokyo Photoshoot Locations — Shibuya, Shinjuku, Harajuku, Akihabara',
  description:
    'Explore the Tokyo neighborhoods @ Studio ON shoots in. Shibuya Crossing, Shinjuku neon, Harajuku fashion, Asakusa temples, Akihabara electric town, Ginza luxury.',
  alternates: { canonical: '/locations' },
  openGraph: {
    title: 'Tokyo Photoshoot Locations — @ Studio ON',
    description:
      'Six Tokyo neighborhoods, six aesthetics. Pick the backdrop for your photoshoot.',
    url: `${SITE_URL}/locations`,
    type: 'website',
  },
};

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Tokyo Photoshoot Locations',
  itemListElement: LOCATIONS.map((location, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: absoluteUrl(`/locations/${location.slug}`),
    name: location.name,
  })),
};

export default function LocationsIndex() {
  return (
    <>
      <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-24 md:pt-32 pb-16 md:pb-24">
        <header className="px-4 md:px-12 max-w-[1400px] mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted mb-4">
            Tokyo / Locations
          </p>
          <h1 className="text-[clamp(32px,5.2vw,60px)] leading-[1.02] font-medium tracking-tight text-black max-w-3xl">
            Where we shoot in Tokyo.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] md:text-xl leading-relaxed text-notion-text-muted">
            Six neighborhoods, six aesthetics. Each guide covers the best frames, the recommended time of day, and how the location pairs with our session plans.
          </p>
        </header>

        <section className="mt-14 md:mt-20 px-4 md:px-12 max-w-[1400px] mx-auto">
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {LOCATIONS.map((location, i) => (
              <li key={location.slug}>
                <Link
                  href={`/locations/${location.slug}`}
                  className="group block border border-black/10 bg-white rounded-2xl overflow-hidden transition-colors hover:border-black/40"
                >
                  <div className="relative w-full aspect-[4/5] bg-black/5">
                    <Image
                      src={location.heroImage}
                      alt={location.heroAlt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      referrerPolicy="no-referrer"
                      priority={i < 3}
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-baseline justify-between mb-2">
                      <h2 className="text-xl md:text-2xl font-medium tracking-tight text-black">
                        {location.name}
                      </h2>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-notion-text-muted">
                        0{i + 1}
                      </span>
                    </div>
                    <p className="text-sm md:text-[15px] leading-[1.55] text-notion-text-muted line-clamp-3">
                      {location.intro.split('. ')[0]}.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {location.bestFor.slice(0, 2).map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 rounded-full bg-black/5 text-[10px] font-bold uppercase tracking-[0.12em] text-notion-text-muted"
                        >
                          {item.split(' ').slice(0, 4).join(' ')}…
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 md:mt-28 px-4 md:px-12 max-w-[1400px] mx-auto">
          <div className="border-t border-black/10 pt-10 md:pt-14 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted">
              How locations pair with plans
            </p>
            <p className="text-[17px] md:text-xl leading-[1.5] text-black max-w-2xl">
              Shibuya is included on every plan. Shinjuku adds a $50 surcharge for travel; Akihabara adds $100. Harajuku, Asakusa, and Ginza are available on request — message the studio after picking your plan.
            </p>
          </div>
        </section>
      </main>

      <JsonLd data={itemListJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Locations', path: '/locations' },
        ])}
      />
    </>
  );
}

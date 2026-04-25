import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import FAQ from '@/components/FAQ';
import JsonLd from '@/components/JsonLd';
import { findLocation, LOCATIONS, LOCATION_SLUGS } from '@/lib/locations-content';
import { PLANS } from '@/lib/plans';
import {
  absoluteUrl,
  breadcrumbJsonLd,
  faqJsonLd,
  SITE_URL,
  STUDIO,
} from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LOCATION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = findLocation(slug);
  if (!location) return { title: 'Location not found', robots: { index: false, follow: false } };

  return {
    title: location.metaTitle,
    description: location.metaDescription,
    alternates: { canonical: `/locations/${location.slug}` },
    openGraph: {
      title: location.metaTitle,
      description: location.metaDescription,
      url: `${SITE_URL}/locations/${location.slug}`,
      type: 'article',
      images: [
        {
          url: location.heroImage,
          width: 1200,
          height: 1500,
          alt: location.heroAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: location.metaTitle,
      description: location.metaDescription,
      images: [location.heroImage],
    },
  };
}

export default async function LocationPage({ params }: Props) {
  const { slug } = await params;
  const location = findLocation(slug);
  if (!location) notFound();

  const pairedLocations = location.pairsWith
    .map((s) => LOCATIONS.find((l) => l.slug === s))
    .filter((x): x is (typeof LOCATIONS)[number] => Boolean(x));

  return (
    <>
      <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-24 md:pt-32 pb-16 md:pb-24">
        {/* Header */}
        <header className="px-4 md:px-12 max-w-[1400px] mx-auto">
          <nav aria-label="Breadcrumb" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-notion-text-muted mb-6">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link href="/locations" className="hover:text-black transition-colors">Locations</Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-black">{location.name}</span>
          </nav>

          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted mb-4">
            {location.shortLabel}
          </p>
          <h1 className="text-[clamp(28px,4.6vw,52px)] leading-[1.02] font-medium tracking-tight text-black max-w-3xl">
            {location.name} photoshoot, by @ Studio ON.
          </h1>

          <div className="mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
            <div className="lg:col-span-6">
              <div className="relative w-full aspect-[4/5] md:aspect-[16/12] lg:aspect-[5/6] lg:max-h-[460px] rounded-3xl overflow-hidden bg-black/5">
                <Image
                  src={location.heroImage}
                  alt={location.heroAlt}
                  fill
                  priority
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 560px"
                />
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <p className="text-[17px] md:text-[19px] leading-[1.55] text-notion-text">
                {location.intro}
              </p>

              <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 border-t border-black/10 pt-8">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-notion-text-muted">Best for</dt>
                  <dd className="mt-2 text-[15px] leading-snug text-black">{location.bestFor[0]}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-notion-text-muted">Best time</dt>
                  <dd className="mt-2 text-[15px] leading-snug text-black">{location.bestTime.split('.')[0]}.</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-notion-text-muted">Pricing</dt>
                  <dd className="mt-2 text-[15px] leading-snug text-black">{location.surchargeNote}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-notion-text-muted">Pairs with</dt>
                  <dd className="mt-2 text-[15px] leading-snug text-black">
                    {pairedLocations.map((p, idx) => (
                      <span key={p.slug}>
                        <Link href={`/locations/${p.slug}`} className="underline underline-offset-4 hover:text-notion-text-muted">
                          {p.name}
                        </Link>
                        {idx < pairedLocations.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white hover:bg-black/80 transition-colors"
                >
                  Book a {location.name} session
                  <ArrowRight size={16} className="ml-2" />
                </Link>
                <Link
                  href="/#plans"
                  className="inline-flex items-center justify-center rounded-full border border-black/15 px-7 py-3.5 text-sm font-medium text-black hover:bg-black/5 transition-colors"
                >
                  View plans
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Best for */}
        <section className="mt-20 md:mt-28 px-4 md:px-12 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-16 border-t border-black/10 pt-10 md:pt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted">
              Best for
            </p>
            <ul className="space-y-4 text-[17px] md:text-xl leading-[1.4] text-black max-w-3xl">
              {location.bestFor.map((item) => (
                <li key={item} className="flex gap-4">
                  <span className="mt-2 inline-block h-px w-6 bg-black/40 shrink-0" aria-hidden />
                  <span>{item}.</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Spots */}
        <section className="mt-20 md:mt-28 px-4 md:px-12 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-16 border-t border-black/10 pt-10 md:pt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted">
              Spots we shoot
            </p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 max-w-3xl">
              {location.spots.map((spot, i) => (
                <li key={spot.name} className="border-t border-black/10 pt-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-notion-text-muted mb-2">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-lg md:text-xl font-medium text-black tracking-tight mb-1.5">
                    {spot.name}
                  </h3>
                  <p className="text-[14px] leading-[1.55] text-notion-text-muted">
                    {spot.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Best time */}
        <section className="mt-20 md:mt-28 px-4 md:px-12 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-16 border-t border-black/10 pt-10 md:pt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted">
              When to shoot
            </p>
            <p className="text-[17px] md:text-xl leading-[1.5] text-black max-w-3xl">
              {location.bestTime}
            </p>
          </div>
        </section>

        {/* Gallery */}
        {location.galleryImages.length > 0 && (
          <section className="mt-20 md:mt-28 px-4 md:px-12 max-w-[1400px] mx-auto">
            <div className="border-t border-black/10 pt-10 md:pt-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted mb-8">
                Frames from {location.name}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {location.galleryImages.map((img) => (
                  <div key={img.src} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-black/5">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Plans pairing */}
        <section className="mt-20 md:mt-28 px-4 md:px-12 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-16 border-t border-black/10 pt-10 md:pt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted">
              Recommended plans
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
              {PLANS.slice(0, 4).map((plan) => (
                <li key={plan.slug}>
                  <Link
                    href={`/plan/${plan.slug}`}
                    className="block border border-black/10 rounded-2xl p-5 bg-white hover:border-black/30 transition-colors"
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-base md:text-lg font-medium text-black tracking-tight">
                        {plan.name}
                      </h3>
                      <span className="text-base md:text-lg font-medium text-black">
                        ${plan.price}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-notion-text-muted line-clamp-2">
                      {plan.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Paired locations */}
        {pairedLocations.length > 0 && (
          <section className="mt-20 md:mt-28 px-4 md:px-12 max-w-[1400px] mx-auto">
            <div className="border-t border-black/10 pt-10 md:pt-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted mb-8">
                Pairs well with
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {pairedLocations.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/locations/${p.slug}`}
                      className="group flex gap-5 items-center border border-black/10 bg-white rounded-2xl p-4 hover:border-black/30 transition-colors"
                    >
                      <div className="relative w-24 h-28 shrink-0 rounded-xl overflow-hidden bg-black/5">
                        <Image
                          src={p.heroImage}
                          alt={p.heroAlt}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                          sizes="96px"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-medium text-black tracking-tight">
                          {p.name}
                        </h3>
                        <p className="mt-1 text-[13px] leading-relaxed text-notion-text-muted line-clamp-2">
                          {p.intro.split('. ')[0]}.
                        </p>
                      </div>
                      <ArrowRight
                        size={18}
                        className="text-notion-text-muted group-hover:text-black transition-colors shrink-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      <FAQ
        items={location.faq}
        title={`${location.name} photoshoot FAQ`}
        eyebrow={location.name}
      />

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'TravelAction',
          name: `Photoshoot in ${location.name}`,
          description: location.metaDescription,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Place',
          name: `${location.name}, Tokyo`,
          containedInPlace: {
            '@type': 'AdministrativeArea',
            name: 'Tokyo, Japan',
          },
          photo: absoluteUrl(location.heroImage),
          url: absoluteUrl(`/locations/${location.slug}`),
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: `${location.name} photoshoot`,
          serviceType: 'Photography session',
          areaServed: { '@type': 'AdministrativeArea', name: `${location.name}, Tokyo` },
          provider: { '@id': `${SITE_URL}/#studio` },
          description: location.intro,
          url: absoluteUrl(`/locations/${location.slug}`),
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: 150,
            highPrice: 300,
            offerCount: PLANS.length,
            url: absoluteUrl('/book'),
          },
        }}
      />
      <JsonLd data={faqJsonLd(location.faq)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Locations', path: '/locations' },
          { name: location.name, path: `/locations/${location.slug}` },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: location.metaTitle,
          description: location.metaDescription,
          image: absoluteUrl(location.heroImage),
          author: { '@type': 'Organization', name: '@ Studio ON' },
          publisher: { '@id': `${SITE_URL}/#studio` },
          mainEntityOfPage: absoluteUrl(`/locations/${location.slug}`),
          about: { '@type': 'Place', name: `${location.name}, Tokyo` },
          inLanguage: 'en',
          isFamilyFriendly: true,
          isBasedOn: STUDIO.image,
        }}
      />
    </>
  );
}

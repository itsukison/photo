import Link from 'next/link';
import Image from 'next/image';
import { LOCATIONS } from '@/lib/locations-content';

// Internal-linking grid that surfaces every /locations/[slug] page from
// the homepage. Important for crawl depth (one click from root) and for
// keyword anchor distribution across Tokyo neighborhood searches.

export default function SeoLocationsGrid() {
  return (
    <section className="bg-[#fcfcfc] border-t border-black/10 px-4 md:px-12 py-16 md:py-24" aria-labelledby="locations-heading">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted">
              Tokyo Locations
            </p>
            <h2
              id="locations-heading"
              className="mt-3 text-[clamp(32px,5vw,56px)] font-medium tracking-tight text-black leading-[1.02]"
            >
              Where We Shoot in Tokyo
            </h2>
          </div>
          <p className="md:text-right md:max-w-sm text-[15px] leading-relaxed text-notion-text-muted">
            Six neighborhoods, six aesthetics. Pick the backdrop that fits your trip.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {LOCATIONS.map((location) => (
            <li key={location.slug}>
              <Link
                href={`/locations/${location.slug}`}
                className="group block border border-black/10 bg-white rounded-2xl overflow-hidden transition-colors hover:border-black/30"
              >
                <div className="relative w-full aspect-[4/5] bg-black/5">
                  <Image
                    src={location.heroImage}
                    alt={location.heroAlt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    referrerPolicy="no-referrer"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5 md:p-6">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="text-lg md:text-xl font-medium tracking-tight text-black">
                      {location.name}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-notion-text-muted">
                      Tokyo
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-notion-text-muted line-clamp-2">
                    {location.bestFor[0]}.
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

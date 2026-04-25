import Link from 'next/link';
import { STUDIO } from '@/lib/seo';

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/studio.on.snap/' },
];

const navRows = [
  [
    { label: 'Home', href: '/' },
    { label: 'Plans', href: '/#plans' },
  ],
  [
    { label: 'About', href: '/about' },
    { label: 'Locations', href: '/locations' },
  ],
  [
    { label: 'Book', href: '/book' },
    { label: 'Profile', href: '/profile' },
  ],
];

const ADDRESS_LINE = `${STUDIO.address.streetAddress}, ${STUDIO.address.addressLocality}, ${STUDIO.address.addressRegion} ${STUDIO.address.postalCode}`;

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <section className="md:hidden px-5 pt-12 pb-10 mobile-safe-px">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">@ Studio ON</p>
        <h2 className="mt-3 text-[clamp(2rem,10vw,3rem)] font-medium leading-[0.95] tracking-tight">Tokyo, Japan</h2>
        <p className="mt-3 text-xs leading-relaxed text-white/55">
          {ADDRESS_LINE}
        </p>
        <p className="mt-5 max-w-[32ch] text-sm leading-relaxed text-white/65">
          Cinematic portrait sessions tailored for travelers, creatives, and founders who want timeless frames.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-medium text-white/80">
          <Link href="/" className="mobile-touch-target justify-start">Home</Link>
          <Link href="/#plans" className="mobile-touch-target justify-start">Plans</Link>
          <Link href="/about" className="mobile-touch-target justify-start">About</Link>
          <Link href="/locations" className="mobile-touch-target justify-start">Locations</Link>
          <Link href="/book" className="mobile-touch-target justify-start">Book</Link>
          <Link href="/commercial-law" className="mobile-touch-target justify-start">Legal</Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <a
            href={`mailto:${STUDIO.email}`}
            className="mobile-touch-target rounded-full border border-white/20 px-4 text-xs font-medium text-white/80"
          >
            Email
          </a>
          {socialLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="mobile-touch-target rounded-full border border-white/20 px-4 text-xs font-medium text-white/80"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-9 border-t border-white/10 pt-5 text-xs uppercase tracking-[0.14em] text-white/40">
          <div className="flex items-center justify-between">
            <span>Est. {STUDIO.foundingDate}</span>
            <Link href="#" className="text-white/60">Back to top</Link>
          </div>
        </div>
      </section>

      <div className="hidden md:block lg:flex lg:min-h-[calc(100vh-120px)] lg:flex-col">
        <div className="mx-auto max-w-[1600px] px-6 md:px-8 lg:px-10">
          <section className="grid grid-cols-1 gap-10 py-14 md:grid-cols-3 md:py-16 lg:py-12">
            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/65">Location</p>
              <p className="text-[clamp(26px,2.2vw,44px)] leading-[1.15] tracking-tight">
                Tokyo
                <br />
                Japan
              </p>
              <address className="not-italic text-sm leading-relaxed text-white/55 max-w-[30ch]">
                {STUDIO.address.streetAddress}
                <br />
                {STUDIO.address.addressLocality}, {STUDIO.address.addressRegion} {STUDIO.address.postalCode}
              </address>
            </div>

            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/65">Contact</p>
              <div className="space-y-2 text-[clamp(24px,2.1vw,40px)] leading-[1.2] tracking-tight">
                <Link href="/book" className="block transition-opacity hover:opacity-70">
                  Book via /book
                </Link>
                <Link href="/locations" className="block transition-opacity hover:opacity-70">
                  Explore /locations
                </Link>
              </div>
              <a
                href={`mailto:${STUDIO.email}`}
                className="inline-block text-sm text-white/55 hover:text-white transition-colors break-all"
              >
                {STUDIO.email}
              </a>
            </div>

            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/65">Follow</p>
              <ul className="space-y-1 text-[clamp(24px,2.1vw,40px)] leading-[1.22] tracking-tight">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="inline-flex items-center gap-2 transition-opacity hover:opacity-70">
                      <span>{link.label}</span>
                      <span className="text-[#f0ad68]">↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 lg:flex-1">
          <div className="mx-auto max-w-[1600px] px-6 md:px-8 lg:flex lg:h-full lg:flex-col lg:px-10">
            <section className="grid min-h-[280px] grid-cols-1 gap-10 py-12 md:grid-cols-[220px_1fr] md:py-14 lg:min-h-0 lg:flex-1 lg:py-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/65">Navigation</p>
              </div>

              <div className="font-serif text-[clamp(48px,6vw,112px)] leading-[0.9] tracking-[-0.02em]">
                {navRows.map((row) => (
                  <div key={row[0].label} className="flex flex-wrap items-end gap-x-4 md:gap-x-5">
                    {row.map((item, index) => (
                      <span key={item.label} className="inline-flex items-center">
                        <Link href={item.href} className="transition-opacity hover:opacity-70">
                          {item.label}
                        </Link>
                        {index < row.length - 1 && <span className="ml-4 md:ml-5">/</span>}
                      </span>
                    ))}
                    {row.length > 1 && <span>/</span>}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 items-end gap-4 border-t border-white/10 py-7 md:grid-cols-3 md:py-8 lg:py-6">
              <div>
                <Link href="#" className="inline-flex items-center gap-2 text-[clamp(20px,1.6vw,34px)] leading-none transition-opacity hover:opacity-70">
                  <span>Back To Top</span>
                  <span className="text-[#f0ad68]">↗</span>
                </Link>
              </div>
              <div className="md:text-center text-xs uppercase tracking-[0.14em] text-white/45">
                Est. {STUDIO.foundingDate} · @ Studio ON
              </div>
              <div className="md:text-right">
                <Link href="/commercial-law" className="text-xs uppercase tracking-[0.14em] text-white/45 hover:text-white transition-colors">
                  特定商取引法に基づく表記
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </footer>
  );
}

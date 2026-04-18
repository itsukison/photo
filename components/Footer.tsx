import Link from 'next/link';

const socialLinks = [
  { label: 'Instagram', href: '#' },
  { label: 'X.com', href: '#' },
  { label: 'Portfolio', href: '/#plans' },
  { label: 'Book Session', href: '/book' },
];

const navRows = [
  [
    { label: 'Home', href: '/' },
    { label: 'Plans', href: '/#plans' },
  ],
  [
    { label: 'About', href: '/about' },
    { label: 'Book', href: '/book' },
  ],
  [
    { label: 'Profile', href: '/profile' },
    { label: 'Legal', href: '/commercial-law' },
  ],
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <section className="md:hidden px-5 pt-12 pb-10 mobile-safe-px">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Shion Studio</p>
        <h2 className="mt-3 text-[clamp(2rem,10vw,3rem)] font-medium leading-[0.95] tracking-tight">Seoul, South Korea</h2>
        <p className="mt-5 max-w-[32ch] text-sm leading-relaxed text-white/65">
          Cinematic portrait sessions tailored for travelers, creatives, and founders who want timeless frames.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-medium text-white/80">
          <Link href="/" className="mobile-touch-target justify-start">Home</Link>
          <Link href="/#plans" className="mobile-touch-target justify-start">Plans</Link>
          <Link href="/about" className="mobile-touch-target justify-start">About</Link>
          <Link href="/book" className="mobile-touch-target justify-start">Book</Link>
          <Link href="/commercial-law" className="mobile-touch-target justify-start">Legal</Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
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
            <span>Est. 2024</span>
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
                Seoul
                <br />
                South Korea
              </p>
            </div>

            <div className="space-y-8">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-white/65">Contact</p>
              <div className="space-y-2 text-[clamp(24px,2.1vw,40px)] leading-[1.2] tracking-tight">
                <Link href="/book" className="block transition-opacity hover:opacity-70">
                  Book via /book
                </Link>
                <Link href="/profile" className="block transition-opacity hover:opacity-70">
                  Manage via /profile
                </Link>
              </div>
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

              <p className="text-[clamp(20px,1.55vw,34px)] leading-tight md:text-center">
                Designed with love &amp; care by SHION STUDIO
              </p>
            </section>
          </div>
        </div>
      </div>
    </footer>
  );
}

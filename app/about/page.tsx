import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import FAQ from '@/components/FAQ';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, faqJsonLd, SITE_URL, STUDIO } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'About @ Studio ON — Tokyo Photographers',
  description:
    'Meet @ Studio ON: a Tokyo-based photography studio crafting cinematic, editorial portraits across Shibuya, Shinjuku, Harajuku, and Akihabara. Founded by Shion Park.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About @ Studio ON — Tokyo Photographers',
    description:
      'A Tokyo studio specializing in cinematic, editorial portraits for travelers, couples, and creators.',
    url: `${SITE_URL}/about`,
    type: 'profile',
  },
};

const ABOUT_FAQ = [
  {
    question: 'Who runs @ Studio ON?',
    answer:
      '@ Studio ON was founded in 2024 by Shion Park, a Tokyo-based photographer focused on editorial portraiture. The studio operates from Setagaya and shoots across central Tokyo.',
  },
  {
    question: 'What is your photography style?',
    answer:
      'High-contrast, cinematic, color-graded in a single signature edit. We emphasize natural light and candid moments rather than heavily posed studio frames, and we deliberately mix iconic backdrops (Shibuya Crossing, neon storefronts) with quieter alleys to give every gallery range.',
  },
  {
    question: 'Are you available for commercial or brand work?',
    answer:
      'Yes. The studio takes on selected commercial briefs (brand lookbooks, hotel and travel campaigns, content creator partnerships). Reach out via shionpark06@gmail.com with the brief and timeline.',
  },
  {
    question: 'Where is the studio based?',
    answer:
      'Our base is in Setagaya, Tokyo (156-0053). Sessions take place on location across Shibuya, Shinjuku, Akihabara, and on request Harajuku, Asakusa, or Ginza.',
  },
];

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-notion-text-muted mb-4">
            About the studio
          </p>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 md:mb-12">
            About @ Studio ON
          </h1>

          <div className="relative w-full aspect-[4/3] md:aspect-video mb-12 md:mb-16 rounded-3xl overflow-hidden bg-black/5 shadow-lg">
            <Image
              src="/crossingsinglemain1.jpg"
              alt="Cinematic Tokyo portrait by @ Studio ON, photographed at Shibuya Crossing"
              fill
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          <div className="space-y-7 md:space-y-8 text-[1.06rem] md:text-xl text-gray-600 leading-relaxed">
            <p>
              <strong className="text-black font-medium">@ Studio ON</strong> is a Tokyo-based photography studio that produces cinematic, editorial portraits across Shibuya, Shinjuku, Harajuku, and Akihabara for travelers, couples, and creators. Tokyo is our canvas — a city of contrasts where ancient shrines meet neon-drenched skyscrapers, and quiet tradition thrives amidst hyper-modernity.
            </p>
            <p>
              Led by founder <strong className="text-black font-medium">Shion Park</strong> and our team of in-house photographers, the studio crafts aesthetic, high-end visual narratives specifically tailored for international travelers and clients seeking a polished editorial edge. Every session is treated as a guided journey through Tokyo, not a generic portrait shoot.
            </p>

            <h2 className="text-2xl md:text-3xl font-medium text-black mt-12 md:mt-16 mb-4 md:mb-6 tracking-tight">
              Our Philosophy
            </h2>
            <p>
              We focus on natural mastery of light, authentic candid moments, and the unique architecture of Tokyo&rsquo;s urban landscape. Whether we&rsquo;re crafting a quick solo portrait at the heart of Shibuya Crossing or a full-day editorial along the Sumida River, our mission is to deliver timeless images that resonate.
            </p>

            <h2 className="text-2xl md:text-3xl font-medium text-black mt-12 md:mt-16 mb-4 md:mb-6 tracking-tight">
              The Experience
            </h2>
            <ul className="list-disc pl-5 md:pl-6 space-y-3 md:space-y-4">
              <li>
                <strong className="text-black font-medium">Iconic &amp; hidden locations:</strong> we guide you to secret alleys, the most vibrant sunset peaks, and Tokyo&rsquo;s most breathtaking backdrops.
              </li>
              <li>
                <strong className="text-black font-medium">Natural direction:</strong> no modeling experience needed. Refined, gentle direction so you feel comfortable and look stunning.
              </li>
              <li>
                <strong className="text-black font-medium">Premium art direction:</strong> every image is meticulously color-graded and curated to reflect our signature high-end aesthetic.
              </li>
              <li>
                <strong className="text-black font-medium">English-speaking team:</strong> we operate in English, Japanese, and Korean — so booking, direction, and delivery are friction-free for international clients.
              </li>
            </ul>

            <h2 className="text-2xl md:text-3xl font-medium text-black mt-12 md:mt-16 mb-4 md:mb-6 tracking-tight">
              Studio details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-3 gap-x-6 text-base md:text-lg border-t border-black/10 pt-6">
              <dt className="font-medium text-black">Founder</dt>
              <dd>Shion Park</dd>
              <dt className="font-medium text-black">Founded</dt>
              <dd>{STUDIO.foundingDate}</dd>
              <dt className="font-medium text-black">Base</dt>
              <dd>Setagaya, Tokyo (156-0053)</dd>
              <dt className="font-medium text-black">Service area</dt>
              <dd>Shibuya, Shinjuku, Harajuku, Asakusa, Akihabara, Ginza</dd>
              <dt className="font-medium text-black">Languages</dt>
              <dd>English, Japanese, Korean</dd>
              <dt className="font-medium text-black">Email</dt>
              <dd>
                <a href={`mailto:${STUDIO.email}`} className="underline underline-offset-4 hover:text-black">
                  {STUDIO.email}
                </a>
              </dd>
              <dt className="font-medium text-black">Instagram</dt>
              <dd>
                <a
                  href="https://www.instagram.com/studio.on.snap/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-black"
                >
                  @studio.on.snap
                </a>
              </dd>
            </dl>

            <div className="mt-12 md:mt-16 flex flex-col sm:flex-row gap-3">
              <Link
                href="/book"
                className="inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-sm font-medium text-white hover:bg-black/80 transition-colors"
              >
                Book a session
              </Link>
              <Link
                href="/locations"
                className="inline-flex items-center justify-center rounded-full border border-black/15 px-8 py-4 text-sm font-medium text-black hover:bg-black/5 transition-colors"
              >
                Explore locations
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FAQ items={ABOUT_FAQ} title="About the studio" eyebrow="More on @ Studio ON" />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />
      <JsonLd data={faqJsonLd(ABOUT_FAQ)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About @ Studio ON',
          url: `${SITE_URL}/about`,
          mainEntity: { '@id': `${SITE_URL}/#studio` },
        }}
      />
    </>
  );
}

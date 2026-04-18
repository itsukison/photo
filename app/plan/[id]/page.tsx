'use client';

import { useParams } from 'next/navigation';
import { fetchPlans, type Plan } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';

const planImages: Record<string, string> = {
  quick: 'https://picsum.photos/seed/seoul1/1200/800',
  portrait: '/portrait.png',
  fisheye: '/fisheye1.jpeg',
  golden: 'https://picsum.photos/seed/seoul3/1200/800',
  neon: 'https://picsum.photos/seed/seoul4/1200/800',
  full: 'https://picsum.photos/seed/seoul5/1200/800',
  vintage: 'https://picsum.photos/seed/seoul6/1200/800',
};

export default function PlanDetailPage() {
  const params = useParams();
  const planSlug = params.id as string;
  const isMobile = useIsMobile();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans()
      .then((plans) => setPlan(plans.find((p) => p.slug === planSlug) ?? null))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [planSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] pt-32 md:pt-40 px-6 flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] pt-32 md:pt-40 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4 text-black">Plan not found</h1>
        <Link href="/#plans" className="text-notion-text-muted hover:text-black transition-colors underline underline-offset-4">
          Return to plans
        </Link>
      </div>
    );
  }

  const imageSrc = planImages[plan.slug] || 'https://picsum.photos/seed/seoul1/1200/800';

  return (
    <main className="bg-[#fcfcfc] text-notion-text selection:bg-notion-text selection:text-white pt-[84px] md:pt-[96px] pb-28 md:pb-0 font-sans">
      {/* Hero Section */}
      <section className="min-h-[calc(100svh-84px)] md:min-h-[calc(100svh-96px)] lg:h-[calc(100svh-96px)] flex flex-col lg:flex-row px-4 md:px-12 pb-8 lg:pb-12 pt-4 lg:pt-8 gap-8 md:gap-12 lg:gap-16 max-w-[2000px] mx-auto">
        {/* Left: Typography & Grid */}
        <div className="order-2 lg:order-1 flex-1 flex flex-col justify-between pt-2 lg:pt-8 lg:pb-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Link href="/#plans" className="inline-flex items-center gap-2 text-[11px] font-bold text-notion-text opacity-70 hover:opacity-100 transition-opacity uppercase tracking-[0.2em] mb-8 md:mb-12 lg:mb-20">
              <ArrowRight className="rotate-180" size={14} />
              Back
            </Link>
          </motion.div>

          <div className="mb-10 lg:mb-0">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-[44px] sm:text-[56px] md:text-[80px] lg:text-[7vw] xl:text-[100px] leading-[0.92] tracking-tighter font-medium text-black uppercase lg:-ml-1 mb-5 md:mb-6 lg:mb-8"
            >
              {plan.name}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-base sm:text-lg md:text-[22px] lg:text-[24px] text-notion-text-muted leading-[1.4] font-medium max-w-xl"
            >
              {plan.description}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-y-7 md:gap-y-10 gap-x-5 md:gap-x-6 border-t border-black/10 pt-6 md:pt-8 lg:pt-10 mt-auto"
          >
            <div>
              <div className="text-[10px] font-bold text-notion-text-muted uppercase tracking-[0.2em] mb-2.5 md:mb-3">Duration</div>
              <div className="text-lg md:text-xl lg:text-2xl font-medium tracking-tight text-black">{plan.duration} Mins</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-notion-text-muted uppercase tracking-[0.2em] mb-2.5 md:mb-3">Location</div>
              <div className="text-lg md:text-xl lg:text-2xl font-medium tracking-tight text-black">Curated</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-notion-text-muted uppercase tracking-[0.2em] mb-2.5 md:mb-3">Included</div>
              <div className="text-lg md:text-xl lg:text-2xl font-medium tracking-tight text-black">Full Gallery</div>
            </div>
            <div className="hidden lg:flex items-end justify-end mt-4 lg:mt-0 col-span-2 lg:col-span-1">
              <Link
                href={`/book?plan=${plan.slug}`}
                className="w-full lg:w-auto px-8 h-12 lg:h-14 rounded-full bg-black text-white flex items-center justify-center text-[12px] font-bold uppercase tracking-[0.1em] hover:bg-black/80 transition-colors text-center whitespace-nowrap"
              >
                Book — ${plan.price}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right: Editorial Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="order-1 lg:order-2 lg:w-[45%] xl:w-[40%] h-[46svh] min-h-[300px] sm:h-[52svh] lg:h-full relative rounded-[24px] lg:rounded-[32px] overflow-hidden flex-shrink-0"
        >
          <Image
            src={imageSrc}
            alt={plan.name}
            fill
            priority
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </section>

      {/* Editorial Enrichment Section */}
      <section className="px-4 md:px-12 py-16 md:py-24 lg:py-32 bg-[#fcfcfc] border-t border-black/10 mt-6 lg:mt-0">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 lg:gap-8">
          {/* Left Column: The Experience */}
          <div className="lg:col-span-6 flex flex-col pr-0 lg:pr-16">
            <h2 className="text-[11px] font-bold text-notion-text uppercase tracking-[0.2em] mb-8 md:mb-10 border-b border-black/10 pb-4">
              The Experience
            </h2>

            <div className="space-y-10 md:space-y-12">
              <div className="group">
                <div className="text-[10px] font-bold text-notion-text-muted mb-2.5 md:mb-3 uppercase tracking-[0.2em]">Phase 01</div>
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3 text-black">Consultation</h3>
                <p className="text-base md:text-lg text-notion-text-muted leading-[1.5] font-medium max-w-md">
                  Pre-shoot discussion to understand your vision, style preferences, and select the perfect locations in Seoul tailored precisely to your aesthetic.
                </p>
              </div>

              <div className="group">
                <div className="text-[10px] font-bold text-notion-text-muted mb-2.5 md:mb-3 uppercase tracking-[0.2em]">Phase 02</div>
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3 text-black">The Shoot</h3>
                <p className="text-base md:text-lg text-notion-text-muted leading-[1.5] font-medium max-w-md">
                  A comfortable, guided session focused on natural light and candid moments. We employ subtle, professional direction to capture you genuinely.
                </p>
              </div>

              <div className="group">
                <div className="text-[10px] font-bold text-notion-text-muted mb-2.5 md:mb-3 uppercase tracking-[0.2em]">Phase 03</div>
                <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3 text-black">Editing</h3>
                <p className="text-base md:text-lg text-notion-text-muted leading-[1.5] font-medium max-w-md">
                  Meticulously color-graded within our signature cinematic style. Delivery via high-resolution private gallery within 5—7 days.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Included */}
          <div className="lg:col-span-5 lg:col-start-8 flex flex-col">
            <h2 className="text-[11px] font-bold text-notion-text uppercase tracking-[0.2em] mb-8 md:mb-10 border-b border-black/10 pb-4">
              Deliverables
            </h2>

            <ul className="flex flex-col border-t border-black/10 w-full mb-10 md:mb-12">
              {[
                'Professional creative direction',
                'All original JPEGs from session',
                `${plan && plan.duration > 60 ? '30' : '15'} Signature Retouched photographs`,
                "Locals' hidden architectural spots",
                'High-resolution cloud delivery',
                'Full commercial rights',
              ].map((item, i) => (
                <li key={i} className="py-4 md:py-5 border-b border-black/10 flex items-center justify-between group cursor-default">
                  <span className="text-base md:text-lg lg:text-xl font-medium tracking-tight text-notion-text group-hover:text-black transition-colors duration-300">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {/* Style Reference Image */}
            <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden group">
              <Image
                src="https://picsum.photos/seed/seouleditorial/1200/900"
                alt="Editorial style reference"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />
              <div className="absolute bottom-6 left-6">
                <span className="px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md text-black text-[11px] font-bold uppercase tracking-[0.15em] shadow-lg">
                  Style Reference
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isMobile && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] md:hidden">
          <div className="mx-auto max-w-lg rounded-full border border-black/10 bg-white/95 p-1 shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-md">
            <Link
              href={`/book?plan=${plan.slug}`}
              className="mobile-touch-target flex w-full items-center justify-center rounded-full bg-black px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white"
            >
              Book This Plan — ${plan.price}
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

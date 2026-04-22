'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ImageTrail } from '@/components/ui/image-trail';
import { motion, useReducedMotion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';
import Image from 'next/image';

const images = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
];

export default function CTASection() {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isMobile) {
    return (
      <section className="relative w-full min-h-[92svh] bg-black flex flex-col items-center justify-center overflow-hidden px-5 py-20 mobile-safe-px">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,173,104,0.24),transparent_45%),radial-gradient(circle_at_78%_72%,rgba(106,154,140,0.23),transparent_50%)]" />

        {!shouldReduceMotion && (
          <>
            <motion.div
              animate={{ y: [-8, 22, -8], x: [0, 10, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-[10%] top-[20%] h-28 w-28 overflow-hidden rounded-[1.4rem] border border-white/20"
            >
              <Image src={images[0]} alt="session 1" fill className="object-cover" draggable={false} />
            </motion.div>
            <motion.div
              animate={{ y: [10, -18, 10], x: [0, -12, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute right-[8%] top-[34%] h-24 w-24 overflow-hidden rounded-[1.2rem] border border-white/20"
            >
              <Image src={images[2]} alt="session 2" fill className="object-cover" draggable={false} />
            </motion.div>
            <motion.div
              animate={{ y: [-6, 16, -6], x: [0, 8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className="absolute bottom-[22%] left-[18%] h-20 w-20 overflow-hidden rounded-[1rem] border border-white/20"
            >
              <Image src={images[4]} alt="session 3" fill className="object-cover" draggable={false} />
            </motion.div>
          </>
        )}

        <div className="relative z-10 flex flex-col items-center gap-8 text-center select-none">
          <p className="text-white/40 text-[11px] tracking-[0.24em] uppercase font-semibold">
            Tokyo · Est. 2024
          </p>

          <h2 className="text-[clamp(2.4rem,11vw,4rem)] font-medium leading-[0.95] tracking-tight text-white">
            Book your
            <br />
            session.
          </h2>

          <p className="text-white/55 text-base font-medium max-w-[26ch] leading-snug tracking-tight">
            One city. One hour. Frames you keep forever.
          </p>

          <Link
            href="/book"
            className="mobile-touch-target mt-1 inline-flex items-center gap-3 px-8 rounded-full border border-white/25 bg-white/5 backdrop-blur-sm text-white text-base font-medium tracking-tight"
          >
            Reserve your slot
            <ArrowUpRight size={18} className="transition-transform duration-300" />
          </Link>
        </div>

        <div className="absolute bottom-7 left-0 right-0 z-10 flex justify-between px-8 pointer-events-none text-white/20 text-[11px] tracking-widest uppercase">
          <span>@ Studio ON</span>
          <span>Photography</span>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Full-cover reference div — ImageTrail uses this to calculate relative mouse position */}
      <div ref={containerRef} className="absolute inset-0 z-0">
        <ImageTrail
          containerRef={containerRef as React.RefObject<HTMLElement>}
          interval={80}
          rotationRange={12}
        >
          {images.map((url, i) => (
            <div key={i} className="relative overflow-hidden w-28 h-28 rounded-sm">
              <Image src={url} alt={`session ${i + 1}`} fill className="object-cover" draggable={false} />
            </div>
          ))}
        </ImageTrail>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center select-none">
        {/* Eyebrow */}
        <p className="text-white/40 text-xs tracking-[0.25em] uppercase font-medium">
          Tokyo · Est. 2024
        </p>

        {/* Headline — capped at 80px to match site's largest display text */}
        <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-medium leading-[0.95] tracking-tight text-white">
          Book your<br />session.
        </h2>

        {/* Sub-text */}
        <p className="text-white/50 text-lg md:text-xl font-medium max-w-sm leading-snug tracking-tight">
          One city. One hour. Frames you keep forever.
        </p>

        {/* CTA Button */}
        <Link
          href="/book"
          className="mt-2 inline-flex items-center gap-3 px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white text-base font-medium tracking-tight hover:bg-white hover:text-black transition-all duration-300 group"
        >
          Reserve your slot
          <ArrowUpRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>

      {/* Swiss grid bottom anchors */}
      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-between px-8 pointer-events-none">
        <span className="text-white/20 text-xs tracking-widest uppercase">@ Studio ON</span>
        <span className="text-white/20 text-xs tracking-widest uppercase">Photography</span>
      </div>
    </section>
  );
}

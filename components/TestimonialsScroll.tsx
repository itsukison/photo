'use client';

import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform, motion } from 'motion/react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const TESTIMONIALS = [
  {
    index: '01',
    quote: "I've had professional headshots before but never like this. @ Studio ON found light in me I didn't know existed. The whole session felt completely effortless.",
    name: 'Yoon Ji-seo',
    role: 'Brand Strategist',
    bgColor: 'bg-[#3d5e45]',
    textColor: 'text-white',
    avatar: '/testimonials/avatar1.png',
  },
  {
    index: '02',
    isImage: true,
    image: '/testimonials/image1.png',
  },
  {
    index: '03',
    quote: "I've worked with photographers across New York and Paris. The Tokyo session was different — unhurried, precise, genuinely cinematic. Every location was perfect.",
    name: 'Marcus Bell',
    role: 'Creative Director',
    bgColor: 'bg-[#c66014]',
    textColor: 'text-white',
    avatar: '/testimonials/avatar2.png',
  },
  {
    index: '04',
    quote: "Every frame felt considered. Not posed, not performed — just real. I've never had photos I actually loved until these.",
    name: 'Aiko Tanaka',
    role: 'Fashion Editor',
    bgColor: 'bg-[#214051]',
    textColor: 'text-white',
    avatar: '/testimonials/avatar3.png',
  },
  {
    index: '05',
    isImage: true,
    image: '/testimonials/image2.png',
  },
];

export default function TestimonialsScroll() {
  const isMobile = useIsMobile();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useEffect(() => {
    if (isMobile) return;

    const update = () => {
      if (!trackRef.current) return;
      const trackW = trackRef.current.scrollWidth;
      const viewW = window.innerWidth;
      setOffset(Math.max(0, trackW - viewW + (viewW > 768 ? 128 : 64)));
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isMobile]);

  const x = useTransform(scrollYProgress, [0.05, 0.9], [0, -offset]);

  if (isMobile) {
    return (
      <section className="bg-[#fcfcfc] px-4 pb-16 pt-12">
        <div className="mb-6">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-notion-text-muted">
            Client Stories
          </span>
          <h2 className="mt-2 text-[clamp(28px,8vw,44px)] font-medium tracking-tight text-notion-text leading-[1.02]">
            What our clients say.
          </h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar -mx-1 px-1">
          {TESTIMONIALS.map((t, idx) => (
            <article
              key={idx}
              className={cn(
                'snap-start shrink-0 w-[82vw] min-w-[280px] max-w-[340px] h-[310px] rounded-[1.7rem] overflow-hidden p-6 flex flex-col justify-between relative',
                t.isImage ? 'bg-notion-bg-hover' : t.bgColor,
                t.textColor
              )}
            >
              {t.isImage ? (
                <Image src={t.image!} alt="Session" fill className="object-cover" />
              ) : (
                <>
                  <p className="text-[17px] font-medium leading-[1.32] tracking-tight">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                      <Image src={t.avatar!} alt={t.name!} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{t.name}</p>
                      <p className="text-xs opacity-65 font-medium">{t.role}</p>
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>

        <div className="mt-5 flex justify-between items-center">
          <span className="text-notion-text-muted text-[11px] font-semibold tracking-[0.18em] uppercase">Est. 2024</span>
          <span className="text-notion-text-muted text-[11px] font-semibold tracking-[0.18em] uppercase">Tokyo</span>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-[300vh] bg-[#fcfcfc]"
    >
      {/* pt-24 = 96px ensures content starts below the fixed navbar */}
      <div className="sticky top-0 h-screen flex flex-col justify-between overflow-hidden pt-24 pb-10 px-8 md:px-16">

        {/* Header */}
        <div className="flex items-end justify-between flex-shrink-0">
          <div>
            <span className="text-notion-text-muted text-xs font-medium tracking-[0.2em] uppercase">
              Client Stories
            </span>
            <h2 className="mt-2 text-[clamp(28px,4vw,52px)] font-medium tracking-tight text-notion-text leading-[1.05]">
              What our clients say.
            </h2>
          </div>
          <span className="text-notion-text-muted text-sm font-medium hidden md:block italic">
            Scroll to explore →
          </span>
        </div>

        {/* Horizontal Track */}
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex gap-6 md:gap-8 items-stretch will-change-transform flex-shrink-0"
        >
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className={cn(
                'flex-shrink-0 w-[80vw] md:w-[380px] lg:w-[420px] h-[300px] md:h-[340px] rounded-[2rem] overflow-hidden flex flex-col justify-between p-8 md:p-10 relative',
                t.isImage ? 'bg-notion-bg-hover' : t.bgColor,
                t.textColor
              )}
            >
              {t.isImage ? (
                <Image
                  src={t.image!}
                  alt="Session"
                  fill
                  className="object-cover"
                />
              ) : (
                <>
                  {/* Quote */}
                  <p className="text-[clamp(16px,1.8vw,22px)] font-medium leading-[1.3] tracking-tight">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                      <Image
                        src={t.avatar!}
                        alt={t.name!}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base leading-tight">{t.name}</p>
                      <p className="text-xs md:text-sm opacity-60 font-medium">{t.role}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </motion.div>

        {/* Bottom anchor — Swiss grid */}
        <div className="flex justify-between items-center flex-shrink-0">
          <span className="text-notion-text-muted text-xs font-medium tracking-widest uppercase">
            Est. 2024
          </span>
          <span className="text-notion-text-muted text-xs font-medium tracking-widest uppercase">
            Tokyo
          </span>
        </div>

      </div>
    </section>
  );
}

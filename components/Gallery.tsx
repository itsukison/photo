'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { fetchPlans, type Plan } from '@/lib/data';
import Link from 'next/link';
import { useIsMobile } from '@/hooks/use-mobile';

gsap.registerPlugin(ScrollTrigger);

const planImages = [
  {
    src: '/mainportrait.jpg',
    y: 24,
    speed: 0.8,
  },
  {
    src: '/redneonportrait3.jpg',
    y: 0,
    speed: 0.6,
  },
  {
    src: '/crossing_yellow.JPG',
    y: 48,
    speed: 1.0,
  },
  {
    src: '/blackman_crossing.JPG',
    y: 12,
    speed: 0.7,
  },
  {
    src: '/mighty_pink.JPG',
    y: 36,
    speed: 0.9,
  },
];

export default function Gallery() {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (plans.length === 0 || isMobile) return;
    const ctx = gsap.context(() => {
      imagesRef.current.forEach((img, i) => {
        if (!img) return;

        gsap.to(img, {
          y: () => -40 * (planImages[i]?.speed || 1),
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [plans, isMobile]);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[90vh] bg-notion-bg overflow-hidden py-14 md:py-20"
      id="plans"
    >
      <div className="max-w-7xl mx-auto px-6 relative h-full">
        <div className="mb-8 md:mb-10 flex items-end justify-between">
          <div>
            <span className="text-notion-text-muted text-xs font-medium tracking-[0.2em] uppercase">
              Sessions
            </span>
            <h2 className="mt-2 text-[clamp(28px,4vw,52px)] font-medium tracking-tight text-notion-text">
              Our Packages
            </h2>
          </div>
          <div className="hidden md:block text-notion-text-muted font-medium text-sm max-w-[240px] text-right leading-relaxed">
            Curated experiences for those who seek cinematic frames in Tokyo.
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 relative">
          {plans.map((plan, i) => {
            const imgData = planImages[i] || planImages[0];
            return (
              <div
                key={plan.id}
                ref={(el) => {
                  imagesRef.current[i] = el;
                }}
                className={`relative w-full group ${isMobile ? 'mx-auto max-w-[340px]' : ''}`}
                style={{ marginTop: isMobile ? `${(i % 2) * 12}px` : `${imgData.y}px` }}
              >
                <Link href={`/plan/${plan.slug}`} className="block">
                  <div className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl shadow-sm bg-notion-bg-hover mb-4 md:mb-6">
                    <Image
                      src={imgData.src}
                      alt={plan.name}
                      fill
                      className="object-cover transition-transform duration-700 scale-100 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="px-1">
                    {/* Top Row: Name & Price */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl md:text-[22px] font-bold tracking-tight text-black">
                        {plan.name}
                      </h3>
                      <div className="flex flex-col items-end shrink-0 ml-3">
                        <span className="text-[11px] font-semibold text-black/30 line-through leading-none mb-0.5">
                          ${plan.originalPrice}
                        </span>
                        <span className="text-xl md:text-[22px] font-bold text-black leading-tight">
                          ${plan.price}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-notion-text-muted leading-relaxed mb-4">
                      {plan.description}
                    </p>

                    {/* Divider */}
                    <div className="h-px w-full bg-black/10 mb-5" />

                    {/* Metadata Key-Value List */}
                    <div className="flex flex-col gap-3">
                      {/* Lens Row */}
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-[10px] font-bold text-notion-text-muted/50 uppercase tracking-[0.1em]">
                          Lens
                        </span>
                        <div className="flex items-center gap-2">
                          {plan.lens.split('+').map((part, idx, arr) => {
                            const lensName = part.trim();
                            const isPortrait = lensName.toLowerCase().includes('portrait');
                            const isFishEye = lensName.toLowerCase().includes('fish eye');

                            const style = 'bg-black/5 text-notion-text-muted border-transparent';

                            const displayLabel = isPortrait
                              ? 'Portrait Lens'
                              : isFishEye
                                ? 'Fish Eye Lens'
                                : lensName;

                            return (
                              <div key={displayLabel} className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] border ${style}`}>
                                  {displayLabel}
                                </span>
                                {idx < arr.length - 1 && (
                                  <span className="text-[10px] font-bold text-notion-text-muted opacity-60">
                                    +
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Duration Row */}
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-[10px] font-bold text-notion-text-muted/50 uppercase tracking-[0.1em]">
                          Duration
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/5 text-[10px] font-bold text-notion-text-muted uppercase tracking-[0.1em] border border-transparent">
                          {plan.duration} Min
                        </span>
                      </div>

                      {/* Delivered Row */}
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-[10px] font-bold text-notion-text-muted/50 uppercase tracking-[0.1em]">
                          Delivered
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-black/5 text-[10px] font-bold text-notion-text-muted uppercase tracking-[0.1em] border border-transparent">
                          {plan.photoCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

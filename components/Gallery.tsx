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
  { src: '/portrait.png', y: 24, speed: 0.8 },
  { src: '/portrait2.png', y: 0,  speed: 0.6 },
  { src: '/fisheye1.jpeg', y: 48, speed: 1.0 },
];

export default function Gallery() {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetchPlans().then(setPlans).catch(() => setPlans([]));
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
    <div ref={containerRef} className="relative w-full min-h-[90vh] bg-notion-bg overflow-hidden py-14 md:py-20" id="plans">
      <div className="max-w-7xl mx-auto px-6 relative h-full">
        <div className="mb-8 md:mb-10 flex items-end justify-between">
          <div>
            <span className="text-notion-text-muted text-xs font-medium tracking-[0.2em] uppercase">Sessions</span>
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
                className={`relative w-full group ${isMobile ? 'mx-auto max-w-[304px]' : ''}`}
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
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-lg md:text-xl font-medium tracking-tight text-notion-text">{plan.name}</h3>
                      <span className="text-sm font-medium text-notion-text-muted">${plan.price}</span>
                    </div>
                    <p className="text-sm text-notion-text-muted line-clamp-3 leading-relaxed mb-3">{plan.description}</p>
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold text-notion-text-muted/60 uppercase tracking-[0.15em]">
                      <span>{plan.duration} MIN SESSION</span>
                      <span className="w-1 h-1 rounded-full bg-notion-text-muted/40" />
                      <span>FULL GALLERY</span>
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

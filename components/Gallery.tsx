'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { fetchPlans, type Plan } from '@/lib/data';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

const planImages = [
  { src: 'https://picsum.photos/seed/seoul1/800/1200', y: 0, speed: 1.2 },
  { src: 'https://picsum.photos/seed/seoul2/800/1000', y: 50, speed: 0.8 },
  { src: 'https://picsum.photos/seed/seoul3/1000/800', y: 100, speed: 1.5 },
  { src: 'https://picsum.photos/seed/seoul4/800/1200', y: 20, speed: 0.9 },
  { src: 'https://picsum.photos/seed/seoul5/1200/800', y: 80, speed: 1.1 },
  { src: 'https://picsum.photos/seed/seoul6/800/1200', y: 40, speed: 1.3 },
];

export default function Gallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetchPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (plans.length === 0) return;
    const ctx = gsap.context(() => {
      imagesRef.current.forEach((img, i) => {
        if (!img) return;

        gsap.to(img, {
          y: () => -100 * (planImages[i]?.speed || 1),
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
  }, [plans]);

  return (
    <div ref={containerRef} className="relative w-full min-h-[150vh] bg-notion-bg overflow-hidden py-24" id="plans">
      <div className="max-w-7xl mx-auto px-6 relative h-full">
        <div className="mb-20 text-center">
          <h2 className="text-4xl md:text-[56px] font-semibold tracking-tighter mb-6 text-notion-text">
            Our Packages
          </h2>
          <p className="text-xl text-notion-text-muted font-medium max-w-2xl mx-auto">
            Choose the perfect session for your Seoul adventure. All plans include high-resolution digital delivery.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
          {plans.map((plan, i) => {
            const imgData = planImages[i] || planImages[0];
            return (
              <div
                key={plan.id}
                ref={(el) => {
                  imagesRef.current[i] = el;
                }}
                className="relative w-full group"
                style={{ marginTop: `${imgData.y}px` }}
              >
                <Link href={`/plan/${plan.slug}`} className="block">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl shadow-sm bg-notion-bg-hover mb-6">
                    <Image
                      src={imgData.src}
                      alt={plan.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      referrerPolicy="no-referrer"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  </div>
                  <div className="px-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-semibold tracking-tight text-notion-text">{plan.name}</h3>
                      <span className="text-lg font-medium text-notion-text">${plan.price}</span>
                    </div>
                    <p className="text-notion-text-muted mb-4 line-clamp-2">{plan.description}</p>
                    <div className="text-sm font-medium text-notion-text-muted uppercase tracking-wider">
                      {plan.duration} mins
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

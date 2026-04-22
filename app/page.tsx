'use client';

import Gallery from '@/components/Gallery';
import Preloader from '@/components/Preloader';
import TestimonialsScroll from '@/components/TestimonialsScroll';
import CTASection from '@/components/CTASection';
import { PhotoGallery } from '@/components/ui/gallery';
import { Search, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, motion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileHeroLayer {
  src: string;
  alt: string;
  className: string;
}

interface MobileEditorialFrame {
  src: string;
  alt: string;
  className: string;
}

const MOBILE_HERO_LAYERS: MobileHeroLayer[] = [
  {
    src: 'https://picsum.photos/seed/mobilehero1/900/1200',
    alt: 'Tokyo portrait on stairs',
    className: 'left-1 top-10 h-[33svh] w-[41vw] rotate-[-7deg]',
  },
  {
    src: 'https://picsum.photos/seed/mobilehero2/900/1200',
    alt: 'Neon evening portrait',
    className: 'left-[29vw] top-4 h-[30svh] w-[40vw] rotate-[4deg]',
  },
  {
    src: 'https://picsum.photos/seed/mobilehero3/900/1200',
    alt: 'Editorial close-up shot',
    className: 'right-1 top-12 h-[35svh] w-[36vw] rotate-[9deg]',
  },
];

const MOBILE_EDITORIAL_FRAMES: MobileEditorialFrame[] = [
  {
    src: 'https://picsum.photos/seed/fashion1/600/800',
    alt: 'Fashion editorial 1',
    className: 'left-[6%] top-[14%] h-[52%] w-[33%] rotate-[-6deg]',
  },
  {
    src: 'https://picsum.photos/seed/fashion2/400/600',
    alt: 'Fashion editorial 2',
    className: 'left-[35%] top-[22%] h-[46%] w-[28%] rotate-[3deg]',
  },
  {
    src: 'https://picsum.photos/seed/fashion3/800/1200',
    alt: 'Fashion editorial 3',
    className: 'right-[5%] top-[10%] h-[74%] w-[36%] rotate-[8deg]',
  },
];

function DesktopLanding() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'] as const,
  });

  // Move hero content up like normal scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], ['0vh', '-125vh']);

  // Expand video container
  const videoWidth = useTransform(scrollYProgress, [0, 0.5], ['35vw', '86vw']);
  const videoHeight = useTransform(scrollYProgress, [0, 0.5], ['25vh', '78vh']);
  const videoBottom = useTransform(scrollYProgress, [0, 0.5], ['-28vh', '8vh']);
  const videoBorderRadius = useTransform(scrollYProgress, [0, 0.5], ['24px', '32px']);

  // Fade in the text as image expands
  const videoContentOpacity = useTransform(scrollYProgress, [0.02, 0.2], [0, 1]);

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-notion-text selection:bg-notion-text selection:text-white">
      <Preloader />

      {/* Cosmos-style Hero Section with Scroll Animation */}
      <div ref={containerRef} className="h-[250vh] relative">
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center pt-[96px]">

          {/* Hero Content that fades out */}
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-[96px]"
          >
            <PhotoGallery animationDelay={1.8} />
          </motion.div>

          {/* Expanding Video Container */}
          <motion.div
            style={{
              width: videoWidth,
              height: videoHeight,
              bottom: videoBottom,
              borderRadius: videoBorderRadius,
            }}
            className="absolute z-20 overflow-hidden flex items-center justify-center shadow-2xl"
          >
            {/* The expanded video/image content */}
            <Image
              src="https://picsum.photos/seed/fashionvideo/1920/1080"
              alt="Watch the film featuring Odessa A'zion"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <motion.div
              style={{ opacity: videoContentOpacity }}
              className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center pointer-events-none"
            >
              <div className="absolute inset-0 flex items-center justify-between px-12 md:px-24 text-white">
                <div className="flex items-center gap-4 md:gap-6">
                  <Play size={56} className="fill-current" />
                  <span className="text-4xl md:text-[56px] font-medium tracking-tight">Our</span>
                </div>
                <span className="text-4xl md:text-[56px] font-medium tracking-tight">Vision</span>
              </div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium">
                Tokyo &apos;24 Collection
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>



      {/* Feature Section: Know what you're looking at */}
      <section className="h-[100svh] min-h-[700px] max-h-[1000px] flex flex-col justify-center bg-[#fcfcfc] overflow-hidden pt-[96px] pb-12">
        <div className="max-w-[1400px] mx-auto px-6 w-full">
          {/* Top text */}
          <div className="flex justify-between items-center mb-12 md:mb-16">
            <h3 className="text-xl md:text-[24px] font-medium tracking-tight text-notion-text">Natural light.</h3>
            <h3 className="text-xl md:text-[24px] font-medium tracking-tight text-notion-text">True results.</h3>
          </div>

          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left Text */}
            <div className="flex lg:justify-end text-center lg:text-right">
              <h2 className="text-[48px] md:text-[64px] leading-[0.95] font-medium tracking-tight text-black">
                Crafting<br />the perfect<br />frame.
              </h2>
            </div>

            {/* Center Image */}
            <div className="relative w-full max-w-[320px] lg:max-w-md mx-auto aspect-[3/4] rounded-[24px] overflow-hidden shadow-lg">
              <Image
                src="https://picsum.photos/seed/interior/800/1000"
                alt="Interior Design"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Overlay Pills */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/5">
                <div className="px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-white text-sm font-medium shadow-lg">
                  Shibuya Crossing. Night. Captured by
                </div>
                <div className="px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-white text-sm font-medium shadow-lg">
                  @ Studio ON
                </div>
              </div>
            </div>

            {/* Right Text */}
            <div className="flex lg:justify-start text-center lg:text-left">
              <p className="text-xl md:text-[28px] leading-[1.2] font-medium text-notion-text-muted max-w-sm mx-auto lg:mx-0">
                Our studio specializes in cool, high-end that capture the real you in Tokyo’s iconic settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GSAP Gallery Section (Now Plans) */}
      <Gallery />

      {/* Testimonials Horizontal Scroll */}
      <TestimonialsScroll />

      {/* CTA Section with ImageTrail */}
      <CTASection />
    </main>
  );
}

function MobileLanding() {
  const stickyCtaStopRef = useRef<HTMLDivElement>(null);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [isNearCta, setIsNearCta] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setHasScrolledPastHero(window.scrollY > window.innerHeight * 0.7);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!stickyCtaStopRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearCta(entry.isIntersecting);
      },
      { rootMargin: '-25% 0px -25% 0px' }
    );

    observer.observe(stickyCtaStopRef.current);
    return () => observer.disconnect();
  }, []);

  const showStickyCta = hasScrolledPastHero && !isNearCta;

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-notion-text selection:bg-notion-text selection:text-white md:hidden">
      <Preloader />

      <section className="relative min-h-[100svh] overflow-hidden flex flex-col justify-center px-4 pb-10 pt-[110px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[70svh] bg-[radial-gradient(circle_at_top,#d8d4ce_0%,rgba(252,252,252,0.15)_65%,transparent_95%)]" />
        <p className="relative z-10 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-black/45">@ Studio ON · Tokyo</p>
        <h1 className="relative z-10 mx-auto mt-4 max-w-[13ch] text-center text-[clamp(2.25rem,10vw,3.8rem)] font-medium leading-[0.95] tracking-tight text-black">
          Cinematic Tokyo Moments
        </h1>
        <p className="relative z-10 mx-auto mt-5 max-w-[28ch] text-center text-sm leading-relaxed text-black/65">
          Tokyo sessions shaped like an editorial story, designed for travelers who want frames that feel timeless.
        </p>

        <div className="relative mt-6 h-[40svh] min-h-[250px]">
          {MOBILE_HERO_LAYERS.map((layer) => (
            <motion.div
              key={layer.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className={`absolute overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_16px_48px_rgba(0,0,0,0.16)] ${layer.className}`}
            >
              <Image
                src={layer.src}
                alt={layer.alt}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                sizes="50vw"
              />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 mt-3 flex items-center justify-center gap-3">
          <Link href="/book" className="mobile-touch-target inline-flex rounded-full bg-black px-6 text-sm font-medium text-white">
            Book a session
          </Link>
          <Link href="#plans" className="mobile-touch-target inline-flex rounded-full border border-black/15 bg-white px-6 text-sm font-medium text-black">
            View portfolio
          </Link>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="rounded-[30px] bg-black p-3 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[24px]">
            <Image
              src="https://picsum.photos/seed/fashionvideo/1920/1080"
              alt="Our vision cinematic film"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
            <div className="absolute inset-x-5 bottom-6 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em]">
                <Play size={13} className="fill-current" />
                Watch reel
              </div>
              <h2 className="text-[clamp(1.9rem,8vw,2.8rem)] font-medium leading-[0.95] tracking-tight">Our Vision</h2>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/75">Tokyo &apos;24 Collection</p>
            </div>
          </div>
        </div>
      </section>



      <section className="px-4 pb-16">
        <div className="rounded-[30px] border border-black/10 bg-[linear-gradient(180deg,#f5f4f2_0%,#ffffff_58%)] p-5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
            <span>Natural light</span>
            <span>True results</span>
          </div>

          <div className="mt-6 grid gap-5">
            <h2 className="max-w-[12ch] text-[clamp(2rem,9vw,3.2rem)] font-medium leading-[0.92] tracking-tight text-black">
              Crafting the perfect frame.
            </h2>

            <div className="relative mx-auto aspect-[3/4] w-[78vw] max-w-[320px] overflow-hidden rounded-[22px] shadow-lg">
              <Image
                src="https://picsum.photos/seed/interior/800/1000"
                alt="Tokyo portrait lighting setup"
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                sizes="80vw"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10 p-4 text-center">
                <span className="rounded-full border border-white/50 bg-white/30 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                  Shibuya Crossing. Night
                </span>
                <span className="rounded-full border border-white/50 bg-white/30 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                  Captured by @ Studio ON
                </span>
              </div>
            </div>

            <p className="text-lg font-medium leading-[1.25] tracking-tight text-notion-text-muted">
              Our studio specializes in cool, high-end that capture the real you in Tokyo’s iconic settings.
            </p>
          </div>
        </div>
      </section>

      <Gallery />
      <TestimonialsScroll />

      <div ref={stickyCtaStopRef} className="h-px" aria-hidden />
      <CTASection />

      {showStickyCta && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="mx-auto max-w-md rounded-full border border-black/10 bg-white/92 p-1 shadow-[0_14px_40px_rgba(0,0,0,0.2)] backdrop-blur-md">
            <Link
              href="/book"
              className="pointer-events-auto mobile-touch-target flex w-full items-center justify-center rounded-full bg-black px-6 text-sm font-semibold tracking-[0.02em] text-white"
            >
              Book now
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLanding />;
  }

  return <DesktopLanding />;
}

'use client';

import Gallery from '@/components/Gallery';
import Preloader from '@/components/Preloader';
import { Search, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { useScroll, useTransform, motion } from 'motion/react';

const FLOATING_IMAGES = [
  { id: 1, top: '10%', left: '15%', rotate: -15, width: 80, height: 100, blur: 'blur-[2px]', opacity: 0.8 },
  { id: 2, top: '25%', left: '25%', rotate: 10, width: 100, height: 120, blur: 'blur-none', opacity: 1 },
  { id: 3, top: '40%', left: '8%', rotate: -5, width: 120, height: 90, blur: 'blur-sm', opacity: 0.6 },
  { id: 4, top: '55%', left: '18%', rotate: 20, width: 90, height: 110, blur: 'blur-none', opacity: 0.9 },
  { id: 5, top: '15%', left: '40%', rotate: -25, width: 70, height: 70, blur: 'blur-md', opacity: 0.5 },
  { id: 6, top: '75%', left: '12%', rotate: -10, width: 110, height: 130, blur: 'blur-none', opacity: 1 },
  { id: 7, top: '85%', left: '25%', rotate: 15, width: 80, height: 100, blur: 'blur-sm', opacity: 0.7 },
  { id: 8, top: '65%', left: '5%', rotate: 5, width: 90, height: 90, blur: 'blur-[2px]', opacity: 0.8 },
  { id: 9, top: '90%', left: '40%', rotate: -20, width: 100, height: 80, blur: 'blur-md', opacity: 0.4 },
  { id: 10, top: '80%', left: '35%', rotate: 25, width: 70, height: 90, blur: 'blur-none', opacity: 0.9 },
  { id: 11, top: '12%', left: '85%', rotate: 15, width: 90, height: 120, blur: 'blur-none', opacity: 1 },
  { id: 12, top: '25%', left: '70%', rotate: -10, width: 110, height: 90, blur: 'blur-sm', opacity: 0.7 },
  { id: 13, top: '40%', left: '90%', rotate: 20, width: 80, height: 100, blur: 'blur-[2px]', opacity: 0.8 },
  { id: 14, top: '20%', left: '55%', rotate: -15, width: 70, height: 70, blur: 'blur-md', opacity: 0.5 },
  { id: 15, top: '50%', left: '80%', rotate: -5, width: 100, height: 130, blur: 'blur-none', opacity: 0.9 },
  { id: 16, top: '65%', left: '85%', rotate: -15, width: 120, height: 90, blur: 'blur-none', opacity: 1 },
  { id: 17, top: '80%', left: '70%', rotate: 10, width: 90, height: 110, blur: 'blur-sm', opacity: 0.7 },
  { id: 18, top: '90%', left: '90%', rotate: -20, width: 80, height: 80, blur: 'blur-[2px]', opacity: 0.8 },
  { id: 19, top: '95%', left: '55%', rotate: 15, width: 100, height: 120, blur: 'blur-md', opacity: 0.4 },
  { id: 20, top: '70%', left: '60%', rotate: -25, width: 70, height: 90, blur: 'blur-none', opacity: 0.9 },
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'] as const
  });

  // Move hero content up like normal scroll
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], ["0vh", "-125vh"]);

  // Expand video container
  const videoWidth = useTransform(scrollYProgress, [0, 0.5], ["40vw", "85vw"]);
  const videoHeight = useTransform(scrollYProgress, [0, 0.5], ["30vh", "82vh"]);
  const videoBottom = useTransform(scrollYProgress, [0, 0.5], ["-22vh", "8vh"]);
  const videoBorderRadius = useTransform(scrollYProgress, [0, 0.5], ["24px", "32px"]);

  // Fade in the text quickly as the image reaches full size
  const videoContentOpacity = useTransform(scrollYProgress, [0.2, 0.4], [0, 1]);

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-notion-text selection:bg-notion-text selection:text-white">
      <Preloader />

      {/* Cosmos-style Hero Section with Scroll Animation */}
      <div ref={containerRef} className="h-[250vh] relative">
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center">

          {/* Hero Content that fades out */}
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Floating Images Background */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {FLOATING_IMAGES.map((img) => (
                <div
                  key={img.id}
                  className={`absolute rounded-2xl overflow-hidden shadow-sm ${img.blur}`}
                  style={{
                    top: img.top,
                    left: img.left,
                    width: img.width,
                    height: img.height,
                    transform: `rotate(${img.rotate}deg)`,
                    opacity: img.opacity,
                  }}
                >
                  <Image
                    src={`https://picsum.photos/seed/cosmos${img.id}/${img.width * 2}/${img.height * 2}`}
                    alt="Floating inspiration"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>

            {/* Center Content */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 -mt-24">
              <span className="text-sm font-bold tracking-[0.2em] uppercase mb-6 text-black">
                SHION STUDIO
              </span>
              <h1 className="text-[56px] md:text-[68px] leading-[1.05] font-normal tracking-tight mb-10 text-black">
                Cinematic<br />Seoul Moments
              </h1>

              <div className="flex items-center gap-4">
                <Link
                  href="/book"
                  className="h-12 rounded-full bg-black text-white px-8 flex items-center justify-center text-sm font-medium hover:bg-black/80 transition-colors"
                >
                  Book a session
                </Link>
                <Link
                  href="#plans"
                  className="h-12 rounded-full bg-white/80 backdrop-blur-sm border border-black/10 text-black px-8 flex items-center justify-center text-sm font-medium hover:bg-white transition-colors shadow-sm"
                >
                  View portfolio
                </Link>
              </div>
            </div>

            {/* Bottom Text */}
            <div className="absolute bottom-[20vh] left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-black cursor-pointer transition-colors">
              <Play size={16} className="fill-current" />
              <span>Experience our craft</span>
            </div>
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
              className="absolute inset-0 bg-black/40"
            >
              <div className="absolute inset-0 flex items-center justify-between px-12 md:px-24 text-white">
                <div className="flex items-center gap-4 md:gap-6">
                  <Play size={56} className="fill-current" />
                  <span className="text-4xl md:text-[56px] font-medium tracking-tight">Our</span>
                </div>
                <span className="text-4xl md:text-[56px] font-medium tracking-tight">Vision</span>
              </div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium">
                Seoul &apos;24 Collection
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Cosmos-style Showcase Section */}
      <section className="px-6 max-w-7xl mx-auto pb-24 pt-10">
        <h2 className="text-4xl md:text-[56px] font-medium tracking-tighter text-center mb-12 text-notion-text">
          Every shot tells your unique story.
        </h2>

        {/* Main Card */}
        <div className="relative w-full h-[400px] md:h-[600px] rounded-[32px] bg-[#452c2e] overflow-hidden shadow-sm">

          {/* Left Image */}
          <div className="absolute left-[12%] top-[15%] bottom-[15%] w-[22%] rounded-sm overflow-hidden">
            <Image
              src="https://picsum.photos/seed/fashion1/600/800"
              alt="Editorial"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Center Image */}
          <div className="absolute left-[42%] top-[20%] bottom-[20%] w-[16%] rounded-sm overflow-hidden">
            <Image
              src="https://picsum.photos/seed/fashion2/400/600"
              alt="Editorial"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Right Image */}
          <div className="absolute right-0 top-0 bottom-0 w-[32%]">
            <Image
              src="https://picsum.photos/seed/fashion3/800/1200"
              alt="Editorial"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Search Pill */}
          <div className="absolute left-[38%] top-1/2 -translate-y-1/2 w-[300px] h-14 rounded-full bg-gradient-to-r from-[#3a2224]/80 to-[#2a1a1c]/80 backdrop-blur-md border border-white/10 flex items-center px-6 gap-3 text-white shadow-2xl z-10">
            <Search size={18} className="text-white/80" />
            <span className="text-base font-medium text-white/90">bukchon nights</span>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="mt-16 text-center">
          <p className="text-xl md:text-[26px] text-notion-text-muted font-medium leading-snug tracking-tight">
            Your style, your memories, your Seoul.<br />
            Professionally captured, uniquely yours.
          </p>
        </div>
      </section>

      {/* Feature Section: Know what you're looking at */}
      <section className="py-32 bg-[#fcfcfc] overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Top text */}
          <div className="flex justify-between items-center mb-24 md:mb-32">
            <h3 className="text-2xl md:text-[28px] font-medium tracking-tight text-black">Natural light.</h3>
            <h3 className="text-2xl md:text-[28px] font-medium tracking-tight text-black">True results.</h3>
          </div>

          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 items-center">
            {/* Left Text */}
            <div className="flex lg:justify-end text-center lg:text-right">
              <h2 className="text-[56px] md:text-[80px] leading-[0.95] font-medium tracking-tight text-black">
                Crafting<br />the perfect<br />frame.
              </h2>
            </div>

            {/* Center Image */}
            <div className="relative w-full max-w-md mx-auto aspect-[3/4] md:aspect-[4/5] rounded-[24px] overflow-hidden shadow-lg">
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
                  Street style in Myeongdong. Captured by
                </div>
                <div className="px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-white text-sm font-medium shadow-lg">
                  Shion Studio
                </div>
              </div>
            </div>

            {/* Right Text */}
            <div className="flex lg:justify-start text-center lg:text-left">
              <p className="text-2xl md:text-[32px] leading-[1.1] font-medium text-gray-500 max-w-sm mx-auto lg:mx-0">
                Our studio specializes in high-end, aesthetic portraits that capture the real you in Seoul&apos;s iconic settings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GSAP Gallery Section (Now Plans) */}
      <Gallery />
    </main>
  );
}

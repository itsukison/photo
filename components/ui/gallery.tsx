"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// Tokyo photography studio images — portrait/editorial style via picsum
const PHOTOS = [
  {
    id: 1,
    order: 0,
    x: "-320px",
    y: "15px",
    zIndex: 50,
    direction: "left" as Direction,
    src: "https://picsum.photos/seed/tokyoa/440/440",
    alt: "Tokyo portrait session",
  },
  {
    id: 2,
    order: 1,
    x: "-160px",
    y: "32px",
    zIndex: 40,
    direction: "left" as Direction,
    src: "https://picsum.photos/seed/tokyob/440/440",
    alt: "Shinjuku street photography",
  },
  {
    id: 3,
    order: 2,
    x: "0px",
    y: "8px",
    zIndex: 30,
    direction: "right" as Direction,
    src: "https://picsum.photos/seed/tokyoc/440/440",
    alt: "Asakusa portrait",
  },
  {
    id: 4,
    order: 3,
    x: "160px",
    y: "22px",
    zIndex: 20,
    direction: "right" as Direction,
    src: "https://picsum.photos/seed/tokyodistrict/440/440",
    alt: "Neon nights Ginza",
  },
  {
    id: 5,
    order: 4,
    x: "320px",
    y: "44px",
    zIndex: 10,
    direction: "left" as Direction,
    src: "https://picsum.photos/seed/tokyoarchitecture/440/440",
    alt: "Tokyo modern architecture",
  },
  {
    id: 6,
    order: 5,
    x: "480px",
    y: "62px",
    zIndex: 5,
    direction: "right" as Direction,
    src: "/redneonfriendship2.jpg",
    alt: "Red neon friendship portrait",
  },
];

type Direction = "left" | "right";

export const PhotoGallery = ({
  animationDelay = 0.5,
}: {
  animationDelay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);

    const animationTimer = setTimeout(() => {
      setIsLoaded(true);
    }, (animationDelay + 0.4) * 1000);

    return () => {
      clearTimeout(visibilityTimer);
      clearTimeout(animationTimer);
    };
  }, [animationDelay]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photoVariants: any = {
    hidden: () => ({ x: 0, y: 0, rotate: 0, scale: 1 }),
    visible: (custom: { x: string; y: string; order: number }) => ({
      x: custom.x,
      y: custom.y,
      rotate: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 70,
        damping: 12,
        mass: 1,
        delay: custom.order * 0.15,
      },
    }),
  };

  return (
    <div className="relative w-full">
      {/* Subtle grid backdrop */}
      <div className="absolute inset-0 max-md:hidden top-[160px] -z-10 h-[300px] w-full bg-[linear-gradient(to_right,#37352f_1px,transparent_1px),linear-gradient(to_bottom,#37352f_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.06] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Studio label */}
      <p className="my-2 text-center text-xs font-bold tracking-[0.2em] uppercase text-black/40">
        @ Studio ON · Tokyo
      </p>

      {/* Hero title */}
      <h1 className="mx-auto max-w-2xl text-center text-[clamp(36px,6vw,68px)] leading-[1.05] font-medium tracking-tight text-black py-3">
        Cinematic<br />Tokyo Moments
      </h1>

      {/* Photo fan */}
      <div className="relative mb-8 h-[350px] w-full items-center justify-center lg:flex">
        <motion.div
          className="relative mx-auto flex w-full max-w-7xl justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="relative flex w-full justify-center"
            variants={containerVariants}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
          >
            <div className="relative h-[220px] w-[220px]">
              {[...PHOTOS].reverse().map((photo) => (
                <motion.div
                  key={photo.id}
                  className="absolute left-0 top-0"
                  style={{ zIndex: photo.zIndex }}
                  variants={photoVariants}
                  custom={{ x: photo.x, y: photo.y, order: photo.order }}
                >
                  <Photo
                    width={220}
                    height={220}
                    src={photo.src}
                    alt={photo.alt}
                    direction={photo.direction}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* CTAs */}
      <div className="flex items-center justify-center gap-4">
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
  );
};

function getRandomRotation(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export const Photo = ({
  src,
  alt,
  className,
  direction,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  direction?: Direction;
  width: number;
  height: number;
}) => {
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    const r = getRandomRotation(1, 4) * (direction === "left" ? -1 : 1);
    setRotation(r);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      whileTap={{ scale: 1.2, zIndex: 9999 }}
      whileHover={{
        scale: 1.1,
        rotateZ: 2 * (direction === "left" ? -1 : 1),
        zIndex: 9999,
      }}
      whileDrag={{ scale: 1.1, zIndex: 9999 }}
      initial={{ rotate: 0 }}
      animate={{ rotate: rotation }}
      style={{
        width,
        height,
        perspective: 400,
        zIndex: 1,
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        touchAction: "none",
      }}
      className={cn(
        className,
        "relative mx-auto shrink-0 cursor-grab active:cursor-grabbing"
      )}
      draggable={false}
      tabIndex={0}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-md">
        <Image
          className="rounded-3xl object-cover"
          fill
          src={src}
          alt={alt}
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>
    </motion.div>
  );
};

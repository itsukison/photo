'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Preloader() {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = 'hidden';

    if (shouldReduceMotion) {
      const quickFinish = setTimeout(() => {
        setIsLoading(false);
        document.body.style.overflow = 'unset';
      }, 180);

      return () => {
        clearTimeout(quickFinish);
        document.body.style.overflow = 'unset';
      };
    }

    const tick = isMobile ? 70 : 100;
    const maxStep = isMobile ? 20 : 15;
    const settleDelay = isMobile ? 220 : 400;

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            document.body.style.overflow = 'unset';
          }, settleDelay);
          return 100;
        }

        // Random increments for a more realistic feel
        return Math.min(100, p + Math.floor(Math.random() * maxStep) + 6);
      });
    }, tick);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{
            duration: shouldReduceMotion ? 0.18 : isMobile ? 0.55 : 0.8,
            ease: [0.76, 0, 0.24, 1],
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-notion-bg text-notion-text"
        >
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: shouldReduceMotion ? 0 : '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.45, delay: shouldReduceMotion ? 0 : 0.1, ease: 'easeOut' }}
              className="text-xl md:text-3xl font-semibold tracking-tight"
            >
              @ STUDIO ON
            </motion.div>
          </div>

          <div className="mt-5 w-40 md:w-48 h-[1px] bg-notion-border overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-notion-text"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.1, ease: 'linear' }}
            />
          </div>

          <div className="mt-3 text-[11px] font-mono text-notion-text-muted tracking-widest">
            {Math.min(progress, 100)}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

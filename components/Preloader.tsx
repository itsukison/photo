'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = 'hidden';

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            document.body.style.overflow = 'unset';
          }, 400); // Brief pause at 100% before sliding up
          return 100;
        }
        // Random increments for a more realistic feel
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }} // Custom easing for a premium "slide up" feel
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-notion-bg text-notion-text"
        >
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
              className="text-2xl md:text-3xl font-semibold tracking-tight"
            >
              SHION STUDIO
            </motion.div>
          </div>
          
          <div className="mt-6 w-48 h-[1px] bg-notion-border overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-notion-text"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
          
          <div className="mt-3 text-xs font-mono text-notion-text-muted tracking-widest">
            {Math.min(progress, 100)}%
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

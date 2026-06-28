'use client';
import { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

interface Props {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
  className?: string;
}

export function ScrollReveal({ children, delay = 0, direction = 'up', className }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const controls = useAnimation();

  const initial = {
    opacity: 0,
    y: direction === 'up' ? 60 : 0,
    x: direction === 'left' ? -60 : direction === 'right' ? 60 : 0,
  };

  useEffect(() => {
    if (inView) controls.start({ opacity: 1, y: 0, x: 0 });
  }, [inView, controls]);

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={controls}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

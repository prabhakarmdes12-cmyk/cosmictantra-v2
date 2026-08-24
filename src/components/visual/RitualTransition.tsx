'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RitualTransitionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const RitualFadeIn = ({ children, delay = 0, className = '' }: RitualTransitionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.6, 
      delay, 
      ease: [0.23, 1.0, 0.32, 1] 
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const RitualStagger = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: delay,
        },
      },
    }}
  >
    {children}
  </motion.div>
);

export const RitualCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ 
      y: -2,
      transition: { duration: 0.2, ease: "easeOut" }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const RitualDrawer = ({ 
  isOpen, 
  children 
}: { 
  isOpen: boolean; 
  children: React.ReactNode;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1.0, 0.32, 1] }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

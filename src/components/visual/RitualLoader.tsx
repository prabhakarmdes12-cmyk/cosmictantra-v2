'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RitualLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RitualLoader({ text = "Consulting the Ephemeris...", size = 'md' }: RitualLoaderProps) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className={`${sizes[size]} border-2 border-[#8E6F1D]/20 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner rotating element (Mandala style) */}
        <motion.div
          className={`absolute inset-0 ${sizes[size]} border-t-2 border-[#8E6F1D] rounded-full`}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Center dot */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className="w-1.5 h-1.5 bg-[#8E6F1D] rounded-full" />
        </div>
      </div>

      {text && (
        <div className="mt-4 text-xs tracking-widest text-[#8E6F1D] font-mono">
          {text}
        </div>
      )}
    </div>
  );
}

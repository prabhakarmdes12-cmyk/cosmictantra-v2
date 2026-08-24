'use client';

import React from 'react';

interface CosmicTantraLogoProps {
  variant?: 'full' | 'emblem' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  subtitle?: string;
}

export function CosmicTantraEmblem({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 280"
      className={`${className} shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ct-gold-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9B6A13" />
          <stop offset="48%" stopColor="#D1A72E" />
          <stop offset="100%" stopColor="#A8581C" />
        </linearGradient>
        <linearGradient id="ct-gold-bright" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D1A72E" />
          <stop offset="100%" stopColor="#F5D061" />
        </linearGradient>
      </defs>

      <g transform="translate(140 140)" stroke="url(#ct-gold-grad)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Corner Brackets */}
        <path d="M-92 -74 H-132 V-34 M92 -74 H132 V-34 M-92 74 H-132 V34 M92 74 H132 V34" />
        
        {/* Cardinal Directional Triangles */}
        <path d="M0 -132 L-15 -112 H15 Z M132 0 L112 -15 V15 Z M0 132 L-15 112 H15 Z M-132 0 L-112 -15 V15 Z" fill="url(#ct-gold-grad)" />
        
        {/* Orbit Circles */}
        <circle cx="0" cy="0" r="80" strokeDasharray="3 8" />
        <circle cx="0" cy="0" r="57" />
        <circle cx="0" cy="0" r="24" />
        
        {/* Axes */}
        <path d="M0 -94 V94 M-94 0 H94" />
        
        {/* Cardinal Nodes */}
        <circle cx="0" cy="-94" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad)" strokeWidth="2" />
        <circle cx="94" cy="0" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad)" strokeWidth="2" />
        <circle cx="0" cy="94" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad)" strokeWidth="2" />
        <circle cx="-94" cy="0" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad)" strokeWidth="2" />
        
        {/* Diagonal Ray Ticks */}
        <path d="M-40 -40 l-7 -7 M40 -40 l7 -7 M40 40 l7 7 M-40 40 l-7 7" />
        
        {/* Central Bindu */}
        <circle cx="0" cy="0" r="11" fill="url(#ct-gold-grad)" stroke="none" />
      </g>
    </svg>
  );
}

export default function CosmicTantraLogo({
  variant = 'full',
  size = 'md',
  className = '',
  subtitle = 'VEDIC PRECISION'
}: CosmicTantraLogoProps) {
  const sizeMap = {
    sm: { emblem: 'w-7 h-7', title: 'text-sm tracking-[0.16em]', sub: 'text-[8px] tracking-[0.24em]' },
    md: { emblem: 'w-9 h-9', title: 'text-base sm:text-lg tracking-[0.18em]', sub: 'text-[9px] tracking-[0.26em]' },
    lg: { emblem: 'w-12 h-12', title: 'text-xl sm:text-2xl tracking-[0.2em]', sub: 'text-[11px] tracking-[0.28em]' },
    xl: { emblem: 'w-16 h-16', title: 'text-3xl sm:text-4xl tracking-[0.22em]', sub: 'text-[13px] tracking-[0.3em]' },
  }[size];

  if (variant === 'emblem') {
    return <CosmicTantraEmblem className={`${sizeMap.emblem} ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      {variant === 'full' && (
        <div className="relative p-1 rounded-xl bg-gradient-to-br from-white/90 to-[#FAF7F2]/90 dark:from-[#11131C] dark:to-[#0A0C12] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 shadow-xs group-hover:border-[#D4AF37] transition-all">
          <CosmicTantraEmblem className={sizeMap.emblem} />
        </div>
      )}

      <div className="flex flex-col">
        <span className={`font-editorial font-bold text-[#1C1917] dark:text-[#F5F2EB] group-hover:text-[#8E6F1D] dark:group-hover:text-[#D4AF37] transition-colors ${sizeMap.title}`}>
          COSMICTANTRA
        </span>
        <span className={`font-mono-data font-bold text-[#8E6F1D] dark:text-[#D4AF37] uppercase opacity-90 ${sizeMap.sub}`}>
          {subtitle}
        </span>
      </div>
    </div>
  );
}

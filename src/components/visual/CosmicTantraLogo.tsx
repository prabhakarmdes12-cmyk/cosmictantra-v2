'use client';

import React from 'react';

interface CosmicTantraLogoProps {
  variant?: 'horizontal' | 'stacked' | 'emblem' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  subtitle?: string;
}

/**
 * Authentic Astrolabe / Yantra Mandala Emblem from logo/cosmictantra_logo.svg
 */
export function CosmicTantraEmblem({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 280"
      className={`${className} shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ct-gold-grad-v2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9B6A13" />
          <stop offset="48%" stopColor="#D1A72E" />
          <stop offset="100%" stopColor="#A8581C" />
        </linearGradient>
      </defs>

      <g transform="translate(140 140)" stroke="url(#ct-gold-grad-v2)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer Corner Brackets */}
        <path d="M-92 -74 H-132 V-34 M92 -74 H132 V-34 M-92 74 H-132 V34 M92 74 H132 V34" />
        
        {/* Cardinal Directional Triangles */}
        <path d="M0 -132 L-15 -112 H15 Z M132 0 L112 -15 V15 Z M0 132 L-15 112 H15 Z M-132 0 L-112 -15 V15 Z" fill="url(#ct-gold-grad-v2)" />
        
        {/* Celestial Orbit Rings */}
        <circle cx="0" cy="0" r="80" strokeDasharray="3 8" />
        <circle cx="0" cy="0" r="57" />
        <circle cx="0" cy="0" r="24" />
        
        {/* Axes */}
        <path d="M0 -94 V94 M-94 0 H94" />
        
        {/* Cardinal Equinox/Solstice Nodes */}
        <circle cx="0" cy="-94" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad-v2)" strokeWidth="2" />
        <circle cx="94" cy="0" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad-v2)" strokeWidth="2" />
        <circle cx="0" cy="94" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad-v2)" strokeWidth="2" />
        <circle cx="-94" cy="0" r="6" fill="#FFF8E9" stroke="url(#ct-gold-grad-v2)" strokeWidth="2" />
        
        {/* Inner Ticks */}
        <path d="M-40 -40 l-7 -7 M40 -40 l7 -7 M40 40 l7 7 M-40 40 l-7 7" />
        
        {/* Central Bindu */}
        <circle cx="0" cy="0" r="11" fill="url(#ct-gold-grad-v2)" stroke="none" />
      </g>
    </svg>
  );
}

/**
 * Master Stacked Vector Logo (exact 1:1 reproduction of logo/cosmictantra_logo.svg)
 */
export function CosmicTantraStackedLogo({ className = 'w-full max-w-[420px]' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1400 560"
      className={`${className} h-auto`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ct-gold-full" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9B6A13" />
          <stop offset="48%" stopColor="#D1A72E" />
          <stop offset="100%" stopColor="#A8581C" />
        </linearGradient>
      </defs>

      {/* Top Astrolabe Symbol */}
      <g transform="translate(700 150)" stroke="url(#ct-gold-full)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-92 -74 H-132 V-34 M92 -74 H132 V-34 M-92 74 H-132 V34 M92 74 H132 V34" />
        <path d="M0 -132 L-15 -112 H15 Z M132 0 L112 -15 V15 Z M0 132 L-15 112 H15 Z M-132 0 L-112 -15 V15 Z" fill="url(#ct-gold-full)" />
        <circle cx="0" cy="0" r="80" strokeDasharray="3 8" />
        <circle cx="0" cy="0" r="57" />
        <circle cx="0" cy="0" r="24" />
        <path d="M0 -94 V94 M-94 0 H94" />
        <circle cx="0" cy="-94" r="6" fill="#FFF8E9" stroke="url(#ct-gold-full)" strokeWidth="2" />
        <circle cx="94" cy="0" r="6" fill="#FFF8E9" stroke="url(#ct-gold-full)" strokeWidth="2" />
        <circle cx="0" cy="94" r="6" fill="#FFF8E9" stroke="url(#ct-gold-full)" strokeWidth="2" />
        <circle cx="-94" cy="0" r="6" fill="#FFF8E9" stroke="url(#ct-gold-full)" strokeWidth="2" />
        <path d="M-40 -40 l-7 -7 M40 -40 l7 -7 M40 40 l7 7 M-40 40 l-7 7" />
        <circle cx="0" cy="0" r="11" fill="url(#ct-gold-full)" stroke="none" />
      </g>

      {/* Main Brand Wordmark */}
      <text
        x="700"
        y="348"
        textAnchor="middle"
        className="fill-[#1C1917] dark:fill-[#F5F2EB] font-editorial font-bold"
        style={{ fontSize: '92px', letterSpacing: '14px' }}
      >
        COSMICTANTRA
      </text>

      {/* Gold Divider Line & Diamonds */}
      <g stroke="url(#ct-gold-full)" strokeWidth="1.5" fill="url(#ct-gold-full)">
        <path d="M490 404 H600 M800 404 H910" />
        <path d="M700 398 l8 8 -8 8 -8 -8z" />
        <circle cx="682.5" cy="404" r="2.5" stroke="none" />
        <circle cx="722.5" cy="404" r="2.5" stroke="none" />
      </g>

      {/* Subtitle */}
      <text
        x="700"
        y="463"
        textAnchor="middle"
        fill="#B08419"
        className="font-mono font-bold"
        style={{ fontSize: '28px', letterSpacing: '14px' }}
      >
        VEDIC PRECISION
      </text>
    </svg>
  );
}

/**
 * Universal Responsive CosmicTantra Brand Header Logo
 */
export default function CosmicTantraLogo({
  variant = 'horizontal',
  size = 'md',
  className = '',
  subtitle = 'VEDIC PRECISION'
}: CosmicTantraLogoProps) {
  if (variant === 'stacked') {
    return <CosmicTantraStackedLogo className={className} />;
  }

  if (variant === 'emblem') {
    return <CosmicTantraEmblem className={className} />;
  }

  const sizeStyles = {
    sm: { emblem: 'w-6 h-6 sm:w-7 sm:h-7', title: 'text-xs sm:text-sm tracking-[0.12em] sm:tracking-[0.16em]', sub: 'text-[7px] sm:text-[8px] tracking-[0.18em] sm:tracking-[0.24em]' },
    md: { emblem: 'w-7 h-7 sm:w-9 sm:h-9', title: 'text-xs sm:text-base tracking-[0.12em] sm:tracking-[0.18em]', sub: 'text-[7px] sm:text-[9px] tracking-[0.18em] sm:tracking-[0.26em]' },
    lg: { emblem: 'w-9 h-9 sm:w-11 sm:h-11', title: 'text-sm sm:text-lg lg:text-xl tracking-[0.18em] sm:tracking-[0.22em]', sub: 'text-[8px] sm:text-[10px] tracking-[0.22em] sm:tracking-[0.28em]' },
    xl: { emblem: 'w-12 h-12 sm:w-14 sm:h-14', title: 'text-xl sm:text-3xl tracking-[0.2em] sm:tracking-[0.24em]', sub: 'text-[10px] sm:text-[12px] tracking-[0.24em] sm:tracking-[0.3em]' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 group select-none ${className}`}>
      {/* Astrolabe Emblem Frame */}
      <div className="relative p-1.5 rounded-xl bg-gradient-to-br from-white/95 to-[#FAF7F2]/95 dark:from-[#11131E] dark:to-[#090B14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/50 shadow-xs group-hover:border-[#D4AF37] transition-all">
        <CosmicTantraEmblem className={sizeStyles.emblem} />
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <span className={`font-editorial font-bold text-[#1C1917] dark:text-[#F5F2EB] group-hover:text-[#8E6F1D] dark:group-hover:text-[#D4AF37] transition-colors leading-tight ${sizeStyles.title}`}>
          COSMICTANTRA
        </span>
        <span className={`font-mono-data font-bold text-[#8E6F1D] dark:text-[#D4AF37] uppercase opacity-95 leading-none mt-0.5 ${sizeStyles.sub}`}>
          {subtitle || 'VEDIC PRECISION'}
        </span>
      </div>
    </div>
  );
}

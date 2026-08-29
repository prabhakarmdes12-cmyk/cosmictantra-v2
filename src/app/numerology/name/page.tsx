'use client';

import React from 'react';
import NumerologyCalculator from '@/components/tools/NumerologyCalculator';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';

export default function NameNumerologyPage() {
  return (
    <CosmicTantraShell>
      <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-[0.24em] font-bold">
            अंक ज्योतिष • ANK JYOTISH INSTRUMENT
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-2 tracking-tight">
            Chaldean Name Numerology
          </h1>
          <p className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] mt-3 leading-relaxed">
            Vedic sound vibration analysis based on the ancient Chaldean system. Compute your 
            <strong className="text-[#8E6F1D] dark:text-[#F0C968]"> Namank</strong> (name number), 
            <strong className="text-[#8E6F1D] dark:text-[#F0C968]"> Mulank</strong> (psychic root), 
            and <strong className="text-[#8E6F1D] dark:text-[#F0C968]"> Bhagyank</strong> (destiny path).
          </p>
        </header>

        <NumerologyCalculator mode="name" />

        <div className="grid md:grid-cols-3 gap-4 text-xs font-mono-data text-[#57524A] dark:text-[#AAA49A]">
          <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Mulank (मूलांक)</div>
            Reduced birth-day number — reflects your intrinsic nature, psychological drive, and inner instinct.
          </div>
          <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Bhagyank (भाग्यांक)</div>
            Reduced full birth-date number — reveals your life purpose, karmic trajectory, and destiny window.
          </div>
          <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
            <div className="font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-1">Namank (नामांक)</div>
            Chaldean sound vibration value — how your public expression resonates with your destiny numbers.
          </div>
        </div>
      </div>
    </CosmicTantraShell>
  );
}


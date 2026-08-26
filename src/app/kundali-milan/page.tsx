'use client';

import React from 'react';
import KundaliMilanTool from '@/components/tools/KundaliMilanTool';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';

export default function KundaliMilanPage() {
  return (
    <CosmicTantraShell>
      <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <header className="max-w-3xl">
          <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-[0.24em] font-bold">
            अष्टकूट मिलान • 36-POINT ASHTAKOOTA INSTRUMENT
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-2 tracking-tight">
            Kundali Milan Studio
          </h1>
          <p className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] mt-3 leading-relaxed">
            Enter both birth charts to compute the classical eight-Koota compatibility score 
            (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi) and Mangal Dosha alignment 
            with sub-arcminute sidereal precision.
          </p>
        </header>

        <KundaliMilanTool />
      </div>
    </CosmicTantraShell>
  );
}


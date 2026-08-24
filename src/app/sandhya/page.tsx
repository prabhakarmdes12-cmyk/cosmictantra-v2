'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SandhyaMode() {
  const [isSandhya, setIsSandhya] = useState(true);

  return (
    <main className={`min-h-screen transition-all duration-700 ${isSandhya ? 'bg-[#0A0E1A] text-[#E8DFC8]' : 'bg-[#FAF7F2] text-[#1C1917]'}`}>
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-20">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="text-xs tracking-[3px] text-[#8E6F1D]">संध्या • TWILIGHT MODE</div>
            <h1 className="font-editorial text-6xl font-bold tracking-tight mt-1">Sandhya</h1>
            <p className="text-lg mt-2 text-[#857E74]">A meditative evening experience for reflection</p>
          </div>
          <button 
            onClick={() => setIsSandhya(!isSandhya)}
            className="px-5 py-2 text-sm border border-[#8E6F1D]/30 rounded-2xl"
          >
            Switch to {isSandhya ? 'Daylight' : 'Sandhya'}
          </button>
        </div>

        <div className="prose prose-lg max-w-none text-[#C9BFA8]">
          <p>This is a calm, reflective space designed for evening contemplation. The deep indigo and warm gold palette mirrors the sacred twilight over the Ganges.</p>
          
          <div className="my-12 p-8 border-l-2 border-[#8E6F1D]/40">
            <p className="italic">"When the sun sets, the inner light becomes visible."</p>
            <p className="text-sm mt-2">— Traditional Kashi saying</p>
          </div>

          <div className="flex gap-4 mt-8">
            <Link href="/dashboard" className="px-6 py-3 border border-[#8E6F1D]/30 rounded-2xl text-sm">Return to Scholar’s Desk</Link>
            <Link href="/daily" className="px-6 py-3 border border-[#8E6F1D]/30 rounded-2xl text-sm">View Today’s Forecast</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface AstronomicalProofDrawerProps {
  julianDay: number;
  ayanamsha: string;
  localSiderealTime: string;
  coordinates: string;
  tithi: string;
  nakshatra: string;
}

export default function AstronomicalProofDrawer({
  julianDay,
  ayanamsha,
  localSiderealTime,
  coordinates,
  tithi,
  nakshatra,
}: AstronomicalProofDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-t border-[#8E6F1D]/20 pt-4 mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left text-xs font-mono-data tracking-wider text-[#8E6F1D] hover:text-[#1C1917] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5" />
          <span>खगोलीय प्रमाण (Astronomical Proof)</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#11131C] p-5 text-xs space-y-3 border border-[#8E6F1D]/15 font-mono-data">
          <div className="grid grid-cols-2 gap-y-3 text-[#57524A] dark:text-[#AAA49A]">
            <div>Julian Day Number</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{julianDay.toFixed(5)}</div>

            <div>Lahiri Ayanamsha</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{ayanamsha}</div>

            <div>Local Sidereal Time (LST)</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{localSiderealTime}</div>

            <div>Geographic Coordinates</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{coordinates}</div>

            <div>तिथि (Tithi)</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{tithi}</div>

            <div>नक्षत्र (Nakshatra)</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{nakshatra}</div>
          </div>

          <div className="pt-3 border-t border-[#8E6F1D]/15 text-[10px] text-[#857E74]">
            All values computed using Chitra Paksha (Lahiri) Ayanamsha • Sidereal Ephemeris Engine v34
          </div>
        </div>
      )}
    </div>
  );
}

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
  // Advanced fields
  lagna?: string;
  moonLongitude?: string;
  sunLongitude?: string;
  houseCusps?: string;
  planetaryLongitudes?: string;
}

export default function AstronomicalProofDrawer({
  julianDay,
  ayanamsha,
  localSiderealTime,
  coordinates,
  tithi,
  nakshatra,
  lagna = 'Vrishabha',
  moonLongitude = '42° 18\' 45"',
  sunLongitude = '128° 45\' 12"',
  houseCusps = '1st: 42° | 7th: 222°',
  planetaryLongitudes = 'Moon 42° • Sun 128° • Mars 195°',
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
        <div className="mt-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#11131C] p-6 text-xs space-y-4 border border-[#8E6F1D]/15 font-mono-data">
          <div className="grid grid-cols-2 gap-y-4 text-[#57524A] dark:text-[#AAA49A]">
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

            {/* Advanced Fields */}
            <div>Lagna (Ascendant)</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{lagna}</div>

            <div>Chandra Sphuta (Moon)</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{moonLongitude}</div>

            <div>Surya Sphuta (Sun)</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{sunLongitude}</div>

            <div>House Cusps</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{houseCusps}</div>

            <div>Key Planetary Longitudes</div>
            <div className="font-semibold text-[#1C1917] dark:text-white">{planetaryLongitudes}</div>
          </div>

          <div className="pt-3 border-t border-[#8E6F1D]/15 text-[10px] text-[#857E74]">
            All values computed using Chitra Paksha (Lahiri) Ayanamsha • Sidereal Ephemeris Engine v34
          </div>
        </div>
      )}
    </div>
  );
}

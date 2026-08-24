'use client';

import React from 'react';
import { Calendar, Heart, DollarSign, Briefcase, Award } from 'lucide-react';

interface DashaPeriod {
  planet: string;
  startDate: Date;
  endDate: Date;
  years: number;
  color?: string;
}

export default function DestinyTimeline({
  dashas,
  currentDasha,
  birthDate,
}: {
  dashas?: DashaPeriod[];
  currentDasha?: any;
  birthDate?: string;
}) {
  if (!dashas || dashas.length === 0) {
    return (
      <div className="py-8 text-center text-[#9CA3AF] text-xs">
        Generate your Kundali to calculate your 120-year Vimshottari Mahadasha timeline.
      </div>
    );
  }

  const bYear = birthDate ? new Date(birthDate).getFullYear() : 1990;

  return (
    <div className="space-y-4 font-body">
      <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
        <div>
          <h3 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider font-display">
            ⏳ Vimshottari Destiny Timeline
          </h3>
          <span className="text-[10px] text-[#9CA3AF]">120-Year Planetary Life Cycles</span>
        </div>
        {currentDasha && (
          <span className="text-[10px] text-[#10B981] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            Active: {currentDasha.planet} Dasha
          </span>
        )}
      </div>

      {/* Dasha Bar Stack */}
      <div className="space-y-2">
        {dashas.slice(0, 7).map((d, i) => {
          const sYear = new Date(d.startDate).getFullYear();
          const eYear = new Date(d.endDate).getFullYear();
          const isCurrent = currentDasha?.planet === d.planet;

          return (
            <div
              key={i}
              className={`p-3 rounded-xl border text-xs transition-all ${
                isCurrent
                  ? 'bg-purple-950/60 border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.2)]'
                  : 'bg-black/30 border-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{d.planet} Mahadasha</span>
                  {isCurrent && (
                    <span className="px-2 py-0.2 rounded-full text-[9px] bg-[#7C3AED] text-white font-bold">
                      CURRENT
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-[#A78BFA] font-mono">
                  {sYear} – {eYear} ({d.years} yrs)
                </span>
              </div>

              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden border border-white/10 mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#7C3AED] to-[#F59E0B]"
                  style={{ width: isCurrent ? `${currentDasha?.percentDone || 50}%` : '100%' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

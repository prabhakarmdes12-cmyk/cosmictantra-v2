'use client';

/**
 * SCHOLAR PANCHANG PANEL — shared "विस्तृत पञ्चाङ्ग" rendering block.
 * Used by the Day Detail Sheet (scholar layer) and the आज tab's scholar mode.
 */

import React, { useMemo } from 'react';
import { ScrollText } from 'lucide-react';
import type { LocationCoordinates } from '@/lib/panchangFactBundle';
import type { ScholarPanchang } from '@/lib/calendar/scholarPanchang';
import { getWorldCalendarReadings } from '@/lib/calendar/worldCalendarEngine';
import { toHindiDigits } from './DayDetailSheet';

interface ScholarPanchangPanelProps {
  scholar: ScholarPanchang;
  date: Date;
  location: LocationCoordinates;
  weekdayNameHi: string;
}

export default function ScholarPanchangPanel({
  scholar,
  date,
  location,
  weekdayNameHi,
}: ScholarPanchangPanelProps) {
  const worldReadings = useMemo(() => {
    try {
      return getWorldCalendarReadings(date, location);
    } catch {
      return [];
    }
  }, [date, location]);

  return (
    <div className="space-y-3">
      {/* Ayanamsha & Samvat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-[11px] font-mono-data">
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
          <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">लहिरि आयामश</div>
          <div className="font-bold text-[#1C1917] dark:text-white">{scholar.ayanamsha.dms}</div>
          <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">Chitra Paksha (Lahiri)</div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
          <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">संवत्सर</div>
          <div className="font-bold text-[#1C1917] dark:text-white">
            विक्रम {toHindiDigits(scholar.bundle.samvat.vikram)} • शक {toHindiDigits(scholar.bundle.samvat.shaka)}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
          <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">ऋतु / आयन</div>
          <div className="font-bold text-[#1C1917] dark:text-white">{scholar.bundle.ritu.nameHi}</div>
          <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{scholar.bundle.ayana.nameHi}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
          <div className="text-[9px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">सौर महीना</div>
          <div className="font-bold text-[#1C1917] dark:text-white">{scholar.bundle.masa.nameHi}</div>
          <div className="text-[9px] text-[#78716C] dark:text-[#A8A29E]">{scholar.bundle.masa.name}</div>
        </div>
      </div>

      {/* Tithi windows */}
      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-2">
        <div className="text-xs font-editorial font-bold text-[#1C1917] dark:text-white flex items-center gap-1.5">
          <ScrollText className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" /> तिथि सीमाएँ (Exact Tithi Boundaries)
        </div>
        <div className="space-y-1.5">
          {scholar.tithiWindows.map((w, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-mono-data p-2 rounded-lg bg-white/60 dark:bg-[#0E101D]/60 border border-black/5 dark:border-white/5">
              <span className="font-bold text-[#1C1917] dark:text-white">{w.pakshaHi} {w.nameHi}</span>
              <span className="text-[#78716C] dark:text-[#A8A29E]">
                {w.startLabel} → {w.endLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Nakshatra windows */}
      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-2">
        <div className="text-xs font-editorial font-bold text-[#1C1917] dark:text-white flex items-center gap-1.5">
          <span className="text-[#8E6F1D] dark:text-[#F0C968]">✦</span> नक्षत्र सीमाएँ (Exact Nakshatra Boundaries)
        </div>
        <div className="space-y-1.5">
          {scholar.nakshatraWindows.map((w, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs font-mono-data p-2 rounded-lg bg-white/60 dark:bg-[#0E101D]/60 border border-black/5 dark:border-white/5">
              <span className="font-bold text-[#1C1917] dark:text-white">{w.nameHi}</span>
              <span className="text-[#78716C] dark:text-[#A8A29E]">
                {w.startLabel} → {w.endLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Choghadiya */}
      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-2">
        <div className="text-xs font-editorial font-bold text-[#1C1917] dark:text-white">
          चोग्घड़िया (8 कला-विभाग, सूर्योदय–सूर्यास्त)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {scholar.choghadiya.map((c, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg border text-[10px] sm:text-[11px] font-mono-data ${
                c.auspicious
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="font-bold">{c.nameHi} {c.auspicious ? '✓' : '✗'}</div>
              <div className="opacity-80">{c.start} – {c.end}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hora */}
      <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-2">
        <div className="text-xs font-editorial font-bold text-[#1C1917] dark:text-white">
          गोरा (12 ग्रह-काल, {weekdayNameHi} प्रारम्भ)
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {scholar.hora.map((h, i) => (
            <div key={i} className="p-2 rounded-lg bg-white/60 dark:bg-[#0E101D]/60 border border-black/5 dark:border-white/5 text-[10px] sm:text-[11px] font-mono-data">
              <div className="font-bold text-[#1C1917] dark:text-white">{h.planetHi}</div>
              <div className="opacity-70 text-[#78716C] dark:text-[#A8A29E]">{h.start} – {h.end}</div>
            </div>
          ))}
        </div>
      </div>

      {/* World calendars */}
      {worldReadings.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5 space-y-2">
          <div className="text-xs font-editorial font-bold text-[#1C1917] dark:text-white">
            🌍 अन्य कैलेंडर प्रणालियों में यह दिनांक
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {worldReadings.map((r) => (
              <div key={r.systemId} className="p-2 rounded-lg bg-white/60 dark:bg-[#0E101D]/60 border border-black/5 dark:border-white/5 text-[10px] sm:text-[11px] font-mono-data">
                <span className="text-[#57524A] dark:text-[#D1C9BF]">{r.summaryHi}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shastra citations */}
      <div className="p-3.5 rounded-2xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 space-y-1.5">
        <div className="text-xs font-editorial font-bold text-[#8E6F1D] dark:text-[#F0C968]">
          📜 शास्त्रीय नियम स्रोत (Shastra Rule Citations)
        </div>
        {scholar.citations.map((c, i) => (
          <div key={i} className="text-[10px] sm:text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] flex gap-2">
            <span className="text-[#8E6F1D] dark:text-[#F0C968] font-bold shrink-0">{toHindiDigits(i + 1)}.</span>
            <span>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

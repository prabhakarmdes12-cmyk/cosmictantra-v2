'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight, Sun } from 'lucide-react';
import { chitiSensory } from '../lib/chitiAudio';

/**
 * SPRINT C §4 — FACT-FIRST TOP STRIP.
 *
 * Replaces the prediction-like ticker. Only factual engine output is shown:
 *   - today's Panchang facts (Moon nakshatra, paksha + tithi) from the
 *     actual calculation,
 *   - the active chart identity bar when a real chart is active.
 * No speculative "tomorrow / day-after" lines, no liquidity/momentum copy,
 * no invented personalized claims.
 */
export default function PersonalisationBridge({
  kundaliData,
  panchangData,
  onClearProfile,
  lang = 'en',
  theme = 'dark',
}) {
  const isHi = lang === 'hi';

  const todayNakshatra =
    panchangData?.nakshatra?.name ||
    panchangData?.nakshatra?.nameHi ||
    panchangData?.moon?.nakshatra?.name ||
    null;
  const todayTithi = panchangData?.tithi?.name || null;
  const todayPaksha = panchangData?.tithi?.paksha || null;

  const lagnaName = kundaliData?.lagna?.rashiName || null;
  const moonName = kundaliData?.moon?.nakshatra?.name || null;
  const hasChart = Boolean(kundaliData);

  const factLine = todayNakshatra
    ? `${isHi ? 'आज' : 'TODAY'} · ${isHi ? 'चन्द्र' : 'Moon'} ${todayNakshatra}${todayPaksha || todayTithi ? ` · ${todayPaksha || ''} ${todayTithi || ''}` : ''}`
    : '';

  return (
    <div className="sticky top-16 sm:top-20 z-30 w-full font-mono-data text-xs transition-colors duration-300 pointer-events-auto">
      {/* 1. Active chart identity bar (only when a real chart is active) */}
      {hasChart && (
        <div className="w-full bg-[#FFFFFF] dark:bg-[#0B0D12] border-b border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 py-2 px-4 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 bg-[#FAF7F2] dark:bg-[#060709] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E29A48]" />
                <span>{isHi ? 'सक्रिय कुण्डली आधार:' : 'Active Chart:'}</span>
              </div>
              <div className="hidden md:flex items-center gap-3 text-[#57524A] dark:text-[#AAA49A]">
                {lagnaName && (
                  <span>
                    {isHi ? 'लग्न:' : 'Lagna:'} <strong className="text-[#1C1917] dark:text-[#EFECE6]">{lagnaName}</strong>
                  </span>
                )}
                {lagnaName && moonName && <span>•</span>}
                {moonName && (
                  <span>
                    {isHi ? 'चन्द्र नक्षत्र:' : 'Moon:'} <strong className="text-[#1C1917] dark:text-[#EFECE6]">{moonName}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onClearProfile && (
                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    onClearProfile();
                  }}
                  className="flex items-center gap-1 text-[#857E74] dark:text-[#8E8A82] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  title={isHi ? 'डिफ़ॉल्ट दृश्य पर लौटें' : 'Reset to default view'}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isHi ? 'रीसेट करें' : 'Reset View'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Fact-first Vedic day strip — no prediction-market language */}
      {factLine && (
        <Link
          href="/daily"
          data-testid="vedic-day-strip"
          onClick={() => chitiSensory.playTick()}
          className="group block w-full bg-[#FAF7F2] dark:bg-[#0B0D12] border-b border-[#8E6F1D]/20 dark:border-[#D4AF37]/20 py-1.5 px-3 sm:px-6 hover:bg-[#F6EFE0] dark:hover:bg-[#10131D] transition-all overflow-hidden shadow-xs select-none"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-bold tracking-wider uppercase shrink-0">
              <Sun className="w-3 h-3" />
              {isHi ? 'आज वैदिक समय में' : 'Today in Vedic time'}
            </span>
            <span className="flex-1 truncate text-[11px] sm:text-xs text-[#57524A] dark:text-[#D1C9BF] font-medium">
              {factLine}
            </span>
            <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] group-hover:translate-x-0.5 transition-transform shrink-0">
              <span className="hidden md:inline">{isHi ? 'आज का पञ्चाङ्ग खोलें' : 'Open Today’s Panchang'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}

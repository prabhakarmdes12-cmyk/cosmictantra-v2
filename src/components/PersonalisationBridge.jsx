'use client';

import React from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { chitiSensory } from '../lib/chitiAudio';

export default function PersonalisationBridge({ 
  kundaliData, 
  onClearProfile, 
  lang = 'en', 
  theme = 'dark' 
}) {

  // Dynamic 72h Glimpse Text
  const moonName = kundaliData?.moon?.nakshatra?.name || kundaliData?.moon?.nakshatra || 'Rohini';
  const lagnaName = kundaliData?.lagna?.rashiName || 'Vrishabha';

  const todayGlimpse = lang === 'hi'
    ? `आज: चन्द्र ${moonName} में (11वाँ भाव) • वित्तीय लाभ व संवाद सिद्धि`
    : `TODAY: Moon in ${moonName} (11th House) • High Financial Liquidity & Deal Momentum`;

  const tomorrowGlimpse = lang === 'hi'
    ? `कल: चन्द्र मृगशिरा में • अनुसंधान व त्वरित कार्य`
    : `TOMORROW: Moon in Mrigashira • Strategic Research & Communication`;

  const dayAfterGlimpse = lang === 'hi'
    ? `परसों: चन्द्र आर्द्रा में • गहन समस्या निवारण`
    : `DAY AFTER: Moon in Ardra • Breakthrough Focus & Deep Solutions`;

  return (
    <div className="sticky top-16 sm:top-20 z-30 w-full font-mono-data text-xs transition-colors duration-300 pointer-events-auto">
      
      {/* 1. Active Chart Header Bar (Rendered when custom profile is active) */}
      {kundaliData && (
        <div className="w-full bg-[#FFFFFF] dark:bg-[#0B0D12] border-b border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 py-2 px-4 sm:px-6 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 bg-[#FAF7F2] dark:bg-[#060709] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E29A48]" />
                <span>{lang === 'hi' ? 'सक्रिय कुण्डली आधार:' : 'Active Chart:'} {kundaliData.meta?.locationName || 'Patna'}</span>
              </div>

              <div className="hidden md:flex items-center gap-3 text-[#57524A] dark:text-[#AAA49A]">
                <span>{lang === 'hi' ? 'लग्न:' : 'Lagna:'} <strong className="text-[#1C1917] dark:text-[#EFECE6]">{lagnaName} ({kundaliData.lagna?.degreeStr || '14°'})</strong></span>
                <span>•</span>
                <span>{lang === 'hi' ? 'चन्द्र नक्षत्र:' : 'Moon:'} <strong className="text-[#1C1917] dark:text-[#EFECE6]">{moonName} P{kundaliData.moon?.pada || 1}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] hidden sm:inline font-semibold">
                {lang === 'hi' ? 'सम्पूर्ण पटल जन्म विवरण अनुसार संयोजित' : 'Ephemeris anchored to birth coordinates'}
              </span>
              
              {onClearProfile && (
                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    onClearProfile();
                  }}
                  className="flex items-center gap-1 text-[#857E74] dark:text-[#8E8A82] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  title="Reset to default view"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'hi' ? 'रीसेट करें' : 'Reset View'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Lime Marquee Ticker Strip: 72-Hour Glimpse */}
      <Link
        href="/daily"
        data-testid="lime-72h-ticker"
        onClick={() => chitiSensory.playTick()}
        className="group block w-full bg-[#F7FEE7] dark:bg-[#071304] border-b border-[#84CC16]/40 dark:border-[#84CC16]/30 py-1.5 px-3 sm:px-6 hover:bg-[#ECFCCB] dark:hover:bg-[#0D2109] transition-all cursor-pointer overflow-hidden shadow-xs select-none"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Lime Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#84CC16]/25 dark:bg-[#84CC16]/20 border border-[#84CC16]/50 text-[#365314] dark:text-[#BEF264] text-[10px] font-bold tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse shadow-[0_0_8px_#84CC16]" />
              <span>72H GLIMPSE</span>
            </span>
          </div>

          {/* Marquee Content / Glimpse text */}
          <div className="flex-1 overflow-hidden whitespace-nowrap text-[11px] sm:text-xs text-[#365314] dark:text-[#D9F99D] font-medium flex items-center gap-4">
            <div className="inline-flex items-center gap-4 animate-marquee sm:animate-none">
              <span>{todayGlimpse}</span>
              <span className="opacity-40">•</span>
              <span>{tomorrowGlimpse}</span>
              <span className="opacity-40">•</span>
              <span>{dayAfterGlimpse}</span>
            </div>
          </div>

          {/* Action Link Icon */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-[#4D7C0F] dark:text-[#BEF264] group-hover:translate-x-0.5 transition-transform shrink-0">
            <span className="hidden md:inline">{lang === 'hi' ? 'विस्तृत 72h फलकथन देखें' : 'View Full 72h Forecast'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>

        </div>
      </Link>

    </div>
  );
}

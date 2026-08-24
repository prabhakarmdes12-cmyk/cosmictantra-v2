import React from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { chitiSensory } from '../lib/chitiAudio';

export default function PersonalisationBridge({ kundaliData, onClearProfile, lang = 'en', theme = 'dark' }) {
  if (!kundaliData) return null;

  return (
    <div className="sticky top-16 sm:top-20 z-30 w-full bg-[#FFFFFF] dark:bg-[#0B0D12] border-b border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 py-2 px-4 sm:px-6 shadow-sm font-mono-data text-xs transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 bg-[#FAF7F2] dark:bg-[#060709] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E29A48]" />
            <span>{lang === 'hi' ? 'सक्रिय कुण्डली आधार:' : 'Active Chart:'} {kundaliData.meta.locationName}</span>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[#57524A] dark:text-[#AAA49A]">
            <span>{lang === 'hi' ? 'लग्न:' : 'Lagna:'} <strong className="text-[#1C1917] dark:text-[#EFECE6]">{kundaliData.lagna.rashiName} ({kundaliData.lagna.degreeStr})</strong></span>
            <span>•</span>
            <span>{lang === 'hi' ? 'चन्द्र नक्षत्र:' : 'Moon:'} <strong className="text-[#1C1917] dark:text-[#EFECE6]">{(kundaliData.moon.nakshatra?.name ?? kundaliData.moon.nakshatra)} P{kundaliData.moon.pada}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] hidden sm:inline font-semibold">
            {lang === 'hi' ? 'सम्पूर्ण पटल जन्म विवरण अनुसार संयोजित' : 'Ephemeris anchored to birth coordinates'}
          </span>
          
          <button
            onClick={() => {
              chitiSensory.playTick();
              onClearProfile();
            }}
            className="flex items-center gap-1 text-[#857E74] dark:text-[#8E8A82] hover:text-black dark:hover:text-white transition-colors"
            title="Reset to default view"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{lang === 'hi' ? 'रीसेट करें' : 'Reset View'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

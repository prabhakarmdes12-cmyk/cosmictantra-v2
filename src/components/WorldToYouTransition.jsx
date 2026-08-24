import React from 'react';
import { Flame } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';

export default function WorldToYouTransition({ lang = 'en', theme = 'dark' }) {
  const t = TRANSLATIONS[lang]?.transition || TRANSLATIONS.en.transition;

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-[#FAF7F2] dark:bg-[#06070B] border-b border-black/[0.08] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 relative z-10 font-mono-data">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#8E6F1D]/35 dark:border-[#D4AF37]/35 bg-[#FFFFFF] dark:bg-[#080A12] text-[11px] uppercase tracking-[0.24em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold shadow-xs">
          <Flame className="w-3.5 h-3.5 text-[#E29A48]" />
          <span>॥ {t.tag} ॥</span>
        </div>

        <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6] leading-tight">
          {t.line1}
        </h2>

        <p className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-[#8E6F1D] dark:text-[#D4AF37] italic">
          {t.line2}
        </p>

        <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#AAA49A] max-w-xl mx-auto leading-relaxed pt-1">
          {t.desc}
        </p>

        <div className="pt-4 flex justify-center items-center gap-3">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <div className="w-2 h-2 rotate-45 border border-[#8E6F1D] dark:border-[#D4AF37] bg-[#E29A48]" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </div>

      </div>
    </section>
  );
}

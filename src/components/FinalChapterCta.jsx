import React from 'react';
import { Moon, ArrowUpRight, ShieldCheck, Flame } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function FinalChapterCta({ panchangData, onOpenConsultation, onMeetPractitioners, lang = 'en', theme = 'dark' }) {
  const t = TRANSLATIONS[lang]?.finalCta || TRANSLATIONS.en.finalCta;

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden bg-[#FAF7F2] dark:bg-[#050608] border-b border-black/[0.08] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10 font-mono-data">
        
        {/* Live Tithi Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.08] bg-[#FFFFFF] dark:bg-[#090A0E] text-xs text-[#57524A] dark:text-[#8E8A82] shadow-xs">
          <Moon className="w-3.5 h-3.5 text-[#4848A8] dark:text-[#8B8BF5]" />
          <span>{panchangData.tithi.fullName} • {panchangData.city}</span>
        </div>

        {/* Headline */}
        <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6] leading-tight">
          {t.heading}
        </h2>

        {/* Supporting Copy */}
        <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] max-w-lg mx-auto leading-relaxed">
          {t.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              chitiSensory.playTick();
              analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'FINAL_CTA' });
              onOpenConsultation();
            }}
            className="px-6 py-3.5 rounded-xl bg-[#D4AF37] text-[#060709] font-bold text-xs uppercase tracking-wider hover:bg-[#E5C378] transition-all flex items-center gap-1.5 shadow-md"
          >
            <span>{t.cta}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              chitiSensory.playTick();
              onMeetPractitioners();
            }}
            className="px-5 py-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#57524A] dark:text-[#A6A29A] hover:text-[#1C1917] dark:hover:text-white transition-all shadow-xs"
          >
            {t.meetBtn}
          </button>
        </div>

        <div className="pt-4 flex items-center justify-center gap-2 text-[11px] text-[#857E74] dark:text-[#57534D]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0F6B43] dark:text-[#34d399]" />
          <span>{t.trustNote}</span>
        </div>

      </div>
    </section>
  );
}

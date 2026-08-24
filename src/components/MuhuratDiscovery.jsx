import React from 'react';
import { Clock, ShieldCheck, ArrowRight, Flame } from 'lucide-react';
import { MUHURAT_EVENTS } from '../lib/muhuratData';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function MuhuratDiscovery({ onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const t = TRANSLATIONS[lang]?.muhurat || TRANSLATIONS.en.muhurat;

  return (
    <section id="muhurat-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#07080F] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
              <Flame className="w-3.5 h-3.5 text-[#E29A48]" />
              <span>{t.tag}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
              {t.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#AAA49A] font-mono-data mt-2">
              {t.subheading}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] bg-[#FFFFFF] dark:bg-[#0A0C14] px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-[#D4AF37]/30 shrink-0 shadow-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#0F6B43] dark:text-[#34d399]" />
            <span>{t.badgeTruth}</span>
          </div>
        </div>

        {/* 6 Event Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-data">
          {MUHURAT_EVENTS.map((event) => {
            const Icon = event.icon;
            const isAssisted = event.status === 'Practitioner Assisted';
            
            return (
              <div
                key={event.id}
                className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all flex flex-col justify-between shadow-xs hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.08] dark:border-[#D4AF37]/30 flex items-center justify-center text-[#8E6F1D] dark:text-[#D4AF37]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${
                      isAssisted 
                        ? 'text-[#8E6F1D] dark:text-[#D4AF37] bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 border-[#8E6F1D]/30 dark:border-[#D4AF37]/30' 
                        : 'text-[#0F6B43] dark:text-[#34d399] bg-[#10b981]/10 border-[#10b981]/30'
                    }`}>
                      {event.status}
                    </span>
                  </div>

                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6] mb-1">
                    {event.title}
                  </h3>
                  
                  <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed mb-4">
                    {event.desc}
                  </p>

                  <div className="p-3 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.06] dark:border-white/[0.06] text-[11px] text-[#8E6F1D] dark:text-[#D4AF37]/90 mb-4 font-bold">
                    {event.suggestedWindow}
                  </div>
                </div>

                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    analytics.track(ANALYTICS_EVENTS.MUHURAT_CATEGORY_SELECTED, { category: event.title });
                    onOpenConsultation(`Personalised Muhurat for ${event.title}`);
                  }}
                  className="w-full py-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#06070C] border border-black/[0.08] dark:border-[#D4AF37]/30 hover:bg-white dark:hover:bg-[#101322] hover:border-[#D4AF37] text-xs font-bold text-[#1C1917] dark:text-[#EFECE6] transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>{t.requestBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

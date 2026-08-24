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

        {/* 6 Event Cards with AI Moment Imagery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono-data">
          {MUHURAT_EVENTS.map((event) => {
            const Icon = event.icon;
            const isAssisted = event.status === 'Practitioner Assisted';
            
            return (
              <div
                key={event.id}
                className="group rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-[#D4AF37]/25 hover:border-[#D4AF37]/60 overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-md hover:shadow-2xl"
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="relative h-44 sm:h-48 w-full overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] dark:from-[#090B14] via-[#090B14]/40 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`text-[9px] px-2.5 py-1 rounded-full border uppercase tracking-wider font-bold backdrop-blur-md shadow-xs ${
                        isAssisted 
                          ? 'text-[#FFFFFF] bg-[#826315]/85 dark:bg-[#D4AF37]/90 text-[#060709] border-[#D4AF37]' 
                          : 'text-[#FFFFFF] bg-[#0D5A37]/85 border-[#34d399]'
                      }`}>
                        {event.status}
                      </span>
                    </div>

                    {/* Category Icon Badge */}
                    <div className="absolute bottom-3 left-3 z-10 w-9 h-9 rounded-xl bg-[#FFFFFF]/90 dark:bg-[#080A12]/90 backdrop-blur-md border border-black/[0.1] dark:border-[#D4AF37]/40 flex items-center justify-center text-[#826315] dark:text-[#E5C378] shadow-sm">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#EFECE6] group-hover:text-[#826315] dark:group-hover:text-[#E5C378] transition-colors">
                      {event.title}
                    </h3>
                    
                    <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed line-clamp-2">
                      {event.desc}
                    </p>

                    <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.06] dark:border-white/[0.06] text-[11px] text-[#826315] dark:text-[#E5C378] font-bold">
                      {event.suggestedWindow}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-1">
                  <button
                    onClick={() => {
                      chitiSensory.playTick();
                      analytics.track(ANALYTICS_EVENTS.MUHURAT_CATEGORY_SELECTED, { category: event.title });
                      onOpenConsultation(`Personalised Muhurat for ${event.title}`);
                    }}
                    className="w-full py-3 rounded-xl bg-[#FAF7F2] dark:bg-[#06070C] border border-black/[0.1] dark:border-[#D4AF37]/35 hover:bg-[#826315] dark:hover:bg-[#D4AF37] hover:text-white dark:hover:text-[#060709] text-xs font-bold text-[#1C1917] dark:text-[#EFECE6] transition-all flex items-center justify-center gap-2 shadow-xs group/btn"
                  >
                    <span>{t.requestBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#826315] dark:text-[#E5C378] group-hover/btn:text-current transition-colors" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

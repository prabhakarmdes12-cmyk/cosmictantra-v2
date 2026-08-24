import React from 'react';
import { Cpu, UserCheck, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function MethodologySection({ onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const t = TRANSLATIONS[lang]?.methodology || TRANSLATIONS.en.methodology;

  const CALCULATED_ITEMS = [
    { title: t.calc1, desc: t.calc1Desc },
    { title: t.calc2, desc: t.calc2Desc },
    { title: t.calc3, desc: t.calc3Desc },
    { title: t.calc4, desc: t.calc4Desc }
  ];

  const INTERPRETATION_ITEMS = [
    { title: t.interp1, desc: t.interp1Desc },
    { title: t.interp2, desc: t.interp2Desc },
    { title: t.interp3, desc: t.interp3Desc },
    { title: t.interp4, desc: t.interp4Desc }
  ];

  return (
    <section className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#07080C] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] font-mono-data mt-2">
            {t.subheading}
          </p>
        </div>

        {/* Split Screen Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch font-mono-data">
          
          {/* Left Column: Computation Truth */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.08] dark:border-white/[0.08] flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg border border-[#4848A8]/30 dark:border-[#8B8BF5]/30 bg-[#FAF7F2] dark:bg-[#060709] flex items-center justify-center text-[#4848A8] dark:text-[#8B8BF5]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6]">
                    {t.calculatedHeading}
                  </h3>
                  <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] font-bold">
                    {t.calculatedSub}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {CALCULATED_ITEMS.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.05] dark:border-white/[0.05] flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#10b981]/20 text-[#0F6B43] dark:text-[#34d399] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1C1917] dark:text-[#EFECE6]">{item.title}</div>
                      <div className="text-[11px] text-[#57524A] dark:text-[#8E8A82] leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.06] text-[10px] text-[#857E74] dark:text-[#57534D]">
              Outputs verifiable against standard Swiss Ephemeris & Lahiri tables.
            </div>
          </div>

          {/* Right Column: Human Jyotishi Interpretation */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B0C12] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 bg-[#FAF7F2] dark:bg-[#060709] flex items-center justify-center text-[#8E6F1D] dark:text-[#D4AF37]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6]">
                    {t.interpHeading}
                  </h3>
                  <div className="text-[10px] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                    {t.interpSub}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {INTERPRETATION_ITEMS.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#07080C] border border-black/[0.05] dark:border-white/[0.05] flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#8E6F1D]/20 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                      •
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1C1917] dark:text-[#EFECE6]">{item.title}</div>
                      <div className="text-[11px] text-[#57524A] dark:text-[#8E8A82] leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div className="text-xs font-editorial font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-3">
                {t.quote}
              </div>
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'METHODOLOGY_SECTION' });
                  onOpenConsultation();
                }}
                className="w-full py-3 rounded-lg bg-[#D4AF37] text-[#060709] font-bold text-xs uppercase tracking-wider hover:bg-[#E5C378] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{t.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

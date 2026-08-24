import React from 'react';
import { ArrowUpRight, Flame } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function IntentRouter({
  onSelectIntent,
  onOpenConsultation,
  onExplorePanchang,
  onCreateKundali,
  onOpenDasha,
  onOpenFestivals,
  onOpenMuhurat,
  lang = 'en',
  theme = 'dark'
}) {
  const t = TRANSLATIONS[lang]?.intent || TRANSLATIONS.en.intent;

  const TILES = [
    {
      id: 'today',
      title: t.todayTitle,
      subtitle: t.todaySub,
      desc: t.todayDesc,
      tier: 'DETERMINISTIC ENGINE',
      tierColor: 'text-[#0F6B43] dark:text-[#34d399] border-[#10b981]/30 bg-[#10b981]/10',
      action: onExplorePanchang
    },
    {
      id: 'muhurat',
      title: t.muhuratTitle,
      subtitle: t.muhuratSub,
      desc: t.muhuratDesc,
      tier: 'HYBRID / PRACTITIONER',
      tierColor: 'text-[#8E6F1D] dark:text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10',
      action: onOpenMuhurat
    },
    {
      id: 'kundali',
      title: t.kundaliTitle,
      subtitle: t.kundaliSub,
      desc: t.kundaliDesc,
      tier: 'DETERMINISTIC ENGINE',
      tierColor: 'text-[#0F6B43] dark:text-[#34d399] border-[#10b981]/30 bg-[#10b981]/10',
      action: onCreateKundali
    },
    {
      id: 'dasha',
      title: t.dashaTitle,
      subtitle: t.dashaSub,
      desc: t.dashaDesc,
      tier: 'DETERMINISTIC ENGINE',
      tierColor: 'text-[#0F6B43] dark:text-[#34d399] border-[#10b981]/30 bg-[#10b981]/10',
      action: onOpenDasha
    },
    {
      id: 'festivals',
      title: t.calendarTitle,
      subtitle: t.calendarSub,
      desc: t.calendarDesc,
      tier: 'VERIFIED CALENDAR',
      tierColor: 'text-[#4848A8] dark:text-[#8B8BF5] border-[#8B8BF5]/30 bg-[#8B8BF5]/10',
      action: onOpenFestivals
    },
    {
      id: 'relationships',
      title: t.relTitle,
      subtitle: t.relSub,
      desc: t.relDesc,
      tier: 'PRACTITIONER GUIDED',
      tierColor: 'text-[#8E6F1D] dark:text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10',
      action: () => {
        analytics.track(ANALYTICS_EVENTS.INTENT_SELECTED, { intent: 'RELATIONSHIPS' });
        onOpenConsultation('Relationship Compatibility');
      }
    },
    {
      id: 'career',
      title: t.careerTitle,
      subtitle: t.careerSub,
      desc: t.careerDesc,
      tier: 'PRACTITIONER GUIDED',
      tierColor: 'text-[#8E6F1D] dark:text-[#D4AF37] border-[#D4AF37]/30 bg-[#D4AF37]/10',
      action: () => {
        analytics.track(ANALYTICS_EVENTS.INTENT_SELECTED, { intent: 'CAREER_BUSINESS' });
        onOpenConsultation('Career & Business Decision');
      }
    },
    {
      id: 'ask',
      title: t.askTitle,
      subtitle: t.askSub,
      desc: t.askDesc,
      tier: 'HUMAN SCHOLAR REVIEW',
      tierColor: 'text-[#4848A8] dark:text-[#8B8BF5] border-[#8B8BF5]/30 bg-[#8B8BF5]/10',
      action: () => {
        analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'INTENT_TILES' });
        onOpenConsultation();
      }
    }
  ];

  return (
    <section id="intent-router" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#06070B] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
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

        {/* Asymmetrical Broadsheet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TILES.map((tile) => (
            <div
              key={tile.id}
              onClick={() => {
                chitiSensory.playTick();
                analytics.track(ANALYTICS_EVENTS.INTENT_SELECTED, { intent: tile.id });
                tile.action();
              }}
              className="group p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-[#D4AF37]/20 hover:border-[#D4AF37]/60 hover:bg-[#FAF7F2] dark:hover:bg-[#0E111E] cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-lg"
            >
              <div>
                {/* Top Tier Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[9px] font-mono-data px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${tile.tierColor}`}>
                    {tile.tier}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#857E74] dark:text-[#736E67] group-hover:text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6] group-hover:text-[#8E6F1D] dark:group-hover:text-white transition-colors">
                  {tile.title}
                </h3>

                <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37]/80 mt-1 mb-3 line-clamp-1 font-semibold">
                  {tile.subtitle}
                </div>

                <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed line-clamp-3">
                  {tile.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] group-hover:text-[#D4AF37] transition-colors font-bold">
                <span>{t.enterWorkspace}</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

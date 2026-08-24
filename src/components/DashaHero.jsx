import React, { useState } from 'react';
import { Layers, ArrowRight, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react';
import { calculateVimshottariDasha } from '../lib/dashaEngine';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function DashaHero({ kundaliData, onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const moonLongitude = kundaliData?.moon?.longitude || 42.5; // Default Moon in Rohini
  const birthDateStr = kundaliData?.meta?.birthDate || '1995-05-15';
  
  const dashaData = calculateVimshottariDasha(moonLongitude, birthDateStr);
  const [selectedMD, setSelectedMD] = useState(
    dashaData.mahadashas.find(m => m.isCurrent) || dashaData.mahadashas[0]
  );

  const [selectedAD, setSelectedAD] = useState(null);
  const t = TRANSLATIONS[lang]?.dasha || TRANSLATIONS.en.dasha;

  return (
    <section id="dasha-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#07080C] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <div className="text-[10px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-1.5 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>{t.tag}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
              {t.heading}
            </h2>
            <p className="font-editorial text-xl sm:text-2xl text-[#8E6F1D] dark:text-[#D4AF37] italic mt-1">
              {t.subheading}
            </p>
            <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] font-mono-data mt-2">
              {t.desc}
            </p>
          </div>

          {/* Active Period Status Pill */}
          <div className="p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#0B0C11] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-left sm:text-right shrink-0 font-mono-data shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#857E74] dark:text-[#6B6760]">{t.activePeriod}</div>
            <div className="font-editorial text-xl font-bold text-[#8E6F1D] dark:text-[#D4AF37] mt-0.5">
              {lang === 'hi' ? dashaData.currentPeriodStringHi : dashaData.currentPeriodString}
            </div>
            <div className="text-xs text-[#4848A8] dark:text-[#8B8BF5] mt-0.5">
              {t.mahadashaSpan}: {dashaData.currentDateRange}
            </div>
          </div>
        </div>

        {/* Signature 03: Full-Width 120-Year Vimshottari Dasha River */}
        <div className="relative rounded-2xl bg-[#FFFFFF] dark:bg-[#0B0C10] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 mb-8 overflow-x-auto shadow-xl transition-colors duration-300">
          {/* Sacred Geometry Dual-Border Accent */}
          <div className="absolute inset-0 rounded-2xl border border-[#8E6F1D]/10 dark:border-[#D4AF37]/10 pointer-events-none" />
          <div className="text-[10px] font-mono-data uppercase tracking-widest text-[#857E74] dark:text-[#6B6760] mb-4 flex items-center justify-between min-w-[760px]">
            <span>{t.riverTitle}</span>
            <span>{t.moonLon}: {moonLongitude.toFixed(2)}°</span>
          </div>

          {/* 9 Mahadasha Timeline Blocks */}
          <div className="grid grid-cols-9 gap-2 min-w-[760px] font-mono-data">
            {dashaData.mahadashas.map((md) => {
              const isSelected = selectedMD.lord === md.lord;
              const lordDisplayName = lang === 'hi' ? md.lordHi : md.lord;
              return (
                <div
                  key={md.lord}
                  onClick={() => {
                    chitiSensory.playTick();
                    setSelectedMD(md);
                    setSelectedAD(null);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-center relative ${
                    md.isCurrent
                      ? 'bg-[#F5EEDC] dark:bg-[#15121c] border-[#8E6F1D] dark:border-[#D4AF37] ring-1 ring-[#D4AF37]'
                      : isSelected
                      ? 'bg-[#ECEAF7] dark:bg-[#111320] border-[#4848A8] dark:border-[#8B8BF5]'
                      : 'bg-[#FAF7F2] dark:bg-[#07080C] border-black/[0.06] dark:border-white/[0.06] hover:bg-white dark:hover:bg-[#0E1018]'
                  }`}
                >
                  {md.isCurrent && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-[#C26E22] dark:bg-[#D97736] text-[#FFFFFF] dark:text-[#060709] text-[8px] font-bold uppercase tracking-wider">
                      {lang === 'hi' ? 'सक्रिय' : 'Active'}
                    </span>
                  )}
                  <div className="font-editorial font-bold text-sm text-[#1C1917] dark:text-[#EFECE6] mt-1">{lordDisplayName}</div>
                  <div className="text-[10px] text-[#8E6F1D] dark:text-[#C5A059] mt-0.5 font-bold">{md.actualDurationYears} {lang === 'hi' ? 'वर्ष' : 'yrs'}</div>
                  <div className="text-[9px] text-[#857E74] dark:text-[#6B6760] mt-1">{md.startFormatted}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Mahadasha & Antardashas Grid */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.08] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-black/[0.06] dark:border-white/[0.06] gap-2">
            <div>
              <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#4848A8] dark:text-[#8B8BF5] font-bold">{t.subPeriodBreakdown}</span>
              <h3 className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">
                {lang === 'hi' ? selectedMD.lordHi : selectedMD.lord} {lang === 'hi' ? 'महादशा' : 'Mahadasha'} ({selectedMD.startFormatted} – {selectedMD.endFormatted})
              </h3>
            </div>

            <button
              onClick={() => {
                chitiSensory.playTick();
                analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'DASHA_SECTION' });
                onOpenConsultation(`Dasha Transition Analysis (${selectedMD.lord} Period)`);
              }}
              className="px-4 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#101218] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 hover:bg-white dark:hover:bg-[#161822] text-xs font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] transition-colors flex items-center gap-1.5 font-bold shadow-xs"
            >
              <span>{t.askAboutPeriod}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Antardashas List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-xs font-mono-data">
            {selectedMD.antardashas.map((ad) => {
              const isSelectedAD = selectedAD?.lord === ad.lord;
              const adDisplayName = lang === 'hi' ? ad.lordHi : ad.lord;
              const mdDisplayName = lang === 'hi' ? selectedMD.lordHi : selectedMD.lord;

              return (
                <div
                  key={ad.lord}
                  onClick={() => {
                    chitiSensory.playTick();
                    setSelectedAD(isSelectedAD ? null : ad);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    ad.isCurrent
                      ? 'bg-[#FBEBD9] dark:bg-[#1a1410] border-[#C26E22] dark:border-[#D97736] text-[#8C3A0F] dark:text-[#fed7aa] font-bold'
                      : isSelectedAD
                      ? 'bg-[#EDEAF8] dark:bg-[#15172C] border-[#4848A8] dark:border-[#8B8BF5] text-[#1C1917] dark:text-white'
                      : 'bg-[#FAF7F2] dark:bg-[#07080C] border-black/[0.05] dark:border-white/[0.05] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37]'
                  }`}
                >
                  <div>
                    <div className="text-[9px] text-[#857E74] dark:text-[#6B6760] uppercase">{mdDisplayName} /</div>
                    <div className="font-bold text-sm text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-between">
                      <span>{adDisplayName}</span>
                      <span className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37]">
                        {isSelectedAD ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] text-[#857E74] dark:text-[#6B6760] mt-2 pt-2 border-t border-black/[0.05] dark:border-white/[0.05]">
                    {ad.startFormatted} – {ad.endFormatted}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Level 3: Pratyantardasha (Sub-sub period) Drill-down view */}
          {selectedAD && (
            <div className="mt-6 p-5 rounded-xl bg-[#FAF7F2] dark:bg-[#07080C] border border-[#4848A8]/30 dark:border-[#8B8BF5]/30 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-2 font-mono-data">
                <span className="text-xs font-bold text-[#4848A8] dark:text-[#8B8BF5] uppercase">
                  {lang === 'hi' ? 'प्रत्यन्तर्दशा सूक्ष्म कालक्रम' : 'Pratyantardasha (Sub-Sub Period) Granular Breakdown'}
                </span>
                <span className="text-[11px] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                  {lang === 'hi' ? `${selectedMD.lordHi} / ${selectedAD.lordHi}` : `${selectedMD.lord} / ${selectedAD.lord}`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 font-mono-data text-[11px]">
                {selectedAD.pratyantardashas.map((pd, pidx) => (
                  <div key={pidx} className="p-2 rounded bg-white dark:bg-[#0F111E] border border-black/[0.05] dark:border-white/[0.05] text-center">
                    <div className="font-bold text-[#1C1917] dark:text-[#EFECE6]">
                      {lang === 'hi' ? pd.lordHi : pd.lord}
                    </div>
                    <div className="text-[9px] text-[#857E74] dark:text-[#736E67] mt-1">
                      {pd.startFormatted}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono-data text-[#857E74] dark:text-[#6B6760] gap-2">
            <span>
              {t.footnote}
            </span>
            <span className="text-[#8E6F1D] dark:text-[#8E7745] font-bold">
              VedicEphemeris Engine
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

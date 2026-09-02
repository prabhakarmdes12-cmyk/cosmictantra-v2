'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Heart, 
  Compass, 
  Award, 
  Flame, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import { 
  ExecutiveLifeDimension, 
  GrahaArchetypeCard 
} from '@/lib/jyotish/executiveLifeGauge';

interface Props {
  dimensions: ExecutiveLifeDimension[];
  archetypeCards: GrahaArchetypeCard[];
  lang?: string;
}

export default function ExecutiveLifeGaugeDashboard({
  dimensions,
  archetypeCards,
  lang = 'hi'
}: Props) {
  const [selectedPlanet, setSelectedPlanet] = useState<string>(archetypeCards[0]?.planet || 'Sun');
  const [showProofDetails, setShowProofDetails] = useState<boolean>(false);

  const activeCard = archetypeCards.find(c => c.planet === selectedPlanet) || archetypeCards[0];

  const getDimensionIcon = (id: string) => {
    switch (id) {
      case 'emotional_resilience': return <Heart className="w-4 h-4 text-rose-400" />;
      case 'career_trajectory': return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case 'financial_stability': return <Award className="w-4 h-4 text-emerald-400" />;
      case 'relationship_sensitivity': return <Sparkles className="w-4 h-4 text-pink-400" />;
      case 'leadership_force': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'spiritual_inclination': return <Compass className="w-4 h-4 text-violet-400" />;
      default: return <Activity className="w-4 h-4 text-amber-400" />;
    }
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'from-amber-400 via-yellow-400 to-amber-500';
    if (score >= 66) return 'from-emerald-400 to-teal-500';
    if (score >= 50) return 'from-cyan-400 to-blue-500';
    return 'from-rose-400 to-orange-500';
  };

  return (
    <section className="space-y-8 rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-white via-[#FAF6EF] to-white dark:from-[#0E1020] dark:via-[#13162A] dark:to-[#0B0D1B] border border-[#E5D7BC] dark:border-white/10 shadow-xl print:hidden">
      
      {/* Header & Truth Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5D7BC]/60 dark:border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-mono-data font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {lang === 'hi'
                ? 'वैदिक षड्बल व अष्टकवर्ग प्रमाणित जीवन सूचकांक'
                : 'BPHS Shadbala & Ashtakavarga Grounded Life Metrics'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917] dark:text-[#FAF7F2] mt-2 tracking-tight">
            {lang === 'hi' ? 'जीवन-दशा व सामर्थ्य विश्लेषण' : 'Executive Life-Pattern Matrix'}
          </h2>
          <p className="text-xs sm:text-sm text-[#78716C] dark:text-[#A8A29E] mt-1 font-editorial">
            {lang === 'hi'
              ? 'प्रतियोगी ऐप्स के अनुमानित व काल्पनिक 55% अंकों से परे — 337 अष्टकवर्ग बिन्दु एवं 6-स्तरीय षड्बल से गणितीय रूप से सिद्ध।'
              : 'Beyond speculative templated scores — computed strictly from 337 SAV Bindus and 6-fold planetary Shadbala.'}
          </p>
        </div>

        <button
          onClick={() => setShowProofDetails(!showProofDetails)}
          className="self-start md:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono-data font-bold bg-white dark:bg-white/5 border border-[#8E6F1D]/30 text-[#8E6F1D] dark:text-[#F0C968] hover:bg-amber-50 dark:hover:bg-white/10 transition-all cursor-pointer shadow-xs"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{showProofDetails ? (lang === 'hi' ? 'संक्षिप्त दृश्य' : 'Compact View') : (lang === 'hi' ? 'गणितीय प्रमाण देखें' : 'View Astrological Basis')}</span>
        </button>
      </div>

      {/* 1. The 6-Dimension Life Gauge Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dimensions.map((dim) => {
          const isHigh = dim.score >= 70;
          return (
            <div
              key={dim.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#161828]/80 border border-[#E5D7BC] dark:border-white/10 hover:border-amber-500/40 transition-all shadow-sm space-y-3 relative overflow-hidden group"
            >
              {/* Subtle top glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-white/5 border border-amber-500/20">
                    {getDimensionIcon(dim.id)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1C1917] dark:text-white leading-tight">
                      {lang === 'hi' ? dim.titleHi : dim.titleEn}
                    </h3>
                    <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-semibold">
                      {lang === 'hi' ? dim.archetypeHi : dim.archetypeEn}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl sm:text-2xl font-mono-data font-bold text-[#1C1917] dark:text-white">
                    {dim.score}%
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dim.score >= 80
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                      : dim.score >= 66
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                  }`}>
                    {lang === 'hi' ? dim.levelHi : dim.levelEn}
                  </span>
                </div>
              </div>

              {/* Progress Bar with Gradient */}
              <div className="space-y-1">
                <div className="w-full h-2.5 rounded-full bg-[#E5D7BC]/40 dark:bg-black/40 overflow-hidden p-0.5 border border-black/5 dark:border-white/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getBarColor(dim.score)} transition-all duration-700 ease-out`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
              </div>

              {/* Verified Mathematical Footnote */}
              <p className="text-[11px] text-[#57534E] dark:text-[#C4BDB5] leading-relaxed">
                {lang === 'hi' ? dim.insightHi : dim.insightEn}
              </p>

              {/* Proof Breakdown (Expandable) */}
              {showProofDetails && (
                <div className="pt-2 border-t border-black/5 dark:border-white/5 grid grid-cols-2 gap-2 text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                  <div>
                    <span>{lang === 'hi' ? 'अधिष्ठाता ग्रह: ' : 'Graha: '}</span>
                    <strong className="text-[#1C1917] dark:text-white">{dim.grahaSignificator}</strong>
                  </div>
                  <div>
                    <span>{lang === 'hi' ? 'कार्यान्वित भाव: ' : 'Bhava: '}</span>
                    <strong className="text-[#1C1917] dark:text-white">{dim.bhavaSignificator}</strong>
                  </div>
                  {dim.bindus !== null && (
                    <div>
                      <span>SAV Bindus: </span>
                      <strong className="text-amber-600 dark:text-amber-300">{dim.bindus} / 28 avg</strong>
                    </div>
                  )}
                  {dim.shadbalaRatio !== null && (
                    <div>
                      <span>Shadbala Ratio: </span>
                      <strong className="text-amber-600 dark:text-amber-300">{dim.shadbalaRatio}x req</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Modern 4-Quadrant Graha Archetype Dossier */}
      <div className="space-y-6 pt-6 border-t border-[#E5D7BC]/60 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'ग्रह स्वरूप व 4-पक्षीय विवेचना' : '4-Quadrant Planetary Deep Dossier'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917] dark:text-[#FAF7F2] mt-0.5">
              {lang === 'hi' ? 'प्रत्येक ग्रह की शक्ति, छाया व व्यावहारिक उपाय' : 'Archetype, Superpower, Shadow & Practical Upaaya'}
            </h3>
          </div>

          {/* Planet Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {archetypeCards.map((card) => {
              const isSelected = selectedPlanet === card.planet;
              return (
                <button
                  key={card.planet}
                  onClick={() => setSelectedPlanet(card.planet)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-data font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-md scale-105'
                      : 'bg-white dark:bg-[#161828] text-[#57534E] dark:text-[#C4BDB5] border border-[#E5D7BC] dark:border-white/10 hover:border-amber-500/50'
                  }`}
                >
                  {lang === 'hi' ? card.planetHi.split(' ')[0] : card.planet}
                </button>
              );
            })}
          </div>
        </div>

        {/* The 4-Quadrant Active Card */}
        {activeCard && (
          <div className="rounded-3xl bg-white dark:bg-[#13162A] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/30 p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center font-serif text-xl font-bold shadow-md">
                  {activeCard.planet[0]}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#1C1917] dark:text-white font-serif flex items-center gap-2">
                    <span>{lang === 'hi' ? activeCard.planetHi : activeCard.planet}</span>
                    <span className="text-xs font-mono-data px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {lang === 'hi' ? `भाव ${activeCard.house}` : `House ${activeCard.house}`}
                    </span>
                  </h4>
                  <p className="text-xs font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    {activeCard.rashiHi} ({activeCard.rashiEn}) • {activeCard.dignity}
                    {activeCard.shadbalaRatio !== null ? ` • Shadbala ${activeCard.shadbalaRatio}x` : ''}
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono-data text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ {lang === 'hi' ? 'शास्त्रसम्मत व्यक्तिगत स्वरूप' : 'Authentic Jyotish Archetype'}
              </div>
            </div>

            {/* 4 Quadrants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Quadrant 1: CORE THEME */}
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-white/5 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold font-mono-data text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{lang === 'hi' ? '1. मूल स्वरूप व चेतना (Core Theme)' : '1. Core Archetype & Theme'}</span>
                </div>
                <p className="text-sm font-editorial text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
                  {lang === 'hi' ? activeCard.coreThemeHi : activeCard.coreThemeEn}
                </p>
              </div>

              {/* Quadrant 2: INNATE SUPERPOWER */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold font-mono-data text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? '2. स्वाभाविक सामर्थ्य (Innate Superpower)' : '2. Innate Superpower & Talent'}</span>
                </div>
                <p className="text-sm font-editorial text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
                  {lang === 'hi' ? activeCard.strengthHi : activeCard.strengthEn}
                </p>
              </div>

              {/* Quadrant 3: SHADOW / FRICTION */}
              <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold font-mono-data text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? '3. छाया पक्ष व सजगता (Shadow Challenge)' : '3. Shadow & Friction Point'}</span>
                </div>
                <p className="text-sm font-editorial text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
                  {lang === 'hi' ? activeCard.challengeHi : activeCard.challengeEn}
                </p>
              </div>

              {/* Quadrant 4: PRACTICAL REMEDY */}
              <div className="p-5 rounded-2xl bg-violet-50/50 dark:bg-violet-500/5 border border-violet-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold font-mono-data text-violet-700 dark:text-violet-400 uppercase tracking-wider">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? '4. शास्त्रसम्मत व्यावहारिक उपाय (Actionable Upaaya)' : '4. Actionable Vedic Remedy'}</span>
                </div>
                <p className="text-sm font-editorial text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
                  {lang === 'hi' ? activeCard.practicalRemedyHi : activeCard.practicalRemedyEn}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

    </section>
  );
}

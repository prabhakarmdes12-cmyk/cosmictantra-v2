'use client';

import React from 'react';
import { Sparkles, Compass, Moon, Star, Clock, ShieldCheck, Flame, Award } from 'lucide-react';
import type { CanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';

interface NoviceCosmicOverviewProps {
  snapshot: CanonicalJyotishSnapshot;
  lang?: string;
  personName?: string;
}

const RASHI_ARCHETYPES: Record<string, { titleEn: string; titleHi: string; descEn: string; descHi: string }> = {
  'Aries': {
    titleEn: 'The Pioneer & Courageous Catalyst',
    titleHi: 'साहसी, ऊर्जावान एवं नेतृत्वशील',
    descEn: 'Dynamic initiative, decisive action, and bold courage. You thrive when forging new paths.',
    descHi: 'प्रबल आत्मविश्वास, त्वरित निर्णय शक्ति और नवीन दिशाओं में अग्रसर होने का नैसर्गिक सामर्थ्य।'
  },
  'Taurus': {
    titleEn: 'The Steadfast & Creative Builder',
    titleHi: 'स्थिर, धैर्यवान एवं सौन्दर्य-प्रेमी',
    descEn: 'Grounded patience, enduring loyalty, practical wisdom, and appreciation for beauty and lasting value.',
    descHi: 'अडिग निष्ठा, व्यावहारिक सूझबूझ, और जीवन में स्थिरता व सुन्दरता का सृजन।'
  },
  'Gemini': {
    titleEn: 'The Versatile & Inquiring Intellect',
    titleHi: 'बहुमुखी, जिज्ञासु एवं कुशल वक्ता',
    descEn: 'Intellectual agility, expressive communication, rapid learning, and keen observational perception.',
    descHi: 'तीव्र बुद्धि, प्रभावशाली संवाद कौशल, बहुआयामी प्रतिभा और सतत् सीखने की ललक।'
  },
  'Cancer': {
    titleEn: 'The Intuitive & Nurturing Protector',
    titleHi: 'संवेदनशील, संरक्षणशील एवं अन्तर्ज्ञानी',
    descEn: 'Profound emotional depth, strong protective instincts, rich intuition, and devotion to roots.',
    descHi: 'गहन भावनात्मक समझ, आत्मीयता, परिवार के प्रति समर्पण और स्वाभाविक पूर्वाभास।'
  },
  'Leo': {
    titleEn: 'The Radiant & Generous Sovereign',
    titleHi: 'तेजस्वी, उदार एवं स्वाभाविक नायक',
    descEn: 'Natural dignity, magnanimous warmth, creative vitality, and an inspiring presence.',
    descHi: 'आत्मसम्मान, उदार हृदय, रचनात्मक प्रतिभा और दूसरों को प्रेरित करने का विशिष्ट तेज।'
  },
  'Virgo': {
    titleEn: 'The Discerning & Dedicated Master',
    titleHi: 'सूक्ष्मदर्शी, विश्लेषक एवं कर्तव्यनिष्ठ',
    descEn: 'Analytical precision, devoted service, mastery of craft, and a keen eye for practical solutions.',
    descHi: 'सटीक विश्लेषण, सेवा-भाव, कार्यकुशलता और हर काम को परिपूर्णता से करने की लगन।'
  },
  'Libra': {
    titleEn: 'The Harmonious & Dispassionate Diplomat',
    titleHi: 'संतुलित, न्यायप्रिय एवं सामंजस्यकारी',
    descEn: 'Innate fairness, exquisite aesthetic balance, diplomatic clarity, and deep commitment to partnership.',
    descHi: 'संतुलन, निष्पक्ष दृष्टिकोण, सौहार्दपूर्ण संबंध और न्यायसंगत निर्णय क्षमता।'
  },
  'Scorpio': {
    titleEn: 'The Transformative & Penetrating Seeker',
    titleHi: 'गूढ़, दृढ़निश्चयी एवं रूपान्तरणकारी',
    descEn: 'Unyielding willpower, deep perception beneath surfaces, emotional resilience, and transformative power.',
    descHi: 'अटूट इच्छाशक्ति, रहस्य को भेदने की दृष्टि, संकट में अभूतपूर्व धैर्य और पुनरुत्थान की शक्ति।'
  },
  'Sagittarius': {
    titleEn: 'The Philosophical & Noble Explorer',
    titleHi: 'दार्शनिक, आशावादी एवं धर्मनिष्ठ',
    descEn: 'Expansive vision, moral integrity, quest for higher truth, and uplifting optimism.',
    descHi: 'उच्च आदर्श, सत्य और ज्ञान की खोज, व्यापक दृष्टिकोण और जीवन के प्रति अटूट आशावाद।'
  },
  'Capricorn': {
    titleEn: 'The Pragmatic & Enduring Architect',
    titleHi: 'धैर्यवान, कर्मठ एवं दूरदर्शी प्रबंधक',
    descEn: 'Disciplined perseverance, strategic mastery, patient ambition, and the ability to construct lasting legacy.',
    descHi: 'कठिन परिश्रम, समय की समझ, सुदृढ़ अनुशासन और दीर्घकालिक सफलता की नींव रखने की क्षमता।'
  },
  'Aquarius': {
    titleEn: 'The Humanitarian & Visionary Thinker',
    titleHi: 'मानवतावादी, मौलिक एवं क्रान्तिकारी',
    descEn: 'Original insight, collective consciousness, progressive ideas, and freedom of thought.',
    descHi: 'मौलिक विचार, समाज के उत्थान की सोच, परम्परा से हटकर नवीन दृष्टिकोण और बौद्धिक स्वतन्त्रता।'
  },
  'Pisces': {
    titleEn: 'The Empathetic & Transcendent Seer',
    titleHi: 'अन्तर्मुखी, करुणामय एवं आध्यात्मिक द्रष्टा',
    descEn: 'Oceanic empathy, artistic imagination, spiritual intuition, and natural detachment from worldly friction.',
    descHi: 'असीम करुणा, गहन आध्यात्मिक चेतना, सृजनात्मक कल्पना और सांसारिक तनावों से परे शान्ति की अनुभूति।'
  }
};

const DASHA_MEANINGS: Record<string, { essenceEn: string; essenceHi: string }> = {
  'Sun': {
    essenceEn: 'Era of self-authority, professional visibility, clarity of purpose, and aligning with your true life calling.',
    essenceHi: 'आत्म-सम्मान, प्रतिष्ठा, स्पष्ट जीवन-उद्देश्य और पिता या उच्चाधिकारियों के सहयोग का समय।'
  },
  'Moon': {
    essenceEn: 'Era of emotional expansion, intuitive growth, domestic peace, and meaningful public connections.',
    essenceHi: 'भावनात्मक परिपक्वता, मन की शान्ति, जनसम्पर्क और पारिवारिक सौहार्द का काल।'
  },
  'Mars': {
    essenceEn: 'Era of dynamic initiative, physical vitality, property acquisition, and courage to overcome obstacles.',
    essenceHi: 'साहस, ऊर्जा, सम्पत्ति निर्माण और विरोधियों पर विजय प्राप्त करने का सक्रिय काल।'
  },
  'Rahu': {
    essenceEn: 'Era of rapid expansion, unconventional breakthroughs, ambitious growth, and navigating intense transitions.',
    essenceHi: 'तीव्र परिवर्तन, महत्त्वाकांक्षा, लीक से हटकर नए रास्ते खोलने और सांसारिक विस्तार का समय।'
  },
  'Jupiter': {
    essenceEn: 'Era of higher wisdom, spiritual blessings, financial prosperity, educational advancement, and family harmony.',
    essenceHi: 'गुरु-कृपा, धर्म, विवेक, ज्ञान-वृद्धि, आर्थिक उन्नति और शुभ कार्यों का स्वर्णिम समय।'
  },
  'Saturn': {
    essenceEn: 'Era of karmic consolidation, disciplined foundation-building, steady perseverance, and enduring achievements.',
    essenceHi: 'कर्म-शोधन, अनुशासन, धैर्य, कर्तव्य-पालन और दीर्घकालिक स्थायित्व निर्माण का महत्त्वपूर्ण दौर।'
  },
  'Mercury': {
    essenceEn: 'Era of intellect, analytical breakthroughs, commercial acumen, articulate communication, and adaptability.',
    essenceHi: 'बुद्धि, व्यापार, संचार-कौशल, नई विद्याओं के अर्जन और व्यावहारिक लाभ का समय।'
  },
  'Ketu': {
    essenceEn: 'Era of spiritual introspection, shedding superficial baggage, inner liberation, and deep philosophical awakening.',
    essenceHi: 'आत्म-मंथन, अध्यात्म, अनासक्ति, आन्तरिक मुक्ति और गूढ़ ज्ञान के साक्षात्कार का समय।'
  },
  'Venus': {
    essenceEn: 'Era of harmonious love, artistic refinement, wealth, material comfort, and celebrating life’s blessings.',
    essenceHi: 'सौन्दर्य, प्रेम, कला, भौतिक सुख-साधनों की वृद्धि और मधुर संबंधों का आनन्दमय काल।'
  }
};

export default function NoviceCosmicOverview({ snapshot, lang = 'en', personName }: NoviceCosmicOverviewProps) {
  const isHi = lang === 'hi';
  const lagnaRashi = snapshot.lagna.rashiEn;
  const lagnaInfo = RASHI_ARCHETYPES[lagnaRashi] || RASHI_ARCHETYPES['Pisces'];

  const moonRashi = (snapshot.planets as any)?.Moon?.rashiEn || 'Capricorn';
  const moonInfo = RASHI_ARCHETYPES[moonRashi] || RASHI_ARCHETYPES['Capricorn'];

  const nakshatraName = snapshot.birthPanchang.nakshatra?.name || 'Ashwini';
  const nakshatraPada = (snapshot.birthPanchang.nakshatra as any)?.pada ?? '1';

  const currentMd = snapshot.dasha.currentMahadasha || 'Jupiter';
  const currentAd = snapshot.dasha.currentAntardasha || 'Saturn';
  const dashaInfo = DASHA_MEANINGS[currentMd] || DASHA_MEANINGS['Jupiter'];

  // Identify strong planets
  const planetsObj = (snapshot.planets || {}) as Record<string, any>;
  const strongPlanets = Object.entries(planetsObj)
    .filter(([_, p]) => p?.dignity && ['EXALTED', 'OWN_SIGN', 'MOOLATRIKONA'].includes(p.dignity))
    .map(([name, p]) => ({ name, dignity: p.dignity, rashi: p.rashiEn }));

  return (
    <div data-testid="novice-cosmic-overview" className="rounded-3xl border border-[#D4C7B0] dark:border-white/10 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EF] to-[#FFFDF9] dark:from-[#111322] dark:via-[#0D0F1A] dark:to-[#111322] p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5D7BC]/70 dark:border-white/10 pb-4">
        <div>
          <div className="text-[10px] font-mono-data uppercase tracking-[0.24em] text-[#8E6F1D] dark:text-[#E6C665] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isHi ? 'सरल भाषा में आपकी कुण्डली का सार' : 'THE CORE ESSENCE OF YOUR KUNDLI'}</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-[#F3EFE6] mt-1">
            {isHi ? `${personName || 'जातक'} का ज्योतिषीय परिचय` : `Cosmic Blueprint: ${personName || 'Seeker'}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono-data font-bold bg-amber-500/10 text-[#8E6F1D] dark:text-[#F0C968] border border-amber-500/20">
            {snapshot.meta.ayanamshaName}
          </span>
        </div>
      </div>

      {/* 3 Core Pillars: Lagna, Moon, Nakshatra */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Lagna */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#161828]/80 border border-[#E5D7BC] dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8E6F1D] dark:text-[#F0C968]">
            <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              {isHi ? 'लग्न (जीवन की दिशा)' : 'ASCENDANT (LAGNA)'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10">
              {snapshot.lagna.rashiName}
            </span>
          </div>
          <div className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {isHi ? lagnaInfo.titleHi : lagnaInfo.titleEn}
          </div>
          <p className="text-xs text-[#57534E] dark:text-[#C5BEB3] leading-relaxed">
            {isHi ? lagnaInfo.descHi : lagnaInfo.descEn}
          </p>
          <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#E6C665]">
            {snapshot.lagna.rashiEn} · {snapshot.lagna.degreeStr}
          </div>
        </div>

        {/* Pillar 2: Moon Sign */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#161828]/80 border border-[#E5D7BC] dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8E6F1D] dark:text-[#F0C968]">
            <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5" />
              {isHi ? 'चन्द्र राशि (मन व भावना)' : 'MOON SIGN (RASHI)'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10">
              {(snapshot.planets as any)?.Moon?.rashiName || 'मकर'}
            </span>
          </div>
          <div className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {isHi ? moonInfo.titleHi : moonInfo.titleEn}
          </div>
          <p className="text-xs text-[#57534E] dark:text-[#C5BEB3] leading-relaxed">
            {isHi ? moonInfo.descHi : moonInfo.descEn}
          </p>
          <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#E6C665]">
            {(snapshot.planets as any)?.Moon?.rashiEn || 'Capricorn'}
          </div>
        </div>

        {/* Pillar 3: Janma Nakshatra */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#161828]/80 border border-[#E5D7BC] dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8E6F1D] dark:text-[#F0C968]">
            <span className="text-[10px] font-mono-data font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              {isHi ? 'जन्म नक्षत्र (दिव्य ऊर्जा)' : 'BIRTH STAR (NAKSHATRA)'}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10">
              {nakshatraName}
            </span>
          </div>
          <div className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {isHi ? `नक्षत्र: ${nakshatraName} (चरण ${nakshatraPada})` : `${nakshatraName} · Pada ${nakshatraPada}`}
          </div>
          <p className="text-xs text-[#57534E] dark:text-[#C5BEB3] leading-relaxed">
            {isHi
              ? 'यह आपकी चेतना की मूल प्रकृति है। आपके विचार, संवेदनशीलता और कर्म-दिशा इसी नक्षत्र ऊर्जा द्वारा निर्देशित होते हैं।'
              : 'Your cosmic gateway. Reflects your instinctual intelligence, latent gifts, and unique rhythm of personal expression.'}
          </p>
          <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#E6C665]">
            Lord: {(snapshot.birthPanchang.nakshatra as any)?.ruler || 'Moon'}
          </div>
        </div>
      </div>

      {/* Active Season: Vimshottari Current Window */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 dark:from-amber-500/15 dark:via-transparent dark:to-amber-500/15 border border-[#8E6F1D]/30 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[#8E6F1D] dark:text-[#F0C968]">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-mono-data font-bold uppercase tracking-wider">
              {isHi ? 'वर्तमान सक्रिय काल (महादशा एवं अन्तर्दशा)' : 'WHAT IS ACTIVE NOW (CURRENT DASHA ERA)'}
            </span>
          </div>
          <span className="text-[11px] font-mono-data font-semibold text-[#1C1917] dark:text-[#EFECE6]">
            {snapshot.dasha.currentDateRange}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
          <span className="font-editorial text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#F3EFE6]">
            {currentMd} Mahadasha · {currentAd} Antardasha
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#44403C] dark:text-[#D1C9BF] leading-relaxed">
          {isHi ? dashaInfo.essenceHi : dashaInfo.essenceEn}
        </p>
      </div>

      {/* Highlights: Auspicious Yogas & Strong Placements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Yogas */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#161828]/70 border border-[#E5D7BC] dark:border-white/10 space-y-2">
          <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            {isHi ? 'सक्रिय शुभ योग' : 'KEY AUSPICIOUS YOGAS'}
          </div>
          <div className="flex flex-wrap gap-2">
            {(snapshot.yogasAndDoshas.rajYogas ?? []).length > 0 ? (
              (snapshot.yogasAndDoshas.rajYogas ?? []).slice(0, 4).map((y: string) => (
                <span key={y} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] border border-amber-200 dark:border-amber-500/30">
                  {y}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                {isHi ? 'मानक ग्रह योग सक्रिय हैं' : 'Standard classical planetary combinations active'}
              </span>
            )}
          </div>
        </div>

        {/* Strengths */}
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#161828]/70 border border-[#E5D7BC] dark:border-white/10 space-y-2">
          <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            {isHi ? 'विशेष बलवान ग्रह' : 'EMPOWERED PLANETS'}
          </div>
          <div className="flex flex-wrap gap-2">
            {strongPlanets.length > 0 ? (
              strongPlanets.map((p) => (
                <span key={p.name} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  {p.name} ({p.dignity.replace('_', ' ')})
                </span>
              ))
            ) : (
              <span className="text-xs text-[#78716C] dark:text-[#A8A29E]">
                {isHi ? 'संतुलित ग्रह स्थिति' : 'Balanced planetary dignity matrix'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

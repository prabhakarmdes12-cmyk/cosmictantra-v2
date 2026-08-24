import React, { useState } from 'react';
import { HelpCircle, Check, X, ArrowRight } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function AskBetterQuestions({ onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const [selectedCategory, setSelectedCategory] = useState('career');
  const t = TRANSLATIONS[lang]?.askBetter || TRANSLATIONS.en.askBetter;

  const COMPARISONS = lang === 'hi' ? [
    {
      id: 'career',
      label: 'आजीविका एवं कार्यक्षेत्र',
      vague: 'मेरा भविष्य बताइए और मेरी पदोन्नति कब होगी?',
      sharp: 'मेरे पास दो प्रस्ताव हैं (एक कॉर्पोरेट नेतृत्व का और दूसरा नए स्टार्टअप का)। मेरे दशम भाव और सक्रिय दशा के आधार पर मुझे किन बातों का ध्यान रखना चाहिए?',
      why: 'विद्वान् दशम, षष्ठ एवं अष्टम भावों के स्वामियों तथा दशा प्रवृत्तियों का सटीक परीक्षण कर सकते हैं।'
    },
    {
      id: 'business',
      label: 'व्यापार एवं उद्यम आरम्भ',
      vague: 'क्या मैं व्यापार शुरू करके धनवान बनूँगा?',
      sharp: 'मैं आगामी चतुर्थ तिमाही में विनिर्माण व्यवसाय आरम्भ करने की योजना बना रहा हूँ। मेरी वर्तमान विंशोत्तरी दशा ऋण जोखिम एवं साझेदारी के विषय में क्या संकेत देती है?',
      why: 'ऋण जोखिम (षष्ठ/द्वादश भाव) और वित्तीय समय (द्वितीय/एकादश भाव) पर सीधा ध्यान केन्द्रित करता है।'
    },
    {
      id: 'relationship',
      label: 'विवाह एवं समय',
      vague: 'मेरा विवाह कब होगा और यह प्रेम विवाह होगा या पारम्परिक?',
      sharp: 'मेरा परिवार विवाह प्रस्तावों पर विचार कर रहा है। मेरा सप्तम भाव तथा आगामी शुक्र/गुरु अन्तर्दशा दीर्घकालिक वैवाहिक स्थिरता के विषय में क्या काल संकेत करती है?',
      why: 'विद्वान् को विशिष्ट गोचर एवं दशा सक्रियण काल की ओर निर्देशित करता है।'
    },
    {
      id: 'relocation',
      label: 'विदेश प्रवास एवं स्थान परिवर्तन',
      vague: 'क्या मैं विदेश जाऊँगा या भारत में ही रहूँगा?',
      sharp: 'मैं कनाडा स्थायी निवास हेतु आवेदन कर रहा हूँ। क्या मेरा नवम एवं द्वादश भाव दीर्घकालिक विदेश निवास का समर्थन करता है?',
      why: 'विदेश यात्रा एवं निवास से जुड़े धर्म और मोक्ष भावों को स्पष्ट रूप से विश्लेषित करता है।'
    }
  ] : [
    {
      id: 'career',
      label: 'Career & Job Pivot',
      vague: 'Tell me my future and when I will get a promotion.',
      sharp: 'I have two competing offers (a corporate leadership role vs. an early-stage startup). What patterns in my 10th house and active Dasha should I consider during this decision?',
      why: 'Allows the scholar to examine specific Bhava lords (10th vs 6th vs 8th) and Dasha trends rather than guessing.'
    },
    {
      id: 'business',
      label: 'Business Expansion',
      vague: 'Will I be rich if I start my own business?',
      sharp: 'I am planning to bootstrap a manufacturing enterprise in Q4. What does my current Vimshottari period suggest regarding debt leverage and partnership alignment?',
      why: 'Focuses on risk exposure (6th/12th houses) and financial timing (2nd/11th houses).'
    },
    {
      id: 'relationship',
      label: 'Marriage & Timing',
      vague: 'When will I get married and will it be love or arranged?',
      sharp: 'My family is actively reviewing proposals. What does my 7th house and upcoming Venus/Jupiter sub-period indicate regarding the timing of long-term marital commitment?',
      why: 'Directs the scholar to specific transit and Dasha activation windows.'
    },
    {
      id: 'relocation',
      label: 'Relocation & Abroad',
      vague: 'Will I go to America or stay in India?',
      sharp: 'I am applying for permanent residency in Canada. Does my 9th and 12th house alignment support long-term foreign settlement or temporary work assignment?',
      why: 'Pinpoints specific Moksha/Dharma houses governing geographical migration.'
    }
  ];

  const activeComparison = COMPARISONS.find(c => c.id === selectedCategory) || COMPARISONS[0];

  const handleUseTemplate = () => {
    chitiSensory.playTick();
    analytics.track(ANALYTICS_EVENTS.QUESTION_REFINER_OPENED, { category: selectedCategory });
    onOpenConsultation(activeComparison.sharp);
  };

  return (
    <section className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#060709] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] font-mono-data mt-2">
            {t.subheading}
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 font-mono-data">
          {COMPARISONS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                chitiSensory.playTick();
                setSelectedCategory(cat.id);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs transition-colors font-bold ${
                selectedCategory === cat.id
                  ? 'bg-[#D4AF37] text-[#060709] shadow-xs'
                  : 'bg-[#FFFFFF] dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.07] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Side-by-Side Comparison: Vague vs Sharp */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono-data mb-8">
          
          {/* Weak Question Box */}
          <div className="p-6 rounded-2xl bg-[#FDF0F2] dark:bg-[#180A0E] border border-[#ef4444]/30 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#A81E2E] dark:text-[#f87171] mb-3 font-bold">
                <X className="w-3.5 h-3.5" />
                <span>{t.vagueTag}</span>
              </div>
              <p className="text-sm font-semibold text-[#A81E2E] dark:text-[#fca5a5] italic leading-relaxed">
                "{activeComparison.vague}"
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-[#260e10] text-[11px] text-[#A81E2E]/80 dark:text-[#fca5a5]/70">
              {t.vagueNote}
            </div>
          </div>

          {/* Sharp Question Box */}
          <div className="p-6 rounded-2xl bg-[#EBF7F0] dark:bg-[#081610] border border-[#10b981]/30 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#0F6B43] dark:text-[#34d399] mb-3 font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>{t.sharpTag}</span>
              </div>
              <p className="text-sm font-semibold text-[#0F6B43] dark:text-[#a7f3d0] italic leading-relaxed">
                "{activeComparison.sharp}"
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-[#0b2416] text-[11px] text-[#0F6B43] dark:text-[#6ee7b7] font-semibold">
              {activeComparison.why}
            </div>
          </div>

        </div>

        {/* CTA to Use / Refine */}
        <div className="text-left">
          <button
            onClick={handleUseTemplate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FFFFFF] dark:bg-[#101218] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 hover:bg-[#FAF7F2] dark:hover:bg-[#161822] text-xs font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] font-bold transition-all shadow-xs"
          >
            <span>{t.formulateBtn}</span>
          </button>
        </div>

      </div>
    </section>
  );
}

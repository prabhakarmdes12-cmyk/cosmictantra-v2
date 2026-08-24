import React from 'react';
import { Cpu, UserCheck, CheckCircle2 } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';

export default function SampleConsultation({ lang = 'en', theme = 'dark' }) {
  const t = TRANSLATIONS[lang]?.sampleConsultation || TRANSLATIONS.en.sampleConsultation;

  return (
    <section className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#07080C] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#8E7745] uppercase tracking-[0.24em] mb-1.5 font-bold">
            {t.tag}
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] font-mono-data mt-2">
            {t.subheading}
          </p>
        </div>

        {/* Written Consultation Folio Document */}
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 p-6 sm:p-9 shadow-2xl space-y-6 text-left font-mono-data">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-black/[0.08] dark:border-white/[0.07] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-[#10b981]/20 text-[#0F6B43] dark:text-[#34d399] font-bold">
                  {t.reviewedBadge}
                </span>
                <span className="text-[11px] text-[#857E74] dark:text-[#6B6760]">
                  Consultation Ref: CT-2026-8841
                </span>
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-[#EFECE6] mt-1">
                {t.recordTitle}
              </h3>
            </div>

            <div className="text-left sm:text-right text-xs text-[#57524A] dark:text-[#8E8A82]">
              <div>Reviewer: <strong className="text-[#1C1917] dark:text-[#EFECE6]">Pt. Vidyadhar Shastri</strong></div>
              <div className="text-[#8E6F1D] dark:text-[#D4AF37] font-bold">BHU Varanasi Lineage</div>
            </div>
          </div>

          {/* Section 1: The Question */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] space-y-1 shadow-2xs">
            <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-wider font-bold">
              {t.clientInquiry}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#EFECE6] italic leading-relaxed">
              {lang === 'hi'
                ? '"मुझे बेंगलुरु में एक साझेदारी विस्तार का प्रस्ताव मिला है। क्या मुझे अभी इस समझौते पर हस्ताक्षर करने चाहिए, जबकि अगले माह से मेरी गुरु-राहु दशा सन्धि आरम्भ हो रही है?"'
                : '"I am offered a commercial partnership expansion in Bengaluru. Should I execute the agreement now, given that I enter my Jupiter-Rahu Dasha transition next month?"'
              }
            </p>
          </div>

          {/* Section 2: Calculated Astrological Evidence */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] text-[#4848A8] dark:text-[#8B8BF5] font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>{t.stage1}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.05] dark:border-white/[0.05]">
                <div className="text-[#857E74] dark:text-[#6B6760] text-[9px]">Natal Lagna & 10th:</div>
                <div className="text-[#1C1917] dark:text-[#EFECE6] font-semibold mt-0.5">Dhanu Lagna (Sagittarius)</div>
                <div className="text-[10px] text-[#0F6B43] dark:text-[#34d399] font-bold">10th Lord Mercury Exalted</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.05] dark:border-white/[0.05]">
                <div className="text-[#857E74] dark:text-[#6B6760] text-[9px]">Active Vimshottari:</div>
                <div className="text-[#1C1917] dark:text-[#EFECE6] font-semibold mt-0.5">Jupiter MD / Rahu AD</div>
                <div className="text-[10px] text-[#C26E22] dark:text-[#D97736] font-bold">Dasha Sandhi Transition</div>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.05] dark:border-white/[0.05]">
                <div className="text-[#857E74] dark:text-[#6B6760] text-[9px]">7th House / Partnerships:</div>
                <div className="text-[#1C1917] dark:text-[#EFECE6] font-semibold mt-0.5">Mithuna (Mercury ruled)</div>
                <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] font-bold">No Malefic Drishti</div>
              </div>
            </div>
          </div>

          {/* Section 3: Panditji's Discernment & Written Interpretation */}
          <div className="p-5 sm:p-6 rounded-xl bg-[#FAF7F2] dark:bg-[#0B0D15] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                <span>{t.stage2}</span>
              </div>
              <span className="text-[10px] text-[#857E74] dark:text-[#6B6760]">Language: {lang === 'hi' ? 'शुद्ध हिन्दी विवेचन' : 'English Synthesis'}</span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
              {lang === 'hi' ? (
                <>
                  <p>
                    <strong>१. दशा सन्धि काल सावधानी:</strong> आप इस समय गुरु की महादशा से राहु की अन्तर्दशा के संक्रमण काल में प्रवेश कर रहे हैं। राहु के आरम्भिक ४५ दिनों में जो प्रस्ताव कागजों पर अत्यधिक आकर्षक प्रतीत होते हैं, उनमें प्रायः अप्रत्यक्ष दायित्व छिपे होते हैं।
                  </p>
                  <p>
                    <strong>२. दशम भाव एवं बुध का बल:</strong> आपकी कुण्डली में दशमेश बुध उच्च राशिगत होकर सुदृढ़ स्थिति में है, अतः व्यापार विस्तार का निर्णय मूलतः उत्तम है। उद्यम सफल होगा, परन्तु वित्तीय नियन्त्रण स्वयं के पास रखना अनिवार्य है।
                  </p>
                  <p>
                    <strong>३. क्रियात्मक परामर्श:</strong> आगामी शुक्ल सप्तमी (१८ अक्टूबर) से पूर्व अन्तिम हस्ताक्षर न करें। समझौते में नियमित ऑडिट का स्पष्ट नियम रखें। बुधवार के दिन विष्णु सहस्रनाम का पाठ करें।
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>1. Dasha Sandhi Caution:</strong> You are entering the transition phase between Jupiter and Rahu. During the first 45 days of any Rahu sub-period, agreements that seem overwhelmingly lucrative on paper often conceal unspoken liabilities or partner misalignment.
                  </p>
                  <p>
                    <strong>2. The Strength of Your 10th House:</strong> Because your Mercury is strongly positioned, the business expansion itself is structurally viable. The venture will succeed, but only if you retain controlling equity and do not delegate financial oversight.
                  </p>
                  <p>
                    <strong>3. Tactical Recommendation:</strong> Do not sign the final contract before the upcoming Shukla Saptami (October 18). Insist on an explicit audit clause. Perform a simple Vishnu Sahasranama recitation on Wednesdays during this transition.
                  </p>
                </>
              )}
            </div>

            {/* Panditji's Verification Seal */}
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#0F6B43] dark:text-[#34d399] text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.approvedBy}</span>
              </div>
              <span className="text-[10px] text-[#857E74] dark:text-[#6B6760]">
                Institutional Standard
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

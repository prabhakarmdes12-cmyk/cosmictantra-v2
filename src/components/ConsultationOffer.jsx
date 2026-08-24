import React from 'react';
import { MessageSquare, ArrowRight, ShieldCheck, ArrowUpRight, Flame } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function ConsultationOffer({ onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const t = TRANSLATIONS[lang]?.consultationOffer || TRANSLATIONS.en.consultationOffer;

  const PILLARS = lang === 'hi' ? [
    {
      step: '०१',
      title: 'एक स्पष्ट मुख्य प्रश्न',
      desc: 'जीवन का वह वास्तविक निर्णय लाएं जिसमें मार्गदर्शन आवश्यक है — आजीविका, विवाह अथवा व्यवसाय।'
    },
    {
      step: '०२',
      title: 'निश्चित दक्षिणा — ₹५०१',
      desc: 'प्रति मिनट मीटर का कोई तनाव नहीं। शान्ति से विचार कर प्रश्न पूछने की पूर्ण स्वतन्त्रता।'
    },
    {
      step: '०३',
      title: 'खगोलीय आधार एवं सन्दर्भ',
      desc: 'सटीक ग्रह स्पष्ट भोगांश, १२ भाव एवं १२० वर्षीय विंशोत्तरी दशा का प्रत्यक्ष गणितीय निर्माण।'
    },
    {
      step: '०४',
      title: 'विद्वान् द्वारा समीक्षा',
      desc: 'काशी के अनुभवी ज्योतिर्विद् आपकी परिस्थिति का अध्ययन कर शास्त्रीय पाराशरी विवेचना करते हैं।'
    },
    {
      step: '०५',
      title: 'हस्तलिखित परामर्श पत्र',
      desc: 'संरचित एवं स्थायी लिखित परामर्श पत्र प्राप्त करें जिसे आप भविष्य में कभी भी पुनः देख सकते हैं।'
    }
  ] : [
    {
      step: '01',
      title: 'One Focused Question',
      desc: 'Bring the actual life decision requiring discernment — career pivot, enterprise launch, or relationship timing.'
    },
    {
      step: '02',
      title: 'Fixed Price — ₹501',
      desc: 'No ticking per-minute timers. No anxiety of rushing conversation. Flat transparent honorarium.'
    },
    {
      step: '03',
      title: 'Ephemeris + Context',
      desc: 'Exact sidereal coordinates, 12 Bhavas, and 120-year Vimshottari progression assembled deterministically.'
    },
    {
      step: '04',
      title: 'Human Scholar Review',
      desc: 'A verified Jyotish practitioner applies classical Parashari principles to your specific circumstance.'
    },
    {
      step: '05',
      title: 'Written Folio Record',
      desc: 'Receive structured, permanent written counsel you can contemplate, revisit, and preserve.'
    }
  ];

  return (
    <section id="consultation-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#060709] relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6] leading-tight">
            {t.headline1} <br />
            <span className="text-[#8E6F1D] dark:text-[#D4AF37]">{t.headline2}</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] font-mono-data mt-2">
            {t.subtitle}
          </p>
        </div>

        {/* 5 Pillars Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-14 font-mono-data">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.step}
              className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#0B0C11] border border-black/[0.08] dark:border-white/[0.07] flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
            >
              <div>
                <div className="text-[11px] text-[#8E6F1D] dark:text-[#D4AF37] font-bold mb-2">
                  [{pillar.step}]
                </div>
                <h3 className="font-editorial text-sm font-bold text-[#1C1917] dark:text-[#EFECE6] mb-1">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#57524A] dark:text-[#8E8A82] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Signature 04: Human-Assisted Consultation Pipeline Blueprint */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 shadow-2xl space-y-6">
          
          <div className="max-w-xl space-y-1">
            <span className="text-[10px] font-mono-data uppercase tracking-[0.24em] text-[#4848A8] dark:text-[#8B8BF5] font-bold">
              {t.pipelineTag}
            </span>
            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
              {t.pipelineHeading}
            </h3>
          </div>

          {/* Pipeline 5-Stage Flow */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono-data text-xs">
            
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] text-[#857E74] dark:text-[#6B6760]">
                <span>{lang === 'hi' ? 'चरण ०१' : 'STAGE 01'}</span>
                <span>YOU</span>
              </div>
              <div className="font-editorial text-sm font-semibold text-[#8E6F1D] dark:text-[#D4AF37]">
                {lang === 'hi' ? 'प्रश्न निर्माण' : 'Formulate & Ask'}
              </div>
              <p className="text-[11px] text-[#57524A] dark:text-[#8E8A82] leading-relaxed">
                {lang === 'hi' ? 'अपने निर्णय को एक स्पष्ट प्रश्न में व्यक्त करें।' : 'Articulate your decision into a focused inquiry.'}
              </p>
              <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-black/[0.05] dark:bg-white/[0.05] text-[#57524A] dark:text-[#A6A29A]">
                Human Intent
              </span>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] text-[#857E74] dark:text-[#6B6760]">
                <span>{lang === 'hi' ? 'चरण ०२' : 'STAGE 02'}</span>
                <span>ENGINE</span>
              </div>
              <div className="font-editorial text-sm font-semibold text-[#1C1917] dark:text-[#EFECE6]">
                {lang === 'hi' ? 'खगोल गणित' : 'Calculate Sky'}
              </div>
              <p className="text-[11px] text-[#57524A] dark:text-[#8E8A82] leading-relaxed">
                {lang === 'hi' ? 'निरयण ग्रह स्पष्ट एवं दशा चक्र का निर्माण।' : 'Sidereal coordinates & Dasha timeline computed.'}
              </p>
              <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-[#10b981]/20 text-[#0F6B43] dark:text-[#34d399] font-bold">
                Calculated Data
              </span>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] text-[#857E74] dark:text-[#6B6760]">
                <span>{lang === 'hi' ? 'चरण ०३' : 'STAGE 03'}</span>
                <span>ASSISTANT</span>
              </div>
              <div className="font-editorial text-sm font-semibold text-[#1C1917] dark:text-[#EFECE6]">
                {lang === 'hi' ? 'प्रमाण संकलन' : 'Organise Evidence'}
              </div>
              <p className="text-[11px] text-[#57524A] dark:text-[#8E8A82] leading-relaxed">
                {lang === 'hi' ? 'भाव दृष्टि एवं दशा अन्तर्दशा का समन्वय।' : 'Relevant Bhava relationships cross-referenced.'}
              </p>
              <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-[#8B8BF5]/20 text-[#4848A8] dark:text-[#8B8BF5] font-bold">
                AI Working Draft
              </span>
            </div>

            {/* Step 4 */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#10121a] border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                <span>{lang === 'hi' ? 'चरण ०४' : 'STAGE 04'}</span>
                <span>SCHOLAR</span>
              </div>
              <div className="font-editorial text-sm font-semibold text-[#8E6F1D] dark:text-[#D4AF37]">
                {lang === 'hi' ? 'विद्वत्-विवेचन' : 'Interpret & Write'}
              </div>
              <p className="text-[11px] text-[#1C1917] dark:text-[#EFECE6] leading-relaxed">
                {lang === 'hi' ? 'काशी के विद्वान् द्वारा व्यक्तिगत परामर्श पत्र लेखन।' : 'Vedic scholar applies discernment and writes counsel.'}
              </p>
              <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                Human Interpretation
              </span>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] text-[#857E74] dark:text-[#6B6760]">
                <span>{lang === 'hi' ? 'चरण ०५' : 'STAGE 05'}</span>
                <span>DELIVERY</span>
              </div>
              <div className="font-editorial text-sm font-semibold text-[#1C1917] dark:text-[#EFECE6]">
                {lang === 'hi' ? 'परामर्श पत्र प्राप्ति' : 'Receive & Keep'}
              </div>
              <p className="text-[11px] text-[#57524A] dark:text-[#8E8A82] leading-relaxed">
                {lang === 'hi' ? 'हस्ताक्षरित परामर्श पत्र आपके ईमेल पर सुरक्षित।' : 'Structured written report delivered to your inbox.'}
              </p>
              <span className="inline-block text-[9px] px-1.5 py-0.2 rounded bg-black/[0.05] dark:bg-white/[0.05] text-[#57524A] dark:text-[#A6A29A]">
                Preserved Folio
              </span>
            </div>

          </div>

          {/* CTA Banner inside Pipeline */}
          <div className="pt-5 border-t border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-data">
            <div className="text-left">
              <div className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">
                {t.readyHeading}
              </div>
              <div className="text-xs text-[#857E74] dark:text-[#6B6760]">
                {t.readySub}
              </div>
            </div>

            <button
              onClick={() => {
                chitiSensory.playTick();
                analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'PIPELINE_CTA' });
                onOpenConsultation();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#D4AF37] text-[#060709] font-bold text-xs uppercase tracking-wider hover:bg-[#E5C378] transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-md"
            >
              <span>{t.askCta}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}

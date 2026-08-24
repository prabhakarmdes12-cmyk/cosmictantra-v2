import React, { useState } from 'react';
import { Sun, Moon, Clock, Share2, AlertTriangle, CheckCircle2, ChevronRight, X, Flame } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function TodayAtAGlance({ panchangData, currentCity, onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const [showShareModal, setShowShareModal] = useState(false);
  const t = TRANSLATIONS[lang]?.panchang || TRANSLATIONS.en.panchang;

  const getUsefulGuidance = () => {
    const nak = panchangData.nakshatra.name;
    
    return [
      {
        title: t.guidance1Title,
        desc: `${nak} Nakshatra: ${t.guidance1Desc}`,
        type: 'auspicious'
      },
      {
        title: t.guidance2Title,
        desc: `${t.guidance2Desc} (${panchangData.timings.rahuKalam})`,
        type: 'caution'
      },
      {
        title: t.guidance3Title,
        desc: `${t.guidance3Desc} (${panchangData.timings.abhijitMuhurat})`,
        type: 'highlight'
      }
    ];
  };

  return (
    <section id="panchang-section" className="py-16 lg:py-24 border-b border-black/[0.1] dark:border-white/[0.08] bg-[#F8F5EE] dark:bg-[#07080F] transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="text-[11px] font-mono-data text-[#826315] dark:text-[#E5C378] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
              <Flame className="w-3.5 h-3.5 text-[#A6461D] dark:text-[#F0A554]" />
              <span>{t.tag}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#181512] dark:text-[#F5F2EB]">
              {t.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#4A443B] dark:text-[#C4BEB3] font-mono-data mt-1.5">
              {t.subheading} <span className="text-[#181512] dark:text-[#F5F2EB] font-bold">{currentCity.name}, {currentCity.state} ({currentCity.lat.toFixed(2)}°N, {currentCity.lng.toFixed(2)}°E)</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                chitiSensory.playTick();
                analytics.track('SHARE_CARD_OPENED');
                setShowShareModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-black/[0.12] dark:border-[#D4AF37]/35 bg-[#FFFFFF] dark:bg-[#0D0F1A] text-xs font-mono-data text-[#181512] dark:text-[#F5F2EB] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs font-bold"
            >
              <Share2 className="w-3.5 h-3.5 text-[#826315] dark:text-[#E5C378]" />
              <span>{t.shareBtn}</span>
            </button>

            <button
              onClick={() => {
                chitiSensory.playTick();
                analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'TODAY_SECTION' });
                onOpenConsultation();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#A6461D]/50 dark:border-[#C86D46]/50 bg-[#FFFFFF] dark:bg-[#120F18] text-xs font-mono-data text-[#A6461D] dark:text-[#F0A554] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs font-bold"
            >
              <span>{t.personalizeBtn}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Signature 01: Varanasi Stepped Ghat Diurnal Timeline */}
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.1] dark:border-[#D4AF37]/30 p-6 mb-10 overflow-x-auto shadow-xl transition-colors duration-250">
          <div className="text-[10px] font-mono-data uppercase tracking-widest text-[#696256] dark:text-[#8E887E] mb-4 flex items-center justify-between min-w-[720px] font-bold">
            <span className="text-[#826315] dark:text-[#E5C378]">{t.diurnalTitle} — {panchangData.city}</span>
            <span>{t.dashashwamedh}</span>
          </div>

          {/* Time Sequence Blocks */}
          <div className="grid grid-cols-5 gap-3 min-w-[720px]">
            
            {/* Sunrise */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#06070C] border border-[#A6461D]/30 dark:border-[#E2825B]/35">
              <div className="flex items-center gap-1 text-[11px] font-mono-data text-[#A6461D] dark:text-[#F0A554] font-bold">
                <Sun className="w-3.5 h-3.5" />
                <span>{t.sunriseTitle}</span>
              </div>
              <div className="text-lg font-bold font-mono-data text-[#181512] dark:text-[#F5F2EB] mt-1">
                {panchangData.sun.sunrise}
              </div>
              <div className="text-[10px] text-[#4A443B] dark:text-[#8E887E] font-mono-data mt-1 font-medium">{t.sunriseDesc}</div>
            </div>

            {/* Morning Choghadiya */}
            <div className="p-4 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.08]">
              <div className="text-[11px] font-mono-data text-[#3D3D99] dark:text-[#9E9EF8] font-bold">
                {t.morningTitle}
              </div>
              <div className="text-sm font-bold font-mono-data text-[#181512] dark:text-[#F5F2EB] mt-1">
                07:30 AM – 10:30 AM
              </div>
              <div className="text-[10px] text-[#4A443B] dark:text-[#8E887E] font-mono-data mt-1 font-medium">{t.morningDesc}</div>
            </div>

            {/* Rahu Kaal */}
            <div className="p-4 rounded-xl bg-[#FDE8EC] dark:bg-[#1C090D] border border-[#9E1B2C]/40 dark:border-[#ef4444]/50">
              <div className="flex items-center gap-1 text-[11px] font-mono-data text-[#821322] dark:text-[#fca5a5] font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t.rahuTitle}</span>
              </div>
              <div className="text-sm font-bold font-mono-data text-[#821322] dark:text-[#fca5a5] mt-1">
                {panchangData.timings.rahuKalam}
              </div>
              <div className="text-[10px] text-[#821322]/90 dark:text-[#fca5a5]/80 font-mono-data mt-1 font-medium">{t.rahuDesc}</div>
            </div>

            {/* Abhijit Muhurat */}
            <div className="p-4 rounded-xl bg-[#E3F5EC] dark:bg-[#081810] border border-[#0D5A37]/40 dark:border-[#10b981]/50">
              <div className="flex items-center gap-1 text-[11px] font-mono-data text-[#094A2D] dark:text-[#34d399] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.abhijitTitle}</span>
              </div>
              <div className="text-sm font-bold font-mono-data text-[#094A2D] dark:text-[#6ee7b7] mt-1">
                {panchangData.timings.abhijitMuhurat}
              </div>
              <div className="text-[10px] text-[#094A2D]/90 dark:text-[#34d399]/80 font-mono-data mt-1 font-medium">{t.abhijitDesc}</div>
            </div>

            {/* Sunset */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#06070C] border border-[#826315]/35 dark:border-[#D4AF37]/35">
              <div className="flex items-center gap-1 text-[11px] font-mono-data text-[#826315] dark:text-[#E5C378] font-bold">
                <Flame className="w-3.5 h-3.5 text-[#A6461D] dark:text-[#F0A554]" />
                <span>{t.sunsetTitle}</span>
              </div>
              <div className="text-lg font-bold font-mono-data text-[#181512] dark:text-[#F5F2EB] mt-1">
                {panchangData.sun.sunset}
              </div>
              <div className="text-[10px] text-[#4A443B] dark:text-[#8E887E] font-mono-data mt-1 font-medium">{t.sunsetDesc}</div>
            </div>

          </div>
        </div>

        {/* Tabular Characteristics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10 font-mono-data">
          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">Tithi (तिथि)</div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{panchangData.tithi.name}</div>
            <div className="text-[11px] text-[#826315] dark:text-[#E5C378] mt-0.5 font-bold">{panchangData.tithi.paksha}</div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">Nakshatra (नक्षत्र)</div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{panchangData.nakshatra.name}</div>
            <div className="text-[11px] text-[#3D3D99] dark:text-[#9E9EF8] mt-0.5 font-bold">Pada {panchangData.nakshatra.pada}</div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">Yoga (योग)</div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{panchangData.yoga.name}</div>
            <div className="text-[11px] text-[#A6461D] dark:text-[#E2825B] mt-0.5 font-bold">Yoga #{panchangData.yoga.number}</div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">Karana (करण)</div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{panchangData.karana.name}</div>
            <div className="text-[11px] text-[#4A443B] dark:text-[#C4BEB3] mt-0.5 font-medium">Half Lunar Arc</div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">Moon (चन्द्र कला)</div>
            <div className="font-bold text-xs text-[#181512] dark:text-[#F5F2EB] mt-1 truncate" title={panchangData.moon.phase}>{panchangData.moon.phase}</div>
            <div className="text-[11px] text-[#3D3D99] dark:text-[#9E9EF8] mt-0.5 font-bold">{panchangData.moon.illumination}% Illum.</div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">Yamaganda (यमगण्ड)</div>
            <div className="font-bold text-xs text-[#181512] dark:text-[#F5F2EB] mt-1">{panchangData.timings.yamaganda}</div>
            <div className="text-[10px] text-[#821322] dark:text-[#f87171] mt-0.5 font-bold">Secondary Caution</div>
          </div>
        </div>

        {/* Actionable Vedic Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getUsefulGuidance().map((item, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border shadow-xs ${
                item.type === 'caution'
                  ? 'border-[#9E1B2C]/40 dark:border-[#ef4444]/40'
                  : item.type === 'highlight'
                  ? 'border-[#0D5A37]/40 dark:border-[#10b981]/40'
                  : 'border-[#826315]/30 dark:border-[#D4AF37]/35'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 font-mono-data text-xs font-bold">
                {item.type === 'caution' && <AlertTriangle className="w-3.5 h-3.5 text-[#821322] dark:text-[#f87171]" />}
                {item.type === 'highlight' && <CheckCircle2 className="w-3.5 h-3.5 text-[#094A2D] dark:text-[#34d399]" />}
                {item.type === 'auspicious' && <Flame className="w-3.5 h-3.5 text-[#826315] dark:text-[#E5C378]" />}
                <h4 className="text-[#181512] dark:text-[#F5F2EB]">{item.title}</h4>
              </div>
              <p className="text-xs text-[#4A443B] dark:text-[#C4BEB3] leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-[#FFFFFF] dark:bg-[#080A12] border border-black/[0.12] dark:border-[#D4AF37]/40 p-6 shadow-2xl space-y-5 text-left font-mono-data">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#A6461D] dark:text-[#F0A554]" />
                <span className="font-editorial text-base font-bold text-[#181512] dark:text-[#F5F2EB]">CosmicTantra Kashi Daily Card</span>
              </div>
              <button 
                onClick={() => {
                  chitiSensory.playTick();
                  setShowShareModal(false);
                }}
                className="p-1 rounded text-[#696256] dark:text-[#8E887E] hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Card Output */}
            <div className="rounded-xl bg-[#FAF7F2] dark:bg-[#040508] border border-black/[0.1] dark:border-[#D4AF37]/35 p-5 space-y-3 text-center">
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#826315] dark:text-[#E5C378] font-bold">
                ॥ श्री काशी विश्वनाथ ॥
              </div>
              <div className="font-editorial text-2xl font-bold text-[#181512] dark:text-[#F5F2EB]">
                {panchangData.tithi.fullName}
              </div>
              <div className="text-xs text-[#3D3D99] dark:text-[#9E9EF8] font-bold">
                नक्षत्र: {panchangData.nakshatra.name} (Pada {panchangData.nakshatra.pada})
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-black/[0.08] dark:border-white/[0.08] text-left text-[#4A443B] dark:text-[#C4BEB3]">
                <div><span>स्थान (City):</span> <strong className="text-[#181512] dark:text-[#F5F2EB]">{panchangData.city}</strong></div>
                <div><span>सूर्योदय (Sunrise):</span> <strong className="text-[#A6461D] dark:text-[#F0A554]">{panchangData.sun.sunrise}</strong></div>
                <div><span>राहुकाल (Rahu Kaal):</span> <strong className="text-[#821322] dark:text-[#fca5a5]">{panchangData.timings.rahuKalam}</strong></div>
                <div><span>अभिजित (Abhijit):</span> <strong className="text-[#094A2D] dark:text-[#34d399]">{panchangData.timings.abhijitMuhurat}</strong></div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-[#696256] dark:text-[#8E887E] pt-1">
                <span>cosmictantra.com</span>
                <span>Chitra Paksha Sidereal Ephemeris</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  const shareText = `✨ CosmicTantra Kashi Panchang (${panchangData.city})\n• Tithi: ${panchangData.tithi.fullName}\n• Nakshatra: ${panchangData.nakshatra.name}\n• Rahu Kaal: ${panchangData.timings.rahuKalam}\n• Abhijit Muhurat: ${panchangData.timings.abhijitMuhurat}\n\nSee full Vedic ephemeris: https://cosmictantra.chiti.tech`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                  setShowShareModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>Share on WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  navigator.clipboard.writeText(
                    `✨ CosmicTantra Kashi Vedic Time (${panchangData.city})\n• Tithi: ${panchangData.tithi.fullName}\n• Nakshatra: ${panchangData.nakshatra.name}\n• Rahu Kaal: ${panchangData.timings.rahuKalam}\n• Abhijit: ${panchangData.timings.abhijitMuhurat}\nhttps://cosmictantra.chiti.tech`
                  );
                  alert('Vedic daily card copied to clipboard!');
                  setShowShareModal(false);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-bold text-xs uppercase hover:bg-[#965B18] dark:hover:bg-[#E5C378] transition-colors"
              >
                Copy Text
              </button>
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  setShowShareModal(false);
                }}
                className="px-4 py-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#101322] border border-black/[0.1] dark:border-white/[0.08] text-xs text-[#181512] dark:text-[#F5F2EB] font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

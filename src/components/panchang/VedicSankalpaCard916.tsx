'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Flame, 
  Compass, 
  Sun, 
  Moon, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Download,
  Scroll,
  Eye,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface VedicSankalpaCard916Props {
  panchangData: any;
  currentCity: { name: string; nameHi?: string; state?: string; lat: number; lng: number };
  onClose: () => void;
  lang?: string;
}

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toHindiDigits(str: string | number | undefined): string {
  if (!str) return '';
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

export default function VedicSankalpaCard916({
  panchangData,
  currentCity,
  onClose,
  lang = 'hi'
}: VedicSankalpaCard916Props) {
  const [activeTab, setActiveTab] = useState<'CARD' | 'SANKALPA_MANTRA'>('CARD');
  const [copied, setCopied] = useState(false);
  const isHi = lang === 'hi';

  const today = new Date();
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const dayNum = today.getDate();
  const dayOfWeek = today.getDay();
  const vikramSamvat = year + 57; // 2026 -> 2083
  const shakaSamvat = year - 78;  // 2026 -> 1948

  const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HINDI_DAYS = ['रविवार (भानुवासर)', 'सोमवार (इन्दुवासर)', 'मंगलवार (भौमवासर)', 'बुधवार (सौम्यवासर)', 'गुरुवार (बृहस्पतिवासर)', 'शुक्रवार (भृगुवासर)', 'शनिवार (स्थिरवासर)'];
  const SANSKRIT_VARA = ['भानुवासरे', 'इन्दुवासरे', 'भौमवासरे', 'सौम्यवासरे', 'बृहस्पतिवासरे', 'भृगुवासरे', 'स्थिरवासरे'];

  const LUNAR_MONTHS_HI = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];
  const LUNAR_MONTHS_SK = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];

  const tithiName = panchangData?.tithi?.nameHi || panchangData?.tithi?.name || 'पूर्णिमा';
  const tithiPaksha = panchangData?.tithi?.paksha === 'Shukla Paksha' || panchangData?.tithi?.paksha === 'Shukla' ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
  const tithiPakshaSk = panchangData?.tithi?.paksha === 'Shukla Paksha' || panchangData?.tithi?.paksha === 'Shukla' ? 'शुक्लपक्षे' : 'कृष्णपक्षे';
  const nakshatraName = panchangData?.nakshatra?.nameHi || panchangData?.nakshatra?.name || 'धनिष्ठा';
  const pada = panchangData?.nakshatra?.pada || 4;
  const yogaName = panchangData?.yoga?.nameHi || panchangData?.yoga?.name || 'शोभन';
  const karanaName = panchangData?.karana?.nameHi || panchangData?.karana?.name || 'बव';
  const moonSign = panchangData?.moon?.rashiName || 'कुम्भ';
  const sunSign = panchangData?.sun?.rashiName || 'सिंह';

  const sunrise = panchangData?.sun?.sunrise || '05:24 AM';
  const sunset = panchangData?.sun?.sunset || '06:42 PM';
  const rahuKalam = panchangData?.timings?.rahuKalam || '10:09 AM – 11:44 AM';
  const abhijitMuhurat = panchangData?.timings?.abhijitMuhurat || '11:19 AM – 12:09 PM';
  const brahmaMuhurta = panchangData?.timings?.brahmaMuhurta || '04:08 AM – 04:56 AM';
  const amritKalam = panchangData?.timings?.amritKalam || '08:20 AM – 09:55 AM';

  const sunSidLon = typeof panchangData?.sun?.siderealLongitude === 'number'
    ? panchangData.sun.siderealLongitude
    : parseFloat(panchangData?.sun?.siderealLongitude || '133');
  const derivedMasaIndex = (Math.floor(sunSidLon / 30) + 1) % 12;

  const ayana = (Math.floor(sunSidLon / 30) >= 9 || Math.floor(sunSidLon / 30) <= 2) ? 'उत्तरायण (Uttarayana)' : 'दक्षिणायन (Dakshinayana)';
  const ayanaSk = (Math.floor(sunSidLon / 30) >= 9 || Math.floor(sunSidLon / 30) <= 2) ? 'उत्तरायणे' : 'दक्षिणायने';
  const ritu = panchangData?.ritu?.nameHi || (derivedMasaIndex === 4 || derivedMasaIndex === 5 ? 'वर्षा ऋतु' : 'शरद् ऋतु');
  const rituSk = panchangData?.ritu?.nameSk || (derivedMasaIndex === 4 || derivedMasaIndex === 5 ? 'वर्षा ऋतौ' : 'शरद् ऋतौ');
  const currentLunarMasa = panchangData?.masa?.nameHi || panchangData?.masa?.hi || LUNAR_MONTHS_HI[derivedMasaIndex] || LUNAR_MONTHS_HI[5];
  const currentLunarMasaSk = panchangData?.masa?.nameSk || panchangData?.masa?.sk || LUNAR_MONTHS_SK[derivedMasaIndex] || LUNAR_MONTHS_SK[5];

  const cityName = currentCity.nameHi || currentCity.name || 'वाराणसी';
  const dateHeading = `${dayNum} ${LUNAR_MONTHS_HI[monthIdx]} ${year}`;

  // Canonical Sanskrit Sankalpa Mantra with exact live parameters
  const sankalpaMantraText = `ॐ विष्णुर्विष्णुर्विष्णुः श्रीमद्भगवतो महापुरुषस्य विष्णोराज्ञया प्रवर्तमानस्य अद्य श्रीब्रह्मणोऽह्नि द्वितीये परार्धे श्रीश्वेतवाराहकल्पे वैवस्वतमन्वन्तरै अष्टाविंशतितमे कलियुगे कलिप्रथमचरणे जम्बूद्वीपे भारतवर्षे भरतखण्डे आर्यावर्तैकदेशे ${cityName} क्षेत्रे...

• संवत्: श्रीविक्रम संवत् ${toHindiDigits(vikramSamvat)} (कालयुक्त नाम संवत्सरे)
• शक संवत्: ${toHindiDigits(shakaSamvat)}
• अयन: श्री${ayanaSk}
• ऋतु: ${rituSk}
• मास: ${currentLunarMasaSk} मासे (पूर्णिमान्त)
• पक्ष: ${tithiPakshaSk}
• तिथि: ${tithiName} तिथौ
• वार: ${SANSKRIT_VARA[dayOfWeek]}
• नक्षत्र: ${nakshatraName} नक्षत्रे (${toHindiDigits(pada)} चरणे)
• योग: ${yogaName} योगे
• करण: ${karanaName} करणे
• सूर्य स्थिति: ${sunSign} राशिस्थे सूर्ये
• चन्द्र स्थिति: ${moonSign} राशिस्थे चन्द्रे

...ममोपात्तदुरितक्षयद्वारा श्रीपरमेश्वर / श्रीकाशीविश्वनाथ प्रीत्यर्थं सर्वविध कार्यसिद्ध्यर्थं मङ्गल सङ्कल्पं नित्यपूजनं च अहम् करिष्ये।`;

  const handleShareWhatsApp = () => {
    chitiSensory.playTick();
    const shareMessage = `🪔 *CosmicTantra काशी दैनिक पञ्चाङ्ग व सङ्कल्प* 🪔
📍 स्थान: ${cityName} | 📅 ${dateHeading}
══════════════════════
✨ *तिथि*: ${tithiPaksha} ${tithiName}
⭐ *नक्षत्र*: ${nakshatraName} (पाद ${pada})
☀️ *वार*: ${HINDI_DAYS[dayOfWeek]}
🕉️ *संवत्*: वि.सं. ${vikramSamvat} • ${ayana} • ${ritu}
🌙 *मास*: ${currentLunarMasa} मास

⏰ *शुभ वेला (Auspicious)*:
• ब्रह्म मुहूर्त: ${brahmaMuhurta}
• अभिजित मुहूर्त: ${abhijitMuhurat}
• अमृत काल: ${amritKalam}
• सूर्योदय: ${sunrise} | सूर्यास्त: ${sunset}

⚠️ *वर्जित काल (Caution)*:
• राहुकाल: ${rahuKalam} (शुभ कार्य वर्जित)
• दिशा शूल: पश्चिम दिशा

📜 *दैनिक पञ्चाङ्ग श्लोक*:
"तिथिर्वारश्च नक्षत्रं योगः करणमेव च।
पञ्चाङ्गस्य फलं श्रुत्वा गङ्गास्नानफलं लभेत्॥"

🌐 सम्पूर्ण दृक् पञ्चाङ्ग व कुण्डली देखें:
https://cosmictantra.chiti.tech`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleCopyText = () => {
    chitiSensory.playTick();
    navigator.clipboard.writeText(sankalpaMantraText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto font-mono-data animate-in fade-in duration-200">
      
      {/* 9:16 Aspect Ratio Card Container (Max Width 420px, Ideal for Mobile & Status) */}
      <div className="relative w-full max-w-[420px] rounded-3xl bg-[#FAF7F2] dark:bg-[#07090F] border-2 border-[#8E6F1D]/50 dark:border-[#D4AF37]/60 shadow-[0_0_50px_rgba(212,175,55,0.2)] overflow-hidden text-[#1C1917] dark:text-[#FAF7F2] flex flex-col my-auto max-h-[96vh]">
        
        {/* Top Floating Close Button */}
        <button
          onClick={() => {
            chitiSensory.playTick();
            onClose();
          }}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-xs transition-colors cursor-pointer border border-white/10"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* View Switcher Tabs: 9:16 Story View vs Full Sankalpa Sanskrit */}
        <div className="p-3 border-b border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-between gap-2 pr-12">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968]">
            <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>9:16 वैदिक पञ्चाङ्ग व सङ्कल्प</span>
          </div>

          <div className="flex bg-black/10 dark:bg-white/10 p-0.5 rounded-xl text-[10.5px]">
            <button
              onClick={() => { chitiSensory.playTick(); setActiveTab('CARD'); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'CARD' ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black shadow-xs' : 'text-[#857E74]'
              }`}
            >
              9:16 कार्ड
            </button>
            <button
              onClick={() => { chitiSensory.playTick(); setActiveTab('SANKALPA_MANTRA'); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'SANKALPA_MANTRA' ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black shadow-xs' : 'text-[#857E74]'
              }`}
            >
              सङ्कल्प मन्त्र
            </button>
          </div>
        </div>

        {/* 9:16 CARD BODY (Scrollable inside if needed, but designed as complete vertical canvas) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin text-left">
          
          {activeTab === 'CARD' ? (
            <div className="space-y-3">
              
              {/* 1. Header Emblem & Invocation */}
              <div className="text-center space-y-1 pb-2 border-b border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 relative">
                <div className="text-[10px] tracking-[0.3em] font-bold text-[#8E6F1D] dark:text-[#E5C378] uppercase">
                  ॥ श्री काशी विश्वनाथो विजयतेतराम ॥
                </div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white tracking-wide">
                  {tithiPaksha} {tithiName}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                  <span>⭐ {nakshatraName} (पाद {toHindiDigits(pada)})</span>
                  <span>•</span>
                  <span>{HINDI_DAYS[dayOfWeek]}</span>
                </div>
              </div>

              {/* 2. Location & Primary Sun/Moon Axis */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-data">
                <div className="p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#857E74]">
                    <span className="flex items-center gap-1">📍 क्षेत्र / नगर</span>
                    <strong className="text-[#1C1917] dark:text-white font-bold">{cityName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Sun className="w-3.5 h-3.5" /> सूर्योदय
                    </span>
                    <strong className="text-[#1C1917] dark:text-white">{toHindiDigits(sunrise)}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#857E74]">
                    <span>चन्द्र स्थिति</span>
                    <strong className="text-[#8E6F1D] dark:text-[#F0C968] font-bold">{moonSign} राशि</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-rose-500 font-bold">
                      <Sun className="w-3.5 h-3.5" /> सूर्यास्त
                    </span>
                    <strong className="text-[#1C1917] dark:text-white">{toHindiDigits(sunset)}</strong>
                  </div>
                </div>
              </div>

              {/* 3. सङ्कल्प काल गणना (Vedic Sankalpa Epoch & Samvat) */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#8E6F1D]/10 to-transparent dark:from-[#D4AF37]/15 dark:to-transparent border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-[#8E6F1D] dark:text-[#F0C968] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Scroll className="w-3 h-3" />
                    <span>सङ्कल्प काल गणना (Epoch)</span>
                  </span>
                  <span>वि.सं. {toHindiDigits(vikramSamvat)}</span>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#443E35] dark:text-[#D1C9BF]">
                  <div>• संवत्: <strong>विक्रम संवत् {toHindiDigits(vikramSamvat)}</strong></div>
                  <div>• शक संवत्: <strong>{toHindiDigits(shakaSamvat)}</strong></div>
                  <div>• अयन: <strong>{ayana}</strong></div>
                  <div>• ऋतु: <strong>{ritu}</strong></div>
                  <div>• मास: <strong>{currentLunarMasa} मास (पूर्णिमान्त)</strong></div>
                  <div>• कल्प: <strong>श्रीश्वेतवाराहकल्पे</strong></div>
                </div>
              </div>

              {/* 4. पञ्च-अङ्ग सूक्ष्म विवरण (5 Limbs Grid) */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-mono-data">
                <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                  <span className="text-[9px] text-[#857E74] block">योग</span>
                  <strong className="text-[11px] text-[#1C1917] dark:text-white font-bold">{yogaName}</strong>
                </div>
                <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                  <span className="text-[9px] text-[#857E74] block">करण</span>
                  <strong className="text-[11px] text-[#1C1917] dark:text-white font-bold">{karanaName}</strong>
                </div>
                <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5">
                  <span className="text-[9px] text-[#857E74] block">सूर्य राशि</span>
                  <strong className="text-[11px] text-[#1C1917] dark:text-white font-bold">{sunSign}</strong>
                </div>
              </div>

              {/* 5. Auspicious vs Inauspicious Timing Windows */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-data">
                
                {/* Auspicious Windows */}
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>शुभ वेला (Auspicious)</span>
                  </div>
                  <div className="text-[10.5px] text-[#334155] dark:text-[#CBD5E1] space-y-0.5">
                    <div>अभिजित: <strong>{toHindiDigits(abhijitMuhurat)}</strong></div>
                    <div>ब्रह्म मुहूर्त: <strong>{toHindiDigits(brahmaMuhurta)}</strong></div>
                    <div>अमृत काल: <strong>{toHindiDigits(amritKalam)}</strong></div>
                  </div>
                </div>

                {/* Caution Windows */}
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                  <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>वर्जित काल (Caution)</span>
                  </div>
                  <div className="text-[10.5px] text-[#334155] dark:text-[#CBD5E1] space-y-0.5">
                    <div>राहुकाल: <strong className="text-rose-600 dark:text-rose-300">{toHindiDigits(rahuKalam)}</strong></div>
                    <div>दिशा शूल: <strong>पश्चिम दिशा</strong></div>
                    <div className="text-[9.5px] text-rose-600 dark:text-rose-400">(शुभ कार्य वर्जित)</div>
                  </div>
                </div>

              </div>

              {/* 6. Daily Shloka Fruit (पञ्चाङ्ग श्रवण फल) */}
              <div className="p-2.5 rounded-2xl bg-black/[0.02] dark:bg-black/40 border border-black/5 dark:border-white/5 text-center">
                <p className="font-editorial text-xs sm:text-sm text-[#8E6F1D] dark:text-[#F0C968] italic leading-relaxed">
                  "तिथिर्वारश्च नक्षत्रं योगः करणमेव च।\nपञ्चाङ्गस्य फलं श्रुत्वा गङ्गास्नानफलं लभेत्॥"
                </p>
                <span className="text-[9.5px] text-[#857E74] block mt-1">
                  पञ्चाङ्ग श्रवण से गङ्गा स्नान के समान पुण्य फल की प्राप्ति होती है।
                </span>
              </div>

              {/* Footer Stamp */}
              <div className="flex items-center justify-between text-[9px] text-[#857E74] pt-1 border-t border-black/5 dark:border-white/5">
                <span>cosmictantra.com</span>
                <span>चित्रा पक्षीय निरयण पञ्चाङ्ग • Lahiri 24° 16'</span>
              </div>

            </div>
          ) : (
            /* SANKALPA SANSKRIT MANTRA VIEW */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                  <Scroll className="w-4 h-4" />
                  <span>दैनिक वैदिक सङ्कल्प पाठ (Pooja Sankalpa)</span>
                </div>
                <p className="text-[10.5px] text-[#857E74] leading-relaxed">
                  प्रातः पूजन, तर्पण अथवा अनुष्ठान के समय हाथ में जल, अक्षत व पुष्प लेकर इस सङ्कल्प का उच्चारण करें:
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-black/50 border border-black/10 dark:border-white/10 text-xs font-editorial leading-relaxed text-[#1C1917] dark:text-[#FAF7F2] whitespace-pre-line shadow-inner">
                {sankalpaMantraText}
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-[#857E74]">
                ✦ <strong>सङ्कल्प विधि:</strong> दाहिने हाथ में जल, सुपारी, सिक्का, अक्षत व पुष्प लेकर उत्तर या पूर्व दिशा की ओर मुख करके सङ्कल्प पढ़ें और जल भगवान के चरणों में या ताम्रपात्र में छोड़ें।
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM ACTION BAR (Share, Copy, Close) */}
        <div className="p-3.5 border-t border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center gap-2">
          
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98"
          >
            <Share2 className="w-4 h-4" />
            <span>व्हाट्सएप पर शेयर करें (WhatsApp Status)</span>
          </button>

          <button
            onClick={handleCopyText}
            className="py-3 px-4 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] hover:opacity-90 text-white dark:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-98 shrink-0"
            title="Copy Sankalpa"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'कॉपी हुआ ✓' : 'सङ्कल्प कॉपी'}</span>
          </button>

        </div>

      </div>

    </div>
  );
}

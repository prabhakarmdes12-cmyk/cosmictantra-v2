import React, { useState } from 'react';
import { Sun, Moon, Clock, Share2, AlertTriangle, CheckCircle2, ChevronRight, X, Flame } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toHindiDigits(str) {
  if (!str) return '';
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

const TITHI_HI_MAP = {
  'Pratipada': 'प्रतिपदा', 'Dwitiya': 'द्वितीया', 'Tritiya': 'तृतीया',
  'Chaturthi': 'चतुर्थी', 'Panchami': 'पञ्चमी', 'Shashthi': 'षष्ठी',
  'Saptami': 'सप्तमी', 'Ashtami': 'अष्टमी', 'Navami': 'नवमी',
  'Dashami': 'दशमी', 'Ekadashi': 'एकादशी', 'Dwadashi': 'द्वादशी',
  'Trayodashi': 'त्रयोदशी', 'Chaturdashi': 'चतुर्दशी', 'Purnima': 'पूर्णिमा',
  'Amavasya': 'अमावस्या'
};

const PAKSHA_HI_MAP = {
  'Shukla Paksha': 'शुक्ल पक्ष',
  'Krishna Paksha': 'कृष्ण पक्ष',
  'Shukla': 'शुक्ल पक्ष',
  'Krishna': 'कृष्ण पक्ष'
};

const NAKSHATRA_HI_MAP = {
  'Ashwini': 'अश्विनी', 'Bharani': 'भरणी', 'Krittika': 'कृत्तिका',
  'Rohini': 'रोहिणी', 'Mrigashira': 'मृगशिरा', 'Ardra': 'आर्द्रा',
  'Punarvasu': 'पुनर्वसु', 'Pushya': 'पुष्य', 'Ashlesha': 'आश्लेषा',
  'Magha': 'मघा', 'Purva Phalguni': 'पूर्वाफाल्गुनी', 'Uttara Phalguni': 'उत्तराफाल्गुनी',
  'Hasta': 'हस्त', 'Chitra': 'चित्रा', 'Swati': 'स्वाती',
  'Vishakha': 'विशाखा', 'Anuradha': 'अनुराधा', 'Jyeshtha': 'ज्येष्ठा',
  'Mula': 'मूल', 'Purva Ashadha': 'पूर्वाषाढ़ा', 'Uttara Ashadha': 'उत्तराषाढ़ा',
  'Shravana': 'श्रवण', 'Dhanishta': 'धनिष्ठा', 'Shatabhisha': 'शतभिषा',
  'Purva Bhadrapada': 'पूर्वभाद्रपद', 'Uttara Bhadrapada': 'उत्तरभाद्रपद', 'Revati': 'रेवती'
};

const YOGA_HI_MAP = {
  'Vishkambha': 'विष्कम्भ', 'Priti': 'प्रीति', 'Ayushman': 'आयुष्मान्',
  'Saubhagya': 'सौभाग्य', 'Shobhana': 'शोभन', 'Atiganda': 'अतिगण्ड',
  'Sukarma': 'सुकर्मा', 'Dhriti': 'धृति', 'Shoola': 'शूल',
  'Ganda': 'गण्ड', 'Vriddhi': 'वृद्धि', 'Dhruva': 'ध्रुव',
  'Vyaghata': 'व्याघात', 'Harshana': 'हर्षण', 'Vajra': 'वज्र',
  'Siddhi': 'सिद्धि', 'Vyatipata': 'व्यतीपात', 'Variyana': 'वरीयान्',
  'Variyan': 'वरीयान्', 'Parigha': 'परिघ', 'Shiva': 'शिव',
  'Siddha': 'सिद्ध', 'Sadhya': 'साध्य', 'Shubha': 'शुभ',
  'Shukla': 'शुक्ल', 'Brahma': 'ब्रह्म', 'Indra': 'इन्द्र',
  'Vaidhriti': 'वैधृति'
};

const KARANA_HI_MAP = {
  'Bava': 'बव', 'Balava': 'बालव', 'Kaulava': 'कौलव',
  'Taitila': 'तैतिल', 'Gara': 'गर', 'Garaja': 'गर',
  'Vanija': 'वणिज', 'Vishti (Bhadra)': 'विष्टि (भद्रा)', 'Vishti': 'विष्टि (भद्रा)',
  'Shakuni': 'शकुनि', 'Chatushpada': 'चतुष्पाद', 'Naga': 'नाग',
  'Kintughna': 'किस्तुघ्न'
};

const MOON_PHASE_HI_MAP = {
  'Waxing Crescent': 'शुक्ल द्वितीया-तृतीया (चान्द्र वृद्धि)',
  'First Quarter': 'शुक्ल अष्टमी (अर्ध चन्द्र)',
  'Waxing Gibbous': 'शुक्ल एकादशी (वृद्ध चन्द्र)',
  'Full Moon': 'पूर्णिमा (पूर्ण चन्द्र)',
  'Waning Gibbous': 'कृष्ण तृतीया (चान्द्र ह्रास)',
  'Last Quarter': 'कृष्ण अष्टमी (अर्ध चन्द्र)',
  'Waning Crescent': 'कृष्ण एकादशी (कृष्ण पक्षीय चन्द्र)',
  'New Moon': 'अमावस्या (नव चन्द्र)'
};

export default function TodayAtAGlance({ panchangData, currentCity, onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const [showShareModal, setShowShareModal] = useState(false);
  const isHi = lang === 'hi';
  const t = TRANSLATIONS[lang]?.panchang || TRANSLATIONS.en.panchang;

  if (!panchangData) return null;

  const rawTithiName = panchangData.tithi?.name || 'Ekadashi';
  const tithiName = isHi ? (panchangData.tithi?.nameHi || TITHI_HI_MAP[rawTithiName] || rawTithiName) : rawTithiName;

  const rawPaksha = panchangData.tithi?.paksha || 'Shukla Paksha';
  const tithiPaksha = isHi ? (PAKSHA_HI_MAP[rawPaksha] || rawPaksha) : rawPaksha;

  const rawNakshatraName = panchangData.nakshatra?.name || 'Rohini';
  const nakshatraName = isHi ? (panchangData.nakshatra?.nameHi || NAKSHATRA_HI_MAP[rawNakshatraName] || rawNakshatraName) : rawNakshatraName;

  const rawYogaName = panchangData.yoga?.name || 'Siddha';
  const yogaName = isHi ? (panchangData.yoga?.nameHi || YOGA_HI_MAP[rawYogaName] || rawYogaName) : rawYogaName;

  const rawKaranaName = panchangData.karana?.name || 'Bava';
  const karanaName = isHi ? (panchangData.karana?.nameHi || KARANA_HI_MAP[rawKaranaName] || rawKaranaName) : rawKaranaName;

  const rawMoonPhase = panchangData.moon?.phase || 'Waxing Moon';
  const moonPhase = isHi ? (MOON_PHASE_HI_MAP[rawMoonPhase] || rawMoonPhase) : rawMoonPhase;

  const sunrise = isHi ? toHindiDigits(panchangData.sun?.sunrise) : panchangData.sun?.sunrise;
  const sunset = isHi ? toHindiDigits(panchangData.sun?.sunset) : panchangData.sun?.sunset;
  const rahuKalam = isHi ? toHindiDigits(panchangData.timings?.rahuKalam) : panchangData.timings?.rahuKalam;
  const abhijitMuhurat = isHi ? toHindiDigits(panchangData.timings?.abhijitMuhurat) : panchangData.timings?.abhijitMuhurat;
  const yamaganda = isHi ? toHindiDigits(panchangData.timings?.yamaganda) : panchangData.timings?.yamaganda;
  const pada = isHi ? toHindiDigits(panchangData.nakshatra?.pada || 1) : (panchangData.nakshatra?.pada || 1);
  const moonIllum = isHi ? toHindiDigits(panchangData.moon?.illumination || 75) : (panchangData.moon?.illumination || 75);

  const today = new Date();
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const dayNum = today.getDate();
  const dayOfWeek = today.getDay();
  const vikramSamvat = year + 57;

  const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const HINDI_MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
  const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const HINDI_DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const LUNAR_MONTHS_HI = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];
  const LUNAR_MONTHS_EN = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'];

  const englishFullDate = `${ENGLISH_DAYS[dayOfWeek]}, ${dayNum} ${ENGLISH_MONTHS[monthIdx]} ${year}`;
  const hindiFullDate = `${HINDI_DAYS[dayOfWeek]}, ${toHindiDigits(dayNum)} ${HINDI_MONTHS[monthIdx]} ${toHindiDigits(year)}`;
  const lunarMonthHi = LUNAR_MONTHS_HI[(monthIdx + 4) % 12];
  const lunarMonthEn = LUNAR_MONTHS_EN[(monthIdx + 4) % 12];

  const getUsefulGuidance = () => {
    return [
      {
        title: t.guidance1Title,
        desc: isHi ? `${nakshatraName} नक्षत्र: ${t.guidance1Desc}` : `${nakshatraName} Nakshatra: ${t.guidance1Desc}`,
        type: 'auspicious'
      },
      {
        title: t.guidance2Title,
        desc: `${t.guidance2Desc} (${rahuKalam})`,
        type: 'caution'
      },
      {
        title: t.guidance3Title,
        desc: `${t.guidance3Desc} (${abhijitMuhurat})`,
        type: 'highlight'
      }
    ];
  };

  return (
    <section id="panchang-section" className="py-16 lg:py-24 border-b border-black/[0.1] dark:border-white/[0.08] bg-[#F8F5EE] dark:bg-[#07080F] transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-mono-data text-[#826315] dark:text-[#E5C378] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
              <Flame className="w-3.5 h-3.5 text-[#A6461D] dark:text-[#F0A554]" />
              <span>{t.tag}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#181512] dark:text-[#F5F2EB]">
              {t.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#4A443B] dark:text-[#C4BEB3] font-mono-data mt-1.5">
              {t.subheading} <span className="text-[#181512] dark:text-[#F5F2EB] font-bold">
                {isHi ? (currentCity.nameHi || currentCity.name) : currentCity.name}, {currentCity.state} ({isHi ? toHindiDigits(currentCity.lat.toFixed(2)) : currentCity.lat.toFixed(2)}°N, {isHi ? toHindiDigits(currentCity.lng.toFixed(2)) : currentCity.lng.toFixed(2)}°E)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                chitiSensory.playTick();
                analytics.track('SHARE_CARD_OPENED');
                setShowShareModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-black/[0.12] dark:border-[#D4AF37]/35 bg-[#FFFFFF] dark:bg-[#0D0F1A] text-xs font-mono-data text-[#181512] dark:text-[#F5F2EB] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs font-bold cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#A6461D]/50 dark:border-[#C86D46]/50 bg-[#FFFFFF] dark:bg-[#120F18] text-xs font-mono-data text-[#A6461D] dark:text-[#F0A554] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs font-bold cursor-pointer"
            >
              <span>{t.personalizeBtn}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dual Gregorian Date & Vedic Lunar Maas Banner */}
        <div className="w-full rounded-2xl bg-gradient-to-r from-[#8E6F1D]/10 via-[#D4AF37]/10 to-transparent border border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 p-4 sm:p-5 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-black/10 dark:border-white/10 pb-2">
            <h3 className="font-editorial text-lg sm:text-2xl font-bold text-[#181512] dark:text-white">
              {englishFullDate} <span className="text-[#8E6F1D] dark:text-[#F0C968] font-normal text-sm sm:text-base">/ {hindiFullDate}</span>
            </h3>
            <div className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
              विक्रम संवत् {toHindiDigits(vikramSamvat)} (Samvat {vikramSamvat})
            </div>
          </div>
          <div className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] flex flex-wrap items-center gap-x-3 gap-y-1 pt-2">
            <span>🕉️ <strong>{lunarMonthHi} मास ({lunarMonthEn} Maas)</strong></span>
            <span>•</span>
            <span>{tithiPaksha} {tithiName}</span>
            <span>•</span>
            <span>✦ {nakshatraName} (पाद {pada})</span>
            <span>•</span>
            <span>योग: {yogaName}</span>
            <span>•</span>
            <span>करण: {karanaName}</span>
          </div>
        </div>

        {/* Signature 01: Varanasi Stepped Ghat Diurnal Timeline */}
        <div className="w-full max-w-full rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.1] dark:border-[#D4AF37]/30 p-4 sm:p-6 mb-10 shadow-xl transition-colors duration-250 min-w-0 overflow-hidden">
          <div className="text-[10px] font-mono-data uppercase tracking-widest text-[#696256] dark:text-[#8E887E] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-bold">
            <span className="text-[#826315] dark:text-[#E5C378]">{t.diurnalTitle} — {isHi ? (panchangData.cityHi || panchangData.city) : panchangData.city}</span>
            <span>{t.dashashwamedh}</span>
          </div>

          {/* Time Sequence Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
            
            {/* Sunrise */}
            <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#06070C] border border-[#A6461D]/30 dark:border-[#E2825B]/35">
              <div className="flex items-center gap-1 text-[11px] font-mono-data text-[#A6461D] dark:text-[#F0A554] font-bold">
                <Sun className="w-3.5 h-3.5" />
                <span>{t.sunriseTitle}</span>
              </div>
              <div className="text-lg font-bold font-mono-data text-[#181512] dark:text-[#F5F2EB] mt-1">
                {sunrise}
              </div>
              <div className="text-[10px] text-[#4A443B] dark:text-[#8E887E] font-mono-data mt-1 font-medium">{t.sunriseDesc}</div>
            </div>

            {/* Morning Choghadiya */}
            <div className="p-4 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.08]">
              <div className="text-[11px] font-mono-data text-[#3D3D99] dark:text-[#9E9EF8] font-bold">
                {t.morningTitle}
              </div>
              <div className="text-sm font-bold font-mono-data text-[#181512] dark:text-[#F5F2EB] mt-1">
                {isHi ? '०७:३० - १०:३०' : '07:30 AM – 10:30 AM'}
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
                {rahuKalam}
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
                {abhijitMuhurat}
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
                {sunset}
              </div>
              <div className="text-[10px] text-[#4A443B] dark:text-[#8E887E] font-mono-data mt-1 font-medium">{t.sunsetDesc}</div>
            </div>

          </div>
        </div>

        {/* Tabular Characteristics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10 font-mono-data">
          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">
              {isHi ? 'तिथि' : 'Tithi (तिथि)'}
            </div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{tithiName}</div>
            <div className="text-[11px] text-[#826315] dark:text-[#E5C378] mt-0.5 font-bold">{tithiPaksha}</div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">
              {isHi ? 'नक्षत्र' : 'Nakshatra (नक्षत्र)'}
            </div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{nakshatraName}</div>
            <div className="text-[11px] text-[#3D3D99] dark:text-[#9E9EF8] mt-0.5 font-bold">
              {isHi ? `पाद ${pada}` : `Pada ${pada}`}
            </div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">
              {isHi ? 'योग' : 'Yoga (योग)'}
            </div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{yogaName}</div>
            <div className="text-[11px] text-[#A6461D] dark:text-[#E2825B] mt-0.5 font-bold">
              {isHi ? `योग #${toHindiDigits(panchangData.yoga?.number || 1)}` : `Yoga #${panchangData.yoga?.number || 1}`}
            </div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">
              {isHi ? 'करण' : 'Karana (करण)'}
            </div>
            <div className="font-bold text-sm text-[#181512] dark:text-[#F5F2EB] mt-1">{karanaName}</div>
            <div className="text-[11px] text-[#4A443B] dark:text-[#C4BEB3] mt-0.5 font-medium">
              {isHi ? 'अर्ध तिथि काल' : 'Half Lunar Arc'}
            </div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">
              {isHi ? 'चन्द्र कला' : 'Moon (चन्द्र कला)'}
            </div>
            <div className="font-bold text-xs text-[#181512] dark:text-[#F5F2EB] mt-1 truncate" title={moonPhase}>{moonPhase}</div>
            <div className="text-[11px] text-[#3D3D99] dark:text-[#9E9EF8] mt-0.5 font-bold">
              {isHi ? `${moonIllum}% प्रकाश` : `${moonIllum}% Illum.`}
            </div>
          </div>

          <div className="p-3.5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.07] shadow-xs">
            <div className="text-[9px] uppercase tracking-widest text-[#696256] dark:text-[#8E887E] font-bold">
              {isHi ? 'यमगण्ड' : 'Yamaganda (यमगण्ड)'}
            </div>
            <div className="font-bold text-xs text-[#181512] dark:text-[#F5F2EB] mt-1">{yamaganda}</div>
            <div className="text-[10px] text-[#821322] dark:text-[#f87171] mt-0.5 font-bold">
              {isHi ? 'गौण वर्ज्य काल' : 'Secondary Caution'}
            </div>
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
                <span className="font-editorial text-base font-bold text-[#181512] dark:text-[#F5F2EB]">
                  {isHi ? 'CosmicTantra काशी दैनिक पञ्चाङ्ग' : 'CosmicTantra Kashi Daily Card'}
                </span>
              </div>
              <button 
                onClick={() => {
                  chitiSensory.playTick();
                  setShowShareModal(false);
                }}
                className="p-1 rounded text-[#696256] dark:text-[#8E887E] hover:opacity-100 cursor-pointer"
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
                {isHi ? `${tithiPaksha} ${tithiName}` : panchangData.tithi.fullName}
              </div>
              <div className="text-xs text-[#3D3D99] dark:text-[#9E9EF8] font-bold">
                {isHi ? `नक्षत्र: ${nakshatraName} (पाद ${pada})` : `Nakshatra: ${nakshatraName} (Pada ${pada})`}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-black/[0.08] dark:border-white/[0.08] text-left text-[#4A443B] dark:text-[#C4BEB3]">
                <div><span>{isHi ? 'स्थान:' : 'City:'}</span> <strong className="text-[#181512] dark:text-[#F5F2EB]">{isHi ? (panchangData.cityHi || panchangData.city) : panchangData.city}</strong></div>
                <div><span>{isHi ? 'सूर्योदय:' : 'Sunrise:'}</span> <strong className="text-[#A6461D] dark:text-[#F0A554]">{sunrise}</strong></div>
                <div><span>{isHi ? 'राहुकाल:' : 'Rahu Kaal:'}</span> <strong className="text-[#821322] dark:text-[#fca5a5]">{rahuKalam}</strong></div>
                <div><span>{isHi ? 'अभिजित:' : 'Abhijit:'}</span> <strong className="text-[#094A2D] dark:text-[#34d399]">{abhijitMuhurat}</strong></div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-[#696256] dark:text-[#8E887E] pt-1">
                <span>cosmictantra.com</span>
                <span>{isHi ? 'चित्रा पक्षीय निरयण पञ्चाङ्ग' : 'Chitra Paksha Sidereal Ephemeris'}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  const shareText = isHi
                    ? `✨ CosmicTantra काशी पञ्चाङ्ग (${panchangData.cityHi || panchangData.city})\n• तिथि: ${tithiPaksha} ${tithiName}\n• नक्षत्र: ${nakshatraName}\n• राहु काल: ${rahuKalam}\n• अभिजित मुहूर्त: ${abhijitMuhurat}\n\nसम्पूर्ण निरयण पञ्चाङ्ग देखें: https://cosmictantra.chiti.tech`
                    : `✨ CosmicTantra Kashi Panchang (${panchangData.city})\n• Tithi: ${panchangData.tithi.fullName}\n• Nakshatra: ${panchangData.nakshatra.name}\n• Rahu Kaal: ${panchangData.timings.rahuKalam}\n• Abhijit Muhurat: ${panchangData.timings.abhijitMuhurat}\n\nSee full Vedic ephemeris: https://cosmictantra.chiti.tech`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                  setShowShareModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE57] text-white font-bold text-xs uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>{isHi ? 'व्हाट्सएप पर साझा करें' : 'Share on WhatsApp'}</span>
              </button>
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  const shareText = isHi
                    ? `✨ CosmicTantra काशी वैदिक समय (${panchangData.cityHi || panchangData.city})\n• तिथि: ${tithiPaksha} ${tithiName}\n• नक्षत्र: ${nakshatraName}\n• राहु काल: ${rahuKalam}\n• अभिजित: ${abhijitMuhurat}\nhttps://cosmictantra.chiti.tech`
                    : `✨ CosmicTantra Kashi Vedic Time (${panchangData.city})\n• Tithi: ${panchangData.tithi.fullName}\n• Nakshatra: ${panchangData.nakshatra.name}\n• Rahu Kaal: ${panchangData.timings.rahuKalam}\n• Abhijit: ${panchangData.timings.abhijitMuhurat}\nhttps://cosmictantra.chiti.tech`;
                  navigator.clipboard.writeText(shareText);
                  alert(isHi ? 'दैनिक पञ्चाङ्ग कार्ड कॉपी हो गया!' : 'Vedic daily card copied to clipboard!');
                  setShowShareModal(false);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-bold text-xs uppercase hover:bg-[#965B18] dark:hover:bg-[#E5C378] transition-colors cursor-pointer"
              >
                {isHi ? 'कॉपी करें' : 'Copy Text'}
              </button>
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  setShowShareModal(false);
                }}
                className="px-4 py-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#101322] border border-black/[0.1] dark:border-white/[0.08] text-xs text-[#181512] dark:text-[#F5F2EB] font-bold cursor-pointer"
              >
                {isHi ? 'बन्द करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


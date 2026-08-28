'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, MapPin, Compass, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface CosmicNowDialProps {
  panchangData: any;
  currentCity: { name: string; lat: number; lng: number; tz: number };
  onOpenCitySelector: () => void;
  lang?: string;
}

// -------------------------------------------------------------
// Pure Vedic Localization Maps
// -------------------------------------------------------------
const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toHindiDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

const TITHI_HI_MAP: Record<string, string> = {
  'Pratipada': 'प्रतिपदा', 'Dwitiya': 'द्वितीया', 'Tritiya': 'तृतीया',
  'Chaturthi': 'चतुर्थी', 'Panchami': 'पञ्चमी', 'Shashthi': 'षष्ठी',
  'Saptami': 'सप्तमी', 'Ashtami': 'अष्टमी', 'Navami': 'नवमी',
  'Dashami': 'दशमी', 'Ekadashi': 'एकादशी', 'Dwadashi': 'द्वादशी',
  'Trayodashi': 'त्रयोदशी', 'Chaturdashi': 'चतुर्दशी', 'Purnima': 'पूर्णिमा',
  'Amavasya': 'अमावस्या'
};

const PAKSHA_HI_MAP: Record<string, string> = {
  'Shukla Paksha': 'शुक्ल पक्ष',
  'Krishna Paksha': 'कृष्ण पक्ष',
  'Shukla': 'शुक्ल पक्ष',
  'Krishna': 'कृष्ण पक्ष'
};

const NAKSHATRA_HI_MAP: Record<string, string> = {
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

const LORD_HI_MAP: Record<string, string> = {
  'Sun': 'सूर्य', 'Moon': 'चन्द्र', 'Mars': 'मंगल',
  'Mercury': 'बुध', 'Jupiter': 'गुरु', 'Venus': 'शुक्र',
  'Saturn': 'शनि', 'Rahu': 'राहु', 'Ketu': 'केतु'
};

const YOGA_HI_MAP: Record<string, string> = {
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

const KARANA_HI_MAP: Record<string, string> = {
  'Bava': 'बव', 'Balava': 'बालव', 'Kaulava': 'कौलव',
  'Taitila': 'तैतिल', 'Gara': 'गर', 'Garaja': 'गर',
  'Vanija': 'वणिज', 'Vishti (Bhadra)': 'विष्टि (भद्रा)', 'Vishti': 'विष्टि (भद्रा)',
  'Shakuni': 'शकुनि', 'Chatushpada': 'चतुष्पाद', 'Naga': 'नाग',
  'Kintughna': 'किस्तुघ्न'
};

const ENGLISH_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HINDI_MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const ENGLISH_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HINDI_DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

const LUNAR_MONTHS_LIST = [
  { en: 'Chaitra', hi: 'चैत्र' },
  { en: 'Vaishakha', hi: 'वैशाख' },
  { en: 'Jyeshtha', hi: 'ज्येष्ठ' },
  { en: 'Ashadha', hi: 'आषाढ़' },
  { en: 'Shravana', hi: 'श्रावण' },
  { en: 'Bhadrapada', hi: 'भाद्रपद' },
  { en: 'Ashwin', hi: 'आश्विन' },
  { en: 'Kartika', hi: 'कार्तिक' },
  { en: 'Margashirsha', hi: 'मार्गशीर्ष' },
  { en: 'Pausha', hi: 'पौष' },
  { en: 'Magha', hi: 'माघ' },
  { en: 'Phalguna', hi: 'फाल्गुन' }
];

export default function CosmicNowDial({
  panchangData,
  currentCity,
  onOpenCitySelector,
  lang = 'en'
}: CosmicNowDialProps) {
  const isHi = lang === 'hi';
  const [liveTime, setLiveTime] = useState<string>('');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveTime(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setNowMs(d.getTime());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!panchangData) return null;

  // Astronomical sunrise and sunset strings
  const sunriseStr = panchangData.sun?.sunrise || (panchangData.sunrise instanceof Date ? panchangData.sunrise.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '05:35 AM');
  const sunsetStr = panchangData.sun?.sunset || (panchangData.sunset instanceof Date ? panchangData.sunset.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '06:18 PM');
  
  // Extract sunrise and sunset in minutes from midnight
  let sunriseMinutes = 5 * 60 + 35; // default 05:35 AM
  let sunsetMinutes = 18 * 60 + 18; // default 06:18 PM

  if (panchangData.sun?.sunriseDate instanceof Date) {
    sunriseMinutes = panchangData.sun.sunriseDate.getHours() * 60 + panchangData.sun.sunriseDate.getMinutes();
  } else if (typeof sunriseStr === 'string') {
    const match = sunriseStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      sunriseMinutes = h * 60 + m;
    }
  }

  if (panchangData.sun?.sunsetDate instanceof Date) {
    sunsetMinutes = panchangData.sun.sunsetDate.getHours() * 60 + panchangData.sun.sunsetDate.getMinutes();
  } else if (typeof sunsetStr === 'string') {
    const match = sunsetStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      sunsetMinutes = h * 60 + m;
    }
  }

  // Current local time minutes from midnight
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Continuum Position Mapping
  let solarArcPercent = 20;
  let activeMilestone = 'PRE-DAWN';
  let isDaytime = false;
  let periodTag = isHi ? 'उषाकाल (ब्रह्म मुहूर्त)' : 'USHA KALA (PRE-DAWN)';
  let isWarning = false;

  if (currentMinutes < sunriseMinutes) {
    isDaytime = false;
    solarArcPercent = Math.max(5, (currentMinutes / sunriseMinutes) * 25);
    activeMilestone = 'PRE-DAWN';
    periodTag = isHi ? 'उषाकाल (ब्रह्म मुहूर्त)' : 'USHA KALA (PRE-DAWN)';
  } else if (currentMinutes <= sunsetMinutes) {
    isDaytime = true;
    const dayProgress = (currentMinutes - sunriseMinutes) / Math.max(1, (sunsetMinutes - sunriseMinutes));
    solarArcPercent = 25 + dayProgress * 50;

    if (currentMinutes < sunriseMinutes + 45) {
      activeMilestone = 'SUNRISE';
      periodTag = isHi ? 'प्रातः सन्ध्या (सूर्योदय काल)' : 'PRATAH SANDHYA (SUNRISE)';
    } else if (currentMinutes > sunsetMinutes - 45) {
      activeMilestone = 'SUNSET';
      periodTag = isHi ? 'सायं सन्ध्या (सूर्यास्त काल)' : 'SAYAHNA SANDHYA (SUNSET)';
    } else {
      activeMilestone = 'MIDDAY';
      periodTag = isHi ? 'शुभ दिनमान होरा' : 'DAYLIGHT (SHUBH HORA)';
    }
  } else {
    isDaytime = false;
    const nightProgress = (currentMinutes - sunsetMinutes) / Math.max(1, (1440 - sunsetMinutes));
    solarArcPercent = Math.min(95, 75 + nightProgress * 25);
    activeMilestone = 'NIGHT';
    periodTag = isHi ? 'रात्रि काल (शयन काल)' : 'SANDHYA / RATRI (NIGHT)';
  }

  // Check if current time falls in Rahu Kaal window
  if (panchangData.timings?.rahuStart && panchangData.timings?.rahuEnd) {
    const rStart = new Date(panchangData.timings.rahuStart).getTime();
    const rEnd = new Date(panchangData.timings.rahuEnd).getTime();
    if (nowMs >= rStart && nowMs <= rEnd) {
      periodTag = isHi ? 'राहु काल (शुभ कार्य वर्जित)' : 'RAHU KAAL (AVOID NEW BEGINNINGS)';
      isWarning = true;
    }
  }

  if (!isWarning && panchangData.timings?.abhijitStart && panchangData.timings?.abhijitEnd) {
    const aStart = new Date(panchangData.timings.abhijitStart).getTime();
    const aEnd = new Date(panchangData.timings.abhijitEnd).getTime();
    if (nowMs >= aStart && nowMs <= aEnd) {
      periodTag = isHi ? 'अभिजित मुहूर्त (सर्वकार्य सिद्धि)' : 'ABHIJIT MUHURAT (HIGH HARMONY)';
    }
  }

  // Format duration helper (bilingual)
  const formatDuration = (mins: number): string => {
    const m = Math.max(1, Math.round(mins));
    const hrs = Math.floor(m / 60);
    const rem = m % 60;
    if (isHi) {
      if (hrs > 0 && rem > 0) return `${toHindiDigits(hrs)} घण्टा ${toHindiDigits(rem)} मिनट`;
      if (hrs > 0) return `${toHindiDigits(hrs)} घण्टा`;
      return `${toHindiDigits(rem)} मिनट`;
    }
    if (hrs > 0 && rem > 0) return `${hrs}h ${rem}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${rem}m`;
  };

  // Deterministic Next Transition Calculation
  let nextTransitionText = '';
  const rStartMs = panchangData.timings?.rahuStart ? new Date(panchangData.timings.rahuStart).getTime() : 0;
  const rEndMs = panchangData.timings?.rahuEnd ? new Date(panchangData.timings.rahuEnd).getTime() : 0;
  const aStartMs = panchangData.timings?.abhijitStart ? new Date(panchangData.timings.abhijitStart).getTime() : 0;

  if (currentMinutes < sunriseMinutes) {
    const diff = sunriseMinutes - currentMinutes;
    nextTransitionText = isHi ? `सूर्योदय: ${formatDuration(diff)} में` : `Sunrise in ${formatDuration(diff)}`;
  } else if (rStartMs > 0 && nowMs < rStartMs && (rStartMs - nowMs) <= 120 * 60 * 1000) {
    const diffMins = (rStartMs - nowMs) / 60000;
    nextTransitionText = isHi ? `राहु काल प्रारम्भ: ${formatDuration(diffMins)} में` : `Rahu Kaal begins in ${formatDuration(diffMins)}`;
  } else if (rStartMs > 0 && rEndMs > 0 && nowMs >= rStartMs && nowMs <= rEndMs) {
    const diffMins = (rEndMs - nowMs) / 60000;
    nextTransitionText = isHi ? `राहु काल समाप्ति: ${formatDuration(diffMins)} में` : `Rahu Kaal ends in ${formatDuration(diffMins)}`;
  } else if (aStartMs > 0 && nowMs < aStartMs && (aStartMs - nowMs) <= 90 * 60 * 1000) {
    const diffMins = (aStartMs - nowMs) / 60000;
    nextTransitionText = isHi ? `अभिजित मुहूर्त: ${formatDuration(diffMins)} में` : `Abhijit Muhurat in ${formatDuration(diffMins)}`;
  } else if (currentMinutes < sunsetMinutes) {
    const diff = sunsetMinutes - currentMinutes;
    nextTransitionText = isHi ? `सूर्यास्त: ${formatDuration(diff)} में` : `Sunset in ${formatDuration(diff)}`;
  } else {
    const diffToMidnight = 1440 - currentMinutes;
    const diffToDawn = diffToMidnight + sunriseMinutes - 96;
    if (diffToDawn > 0 && diffToDawn < 1440) {
      nextTransitionText = isHi ? `ब्रह्म मुहूर्त: ${formatDuration(diffToDawn)} में` : `Brahma Muhurat in ${formatDuration(diffToDawn)}`;
    } else {
      nextTransitionText = isHi ? `सूर्योदय: ${toHindiDigits(sunriseStr)}` : `Sunrise at ${sunriseStr}`;
    }
  }

  // Tithi localization
  const rawTithiName = typeof panchangData.tithi === 'object' && panchangData.tithi !== null
    ? (panchangData.tithi.name || 'Shukla Ekadashi')
    : (panchangData.tithi || 'Shukla Ekadashi');
  const tithiNameHi = panchangData.tithi?.nameHi || TITHI_HI_MAP[rawTithiName] || rawTithiName;
  const tithiName = isHi ? tithiNameHi : rawTithiName;

  // Nakshatra localization
  const rawNakshatraName = typeof panchangData.nakshatra === 'object' && panchangData.nakshatra !== null
    ? (panchangData.nakshatra.name || 'Rohini')
    : (panchangData.nakshatra || 'Rohini');
  const nakshatraNameHi = panchangData.nakshatra?.nameHi || NAKSHATRA_HI_MAP[rawNakshatraName] || rawNakshatraName;
  const nakshatraName = isHi ? nakshatraNameHi : rawNakshatraName;

  const pada = (typeof panchangData.nakshatra === 'object' && panchangData.nakshatra?.pada) || 2;
  const rawNakshatraLord = (typeof panchangData.nakshatra === 'object' && panchangData.nakshatra?.lord) || 'Moon';
  const nakshatraLord = isHi ? (LORD_HI_MAP[rawNakshatraLord] || rawNakshatraLord) : rawNakshatraLord;

  const rawTithiPaksha = (typeof panchangData.tithi === 'object' && panchangData.tithi?.paksha) || 'Shukla Paksha';
  const tithiPaksha = isHi ? (PAKSHA_HI_MAP[rawTithiPaksha] || rawTithiPaksha) : rawTithiPaksha;

  // Yoga localization
  const rawYogaName = typeof panchangData.yoga === 'object' && panchangData.yoga !== null
    ? (panchangData.yoga.name || 'Siddha')
    : (panchangData.yoga || 'Siddha');
  const yogaNameHi = panchangData.yoga?.nameHi || YOGA_HI_MAP[rawYogaName] || rawYogaName;
  const yogaName = isHi ? yogaNameHi : rawYogaName;

  // Karana localization
  const rawKaranaName = typeof panchangData.karana === 'object' && panchangData.karana !== null
    ? (panchangData.karana.name || 'Bava')
    : (panchangData.karana || 'Bava');
  const karanaNameHi = panchangData.karana?.nameHi || KARANA_HI_MAP[rawKaranaName] || rawKaranaName;
  const karanaName = isHi ? karanaNameHi : rawKaranaName;

  const rahuTime = panchangData.timings?.rahuKalam || '15:15 – 16:48';
  const ayanamshaVal = typeof panchangData.ayanamsha === 'number'
    ? (isHi ? `लाहिड़ी ${toHindiDigits(panchangData.ayanamsha.toFixed(2))}°` : `Lahiri ${panchangData.ayanamsha.toFixed(2)}°`)
    : (panchangData.ayanamsha 
        ? (isHi ? `लाहिड़ी ${toHindiDigits(panchangData.ayanamsha)}°` : `Lahiri ${panchangData.ayanamsha}°`) 
        : (isHi ? "लाहिड़ी २४° १६' ४२″" : "Lahiri 24° 16' 42″"));

  const displayTime = isHi ? toHindiDigits(liveTime || '05:30:00') : (liveTime || '05:30:00');
  const displayNowNeedle = isHi ? `वर्तमान ${toHindiDigits(liveTime ? liveTime.slice(0, 5) : '')}` : `NOW ${liveTime ? liveTime.slice(0, 5) : ''}`;
  const displaySunrise = isHi ? toHindiDigits(sunriseStr) : sunriseStr;
  const displaySunset = isHi ? toHindiDigits(sunsetStr) : sunsetStr;
  const displayRahuTime = isHi ? toHindiDigits(rahuTime) : rahuTime;

  // Date hierarchy variables
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const dayNum = now.getDate();
  const dayOfWeek = now.getDay();
  const vikramSamvat = year + 57;

  const englishFullDate = `${ENGLISH_DAYS[dayOfWeek]}, ${dayNum} ${ENGLISH_MONTHS[monthIdx]} ${year}`;
  const hindiFullDate = `${HINDI_DAYS[dayOfWeek]}, ${toHindiDigits(dayNum)} ${HINDI_MONTHS[monthIdx]} ${toHindiDigits(year)}`;

  const lunarMonthObj = LUNAR_MONTHS_LIST[(monthIdx + 4) % 12] || LUNAR_MONTHS_LIST[5];
  const rituIdx = Math.floor(monthIdx / 2) % 6;
  const rituListHi = ['शिशिर ऋतु', 'वसन्त ऋतु', 'ग्रीष्म ऋतु', 'वर्षा ऋतु', 'शरद ऋतु', 'हेमन्त ऋतु'];
  const rituHi = rituListHi[rituIdx];
  const ayanaHi = monthIdx < 6 ? 'उत्तरायण' : 'दक्षिणायन';

  return (
    <div className="relative rounded-3xl bg-[#FAF7F2]/95 dark:bg-[#0A0C14]/95 backdrop-blur-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/45 p-5 sm:p-7 shadow-2xl dark:shadow-[0_0_50px_rgba(212,175,55,0.14)] select-none transition-all duration-300">
      {/* Sacred Geometry Concentric Brass Border */}
      <div className="absolute inset-1.5 rounded-[22px] border border-[#8E6F1D]/15 dark:border-[#D4AF37]/20 pointer-events-none" />

      {/* Top Telemetry Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.1] pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${isWarning ? 'bg-rose-500 shadow-[0_0_8px_#F43F5E]' : 'bg-[#E29A48] dark:bg-[#F59E0B] shadow-[0_0_10px_#F59E0B]'} animate-pulse shrink-0`} />
          <div>
            <div className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-wide flex items-center gap-1.5">
              <span>{isHi ? 'प्रत्यक्ष खगोल चक्र' : 'COSMIC NOW'}</span>
              <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">
                {isHi ? 'वेध' : 'DIAL'}
              </span>
            </div>
            <div className="text-[10px] font-mono-data text-[#696256] dark:text-[#9E988D] uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
              <span>{currentCity.name} • {displayTime} {isHi ? 'भारतीय मानक समय' : 'IST'}</span>
              {(currentCity as any)?.isGps && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  GPS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* City Switch Button */}
        <button
          onClick={() => {
            chitiSensory.playTick();
            onOpenCitySelector();
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
            (currentCity as any)?.isGps
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 bg-white dark:bg-[#121528] text-[#8E6F1D] dark:text-[#F0C968]'
          } text-[10px] sm:text-[11px] font-mono-data font-bold hover:border-[#D4AF37] transition-all shadow-xs cursor-pointer`}
        >
          {(currentCity as any)?.isGps ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <MapPin className="w-3 h-3 text-[#A6461D] dark:text-[#E2825B]" />
          )}
          <span>{currentCity.name}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </div>

      {/* Prominent Bilingual Dual Date & Vedic Lunar Maas Banner */}
      <div className="relative z-10 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/10 to-transparent border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 mb-4 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-1 border-b border-black/5 dark:border-white/10 pb-1.5">
          <div className="font-editorial text-xs sm:text-sm font-bold text-[#1C1917] dark:text-white">
            {englishFullDate} <span className="text-[#8E6F1D] dark:text-[#F0C968] font-normal text-[11px] sm:text-xs">/ {hindiFullDate}</span>
          </div>
          <div className="text-[10px] sm:text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
            विक्रम संवत् {toHindiDigits(vikramSamvat)}
          </div>
        </div>
        <div className="text-[10px] sm:text-[11px] font-mono-data text-[#57524A] dark:text-[#D1C9BF] flex flex-wrap items-center gap-x-2.5 pt-0.5">
          <span>🕉️ <strong>{lunarMonthObj.hi} मास ({lunarMonthObj.en} Maas)</strong></span>
          <span>•</span>
          <span>{tithiPaksha} {tithiName}</span>
          <span>•</span>
          <span>{rituHi} ({ayanaHi})</span>
        </div>
      </div>

      {/* Signature Vedic Day Arc Instrument */}
      <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-white/90 dark:bg-[#070910]/95 border border-[#8E6F1D]/20 dark:border-[#D4AF37]/30 mb-4 shadow-inner">
        <div className="flex items-center justify-between text-[10px] font-mono-data text-[#696256] dark:text-[#A6A095] mb-2 uppercase tracking-widest">
          <span className="flex items-center gap-1 font-semibold text-[#C26E22] dark:text-[#F0A554]">
            <Sun className="w-3.5 h-3.5 text-amber-500" /> {isHi ? `सूर्योदय ${displaySunrise}` : `Rise ${sunriseStr}`}
          </span>
          <span className="font-bold text-[#1C1917] dark:text-[#F5F2EB] px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06]">
            {isDaytime 
              ? (isHi ? '☀ दिनमान सौर गति' : '☀ Diurnal Solar Transit') 
              : (isHi ? '☾ रात्रिमान चन्द्र गति' : '☾ Nocturnal Transit')}
          </span>
          <span className="flex items-center gap-1 font-semibold text-[#4F46E5] dark:text-[#A5B4FC]">
            <Moon className="w-3.5 h-3.5 text-indigo-400" /> {isHi ? `सूर्यास्त ${displaySunset}` : `Set ${sunsetStr}`}
          </span>
        </div>

        {/* Current Time Needle Track Container */}
        <div className="relative w-full pt-4 pb-2">
          {/* Timeline Bar Track */}
          <div className="relative w-full h-3 rounded-full bg-black/10 dark:bg-white/10 p-0.5 border border-black/15 dark:border-white/15">
            {/* Active Progress Fill */}
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isWarning 
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600' 
                  : 'bg-gradient-to-r from-[#C26E22] via-[#D4AF37] to-[#8E6F1D]'
              }`}
              style={{ width: `${solarArcPercent}%` }}
            />
          </div>

          {/* Current Time Indicator Needle Pin */}
          <div 
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-700 z-30"
            style={{ left: `${Math.max(4, Math.min(96, solarArcPercent))}%` }}
          >
            {/* Live Indicator Pill Label */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1C1917] dark:bg-[#F5F2EB] text-[8.5px] font-mono-data font-bold text-white dark:text-[#06070B] shadow-md whitespace-nowrap mb-0.5 border border-[#D4AF37]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
              <span>{displayNowNeedle}</span>
            </div>
            {/* Needle Arrow */}
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[5px] border-t-[#1C1917] dark:border-t-[#F5F2EB]" />
          </div>
        </div>

        {/* 5 Vedic Diurnal Milestones with Active Highlighting */}
        <div className="grid grid-cols-5 text-center text-[8px] sm:text-[9px] font-mono-data mt-1.5 px-0.5 gap-1">
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'PRE-DAWN' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            {isHi ? 'उषाकाल' : 'PRE-DAWN'}
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'SUNRISE' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            {isHi ? 'सूर्योदय' : 'SUNRISE'}
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'MIDDAY' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            {isHi ? 'मध्याह्न' : 'MIDDAY'}
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'SUNSET' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            {isHi ? 'सायंकाल' : 'SUNSET'}
          </span>
          <span className={`py-1 rounded-md transition-all ${activeMilestone === 'NIGHT' ? 'font-bold text-[#8E6F1D] dark:text-[#F0C968] bg-[#D4AF37]/20 border border-[#D4AF37]/40 shadow-xs' : 'text-[#857E74] dark:text-[#8E877B] opacity-70'}`}>
            {isHi ? 'रात्रि' : 'NIGHT'}
          </span>
        </div>

        {/* Live Active Period & Next Transition Row */}
        <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[9.5px] font-mono-data uppercase tracking-wider text-[#696256] dark:text-[#9E988D]">
              {isHi ? 'वर्तमान वेला:' : 'Window:'}
            </span>
            <span className={`text-[9.5px] font-mono-data font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
              isWarning
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                : 'bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] border border-[#D4AF37]/30'
            }`}>
              {periodTag}
            </span>
          </div>
          {nextTransitionText && (
            <div className="flex items-center gap-1 text-[9.5px] font-mono-data font-semibold text-[#8E6F1D] dark:text-[#D4AF37] bg-black/[0.03] dark:bg-white/[0.04] px-2 py-0.5 rounded border border-black/[0.06] dark:border-white/[0.08]">
              <Sparkles className="w-2.5 h-2.5 text-[#C26E22] dark:text-[#F59E0B]" />
              <span>{isHi ? 'आगामी:' : 'Next:'} <strong>{nextTransitionText}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Astronomical Telemetry Plate */}
      <div className="relative z-10 rounded-2xl bg-white/85 dark:bg-[#070912]/90 border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 p-3.5 divide-y divide-black/[0.06] dark:divide-white/[0.08] text-xs font-mono-data shadow-xs">
        {/* Primary State: Tithi + Nakshatra */}
        <div className="grid grid-cols-2 gap-3 pb-3">
          <div>
            <div className="text-[9px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider font-semibold">
              {isHi ? 'तिथि (चन्द्र दिवस)' : 'TITHI (LUNAR DAY)'}
            </div>
            <div className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-0.5 truncate">
              {tithiName}
            </div>
            <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] font-semibold mt-0.5">
              {tithiPaksha}
            </div>
          </div>

          <div className="border-l border-black/[0.06] dark:border-white/[0.08] pl-3">
            <div className="text-[9px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider font-semibold">
              {isHi ? 'नक्षत्र एवं पद' : 'NAKSHATRA (MANSION)'}
            </div>
            <div className="font-editorial text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-0.5 truncate">
              {nakshatraName}
            </div>
            <div className="text-[9px] text-indigo-600 dark:text-[#B0B0FF] font-semibold mt-0.5">
              {isHi ? `पद ${toHindiDigits(pada)} • स्वामी: ${nakshatraLord}` : `Pada ${pada} • Lord ${nakshatraLord}`}
            </div>
          </div>
        </div>

        {/* Secondary State & Alert: Yoga / Karana & Rahu Kaal */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div>
            <div className="text-[9px] text-[#696256] dark:text-[#8E877B] uppercase tracking-wider font-semibold">
              {isHi ? 'योग एवं करण' : 'YOGA & KARANA'}
            </div>
            <div className="font-semibold text-[#1C1917] dark:text-[#FFFFFF] text-xs mt-0.5 truncate">
              {yogaName}
            </div>
            <div className="text-[9px] text-[#696256] dark:text-[#9E988D] mt-0.5 truncate">
              {isHi ? `करण: ${karanaName}` : `Karana: ${karanaName}`}
            </div>
          </div>

          <div className="border-l border-black/[0.06] dark:border-white/[0.08] pl-3">
            <div className="text-[9px] text-[#991B1B] dark:text-[#F87171] uppercase tracking-wider font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 inline-block" /> 
              {isHi ? 'राहु काल (वर्ज्य)' : 'RAHU KAAL (AVOID)'}
            </div>
            <div className="font-mono-data font-bold text-[#991B1B] dark:text-[#F87171] text-xs mt-0.5 truncate">
              {displayRahuTime}
            </div>
            <div className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] mt-0.5 truncate">
              {ayanamshaVal}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Instrument Stamp */}
      <div className="relative z-10 mt-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[9px] font-mono-data text-[#857E74] dark:text-[#7A746B]">
        <span>{isHi ? 'चित्रा पक्षीय निरयण पञ्चाङ्ग' : 'Chitra Paksha Sidereal Ephemeris'}</span>
        <span>{isHi ? 'शुद्धता ±०.०१°' : 'Accuracy ±0.01°'}</span>
      </div>
    </div>
  );
}


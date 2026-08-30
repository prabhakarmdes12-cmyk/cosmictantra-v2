'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  RotateCcw,
  Flame,
  Info,
  Globe2,
  Sparkles,
  BookOpen,
  Eye,
  CheckCircle,
  Share2,
  HelpCircle
} from 'lucide-react';
import { calculateKundali } from '../lib/astrologyEngine';
import { CITIES, searchCities, DEFAULT_CITY } from '../lib/cities';
import { getCurrentGpsLocation, resolveBirthPlace } from '../lib/location';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';
import { calculateVimshottariDasha } from '../lib/dashaEngine';
import { getProfiles, getActiveProfile, upsertProfile, setActiveProfile } from '../lib/profileStore';
import NorthIndianChart from './NorthIndianChart';

const POPULAR_PANCHANG_ANCHORS = [
  { id: 'varanasi', name: 'काशी (Varanasi)', lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  { id: 'ayodhya', name: 'अयोध्या (Ayodhya)', lat: 26.7922, lng: 82.1998, state: 'Uttar Pradesh' },
  { id: 'ujjain', name: 'उज्जैन (Ujjain)', lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh' },
  { id: 'haridwar', name: 'हरिद्वार (Haridwar)', lat: 29.9457, lng: 78.1642, state: 'Uttarakhand' },
  { id: 'dhanbad', name: 'धनबाद (Dhanbad)', lat: 23.7957, lng: 86.4304, state: 'Jharkhand' },
  { id: 'patna', name: 'पटना (Patna)', lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  { id: 'delhi', name: 'दिल्ली (Delhi NCR)', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { id: 'mumbai', name: 'मुम्बई (Mumbai)', lat: 19.0760, lon: 72.8777, lng: 72.8777, state: 'Maharashtra' }
];

export default function KundaliExperience({
  kundaliData,
  onGenerateKundali,
  onOpenConsultation,
  onOpenDasha,
  lang = 'en',
  theme = 'dark'
}) {
  // NEW VISITOR: empty fields + placeholders only (never a stranger's demo data).
  // Returning visitor: prefilled from their saved Parivaar profile below.
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    cityName: DEFAULT_CITY.name,
    stateName: DEFAULT_CITY.state,
    latitude: DEFAULT_CITY.lat,
    longitude: DEFAULT_CITY.lng,
    timezone: DEFAULT_CITY.tz || 5.5,
    isCustomCoordinates: false
  });

  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [showCoordinateAdvanced, setShowCoordinateAdvanced] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');
  const [viewMode, setViewMode] = useState('simple');
  const [savedCosmicId, setSavedCosmicId] = useState(null);
  // Birth-time-unknown path: many first-time users do not know their exact
  // time. Instead of abandoning, we compute a noon chart (Moon/Nakshatra stay
  // reliable) and honestly flag that Lagna needs scholarly rectification.
  const [birthTimeUnknown, setBirthTimeUnknown] = useState(false);
  const isHi = lang === 'hi';
  const t = TRANSLATIONS[lang]?.kundali || TRANSLATIONS.en.kundali;

  // Prefill from the active saved profile (returning visitor)
  useEffect(() => {
    try {
      const p = getActiveProfile();
      if (p && p.birthDate) {
        setFormData(prev => ({
          ...prev,
          name: p.name || prev.name,
          birthDate: p.birthDate || prev.birthDate,
          birthTime: p.birthTime || prev.birthTime,
          cityName: p.birthCity || p.cityName || prev.cityName,
          stateName: p.state || prev.stateName,
          latitude: p.lat ?? p.birthLat ?? prev.latitude,
          longitude: p.lng ?? p.birthLon ?? prev.longitude,
          timezone: p.tz ?? p.timezone ?? prev.timezone
        }));
        if (p.cosmicId) setSavedCosmicId(p.cosmicId);
      }
    } catch {}
  }, []);

  const handleCitySelect = (city) => {
    chitiSensory.playTick();
    setFormData(prev => ({
      ...prev,
      cityName: city.name,
      stateName: city.state,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.tz || 5.5,
      isCustomCoordinates: false
    }));
    setCitySearchQuery('');
  };

  const handleUseLiveGps = async () => {
    chitiSensory.playTick();
    setGpsStatus(isHi ? 'GPS निर्देशांक प्राप्त हो रहे हैं...' : 'Acquiring GPS coordinates...');
    try {
      const loc = await getCurrentGpsLocation({ enableHighAccuracy: true, timeout: 10000 });
      setFormData(prev => ({
        ...prev,
        cityName: loc.name,
        stateName: loc.state,
        latitude: loc.lat,
        longitude: loc.lng,
        timezone: loc.tz,
        isCustomCoordinates: true
      }));
      setGpsStatus(isHi ? '✓ GPS लॉक सफल' : '✓ GPS Lock Successful');
      setTimeout(() => setGpsStatus(''), 4000);
    } catch (err) {
      setGpsStatus(isHi ? 'GPS अनुमति अस्वीकृत। कृपया नगर चुनें।' : 'GPS access denied. Select city from list.');
      setTimeout(() => setGpsStatus(''), 4000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    chitiSensory.playTick();

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const tz = parseFloat(formData.timezone || 5.5);
    const effectiveBirthTime = birthTimeUnknown ? '12:00' : (formData.birthTime || '12:00');

    const locationLabel = formData.cityName + ', ' + (formData.stateName || 'India');

    const data = calculateKundali({
      birthDate: formData.birthDate,
      birthTime: effectiveBirthTime,
      latitude: lat,
      longitude: lng,
      timezone: tz,
      locationName: locationLabel
    });

    analytics.track(ANALYTICS_EVENTS.KUNDALI_GENERATED, {
      lagna: data.lagna.rashiName,
      moonNak: data.moon.nakshatra,
      lat,
      lng,
      birthTimeKnown: !birthTimeUnknown
    });
    // Activation metric — once per visitor, annotated with time-to-value
    analytics.trackOnce('first_kundali', ANALYTICS_EVENTS.FIRST_KUNDALI_GENERATED, {
      lagna: data.lagna.rashiName,
      birthTimeKnown: !birthTimeUnknown
    });

    // Persist silently to the Parivaar vault (localStorage → Cosmic ID).
    // The chart survives refresh and auto-fills /ask — account-later, never a gate.
    try {
      const birthDate = formData.birthDate;
      const birthTime = effectiveBirthTime;
      const existing = getProfiles().find(
        (p) => p.relation === 'Self' && p.birthDate === birthDate && p.birthTime === birthTime
      );
      const saved = upsertProfile({
        id: existing?.id,
        name: (formData.name || '').trim() || (isHi ? 'जातक' : 'Native'),
        relation: 'Self',
        birthDate,
        birthTime,
        birthTimeKnown: !birthTimeUnknown,
        birthCity: formData.cityName,
        birthLat: lat,
        birthLon: lng,
        lat,
        lng,
        timezone: tz,
        tz
      });
      if (saved && saved.id) setActiveProfile(saved.id);
      if (saved?.cosmicId) setSavedCosmicId(saved.cosmicId);
      if (saved) analytics.track(ANALYTICS_EVENTS.PROFILE_SAVED, { cosmicId: saved.cosmicId, relation: 'Self' });
    } catch {}

    onGenerateKundali(data);
  };

  // Plain-language highlights (the "aha" block for first-time visitors)
  const highlights = (() => {
    if (!kundaliData) return [];
    const lagnaName = kundaliData.lagna?.rashiName || '';
    const lagnaEn = kundaliData.lagna?.rashiEn || kundaliData.lagna?.rasiName || '';
    const moonRashi = kundaliData.moon?.rashiName || '';
    const moonNak = kundaliData.moon?.nakshatra?.name || kundaliData.moon?.nakshatra || '';
    const moonPada = kundaliData.moon?.pada || 1;
    const items = [
      isHi
        ? `आपका लग्न ${lagnaName}${lagnaEn ? ` (${lagnaEn})` : ''} है — स्वभाव व जीवन-दृष्टि का सूचक।`
        : `Your Lagna (rising sign) is ${lagnaEn || lagnaName} — it shapes temperament & outlook.`,
      isHi
        ? `चन्द्र ${moonRashi} राशि, ${moonNak} नक्षत्र (पाद ${moonPada}) में — मन की प्रवृत्ति का सूचक।`
        : `Moon in ${moonRashi}, ${moonNak} Nakshatra (Pada ${moonPada}) — it shows the mind's nature.`
    ];
    try {
      const moonLon = kundaliData.moon?.longitude;
      if (typeof moonLon === 'number' && formData.birthDate) {
        const schedule = calculateVimshottariDasha(moonLon, formData.birthDate);
        const current = schedule?.mahadashas?.find?.((m) => m.isCurrent);
        if (current) {
          const endYear = (current.endDate || '').slice(0, 4);
          items.push(
            isHi
              ? `अभी ${current.lordHi || current.lord} महादशा चल रही है${endYear ? ` (${endYear} तक)` : ''} — जीवन का वर्तमान अध्याय।`
              : `Currently running ${current.lord} Mahadasha${endYear ? ` (till ${endYear})` : ''} — life's present chapter.`
          );
        }
      }
    } catch {}
    return items;
  })();

  // 1-tap WhatsApp share (Web Share API → wa.me fallback) — the viral loop
  const handleWhatsAppShare = () => {
    chitiSensory.playTick();
    const lagna = kundaliData?.lagna?.rashiEn || kundaliData?.lagna?.rashiName || '';
    const moonNak = kundaliData?.moon?.nakshatra?.name || kundaliData?.moon?.nakshatra || '';
    const name = (formData.name || '').trim() || (isHi ? 'जातक' : 'Native');
    const text = isHi
      ? `🕉 ${name} की जन्म कुण्डली (CosmicTantra)\n• लग्न: ${lagna}\n• चन्द्र नक्षत्र: ${moonNak}\n• जन्म: ${formData.birthDate}, ${birthTimeUnknown ? 'समय अज्ञात' : formData.birthTime}, ${formData.cityName}\n\nनिःशुल्क कुण्डली यहाँ बनाएं: https://cosmictantra.chiti.tech`
      : `🕉 ${name}'s Janma Kundali (CosmicTantra)\n• Lagna: ${lagna}\n• Moon Nakshatra: ${moonNak}\n• Born: ${formData.birthDate}, ${birthTimeUnknown ? 'time unknown' : formData.birthTime}, ${formData.cityName}\n\nMake your free Kundali: https://cosmictantra.chiti.tech`;
    analytics.track(ANALYTICS_EVENTS.KUNDALI_SHARED, { source: 'KUNDALI_RESULT' });
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }
  };

  const handleDemoFill = () => {
    chitiSensory.playTick();
    setFormData({
      name: 'Priya Sharma',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      cityName: 'Patna',
      stateName: 'Bihar',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      isCustomCoordinates: false
    });
  };

  const filteredCities = citySearchQuery.trim() ? searchCities(citySearchQuery) : null;

  return (
    <section id="kundali-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#06070B] relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
            <Flame className="w-3.5 h-3.5 text-[#E29A48]" />
            <span>{isHi ? 'वैदिक जन्म कुण्डली निर्माण' : t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {isHi ? 'सटीक जन्म कुण्डली एवं ग्रह स्थिति' : t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#AAA49A] font-mono-data mt-2">
            {isHi 
              ? 'नाम, जन्म तिथि, जन्म समय व जन्म स्थान दर्ज करें — प्रामाणिक लाहिरी अयनांश आधारित वैदिक जन्म कुण्डली निर्मित करें।'
              : 'Enter birth details to construct your authentic sidereal birth chart with Chitra Paksha Lahiri Ayanamsha.'}
          </p>
        </div>

        {/* Simplified 4-Field Form Matrix */}
        <div className="max-w-4xl rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 p-6 sm:p-8 mb-12 shadow-2xl bg-white dark:bg-[#090A12] transition-colors duration-300 font-mono-data">
          <div className="mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="text-[10px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#E5C378] font-bold mb-2 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'शीघ्र नगर चयन (Quick Anchors):' : 'Popular Vedic Astrological Anchors:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_PANCHANG_ANCHORS.map((anchor) => (
                <button
                  key={anchor.id}
                  type="button"
                  onClick={() => handleCitySelect({ ...anchor, tz: 5.5 })}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all cursor-pointer"
                >
                  {anchor.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#E5C378] font-bold block">
                  {isHi ? '१. जातक का नाम' : '1. Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#E5C378] font-bold block">
                  {isHi ? '२. जन्म तारीख' : '2. Birth Date'}
                </label>
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#E5C378] font-bold block">
                  {isHi ? '३. जन्म समय (24h)' : '3. Birth Time'}
                </label>
                <input
                  type="time"
                  required
                  disabled={birthTimeUnknown}
                  value={birthTimeUnknown ? '12:00' : formData.birthTime}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold disabled:opacity-60"
                />
                <label className="flex items-start gap-1.5 text-[10px] text-[#57524A] dark:text-[#AAA49A] cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={birthTimeUnknown}
                    onChange={(e) => {
                      setBirthTimeUnknown(e.target.checked);
                      setFormData(prev => ({ ...prev, birthTime: e.target.checked ? '12:00' : '' }));
                    }}
                    className="mt-0.5 cursor-pointer accent-[#8E6F1D]"
                  />
                  <span>{isHi ? 'समय नहीं पता — दोपहर 12:00 से गणना करें' : 'I don\u2019t know my birth time — use 12:00 noon'}</span>
                </label>
                {birthTimeUnknown && (
                  <p className="text-[10px] leading-relaxed text-[#A6461D] dark:text-[#E2825B] font-medium">
                    {isHi
                      ? 'ⓘ बिना समय के चन्द्र राशि व नक्षत्र शुद्ध रहते हैं, परन्तु लग्न सटीक नहीं होगा। पंडित जी से जन्म समय शोधन (rectification) परामर्श लें।'
                      : 'ⓘ Without the exact time, Moon sign & Nakshatra stay reliable but the Lagna will be approximate. Ask a scholar about birth-time rectification.'}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#E5C378] font-bold flex items-center justify-between">
                  <span>{isHi ? '४. जन्म स्थान' : '4. Birth Place'}</span>
                  <button
                    type="button"
                    onClick={handleUseLiveGps}
                    className="text-[9px] text-[#4848A8] dark:text-[#8B8BF5] hover:underline cursor-pointer"
                  >
                    {isHi ? '📍 GPS' : '📍 Use GPS'}
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={citySearchQuery || (formData.cityName + ', ' + (formData.stateName || 'India'))}
                  onChange={(e) => setCitySearchQuery(e.target.value)}
                  onFocus={() => { if (!citySearchQuery) setCitySearchQuery(formData.cityName); }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold"
                  placeholder="Type city or village..."
                />

                {filteredCities && filteredCities.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#0D0A1E] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto py-1 text-xs">
                    {filteredCities.slice(0, 8).map((city, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCitySelect(city)}
                        className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-purple-950/60 text-[#1C1917] dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                      >
                        <span>{city.name}, {city.state}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">{city.lat.toFixed(2)}°N</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {gpsStatus && (
              <div className="text-[10px] text-emerald-500 font-mono">
                {gpsStatus}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-xs text-[#4848A8] dark:text-[#8B8BF5] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isHi ? 'नमूना डेटा भरें (पटना, 1995)' : t.sampleFill}</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98 cursor-pointer"
              >
                <span>{isHi ? 'जन्म कुण्डली निर्मित करें' : t.submitBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Calculated Chart Experience (Dual View: Simple + Pandit) */}
        {kundaliData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#090B14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-editorial text-[#1C1917] dark:text-white">
                    {formData.name} की जन्म कुण्डली ({kundaliData.locationName})
                  </h3>
                  <div className="text-xs font-mono text-[#57524A] dark:text-[#AAA49A]">
                    {kundaliData.meta?.birthDate} • {kundaliData.meta?.birthTime} • Lahiri Ayanamsha {kundaliData.ayanamsha}°
                  </div>
                  {savedCosmicId && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle className="w-3 h-3" />
                        <span>{isHi ? 'कुण्डली सुरक्षित — आपका Cosmic ID' : 'Kundali saved — your Cosmic ID'}: {savedCosmicId}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/40 text-[10px] font-bold text-[#128C4A] dark:text-[#4ADE80] hover:bg-[#25D366]/20 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>{isHi ? 'व्हाट्सएप पर भेजें' : 'Share on WhatsApp'}</span>
                      </button>
                      {birthTimeUnknown && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          <HelpCircle className="w-3 h-3" />
                          <span>{isHi ? 'समय अज्ञात — लग्न सांकेतिक' : 'Time unknown — Lagna approximate'}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center p-1 bg-black/5 dark:bg-black/60 rounded-xl border border-black/10 dark:border-white/10 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('simple')}
                  className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ' + (viewMode === 'simple' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white')}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isHi ? 'सरल दृश्य (Seeker)' : 'Simple View'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('pandit')}
                  className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ' + (viewMode === 'pandit' ? 'bg-amber-500 text-black shadow-md' : 'text-zinc-400 hover:text-white')}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isHi ? 'पण्डित दृश्य (Professional)' : 'Pandit View'}</span>
                </button>
              </div>
            </div>

            {/* 3 Plain-Language Highlights — the first-timer "aha" block */}
            {highlights.length > 0 && (
              <div className="grid sm:grid-cols-3 gap-3">
                {highlights.map((h, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-white dark:from-[#0B0D16] dark:to-[#090B14] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30"
                  >
                    <div className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#8E6F1D] dark:text-[#F0C968] mb-1.5 font-mono-data">
                      {isHi ? `आपकी ३ मुख्य बातें · ${i + 1}/३` : `YOUR 3 HIGHLIGHTS · ${i + 1}/3`}
                    </div>
                    <p className="text-xs leading-relaxed font-medium text-[#1C1917] dark:text-[#EFECE6]">{h}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 1. SIMPLE VIEW */}
            {viewMode === 'simple' && (
              <div className="space-y-6 font-mono-data">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#090B14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 space-y-1">
                    <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold">आपका लग्न (Ascendant)</span>
                    <div className="text-2xl font-bold font-editorial text-[#1C1917] dark:text-white">
                      {kundaliData.lagna.rashiName} ({kundaliData.lagna.rashiEn})
                    </div>
                    <p className="text-xs text-[#57524A] dark:text-[#AAA49A] pt-1">
                      {isHi ? 'यह आपकी शारीरिक ऊर्जा, व्यक्तित्व व जीवन के मुख्य दृष्टिकोण को दर्शाता है।' : 'Defines your outer personality, physical vitality, and life orientation.'}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#090B14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 space-y-1">
                    <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold">आपकी राशि (Moon Sign)</span>
                    <div className="text-2xl font-bold font-editorial text-[#1C1917] dark:text-white">
                      {kundaliData.moon.rashiName} ({kundaliData.moon.rashiEn})
                    </div>
                    <p className="text-xs text-[#57524A] dark:text-[#AAA49A] pt-1">
                      {isHi ? 'नक्षत्र: ' + (kundaliData.moon.nakshatra?.name || 'उत्तराषाढ़ा') + ' (पाद ' + kundaliData.moon.pada + ') — मन व भावनात्मक प्रकृति।' : 'Governs emotional nature and instinctual mind.'}
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white dark:bg-[#090B14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 space-y-1">
                    <span className="text-[10px] text-amber-500 uppercase tracking-wider font-bold">सूर्य राशि (Sun Sign)</span>
                    <div className="text-2xl font-bold font-editorial text-[#1C1917] dark:text-white">
                      {kundaliData.planets?.Sun?.rashiName || 'मिथुन'} ({kundaliData.planets?.Sun?.rashiEn || 'Gemini'})
                    </div>
                    <p className="text-xs text-[#57524A] dark:text-[#AAA49A] pt-1">
                      {isHi ? 'आत्मा कारक, पिता का प्रभाव व नेतृत्व क्षमता का केंद्र।' : 'Soul purpose, authority, and vitality ruler.'}
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-transparent border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h4 className="font-editorial text-lg font-bold text-white">
                      {isHi ? 'महत्वपूर्ण जन्म कुण्डली अवलोकन' : 'Important Natal Observations'}
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isHi 
                      ? 'आपकी कुण्डली में लग्न स्वामी अनुकूल स्थिति में है। वर्तमान में आपकी विंशोत्तरी महादशा सक्रिय है। किसी विशिष्ट विषय (विवाह, करियर, स्वास्थ्य) पर पण्डित जी से परामर्श लेने हेतु नीचे बटन दबाएं।'
                      : 'Your planetary framework shows strong ascendant alignment. To explore specific career, marriage, or health remedies, consult directly with our verified practitioners.'}
                  </p>
                </div>
              </div>
            )}

            {/* 2. PANDIT VIEW */}
            {viewMode === 'pandit' && (
              <div className="space-y-6 font-mono-data">
                <div className="p-6 rounded-3xl bg-white dark:bg-[#090B14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 flex flex-col items-center">
                  <h4 className="font-editorial text-lg font-bold text-white mb-4">
                    लग्न कुण्डली (D1 Rashi Chart — North Indian Diamond Format)
                  </h4>
                  <div className="w-full max-w-md">
                    <NorthIndianChart kundaliData={kundaliData} lang={lang} />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                        <th className="pb-2">ग्रह (Planet)</th>
                        <th className="pb-2">निरयण रेखांश</th>
                        <th className="pb-2">राशि (Sign)</th>
                        <th className="pb-2">अंश/कला</th>
                        <th className="pb-2">भाव</th>
                        <th className="pb-2">नक्षत्र व पाद</th>
                        <th className="pb-2">स्थिति (Dignity)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {kundaliData.planets.map((p, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/60 transition-colors">
                          <td className="py-2.5 font-bold text-white flex items-center gap-1">
                            <span>{p.symbol}</span> <span>{p.name}</span>
                          </td>
                          <td className="py-2.5 text-zinc-400">{p.longitude.toFixed(4)}°</td>
                          <td className="py-2.5 text-amber-300">{p.rashiName} ({p.rashiEn})</td>
                          <td className="py-2.5">{p.degreeStr}</td>
                          <td className="py-2.5 font-bold">{p.house}th House</td>
                          <td className="py-2.5">{(p.nakshatra?.name || p.nakshatra)} (P{p.pada})</td>
                          <td className="py-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300">
                              {p.dignity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  Compass, 
  Sparkles, 
  Search, 
  Check, 
  ChevronDown 
} from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';
import { searchCities, DEFAULT_CITY } from '../lib/cities';
import { getCurrentGpsLocation } from '../lib/location';
import CosmicNowDial from './visual/CosmicNowDial';

export default function HeroSection({
  panchangData,
  currentCity,
  onOpenCitySelector,
  onOpenConsultation,
  onExplorePanchang,
  onCreateKundali,
  lang = 'en',
  theme = 'dark'
}) {
  const router = useRouter();
  const isHi = lang === 'hi';
  const t = TRANSLATIONS[lang]?.hero || TRANSLATIONS.en.hero;

  // 2-Step Micro-Drawer State
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Priya Sharma',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    cityName: 'Patna',
    stateName: 'Bihar',
    latitude: 25.5941,
    longitude: 85.1376,
    timezone: 5.5,
  });

  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  const handleCitySelect = (city) => {
    chitiSensory.playTick();
    setFormData(prev => ({
      ...prev,
      cityName: city.name,
      stateName: city.state,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.tz || 5.5,
    }));
    setCitySearchQuery('');
    setShowCityDropdown(false);
  };

  const handleUseLiveGps = async () => {
    chitiSensory.playTick();
    setGpsStatus(isHi ? 'GPS खोज रहे हैं...' : 'Acquiring GPS...');
    try {
      const loc = await getCurrentGpsLocation({ enableHighAccuracy: true, timeout: 8000 });
      setFormData(prev => ({
        ...prev,
        cityName: loc.name,
        stateName: loc.state,
        latitude: loc.lat,
        longitude: loc.lng,
        timezone: loc.tz,
      }));
      setGpsStatus(isHi ? '✓ GPS लॉक सफल' : '✓ GPS Lock');
      setTimeout(() => setGpsStatus(''), 3000);
    } catch (err) {
      setGpsStatus(isHi ? 'GPS अनुमति नहीं मिली' : 'GPS Denied');
      setTimeout(() => setGpsStatus(''), 3000);
    }
  };

  const handleGenerateKundli = (e) => {
    if (e) e.preventDefault();
    chitiSensory.playTick();

    const name = formData.name.trim() || (isHi ? 'जातक' : 'Seeker');
    const dob = formData.birthDate || '1995-06-15';
    const tob = formData.birthTime || '10:30';
    const city = formData.cityName || 'Patna';
    const lat = formData.latitude || 25.5941;
    const lng = formData.longitude || 85.1376;
    const tz = formData.timezone || 5.5;

    const payload = {
      name,
      birthDate: dob,
      birthTime: tob,
      city,
      latitude: lat,
      longitude: lng,
      timezone: tz,
      source: 'HERO_MICRO_DRAWER'
    };

    try {
      localStorage.setItem('cosmictantra_active_kundli', JSON.stringify(payload));
    } catch {}

    analytics.track(ANALYTICS_EVENTS.KUNDALI_GENERATED, {
      source: 'HERO_MICRO_DRAWER',
      lat,
      lng,
      city
    });

    const query = new URLSearchParams({
      name,
      dob,
      tob,
      city,
      lat: String(lat),
      lng: String(lng),
      tz: String(tz)
    });

    if (typeof window !== 'undefined') {
      window.location.href = `/report?${query.toString()}`;
    }
  };

  const citySearchResults = citySearchQuery.trim() ? searchCities(citySearchQuery).slice(0, 6) : [];

  return (
    <section id="hero-section" className="relative pt-16 pb-16 sm:pt-20 lg:pt-20 lg:pb-24 border-b border-black/[0.1] dark:border-white/[0.08] transition-colors duration-250 overflow-hidden">
      {/* Clean Edge-to-Edge Background Video Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
          poster="/varanasi-ghats-hero.jpg"
        >
          <source src="/kashi-hero-video.mp4" type="video/mp4" />
        </video>
        {/* Subtle Local Ambient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/90 via-[#FAF7F2]/65 to-transparent dark:from-[#06070B]/95 dark:via-[#06070B]/75 dark:to-transparent lg:w-3/4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Spatial Observatory Asymmetrical Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Flow: Floating Editorial Typography over Living Atmosphere */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 max-w-2xl">
            
            {/* Kashi Vedic Timekeeper Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-full border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-white/85 dark:bg-[#0E101D]/85 backdrop-blur-md text-[10.5px] sm:text-[11px] font-mono-data uppercase tracking-[0.18em] text-[#8E6F1D] dark:text-[#F0C968] shadow-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-[#E29A48] animate-pulse shrink-0" />
              <span>{t.kashiBadge}</span>
            </div>

            {/* Display Headline */}
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="font-editorial text-clamp-hero font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight leading-none">
                {t.headline1} <br />
                <span className="text-[#8E6F1D] dark:text-[#D4AF37] drop-shadow-xs">{t.headline2}</span>
              </h1>
              <p className="text-sm sm:text-lg text-[#3D382E] dark:text-[#E2DAC9] font-normal leading-relaxed pt-0.5 font-editorial italic">
                {t.subtitle}
              </p>
            </div>

            {/* Core Description */}
            <p className="text-xs sm:text-sm text-[#4A443B] dark:text-[#D1C9BF] leading-relaxed max-w-xl">
              {t.description}
            </p>

            {/* ========================================================== */}
            {/* UNIFIED 2-STEP KUNDLI MICRO-DRAWER IN HERO                  */}
            {/* ========================================================== */}
            <div className="mt-4 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-white/90 dark:bg-[#0C0E18]/90 backdrop-blur-xl p-4 sm:p-5 shadow-2xl transition-all duration-300 font-mono-data">
              <form onSubmit={handleGenerateKundli} className="space-y-3">
                
                {/* Micro-Drawer Header / Pill */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8E6F1D] dark:text-[#E5C378] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#E29A48]" />
                    <span>{isHi ? 'शीघ्र कुण्डली निर्माण (Quick Kundli)' : 'Instant Master Kundli Generator'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[10px] text-[#78716C] dark:text-[#A8A29E] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? (isHi ? 'कम विवरण' : 'Compact') : (isHi ? 'विस्तृत विवरण' : 'More Details')}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* STEP 1: Name & Birth Date (Always Visible) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                      <span>{isHi ? 'जातक का नाम' : 'Full Name'}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onFocus={() => setIsExpanded(true)}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold"
                      placeholder={isHi ? 'उदा. प्रिया शर्मा' : 'e.g. Priya Sharma'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                      <span>{isHi ? 'जन्म तिथि' : 'Birth Date'}</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.birthDate}
                      onFocus={() => setIsExpanded(true)}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold"
                    />
                  </div>
                </div>

                {/* STEP 2: Time of Birth & Place (Smoothly Expands on Focus) */}
                {isExpanded && (
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-black/[0.04] dark:border-white/[0.04] animate-fadeIn">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                        <span>{isHi ? 'जन्म समय (IST)' : 'Birth Time'}</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.birthTime}
                        onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold"
                      />
                    </div>

                    <div className="space-y-1 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                          <span>{isHi ? 'जन्म स्थान' : 'Birth Place'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleUseLiveGps}
                          className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] hover:underline font-bold"
                        >
                          {gpsStatus || (isHi ? '⚡ Live GPS' : '⚡ Live GPS')}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={citySearchQuery || formData.cityName}
                          onFocus={() => setShowCityDropdown(true)}
                          onChange={(e) => {
                            setCitySearchQuery(e.target.value);
                            setShowCityDropdown(true);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold"
                          placeholder={isHi ? 'उदा. पटना, काशी, दिल्ली' : 'e.g. Patna, Varanasi'}
                        />

                        {/* Autocomplete Dropdown */}
                        {showCityDropdown && citySearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-[#121420] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                            {citySearchResults.map((city) => (
                              <button
                                key={city.id}
                                type="button"
                                onClick={() => handleCitySelect(city)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-[#FAF7F2] dark:hover:bg-[#1B1E2E] flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"
                              >
                                <div>
                                  <div className="font-bold text-[#1C1917] dark:text-[#EFECE6]">{city.name}</div>
                                  <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{city.state}</div>
                                </div>
                                <span className="text-[10px] text-[#8E6F1D] dark:text-[#D4AF37]">{city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* Primary Generate Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGenerateKundli}
                    className="w-full py-3 px-6 rounded-xl text-xs font-mono-data uppercase tracking-wider font-bold bg-[#8E6F1D] dark:bg-[#D4AF37] hover:bg-[#785E18] dark:hover:bg-[#E5C378] text-white dark:text-[#060709] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group min-h-[44px]"
                  >
                    <span>{isHi ? 'सम्पूर्ण जन्म कुण्डली बनाएं' : 'GENERATE MASTER KUNDLI'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </form>
            </div>

            {/* Secondary Action Links Below Drawer */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-data">
              <button
                type="button"
                onClick={() => {
                  chitiSensory.playTick();
                  onExplorePanchang();
                }}
                className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] underline-offset-4 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>{isHi ? 'दैनिक पञ्चाङ्ग देखें →' : "See Today's Panchang →"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  chitiSensory.playTick();
                  onOpenConsultation();
                }}
                className="text-[#A6461D] dark:text-[#F0A554] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] underline-offset-4 hover:underline flex items-center gap-1 font-bold"
              >
                <span>{isHi ? 'विद्वान् ज्योतिषी परामर्श (₹५०१) →' : 'Ask a Jyotishi (₹501) →'}</span>
              </button>
            </div>

            {/* Classical Verified Methodology Micro-Panel (§10) */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-[11px] font-mono-data text-[#696256] dark:text-[#A6A095] border-t border-black/[0.06] dark:border-white/[0.08] w-full mt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37] shrink-0" />
                <span>{t.footerNote}</span>
              </div>
              <a
                href="#methodology-section"
                onClick={(e) => {
                  const el = document.getElementById('methodology-section');
                  if (el) {
                    e.preventDefault();
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-[#8E6F1D] dark:text-[#D4AF37] hover:underline font-semibold flex items-center gap-0.5 ml-auto"
              >
                <span>{t.viewMethodology || (isHi ? 'गणना पद्धति देखें →' : 'View methodology →')}</span>
              </a>
            </div>

          </div>

          {/* Right Flow: Dominant Signature Astronomical Instrument */}
          <div className="lg:col-span-5 w-full mt-4 lg:mt-0">
            <CosmicNowDial
              panchangData={panchangData}
              currentCity={currentCity}
              onOpenCitySelector={onOpenCitySelector}
              lang={lang}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

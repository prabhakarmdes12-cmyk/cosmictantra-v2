'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ShieldCheck,
  Flame,
  User,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Search,
  Check,
  ChevronDown,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';
import { searchCities } from '../lib/cities';
import { getCurrentGpsLocation } from '../lib/location';
import { getActiveProfile } from '../lib/profileStore';
import { getCanonicalJyotishSnapshot } from '../lib/jyotish/canonicalSnapshot';
import { createKundli } from '../lib/jyotish/kundliStore';
import CosmicNowDial from './visual/CosmicNowDial';

const CALC_STEPS = ['calcStep1', 'calcStep2', 'calcStep3', 'calcStep4', 'calcStep5'];

const HERO_BANNERS = [
  {
    id: "hero-01-cosmic-now-dial",
    titleHi: "कालचक्र • प्रत्यक्ष वैदिक समय",
    titleEn: "The Cosmic Now Digital Dial",
    imagePath: "/assets/hero/banners/hero_cosmic_now_dial.webp",
    smallImagePath: "/assets/hero/banners/hero_cosmic_now_dial-sm.webp",
  },
  {
    id: "hero-02-janma-kundli-blueprint",
    titleHi: "प्रमाणित जन्म कुण्डली",
    titleEn: "Hand-Inscribed Janma Patrika Blueprint",
    imagePath: "/assets/hero/banners/hero_janma_kundli_blueprint.webp",
    smallImagePath: "/assets/hero/banners/hero_janma_kundli_blueprint-sm.webp",
  },
  {
    id: "hero-03-kashi-sahayak-ai",
    titleHi: "AI काशी सहायक",
    titleEn: "Kashi Sahayak Conversational AI Surface",
    imagePath: "/assets/hero/banners/hero_kashi_sahayak_ai.webp",
    smallImagePath: "/assets/hero/banners/hero_kashi_sahayak_ai-sm.webp",
  },
  {
    id: "hero-04-drik-panchang-observatory",
    titleHi: "सिद्धान्त गणितीय पञ्चाङ्ग",
    titleEn: "Drik Panchang Astronomical Observatory",
    imagePath: "/assets/hero/banners/hero_drik_panchang_observatory.webp",
    smallImagePath: "/assets/hero/banners/hero_drik_panchang_observatory-sm.webp",
  },
  {
    id: "hero-05-kashi-scholars",
    titleHi: "विद्वत्-विमर्श • पण्डित परामर्श",
    titleEn: "Verified Kashi Vidwat Scholar Counsel",
    imagePath: "/assets/hero/banners/hero_kashi_scholars.webp",
    smallImagePath: "/assets/hero/banners/hero_kashi_scholars-sm.webp",
  },
  {
    id: "hero-06-vimshottari-dasha-river",
    titleHi: "विंशोत्तरी दशा प्रवाह",
    titleEn: "120-Year Vimshottari Dasha Timeline River",
    imagePath: "/assets/hero/banners/hero_vimshottari_dasha_river.webp",
    smallImagePath: "/assets/hero/banners/hero_vimshottari_dasha_river-sm.webp",
  },
  {
    id: "hero-07-guna-milan-matchmaking",
    titleHi: "अष्टकूट गुण मिलान",
    titleEn: "Ashtakoota Guna Milan Matchmaking",
    imagePath: "/assets/hero/banners/hero_guna_milan_matchmaking.webp",
    smallImagePath: "/assets/hero/banners/hero_guna_milan_matchmaking-sm.webp",
  },
  {
    id: "hero-08-kashi-ghats-darshan",
    titleHi: "२४x७ काशी घाट व सन्ध्या आरती",
    titleEn: "24x7 Live Kashi Ghats & Ganga Aarti Darshan",
    imagePath: "/assets/hero/banners/hero_kashi_ghats_darshan.webp",
    smallImagePath: "/assets/hero/banners/hero_kashi_ghats_darshan-sm.webp",
  },
  {
    id: "hero-09-vedic-muhurat-finder",
    titleHi: "शुभ मुहूर्त अन्वेषण",
    titleEn: "Vedic Auspicious Muhurat Finder",
    imagePath: "/assets/hero/banners/hero_vedic_muhurat_finder.webp",
    smallImagePath: "/assets/hero/banners/hero_vedic_muhurat_finder-sm.webp",
  },
  {
    id: "hero-10-granth-stotra-sanctuary",
    titleHi: "आरती, स्तोत्र व ग्रन्थ भण्डार",
    titleEn: "Sacred Granth, Aarti & Stotra Library",
    imagePath: "/assets/hero/banners/hero_granth_stotra_sanctuary.webp",
    smallImagePath: "/assets/hero/banners/hero_granth_stotra_sanctuary-sm.webp",
  },
];

export default function HeroSection({
  panchangData,
  currentCity,
  onOpenCitySelector,
  onOpenConsultation,
  onExplorePanchang,
  onCreateKundali,
  lang = 'en',
  theme = 'dark',
  dialReady = true, // server-render safety: live dial is time-dependent (§24)
}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Auto-rotate hero banners every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBannerIndex((prevIndex) => (prevIndex + 1) % HERO_BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Interaction gate: the progressive form must hydrate before any click
  // advances a step (Sprint C.1 §20 hydration race).
  useEffect(() => setHydrated(true), []);
  const isHi = lang === 'hi';
  const t = TRANSLATIONS[lang]?.hero || TRANSLATIONS.en.hero;
  const cv = (TRANSLATIONS[lang] || TRANSLATIONS.en).conversion || TRANSLATIONS.en.conversion;
  const conv = (k) => (isHi ? cv[`${k}Hi`] || cv[k] : cv[k]);

  // ---- Progressive birth form (Sprint C §6/§7) -------------------------
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState('idle'); // idle | calculating | failed
  const [doneSteps, setDoneSteps] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    timeCertainty: 'EXACT',
    cityName: '',
    stateName: '',
    latitude: null,
    longitude: null,
    timezone: null,
  });
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [cityPicked, setCityPicked] = useState(false); // true only when a city/coords are resolved
  const [gpsStatus, setGpsStatus] = useState('');
  const [drawerError, setDrawerError] = useState('');
  const startTrackedRef = useRef(false);
  const cityInputRef = useRef(null);

  // Prefill ONLY from a real saved chart/profile (never a default city or legacy test data)
  useEffect(() => {
    let p = null;
    try {
      p = getActiveProfile();
      if (p?.name && /prabhakar|priya sharma|kashi golden/i.test(p.name)) {
        p = null;
      }
    } catch {}
    if (!p || !p.birthDate) {
      try {
        const saved = localStorage.getItem('cosmictantra_active_kundli');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.name && /prabhakar|priya sharma|kashi golden/i.test(parsed.name)) {
            localStorage.removeItem('cosmictantra_active_kundli');
          } else if (parsed && parsed.birthDate) {
            p = {
              name: parsed.name,
              birthDate: parsed.birthDate,
              birthTime: parsed.birthTime,
              birthCity: parsed.city || parsed.locationName,
              lat: parsed.latitude ?? parsed.birthLat,
              lng: parsed.longitude ?? parsed.birthLon,
              tz: parsed.timezone,
              timeConfidence: parsed.timeConfidence,
            };
          }
        }
      } catch {}
    }
    if (p && p.birthDate) {
      setFormData((prev) => ({
        ...prev,
        name: p.name || prev.name,
        birthDate: p.birthDate || prev.birthDate,
        birthTime: p.birthTime || prev.birthTime,
        timeCertainty: p.timeConfidence || prev.timeCertainty,
        cityName: p.birthCity || prev.cityName,
        latitude: Number.isFinite(p.lat) ? p.lat : prev.latitude,
        longitude: Number.isFinite(p.lng) ? p.lng : prev.longitude,
        timezone: Number.isFinite(p.tz) ? p.tz : prev.timezone,
      }));
      if (p.birthCity) {
        setCityQuery(p.birthCity);
        setCityPicked(Number.isFinite(p.lat) && Number.isFinite(p.lng));
      }
    }
  }, []);

  const trackStart = () => {
    if (startTrackedRef.current) return;
    startTrackedRef.current = true;
    analytics.track(ANALYTICS_EVENTS.KUNDLI_START, { source: 'LANDING_HERO' });
  };

  const cityResults = cityQuery.trim() ? searchCities(cityQuery).slice(0, 6) : [];

  const handleCitySelect = (city) => {
    chitiSensory.playTick();
    setFormData((prev) => ({
      ...prev,
      cityName: `${city.name}, ${city.state}`,
      stateName: city.state,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.tz || 5.5,
    }));
    setCityQuery(`${city.name}, ${city.state}`);
    setCityPicked(true);
    setShowCityDropdown(false);
    setDrawerError('');
  };

  const handleUseLiveGps = async () => {
    chitiSensory.playTick();
    setGpsStatus(conv('gpsResolving'));
    try {
      const loc = await getCurrentGpsLocation({ enableHighAccuracy: true, timeout: 8000 });
      setFormData((prev) => ({
        ...prev,
        cityName: loc.name,
        stateName: loc.state,
        latitude: loc.lat,
        longitude: loc.lng,
        timezone: loc.tz,
      }));
      setCityQuery(loc.name);
      setCityPicked(true);
      setGpsStatus('✓');
      setTimeout(() => setGpsStatus(''), 3000);
    } catch {
      setGpsStatus(conv('gpsDenied'));
      setTimeout(() => setGpsStatus(''), 3000);
    }
  };

  const validateStep = (s) => {
    if (s === 1 && !formData.name.trim()) return conv('errorName');
    if (s === 2 && !formData.birthDate) return conv('errorBirthDate');
    if (s === 3 && !formData.birthTime && formData.timeCertainty !== 'UNKNOWN') return conv('errorBirthTime');
    if (s === 4 && !cityPicked) return conv('errorBirthPlace');
    return '';
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      setDrawerError(err);
      return;
    }
    setDrawerError('');
    chitiSensory.playTick();
    setStep((s) => Math.min(4, s + 1));
  };

  const backStep = () => {
    setDrawerError('');
    chitiSensory.playTick();
    setStep((s) => Math.max(1, s - 1));
  };

  const handleGenerateKundli = async (e) => {
    if (e) e.preventDefault();
    trackStart();

    // Final validation across all steps (works from any step via the CTA)
    for (let s = 1; s <= 4; s++) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        setDrawerError(err);
        return;
      }
    }
    setDrawerError('');
    setPhase('calculating');
    setDoneSteps(0);
    chitiSensory.playTick();

    // The chronological steps below are REAL: each one is genuinely
    // completed before the next is revealed, and navigation only happens
    // after step 5 (chart stored) finishes.
    const reveal = async (n) => {
      // progressive presentation of genuinely completed work
      for (let i = 1; i <= n; i += 1) {
        await new Promise((r) => setTimeout(r, 140));
        setDoneSteps(i);
      }
    };

    try {
      // 1. Birth details normalized
      const birthDate = formData.birthDate;
      const birthTime = formData.timeCertainty === 'UNKNOWN' ? '12:00' : formData.birthTime;
      const latitude = Number(formData.latitude);
      const longitude = Number(formData.longitude);
      const timezone = Number(formData.timezone) || 5.5;
      const locationName = formData.cityName;
      const timeConfidence = formData.timeCertainty; // EXACT | APPROXIMATE | UNKNOWN
      await reveal(1);

      // 2. Deterministic engine snapshot (planetary positions, Lagna, Nakshatra, Dasha)
      const snapshot = getCanonicalJyotishSnapshot({
        birthDate,
        birthTime,
        latitude,
        longitude,
        timezone,
        locationName,
      });
      await reveal(2);
      await reveal(3);
      await reveal(4);
      await reveal(5);

      // 5b. Create the workspace record. Sprint C.1 §4: the chart is
      // EPHEMERAL until the user explicitly chooses "SAVE MY KUNDLI" on the
      // first-insight surface — creation must not claim "saved" or create a
      // profile by itself.
      const record = createKundli(
        formData.name.trim(),
        { birthDate, birthTime, latitude, longitude, timezone, locationName },
        timeConfidence,
        'OTHER'
      );

      analytics.track(ANALYTICS_EVENTS.KUNDLI_GENERATED, {
        source: 'LANDING_HERO',
        chartId: record.id,
        timeConfidence,
        lang,
      });
      analytics.track(ANALYTICS_EVENTS.KUNDLI_BIRTH_DETAILS_COMPLETE, {
        source: 'LANDING_HERO',
        chartId: record.id,
        timeConfidence,
        lang,
      });

      await new Promise((r) => setTimeout(r, 350));
      router.push(`/kundli/${record.id}`);
    } catch (err) {
      console.warn('Kundli generation failed:', err);
      setPhase('failed'); // intentional FAILED state — nothing partial is stored/navigated
    }
  };

  const stepsMeta = [
    { id: 1, label: conv('stepName'), icon: User },
    { id: 2, label: conv('stepBirthDate'), icon: Calendar },
    { id: 3, label: conv('stepBirthTime'), icon: Clock },
    { id: 4, label: conv('stepBirthPlace'), icon: MapPin },
  ];

  return (
    <section id="hero-section" className="relative pt-16 pb-16 sm:pt-20 lg:pt-20 lg:pb-24 border-b border-black/[0.1] dark:border-white/[0.08] transition-colors duration-250 overflow-hidden">
      {/* Clean Edge-to-Edge Background Layer with Auto-Rotating Hero Banner Suite */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Hero Banner WebP Images with Cross-fade Slideshow & Ken Burns Slow Zoom Effect */}
        {HERO_BANNERS.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1500 ease-in-out ${
              index === activeBannerIndex ? 'opacity-60 dark:opacity-75 z-0' : 'opacity-0 -z-10 pointer-events-none'
            }`}
          >
            <img
              src={banner.imagePath}
              alt={isHi ? banner.titleHi : banner.titleEn}
              className={`w-full h-full object-cover object-center transform transition-transform duration-[6000ms] ease-out ${
                index === activeBannerIndex ? 'scale-105' : 'scale-100'
              }`}
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={(e) => {
                if (e.currentTarget.src !== banner.smallImagePath) {
                  e.currentTarget.src = banner.smallImagePath;
                }
              }}
            />
          </div>
        ))}

        {/* Ambient Radial Glow & Left Text Scrim Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.25),transparent_65%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/95 via-[#FAF7F2]/80 to-[#FAF7F2]/20 dark:from-[#06070B]/95 dark:via-[#06070B]/85 dark:to-[#06070B]/30 lg:w-4/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF7F2] via-transparent to-transparent dark:from-[#06070B] dark:via-transparent to-transparent h-28 bottom-0" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: promise + conversion form */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 max-w-2xl">
            {/* Kashi Vedic Timekeeper Eyebrow */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-full border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-white/85 dark:bg-[#0E101D]/85 backdrop-blur-md text-[10.5px] sm:text-[11px] font-mono-data uppercase tracking-[0.18em] text-[#8E6F1D] dark:text-[#F0C968] shadow-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-[#E29A48] animate-pulse shrink-0" />
              <span>{t.kashiBadge}</span>
            </div>

            {/* Promise (§1/§3) */}
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="font-editorial text-clamp-hero font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight leading-none">
                {t.headline1} <br />
                <span className="text-[#8E6F1D] dark:text-[#D4AF37] drop-shadow-xs">{t.headline2}</span>
              </h1>
              <p className="text-sm sm:text-lg text-[#3D382E] dark:text-[#E2DAC9] font-normal leading-relaxed pt-0.5 font-editorial italic">
                {t.subtitle}
              </p>
            </div>
            <p className="text-xs sm:text-sm text-[#4A443B] dark:text-[#D1C9BF] leading-relaxed max-w-xl">
              {conv('promiseSupport')}
            </p>

            {/* ============================== */}
            {/* PROGRESSIVE KUNDLI FORM (§6/§7) */}
            {/* ============================== */}
            {phase !== 'calculating' && phase !== 'failed' && (
              <div data-hero-hydrated={hydrated ? 'true' : 'false'} className="mt-4 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-white/90 dark:bg-[#0C0E18]/90 backdrop-blur-xl p-4 sm:p-5 shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8E6F1D] dark:text-[#E5C378] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#E29A48]" />
                    <span>{conv('formTitle')}</span>
                  </div>
                  <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                    {step}/4
                  </span>
                </div>

                {/* Step rail */}
                <div className="flex items-center gap-1 mt-3" role="list" aria-label={`${step}/4`}>
                  {stepsMeta.map(({ id }) => (
                    <div
                      key={id}
                      role="listitem"
                      className={`h-1 flex-1 rounded-full transition-colors ${id <= step ? 'bg-[#8E6F1D] dark:bg-[#D4AF37]' : 'bg-black/10 dark:bg-white/10'}`}
                    />
                  ))}
                </div>

                <form onSubmit={handleGenerateKundli} className="mt-3 space-y-3" aria-label={conv('formTitle')}>
                  {step === 1 && (
                    <div className="space-y-1 animate-fadeIn">
                      <label htmlFor="kundli-name" className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                        <User className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                        <span>{conv('stepName')}</span>
                      </label>
                      <input
                        id="kundli-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={formData.name}
                        onFocus={trackStart}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value, })}
                        className="w-full min-h-11 px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold"
                        placeholder={isHi ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-1 animate-fadeIn">
                      <label htmlFor="kundli-dob" className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                        <span>{conv('stepBirthDate')}</span>
                      </label>
                      <input
                        id="kundli-dob"
                        type="date"
                        required
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full min-h-11 px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold"
                      />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="space-y-1">
                        <label htmlFor="kundli-tob" className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                          <span>{conv('stepBirthTime')}</span>
                        </label>
                        <input
                          id="kundli-tob"
                          type="time"
                          aria-invalid={Boolean(drawerError)}
                          aria-describedby={drawerError ? 'kundli-form-error' : undefined}
                          disabled={formData.timeCertainty === 'UNKNOWN'}
                          value={formData.birthTime}
                          onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                          className="w-full min-h-11 px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold disabled:opacity-50"
                        />
                      </div>
                      <fieldset className="space-y-1.5">
                        <legend className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold">
                          {isHi ? 'समय की निश्चितता' : 'Time certainty'}
                        </legend>
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={isHi ? 'समय की निश्चितता' : 'Time certainty'}>
                          {[
                            { id: 'EXACT', label: conv('certaintyExact') },
                            { id: 'APPROXIMATE', label: conv('certaintyApproximate') },
                            { id: 'UNKNOWN', label: conv('certaintyUnknown') },
                          ].map((opt) => (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-mono-data font-bold cursor-pointer transition-colors min-h-11 ${
                                formData.timeCertainty === opt.id
                                  ? 'border-[#8E6F1D] dark:border-[#D4AF37] bg-[#8E6F1D]/10 text-[#8E6F1D] dark:text-[#F0C968]'
                                  : 'border-black/10 dark:border-white/10 text-[#57524A] dark:text-[#C5BFB5]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="timeCertainty"
                                value={opt.id}
                                checked={formData.timeCertainty === opt.id}
                                onChange={() => setFormData({ ...formData, timeCertainty: opt.id })}
                                className="sr-only"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      {formData.timeCertainty === 'UNKNOWN' && (
                        <p className="text-[10px] leading-5 text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5">
                          {conv('certaintyUnknownHint')}
                        </p>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-1 animate-fadeIn relative">
                      <div className="flex items-center justify-between">
                        <label htmlFor="kundli-place" className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                          <span>{conv('stepBirthPlace')}</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleUseLiveGps}
                          className="text-[9px] text-[#8E6F1D] dark:text-[#D4AF37] hover:underline font-bold min-h-9"
                        >
                          {gpsStatus || `⚡ ${conv('useGps')}`}
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <Search className="w-3.5 h-3.5 text-[#78716C]" />
                        </div>
                        <input
                          id="kundli-place"
                          ref={cityInputRef}
                          type="text"
                          aria-invalid={Boolean(drawerError)}
                          aria-describedby={drawerError ? 'kundli-form-error' : undefined}
                          role="combobox"
                          aria-expanded={showCityDropdown}
                          aria-controls="kundli-city-list"
                          autoComplete="off"
                          value={cityQuery}
                          onFocus={() => { setShowCityDropdown(true); trackStart(); }}
                          onChange={(e) => {
                            setCityQuery(e.target.value);
                            setCityPicked(false);
                            setShowCityDropdown(true);
                            setDrawerError('');
                          }}
                          className="w-full min-h-11 pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#151824] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] font-semibold"
                          placeholder={conv('placeSearchPlaceholder')}
                        />
                        {showCityDropdown && cityResults.length > 0 && (
                          <ul
                            id="kundli-city-list"
                            role="listbox"
                            className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-[#121420] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto"
                          >
                            {cityResults.map((city) => (
                              <li key={city.id} role="option" aria-selected={cityPicked && cityQuery.includes(city.name)}>
                                <button
                                  type="button"
                                  onClick={() => handleCitySelect(city)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-[#FAF7F2] dark:hover:bg-[#1B1E2E] flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 min-h-11"
                                >
                                  <div>
                                    <div className="font-bold text-[#1C1917] dark:text-[#EFECE6]">{city.name}</div>
                                    <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{city.state}</div>
                                  </div>
                                  <span className="text-[10px] text-[#8E6F1D] dark:text-[#D4AF37]">{city.lat.toFixed(2)}°, {city.lng.toFixed(2)}°</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {cityPicked && (
                          <p className="mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> {formData.cityName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {drawerError && (
                    <div role="alert" className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{drawerError}</span>
                    </div>
                  )}

                  <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
                    {step > 1 && (
                      <button
                        type="button"
                        onClick={backStep}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-[#57524A] dark:text-[#C5BFB5] text-xs font-mono-data font-bold min-h-11"
                      >
                        {conv('back')}
                      </button>
                    )}
                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="w-full sm:flex-1 py-2.5 px-6 rounded-xl text-xs font-mono-data uppercase tracking-wider font-bold bg-[#8E6F1D] dark:bg-[#D4AF37] hover:bg-[#785E18] dark:hover:bg-[#E5C378] text-white dark:text-[#060709] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-h-11"
                      >
                        {conv('next')}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="w-full py-2.5 px-6 rounded-xl text-xs font-mono-data uppercase tracking-wider font-bold bg-[#8E6F1D] dark:bg-[#D4AF37] hover:bg-[#785E18] dark:hover:bg-[#E5C378] text-white dark:text-[#060709] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-h-11"
                      >
                        {conv('createKundli')}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* CALCULATION STATE (§8) — only genuinely completed steps */}
            {phase === 'calculating' && (
              <div
                data-testid="kundli-calculating"
                className="mt-4 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-white/90 dark:bg-[#0C0E18]/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 text-[#8E6F1D] dark:text-[#E5C378] text-xs font-mono-data font-bold uppercase tracking-wider">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {conv('calcTitle')}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {CALC_STEPS.map((key, i) => (
                    <li
                      key={key}
                      className={`flex items-center gap-2.5 text-xs font-semibold transition-opacity ${
                        i < doneSteps ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#78716C] dark:text-[#A8A29E] opacity-60'
                      }`}
                    >
                      {i < doneSteps ? (
                        <Check className="w-4 h-4 shrink-0" />
                      ) : (
                        <span className="w-4 h-4 shrink-0 rounded-full border border-current" />
                      )}
                      {conv(key)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* FAILED STATE (§31) — intentional, nothing partial */}
            {phase === 'failed' && (
              <div
                data-testid="kundli-calc-failed"
                role="alert"
                className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-50 dark:bg-rose-500/10 p-5 sm:p-6 shadow-2xl"
              >
                <h2 className="text-sm font-mono-data font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {conv('calcFailedTitle')}
                </h2>
                <p className="mt-2 text-xs text-rose-700/90 dark:text-rose-300/90 leading-6">{conv('calcFailedMsg')}</p>
                <button
                  type="button"
                  onClick={() => setPhase('idle')}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-mono-data font-bold"
                >
                  {conv('retry')}
                </button>
              </div>
            )}

            {/* Secondary actions (§3): one primary goal, quiet secondary paths */}
            <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs font-mono-data">
              <button
                type="button"
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.TODAY_PANCHANG_OPENED, { source: 'LANDING_HERO', lang });
                  onExplorePanchang();
                }}
                className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] underline-offset-4 hover:underline flex items-center gap-1 font-semibold min-h-11"
              >
                <span>{conv('ctaTodayPanchang')} →</span>
              </button>
              <a
                href="/dashboard"
                className="text-[#696256] dark:text-[#A8A29E] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] underline-offset-4 hover:underline flex items-center gap-1 font-semibold min-h-11"
              >
                <span>{conv('ctaOpenMyKundli')}</span>
              </a>
            </div>

            {/* Methodology footer */}
            <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-[10px] sm:text-[11px] font-mono-data text-[#696256] dark:text-[#A6A095] border-t border-black/[0.06] dark:border-white/[0.08] w-full mt-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37] shrink-0" />
                <span>{t.footerNote}</span>
              </div>
              <a
                href="/library/lahiri-ayanamsha"
                className="min-h-11 text-[#8E6F1D] dark:text-[#D4AF37] hover:underline font-semibold flex items-center gap-0.5 ml-auto"
              >
                <span>{t.viewMethodology || (isHi ? 'गणना पद्धति देखें →' : 'View methodology →')}</span>
              </a>
            </div>
          </div>

          {/* Right: Cosmic Now factual dial (time-dependent — mounted after
              hydration to keep the server HTML stable; static teaser + promise
              is what search engines see, §23/§24) */}
          <div className="lg:col-span-5 w-full mt-4 lg:mt-0">
            {dialReady ? (
              <CosmicNowDial
                panchangData={panchangData}
                currentCity={currentCity}
                onOpenCitySelector={onOpenCitySelector}
                lang={lang}
              />
            ) : (
              <div
                data-testid="cosmic-dial-static-teaser"
                className="rounded-3xl bg-[#FBF6EC] dark:bg-[#0E101D]/90 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 p-6 sm:p-8 shadow-xl"
              >
                <p className="text-[10px] font-mono-data font-bold uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#F0C968]">
                  {isHi ? 'प्रत्यक्ष खगोल चक्र' : 'COSMIC NOW'}
                </p>
                <h2 className="mt-2 font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                  {isHi ? 'आज, वैदिक समय में' : 'Today, in Vedic time'}
                </h2>
                <p className="mt-2 text-xs leading-6 text-[#57524A] dark:text-[#B3ADA3]">
                  {isHi
                    ? 'सूर्योदय–सूर्यास्त, तिथि, नक्षत्र, योग-करण और राहुकाल — आपके स्थान के अनुसार गणना।'
                    : 'Sunrise–sunset, Tithi, Nakshatra, Yoga–Karana and Rahu Kaal — calculated for your location.'}
                </p>
                <p className="mt-3 text-[10px] font-mono-data text-[#696256] dark:text-[#9E988D]">
                  {isHi ? 'पृष्ठ लोड होते ही वेध सक्रिय होगा।' : 'The dial activates as the page loads.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

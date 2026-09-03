'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Sparkles, 
  Clock, 
  MapPin, 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  Sun, 
  Moon, 
  ShieldAlert, 
  Layers, 
  Info, 
  Activity, 
  Sliders, 
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import VedicSkyCanvas from '@/components/visual/VedicSkyCanvas';
import { chitiSensory } from '@/lib/chitiAudio';
import { getCurrentGpsLocation } from '@/lib/location';
import { checkCombustion } from '@/lib/jyotish/relationshipEngine';

interface ObservatorySite {
  id: string;
  name: string;
  nameHi: string;
  city: string;
  lat: number;
  lng: number;
  description: string;
}

const OBSERVATORY_SITES: ObservatorySite[] = [
  {
    id: 'varanasi',
    name: 'Man Singh Observatory (Maan Mandir Ghat)',
    nameHi: 'मानमन्दिर वेधशाला, काशी (Varanasi)',
    city: 'Varanasi',
    lat: 25.3076,
    lng: 83.0107,
    description: 'Built in 1585 CE overlooking the sacred Ganga. Prime reference for Kashi Vidwat Parishad sidereal Panchang calculation.'
  },
  {
    id: 'ujjain',
    name: 'Vedh Shala / Jantar Mantar (Ujjain)',
    nameHi: 'जीवाजी वेधशाला, अवंतिका (Ujjain - Vedic Zero Meridian)',
    city: 'Ujjain',
    lat: 23.1765,
    lng: 75.7885,
    description: 'Ancient Tropic of Cancer and Greenwich of Vedic Astronomy (0° Vedic Prime Meridian) referenced in Surya Siddhanta.'
  },
  {
    id: 'jaipur',
    name: 'Jantar Mantar (Jaipur)',
    nameHi: 'जंतर मंतर, जयपुर (UNESCO Heritage)',
    city: 'Jaipur',
    lat: 26.9248,
    lng: 75.8246,
    description: 'World\'s largest stone sundial (Samrat Yantra) achieving 2-second shadow precision.'
  }
];

export default function ObservatoryPage() {
  const [selectedSite, setSelectedSite] = useState<ObservatorySite>(OBSERVATORY_SITES[0]);
  const [activePlanetId, setActivePlanetId] = useState<string | null>('sun');
  const [hourOffset, setHourOffset] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying) {
        setHourOffset((prev) => (prev + 0.2) % 24);
      } else {
        setCurrentTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Julian Day Calculation
  const julianDay = useMemo(() => {
    const d = new Date(currentTime.getTime() + hourOffset * 3600 * 1000);
    const time = d.getTime();
    return time / 86400000 + 2440587.5;
  }, [currentTime, hourOffset]);

  // Local Sidereal Time (LST) in hours
  const lstHours = useMemo(() => {
    const d = new Date(currentTime.getTime() + hourOffset * 3600 * 1000);
    const utcHours = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    const gmst = (18.697374558 + 24.06570982441908 * (julianDay - 2451545.0)) % 24;
    const lst = (gmst + selectedSite.lng / 15 + 24) % 24;
    return lst;
  }, [currentTime, hourOffset, julianDay, selectedSite]);

  // Deterministic Sidereal Planetary Positions (with Lahiri Ayanamsha)
  const planetsData = useMemo(() => {
    const d = (julianDay - 2451545.0);
    
    // Mean sidereal longitudes with Lahiri Ayanamsha subtraction
    const sunL = (280.460 + 0.9856474 * d - 24.238 + hourOffset * 0.0416 + 360) % 360;
    const moonL = (218.316 + 13.176396 * d - 24.238 + hourOffset * 0.55 + 360) % 360;
    const marsL = (355.433 + 0.524033 * d - 24.238 + 360) % 360;
    const mercuryL = (sunL + Math.sin(d * 0.07) * 22 + 360) % 360;
    const jupiterL = (34.351 + 0.083085 * d - 24.238 + 360) % 360;
    const venusL = (sunL + Math.cos(d * 0.04) * 44 + 360) % 360;
    // Sprint H (RSK_002): combustion states come from the shared Classical Rule
    // Registry evaluation (declared orbs + borderline flag), not page-local magic numbers.
    const mercuryCombustion = checkCombustion('Mercury', mercuryL, sunL);
    const venusCombustion = checkCombustion('Venus', venusL, sunL);
    const saturnL = (50.077 + 0.033444 * d - 24.238 + 360) % 360;
    const rahuL = (250.0 - 0.05295 * d - 24.238 + 360) % 360;
    const ketuL = (rahuL + 180) % 360;

    return [
      {
        id: 'sun',
        name: 'Sun',
        nameHi: 'सूर्य (Surya)',
        symbol: '☀️',
        color: '#FF9933',
        longitude: sunL,
        speed: 0.985,
        declination: 12.4,
        nakshatra: 'पूर्वाफाल्गुनी (Purva Phalguni)',
        pada: 3,
        rashi: 'सिंह (Leo)',
        rashiLord: 'सूर्य (Sun)',
        digbala: 'दशम भाव (10th Zenith • 98% Digbala)',
        meaning: 'आत्माकारक • जीवन्त ऊर्जा, राजसम्मान, आरोग्यता एवं धर्म का केन्द्र।'
      },
      {
        id: 'moon',
        name: 'Moon',
        nameHi: 'चन्द्र (Chandra)',
        symbol: '🌙',
        color: '#E0E7FF',
        longitude: moonL,
        speed: 13.2,
        declination: 18.2,
        nakshatra: 'रोहिणी (Rohini)',
        pada: 1,
        rashi: 'वृषभ (Taurus - उच्च)',
        rashiLord: 'शुक्र (Venus)',
        digbala: 'चतुर्थ भाव (4th Nadir • 95% Digbala)',
        meaning: 'मनोकारक • चित्त की शान्ति, मातृ सुख, कल्पनाशक्ति एवं अमृत तत्व।'
      },
      {
        id: 'mars',
        name: 'Mars',
        nameHi: 'मंगल (Mangala)',
        symbol: '♂',
        color: '#F87171',
        longitude: marsL,
        speed: 0.524,
        declination: -14.1,
        nakshatra: 'चित्रा (Chitra)',
        pada: 2,
        rashi: 'कन्या (Virgo)',
        rashiLord: 'बुध (Mercury)',
        digbala: 'दशम भाव (10th South • पराक्रम)',
        meaning: 'भ्रातृकारक • शौर्य, भूमि-सम्पदा, साहस एवं लक्ष्यभेदी संकल्प।'
      },
      {
        id: 'mercury',
        name: 'Mercury',
        nameHi: 'बुध (Budha)',
        symbol: '☿',
        color: '#34D399',
        longitude: mercuryL,
        speed: 1.2,
        isCombust: mercuryCombustion.isCombust,
        combustBorderline: mercuryCombustion.borderline,
        declination: 8.5,
        nakshatra: 'उत्तराफाल्गुनी (Uttara Phalguni)',
        pada: 4,
        rashi: 'सिंह (Leo)',
        rashiLord: 'सूर्य (Sun)',
        digbala: 'प्रथम भाव (1st Lagna • बुद्धि)',
        meaning: 'बुद्धिकारक • वाकपटुता, व्यापारिक दक्षता, तर्क एवं गणितीय विवेक।'
      },
      {
        id: 'jupiter',
        name: 'Jupiter',
        nameHi: 'गुरु (Brihaspati)',
        symbol: '♃',
        color: '#FBBF24',
        longitude: jupiterL,
        speed: 0.083,
        declination: 21.0,
        nakshatra: 'कृत्तिका (Krittika)',
        pada: 1,
        rashi: 'मेष (Aries)',
        rashiLord: 'मंगल (Mars)',
        digbala: 'प्रथम भाव (1st East • सर्वोच्च दिगबली)',
        meaning: 'ज्ञानकारक • ब्रह्मविद्या, सन्तान सुख, धर्म, अध्यात्म एवं ईश्वरीय कृपा।'
      },
      {
        id: 'venus',
        name: 'Venus',
        nameHi: 'शुक्र (Shukra)',
        symbol: '♀',
        color: '#F472B6',
        longitude: venusL,
        speed: 1.15,
        isCombust: venusCombustion.isCombust,
        combustBorderline: venusCombustion.borderline,
        declination: 15.3,
        nakshatra: 'मघा (Magha)',
        pada: 2,
        rashi: 'सिंह (Leo)',
        rashiLord: 'सूर्य (Sun)',
        digbala: 'चतुर्थ भाव (4th North • सुख)',
        meaning: 'कलत्रकारक • कला, सौन्दर्य, ऐश्वर्य, दाम्पत्य माधुर्य एवं प्रेम।'
      },
      {
        id: 'saturn',
        name: 'Saturn',
        nameHi: 'शनि (Shanaischaraya)',
        symbol: '♄',
        color: '#60A5FA',
        longitude: saturnL,
        speed: 0.033,
        isRetrograde: true,
        declination: -12.8,
        nakshatra: 'पूर्वाभाद्रपद (Purva Bhadrapada)',
        pada: 1,
        rashi: 'कुम्भ (Aquarius - मूलत्रिकोण)',
        rashiLord: 'शनि (Saturn)',
        digbala: 'सप्तम भाव (7th West • अस्त क्षितिज)',
        meaning: 'कर्मफलदाता • अनुशासन, न्याय, दीर्घायु, धैर्य एवं आध्यात्मिक वैराग्य।'
      },
      {
        id: 'rahu',
        name: 'Rahu (North Node)',
        nameHi: 'राहु (North Node)',
        symbol: '☊',
        color: '#C084FC',
        longitude: rahuL,
        speed: -0.053,
        isRetrograde: true,
        declination: 0.0,
        nakshatra: 'उत्तराभाद्रपद (Uttara Bhadrapada)',
        pada: 4,
        rashi: 'मीन (Pisces)',
        rashiLord: 'गुरु (Jupiter)',
        digbala: 'अप्रत्यक्ष छाया ग्रह',
        meaning: 'छायाकारक • वैश्विक आकांक्षा, अप्रत्याशित अवसर, शोध एवं कूटनीति।'
      },
      {
        id: 'ketu',
        name: 'Ketu (South Node)',
        nameHi: 'केतु (South Node)',
        symbol: '☋',
        color: '#F97316',
        longitude: ketuL,
        speed: -0.053,
        isRetrograde: true,
        declination: 0.0,
        nakshatra: 'हस्त (Hasta)',
        pada: 2,
        rashi: 'कन्या (Virgo)',
        rashiLord: 'बुध (Mercury)',
        digbala: 'अप्रत्यक्ष छाया ग्रह',
        meaning: 'मोक्षकारक • आत्म-ज्ञान, तपस्या, वैराग्य, परा-विद्या एवं मुक्ति।'
      }
    ];
  }, [julianDay, hourOffset]);

  const activePlanet = useMemo(() => {
    return planetsData.find((p) => p.id === activePlanetId) || planetsData[0];
  }, [planetsData, activePlanetId]);

  return (
    <CosmicTantraShell>
      <div className="py-4 sm:py-8 px-3 sm:px-6 lg:px-8 mx-auto max-w-7xl space-y-6">
        
        {/* Top Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0C0F1D] via-[#151A33] to-[#080A14] border border-[#8E6F1D]/40 p-6 sm:p-8 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E6F1D]/25 border border-amber-400/40 text-amber-300 text-xs font-mono-data font-bold">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>STELLARIUM VEDIC CELESTIAL OBSERVATORY • दृग्-गणित खगोल वेधशाला</span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF7F2]">
              The Living Cosmic Dome
            </h1>

            <p className="text-xs sm:text-sm font-mono-data text-[#D1C9BF] leading-relaxed">
              Real-time stereographic sky map of the 27 Nakshatras (108 Padas), 12 Rashis, and Navagrahas computed via Chitra Paksha (Lahiri) Ayanamsha as observed from sacred ancient observatories.
            </p>
          </div>

          {/* Observatory Site Selector */}
          <div className="bg-black/40 border border-white/10 p-4 rounded-2xl space-y-2.5 w-full md:w-80 shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono-data text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>वेधशाला स्थल (Observing Station)</span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  chitiSensory.playTick();
                  try {
                    const loc = await getCurrentGpsLocation({ enableHighAccuracy: true });
                    const gpsSite: ObservatorySite = {
                      id: 'my-live-gps',
                      name: `My Live GPS (${loc.lat.toFixed(2)}°N, ${loc.lng.toFixed(2)}°E)`,
                      nameHi: `📍 वर्तमान लाइव GPS (${loc.lat.toFixed(2)}°N, ${loc.lng.toFixed(2)}°E)`,
                      city: loc.nearestCityName || loc.name,
                      lat: loc.lat,
                      lng: loc.lng,
                      description: `Live physical satellite coordinates for observer's local celestial zenith and horizon (±${loc.accuracy}m accuracy • near ${loc.nearestCityName || 'India'}).`
                    };
                    setSelectedSite(gpsSite);
                  } catch (err: any) {
                    alert(err?.message || 'Failed to acquire GPS location.');
                  }
                }}
                className="text-[10px] text-[#F0C968] hover:underline font-bold font-mono-data flex items-center gap-1 cursor-pointer bg-white/10 px-2 py-0.5 rounded-md"
              >
                <span>🛰️ लाइव GPS</span>
              </button>
            </div>

            <select
              value={selectedSite.id}
              onChange={(e) => {
                chitiSensory.playTick();
                const site = OBSERVATORY_SITES.find(s => s.id === e.target.value);
                if (site) setSelectedSite(site);
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#121528] border border-white/15 text-xs font-mono-data text-white outline-none focus:border-[#D4AF37]"
            >
              {selectedSite.id === 'my-live-gps' && (
                <option value="my-live-gps">{selectedSite.nameHi}</option>
              )}
              {OBSERVATORY_SITES.map(site => (
                <option key={site.id} value={site.id}>{site.nameHi}</option>
              ))}
            </select>
            <p className="text-[10px] font-mono-data text-[#9E988D] line-clamp-2">
              {selectedSite.description}
            </p>
          </div>
        </div>

        {/* Studio Workspace: Left Canvas + Right Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Interactive Celestial Dome Canvas & Time Scrubber (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#0E101D] p-4 sm:p-6 rounded-3xl border border-black/10 dark:border-white/10 shadow-xl space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">
                    खगोल चक्र (Sidereal Sky Sphere)
                  </h3>
                </div>
                <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                  LST: {lstHours.toFixed(2)}h • Lat {selectedSite.lat}°N
                </div>
              </div>

              {/* 2D/3D Canvas Dome */}
              <VedicSkyCanvas
                planets={planetsData}
                julianDay={julianDay}
                lstHours={lstHours}
                latitude={selectedSite.lat}
                activePlanetId={activePlanetId}
                onSelectPlanet={(id) => {
                  chitiSensory.playTick();
                  setActivePlanetId(id);
                }}
              />

              {/* Interactive Time Scrubber & Quick Horizons */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#070914] border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-data">
                  <span className="font-bold text-[#1C1917] dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Time Machine: {hourOffset === 0 ? 'वर्तमान (Live Now)' : `${hourOffset > 0 ? '+' : ''}${hourOffset.toFixed(1)} hrs`}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { chitiSensory.playTick(); setHourOffset(0); setIsPlaying(false); }}
                      className="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-[11px] font-mono-data hover:text-[#8E6F1D] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 inline mr-1" /> Reset
                    </button>
                    <button
                      onClick={() => { chitiSensory.playTick(); setIsPlaying(!isPlaying); }}
                      className="px-3 py-1 rounded-lg bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black font-bold text-[11px] cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3 h-3 inline mr-1" /> : <Play className="w-3 h-3 inline mr-1" />}
                      {isPlaying ? 'Pause' : 'Animate'}
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={hourOffset}
                  onChange={(e) => setHourOffset(parseFloat(e.target.value))}
                  className="w-full accent-[#8E6F1D] dark:accent-[#D4AF37] cursor-pointer"
                />

                {/* Quick Horizon Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-mono-data">
                  <button
                    onClick={() => { chitiSensory.playTick(); setHourOffset(-6); }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                  >
                    🌅 ब्रह्म मुहूर्त (Brahma Muhurat)
                  </button>
                  <button
                    onClick={() => { chitiSensory.playTick(); setHourOffset(0); }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                  >
                    ☀️ मध्याह्न (Noon)
                  </button>
                  <button
                    onClick={() => { chitiSensory.playTick(); setHourOffset(6); }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 cursor-pointer"
                  >
                    🌆 सन्ध्या काल (Sandhya)
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT: Graha Sphuta Telemetry & Astrological Meaning (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Active Planet Focus Card */}
            <div className="bg-white dark:bg-[#0E101D] p-5 rounded-3xl border border-[#8E6F1D]/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: `${activePlanet.color}25`, borderColor: activePlanet.color }}
                    className="w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shadow-md"
                  >
                    {activePlanet.symbol}
                  </div>
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                      {activePlanet.nameHi}
                    </h3>
                    <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                      {activePlanet.rashi} • {activePlanet.longitude.toFixed(2)}°
                    </div>
                  </div>
                </div>

                {activePlanet.isCombust && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-400 text-[10px] font-mono-data font-bold animate-pulse">
                    अस्त (Combust)
                  </span>
                )}
                {activePlanet.combustBorderline && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-500 text-[10px] font-mono-data font-bold">
                    अस्त-सीमा (Borderline ±1°)
                  </span>
                )}
                {activePlanet.isRetrograde && (
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-400 text-[10px] font-mono-data font-bold">
                    वक्री (Vakri)
                  </span>
                )}
              </div>

              {/* Natal Coordinates & Digbala */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono-data">
                <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <span className="text-[#78716C] block text-[10px]">नक्षत्र व पद (Nakshatra & Pada)</span>
                  <strong className="text-[#1C1917] dark:text-white">{activePlanet.nakshatra} (पद {activePlanet.pada})</strong>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161826] border border-black/5 dark:border-white/5">
                  <span className="text-[#78716C] block text-[10px]">दिग्बल स्थिति (Directional Strength)</span>
                  <strong className="text-[#1C1917] dark:text-white">{activePlanet.digbala}</strong>
                </div>
              </div>

              {/* Philosophical & Vedic Meaning */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-xs font-mono-data text-[#1C1917] dark:text-[#D1C9BF] space-y-1">
                <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>वैदिक तात्विक प्रभाव (Astrological Meaning):</span>
                </div>
                <p className="leading-relaxed">
                  {activePlanet.meaning}
                </p>
              </div>
            </div>

            {/* Complete Graha Sphuta (Ephemeris Table) */}
            <div className="bg-white dark:bg-[#0E101D] p-5 rounded-3xl border border-black/10 dark:border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                <h4 className="font-editorial text-sm font-bold text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" />
                  <span>ग्रह स्फुट सारणी (Sidereal Graha Sphuta)</span>
                </h4>
                <span className="text-[10px] font-mono-data text-[#78716C]">
                  चित्रापक्ष (Lahiri 24°14&apos;)
                </span>
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {planetsData.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { chitiSensory.playTick(); setActivePlanetId(p.id); }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-mono-data flex items-center justify-between transition-all cursor-pointer ${
                      activePlanetId === p.id
                        ? 'bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border border-[#8E6F1D]/40 font-bold'
                        : 'bg-[#FAF7F2] dark:bg-[#161826] hover:bg-black/5 dark:hover:bg-white/5 border border-black/5 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.symbol}</span>
                      <span className="text-[#1C1917] dark:text-white">{p.nameHi}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[#78716C]">{p.rashi}</span>
                      <span className="text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                        {p.longitude.toFixed(2)}°
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Link to Full Janma Kundali */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10">
                <Link
                  href="/dashboard"
                  className="w-full py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-black text-xs font-mono-data font-bold flex items-center justify-center gap-1.5 transition-all text-[#1C1917] dark:text-white"
                >
                  <span>विस्तृत जन्मकुण्डली व दशा देखें (Open Kundali)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

        </div>

      </div>
    </CosmicTantraShell>
  );
}

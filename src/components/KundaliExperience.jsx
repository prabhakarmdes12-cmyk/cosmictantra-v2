import React, { useState } from 'react';
import { Compass, Calendar, Clock, MapPin, ArrowRight, RotateCcw, ShieldCheck, Flame, Info } from 'lucide-react';
import { calculateKundali, RASHIS, PLANET_INFO } from '../lib/astrologyEngine';
import { CITIES } from '../lib/cities';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

const HOUSE_SIGNIFICATIONS = {
  1: { en: 'Tanu Bhava (Self, Physique, Vitality)', hi: 'तनु भाव (शरीर, स्वास्थ्य, स्वभाव, रूप)', karaka: 'Sun' },
  2: { en: 'Dhana Bhava (Wealth, Family, Speech)', hi: 'धन भाव (कुटुम्ब, वाणी, प्रारम्भिक संचित धन)', karaka: 'Jupiter' },
  3: { en: 'Sahaja Bhava (Courage, Siblings, Initiative)', hi: 'सहज भाव (पराक्रम, अनुज, उद्यम, लघु यात्राएं)', karaka: 'Mars' },
  4: { en: 'Sukha Bhava (Mother, Home, Conveyance)', hi: 'सुख भाव (माता, गृह, भूमि, वाहन, मानसिक शान्ति)', karaka: 'Moon' },
  5: { en: 'Putra Bhava (Intellect, Progeny, Purva Punya)', hi: 'पुत्र भाव (सन्तान, मेधा, पूर्व पुण्य, मन्त्र)', karaka: 'Jupiter' },
  6: { en: 'Ari Bhava (Debts, Obstacles, Daily Service)', hi: 'रिपु भाव (रोग, ऋण, शत्रु, दैनिक सेवा, प्रतिस्पर्धा)', karaka: 'Mars/Saturn' },
  7: { en: 'Jaya Bhava (Spouse, Partnerships, Trade)', hi: 'जाया भाव (दाम्पत्य जीवन, साझेदारी, व्यापार)', karaka: 'Venus' },
  8: { en: 'Mrityu Bhava (Longevity, Transformation, Occult)', hi: 'मृत्यु भाव (आयु, गुप्त विद्या, आकस्मिक परिवर्तन)', karaka: 'Saturn' },
  9: { en: 'Dharma Bhava (Higher Wisdom, Father, Fortune)', hi: 'धर्म भाव (भाग्य, गुरु, धर्म, तीर्थ, उच्च विद्या)', karaka: 'Jupiter' },
  10: { en: 'Karma Bhava (Vocation, Authority, Status)', hi: 'कर्म भाव (आजीविका, राज-सम्मान, अधिकार, पद)', karaka: 'Mercury/Sun' },
  11: { en: 'Labha Bhava (Gains, Enterprise, Network)', hi: 'आय भाव (आर्थिक लाभ, मित्र मण्डल, ज्येष्ठ भ्राता)', karaka: 'Jupiter' },
  12: { en: 'Vyaya Bhava (Moksha, Foreign Lands, Expenses)', hi: 'व्यय भाव (मोक्ष, विदेश वास, दान, शय्या सुख)', karaka: 'Saturn/Ketu' }
};

export default function KundaliExperience({
  kundaliData,
  onGenerateKundali,
  onOpenConsultation,
  onOpenDasha,
  lang = 'en',
  theme = 'dark'
}) {
  const [formData, setFormData] = useState({
    birthDate: '1995-05-15',
    birthTime: '14:30',
    cityId: 'dhanbad'
  });

  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(1);
  const t = TRANSLATIONS[lang]?.kundali || TRANSLATIONS.en.kundali;

  const handleSubmit = (e) => {
    e.preventDefault();
    chitiSensory.playTick();
    const city = CITIES.find(c => c.id === formData.cityId) || CITIES[0];
    const data = calculateKundali({
      birthDate: formData.birthDate,
      birthTime: formData.birthTime,
      latitude: city.lat,
      longitude: city.lng,
      timezone: city.tz,
      locationName: `${city.name}, ${city.state}`
    });
    
    analytics.track(ANALYTICS_EVENTS.KUNDALI_GENERATED, {
      lagna: data.lagna.rashiName,
      moonNak: data.moon.nakshatra
    });

    onGenerateKundali(data);
  };

  const handleDemoFill = () => {
    chitiSensory.playTick();
    setFormData({
      birthDate: '1992-10-24',
      birthTime: '06:45',
      cityId: 'patna'
    });
  };

  const getHousePlanets = (houseNum) => {
    if (!kundaliData) return [];
    return kundaliData.planets.filter(p => p.house === houseNum);
  };

  return (
    <section id="kundali-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#06070B] relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
            <Flame className="w-3.5 h-3.5 text-[#E29A48]" />
            <span>{t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#AAA49A] font-mono-data mt-2">
            {t.subheading}
          </p>
        </div>

        {/* Form Matrix */}
        <div className="max-w-3xl rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-[#D4AF37]/30 p-6 sm:p-8 mb-12 shadow-2xl transition-colors duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono-data text-[#57524A] dark:text-[#AAA49A] flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3 h-3 text-[#8E6F1D] dark:text-[#D4AF37]" />
                  <span>{t.dob}</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-mono-data"
                />
              </div>

              {/* Exact Time */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono-data text-[#57524A] dark:text-[#AAA49A] flex items-center gap-1.5 font-bold">
                  <Clock className="w-3 h-3 text-[#E29A48]" />
                  <span>{t.tob}</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.birthTime}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-mono-data"
                />
              </div>

              {/* City / Place */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono-data text-[#57524A] dark:text-[#AAA49A] flex items-center gap-1.5 font-bold">
                  <MapPin className="w-3 h-3 text-[#4848A8] dark:text-[#8B8BF5]" />
                  <span>{t.pob}</span>
                </label>
                <select
                  value={formData.cityId}
                  onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-mono-data"
                >
                  {CITIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}, {c.state || c.country}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-[11px] text-[#4848A8] dark:text-[#8B8BF5] hover:underline font-mono-data flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.sampleFill}</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#D4AF37] text-[#060709] font-mono-data font-bold text-xs uppercase tracking-wider hover:bg-[#E5C378] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{t.submitBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Calculated Chart Surface */}
        {kundaliData && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Identity Summary 3-Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-mono-data">
              <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-[#8E6F1D]/35 dark:border-[#D4AF37]/35 shadow-xs">
                <div className="text-[10px] text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-wider font-bold">{t.lagna}</div>
                <div className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6] mt-1">
                  {kundaliData.lagna.rashiName} ({kundaliData.lagna.rashiEn})
                </div>
                <div className="text-xs text-[#4848A8] dark:text-[#8B8BF5] mt-1">
                  {kundaliData.lagna.degreeStr} • Lord: {kundaliData.lagna.lord} • {(kundaliData.lagna.nakshatra?.name ?? kundaliData.lagna.nakshatra)} (P{kundaliData.lagna.pada})
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-xs">
                <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-wider font-bold">{t.moonSign}</div>
                <div className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6] mt-1">
                  {kundaliData.moon.rashiName} ({kundaliData.moon.rashiEn})
                </div>
                <div className="text-xs text-[#57524A] dark:text-[#AAA49A] mt-1">
                  {kundaliData.moon.degreeStr} • Nakshatra: {(kundaliData.moon.nakshatra?.name ?? kundaliData.moon.nakshatra)} (P{kundaliData.moon.pada})
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] flex flex-col justify-between shadow-xs">
                <div>
                  <div className="text-[10px] text-[#A6461D] dark:text-[#C86D46] uppercase tracking-wider font-bold">{t.ephemerisAnchor}</div>
                  <div className="text-sm font-semibold text-[#1C1917] dark:text-[#EFECE6] mt-1">
                    {kundaliData.meta.locationName}
                  </div>
                  <div className="text-xs text-[#857E74] dark:text-[#736E67] mt-0.5">
                    {kundaliData.meta.birthDate} at {kundaliData.meta.birthTime} (Ayanamsha: {kundaliData.meta.ayanamsha}°)
                  </div>
                </div>
                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    onOpenDasha();
                  }}
                  className="text-xs text-[#8E6F1D] dark:text-[#D4AF37] hover:underline pt-2 flex items-center gap-1 font-bold"
                >
                  <span>{t.dashaLink}</span>
                </button>
              </div>
            </div>

            {/* Split: Sacred Blueprint SVG + Planetary Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: North Indian Kundali SVG Visualizer */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#080A12] border border-black/[0.08] dark:border-[#D4AF37]/30 shadow-2xl">
                <div className="flex items-center justify-between mb-4 font-mono-data">
                  <span className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">
                    {t.chartTitle}
                  </span>
                  <span className="text-[10px] text-[#857E74] dark:text-[#736E67]">
                    {t.quadrants} (Click any House/Planet)
                  </span>
                </div>

                {/* North Indian Geometric Chart */}
                <div className="relative aspect-square w-full max-w-[460px] mx-auto">
                  <svg viewBox="0 0 400 400" className="w-full h-full">
                    {/* Outer Square */}
                    <rect x="10" y="10" width="380" height="380" fill={theme === 'light' ? '#FAF7F2' : '#05060A'} stroke={theme === 'light' ? '#8E6F1D' : '#D4AF37'} strokeWidth="1.8" />
                    
                    {/* Diagonal Lines */}
                    <line x1="10" y1="10" x2="390" y2="390" stroke={theme === 'light' ? '#A6461D' : '#C86D46'} strokeWidth="1.4" />
                    <line x1="390" y1="10" x2="10" y2="390" stroke={theme === 'light' ? '#A6461D' : '#C86D46'} strokeWidth="1.4" />
                    
                    {/* Kendra Inner Diamond */}
                    <polygon points="200,10 390,200 200,390 10,200" fill="none" stroke={theme === 'light' ? '#8E6F1D' : '#D4AF37'} strokeWidth="1.8" />

                    {/* House 1 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(1); }} className="cursor-pointer">
                      <text x="200" y="58" textAnchor="middle" fill={theme === 'light' ? '#8E6F1D' : '#D4AF37'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                        H1 ({kundaliData.houses[0].rashiName.slice(0,3)})
                      </text>
                      <text x="200" y="82" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="12" fontWeight="bold">
                        {getHousePlanets(1).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 2 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(2); }} className="cursor-pointer">
                      <text x="110" y="45" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H2 ({kundaliData.houses[1].rashiName.slice(0,3)})
                      </text>
                      <text x="110" y="65" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(2).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 3 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(3); }} className="cursor-pointer">
                      <text x="55" y="110" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H3 ({kundaliData.houses[2].rashiName.slice(0,3)})
                      </text>
                      <text x="55" y="130" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(3).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 4 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(4); }} className="cursor-pointer">
                      <text x="95" y="200" textAnchor="middle" fill={theme === 'light' ? '#4848A8' : '#8B8BF5'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                        H4 ({kundaliData.houses[3].rashiName.slice(0,3)})
                      </text>
                      <text x="95" y="222" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="12" fontWeight="bold">
                        {getHousePlanets(4).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 5 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(5); }} className="cursor-pointer">
                      <text x="55" y="290" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H5 ({kundaliData.houses[4].rashiName.slice(0,3)})
                      </text>
                      <text x="55" y="310" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(5).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 6 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(6); }} className="cursor-pointer">
                      <text x="110" y="355" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H6 ({kundaliData.houses[5].rashiName.slice(0,3)})
                      </text>
                      <text x="110" y="375" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(6).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 7 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(7); }} className="cursor-pointer">
                      <text x="200" y="340" textAnchor="middle" fill={theme === 'light' ? '#4848A8' : '#8B8BF5'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                        H7 ({kundaliData.houses[6].rashiName.slice(0,3)})
                      </text>
                      <text x="200" y="362" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="12" fontWeight="bold">
                        {getHousePlanets(7).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 8 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(8); }} className="cursor-pointer">
                      <text x="290" y="355" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H8 ({kundaliData.houses[7].rashiName.slice(0,3)})
                      </text>
                      <text x="290" y="375" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(8).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 9 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(9); }} className="cursor-pointer">
                      <text x="345" y="290" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H9 ({kundaliData.houses[8].rashiName.slice(0,3)})
                      </text>
                      <text x="345" y="310" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(9).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 10 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(10); }} className="cursor-pointer">
                      <text x="305" y="200" textAnchor="middle" fill={theme === 'light' ? '#4848A8' : '#8B8BF5'} fontSize="11" fontFamily="JetBrains Mono" fontWeight="bold">
                        H10 ({kundaliData.houses[9].rashiName.slice(0,3)})
                      </text>
                      <text x="305" y="222" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="12" fontWeight="bold">
                        {getHousePlanets(10).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 11 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(11); }} className="cursor-pointer">
                      <text x="345" y="110" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H11 ({kundaliData.houses[10].rashiName.slice(0,3)})
                      </text>
                      <text x="345" y="130" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(11).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>

                    {/* House 12 */}
                    <g onClick={() => { chitiSensory.playTick(); setSelectedHouse(12); }} className="cursor-pointer">
                      <text x="290" y="45" textAnchor="middle" fill="#736E67" fontSize="9" fontFamily="JetBrains Mono">
                        H12 ({kundaliData.houses[11].rashiName.slice(0,3)})
                      </text>
                      <text x="290" y="65" textAnchor="middle" fill={theme === 'light' ? '#1C1917' : '#EFECE6'} fontSize="10" fontWeight="bold">
                        {getHousePlanets(12).map(p => p.name.slice(0,2)).join(', ') || '—'}
                      </text>
                    </g>
                  </svg>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs font-mono-data">
                  <div>
                    <span className="text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                      House {selectedHouse}:
                    </span>{' '}
                    <span className="text-[#1C1917] dark:text-[#EFECE6]">
                      {lang === 'hi' ? HOUSE_SIGNIFICATIONS[selectedHouse]?.hi : HOUSE_SIGNIFICATIONS[selectedHouse]?.en}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#57524A] dark:text-[#AAA49A]">
                    Karaka: {HOUSE_SIGNIFICATIONS[selectedHouse]?.karaka}
                  </span>
                </div>
              </div>

              {/* Right Column: Planetary Ephemeris Dossier */}
              <div className="lg:col-span-5 space-y-4 font-mono-data">
                <div className="p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#080A12] border border-black/[0.08] dark:border-[#D4AF37]/30 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-editorial text-sm font-bold text-[#1C1917] dark:text-[#EFECE6]">
                      {t.grahaTitle}
                    </span>
                    <span className="text-[10px] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                      {t.siderealNirayana}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                    {kundaliData.planets.map((planet) => (
                      <div
                        key={planet.name}
                        onClick={() => {
                          chitiSensory.playTick();
                          setSelectedPlanet(planet);
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-center justify-between text-xs ${
                          selectedPlanet?.name === planet.name
                            ? 'bg-[#EDEAF8] dark:bg-[#141728] border-[#8E6F1D] dark:border-[#D4AF37] text-black dark:text-white'
                            : 'bg-[#FAF7F2] dark:bg-[#0B0D16] border-black/[0.05] dark:border-white/[0.06] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-white dark:bg-[#181C2E] flex items-center justify-center text-[#8E6F1D] dark:text-[#D4AF37] font-bold text-xs shadow-xs">
                            {planet.symbol}
                          </span>
                          <div>
                            <div className="font-semibold text-[#1C1917] dark:text-[#EFECE6]">
                              {planet.name} ({planet.sanskrit}) {planet.isRetrograde && <span className="text-[#ef4444]">(R)</span>}
                            </div>
                            <div className="text-[10px] text-[#857E74] dark:text-[#736E67]">
                              H{planet.house} • {planet.rashiName} ({planet.degreeStr})
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            planet.dignity.includes('Exalted') ? 'bg-[#10b981]/20 text-[#0F6B43] dark:text-[#34d399]' :
                            planet.dignity.includes('Debilitated') ? 'bg-[#ef4444]/20 text-[#A81E2E] dark:text-[#f87171]' :
                            planet.dignity.includes('Own') ? 'bg-[#3b82f6]/20 text-[#1D4ED8] dark:text-[#93c5fd]' :
                            'bg-black/[0.05] dark:bg-[#181C2E] text-[#57524A] dark:text-[#8E7E72]'
                          }`}>
                            {planet.dignity}
                          </span>
                          <div className="text-[9px] text-[#4848A8] dark:text-[#8B8BF5] mt-0.5">
                            {(planet.nakshatra?.name ?? planet.nakshatra)} P{planet.pada}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedPlanet && (
                    <div className="mt-4 p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0F1222] border border-[#4848A8]/30 dark:border-[#8B8BF5]/30 text-xs space-y-1 animate-in fade-in">
                      <div className="font-bold text-[#1C1917] dark:text-[#EFECE6] flex items-center justify-between">
                        <span>{selectedPlanet.name} Significations:</span>
                        <span className="text-[#8E6F1D] dark:text-[#D4AF37] text-[10px]">{selectedPlanet.nature}</span>
                      </div>
                      <div className="text-[#57524A] dark:text-[#AAA49A]">
                        <strong>Karaka:</strong> {selectedPlanet.karaka}
                      </div>
                      <div className="text-[#57524A] dark:text-[#AAA49A]">
                        <strong>Position:</strong> Occupies {selectedPlanet.rashiName} (ruled by {selectedPlanet.rashiLord}) in House {selectedPlanet.house}.
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-between items-center text-xs">
                    <span className="text-[#857E74] dark:text-[#736E67]">{t.needDeeper}</span>
                    <button
                      onClick={() => {
                        chitiSensory.playTick();
                        onOpenConsultation('Chart Synthesis');
                      }}
                      className="text-[#8E6F1D] dark:text-[#D4AF37] hover:underline font-bold"
                    >
                      {t.askJyotishi}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </section>
  );
}

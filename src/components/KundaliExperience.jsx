import React, { useState } from 'react';
import { 
  Compass, 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  Flame, 
  Info,
  Navigation,
  Search,
  Crosshair,
  Globe2,
  Check
} from 'lucide-react';
import { calculateKundali, RASHIS, PLANET_INFO } from '../lib/astrologyEngine';
import { CITIES, CITIES_BY_STATE, DEFAULT_CITY, searchCities } from '../lib/cities';
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

const POPULAR_PANCHANG_ANCHORS = [
  { id: 'varanasi', name: 'काशी (Varanasi)', lat: 25.3176, lng: 82.9739, state: 'Uttar Pradesh' },
  { id: 'ayodhya', name: 'अयोध्या (Ayodhya)', lat: 26.7922, lng: 82.1998, state: 'Uttar Pradesh' },
  { id: 'ujjain', name: 'उज्जैन (Ujjain)', lat: 23.1765, lng: 75.7885, state: 'Madhya Pradesh' },
  { id: 'haridwar', name: 'हरिद्वार (Haridwar)', lat: 29.9457, lng: 78.1642, state: 'Uttarakhand' },
  { id: 'tirupati', name: 'तिरुपति (Tirupati)', lat: 13.6288, lng: 79.4192, state: 'Andhra Pradesh' },
  { id: 'puri', name: 'पुरी (Puri Jagannath)', lat: 19.8135, lng: 85.8312, state: 'Odisha' },
  { id: 'dhanbad', name: 'धनबाद (Dhanbad)', lat: 23.7957, lng: 86.4304, state: 'Jharkhand' },
  { id: 'patna', name: 'पटना (Patna)', lat: 25.5941, lng: 85.1376, state: 'Bihar' },
  { id: 'delhi', name: 'दिल्ली (Delhi NCR)', lat: 28.6139, lng: 77.2090, state: 'Delhi' },
  { id: 'mumbai', name: 'मुम्बई (Mumbai)', lat: 19.0760, lng: 72.8777, state: 'Maharashtra' },
  { id: 'bengaluru', name: 'बेंगलुरु (Bengaluru)', lat: 12.9716, lng: 77.5946, state: 'Karnataka' },
  { id: 'kolkata', name: 'कोलकाता (Kolkata)', lat: 22.5726, lng: 88.3639, state: 'West Bengal' }
];

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
    cityId: 'dhanbad',
    cityName: 'Dhanbad',
    stateName: 'Jharkhand',
    latitude: 23.7957,
    longitude: 86.4304,
    timezone: 5.5,
    isCustomCoordinates: false
  });

  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [showCoordinateAdvanced, setShowCoordinateAdvanced] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [selectedHouse, setSelectedHouse] = useState(1);
  const [gpsStatus, setGpsStatus] = useState('');
  const isHi = lang === 'hi';
  const t = TRANSLATIONS[lang]?.kundali || TRANSLATIONS.en.kundali;

  const handleCityChange = (cityId) => {
    chitiSensory.playTick();
    const city = CITIES.find(c => c.id === cityId);
    if (city) {
      setFormData(prev => ({
        ...prev,
        cityId: city.id,
        cityName: city.name,
        stateName: city.state,
        latitude: city.lat,
        longitude: city.lng,
        timezone: city.tz,
        isCustomCoordinates: false
      }));
    }
  };

  const handleUseLiveGps = () => {
    chitiSensory.playTick();
    if (!navigator.geolocation) {
      alert(isHi ? 'आपके ब्राउज़र में GPS सुविधा उपलब्ध नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus(isHi ? 'उपग्रह GPS निर्देशांक प्राप्त हो रहे हैं...' : 'Acquiring high-precision GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setFormData(prev => ({
          ...prev,
          cityId: 'custom-gps',
          cityName: isHi ? 'वर्तमान GPS स्थान' : 'Current GPS Location',
          stateName: 'Local Coordinates',
          latitude: lat,
          longitude: lng,
          timezone: 5.5,
          isCustomCoordinates: true
        }));
        setShowCoordinateAdvanced(true);
        setGpsStatus(isHi ? `✓ GPS निर्देशांक लॉक: ${lat}°N, ${lng}°E` : `✓ GPS Coordinates Locked: ${lat}°N, ${lng}°E`);
        setTimeout(() => setGpsStatus(''), 4000);
      },
      (err) => {
        setGpsStatus(isHi ? 'GPS अनुमति अस्वीकृत। कृपया सूची से नगर चुनें।' : 'GPS access denied. Please select city from list.');
        setTimeout(() => setGpsStatus(''), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    chitiSensory.playTick();

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const tz = parseFloat(formData.timezone || 5.5);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      alert(isHi ? 'अमान्य अक्षांश (Latitude -90 से +90 के मध्य होना चाहिए)' : 'Invalid Latitude (Must be between -90 and +90)');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      alert(isHi ? 'अमान्य रेखांश (Longitude -180 से +180 के मध्य होना चाहिए)' : 'Invalid Longitude (Must be between -180 and +180)');
      return;
    }

    const locationLabel = formData.isCustomCoordinates
      ? `${formData.cityName || 'कस्टम स्थान'} (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`
      : `${formData.cityName}, ${formData.stateName}`;

    const data = calculateKundali({
      birthDate: formData.birthDate,
      birthTime: formData.birthTime,
      latitude: lat,
      longitude: lng,
      timezone: tz,
      locationName: locationLabel
    });
    
    analytics.track(ANALYTICS_EVENTS.KUNDALI_GENERATED, {
      lagna: data.lagna.rashiName,
      moonNak: data.moon.nakshatra,
      lat,
      lng
    });

    onGenerateKundali(data);
  };

  const handleDemoFill = () => {
    chitiSensory.playTick();
    setFormData({
      birthDate: '1992-10-24',
      birthTime: '06:45',
      cityId: 'patna',
      cityName: 'Patna',
      stateName: 'Bihar',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      isCustomCoordinates: false
    });
  };

  const getHousePlanets = (houseNum) => {
    if (!kundaliData) return [];
    return kundaliData.planets.filter(p => p.house === houseNum);
  };

  // Filtered cities list based on search
  const filteredCities = citySearchQuery.trim()
    ? searchCities(citySearchQuery)
    : null;

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
              ? "भारत के ३५०+ नगरों अथवा अपने सटीक अक्षांश-रेखांश (GPS Coordinates) एवं लाहिरी अयनांश (24° 16') के आधार पर अपनी प्रामाणिक जन्म कुण्डली निर्मित करें।"
              : "Construct your foundational sidereal birth chart using high-precision geographical coordinates across 350+ Indian cities or exact custom Lat/Lng with Lahiri Ayanamsha."}
          </p>
        </div>

        {/* Form Matrix */}
        <div className="max-w-4xl rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 p-6 sm:p-8 mb-12 shadow-2xl bg-white dark:bg-[#090A12] transition-colors duration-300 font-mono-data">
          
          {/* Quick Cultural Anchors Bar */}
          <div className="mb-6 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="text-[10px] uppercase tracking-wider text-[#8E6F1D] dark:text-[#E5C378] font-bold mb-2 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" />
              <span>{isHi ? 'प्रमुख पञ्चाङ्ग व तीर्थ खगोलीय केन्द्र (Quick Anchors):' : 'Popular Vedic Astrological Anchors:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_PANCHANG_ANCHORS.map(anchor => {
                const isActive = formData.cityId === anchor.id;
                return (
                  <button
                    key={anchor.id}
                    type="button"
                    onClick={() => handleCityChange(anchor.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black border-[#8E6F1D] dark:border-[#D4AF37] shadow-xs'
                        : 'bg-black/[0.02] dark:bg-white/[0.04] text-[#57524A] dark:text-[#AAA49A] border-black/5 dark:border-white/5 hover:border-[#8E6F1D]/40'
                    }`}
                  >
                    {anchor.name}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Primary Input Grid (Date, Time, City) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#57524A] dark:text-[#AAA49A] flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                  <span>{isHi ? 'जन्म तिथि (Date of Birth)' : t.dob}</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.12] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] shadow-inner font-bold"
                />
              </div>

              {/* Exact Time */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-[#57524A] dark:text-[#AAA49A] flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#E29A48]" />
                  <span>{isHi ? 'जन्म समय (Time of Birth - 24h)' : t.tob}</span>
                </label>
                <input
                  type="time"
                  required
                  step="60"
                  value={formData.birthTime}
                  onChange={(e) => setFormData({ ...formData, birthTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.12] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] shadow-inner font-bold"
                />
              </div>

              {/* Indian City & Territory Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-[#57524A] dark:text-[#AAA49A] flex items-center gap-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#4848A8] dark:text-[#8B8BF5]" />
                    <span>{isHi ? 'जन्म स्थान / नगर (350+ Cities)' : 'Birth Place (350+ Cities)'}</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={handleUseLiveGps}
                    className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968] hover:underline font-bold flex items-center gap-0.5"
                    title="Acquire live GPS"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>GPS</span>
                  </button>
                </div>

                <select
                  value={formData.cityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.12] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] shadow-inner font-bold"
                >
                  {Object.entries(CITIES_BY_STATE).map(([stateName, citiesInState]) => (
                    <optgroup key={stateName} label={stateName}>
                      {citiesInState.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.nameHi ? `(${c.nameHi})` : ''} • {c.lat.toFixed(2)}°N, {c.lng.toFixed(2)}°E
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

            </div>

            {/* GPS Feedback Message */}
            {gpsStatus && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span>{gpsStatus}</span>
              </div>
            )}

            {/* Custom Coordinates (Latitude / Longitude) Precision Bar */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />
                  <span className="text-xs font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                    {isHi ? 'सटीक खगोलीय निर्देशांक (Exact Latitude & Longitude)' : 'Exact Astronomical Coordinates'}
                  </span>
                  {formData.isCustomCoordinates && (
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] border border-[#D4AF37]/40">
                      {isHi ? 'कस्टम GPS सक्रिय' : 'Custom GPS Active'}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowCoordinateAdvanced(!showCoordinateAdvanced)}
                  className="text-[11px] text-[#8E6F1D] dark:text-[#F0C968] hover:underline font-bold"
                >
                  {showCoordinateAdvanced ? (isHi ? 'संक्षिप्त करें ▲' : 'Hide ▲') : (isHi ? 'निर्देशांक सम्पादित करें ▼' : 'Edit Lat/Lng ▼')}
                </button>
              </div>

              {/* Coordinate Inputs (Always prefilled with chosen city, freely editable) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Latitude Input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#57524A] dark:text-[#AAA49A] flex items-center justify-between font-bold">
                    <span>{isHi ? 'अक्षांश (Latitude °N)' : 'Latitude (°N/S)'}</span>
                    <span className="text-[9px] text-[#857E74]">[-90.0 to +90.0]</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      latitude: e.target.value,
                      isCustomCoordinates: true 
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold"
                    placeholder="23.7957"
                  />
                </div>

                {/* Longitude Input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#57524A] dark:text-[#AAA49A] flex items-center justify-between font-bold">
                    <span>{isHi ? 'रेखांश (Longitude °E)' : 'Longitude (°E/W)'}</span>
                    <span className="text-[9px] text-[#857E74]">[-180.0 to +180.0]</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      longitude: e.target.value,
                      isCustomCoordinates: true 
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold"
                    placeholder="86.4304"
                  />
                </div>

                {/* Timezone Input */}
                <div className="space-y-1">
                  <label className="text-[10px] text-[#57524A] dark:text-[#AAA49A] flex items-center justify-between font-bold">
                    <span>{isHi ? 'समय क्षेत्र (Timezone UTC)' : 'Timezone (UTC)'}</span>
                    <span className="text-[9px] text-[#857E74]">IST = +5.5</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="-12"
                    max="14"
                    required
                    value={formData.timezone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      timezone: e.target.value,
                      isCustomCoordinates: true 
                    })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold"
                    placeholder="5.5"
                  />
                </div>

              </div>

              <div className="text-[10px] text-[#857E74] dark:text-[#7D766C] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#8E6F1D] shrink-0" />
                <span>
                  {isHi 
                    ? 'स्थान बदलने पर अक्षांश व रेखांश स्वतः भर जाते हैं। किसी विशिष्ट चिकित्सालय या ग्राम के लिए आप अक्षांश-रेखांश सीधे सम्पादित कर सकते हैं।'
                    : 'Coordinates auto-populate when selecting a city, or you can directly type exact hospital/village GPS coordinates.'}
                </span>
              </div>
            </div>

            {/* Actions Bar (Sample Fill, Submit Button) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-xs text-[#4848A8] dark:text-[#8B8BF5] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isHi ? 'नमूना डेटा भरें (पटना, बिहार)' : t.sampleFill}</span>
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

              <div className="p-5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.08] shadow-xs">
                <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-wider font-bold">{t.moonSign}</div>
                <div className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6] mt-1">
                  {kundaliData.moon.rashiName} ({kundaliData.moon.rashiEn})
                </div>
                <div className="text-xs text-[#57524A] dark:text-[#AAA49A] mt-1">
                  {kundaliData.moon.degreeStr} • Nakshatra: {(kundaliData.moon.nakshatra?.name ?? kundaliData.moon.nakshatra)} (P{kundaliData.moon.pada})
                </div>
              </div>

              <div className="p-5 rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 dark:border-white/[0.08] flex flex-col justify-between shadow-xs">
                <div>
                  <div className="text-[10px] text-[#A6461D] dark:text-[#C86D46] uppercase tracking-wider font-bold">{t.ephemerisAnchor}</div>
                  <div className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6] mt-1">
                    {kundaliData.locationName}
                  </div>
                  <div className="text-xs text-[#57524A] dark:text-[#AAA49A] mt-1">
                    Lahiri Ayanamsha: 24° 16' • LST: {kundaliData.localSiderealTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Planetary Dig-Bala & Dignity Matrix */}
            <div className="rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 shadow-xl bg-white dark:bg-[#090B14] font-mono-data">
              <div className="flex items-center justify-between mb-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                  {isHi ? 'ग्रह स्थिति, भाव एवं दिगबल सारणी' : 'Planetary Positions & Dignity Matrix'}
                </h3>
                <span className="text-xs text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                  {isHi ? 'लाहिरी निरयण' : 'Lahiri Sidereal'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
                {kundaliData.planets.map(planet => (
                  <div 
                    key={planet.name}
                    className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[#1C1917] dark:text-white">{planet.nameHi || planet.name}</span>
                      <span className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">H{planet.house}</span>
                    </div>
                    <div className="text-[10px] text-[#57524A] dark:text-[#AAA49A]">
                      {planet.rashiName} ({planet.degreeStr})
                    </div>
                    {planet.isRetrograde && (
                      <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        वक्र (R)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}

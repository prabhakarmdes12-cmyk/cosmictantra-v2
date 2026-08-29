import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  X, 
  Check, 
  Compass, 
  Globe2, 
  Navigation, 
  Crosshair, 
  Radio, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { CITIES, CITIES_BY_STATE, searchCities } from '../lib/cities';
import { getCurrentGpsLocation, persistLocation } from '../lib/location';
import { chitiSensory } from '../lib/chitiAudio';

export default function CitySelectorModal({ 
  isOpen, 
  onClose, 
  currentCity, 
  onSelectCity, 
  lang = 'en', 
  theme = 'dark' 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('ALL');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customCityName, setCustomCityName] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'locating' | 'locked' | 'error'
  const [gpsData, setGpsData] = useState(null);
  const [gpsErrorMessage, setGpsErrorMessage] = useState('');

  const isHi = lang === 'hi';
  if (!isOpen) return null;

  const filteredCities = searchTerm.trim()
    ? searchCities(searchTerm)
    : selectedStateFilter === 'ALL'
    ? CITIES
    : (CITIES_BY_STATE[selectedStateFilter] || []);

  const handleAcquireGps = async () => {
    chitiSensory.playTick();
    setGpsStatus('locating');
    setGpsErrorMessage('');
    
    try {
      const loc = await getCurrentGpsLocation({ enableHighAccuracy: true, timeout: 12000 });
      setGpsData(loc);
      setGpsStatus('locked');
      chitiSensory.playSuccess?.();
      
      // Auto-apply after brief visual confirmation
      setTimeout(() => {
        onSelectCity(loc);
        onClose();
      }, 900);
    } catch (err) {
      setGpsStatus('error');
      setGpsErrorMessage(err?.message || (isHi ? 'GPS निर्देशांक प्राप्त करने में त्रुटि।' : 'Failed to acquire GPS location.'));
      setTimeout(() => setGpsStatus('idle'), 6000);
    }
  };

  const handleApplyCustomCoords = () => {
    chitiSensory.playTick();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      alert(isHi ? 'कृपया मान्य अक्षांश (-90 से 90) और रेखांश (-180 से 180) दर्ज करें।' : 'Please enter valid Latitude (-90 to 90) and Longitude (-180 to 180).');
      return;
    }
    const customLocation = {
      id: 'custom-' + Date.now(),
      name: customCityName.trim() || `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
      state: isHi ? 'कस्टम निर्देशांक' : 'Custom Coordinates',
      country: 'India',
      lat,
      lng,
      tz: 5.5,
      isGps: false
    };
    persistLocation(customLocation);
    onSelectCity(customLocation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 font-mono-data">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FFFFFF] dark:bg-[#090A12] border border-black/[0.12] dark:border-[#D4AF37]/40 p-5 sm:p-6 shadow-2xl space-y-4 text-left max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#8E6F1D] dark:text-[#D4AF37]" />
            <div>
              <h3 className="font-editorial text-base sm:text-lg font-bold text-[#1C1917] dark:text-[#FAF7F2]">
                {isHi ? 'खगोलीय गणना स्थान चयन (GPS व ३५०+ नगर)' : 'Astrological Location Anchor (GPS & 350+ Cities)'}
              </h3>
              <p className="text-[10.5px] text-[#857E74]">
                {isHi 
                  ? 'प्रत्यक्ष उपग्रह GPS अथवा भारत के किसी भी नगर से वास्तविक पञ्चाङ्ग व कुण्डली गणना करें' 
                  : 'Acquire real-time satellite GPS or select from 350+ cities across India'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              chitiSensory.playTick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-[#857E74] dark:text-[#8E8A82] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real-Time Live GPS Acquisition Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#8E6F1D]/15 via-[#D4AF37]/15 to-transparent border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                <Radio className={`w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968] ${gpsStatus === 'locating' ? 'animate-spin' : 'animate-pulse'}`} />
                {gpsStatus === 'locked' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-[#1C1917] dark:text-[#FAF7F2] flex items-center gap-1.5">
                  <span>{isHi ? 'वर्तमान लाइव GPS स्थान (Real-Time Satellite Lock)' : 'Live Real-Time GPS Location'}</span>
                  {currentCity?.isGps && (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#857E74] dark:text-[#AAA49A]">
                  {isHi ? 'सटीक अक्षांश-रेखांश द्वारा स्थानीय सूर्योदय, सूर्यास्त व होरा गणना' : 'Sub-arcminute sidereal precision for local sunrise, sunset and muhuratas'}
                </div>
              </div>
            </div>

            <button
              onClick={handleAcquireGps}
              disabled={gpsStatus === 'locating'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                gpsStatus === 'locating'
                  ? 'bg-amber-500/20 text-amber-600 border border-amber-500/40 cursor-wait'
                  : gpsStatus === 'locked'
                  ? 'bg-emerald-500 text-white border border-emerald-600'
                  : 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black hover:opacity-90'
              }`}
            >
              <Crosshair className={`w-3.5 h-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>
                {gpsStatus === 'locating' 
                  ? (isHi ? 'GPS खोज रहे हैं...' : 'Acquiring GPS...')
                  : gpsStatus === 'locked'
                  ? (isHi ? '✓ GPS लॉक' : '✓ GPS Locked')
                  : (isHi ? 'लाइव GPS लें' : 'Use Live GPS')}
              </span>
            </button>
          </div>

          {/* GPS Locked Status Card */}
          {gpsStatus === 'locked' && gpsData && (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div>
                <strong>{gpsData.lat.toFixed(4)}°N, {gpsData.lng.toFixed(4)}°E</strong>
                <span className="opacity-80"> • {isHi ? `सटीकता ±${gpsData.accuracy}m` : `±${gpsData.accuracy}m accuracy`} ({gpsData.nearestCityName || 'India'})</span>
              </div>
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
          )}

          {/* GPS Error Message */}
          {gpsStatus === 'error' && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[10.5px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{gpsErrorMessage}</span>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#857E74] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isHi ? 'नगर, राज्य या तीर्थ खोजें (उदा. धनबाद, पटना, वाराणसी, अयोध्या, पुरी, जयपुर)...' : 'Search city, state or heritage center (e.g. Dhanbad, Varanasi, Tirupati)...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.1] dark:border-white/[0.1] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold"
            />
          </div>

          {/* State filter quick pills */}
          {!searchTerm && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10.5px]">
              <button
                onClick={() => setSelectedStateFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 cursor-pointer border ${
                  selectedStateFilter === 'ALL'
                    ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black border-transparent'
                    : 'bg-black/[0.03] dark:bg-white/[0.03] text-[#857E74] border-black/5 dark:border-white/5'
                }`}
              >
                {isHi ? 'सभी राज्य (350+)' : 'All States (350+)'}
              </button>
              {Object.keys(CITIES_BY_STATE).slice(0, 10).map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStateFilter(st)}
                  className={`px-2 py-1 rounded-lg font-bold shrink-0 cursor-pointer border ${
                    selectedStateFilter === st
                      ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black border-transparent'
                      : 'bg-black/[0.03] dark:bg-white/[0.03] text-[#857E74] border-black/5 dark:border-white/5'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cities List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs max-h-60 scrollbar-thin">
          {filteredCities.map((city) => {
            const isSelected = !currentCity?.isGps && city.id === currentCity?.id;
            return (
              <button
                key={city.id}
                onClick={() => {
                  chitiSensory.playTick();
                  persistLocation(city);
                  onSelectCity(city);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border-[#8E6F1D] dark:border-[#D4AF37] text-black dark:text-white font-bold'
                    : 'bg-[#FFFFFF] dark:bg-[#0B0C11] border-black/[0.05] dark:border-white/[0.05] text-[#57524A] dark:text-[#AAA49A] hover:bg-[#FAF7F2] dark:hover:bg-[#0E1018]'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-2">
                    <span>{city.name}</span>
                    {city.nameHi && <span className="text-[11px] text-[#8E6F1D] dark:text-[#F0C968]">({city.nameHi})</span>}
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/5 text-[#857E74]">{city.state}</span>
                  </div>
                  <div className="text-[10px] text-[#857E74] dark:text-[#6B6760] mt-0.5">
                    {city.country} • {city.lat.toFixed(4)}°N, {city.lng.toFixed(4)}°E (UTC+{city.tz})
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Manual Lat/Lng Section Toggle */}
        <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
          {!showManualInput ? (
            <button
              onClick={() => setShowManualInput(true)}
              className="w-full text-center text-xs text-[#8E6F1D] dark:text-[#F0C968] font-bold hover:underline cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{isHi ? '+ कस्टम अक्षांश व रेखांश (Manual Lat/Lng) दर्ज करें' : '+ Enter Custom Latitude & Longitude Coordinates'}</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                <span>{isHi ? 'कस्टम अक्षांश-रेखांश प्रविष्टि' : 'Custom Lat/Lng Entry'}</span>
                <button onClick={() => setShowManualInput(false)} className="text-[#857E74] hover:underline cursor-pointer">
                  {isHi ? 'रद्द करें ✕' : 'Cancel ✕'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder={isHi ? 'स्थान का नाम' : 'Location Name'}
                  value={customCityName}
                  onChange={(e) => setCustomCityName(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/10 dark:border-white/10 text-xs font-bold"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Latitude (e.g. 23.7957)"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/10 dark:border-white/10 text-xs font-bold"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Longitude (e.g. 86.4304)"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#05060A] border border-black/10 dark:border-white/10 text-xs font-bold"
                />
              </div>

              <button
                onClick={handleApplyCustomCoords}
                className="w-full py-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black font-bold text-xs cursor-pointer"
              >
                {isHi ? 'निर्देशांक लागू करें' : 'Apply Coordinates'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

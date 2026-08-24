'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Moon, Clock, Compass, ChevronDown } from 'lucide-react';
import { calculatePanchang } from '@/engines/panchang.js';
import { trackEvent } from '@/lib/analytics';

const CITIES = [
  { name: 'Dhanbad, JH', lat: 23.7957, lon: 86.4304, tz: 5.5 },
  { name: 'Ranchi, JH', lat: 23.3441, lon: 85.3096, tz: 5.5 },
  { name: 'Patna, BR', lat: 25.5941, lon: 85.1376, tz: 5.5 },
  { name: 'Varanasi, UP', lat: 25.3176, lon: 82.9739, tz: 5.5 },
  { name: 'Kolkata, WB', lat: 22.5726, lon: 88.3639, tz: 5.5 },
  { name: 'New Delhi, DL', lat: 28.6139, lon: 77.2090, tz: 5.5 },
  { name: 'Mumbai, MH', lat: 19.0760, lon: 72.8777, tz: 5.5 },
  { name: 'Bengaluru, KA', lat: 12.9716, lon: 77.5946, tz: 5.5 },
];

export default function CosmicNow() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [panchang, setPanchang] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const p = calculatePanchang(new Date(), selectedCity.lat, selectedCity.lon, selectedCity.tz);
    setPanchang(p);

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, [selectedCity]);

  const handleCitySelect = (city: typeof CITIES[0]) => {
    setSelectedCity(city);
    setShowCityDropdown(false);
    trackEvent('LOCATION_CHANGED', { city: city.name });
  };

  if (!panchang) return null;

  // Calculate sun arc position (6:00 AM to 18:00 PM)
  const now = new Date();
  const currentHours = now.getHours() + now.getMinutes() / 60;
  const sunProgress = Math.max(0, Math.min(100, ((currentHours - 6) / 12) * 100));

  return (
    <div className="chiti-card p-6 border-2 border-purple-500/30 bg-black/80 font-body relative overflow-hidden">
      {/* Instrument Header */}
      <div className="flex justify-between items-center border-b border-purple-500/20 pb-4 mb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-white tracking-widest font-display uppercase">
          <Compass className="w-4 h-4 text-[#F59E0B]" /> COSMIC NOW
        </div>

        {/* Location Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-semibold text-[#A78BFA] hover:text-white transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-[#F59E0B]" />
            {selectedCity.name}
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {showCityDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-[#0D0A1E] border border-purple-500/30 rounded-xl shadow-2xl z-50 py-1.5 text-xs">
              {CITIES.map((c, i) => (
                <button
                  key={i}
                  onClick={() => handleCitySelect(c)}
                  className={`w-full text-left px-3 py-2 hover:bg-purple-950/60 transition-colors flex items-center justify-between ${
                    c.name === selectedCity.name ? 'text-[#F59E0B] font-bold' : 'text-white'
                  }`}
                >
                  {c.name}
                  {c.name === selectedCity.name && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Solar Arc Instrument Visualizer */}
      <div className="py-2 mb-4 bg-purple-950/20 rounded-xl border border-purple-500/20 p-4 text-center relative">
        <div className="flex justify-between items-center text-[11px] text-[#9CA3AF] mb-2 font-mono">
          <span>🌅 Sunrise {panchang.sunrise}</span>
          <span className="text-white font-bold text-xs">{currentTime} IST</span>
          <span>🌇 Sunset {panchang.sunset}</span>
        </div>

        {/* Arc Progress Bar with Indicator */}
        <div className="relative w-full pt-3 pb-1 my-1">
          <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden relative border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-600 transition-all duration-1000"
              style={{ width: `${sunProgress}%` }}
            />
          </div>
          {/* Needle Pin Marker */}
          <div 
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-700 z-20"
            style={{ left: `${Math.max(4, Math.min(96, sunProgress))}%` }}
          >
            <div className="px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-[8px] font-mono font-bold text-black shadow-xs mb-0.5">
              NOW
            </div>
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-[#D4AF37]" />
          </div>
        </div>
        <div className="text-[10px] text-[#A78BFA] mt-2 font-mono">
          Current Vedic Period: <strong className="text-white">{panchang.tithi?.paksha} • {panchang.vara?.day}</strong>
        </div>
      </div>

      {/* 4 Core Deterministic Panchang Metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">TITHI</span>
          <span className="font-bold text-white text-sm">{panchang.tithi?.name}</span>
          <span className="text-[10px] text-[#A78BFA] block mt-0.5">{panchang.tithi?.meaning}</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">NAKSHATRA</span>
          <span className="font-bold text-[#F59E0B] text-sm">{panchang.nakshatra?.name}</span>
          <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Pada {panchang.nakshatra?.pada}</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
          <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">NITYA YOGA</span>
          <span className="font-bold text-white text-sm">{panchang.yoga?.name}</span>
          <span className="text-[10px] text-[#10B981] block mt-0.5">Karana: {panchang.karana?.name}</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30">
          <span className="text-[10px] text-[#9CA3AF] block font-semibold uppercase">RAHU KALAM</span>
          <span className="font-bold text-[#F59E0B] text-sm">{panchang.rahuKala?.start} – {panchang.rahuKala?.end}</span>
          <span className="text-[10px] text-[#6B7280] block mt-0.5">Inauspicious window</span>
        </div>
      </div>
    </div>
  );
}

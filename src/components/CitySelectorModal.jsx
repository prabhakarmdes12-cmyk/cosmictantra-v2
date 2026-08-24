import React, { useState } from 'react';
import { MapPin, Search, X, Check } from 'lucide-react';
import { CITIES } from '../lib/cities';
import { chitiSensory } from '../lib/chitiAudio';

export default function CitySelectorModal({ isOpen, onClose, currentCity, onSelectCity, lang = 'en', theme = 'dark' }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredCities = CITIES.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.1] dark:border-white/[0.1] p-6 shadow-2xl space-y-4 text-left font-mono-data">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#E29A48]" />
            <h3 className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">
              {lang === 'hi' ? 'खगोलीय गणना स्थान चयन' : 'Calculation Location Anchor'}
            </h3>
          </div>
          <button 
            onClick={() => {
              chitiSensory.playTick();
              onClose();
            }}
            className="p-1 rounded text-[#857E74] dark:text-[#8E8A82] hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#857E74] dark:text-[#6B6760] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'hi' ? 'नगर खोजें (उदा. धनबाद, पटना, वाराणसी)...' : 'Search city (e.g. Dhanbad, Patna, Varanasi)...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37]"
            autoFocus
          />
        </div>

        {/* Cities List */}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1 text-xs">
          {filteredCities.map((city) => {
            const isSelected = city.id === currentCity.id;
            return (
              <button
                key={city.id}
                onClick={() => {
                  chitiSensory.playTick();
                  onSelectCity(city);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#FAF7F2] dark:bg-[#121420] border-[#8E6F1D] dark:border-[#D4AF37] text-black dark:text-white font-bold'
                    : 'bg-[#FFFFFF] dark:bg-[#0B0C11] border-black/[0.05] dark:border-white/[0.05] text-[#57524A] dark:text-[#AAA49A] hover:bg-[#FAF7F2] dark:hover:bg-[#0E1018]'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-[#1C1917] dark:text-[#EFECE6]">
                    {city.name}, {city.state}
                  </div>
                  <div className="text-[10px] text-[#857E74] dark:text-[#6B6760]">
                    {city.country} • {city.lat.toFixed(2)}°N, {city.lng.toFixed(2)}°E (UTC+{city.tz})
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 text-[10px] text-[#857E74] dark:text-[#57534D] border-t border-black/[0.06] dark:border-white/[0.06] text-center">
          {lang === 'hi'
            ? 'चयन के साथ ही पञ्चाङ्ग समय एवं लग्न गणना स्वतः नवीनीकृत हो जाती है।'
            : 'Panchang timings and Lagna recalculate instantaneously on selection.'
          }
        </div>

      </div>
    </div>
  );
}

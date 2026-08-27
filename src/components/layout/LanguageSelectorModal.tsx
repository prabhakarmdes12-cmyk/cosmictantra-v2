'use client';

import React, { useState } from 'react';
import { X, Check, Globe, Search, Sparkles } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import { SUPPORTED_LANGUAGES } from '@/lib/translations';
import { REGIONAL_JYOTISH_TERMS } from '@/lib/regionalTranslations';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  currentLang: string;
  onClose: () => void;
  onSelectLang: (langCode: string) => void;
}

export default function LanguageSelectorModal({
  isOpen,
  currentLang,
  onClose,
  onSelectLang
}: LanguageSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => 
    lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.script.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code: string) => {
    chitiSensory.playTick();
    onSelectLang(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF7F2] dark:bg-[#0E1017] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl shadow-2xl overflow-hidden z-10 text-[#1C1917] dark:text-[#FAF7F2]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial text-lg sm:text-xl font-bold tracking-wide">
                भाषा चयन • Select Sacred Language
              </h2>
              <p className="text-xs font-mono-data text-[#857E74] dark:text-[#A8A29E] mt-0.5">
                Authentic terminology across 12 Prime Indian Vedic Traditions
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              chitiSensory.playTick();
              onClose();
            }}
            className="p-2 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#857E74] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
            aria-label="Close language selector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.01]">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[#857E74] dark:text-[#A8A29E]" />
            <input
              type="text"
              placeholder="Search language (e.g. Tamil, Bengali, हिन्दी, తెలుగు, ಕನ್ನಡ)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 focus:border-[#8E6F1D] dark:focus:border-[#D4AF37] text-xs font-mono-data focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Language Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
          {filteredLanguages.map((lang) => {
            const isSelected = currentLang === lang.code;
            const regKey = lang.code.toLowerCase();
            const regionalInfo = REGIONAL_JYOTISH_TERMS[regKey] || REGIONAL_JYOTISH_TERMS[lang.name.toLowerCase()];
            const tradition = regionalInfo?.traditionNote || 'Classical Vedic Tradition';

            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={"relative p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 group " + (
                  isSelected
                    ? "bg-gradient-to-r from-[#8E6F1D]/15 to-transparent dark:from-[#D4AF37]/20 border-[#8E6F1D] dark:border-[#D4AF37] shadow-sm"
                    : "bg-white/60 dark:bg-white/5 border-black/10 dark:border-white/10 hover:border-[#8E6F1D]/60 dark:hover:border-[#D4AF37]/60 hover:bg-white dark:hover:bg-white/10"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-editorial text-base sm:text-lg font-bold text-[#1C1917] dark:text-white group-hover:text-[#8E6F1D] dark:group-hover:text-[#F0C968] transition-colors">
                      {lang.label}
                    </span>
                    <span className="text-[11px] font-mono-data text-[#857E74] dark:text-[#A8A29E]">
                      ({lang.name})
                    </span>
                  </div>
                  <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] mt-1 line-clamp-1">
                    {tradition}
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  {isSelected ? (
                    <div className="w-7 h-7 rounded-full bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-black flex items-center justify-center shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono-data px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[#857E74] dark:text-[#A8A29E] uppercase">
                      {lang.code}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-[11px] font-mono-data text-[#857E74] dark:text-[#A8A29E]">
          <div className="flex items-center gap-1.5 text-[#8E6F1D] dark:text-[#F0C968]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proxy-Driven Realtime Ephemeris Localization</span>
          </div>
          <span className="hidden sm:inline">Lahiri Ayanamsha 24° 16′</span>
        </div>

      </div>
    </div>
  );
}

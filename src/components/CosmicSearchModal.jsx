import React, { useState } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { JYOTISH_CONCEPTS } from '../lib/knowledgeGraph';
import { UPCOMING_EVENTS } from '../lib/festivals';
import { MUHURAT_EVENTS } from '../lib/muhuratData';
import { chitiSensory } from '../lib/chitiAudio';

export default function CosmicSearchModal({ isOpen, onClose, onNavigateSection, onOpenConsultation, lang = 'en', theme = 'dark' }) {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = [];

  if (query.trim().length > 1) {
    const q = query.toLowerCase();
    
    JYOTISH_CONCEPTS.forEach(c => {
      if (c.title.toLowerCase().includes(q) || c.brief.toLowerCase().includes(q)) {
        results.push({ type: 'Concept', title: c.title, desc: c.brief, action: () => onNavigateSection('knowledge-section') });
      }
    });

    UPCOMING_EVENTS.forEach(f => {
      if (f.name.toLowerCase().includes(q) || f.tithi.toLowerCase().includes(q)) {
        results.push({ type: 'Festival', title: f.name, desc: `${f.tithi} (${f.dateStr})`, action: () => onNavigateSection('festival-section') });
      }
    });

    MUHURAT_EVENTS.forEach(m => {
      if (m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)) {
        results.push({ type: 'Muhurat', title: m.title, desc: m.desc, action: () => onNavigateSection('muhurat-section') });
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono-data">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.1] dark:border-white/[0.1] p-5 shadow-2xl space-y-3 text-left">
        
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'hi' ? 'तिथि, नक्षत्र, पर्व, मुहूर्त, लग्न खोजें...' : 'Search Tithi, Nakshatra, Festival, Muhurat, Lagna...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37]"
            autoFocus
          />
          <button 
            onClick={() => {
              chitiSensory.playTick();
              onClose();
            }}
            className="p-1 rounded text-[#857E74] dark:text-[#8E8A82] hover:opacity-100 absolute right-2.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#857E74] dark:text-[#6B6760]">
          <span>{lang === 'hi' ? 'प्रमुख शब्द:' : 'Index:'}</span>
          {['Ekadashi', 'Rahu Kaal', 'Rohini', 'Vivah', 'Vimshottari'].map(tag => (
            <button
              key={tag}
              onClick={() => {
                chitiSensory.playTick();
                setQuery(tag);
              }}
              className="px-2 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#0B0C11] border border-black/[0.06] dark:border-white/[0.06] text-[#57524A] dark:text-[#AAA49A] hover:border-[#D4AF37]"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results Stream */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 pt-1 text-xs">
          {query.trim().length > 1 && results.length === 0 && (
            <div className="text-center py-6 text-[11px] text-[#857E74] dark:text-[#6B6760]">
              {lang === 'hi' ? `"${query}" के लिए कोई प्रविष्टि नहीं मिली। आप सीधे विद्वान् से पूछ सकते हैं।` : `No structured index entries found for "${query}". You can consult a scholar directly.`}
            </div>
          )}

          {results.map((res, idx) => (
            <div
              key={idx}
              onClick={() => {
                chitiSensory.playTick();
                res.action();
                onClose();
              }}
              className="p-2.5 rounded-lg bg-[#FAF7F2] dark:bg-[#0B0C11] border border-black/[0.05] dark:border-white/[0.05] hover:border-[#D4AF37]/50 cursor-pointer transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-[9px] uppercase text-[#4848A8] dark:text-[#8B8BF5] font-bold">{res.type}</span>
                <div className="font-semibold text-xs text-[#1C1917] dark:text-[#EFECE6] mt-0.5">{res.title}</div>
                <div className="text-[#57524A] dark:text-[#8E8A82] line-clamp-1 mt-0.5 text-[11px]">{res.desc}</div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[#857E74] dark:text-[#6B6760]" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

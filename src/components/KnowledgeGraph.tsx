'use client';

import React, { useState } from 'react';
import { BookOpen, Sparkles, X } from 'lucide-react';

const CONCEPTS = [
  { id: 'tithi', name: 'Tithi', title: 'Lunar Day', desc: 'The angular distance of 12 degrees between Sun and Moon. Defines 30 lunar days split into Shukla and Krishna Pakshas.' },
  { id: 'nakshatra', name: 'Nakshatra', title: 'Lunar Mansion', desc: '27 star constellations dividing the 360° zodiac into 13°20’ segments. Determines birth energy and Dasha starting point.' },
  { id: 'rashi', name: 'Rashi', title: 'Zodiac Sign', desc: '12 30-degree divisions of the ecliptic, starting with Aries (Mesha) through Pisces (Meena).' },
  { id: 'lagna', name: 'Lagna', title: 'Ascendant', desc: 'The exact zodiac sign rising on the eastern horizon at the moment of birth. Establishes the 1st House.' },
  { id: 'graha', name: 'Graha', title: 'Planetary Force', desc: '9 celestial forces (Surya, Chandra, Mangala, Budha, Guru, Shukra, Shani, Rahu, Ketu) that shape human karma.' },
  { id: 'bhava', name: 'Bhava', title: 'Astrological House', desc: '12 houses representing specific life domains (Self, Wealth, Siblings, Home, Children, Health, Union, Longevity, Luck, Career, Gains, Loss).' },
  { id: 'dasha', name: 'Dasha', title: 'Planetary Period', desc: '120-year Vimshottari Mahadasha timing cycle mapping life chapters governed by specific ruling planets.' },
  { id: 'yoga', name: 'Yoga', title: 'Solar-Lunar Combination', desc: '27 Nitya Yogas formed by adding solar and lunar longitudes. Indicates daily temperamental quality.' },
  { id: 'muhurat', name: 'Muhurat', title: 'Auspicious Window', desc: 'Calculating the exact time window where cosmic planetary influences support a specific human intention.' },
  { id: 'panchang', name: 'Panchang', title: 'Five-Limb Calendar', desc: 'The traditional Vedic almanac tracking Tithi, Vara, Nakshatra, Yoga, and Karana.' },
];

export default function KnowledgeGraph() {
  const [selectedConcept, setSelectedConcept] = useState<typeof CONCEPTS[0] | null>(null);

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto border-b border-purple-500/20 font-body">
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="text-xs font-bold text-[#7C3AED] uppercase tracking-widest">
          VEDIC ASTROLOGICAL LEXICON
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
          Understand the language of Jyotish.
        </h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF]">
          Explore the foundational concepts behind Vedic astronomical calculations and chart analysis.
        </p>
      </div>

      {/* Interactive Constellation of Concepts */}
      <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
        {CONCEPTS.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedConcept(c)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              selectedConcept?.id === c.id
                ? 'bg-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] border border-purple-300'
                : 'bg-black/60 border border-purple-500/30 text-[#D1D5DB] hover:border-purple-500/60 hover:text-white'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Concept Explanation Card */}
      {selectedConcept && (
        <div className="mt-8 max-w-2xl mx-auto chiti-card p-6 border-2 border-purple-500/40 bg-black/80 space-y-3 relative animate-fadeIn">
          <button
            onClick={() => setSelectedConcept(null)}
            className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-wider font-display">
            VEDIC CONCEPT • {selectedConcept.title}
          </div>
          <h3 className="text-xl font-bold text-white font-display">{selectedConcept.name}</h3>
          <p className="text-xs text-[#D1D5DB] leading-relaxed">{selectedConcept.desc}</p>
        </div>
      )}
    </section>
  );
}

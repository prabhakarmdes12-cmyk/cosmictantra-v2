import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { JYOTISH_CONCEPTS } from '../lib/knowledgeGraph';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function KnowledgeGraphSection({ lang = 'en', theme = 'dark' }) {
  const [selectedConcept, setSelectedConcept] = useState(JYOTISH_CONCEPTS[0]);
  const t = TRANSLATIONS[lang]?.knowledge || TRANSLATIONS.en.knowledge;

  return (
    <section id="knowledge-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#FAF7F2] dark:bg-[#07080C] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-[11px] font-mono-data text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-1.5 font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#8E8A82] font-mono-data mt-2">
            {t.subheading}
          </p>
        </div>

        {/* 10-Concept Constellation Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono-data">
          
          {/* Left: 10 Concept Badges */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2">
            {JYOTISH_CONCEPTS.map((concept) => (
              <button
                key={concept.id}
                onClick={() => {
                  chitiSensory.playTick();
                  setSelectedConcept(concept);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedConcept.id === concept.id
                    ? 'bg-[#FFFFFF] dark:bg-[#121420] border-[#8E6F1D] dark:border-[#D4AF37] text-[#1C1917] dark:text-white shadow-md'
                    : 'bg-[#FFFFFF]/70 dark:bg-[#0B0C11] border-black/[0.06] dark:border-white/[0.06] text-[#57524A] dark:text-[#AAA49A] hover:bg-white dark:hover:bg-[#101218]'
                }`}
              >
                <div className="text-[9px] text-[#4848A8] dark:text-[#8B8BF5] uppercase font-bold">{concept.category}</div>
                <div className="font-editorial font-bold text-xs text-[#1C1917] dark:text-[#EFECE6] mt-0.5">{concept.title}</div>
              </button>
            ))}
          </div>

          {/* Right: Deep Dive Inspector Box */}
          <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.08] dark:border-white/[0.08] shadow-2xl space-y-4">
            <div className="border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
              <span className="text-[10px] uppercase text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                {selectedConcept.category} • VEDIC FOUNDATION
              </span>
              <h3 className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">
                {selectedConcept.title}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.05] dark:border-white/[0.05] text-xs text-[#1C1917] dark:text-[#EFECE6] leading-relaxed font-semibold">
              "{selectedConcept.brief}"
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] uppercase tracking-wider font-bold">
                {t.deepDive}
              </div>
              <p className="text-[#57524A] dark:text-[#8E8A82] leading-relaxed">
                {selectedConcept.deepDive}
              </p>
            </div>

            <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[10px] text-[#857E74] dark:text-[#6B6760]">
              <span>{t.corpus}</span>
              <span className="text-[#8E6F1D] dark:text-[#8E7745]">CosmicTantra 2026</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

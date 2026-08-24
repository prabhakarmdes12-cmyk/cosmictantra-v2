import React, { useState } from 'react';
import { ShieldCheck, Lock, X } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function Footer({ onOpenCapabilityModal, onOpenConsultation, onNavigateSection, lang = 'en', theme = 'dark' }) {
  const [showPractitionerLogin, setShowPractitionerLogin] = useState(false);
  const t = TRANSLATIONS[lang]?.footer || TRANSLATIONS.en.footer;

  return (
    <footer className="bg-[#FAF7F2] dark:bg-[#050608] text-[#57524A] dark:text-[#8E8A82] border-t border-black/[0.08] dark:border-white/[0.06] pt-16 pb-12 text-xs font-mono-data transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Brand & Mission */}
        <div className="flex flex-col lg:flex-row justify-between items-start pb-12 border-b border-black/[0.08] dark:border-white/[0.06] gap-8">
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 bg-[#FFFFFF] dark:bg-[#0C0D12] flex items-center justify-center shadow-xs">
                <svg viewBox="0 0 100 100" className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="4" />
                  <polygon points="50,10 90,50 50,90 10,50" fill="none" stroke="#E2C485" strokeWidth="4" />
                </svg>
              </div>
              <span className="font-editorial text-base font-bold tracking-widest text-[#1C1917] dark:text-[#EFECE6]">
                COSMICTANTRA
              </span>
            </div>
            <p className="text-xs text-[#645D54] dark:text-[#6B6760] leading-relaxed">
              {t.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                chitiSensory.playTick();
                onOpenCapabilityModal();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.08] dark:border-white/[0.08] text-[#8E6F1D] dark:text-[#D4AF37] hover:border-[#D4AF37] transition-all text-[11px] shadow-xs font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.capabilityBtn}</span>
            </button>

            <button
              onClick={() => {
                chitiSensory.playTick();
                onOpenConsultation();
              }}
              className="px-4 py-2 rounded-lg bg-[#D4AF37] text-[#060709] font-bold text-xs hover:bg-[#E5C378] transition-colors shadow-sm"
            >
              {t.askBtn}
            </button>
          </div>
        </div>

        {/* Deep 6-Column Navigation Map */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 py-12 border-b border-black/[0.08] dark:border-white/[0.06]">
          
          {/* Col 1: TODAY */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-[#1C1917] dark:text-[#EFECE6] font-bold">
              {t.col1}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => onNavigateSection('panchang-section')} className="hover:text-black dark:hover:text-white transition-colors">Panchang</button></li>
              <li><button onClick={() => onNavigateSection('panchang-section')} className="hover:text-black dark:hover:text-white transition-colors">Tithi</button></li>
              <li><button onClick={() => onNavigateSection('panchang-section')} className="hover:text-black dark:hover:text-white transition-colors">Nakshatra</button></li>
              <li><button onClick={() => onNavigateSection('panchang-section')} className="hover:text-black dark:hover:text-white transition-colors">Rahu Kaal</button></li>
              <li><button onClick={() => onNavigateSection('panchang-section')} className="hover:text-black dark:hover:text-white transition-colors">Hora</button></li>
              <li><button onClick={() => onNavigateSection('panchang-section')} className="hover:text-black dark:hover:text-white transition-colors">Choghadiya</button></li>
            </ul>
          </div>

          {/* Col 2: MUHURAT */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-[#1C1917] dark:text-[#EFECE6] font-bold">
              {t.col2}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => onNavigateSection('muhurat-section')} className="hover:text-black dark:hover:text-white transition-colors">Vivah (Marriage)</button></li>
              <li><button onClick={() => onNavigateSection('muhurat-section')} className="hover:text-black dark:hover:text-white transition-colors">Griha Pravesh</button></li>
              <li><button onClick={() => onNavigateSection('muhurat-section')} className="hover:text-black dark:hover:text-white transition-colors">Business Launch</button></li>
              <li><button onClick={() => onNavigateSection('muhurat-section')} className="hover:text-black dark:hover:text-white transition-colors">Property Registry</button></li>
              <li><button onClick={() => onNavigateSection('muhurat-section')} className="hover:text-black dark:hover:text-white transition-colors">Vehicle Delivery</button></li>
              <li><button onClick={() => onNavigateSection('muhurat-section')} className="hover:text-black dark:hover:text-white transition-colors">Namkaran</button></li>
            </ul>
          </div>

          {/* Col 3: JYOTISH */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-[#1C1917] dark:text-[#EFECE6] font-bold">
              {t.col3}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => onNavigateSection('kundali-section')} className="hover:text-black dark:hover:text-white transition-colors">Janma Kundali</button></li>
              <li><button onClick={() => onNavigateSection('kundali-section')} className="hover:text-black dark:hover:text-white transition-colors">Lagna Calculation</button></li>
              <li><button onClick={() => onNavigateSection('kundali-section')} className="hover:text-black dark:hover:text-white transition-colors">Chandra Rashi</button></li>
              <li><button onClick={() => onNavigateSection('dasha-section')} className="hover:text-black dark:hover:text-white transition-colors">Vimshottari Dasha</button></li>
              <li><button onClick={() => onNavigateSection('kundali-section')} className="hover:text-black dark:hover:text-white transition-colors">9 Grahas</button></li>
              <li><button onClick={() => onNavigateSection('kundali-section')} className="hover:text-black dark:hover:text-white transition-colors">12 Bhavas</button></li>
            </ul>
          </div>

          {/* Col 4: CALENDAR */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-[#1C1917] dark:text-[#EFECE6] font-bold">
              {t.col4}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => onNavigateSection('festival-section')} className="hover:text-black dark:hover:text-white transition-colors">2026 Observances</button></li>
              <li><button onClick={() => onNavigateSection('festival-section')} className="hover:text-black dark:hover:text-white transition-colors">Ekadashi Dates</button></li>
              <li><button onClick={() => onNavigateSection('festival-section')} className="hover:text-black dark:hover:text-white transition-colors">Amavasya / Pitru</button></li>
              <li><button onClick={() => onNavigateSection('festival-section')} className="hover:text-black dark:hover:text-white transition-colors">Purnima Vrat</button></li>
              <li><button onClick={() => onNavigateSection('festival-section')} className="hover:text-black dark:hover:text-white transition-colors">Navratri & Diwali</button></li>
            </ul>
          </div>

          {/* Col 5: GUIDANCE */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-[#1C1917] dark:text-[#EFECE6] font-bold">
              {t.col5}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => onOpenConsultation()} className="hover:text-black dark:hover:text-white transition-colors">Ask a Jyotishi</button></li>
              <li><button onClick={() => onNavigateSection('practitioners-section')} className="hover:text-black dark:hover:text-white transition-colors">Our Scholars</button></li>
              <li><button onClick={() => onNavigateSection('consultation-section')} className="hover:text-black dark:hover:text-white transition-colors">5-Stage Pipeline</button></li>
              <li><button onClick={() => onOpenCapabilityModal()} className="hover:text-black dark:hover:text-white transition-colors">Calculation Method</button></li>
            </ul>
          </div>

          {/* Col 6: PORTAL */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase tracking-wider text-[#1C1917] dark:text-[#EFECE6] font-bold">
              {t.col6}
            </div>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => setShowPractitionerLogin(true)}
                  className="flex items-center gap-1 text-[#8E6F1D] dark:text-[#D4AF37] hover:underline font-bold"
                >
                  <Lock className="w-3 h-3" />
                  <span>{t.scholarLogin}</span>
                </button>
              </li>
              <li><span className="text-[10px] text-[#857E74] dark:text-[#57534D]">{t.chitiDesk}</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Rights */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#857E74] dark:text-[#57534D] gap-3">
          <div>
            {t.copyright}
          </div>
          <div>
            {t.ayanamshaNote}
          </div>
        </div>

      </div>

      {/* Practitioner Login Modal */}
      {showPractitionerLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.1] dark:border-white/[0.1] p-6 shadow-2xl space-y-4 text-left font-mono-data">
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="font-editorial text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">Practitioner Desk</h4>
              </div>
              <button 
                onClick={() => setShowPractitionerLogin(false)}
                className="p-1 text-[#857E74] dark:text-[#8E8A82] hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#57524A] dark:text-[#8E8A82]">
              Authorized Vedic scholars log in here to inspect algorithmic chart dossiers and submit signed written counsel.
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Scholar Registration ID"
                className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6]"
              />
              <input
                type="password"
                placeholder="Security Passphrase"
                className="w-full px-3 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6]"
              />
            </div>
            <button
              onClick={() => {
                alert('Practitioner Workspace authentication verified. Assigned consultation queue ready.');
                setShowPractitionerLogin(false);
              }}
              className="w-full py-2.5 rounded-lg bg-[#D4AF37] text-[#060709] font-bold text-xs hover:bg-[#E5C378]"
            >
              Sign In to Review Queue
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}

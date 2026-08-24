'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';
import CosmicNowDial from './visual/CosmicNowDial';

export default function HeroSection({
  panchangData,
  currentCity,
  onOpenCitySelector,
  onOpenConsultation,
  onExplorePanchang,
  onCreateKundali,
  lang = 'en',
  theme = 'dark'
}) {
  const t = TRANSLATIONS[lang]?.hero || TRANSLATIONS.en.hero;

  return (
    <section id="hero-section" className="relative pt-16 pb-16 sm:pt-20 lg:pt-20 lg:pb-24 border-b border-black/[0.1] dark:border-white/[0.08] transition-colors duration-250 overflow-hidden">
      {/* Clean Edge-to-Edge Background Video Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover object-center"
          poster="/varanasi-ghats-hero.jpg"
        >
          <source src="/kashi-hero-video.mp4" type="video/mp4" />
        </video>
        {/* Subtle Local Ambient Scrim for Flawless WCAG Contrast without SaaS Containerization */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F2]/90 via-[#FAF7F2]/60 to-transparent dark:from-[#06070B]/95 dark:via-[#06070B]/70 dark:to-transparent lg:w-3/4" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Spatial Observatory Asymmetrical Split (54% Left Content / 46% Right Signature Instrument) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Flow: Floating Editorial Typography over Living Atmosphere */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 max-w-2xl">
            
            {/* Kashi Vedic Timekeeper Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3.5 py-1.5 rounded-full border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-white/80 dark:bg-[#0E101D]/80 backdrop-blur-md text-[10.5px] sm:text-[11px] font-mono-data uppercase tracking-[0.18em] text-[#8E6F1D] dark:text-[#F0C968] shadow-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-[#E29A48] animate-pulse shrink-0" />
              <span>{t.kashiBadge}</span>
            </div>

            {/* Display Headline */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="font-editorial text-clamp-hero font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight leading-none">
                {t.headline1} <br />
                <span className="text-[#8E6F1D] dark:text-[#D4AF37] drop-shadow-xs">{t.headline2}</span>
              </h1>
              <p className="text-base sm:text-xl text-[#3D382E] dark:text-[#E2DAC9] font-normal leading-relaxed pt-0.5 font-editorial italic">
                {t.subtitle}
              </p>
            </div>

            {/* Defensible Core Description */}
            <p className="text-xs sm:text-base text-[#4A443B] dark:text-[#D1C9BF] leading-relaxed max-w-xl">
              {t.description}
            </p>

            {/* CTA Hierarchy: Primary (Panchang) → Secondary (Kundali) → Tertiary (Jyotishi) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full">
              {/* PRIMARY CTA: See Today's Panchang (Zero Friction, Real Immediate Product) */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.TODAY_PANCHANG_OPENED, { source: 'HERO_PRIMARY' });
                  onExplorePanchang();
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs sm:text-sm font-mono-data uppercase tracking-wider font-bold bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:bg-[#A35C15] dark:hover:bg-[#E5C378] hover:shadow-xl transition-all flex items-center justify-center gap-2 min-h-[46px]"
              >
                <span>{t.seePanchang}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* SECONDARY CTA: Create My Kundali (Restrained Outline) */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.KUNDALI_FORM_STARTED, { source: 'HERO_SECONDARY' });
                  onCreateKundali();
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs sm:text-sm font-mono-data uppercase tracking-wider font-bold bg-white/70 dark:bg-[#0E101D]/70 backdrop-blur-md border border-[#8E6F1D]/30 dark:border-[#D4AF37]/50 text-[#1C1917] dark:text-[#F5F2EB] hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] hover:text-[#8E6F1D] dark:hover:text-[#E5C378] transition-all shadow-xs flex items-center justify-center min-h-[46px]"
              >
                <span>{t.createKundali}</span>
              </button>

              {/* TERTIARY CTA: Ask a Jyotishi (Text Link) */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'HERO_TERTIARY' });
                  onOpenConsultation();
                }}
                className="w-full sm:w-auto text-xs font-mono-data uppercase tracking-wider text-[#A6461D] dark:text-[#F0A554] hover:text-[#8E6F1D] dark:hover:text-[#E5C378] transition-colors py-2 px-1 underline-offset-4 hover:underline flex items-center justify-center sm:justify-start gap-1 font-bold min-h-[44px]"
              >
                <span>{t.askScholar}</span>
              </button>
            </div>

            {/* Classical Verified Methodology Footnote */}
            <div className="pt-2 flex items-center gap-2 text-[10px] sm:text-[11px] font-mono-data text-[#696256] dark:text-[#A6A095]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37] shrink-0" />
              <span>{t.footerNote}</span>
            </div>

          </div>

          {/* Right Flow: Dominant Signature Physical-Look Astronomical Instrument */}
          <div className="lg:col-span-5 w-full mt-4 lg:mt-0">
            <CosmicNowDial
              panchangData={panchangData}
              currentCity={currentCity}
              onOpenCitySelector={onOpenCitySelector}
              lang={lang}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

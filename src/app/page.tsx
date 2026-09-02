'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, HeartHandshake, Sparkles } from 'lucide-react';
import { DEFAULT_CITY } from '@/lib/cities';
import { calculatePanchang } from '@/lib/panchang';
import { calculateKundali } from '@/lib/astrologyEngine';
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics';

import nextDynamic from 'next/dynamic';

// Primary Above-the-Fold Components (Eager)
import GlobalHeader from '@/components/layout/GlobalHeader';
import LanguageSelectorModal from '@/components/layout/LanguageSelectorModal';
import PersonalisationBridge from '@/components/PersonalisationBridge';
import HeroSection from '@/components/HeroSection';
import TodayAtAGlance from '@/components/TodayAtAGlance';
import FestivalStrip from '@/components/FestivalStrip';
import GlobalFooter from '@/components/layout/GlobalFooter';
import FloatingAIGuruAvatar from '@/components/consultation/FloatingAIGuruAvatar';

import { getPersistedLocation, LOCATION_CHANGE_EVENT, LocationAnchor } from '@/lib/location';
// Dynamic Load for Modals
const CitySelectorModal = nextDynamic(() => import('@/components/CitySelectorModal'), { ssr: false });

// Disable static prerendering — homepage uses new Date() (panchang) which must be server-rendered fresh
export const dynamic = 'force-dynamic';

export default function AppLandingPage() {
  const [currentCity, setCurrentCity] = useState<any>(DEFAULT_CITY);
  // Initialize with a computed value; also refreshed client-side via useEffect
  const [panchangData, setPanchangData] = useState<any>(() => calculatePanchang(new Date(), DEFAULT_CITY));
  const [kundaliData, setKundaliData] = useState(null);

  // Day/Night & Language State (Chiti UDS v3 compliant — Light/Day mode default, SSR-safe)
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Modals state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Sync client-persisted preferences and real-time location on mount to eliminate SSR hydration mismatch
  useEffect(() => {
    setIsClientMounted(true);
    // Initialize panchang client-side only (uses new Date() which differs between server & client)
    setPanchangData(calculatePanchang(new Date(), DEFAULT_CITY));
    try {
      const savedTheme = localStorage.getItem('cosmictantra_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
      const savedLang = localStorage.getItem('cosmictantra_lang');
      if (savedLang) {
        setLang(savedLang);
      }
      const savedLoc = getPersistedLocation();
      if (savedLoc && savedLoc.lat && savedLoc.lng) {
        setCurrentCity(savedLoc);
      }
    } catch {}

    const handleLocChange = (e: any) => {
      if (e?.detail) {
        setCurrentCity(e.detail);
      }
    };

    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocChange);
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocChange);
  }, []);

  // Sync theme class to root html
  useEffect(() => {
    if (!isClientMounted) return;
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    try {
      localStorage.setItem('cosmictantra_theme', theme);
    } catch {}
  }, [theme, isClientMounted]);

  // Keep the preference available to every route and update document semantics.
  useEffect(() => {
    if (!isClientMounted) return;
    document.documentElement.lang = lang;
    try { localStorage.setItem('cosmictantra_lang', lang); } catch {}
    window.dispatchEvent(new CustomEvent('cosmictantra:language-change', { detail: lang }));
  }, [lang, isClientMounted]);

  // Update panchang when city changes
  useEffect(() => {
    const updated = calculatePanchang(new Date(), currentCity);
    setPanchangData(updated);
  }, [currentCity]);

  // Initial visit analytics
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.HOME_VIEW, { city: currentCity.name, theme, lang });
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleLang = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const handleOpenConsultation = () => {
    window.location.href = '/ask';
  };

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] selection:bg-[#D4AF37]/30 selection:text-black dark:selection:text-white transition-colors duration-300">
      
      {/* 1. Global Consumer Navigation with Theme & Language Toggles */}
      <GlobalHeader
        currentCity={currentCity}
        onOpenCitySelector={() => setIsCityModalOpen(true)}
        onOpenConsultation={() => handleOpenConsultation()}
        theme={theme}
        onThemeToggle={handleToggleTheme}
        lang={lang}
        onLangToggle={() => setIsLanguageModalOpen(true)}
      />

      {/* 2. Personalisation Bridge */}
      <PersonalisationBridge
        kundaliData={kundaliData}
        onClearProfile={() => setKundaliData(null)}
        lang={lang}
        theme={theme}
      />

      <main className="flex-1">
        {isClientMounted ? (
          <>
        {/* 3. Hero & Live "Cosmic Now" Precision Instrument */}
        <HeroSection
          panchangData={panchangData}
          currentCity={currentCity}
          onOpenCitySelector={() => setIsCityModalOpen(true)}
          onOpenConsultation={() => handleOpenConsultation()}
          onExplorePanchang={() => handleNavigateSection('panchang-section')}
          onCreateKundali={() => handleNavigateSection('hero-section')}
          lang={lang}
          theme={theme}
        />

        {/* 4. Today At A Glance (Vedic Day Arc & Stepped Ribbon) */}
        <TodayAtAGlance
          panchangData={panchangData}
          currentCity={currentCity}
          onOpenConsultation={handleOpenConsultation}
          lang={lang}
          theme={theme}
        />

        {/* 5. Compact access to deeper tools without competing with the core journey */}
        <section className="px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="explore-heading">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 max-w-2xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#8E6F1D] dark:text-[#D4AF37]">
                {lang === 'hi' ? 'आगे अन्वेषण करें' : 'Explore when you need more'}
              </p>
              <h2 id="explore-heading" className="font-editorial text-3xl font-bold text-[#1C1917] dark:text-white sm:text-4xl">
                {lang === 'hi' ? 'एक स्पष्ट अगला कदम चुनें' : 'Choose one clear next step'}
              </h2>
              <p className="mt-3 text-base leading-7 text-[#5F584E] dark:text-[#B8B1A5]">
                {lang === 'hi'
                  ? 'दैनिक समय, सम्बन्ध, शुभ मुहूर्त और अध्ययन के उपकरण एक स्थान पर उपलब्ध हैं।'
                  : 'Open focused tools for daily timing, relationships, auspicious dates, or study.'}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: '/calendar', title: lang === 'hi' ? 'वैदिक कैलेंडर' : 'Vedic calendar', detail: lang === 'hi' ? 'तिथि, पर्व और शुभ दिन' : 'Tithi, festivals and useful dates', icon: CalendarDays },
                { href: '/milan', title: lang === 'hi' ? 'कुण्डली मिलान' : 'Kundali Milan', detail: lang === 'hi' ? 'दो जन्म विवरणों का 36-गुण अष्टकूट मिलान' : 'Classical 36-Guna Ashtakoota Milan report', icon: HeartHandshake },
                { href: '/muhurat/personalized', title: lang === 'hi' ? 'व्यक्तिगत मुहूर्त' : 'Personal Muhurat', detail: lang === 'hi' ? 'महत्वपूर्ण कार्य का सही समय' : 'Find timing for an important event', icon: Sparkles },
                { href: '/library', title: lang === 'hi' ? 'वैदिक पुस्तकालय' : 'Vedic library', detail: lang === 'hi' ? 'विधि और शब्द सरल रूप में' : 'Understand methods and terminology', icon: BookOpen },
              ].map(({ href, title, detail, icon: Icon }) => (
                <Link key={href} href={href} className="group min-h-32 rounded-2xl border border-black/10 bg-white/75 p-5 transition hover:-translate-y-0.5 hover:border-[#8E6F1D]/60 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-[#D4AF37]/60">
                  <Icon className="mb-4 h-6 w-6 text-[#8E6F1D] dark:text-[#D4AF37]" aria-hidden="true" />
                  <h3 className="text-base font-bold text-[#1C1917] dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#696256] dark:text-[#AAA397]">{detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Festival & Vrat Strip (Cultural Calendar 2026) */}
        <FestivalStrip
          lang={lang}
          theme={theme}
        />

          </>
        ) : (
          <section className="mx-auto flex min-h-[70vh] max-w-5xl items-center px-4 py-20 sm:px-6" aria-label="Loading current Vedic calculations">
            <div className="w-full animate-pulse space-y-6">
              <div className="h-5 w-40 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15" />
              <div className="h-16 max-w-2xl rounded-2xl bg-black/[0.06] dark:bg-white/[0.06]" />
              <div className="h-36 rounded-3xl bg-black/[0.04] dark:bg-white/[0.04]" />
            </div>
          </section>
        )}
      </main>

      <GlobalFooter lang={lang} />

      {/* AI Guru Chatbot — floating on every platform surface */}
      <FloatingAIGuruAvatar />

      {/* Modals & Dialogs */}
      <LanguageSelectorModal
        isOpen={isLanguageModalOpen}
        currentLang={lang}
        onClose={() => setIsLanguageModalOpen(false)}
        onSelectLang={(newLang) => setLang(newLang)}
      />

      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        currentCity={currentCity}
        onSelectCity={(city: any) => setCurrentCity(city)}
        lang={lang}
        theme={theme}
      />

    </div>
  );
}

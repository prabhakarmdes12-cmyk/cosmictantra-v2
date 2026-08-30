'use client';

import React, { useState, useEffect } from 'react';
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
import IntentRouter from '@/components/IntentRouter';
import MuhuratDiscovery from '@/components/MuhuratDiscovery';
import FestivalStrip from '@/components/FestivalStrip';
import WorldToYouTransition from '@/components/WorldToYouTransition';
import SampleKundlisShowcase from '@/components/SampleKundlisShowcase';
import DashaHero from '@/components/DashaHero';
import MethodologySection from '@/components/MethodologySection';
import PractitionersSection from '@/components/PractitionersSection';
import ConsultationOffer from '@/components/ConsultationOffer';
import SampleConsultation from '@/components/SampleConsultation';
import AskBetterQuestions from '@/components/AskBetterQuestions';
import KnowledgeGraphSection from '@/components/KnowledgeGraphSection';
import FinalChapterCta from '@/components/FinalChapterCta';
import Footer from '@/components/Footer';

import { getPersistedLocation, LOCATION_CHANGE_EVENT, LocationAnchor } from '@/lib/location';
import HelpDeskCtaBanner from '@/components/helpdesk/HelpDeskCtaBanner';

// Dynamic Load for Heavy WebGL Canvas & Modals
const SwargaLok = nextDynamic(() => import('@/components/SwargaLok'), { ssr: false });
const CitySelectorModal = nextDynamic(() => import('@/components/CitySelectorModal'), { ssr: false });
const CosmicSearchModal = nextDynamic(() => import('@/components/CosmicSearchModal'), { ssr: false });
const CapabilityRegistryModal = nextDynamic(() => import('@/components/CapabilityRegistryModal'), { ssr: false });
const ConsultationModal = nextDynamic(() => import('@/components/ConsultationModal'), { ssr: false });
import FloatingAIGuruAvatar from '@/components/consultation/FloatingAIGuruAvatar';

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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCapabilityModalOpen, setIsCapabilityModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationPrompt, setConsultationPrompt] = useState('');

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

  // Sync language to localStorage
  useEffect(() => {
    if (!isClientMounted) return;
    try {
      localStorage.setItem('cosmictantra_lang', lang);
    } catch {}
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

  const handleOpenConsultation = (initialPrompt = '') => {
    setConsultationPrompt(initialPrompt);
    setIsConsultationModalOpen(true);
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

        {/* Free WhatsApp Help Desk Direct Entry Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <HelpDeskCtaBanner source="HOME" lang={lang === 'hi' ? 'hi' : 'en'} />
        </div>

        {/* 4. Today At A Glance (Vedic Day Arc & Stepped Ribbon) */}
        <TodayAtAGlance
          panchangData={panchangData}
          currentCity={currentCity}
          onOpenConsultation={() => handleOpenConsultation('Daily Muhurat Consultation')}
          lang={lang}
          theme={theme}
        />

        {/* 5. What Brought You Here? (Primary Intent Router) */}
        <IntentRouter
          onSelectIntent={(id: string) => handleNavigateSection(id)}
          onOpenConsultation={handleOpenConsultation}
          onExplorePanchang={() => handleNavigateSection('panchang-section')}
          onCreateKundali={() => handleNavigateSection('hero-section')}
          onOpenDasha={() => handleNavigateSection('dasha-section')}
          onOpenFestivals={() => handleNavigateSection('festival-section')}
          onOpenMuhurat={() => handleNavigateSection('muhurat-section')}
          lang={lang}
          theme={theme}
        />

        {/* 6. Muhurat Discovery */}
        <MuhuratDiscovery
          onOpenConsultation={handleOpenConsultation}
          lang={lang}
          theme={theme}
        />

        {/* 7. Festival & Vrat Strip (Cultural Calendar 2026) */}
        <FestivalStrip
          lang={lang}
          theme={theme}
        />

        {/* 8. World to You Transition */}
        <WorldToYouTransition
          lang={lang}
          theme={theme}
        />

        {/* 9. Qualified Sample Kundlis Showcase */}
        <SampleKundlisShowcase
          lang={lang}
          theme={theme}
        />

        {/* 10. Vimshottari Dasha Hero Product (with 3-Tier Granular Drill-Down) */}
        <DashaHero
          kundaliData={kundaliData}
          onOpenConsultation={handleOpenConsultation}
          lang={lang}
          theme={theme}
        />

        {/* 11. Swarga Lok (Brand Theatre & 3D Nakshatra Sphere) */}
        <SwargaLok
          lang={lang}
          theme={theme}
          kundaliData={kundaliData}
        />

        {/* 12. Methodology (Calculation is not Interpretation) */}
        <MethodologySection
          onOpenConsultation={handleOpenConsultation}
          lang={lang}
          theme={theme}
        />

        {/* 13. Practicing Jyotishis & Video Trust Archive */}
        <PractitionersSection
          onOpenConsultation={handleOpenConsultation}
          lang={lang}
          theme={theme}
        />

        {/* 14. ₹501 Consultation Offer & 5-Stage Transparent Pipeline */}
        <ConsultationOffer
          onOpenConsultation={handleOpenConsultation}
          lang={lang}
          theme={theme}
        />

        {/* 15. Sample Real Written Consultation Demonstration */}
        <SampleConsultation
          lang={lang}
          theme={theme}
        />

        {/* 16. Ask Better Questions (Conversion & Formulation Tool) */}
        <AskBetterQuestions
          onOpenConsultation={handleOpenConsultation}
          lang={lang}
          theme={theme}
        />

        {/* 17. Knowledge Graph / Jyotish Constellation */}
        <KnowledgeGraphSection
          lang={lang}
          theme={theme}
        />

        {/* 18. Final Chapter CTA */}
        <FinalChapterCta
          panchangData={panchangData}
          onOpenConsultation={handleOpenConsultation}
          onMeetPractitioners={() => handleNavigateSection('practitioners-section')}
          lang={lang}
          theme={theme}
        />
      </main>

      {/* 19. Deep Information Map Footer */}
      <Footer
        onOpenCapabilityModal={() => setIsCapabilityModalOpen(true)}
        onOpenConsultation={handleOpenConsultation}
        onNavigateSection={handleNavigateSection}
        lang={lang}
        theme={theme}
      />

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

      <CosmicSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigateSection={handleNavigateSection}
        onOpenConsultation={handleOpenConsultation}
        lang={lang}
        theme={theme}
      />

      <CapabilityRegistryModal
        isOpen={isCapabilityModalOpen}
        onClose={() => setIsCapabilityModalOpen(false)}
        lang={lang}
        theme={theme}
      />

      <ConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        initialQuestion={consultationPrompt}
        kundaliData={kundaliData}
        lang={lang}
        theme={theme}
      />

      {/* Floating Free WhatsApp Help Desk Direct Pill */}
      <HelpDeskCtaBanner variant="floating" source="HOME" lang={lang === 'hi' ? 'hi' : 'en'} />

      {/* Floating AI Guru Concierge Avatar & Proactive Guide */}
      <FloatingAIGuruAvatar />

    </div>
  );
}

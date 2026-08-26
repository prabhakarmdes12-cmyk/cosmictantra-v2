'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Shield, Menu, X, ArrowUpRight, Sun, Moon, Languages, Compass } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

  const TOOL_LINKS = [
  { href: '/numerology/name', label: 'Name Numerology' },
  { href: '/numerology/business-name', label: 'Business Name' },
  { href: '/numerology/mobile-number', label: 'Mobile Number' },
  { href: '/numerology/baby-names', label: 'Baby Names' },
  { href: '/kundali-milan', label: 'Kundali Milan' },
  { href: '/calendar', label: 'Monthly Vedic Calendar' },
  { href: '/family', label: 'Family Profiles' },
  { href: '/profile', label: 'Cosmic ID + Profile' },
  { href: '/daily', label: 'Daily Cosmic Forecast' },
  { href: '/dashboard', label: 'Scholar’s Desk' },
  { href: '/pandit/workspace', label: 'Pandit Workspace' },
  { href: '/payments/test', label: 'Payments Test' },
  { href: '/darshan', label: 'Live Darshan' },
  { href: '/library', label: 'Vedic Library' },
];

import CosmicTantraLogo from './visual/CosmicTantraLogo';

export default function Navigation({
  currentCity,
  onOpenCitySelector,
  onOpenSearch,
  onOpenConsultation,
  onOpenCapabilityModal,
  activeProfile,
  theme,
  onToggleTheme,
  lang,
  onToggleLang
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleExploreNav = (href) => {
    chitiSensory.playTick();
    setExploreOpen(false);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };


  const handleNavClick = (sectionId, label) => {
    chitiSensory.playTick();
    setMobileMenuOpen(false);
    setExploreOpen(false);

    analytics.track(ANALYTICS_EVENTS.INTENT_SELECTED, { intent: label });
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleThemeSwitch = () => {
    chitiSensory.playTick();
    onToggleTheme();
  };

  const handleLangSwitch = () => {
    chitiSensory.playTick();
    onToggleLang();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.1] dark:border-white/[0.08] bg-[#F8F5EE]/95 dark:bg-[#060709]/95 backdrop-blur-md shadow-xs transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 relative">
        
        {/* Left Section: Primary Desktop Nav & Mobile Menu Toggle */}
        <div className="flex items-center gap-3 lg:gap-5 flex-1 justify-start">
          {/* Mobile Menu Button on Left */}
          <button
            onClick={() => {
              chitiSensory.playTick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#0D0F18] text-[#181512] dark:text-[#F5F2EB] shrink-0 cursor-pointer"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Primary Desktop Nav Links (Core Items + Explore Dropdown) */}
          <nav className="hidden lg:flex items-center gap-3.5 xl:gap-5 text-xs font-mono-data tracking-wider uppercase text-[#332E27] dark:text-[#EAE6DF] font-bold">
            <Link
              href="/daily"
              onClick={() => chitiSensory.playTick()}
              className="text-[#826315] dark:text-[#F0C968] hover:underline transition-colors py-1 flex items-center gap-1 font-bold"
            >
              <span>{lang === 'hi' ? 'दैनिक राशिफल' : '72h Forecast'}</span>
            </Link>
            <Link
              href="/calendar"
              data-testid="nav-desktop-calendar"
              onClick={() => chitiSensory.playTick()}
              className="text-[#826315] dark:text-[#F0C968] hover:underline transition-colors py-1 flex items-center gap-1 font-bold"
            >
              <span>{lang === 'hi' ? 'मासिक कैलेंडर' : 'Monthly Calendar'}</span>
            </Link>
            <Link
              href="/family-panchang"
              onClick={() => chitiSensory.playTick()}
              className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1"
            >
              {lang === 'hi' ? 'परिवार' : 'Parivaar'}
            </Link>
            <button 
              onClick={() => handleNavClick('panchang-section', 'TODAY_PANCHANG')}
              className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none cursor-pointer"
            >
              {t.nav.today}
            </button>
            <button 
              onClick={() => handleNavClick('muhurat-section', 'MUHURAT')}
              className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none cursor-pointer"
            >
              {t.nav.muhurat}
            </button>
            <button 
              onClick={() => handleNavClick('kundali-section', 'KUNDALI')}
              className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none cursor-pointer"
            >
              {t.nav.kundali}
            </button>

            {/* Explore ▾ Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setExploreOpen(!exploreOpen)}
                className="flex items-center gap-1 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none cursor-pointer"
                aria-expanded={exploreOpen}
              >
                <span>{t.nav.explore || 'Explore'}</span>
                <span className="text-[9px] opacity-70">▾</span>
              </button>

              {exploreOpen && (
                <>
                  {/* Invisible backdrop to catch clicks outside without interrupting inner clicks */}
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setExploreOpen(false)} 
                  />
                  <div 
                    className="absolute left-0 top-full pt-1 z-50 w-64"
                  >
                    <div className="rounded-xl border border-[#826315]/25 dark:border-[#D4AF37]/30 bg-[#FFFFFF] dark:bg-[#0B0D14] shadow-2xl p-2 space-y-0.5 max-h-[80vh] overflow-y-auto">
                      <button
                        onClick={() => handleExploreNav('/calendar')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#826315] dark:text-[#F0C968] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                      >
                        📅 Monthly Vedic Calendar
                      </button>
                      <button
                        onClick={() => handleExploreNav('/daily')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#826315] dark:text-[#F0C968] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                      >
                        🔮 72h Forecast & Transits
                      </button>
                      <button
                        onClick={() => handleExploreNav('/family-panchang')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        👥 Parivaar Family Panchang
                      </button>
                      <button
                        onClick={() => handleExploreNav('/dashboard')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        🏛️ Scholar’s Desk (Kundali)
                      </button>
                      <button
                        onClick={() => handleExploreNav('/report')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        📜 Written Folio Archive
                      </button>
                      <button
                        onClick={() => handleNavClick('dasha-section', 'DASHA')}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        {t.nav.dasha} Chapters
                      </button>
                      <button
                        onClick={() => handleNavClick('festival-section', 'FESTIVALS')}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        {t.nav.festivals}
                      </button>
                      <button
                        onClick={() => handleExploreNav('/kundali-milan')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        💍 Kundali Milan
                      </button>
                      <button
                        onClick={() => handleExploreNav('/numerology/name')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        🔢 Chaldean Numerology
                      </button>

                      <button
                        onClick={() => handleExploreNav('/aarti-stotra')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        🪔 Aarti & Stotra Library
                      </button>
                      <button
                        onClick={() => handleExploreNav('/upaya')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        💎 Planetary Upaya Studio
                      </button>
                      <button
                        onClick={() => handleExploreNav('/remedy-tracker')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        📿 Daily Japa Tracker
                      </button>
                      <button
                        onClick={() => handleExploreNav('/darshan')}
                        className="w-full text-left block px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        🌸 Live Kashi Darshan
                      </button>
                      <button
                        onClick={() => handleNavClick('swarga-lok-section', 'SWARGA_LOK')}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#826315] dark:text-[#F0C968] hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
                      >
                        {t.nav.observatory} (3D)
                      </button>
                      <button
                        onClick={() => handleNavClick('methodology-section', 'METHODOLOGY')}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors cursor-pointer"
                      >
                        {t.nav.methodology || 'Methodology'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </nav>
        </div>



        {/* Center: Prominent Brand Anchor (Centered & Slightly Bigger) */}
        <div className="flex items-center justify-center shrink-0">
          <Link 
            href="/" 
            className="focus:outline-none flex items-center justify-center"
            onClick={() => {
              chitiSensory.playTick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <CosmicTantraLogo subtitle={t.brandSubtitle} size="lg" />
          </Link>
        </div>


        {/* Right Section: Language, Theme, Location, Search, and Primary CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-end shrink-0">
          {/* Desktop Language Toggle (Hindi / English) */}
          <button
            onClick={handleLangSwitch}
            aria-label="Toggle Language"
            title={lang === 'en' ? 'Switch to हिन्दी (Hindi)' : 'Switch to English'}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#0D0F18] text-xs font-mono-data text-[#181512] dark:text-[#F5F2EB] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs"
          >
            <Languages className="w-3.5 h-3.5 text-[#826315] dark:text-[#E5C378]" />
            <span className="font-bold">{lang === 'en' ? 'हिन्दी' : 'ENG'}</span>
          </button>

          {/* Desktop High-Contrast Day / Night Theme Toggle Button */}
          <button
            onClick={handleThemeSwitch}
            aria-label="Toggle Day / Night Mode"
            title={theme === 'dark' ? 'Switch to Subah-e-Banaras (Day Mode)' : 'Switch to Kashi Sandhya (Night Mode)'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#0D0F18] text-xs font-mono-data text-[#181512] dark:text-[#F5F2EB] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#F0A554]" />
                <span className="hidden xl:inline text-[11px] font-bold text-[#F5F2EB]">Day</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span className="hidden xl:inline text-[11px] font-bold text-[#181512]">Night</span>
              </>
            )}
          </button>

          {/* Location Anchor */}
          <button
            onClick={() => {
              chitiSensory.playTick();
              analytics.track(ANALYTICS_EVENTS.LOCATION_CHANGED);
              onOpenCitySelector();
            }}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#0D0F18] text-[10px] sm:text-[11px] font-mono-data text-[#826315] dark:text-[#E5C378] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs font-bold shrink-0"
            title="Change geographic coordinate anchor"
          >
            <MapPin className="w-3 h-3 text-[#A6461D] dark:text-[#E2825B] shrink-0" />
            <span className="max-w-[60px] xs:max-w-[80px] sm:max-w-[100px] truncate">{currentCity.name}</span>
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => {
              chitiSensory.playTick();
              analytics.track('SEARCH_OPENED');
              onOpenSearch();
            }}
            aria-label="Search Vedic Knowledge"
            className="hidden sm:flex p-2 rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#0D0F18] text-[#4A443B] dark:text-[#C4BEB3] hover:text-[#181512] dark:hover:text-white hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              chitiSensory.playTick();
              analytics.track(ANALYTICS_EVENTS.ASK_JYOTISHI_CLICKED, { source: 'NAVBAR' });
              onOpenConsultation();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono-data font-bold bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:bg-[#965B18] dark:hover:bg-[#E5C378] hover:shadow-md transition-all shrink-0"
          >
            <span>{t.nav.askJyotishi}</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Contrast Controls */}
      {mobileMenuOpen && (
        <div id="mobile-nav-drawer" className="lg:hidden border-b border-black/[0.1] dark:border-white/[0.08] bg-[#F8F5EE] dark:bg-[#090B14] px-5 py-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
            <button
              onClick={handleLangSwitch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121422] border border-black/[0.1] dark:border-white/[0.1] text-xs font-mono-data text-[#181512] dark:text-white font-bold"
            >
              <Languages className="w-3.5 h-3.5 text-[#826315] dark:text-[#D4AF37]" />
              <span>Language: <strong>{lang === 'en' ? 'हिन्दी' : 'English'}</strong></span>
            </button>

            <button
              onClick={handleThemeSwitch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121422] border border-black/[0.1] dark:border-white/[0.1] text-xs font-mono-data text-[#181512] dark:text-white font-bold"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#F0A554]" /> : <Moon className="w-3.5 h-3.5 text-[#4F46E5]" />}
              <span>{theme === 'dark' ? 'Day Mode' : 'Night Mode'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono-data uppercase tracking-wider font-bold">
            <Link 
              href="/daily" 
              onClick={() => setMobileMenuOpen(false)}
              className="col-span-2 text-left px-3.5 py-3 rounded-xl bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-bold shadow-sm flex items-center justify-between"
            >
              <span>🔮 72h Forecast & Transits</span>
              <span>→</span>
            </Link>
            <Link 
              href="/calendar" 
              onClick={() => setMobileMenuOpen(false)}
              className="col-span-2 text-left px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#161928] text-[#826315] dark:text-[#F0C968] border border-[#826315]/30 dark:border-[#D4AF37]/30 font-bold shadow-xs flex items-center justify-between"
            >
              <span>📅 Monthly Vedic Calendar (पॉवर डेज़)</span>
              <span>→</span>
            </Link>
            <Link 
              href="/family-panchang" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              👥 Parivaar
            </Link>
            <Link 
              href="/dashboard" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              🏛️ Scholar Desk
            </Link>
            <button 
              onClick={() => handleNavClick('panchang-section', 'TODAY')}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              {t.nav.todayPanchang}
            </button>
            <button 
              onClick={() => handleNavClick('muhurat-section', 'MUHURAT')}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              {t.nav.muhuratTiming}
            </button>
            <button 
              onClick={() => handleNavClick('kundali-section', 'KUNDALI')}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              {t.nav.janmaKundali}
            </button>
            <button 
              onClick={() => handleNavClick('dasha-section', 'DASHA')}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              {t.nav.dashaChapters}
            </button>
            <Link href="/report" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              📜 Written Folio
            </Link>
            <Link href="/kundali-milan" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              💍 Milan
            </Link>
            <Link href="/aarti-stotra" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              🪔 Aarti Library
            </Link>
            <Link href="/upaya" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              💎 Upaya Studio
            </Link>
            <Link href="/remedy-tracker" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              📿 Japa Tracker
            </Link>
            <Link href="/numerology/name" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              🔢 Numerology
            </Link>
            <Link href="/darshan" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              🌸 Live Darshan
            </Link>
            <Link href="/presentation" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              📜 Scholar Deck
            </Link>

          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                chitiSensory.playTick();
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full py-2.5 rounded-lg bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-mono-data font-bold text-xs uppercase tracking-wider text-center shadow-sm"
            >
              {t.nav.askWritten}
            </button>
            
            <button
              onClick={() => {
                chitiSensory.playTick();
                setMobileMenuOpen(false);
                onOpenCapabilityModal();
              }}
              className="w-full text-center py-1.5 text-[11px] text-[#826315] dark:text-[#E5C378] font-mono-data hover:underline font-bold"
            >
              {t.nav.capability}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

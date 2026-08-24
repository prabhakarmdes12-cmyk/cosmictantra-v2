import React, { useState } from 'react';
import Link from 'next/link';
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
  { href: '/my-calendar', label: 'My Vedic Calendar' },
  { href: '/family', label: 'Family Profiles' },
  { href: '/profile', label: 'Cosmic ID + Profile' },
  { href: '/payments/test', label: 'Payments Test' },
  { href: '/darshan', label: 'Live Darshan' },
  { href: '/library', label: 'Vedic Library' },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const handleNavClick = (sectionId, label) => {
    chitiSensory.playTick();
    setMobileMenuOpen(false);
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
    <header className="sticky top-0 z-40 w-full border-b border-black/[0.1] dark:border-white/[0.08] bg-[#F8F5EE]/95 dark:bg-[#060709]/95 backdrop-blur-md transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand Anchor */}
        <a 
          href="#" 
          className="flex items-center gap-3 group shrink-0 focus:outline-none"
          onClick={(e) => {
            e.preventDefault();
            chitiSensory.playTick();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {/* Astrolabe Emblem */}
          <div className="w-8 h-8 rounded-lg border border-[#826315]/40 dark:border-[#D4AF37]/50 bg-[#FFFFFF] dark:bg-[#0C0D12] flex items-center justify-center group-hover:border-[#D4AF37] transition-colors shadow-xs">
            <svg viewBox="0 0 100 100" className="w-4 h-4 text-[#826315] dark:text-[#E5C378]">
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="3 3" />
              <polygon points="50,6 94,50 50,94 6,50" fill="none" stroke="#D4AF37" strokeWidth="4" />
              <circle cx="50" cy="50" r="16" fill="none" stroke="#6366F1" strokeWidth="3" />
              <circle cx="50" cy="50" r="3" fill="#D97736" />
            </svg>
          </div>
          
          <div className="flex flex-col">
            <span className="font-editorial text-base sm:text-lg font-bold tracking-[0.16em] text-[#181512] dark:text-[#F5F2EB] uppercase group-hover:text-[#826315] dark:group-hover:text-[#E5C378] transition-colors">
              COSMICTANTRA
            </span>
            <span className="text-[9px] uppercase tracking-[0.24em] text-[#826315] dark:text-[#D4AF37] font-mono-data font-bold">
              {t.brandSubtitle}
            </span>
          </div>
        </a>

        {/* Primary Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-mono-data tracking-wider uppercase text-[#332E27] dark:text-[#EAE6DF] font-bold">
          <button 
            onClick={() => handleNavClick('panchang-section', 'TODAY_PANCHANG')}
            className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none"
          >
            {t.nav.today}
          </button>
          <button 
            onClick={() => handleNavClick('muhurat-section', 'MUHURAT')}
            className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none"
          >
            {t.nav.muhurat}
          </button>
          <button 
            onClick={() => handleNavClick('kundali-section', 'KUNDALI')}
            className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none"
          >
            {t.nav.kundali}
          </button>
          <button 
            onClick={() => handleNavClick('dasha-section', 'DASHA')}
            className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none"
          >
            {t.nav.dasha}
          </button>
          <button 
            onClick={() => handleNavClick('festival-section', 'FESTIVALS')}
            className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none"
          >
            {t.nav.festivals}
          </button>
          <button 
            onClick={() => handleNavClick('practitioners-section', 'JYOTISHI')}
            className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none"
          >
            {t.nav.scholars}
          </button>
          <button 
            onClick={() => handleNavClick('swarga-lok-section', 'SWARGA_LOK')}
            className="hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none text-[#826315] dark:text-[#F0C968]"
          >
            {t.nav.observatory}
          </button>

          {/* Tools Dropdown (public utility + growth pages) */}
          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors py-1 focus:outline-none">
              <Compass className="w-3.5 h-3.5" />
              <span>Tools</span>
            </button>
            <div className="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="w-56 p-2 rounded-xl border border-[#826315]/25 dark:border-[#D4AF37]/25 bg-[#FFFFFF] dark:bg-[#0B0D12] shadow-xl">
                {TOOL_LINKS.map(l => (
                  <Link key={l.href} href={l.href}
                    className="block px-3 py-2 rounded-lg text-[11px] font-bold text-[#332E27] dark:text-[#EAE6DF] hover:bg-[#D4AF37]/10 hover:text-[#826315] dark:hover:text-[#F0C968] transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Right Controls: High-Contrast Language, Theme, Location, Search, and CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
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

          {/* Capability Registry Trigger */}
          <button
            onClick={() => {
              chitiSensory.playTick();
              onOpenCapabilityModal();
            }}
            aria-label="Capability Registry"
            title="Truth Invariant & Capability Registry"
            className="hidden md:flex p-2 rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#0D0F18] text-[#826315] dark:text-[#E5C378] hover:border-[#D4AF37] transition-all shadow-xs"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>

          {/* Primary Action */}
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

          {/* Mobile Toggle */}
          <button
            onClick={() => {
              chitiSensory.playTick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-lg border border-black/[0.12] dark:border-white/[0.12] bg-[#FFFFFF] dark:bg-[#0D0F18] text-[#181512] dark:text-[#F5F2EB] shrink-0"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer with Contrast Controls */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-black/[0.1] dark:border-white/[0.08] bg-[#F8F5EE] dark:bg-[#090B14] px-5 py-6 space-y-4">
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
            <button 
              onClick={() => handleNavClick('festival-section', 'FESTIVALS')}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              {t.nav.vedicCalendar}
            </button>
            <button 
              onClick={() => handleNavClick('practitioners-section', 'JYOTISHI')}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]"
            >
              {t.nav.practicingScholars}
            </button>
            <Link href="/kundali-milan" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              Kundali Milan
            </Link>
            <Link href="/numerology/name" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              Numerology
            </Link>
            <Link href="/my-calendar" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              My Calendar
            </Link>
            <Link href="/darshan" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              Live Darshan
            </Link>
            <Link href="/library" onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2.5 rounded-lg bg-white dark:bg-[#111320] text-[#181512] dark:text-[#F5F2EB] border border-black/[0.08] dark:border-white/[0.06]">
              Vedic Library
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

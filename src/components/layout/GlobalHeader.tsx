'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sun, Moon, Languages, MapPin, Search, ChevronDown, 
  ArrowUpRight, Compass, ShieldCheck, User, LogOut, ArrowLeft,
  Menu, Sparkles, ShoppingBag, Eye, BookOpen, Layers, FileText, Heart, Calendar
} from 'lucide-react';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';
import { ShellMode } from '@/lib/routeRegistry';
import { chitiSensory } from '@/lib/chitiAudio';
import { SUPPORTED_LANGUAGES } from '@/lib/translations';
import { getActiveProfile } from '@/lib/profileStore';
import FullMegaMenuModal from '@/components/layout/FullMegaMenuModal';
import ConsultationRequestModal from '@/components/consultation/ConsultationRequestModal';
import { useActiveLocation } from '@/lib/location/useActiveLocation';

export interface ReportHeaderData {
  subjectName?: string;
  birthDate?: string;
  birthTime?: string;
  locationName?: string;
  isDemoProfile?: boolean;
  activeTab?: string;
  onTabChange?: (tab: 'OVERVIEW' | 'FOLIO' | 'WORKBENCH') => void;
  onEditDetails?: () => void;
  onDownloadPdf?: () => void;
  onPrint?: () => void;
}

interface GlobalHeaderProps {
  mode?: ShellMode;
  theme?: string;
  lang?: string;
  /** Canonical active location (see src/lib/location/activeLocation.ts). null/undefined = UNKNOWN. */
  currentCity?: { name: string; lat: number; lng: number; isGps?: boolean } | null;
  onThemeToggle?: () => void;
  onLangToggle?: () => void;
  onOpenCitySelector?: () => void;
  onOpenConsultation?: () => void;
  presentationSlide?: number;
  totalSlides?: number;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
  reportData?: ReportHeaderData;
}

export default function GlobalHeader({
  mode = 'public',
  theme = 'light',
  lang = 'en',
  currentCity = null,
  onThemeToggle,
  onLangToggle,
  onOpenCitySelector,
  onOpenConsultation,
  presentationSlide = 1,
  totalSlides = 10,
  onNextSlide,
  onPrevSlide,
  reportData,
}: GlobalHeaderProps) {
  const router = useRouter();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [consultModalOpen, setConsultModalOpen] = useState(false);

  // Interaction gate: the mega-menu trigger must not be clickable before its
  // onClick has hydrated (Sprint C.1 §20).
  useEffect(() => {
    setHydrated(true);
    try {
      const p = getActiveProfile();
      if (p && p.name) setActiveProfile(p);
    } catch {}
  }, []);

  const isHi = lang === 'hi';
  const { location } = useActiveLocation();
  const displayCityName = currentCity?.name || (location.status === 'KNOWN' ? location.name : null);

  // === 1. SCHOLAR WORKSPACE HEADER ===
  if (mode === 'scholar') {
    return (
      <header data-header-hydrated={hydrated ? 'true' : 'false'} className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-xl border-b border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pandit/workspace" className="flex items-center gap-3">
              <CosmicTantraLogo size="sm" />
              <div className="border-l border-black/15 dark:border-white/15 pl-3">
                <div className="font-editorial text-sm font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-wide">
                  SCHOLAR WORKSPACE
                </div>
                <div className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37]">
                  Pt. Vidyanand Shastri • Varanasi Tradition
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-mono-data uppercase tracking-wider font-bold">
            <Link href="/pandit/workspace" className="text-[#8E6F1D] dark:text-[#D4AF37]">
              Cases Queue
            </Link>
            <Link href="/report" className="text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white transition-colors">
              My Kundli
            </Link>
            <Link href="/presentation" className="text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white transition-colors">
              Presentation
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-mono-data text-[#696256] dark:text-[#9E988D] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors py-1 px-2.5 rounded-lg border border-black/10 dark:border-white/10"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Public Site</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // === 2. PRESENTATION MODE HEADER ===
  if (mode === 'presentation') {
    return (
      <header data-header-hydrated={hydrated ? 'true' : 'false'} className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-xl border-b border-[#8E6F1D]/25 dark:border-[#D4AF37]/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CosmicTantraLogo size="sm" />
            <div className="hidden sm:block border-l border-black/15 dark:border-white/15 pl-3">
              <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                Institutional Deck • Kashi Vidwat Parishad
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono-data text-xs">
            <span className="px-3 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] font-bold">
              Slide {presentationSlide} of {totalSlides}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#121528] border border-black/15 dark:border-white/15 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] transition-all"
            >
              <span>Exit Deck</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // === 3. MINIMAL AUTH / SECURE ID HEADER ===
  if (mode === 'minimal') {
    return (
      <header data-header-hydrated={hydrated ? 'true' : 'false'} className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-xl border-b border-[#8E6F1D]/25 dark:border-[#D4AF37]/35">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <CosmicTantraLogo size="sm" />
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono-data text-[#065F46] dark:text-[#10B981] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">Consent-Based Secure Identity</span>
          </div>

          <Link
            href="/"
            className="text-xs font-mono-data text-[#696256] dark:text-[#9E988D] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors"
          >
            ← Return to Observatory
          </Link>
        </div>
      </header>
    );
  }

  // === 4. UNIFIED SINGLE-HEADER REPORT WORKSPACE (Eliminates double-header) ===
  if (mode === 'report' && reportData) {
    return (
      <>
        <header
          data-header-hydrated={hydrated ? 'true' : 'false'}
          className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#07080C]/95 backdrop-blur-2xl border-b border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 transition-colors duration-200 print:hidden"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
            
            {/* LEFT: Branding & Subject Info */}
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <Link
                href="/"
                className="w-9 h-9 rounded-xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-black transition-all font-serif font-bold text-sm shrink-0"
                title={isHi ? 'होम पर वापस' : 'Return to Home'}
              >
                ॐ
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-serif font-bold text-sm sm:text-base tracking-tight text-[#1C1917] dark:text-[#EFECE6] truncate">
                    {reportData.subjectName || (isHi ? 'मास्टर कुण्डली' : 'Master Kundli')}
                  </span>
                  {reportData.isDemoProfile && (
                    <span
                      data-testid="demo-profile-pill"
                      className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40 uppercase tracking-wide shrink-0"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{isHi ? 'नमूना' : 'Sample'}</span>
                    </span>
                  )}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#78716C] dark:text-[#A8A29E] font-mono-data truncate">
                  {reportData.birthDate ? `${reportData.birthDate} • ${reportData.birthTime || ''} • ${reportData.locationName || ''}` : (isHi ? 'वैदिक खगोल गणना' : 'Vedic Astronomy Computation')}
                </div>
              </div>
            </div>

            {/* CENTER: 3-Lens Mode Switcher (Overview | 17-Volume Book | Workbench) */}
            <div
              role="tablist"
              aria-label={isHi ? 'कुण्डली दृश्य' : 'Kundli views'}
              className="hidden md:flex items-center gap-1 p-1 rounded-2xl border border-[#8E6F1D]/30 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] backdrop-blur-md shadow-xs shrink-0"
            >
              {([
                ['OVERVIEW', Eye, isHi ? 'सारांश' : 'Overview', isHi ? 'सारांश' : 'Overview', '📊'],
                ['FOLIO', BookOpen, isHi ? '१७-खण्ड ग्रन्थ' : '17-Volume Book', isHi ? 'ग्रन्थ' : 'Book', '📖'],
                ['WORKBENCH', Layers, isHi ? 'कुण्डली चक्र' : 'Workbench', isHi ? 'चक्र' : 'Charts', '🪐'],
              ] as const).map(([tab, Icon, fullLabel, shortLabel, emblem]) => {
                const isActive = reportData.activeTab === tab;
                return (
                  <button
                    key={tab}
                    role="tab"
                    type="button"
                    id={`report-tab-${tab.toLowerCase()}`}
                    aria-selected={isActive}
                    aria-controls={`report-panel-${tab.toLowerCase()}`}
                    onClick={() => {
                      chitiSensory.playTick();
                      reportData.onTabChange?.(tab as any);
                    }}
                    title={fullLabel}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border focus-visible:outline-none cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-b from-[#8E6F1D] to-[#6E5514] dark:from-[#F0C968] dark:to-[#C9A227] text-white dark:text-black border-[#8E6F1D]/60 dark:border-[#D4AF37]/60 shadow-sm'
                        : 'text-[#78716C] dark:text-[#A8A29E] border-transparent hover:text-[#1C1917] dark:hover:text-[#EFECE6] hover:bg-white/70 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <span aria-hidden="true" className="text-[11px] leading-none">{emblem}</span>
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{fullLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* RIGHT: Actions (Print, Download PDF, Edit Details, Menu) */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0">
              {/* Edit Details Button */}
              {reportData.onEditDetails && (
                <button
                  type="button"
                  data-testid="edit-birth-details"
                  onClick={reportData.onEditDetails}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] bg-white/60 dark:bg-white/5 text-xs font-mono-data font-bold text-[#1C1917] dark:text-[#EFECE6] transition-all cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#F0C968]" />
                  <span>{isHi ? 'विवरण बदलें' : 'Edit Details'}</span>
                </button>
              )}

              {/* Print Button */}
              {reportData.onPrint && (
                <button
                  type="button"
                  data-testid="report-print-kundli"
                  onClick={reportData.onPrint}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] bg-white/60 dark:bg-white/5 text-xs font-mono-data font-bold text-[#1C1917] dark:text-[#EFECE6] transition-all cursor-pointer"
                  title={isHi ? 'कुण्डली प्रिंट करें' : 'Print Kundli'}
                >
                  <span>🖨️</span>
                  <span className="hidden lg:inline">{isHi ? 'प्रिंट' : 'Print'}</span>
                </button>
              )}

              {/* Download PDF Button */}
              {reportData.onDownloadPdf && (
                <button
                  type="button"
                  data-testid="report-download-pdf"
                  onClick={reportData.onDownloadPdf}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-[#8E6F1D] hover:bg-[#A88424] dark:bg-[#D4AF37] dark:hover:bg-[#E5C04B] text-white dark:text-black text-xs font-mono-data font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  <span>📄</span>
                  <span>{isHi ? 'पीडीएफ़' : 'PDF'}</span>
                </button>
              )}

              {/* Language Toggle */}
              {onLangToggle && (
                <button
                  onClick={onLangToggle}
                  className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:border-[#8E6F1D] transition-all cursor-pointer"
                  title="Language"
                >
                  <Languages className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Theme Toggle */}
              {onThemeToggle && (
                <button
                  onClick={onThemeToggle}
                  className="flex items-center justify-center w-9 h-9 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-[#8E6F1D] text-[#1C1917] dark:text-white transition-all cursor-pointer"
                  title="Day/Night"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#8E6F1D]" />}
                </button>
              )}

              {/* Hamburger Menu Pill */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  setMegaMenuOpen(true);
                }}
                className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#8E6F1D]/15 hover:bg-[#8E6F1D]/25 dark:bg-[#D4AF37]/15 dark:hover:bg-[#D4AF37]/25 text-[#8E6F1D] dark:text-[#F0C968] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 text-xs font-mono-data font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                aria-label="Menu"
              >
                <Menu className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline uppercase tracking-wider text-[11px]">{isHi ? 'अन्वेषण' : 'Menu'}</span>
              </button>
            </div>

          </div>
        </header>

        {/* FULL SCREEN DESCRIPTIVE MEGA MENU MODAL */}
        <FullMegaMenuModal
          isOpen={megaMenuOpen}
          lang={lang}
          onClose={() => setMegaMenuOpen(false)}
        />
      </>
    );
  }

  // === 5. CANONICAL PUBLIC HEADER WITH DESKTOP PRIMARY LINKS & PROFILE RECOGNITION ===
  return (
    <>
      <header
        id="global-header-unified"
        data-header-hydrated={hydrated ? 'true' : 'false'}
        data-testid="global-header-unified"
        className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-200"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* LEFT WING: Minimal Primary Nav (Desktop) / Quick City (Mobile) */}
          <div className="flex items-center gap-1 sm:gap-6 flex-1 justify-start min-w-0">
            <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-mono-data uppercase tracking-wider font-bold">
              <Link
                href="/calendar"
                className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors py-1 shrink-0"
              >
                {isHi ? 'पञ्चाङ्ग' : 'Panchang'}
              </Link>
              <Link
                href="/report"
                className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors py-1 shrink-0"
              >
                {isHi ? 'कुण्डली' : 'Kundli'}
              </Link>
              <Link
                href="/kundali-milan"
                className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors py-1 shrink-0"
              >
                {isHi ? 'मिलान' : 'Milan'}
              </Link>
              <Link
                href="/granth"
                className="hidden lg:inline text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors py-1 shrink-0"
              >
                {isHi ? 'ग्रन्थ' : 'Granth'}
              </Link>
            </nav>

            {/* Mobile Location Badge */}
            {onOpenCitySelector && (
              <button
                type="button"
                onClick={onOpenCitySelector}
                className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] max-w-[120px] truncate cursor-pointer shrink-0"
                title={isHi ? 'स्थान सेट करें' : 'Set location'}
              >
                <MapPin className="w-3 h-3 shrink-0 text-[#A6461D] dark:text-[#E2825B]" />
                <span className="truncate" suppressHydrationWarning>{displayCityName ? displayCityName.split(',')[0] : (isHi ? 'स्थान' : 'City')}</span>
              </button>
            )}
          </div>

          {/* CENTER STAGE: Symmetrical Center-Aligned Logo */}
          <div className="flex items-center justify-center shrink-0 px-1 sm:px-2">
            <Link
              href="/"
              className="group focus:outline-none flex items-center justify-center transition-transform hover:scale-102"
              aria-label="CosmicTantra Home"
            >
              <span className="sm:hidden inline-flex">
                <CosmicTantraLogo size="sm" subtitle={isHi ? 'वैदिक शुद्धता' : 'VEDIC PRECISION'} />
              </span>
              <span className="hidden sm:inline-flex">
                <CosmicTantraLogo size="md" subtitle={isHi ? 'वैदिक खगोल शुद्धता' : 'VEDIC PRECISION'} />
              </span>
            </Link>
          </div>

          {/* RIGHT WING: Minimal Clean Utilities */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 flex-1 min-w-0">
            
            {/* Desktop Location Pill */}
            {onOpenCitySelector && (
              <button
                type="button"
                onClick={onOpenCitySelector}
                suppressHydrationWarning
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#8E6F1D] dark:text-[#F0C968] hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono-data font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title={isHi ? 'स्थान सेट करें' : 'Select Observing Location'}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#A6461D] dark:text-[#E2825B]" />
                <span className="truncate max-w-[120px]" suppressHydrationWarning>{displayCityName ? displayCityName.split(',')[0] : (isHi ? 'स्थान सेट करें' : 'Set location')}</span>
              </button>
            )}

            {/* Language Selector Trigger */}
            {onLangToggle && (
              <button
                type="button"
                onClick={onLangToggle}
                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 hover:bg-[#8E6F1D]/20 dark:hover:bg-[#D4AF37]/20 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Select Sacred Language"
              >
                <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[10px] sm:text-[11px] uppercase font-bold">
                  {lang === 'hi' ? 'हि' : 'EN'}
                </span>
              </button>
            )}

            {/* Theme Day/Night Toggle */}
            {onThemeToggle && (
              <button
                type="button"
                onClick={onThemeToggle}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#1C1917] dark:text-white hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Toggle Day/Night"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F59E0B]" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8E6F1D]" />}
              </button>
            )}

            {/* Menu Trigger (Desktop & Tablet — Mobile uses fixed thumb bottom bar) */}
            <button
              type="button"
              onClick={() => {
                chitiSensory.playTick();
                setMegaMenuOpen(true);
              }}
              className="hidden md:flex px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#785E18] dark:bg-[#D4AF37] dark:hover:bg-[#C9A227] text-white dark:text-black font-mono-data font-bold text-xs items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-102 active:scale-95 shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline uppercase tracking-wider text-[11px]">{isHi ? 'अन्वेषण' : 'Menu'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION (Consistent Thumb-Reach Access across all pages) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        data-testid="primary-nav-mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#8E6F1D]/25 dark:border-[#D4AF37]/25 bg-[#FAF7F2]/98 dark:bg-[#06070B]/98 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 items-center h-14 max-w-md mx-auto">
          <Link
            href="/calendar"
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-mono-data font-bold text-[#696256] dark:text-[#A8A29E] hover:text-[#8E6F1D] dark:hover:text-[#F0C968]"
          >
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>{isHi ? 'पञ्चाङ्ग' : 'Panchang'}</span>
          </Link>

          <Link
            href="/report"
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-mono-data font-bold text-[#696256] dark:text-[#A8A29E] hover:text-[#8E6F1D] dark:hover:text-[#F0C968]"
          >
            <Compass className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />
            <span>{isHi ? 'कुण्डली' : 'Kundli'}</span>
          </Link>

          <Link
            href="/kundali-milan"
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-mono-data font-bold text-[#696256] dark:text-[#A8A29E] hover:text-[#8E6F1D] dark:hover:text-[#F0C968]"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>{isHi ? 'मिलान' : 'Milan'}</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              chitiSensory.playTick();
              setMegaMenuOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-mono-data font-bold text-[#696256] dark:text-[#A8A29E] hover:text-[#8E6F1D] dark:hover:text-[#F0C968] cursor-pointer"
          >
            <Menu className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />
            <span>{isHi ? 'अन्वेषण' : 'Menu'}</span>
          </button>
        </div>
      </nav>

      {/* FULL SCREEN DESCRIPTIVE MEGA MENU MODAL */}
      <FullMegaMenuModal
        isOpen={megaMenuOpen}
        lang={lang}
        onClose={() => setMegaMenuOpen(false)}
      />

      {/* CONSULTATION REQUEST MODAL (HUMAN CONCIERGE BRIDGE) */}
      <ConsultationRequestModal
        isOpen={consultModalOpen}
        onClose={() => setConsultModalOpen(false)}
        lang={lang}
        activeProfile={activeProfile}
        onOpenIntakeIfNoProfile={() => router.push('/report')}
      />
    </>
  );
}

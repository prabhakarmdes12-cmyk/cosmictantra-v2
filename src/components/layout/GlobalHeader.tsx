'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sun, Moon, Languages, MapPin, Search, ChevronDown, 
  ArrowUpRight, Compass, ShieldCheck, User, LogOut, ArrowLeft,
  Menu, Sparkles, ShoppingBag, Eye, BookOpen, Layers, FileText, Heart
} from 'lucide-react';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';
import { ShellMode } from '@/lib/routeRegistry';
import { chitiSensory } from '@/lib/chitiAudio';
import { SUPPORTED_LANGUAGES } from '@/lib/translations';
import { getActiveProfile } from '@/lib/profileStore';
import FullMegaMenuModal from '@/components/layout/FullMegaMenuModal';
import ConsultationRequestModal from '@/components/consultation/ConsultationRequestModal';

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
      <header data-header-hydrated={hydrated ? 'true' : 'false'} className="sticky top-0 z-50 w-full bg-[#FAF7F2]/90 dark:bg-[#06070B]/90 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1 sm:gap-4">
          
          {/* LEFT COLUMN: Logo & Desktop Primary Nav Links */}
          <div className="flex items-center gap-4 lg:gap-8 shrink-0">
            <Link href="/" className="group focus:outline-none flex items-center justify-center transition-transform hover:scale-102">
              <CosmicTantraLogo size="md" subtitle={isHi ? 'वैदिक खगोल शुद्धता' : 'VEDIC PRECISION'} />
            </Link>

            {/* Desktop Direct Primary Nav Links */}
            <nav className="hidden xl:flex items-center gap-6 text-xs font-mono-data uppercase tracking-wider font-bold">
              <Link href="/" className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors">
                {isHi ? 'होम' : 'Home'}
              </Link>
              <Link href="/daily" className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors">
                {isHi ? 'दैनिक पञ्चाङ्ग' : "Today's Panchang"}
              </Link>
              <Link href="/granth" className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors">
                {isHi ? 'ग्रन्थ' : 'Granth'}
              </Link>
              <Link href="/darshan" className="text-[#57524A] dark:text-[#C5BFB5] hover:text-[#8E6F1D] dark:hover:text-[#D4AF37] transition-colors">
                {isHi ? 'दर्शन' : 'Darshan'}
              </Link>
            </nav>
          </div>

          {/* RIGHT COLUMN: Profile Pill, Controls & Quick Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Active Profile Pill or Create Kundli CTA */}
            {activeProfile?.name ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 hover:bg-[#8E6F1D]/20 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="max-w-[100px] truncate">{activeProfile.name}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 p-2 shadow-2xl z-50 font-mono-data text-xs space-y-1">
                    <div className="px-3 py-2 border-b border-black/5 dark:border-white/10">
                      <div className="font-bold text-[#1C1917] dark:text-white truncate">{activeProfile.name}</div>
                      <div className="text-[10px] text-[#696256] dark:text-[#9E988D]">{isHi ? 'सक्रिय वैदिक प्रोफ़ाइल' : 'Active Sacred Profile'}</div>
                    </div>
                    <Link
                      href="/report"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#8E6F1D]/10 dark:hover:bg-[#D4AF37]/10 text-[#1C1917] dark:text-white font-semibold transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                      <span>{isHi ? 'मेरी कुण्डली रिपोर्ट' : 'My Kundli Report'}</span>
                    </Link>
                    <Link
                      href="/kundali-milan"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#8E6F1D]/10 dark:hover:bg-[#D4AF37]/10 text-[#1C1917] dark:text-white font-semibold transition-colors"
                    >
                      <Compass className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                      <span>{isHi ? 'कुण्डली मिलान' : 'Kundali Milan'}</span>
                    </Link>
                    <Link
                      href="/daily"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#8E6F1D]/10 dark:hover:bg-[#D4AF37]/10 text-[#1C1917] dark:text-white font-semibold transition-colors"
                    >
                      <Sun className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                      <span>{isHi ? 'मेरा दैनिक पञ्चाङ्ग' : 'My Days Panchang'}</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#8E6F1D]/10 dark:hover:bg-[#D4AF37]/10 text-[#1C1917] dark:text-white font-semibold transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                      <span>{isHi ? 'परिवार प्रोफ़ाइल बदलें' : 'Parivaar / Switch'}</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/report"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 hover:bg-[#8E6F1D]/20 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>{isHi ? 'मेरी कुण्डली' : 'My Kundli'}</span>
              </Link>
            )}

            {/* Location City Pill — truthful: unknown shows "Set location", never a fake city */}
            {onOpenCitySelector && (
              <button
                onClick={onOpenCitySelector}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl border ${
                  (currentCity as any)?.isGps
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : currentCity
                      ? 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#8E6F1D] dark:text-[#F0C968]'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                } hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono-data font-bold transition-all cursor-pointer shadow-xs active:scale-95`}
                title="Select Observing Location / GPS"
              >
                {(currentCity as any)?.isGps ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>GPS: {(currentCity as any)?.name}</span>
                  </span>
                ) : currentCity ? (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-[#A6461D] dark:text-[#E2825B]" />
                    <span>{currentCity.name}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isHi ? 'स्थान सेट करें' : 'Set location'}</span>
                  </>
                )}
              </button>
            )}

            {/* Language Selector Trigger */}
            {onLangToggle && (
              <button
                onClick={onLangToggle}
                className="flex min-h-11 items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-xl sm:rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 hover:bg-[#8E6F1D]/20 dark:hover:bg-[#D4AF37]/20 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs active:scale-95"
                title="Select Sacred Language (12 Prime Indian Languages)"
              >
                <Languages className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#F0C968]" />
                <span className="hidden sm:inline">
                  {SUPPORTED_LANGUAGES.find(l => l.code === lang)?.label || 'भाषा'}
                </span>
                <span className="sm:hidden text-[10px] uppercase">
                  {lang}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 hidden sm:inline" />
              </button>
            )}

            {/* Theme Toggle */}
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className="flex items-center justify-center w-11 h-11 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#1C1917] dark:text-white hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs active:scale-95"
                title="Toggle Day/Night"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F59E0B]" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8E6F1D]" />}
              </button>
            )}

            {/* Quick Consultation CTA */}
            <button
              type="button"
              onClick={() => {
                chitiSensory.playTick();
                if (onOpenConsultation) {
                  onOpenConsultation();
                } else {
                  setConsultModalOpen(true);
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-mono-data font-bold bg-[#8E6F1D]/15 hover:bg-[#8E6F1D]/25 dark:bg-[#D4AF37]/15 dark:hover:bg-[#D4AF37]/25 text-[#8E6F1D] dark:text-[#F0C968] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 hover:border-[#8E6F1D] transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isHi ? 'परामर्श' : 'Consult'}</span>
            </button>

            {/* LUXURY FULL-SCREEN HAMBURGER MENU PILL */}
            <button
              onClick={() => {
                chitiSensory.playTick();
                setMegaMenuOpen(true);
              }}
              className="min-h-11 px-3 py-2 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#8E6F1D] via-[#A88424] to-[#8E6F1D] dark:from-[#D4AF37] dark:via-[#F0C968] dark:to-[#D4AF37] text-white dark:text-[#060709] font-mono-data font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-[#8E6F1D]/20 dark:shadow-[#D4AF37]/25 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 hover:shadow-xl"
              aria-label="Open navigation menu"
            >
              <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="uppercase tracking-wider text-[11px] sm:text-xs">{isHi ? 'अन्वेषण' : 'Menu'}</span>
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

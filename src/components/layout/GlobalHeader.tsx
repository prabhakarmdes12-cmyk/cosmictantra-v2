'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sun, Moon, Languages, MapPin, Search, ChevronDown, 
  ArrowUpRight, Compass, ShieldCheck, User, LogOut, ArrowLeft,
  Menu, Sparkles, ShoppingBag, Eye
} from 'lucide-react';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';
import { ShellMode } from '@/lib/routeRegistry';
import { chitiSensory } from '@/lib/chitiAudio';
import { SUPPORTED_LANGUAGES } from '@/lib/translations';
import FullMegaMenuModal from '@/components/layout/FullMegaMenuModal';

interface GlobalHeaderProps {
  mode?: ShellMode;
  theme?: string;
  lang?: string;
  currentCity?: { name: string; lat: number; lng: number };
  onThemeToggle?: () => void;
  onLangToggle?: () => void;
  onOpenCitySelector?: () => void;
  onOpenConsultation?: () => void;
  presentationSlide?: number;
  totalSlides?: number;
  onNextSlide?: () => void;
  onPrevSlide?: () => void;
}

export default function GlobalHeader({
  mode = 'public',
  theme = 'light',
  lang = 'en',
  currentCity = { name: 'Dhanbad', lat: 23.7957, lng: 86.4304 },
  onThemeToggle,
  onLangToggle,
  onOpenCitySelector,
  onOpenConsultation,
  presentationSlide = 1,
  totalSlides = 10,
  onNextSlide,
  onPrevSlide
}: GlobalHeaderProps) {
  const router = useRouter();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  // === 1. SCHOLAR WORKSPACE HEADER ===
  if (mode === 'scholar') {
    return (
      <header className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-xl border-b border-[#8E6F1D]/25 dark:border-[#D4AF37]/35 transition-colors">
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
              Folios Archive
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
      <header className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-xl border-b border-[#8E6F1D]/25 dark:border-[#D4AF37]/35">
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
      <header className="sticky top-0 z-50 w-full bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-xl border-b border-[#8E6F1D]/25 dark:border-[#D4AF37]/35">
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

  // === 4. CANONICAL MINIMALIST CENTERED-LOGO PUBLIC HEADER ===
  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#FAF7F2]/90 dark:bg-[#06070B]/90 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1 sm:gap-4">
          
          {/* LEFT COLUMN: Minimal Subtle Controls */}
          <div className="flex items-center justify-start gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Selector Trigger */}
            {onLangToggle && (
              <button
                onClick={onLangToggle}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/10 hover:bg-[#8E6F1D]/20 dark:hover:bg-[#D4AF37]/20 text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs active:scale-95"
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
                className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-[#1C1917] dark:text-white hover:border-[#8E6F1D] dark:hover:border-[#D4AF37] transition-all cursor-pointer shadow-xs active:scale-95"
                title="Toggle Day/Night"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F59E0B]" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8E6F1D]" />}
              </button>
            )}

            {/* Location City Pill */}
            {onOpenCitySelector && (
              <button
                onClick={onOpenCitySelector}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border ${
                  (currentCity as any)?.isGps
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[#8E6F1D] dark:text-[#F0C968]'
                } hover:bg-black/10 dark:hover:bg-white/10 text-xs font-mono-data font-bold transition-all cursor-pointer shadow-xs active:scale-95`}
                title="Select Observing Location / GPS"
              >
                {(currentCity as any)?.isGps ? (
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>GPS: {currentCity.name}</span>
                  </span>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5 text-[#A6461D] dark:text-[#E2825B]" />
                    <span>{currentCity.name}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* CENTER COLUMN: Perfectly Centered Brand Identity */}
          <div className="flex-1 flex items-center justify-center min-w-0 px-1">
            <Link href="/" className="group focus:outline-none flex items-center justify-center transition-transform hover:scale-102">
              <CosmicTantraLogo size="md" subtitle={lang === 'hi' ? 'वैदिक खगोल शुद्धता' : 'VEDIC PRECISION'} />
            </Link>
          </div>

          {/* RIGHT COLUMN: Minimal Action & Luxury Mega Menu Trigger */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Consultation CTA */}
            <Link
              href="/ask"
              onClick={() => chitiSensory.playTick()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl text-xs font-mono-data font-bold bg-[#8E6F1D]/15 hover:bg-[#8E6F1D]/25 dark:bg-[#D4AF37]/15 dark:hover:bg-[#D4AF37]/25 text-[#8E6F1D] dark:text-[#F0C968] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 hover:border-[#8E6F1D] transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'hi' ? 'परामर्श' : 'Consult'}</span>
            </Link>

            {/* LUXURY FULL-SCREEN HAMBURGER MENU PILL */}
            <button
              onClick={() => {
                chitiSensory.playTick();
                setMegaMenuOpen(true);
              }}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#8E6F1D] via-[#A88424] to-[#8E6F1D] dark:from-[#D4AF37] dark:via-[#F0C968] dark:to-[#D4AF37] text-white dark:text-[#060709] font-mono-data font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-[#8E6F1D]/20 dark:shadow-[#D4AF37]/25 cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 hover:shadow-xl"
              aria-label="Open navigation menu"
            >
              <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="uppercase tracking-wider text-[11px] sm:text-xs">{lang === 'hi' ? 'अन्वेषण' : 'Menu'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* FULL SCREEN DESCRIPTIVE MEGA MENU MODAL */}
      <FullMegaMenuModal
        isOpen={megaMenuOpen}
        onClose={() => setMegaMenuOpen(false)}
      />
    </>
  );
}

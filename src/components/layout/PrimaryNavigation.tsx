'use client';

/**
 * PrimaryNavigation - CosmicTantra 2027 UI/UX
 * 
 * The 5 Primary Destinations as specified in UI_UX_DESIGN_DIRECTION_2027.md:
 * 1. Today - Panchanga, daily timing, auspicious muhurtas
 * 2. My Kundli - Narrative chart, planetary conditions, active dasha (with analytical tools embedded)
 * 3. Ask - Context-aware Kashi Sahayak assistant
 * 4. Consult - Verified Vedic pandits, human escalation
 * 5. Darshan & Puja - Live temple darshan, virtual offerings
 * 
 * Architectural Rule: D10, Ashtakavarga, Shadbala, and Ephemeris are 
 * ANALYTICAL VIEWS INSIDE My Kundli, never top-level navigation items.
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sun, 
  Moon, 
  Languages, 
  MapPin, 
  Search, 
  ChevronDown, 
  Compass,
  Sparkles,
  User,
  Flame,
  Menu,
  Eye,
  Layers,
  BookOpen,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import { SUPPORTED_LANGUAGES } from '@/lib/translations';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';

export type PrimaryDestination = 'TODAY' | 'MY_KUNDLI' | 'ASK' | 'CONSULT' | 'DARSHAN';

interface NavItem {
  id: PrimaryDestination;
  label: string;
  labelHi: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  /** Analytical sub-tools that live INSIDE this destination */
  analyticalTools?: Array<{
    label: string;
    labelHi: string;
    href: string;
    description: string;
  }>;
}

// The 5 Primary Destinations - as specified in UI/UX Design Direction 2027
const PRIMARY_DESTINATIONS: NavItem[] = [
  {
    id: 'TODAY',
    label: 'Today',
    labelHi: 'आज',
    href: '/daily',
    icon: <Sun className="w-5 h-5" />,
    description: 'Panchanga, daily timing, auspicious muhurtas, sacred festivals',
    analyticalTools: [
      { label: 'Monthly Calendar', labelHi: 'मासिक कैलेंडर', href: '/calendar', description: 'Full 30-day Panchanga with Shubha Muhurats' },
      { label: 'Family Panchang', labelHi: 'परिवार पञ्चाङ्ग', href: '/family-panchang', description: 'Synchronized family transits' },
    ]
  },
  {
    id: 'MY_KUNDLI',
    label: 'My Kundli',
    labelHi: 'मेरी कुण्डली',
    href: '/dashboard',
    icon: <Compass className="w-5 h-5" />,
    description: 'Narrative chart summary, planetary conditions, active dasha',
    analyticalTools: [
      { label: 'D10 - Dasamsa', labelHi: 'दशमांश', href: '/kundli/d10', description: 'Career & profession analysis' },
      { label: 'Ashtakavarga', labelHi: 'अष्टकवर्ग', href: '/kundli/ashtakavarga', description: 'Planetary strength matrix' },
      { label: 'Shadbala', labelHi: 'षड्बल', href: '/kundli/shadbala', description: 'Six-fold planetary strength' },
      { label: 'Ephemeris', labelHi: 'सूर्य सिद्धान्त', href: '/kundli/ephemeris', description: 'Raw astronomical coordinates' },
    ]
  },
  {
    id: 'ASK',
    label: 'Ask',
    labelHi: 'पूछें',
    href: '/ask',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Context-aware Kashi Sahayak assistant, evidence retrieval',
  },
  {
    id: 'CONSULT',
    label: 'Consult',
    labelHi: 'परामर्श',
    href: '/ask',
    icon: <User className="w-5 h-5" />,
    description: 'Verified Vedic pandits, direct telephony handover, ScholarHandoverPacket',
  },
  {
    id: 'DARSHAN',
    label: 'Darshan & Puja',
    labelHi: 'दर्शन व पूजा',
    href: '/darshan',
    icon: <Flame className="w-5 h-5" />,
    description: 'Live temple darshan, virtual deep daan & offerings, authentic Vedic pujas',
    analyticalTools: [
      { label: 'Aarti & Stotra', labelHi: 'आरती व स्तोत्र', href: '/aarti-stotra', description: 'Sacred verses and recitations' },
      { label: 'Upaya Studio', labelHi: 'उपाय विधा', href: '/upaya', description: 'Gemstones, Rudraksha, Yantras' },
    ]
  },
];

interface PrimaryNavigationProps {
  mode?: 'public' | 'scholar';
  theme?: string;
  lang?: string;
  currentCity?: { name: string; lat: number; lng: number; isGps?: boolean };
  onThemeToggle?: () => void;
  onLangToggle?: () => void;
  onOpenCitySelector?: () => void;
  onOpenConsultation?: () => void;
}

export default function PrimaryNavigation({
  mode = 'public',
  theme = 'light',
  lang = 'en',
  currentCity = { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
  onThemeToggle,
  onLangToggle,
  onOpenCitySelector,
  onOpenConsultation,
}: PrimaryNavigationProps) {
  const pathname = usePathname();
  const [expandedDestination, setExpandedDestination] = useState<PrimaryDestination | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active destination based on current pathname
  const activeDestination = useMemo(() => {
    const path = pathname.toLowerCase();
    
    if (path.includes('/daily') || path.includes('/calendar') || path.includes('/family-panchang')) {
      return 'TODAY';
    }
    if (path.includes('/dashboard') || path.includes('/report') || path.includes('/kundli/') || path.includes('/kundali-milan')) {
      return 'MY_KUNDLI';
    }
    if (path.includes('/ask')) {
      return 'ASK';
    }
    if (path.includes('/consult') || pathname.includes('/pandit')) {
      return 'CONSULT';
    }
    if (path.includes('/darshan') || path.includes('/aarti') || path.includes('/store') || path.includes('/remedy') || path.includes('/upaya')) {
      return 'DARSHAN';
    }
    return null;
  }, [pathname]);

  const handleNavClick = (destination: NavItem) => {
    chitiSensory.playTick();
    
    // If destination has analytical tools and we're already on that destination,
    // toggle the expanded state instead of navigating
    if (destination.analyticalTools && activeDestination === destination.id) {
      setExpandedDestination(expandedDestination === destination.id ? null : destination.id);
    } else {
      setExpandedDestination(null);
      if (typeof window !== 'undefined') {
        window.location.href = destination.href;
      }
    }
  };

  const isActive = (destinationId: PrimaryDestination) => activeDestination === destinationId;

  // Scholar/Technical mode uses dark observatory styling
  const isScholarMode = mode === 'scholar';
  
  // Daylight (Consumer) vs Observatory (Scholar) styling
  const navBgClass = isScholarMode 
    ? 'bg-[#06070B]/95 dark:bg-[#06070B]/95' 
    : 'bg-[#FAF7F2]/95 dark:bg-[#06070B]/95';
  
  const textPrimaryClass = isScholarMode 
    ? 'text-white dark:text-white' 
    : 'text-[#1C1917] dark:text-white';
  
  const textSecondaryClass = isScholarMode 
    ? 'text-[#9E988D] dark:text-[#9E988D]' 
    : 'text-[#696256] dark:text-[#9E988D]';
  
  const activeIndicatorClass = isScholarMode 
    ? 'bg-[#D4AF37] text-[#06070B]' 
    : 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#06070B]';
  
  const borderColorClass = isScholarMode 
    ? 'border-[#D4AF37]/35' 
    : 'border-[#8E6F1D]/25 dark:border-[#D4AF37]/35';

  // Mobile: Show a simple tab bar with the 5 destinations
  if (mobileMenuOpen) {
    return (
      <div className={`fixed inset-0 z-[99998] ${navBgClass} backdrop-blur-2xl overflow-y-auto`}>
        <div className="max-w-lg mx-auto p-4 pt-20">
          {/* Close button */}
          <button
            onClick={() => { chitiSensory.playTick(); setMobileMenuOpen(false); }}
            className={`absolute top-4 right-4 p-2 rounded-xl ${textSecondaryClass} hover:${textPrimaryClass}`}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Primary Destinations */}
          <div className="space-y-2">
            <h2 className={`text-xs font-mono-data font-bold uppercase tracking-wider ${textSecondaryClass} mb-4`}>
              5 Primary Destinations
            </h2>
            {PRIMARY_DESTINATIONS.map((dest) => (
              <div key={dest.id}>
                <button
                  onClick={() => handleNavClick(dest)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    isActive(dest.id) 
                      ? `${activeIndicatorClass}` 
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span className={isActive(dest.id) ? '' : 'text-amber-400'}>{dest.icon}</span>
                  <div className="flex-1 text-left">
                    <div className={`font-editorial font-bold ${isActive(dest.id) ? '' : textPrimaryClass}`}>
                      {lang === 'hi' ? dest.labelHi : dest.label}
                    </div>
                    <div className={`text-xs ${textSecondaryClass}`}>
                      {dest.description}
                    </div>
                  </div>
                  {dest.analyticalTools && (
                    <ChevronDown className={`w-5 h-5 ${textSecondaryClass} transition-transform ${
                      expandedDestination === dest.id ? 'rotate-180' : ''
                    }`} />
                  )}
                </button>

                {/* Analytical Tools Dropdown */}
                {dest.analyticalTools && expandedDestination === dest.id && (
                  <div className="mt-2 ml-4 pl-4 border-l-2 border-amber-500/30 space-y-1">
                    {dest.analyticalTools.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all`}
                      >
                        <Layers className="w-4 h-4 text-amber-400/70" />
                        <div>
                          <div className={`text-sm font-medium ${textPrimaryClass}`}>
                            {lang === 'hi' ? tool.labelHi : tool.label}
                          </div>
                          <div className={`text-xs ${textSecondaryClass}`}>{tool.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between gap-4">
              <span className={`text-xs ${textSecondaryClass}`}>
                Vedic Precision: Chitra Paksha (Lahiri)
              </span>
              <Link
                href="/ask"
                onClick={() => { chitiSensory.playTick(); setMobileMenuOpen(false); }}
                className="px-4 py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#D4AF37] text-white text-sm font-bold transition-all"
              >
                Ask Scholar →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: 5 Primary Destinations as horizontal tabs
  return (
    <nav className={`${navBgClass} backdrop-blur-2xl border-b ${borderColorClass} transition-colors`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Row: Logo + Controls + 5 Destinations */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* LEFT: Minimal Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Selector */}
            {onLangToggle && (
              <button
                onClick={onLangToggle}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${borderColorClass} ${
                  isScholarMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                } ${textSecondaryClass} hover:${textPrimaryClass} text-xs font-mono-data font-bold transition-all cursor-pointer`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{SUPPORTED_LANGUAGES.find(l => l.code === lang)?.label || 'भाषा'}</span>
              </button>
            )}

            {/* Theme Toggle */}
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className={`flex items-center justify-center w-10 h-10 rounded-xl border ${borderColorClass} ${
                  isScholarMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
                } ${textPrimaryClass} transition-all cursor-pointer`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8E6F1D]" />}
              </button>
            )}

            {/* Location Pill */}
            {onOpenCitySelector && (
              <button
                onClick={onOpenCitySelector}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border ${borderColorClass} ${
                  currentCity.isGps 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400' 
                    : isScholarMode ? 'bg-white/5' : 'bg-black/5'
                } ${textSecondaryClass} text-xs font-mono-data font-bold transition-all cursor-pointer`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{currentCity.name}</span>
              </button>
            )}
          </div>

          {/* CENTER: 5 Primary Destinations */}
          <div className="flex-1 flex items-center justify-center gap-1">
            {PRIMARY_DESTINATIONS.map((dest) => (
              <div key={dest.id} className="relative">
                <button
                  onClick={() => handleNavClick(dest)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isActive(dest.id)
                      ? `${activeIndicatorClass}`
                      : `${textSecondaryClass} hover:${textPrimaryClass} hover:bg-white/5 dark:hover:bg-white/10`
                  }`}
                >
                  <span className={isActive(dest.id) ? '' : 'text-amber-400'}>{dest.icon}</span>
                  <span className="hidden xl:inline font-mono-data text-sm font-bold">
                    {lang === 'hi' ? dest.labelHi : dest.label}
                  </span>
                  <span className="xl:hidden font-mono-data text-sm font-bold">
                    {dest.labelHi}
                  </span>
                  {dest.analyticalTools && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                      expandedDestination === dest.id ? 'rotate-180' : ''
                    }`} />
                  )}
                </button>

                {/* Analytical Tools Dropdown */}
                {dest.analyticalTools && expandedDestination === dest.id && (
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl ${
                    isScholarMode 
                      ? 'bg-[#0E101D] border border-[#D4AF37]/30' 
                      : 'bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 shadow-xl'
                  } shadow-xl overflow-hidden z-50`}>
                    <div className={`p-3 border-b ${isScholarMode ? 'border-white/10' : 'border-black/10 dark:border-white/10'}`}>
                      <span className={`text-xs font-mono-data font-bold ${textSecondaryClass}`}>
                        Analytical Tools inside {dest.labelHi}
                      </span>
                    </div>
                    <div className="p-2 space-y-1">
                      {dest.analyticalTools.map((tool) => (
                        <Link
                          key={tool.href}
                          href={tool.href}
                          onClick={() => { chitiSensory.playTick(); setExpandedDestination(null); }}
                          className={`flex items-start gap-3 p-3 rounded-xl ${
                            isScholarMode 
                              ? 'hover:bg-white/10' 
                              : 'hover:bg-[#8E6F1D]/10 dark:hover:bg-white/10'
                          } transition-all group`}
                        >
                          <Layers className="w-4 h-4 text-amber-400/70 mt-0.5 shrink-0" />
                          <div>
                            <div className={`text-sm font-medium ${textPrimaryClass} group-hover:text-amber-400 transition-colors`}>
                              {lang === 'hi' ? tool.labelHi : tool.label}
                            </div>
                            <div className={`text-xs ${textSecondaryClass}`}>{tool.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Kundali Milan */}
            <Link
              href="/kundali-milan"
              onClick={() => chitiSensory.playTick()}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                isScholarMode ? 'bg-amber-500/20' : 'bg-amber-500/10'
              } ${isScholarMode ? 'text-amber-300' : 'text-[#8E6F1D]'} text-xs font-mono-data font-bold border ${borderColorClass} hover:opacity-80 transition-all`}
            >
              <span>💍</span>
              <span>{lang === 'hi' ? 'कुण्डली मिलान' : 'Kundali Milan'}</span>
            </Link>

            {/* Quick Consult CTA */}
            <Link
              href="/ask"
              onClick={() => chitiSensory.playTick()}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl ${
                isScholarMode 
                  ? 'bg-[#D4AF37] hover:bg-[#E5C378] text-[#06070B]' 
                  : 'bg-[#8E6F1D] hover:bg-[#A88424] text-white'
              } font-mono-data font-bold text-sm shadow-md hover:shadow-lg transition-all`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'hi' ? 'परामर्श' : 'Consult'}</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => { chitiSensory.playTick(); setMobileMenuOpen(true); }}
              className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border ${borderColorClass} ${
                isScholarMode ? 'bg-white/5' : 'bg-black/5'
              } ${textPrimaryClass} transition-all cursor-pointer`}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {expandedDestination && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setExpandedDestination(null)}
        />
      )}
    </nav>
  );
}

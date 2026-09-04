'use client';

/**
 * FullMegaMenuModal — full-screen destination directory.
 *
 * Sprint B.1 hardening:
 *   CT_UX_INV_001 — every tile href comes from `navigationModel` (validated).
 *   D10 / Ashtakavarga / Shadbala / Ephemeris have NO tile here. They are
 *   future technical capabilities documented in navigationMetadata.ts.
 *   CT_UX_INV_002 — no astrology facts; navigation copy only.
 *   A11y — Escape closes, dialog semantics, aria-expanded handled by caller,
 *   focus moved into the dialog on open, logical tab order, 44px+ targets.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  X, Search, Sparkles, Compass, Moon as MoonIcon, Calendar, BookOpen, MapPin,
  Heart, Clock, Landmark, Telescope, ScrollText, Gem, Layers, FileText,
  UserCircle, Users, Sun, Flame,
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import { TRANSLATIONS } from '@/lib/translations';
import {
  PRIMARY_DESTINATIONS,
  type NavIconKey,
} from '@/lib/navigation/navigationModel';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';

type Dict = Record<string, string>;

const ICONS: Record<NavIconKey, React.ComponentType<{ className?: string }> | null> = {
  sun: Sun,
  compass: Compass,
  sparkles: Sparkles,
  user: UserCircle,
  flame: Flame,
  calendar: Calendar,
  library: BookOpen,
  map: MapPin,
  rings: Heart,
  clock: Clock,
  temple: Landmark,
  observatory: Telescope,
  scroll: ScrollText,
  gem: Gem,
  layers: Layers,
  file: FileText,
  profile: UserCircle,
  moon: MoonIcon,
  languages: null,
  question: null,
  users: Users,
};

interface FullMegaMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}

const SECTION_TITLES: Record<string, string> = {
  TODAY: '1. आज (Today)',
  MY_KUNDLI: '2. मेरी कुण्डली (My Kundli)',
  ASK: '3. पूछें (Ask)',
  CONSULT: '4. परामर्श (Consult)',
  EXPLORE: '5. अन्वेषण (Explore)',
};

export default function FullMegaMenuModal({ isOpen, onClose, lang = 'en' }: FullMegaMenuModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const t: Dict = (TRANSLATIONS[lang] as any)?.navigation || (TRANSLATIONS.en as any).navigation;

  const allLinks = useMemo(() => {
    type MegaEntry = {
      dest: (typeof PRIMARY_DESTINATIONS)[number];
      href: string;
      labelKey: string;
      labelHiKey: string;
      descriptionKey: string;
      icon: NavIconKey;
    };
    const entries: MegaEntry[] = [];
    for (const dest of PRIMARY_DESTINATIONS) {
      for (const entry of [dest, ...dest.children]) {
        if (!entry.href) continue;
        entries.push({
          dest,
          href: entry.href,
          labelKey: entry.labelKey,
          labelHiKey: entry.labelHiKey,
          descriptionKey: entry.descriptionKey,
          icon: entry.icon,
        });
      }
    }
    return entries;
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allLinks;
    const q = searchQuery.toLowerCase();
    return allLinks.filter((l) => {
      const label = t[l.labelKey] ?? '';
      const labelHi = t[l.labelHiKey] ?? '';
      const desc = t[l.descriptionKey] ?? '';
      return label.toLowerCase().includes(q) || labelHi.includes(q) || desc.toLowerCase().includes(q);
    });
  }, [searchQuery, allLinks, t]);

  // Keyboard + focus management
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeBtnRef.current?.focus?.());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        prev?.focus?.();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const renderSection = (destId: 'TODAY' | 'MY_KUNDLI' | 'ASK' | 'CONSULT' | 'EXPLORE') => {
    const dest = PRIMARY_DESTINATIONS.find((d) => d.id === destId);
    if (!dest) return null;
    const links = filtered.filter((l) => l.dest.id === destId);
    if (links.length === 0) return null;
    return (
      <div className="space-y-3" data-testid={`mega-section-${destId}`}>
        <div className="flex items-center gap-2 text-xs font-mono-data font-bold text-[#F0C968] uppercase tracking-wider">
          {SECTION_TITLES[destId]}
        </div>
        <div className="space-y-2">
          {links.map((l) => {
            const Icon = ICONS[l.icon] ?? ScrollText;
            const label = lang === 'hi' ? t[l.labelHiKey] : t[l.labelKey];
            const desc = t[l.descriptionKey] ?? '';
            return (
              <Link
                key={`${destId}-${l.labelKey}-${l.href}`}
                href={l.href}
                data-testid={`mega-link-${l.href.replace(/\//g, '-')}`}
                onClick={() => { chitiSensory.playTick(); onClose(); }}
                className="w-full text-left p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/50 transition-all group flex items-start gap-3"
              >
                <span className="p-1 bg-black/40 rounded-xl shrink-0 text-amber-400 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-editorial text-sm font-bold text-white group-hover:text-[#F0C968] transition-colors line-clamp-1">
                    {label}
                  </span>
                  {desc && (
                    <span className="block text-[11px] font-mono-data text-[#A8A29E] leading-relaxed mt-0.5 line-clamp-2">
                      {desc}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.explore}
      data-testid="full-mega-menu"
      className="fixed inset-0 z-[99999] bg-[#06070B]/95 text-white backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen flex flex-col justify-between space-y-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/10">
          <CosmicTantraLogo size="md" subtitle="5 PRIMARY DESTINATIONS" />
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              aria-label={t.search ?? 'Search destinations'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search ?? 'Search destinations'}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono-data text-white placeholder:text-[#78716C] outline-none focus:border-[#D4AF37]"
            />
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            data-testid="mega-close"
            onClick={() => { chitiSensory.playTick(); onClose(); }}
            aria-label={t.closeMenu ?? 'Close'}
            className="inline-flex items-center gap-2 min-h-11 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono-data font-bold text-white transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>{t.closeMenu ?? 'Close'}</span>
            <X className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden relative">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            aria-label={t.search ?? 'Search destinations'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search ?? 'Search destinations'}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono-data text-white placeholder:text-[#78716C] outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Five destinations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          {renderSection('TODAY')}
          {renderSection('MY_KUNDLI')}
          {renderSection('ASK')}
          {renderSection('CONSULT')}
          {renderSection('EXPLORE')}
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-data text-[#A8A29E]">
          <span>
            <span className="text-[#F0C968] font-bold">Vedic Precision: </span>
            Chitra Paksha (Lahiri) Ayanamsha · Sidereal Ephemeris · No Synthetic Percentiles
          </span>
          <Link
            href="/ask"
            data-testid="mega-ask-cta"
            onClick={() => { chitiSensory.playTick(); onClose(); }}
            className="inline-flex min-h-11 items-center px-4 py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#D4AF37] text-white hover:text-black font-bold transition-all shadow-md"
          >
            {t.ask ?? 'Ask'} →
          </Link>
        </div>
      </div>
    </div>
  );
}

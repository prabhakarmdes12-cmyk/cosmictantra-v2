'use client';

/**
 * PrimaryNavigation — CosmicTantra five-destination primary + mobile bottom
 * navigation.
 *
 * Sprint B.1 hardening rules applied here:
 *   CT_UX_INV_001  Every href comes from `navigationModel` (validator-tested).
 *   CT_UX_INV_002  No astrology facts in a presentation component — this file
 *                  carries navigation copy only.
 *   Location       Uses the canonical `useActiveLocation` resolver; when the
 *                  location is unknown it shows "Set location" — never a fake
 *                  city.
 *   Accessibility  Keyboard navigable, visible focus, Escape, aria-expanded/
 *                  haspopup, logical tab order, 44px+ touch targets.
 *   Kashi context  Stamps `data-kashi-context-*` attributes consumed by the
 *                  assistant contract (see src/lib/kashi/contextContract.ts).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun, Moon, Languages, MapPin, ChevronDown, Compass, Sparkles, User, Flame,
  Calendar, BookOpen, Heart, Clock, Landmark, Telescope, ScrollText, Gem,
  Layers, FileText, UserCircle, Users, HelpCircle,
} from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from '@/lib/translations';
import { useActiveLocation } from '@/lib/location/useActiveLocation';
import { resolveKashiContext } from '@/lib/kashi/contextContract';
import {
  PRIMARY_DESTINATIONS,
  MOBILE_BOTTOM_NAV_ITEMS,
  resolvePrimaryDestination,
  type PrimaryDestinationId,
  type NavIconKey,
  type NavigationChildLink,
  type PrimaryDestination,
} from '@/lib/navigation/navigationModel';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';

type Dict = Record<string, string>;
type LangDict = { navigation: Dict; context: Dict };

const ICONS: Record<NavIconKey, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  compass: Compass,
  sparkles: Sparkles,
  user: User,
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
  moon: Moon,
  languages: Languages,
  question: HelpCircle,
  users: Users,
};

interface PrimaryNavigationProps {
  mode?: 'public' | 'scholar';
  theme?: string;
  lang?: string;
  onThemeToggle?: () => void;
  onLangToggle?: () => void;
  onOpenCitySelector?: () => void;
}

export default function PrimaryNavigation({
  mode = 'public',
  theme = 'light',
  lang = 'en',
  onThemeToggle,
  onLangToggle,
  onOpenCitySelector,
}: PrimaryNavigationProps) {
  const pathname = usePathname();
  const t: Dict = (TRANSLATIONS[lang] as LangDict)?.navigation || (TRANSLATIONS.en as LangDict).navigation;
  const ctxT: Dict = (TRANSLATIONS[lang] as LangDict)?.context || (TRANSLATIONS.en as LangDict).context;

  const { location } = useActiveLocation();
  const kashiContext = useMemo(
    () => resolveKashiContext(pathname || '/', location),
    [pathname, location],
  );

  const activeId = resolvePrimaryDestination(pathname || '/');

  /** Which disclosure (explore menu / child flyout) is open. */
  const [openMenu, setOpenMenu] = useState<PrimaryDestinationId | null>(null);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  const closeAll = useCallback(() => {
    setOpenMenu(null);
    setMobileExploreOpen(false);
  }, []);

  /* Escape + outside click + route-change safety */
  useEffect(() => {
    if (!openMenu && !mobileExploreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAll();
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (navRef.current && target && !navRef.current.contains(target)) closeAll();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openMenu, mobileExploreOpen, closeAll]);

  useEffect(() => {
    closeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* Focus the first link of a newly opened disclosure */
  useEffect(() => {
    if (openMenu || mobileExploreOpen) {
      requestAnimationFrame(() => firstLinkRef.current?.focus?.());
    }
  }, [openMenu, mobileExploreOpen]);

  const toggleDest = (dest: PrimaryDestination) => {
    chitiSensory.playTick();
    if (dest.isMenu) {
      setMobileExploreOpen(false);
      setOpenMenu((cur) => (cur === dest.id ? null : dest.id));
      return;
    }
    // Non-menu destination: navigate via real router link semantics (Link),
    // this handler only closes any open disclosure.
    closeAll();
  };

  const isActive = (id: PrimaryDestinationId) => activeId === id;

  const destinationLabel = (d: { labelKey: string; labelHiKey: string }) =>
    lang === 'hi' ? t[d.labelHiKey] : t[d.labelKey];

  const childLabel = (c: NavigationChildLink) => (lang === 'hi' ? t[c.labelHiKey] : t[c.labelKey]);
  const childDescription = (c: NavigationChildLink) => t[c.descriptionKey];

  const languageLabel =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.label || lang.toUpperCase();

  const isDark = theme === 'dark';

  return (
    <>
      {/* ================= DESKTOP / TABLET TOP BAR ================= */}
      <nav
        ref={navRef}
        data-testid="primary-nav"
        aria-label={t.primaryNav ?? 'Primary navigation'}
        data-kashi-context-domain={kashiContext.domain}
        data-kashi-location-source={location.source}
        data-kashi-suggested-prompt={kashiContext.suggestedPrompts[0] ? ctxT[kashiContext.suggestedPrompts[0].i18nKey] ?? '' : ''}
        className={`relative z-40 border-b ${
          isDark ? 'bg-[#06070B]/95 border-[#D4AF37]/25 text-[#F5F2EB]' : 'bg-[#FAF7F2]/95 border-[#8E6F1D]/25 text-[#1C1917]'
        } backdrop-blur-2xl transition-colors`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between gap-2 h-16">

            {/* LEFT — brand + location */}
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              <Link href="/" aria-label="CosmicTantra home" onClick={() => chitiSensory.playTick()} className="shrink-0">
                <CosmicTantraLogo size="sm" />
              </Link>

              {onOpenCitySelector && (
                <button
                  type="button"
                  data-testid="primary-nav-location"
                  data-location-status={location.status}
                  onClick={() => { chitiSensory.playTick(); onOpenCitySelector(); }}
                  aria-label={location.status === 'KNOWN' ? t.changeLocation : t.setLocation}
                  title={location.status === 'KNOWN' ? t.changeLocation : t.setLocation}
                  className={`inline-flex items-center gap-1.5 min-h-11 px-2 sm:px-3 rounded-xl border text-xs font-mono-data font-bold transition-all cursor-pointer ${
                    location.status === 'KNOWN'
                      ? isDark
                        ? 'border-[#D4AF37]/30 text-[#F0C968] hover:bg-white/5'
                        : 'border-[#8E6F1D]/30 text-[#8E6F1D] hover:bg-black/5'
                      : isDark
                        ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                        : 'border-amber-500/40 text-amber-700 hover:bg-amber-500/10'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline truncate max-w-[9rem]">
                    {location.status === 'KNOWN' ? location.name : t.setLocation}
                  </span>
                  <span className="sm:hidden sr-only">
                    {location.status === 'KNOWN' ? location.name : t.setLocation}
                  </span>
                </button>
              )}
            </div>

            {/* CENTER — five destinations */}
            <div className="flex items-center justify-center gap-0.5 md:gap-1 min-w-0" role="list">
              {PRIMARY_DESTINATIONS.map((dest) => {
                const Icon = ICONS[dest.icon];
                const active = isActive(dest.id);
                const expanded = openMenu === dest.id;
                return (
                  <div key={dest.id} role="listitem" className="relative shrink-0">
                    {dest.isMenu || dest.href === null ? (
                      <button
                        ref={(el) => { triggerRefs.current[dest.id] = el; }}
                        type="button"
                        data-testid={`primary-nav-destination-${dest.id}`}
                        data-active={active ? 'true' : 'false'}
                        aria-haspopup="menu"
                        aria-expanded={expanded}
                        aria-controls={`nav-menu-${dest.id}`}
                        onClick={() => toggleDest(dest)}
                        className={`inline-flex items-center gap-1.5 min-h-11 px-2.5 md:px-3 lg:px-4 rounded-xl text-sm font-mono-data font-bold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                          active
                            ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#06070B]'
                            : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? '' : 'text-amber-500'}`} aria-hidden="true" />
                        <span className="hidden xl:inline">{destinationLabel(dest)}</span>
                        <span className="xl:hidden">{t[dest.labelHiKey === 'exploreHi' ? 'exploreHi' : dest.labelHiKey]}</span>
                        {dest.isMenu && (
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={dest.href}
                        data-testid={`primary-nav-destination-${dest.id}`}
                        data-active={active ? 'true' : 'false'}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => { chitiSensory.playTick(); closeAll(); }}
                        className={`inline-flex items-center gap-1.5 min-h-11 px-2.5 md:px-3 lg:px-4 rounded-xl text-sm font-mono-data font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                          active
                            ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#06070B]'
                            : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? '' : 'text-amber-500'}`} aria-hidden="true" />
                        <span className="hidden xl:inline">{destinationLabel(dest)}</span>
                        <span className="xl:hidden">{t[dest.labelHiKey]}</span>
                      </Link>
                    )}

                    {/* Desktop disclosure (Explore menu / destination children) */}
                    {expanded && (
                      <div
                        id={`nav-menu-${dest.id}`}
                        role="menu"
                        data-testid={`primary-nav-menu-${dest.id}`}
                        className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 max-h-[70vh] overflow-y-auto rounded-2xl border shadow-2xl p-2 ${
                          isDark
                            ? 'bg-[#0E101D] border-[#D4AF37]/30 text-[#F5F2EB]'
                            : 'bg-white border-[#8E6F1D]/30 text-[#1C1917]'
                        }`}
                      >
                        <div className="px-3 py-2 text-[10px] font-mono-data font-bold uppercase tracking-wider opacity-60">
                          {t.fiveDestinations}
                        </div>
                        {dest.children.length === 0 && (
                          <div className="px-3 py-3 text-sm opacity-70">—</div>
                        )}
                        {dest.children.map((child, i) => {
                          const ChildIcon = ICONS[child.icon];
                          return (
                            <Link
                              key={child.id}
                              ref={i === 0 ? firstLinkRef : undefined}
                              href={child.href}
                              role="menuitem"
                              data-testid={`primary-nav-child-${child.id}`}
                              onClick={() => { chitiSensory.playTick(); closeAll(); }}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                            >
                              <ChildIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium">{childLabel(child)}</span>
                                <span className="block text-xs opacity-60 mt-0.5">{childDescription(child)}</span>
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* RIGHT — controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onLangToggle && (
                <button
                  type="button"
                  data-testid="primary-nav-language"
                  onClick={() => { chitiSensory.playTick(); onLangToggle(); }}
                  aria-label="Language"
                  className="hidden lg:inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl border text-xs font-mono-data font-bold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 border-[#8E6F1D]/25 dark:border-[#D4AF37]/25 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Languages className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="max-w-[4.5rem] truncate">{languageLabel}</span>
                </button>
              )}
              {onThemeToggle && (
                <button
                  type="button"
                  data-testid="primary-nav-theme"
                  onClick={onThemeToggle}
                  aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                  className="w-11 h-11 inline-flex items-center justify-center rounded-xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/25 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8E6F1D]" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav
        aria-label={t.bottomNav ?? 'Bottom navigation'}
        data-testid="primary-nav-mobile"
        className="ct-bottom-nav lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[#8E6F1D]/25 dark:border-[#D4AF37]/25 bg-[#FAF7F2]/98 dark:bg-[#06070B]/98 backdrop-blur-2xl pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-xl grid grid-cols-5 items-end" style={{ minHeight: 64 }}>
          {MOBILE_BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item.id);
            const isExplore = item.id === 'EXPLORE';
            const label = lang === 'hi' ? t[item.labelHiKey] : t[item.labelKey];
            if (isExplore) {
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`bottom-nav-${item.id}`}
                  data-active={active ? 'true' : 'false'}
                  aria-haspopup="menu"
                  aria-expanded={mobileExploreOpen}
                  aria-controls="primary-nav-mobile-explore"
                  onClick={() => { chitiSensory.playTick(); setMobileExploreOpen((v) => !v); }}
                  className="flex flex-col items-center justify-center gap-1 min-h-14 py-1.5 text-[10px] font-mono-data font-bold text-[#696256] dark:text-[#9E988D] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Icon className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            }
            if (item.isAsk) {
              return (
                <Link
                  key={item.id}
                  href={item.href!}
                  data-testid={`bottom-nav-${item.id}`}
                  data-active={active ? 'true' : 'false'}
                  aria-label={t.askCenter}
                  onClick={() => chitiSensory.playTick()}
                  className="flex flex-col items-center justify-center gap-0.5 min-h-14 py-1 text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]"
                >
                  <span className="w-12 h-12 -mt-4 rounded-full bg-gradient-to-br from-[#8E6F1D] to-[#D4AF37] text-white shadow-lg flex items-center justify-center">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={item.id}
                href={item.href!}
                data-testid={`bottom-nav-${item.id}`}
                data-active={active ? 'true' : 'false'}
                aria-current={active ? 'page' : undefined}
                onClick={() => chitiSensory.playTick()}
                className={`flex flex-col items-center justify-center gap-1 min-h-14 py-1.5 text-[10px] font-mono-data font-bold transition-colors ${
                  active
                    ? 'text-[#8E6F1D] dark:text-[#F0C968] bg-black/5 dark:bg-white/5'
                    : 'text-[#696256] dark:text-[#9E988D]'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ================= MOBILE EXPLORE SHEET ================= */}
      {mobileExploreOpen && (
        <div
          id="primary-nav-mobile-explore"
          role="dialog"
          aria-modal="false"
          aria-label={t.explore}
          data-testid="primary-nav-explore-sheet"
          className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-40 lg:hidden border-t border-[#8E6F1D]/25 dark:border-[#D4AF37]/25 bg-[#FAF7F2]/98 dark:bg-[#06070B]/98 backdrop-blur-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
        >
          <div className="mx-auto max-w-xl px-4 py-3">
            <div className="text-[10px] font-mono-data font-bold uppercase tracking-wider opacity-60 mb-2">
              {t.explore} · {t.fiveDestinations}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {PRIMARY_DESTINATIONS.find((d) => d.id === 'EXPLORE')?.children.map((child, i) => {
                const ChildIcon = ICONS[child.icon];
                return (
                  <Link
                    key={child.id}
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={child.href}
                    data-testid={`explore-sheet-${child.id}`}
                    onClick={() => { chitiSensory.playTick(); closeAll(); }}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                  >
                    <ChildIcon className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{childLabel(child)}</span>
                      <span className="block text-[11px] opacity-60 mt-0.5">{childDescription(child)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import GlobalHeader from './GlobalHeader';
import PrimaryNavigation from './PrimaryNavigation';
import Breadcrumbs from './Breadcrumbs';
import GlobalFooter from './GlobalFooter';
import LanguageSelectorModal from './LanguageSelectorModal';
import FloatingAIGuruAvatar from '@/components/consultation/FloatingAIGuruAvatar';
import { getRouteConfig, ShellMode, FooterMode, BreadcrumbItem } from '@/lib/routeRegistry';
import { persistActiveLocation } from '@/lib/location/activeLocation';

const CitySelectorModal = nextDynamic(() => import('@/components/CitySelectorModal'), { ssr: false });

interface CosmicTantraShellProps {
  children: React.ReactNode;
  shellMode?: ShellMode;
  footerMode?: FooterMode;
  breadcrumbs?: BreadcrumbItem[];
  customTitle?: string;
  presentationSlide?: number;
  totalSlides?: number;
  hideAIGuru?: boolean;
}

export default function CosmicTantraShell({
  children,
  shellMode,
  footerMode,
  breadcrumbs,
  presentationSlide = 1,
  totalSlides = 10,
  hideAIGuru = false,
}: CosmicTantraShellProps) {
  const pathname = usePathname();
  const routeConfig = getRouteConfig(pathname || '/');

  const activeShellMode = shellMode || routeConfig.shellMode;
  const activeFooterMode = footerMode || routeConfig.footerMode;
  const activeBreadcrumbs = breadcrumbs || routeConfig.breadcrumbs;

  // Day/Night & Language state synced from client storage
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<string>('en');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cosmictantra_theme') as 'light' | 'dark';
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // Default to dark mode for sacred night aura if system prefers
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          setTheme('dark');
          document.documentElement.classList.add('dark');
        }
      }

      const savedLang = localStorage.getItem('cosmictantra_lang');
      if (savedLang) setLang(savedLang);
    } catch {}
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try {
      localStorage.setItem('cosmictantra_theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {}
  };

  const handleLangToggle = () => setLanguageOpen(true);

  const handleLanguageSelect = (nextLang: string) => {
    setLang(nextLang);
    try { localStorage.setItem('cosmictantra_lang', nextLang); } catch {}
    window.dispatchEvent(new CustomEvent('cosmictantra:language-change', { detail: nextLang }));
  };

  /** Selection flows through the canonical location resolver (existing stores only). */
  const handleCitySelect = (city: { name: string; nameHi?: string; lat: number; lng: number; tz?: number; isGps?: boolean; id?: string }) => {
    persistActiveLocation(city);
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#06070B] text-[#FFFFFF]' : 'bg-[#FAF7F2] text-[#1C1917]'
    }`}>
      {/* Canonical unified header with center-aligned logo and minimal navigation */}
      <GlobalHeader
        mode={activeShellMode}
        theme={theme}
        lang={lang}
        onThemeToggle={handleThemeToggle}
        onLangToggle={handleLangToggle}
        onOpenCitySelector={() => setCityModalOpen(true)}
        presentationSlide={presentationSlide}
        totalSlides={totalSlides}
      />

      {/* Semantic Clickable Breadcrumbs (Public routes only) */}
      {activeShellMode === 'public' && activeBreadcrumbs && activeBreadcrumbs.length > 0 && (
        <Breadcrumbs 
          items={activeBreadcrumbs} 
          emitSchema={routeConfig.indexable} 
        />
      )}

      {/* Page Content Room — bottom padding reserves space for the mobile bottom nav */}
      <main className="flex-1 w-full pb-20 lg:pb-0">
        {children}
      </main>

      <LanguageSelectorModal
        isOpen={languageOpen}
        currentLang={lang}
        onClose={() => setLanguageOpen(false)}
        onSelectLang={handleLanguageSelect}
      />

      <CitySelectorModal
        isOpen={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        currentCity={undefined}
        onSelectCity={handleCitySelect}
        lang={lang}
        theme={theme}
      />

      {/* FLOATING AI GURU CONCIERGE AVATAR */}
      {!hideAIGuru && activeShellMode !== 'presentation' && (
        <FloatingAIGuruAvatar />
      )}

      {/* Institutional Global Footer */}
      <GlobalFooter 
        mode={activeFooterMode} 
        lang={lang} 
      />
    </div>
  );
}

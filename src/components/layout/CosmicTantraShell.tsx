'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import GlobalHeader from './GlobalHeader';
import Breadcrumbs from './Breadcrumbs';
import GlobalFooter from './GlobalFooter';
import { getRouteConfig, ShellMode, FooterMode, BreadcrumbItem } from '@/lib/routeRegistry';

interface CosmicTantraShellProps {
  children: React.ReactNode;
  shellMode?: ShellMode;
  footerMode?: FooterMode;
  breadcrumbs?: BreadcrumbItem[];
  customTitle?: string;
  presentationSlide?: number;
  totalSlides?: number;
}

export default function CosmicTantraShell({
  children,
  shellMode,
  footerMode,
  breadcrumbs,
  presentationSlide = 1,
  totalSlides = 10
}: CosmicTantraShellProps) {
  const pathname = usePathname();
  const routeConfig = getRouteConfig(pathname || '/');

  const activeShellMode = shellMode || routeConfig.shellMode;
  const activeFooterMode = footerMode || routeConfig.footerMode;
  const activeBreadcrumbs = breadcrumbs || routeConfig.breadcrumbs;

  // Day/Night & Language state synced from client storage
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('cosmictantra_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
      const savedLang = localStorage.getItem('cosmictantra_lang');
      if (savedLang === 'en' || savedLang === 'hi') {
        setLang(savedLang);
      }
    } catch {}
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    const root = document.documentElement;
    if (nextTheme === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('cosmictantra_theme', nextTheme);
    } catch {}
  };

  const handleLangToggle = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    try {
      localStorage.setItem('cosmictantra_lang', nextLang);
    } catch {}
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#06070B] text-[#FFFFFF]' : 'bg-[#FAF7F2] text-[#1C1917]'
    }`}>
      {/* Context-Aware Global Header */}
      <GlobalHeader
        mode={activeShellMode}
        theme={theme}
        lang={lang}
        onThemeToggle={handleThemeToggle}
        onLangToggle={handleLangToggle}
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

      {/* Page Content Room */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Institutional Global Footer */}
      <GlobalFooter 
        mode={activeFooterMode} 
        lang={lang} 
      />
    </div>
  );
}

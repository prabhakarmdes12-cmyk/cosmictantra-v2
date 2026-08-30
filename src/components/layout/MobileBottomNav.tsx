'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sun, Sparkles, MessageCircle, Grid2x2 } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import FullMegaMenuModal from '@/components/layout/FullMegaMenuModal';

/**
 * MobileBottomNav — 5-thumb-task navigation for phones (hidden ≥ md).
 * Home · Today · Kundli · Ask · More (opens the existing mega-menu vault).
 * Floating widgets (AI Guru bottom-left, WhatsApp Help Desk bottom-right)
 * sit above this bar via their own `bottom-20 md:bottom-*` offsets.
 */
export default function MobileBottomNav({ lang = 'hi' }: { lang?: 'en' | 'hi' }) {
  const pathname = usePathname() || '/';
  const [moreOpen, setMoreOpen] = useState(false);
  const isHi = lang === 'hi';

  const isHome = pathname === '/';
  const isToday = pathname === '/daily' || pathname.startsWith('/panchang');
  const isKundli = pathname === '/dashboard' || pathname.startsWith('/kundli');
  const isAsk = pathname === '/ask' || pathname.startsWith('/consultation');

  const items = [
    {
      key: 'home',
      href: '/',
      label: isHi ? 'होम' : 'Home',
      icon: Home,
      active: isHome,
    },
    {
      key: 'today',
      href: '/daily',
      label: isHi ? 'आज' : 'Today',
      icon: Sun,
      active: isToday,
    },
    {
      key: 'kundli',
      href: '/#kundali-section',
      label: isHi ? 'कुण्डली' : 'Kundli',
      icon: Sparkles,
      active: isKundli,
    },
    {
      key: 'ask',
      href: '/ask',
      label: isHi ? 'पूछें' : 'Ask',
      icon: MessageCircle,
      active: isAsk,
    },
  ];

  return (
    <>
      {/* Spacer so page content / footer never hides behind the bar */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#FAF7F2]/95 dark:bg-[#06070B]/95 backdrop-blur-xl border-t border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 transition-colors"
        aria-label={isHi ? 'मुख्य नेविगेशन' : 'Primary navigation'}
      >
        <div className="grid grid-cols-5 h-16 max-w-2xl mx-auto">
          {items.map(({ key, href, label, icon: Icon, active }) => (
            <Link
              key={key}
              href={href}
              onClick={() => chitiSensory.playTick()}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors cursor-pointer ${
                active
                  ? 'text-[#8E6F1D] dark:text-[#F0C968]'
                  : 'text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-mono-data font-bold leading-none">{label}</span>
              <span
                className={`w-5 h-0.5 rounded-full mt-0.5 ${
                  active ? 'bg-[#8E6F1D] dark:bg-[#D4AF37]' : 'bg-transparent'
                }`}
              />
            </Link>
          ))}

          {/* More → existing full-screen mega menu vault */}
          <button
            onClick={() => {
              chitiSensory.playTick();
              setMoreOpen(true);
            }}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white transition-colors cursor-pointer"
          >
            <Grid2x2 className="w-5 h-5" strokeWidth={2} />
            <span className="text-[10px] font-mono-data font-bold leading-none">
              {isHi ? 'अधिक' : 'More'}
            </span>
            <span className="w-5 h-0.5 rounded-full mt-0.5 bg-transparent" />
          </button>
        </div>
      </nav>

      <FullMegaMenuModal isOpen={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

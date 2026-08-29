'use client';

import React from 'react';
import Link from 'next/link';
import CosmicTantraLogo from '@/components/visual/CosmicTantraLogo';
import { FooterMode } from '@/lib/routeRegistry';

interface GlobalFooterProps {
  mode?: FooterMode;
  lang?: string;
}

export default function GlobalFooter({ mode = 'full', lang = 'en' }: GlobalFooterProps) {
  if (mode === 'none') return null;

  if (mode === 'minimal') {
    return (
      <footer className="w-full border-t border-black/[0.08] dark:border-white/[0.08] bg-[#F4EFE6]/60 dark:bg-[#070910] py-6 px-4 text-center text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CosmicTantraLogo size="sm" />
            <span>• Consent-Based Vedic Identity</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#8E6F1D] dark:hover:text-[#D4AF37]">Observatory Home</Link>
            <Link href="/ask" className="hover:text-[#8E6F1D] dark:hover:text-[#D4AF37]">Written Consultation</Link>
            <Link href="/aarti-stotra" className="hover:text-[#8E6F1D] dark:hover:text-[#D4AF37]">Sacred Library</Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-black/[0.08] dark:border-white/[0.08] bg-[#F4EFE6]/80 dark:bg-[#06070B] text-[#1C1917] dark:text-[#F5F2EB] transition-colors pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Brand Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 pb-12 border-b border-black/[0.08] dark:border-white/[0.08]">
          {/* Col 1: Brand Authority */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
            <CosmicTantraLogo size="md" subtitle="VEDIC PRECISION • HUMAN WISDOM" />
            <p className="text-xs font-mono-data text-[#696256] dark:text-[#9E988D] leading-relaxed max-w-sm">
              Classical Jyotish astronomical calculations, location-aware Vedic diurnal time, Lahiri sidereal ephemeris, and verified written counsel.
            </p>
            <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">
              Chitra Paksha Sidereal Ephemeris • Accuracy ±0.01°
            </div>
          </div>

          {/* Col 2: Panchang & Time */}
          <div className="space-y-3">
            <div className="text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
              Panchang
            </div>
            <ul className="space-y-2 text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
              <li><Link href="/#panchang-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Today's Tithi</Link></li>
              <li><Link href="/#panchang-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Nakshatras 27</Link></li>
              <li><Link href="/#panchang-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Rahu Kaal Timing</Link></li>
              <li><Link href="/daily" className="hover:text-[#8E6F1D] dark:hover:text-white">Daily Weather Card</Link></li>
              <li><Link href="/family-panchang" className="hover:text-[#8E6F1D] dark:hover:text-white">Parivaar Panchang</Link></li>
            </ul>
          </div>

          {/* Col 3: Muhurat & Timing */}
          <div className="space-y-3">
            <div className="text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
              Shubh Muhurat
            </div>
            <ul className="space-y-2 text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
              <li><Link href="/#muhurat-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Vivah Muhurat</Link></li>
              <li><Link href="/#muhurat-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Griha Pravesh</Link></li>
              <li><Link href="/#muhurat-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Vahan Kharid</Link></li>
              <li><Link href="/#muhurat-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Namkaran Sanskar</Link></li>
              <li><Link href="/#muhurat-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Abhijit Muhurat</Link></li>
            </ul>
          </div>

          {/* Col 4: Tools & Charts */}
          <div className="space-y-3">
            <div className="text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
              Jyotish Tools
            </div>
            <ul className="space-y-2 text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
              <li><Link href="/#kundali-section" className="hover:text-[#8E6F1D] dark:hover:text-white">Janma Kundali Studio</Link></li>
              <li><Link href="/kundali-milan" className="hover:text-[#8E6F1D] dark:hover:text-white">36-Pt Kundali Milan</Link></li>
              <li><Link href="/numerology/name" className="hover:text-[#8E6F1D] dark:hover:text-white">Chaldean Numerology</Link></li>
              <li><Link href="/remedy-tracker" className="hover:text-[#8E6F1D] dark:hover:text-white">108 Japa Tracker</Link></li>
              <li><Link href="/aarti-stotra" className="hover:text-[#8E6F1D] dark:hover:text-white">Aarti & Stotra Library</Link></li>
            </ul>
          </div>

          {/* Col 5: Guidance & Scholars */}
          <div className="space-y-3">
            <div className="text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
              Scholarly Counsel
            </div>
            <ul className="space-y-2 text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">
              <li><Link href="/ask" className="hover:text-[#8E6F1D] dark:hover:text-white">Ask Written Folio (₹501)</Link></li>
              <li><Link href="/report" className="hover:text-[#8E6F1D] dark:hover:text-white">Sample Written Folio</Link></li>
              <li><Link href="/upaya" className="hover:text-[#8E6F1D] dark:hover:text-white">Planetary Remedies</Link></li>
              <li><Link href="/presentation" className="hover:text-[#8E6F1D] dark:hover:text-white">Scholar Deck</Link></li>
              <li><Link href="/pandit/workspace" className="hover:text-[#8E6F1D] dark:hover:text-white">Pandit Workspace</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-data text-[#696256] dark:text-[#8E877B]">
          <div>
            © 2026 CosmicTantra Technologies Pvt. Ltd. • All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:underline">Methodology</Link>
            <Link href="/profile" className="hover:underline">Privacy Controls</Link>
            <Link href="/presentation" className="hover:underline">Vidwat Parishad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

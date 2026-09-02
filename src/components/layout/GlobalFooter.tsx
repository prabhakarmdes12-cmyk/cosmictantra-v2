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
    <footer className="w-full border-t border-black/[0.08] dark:border-white/[0.08] bg-[#F4EFE6]/80 dark:bg-[#06070B] text-[#1C1917] dark:text-[#F5F2EB] transition-colors pt-12 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 pb-10 border-b border-black/[0.08] dark:border-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <CosmicTantraLogo size="md" subtitle="VEDIC PRECISION • HUMAN WISDOM" />
            <p className="text-sm text-[#696256] dark:text-[#AAA397] leading-6 max-w-sm">
              Clear Vedic timing, personal charts, and human guidance when you need it.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
              Today
            </div>
            <ul className="space-y-3 text-sm text-[#696256] dark:text-[#AAA397]">
              <li><Link href="/daily" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">Daily guidance</Link></li>
              <li><Link href="/calendar" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">Vedic calendar</Link></li>
              <li><Link href="/family-panchang" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">Family Panchang</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
              My chart
            </div>
            <ul className="space-y-3 text-sm text-[#696256] dark:text-[#AAA397]">
              <li><Link href="/report" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">Master Kundli</Link></li>
              <li><Link href="/dashboard" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">My Space</Link></li>
              <li><Link href="/kundali-milan" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white font-bold">💍 Kundali Milan & PDF Report</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-mono-data uppercase tracking-wider font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
              Guidance & Explore
            </div>
            <ul className="space-y-3 text-sm text-[#696256] dark:text-[#AAA397]">
              <li><Link href="/ask" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">Ask a Jyotishi</Link></li>
              <li><Link href="/library" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">Vedic library</Link></li>
              <li><Link href="/aarti-stotra" className="inline-flex min-h-11 items-center hover:text-[#8E6F1D] dark:hover:text-white">Aarti & Stotra</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-data text-[#696256] dark:text-[#8E877B]">
          <div>
            © 2026 CosmicTantra Technologies Pvt. Ltd. • All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/library/lahiri-ayanamsha" className="inline-flex min-h-11 items-center hover:underline">Methodology</Link>
            <Link href="/profile" className="inline-flex min-h-11 items-center hover:underline">Privacy Controls</Link>
            <Link href="/ask" className="inline-flex min-h-11 items-center hover:underline">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

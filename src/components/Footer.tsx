'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-purple-500/20 bg-black/90 py-16 px-4 font-body text-xs text-[#9CA3AF]">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-12">
        {/* BRAND COLUMN */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🕉️</span>
            <span className="font-display text-base font-bold text-white tracking-wider">COSMICTANTRA</span>
          </div>
          <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-xs">
            Vedic Time • Personal Astrology • Decision Intelligence • Human Jyotish
          </p>
          <div className="text-[10px] text-[#A78BFA] font-mono">
            Powered by Chiti Technologies · cosmictantra.chiti.tech
          </div>
        </div>

        {/* COL 1: TODAY */}
        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-display">TODAY</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><a href="#calculator" className="hover:text-white transition-colors">Daily Panchang</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Tithi Schedule</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Nakshatra Timing</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Rahu Kalam</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Day Horas</a></li>
          </ul>
        </div>

        {/* COL 2: MUHURAT */}
        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-display">MUHURAT</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><a href="#muhurat" className="hover:text-white transition-colors">Marriage Vivah</a></li>
            <li><a href="#muhurat" className="hover:text-white transition-colors">Griha Pravesh</a></li>
            <li><a href="#muhurat" className="hover:text-white transition-colors">Business Launch</a></li>
            <li><a href="#muhurat" className="hover:text-white transition-colors">Property Purchase</a></li>
            <li><a href="#muhurat" className="hover:text-white transition-colors">Vehicle Delivery</a></li>
          </ul>
        </div>

        {/* COL 3: JYOTISH */}
        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-display">JYOTISH</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><a href="#calculator" className="hover:text-white transition-colors">Kundali Chart</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Lagna Rasi</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Vimshottari Dasha</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Swarga Lok 3D</a></li>
            <li><a href="#calculator" className="hover:text-white transition-colors">Karma Matrix</a></li>
          </ul>
        </div>

        {/* COL 4: CALENDAR */}
        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-display">CALENDAR</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><a href="#festivals" className="hover:text-white transition-colors">Festivals & Vrat</a></li>
            <li><a href="#festivals" className="hover:text-white transition-colors">Ekadashi Dates</a></li>
            <li><a href="#festivals" className="hover:text-white transition-colors">Purnima Dates</a></li>
            <li><a href="#festivals" className="hover:text-white transition-colors">Amavasya Dates</a></li>
          </ul>
        </div>

        {/* COL 5: GUIDANCE & PRACTITIONER */}
        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px] font-display">GUIDANCE</h4>
          <ul className="space-y-1.5 text-[11px]">
            <li><Link href="/ask" className="text-[#F59E0B] font-bold hover:underline">Ask a Jyotishi (₹199)</Link></li>
            <li><a href="#practitioners" className="hover:text-white transition-colors">Practitioner Directory</a></li>
            <li><a href="#mechanism" className="hover:text-white transition-colors">How It Works</a></li>
            <li><Link href="/pandit" className="text-[#A78BFA] hover:text-white transition-colors font-semibold">Practitioner Login</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-8 border-t border-purple-500/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
        <div>
          © 2026 CosmicTantra · Lahiri Astronomical Calculation Standard · All rights reserved.
        </div>
        <div className="flex gap-6">
          <a href="#methodology" className="hover:text-white">Methodology & Limitations</a>
          <Link href="/ask" className="hover:text-white">Ask Question</Link>
          <Link href="/pandit" className="hover:text-white">Pandit Portal</Link>
        </div>
      </div>
    </footer>
  );
}

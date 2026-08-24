'use client';

import React from 'react';
import Link from 'next/link';
import { Award, BookOpen, Clock, Users } from 'lucide-react';

export default function PanditJiPresentation() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1C1917]">
      {/* Hero */}
      <div className="relative h-[92vh] flex items-center justify-center border-b border-[#8E6F1D]/20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#8E6F1D_0.5px,transparent_1px)] bg-[length:6px_6px] opacity-[0.03]"></div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="inline-block px-6 py-1.5 rounded-full border border-[#8E6F1D]/30 text-xs tracking-[3px] mb-6">काशी विद्वत्-परिषद् • २०२६</div>
          
          <h1 className="font-editorial text-7xl font-bold tracking-[-3.5px] leading-none">
            CosmicTantra<br />
            <span className="text-[#8E6F1D]">for Pandit Ji</span>
          </h1>
          
          <p className="mt-6 text-xl max-w-lg mx-auto text-[#57524A]">
            A sacred instrument for the practicing Jyotishi.<br />
            Built with reverence for the unbroken tradition of Varanasi.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link href="/dashboard" className="px-9 py-4 rounded-2xl bg-[#8E6F1D] text-white font-semibold flex items-center gap-3 text-sm">Enter Scholar’s Desk <Award className="w-4 h-4" /></Link>
            <Link href="/daily" className="px-9 py-4 rounded-2xl border border-[#8E6F1D]/30 text-sm font-medium flex items-center gap-3">View Daily Forecast</Link>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-5xl mx-auto px-6 py-20 grid md:grid-cols-4 gap-8">
        {[
          { icon: <BookOpen className="w-6 h-6" />, title: "शुभ दक्षिणा", desc: "₹501 — Traditional honorarium, not commercial pricing" },
          { icon: <Clock className="w-6 h-6" />, title: "Daylight First", desc: "Sacred parchment aesthetic optimized for scholars" },
          { icon: <Award className="w-6 h-6" />, title: "Written Folio", desc: "Permanent, dignified written counsel (not per-minute calls)" },
          { icon: <Users className="w-6 h-6" />, title: "Regional Respect", desc: "Tamil, Gujarati & Bengali traditions honored" },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-[#8E6F1D]/10 text-[#8E6F1D] mb-4">
              {item.icon}
            </div>
            <div className="font-semibold text-lg">{item.title}</div>
            <p className="text-sm text-[#57524A] mt-2">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Final CTA */}
      <div className="bg-[#1C1917] text-[#FAF7F2] py-16 text-center">
        <div className="max-w-md mx-auto px-6">
          <div className="text-xs tracking-[3px] text-[#8E6F1D]">FOR THE TRADITION</div>
          <h2 className="font-editorial text-4xl mt-3">Ready for your review, Pandit Ji.</h2>
          <p className="mt-4 text-[#C9BFA8]">This platform was built to serve the scholar, not replace them.</p>
          
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/dashboard" className="px-8 py-3 bg-white text-[#1C1917] rounded-2xl text-sm font-semibold">Open Scholar’s Desk</Link>
            <Link href="/report" className="px-8 py-3 border border-white/30 rounded-2xl text-sm">View Sample Folio</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const slides = [
  {
    title: "Welcome, Pandit Ji",
    content: "This platform was built with deep reverence for the unbroken Jyotish tradition of Kashi. We do not aim to replace the scholar — we aim to serve them.",
  },
  {
    title: "The Problem We Solve",
    content: "Seekers today are flooded with noisy, per-minute call marketplaces. CosmicTantra offers a dignified alternative: Permanent Written Folios, verified by real scholars.",
  },
  {
    title: "Scholar’s Desk",
    content: "A calm, personal workspace where seekers manage their Cosmic Identity, daily Panchang, and family profiles — all with a scholarly aesthetic.",
  },
  {
    title: "Written Folio (शुभ दक्षिणा ₹५०१)",
    content: "A beautiful, print-ready scholarly document containing Kundali summary, Dasha analysis, Satvik Upaya, and verified remedy recommendations.",
  },
  {
    title: "Pandit Workspace",
    content: "A clean, professional interface where you receive consultations, write folios, add internal comments, and approve delivery.",
  },
  {
    title: "Verified Upaya Partners",
    content: "Genuine gemstones, Rudraksha, and temple rituals from verified suppliers — presented with dignity, not as a marketplace.",
  },
  {
    title: "Smart Upaya Engine",
    content: "Automatically suggests the most appropriate remedies based on the seeker’s Lagna, Nakshatra, Dasha, and question.",
  },
  {
    title: "Family Panchang",
    content: "Personalized daily guidance for the entire family — turning a single user into a daily habit across multiple profiles.",
  },
  {
    title: "Our Philosophy",
    content: "We believe Jyotish is a sacred navigational science. Our role is to preserve its dignity while making it accessible through technology.",
  },
  {
    title: "Next Steps",
    content: "We respectfully invite your guidance. How would you like to shape this platform further?",
  },
];

export default function PanditJiPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prev = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  const slide = slides[currentSlide];

  return (
    <main className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <div className="max-w-3xl mx-auto px-6 pt-12 pb-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-xs tracking-[4px] text-[#8E6F1D]">काशी विद्वत्-परिषद् • PRESENTATION</div>
          <div className="font-editorial text-3xl mt-3">CosmicTantra for Pandit Ji</div>
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-10 min-h-[320px] flex flex-col">
            <div className="text-xs text-[#8E6F1D] tracking-widest mb-4">
              SLIDE {currentSlide + 1} / {slides.length}
            </div>
            
            <h2 className="font-editorial text-4xl font-bold tracking-tight">{slide.title}</h2>
            
            <p className="mt-6 text-lg leading-relaxed text-[#44403C] flex-1">
              {slide.content}
            </p>

            {/* Quick Links */}
            <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-3 text-sm">
              <Link href="/dashboard" className="text-center py-3 border border-[#8E6F1D]/20 rounded-2xl hover:bg-[#8E6F1D]/5">Scholar’s Desk</Link>
              <Link href="/report" className="text-center py-3 border border-[#8E6F1D]/20 rounded-2xl hover:bg-[#8E6F1D]/5">Written Folio</Link>
              <Link href="/pandit/workspace" className="text-center py-3 border border-[#8E6F1D]/20 rounded-2xl hover:bg-[#8E6F1D]/5">Pandit Workspace</Link>
              <Link href="/upaya" className="text-center py-3 border border-[#8E6F1D]/20 rounded-2xl hover:bg-[#8E6F1D]/5">Upaya Partners</Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button 
            onClick={prev} 
            disabled={currentSlide === 0}
            className="px-6 py-3 text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          
          <div className="text-xs text-[#857E74] self-center">
            {currentSlide + 1} / {slides.length}
          </div>

          <button 
            onClick={next} 
            disabled={currentSlide === slides.length - 1}
            className="px-6 py-3 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </div>
    </main>
  );
}

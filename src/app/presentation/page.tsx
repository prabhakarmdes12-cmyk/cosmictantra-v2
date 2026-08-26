'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, FileText, UserCheck, Sparkles } from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';

const slides = [
  {
    title: "Welcome, Pandit Ji",
    sanskrit: "श्री काशी विश्वनाथो विजयते",
    content: "This platform was built with deep reverence for the unbroken Jyotish tradition of Kashi. We do not aim to replace the scholar — we aim to serve them with sub-arcminute astronomical tools.",
  },
  {
    title: "The Problem We Solve",
    sanskrit: "मर्यादा एवं शुचिता",
    content: "Seekers today are flooded with noisy, predatory per-minute call apps. CosmicTantra offers a dignified alternative: Permanent Written Folios, verified and signed by real Vedic scholars.",
  },
  {
    title: "Scholar’s Desk",
    sanskrit: "विद्वत् पीठ",
    content: "A calm, personal workspace where seekers manage their Cosmic Identity, daily Panchang, and family profiles — all designed with traditional scholarly dignity.",
  },
  {
    title: "Written Folio (Fixed ₹501 Dakshina)",
    sanskrit: "लिखित परामर्श पत्र",
    content: "A beautiful, archival-grade 4-page written counsel containing Kundali summary, Dasha analysis, Satvik Upaya, and verified remedy recommendations.",
  },
  {
    title: "Pandit Workspace",
    sanskrit: "ज्योतिर्विद् कार्यपीठ",
    content: "A dedicated operational workbench where you receive consultation cases, review deterministic planetary evidence, edit synthesis, and approve folios.",
  },
  {
    title: "Verified Upaya Partners",
    sanskrit: "सात्त्विक उपाय",
    content: "Genuine lab-certified gemstones, Nepali Rudraksha, and authentic temple anushthans from vetted partners — presented with complete transparency.",
  },
  {
    title: "Smart Upaya Engine",
    sanskrit: "शुद्ध ग्रह शान्ति",
    content: "Automatically computes classical planetary remedies based on the seeker's Lagna, Janma Nakshatra, Mahadasha, and focused life question.",
  },
  {
    title: "Family Panchang",
    sanskrit: "पारिवारिक पञ्चाङ्ग",
    content: "Personalized daily astronomical guidance for the entire family — turning one seeker into an unbroken daily habit across all family members.",
  },
  {
    title: "Our Philosophy",
    sanskrit: "शास्त्र सम्मत खगोल विज्ञान",
    content: "We believe Jyotish is a sacred navigational science. Our role is to preserve its dignity while making it accessible through precision modern engineering.",
  },
  {
    title: "Next Steps & Invitation",
    sanskrit: "आचार्य मण्डल",
    content: "We respectfully invite your guidance and partnership. Together, let us elevate the standard of Vedic astrological counsel across India.",
  },
];

export default function PanditJiPresentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prev = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        next();
      } else if (e.key === 'ArrowLeft') {
        prev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = slides[currentSlide];

  return (
    <CosmicTantraShell
      shellMode="presentation"
      footerMode="none"
      presentationSlide={currentSlide + 1}
      totalSlides={slides.length}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        {/* Main Presentation Slide Card */}
        <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 p-6 sm:p-12 shadow-2xl transition-colors">
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-4 mb-6">
            <div className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] tracking-[3px]">
              SLIDE {currentSlide + 1} OF {slides.length}
            </div>
            <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">
              {slide.sanskrit}
            </div>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight">
            {slide.title}
          </h1>

          <p className="mt-6 text-base sm:text-xl leading-relaxed text-[#37332E] dark:text-[#E7E5E4] min-h-[90px]">
            {slide.content}
          </p>

          {/* Real Active Navigation Destinations */}
          <div className="mt-10 pt-6 border-t border-black/10 dark:border-white/10">
            <div className="text-[11px] font-mono-data uppercase tracking-wider font-bold text-[#696256] dark:text-[#9E988D] mb-3">
              Explore Live Prototype Destinations:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link 
                href="/dashboard" 
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-[#FAF7F2] dark:bg-white/5 hover:bg-[#8E6F1D]/10 dark:hover:bg-white/10 hover:border-[#8E6F1D] transition-all text-center group"
              >
                <BookOpen className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">Scholar’s Desk</span>
              </Link>
              <Link 
                href="/report" 
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-[#FAF7F2] dark:bg-white/5 hover:bg-[#8E6F1D]/10 dark:hover:bg-white/10 hover:border-[#8E6F1D] transition-all text-center group"
              >
                <FileText className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">Written Folio</span>
              </Link>
              <Link 
                href="/pandit/workspace" 
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-[#FAF7F2] dark:bg-white/5 hover:bg-[#8E6F1D]/10 dark:hover:bg-white/10 hover:border-[#8E6F1D] transition-all text-center group"
              >
                <UserCheck className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">Pandit Desk</span>
              </Link>
              <Link 
                href="/upaya" 
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-[#FAF7F2] dark:bg-white/5 hover:bg-[#8E6F1D]/10 dark:hover:bg-white/10 hover:border-[#8E6F1D] transition-all text-center group"
              >
                <Sparkles className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-white">Upaya Network</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Controls */}
        <div className="flex items-center justify-between mt-8">
          <button 
            onClick={prev} 
            disabled={currentSlide === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/15 dark:border-white/15 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] disabled:opacity-30 disabled:pointer-events-none transition-all bg-white dark:bg-[#0E101D]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSlide 
                    ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] w-6' 
                    : 'bg-black/20 dark:bg-white/20 hover:bg-black/40'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={next} 
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] text-xs font-mono-data font-bold hover:bg-[#A35C15] dark:hover:bg-[#E5C378] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </CosmicTantraShell>
  );
}

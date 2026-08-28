'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import WhatsAppHelpDeskModal from './WhatsAppHelpDeskModal';
import { HelpDeskSource } from '@/lib/helpDeskIntent';

interface HelpDeskCtaBannerProps {
  source?: HelpDeskSource;
  topic?: string;
  campaign?: string;
  variant?: 'floating' | 'inline' | 'compact' | 'header';
  lang?: 'hi' | 'en';
}

export default function HelpDeskCtaBanner({
  source = 'HOME',
  topic,
  campaign,
  variant = 'inline',
  lang = 'hi'
}: HelpDeskCtaBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isHindi = lang === 'hi';

  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 text-xs font-mono-data font-bold transition-all shadow-sm cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-400" />
          <span>{isHindi ? 'निःशुल्क सहायता केंद्र' : 'Free Help Desk'}</span>
        </button>

        <WhatsAppHelpDeskModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          source={source}
          topic={topic}
          campaign={campaign}
          lang={lang}
        />
      </>
    );
  }

  if (variant === 'floating') {
    return (
      <>
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#0F1222] to-[#1A1F36] border border-[#8E6F1D]/60 text-amber-300 shadow-2xl hover:border-amber-400 transition-all transform hover:scale-105 active:scale-95 cursor-pointer group"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <div className="text-[10px] font-mono-data text-white/70 uppercase tracking-wider">
                {isHindi ? 'सहायता केंद्र' : 'Help Desk'}
              </div>
              <div className="text-xs font-mono-data font-bold text-[#FAF7F2] group-hover:text-amber-300">
                {isHindi ? 'निःशुल्क बात करें' : 'Call Free'}
              </div>
            </div>
            <Phone className="w-4 h-4 text-emerald-400 ml-1" />
          </button>
        </div>

        <WhatsAppHelpDeskModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          source={source}
          topic={topic}
          campaign={campaign}
          lang={lang}
        />
      </>
    );
  }

  // Default Inline Banner
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-r from-[#0F1222] via-[#161C33] to-[#0A0D18] border border-[#8E6F1D]/40 p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-mono-data font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isHindi ? 'व्हाट्सएप सहायता केंद्र • +91 9972934937' : 'WhatsApp Help Desk • +91 9972934937'}</span>
          </div>

          <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#FAF7F2]">
            {isHindi ? 'काशी सहायता केंद्र से निःशुल्क बात करें' : 'Talk to Kashi Help Desk — Free'}
          </h3>

          <p className="text-xs font-mono-data text-[#D1C9BF] leading-relaxed">
            {isHindi
              ? 'परामर्श बुक करने से पहले हमारी सहायता टीम से बात करें। सेवा विकल्प, प्रश्न स्पष्टीकरण व भुगतान सहायता।'
              : 'Speak with our help desk before booking a consultation. Get assistance with service choices and question intake.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono-data font-bold tracking-wide shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{isHindi ? 'निःशुल्क बात करें' : 'Talk Free on WhatsApp'}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      <WhatsAppHelpDeskModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        source={source}
        topic={topic}
        campaign={campaign}
        lang={lang}
      />
    </>
  );
}

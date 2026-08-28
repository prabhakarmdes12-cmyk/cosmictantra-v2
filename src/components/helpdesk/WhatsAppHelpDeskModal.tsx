'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, X, ShieldCheck, Clock, ArrowUpRight, Sparkles, AlertCircle } from 'lucide-react';
import {
  HelpDeskSource,
  FORMATTED_HELP_DESK_NUMBER,
  generateWhatsAppHelpUrl,
  trackHelpDeskIntent,
  getHelpDeskAvailability
} from '@/lib/helpDeskIntent';

interface WhatsAppHelpDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: HelpDeskSource;
  topic?: string;
  campaign?: string;
  lang?: 'hi' | 'en';
}

export default function WhatsAppHelpDeskModal({
  isOpen,
  onClose,
  source = 'HOME',
  topic,
  campaign,
  lang = 'hi'
}: WhatsAppHelpDeskModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const availability = getHelpDeskAvailability();

  if (!isOpen) return null;

  const handleOpenWhatsApp = () => {
    // 1. Track Intent before leaving app
    trackHelpDeskIntent({
      source,
      topic,
      campaign,
      language: lang
    });

    // 2. Open WhatsApp Web or Mobile App via canonical URL
    const url = generateWhatsAppHelpUrl({ source, topic, language: lang });
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const isHindi = lang === 'hi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0F1222] border border-[#8E6F1D]/50 shadow-2xl text-white">
        
        {/* Top Header Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Title & Identity */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-mono-data font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isHindi ? availability.badgeTextHi : availability.badgeText}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-editorial font-bold text-[#FAF7F2]">
              {isHindi ? 'काशी सहायता केंद्र से निःशुल्क बात करें' : 'Talk to Kashi Help Desk — Free'}
            </h2>

            <p className="text-xs sm:text-sm font-mono-data text-[#D1C9BF] leading-relaxed">
              {isHindi
                ? 'परामर्श बुक करने से पहले हमारी सहायता टीम से बात करें। सेवा विकल्प, प्रश्न स्पष्टीकरण व जन्म विवरण पुष्टि हेतु।'
                : 'Speak with our help desk before booking a consultation. We assist with service choices, question intake, and payment.'}
            </p>
          </div>

          {/* Official WhatsApp Help Desk Identity Card */}
          <div className="p-4 rounded-2xl bg-[#161B30] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono-data text-emerald-400 font-bold uppercase tracking-wider">
                    WhatsApp Help Desk
                  </div>
                  <div className="text-lg font-mono-data font-bold text-white">
                    {FORMATTED_HELP_DESK_NUMBER}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {isHindi ? 'निःशुल्क पूछताछ' : 'Free Help Call'}
                </span>
              </div>
            </div>

            <p className="text-[11px] font-mono-data text-[#A8A29E] leading-tight">
              {isHindi ? availability.descriptionHi : availability.description}
            </p>
          </div>

          {/* Two-Stage Honest Call Instructions Card */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
            <div className="text-xs font-mono-data font-bold text-amber-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{isHindi ? 'व्हाट्सएप वॉइस कॉल कैसे करें (3 सरल चरण)' : 'How to Call Free on WhatsApp (3 Steps)'}</span>
            </div>

            <ol className="text-xs font-mono-data text-[#E7E5E4] space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                <span className="font-semibold text-white">
                  {isHindi ? 'व्हाट्सएप चैट खोलें' : 'Open WhatsApp chat'}
                </span>{' '}
                — {isHindi ? 'नीचे दिए गए बटन को दबाएं।' : 'Click the button below.'}
              </li>
              <li>
                <span className="font-semibold text-white">
                  {isHindi ? 'ऊपर 📞 वॉइस कॉल आइकन दबाएं' : 'Tap the 📞 Voice Call icon at top'}
                </span>{' '}
                — {isHindi ? 'व्हाट्सएप में सीधे कॉल कनेक्ट करें।' : 'Direct voice call inside WhatsApp.'}
              </li>
              <li>
                <span className="font-semibold text-white">
                  {isHindi ? 'सहायक पंडित जी से बात करें' : 'Speak with Help Desk Pandit'}
                </span>{' '}
                — {isHindi ? 'अपना विवरण व प्रश्न साझा करें।' : 'Share details and understand consultation options.'}
              </li>
            </ol>
          </div>

          {/* Service Boundary Clarification */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono-data text-[#A8A29E]">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              {isHindi
                ? 'महत्वपूर्ण: यह सहायता केंद्र सेवा चयन व इनटेक हेतु निःशुल्क है। वरिष्ठ विद्वान ज्योतिषी जी का विस्तृत व्यक्तिगत परामर्श सशुल्क (₹501) होता है।'
                : 'Note: The Help Desk is free for guidance & intake triage. Full detailed personal astrology readings with Senior Scholars are paid consultations.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono-data font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{isHindi ? 'व्हाट्सएप पर सहायता केंद्र खोलें (+91 9972934937)' : 'Open WhatsApp Help Desk (+91 9972934937)'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/5 text-xs font-mono-data text-[#A8A29E] transition-colors"
            >
              {isHindi ? 'वापस जाएँ' : 'Dismiss'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

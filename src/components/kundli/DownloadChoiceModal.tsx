'use client';

import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, ShieldCheck, X, ArrowRight, Download, Lock } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface DownloadChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  birthState: any;
  onDownloadFullPdf: () => void;
  isGeneratingPdf?: boolean;
}

export default function DownloadChoiceModal({
  isOpen,
  onClose,
  lang = 'en',
  birthState,
  onDownloadFullPdf,
  isGeneratingPdf = false,
}: DownloadChoiceModalProps) {
  const [selectedTier, setSelectedTier] = useState<'FREE' | 'MASTER'>('MASTER');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isHi = lang === 'hi';

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePayAndDownload = () => {
    chitiSensory.playTick();
    setIsProcessingPayment(true);

    // Razorpay Integration Hook
    if (typeof window !== 'undefined' && (window as any).Razorpay && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 2100, // 2100 paise = ₹21.00 INR
        currency: 'INR',
        name: 'CosmicTantra Vedic Precision',
        description: `17-Volume Master Kundli for ${birthState?.name || 'Subject'}`,
        handler: function (response: any) {
          setIsProcessingPayment(false);
          onDownloadFullPdf();
          onClose();
        },
        prefill: {
          name: birthState?.name || '',
        },
        theme: {
          color: '#8E6F1D',
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      // Graceful dev/test fallback when Razorpay keys are being configured
      setTimeout(() => {
        setIsProcessingPayment(false);
        onDownloadFullPdf();
        onClose();
      }, 500);
    }
  };

  const handleFreeDownload = () => {
    chitiSensory.playTick();
    // For free download, invoke standard browser print/save of summary
    onClose();
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-[#FAF7F2] dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 shadow-2xl p-6 sm:p-8 space-y-6 text-[#1C1917] dark:text-[#EFECE6]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          data-testid="close-download-choice-modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center justify-center text-[#57524A] dark:text-[#C5BFB5] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center max-w-lg mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E6F1D]/10 text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-mono-data font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>{isHi ? 'कुण्डली डाउनलोड प्रारूप' : 'Download Format'}</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold">
            {isHi ? 'अपना कुण्डली दस्तावेज़ चुनें' : 'Choose Your Kundli Dossier'}
          </h2>
          <p className="text-xs text-[#57524A] dark:text-[#A8A29E]">
            {isHi
              ? 'निःशुल्क सारांश देखें अथवा ₹२१ की पावन दक्षिणा देकर सम्पूर्ण १७-खण्ड ग्रन्थ प्राप्त करें।'
              : 'Download the free essential brief or offer a sacred ₹21 Shubh Nivedan for the complete 17-Volume dossier.'}
          </p>
        </div>

        {/* 2-Tier Selection Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          
          {/* Option 1: Free Summary */}
          <div
            onClick={() => setSelectedTier('FREE')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 ${
              selectedTier === 'FREE'
                ? 'border-[#8E6F1D] bg-white dark:bg-[#121528] shadow-md ring-2 ring-[#8E6F1D]/20'
                : 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#57524A] dark:text-[#A8A29E]">
                {isHi ? 'आवश्यक सारांश' : 'Essential Brief'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono-data font-bold text-[10px]">
                {isHi ? 'निःशुल्क' : 'FREE'}
              </span>
            </div>

            <div>
              <div className="font-editorial text-xl font-bold">
                {isHi ? 'मूल कुण्डली संक्षेप' : 'Basic Chart Summary'}
              </div>
              <div className="text-xs text-[#57524A] dark:text-[#A8A29E] mt-0.5">
                {isHi ? '२-३ पृष्ठ सारांश' : '2-3 Page Overview'}
              </div>
            </div>

            <ul className="space-y-2 text-xs text-[#57524A] dark:text-[#C5BFB5]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isHi ? 'लग्न (D1) एवं नवांश (D9) चक्र' : 'D1 & D9 North Indian Charts'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isHi ? 'ग्रह स्थिति एवं अंश' : 'Planetary Degree Table'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{isHi ? 'प्रमुख योग एवं सारांश' : 'Core Yogas & Plain Summary'}</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFreeDownload();
              }}
              className="w-full py-2.5 rounded-xl border border-black/15 dark:border-white/15 hover:border-[#8E6F1D] text-xs font-mono-data font-bold text-[#1C1917] dark:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isHi ? 'निःशुल्क प्रिंट / डाउनलोड' : 'Download Free Summary'}</span>
            </button>
          </div>

          {/* Option 2: Qualified 17-Volume Book (₹21) */}
          <div
            onClick={() => setSelectedTier('MASTER')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 relative ${
              selectedTier === 'MASTER'
                ? 'border-[#8E6F1D] dark:border-[#D4AF37] bg-white dark:bg-[#121528] shadow-xl ring-2 ring-[#8E6F1D]/30'
                : 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#8E6F1D] to-[#A88424] text-white text-[9px] font-mono-data font-bold uppercase tracking-wider shadow-sm">
              {isHi ? 'अनुशंसित' : 'Recommended'}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-data font-bold uppercase text-[#8E6F1D] dark:text-[#F0C968]">
                {isHi ? 'पूर्ण संस्थागत ग्रन्थ' : 'Full Institutional Folio'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono-data font-bold text-xs">
                ₹21 INR
              </span>
            </div>

            <div>
              <div className="font-editorial text-xl font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                {isHi ? '१७-खण्ड सम्पूर्ण कुण्डली' : '17-Volume Master Book'}
              </div>
              <div className="text-xs text-[#57524A] dark:text-[#A8A29E] mt-0.5">
                {isHi ? 'पूर्ण १९ पृष्ठ प्रामाणिक ग्रन्थ' : 'Complete 19-Page Qualified Dossier'}
              </div>
            </div>

            <ul className="space-y-2 text-xs text-[#57524A] dark:text-[#C5BFB5]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{isHi ? 'सम्पूर्ण १७ खण्डों का विस्तृत पाठ' : 'All 17 Classical Volumes'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{isHi ? '१२० वर्षीय विंशोत्तरी महादशा' : '120-Year Vimshottari Dasha Tree'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{isHi ? 'षोडशवर्ग एवं षड्बल तालिका' : 'Shodashvarga & Shadbala Matrices'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{isHi ? 'काशी विद्वत्-परिषद् प्रमाण मोहर' : 'Scholarly Verified Seal & Lahiri Proof'}</span>
              </li>
            </ul>

            <button
              type="button"
              disabled={isGeneratingPdf || isProcessingPayment}
              onClick={(e) => {
                e.stopPropagation();
                handlePayAndDownload();
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8E6F1D] via-[#A88424] to-[#8E6F1D] dark:from-[#D4AF37] dark:via-[#F0C968] dark:to-[#D4AF37] text-white dark:text-black text-xs font-mono-data font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isProcessingPayment || isGeneratingPdf
                  ? (isHi ? 'प्रक्रिया जारी है…' : 'Preparing Dossier…')
                  : (isHi ? '₹२१ दक्षिणा देकर सम्पूर्ण पीडीएफ़ लें' : 'Pay ₹21 & Download Full PDF')}
              </span>
            </button>
          </div>

        </div>

        {/* Trust Note */}
        <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isHi ? 'सुरक्षित भुगतान (Razorpay / UPI)' : 'Secure Instant Gateway (UPI, Cards, Netbanking)'}</span>
          </div>
          <div className="text-[10px]">
            {isHi ? 'शुद्ध लाहिरी अयनांश गणना' : 'Deterministic Chitra Paksha Math'}
          </div>
        </div>

      </div>
    </div>
  );
}

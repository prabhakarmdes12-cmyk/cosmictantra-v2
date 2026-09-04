'use client';

import React, { useState } from 'react';
import { Sparkles, Phone, MessageSquare, ShieldCheck, X, ArrowRight, User, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';

interface ConsultationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
  activeProfile?: any;
  onOpenIntakeIfNoProfile?: () => void;
}

const CONCERN_AREAS = [
  { id: 'CAREER', labelEn: 'Career, Wealth & Business', labelHi: 'व्यापार, करियर एवं धन स्थिति' },
  { id: 'MARRIAGE', labelEn: 'Marriage, Match & Family', labelHi: 'विवाह, सम्बन्ध एवं गृहस्थ सुख' },
  { id: 'HEALTH', labelEn: 'Health, Vitality & Protection', labelHi: 'स्वास्थ्य एवं अरिष्ट निवारण' },
  { id: 'DASHA', labelEn: 'Active Dasha & Spiritual Path', labelHi: 'वर्तमान महादशा एवं साधना मार्गदर्शन' },
];

const SERVICE_TIERS = [
  {
    id: 'VIDWAN_15',
    titleEn: 'Shubh Vidwan Session',
    titleHi: 'शुभ विद्वान् परामर्श',
    durationEn: '15 Minutes 3-Way Group Call',
    durationHi: '१५ मिनट त्रि-पक्षीय संवाद',
    dakshina: '₹501',
    descEn: 'Focused chart consultation directly with assigned Shastri Ji, coordinated live by Customer Care.',
    descHi: 'शास्त्री जी से सीधा संवाद, कस्टमर केयर द्वारा संयोजित लाइव सत्र।',
  },
  {
    id: 'ACHARYA_30',
    titleEn: 'Deep Shastra Guidance',
    titleHi: 'विस्तृत शास्त्र मार्गदर्शन',
    durationEn: '30 Minutes In-Depth Reading',
    durationHi: '३० मिनट गहन कुण्डली विवेचन',
    dakshina: '₹1,100',
    descEn: 'Comprehensive life analysis, 17-volume folio deep-dive, and personalized gemstone/remedy counsel.',
    descHi: 'सम्पूर्ण जीवन चक्र, रत्न एवं मन्त्र अनुष्ठान का प्रामाणिक मार्गदर्शन।',
  },
];

export default function ConsultationRequestModal({
  isOpen,
  onClose,
  lang = 'en',
  activeProfile,
  onOpenIntakeIfNoProfile,
}: ConsultationRequestModalProps) {
  const [selectedConcern, setSelectedConcern] = useState('CAREER');
  const [selectedTier, setSelectedTier] = useState('VIDWAN_15');
  const isHi = lang === 'hi';

  if (!isOpen) return null;

  // Case 1: Anonymous visitor without an active birth chart
  if (!activeProfile || !activeProfile.name) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 shadow-2xl p-6 sm:p-8 space-y-5 text-[#1C1917] dark:text-[#EFECE6] text-center">
          <button
            onClick={onClose}
            aria-label="Close consultation modal"
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center justify-center text-[#57524A] dark:text-[#C5BFB5] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#8E6F1D] dark:text-[#F0C968] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="font-editorial text-2xl font-bold">
            {isHi ? 'कुण्डली आवश्यक है' : 'Birth Details Required'}
          </h2>

          <p className="text-xs text-[#57524A] dark:text-[#A8A29E] leading-relaxed">
            {isHi
              ? 'कॉस्मिकटंत्र में विद्वान् परामर्श केवल वास्तविक एवं शुद्ध गणितीय कुण्डली पर ही आधारित होता है। कृपया पहले अपना जन्म विवरण दर्ज करें।'
              : 'Consultations in CosmicTantra are strictly anchored in mathematical Jyotish and your verified birth chart. Please enter your birth details to proceed.'}
          </p>

          <button
            type="button"
            onClick={() => {
              chitiSensory.playTick();
              onClose();
              onOpenIntakeIfNoProfile?.();
            }}
            className="w-full py-3 rounded-xl bg-[#8E6F1D] hover:bg-[#A88424] dark:bg-[#D4AF37] dark:hover:bg-[#E5C04B] text-white dark:text-black text-xs font-mono-data font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{isHi ? 'जन्म विवरण भरें →' : 'Enter Birth Details →'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 2: User with an active birth profile
  const chosenTierObj = SERVICE_TIERS.find((t) => t.id === selectedTier) || SERVICE_TIERS[0];
  const chosenConcernObj = CONCERN_AREAS.find((c) => c.id === selectedConcern) || CONCERN_AREAS[0];

  const handleInitiateConsultation = () => {
    chitiSensory.playTick();
    const concernLabel = isHi ? chosenConcernObj.labelHi : chosenConcernObj.labelEn;
    const tierLabel = isHi ? chosenTierObj.titleHi : chosenTierObj.titleEn;

    const message = `Namaste CosmicTantra Customer Care,
I would like to request a Pandit Consultation.
• Client Name: ${activeProfile.name}
• Birth Details: ${activeProfile.birthDate} at ${activeProfile.birthTime || 'N/A'}
• Location: ${activeProfile.birthCity || activeProfile.locationName || 'N/A'}
• Selected Service: ${tierLabel} (${chosenTierObj.dakshina})
• Focus Area: ${concernLabel}

Please initiate the call with Customer Care and bridge Shastri Ji on conference.`;

    const encoded = encodeURIComponent(message);
    // Open WhatsApp Care Channel
    const careUrl = `https://wa.me/919471184650?text=${encoded}`;
    if (typeof window !== 'undefined') {
      window.open(careUrl, '_blank');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#FAF7F2] dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 shadow-2xl p-6 sm:p-8 space-y-6 text-[#1C1917] dark:text-[#EFECE6]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close consultation modal"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 flex items-center justify-center text-[#57524A] dark:text-[#C5BFB5] transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E6F1D]/10 text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-mono-data font-bold uppercase tracking-widest">
            <Phone className="w-3 h-3" />
            <span>{isHi ? 'प्रत्यक्ष विद्वान् परामर्श' : 'Live Pandit Consultation'}</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold">
            {isHi ? 'पण्डित जी से परामर्श प्राप्त करें' : 'Speak Directly with Pandit Ji'}
          </h2>
          <p className="text-xs text-[#57524A] dark:text-[#A8A29E]">
            {isHi
              ? 'कस्टमर केयर एवं शास्त्री जी के साथ त्रिपक्षीय संवाद सत्र।'
              : 'Customer care coordinates and bridges your 3-way conference call directly with our scholar.'}
          </p>
        </div>

        {/* Active Profile Banner */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#121528] border border-[#8E6F1D]/20 dark:border-[#D4AF37]/25 flex items-center justify-between text-xs font-mono-data">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />
            <div>
              <span className="font-bold text-[#1C1917] dark:text-white">{activeProfile.name}</span>
              <span className="text-[#78716C] dark:text-[#A8A29E] ml-2">
                {activeProfile.birthDate} • {activeProfile.birthTime}
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
            {isHi ? 'सत्यापित कुण्डली' : 'Chart Verified'}
          </span>
        </div>

        {/* Focus Area Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono-data font-bold text-[#57524A] dark:text-[#C5BFB5] uppercase">
            {isHi ? 'परामर्श का मुख्य विषय चुनें' : 'Select Primary Concern'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CONCERN_AREAS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedConcern(c.id)}
                className={`p-2.5 rounded-xl border text-left text-xs font-mono-data transition-all cursor-pointer ${
                  selectedConcern === c.id
                    ? 'border-[#8E6F1D] bg-[#8E6F1D]/10 text-[#8E6F1D] dark:text-[#F0C968] font-bold'
                    : 'border-black/10 dark:border-white/10 text-[#57524A] dark:text-[#A8A29E] hover:border-[#8E6F1D]/40'
                }`}
              >
                {isHi ? c.labelHi : c.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Service Tier Selection */}
        <div className="space-y-2">
          <label className="text-xs font-mono-data font-bold text-[#57524A] dark:text-[#C5BFB5] uppercase">
            {isHi ? 'परामर्श सेवा एवं दक्षिणा' : 'Consultation Service & Dakshina'}
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {SERVICE_TIERS.map((tier) => (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                  selectedTier === tier.id
                    ? 'border-[#8E6F1D] dark:border-[#D4AF37] bg-white dark:bg-[#121528] shadow-md ring-2 ring-[#8E6F1D]/20'
                    : 'border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono-data">
                  <span className="font-bold">{isHi ? tier.titleHi : tier.titleEn}</span>
                  <span className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">{tier.dakshina}</span>
                </div>
                <div className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">
                  {isHi ? tier.durationHi : tier.durationEn}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleInitiateConsultation}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8E6F1D] via-[#A88424] to-[#8E6F1D] dark:from-[#D4AF37] dark:via-[#F0C968] dark:to-[#D4AF37] text-white dark:text-black text-xs font-mono-data font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95"
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            {isHi ? 'कस्टमर केयर को विवरण भेजें एवं कॉल शेड्यूल करें' : 'Send Details to Customer Care & Schedule Call'}
          </span>
        </button>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isHi ? 'सत्र पूर्णतः गोपनीय एवं प्रामाणिक है' : '100% Confidential · Monitored via Chiti Console'}</span>
        </div>

      </div>
    </div>
  );
}

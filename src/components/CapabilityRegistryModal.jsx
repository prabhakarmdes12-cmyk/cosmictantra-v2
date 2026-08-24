import React from 'react';
import { Shield, X } from 'lucide-react';
import { CAPABILITY_REGISTRY } from '../lib/capabilityRegistry';
import { chitiSensory } from '../lib/chitiAudio';

export default function CapabilityRegistryModal({ isOpen, onClose, lang = 'en', theme = 'dark' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150 font-mono-data">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#FFFFFF] dark:bg-[#090A0E] border border-black/[0.1] dark:border-white/[0.1] p-6 shadow-2xl space-y-5 text-left max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#8E6F1D] dark:text-[#D4AF37]" />
            <div>
              <h3 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-[#EFECE6]">
                {lang === 'hi' ? 'गणना क्षमता सूची एवं सत्य निष्ठा' : 'Capability Registry & Truth Invariant'}
              </h3>
              <div className="text-[10px] text-[#8E6F1D] dark:text-[#8E7745] font-bold">
                {lang === 'hi' ? 'कॉस्मिक-तन्त्र प्रत्यक्ष खगोलीय घोषणा-पत्र' : 'CosmicTantra Deterministic Ephemeris Manifest'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              chitiSensory.playTick();
              onClose();
            }}
            className="p-1 rounded text-[#857E74] dark:text-[#8E8A82] hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invariant Statement */}
        <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#060709] border border-black/[0.06] dark:border-white/[0.06] text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">
          <strong className="text-[#1C1917] dark:text-[#EFECE6]">
            {lang === 'hi' ? 'परम सत्य निष्ठा सिद्धान्त:' : 'The Absolute Truth Invariant:'}
          </strong>{' '}
          {lang === 'hi'
            ? 'कॉस्मिक-तन्त्र कभी भी कृत्रिम ज्योतिषी संख्या, मिथ्या समीक्षाएं या अप्रमाणित भविष्यवाणियों का निर्माण नहीं करता। जो गणना प्रत्यक्ष सिद्ध नहीं है, उसे स्पष्ट रूप से विद्वत्-सहायक अथवा अनुपलब्ध घोषित किया जाता है।'
            : 'CosmicTantra never fabricates astrologer counts, years of experience, fake reviews, or unverified astrological automation. If a feature is not deterministically proven, it is truthfully marked as practitioner-assisted or unavailable.'
          }
        </div>

        {/* Modules List */}
        <div className="space-y-2 text-xs">
          {Object.entries(CAPABILITY_REGISTRY).map(([key, item]) => {
            const isLive = item.status === 'LIVE';
            const isAssisted = item.status === 'PRACTITIONER_ASSISTED';
            const isControlled = item.status === 'CONTROLLED';

            return (
              <div
                key={key}
                className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#0B0C11] border border-black/[0.05] dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#1C1917] dark:text-[#EFECE6]">{key}</span>
                    <span className="text-[10px] text-[#857E74] dark:text-[#6B6760]">({item.tier})</span>
                  </div>
                  <p className="text-[11px] text-[#57524A] dark:text-[#8E8A82] leading-relaxed max-w-md">
                    {item.description}
                  </p>
                </div>

                <div className="shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                    isLive ? 'bg-[#10b981]/15 text-[#0F6B43] dark:text-[#34d399] border-[#10b981]/30' :
                    isAssisted ? 'bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#D4AF37] border-[#D4AF37]/30' :
                    isControlled ? 'bg-[#8B8BF5]/15 text-[#4848A8] dark:text-[#8B8BF5] border-[#8B8BF5]/30' :
                    'bg-black/[0.05] dark:bg-white/[0.05] text-[#57524A] dark:text-[#8E8A82] border-black/[0.08] dark:border-white/[0.08]'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] flex justify-end">
          <button
            onClick={() => {
              chitiSensory.playTick();
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-[#FAF7F2] dark:bg-[#101218] border border-black/[0.08] dark:border-white/[0.08] text-xs text-[#1C1917] dark:text-[#EFECE6] font-bold"
          >
            {lang === 'hi' ? 'बन्द करें' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}

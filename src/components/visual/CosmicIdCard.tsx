'use client';

import React from 'react';
import { User, Calendar, MapPin, Award } from 'lucide-react';

interface CosmicIdCardProps {
  profile: {
    whatsappPhone: string;
    fullName?: string;
    cosmicId?: string;
    consentGiven?: boolean;
    familyMembersCount?: number;
  };
  onManageFamily?: () => void;
}

export default function CosmicIdCard({ profile, onManageFamily }: CosmicIdCardProps) {
  const cosmicId = profile.cosmicId || `CT-${profile.whatsappPhone.slice(-4)}`;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#FAF7F2] via-white to-[#F8F1E3] dark:from-[#0A0C12] dark:via-[#11131C] dark:to-[#0A0C12] p-8 shadow-xl">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#D4AF37]/5 rounded-full -translate-x-8 -translate-y-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#8E6F1D]/10 rounded-full translate-x-4 translate-y-6" />

      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 text-[#8E6F1D] text-xs tracking-[3px] font-mono mb-1">
              <Award className="w-3.5 h-3.5" /> VERIFIED VEDIC IDENTITY
            </div>
            <div className="font-editorial text-6xl font-bold tracking-[-2.5px] text-[#1C1917] dark:text-white">
              {cosmicId}
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">DPDP COMPLIANT</div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 text-[#857E74] mb-1">
              <User className="w-4 h-4" /> NAME
            </div>
            <div className="font-semibold text-lg">{profile.fullName || '—'}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[#857E74] mb-1">
              <MapPin className="w-4 h-4" /> WHATSAPP
            </div>
            <div className="font-mono text-lg tracking-wider">{profile.whatsappPhone}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[#857E74] mb-1">
              <Calendar className="w-4 h-4" /> FAMILY
            </div>
            <div className="font-semibold text-lg">{profile.familyMembersCount || 0} members</div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 flex flex-wrap gap-3">
          <button 
            onClick={onManageFamily}
            className="flex-1 py-3 rounded-2xl bg-[#1C1917] hover:bg-black text-white text-sm font-semibold tracking-widest transition-all"
          >
            MANAGE FAMILY PROFILES
          </button>
          <button className="flex-1 py-3 rounded-2xl border border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 text-sm font-semibold text-[#8E6F1D]">
            DOWNLOAD COSMIC CARD (PDF)
          </button>
        </div>
      </div>
    </div>
  );
}

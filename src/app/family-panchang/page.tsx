'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Calendar, Star, Share2, Sparkles, ShieldCheck, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { getProfiles, saveProfiles } from '@/lib/profileStore.js';
import { getFamilyCollectiveForecast, FamilyCollectiveForecast } from '@/lib/interpretationEngine';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';

export default function FamilyPanchang() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [familyData, setFamilyData] = useState<FamilyCollectiveForecast | null>(null);

  useEffect(() => {
    // CT_UX_INV_003 — never fabricate or persist a demo family for the visitor.
    const list: any[] = getProfiles() || [];
    setProfiles(list);
    if (list.length === 0) {
      setFamilyData(null);
      return;
    }
    const forecast = getFamilyCollectiveForecast(list, new Date());
    setFamilyData(forecast);
  }, []);

  const handleShareFamilyWhatsApp = () => {
    if (!familyData) return;
    const text = `🕉️ CosmicTantra Parivaar Panchang (${familyData.date})\n\nFamily Auspicious Score: ${familyData.collectiveScore}/100 (${familyData.status})\n\n${familyData.summary}\n\nCheck daily transits: https://cosmictantra.chiti.tech/daily`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // CT_UX_INV_003 — neutral state when the visitor has no family profiles.
  if (!familyData) {
    return (
      <CosmicTantraShell>
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md bg-white dark:bg-[#0E101D] border border-[#E5D7BC] dark:border-white/10 rounded-3xl p-8 shadow-sm"
               data-testid="family-empty-state">
            <div className="text-5xl mb-4">🪔</div>
            <h1 className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-white">
              Build your family's Panchang from real charts
            </h1>
            <p className="mt-2 text-xs font-mono-data text-[#57524A] dark:text-[#B3ADA3] leading-6">
              Add each family member's verified birth details to see their synchronized Vedic days.
              Nothing is shown for people whose charts were not created.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/" className="px-6 py-2.5 bg-[#8E6F1D] text-white rounded-xl text-xs font-mono-data font-bold">
                Create my Kundli →
              </Link>
              <Link href="/profile" className="px-6 py-2.5 border border-[#8E6F1D]/40 text-[#8E6F1D] rounded-xl text-xs font-mono-data font-bold">
                Manage family
              </Link>
            </div>
          </div>
        </div>
      </CosmicTantraShell>
    );
  }

  return (
    <CosmicTantraShell>
      <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center">
          <div className="text-xs font-mono-data uppercase tracking-[3px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
            पारिवारिक पञ्चाङ्ग • PARIVAAR INTELLIGENCE
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-2 tracking-tight">
            Family Panchang & Synchronized Transits
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            Personalized diurnal guidance, synchronized power windows, and protective alerts for all {profiles.length} household members.
          </p>
        </div>

        {/* Collective Family Harmony Card */}
        {familyData && (
          <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 dark:border-white/10 pb-6">
              <div>
                <div className="text-xs font-mono-data uppercase tracking-[2px] text-[#065F46] dark:text-[#10B981] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>COLLECTIVE HARMONY • {familyData.date}</span>
                </div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-1">
                  {familyData.familyPowerDay ? '🌟 Favorable Family Power Day' : 'Balanced Household Energy'}
                </h2>
              </div>

              <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <div className="text-[10px] font-mono-data font-bold text-[#065F46] dark:text-[#10B981]">FAMILY AUSPICIOUSNESS</div>
                <div className="text-3xl font-bold font-mono-data text-[#065F46] dark:text-[#10B981]">
                  {familyData.collectiveScore} / 100
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm font-mono-data text-[#1C1917] dark:text-[#E7E5E4] leading-relaxed">
              {familyData.summary}
            </p>

            {/* Protective Alerts */}
            {familyData.protectionAlerts.length > 0 && (
              <div className="mt-6 pt-6 border-t border-black/10 dark:border-white/10 space-y-3">
                <div className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                  🛡️ PARIVAAR PROTECTION ALERTS ({familyData.protectionAlerts.length})
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {familyData.protectionAlerts.map((alt, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono-data">
                      <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                        {alt.memberName} ({alt.relation}): {alt.alertType}
                      </div>
                      <p className="text-[#57524A] dark:text-[#D1C9BF] mt-1">{alt.message}</p>
                      <div className="mt-2 text-[11px] text-[#065F46] dark:text-[#10B981] font-bold">
                        ✓ Suggested Care: {alt.mitigation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Member Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-white">
              Individual Household Profiles ({profiles.length})
            </h3>
            <Link 
              href="/daily" 
              className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              <span>View Full Daily/Weekly Engine →</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile: any, index: number) => (
              <div 
                key={index} 
                className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 sm:p-7 shadow-md hover:border-[#8E6F1D] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 border-b border-black/10 dark:border-white/10 pb-4">
                    <div className="w-11 h-11 rounded-2xl bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                    </div>
                    <div>
                      <div className="font-editorial font-bold text-lg text-[#1C1917] dark:text-white">{profile.name}</div>
                      <div className="text-xs font-mono-data text-[#696256] dark:text-[#9E988D]">{profile.relation || 'Self'} • {profile.birthDate}</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-xs font-mono-data">
                    <div className="flex justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912]">
                      <span className="text-[#696256] dark:text-[#9E988D]">Moon Rashi:</span>
                      <strong className="text-[#1C1917] dark:text-white">Vrishabha (Taurus)</strong>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912]">
                      <span className="text-[#696256] dark:text-[#9E988D]">Auspicious Score:</span>
                      <strong className="text-[#065F46] dark:text-[#10B981]">82 / 100 (Shubh)</strong>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#070912]">
                      <span className="text-[#696256] dark:text-[#9E988D]">Primary Dasha:</span>
                      <strong className="text-[#8E6F1D] dark:text-[#F0C968]">Moon-Jupiter</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10">
                  <Link
                    href="/daily"
                    className="w-full py-2.5 rounded-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:bg-[#8E6F1D] hover:text-white dark:hover:bg-[#D4AF37] dark:hover:text-[#060709] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>View Three-Day Panchang →</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Share Button */}
        <div className="text-center pt-4">
          <button 
            onClick={handleShareFamilyWhatsApp}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#25D366] text-white rounded-2xl text-xs font-mono-data font-bold hover:bg-[#128C7E] transition-all shadow-md"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Parivaar Panchang Digest on WhatsApp</span>
          </button>
        </div>

      </div>
    </CosmicTantraShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Users, Star, Calendar, Award, ArrowRight } from 'lucide-react';
import { getActiveProfile, getProfiles } from '@/lib/profileStore';
import DailyCosmicCard from '@/components/visual/DailyCosmicCard';
import CosmicIdCard from '@/components/visual/CosmicIdCard';
import TrustBar from '@/components/visual/TrustBar';
import Link from 'next/link';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';

export default function ScholarDashboard() {
  const [activeProfile, setActiveProfileState] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);

  const refreshProfiles = () => {
    const profiles = getProfiles();
    setAllProfiles(profiles);
    // Never fabricate a demo profile — an empty desk is honest and routes the
    // new user straight into the 30-second Kundali flow instead.
    const current = getActiveProfile() || profiles[0] || null;
    setActiveProfileState(current);
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const switchProfile = (profileId: string) => {
    import('@/lib/profileStore').then(({ setActiveProfileId }) => {
      setActiveProfileId(profileId);
      refreshProfiles();
    });
  };

  if (!activeProfile) {
    return (
      <CosmicTantraShell>
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">🪔</div>
            <h1 className="font-editorial text-3xl font-bold">Welcome to Your Scholar’s Desk</h1>
            <p className="mt-3 text-sm text-[#57524A] dark:text-[#B3ADA3]">
              अपनी जन्म कुण्डली 30 सेकंड में बनाएं — यह डेस्क स्वतः आपका Cosmic ID बना देगा।
            </p>
            <p className="mt-1 text-xs font-mono-data text-[#57524A] dark:text-[#B3ADA3]">
              Make your free Kundali first — it takes 30 seconds and creates your Cosmic ID automatically.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/#kundali-section"
                className="px-6 py-3 bg-[#8E6F1D] text-white rounded-xl text-xs font-mono-data font-bold shadow-md hover:opacity-90"
              >
                निःशुल्क कुण्डली बनाएं → Make my Kundali
              </Link>
              <Link
                href="/daily"
                className="px-6 py-3 border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 rounded-xl text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] transition-all"
              >
                आज का पञ्चाङ्ग देखें (Today’s Panchang)
              </Link>
            </div>
          </div>
        </div>
      </CosmicTantraShell>
    );
  }

  return (
    <CosmicTantraShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <TrustBar />

        {/* Header */}
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
          <div>
            <div className="text-xs tracking-[3px] text-[#8E6F1D] dark:text-[#F0C968] font-mono-data font-bold">
              SCHOLAR’S DESK • काशी विद्वत्-परिषद्
            </div>
            <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-white mt-1 tracking-tight">
              Your Cosmic Workspace
            </h1>
            <p className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] mt-1">
              Namaste, <span className="font-bold text-[#1C1917] dark:text-white">{activeProfile.name}</span>. The stars are aligned for focused contemplation today.
            </p>
          </div>
          <Link 
            href="/daily" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] transition-all bg-white/70 dark:bg-white/5 shrink-0"
          >
            <span>Open Full Forecast</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2-Column Grid: ID Card + Daily Prediction */}
        <div className="grid lg:grid-cols-12 gap-8 mt-8">
          {/* Left: Cosmic Identity Card */}
          <div className="lg:col-span-5 space-y-6">
            <CosmicIdCard
              profile={{
                whatsappPhone: activeProfile.whatsappPhone || '',
                fullName: activeProfile.name,
                cosmicId: activeProfile.cosmicId,
                consentGiven: true,
                familyMembersCount: allProfiles.length
              }}
              onManageFamily={() => window.location.href = '/family-panchang'}
            />

            {/* Profiles Selector */}
            <div className="p-5 rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D]">
              <div className="flex items-center justify-between mb-3 text-xs font-mono-data">
                <span className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">ACTIVE PARIVAAR PROFILE</span>
                <Link href="/profile" className="text-[#696256] dark:text-[#9E988D] hover:underline">+ Switch</Link>
              </div>
              <div className="space-y-2">
                {allProfiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-mono-data transition-all flex items-center justify-between ${
                      p.id === activeProfile?.id
                        ? 'border-[#8E6F1D] dark:border-[#D4AF37] bg-[#FAF7F2] dark:bg-white/10 font-bold text-[#1C1917] dark:text-white'
                        : 'border-black/10 dark:border-white/10 text-[#696256] dark:text-[#9E988D] hover:border-black/30'
                    }`}
                  >
                    <span>{p.name} ({p.relation || 'Self'})</span>
                    <span className="text-[10px] text-[#8E6F1D] dark:text-[#D4AF37]">{p.cosmicId}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Today's Celestial Status */}
          <div className="lg:col-span-7 space-y-6">
            <DailyCosmicCard
              prediction={{
                date: "25 Aug 2026",
                dayName: "Tuesday",
                lagna: "Vrishabha (Taurus)",
                moonNakshatra: "Rohini (Moon Lord)",
                dasha: "Moon Mahadasha • Jupiter Antardasha",
                rahuKaal: "15:00–16:30",
                abhijit: "11:45–12:35",
                auspiciousScore: 84,
                keyInsight: "Strong Rohini energy favors creative and commercial agreements today.",
                recommendedAction: "Begin important agreements or research before sunset.",
                color: "emerald",
                tithi: "Shukla Navami",
                yoga: "Siddhi",
                sadeSati: false,
                kaalSarp: false,
                hasFestival: true,
                isJanmaNakshatra: true,
                isRikta: false,
              }}
              isToday={true}
            />
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/family-panchang" className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:border-[#8E6F1D] text-xs font-mono-data font-bold text-[#1C1917] dark:text-white transition-all text-center">
            Parivaar Panchang
          </Link>
          <Link href="/remedy-tracker" className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:border-[#8E6F1D] text-xs font-mono-data font-bold text-[#1C1917] dark:text-white transition-all text-center">
            Remedy Tracker
          </Link>
          <Link href="/ask" className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] text-xs font-mono-data font-bold hover:bg-[#A35C15] transition-all text-center shadow-md">
            Request Written Folio (₹501)
          </Link>
          <Link href="/report" className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 hover:border-[#8E6F1D] text-xs font-mono-data font-bold text-[#1C1917] dark:text-white transition-all text-center">
            View Sample Folio
          </Link>
        </div>
      </div>
    </CosmicTantraShell>
  );
}

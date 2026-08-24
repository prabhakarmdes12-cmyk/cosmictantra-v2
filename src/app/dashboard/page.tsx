'use client';

import React, { useEffect, useState } from 'react';
import { Users, Star, Calendar, Clock, Award, ArrowRight } from 'lucide-react';
import { getActiveProfile, getProfiles } from '@/lib/profileStore';
import DailyCosmicCard from '@/components/visual/DailyCosmicCard';
import CosmicIdCard from '@/components/visual/CosmicIdCard';
import TrustBar from '@/components/visual/TrustBar';
import Link from 'next/link';

// Family member mini card
function FamilyMiniCard({ profile }: { profile: any }) {
  return (
    <div className="p-4 rounded-2xl border border-[#8E6F1D]/15 bg-white dark:bg-[#0A0C12]">
      <div className="font-semibold">{profile.name}</div>
      <div className="text-xs text-[#857E74]">{profile.relation} • {profile.birthDate}</div>
    </div>
  );
}

export default function ScholarDashboard() {
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [familyCount, setFamilyCount] = useState(0);

  useEffect(() => {
    const profile = getActiveProfile() || getProfiles()[0] || null;
    setActiveProfile(profile);
    setFamilyCount(getProfiles().length);
  }, []);

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <div className="text-6xl mb-4">🪔</div>
          <h1 className="font-editorial text-4xl">Welcome to Your Scholar’s Desk</h1>
          <p className="mt-3 text-[#57524A]">Create your Cosmic Profile to begin.</p>
          <Link href="/profile" className="mt-6 inline-block px-8 py-3 bg-[#8E6F1D] text-white rounded-2xl">Create Profile</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <TrustBar />

        {/* Header */}
        <div className="mt-8 flex items-end justify-between">
          <div>
            <div className="text-xs tracking-[3px] text-[#8E6F1D] font-mono">SCHOLAR’S DESK • काशी विद्वत्-परिषद्</div>
            <h1 className="font-editorial text-6xl font-bold tracking-[-2.5px] mt-1">Your Cosmic Workspace</h1>
            <p className="text-xl text-[#57524A] mt-1">Good morning, {activeProfile.name}. The stars are aligned for clarity today.</p>
          </div>
          <Link href="/daily" className="hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl border border-[#8E6F1D]/30 text-sm font-medium hover:bg-white">
            Open Full Daily Forecast <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-10 grid lg:grid-cols-12 gap-8">
          {/* Cosmic ID Card */}
          <div className="lg:col-span-5">
            <CosmicIdCard 
              profile={{
                whatsappPhone: activeProfile.whatsappPhone || '+919876543210',
                fullName: activeProfile.name,
                cosmicId: activeProfile.cosmicId,
                consentGiven: true,
                familyMembersCount: familyCount
              }} 
              onManageFamily={() => window.location.href = '/family'}
            />
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-[#8E6F1D]/20 p-6 bg-white dark:bg-[#0A0C12]">
              <div className="flex items-center gap-3 text-[#8E6F1D]">
                <Star className="w-5 h-5" /> <span className="text-xs tracking-widest">CURRENT DASHA</span>
              </div>
              <div className="mt-4 text-3xl font-bold">Moon Dasha</div>
              <div className="text-sm text-[#857E74] mt-1">42% complete • Ends 12 Mar 2027</div>
            </div>

            <div className="rounded-3xl border border-[#8E6F1D]/20 p-6 bg-white dark:bg-[#0A0C12]">
              <div className="flex items-center gap-3 text-[#8E6F1D]">
                <Users className="w-5 h-5" /> <span className="text-xs tracking-widest">FAMILY PROFILES</span>
              </div>
              <div className="mt-4 text-5xl font-bold tabular-nums">{familyCount}</div>
              <div className="text-sm text-[#857E74] mt-1">Active Cosmic IDs</div>
            </div>

            <div className="rounded-3xl border border-[#8E6F1D]/20 p-6 bg-white dark:bg-[#0A0C12]">
              <div className="flex items-center gap-3 text-[#8E6F1D]">
                <Calendar className="w-5 h-5" /> <span className="text-xs tracking-widest">UPCOMING</span>
              </div>
              <div className="mt-4">
                <div className="font-semibold">14 Sep • Abhijit Muhurat</div>
                <div className="text-xs text-[#857E74]">Griha Pravesh • 11:45–12:30</div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#8E6F1D]/20 p-6 bg-white dark:bg-[#0A0C12]">
              <div className="flex items-center gap-3 text-[#8E6F1D]">
                <Award className="w-5 h-5" /> <span className="text-xs tracking-widest">CONSULTATIONS</span>
              </div>
              <div className="mt-4 text-5xl font-bold">3</div>
              <div className="text-sm text-[#857E74] mt-1">Written Folios Delivered</div>
            </div>
          </div>

          {/* Today's Personalized Forecast */}
          <div className="lg:col-span-12 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs tracking-[2px] text-[#8E6F1D] font-mono">TODAY’S PERSONALIZED VEDIC INTELLIGENCE</div>
              <Link href="/daily" className="text-sm text-[#8E6F1D] hover:underline flex items-center gap-1">View All 3 Days <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <DailyCosmicCard
                prediction={{
                  date: "25 Aug",
                  dayName: "Tue",
                  lagna: "Vrishabha",
                  moonNakshatra: "Rohini",
                  dasha: "Moon Dasha",
                  rahuKaal: "09:00–10:30",
                  abhijit: "11:45–12:30",
                  auspiciousScore: 84,
                  keyInsight: "Strong Rohini energy favors creative and nurturing work today.",
                  recommendedAction: "Begin important writing or teaching work before noon.",
                  color: "#10B981",
                  tithi: "Shukla Ekadashi",
                  yoga: "Vishkambha",
                  gulikaKaal: "16:30–18:00",
                  yamaganda: "12:00–13:30",
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

          {/* Family Dashboard (Priority 5 - Quick Win) */}
          <div className="lg:col-span-12 mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs tracking-[2px] text-[#8E6F1D] font-mono">YOUR PARIVAAR • FAMILY PROFILES</div>
              <Link href="/family" className="text-sm text-[#8E6F1D] hover:underline">Manage All →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {getProfiles().slice(0, 4).map((p, index) => (
                <FamilyMiniCard key={index} profile={p} />
              ))}
              {getProfiles().length === 0 && (
                <div className="col-span-4 text-center py-8 text-[#857E74]">No family profiles yet. <Link href="/family" className="text-[#8E6F1D]">Add members →</Link></div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          <Link href="/family" className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-[#8E6F1D]/20 hover:bg-white text-sm font-medium">Manage Family Profiles</Link>
          <Link href="/my-calendar" className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-[#8E6F1D]/20 hover:bg-white text-sm font-medium">Personal Vedic Calendar</Link>
          <Link href="/ask" className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#8E6F1D] text-white text-sm font-medium">Request New Written Folio</Link>
          <Link href="/profile" className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-[#8E6F1D]/20 hover:bg-white text-sm font-medium">Update Cosmic ID</Link>
        </div>
      </div>
    </main>
  );
}

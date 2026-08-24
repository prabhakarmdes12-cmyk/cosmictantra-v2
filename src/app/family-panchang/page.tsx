'use client';

import React from 'react';
import { Users, Calendar, Star } from 'lucide-react';
import { getProfiles } from '@/lib/profileStore';

export default function FamilyPanchang() {
  const profiles = getProfiles();

  if (profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto text-[#8E6F1D]" />
          <h2 className="font-editorial text-3xl mt-4">No Family Profiles Found</h2>
          <p className="mt-2 text-[#57524A]">Add family members in the Scholar’s Desk to see shared Panchang.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs tracking-[3px] text-[#8E6F1D]">FAMILY INTELLIGENCE</div>
          <h1 className="font-editorial text-5xl font-bold mt-2">Parivaar Panchang</h1>
          <p className="mt-3 text-xl text-[#57524A]">Personalized daily guidance for your entire family</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile, index) => (
            <div key={index} className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-7">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#8E6F1D]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#8E6F1D]" />
                </div>
                <div>
                  <div className="font-semibold text-xl">{profile.name}</div>
                  <div className="text-xs text-[#857E74]">{profile.relation} • {profile.birthDate}</div>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#857E74]">Today’s Nakshatra</span>
                  <span className="font-medium">Rohini</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#857E74]">Auspicious Score</span>
                  <span className="font-semibold text-emerald-600">82</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#857E74]">Rahu Kaal</span>
                  <span className="font-mono text-rose-600">09:00–10:30</span>
                </div>
                <div className="pt-4 border-t text-xs text-[#57524A]">
                  {profile.name} should focus on creative work before 2 PM today.
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-4 border border-[#8E6F1D]/30 rounded-2xl text-sm font-medium">
            Share Family Panchang on WhatsApp
          </button>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import { Check, Clock, Star, Bell } from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';

interface Remedy {
  id: number;
  name: string;
  type: string;
  startDate: string;
  duration: string;
  status: 'Active' | 'Completed' | 'Pending';
  progress: number;
}

const initialRemedies: Remedy[] = [
  { id: 1, name: 'Blue Sapphire (Neelam)', type: 'Gemstone', startDate: '10 Aug 2026', duration: '40 days', status: 'Active', progress: 65 },
  { id: 2, name: 'Shani Shanti Anusthan', type: 'Pooja', startDate: '15 Aug 2026', duration: '1 day', status: 'Completed', progress: 100 },
  { id: 3, name: '14 Mukhi Rudraksha', type: 'Rudraksha', startDate: '20 Aug 2026', duration: 'Ongoing', status: 'Active', progress: 30 },
];

export default function RemedyTracker() {
  const [remedies, setRemedies] = useState<Remedy[]>(initialRemedies);
  const [reminderSet, setReminderSet] = useState<number | null>(null);

  const updateProgress = (id: number, newProgress: number) => {
    setRemedies(prev =>
      prev.map(r => r.id === id ? { ...r, progress: newProgress } : r)
    );
  };

  const handleSetReminder = (id: number) => {
    setReminderSet(id);
    setTimeout(() => setReminderSet(null), 3000);
  };

  return (
    <CosmicTantraShell>
      <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs font-mono-data uppercase tracking-[3px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
            साधना व उपाय अनुष्ठान • REMEDY COMPLIANCE
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-2 tracking-tight">
            Planetary Remedy Tracker
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            Track your 40-day Sankalpa observances, daily mantra japa streaks, and remedy compliance
          </p>
        </div>

        <div className="space-y-6">
          {remedies.map((remedy) => (
            <div 
              key={remedy.id} 
              className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 sm:p-8 shadow-md hover:border-[#8E6F1D] transition-all"
            >
              <div className="flex justify-between items-start border-b border-black/10 dark:border-white/10 pb-4">
                <div>
                  <h2 className="font-editorial font-bold text-xl sm:text-2xl text-[#1C1917] dark:text-white">
                    {remedy.name}
                  </h2>
                  <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] mt-1 font-semibold">
                    {remedy.type} • Started {remedy.startDate} ({remedy.duration})
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[11px] font-mono-data font-bold ${
                  remedy.status === 'Active' 
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-[#8E6F1D]/15 text-[#8E6F1D] dark:text-[#F0C968]'
                }`}>
                  {remedy.status}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-xs font-mono-data mb-2">
                  <span className="text-[#696256] dark:text-[#9E988D]">Sankalpa Progress</span>
                  <span className="font-bold text-[#1C1917] dark:text-white">{remedy.progress}%</span>
                </div>
                <div className="h-2.5 bg-[#FAF7F2] dark:bg-[#070912] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] transition-all rounded-full"
                    style={{ width: `${remedy.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => updateProgress(remedy.id, Math.min(remedy.progress + 10, 100))}
                  className="px-5 py-2.5 text-xs font-mono-data font-bold rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:bg-[#A35C15] dark:hover:bg-[#E5C378] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" /> 
                  <span>Record +10% Progress</span>
                </button>
                <button 
                  onClick={() => handleSetReminder(remedy.id)}
                  className="px-5 py-2.5 text-xs font-mono-data font-bold border border-black/15 dark:border-white/15 rounded-xl hover:border-[#8E6F1D] text-[#1C1917] dark:text-white transition-all flex items-center gap-1.5 bg-white/70 dark:bg-white/5"
                >
                  <Bell className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                  <span>{reminderSet === remedy.id ? '✓ Daily Reminder Active' : 'Set Sandhya Reminder'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CosmicTantraShell>
  );
}


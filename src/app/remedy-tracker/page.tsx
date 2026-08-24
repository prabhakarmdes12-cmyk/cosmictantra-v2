'use client';

import React, { useState } from 'react';
import { Check, Clock, Star } from 'lucide-react';

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

  const updateProgress = (id: number, newProgress: number) => {
    setRemedies(prev =>
      prev.map(r => r.id === id ? { ...r, progress: newProgress } : r)
    );
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs tracking-[3px] text-[#8E6F1D]">REMEDY MANAGEMENT</div>
          <h1 className="font-editorial text-5xl font-bold mt-2">Remedy Tracker</h1>
          <p className="mt-3 text-xl text-[#57524A]">Track your Satvik Upaya journey</p>
        </div>

        <div className="space-y-6">
          {remedies.map((remedy) => (
            <div key={remedy.id} className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-2xl">{remedy.name}</div>
                  <div className="text-sm text-[#857E74] mt-1">{remedy.type} • Started {remedy.startDate}</div>
                </div>
                <div className={`px-4 py-1 rounded-full text-xs font-medium ${remedy.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#8E6F1D]/10 text-[#8E6F1D]'}`}>
                  {remedy.status}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-semibold">{remedy.progress}%</span>
                </div>
                <div className="h-2 bg-[#FAF7F2] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8E6F1D] transition-all"
                    style={{ width: `${remedy.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => updateProgress(remedy.id, Math.min(remedy.progress + 10, 100))}
                  className="px-5 py-2 text-sm border border-[#8E6F1D]/30 rounded-2xl flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Mark Progress
                </button>
                <button className="px-5 py-2 text-sm border border-[#8E6F1D]/30 rounded-2xl flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Set Reminder
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

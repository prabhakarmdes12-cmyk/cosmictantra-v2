'use client';

import React from 'react';
import { Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const UPCOMING_OBSERVANCES = [
  { title: 'TODAY', date: 'Active Date', detail: 'Regular Tithi & Daily Panchang', type: 'Daily' },
  { title: 'NEXT EKADASHI', date: 'Amalaki Ekadashi', detail: 'Spiritual Fasting & Vishnu Puja', type: 'Vrat' },
  { title: 'NEXT PURNIMA', date: 'Phalguna Purnima', detail: 'Full Moon Puja & Satyanarayan Vrat', type: 'Lunar' },
  { title: 'NEXT AMAVASYA', date: 'Chaitra Amavasya', detail: 'Ancestral Tarpana & Pitru Karma', type: 'Lunar' },
  { title: 'MAJOR FESTIVAL', date: 'Maha Shivratri', detail: 'Ratri Char Prahar Shiva Abhishekam', type: 'Festival' },
];

export default function FestivalStrip() {
  const handleFestivalClick = (fest: string) => {
    trackEvent('FESTIVAL_SELECTED', { festival: fest });
  };

  return (
    <section id="festivals" className="py-14 px-4 max-w-6xl mx-auto border-b border-purple-500/20 font-body">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="text-xs font-bold text-[#A78BFA] uppercase tracking-widest mb-1">
            CULTURAL & LUNAR CALENDAR
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold font-display text-white">
            Coming up in the Vedic calendar
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {UPCOMING_OBSERVANCES.map((item, idx) => (
          <div
            key={idx}
            onClick={() => handleFestivalClick(item.date)}
            className="chiti-card p-4 flex flex-col justify-between space-y-2 cursor-pointer hover:border-purple-500/50 transition-all bg-black/60"
          >
            <div>
              <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-widest block">
                {item.title}
              </span>
              <h3 className="text-sm font-bold text-white font-display mt-1">{item.date}</h3>
              <p className="text-[11px] text-[#9CA3AF] mt-1 leading-relaxed">{item.detail}</p>
            </div>
            <div className="pt-2 text-[10px] text-[#A78BFA] font-semibold flex items-center justify-between border-t border-white/5">
              <span>{item.type}</span>
              <span>Details →</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

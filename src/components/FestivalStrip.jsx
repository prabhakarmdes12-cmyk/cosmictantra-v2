import React, { useState } from 'react';
import { Calendar, X, Flame } from 'lucide-react';
import { UPCOMING_EVENTS } from '../lib/festivals';
import { analytics, ANALYTICS_EVENTS } from '../lib/analytics';

export default function FestivalStrip({ lang = 'en', theme = 'dark' }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <section id="festival-section" className="py-16 border-b border-white/[0.08] bg-[#06070B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="text-[11px] font-mono-data text-[#D4AF37] uppercase tracking-[0.24em] mb-1 flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-[#E29A48]" />
              <span>पर्व एवं व्रत तालिका • KASHI LUNAR CALENDAR 2026</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#EFECE6]">
              Coming up in the Vedic calendar
            </h2>
          </div>
          <span className="text-xs font-mono-data text-[#736E67]">
            Deterministic Lunar Tithi Dates
          </span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-data">
          {UPCOMING_EVENTS.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                analytics.track(ANALYTICS_EVENTS.FESTIVAL_SELECTED, { festival: item.name });
                setSelectedEvent(item);
              }}
              className="p-5 rounded-2xl bg-[#090B14] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:bg-[#0E111E] cursor-pointer transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#D4AF37] font-medium text-[10px] uppercase">{item.category}</span>
                  <span className="text-[#736E67] text-[11px]">{item.dateStr}</span>
                </div>
                <h3 className="font-editorial text-lg font-bold text-[#EFECE6] mb-1">
                  {item.name}
                </h3>
                <div className="text-xs text-[#E29A48] mb-2">
                  {item.tithi}
                </div>
                <p className="text-xs text-[#AAA49A] line-clamp-2 leading-relaxed">
                  {item.significance}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#EFECE6]">
                <span className="text-[10px] text-[#D4AF37]">Muhurat: {item.pujaMuhurat}</span>
                <span className="text-[#8B8BF5] text-[11px] font-medium">Details →</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Festival Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#080A12] border border-[#D4AF37]/40 p-6 shadow-2xl space-y-4 text-left font-mono-data">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <span className="text-[9px] uppercase text-[#D4AF37]">
                  {selectedEvent.category} • 2026 CALENDAR
                </span>
                <h3 className="font-editorial text-2xl font-bold text-[#EFECE6]">
                  {selectedEvent.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded text-[#8E7E72] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#AAA49A]">
              <div>
                <div className="text-[10px] text-[#736E67]">Lunar Tithi & Date:</div>
                <div className="text-[#EFECE6] font-semibold text-sm">{selectedEvent.tithi} — {selectedEvent.dateStr}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#05060A] border border-[#D4AF37]/30">
                <div className="text-[10px] text-[#E29A48] mb-0.5">Puja & Sankalp Muhurat:</div>
                <div className="text-sm font-semibold text-[#EFECE6]">{selectedEvent.pujaMuhurat}</div>
              </div>

              <div>
                <div className="text-[10px] text-[#736E67] mb-0.5">Spiritual Significance:</div>
                <p className="text-xs text-[#AAA49A] leading-relaxed">{selectedEvent.significance}</p>
              </div>

              <div>
                <div className="text-[10px] text-[#736E67] mb-0.5">Vrat & Fasting Discipline:</div>
                <p className="text-xs text-[#AAA49A] leading-relaxed">{selectedEvent.fastingRules}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg bg-[#101322] border border-white/[0.08] text-xs text-[#EFECE6]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

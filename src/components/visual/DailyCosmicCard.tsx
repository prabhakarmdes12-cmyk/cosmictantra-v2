'use client';

import React from 'react';
import { Calendar, Star, Clock, ArrowRight, Share2, Plus } from 'lucide-react';

interface DailyPrediction {
  date: string;
  dayName: string;
  lagna: string;
  moonNakshatra: string;
  dasha: string;
  rahuKaal: string;
  abhijit: string;
  auspiciousScore: number;
  keyInsight: string;
  recommendedAction: string;
  color: string;
}

interface DailyCosmicCardProps {
  prediction: DailyPrediction;
  isToday?: boolean;
  onAddToCalendar?: () => void;
  onShareWhatsApp?: () => void;
}

export default function DailyCosmicCard({ 
  prediction, 
  isToday = false, 
  onAddToCalendar, 
  onShareWhatsApp 
}: DailyCosmicCardProps) {
  const scoreColor = 
    prediction.auspiciousScore >= 80 ? 'text-emerald-600 bg-emerald-100' :
    prediction.auspiciousScore >= 60 ? 'text-amber-600 bg-amber-100' :
    'text-rose-600 bg-rose-100';

  return (
    <div className={`group relative rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl
      ${isToday 
        ? 'border-[#D4AF37] shadow-lg scale-[1.01]' 
        : 'border-[#D4AF37]/20 hover:border-[#D4AF37]/40'
      } bg-white dark:bg-[#0A0C12]`}>
      
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-xs uppercase tracking-[2px] font-mono text-[#8E6F1D]">
              {prediction.dayName}
            </div>
            {isToday && (
              <div className="px-2.5 py-0.5 text-[10px] bg-[#D4AF37] text-[#1C1917] rounded-full font-bold">TODAY</div>
            )}
          </div>
          <div className="font-editorial text-3xl font-bold tracking-tight mt-1">{prediction.date}</div>
        </div>

        {/* Auspicious Score */}
        <div className={`px-4 py-1.5 rounded-2xl text-center ${scoreColor}`}>
          <div className="text-[10px] tracking-widest font-bold">AUSPICIOUS</div>
          <div className="text-3xl font-bold tabular-nums leading-none mt-0.5">{prediction.auspiciousScore}</div>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="px-6 grid grid-cols-2 gap-x-4 gap-y-4 text-sm border-t border-[#D4AF37]/10 pt-5 pb-6">
        <div>
          <div className="text-[#857E74] text-xs tracking-wider">LAGNA</div>
          <div className="font-semibold mt-0.5">{prediction.lagna}</div>
        </div>
        <div>
          <div className="text-[#857E74] text-xs tracking-wider">MOON NAKSHATRA</div>
          <div className="font-semibold mt-0.5">{prediction.moonNakshatra}</div>
        </div>
        <div>
          <div className="text-[#857E74] text-xs tracking-wider">CURRENT DASHA</div>
          <div className="font-semibold mt-0.5">{prediction.dasha}</div>
        </div>
        <div>
          <div className="text-[#857E74] text-xs tracking-wider">RAHU KAAL</div>
          <div className="font-mono font-semibold mt-0.5 text-rose-600">{prediction.rahuKaal}</div>
        </div>
      </div>

      {/* Insight */}
      <div className="px-6 pb-5">
        <div className="text-xs uppercase tracking-[1.5px] text-[#8E6F1D] mb-1.5">KEY INSIGHT</div>
        <p className="text-sm leading-snug text-[#57524A] dark:text-[#AAA49A]">
          {prediction.keyInsight}
        </p>
      </div>

      {/* Recommended Action */}
      <div className="px-6 pb-6">
        <div className="text-xs uppercase tracking-[1.5px] text-[#8E6F1D] mb-1.5">RECOMMENDED ACTION</div>
        <div className="flex items-center gap-2 text-sm font-medium text-[#1C1917] dark:text-white">
          <Star className="w-4 h-4 text-[#D4AF37]" />
          {prediction.recommendedAction}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-[#D4AF37]/10 px-6 py-4 flex gap-3 bg-[#FAF7F2] dark:bg-[#11131C]">
        <button 
          onClick={onAddToCalendar}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-[#D4AF37]/30 text-xs font-semibold hover:bg-[#D4AF37]/10 active:scale-[0.985] transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> ADD TO CALENDAR
        </button>
        <button 
          onClick={onShareWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#128C7E] active:scale-[0.985] transition-all"
        >
          <Share2 className="w-3.5 h-3.5" /> SHARE ON WHATSAPP
        </button>
      </div>
    </div>
  );
}

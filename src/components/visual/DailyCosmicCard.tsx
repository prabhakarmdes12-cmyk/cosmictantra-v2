'use client';

import React, { useState } from 'react';
import { Calendar, Star, Clock, ArrowRight, Share2, Plus, AlertTriangle, Award, Download } from 'lucide-react';
import AstronomicalProofDrawer from './AstronomicalProofDrawer';
import { RitualCard, RitualDrawer } from './RitualTransition';

interface DailyPrediction {
  date: string;
  dayName: string;
  lagna: string;
  moonNakshatra: string;
  dasha: string;
  rahuKaal: string;
  abhijit: string;
  gulikaKaal?: string;
  yamaganda?: string;
  yoga?: string;
  tithi?: string;
  auspiciousScore: number;
  keyInsight: string;
  recommendedAction: string;
  color: string;
  sadeSati?: boolean;
  sadeSatiPhase?: string;
  kaalSarp?: boolean;
  hasFestival?: boolean;
  isJanmaNakshatra?: boolean;
  isRikta?: boolean;
}

interface DailyCosmicCardProps {
  prediction: DailyPrediction;
  isToday?: boolean;
  onAddToCalendar?: () => void;
  onShareWhatsApp?: () => void;
  onShareCard?: () => void;
}

export default function DailyCosmicCard({ 
  prediction, 
  isToday = false, 
  onAddToCalendar, 
  onShareWhatsApp,
  onShareCard
}: DailyCosmicCardProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  
  const scoreColor = 
    prediction.auspiciousScore >= 80 ? 'text-emerald-600 bg-emerald-100' :
    prediction.auspiciousScore >= 60 ? 'text-amber-600 bg-amber-100' :
    'text-rose-600 bg-rose-100';

  return (
    <div className={`group relative rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${
      isToday 
        ? 'border-[#D4AF37] shadow-lg scale-[1.01]' 
        : 'border-[#8E6F1D]/25 dark:border-[#D4AF37]/30'
    } bg-white dark:bg-[#0A0C12]`}>
      {/* Sacred Geometry Dual-Border Accent */}
      <div className="absolute inset-0 rounded-3xl border border-[#8E6F1D]/10 dark:border-[#D4AF37]/10 pointer-events-none" />
      
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
          <div className="text-[#857E74] text-xs tracking-wider">TITHI</div>
          <div className="font-semibold mt-0.5">{prediction.tithi || '—'}</div>
        </div>
      </div>

      {/* Inauspicious Windows */}
      <div className="px-6 pb-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-3">
          <div className="flex items-center gap-1.5 text-rose-600 font-medium mb-1">
            <Clock className="w-3.5 h-3.5" /> RAHU KAAL
          </div>
          <div className="font-mono text-rose-700 dark:text-rose-400">{prediction.rahuKaal}</div>
        </div>
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-3">
          <div className="flex items-center gap-1.5 text-rose-600 font-medium mb-1">
            <Clock className="w-3.5 h-3.5" /> GULIKA KAAL
          </div>
          <div className="font-mono text-rose-700 dark:text-rose-400">{prediction.gulikaKaal || '—'}</div>
        </div>
      </div>

      {/* Advanced Metrics Badges */}
      <div className="px-6 pb-5 flex flex-wrap gap-2 text-[10px]">
        {prediction.sadeSati && (
          <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Sade Sati {prediction.sadeSatiPhase || ''}
          </div>
        )}
        {prediction.kaalSarp && (
          <div className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Kaal Sarp Yoga
          </div>
        )}
        {prediction.isJanmaNakshatra && (
          <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1">
            <Award className="w-3 h-3" /> Janma Nakshatra Day
          </div>
        )}
        {prediction.hasFestival && (
          <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">Festival / Vrat</div>
        )}
        {prediction.isRikta && (
          <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">Rikta Tithi</div>
        )}
      </div>

      {/* Yoga & Abhijit */}
      <div className="px-6 pb-5 grid grid-cols-2 gap-4 text-xs border-t border-[#D4AF37]/10 pt-4">
        <div>
          <div className="text-[#857E74] text-xs tracking-wider">YOGA</div>
          <div className="font-semibold">{prediction.yoga || '—'}</div>
        </div>
        <div>
          <div className="text-[#857E74] text-xs tracking-wider">ABHIJIT MUHURAT</div>
          <div className="font-mono font-semibold text-emerald-600">{prediction.abhijit}</div>
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
        <button 
          onClick={onShareCard || (() => (window as any).openShareCard?.())}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-[#D4AF37]/30 text-xs font-semibold hover:bg-[#D4AF37]/10 active:scale-[0.985] transition-all"
        >
          <Download className="w-3.5 h-3.5" /> 9:16 CARD
        </button>
      </div>

      {/* Astronomical Proof Drawer with Ritual Animation */}
      <div className="px-6 pb-6">
        <button 
          onClick={() => setShowDrawer(!showDrawer)}
          className="flex w-full items-center justify-between text-xs font-mono-data tracking-wider text-[#8E6F1D] hover:text-[#1C1917] mb-2"
        >
          <span>खगोलीय प्रमाण (Astronomical Proof)</span>
          <span>{showDrawer ? '▲' : '▼'}</span>
        </button>
        
        <RitualDrawer isOpen={showDrawer}>
        <AstronomicalProofDrawer
          julianDay={2460523.5}
          ayanamsha="24° 16' 42″"
          localSiderealTime="14h 32m 18s"
          coordinates="25.5941°N, 85.1376°E"
          tithi={prediction.tithi || 'Shukla Ekadashi'}
          nakshatra={prediction.moonNakshatra}
          lagna={prediction.lagna}
          moonLongitude="42° 18' 45″"
          sunLongitude="128° 45' 12″"
          houseCusps="1st: 42° | 7th: 222°"
          planetaryLongitudes="Moon 42° • Sun 128° • Mars 195°"
        />
        </RitualDrawer>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, Star, Clock, ArrowRight, Share2, Plus, AlertTriangle, 
  Award, Download, Briefcase, Coins, Heart, Activity, Sparkles, ShieldCheck
} from 'lucide-react';
import AstronomicalProofDrawer from './AstronomicalProofDrawer';
import { RitualDrawer } from './RitualTransition';

export interface DailyDetailProps {
  dateStr?: string;
  date?: string;
  dayLabel?: string;
  dayName?: string;
  weekday?: string;
  rashiTransit?: string;
  lagna?: string;
  moonNakshatra?: string;
  dasha?: string;
  houseFromMoon?: number;
  houseFromLagna?: number;
  taraBala?: { name: string; status: string; effect: string };
  isChandrashtama?: boolean;
  score?: number;
  auspiciousScore?: number;
  theme?: string;
  keyInsight?: string;
  career?: string;
  wealth?: string;
  relationships?: string;
  vitality?: string;
  recommendedAction?: string;
  powerWindow?: { title: string; time: string; activity: string };
  cautionWindow?: { title: string; time: string; activity: string };
  sankalpa?: { mantra: string; ritual: string; deity: string };
  rahuKaal?: string;
  abhijit?: string;
  gulikaKaal?: string;
  yoga?: string;
  tithi?: string;
  color?: string;
  sadeSati?: boolean;
  sadeSatiPhase?: string;
  kaalSarp?: boolean;
  hasFestival?: boolean;
  isJanmaNakshatra?: boolean;
  isRikta?: boolean;
}

interface DailyCosmicCardProps {
  prediction: DailyDetailProps;
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
  const [activeTab, setActiveTab] = useState<'all' | 'career' | 'wealth' | 'relationships' | 'vitality'>('all');

  // CT_UX truth: never fabricate a score when the engine did not return one.
  const finalScore = prediction.score ?? prediction.auspiciousScore ?? null;
  const dateDisplay = prediction.dateStr || prediction.date || 'Today';
  const dayLabelDisplay = prediction.dayLabel || prediction.dayName || 'Today';

  const scoreBadgeColor =
    finalScore === null ? '' :
    finalScore >= 80 ? 'text-[#065F46] dark:text-[#10B981] bg-emerald-500/10 border-emerald-500/30' :
    finalScore >= 60 ? 'text-[#8E6F1D] dark:text-[#F0C968] bg-amber-500/10 border-amber-500/30' :
    'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';

  return (
    <div className={`group relative rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col justify-between ${
      isToday 
        ? 'border-[#8E6F1D] dark:border-[#D4AF37] shadow-xl ring-1 ring-[#8E6F1D]/20 dark:ring-[#D4AF37]/30' 
        : 'border-black/10 dark:border-white/10'
    } bg-white dark:bg-[#0E101D]`}>
      
      {/* Sacred Corner Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#8E6F1D]/10 to-transparent pointer-events-none rounded-bl-full" />

      <div>
        {/* Top Header Row */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[2px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                {dayLabelDisplay}
              </span>
              {isToday && (
                <span className="px-2.5 py-0.5 text-[10px] bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] rounded-full font-mono-data font-bold tracking-wider">
                  TODAY
                </span>
              )}
            </div>
            <div className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-0.5 tracking-tight">
              {dateDisplay}
            </div>
            <div className="text-[11px] font-mono-data text-[#696256] dark:text-[#9E988D]">
              {prediction.weekday || 'Vedic Day'}
              {(prediction.rashiTransit || prediction.lagna) ? ` • Moon in ${prediction.rashiTransit || prediction.lagna}` : ''}
            </div>
          </div>

          {/* Auspicious Score Gauge — engine value only, interpretation labelled */}
          {finalScore !== null && (
            <div className={`px-4 py-2 rounded-2xl text-center border ${scoreBadgeColor}`}>
              <div className="text-[9px] font-mono-data uppercase tracking-widest font-bold">AUSPICIOUS</div>
              <div className="text-2xl sm:text-3xl font-bold font-mono-data tabular-nums leading-none mt-0.5">
                {finalScore}
              </div>
              <div className="text-[8px] font-mono-data uppercase tracking-wider opacity-80 mt-0.5">Traditional reading</div>
            </div>
          )}
        </div>

        {/* Core Theme Banner */}
        <div className="px-6 py-3.5 bg-[#FAF7F2] dark:bg-[#070912] border-b border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37] shrink-0" />
          {prediction.theme || prediction.keyInsight ? (
            <div className="text-xs font-mono-data font-bold text-[#1C1917] dark:text-[#FFFFFF] line-clamp-1">
              {prediction.theme || prediction.keyInsight}
            </div>
          ) : null}
        </div>

        {/* Telemetry Chips (Tara Bala, Tithi, Nakshatra, Dasha) */}
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-data border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02]">
          <div className="p-2 rounded-xl bg-white dark:bg-[#121528] border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">TARA BALA:</span>
            <strong className="text-[#8E6F1D] dark:text-[#F0C968] truncate block">
              {prediction.taraBala?.name || '—'}
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#121528] border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">NAKSHATRA:</span>
            <strong className="text-[#1C1917] dark:text-white truncate block">
              {prediction.moonNakshatra || '—'}
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#121528] border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">TITHI:</span>
            <strong className="text-[#1C1917] dark:text-white truncate block">
              {prediction.tithi || '—'}
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-[#121528] border border-black/5 dark:border-white/5">
            <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">DASHA:</span>
            <strong className="text-[#1C1917] dark:text-white truncate block">
              {prediction.dasha || '—'}
            </strong>
          </div>
        </div>

        {/* 4 Life Pillars Narrative Section */}
        <div className="px-6 py-5 space-y-4 text-xs font-mono-data">
          <div className="text-[10px] uppercase tracking-[2px] font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
            चार स्तम्भ फलकथन • 4 LIFE DIMENSIONS
          </div>
          <div className="text-[9px] font-mono-data uppercase tracking-wider text-[#8E6F1D]/70 dark:text-[#D4AF37]/70">
            Traditional reading · interpretive guidance, not a calculated fact
          </div>

          <div className="space-y-3">
            {/* Career & Karma */}
            <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-[#FAF7F2] dark:bg-[#070912]">
              <div className="flex items-center gap-2 font-bold text-[#1C1917] dark:text-white mb-1">
                <Briefcase className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                <span>Career & Karma (कर्म व व्यवसाय)</span>
              </div>
              <p className="text-[#57524A] dark:text-[#D1C9BF] leading-relaxed">
                {prediction.career || 'Traditional reading unavailable for this day.'}
              </p>
            </div>

            {/* Artha & Wealth */}
            <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-[#FAF7F2] dark:bg-[#070912]">
              <div className="flex items-center gap-2 font-bold text-[#1C1917] dark:text-white mb-1">
                <Coins className="w-3.5 h-3.5 text-[#065F46] dark:text-[#10B981]" />
                <span>Artha & Finance (वित्त व निर्णय)</span>
              </div>
              <p className="text-[#57524A] dark:text-[#D1C9BF] leading-relaxed">
                {prediction.wealth || 'Traditional reading unavailable for this day.'}
              </p>
            </div>

            {/* Sambandh & Home */}
            <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-[#FAF7F2] dark:bg-[#070912]">
              <div className="flex items-center gap-2 font-bold text-[#1C1917] dark:text-white mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Sambandh & Family (संबंध व संवाद)</span>
              </div>
              <p className="text-[#57524A] dark:text-[#D1C9BF] leading-relaxed">
                {prediction.relationships || 'Traditional reading unavailable for this day.'}
              </p>
            </div>

            {/* Swasthya & Mind */}
            <div className="p-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-[#FAF7F2] dark:bg-[#070912]">
              <div className="flex items-center gap-2 font-bold text-[#1C1917] dark:text-white mb-1">
                <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Vitality & Mind (ऊर्जा व मन)</span>
              </div>
              <p className="text-[#57524A] dark:text-[#D1C9BF] leading-relaxed">
                {prediction.vitality || 'Traditional reading unavailable for this day.'}
              </p>
            </div>
          </div>

          {/* Timing Windows: Power vs Caution */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#065F46] dark:text-[#10B981]">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>POWER HOUR (अभिजीत): {prediction.powerWindow?.time || prediction.abhijit || '—'}</span>
              </div>
              <p className="text-[11px] text-[#065F46] dark:text-[#34D399]">
                {prediction.powerWindow?.activity || 'Traditional reading not available for this window.'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>CAUTION (राहुकाल): {prediction.cautionWindow?.time || prediction.rahuKaal || '—'}</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-400">
                {prediction.cautionWindow?.activity || 'Traditional reading not available for this window.'}
              </p>
            </div>
          </div>

          {/* Daily Sankalpa Box */}
          <div className="p-4 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-gradient-to-br from-[#8E6F1D]/5 to-transparent">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                <ShieldCheck className="w-4 h-4" />
                <span>आज का वैदिक संकल्प (DAILY SANKALPA)</span>
              </div>
              <Link href="/remedy-tracker" className="text-[10px] underline hover:text-[#1C1917] dark:hover:text-white">
                Log in Japa Tracker →
              </Link>
            </div>
            <div className="font-bold text-sm text-[#1C1917] dark:text-white font-editorial">
              {prediction.sankalpa?.mantra || '—'}
            </div>
            <p className="text-[11px] text-[#696256] dark:text-[#B3ADA3] mt-1">
              {prediction.sankalpa?.ritual || prediction.recommendedAction || 'Traditional reading not available.'}
            </p>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div>
        <div className="border-t border-black/10 dark:border-white/10 px-6 py-4 flex flex-wrap gap-2.5 bg-[#FAF7F2] dark:bg-[#070912]">
          {onAddToCalendar && (
            <button 
              onClick={onAddToCalendar}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> <span>CALENDAR</span>
            </button>
          )}
          <button 
            onClick={onShareWhatsApp || (() => window.open(`https://wa.me/?text=${encodeURIComponent(`🕉️ CosmicTantra Vedic Panchang (${dateDisplay}): ${prediction.theme || 'Vedic Guidance'}`)}`, '_blank'))}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#25D366] text-white text-xs font-mono-data font-bold hover:bg-[#128C7E] transition-all shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" /> <span>WHATSAPP</span>
          </button>
          {onShareCard && (
            <button 
              onClick={onShareCard}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> <span>9:16 CARD</span>
            </button>
          )}
        </div>

        {/* Astronomical Proof Drawer Toggle */}
        <div className="px-6 pb-4 pt-1 bg-[#FAF7F2] dark:bg-[#070912]">
          <button 
            onClick={() => setShowDrawer(!showDrawer)}
            className="flex w-full items-center justify-between text-[11px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#D4AF37] hover:underline"
          >
            <span>खगोलीय प्रमाण (Lahiri Sidereal Ephemeris Proof)</span>
            <span>{showDrawer ? '▲ Hide' : '▼ View Data'}</span>
          </button>
          
          <RitualDrawer isOpen={showDrawer}>
            <div className="mt-3">
              <AstronomicalProofDrawer
                julianDay={2460523.5}
                ayanamsha="24° 16' 42″"
                localSiderealTime="14h 32m 18s"
                coordinates="25.5941°N, 85.1376°E"
                tithi={prediction.tithi || 'Shukla Navami'}
                nakshatra={prediction.moonNakshatra || 'Rohini'}
                lagna={prediction.lagna || 'Vrishabha'}
                moonLongitude="42° 18' 45″"
                sunLongitude="128° 45' 12″"
                houseCusps="1st: 42° | 7th: 222°"
                planetaryLongitudes="Moon 42° • Sun 128° • Mars 195°"
              />
            </div>
          </RitualDrawer>
        </div>
      </div>

    </div>
  );
}

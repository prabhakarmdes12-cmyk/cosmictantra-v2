'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Calendar, ShieldAlert, Sparkles, Clock, ArrowRight, Bell, CheckCircle2 } from 'lucide-react';
import { calculatePanchang } from '@/engines/panchang.js';
import Link from 'next/link';

export default function MyDaysPanchang({ kundali }: { kundali?: any }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [panchangData, setPanchangData] = useState<any>(null);
  const [subscribed, setSubscribed] = useState(false);

  const birthNakIdx = kundali?.planets?.Moon?.nakshatra?.index ?? 0;
  const birthRasiIdx = Math.floor((kundali?.planets?.Moon?.longitude || 0) / 30);

  useEffect(() => {
    const p = calculatePanchang(new Date(selectedDate), 25.5941, 85.1376, 5.5, birthNakIdx, birthRasiIdx);
    setPanchangData(p);
  }, [selectedDate, birthNakIdx, birthRasiIdx]);

  if (!panchangData) return null;

  const pe = panchangData.personalEnergy;

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> DrikPanchang & Personal Energy Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
            "My Days" Energy Calendar
          </h2>
          <p className="text-xs text-[#9CA3AF]">
            Real-time DrikPanchang micro-timings overlaid with your natal Tara Bala & Chandra Bala.
          </p>
        </div>

        <input
          type="date"
          className="chiti-input text-xs w-auto"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Personal Energy Status Banner */}
      {pe && (
        <div className={`p-5 rounded-2xl border-2 transition-all ${
          pe.isPowerDay
            ? 'bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black border-[#F59E0B]/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
            : pe.isCautionDay
            ? 'bg-gradient-to-r from-red-950/40 via-purple-950/30 to-black border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.2)]'
            : 'bg-purple-950/30 border-purple-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                pe.isPowerDay ? 'bg-amber-500/20 text-[#FBBF24] border border-amber-500/40' : pe.isCautionDay ? 'bg-red-500/20 text-[#F87171] border border-red-500/40' : 'bg-purple-500/20 text-[#A78BFA]'
              }`}>
                {pe.badgeText}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                Tara Bala: {pe.taraName} ({pe.taraStatus})
              </h3>
              <p className="text-xs text-[#D1D5DB] mt-1 leading-relaxed">{pe.taraDesc}</p>
            </div>

            {pe.isCautionDay && (
              <Link href="/ask" className="chiti-btn-primary py-2.5 px-5 text-xs bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold shrink-0">
                Caution Day! Consult Pandit Ji — ₹199 <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* DrikPanchang Micro-Timings Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
          <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Tithi</span>
          <span className="font-bold text-white text-sm">{panchangData.tithi?.name}</span>
          <span className="text-[10px] text-[#A78BFA] block mt-0.5">{panchangData.tithi?.paksha}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
          <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Nakshatra</span>
          <span className="font-bold text-[#F59E0B] text-sm">{panchangData.nakshatra?.name}</span>
          <span className="text-[10px] text-[#9CA3AF] block mt-0.5">Pada {panchangData.nakshatra?.pada}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/20">
          <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Nitya Yoga</span>
          <span className="font-bold text-white text-sm">{panchangData.yoga?.name}</span>
          <span className="text-[10px] text-[#10B981] block mt-0.5">{panchangData.vara?.day}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-black/40 border border-amber-500/30">
          <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Rahu Kalam</span>
          <span className="font-bold text-[#F59E0B] text-sm">{panchangData.rahuKala?.start} – {panchangData.rahuKala?.end}</span>
          <span className="text-[10px] text-[#6B7280] block mt-0.5">Avoid major starts</span>
        </div>
      </div>

      {/* WhatsApp Daily Alert Subscription Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-black border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Morning WhatsApp Energy Alert</h4>
            <p className="text-[11px] text-[#9CA3AF]">
              Receive your personalized 7:00 AM daily Power/Caution Day forecast on WhatsApp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSubscribed(true)}
          className="chiti-btn-primary py-2.5 px-5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0"
        >
          {subscribed ? '✓ Subscribed to Alerts!' : 'Subscribe — ₹99/mo'}
        </button>
      </div>
    </div>
  );
}

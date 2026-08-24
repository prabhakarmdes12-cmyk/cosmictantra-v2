'use client';

import React, { useState } from 'react';
import { Share2, Check, Sparkles } from 'lucide-react';
import { calculatePanchang } from '@/engines/panchang.js';

export default function ShareableCard() {
  const [copied, setCopied] = useState(false);
  const today = calculatePanchang(new Date(), 23.7957, 86.4304, 5.5);

  const shareText = `🕉️ COSMIC TANTRA TODAY
📅 Date: ${today.date}
📍 Location: Dhanbad, JH
🌅 Sunrise: ${today.sunrise} IST
🌕 Tithi: ${today.tithi?.name} (${today.tithi?.paksha})
✦ Nakshatra: ${today.nakshatra?.name} (Pada ${today.nakshatra?.pada})
⚠ Rahu Kalam: ${today.rahuKala?.start} – ${today.rahuKala?.end}

Explore daily Panchang: https://cosmictantra.chiti.tech`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'CosmicTantra Today', text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="py-14 px-4 max-w-4xl mx-auto border-b border-purple-500/20 font-body">
      <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
        <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
          DAILY CHRONOLOGY ARTIFACT
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          CosmicTantra Today
        </h2>
        <p className="text-xs text-[#9CA3AF]">
          Share today's authentic Vedic time and Rahu Kalam timing card with family or colleagues.
        </p>
      </div>

      {/* Share Card Visual Box */}
      <div className="chiti-card p-6 sm:p-8 max-w-lg mx-auto border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-black to-black space-y-4 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕉️</span>
            <span className="font-display font-bold text-white text-sm">COSMICTANTRA</span>
          </div>
          <span className="text-[10px] text-[#A78BFA] font-mono">{today.date}</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Location:</span>
            <strong className="text-white">Dhanbad, JH</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Tithi:</span>
            <strong className="text-[#F59E0B]">{today.tithi?.name} ({today.tithi?.paksha})</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Nakshatra:</span>
            <strong className="text-white">{today.nakshatra?.name} (Pada {today.nakshatra?.pada})</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9CA3AF]">Rahu Kalam:</span>
            <strong className="text-[#F87171]">{today.rahuKala?.start} – {today.rahuKala?.end}</strong>
          </div>
        </div>

        <div className="pt-3 border-t border-purple-500/20 flex justify-between items-center">
          <span className="text-[10px] text-[#9CA3AF] font-mono">cosmictantra.chiti.tech</span>
          <button
            onClick={handleShare}
            className="chiti-btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard!' : 'Share Today\'s Card'}
          </button>
        </div>
      </div>
    </section>
  );
}

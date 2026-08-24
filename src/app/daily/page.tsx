'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, ArrowRight } from 'lucide-react';
import DailyCosmicCard from '@/components/visual/DailyCosmicCard';
import { getActiveProfile, getProfiles } from '@/lib/profileStore';
import { calculatePanchang } from '@/lib/panchang';
import { calculateVimshottariDasha, getCurrentDasha } from '@/lib/dashaEngine';
import { calculateKundali } from '@/lib/astrologyEngine';
import { getVedicAlerts } from '@/lib/vedicAlerts';
import TrustBar from '@/components/visual/TrustBar';
import Link from 'next/link';

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
  sadeSati?: boolean;
  kaalSarp?: boolean;
  hasFestival?: boolean;
}

export default function DailyPage() {
  const router = useRouter();
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [predictions, setPredictions] = useState<DailyPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Get active profile or first available
  useEffect(() => {
    const profile = getActiveProfile() || (getProfiles()[0] || null);
    setActiveProfile(profile);
  }, []);

  // Generate 3-day personalized predictions
  useEffect(() => {
    if (!activeProfile) {
      setLoading(false);
      return;
    }

    const generatePredictions = async () => {
      const today = new Date();
      const dates = [
        new Date(today),
        new Date(today.getTime() + 86400000),
        new Date(today.getTime() + 172800000),
      ];

      const results: DailyPrediction[] = [];

      for (let i = 0; i < 3; i++) {
        const date = dates[i];
        const dateStr = date.toISOString().slice(0, 10);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

        // Use profile birth data for personalization
        const birthDate = activeProfile.birthDate || '1995-06-15';
        const birthTime = activeProfile.birthTime || '10:30';
        const lat = activeProfile.birthLat || 25.5941;
        const lon = activeProfile.birthLon || 85.1376;
        const tz = activeProfile.timezone || 5.5;

        // 1. Calculate Panchang for the day
        const panchang = calculatePanchang(date, lat, lon, tz);

        // 2. Calculate Kundali (for Lagna + Moon Nakshatra)
        const kundali = calculateKundali(birthDate, birthTime, lat, lon, tz);

        // 3. Dasha
        const moonNak = (kundali.planets as any)?.Moon?.nakshatra?.name || 'Rohini';
        const dashaList = calculateVimshottariDasha(moonNak, new Date(birthDate));
        const activeDasha = getCurrentDasha(dashaList, date);

        // 4. Vedic Alerts (Rahu Kaal etc.)
        const alerts = getVedicAlerts(date, lat, lon, tz);
        const rahuKaal = alerts.rahuKaal || '09:00–10:30';
        const abhijit = alerts.abhijit || '11:45–12:30';

        // 5. Personalized Auspicious Score (heuristic)
        let score = 72;
        if (panchang.tithi.includes('Shukla')) score += 8;
        if (activeDasha?.planet === 'Jupiter' || activeDasha?.planet === 'Venus') score += 10;
        if (alerts.isRikta) score -= 15;
        score = Math.max(45, Math.min(95, Math.round(score)));

        // 6. Advanced Metrics (Sade Sati, Kaal Sarp, Festival Flags)
        const birthYear = new Date(birthDate).getFullYear();
        const currentYear = date.getFullYear();
        const sadeSatiActive = currentYear >= birthYear + 28 && currentYear <= birthYear + 38;
        const kaalSarpActive = Math.random() > 0.75; // Simplified demo logic
        const hasFestival = panchang.festivals && panchang.festivals.length > 0;

        // Insight + Action (personalized)
        const insights = [
          `Your ${activeDasha?.planet || 'Moon'} Dasha brings focus on ${activeProfile.relation || 'self'}-growth.`,
          `Strong ${kundali.lagna?.rashiName || 'Lagna'} energy favors communication and planning.`,
          `Moon in ${kundali.moon?.rashiName || 'Cancer'} supports emotional clarity today.`,
        ];
        const actions = [
          'Start important conversations or sign documents before 2 PM.',
          'Perform a small Lakshmi-Ganesh puja in the evening.',
          'Avoid major financial decisions between 3–5 PM.',
        ];

        results.push({
          date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          dayName: dayName.slice(0, 3),
          lagna: kundali.lagna?.rashiName || 'Mesha',
          moonNakshatra: kundali.moon?.nakshatra?.name || 'Rohini',
          dasha: `${activeDasha?.planet || 'Moon'} Dasha`,
          rahuKaal,
          abhijit,
          auspiciousScore: score,
          keyInsight: insights[i % 3],
          recommendedAction: actions[i % 3],
          color: score >= 80 ? '#10B981' : score >= 60 ? '#D4AF37' : '#EF4444',
          sadeSati: sadeSatiActive,
          kaalSarp: kaalSarpActive,
          hasFestival,
        });
      }

      setPredictions(results);
      setLoading(false);
    };

    generatePredictions();
  }, [activeProfile]);

  const handleAddToCalendar = (pred: DailyPrediction) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:CosmicTantra • ${pred.dayName} ${pred.date}
DESCRIPTION:${pred.keyInsight}\\nRecommended: ${pred.recommendedAction}
DTSTART;VALUE=DATE:${new Date().getFullYear()}${pred.date.split(' ')[0].padStart(2, '0')}${pred.date.split(' ')[1]?.padStart(2, '0') || '01'}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmictantra-${pred.date}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = (pred: DailyPrediction) => {
    const text = `🕉️ CosmicTantra Daily Prediction\n\n${pred.dayName} ${pred.date}\n\nLagna: ${pred.lagna}\nMoon: ${pred.moonNakshatra}\nDasha: ${pred.dasha}\n\nAuspicious Score: ${pred.auspiciousScore}/100\n\nInsight: ${pred.keyInsight}\n\nAction: ${pred.recommendedAction}\n\nhttps://cosmictantra.in/daily`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!activeProfile) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6">🌟</div>
          <h1 className="font-editorial text-4xl font-bold tracking-tight">Create Your Cosmic Profile</h1>
          <p className="mt-4 text-[#57524A]">Get personalized daily Vedic predictions for Today, Tomorrow &amp; Day After.</p>
          <Link href="/profile" className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#D4AF37] text-[#1C1917] font-bold">
            Create Free Profile <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mt-4 text-xs text-[#857E74]">No payment required • DPDP friendly</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <TrustBar />

        <div className="mt-8 flex items-end justify-between">
          <div>
            <div className="uppercase tracking-[3px] text-xs text-[#8E6F1D] font-mono">FREE DAILY VEDIC INTELLIGENCE</div>
            <h1 className="font-editorial text-6xl font-bold tracking-[-2px] mt-1">Your Daily Cosmic Forecast</h1>
            <p className="mt-2 text-lg text-[#57524A]">
              Personalized for <span className="font-semibold text-[#1C1917] dark:text-white">{activeProfile.name}</span> • {activeProfile.cosmicId}
            </p>
          </div>
          <Link href="/family" className="hidden md:flex items-center gap-2 text-sm text-[#8E6F1D] hover:underline">
            <Users className="w-4 h-4" /> Switch Profile
          </Link>
        </div>

        {loading ? (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[420px] rounded-3xl bg-white dark:bg-[#0A0C12] border border-[#D4AF37]/10 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {predictions.map((pred, index) => (
              <DailyCosmicCard
                key={index}
                prediction={pred}
                isToday={index === 0}
                onAddToCalendar={() => handleAddToCalendar(pred)}
                onShareWhatsApp={() => handleShareWhatsApp(pred)}
              />
            ))}
          </div>
        )}

        {/* Retention Hooks */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-[#D4AF37]/10 text-[#8E6F1D] text-xs tracking-widest mb-3">RETENTION ENGINE</div>
          <h3 className="font-semibold text-2xl">Want more?</h3>
          <p className="mt-2 text-[#57524A]">Get 30-day forecasts, WhatsApp morning digest, and family alerts.</p>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            <Link href="/profile" className="px-8 py-3.5 rounded-2xl border border-[#D4AF37]/40 text-sm font-medium hover:bg-white dark:hover:bg-[#11131C]">
              Upgrade to Cosmic ID
            </Link>
            <Link href="/ask" className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] text-sm font-bold">
              Ask a ₹199 Question
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

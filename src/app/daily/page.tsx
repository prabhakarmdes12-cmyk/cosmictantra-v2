'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, Calendar, Clock, Star, AlertTriangle, ShieldCheck, 
  Sparkles, Plus, Share2, Download, Briefcase, Coins, Heart, 
  Activity, Compass, ChevronRight, UserPlus, X
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import DailyCosmicCard from '@/components/visual/DailyCosmicCard';
import WhatsAppShareCard from '@/components/visual/WhatsAppShareCard';
import TrustBar from '@/components/visual/TrustBar';
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics';
import { dispatchKashiJourneyContext } from '@/lib/kashi/journeyContext';
import { 
  getProfiles, saveProfiles, getActiveProfile, setActiveProfileId, upsertProfile, RELATIONS 
} from '@/lib/profileStore.js';
import { 
  getDaily3DayInterpretation, 
  getWeeklyInterpretation, 
  getMonthlyInterpretation, 
  getYearlyInterpretation, 
  getFamilyCollectiveForecast,
  DailyDetail,
  WeeklyForecast,
  MonthlyForecast,
  YearlyForecast,
  FamilyCollectiveForecast
} from '@/lib/interpretationEngine';

type HorizonType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'parivaar';

export default function DailyForecastPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('self');
  const [horizon, setHorizon] = useState<HorizonType>('daily');
  const [loading, setLoading] = useState(true);

  // Horizon Data States
  const [dailyData, setDailyData] = useState<DailyDetail[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyForecast | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyForecast | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyForecast | null>(null);
  const [familyData, setFamilyData] = useState<FamilyCollectiveForecast | null>(null);

  // Modals
  const [showAddMember, setShowAddMember] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [shareCardData, setShareCardData] = useState<any>(null);

  // New Member Form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('Spouse');
  const [newMemberDate, setNewMemberDate] = useState('1996-08-12');
  const [newMemberTime, setNewMemberTime] = useState('14:30');
  const [newMemberCity, setNewMemberCity] = useState('Varanasi');

  // Load Profiles on mount
  useEffect(() => {
    let list = getProfiles();
    if (!list || list.length === 0) {
      const defaultProf = {
        id: 'pf_default',
        name: 'Priya Sharma',
        relation: 'Self',
        cosmicId: 'CT-4821',
        birthDate: '1995-06-15',
        birthTime: '10:30',
        birthCity: 'Patna',
        lat: 25.5941,
        lng: 85.1376,
        tz: 5.5
      };
      const spouseProf = {
        id: 'pf_spouse',
        name: 'Amit Sharma',
        relation: 'Spouse',
        cosmicId: 'CT-4822',
        birthDate: '1992-11-20',
        birthTime: '08:15',
        birthCity: 'Patna',
        lat: 25.5941,
        lng: 85.1376,
        tz: 5.5
      };
      list = [defaultProf, spouseProf];
      saveProfiles(list);
    }
    setProfiles(list);
    const curr = getActiveProfile() || list[0];
    setActiveProfile(curr);
    setSelectedProfileId(curr.id);
  }, []);

  // Sprint C §18/§25 — Today participates in the same product system
  useEffect(() => {
    analytics.track(ANALYTICS_EVENTS.TODAY_VIEW, { route: '/daily', horizon: 'daily', lang: 'en' });
  }, []);

  // Compute forecasts whenever profile or horizon changes
  useEffect(() => {
    if (!activeProfile && selectedProfileId !== 'parivaar') return;
    setLoading(true);

    const now = new Date();
    const city = {
      lat: activeProfile?.lat ?? 25.5941,
      lng: activeProfile?.lng ?? 85.1376,
      tz: activeProfile?.tz ?? 5.5,
      name: activeProfile?.birthCity || 'Patna'
    };

    if (horizon === 'daily') {
      const d = getDaily3DayInterpretation(activeProfile, now, city);
      setDailyData(d);
    } else if (horizon === 'weekly') {
      const w = getWeeklyInterpretation(activeProfile, now, city);
      setWeeklyData(w);
    } else if (horizon === 'monthly') {
      const m = getMonthlyInterpretation(activeProfile, now, city);
      setMonthlyData(m);
    } else if (horizon === 'yearly') {
      const y = getYearlyInterpretation(activeProfile, now, city);
      setYearlyData(y);
    } else if (horizon === 'parivaar') {
      const f = getFamilyCollectiveForecast(profiles, now, city);
      setFamilyData(f);
    }

    setLoading(false);
  }, [activeProfile, selectedProfileId, horizon, profiles]);

  const handleSelectProfile = (pId: string) => {
    if (pId === 'parivaar') {
      setSelectedProfileId('parivaar');
      setHorizon('parivaar');
      return;
    }
    const found = profiles.find(p => p.id === pId) || profiles[0];
    setActiveProfile(found);
    setActiveProfileId(found.id);
    setSelectedProfileId(found.id);
    if (horizon === 'parivaar') setHorizon('daily');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newProf = upsertProfile({
      name: newMemberName,
      relation: newMemberRelation,
      cosmicId: `CT-${Math.floor(1000 + Math.random() * 8999)}`,
      birthDate: newMemberDate,
      birthTime: newMemberTime,
      birthCity: newMemberCity,
      lat: 25.5941,
      lng: 85.1376,
      tz: 5.5
    });

    const updated = getProfiles();
    setProfiles(updated);
    setActiveProfile(newProf);
    setSelectedProfileId(newProf.id);
    setShowAddMember(false);
    setNewMemberName('');
  };

  const openShareCard = (pred: DailyDetail) => {
    setShareCardData({
      name: activeProfile?.name || 'Vedic Seeker',
      cosmicId: activeProfile?.cosmicId || 'CT-4821',
      date: pred.dateStr,
      dayName: pred.dayLabel,
      lagna: pred.rashiTransit,
      moonNakshatra: pred.panchangData.nakshatra,
      dasha: activeProfile?.dasha || 'Moon-Jupiter',
      auspiciousScore: pred.score,
      keyInsight: pred.theme,
      action: pred.sankalpa.ritual,
    });
    setShowShareCard(true);
  };

  return (
    <CosmicTantraShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <TrustBar />

        {/* Hero Header */}
        <div className="mt-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
          <div>
            <div className="uppercase tracking-[3px] text-xs text-[#8E6F1D] dark:text-[#F0C968] font-mono-data font-bold">
              वेदिक काल-चक्र • PARIVAAR INTELLIGENCE & FORECAST
            </div>
            <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-white mt-1 tracking-tight">
              {horizon === 'daily' ? '72-Hour Vedic Forecast (आज • कल • परसों)' :
               horizon === 'weekly' ? 'Weekly Transit Trajectory (7 Days)' :
               horizon === 'monthly' ? 'Monthly Ingress & Solar Chapter' :
               horizon === 'yearly' ? 'Annual Varshaphal & Life Chapter' :
               'Family Panchang & Collective Intelligence'}
            </h1>
            <p className="text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] mt-1">
              Active Member: <span className="font-bold text-[#1C1917] dark:text-white">{activeProfile?.name}</span> ({activeProfile?.relation || 'Self'}) • {activeProfile?.birthCity || 'Patna'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              data-testid="ask-about-today"
              onClick={() => {
                dispatchKashiJourneyContext({
                  contractVersion: 'kashi-journey-context-v1',
                  route: '/daily',
                  language: 'en',
                  question: 'What should I know about today?',
                  source: 'CONVERSION_JOURNEY',
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8E6F1D] hover:bg-[#785E18] text-white text-xs font-mono-data font-bold transition-all shadow-xs min-h-11"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ASK ABOUT TODAY</span>
            </button>
            <button
              onClick={() => setShowAddMember(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] transition-all bg-white/70 dark:bg-white/5 shadow-xs min-h-11"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
              <span>+ Add Family Member</span>
            </button>
          </div>
        </div>

        {/* 1. Family Profile Switcher Bar */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {profiles.map((p) => {
            const isSelected = selectedProfileId === p.id && horizon !== 'parivaar';
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProfile(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono-data transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#8E6F1D] dark:border-[#D4AF37] font-bold shadow-md'
                    : 'bg-white dark:bg-[#0E101D] text-[#57524A] dark:text-[#B3ADA3] border-black/10 dark:border-white/10 hover:border-[#8E6F1D]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{p.name}</span>
                <span className="opacity-75 text-[10px]">({p.relation || 'Self'})</span>
              </button>
            );
          })}

          {/* Collective Parivaar Button */}
          <button
            onClick={() => handleSelectProfile('parivaar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-mono-data transition-all shrink-0 border ${
              horizon === 'parivaar'
                ? 'bg-[#065F46] dark:bg-[#10B981] text-white font-bold border-[#065F46] shadow-md'
                : 'bg-white dark:bg-[#0E101D] text-[#065F46] dark:text-[#10B981] border-emerald-500/30 hover:border-emerald-500'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>👨‍👩‍👧‍👦 Whole Parivaar View</span>
          </button>
        </div>

        {/* 2. Time Horizon Tabs Bar */}
        <div className="mt-6 p-1 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/[0.08] dark:border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs font-mono-data font-bold">
          <button
            onClick={() => setHorizon('daily')}
            className={`py-2.5 px-3 rounded-xl transition-all ${
              horizon === 'daily'
                ? 'bg-white dark:bg-[#121528] text-[#8E6F1D] dark:text-[#F0C968] shadow-sm border border-black/5 dark:border-white/10'
                : 'text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white'
            }`}
          >
            📅 Daily (72 Hours)
          </button>
          <button
            onClick={() => setHorizon('weekly')}
            className={`py-2.5 px-3 rounded-xl transition-all ${
              horizon === 'weekly'
                ? 'bg-white dark:bg-[#121528] text-[#8E6F1D] dark:text-[#F0C968] shadow-sm border border-black/5 dark:border-white/10'
                : 'text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white'
            }`}
          >
            🗓️ Weekly (7 Days)
          </button>
          <button
            onClick={() => setHorizon('monthly')}
            className={`py-2.5 px-3 rounded-xl transition-all ${
              horizon === 'monthly'
                ? 'bg-white dark:bg-[#121528] text-[#8E6F1D] dark:text-[#F0C968] shadow-sm border border-black/5 dark:border-white/10'
                : 'text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white'
            }`}
          >
            🌕 Monthly (30 Days)
          </button>
          <button
            onClick={() => setHorizon('yearly')}
            className={`py-2.5 px-3 rounded-xl transition-all ${
              horizon === 'yearly'
                ? 'bg-white dark:bg-[#121528] text-[#8E6F1D] dark:text-[#F0C968] shadow-sm border border-black/5 dark:border-white/10'
                : 'text-[#696256] dark:text-[#9E988D] hover:text-[#1C1917] dark:hover:text-white'
            }`}
          >
            🌟 Yearly (Varshaphal)
          </button>
        </div>

        {/* === VIEW 1: DAILY (72 HOURS) === */}
        {horizon === 'daily' && (
          <div className="mt-8 space-y-8">
            <div className="grid lg:grid-cols-3 gap-6">
              {dailyData.map((detail, idx) => (
                <DailyCosmicCard
                  key={idx}
                  prediction={detail}
                  isToday={idx === 0}
                  onShareCard={() => openShareCard(detail)}
                />
              ))}
            </div>
          </div>
        )}

        {/* === VIEW 2: WEEKLY (7 DAYS) === */}
        {horizon === 'weekly' && weeklyData && (
          <div className="mt-8 space-y-8">
            {/* Weekly Header Banner */}
            <div className="bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 dark:border-white/10 pb-6">
                <div>
                  <div className="text-xs font-mono-data uppercase tracking-[2px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                    साप्ताहिक सारांश • {weeklyData.startDate} – {weeklyData.endDate}
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-1">
                    {weeklyData.weekTheme}
                  </h2>
                </div>
                <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-center">
                  <div className="text-[10px] font-mono-data font-bold text-[#065F46] dark:text-[#10B981]">WEEKLY AUSPICIOUSNESS</div>
                  <div className="text-3xl font-bold font-mono-data text-[#065F46] dark:text-[#10B981]">{weeklyData.overallScore} / 100</div>
                </div>
              </div>

              {/* Peak vs Rest Days */}
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                  <div className="text-xs font-mono-data font-bold text-[#065F46] dark:text-[#10B981] mb-1">
                    🟢 PEAK EXECUTION DAY: {weeklyData.peakExecutionDay.day} ({weeklyData.peakExecutionDay.date})
                  </div>
                  <p className="text-xs font-mono-data text-[#065F46] dark:text-[#34D399]">
                    {weeklyData.peakExecutionDay.reason}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25">
                  <div className="text-xs font-mono-data font-bold text-rose-800 dark:text-rose-300 mb-1">
                    🔴 CAUTION / REST DAY: {weeklyData.cautionRestDay.day} ({weeklyData.cautionRestDay.date})
                  </div>
                  <p className="text-xs font-mono-data text-rose-700 dark:text-rose-400">
                    {weeklyData.cautionRestDay.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* 7-Day Matrix */}
            <div className="grid sm:grid-cols-7 gap-3">
              {weeklyData.days.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border text-center font-mono-data transition-all ${
                    day.status === 'peak' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    day.status === 'caution' ? 'bg-rose-500/10 border-rose-500/30' :
                    'bg-white dark:bg-[#0E101D] border-black/10 dark:border-white/10'
                  }`}
                >
                  <div className="text-xs text-[#696256] dark:text-[#9E988D] uppercase font-bold">{day.day}</div>
                  <div className="text-lg font-bold text-[#1C1917] dark:text-white mt-0.5">{day.date}</div>
                  <div className="text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] mt-2">{day.moonRashi}</div>
                  <div className="text-xl font-bold tabular-nums mt-1">{day.score}</div>
                  <div className="text-[10px] text-[#57524A] dark:text-[#B3ADA3] mt-2 line-clamp-2">{day.highlight}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === VIEW 3: MONTHLY (30 DAYS) === */}
        {horizon === 'monthly' && monthlyData && (
          <div className="mt-8 space-y-8">
            <div className="bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="text-xs font-mono-data uppercase tracking-[2px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                मासिक संक्रान्ति व गोचर • {monthlyData.monthName} {monthlyData.year}
              </div>
              <h2 className="font-editorial text-3xl font-bold text-[#1C1917] dark:text-white mt-1">
                {monthlyData.activatedBhava.title}
              </h2>
              <p className="mt-3 text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF] leading-relaxed">
                {monthlyData.activatedBhava.interpretation}
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 font-bold text-xs font-mono-data text-[#065F46] dark:text-[#10B981] mb-1">
                    <Coins className="w-4 h-4" />
                    <span>BEST ARTHA (FINANCIAL) WINDOW: {monthlyData.arthaWindow.period}</span>
                  </div>
                  <p className="text-xs font-mono-data text-[#57524A] dark:text-[#B3ADA3]">
                    {monthlyData.arthaWindow.recommendation}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2 font-bold text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] mb-1">
                    <Heart className="w-4 h-4" />
                    <span>SAMBANDH (FAMILY HARMONY) WINDOW: {monthlyData.sambandhWindow.period}</span>
                  </div>
                  <p className="text-xs font-mono-data text-[#57524A] dark:text-[#B3ADA3]">
                    {monthlyData.sambandhWindow.recommendation}
                  </p>
                </div>
              </div>

              {/* Monthly Upaya */}
              <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968]">
                <strong>📿 MONTHLY DISCIPLINE & UPAYA: </strong>{monthlyData.monthlyUpaya}
              </div>
            </div>
          </div>
        )}

        {/* === VIEW 4: YEARLY (VARSHAPHAL) === */}
        {horizon === 'yearly' && yearlyData && (
          <div className="mt-8 space-y-8">
            <div className="bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="text-xs font-mono-data uppercase tracking-[2px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                वार्षिक वर्षफल • TAJIKA ANNUAL SOLAR RETURN {yearlyData.year}
              </div>
              <h2 className="font-editorial text-3xl font-bold text-[#1C1917] dark:text-white mt-1">
                {yearlyData.yearTheme}
              </h2>
              <div className="text-xs font-mono-data text-[#696256] dark:text-[#9E988D] mt-1">
                Varsheshwar: <strong className="text-[#1C1917] dark:text-white">{yearlyData.varsheshwar}</strong> • Muntha in <strong>House {yearlyData.munthaHouse}</strong>
              </div>

              {/* Major Transits Grid */}
              <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-black/10 dark:border-white/10 text-xs font-mono-data">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5">
                  <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968] mb-1">GURU (JUPITER) 1-YR INGRESS</div>
                  <p className="text-[#57524A] dark:text-[#B3ADA3]">{yearlyData.jupiterTransit.effect}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5">
                  <div className="font-bold text-[#1C1917] dark:text-white mb-1">SHANI (SATURN) 2.5-YR TRANSIT</div>
                  <p className="text-[#57524A] dark:text-[#B3ADA3]">{yearlyData.saturnTransit.mitigation}</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5">
                  <div className="font-bold text-blue-600 dark:text-blue-400 mb-1">RAHU-KETU 18-MO AXIS</div>
                  <p className="text-[#57524A] dark:text-[#B3ADA3]">{yearlyData.rahuKetuAxis.karmicLesson}</p>
                </div>
              </div>

              {/* 4 Quarters Roadmap */}
              <div className="mt-8 space-y-3">
                <div className="text-xs font-mono-data font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#D4AF37]">
                  4-QUARTER LIFE CHAPTER ROADMAP
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {yearlyData.quarters.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#121528] text-xs font-mono-data">
                      <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">{q.quarter}</div>
                      <div className="text-[10px] text-[#696256] dark:text-[#9E988D]">{q.months}</div>
                      <div className="font-bold text-[#1C1917] dark:text-white mt-2">{q.title}</div>
                      <p className="text-[11px] text-[#57524A] dark:text-[#B3ADA3] mt-1">{q.focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === VIEW 5: WHOLE PARIVAAR VIEW === */}
        {horizon === 'parivaar' && familyData && (
          <div className="mt-8 space-y-8">
            {/* Collective Score Banner */}
            <div className="bg-white dark:bg-[#0E101D] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 dark:border-white/10 pb-6">
                <div>
                  <div className="text-xs font-mono-data uppercase tracking-[2px] text-[#065F46] dark:text-[#10B981] font-bold">
                    पारिवारिक समन्वय • COLLECTIVE FAMILY HARMONY
                  </div>
                  <h2 className="font-editorial text-3xl font-bold text-[#1C1917] dark:text-white mt-1">
                    Whole Parivaar Daily Synthesis
                  </h2>
                  <p className="text-xs font-mono-data text-[#57524A] dark:text-[#B3ADA3] mt-1">
                    Synchronized for {familyData.membersDaily.length} Household Members
                  </p>
                </div>

                <div className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-[10px] font-mono-data font-bold text-[#065F46] dark:text-[#10B981]">FAMILY AUSPICIOUSNESS</div>
                  <div className="text-3xl font-bold font-mono-data text-[#065F46] dark:text-[#10B981]">{familyData.collectiveScore} / 100</div>
                </div>
              </div>

              <p className="mt-4 text-sm font-mono-data text-[#1C1917] dark:text-white leading-relaxed">
                {familyData.summary}
              </p>

              {/* Protective Alerts for Members */}
              {familyData.protectionAlerts.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">
                    🛡️ PARIVAAR PROTECTION REMINDERS ({familyData.protectionAlerts.length})
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {familyData.protectionAlerts.map((alt, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono-data">
                        <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                          {alt.memberName} ({alt.relation}): {alt.alertType}
                        </div>
                        <p className="text-[#57524A] dark:text-[#D1C9BF] mt-1">{alt.message}</p>
                        <div className="mt-2 text-[11px] text-[#065F46] dark:text-[#10B981] font-bold">
                          ✓ Suggested Care: {alt.mitigation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Members Quick Status */}
              <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                <div className="text-xs font-mono-data font-bold uppercase tracking-wider text-[#696256] dark:text-[#9E988D] mb-3">
                  MEMBER TRANSIT CARDS
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {familyData.membersDaily.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-[#FAF7F2] dark:bg-[#070912] font-mono-data text-xs">
                      <div className="flex justify-between items-center">
                        <strong className="text-[#1C1917] dark:text-white">{m.name}</strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 font-bold">{m.relation}</span>
                      </div>
                      <div className="text-[11px] text-[#8E6F1D] dark:text-[#F0C968] mt-1">Moon in {m.rashi} • Score {m.score}/100</div>
                      <p className="text-[11px] text-[#57524A] dark:text-[#B3ADA3] mt-2 line-clamp-2">{m.highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9:16 WhatsApp Share Modal */}
        {showShareCard && shareCardData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setShowShareCard(false)}>
            <div onClick={e => e.stopPropagation()}>
              <WhatsAppShareCard {...shareCardData} onDownload={() => {
                alert('9:16 card downloaded');
                setShowShareCard(false);
              }} />
            </div>
          </div>
        )}

        {/* Add Family Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowAddMember(false)}>
            <div className="bg-white dark:bg-[#0E101D] rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowAddMember(false)} 
                className="absolute top-5 right-5 p-1 rounded-full text-[#696256] hover:text-[#1C1917] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-xs font-mono-data uppercase tracking-[2px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                PARIVAAR DIRECTORY
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-white mt-1">
                Add Family Member
              </h2>

              <form onSubmit={handleAddMember} className="mt-6 space-y-4 text-xs font-mono-data">
                <div>
                  <label className="block text-[#696256] dark:text-[#9E988D] mb-1 font-bold">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full p-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#FAF7F2] dark:bg-[#070912] text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#696256] dark:text-[#9E988D] mb-1 font-bold">Relationship</label>
                    <select
                      value={newMemberRelation}
                      onChange={e => setNewMemberRelation(e.target.value)}
                      className="w-full p-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#FAF7F2] dark:bg-[#070912] text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
                    >
                      {RELATIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#696256] dark:text-[#9E988D] mb-1 font-bold">Birth City</label>
                    <input
                      type="text"
                      required
                      value={newMemberCity}
                      onChange={e => setNewMemberCity(e.target.value)}
                      className="w-full p-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#FAF7F2] dark:bg-[#070912] text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#696256] dark:text-[#9E988D] mb-1 font-bold">Birth Date</label>
                    <input
                      type="date"
                      required
                      value={newMemberDate}
                      onChange={e => setNewMemberDate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#FAF7F2] dark:bg-[#070912] text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#696256] dark:text-[#9E988D] mb-1 font-bold">Birth Time</label>
                    <input
                      type="time"
                      required
                      value={newMemberTime}
                      onChange={e => setNewMemberTime(e.target.value)}
                      className="w-full p-3 rounded-xl border border-black/15 dark:border-white/15 bg-[#FAF7F2] dark:bg-[#070912] text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-bold hover:bg-[#A35C15] dark:hover:bg-[#E5C378] transition-all shadow-md mt-4"
                >
                  Save to Family Directory →
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </CosmicTantraShell>
  );
}

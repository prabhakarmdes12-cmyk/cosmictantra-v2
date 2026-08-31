'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Star, Bell, Flame, Plus, Trash2, RefreshCw, Gift, CalendarDays } from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';
import { getActiveProfile } from '@/lib/profileStore';
import {
  todayISO,
  daysBetween,
  loadRemedies,
  saveRemedies,
  seedRemediesIfEmpty,
  REMEDY_TEMPLATES,
  loadJapaLog,
  logJapa,
  japaTotals,
  loadReminder,
  saveReminder,
  clearReminder,
  loadReminderFiredDate,
  saveReminderFiredDate,
} from '@/lib/remedyStore';

interface Remedy {
  id: string;
  name: string;
  type: string;
  mantra?: string;
  japaTarget?: number;
  startDate: string; // ISO
  durationDays: number; // 11 / 21 / 40 / 108
  daysObserved: string[]; // ISO dates the devotee marked as done
}

const TYPE_ICON: Record<string, string> = {
  Gemstone: '💎', Pooja: '🪔', Rudraksha: '📿', 'Mantra Japa': '🔱',
  Daan: '🎁', Vrat: '🌙', Other: '✨',
};

export default function RemedyTracker() {
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [japaLog, setJapaLog] = useState<Record<string, number>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reminder, setReminder] = useState<{ time: string } | null>(null);
  const [reminderTime, setReminderTime] = useState('18:30');
  const [notificationGranted, setNotificationGranted] = useState(false);

  // Devotee name (privacy: local profile only, never sent anywhere).
  const devoteeName = useMemo(() => {
    try { return getActiveProfile()?.name || ''; } catch { return ''; }
  }, []);

  /* ---------------- hydration from localStorage ---------------- */
  useEffect(() => {
    const seeded = seedRemediesIfEmpty();
    setRemedies(seeded);
    setJapaLog(loadJapaLog());
    setReminder(loadReminder());
    setReminderTime(loadReminder()?.time ?? '18:30');
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setNotificationGranted(true);
    }
    setHydrated(true);
  }, []);

  const persist = (next: Remedy[]) => { setRemedies(next); saveRemedies(next); };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  /* ---------------- derived: Sankalpa state per remedy ---------------- */
  const derived = useMemo(() => {
    const today = todayISO();
    return remedies.map((r) => {
      const dayIndex = Math.max(1, daysBetween(r.startDate, today) + 1);
      const autoCompleted = dayIndex > r.durationDays;
      const observed = r.daysObserved.filter((d) => daysBetween(r.startDate, d) >= 0).length;
      const progress = autoCompleted ? 100 : Math.min(100, Math.round((observed / r.durationDays) * 100));
      const daysLeft = autoCompleted ? 0 : Math.max(0, r.durationDays - dayIndex + 1);
      const doneToday = r.daysObserved.includes(today);
      return { ...r, dayIndex, autoCompleted, observed, progress, daysLeft, doneToday };
    });
  }, [remedies]);

  const activeCount = derived.filter((r) => !r.autoCompleted).length;
  const todayObserved = derived.filter((r) => r.doneToday).length;
  const totals = useMemo(() => japaTotals(), [japaLog]);

  /* ---------------- actions ---------------- */

  const markToday = (id: string) => {
    const today = todayISO();
    const next = remedies.map((r) => {
      if (r.id !== id) return r;
      if (r.daysObserved.includes(today)) return r;
      return { ...r, daysObserved: [...r.daysObserved, today] };
    });
    persist(next);
    const wasCompleted = derived.find((r) => r.id === id)?.autoCompleted;
    chitiSensory.playTick();
    if (!wasCompleted) {
      const done = next.find((r) => r.id === id)!.daysObserved.length;
      const totalDays = next.find((r) => r.id === id)!.durationDays;
      if (done >= totalDays) {
        chitiSensory.playSacredGong();
        showToast('🕉️ संकल्प पूर्ण — 40-day Sankalpa completed! 🙏');
      } else {
        showToast(`✓ Today's observance recorded (Day ${Math.min(done, totalDays)} of ${totalDays})`);
      }
    }
  };

  const addJapa = (amount: number) => {
    const log = logJapa(amount);
    setJapaLog(log);
    chitiSensory.playTick();
    const today = todayISO();
    if ((log[today] ?? 0) >= 108 && (log[today] ?? 0) - amount < 108) {
      chitiSensory.playBell();
      showToast('🔱 108 माला पूर्ण — 108 mantras completed today!');
    }
  };

  const addRemedy = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Remedy = {
      id: `r-${Date.now()}`,
      name: String(fd.get('name') || 'Remedy'),
      type: String(fd.get('type') || 'Other'),
      mantra: String(fd.get('mantra') || '').trim() || undefined,
      japaTarget: Number(fd.get('japaTarget')) || undefined,
      startDate: todayISO(),
      durationDays: Number(fd.get('durationDays')) || 40,
      daysObserved: [],
    };
    persist([...remedies, next]);
    setShowAdd(false);
    chitiSensory.playTick();
    showToast(`✨ Sankalpa begun — ${next.name} (Day 1 of ${next.durationDays})`);
  };

  const removeRemedy = (id: string) => {
    persist(remedies.filter((r) => r.id !== id));
    chitiSensory.playTick();
  };

  const resetToTemplates = () => {
    const seeded = REMEDY_TEMPLATES.map((t) => ({ ...t, startDate: todayISO(), daysObserved: [] }));
    persist(seeded);
    chitiSensory.playTick();
    showToast('Demo observances restored');
  };

  /* ---------------- Sandhya reminder (honest: fires while open) ---------------- */

  const enableReminder = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      setNotificationGranted(p === 'granted');
    }
    saveReminder({ time: reminderTime });
    setReminder({ time: reminderTime });
    chitiSensory.playTick();
    showToast(`🔔 Sandhya reminder set for ${reminderTime} (daily while CosmicTantra is open)`);
  };

  const disableReminder = () => {
    clearReminder();
    setReminder(null);
    chitiSensory.playTick();
    showToast('Reminder disabled');
  };

  useEffect(() => {
    if (!reminder) return;
    const check = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      if (`${hh}:${mm}` === reminder.time && loadReminderFiredDate() !== todayISO()) {
        saveReminderFiredDate(todayISO());
        chitiSensory.playBell();
        if (notificationGranted) {
          try {
            new Notification('🕉️ Sandhya Reminder — CosmicTantra', {
              body: 'अपने आज के संकल्प का पालन करें — complete today\'s mantra japa / observance.',
            });
          } catch {}
        }
        showToast('🔔 Sandhya — time for today\'s japa & observance');
      }
    };
    check();
    const t = setInterval(check, 20000);
    return () => clearInterval(t);
  }, [reminder, notificationGranted]);

  /* ---------------- render ---------------- */
  if (!hydrated) {
    return (
      <CosmicTantraShell>
        <div className="py-20 text-center text-sm font-mono-data text-[#8E6F1D] dark:text-[#F0C968]">
          साधना ट्रैकर लोड हो रहा है…
        </div>
      </CosmicTantraShell>
    );
  }

  const weekMax = Math.max(...totals.week.map((w) => w.count), 1);

  return (
    <CosmicTantraShell>
      <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-xs font-mono-data uppercase tracking-[3px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
            साधना व उपाय अनुष्ठान • REMEDY COMPLIANCE
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-2 tracking-tight">
            Planetary Remedy Tracker
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
            {devoteeName
              ? `${devoteeName} जी — track your 40-day Sankalpa observances, daily mantra japa streaks, and remedy compliance.`
              : 'Track your 40-day Sankalpa observances, daily mantra japa streaks, and remedy compliance.'}
          </p>
          <p className="mt-1 text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
            All data stays on your device — private, no account needed.
          </p>
        </div>

        {/* ================= Compliance summary ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D] p-4 text-center">
            <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">Active Sankalpas</div>
            <div className="text-2xl font-bold text-[#1C1917] dark:text-white mt-1">{activeCount}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-white dark:bg-[#0E101D] p-4 text-center">
            <div className="text-[10px] font-mono-data uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold">Today&apos;s Observance</div>
            <div className="text-2xl font-bold text-[#1C1917] dark:text-white mt-1">
              {todayObserved}/{activeCount || '—'}
            </div>
          </div>
          <div className="rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D] p-4 text-center">
            <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold flex items-center justify-center gap-1">
              <Flame className="w-3 h-3" /> Japa Streak
            </div>
            <div className="text-2xl font-bold text-[#1C1917] dark:text-white mt-1">
              {totals.streak} <span className="text-sm font-semibold text-[#78716C] dark:text-[#A8A29E]">day{totals.streak === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D] p-4 text-center">
            <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">Total Mantras</div>
            <div className="text-2xl font-bold text-[#1C1917] dark:text-white mt-1">{totals.total.toLocaleString('en-IN')}</div>
          </div>
        </div>

        {/* ================= Japa streak card ================= */}
        <div className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 mb-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-editorial font-bold text-lg sm:text-xl text-[#1C1917] dark:text-white">
                🔱 Daily Mantra Japa
              </h2>
              <p className="text-xs font-mono-data text-[#696256] dark:text-[#9E988D] mt-0.5">
                Each tap counts one mantra — logged automatically with darshan page japa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => addJapa(1)}
                className="px-5 py-2.5 text-xs font-mono-data font-bold rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:opacity-90 transition-all shadow-sm cursor-pointer"
              >
                +1 मंत्र
              </button>
              <button
                onClick={() => addJapa(108)}
                className="px-5 py-2.5 text-xs font-mono-data font-bold rounded-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D]/10 transition-all cursor-pointer"
              >
                +108 (माला)
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6">
            {/* last-7-days bars */}
            <div>
              <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold mb-2">
                Last 7 days
              </div>
              <div className="flex items-end gap-2 h-20">
                {totals.week.map((w) => (
                  <div key={w.date} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md bg-gradient-to-t from-[#8E6F1D]/70 to-[#D4AF37] transition-all"
                      style={{ height: `${Math.max(4, Math.round((w.count / weekMax) * 64))}px`, opacity: w.count ? 1 : 0.15 }} />
                    <span className="text-[8px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                      {w.date.slice(5)} {w.count > 0 ? `·${w.count}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* streak detail */}
            <div className="sm:text-right">
              <div className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold">Streak</div>
              <div className="text-3xl font-bold text-[#1C1917] dark:text-white mt-1">
                {totals.streak} <span className="text-sm text-[#78716C] dark:text-[#A8A29E]">day{totals.streak === 1 ? '' : 's'}</span>
              </div>
              <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-1">Best: {totals.best} days</div>
            </div>
          </div>
        </div>

        {/* ================= Sankalpa list ================= */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-editorial font-bold text-lg sm:text-xl text-[#1C1917] dark:text-white">
            🪔 Active Sankalpa Observances
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 text-xs font-mono-data font-bold rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Sankalpa
            </button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={addRemedy} className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-5 mb-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input name="name" required placeholder="Remedy name (e.g. Hanuman Chalisa)" className="px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs font-semibold focus:outline-none focus:border-[#8E6F1D]" />
              <select name="type" className="px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs font-semibold focus:outline-none">
                {['Mantra Japa', 'Pooja', 'Vrat', 'Gemstone', 'Rudraksha', 'Daan', 'Other'].map((t) => <option key={t}>{t}</option>)}
              </select>
              <input name="mantra" placeholder="Mantra (optional)" className="px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs font-semibold focus:outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <select name="durationDays" className="px-2 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs font-semibold focus:outline-none">
                  {[11, 21, 40, 108].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
                <input name="japaTarget" type="number" placeholder="Japa/day" className="px-2 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs font-semibold focus:outline-none" />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-mono-data font-bold rounded-xl border border-black/15 dark:border-white/15 cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 text-xs font-mono-data font-bold rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] cursor-pointer">Begin Sankalpa →</button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {derived.map((remedy) => (
            <div
              key={remedy.id}
              className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 sm:p-7 shadow-md transition-all"
            >
              <div className="flex justify-between items-start gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                <div>
                  <h3 className="font-editorial font-bold text-lg sm:text-xl text-[#1C1917] dark:text-white flex items-center gap-2">
                    <span>{TYPE_ICON[remedy.type] ?? '✨'}</span> {remedy.name}
                  </h3>
                  <div className="text-xs font-mono-data text-[#8E6F1D] dark:text-[#F0C968] mt-1 font-semibold flex flex-wrap items-center gap-x-2">
                    <span>{remedy.type}</span>
                    {remedy.mantra && <span className="text-[#57524A] dark:text-[#9E988D]">• {remedy.mantra}</span>}
                    {remedy.japaTarget && <span>• {remedy.japaTarget}/day</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {remedy.autoCompleted ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-mono-data font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      ✓ Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[11px] font-mono-data font-bold bg-[#8E6F1D]/15 text-[#8E6F1D] dark:text-[#F0C968]">
                      Day {Math.min(remedy.dayIndex, remedy.durationDays)} / {remedy.durationDays}
                    </span>
                  )}
                  <button
                    onClick={() => removeRemedy(remedy.id)}
                    aria-label={`Remove ${remedy.name}`}
                    className="p-1.5 rounded-lg text-[#A8A29E] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex justify-between text-xs font-mono-data mb-2">
                  <span className="text-[#696256] dark:text-[#9E988D]">
                    {remedy.autoCompleted
                      ? 'Sankalpa fulfilled'
                      : `${remedy.daysLeft} day${remedy.daysLeft === 1 ? '' : 's'} remaining · ${remedy.observed} of ${remedy.durationDays} days observed`}
                  </span>
                  <span className="font-bold text-[#1C1917] dark:text-white">{remedy.progress}%</span>
                </div>
                <div className="h-2.5 bg-[#FAF7F2] dark:bg-[#070912] rounded-full overflow-hidden border border-black/5 dark:border-white/5">
                  <div
                    className={`h-full rounded-full transition-all ${remedy.autoCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37]'}`}
                    style={{ width: `${remedy.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => markToday(remedy.id)}
                  disabled={remedy.doneToday || remedy.autoCompleted}
                  className={`px-5 py-2.5 text-xs font-mono-data font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-default ${
                    remedy.doneToday
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:opacity-90'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {remedy.doneToday ? '✓ Today recorded' : `Mark today's observance`}
                </button>
                {remedy.mantra && (
                  <button
                    onClick={() => addJapa(1)}
                    className="px-4 py-2.5 text-xs font-mono-data font-bold rounded-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D]/10 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    📿 Recite one mantra
                  </button>
                )}
              </div>
            </div>
          ))}

          {derived.length === 0 && (
            <div className="text-center py-10 bg-white dark:bg-[#0E101D] rounded-3xl border border-dashed border-[#8E6F1D]/40 p-8">
              <p className="text-sm font-mono-data text-[#696256] dark:text-[#9E988D]">No observances yet.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 px-5 py-2.5 text-xs font-mono-data font-bold rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] cursor-pointer"
              >
                Begin your first Sankalpa
              </button>
            </div>
          )}
        </div>

        {/* ================= Sandhya reminder ================= */}
        <div className="mt-8 bg-gradient-to-r from-[#FAF6EF] to-white dark:from-[#121526] dark:to-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial font-bold text-base sm:text-lg text-[#1C1917] dark:text-white">
                  Sandhya Reminder
                </h3>
                <p className="text-[10px] font-mono-data text-[#696256] dark:text-[#9E988D]">
                  {reminder
                    ? `Daily at ${reminder.time} while CosmicTantra is open${notificationGranted ? ' — browser notification enabled' : ' — chime in-page'}.`
                    : 'A gentle bell at your chosen evening hour for today\'s japa & observance.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#070912] border border-black/15 dark:border-white/15 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
              />
              {reminder ? (
                <button
                  onClick={disableReminder}
                  className="px-4 py-2.5 text-xs font-mono-data font-bold rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={enableReminder}
                  className="px-4 py-2.5 text-xs font-mono-data font-bold rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:opacity-90 transition-all cursor-pointer"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ================= toast ================= */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-xs font-mono-data font-bold shadow-xl animate-in fade-in">
            {toast}
          </div>
        )}
      </div>
    </CosmicTantraShell>
  );
}

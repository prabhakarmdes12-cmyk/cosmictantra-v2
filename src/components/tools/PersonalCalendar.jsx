'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, ChevronLeft, ChevronRight, AlertTriangle, Sparkles, Info } from 'lucide-react';
import { getProfiles, getActiveProfileId } from '../../lib/profileStore';
import { getMonthAlerts } from '../../lib/vedicAlerts';
import { chitiSensory } from '../../lib/chitiAudio';

export default function PersonalCalendar({ lang = 'en' }) {
  const hi = lang === 'hi';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [days, setDays] = useState({});

  useEffect(() => {
    setProfiles(getProfiles());
    setActiveId(getActiveProfileId());
  }, []);

  const profile = useMemo(() => profiles.find(p => p.id === activeId) || profiles[0] || null, [profiles, activeId]);

  // Month alerts when profile or month changes
  useEffect(() => {
    if (!profile) { setDays({}); return; }
    try {
      const list = getMonthAlerts(profile, year, month);
      const map = {};
      list.forEach(d => { map[d.date] = d; });
      setDays(map);
    } catch (err) {
      console.error('Calendar alerts error:', err);
      setDays({});
    }
  }, [profile, year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const numDays = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= numDays; d++) cells.push(d);

  const monthName = new Date(year, month, 1).toLocaleDateString(hi ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' });

  const icsUrl = profile
    ? `/api/vedic-calendar/export?name=${encodeURIComponent(profile.name)}&birthDate=${encodeURIComponent(profile.birthDate)}&birthTime=${encodeURIComponent(profile.birthTime || '12:00')}&lat=${profile.lat ?? 25.5941}&lng=${profile.lng ?? 85.1376}&tz=${profile.tz ?? 5.5}&birthCity=${encodeURIComponent(profile.birthCity || 'Patna')}&days=90`
    : null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayInfo = days[todayKey];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-[#8E6F1D] dark:text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold">
            <CalendarDays className="w-4 h-4" />
            {hi ? 'वैदिक पंचांग-कैलेंडर' : 'Personal Vedic Calendar'}
            {profile && <span className="text-[#4848A8] dark:text-[#8B8BF5] ml-1">· {profile.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { chitiSensory.playTick(); if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}
              className="p-2 rounded-lg border border-black/[0.08] dark:border-white/[0.1] text-[#57524A] dark:text-[#AAA49A]"><ChevronLeft className="w-4 h-4" /></button>
            <span className="font-mono-data text-sm font-bold text-[#1C1917] dark:text-[#EFECE6] min-w-[130px] text-center">{monthName}</span>
            <button onClick={() => { chitiSensory.playTick(); if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}
              className="p-2 rounded-lg border border-black/[0.08] dark:border-white/[0.1] text-[#57524A] dark:text-[#AAA49A]"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        {!profile ? (
          <div className="text-center py-12 text-[#9A958C] dark:text-[#5A5750] text-xs">
            {hi ? 'पहले /family पृष्ठ पर प्रोफाइल सहेजें — फिर यहाँ व्यक्तिगत अलर्ट दिखेंगे।' : 'Save a profile on the Family page first — then every day’s avoidance/favor windows appear here.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1.5 mb-1 text-center text-[9px] uppercase tracking-widest text-[#857E74] dark:text-[#8E8A82] font-bold">
              {(['S', 'M', 'T', 'W', 'T', 'F', 'S']).map((d, i) => <div key={i}>{hi ? ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'][i] : d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((d, i) => {
                if (!d) return <div key={`x${i}`} />;
                const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const info = days[key];
                const isToday = key === todayKey;
                return (
                  <div key={key}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-bold transition-all cursor-default ${
                      isToday ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#8E6F1D] dark:text-[#E5C378]' : 'border-black/[0.05] dark:border-white/[0.05] text-[#57524A] dark:text-[#AAA49A]'
                    } ${info?.avoid > 0 ? 'bg-red-500/10 !border-red-500/30' : info?.favor > 0 ? 'bg-emerald-500/10 !border-emerald-500/30' : ''}`}
                    title={info?.summary || ''}>
                    <span>{d}</span>
                    {info && (
                      <span className="flex gap-0.5 mt-1">
                        {info.avoid > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                        {info.favor > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {icsUrl && (
          <a href={icsUrl} download="cosmictantra-vedic-alerts.ics"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37] text-[#8E6F1D] dark:text-[#D4AF37] font-bold text-xs hover:bg-[#D4AF37]/10 transition-all">
            <Download className="w-3.5 h-3.5" />
            {hi ? 'कैलेंडर फ़ीड डाउनलोड करें (.ics → Google/Apple)' : 'Subscribe in your calendar (.ics → Google / Apple)'}
          </a>
        )}
      </div>

      {/* Today detail */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold mb-3">
          {hi ? 'आज का विवरण' : 'Today’s windows'}
        </div>
        {!todayInfo || todayInfo.alerts.length === 0 ? (
          <p className="text-xs text-[#57524A] dark:text-[#AAA49A]">
            {hi ? 'आज कोई प्रमुख निषेध/विशेष विंडो नहीं।' : 'No major avoidance or special windows today.'}
          </p>
        ) : (
          <div className="space-y-2.5">
            {todayInfo.alerts.map((a, i) => (
              <div key={`${a.type}-${i}`} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                a.level === 'avoid' ? 'border-red-500/25 bg-red-500/5' : a.level === 'favor' ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-[#4848A8]/25 bg-[#4848A8]/5'
              }`}>
                {a.level === 'avoid' ? <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  : a.level === 'favor' ? <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    : <Info className="w-4 h-4 text-[#4848A8] dark:text-[#8B8BF5] shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1C1917] dark:text-[#EFECE6]">{a.title}</div>
                  <div className="text-[11px] text-[#57524A] dark:text-[#AAA49A] mt-0.5 leading-relaxed">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

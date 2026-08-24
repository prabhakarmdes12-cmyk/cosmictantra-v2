'use client';

import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, Check, Sparkles } from 'lucide-react';
import {
  getProfiles, upsertProfile, removeProfile, getActiveProfileId, setActiveProfileId,
  profileFromForm, kundaliForProfile, RELATIONS,
} from '../../lib/profileStore';
import { CITIES } from '../../lib/cities';
import { chitiSensory } from '../../lib/chitiAudio';

const EMPTY = {
  name: '', relation: 'Self', birthDate: '', birthTime: '12:00',
  cityId: 'patna', birthCity: 'Patna', birthLat: 25.5941, birthLon: 85.1376, timezone: 5.5,
};

export default function FamilyManager({ lang = 'en', onOpenConsultation = () => {} }) {
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [activeId, setActiveId] = useState(null);
  const [saved, setSaved] = useState(false);
  const hi = lang === 'hi';

  useEffect(() => {
    setProfiles(getProfiles());
    setActiveId(getActiveProfileId());
  }, []);

  const pickCity = (cityId) => {
    const c = CITIES.find(x => x.id === cityId) || CITIES[1];
    setForm(f => ({ ...f, cityId, birthCity: `${c.name}, ${c.state}`, birthLat: c.lat, birthLon: c.lng, timezone: c.tz }));
  };

  const save = (e) => {
    e.preventDefault();
    chitiSensory.playTick();
    if (!form.name || !form.birthDate) return;
    const savedP = upsertProfile(profileFromForm(form));
    // Cache the deterministic chart with the profile so family views never diverge
    const k = kundaliForProfile(savedP);
    upsertProfile({ ...savedP, kundali: { lagna: k.lagna, moon: k.moon } });
    setProfiles(getProfiles());
    setForm({ ...EMPTY });
    setActiveId(getActiveProfileId());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const activate = (id) => {
    chitiSensory.playTick();
    setActiveProfileId(id);
    setActiveId(id);
  };

  const remove = (id) => {
    if (!window.confirm(hi ? 'इस प्रोफाइल को हटाएँ?' : 'Remove this profile?')) return;
    removeProfile(id);
    setProfiles(getProfiles());
    setActiveId(getActiveProfileId());
  };

  const inputCls = 'w-full rounded-xl bg-[#FFFFFF] dark:bg-[#0A0C12] border border-black/[0.08] dark:border-white/[0.1] px-3 py-2.5 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37]';

  return (
    <div className="space-y-6">
      {/* Saved family */}
      <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2 text-[#8E6F1D] dark:text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold mb-4">
          <Users className="w-4 h-4" />
          {hi ? 'आपका परिवार (Cosmic Profiles)' : `Your Family — ${profiles.length} profile${profiles.length === 1 ? '' : 's'}`}
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-10 text-[#9A958C] dark:text-[#5A5750] text-xs">
            {hi ? 'प्रोफाइल जोड़ने पर यहाँ दिखेंगी। सभी डेटा केवल आपके ब्राउज़र में रहता है।' : 'No profiles yet. Add family members below — every profile gets its own Kundali, Dasha and daily alerts. Data stays in your browser.'}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map(p => (
              <div key={p.id}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${activeId === p.id ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-black/[0.06] dark:border-white/[0.06] bg-[#FAF7F2] dark:bg-[#0A0C12]'}`}
                onClick={() => activate(p.id)}>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-[#1C1917] dark:text-[#EFECE6]">{p.name}
                    <span className="ml-1.5 text-[9px] text-[#857E74] dark:text-[#8E8A82] font-mono-data">{p.cosmicId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeId === p.id && <Check className="w-3.5 h-3.5 text-[#10B981]" />}
                    <button onClick={(e) => { e.stopPropagation(); remove(p.id); }} className="text-[#9A958C] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="mt-2 space-y-0.5 font-mono-data text-[10px] text-[#57524A] dark:text-[#AAA49A]">
                  <div>{p.relation} · {p.birthDate} {p.birthTime}</div>
                  {p.kundali ? (
                    <div className="text-[#4848A8] dark:text-[#8B8BF5]">
                      {p.kundali.lagna?.rashiName} Lagna · {p.kundali.moon?.rashiName} Moon · {p.kundali.moon?.nakshatra?.name}
                    </div>
                  ) : (
                    <div className="text-[#9A958C]">{hi ? '(कुंडली उपलब्ध नहीं)' : '(chart not cached)'}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      <form onSubmit={save} className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 flex items-center gap-2 text-[#8E6F1D] dark:text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold">
          <UserPlus className="w-4 h-4" /> {hi ? 'नया सदस्य जोड़ें' : 'Add a Family Member'}
        </div>
        <input placeholder={hi ? 'नाम *' : 'Name *'} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputCls} />
        <select value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })} className={inputCls}>
          {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} required className={inputCls} />
        <input type="time" value={form.birthTime} onChange={e => setForm({ ...form, birthTime: e.target.value })} className={inputCls} />
        <select value={form.cityId} onChange={e => pickCity(e.target.value)} className={inputCls}>
          {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}
        </select>
        <button type="submit"
          className="py-3 rounded-xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold text-xs flex items-center justify-center gap-2">
          {saved ? <><Check className="w-4 h-4" /> {hi ? 'सहेजा गया' : 'Saved'}</> : <><Sparkles className="w-4 h-4" /> {hi ? 'प्रोफाइल सहेजें' : 'Save Profile'}</>}
        </button>
        <p className="sm:col-span-2 text-[9px] text-[#857E74] dark:text-[#8E8A82]">
          {hi ? 'डेटा केवल इसी ब्राउज़र में रहता है (DPDP-अनुकूल)। सहेजा गया प्रोफाइल कुंडली मिलान, दैनिक पंचांग व अलर्ट में स्वतः प्रयोग होगा।' : 'Stored locally in this browser only (DPDP-friendly). Saved profiles auto-fill Kundali Milan, daily Panchang and alerts.'}
        </p>
      </form>
    </div>
  );
}

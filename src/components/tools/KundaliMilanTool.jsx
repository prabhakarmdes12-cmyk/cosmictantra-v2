'use client';

import React, { useState } from 'react';
import { Heart, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { milanFromProfiles } from '../../lib/kundaliMilan';
import { getProfiles, upsertProfile, profileFromForm } from '../../lib/profileStore';
import { chitiSensory } from '../../lib/chitiAudio';

const EMPTY = { name: '', birthDate: '', birthTime: '12:00', birthCity: 'Patna', birthLat: 25.5941, birthLon: 85.1376, timezone: 5.5 };

export default function KundaliMilanTool({ lang = 'en', onOpenConsultation = () => {} }) {
  const [a, setA] = useState({ ...EMPTY });
  const [b, setB] = useState({ ...EMPTY, name: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const hi = lang === 'hi';

  const applyProfile = (form, prof) => {
    if (!prof) return form;
    return {
      name: prof.name || form.name,
      birthDate: prof.birthDate || form.birthDate,
      birthTime: prof.birthTime || form.birthTime,
      birthCity: prof.birthCity || form.birthCity,
      birthLat: prof.birthLat ?? prof.lat ?? form.birthLat,
      birthLon: prof.birthLon ?? prof.lng ?? form.birthLon,
      timezone: prof.tz ?? form.timezone,
    };
  };

  const compute = (e) => {
    e.preventDefault();
    setError('');
    chitiSensory.playTick();
    if (!a.birthDate || !b.birthDate) { setError(hi ? 'दोनों जन्म तिथियाँ आवश्यक हैं।' : 'Both birth dates are required.'); return; }
    try {
      const res = milanFromProfiles(a, b);
      setResult(res);
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const inputCls = 'w-full rounded-xl bg-[#FFFFFF] dark:bg-[#0A0C12] border border-black/[0.08] dark:border-white/[0.1] px-3 py-2.5 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37]';

  return (
    <div className="space-y-6">
      <form onSubmit={compute}
        className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm grid lg:grid-cols-2 gap-6">
        {[['A', a, setA], ['B', b, setB]].map(([label, form, setForm]) => (
          <div key={label} className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
              {hi ? (label === 'A' ? 'वर (दूल्हा)' : 'वधू (दुल्हन)') : label === 'A' ? 'Partner A (Groom)' : 'Partner B (Bride)'}
            </div>
            <input placeholder={hi ? 'नाम' : 'Name'} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" required value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })}
                className={inputCls} />
              <input type="time" value={form.birthTime} onChange={e => setForm({ ...form, birthTime: e.target.value })}
                className={inputCls} />
            </div>
            <input placeholder={hi ? 'जन्म स्थान' : 'Birthplace'} value={form.birthCity} onChange={e => setForm({ ...form, birthCity: e.target.value })}
              className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="any" placeholder="Lat" value={form.birthLat} onChange={e => setForm({ ...form, birthLat: Number(e.target.value) })} className={inputCls} />
              <input type="number" step="any" placeholder="Lon" value={form.birthLon} onChange={e => setForm({ ...form, birthLon: Number(e.target.value) })} className={inputCls} />
            </div>
            <button type="button" onClick={() => {
              const profs = getProfiles();
              if (profs[0]) setForm(applyProfile(form, profs[0]));
            }}
              className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] font-bold hover:underline">
              {hi ? 'सहेजे प्रोफाइल से भरें' : 'Fill from saved profile'}
            </button>
          </div>
        ))}
        <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-3">
          {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
          <button type="submit"
            className="flex-1 w-full py-3 rounded-xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold text-sm flex items-center justify-center gap-2">
            <Heart className="w-4 h-4" /> {hi ? 'अष्टकूट मिलान करें (36 अंक)' : 'Compute Ashtakoota Milan (36 points)'}
          </button>
        </div>
      </form>

      {result && <MilanResult r={result} hi={hi} onOpenConsultation={onOpenConsultation} />}
    </div>
  );
}

function MilanResult({ r, hi, onOpenConsultation }) {
  return (
    <div className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-[#D4AF37]/30 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
            {hi ? 'अष्टकूट स्कोर' : 'Ashtakoota Score'}
          </div>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">{r.total}</span>
            <span className="text-sm text-[#57524A] dark:text-[#AAA49A] pb-1.5">/ {r.max}</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${r.total >= 24 ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#0F6B43] dark:text-[#34d399]' : 'bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#A16207]'}`}>
          {r.total >= 24 ? (hi ? 'शुभ मिलान' : 'Auspicious') : (hi ? 'समीक्षा आवश्यक' : 'Review Advised')}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {r.kootas.map(k => (
          <div key={k.id} className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-[#FAF7F2] dark:bg-[#0A0C12]">
            <div className="text-[9px] uppercase tracking-widest text-[#4848A8] dark:text-[#8B8BF5] font-bold">{k.id}</div>
            <div className="text-lg font-bold text-[#1C1917] dark:text-[#EFECE6]">{k.points}<span className="text-[10px] text-[#9A958C]">/{k.max}</span></div>
            <div className="text-[9px] text-[#57524A] dark:text-[#AAA49A] mt-0.5 truncate" title={k.detail}>{k.detail}</div>
          </div>
        ))}
      </div>

      {(r.nadiBlock || r.bhakootBlock || r.mangalBlock) && (
        <div className="p-4 rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
          <div className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">
            {r.nadiBlock && <div className="font-bold text-[#A16207]">{hi ? 'नाड़ी दोष' : 'Nadi Dosha'}: same Nadi.</div>}
            {r.bhakootBlock && <div className="font-bold text-[#A16207]">{hi ? 'भकूट दोष' : 'Bhakoot Dosha'}</div>}
            {r.mangalBlock && <div className="font-bold text-[#A16207]">{hi ? 'मंगल दोष (दोनों कुंडलियों में)' : 'Mangal Dosh in both charts'}</div>}
            {hi ? 'शास्त्रीय परिहार उपलब्ध हैं — विद्वान से पुष्टि कराएँ।' : 'Classical parihar (remedies) exist — confirm with a scholar.'}
          </div>
        </div>
      )}

      <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">{r.verdict}</p>

      <button onClick={() => onOpenConsultation && onOpenConsultation(hi ? 'कुंडली मिलान विवेचना' : 'Kundali Milan detailed review')}
        className="w-full py-3 rounded-xl border border-[#D4AF37] text-[#8E6F1D] dark:text-[#D4AF37] font-bold text-xs hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center gap-2">
        {hi ? 'विवाह मिलान विवेचना — ₹199' : 'Get the scholars’ detailed Milan review — ₹199'}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
      <p className="text-[9px] text-[#857E74] dark:text-[#8E8A82]">
        {hi ? 'स्कोर पारंपरिक पाला प्रणाली पर आधारित; विभिन्न परंपराओं में हल्का अंतर हो सकता है।' : 'Scoring follows classical pala tables; minor lineage variations exist. Deterministic engine output — no fake claims.'}
      </p>
    </div>
  );
}

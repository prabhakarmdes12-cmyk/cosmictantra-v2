'use client';

import React, { useState } from 'react';
import { Calculator, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import {
  nameNumber, mobileNumber, mulank, bhagyank, nameHarmony,
  NUMEROLOGY_SYSTEMS,
} from '../../lib/numerology';
import { chitiSensory } from '../../lib/chitiAudio';

/**
 * Shared client for /numerology/name, /numerology/business-name and
 * /numerology/mobile-number. Pure deterministic, zero network calls.
 */
export default function NumerologyCalculator({ mode = 'name', lang = 'en', onOpenConsultation = () => {} }) {
  const [system, setSystem] = useState('chaldean');
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [result, setResult] = useState(null);
  const hi = lang === 'hi';

  const compute = (e) => {
    e.preventDefault();
    chitiSensory.playTick();
    if (mode === 'mobile') {
      const r = mobileNumber(mobile);
      setResult({ type: 'mobile', r });
      return;
    }
    if (mode === 'business') {
      const r = nameNumber(business, system);
      setResult({ type: 'business', r, name: business });
      return;
    }
    const r = nameNumber(name, system);
    const h = dob ? nameHarmony(name, dob, system) : null;
    setResult({ type: 'name', r, h, name });
  };

  const inputCls = 'w-full rounded-xl bg-[#FFFFFF] dark:bg-[#0A0C12] border border-black/[0.08] dark:border-white/[0.1] px-4 py-3 text-sm text-[#1C1917] dark:text-[#EFECE6] placeholder-[#9A958C] dark:placeholder-[#5A5750] focus:outline-none focus:border-[#8E6F1D] dark:focus:border-[#D4AF37]';

  const cardCls = 'p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-white/[0.08] shadow-sm text-left';

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={compute} className={cardCls + ' space-y-4'}>
        <div className="flex items-center gap-2 text-[#8E6F1D] dark:text-[#D4AF37] text-[10px] uppercase tracking-[0.2em] font-bold">
          <Calculator className="w-4 h-4" />
          {hi ? 'अंक ज्योतिष गणना' : 'Vedic Numerology Computation'}
        </div>

        {mode !== 'mobile' && (
          <div className="flex gap-2">
            {NUMEROLOGY_SYSTEMS.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { chitiSensory.playTick(); setSystem(s.id); }}
                className={`flex-1 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                  system === s.id
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#8E6F1D] dark:text-[#E5C378]'
                    : 'border-black/[0.08] dark:border-white/[0.1] text-[#57524A] dark:text-[#8E8A82]'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {mode === 'mobile' ? (
          <div>
            <label className="block text-xs font-bold text-[#57524A] dark:text-[#AAA49A] mb-1.5">
              {hi ? 'मोबाइल नंबर' : 'Mobile Number (10 digits)'} *
            </label>
            <input value={mobile} onChange={e => setMobile(e.target.value)} placeholder="9876543210"
              inputMode="numeric" required className={inputCls} />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-[#57524A] dark:text-[#AAA49A] mb-1.5">
              {mode === 'business' ? (hi ? 'व्यवसाय / ब्रांड नाम' : 'Business / Brand Name') : (hi ? 'पूरा नाम' : 'Full Name')} *
            </label>
            <input
              value={mode === 'business' ? business : name}
              onChange={e => (mode === 'business' ? setBusiness(e.target.value) : setName(e.target.value))}
              placeholder={mode === 'business' ? 'e.g. Shubh Enterprises' : 'e.g. Rahul Sharma'}
              required className={inputCls}
            />
          </div>
        )}

        {mode === 'name' && (
          <div>
            <label className="block text-xs font-bold text-[#57524A] dark:text-[#AAA49A] mb-1.5">
              {hi ? 'जन्म तिथि (नाम-भाग्य सामंजस्य हेतु)' : 'Birth Date (for name↔destiny harmony)'}
            </label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} />
          </div>
        )}

        <button type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          {hi ? 'गणना करें' : 'Calculate Number'}
        </button>

        <div className="flex items-start gap-2 text-[10px] text-[#857E74] dark:text-[#8E8A82]">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#10B981]" />
          <span>{hi ? 'गणना आपके ब्राउज़र में होती है। कोई डेटा सर्वर पर नहीं जाता।' : 'Computed entirely in your browser. No data is sent to any server.'}</span>
        </div>
      </form>

      <div className={cardCls}>
        {!result ? (
          <div className="text-center py-14 text-[#9A958C] dark:text-[#5A5750]">
            <div className="text-5xl mb-4">🔢</div>
            <div className="text-sm font-mono-data">
              {hi ? 'अपना नाम / नंबर दर्ज करें और गणना देखें' : 'Enter a name or number to see its Vedic number.'}
            </div>
          </div>
        ) : (
          <ResultPanel result={result} hi={hi} mode={mode} onOpenConsultation={onOpenConsultation} />
        )}
      </div>
    </div>
  );
}

function ResultPanel({ result, hi, mode, onOpenConsultation }) {
  const { r } = result;
  return (
    <div className="space-y-4 font-mono-data">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
          {hi ? 'परिणाम' : 'Result'} {r.isMaster ? '· Master Number' : ''}
        </span>
        <span className="text-4xl font-bold text-[#1C1917] dark:text-[#EFECE6]">{r.number}</span>
      </div>
      <div className="p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#0A0C12] border border-black/[0.06] dark:border-white/[0.06]">
        <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] uppercase font-bold mb-1">
          {hi ? 'स्वामी ग्रह' : 'Ruling Planet'}
        </div>
        <div className="text-sm font-bold text-[#1C1917] dark:text-[#EFECE6]">{r.planet}</div>
        {r.lastDigitPlanet && (
          <div className="text-[11px] text-[#57524A] dark:text-[#AAA49A] mt-1">
            {hi ? 'अंतिम अंक' : 'Last digit'}: {r.lastDigit} → {r.lastDigitPlanet}
          </div>
        )}
      </div>
      <div>
        <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] uppercase font-bold mb-1">
          {hi ? 'स्वभाव' : 'Traits'}
        </div>
        <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">{r.meaning.traits}</p>
      </div>
      <div>
        <div className="text-[10px] text-[#4848A8] dark:text-[#8B8BF5] uppercase font-bold mb-1">
          {hi ? 'मार्गदर्शन' : 'Guidance'}
        </div>
        <p className="text-xs text-[#57524A] dark:text-[#AAA49A] leading-relaxed">
          {mode === 'business' ? r.meaning.business : r.meaning.advice}
        </p>
      </div>
      {result.h && (
        <div className="p-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5">
          <div className="text-[10px] uppercase tracking-widest text-[#8E6F1D] dark:text-[#D4AF37] font-bold mb-1">
            {hi ? 'नाम ↔ भाग्य सामंजस्य' : 'Name ↔ Destiny Harmony'}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-[#1C1917] dark:text-[#EFECE6]">{result.h.harmony}%</div>
            <p className="text-[11px] text-[#57524A] dark:text-[#AAA49A]">{result.h.verdict}</p>
          </div>
        </div>
      )}
      <button
        onClick={() => onOpenConsultation && onOpenConsultation(hi ? 'नाम / अंक परामर्श' : `Name/Business numerology deep dive (${result.name || r.digits || ''})`)}
        className="w-full py-3 rounded-xl border border-[#D4AF37] text-[#8E6F1D] dark:text-[#D4AF37] font-bold text-xs hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center gap-2"
      >
        {hi ? 'विद्वान से गहन परामर्श — ₹199' : 'Deep-dive with a scholar — ₹199'}
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Heart, Sparkles, ArrowRight, AlertTriangle, MapPin, Crosshair, Navigation, Check } from 'lucide-react';
import { milanFromProfiles } from '../../lib/kundaliMilan';
import { getProfiles, upsertProfile, profileFromForm } from '../../lib/profileStore';
import { CITIES, CITIES_BY_STATE } from '../../lib/cities';
import { getCurrentGpsLocation } from '../../lib/location';
import { chitiSensory } from '../../lib/chitiAudio';

const EMPTY = { 
  name: '', 
  birthDate: '', 
  birthTime: '12:00', 
  cityId: 'patna',
  birthCity: 'Patna', 
  birthLat: 25.5941, 
  birthLon: 85.1376, 
  timezone: 5.5,
  isGps: false 
};

export default function KundaliMilanTool({ lang = 'en', onOpenConsultation = () => {} }) {
  const [a, setA] = useState({ ...EMPTY });
  const [b, setB] = useState({ ...EMPTY, name: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [gpsStatusA, setGpsStatusA] = useState('');
  const [gpsStatusB, setGpsStatusB] = useState('');
  const hi = lang === 'hi';

  const applyProfile = (form, prof) => {
    if (!prof) return form;
    return {
      name: prof.name || form.name,
      birthDate: prof.birthDate || form.birthDate,
      birthTime: prof.birthTime || form.birthTime,
      cityId: prof.cityId || form.cityId,
      birthCity: prof.birthCity || form.birthCity,
      birthLat: prof.birthLat ?? prof.lat ?? form.birthLat,
      birthLon: prof.birthLon ?? prof.lng ?? form.birthLon,
      timezone: prof.tz ?? form.timezone,
      isGps: false
    };
  };

  const handleCitySelect = (form, setForm, cityId) => {
    chitiSensory.playTick();
    const city = CITIES.find(c => c.id === cityId);
    if (city) {
      setForm(prev => ({
        ...prev,
        cityId: city.id,
        birthCity: city.name,
        birthLat: city.lat,
        birthLon: city.lng,
        timezone: city.tz,
        isGps: false
      }));
    }
  };

  const handleAcquireGps = async (label, setForm, setStatus) => {
    chitiSensory.playTick();
    setStatus(hi ? 'GPS खोज रहे हैं...' : 'Acquiring GPS...');
    try {
      const loc = await getCurrentGpsLocation({ enableHighAccuracy: true, timeout: 10000 });
      setForm(prev => ({
        ...prev,
        cityId: loc.id,
        birthCity: loc.name,
        birthLat: loc.lat,
        birthLon: loc.lng,
        timezone: loc.tz,
        isGps: true
      }));
      setStatus(hi 
        ? `✓ GPS लॉक: ${loc.lat}°N, ${loc.lng}°E (${loc.nearestCityName || 'भारत'})`
        : `✓ GPS Lock: ${loc.lat}°N, ${loc.lng}°E (Near ${loc.nearestCityName || 'India'})`);
      setTimeout(() => setStatus(''), 5000);
    } catch (err) {
      setStatus(err?.message || (hi ? 'GPS अनुमति अस्वीकृत' : 'GPS access denied'));
      setTimeout(() => setStatus(''), 5000);
    }
  };

  const compute = (e) => {
    e.preventDefault();
    setError('');
    chitiSensory.playTick();
    if (!a.birthDate || !b.birthDate) { 
      setError(hi ? 'दोनों जन्म तिथियाँ आवश्यक हैं।' : 'Both birth dates are required.'); 
      return; 
    }
    try {
      const res = milanFromProfiles(a, b);
      setResult(res);
    } catch (err) {
      setError(String(err?.message || err));
    }
  };

  const inputCls = 'w-full rounded-xl bg-[#FFFFFF] dark:bg-[#0A0C12] border border-black/[0.08] dark:border-white/[0.1] px-3 py-2 text-xs text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#D4AF37] font-bold';

  return (
    <div className="space-y-6 font-mono-data">
      <form onSubmit={compute}
        className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#090B14] border border-black/[0.08] dark:border-[#D4AF37]/30 shadow-xl grid lg:grid-cols-2 gap-6">
        
        {/* Partner A and Partner B Columns */}
        {[
          ['A', a, setA, gpsStatusA, setGpsStatusA], 
          ['B', b, setB, gpsStatusB, setGpsStatusB]
        ].map(([label, form, setForm, status, setStatus]) => (
          <div key={label} className="space-y-3.5 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
              <div className="text-xs uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
                {hi ? (label === 'A' ? 'वर (दूल्हा - Groom)' : 'वधू (दुल्हन - Bride)') : label === 'A' ? 'Partner A (Groom)' : 'Partner B (Bride)'}
              </div>
              {form.isGps && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  Live GPS
                </span>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="text-[10.5px] text-[#857E74] block mb-1 font-bold">
                {hi ? 'नाम (Name)' : 'Full Name'}
              </label>
              <input 
                placeholder={hi ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'} 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls} 
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10.5px] text-[#857E74] block mb-1 font-bold">
                  {hi ? 'जन्म तिथि (DOB)' : 'Date of Birth'}
                </label>
                <input 
                  type="date" 
                  required 
                  value={form.birthDate} 
                  onChange={e => setForm({ ...form, birthDate: e.target.value })}
                  className={inputCls} 
                />
              </div>
              <div>
                <label className="text-[10.5px] text-[#857E74] block mb-1 font-bold">
                  {hi ? 'जन्म समय (TOB)' : 'Time of Birth'}
                </label>
                <input 
                  type="time" 
                  value={form.birthTime} 
                  onChange={e => setForm({ ...form, birthTime: e.target.value })}
                  className={inputCls} 
                />
              </div>
            </div>

            {/* City Selection with 350+ Cities & GPS Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10.5px] text-[#857E74] font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#A6461D]" />
                  <span>{hi ? 'जन्म स्थान (350+ नगर)' : 'Birth Place (350+ Cities)'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleAcquireGps(label, setForm, setStatus)}
                  className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  title="Use Live Satellite GPS"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{hi ? 'लाइव GPS' : 'Live GPS'}</span>
                </button>
              </div>

              <select
                value={form.cityId || 'patna'}
                onChange={e => handleCitySelect(form, setForm, e.target.value)}
                className={inputCls}
              >
                {Object.entries(CITIES_BY_STATE).map(([stName, citiesInState]) => (
                  <optgroup key={stName} label={stName}>
                    {citiesInState.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.nameHi ? `(${c.nameHi})` : ''} • {c.lat.toFixed(2)}°N, {c.lng.toFixed(2)}°E
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* GPS Feedback */}
            {status && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-700 dark:text-amber-300">
                {status}
              </div>
            )}

            {/* Precise Lat / Lon Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] text-[#857E74] block mb-0.5 font-bold">
                  {hi ? 'अक्षांश (Lat °N)' : 'Latitude (°N)'}
                </label>
                <input 
                  type="number" 
                  step="0.0001" 
                  placeholder="Latitude" 
                  value={form.birthLat} 
                  onChange={e => setForm({ ...form, birthLat: Number(e.target.value), isGps: false })} 
                  className={inputCls} 
                />
              </div>
              <div>
                <label className="text-[9.5px] text-[#857E74] block mb-0.5 font-bold">
                  {hi ? 'रेखांश (Lon °E)' : 'Longitude (°E)'}
                </label>
                <input 
                  type="number" 
                  step="0.0001" 
                  placeholder="Longitude" 
                  value={form.birthLon} 
                  onChange={e => setForm({ ...form, birthLon: Number(e.target.value), isGps: false })} 
                  className={inputCls} 
                />
              </div>
            </div>

            <button type="button" onClick={() => {
              const profs = getProfiles();
              if (profs[0]) setForm(applyProfile(form, profs[0]));
            }}
              className="text-[10.5px] text-[#4848A8] dark:text-[#8B8BF5] font-bold hover:underline cursor-pointer block pt-1">
              {hi ? 'सहेजे प्रोफाइल से भरें' : 'Fill from saved profile'}
            </button>
          </div>
        ))}

        {/* Submit Bar */}
        <div className="lg:col-span-2 flex flex-col sm:flex-row items-center gap-3 pt-2">
          {error && <span className="text-xs text-red-500 font-semibold">{error}</span>}
          <button type="submit"
            className="flex-1 w-full py-3.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-98 transition-all cursor-pointer">
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
    <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#090B14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 shadow-xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">
            {hi ? 'अष्टकूट गुण मिलान स्कोर' : 'Ashtakoota Compatibility Score'}
          </div>
          <div className="flex items-end gap-2 mt-1">
            <span className="font-editorial text-4xl sm:text-5xl font-bold text-[#1C1917] dark:text-white">
              {r.totalScore}
            </span>
            <span className="text-sm font-mono-data text-[#857E74] pb-1 font-bold">/ 36 Gunas</span>
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold font-mono-data ${
            r.totalScore >= 24 
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
              : r.totalScore >= 18 
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
              : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
          }`}>
            {r.totalScore >= 24 
              ? (hi ? 'उत्कृष्ट मिलान (High Compatibility)' : 'Excellent Match')
              : r.totalScore >= 18 
              ? (hi ? 'मध्यम मिलान (Moderate Compatibility)' : 'Average Match')
              : (hi ? 'न्यूनाधिक मिलान (Caution Advised)' : 'Low Compatibility')}
          </span>
        </div>
      </div>

      {/* 8 Kootas Table */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono-data">
        {r.kootas && Object.entries(r.kootas).map(([kootaKey, kData]) => (
          <div key={kootaKey} className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-0.5">
            <div className="text-[10px] text-[#857E74] uppercase font-bold">{kootaKey}</div>
            <div className="text-sm font-bold text-[#1C1917] dark:text-[#FAF7F2]">
              {kData.score} / {kData.max}
            </div>
            <div className="text-[9.5px] text-[#8E6F1D] dark:text-[#F0C968]">{kData.status}</div>
          </div>
        ))}
      </div>

      {/* Consultation CTA */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={() => onOpenConsultation('Kundali Milan Consultation')}
          className="px-5 py-2.5 rounded-xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D]/25 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{hi ? 'विद्वान ज्योतिषी से विस्तृत परामर्श लें' : 'Consult Scholar for Detailed Dasha Milan'}</span>
        </button>
      </div>
    </div>
  );
}

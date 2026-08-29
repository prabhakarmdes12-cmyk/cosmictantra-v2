'use client';

/**
 * BIRTH CONTEXT EDITOR (PROGRAM 4 / TRUST-02)
 * ===========================================
 * Trust-first birth entry. Guarantees:
 *  - The resolved coordinates, timezone and UTC offset are ALWAYS shown.
 *  - A city is never silently remapped: choosing a city fills coords but the
 *    user can override them; a free-typed place stays UNCONFIRMED until the
 *    user confirms the coordinates (INV_LOCATION_001).
 *  - Birth-time confidence is explicit: EXACT / APPROXIMATE / UNKNOWN.
 */

import React, { useMemo, useState } from 'react';
import { CITIES } from '@/lib/cities';
import { BIRTH_TIME_CONFIDENCE, LOCATION_SOURCE, validateBirthContext } from '@/lib/kundliStore';

function offsetLabel(tz) {
  const n = Number(tz);
  if (isNaN(n)) return '—';
  const sign = n >= 0 ? '+' : '−';
  const abs = Math.abs(n);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function BirthContextEditor({ initial, onSave, onCancel, saveLabel = 'Save Kundli' }) {
  const [f, setF] = useState(() => ({
    name: '', birthDate: '', birthTime: '',
    birthTimeConfidence: BIRTH_TIME_CONFIDENCE.EXACT,
    place: '', latitude: '', longitude: '', timezone: '',
    locationSource: LOCATION_SOURCE.UNCONFIRMED,
    ...(initial || {}),
  }));
  const [cityQuery, setCityQuery] = useState('');

  const cityMatches = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q) || (c.country || '').toLowerCase().includes(q)
    ).slice(0, 6);
  }, [cityQuery]);

  const pickCity = (c) => {
    setF((s) => ({
      ...s, place: `${c.name}, ${c.state}, ${c.country}`,
      latitude: c.lat, longitude: c.lng ?? c.lon, timezone: c.tz ?? 5.5,
      locationSource: LOCATION_SOURCE.CITY_DB,
    }));
    setCityQuery('');
  };

  // Any manual edit to coords requires re-confirmation.
  const editCoord = (patch) => setF((s) => ({
    ...s, ...patch,
    locationSource: s.locationSource === LOCATION_SOURCE.CITY_DB ? LOCATION_SOURCE.MANUAL_COORDS : s.locationSource,
  }));

  const confirmed = f.locationSource === LOCATION_SOURCE.CITY_DB
    || f.locationSource === LOCATION_SOURCE.MANUAL_COORDS
    || f.locationSource === LOCATION_SOURCE.CONFIRMED_GEOCODE;

  const ctx = {
    ...f,
    latitude: f.latitude === '' ? null : Number(f.latitude),
    longitude: f.longitude === '' ? null : Number(f.longitude),
    timezone: f.timezone === '' ? null : Number(f.timezone),
  };
  const { valid, errors } = validateBirthContext(ctx);

  const timeUnknown = f.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.UNKNOWN;

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold opacity-70">Name (optional)</span>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}
            className="px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent" placeholder="Person's name" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold opacity-70">Birth date</span>
          <input type="date" value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })}
            className="px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent" />
        </label>
      </div>

      {/* Birth time + confidence */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2">
        <div className="text-xs font-semibold opacity-70">Birth time</div>
        <div className="flex flex-wrap items-center gap-3">
          <input type="time" value={f.birthTime} disabled={timeUnknown}
            onChange={(e) => setF({ ...f, birthTime: e.target.value })}
            className="px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent disabled:opacity-40" />
          <div className="flex gap-1 text-xs" role="radiogroup" aria-label="Birth time confidence">
            {Object.values(BIRTH_TIME_CONFIDENCE).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={f.birthTimeConfidence === c}
                onClick={() => setF({ ...f, birthTimeConfidence: c })}
                className={`px-2.5 py-1 rounded border ${f.birthTimeConfidence === c ? 'bg-[#8E6F1D] text-white border-[#8E6F1D]' : 'border-black/15 dark:border-white/15'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        {timeUnknown && (
          <p className="text-[11px] text-[#D4870A]">
            Time unknown — a noon default is used and time-sensitive results (Lagna, houses, exact dasha dates)
            are treated as provisional. We never pretend a time we don&apos;t have.
          </p>
        )}
        {f.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.APPROXIMATE && (
          <p className="text-[11px] opacity-70">Approximate time — Lagna and house cusps may shift; consider birth-time rectification.</p>
        )}
      </div>

      {/* Birthplace trust */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2">
        <div className="text-xs font-semibold opacity-70">Birthplace</div>
        <div className="relative">
          <input value={cityQuery} onChange={(e) => setCityQuery(e.target.value)}
            placeholder="Search a city (or enter coordinates below)"
            className="w-full px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent" />
          {cityMatches.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-black/15 dark:border-white/15 bg-white dark:bg-[#0b0d12] shadow-lg overflow-hidden">
              {cityMatches.map((c) => (
                <button key={c.id} type="button" onClick={() => pickCity(c)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
                  {c.name}, {c.state}, {c.country} · {c.lat.toFixed(2)}, {(c.lng ?? c.lon).toFixed(2)} · {offsetLabel(c.tz)}
                </button>
              ))}
            </div>
          )}
        </div>
        <input value={f.place} onChange={(e) => setF({ ...f, place: e.target.value, locationSource: LOCATION_SOURCE.UNCONFIRMED })}
          placeholder="Place label (as you want it recorded)"
          className="w-full px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent" />

        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] opacity-70">Latitude</span>
            <input type="number" step="0.0001" value={f.latitude} onChange={(e) => editCoord({ latitude: e.target.value })}
              className="px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] opacity-70">Longitude</span>
            <input type="number" step="0.0001" value={f.longitude} onChange={(e) => editCoord({ longitude: e.target.value })}
              className="px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] opacity-70">Timezone (hrs)</span>
            <input type="number" step="0.25" value={f.timezone} onChange={(e) => editCoord({ timezone: e.target.value })}
              className="px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent" />
          </label>
        </div>

        {/* Always-visible resolved context */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono-data bg-black/[0.03] dark:bg-white/[0.04] rounded px-2 py-1.5">
          <span>lat <b>{f.latitude === '' ? '—' : Number(f.latitude).toFixed(4)}</b></span>
          <span>lon <b>{f.longitude === '' ? '—' : Number(f.longitude).toFixed(4)}</b></span>
          <span>tz <b>{f.timezone === '' ? '—' : Number(f.timezone)}</b></span>
          <span>offset <b>{offsetLabel(f.timezone)}</b></span>
          <span>source <b>{f.locationSource}</b></span>
        </div>

        {!confirmed && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#D4870A]">
            <span>Coordinates not yet confirmed. We never silently map a place to a city — please confirm.</span>
            <button type="button" onClick={() => setF({ ...f, locationSource: LOCATION_SOURCE.CONFIRMED_GEOCODE })}
              disabled={f.latitude === '' || f.longitude === '' || f.timezone === ''}
              className="px-2 py-1 rounded bg-[#8E6F1D] text-white disabled:opacity-40 shrink-0">Confirm coordinates</button>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="text-[11px] text-red-600 dark:text-red-400 list-disc pl-4 space-y-0.5">
          {errors.map((e, i) => <li key={i}>{e.message}{e.code ? ` (${e.code})` : ''}</li>)}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <button type="button" disabled={!valid} onClick={() => onSave(ctx)}
          className="px-4 py-2 rounded bg-[#8E6F1D] text-white font-medium disabled:opacity-40">{saveLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 rounded border border-black/15 dark:border-white/15">Cancel</button>}
      </div>
    </div>
  );
}

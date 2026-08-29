'use client';

/**
 * PERSONAL TIMELINE + OUTCOME MEMORY (PROGRAM 13-14 / TRUST-06)
 */

import React, { useMemo, useState } from 'react';
import {
  OUTCOME, recordPrediction, listPredictions, recordOutcome, latestOutcome, accuracyLedger,
} from '@/lib/outcomeStore';

const OUTCOME_COLORS = {
  YES: 'text-emerald-600 dark:text-emerald-300 border-emerald-500/50',
  PARTIALLY: 'text-amber-600 dark:text-amber-300 border-amber-500/50',
  NO: 'text-red-600 dark:text-red-300 border-red-500/50',
  NOT_YET: 'opacity-60 border-black/20 dark:border-white/20',
};

export default function TimelinePanel({ pro, kundliId }) {
  const tl = pro.timeline;
  const now = '2026-08-30';
  const active = pro.timelineActiveOn(now);
  const [tick, setTick] = useState(0);
  const [text, setText] = useState('');

  const predictions = useMemo(() => (kundliId ? listPredictions(kundliId) : []), [kundliId, tick]);
  const ledger = useMemo(() => (kundliId ? accuracyLedger(kundliId) : null), [kundliId, tick]);

  const addPrediction = () => {
    if (!text.trim() || !kundliId) return;
    recordPrediction({
      kundliId, text: text.trim(),
      basis: active.mahadasha ? [`${active.mahadasha.lord} Mahadasha`] : [],
      forWindow: active.antardasha ? { start: active.antardasha.start, end: active.antardasha.end } : null,
      versions: pro.versions,
    });
    setText(''); setTick((t) => t + 1);
  };
  const setOutcome = (id, status) => { recordOutcome(id, status, ''); setTick((t) => t + 1); };

  return (
    <div className="space-y-4 text-sm">
      {/* Now cursor */}
      <div className="rounded-lg border border-[#8E6F1D]/30 p-3">
        <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Active now ({now})</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge label="Mahadasha" value={active.mahadasha?.lord} />
          <Badge label="Antardasha" value={active.antardasha?.lord} />
          <Badge label="Pratyantar" value={active.pratyantardasha?.lord} />
          <Badge label="Sade Sati" value={active.sadeSati ? active.sadeSati.phase : 'No'} />
          <Badge label="Varsha age" value={active.varshaphala?.age} />
        </div>
      </div>

      {/* Mahadasha ribbon */}
      <div>
        <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Mahadasha timeline (Vimshottari)</div>
        <div className="flex rounded overflow-hidden border border-black/10 dark:border-white/10 text-[9px]">
          {tl.tracks.mahadasha.map((m) => {
            const isActive = active.mahadasha && m.lord === active.mahadasha.lord && m.start === active.mahadasha.start;
            return (
              <div key={m.start} title={`${m.lord}: ${m.start} → ${m.end}`}
                className={`px-1 py-1.5 text-center border-r border-black/10 dark:border-white/10 last:border-r-0 ${isActive ? 'bg-[#8E6F1D] text-white font-bold' : 'bg-black/[0.03] dark:bg-white/[0.05]'}`}
                style={{ flex: m.level === 1 ? 1 : 1 }}>
                {m.lord.slice(0, 2)}
              </div>
            );
          })}
        </div>
        <div className="text-[10px] opacity-50 mt-1">Zoom: {tl.zoomLevels.join(' · ')}</div>
      </div>

      {/* Sade Sati windows */}
      <div>
        <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Saturn Sade Sati windows</div>
        <ul className="text-xs space-y-0.5">
          {tl.tracks.sadeSati.map((w, i) => (
            <li key={i} className="font-mono-data">{w.start} → {w.end} <span className="opacity-50">({w.phase})</span></li>
          ))}
          {tl.tracks.sadeSati.length === 0 && <li className="opacity-50">None in the computed span.</li>}
        </ul>
      </div>

      {/* Outcome memory */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2">
        <div className="font-semibold">Outcome Memory</div>
        <p className="text-[11px] opacity-60">Record a prediction now; later mark whether it happened. Predictions are immutable — we keep an honest audit trail and never rewrite the original.</p>
        {kundliId ? (
          <>
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Record a prediction for the current period…"
                className="flex-1 px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent text-xs" />
              <button onClick={addPrediction} className="px-3 py-1.5 rounded bg-[#8E6F1D] text-white text-xs">Record</button>
            </div>
            {ledger && ledger.total > 0 && <div className="text-[11px] opacity-70">{ledger.note}</div>}
            <ul className="space-y-2">
              {predictions.map((p) => {
                const status = latestOutcome(p);
                return (
                  <li key={p.id} className="border-t border-black/[0.06] dark:border-white/[0.08] pt-2">
                    <div className="text-xs">{p.prediction.text}</div>
                    <div className="text-[10px] opacity-50 font-mono-data">
                      recorded {new Date(p.prediction.recordedAt).toLocaleDateString()} · basis: {(p.prediction.basis || []).join(', ') || '—'}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] opacity-60">Did this happen?</span>
                      {Object.values(OUTCOME).map((s) => (
                        <button key={s} onClick={() => setOutcome(p.id, s)}
                          className={`px-1.5 py-0.5 rounded text-[10px] border ${status === s ? OUTCOME_COLORS[s] + ' font-bold' : 'border-black/15 dark:border-white/15 opacity-70'}`}>{s}</button>
                      ))}
                    </div>
                    {p.outcomes.length > 1 && (
                      <div className="text-[10px] opacity-40 mt-0.5">History: {p.outcomes.map((o) => o.status).join(' → ')}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-[11px] opacity-50">Save this Kundli to record and track predictions.</p>
        )}
      </div>
    </div>
  );
}

function Badge({ label, value }) {
  return (
    <span className="px-2 py-0.5 rounded-full border border-black/15 dark:border-white/15">
      <span className="opacity-50">{label}:</span> <b>{value ?? '—'}</b>
    </span>
  );
}

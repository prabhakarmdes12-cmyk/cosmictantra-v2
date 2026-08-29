'use client';

/**
 * ASK KASHI PANEL (PROGRAM 12 / TRUST-05)
 * =======================================
 * Grounded, cited answers over the chart's evidence graph. Shows the retrieval
 * plan, cited evidence #1..n, the rules applied, the synthesis, a confidence
 * badge, and a "Why am I saying this?" audit trail. When evidence is absent it
 * honestly shows INSUFFICIENT_CALCULATION_EVIDENCE — never invented astrology.
 */

import React, { useState } from 'react';

const SUGGESTIONS = ['Career', 'Marriage', 'Wealth', 'Health', 'Personality', 'Current dasha timing'];

export default function AskKashiPanel({ pro }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [showWhy, setShowWhy] = useState(false);

  const ask = (question) => {
    const query = question ?? q;
    if (!query.trim()) return;
    setQ(query);
    setRes(pro.ask(query));
    setShowWhy(false);
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
          placeholder="Ask about this chart (career, marriage, a planet, a house)…"
          className="flex-1 px-3 py-2 rounded border border-black/15 dark:border-white/15 bg-transparent" />
        <button onClick={() => ask()} className="px-4 py-2 rounded bg-[#8E6F1D] text-white font-medium">Ask Kashi</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="px-2 py-1 rounded-full text-xs border border-black/15 dark:border-white/15">{s}</button>
        ))}
      </div>

      <p className="text-[11px] opacity-60">
        Kashi never calculates astrology or guesses. It reads only the calculated evidence of this Kundli and cites it.
      </p>

      {res && res.status === 'INSUFFICIENT_CALCULATION_EVIDENCE' && (
        <div className="rounded-lg border border-[#D4870A]/40 bg-[#D4870A]/[0.06] p-3">
          <div className="text-xs font-bold text-[#D4870A]">INSUFFICIENT_CALCULATION_EVIDENCE</div>
          <p className="text-xs mt-1">{res.message}</p>
        </div>
      )}

      {res && res.status === 'OK' && (
        <div className="space-y-3">
          {/* Confidence + retrieval plan */}
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded-full border ${res.confidence === 'MEDIUM' ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-300' : 'border-black/20 dark:border-white/20 opacity-70'}`}>
              confidence: {res.confidence}
            </span>
            <span className="opacity-60">retrieval: {res.retrievalPlan.topics.join(', ') || 'general'}</span>
          </div>

          {/* Synthesis */}
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
            <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">{res.answer.kind}</div>
            <p className="text-sm">{res.answer.text}</p>
          </div>

          {/* Cited evidence */}
          <div>
            <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Evidence (calculated facts)</div>
            <ol className="space-y-1">
              {res.evidence.slice(0, 8).map((e) => (
                <li key={e.ref} className="text-xs flex gap-2">
                  <span className="font-mono-data text-[#8E6F1D] dark:text-[#D4AF37]">#{e.ref}</span>
                  <span>{e.statement} <span className="opacity-50">— {e.source}</span></span>
                </li>
              ))}
            </ol>
          </div>

          {/* Why am I saying this? */}
          <button onClick={() => setShowWhy((v) => !v)} className="text-xs text-[#8E6F1D] dark:text-[#D4AF37] hover:underline">
            {showWhy ? 'Hide' : 'Why am I saying this?'}
          </button>
          {showWhy && (
            <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2 text-xs">
              <div>
                <div className="font-semibold mb-1">Rules applied</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {res.why.rules.map((r, i) => <li key={i}>{r.principle} <span className="opacity-50">— {r.source}</span></li>)}
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Evidence used</div>
                <ul className="list-disc pl-4 space-y-0.5">
                  {res.why.evidenceRefs.map((e) => <li key={e.ref}>#{e.ref}: {e.statement} <span className="opacity-50">— {e.source}</span></li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

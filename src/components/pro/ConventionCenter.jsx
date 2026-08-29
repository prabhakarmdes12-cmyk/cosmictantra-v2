'use client';

/**
 * CONVENTION CENTER UI (PROGRAM 15 / TRUST-09)
 * ============================================
 * Lets an advanced user change ayanamsha / node mode etc. The default preset is
 * COSMICTANTRA_STANDARD_PARASHARI. Changing a convention recomputes the chart
 * (new snapshot context) and clearly indicates that results changed because of a
 * convention choice — not a defect.
 */

import React from 'react';
import { AYANAMSHA, NODE_MODE, HOUSE_SYSTEM, resolveConventions, COSMICTANTRA_STANDARD_PARASHARI } from '@/lib/pro/conventions';

const OPTIONS = [
  { key: 'ayanamsha', label: 'Ayanamsha', values: Object.values(AYANAMSHA) },
  { key: 'nodeMode', label: 'Node (Rahu/Ketu)', values: Object.values(NODE_MODE) },
  { key: 'houseSystem', label: 'House system', values: Object.values(HOUSE_SYSTEM) },
];

export default function ConventionCenter({ conventions, onChange }) {
  const c = resolveConventions(conventions);
  const isDefault = JSON.stringify({ a: c.ayanamsha, n: c.nodeMode, h: c.houseSystem })
    === JSON.stringify({ a: COSMICTANTRA_STANDARD_PARASHARI.ayanamsha, n: COSMICTANTRA_STANDARD_PARASHARI.nodeMode, h: COSMICTANTRA_STANDARD_PARASHARI.houseSystem });

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Calculation conventions</span>
        {isDefault
          ? <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-600 dark:text-emerald-300">CosmicTantra Standard (Parashari)</span>
          : <button onClick={() => onChange(COSMICTANTRA_STANDARD_PARASHARI)} className="text-[10px] px-2 py-0.5 rounded-full border border-[#8E6F1D]/50 text-[#8E6F1D] dark:text-[#D4AF37]">Reset to Standard</button>}
      </div>
      {OPTIONS.map((opt) => (
        <label key={opt.key} className="flex items-center justify-between gap-2">
          <span className="opacity-60">{opt.label}</span>
          <select value={c[opt.key]} onChange={(e) => onChange({ ...c, [opt.key]: e.target.value })}
            className="px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent">
            {opt.values.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      ))}
      {!isDefault && (
        <p className="text-[10px] text-[#D4870A]">Non-standard conventions selected. Any difference from the Standard chart is a convention choice, not an error. The chart has been recomputed with these settings.</p>
      )}
    </div>
  );
}

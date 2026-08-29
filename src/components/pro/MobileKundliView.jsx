'use client';

/**
 * MOBILE KUNDLI VIEW (PROGRAM 7 / TRUST-07)
 * Consumer cards + Pandit companion — a real mobile experience, drill-downable.
 */

import React, { useMemo, useState } from 'react';
import { buildMobileView, MOBILE_MODE } from '@/lib/pro/mobileView';

export default function MobileKundliView({ pro, onDrill }) {
  const [mode, setMode] = useState(MOBILE_MODE.CONSUMER);
  const view = useMemo(() => buildMobileView(pro, mode), [pro, mode]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 text-xs" role="tablist" aria-label="Mobile view mode">
        {[MOBILE_MODE.CONSUMER, MOBILE_MODE.PANDIT].map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-full border ${mode === m ? 'bg-[#8E6F1D] text-white border-[#8E6F1D]' : 'border-black/15 dark:border-white/15'}`}>
            {m === MOBILE_MODE.CONSUMER ? 'Simple' : 'Pandit'}
          </button>
        ))}
      </div>

      {view.cards.map((card) => (
        <div key={card.id} className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b0d12] p-3">
          <div className="text-xs font-semibold mb-2">{card.title}</div>

          {card.kind === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead><tr>{card.columns.map((c) => <th key={c} className="text-left py-1 pr-2 opacity-60 font-medium">{c}</th>)}</tr></thead>
                <tbody>
                  {card.rows.map((r, i) => (
                    <tr key={i} className="border-t border-black/[0.06] dark:border-white/[0.08]">
                      {r.map((cell, j) => <td key={j} className="py-1 pr-2 font-mono-data">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {card.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-xs">
                  <button onClick={() => it.drillTo && onDrill && onDrill(it.drillTo)}
                    className={`text-left ${it.drillTo ? 'hover:text-[#8E6F1D] dark:hover:text-[#D4AF37]' : ''}`}>
                    <span className="opacity-60">{it.label}</span>
                  </button>
                  <span className="font-mono-data text-right">{it.value}{it.drillTo ? ' ›' : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

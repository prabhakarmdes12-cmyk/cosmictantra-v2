'use client';

import React, { useMemo, useState } from 'react';

/**
 * Professional data table: sort, filter, copy, export CSV, print.
 * @param columns string[]
 * @param rows (string|number)[][]
 */
export default function DataTable({ columns, rows, title, dense }) {
  const [sortCol, setSortCol] = useState(-1);
  const [sortDir, setSortDir] = useState(1);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    let out = rows;
    if (filter.trim()) {
      const f = filter.toLowerCase();
      out = out.filter((r) => r.some((c) => String(c).toLowerCase().includes(f)));
    }
    if (sortCol >= 0) {
      out = [...out].sort((a, b) => {
        const av = a[sortCol]; const bv = b[sortCol];
        const an = parseFloat(av); const bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * sortDir;
        return String(av).localeCompare(String(bv)) * sortDir;
      });
    }
    return out;
  }, [rows, filter, sortCol, sortDir]);

  const toCSV = () => [columns.join(','), ...filtered.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const copy = () => { try { navigator.clipboard.writeText(toCSV()); } catch { /* noop */ } };
  const exportCSV = () => {
    const blob = new Blob([toCSV()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(title || 'table').replace(/\s+/g, '_')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const setSort = (i) => {
    if (sortCol === i) setSortDir((d) => -d); else { setSortCol(i); setSortDir(1); }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {title ? <span className="text-sm font-medium mr-auto">{title}</span> : <span className="mr-auto" />}
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          className="px-2 py-1 text-xs rounded border border-black/15 dark:border-white/15 bg-transparent"
        />
        <button onClick={copy} className="px-2 py-1 text-xs rounded border border-black/15 dark:border-white/15">Copy</button>
        <button onClick={exportCSV} className="px-2 py-1 text-xs rounded border border-black/15 dark:border-white/15">Export</button>
        <button onClick={() => window.print()} className="px-2 py-1 text-xs rounded border border-black/15 dark:border-white/15">Print</button>
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse ${dense ? 'text-[11px]' : 'text-xs'}`}>
          <thead>
            <tr className="text-left border-b border-black/10 dark:border-white/10">
              {columns.map((c, i) => (
                <th key={c} onClick={() => setSort(i)} className="py-1.5 pr-3 cursor-pointer select-none whitespace-nowrap">
                  {c}{sortCol === i ? (sortDir > 0 ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, ri) => (
              <tr key={ri} className="border-b border-black/[0.04] dark:border-white/[0.05]">
                {r.map((c, ci) => <td key={ci} className="py-1 pr-3 whitespace-nowrap tabular-nums">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

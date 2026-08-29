'use client';

import React, { useMemo, useState } from 'react';
import { REPORT_SECTIONS, DEFAULT_TEMPLATES, buildReport, reportToHTML } from '@/lib/pro/reports';
import { buildBook, BOOK_VARIANTS, RENDER_TARGET } from '@/lib/pro/bookModel';
import { bookToHTML } from '@/lib/pro/renderers';

const SECTION_LABELS = {
  cover: 'Cover', birthDetails: 'Birth details', d1: 'D1 chart', planetTable: 'Planet table',
  bhavaTable: 'Bhava table', vargas: 'Vargas', dasha: 'Dasha', bala: 'Bala',
  ashtakavarga: 'Ashtakavarga', yogaDosha: 'Yoga/Dosha', varshaphala: 'Varshaphala',
  panchang: 'Panchang', interpretation: 'Interpretation', notes: 'Notes',
};

export default function ReportBuilder({ pro, birthParams }) {
  const [selected, setSelected] = useState(DEFAULT_TEMPLATES.full.sections);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [templates, setTemplates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cosmictantra_report_templates') || '{}'); } catch { return {}; }
  });

  const toggle = (s) => setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const order = REPORT_SECTIONS.filter((s) => selected.includes(s));

  const report = useMemo(() => buildReport({ id: 'custom', name: 'Custom Report', sections: order }, { pro, meta: { name }, notes }), [pro, order, name, notes]);

  const generate = () => {
    const html = reportToHTML(report);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); }
  };

  const saveTemplate = () => {
    const tname = prompt('Template name?');
    if (!tname) return;
    const next = { ...templates, [tname]: order };
    setTemplates(next);
    try { localStorage.setItem('cosmictantra_report_templates', JSON.stringify(next)); } catch { /* noop */ }
  };
  const loadTemplate = (t) => setSelected(templates[t]);

  const generateBook = (variantId) => {
    const book = buildBook(variantId, { pro, meta: { name }, notes });
    const html = bookToHTML(book, RENDER_TARGET.PRINT);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); }
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Book variants — renderer-independent KundliBookModel with provenance + evidence→rule→synthesis */}
      <div className="rounded-lg border border-[#8E6F1D]/30 p-2.5 space-y-1.5">
        <div className="font-semibold text-[#8E6F1D] dark:text-[#D4AF37]">Kundli Books</div>
        <div className="opacity-60">One book model → WEB / PRINT / PDF. Every book carries full calculation identity; interpretations are evidence → rule → synthesis (no generic filler).</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(BOOK_VARIANTS).filter((v) => v.id !== 'CUSTOM').map((v) => (
            <button key={v.id} onClick={() => generateBook(v.id)} title={`Audience: ${v.audience}`}
              className="px-2 py-1 rounded border border-[#8E6F1D]/40 hover:bg-[#8E6F1D]/[0.08]">{v.name}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="opacity-60">Preset:</span>
        {Object.values(DEFAULT_TEMPLATES).map((t) => (
          <button key={t.id} onClick={() => setSelected(t.sections)} className="px-2 py-0.5 rounded border border-black/15 dark:border-white/15">{t.name}</button>
        ))}
        {Object.keys(templates).map((t) => (
          <button key={t} onClick={() => loadTemplate(t)} className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-700 dark:text-emerald-300">{t}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {REPORT_SECTIONS.map((s) => (
          <label key={s} className="flex items-center gap-1.5">
            <input type="checkbox" checked={selected.includes(s)} onChange={() => toggle(s)} />
            {SECTION_LABELS[s]}
          </label>
        ))}
      </div>

      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Report subject name" className="w-full px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent" />
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes / interpretation…" rows={3} className="w-full px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent" />

      <div className="flex gap-2">
        <button onClick={generate} className="px-3 py-1.5 rounded bg-[#8E6F1D] text-white font-medium">Generate printable report</button>
        <button onClick={saveTemplate} className="px-3 py-1.5 rounded border border-black/15 dark:border-white/15">Save template</button>
      </div>
      <div className="opacity-60">{report.sections.length} sections · deterministic · calculation decoupled from rendering.</div>
    </div>
  );
}

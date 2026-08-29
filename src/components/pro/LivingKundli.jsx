'use client';

/**
 * LIVING KUNDLI WORKSPACE (PROGRAM 4 / TRUST-02)
 * ==============================================
 * The persistent home of ONE person's Jyotish. Section navigation over a single
 * canonical snapshot; birth context is always inspectable and editable; the
 * resolved place/tz/offset are shown, never silently changed.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { professionalChart } from '@/lib/pro/index';
import {
  KUNDLI_SECTIONS, BIRTH_TIME_CONFIDENCE, toBirthParams, saveKundli,
} from '@/lib/kundliStore';
import { describeConventions } from '@/lib/pro/conventions';
import BirthContextEditor from './BirthContextEditor';
import {
  OverviewPanel, ChartPanel, VargasPanel, PlanetsPanel, BhavasPanel, NakshatraPanel,
  DashaPanel, BalaPanel, AshtakavargaPanel, AvasthaPanel, YogaPanel, JaiminiPanel,
  KPPanel, GocharPanel, VarshaphalaPanel, PanchangPanel,
} from './panels';
import ReportBuilder from './ReportBuilder';
import AskKashiPanel from './AskKashiPanel';
import TimelinePanel from './TimelinePanel';

function offsetLabel(tz) {
  const n = Number(tz); if (isNaN(n)) return '—';
  const s = n >= 0 ? '+' : '−'; const a = Math.abs(n);
  return `UTC${s}${String(Math.floor(a)).padStart(2, '0')}:${String(Math.round((a - Math.floor(a)) * 60)).padStart(2, '0')}`;
}

export default function LivingKundli({ record, theme = 'dark', onUpdated }) {
  const [rec, setRec] = useState(record);
  const [section, setSection] = useState('Overview');
  const [editing, setEditing] = useState(false);

  useEffect(() => { setRec(record); }, [record]);

  const birthParams = useMemo(() => toBirthParams(rec), [rec]);
  const pro = useMemo(() => professionalChart(birthParams, { conventions: rec.conventions }), [birthParams, rec.conventions]);

  const timeUnknown = rec.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.UNKNOWN;

  const handleSaveContext = (ctx) => {
    const res = saveKundli({ ...rec, ...ctx });
    if (res.ok) { setRec(res.kundli); setEditing(false); onUpdated && onUpdated(res.kundli); }
  };

  const renderSection = () => {
    switch (section) {
      case 'Overview': return <OverviewPanel pro={pro} theme={theme} />;
      case 'Birth': return <BirthTab rec={rec} onEdit={() => setEditing(true)} />;
      case 'Charts': return <ChartPanel pro={pro} theme={theme} />;
      case 'Planets': return <PlanetsPanel pro={pro} />;
      case 'Bhavas': return <BhavasPanel pro={pro} />;
      case 'Nakshatra': return <NakshatraPanel pro={pro} />;
      case 'Vargas': return <VargasPanel pro={pro} theme={theme} />;
      case 'Dasha': return <DashaPanel pro={pro} />;
      case 'Bala': return <BalaPanel pro={pro} />;
      case 'Ashtakavarga': return <AshtakavargaPanel pro={pro} />;
      case 'Avastha': return <AvasthaPanel pro={pro} />;
      case 'Yoga & Dosha': return <YogaPanel pro={pro} />;
      case 'Jaimini': return <JaiminiPanel pro={pro} />;
      case 'KP': return <KPPanel birthParams={birthParams} />;
      case 'Gochar': return <GocharPanel pro={pro} theme={theme} />;
      case 'Varshaphala': return <VarshaphalaPanel birthParams={birthParams} />;
      case 'Panchang': return <PanchangPanel birthParams={birthParams} />;
      case 'Timeline': return <TimelinePanel pro={pro} kundliId={rec.id} />;
      case 'Reports': return <ReportBuilder pro={pro} birthParams={birthParams} />;
      case 'Ask Kashi': return <AskKashiPanel pro={pro} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Section nav */}
      <aside className="md:w-44 shrink-0">
        <div className="md:sticky md:top-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-1">
          {KUNDLI_SECTIONS.map((s) => (
            <button key={s} onClick={() => setSection(s)}
              aria-current={section === s ? 'page' : undefined}
              className={`text-left px-2.5 py-1.5 rounded text-xs whitespace-nowrap ${section === s ? 'bg-[#8E6F1D] text-white font-semibold' : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'}`}>
              {s}
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Identity header — always shows resolved birth context */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b0d12] p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="font-editorial text-xl font-bold">{rec.name || 'Unnamed Kundli'}</div>
              <div className="text-[11px] font-mono-data opacity-70 mt-0.5">
                {rec.birthDate} · {timeUnknown ? 'time unknown' : rec.birthTime} · {rec.place || 'custom location'}
              </div>
            </div>
            <div className="text-right text-[11px] font-mono-data opacity-70">
              <div>{Number(rec.latitude).toFixed(4)}, {Number(rec.longitude).toFixed(4)} · {offsetLabel(rec.timezone)}</div>
              <div>Lagna <b>{pro.kundali.lagna.rashiEn}</b> · Moon <b>{pro.kundali.moon.rashiEn}</b> ({pro.kundali.moon.nakshatra?.name})</div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
            <span className={`px-2 py-0.5 rounded-full border ${timeUnknown ? 'border-[#D4870A] text-[#D4870A]' : 'border-black/15 dark:border-white/15 opacity-70'}`}>
              time: {rec.birthTimeConfidence}
            </span>
            <span className="px-2 py-0.5 rounded-full border border-black/15 dark:border-white/15 opacity-70">
              ayanamsha: {pro.conventions?.ayanamsha}
            </span>
            <span className="px-2 py-0.5 rounded-full border border-black/15 dark:border-white/15 opacity-70">
              engine v{pro.versions?.engineVersion}
            </span>
            <button onClick={() => setEditing(true)} className="ml-auto px-2 py-1 rounded border border-black/15 dark:border-white/15">Edit birth details</button>
          </div>
        </div>

        {/* Section body */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b0d12] p-4">
          {renderSection()}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-3 bg-black/50 overflow-y-auto" onClick={() => setEditing(false)}>
          <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#0b0d12] border border-black/15 dark:border-white/15 shadow-2xl p-5 my-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-editorial text-lg font-bold mb-1">Edit birth details</h2>
            <p className="text-[11px] opacity-70 mb-3">Changing birth data recomputes the entire Kundli. The place is never silently remapped — confirm coordinates yourself.</p>
            <BirthContextEditor initial={rec} onSave={handleSaveContext} onCancel={() => setEditing(false)} saveLabel="Save changes" />
          </div>
        </div>
      )}
    </div>
  );
}

function BirthTab({ rec, onEdit }) {
  const rows = [
    ['Name', rec.name || '—'],
    ['Birth date', rec.birthDate],
    ['Birth time', rec.birthTimeConfidence === BIRTH_TIME_CONFIDENCE.UNKNOWN ? 'Unknown (noon default used)' : rec.birthTime],
    ['Time confidence', rec.birthTimeConfidence],
    ['Place', rec.place || '—'],
    ['Latitude', Number(rec.latitude).toFixed(4)],
    ['Longitude', Number(rec.longitude).toFixed(4)],
    ['Timezone', `${rec.timezone} (${offsetLabel(rec.timezone)})`],
    ['Location source', rec.locationSource],
    ['Created', new Date(rec.createdAt).toLocaleString()],
    ['Updated', new Date(rec.updatedAt).toLocaleString()],
  ];
  const conv = describeConventions(rec.conventions);
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Birth record</h3>
        <button onClick={onEdit} className="px-2 py-1 rounded border border-black/15 dark:border-white/15 text-xs">Edit</button>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-black/[0.06] dark:border-white/[0.08]">
              <td className="py-1.5 pr-4 opacity-60 w-40">{k}</td>
              <td className="py-1.5 font-mono-data">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <h4 className="font-semibold text-xs mb-1">Calculation conventions</h4>
        <table className="w-full text-xs">
          <tbody>
            {conv.map((c) => (
              <tr key={c.key} className="border-b border-black/[0.06] dark:border-white/[0.08]">
                <td className="py-1 pr-4 opacity-60 w-40">{c.key}</td>
                <td className="py-1 font-mono-data">{c.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlaceholderTab({ title, note }) {
  return (
    <div className="py-10 text-center">
      <div className="font-editorial text-lg font-bold">{title}</div>
      <p className="text-sm opacity-70 mt-2 max-w-md mx-auto">{note}</p>
    </div>
  );
}

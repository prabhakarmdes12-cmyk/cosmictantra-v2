'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { professionalChart } from '@/lib/pro/index';
import { CITIES, DEFAULT_CITY } from '@/lib/cities';
import {
  OverviewPanel, ChartPanel, VargasPanel, PlanetsPanel, BhavasPanel, NakshatraPanel,
  DashaPanel, BalaPanel, AshtakavargaPanel, AvasthaPanel, YogaPanel, JaiminiPanel,
  KPPanel, GocharPanel, VarshaphalaPanel, SpecialPanel, PanchangPanel, PrashnaPanel,
} from './panels';
import ReportBuilder from './ReportBuilder';

// Left navigation groups (spec order).
const NAV = [
  'Overview', 'Charts', 'Vargas', 'Planets', 'Bhavas', 'Nakshatra', 'Dasha', 'Bala',
  'Ashtakavarga', 'Avastha', 'Yoga/Dosha', 'Jaimini', 'KP', 'Gochar', 'Varshaphala',
  'Special', 'Panchang', 'Prashna', 'Reports',
];

// Panel registry: id → { title, render }.
function makePanelRegistry(pro, birthParams, theme) {
  return {
    Overview: { title: 'Overview', render: () => <OverviewPanel pro={pro} theme={theme} /> },
    Charts: { title: 'Chart', render: (opts) => <ChartPanel pro={pro} theme={theme} initial={opts?.initial || 'D1'} /> },
    Vargas: { title: 'Vargas (Shodashavarga)', render: () => <VargasPanel pro={pro} theme={theme} /> },
    Planets: { title: 'Planets', render: () => <PlanetsPanel pro={pro} /> },
    Bhavas: { title: 'Bhavas', render: () => <BhavasPanel pro={pro} /> },
    Nakshatra: { title: 'Nakshatra', render: () => <NakshatraPanel pro={pro} /> },
    Dasha: { title: 'Dasha', render: () => <DashaPanel pro={pro} /> },
    Bala: { title: 'Bala', render: () => <BalaPanel pro={pro} /> },
    Ashtakavarga: { title: 'Ashtakavarga', render: () => <AshtakavargaPanel pro={pro} /> },
    Avastha: { title: 'Avastha', render: () => <AvasthaPanel pro={pro} /> },
    'Yoga/Dosha': { title: 'Yoga / Dosha', render: () => <YogaPanel pro={pro} /> },
    Jaimini: { title: 'Jaimini', render: () => <JaiminiPanel pro={pro} /> },
    KP: { title: 'KP', render: () => <KPPanel birthParams={birthParams} /> },
    Gochar: { title: 'Gochar (Transits)', render: () => <GocharPanel pro={pro} theme={theme} /> },
    Varshaphala: { title: 'Varshaphala', render: () => <VarshaphalaPanel birthParams={birthParams} /> },
    Special: { title: 'Special Points', render: () => <SpecialPanel pro={pro} /> },
    Panchang: { title: 'Panchang', render: () => <PanchangPanel birthParams={birthParams} /> },
    Prashna: { title: 'Prashna (KP)', render: () => <PrashnaPanel birthParams={birthParams} /> },
    Reports: { title: 'Reports', render: () => <ReportBuilder pro={pro} birthParams={birthParams} /> },
  };
}

// Search index for Ctrl/Cmd+K.
const SEARCH_ENTRIES = [
  ...NAV.map((n) => ({ label: n, action: { type: 'nav', target: n } })),
  { label: 'D1 Rashi', action: { type: 'chart', initial: 'D1' } },
  { label: 'D9 Navamsha', action: { type: 'chart', initial: 'D9' } },
  { label: 'D10 Dashamsha', action: { type: 'chart', initial: 'D10' } },
  { label: 'D60 Shashtiamsha', action: { type: 'chart', initial: 'D60' } },
  { label: 'Shadbala', action: { type: 'nav', target: 'Bala' } },
  { label: 'Saturn', action: { type: 'nav', target: 'Planets' } },
  { label: 'Jupiter Mahadasha', action: { type: 'nav', target: 'Dasha' } },
  { label: 'Ashtakavarga', action: { type: 'nav', target: 'Ashtakavarga' } },
  { label: '2027 transit', action: { type: 'nav', target: 'Gochar' } },
  { label: 'Atmakaraka', action: { type: 'nav', target: 'Jaimini' } },
  { label: 'Sub lord', action: { type: 'nav', target: 'KP' } },
  { label: 'Solar Return', action: { type: 'nav', target: 'Varshaphala' } },
];

const DEFAULT_LAYOUT = [
  { id: 'p1', kind: 'Charts', opts: { initial: 'D1' } },
  { id: 'p2', kind: 'Charts', opts: { initial: 'D9' } },
  { id: 'p3', kind: 'Charts', opts: { initial: 'D10' } },
  { id: 'p4', kind: 'Gochar' },
  { id: 'p5', kind: 'Dasha' },
  { id: 'p6', kind: 'Bala' },
  { id: 'p7', kind: 'Ashtakavarga' },
];

let _uid = 100;

export default function Workbench({ theme = 'dark' }) {
  const [form, setForm] = useState({
    name: '', birthDate: '1995-06-15', birthTime: '10:30', cityIndex: 0,
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  const [birthParams, setBirthParams] = useState({
    birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  const [panels, setPanels] = useState(DEFAULT_LAYOUT);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  const pro = useMemo(() => professionalChart(birthParams), [birthParams]);
  const registry = useMemo(() => makePanelRegistry(pro, birthParams, theme), [pro, birthParams, theme]);

  // Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (searchOpen && searchRef.current) searchRef.current.focus(); }, [searchOpen]);

  // load saved workspace
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cosmictantra_workbench_layout');
      if (saved) setPanels(JSON.parse(saved));
    } catch { /* noop */ }
  }, []);

  const saveWorkspace = () => {
    try { localStorage.setItem('cosmictantra_workbench_layout', JSON.stringify(panels)); } catch { /* noop */ }
  };
  const resetWorkspace = () => setPanels(DEFAULT_LAYOUT);

  const addPanel = (kind, opts) => setPanels((ps) => [...ps, { id: `p${_uid++}`, kind, opts }]);
  const removePanel = (id) => setPanels((ps) => ps.filter((p) => p.id !== id));
  const movePanel = (id, dir) => setPanels((ps) => {
    const i = ps.findIndex((p) => p.id === id);
    if (i < 0) return ps;
    const j = i + dir;
    if (j < 0 || j >= ps.length) return ps;
    const copy = [...ps];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });
  const resizePanel = (id) => setPanels((ps) => ps.map((p) => (p.id === id ? { ...p, wide: !p.wide } : p)));

  const applyBirth = () => {
    const city = CITIES[form.cityIndex] || {};
    setBirthParams({
      birthDate: form.birthDate, birthTime: form.birthTime,
      latitude: Number(form.latitude), longitude: Number(form.longitude),
      timezone: Number(form.timezone), locationName: form.locationName,
    });
  };

  const runSearch = (entry) => {
    setSearchOpen(false); setQuery('');
    if (entry.action.type === 'nav') addPanel(entry.action.target);
    else if (entry.action.type === 'chart') addPanel('Charts', { initial: entry.action.initial });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ENTRIES;
    return SEARCH_ENTRIES.filter((e) => e.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="flex min-h-[80vh] gap-4">
      {/* left nav */}
      <aside className="w-40 shrink-0 hidden md:block">
        <div className="sticky top-4 space-y-1">
          <button onClick={() => setSearchOpen(true)} className="w-full text-left px-2 py-1.5 rounded text-xs border border-black/15 dark:border-white/15 flex items-center justify-between">
            <span>Search</span><kbd className="text-[9px] opacity-60">⌘K</kbd>
          </button>
          {NAV.map((n) => (
            <button key={n} onClick={() => addPanel(n)} className="w-full text-left px-2 py-1 rounded text-xs hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
              {n}
            </button>
          ))}
        </div>
      </aside>

      {/* main */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* birth data bar */}
        <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 flex flex-wrap items-end gap-2 text-xs bg-white dark:bg-[#0b0d12]">
          <label className="flex flex-col">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-0.5 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent w-28" /></label>
          <label className="flex flex-col">Date<input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="mt-0.5 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent" /></label>
          <label className="flex flex-col">Time<input type="time" value={form.birthTime} onChange={(e) => setForm({ ...form, birthTime: e.target.value })} className="mt-0.5 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent" /></label>
          <label className="flex flex-col">City
            <select value={form.cityIndex} onChange={(e) => { const i = +e.target.value; const c = CITIES[i]; setForm({ ...form, cityIndex: i, latitude: c.lat, longitude: c.lng ?? c.lon, timezone: c.tz ?? 5.5, locationName: c.name }); }} className="mt-0.5 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent max-w-[8rem]">
              {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col">Lat<input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="mt-0.5 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent w-24" /></label>
          <label className="flex flex-col">Lon<input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="mt-0.5 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent w-24" /></label>
          <label className="flex flex-col">TZ<input type="number" step="0.25" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className="mt-0.5 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent w-16" /></label>
          <button onClick={applyBirth} className="px-3 py-1.5 rounded bg-[#8E6F1D] text-white font-medium">Calculate</button>
          <div className="ml-auto flex gap-1">
            <button onClick={saveWorkspace} className="px-2 py-1 rounded border border-black/15 dark:border-white/15">Save workspace</button>
            <button onClick={resetWorkspace} className="px-2 py-1 rounded border border-black/15 dark:border-white/15">Reset</button>
          </div>
        </div>

        {/* panel grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {panels.map((p) => {
            const def = registry[p.kind];
            if (!def) return null;
            return (
              <div key={p.id} className={`rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b0d12] overflow-hidden ${p.wide ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                  <span className="text-xs font-semibold">{def.title}</span>
                  <div className="flex gap-1 text-[11px]">
                    <button onClick={() => movePanel(p.id, -1)} title="Move up/left" className="px-1 opacity-60 hover:opacity-100">◀</button>
                    <button onClick={() => movePanel(p.id, 1)} title="Move down/right" className="px-1 opacity-60 hover:opacity-100">▶</button>
                    <button onClick={() => resizePanel(p.id)} title="Resize" className="px-1 opacity-60 hover:opacity-100">⤢</button>
                    <button onClick={() => removePanel(p.id)} title="Remove" className="px-1 opacity-60 hover:opacity-100">✕</button>
                  </div>
                </div>
                <div className="p-3">{def.render(p.opts)}</div>
              </div>
            );
          })}
        </div>
        {panels.length === 0 && (
          <div className="text-center text-sm opacity-60 py-16">No panels. Add one from the left navigation or press ⌘K.</div>
        )}
      </div>

      {/* Ctrl+K search */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 bg-black/50" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-[#0b0d12] border border-black/15 dark:border-white/15 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) runSearch(results[0]); }}
              placeholder="Search calculations… (D9, Shadbala, Saturn, 2027 transit, Jupiter Mahadasha)"
              className="w-full px-4 py-3 text-sm bg-transparent border-b border-black/10 dark:border-white/10 outline-none"
            />
            <div className="max-h-72 overflow-y-auto">
              {results.map((r, i) => (
                <button key={i} onClick={() => runSearch(r)} className="w-full text-left px-4 py-2 text-sm hover:bg-black/[0.05] dark:hover:bg-white/[0.06]">
                  {r.label}
                </button>
              ))}
              {results.length === 0 && <div className="px-4 py-3 text-sm opacity-60">No matches.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

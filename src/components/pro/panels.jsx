'use client';

import React, { useMemo, useState } from 'react';
import VargaChart from './VargaChart';
import DataTable from './DataTable';
import { VARGA_ORDER, VARGA_META } from '@/lib/pro/vargas';
import { computeGochar } from '@/lib/pro/gochar';
import { computeVarshaphala } from '@/lib/pro/varshaphala';
import { computePanchangPro, RECKONING } from '@/lib/pro/panchangPro';
import { computeKPChart, kpPrashna249 } from '@/lib/pro/kp';
import { computeJaimini } from '@/lib/pro/jaimini';
import { ashtakoota } from '@/lib/pro/matching';

const SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

/** ── Overview ─────────────────────────────────────────────────────────── */
export function OverviewPanel({ pro, theme }) {
  const k = pro.kundali;
  const v = pro.vimshottari;
  const active = v.activeChain;
  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Info label="Lagna" value={`${k.lagna.rashiEn} ${k.lagna.degreeStr}`} />
        <Info label="Lagna Nakshatra" value={k.lagna.nakshatra.name} />
        <Info label="Moon" value={`${k.moon.rashiEn} · ${k.moon.nakshatra.name} p${k.moon.pada}`} />
        <Info label="Ayanamsha" value={`${k.meta.ayanamsha}° (Lahiri)`} />
      </div>
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
        <div className="text-xs opacity-60 mb-1">Current Vimshottari period</div>
        <div className="font-medium">{active.map((c) => c.lord).join(' → ')}</div>
      </div>
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
        <div className="text-xs opacity-60 mb-1">Detected Yogas / Doshas</div>
        <div className="flex flex-wrap gap-1">
          {pro.yogas.detected.length
            ? pro.yogas.detected.map((y) => <span key={y.id} className={`px-2 py-0.5 rounded-full text-[11px] ${y.family === 'Dosha' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}`}>{y.name}</span>)
            : <span className="text-xs opacity-60">None detected</span>}
        </div>
      </div>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-2.5">
      <div className="text-[10px] uppercase tracking-wide opacity-50">{label}</div>
      <div className="font-medium text-sm mt-0.5">{value}</div>
    </div>
  );
}

/** ── Single Varga chart panel with fast switcher ──────────────────────── */
export function ChartPanel({ pro, theme, initial = 'D1' }) {
  const [code, setCode] = useState(initial);
  const chart = pro.varga(code); // cached → instant switching
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {VARGA_ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setCode(c)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono-data ${code === c ? 'bg-[#8E6F1D] text-white' : 'border border-black/15 dark:border-white/15'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center">
        <VargaChart chart={chart} theme={theme} size={280} title={`${code} — ${VARGA_META[code]?.name}`} />
        <div className="text-[11px] opacity-60 mt-1">{VARGA_META[code]?.signifies}</div>
      </div>
    </div>
  );
}

/** ── Vargas grid (Shodashavarga) ──────────────────────────────────────── */
export function VargasPanel({ pro, theme }) {
  const vargas = pro.vargas;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {VARGA_ORDER.map((c) => (
        <div key={c} className="flex flex-col items-center">
          <VargaChart chart={vargas[c]} theme={theme} size={150} title={c} />
        </div>
      ))}
    </div>
  );
}

/** ── Planets table ────────────────────────────────────────────────────── */
export function PlanetsPanel({ pro, onInspect }) {
  const k = pro.kundali;
  const sb = pro.shadbala;
  const columns = ['Planet', 'Longitude', 'Rashi', 'Degree', 'Nakshatra', 'Pada', 'Lord', 'Retro', 'Combust', 'Dignity', 'House', 'Shadbala'];
  const sunLon = k.planets.find((p) => p.name === 'Sun').longitude;
  const rows = k.planets.map((p) => {
    let sep = Math.abs(((p.longitude - sunLon + 180) % 360) - 180);
    const combust = p.name !== 'Sun' && sep < 8;
    const nameCell = onInspect
      ? <button onClick={() => onInspect(p.name)} className="text-[#8E6F1D] dark:text-[#D4AF37] hover:underline font-semibold" title={`Inspect ${p.name}`}>{p.name}</button>
      : p.name;
    return [
      nameCell, `${p.longitude.toFixed(3)}°`, p.rashiEn, p.degreeStr, p.nakshatra.name, p.pada,
      p.nakshatra.ruler, p.isRetrograde ? 'R' : '—', combust ? 'Yes' : '—', p.dignity, p.house,
      sb.planets[p.name] ? `${sb.planets[p.name].totalRupa} R` : '—',
    ];
  });
  return <DataTable title="Planetary Positions" columns={columns} rows={rows} dense />;
}

/** ── Bhavas table ─────────────────────────────────────────────────────── */
export function BhavasPanel({ pro }) {
  const k = pro.kundali;
  const bb = pro.bhavaBala;
  const columns = ['House', 'Rashi', 'Lord', 'Significance', 'Occupants', 'Bhava Bala'];
  const rows = k.houses.map((h) => [
    h.number, h.rashiEn, h.lord, h.significance, h.planets.join(', ') || '—',
    bb.houses[h.number - 1] ? `${bb.houses[h.number - 1].totalRupa} R` : '—',
  ]);
  return <DataTable title="Bhava (House) Table" columns={columns} rows={rows} dense />;
}

/** ── Nakshatra panel ──────────────────────────────────────────────────── */
export function NakshatraPanel({ pro }) {
  const k = pro.kundali;
  const columns = ['Body', 'Nakshatra', 'Pada', 'Lord', 'Degree in Nak'];
  const rows = [
    ['Lagna', k.lagna.nakshatra.name, k.lagna.pada, k.lagna.nakshatra.ruler, `${k.lagna.nakshatra.degree}°`],
    ...k.planets.map((p) => [p.name, p.nakshatra.name, p.pada, p.nakshatra.ruler, `${p.nakshatra.degree}°`]),
  ];
  return <DataTable title="Nakshatra & Pada" columns={columns} rows={rows} dense />;
}

/** ── Dasha panel with system switcher + timeline navigation ───────────── */
export function DashaPanel({ pro }) {
  const systems = pro.dashaSystems;
  const [sysId, setSysId] = useState('vimshottari');
  const [path, setPath] = useState([]); // drill-down path of indices
  const data = useMemo(() => pro.dasha(sysId, { maxLevel: 5 }), [pro, sysId]);

  // navigate the tree by path
  let level = data.periods;
  const crumbs = [];
  for (const idx of path) {
    const node = level[idx];
    if (!node) break;
    crumbs.push(node);
    level = node.children || [];
  }
  const shown = level;
  const LEVEL_NAMES = ['Mahadasha', 'Antardasha', 'Pratyantar', 'Sookshma', 'Prana'];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {systems.map((s) => (
          <button key={s.id} onClick={() => { setSysId(s.id); setPath([]); }}
            className={`px-2 py-0.5 rounded text-[11px] ${sysId === s.id ? 'bg-[#8E6F1D] text-white' : 'border border-black/15 dark:border-white/15'}`}>
            {s.name}
          </button>
        ))}
      </div>
      <div className="text-[11px] opacity-70 flex flex-wrap items-center gap-1">
        <button onClick={() => setPath([])} className="underline">120y</button>
        {crumbs.map((c, i) => (
          <span key={i}>→ <button onClick={() => setPath(path.slice(0, i + 1))} className="underline">{c.lord}</button></span>
        ))}
        {shown.length ? <span className="ml-2 opacity-60">({LEVEL_NAMES[crumbs.length] || 'Level ' + (crumbs.length + 1)})</span> : null}
      </div>
      <DataTable
        columns={['Lord', 'Start', 'End', 'Years']}
        rows={shown.map((p) => [p.lord, p.start, p.end, p.years])}
        dense
      />
      {shown.some((p) => (p.children || []).length) && (
        <div className="text-[11px] opacity-60">Tip: use the row order; click a crumb lord to drill in. Drill via:</div>
      )}
      <div className="flex flex-wrap gap-1">
        {shown.map((p, i) => (p.children || []).length ? (
          <button key={i} onClick={() => setPath([...path, i])} className="px-2 py-0.5 rounded text-[10px] border border-black/15 dark:border-white/15">
            {p.lord} ▸
          </button>
        ) : null)}
      </div>
    </div>
  );
}

/** ── Bala panel ───────────────────────────────────────────────────────── */
export function BalaPanel({ pro }) {
  const sb = pro.shadbala;
  const vp = pro.vimshopaka;
  const ik = pro.ishtaKashta;
  const cols = ['Planet', 'Sthana', 'Dig', 'Kaala', 'Cheshta', 'Naisargika', 'Drik', 'Total (R)', 'Req', 'Strong?', 'Vimshopaka', 'Ishta', 'Kashta'];
  const rows = Object.entries(sb.planets).map(([name, p]) => [
    name, p.sthanaBala, p.digBala, p.kaalaBala, p.cheshtaBala, p.naisargikaBala, p.drikBala,
    p.totalRupa, p.required, p.isStrong ? 'Yes' : 'No', vp.planets[name], ik.planets[name].ishta, ik.planets[name].kashta,
  ]);
  return (
    <div className="space-y-2">
      <div className="text-[11px] rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-1">
        Status: IMPLEMENTED — queued for external numerical comparison (not QUALIFIED).
      </div>
      <DataTable title="Shadbala / Vimshopaka / Ishta-Kashta" columns={cols} rows={rows} dense />
      <div className="text-[11px] opacity-70">Ranking: {sb.ranking.join(' > ')}</div>
    </div>
  );
}

/** ── Ashtakavarga panel (actual bindu tables) ─────────────────────────── */
export function AshtakavargaPanel({ pro }) {
  const av = pro.ashtakavarga;
  const [view, setView] = useState('SAV');
  const planetList = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const signCols = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

  if (view === 'SAV') {
    return (
      <div className="space-y-2">
        <ViewSwitch views={['SAV', ...planetList, 'Prastara']} view={view} setView={setView} />
        <DataTable
          title={`Sarvashtakavarga (total ${av.sarva.total} · invariant 337 ${av.invariants.savTotalOk ? 'OK' : 'FAIL'})`}
          columns={['', ...signCols, 'Total']}
          rows={[['SAV', ...av.sarva.bindus, av.sarva.total]]}
          dense
        />
      </div>
    );
  }
  if (view === 'Prastara') {
    const rows = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'].map((c) => [c, ...av.bhinna.Sun.prastara[c]]);
    return (
      <div className="space-y-2">
        <ViewSwitch views={['SAV', ...planetList, 'Prastara']} view={view} setView={setView} />
        <div className="text-[11px] opacity-70">Prastara grid — contributors to Sun&apos;s Bhinnashtakavarga (1 = bindu given).</div>
        <DataTable columns={['Contributor', ...signCols]} rows={rows} dense />
      </div>
    );
  }
  const bh = av.bhinna[view];
  const red = av.reductions[view];
  return (
    <div className="space-y-2">
      <ViewSwitch views={['SAV', ...planetList, 'Prastara']} view={view} setView={setView} />
      <DataTable
        title={`${view} Bhinnashtakavarga (total ${bh.total})`}
        columns={['', ...signCols]}
        rows={[
          ['Raw', ...bh.bindus],
          ['Trikona', ...red.trikona],
          ['Ekadhipatya', ...red.ekadhipatya],
        ]}
        dense
      />
    </div>
  );
}
function ViewSwitch({ views, view, setView }) {
  return (
    <div className="flex flex-wrap gap-1">
      {views.map((v) => (
        <button key={v} onClick={() => setView(v)} className={`px-2 py-0.5 rounded text-[11px] ${view === v ? 'bg-[#8E6F1D] text-white' : 'border border-black/15 dark:border-white/15'}`}>{v}</button>
      ))}
    </div>
  );
}

/** ── Avastha panel ────────────────────────────────────────────────────── */
export function AvasthaPanel({ pro }) {
  const av = pro.avasthas;
  const cols = ['Planet', 'Baladi', 'Jagradadi', 'Deeptadi', 'Lajjitadi', 'Shayanadi'];
  const rows = Object.entries(av).map(([name, a]) => [
    name, a.baladi.state, a.jagradadi.state, a.deeptadi.state, a.lajjitadi.states.join(', '), a.shayanadi.state,
  ]);
  return <DataTable title="Avasthas (planetary states)" columns={cols} rows={rows} dense />;
}

/** ── Yoga/Dosha panel ─────────────────────────────────────────────────── */
export function YogaPanel({ pro }) {
  const y = pro.yogas;
  const cols = ['Name', 'Type', 'Detected', 'Source', 'Evidence'];
  const rows = y.all.map((r) => [r.name, r.family, r.detected ? '✓' : '—', r.source, r.evidence.join('; ')]);
  return <DataTable title={`Yoga / Dosha rules (${y.detected.length}/${y.total} detected)`} columns={cols} rows={rows} dense />;
}

/** ── Jaimini panel ────────────────────────────────────────────────────── */
export function JaiminiPanel({ pro }) {
  const [mode, setMode] = useState(8);
  const j = useMemo(() => computeJaimini(pro.kundali, { karakaMode: mode }), [pro, mode]);
  const karakas = j.charaKarakas.karakas;
  return (
    <div className="space-y-3">
      <div className="flex gap-1 items-center text-xs">
        <span className="opacity-60">Karaka mode:</span>
        {[7, 8].map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`px-2 py-0.5 rounded ${mode === m ? 'bg-[#8E6F1D] text-white' : 'border border-black/15 dark:border-white/15'}`}>{m}</button>
        ))}
      </div>
      <DataTable title="Chara Karakas" columns={['Karaka', 'Planet', 'Degree', 'Sign']}
        rows={Object.entries(karakas).map(([n, v]) => [n, v.planet, v.degree, v.signName])} dense />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label="Arudha Lagna (AL)" value={j.arudhaLagna.arudhaSignName} />
        <Info label="Upapada (UL)" value={j.upapada.arudhaSignName} />
        <Info label="Karakamsha" value={j.karakamsha.karakamshaSignName} />
        <Info label="Swamsha" value={SIGN[j.karakamsha.swamsha]} />
      </div>
      <DataTable title="Bhava Padas" columns={['House', 'Arudha Sign', 'Lord']}
        rows={j.bhavaPadas.map((p) => [p.house, p.arudhaSignName, p.lord])} dense />
    </div>
  );
}

/** ── KP panel ─────────────────────────────────────────────────────────── */
export function KPPanel({ birthParams }) {
  const kp = useMemo(() => computeKPChart(birthParams), [birthParams]);
  return (
    <div className="space-y-3">
      <div className="text-[11px] opacity-70">KP Ayanamsha {kp.ayanamsha}° (Lahiri {kp.lahiriAyanamsha}°). {kp.placidusPoleWarning ? '⚠ Placidus unreliable at this latitude.' : ''}</div>
      <DataTable title="Planets — Star / Sub / Sub-sub lords" columns={['Planet', 'Sign', 'Sign Lord', 'Star Lord', 'Sub Lord', 'Sub-Sub']}
        rows={kp.planets.map((p) => [p.name, p.signName, p.signLord, p.starLord, p.subLord, p.subSubLord])} dense />
      <DataTable title="Placidus Cusps" columns={['Cusp', 'Longitude', 'Sign', 'Star Lord', 'Sub Lord']}
        rows={kp.cusps.map((c) => [c.house, `${c.longitude.toFixed(2)}°`, c.signName, c.starLord, c.subLord])} dense />
    </div>
  );
}

/** ── Gochar panel ─────────────────────────────────────────────────────── */
export function GocharPanel({ pro, theme }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const step = (unit, dir) => {
    const d = new Date(date + 'T12:00:00Z');
    if (unit === 'day') d.setUTCDate(d.getUTCDate() + dir);
    if (unit === 'week') d.setUTCDate(d.getUTCDate() + dir * 7);
    if (unit === 'month') d.setUTCMonth(d.getUTCMonth() + dir);
    if (unit === 'year') d.setUTCFullYear(d.getUTCFullYear() + dir);
    setDate(d.toISOString().slice(0, 10));
  };
  const g = useMemo(() => computeGochar(pro.kundali, new Date(date + 'T12:00:00Z')), [pro, date]);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent" />
        {['day', 'week', 'month', 'year'].map((u) => (
          <span key={u} className="inline-flex items-center gap-0.5">
            <button onClick={() => step(u, -1)} className="px-1.5 rounded border border-black/15 dark:border-white/15">−</button>
            <span className="text-[10px] w-9 text-center">{u}</span>
            <button onClick={() => step(u, 1)} className="px-1.5 rounded border border-black/15 dark:border-white/15">+</button>
          </span>
        ))}
      </div>
      <DataTable title="Transit → Natal (with Ashtakavarga overlay)"
        columns={['Planet', 'Sign', 'Degree', 'Natal House', 'Nakshatra', 'Retro', 'SAV Bindus']}
        rows={g.houseTransits.map((t) => [t.planet, t.signName, `${t.degree}°`, t.natalHouse, t.nakshatra + 1, t.isRetrograde ? 'R' : '—', t.savBindusInSign])} dense />
      <div className="text-[11px] opacity-70">Conjunctions with natal: {g.conjunctions.map((c) => `${c.transit}~${c.natal}`).join(', ') || 'none'}</div>
    </div>
  );
}

/** ── Varshaphala panel ────────────────────────────────────────────────── */
export function VarshaphalaPanel({ birthParams }) {
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const va = useMemo(() => computeVarshaphala(birthParams, year), [birthParams, year]);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <button onClick={() => setYear((y) => y - 1)} className="px-2 rounded border border-black/15 dark:border-white/15">−</button>
        <span className="font-medium">Year {year} (age {va.age})</span>
        <button onClick={() => setYear((y) => y + 1)} className="px-2 rounded border border-black/15 dark:border-white/15">+</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label="Varsha Pravesh (UTC)" value={va.solarReturn.returnMomentUTC.slice(0, 16).replace('T', ' ')} />
        <Info label="Muntha" value={va.muntha.signName} />
        <Info label="Varshesha" value={va.varshesha.varshesha} />
        <Info label="Match error" value={va.solarReturn.matchError} />
      </div>
      <DataTable title="Sahams" columns={['Saham', 'Sign', 'Longitude']}
        rows={Object.entries(va.sahams).filter(([k]) => k !== 'convention').map(([n, v]) => [n, v.signName, `${v.longitude}°`])} dense />
      <DataTable title="Mudda Dasha" columns={['Lord', 'Start', 'End', 'Days']}
        rows={va.muddaDasha.periods.map((p) => [p.lord, p.start, p.end, p.days])} dense />
    </div>
  );
}

/** ── Special points panel ─────────────────────────────────────────────── */
export function SpecialPanel({ pro }) {
  const sp = pro.special;
  const rows = [
    ['Gulika', sp.gulikaMandi.gulika.signName, `${sp.gulikaMandi.gulika.longitude}°`],
    ['Mandi', sp.gulikaMandi.mandi.signName, `${sp.gulikaMandi.mandi.longitude}°`],
    ['Bhava Lagna', sp.specialLagnas.bhavaLagna.signName, `${sp.specialLagnas.bhavaLagna.longitude}°`],
    ['Hora Lagna', sp.specialLagnas.horaLagna.signName, `${sp.specialLagnas.horaLagna.longitude}°`],
    ['Ghatika Lagna', sp.specialLagnas.ghatikaLagna.signName, `${sp.specialLagnas.ghatikaLagna.longitude}°`],
    ['Indu Lagna', sp.specialLagnas.induLagna.signName, '—'],
    ['Pranapada', sp.specialLagnas.pranapada.signName, `${sp.specialLagnas.pranapada.longitude}°`],
    ['Dhuma', sp.upagrahas.dhuma.signName, `${sp.upagrahas.dhuma.longitude}°`],
    ['Vyatipata', sp.upagrahas.vyatipata.signName, `${sp.upagrahas.vyatipata.longitude}°`],
    ['Parivesha', sp.upagrahas.parivesha.signName, `${sp.upagrahas.parivesha.longitude}°`],
    ['Indrachapa', sp.upagrahas.indrachapa.signName, `${sp.upagrahas.indrachapa.longitude}°`],
    ['Upaketu', sp.upagrahas.upaketu.signName, `${sp.upagrahas.upaketu.longitude}°`],
  ];
  return (
    <div className="space-y-2">
      <DataTable title="Special Points & Upagrahas" columns={['Point', 'Sign', 'Longitude']} rows={rows} dense />
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label="Yogi" value={sp.yogiAvayogi.yogi} />
        <Info label="Avayogi" value={sp.yogiAvayogi.avayogi} />
        <Info label="Duplicate Yogi" value={sp.yogiAvayogi.duplicateYogi} />
        <Info label="64th Navamsha" value={sp.sensitiveVargas.sixtyFourthNavamsha.signName} />
        <Info label="22nd Drekkana" value={sp.sensitiveVargas.twentySecondDrekkana.signName} />
      </div>
    </div>
  );
}

/** ── Panchang panel (AT_INSTANT vs AT_LOCAL_SUNRISE) ──────────────────── */
export function PanchangPanel({ birthParams }) {
  const [reckoning, setReckoning] = useState(RECKONING.AT_LOCAL_SUNRISE);
  const place = { latitude: birthParams.latitude, longitude: birthParams.longitude, timezone: birthParams.timezone, name: birthParams.locationName };
  const p = useMemo(() => computePanchangPro(new Date(`${birthParams.birthDate}T${birthParams.birthTime || '12:00'}:00Z`), place, reckoning), [birthParams, reckoning]);
  return (
    <div className="space-y-2">
      <div className="flex gap-1 text-[11px]">
        {[RECKONING.AT_LOCAL_SUNRISE, RECKONING.AT_INSTANT].map((r) => (
          <button key={r} onClick={() => setReckoning(r)} className={`px-2 py-0.5 rounded ${reckoning === r ? 'bg-[#8E6F1D] text-white' : 'border border-black/15 dark:border-white/15'}`}>{r}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label={`Tithi (${p.tithi.paksha})`} value={`${p.tithi.name} · ends ${p.tithi.endsAt}`} />
        <Info label="Nakshatra" value={`${p.nakshatra.name} p${p.nakshatra.pada} · ends ${p.nakshatra.endsAt}`} />
        <Info label="Yoga" value={`${p.yoga.name} · ends ${p.yoga.endsAt}`} />
        <Info label="Karana" value={`${p.karana.name} · ends ${p.karana.endsAt}`} />
        <Info label="Sunrise / Sunset" value={`${p.sunrise} / ${p.sunset}`} />
        <Info label="Moonrise / Moonset" value={`${p.moonrise} / ${p.moonset}`} />
        <Info label="Rahu Kaal" value={`${p.rahuKaal.start}–${p.rahuKaal.end}`} />
        <Info label="Abhijit" value={p.abhijit.suppressed ? 'Suppressed (Wed)' : `${p.abhijit.start}–${p.abhijit.end}`} />
      </div>
      <DataTable title="Choghadiya (day)" columns={['Choghadiya', 'Quality', 'Start', 'End']}
        rows={p.choghadiya.map((c) => [c.name, c.quality, c.start, c.end])} dense />
    </div>
  );
}

/** ── Prashna panel ────────────────────────────────────────────────────── */
export function PrashnaPanel({ birthParams }) {
  const [num, setNum] = useState(1);
  const place = { latitude: birthParams.latitude, longitude: birthParams.longitude, name: birthParams.locationName };
  const now = new Date();
  const params = { birthDate: now.toISOString().slice(0, 10), birthTime: `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`, latitude: place.latitude, longitude: place.longitude, timezone: 0, locationName: place.name };
  const pr = useMemo(() => kpPrashna249(num, params), [num]);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span>KP Horary number (1–249):</span>
        <input type="number" min={1} max={249} value={num} onChange={(e) => setNum(Math.max(1, Math.min(249, +e.target.value)))} className="w-20 px-2 py-1 rounded border border-black/15 dark:border-white/15 bg-transparent" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Info label="Ascendant sign" value={pr.ascendant.signName} />
        <Info label="Asc star lord" value={pr.ascendant.starLord} />
        <Info label="Asc sub lord (deciding)" value={pr.ascendant.subLord} />
        <Info label="Asc sub-sub lord" value={pr.ascendant.subSubLord} />
      </div>
      <div className="text-[11px] opacity-60">Prashna chart cast now: {params.birthDate} {params.birthTime} UTC.</div>
    </div>
  );
}

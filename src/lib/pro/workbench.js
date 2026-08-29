/**
 * WORKBENCH 2.0 — presets, actions & inspector data (PROGRAM 5 / TRUST-04)
 * ========================================================================
 * The Workbench is a professional 3-column workspace (nav | workspace |
 * inspector). This module supplies the renderer-independent pieces:
 *   - WORKSPACE_PRESETS: purpose-built panel layouts.
 *   - buildCommandActions: ⌘K entries that EXECUTE actions (add panel, open in
 *     D9/D10/Shadbala/Ashtakavarga/Dashas/Transit/Ask Kashi, inspect planet),
 *     not just navigate.
 *   - inspectPlanet: cross-calculation dossier for one graha, gathered from the
 *     single canonical snapshot (no re-computation of astrology).
 */

export const WORKSPACE_PRESETS = {
  Natal: {
    id: 'Natal', label: 'Natal',
    panels: [
      { kind: 'Charts', opts: { initial: 'D1' } },
      { kind: 'Charts', opts: { initial: 'D9' } },
      { kind: 'Planets' }, { kind: 'Bhavas' }, { kind: 'Dasha' }, { kind: 'Yoga/Dosha' },
    ],
  },
  Marriage: {
    id: 'Marriage', label: 'Marriage',
    panels: [
      { kind: 'Charts', opts: { initial: 'D9' } },
      { kind: 'Charts', opts: { initial: 'D1' } },
      { kind: 'Dasha' }, { kind: 'Yoga/Dosha' }, { kind: 'Bala' },
    ],
  },
  Career: {
    id: 'Career', label: 'Career',
    panels: [
      { kind: 'Charts', opts: { initial: 'D10' } },
      { kind: 'Charts', opts: { initial: 'D1' } },
      { kind: 'Bhavas' }, { kind: 'Dasha' }, { kind: 'Ashtakavarga' },
    ],
  },
  Child: {
    id: 'Child', label: 'Child',
    panels: [
      { kind: 'Charts', opts: { initial: 'D7' } },
      { kind: 'Charts', opts: { initial: 'D1' } },
      { kind: 'Dasha' }, { kind: 'Yoga/Dosha' },
    ],
  },
  Varshaphala: {
    id: 'Varshaphala', label: 'Varshaphala',
    panels: [
      { kind: 'Varshaphala' }, { kind: 'Charts', opts: { initial: 'D1' } }, { kind: 'Gochar' }, { kind: 'Dasha' },
    ],
  },
  KP: {
    id: 'KP', label: 'KP',
    panels: [
      { kind: 'KP' }, { kind: 'Charts', opts: { initial: 'D1' } }, { kind: 'Gochar' },
    ],
  },
  Research: {
    id: 'Research', label: 'Research',
    panels: [
      { kind: 'Charts', opts: { initial: 'D1' } }, { kind: 'Charts', opts: { initial: 'D9' } },
      { kind: 'Charts', opts: { initial: 'D10' } }, { kind: 'Charts', opts: { initial: 'D60' } },
      { kind: 'Bala' }, { kind: 'Ashtakavarga' }, { kind: 'Jaimini' }, { kind: 'Special' },
    ],
  },
};

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

/**
 * Build the ⌘K command index. Each entry has a real ACTION the workbench runs.
 * Actions:
 *   addPanel(kind, opts) | openChart(varga) | inspectPlanet(name) |
 *   applyPreset(id) | crossCalc(target, planet)
 */
export function buildCommandActions() {
  const actions = [];

  // Presets
  for (const p of Object.values(WORKSPACE_PRESETS)) {
    actions.push({ label: `Preset: ${p.label} workspace`, kind: 'preset', run: { type: 'applyPreset', id: p.id } });
  }

  // Charts / vargas
  for (const v of ['D1', 'D2', 'D3', 'D7', 'D9', 'D10', 'D12', 'D16', 'D20', 'D24', 'D27', 'D30', 'D60']) {
    actions.push({ label: `Open ${v} chart`, kind: 'chart', run: { type: 'openChart', varga: v } });
  }

  // Core calculation panels (actions, not just nav)
  const panelActions = [
    ['Add Shadbala panel', 'Bala'], ['Add Ashtakavarga panel', 'Ashtakavarga'],
    ['Add Dashas panel', 'Dasha'], ['Add Transit (Gochar) panel', 'Gochar'],
    ['Add Yoga/Dosha panel', 'Yoga/Dosha'], ['Add Jaimini panel', 'Jaimini'],
    ['Add KP panel', 'KP'], ['Add Varshaphala panel', 'Varshaphala'],
    ['Add Vargas panel', 'Vargas'], ['Add Avastha panel', 'Avastha'],
    ['Add Special points panel', 'Special'], ['Add Panchang panel', 'Panchang'],
    ['Add Nakshatra panel', 'Nakshatra'], ['Add Reports panel', 'Reports'],
  ];
  for (const [label, kind] of panelActions) {
    actions.push({ label, kind: 'panel', run: { type: 'addPanel', kind } });
  }

  // Per-planet: inspect + cross-calc verbs
  for (const pl of PLANETS) {
    actions.push({ label: `Inspect ${pl}`, kind: 'planet', run: { type: 'inspectPlanet', planet: pl } });
    actions.push({ label: `${pl}: show in D9`, kind: 'cross', run: { type: 'openChart', varga: 'D9', highlight: pl } });
    actions.push({ label: `${pl}: show in D10`, kind: 'cross', run: { type: 'openChart', varga: 'D10', highlight: pl } });
    actions.push({ label: `${pl}: Shadbala`, kind: 'cross', run: { type: 'addPanel', kind: 'Bala', highlight: pl } });
    actions.push({ label: `${pl}: Ashtakavarga`, kind: 'cross', run: { type: 'addPanel', kind: 'Ashtakavarga', highlight: pl } });
    actions.push({ label: `${pl}: Dashas`, kind: 'cross', run: { type: 'addPanel', kind: 'Dasha', highlight: pl } });
    actions.push({ label: `${pl}: Transit`, kind: 'cross', run: { type: 'addPanel', kind: 'Gochar', highlight: pl } });
    actions.push({ label: `${pl}: Ask Kashi`, kind: 'cross', run: { type: 'askKashi', planet: pl } });
  }

  return actions;
}

/**
 * Cross-calculation dossier for one planet, gathered from the single snapshot.
 * Pure read — never recomputes astrology.
 */
export function inspectPlanet(pro, name) {
  const k = pro.kundali;
  const p = (k.planets && (k.planets[name] || k.planets.find?.((x) => x.name === name)));
  if (!p) return { name, error: 'not found' };

  const facts = [
    { label: 'Sign', value: `${p.rashiEn} ${p.degreeStr}`, source: 'D1 longitude' },
    { label: 'House', value: p.house, source: 'house from Lagna' },
    { label: 'Nakshatra', value: `${p.nakshatra?.name} pada ${p.pada}`, source: 'longitude → nakshatra' },
    { label: 'Dignity', value: p.dignity || '—', source: 'dignity table' },
    { label: 'Motion', value: p.isRetrograde ? 'Retrograde' : 'Direct', source: 'daily motion' },
  ];

  // D9 & D10 positions (from vargas — memoized, no recompute)
  const cross = [];
  const vargaSign = (code, x) => x?.rashiEn || x?.signName || x?.rasiName || x?.rashiName;
  try {
    const d9 = pro.varga('D9');
    const pd9 = d9.planets?.[name] || d9.planets?.find?.((x) => x.name === name);
    if (pd9) cross.push({ label: 'D9 sign', value: vargaSign('D9', pd9), source: 'Navamsha' });
  } catch { /* optional */ }
  try {
    const d10 = pro.varga('D10');
    const pd10 = d10.planets?.[name] || d10.planets?.find?.((x) => x.name === name);
    if (pd10) cross.push({ label: 'D10 sign', value: vargaSign('D10', pd10), source: 'Dashamsha' });
  } catch { /* optional */ }

  // Shadbala rank
  try {
    const sb = pro.shadbala;
    const rec = sb?.planets?.[name] || sb?.[name] || (Array.isArray(sb?.rows) ? sb.rows.find((r) => r.planet === name) : null);
    if (rec) {
      const rupas = rec.totalRupa ?? rec.total ?? rec.totalRupas ?? rec.rupas;
      cross.push({ label: 'Shadbala', value: rupas != null ? `${rupas} rupas${rec.isStrong ? ' (strong)' : ''}` : '—', source: 'Shadbala' });
    }
  } catch { /* optional */ }

  return {
    name,
    facts,
    cross,
    verbs: ['Show in D9', 'Show in D10', 'Shadbala', 'Ashtakavarga', 'Dashas', 'Transit', 'Ask Kashi'],
  };
}

export default { WORKSPACE_PRESETS, PLANETS, buildCommandActions, inspectPlanet };

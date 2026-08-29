/**
 * REPORT SYSTEM — composable, decoupled from calculation.
 * =======================================================
 * A report is a TEMPLATE (ordered list of section ids). Rendering reads already
 * computed values from a professionalChart facade. Calculation logic is NEVER
 * coupled to rendering — sections only read, never compute domain rules inline.
 */

import { SIGN_NAMES, formatDMS } from './math.js';

export const REPORT_SECTIONS = [
  'cover', 'birthDetails', 'd1', 'planetTable', 'bhavaTable', 'vargas',
  'dasha', 'bala', 'ashtakavarga', 'yogaDosha', 'varshaphala', 'panchang',
  'interpretation', 'notes',
];

export const DEFAULT_TEMPLATES = {
  full: { id: 'full', name: 'Full Professional Report', sections: [...REPORT_SECTIONS.filter((s) => s !== 'varshaphala' && s !== 'panchang')] },
  quick: { id: 'quick', name: 'Quick Summary', sections: ['cover', 'birthDetails', 'd1', 'planetTable', 'dasha', 'yogaDosha'] },
  matching: { id: 'matching', name: 'Compatibility', sections: ['cover', 'birthDetails', 'planetTable', 'interpretation', 'notes'] },
};

/** Render a section to a plain data structure (renderer-agnostic). */
export function renderSection(sectionId, ctx) {
  const { pro, meta, interpretation, notes } = ctx;
  const k = pro.kundali;
  switch (sectionId) {
    case 'cover':
      return { type: 'cover', title: 'CosmicTantra — Jyotish Report', subtitle: meta?.name || 'Seeker', generatedAt: new Date().toISOString() };
    case 'birthDetails':
      return {
        type: 'keyvalues', title: 'Birth Details',
        rows: [
          ['Name', meta?.name || '—'],
          ['Date', k.meta.birthDate],
          ['Time', k.meta.birthTime],
          ['Place', k.meta.locationName],
          ['Latitude', k.meta.latitude],
          ['Longitude', k.meta.longitude],
          ['Timezone', k.meta.timezone],
          ['Ayanamsha (Lahiri)', `${k.meta.ayanamsha}°`],
          ['Lagna', `${k.lagna.rashiEn} ${k.lagna.degreeStr}`],
        ],
      };
    case 'd1':
      return { type: 'chart', title: 'Rashi Chart (D1)', chart: pro.varga('D1') };
    case 'planetTable':
      return {
        type: 'table', title: 'Planetary Positions',
        columns: ['Planet', 'Longitude', 'Rashi', 'Degree', 'Nakshatra', 'Pada', 'House', 'Dignity', 'Retro'],
        rows: k.planets.map((p) => [p.name, `${p.longitude.toFixed(3)}°`, p.rashiEn, p.degreeStr, p.nakshatra.name, p.pada, p.house, p.dignity, p.isRetrograde ? 'R' : '—']),
      };
    case 'bhavaTable':
      return {
        type: 'table', title: 'Bhava (House) Table',
        columns: ['House', 'Rashi', 'Lord', 'Significance', 'Occupants'],
        rows: k.houses.map((h) => [h.number, h.rashiEn, h.lord, h.significance, h.planets.join(', ') || '—']),
      };
    case 'vargas':
      return { type: 'vargas', title: 'Divisional Charts (Shodashavarga)', vargas: pro.vargas };
    case 'dasha':
      return { type: 'dasha', title: 'Vimshottari Dasha', dasha: pro.vimshottari };
    case 'bala':
      return { type: 'bala', title: 'Bala (Strength)', shadbala: pro.shadbala, vimshopaka: pro.vimshopaka };
    case 'ashtakavarga':
      return { type: 'ashtakavarga', title: 'Ashtakavarga', ashtakavarga: pro.ashtakavarga };
    case 'yogaDosha':
      return { type: 'yogaDosha', title: 'Yogas & Doshas', yogas: pro.yogas };
    case 'varshaphala':
      return { type: 'note', title: 'Varshaphala', text: 'Annual chart section (computed on demand for a chosen year).' };
    case 'panchang':
      return { type: 'note', title: 'Panchang', text: 'Birth-day Panchang section (computed on demand).' };
    case 'interpretation':
      return { type: 'prose', title: 'Interpretation', text: interpretation || '(Interpretation provided by practitioner / Kashi.)' };
    case 'notes':
      return { type: 'prose', title: 'Notes', text: notes || '' };
    default:
      return { type: 'unknown', sectionId };
  }
}

/** Build a full report object from a template + context. */
export function buildReport(template, ctx) {
  const tpl = typeof template === 'string' ? DEFAULT_TEMPLATES[template] : template;
  if (!tpl) throw new Error('Unknown report template');
  return {
    template: tpl.id,
    name: tpl.name,
    generatedAt: new Date().toISOString(),
    sections: tpl.sections.map((s) => renderSection(s, ctx)),
    provenance: {
      engine: 'CosmicTantra canonical (Lahiri Chitrapaksha)',
      deterministic: true,
      note: 'All values deterministically derived from the canonical snapshot; no LLM used for calculation.',
    },
  };
}

/** Render a report to printable HTML (rendering is separate from calculation). */
export function reportToHTML(report) {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const parts = [`<!doctype html><html><head><meta charset="utf-8"><title>${esc(report.name)}</title>`,
    '<style>body{font-family:Georgia,serif;max-width:820px;margin:2rem auto;color:#1c1917;line-height:1.5}h1{border-bottom:2px solid #8E6F1D}h2{margin-top:2rem;color:#8E6F1D}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}th{background:#faf7f2}.kv td:first-child{font-weight:bold;width:35%}</style></head><body>'];
  for (const sec of report.sections) {
    if (sec.type === 'cover') { parts.push(`<h1>${esc(sec.title)}</h1><p><em>${esc(sec.subtitle)}</em></p>`); continue; }
    parts.push(`<h2>${esc(sec.title || '')}</h2>`);
    if (sec.type === 'keyvalues') {
      parts.push('<table class="kv">' + sec.rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('') + '</table>');
    } else if (sec.type === 'table') {
      parts.push('<table><tr>' + sec.columns.map((c) => `<th>${esc(c)}</th>`).join('') + '</tr>' +
        sec.rows.map((row) => '<tr>' + row.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>');
    } else if (sec.type === 'prose' || sec.type === 'note') {
      parts.push(`<p>${esc(sec.text || '')}</p>`);
    } else if (sec.type === 'dasha') {
      const rows = (sec.dasha.periods || []).map((p) => `<tr><td>${esc(p.lord)}</td><td>${esc(p.start)}</td><td>${esc(p.end)}</td></tr>`).join('');
      parts.push(`<table><tr><th>Mahadasha</th><th>Start</th><th>End</th></tr>${rows}</table>`);
    } else if (sec.type === 'yogaDosha') {
      const rows = sec.yogas.detected.map((y) => `<tr><td>${esc(y.name)}</td><td>${esc(y.family)}</td><td>${esc(y.evidence.join('; '))}</td></tr>`).join('');
      parts.push(`<table><tr><th>Name</th><th>Type</th><th>Evidence</th></tr>${rows || '<tr><td colspan=3>None detected</td></tr>'}</table>`);
    } else {
      parts.push(`<p><em>[${esc(sec.type)} section]</em></p>`);
    }
  }
  parts.push(`<hr><p style="font-size:11px;color:#777">${esc(report.provenance.note)}</p></body></html>`);
  return parts.join('');
}

export default { REPORT_SECTIONS, DEFAULT_TEMPLATES, renderSection, buildReport, reportToHTML };

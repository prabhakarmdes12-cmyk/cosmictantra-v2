/**
 * BOOK RENDERERS (PROGRAM 6 / TRUST-03)
 * =====================================
 * Renderer-independent book model → concrete output. The SAME book renders to
 * multiple targets. Rendering NEVER computes astrology; it only formats what the
 * book already contains, including the mandatory provenance block.
 */

import { reportToHTML } from './reports.js';
import { RENDER_TARGET } from './bookModel.js';

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function provenanceHTML(p) {
  const rows = [
    ['Subject', p.subject],
    ['Birth date', p.birth.date],
    ['Birth time', p.birth.time + (p.birth.timeConfidence ? ` (${p.birth.timeConfidence})` : '')],
    ['Place', p.birth.place],
    ['Coordinates', `${p.birth.latitude}, ${p.birth.longitude}`],
    ['Timezone', p.birth.timezone],
    ['Ayanamsha', p.ayanamsha],
    ...p.conventions.map((c) => [c.key, c.value]),
    ['Engine version', p.versions.engineVersion],
    ['Ruleset version', p.versions.rulesetVersion],
    ['Generated', p.generatedAt],
  ];
  return `<section class="provenance"><h2>Calculation Identity</h2><table class="kv">${
    rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')
  }</table><p class="fine">${esc(p.determinism || p.qualification.determinism)}</p><p class="fine">${esc(p.qualification.externalQualification)}</p><p class="fine">${esc(p.honesty)}</p></section>`;
}

function interpretationHTML(sec) {
  const claims = sec.claims.map((c) => {
    const ev = (c.evidence || []).map((e) => `<li><b>Evidence:</b> ${esc(e.fact)} <span class="src">— ${esc(e.source)}</span></li>`).join('');
    const rule = c.rule ? `<li><b>Rule:</b> ${esc(c.rule.principle)} <span class="src">— ${esc(c.rule.source)}</span></li>` : '';
    const syn = sec.ledgerOnly ? '' : `<li><b>Synthesis:</b> ${esc(c.synthesis)}</li>`;
    return `<div class="claim"><h4>${esc(c.topic)}</h4><ul>${ev}${rule}${syn}</ul></div>`;
  }).join('');
  return `<section><h2>${esc(sec.title)}</h2><p class="method">Method: ${esc(sec.method)}. ${esc(sec.disclaimer)}</p>${claims || '<p class="fine">No evidence-backed statements available for this chart.</p>'}</section>`;
}

function highlightsHTML(sec) {
  return `<section><h2>${esc(sec.title)}</h2><table class="kv">${
    sec.items.map((i) => `<tr><td>${esc(i.label)}</td><td>${esc(i.value)} <span class="src">— ${esc(i.evidence)}</span></td></tr>`).join('')
  }</table></section>`;
}

const STYLE = `body{font-family:Georgia,serif;max-width:820px;margin:2rem auto;color:#1c1917;line-height:1.55;padding:0 1rem}
h1{border-bottom:2px solid #8E6F1D;padding-bottom:.3rem}h2{margin-top:2rem;color:#8E6F1D}
h4{margin:.8rem 0 .2rem}table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}th{background:#faf7f2}
.kv td:first-child{font-weight:bold;width:38%}.src{color:#777;font-size:11px}
.fine{font-size:11px;color:#777}.method{font-size:12px;color:#555;font-style:italic}
.claim ul{margin:.2rem 0 .6rem;padding-left:1.1rem}.claim li{margin:.15rem 0}
.provenance{background:#faf7f2;border:1px solid #e6dfcf;padding:.5rem 1rem;border-radius:8px}
@media print{body{margin:0;max-width:none}h2{page-break-after:avoid}.claim{page-break-inside:avoid}}`;

/** Render a book to HTML (used for WEB, PRINT and PDF-source). */
export function bookToHTML(book, target = RENDER_TARGET.WEB) {
  const p = book.provenance;
  const parts = [`<!doctype html><html><head><meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${esc(book.name)} — ${esc(p.subject)}</title><style>${STYLE}</style></head><body>`];

  parts.push(`<h1>${esc(book.name)}</h1><p><em>${esc(p.subject)} · ${esc(book.audience)}</em></p>`);
  parts.push(provenanceHTML(p)); // provenance ALWAYS present, near the top

  for (const sec of book.sections) {
    if (!sec) continue;
    if (sec.type === 'interpretation') { parts.push(interpretationHTML(sec)); continue; }
    if (sec.type === 'highlights') { parts.push(highlightsHTML(sec)); continue; }
    if (sec.type === 'cover') { parts.push(`<section><h2>${esc(sec.title)}</h2></section>`); continue; }
    // Reuse the report HTML fragment for standard data sections.
    parts.push(reportToHTML({ name: book.name, sections: [sec], provenance: { note: '' } })
      .replace(/^[\s\S]*?<body>/, '').replace(/<hr>[\s\S]*$/, ''));
  }

  if (target === RENDER_TARGET.PRINT || target === RENDER_TARGET.PDF) {
    parts.push(`<script>if(window.matchMedia){/* print-ready */}</script>`);
  }
  parts.push('</body></html>');
  return parts.join('');
}

/**
 * Render a book to a compact WEB model (for React consumption) — same content,
 * structured rather than HTML. MOBILE uses the same model with a mobile layout.
 */
export function bookToWebModel(book) {
  return {
    variant: book.variant,
    name: book.name,
    audience: book.audience,
    provenance: book.provenance,
    sections: book.sections,
  };
}

export default { bookToHTML, bookToWebModel };

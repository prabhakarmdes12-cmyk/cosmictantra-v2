/**
 * KUNDLI BOOK MODEL (PROGRAM 6 / TRUST-03)
 * ========================================
 * A renderer-INDEPENDENT description of a Jyotish book. The SAME model renders
 * to WEB, MOBILE, PRINT and PDF (see renderers.js). Calculation is never coupled
 * to rendering — a book only reads already-computed values from a
 * professionalChart facade.
 *
 * EVERY book carries a provenance block: birth details, coordinates, timezone,
 * convention settings, engine/ruleset versions, generation timestamp and the
 * qualification status of the capabilities it uses. No book can present a value
 * without its calculation identity.
 *
 * NO GENERIC FILLER. Interpretive blocks are produced by the synthesis layer
 * (interpret.js) which flows EVIDENCE → RULES → SYNTHESIS. There is no
 * sign→canned-paragraph mapping and no marketing prose.
 */

import { buildReport } from './reports.js';
import { synthesizeInterpretation } from './interpret.js';
import { describeConventions, resolveConventions } from './conventions.js';
import { versionStamp } from './versions.js';

export const BOOK_VARIANTS = {
  COSMIC_SNAPSHOT: {
    id: 'COSMIC_SNAPSHOT',
    name: 'Cosmic Snapshot',
    audience: 'first-time consumer',
    sections: ['cover', 'birthDetails', 'd1', 'highlights', 'interpretation'],
  },
  PERSONAL_KUNDLI: {
    id: 'PERSONAL_KUNDLI',
    name: 'Personal Kundli',
    audience: 'consumer',
    sections: ['cover', 'birthDetails', 'd1', 'planetTable', 'bhavaTable', 'dasha', 'yogaDosha', 'highlights', 'interpretation'],
  },
  COMPLETE_VEDIC_KUNDLI: {
    id: 'COMPLETE_VEDIC_KUNDLI',
    name: 'Complete Vedic Kundli',
    audience: 'serious consumer',
    sections: ['cover', 'birthDetails', 'd1', 'planetTable', 'bhavaTable', 'vargas', 'dasha', 'bala', 'ashtakavarga', 'yogaDosha', 'highlights', 'interpretation'],
  },
  PANDIT_TECHNICAL_BOOK: {
    id: 'PANDIT_TECHNICAL_BOOK',
    name: 'Pandit Technical Book',
    audience: 'practising Pandit',
    sections: ['cover', 'birthDetails', 'd1', 'planetTable', 'bhavaTable', 'vargas', 'dasha', 'bala', 'ashtakavarga', 'yogaDosha', 'evidenceLedger'],
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Custom',
    audience: 'any',
    sections: [], // caller supplies section list
  },
};

export const RENDER_TARGET = { WEB: 'WEB', MOBILE: 'MOBILE', PRINT: 'PRINT', PDF: 'PDF' };

/**
 * Build the provenance block that stamps every book.
 * Includes qualification status so a reader can see nothing is claimed as
 * externally-proven unless it genuinely is.
 */
function buildProvenance(pro, meta) {
  const k = pro.kundali;
  const conv = resolveConventions(pro.conventions);
  return {
    subject: meta?.name || 'Seeker',
    birth: {
      date: k.meta?.birthDate ?? k.metadata?.birthDate,
      time: k.meta?.birthTime ?? k.metadata?.birthTime,
      timeConfidence: meta?.birthTimeConfidence || null,
      place: k.meta?.locationName ?? k.metadata?.locationName,
      latitude: k.meta?.latitude ?? k.metadata?.latitude,
      longitude: k.meta?.longitude ?? k.metadata?.longitude,
      timezone: k.meta?.timezone ?? k.metadata?.timezone,
    },
    conventions: describeConventions(conv),
    ayanamsha: `${k.ayanamsha ?? k.meta?.ayanamsha}° (${conv.ayanamsha})`,
    versions: pro.versions || versionStamp(),
    generatedAt: new Date().toISOString(),
    qualification: {
      // Honest status: computed deterministically, external qualification pending.
      determinism: 'All values deterministically derived from the canonical snapshot. No LLM, no paid API, no network.',
      externalQualification: 'PENDING_EXTERNAL_REFERENCE — see Jyotish Qualification Lab. Values are computed and internally verified, not yet externally certified.',
    },
    honesty: 'This book contains no generic filler. Interpretations are traceable to calculated evidence and named classical rules.',
  };
}

/** Extract deterministic "highlights" (facts, not prose). */
function buildHighlights(pro) {
  const k = pro.kundali;
  const items = [
    { label: 'Lagna (Ascendant)', value: `${k.lagna.rashiEn} ${k.lagna.degreeStr}`, evidence: 'D1 ascendant longitude' },
    { label: 'Rashi (Moon sign)', value: k.moon.rashiEn, evidence: 'Moon longitude → sign' },
    { label: 'Nakshatra', value: `${k.moon.nakshatra?.name} (pada ${k.moon.pada})`, evidence: 'Moon longitude → nakshatra' },
    { label: 'Sun sign', value: k.planets.Sun.rashiEn, evidence: 'Sun longitude → sign' },
  ];
  try {
    const v = pro.vimshottari;
    const now = Date.now();
    const cur = (v.periods || v.mahadashas || []).find((p) => now >= new Date(p.start).getTime() && now < new Date(p.end).getTime());
    if (cur) items.push({ label: 'Current Mahadasha', value: cur.lord, evidence: `Vimshottari: ${cur.start?.slice(0, 10)} → ${cur.end?.slice(0, 10)}` });
  } catch { /* dasha optional */ }
  return { type: 'highlights', title: 'Key Points', items };
}

/**
 * Build a renderer-independent book.
 * @param {string|object} variant  a BOOK_VARIANTS key/object, or CUSTOM with sections
 * @param {object} ctx  { pro, meta, notes, sections? }
 */
export function buildBook(variant, ctx) {
  const v = typeof variant === 'string' ? BOOK_VARIANTS[variant] : variant;
  if (!v) throw new Error(`Unknown book variant: ${variant}`);
  const sections = (v.id === 'CUSTOM' ? (ctx.sections || []) : v.sections);
  const { pro, meta } = ctx;

  // Reuse the composable report renderer for the standard data sections, but
  // replace interpretation/highlights/evidence with evidence-grounded content.
  const baseSectionIds = sections.filter((s) => !['highlights', 'interpretation', 'evidenceLedger'].includes(s));
  const baseReport = buildReport({ id: 'book', name: v.name, sections: baseSectionIds }, ctx);

  const rendered = [];
  for (const s of sections) {
    if (s === 'highlights') rendered.push(buildHighlights(pro));
    else if (s === 'interpretation') rendered.push(synthesizeInterpretation(pro, { title: 'Interpretation' }));
    else if (s === 'evidenceLedger') rendered.push(synthesizeInterpretation(pro, { title: 'Evidence Ledger', ledgerOnly: true }));
    else {
      const found = baseReport.sections.find((rs) => rs.__id === s) || baseReport.sections.shift();
      if (found) rendered.push(found);
    }
  }

  return {
    variant: v.id,
    name: v.name,
    audience: v.audience,
    provenance: buildProvenance(pro, meta),
    sections: rendered,
  };
}

export default { BOOK_VARIANTS, RENDER_TARGET, buildBook };

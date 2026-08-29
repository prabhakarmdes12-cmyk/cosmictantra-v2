/**
 * INTERPRETATION SYNTHESIS (PROGRAM 6/13 / TRUST-03, feeds TRUST-05)
 * ==================================================================
 * The ONLY sanctioned way to produce interpretive text in a book.
 *
 * Every interpretation follows EVIDENCE → RULE → SYNTHESIS:
 *   1. EVIDENCE  — a calculated fact from the canonical snapshot (with its source).
 *   2. RULE      — a named classical principle that applies to that fact.
 *   3. SYNTHESIS — a plain-language statement that is TRACEABLE to (1) and (2).
 *
 * FORBIDDEN (enforced by tests):
 *   - No sign → canned-paragraph mapping.
 *   - No marketing prose ("99% accurate", "500 yogas", "world's best").
 *   - No claim without at least one piece of calculated evidence.
 *
 * When no evidence supports a claim, we emit nothing (or, for Kashi in TRUST-05,
 * INSUFFICIENT_CALCULATION_EVIDENCE) — never a hallucinated statement.
 */

import { evaluateYogas } from './yogaRegistry.js';

/** A single traceable interpretive unit. */
function claim({ topic, evidence, rule, synthesis, confidence }) {
  return {
    topic,
    evidence,        // array of { fact, source }
    rule,            // { principle, source } or null (pure calculated fact)
    synthesis,       // plain-language, derived only from evidence + rule
    confidence,      // 'CALCULATED' | 'RULE_BASED' | 'SYNTHESIS'
  };
}

/** Lagna & luminaries — calculated facts, framed without embellishment. */
function foundationClaims(pro) {
  const k = pro.kundali;
  const out = [];

  out.push(claim({
    topic: 'Ascendant',
    evidence: [{ fact: `Lagna at ${k.lagna.rashiEn} ${k.lagna.degreeStr}`, source: 'D1 ascendant longitude' }],
    rule: { principle: 'The Lagna and its lord describe the physical self, temperament and life direction.', source: 'BPHS, Lagna adhyaya' },
    synthesis: `The ascendant is ${k.lagna.rashiEn}, ruled by ${k.lagna.lord}. The placement and strength of ${k.lagna.lord} therefore carries primary weight for self-expression and vitality.`,
    confidence: 'RULE_BASED',
  }));

  const moon = k.moon;
  out.push(claim({
    topic: 'Mind & emotions (Chandra)',
    evidence: [
      { fact: `Moon in ${moon.rashiEn}, ${moon.nakshatra?.name} pada ${moon.pada}`, source: 'Moon longitude → sign/nakshatra' },
      { fact: `Moon in house ${moon.house}`, source: 'Moon house from Lagna' },
    ],
    rule: { principle: 'The Moon signifies the mind (manas), emotional nature and the running dasha framework.', source: 'BPHS, Chandra' },
    synthesis: `Emotional temperament is coloured by ${moon.rashiEn} and the ${moon.nakshatra?.name} nakshatra; its house-${moon.house} placement indicates the life area where the mind is most engaged.`,
    confidence: 'RULE_BASED',
  }));

  return out;
}

/** Dignity-based strength notes — only for planets with a definite dignity. */
function dignityClaims(pro) {
  const k = pro.kundali;
  const out = [];
  for (const p of k.planets) {
    if (!p.dignity) continue;
    const strong = /exalt|own|moolatrikona/i.test(p.dignity);
    const weak = /debilit|enemy/i.test(p.dignity);
    if (!strong && !weak) continue;
    out.push(claim({
      topic: `${p.name} dignity`,
      evidence: [{ fact: `${p.name} in ${p.rashiEn} — dignity: ${p.dignity}`, source: 'planet sign vs. dignity table' }],
      rule: { principle: `A planet in ${strong ? 'exaltation/own sign gains strength (sthana bala)' : 'debilitation/enemy sign loses positional strength'}.`, source: 'BPHS, Bala' },
      synthesis: `${p.name} is ${strong ? 'positionally strong' : 'positionally weak'} in ${p.rashiEn}, so results signified by ${p.name} tend to be ${strong ? 'supported' : 'strained'} unless modified by other factors (aspects, dasha, cancellation).`,
      confidence: 'RULE_BASED',
    }));
  }
  return out;
}

/** Yoga/Dosha claims — driven entirely by the rule registry's detected results. */
function yogaClaims(pro) {
  const y = pro.yogas || evaluateYogas(pro.kundali);
  return (y.detected || []).map((r) => claim({
    topic: r.name,
    evidence: (r.evidence || []).map((e) => ({ fact: e, source: `${r.applicableChart} chart` })),
    rule: { principle: r.conditions, source: `${r.source} (${r.tradition})` },
    synthesis: `${r.name} is present. ${r.family === 'Dosha' ? 'This is a caution factor' : 'This is a supportive combination'}; ${r.cancellation ? `note cancellation rule: ${r.cancellation}` : 'no standard cancellation applies here.'}`,
    confidence: 'RULE_BASED',
  }));
}

/** Current dasha framing — calculated fact + timing rule. */
function dashaClaims(pro) {
  const out = [];
  try {
    const v = pro.vimshottari;
    const now = Date.now();
    const cur = (v.periods || v.mahadashas || []).find((p) => now >= new Date(p.start).getTime() && now < new Date(p.end).getTime());
    if (cur) {
      out.push(claim({
        topic: 'Current period (Mahadasha)',
        evidence: [{ fact: `${cur.lord} Mahadasha: ${String(cur.start).slice(0, 10)} → ${String(cur.end).slice(0, 10)}`, source: 'Vimshottari from Moon nakshatra' }],
        rule: { principle: 'The Mahadasha lord activates the houses it owns, occupies and aspects for the period.', source: 'BPHS, Dasha' },
        synthesis: `Currently running the ${cur.lord} Mahadasha. Themes for this period follow the houses ${cur.lord} rules and occupies in this chart.`,
        confidence: 'RULE_BASED',
      }));
    }
  } catch { /* dasha optional */ }
  return out;
}

/**
 * Build an interpretation section for a book.
 * @returns a renderer-independent section of traceable claims (never prose blobs).
 */
export function synthesizeInterpretation(pro, opts = {}) {
  const claims = [
    ...foundationClaims(pro),
    ...dignityClaims(pro),
    ...yogaClaims(pro),
    ...dashaClaims(pro),
  ];
  return {
    type: 'interpretation',
    __id: opts.ledgerOnly ? 'evidenceLedger' : 'interpretation',
    title: opts.title || 'Interpretation',
    method: 'EVIDENCE → RULE → SYNTHESIS',
    disclaimer: 'Every statement below is traceable to a calculated fact and a named classical rule. No generic descriptions are used.',
    claims,
    // A ledger view shows only evidence+rule (for Pandits / auditors).
    ledgerOnly: !!opts.ledgerOnly,
  };
}

/** Guard used by tests: detect banned generic/marketing phrasing. */
export const BANNED_PHRASES = [
  '99% accurate', '100% accurate', 'world\'s best', 'guaranteed', '500 yogas',
  'ai accuracy', 'as an ai', 'lorem ipsum',
];

export function containsBannedProse(text) {
  const t = String(text || '').toLowerCase();
  return BANNED_PHRASES.some((p) => t.includes(p));
}

export default { synthesizeInterpretation, containsBannedProse, BANNED_PHRASES };

/**
 * EVIDENCE GRAPH (PROGRAM 11 / TRUST-05)
 * ======================================
 * A single, queryable graph of CALCULATED FACTS extracted from one canonical
 * snapshot. This is the ONLY thing Kashi (or any consumer) is allowed to reason
 * over. Nothing in this graph is invented — every node is a deterministic value
 * with a provenance source.
 *
 * Node shape: { id, kind, subject, statement, value, source, tags[] }
 *   kind ∈ CALCULATED_FACT (this module never emits interpretation).
 *
 * Kashi turns these facts into interpretation/synthesis with explicit rules and
 * confidence — see kashi.js. If a topic has no supporting nodes, the answer is
 * INSUFFICIENT_CALCULATION_EVIDENCE.
 */

import { evaluateYogas } from './yogaRegistry.js';

let _n = 0;
function node(kind, subject, statement, value, source, tags = []) {
  return { id: `ev${++_n}`, kind, subject, statement, value, source, tags };
}

export const FACT = 'CALCULATED_FACT';

/**
 * Build the evidence graph for a professionalChart. Pure read of the snapshot;
 * memoized by the caller (derive) so this is cheap to re-query.
 */
export function buildEvidenceGraph(pro) {
  _n = 0;
  const k = pro.kundali || {};
  const nodes = [];

  // Lagna
  if (k.lagna && k.lagna.rashiEn) {
    nodes.push(node(FACT, 'lagna', `Lagna is ${k.lagna.rashiEn} at ${k.lagna.degreeStr}`, k.lagna.rashiEn, 'D1 ascendant longitude', ['lagna', 'self', 'ascendant', k.lagna.rashiEn.toLowerCase()]));
    if (k.lagna.lord) nodes.push(node(FACT, 'lagna.lord', `Lagna lord is ${k.lagna.lord}`, k.lagna.lord, 'sign lordship', ['lagna', 'lord', 'self']));
  }

  // Planets
  for (const p of (k.planets || [])) {
    const tags = [p.name.toLowerCase(), 'planet', `house${p.house}`, p.rashiEn.toLowerCase()];
    nodes.push(node(FACT, p.name, `${p.name} in ${p.rashiEn} (${p.degreeStr}), house ${p.house}, ${p.nakshatra?.name} pada ${p.pada}`,
      { sign: p.rashiEn, house: p.house, longitude: p.longitude, nakshatra: p.nakshatra?.name, pada: p.pada, dignity: p.dignity, retro: !!p.isRetrograde },
      'planet longitude → sign/house/nakshatra', tags));
    if (p.dignity) nodes.push(node(FACT, `${p.name}.dignity`, `${p.name} dignity: ${p.dignity}`, p.dignity, 'dignity table', [p.name.toLowerCase(), 'dignity', 'strength']));
  }

  // Moon specifics (mind, emotions, dasha basis)
  if (k.moon && k.moon.nakshatra) {
    nodes.push(node(FACT, 'moon.nakshatra', `Moon nakshatra is ${k.moon.nakshatra?.name} pada ${k.moon.pada}`, k.moon.nakshatra?.name, 'Moon longitude → nakshatra', ['moon', 'mind', 'emotion', 'nakshatra', 'dasha']));
  }

  // Houses
  for (const h of (k.houses || [])) {
    nodes.push(node(FACT, `house${h.number}`, `House ${h.number}: ${h.rashiEn}, lord ${h.lord}, occupants: ${(h.planets || []).join(', ') || 'none'}`,
      { number: h.number, sign: h.rashiEn, lord: h.lord, occupants: h.planets || [] },
      'house from Lagna', [`house${h.number}`, 'bhava', (h.lord || '').toLowerCase()]));
  }

  // Yogas / doshas (from rule registry — detected only)
  try {
    const y = pro.yogas || evaluateYogas(k);
    for (const r of (y.detected || [])) {
      nodes.push(node(FACT, `yoga.${r.id}`, `${r.name} present (${r.family})`, { name: r.name, family: r.family, evidence: r.evidence },
        `${r.source} (${r.tradition})`, ['yoga', 'dosha', r.family.toLowerCase(), r.name.toLowerCase().replace(/\s+/g, '')]));
    }
  } catch { /* optional */ }

  // Current dasha
  try {
    const v = pro.vimshottari;
    const now = Date.now();
    const cur = (v.periods || v.mahadashas || []).find((p) => now >= new Date(p.start).getTime() && now < new Date(p.end).getTime());
    if (cur) nodes.push(node(FACT, 'dasha.current', `Current Mahadasha: ${cur.lord} (${String(cur.start).slice(0, 10)} → ${String(cur.end).slice(0, 10)})`,
      { lord: cur.lord, start: cur.start, end: cur.end }, 'Vimshottari from Moon nakshatra', ['dasha', 'timing', 'period', cur.lord.toLowerCase()]));
  } catch { /* optional */ }

  return {
    nodes,
    subjects: [...new Set(nodes.map((x) => x.subject))],
    count: nodes.length,
  };
}

/** Retrieve nodes relevant to a set of tags/keywords (used by the retrieval plan). */
export function queryEvidence(graph, keywords) {
  const kw = keywords.map((s) => s.toLowerCase());
  return graph.nodes.filter((nd) =>
    kw.some((k) => nd.tags.includes(k) || nd.subject.toLowerCase().includes(k) || String(nd.statement).toLowerCase().includes(k))
  );
}

export default { FACT, buildEvidenceGraph, queryEvidence };

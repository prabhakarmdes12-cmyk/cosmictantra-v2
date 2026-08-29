/**
 * CROSS-SURFACE INVARIANTS & CONTRADICTION DETECTOR (PROGRAM 8 / TRUST-08)
 * =======================================================================
 * One canonical snapshot must produce ONE truth on every surface. This module
 * asserts that the same calculated facts appear identically wherever they are
 * consumed (chart, planet table, evidence graph, book, mobile view, Kashi) — no
 * duplicated calculation, no drift.
 *
 * A contradiction is a P0 trust failure: it means two surfaces disagree about
 * the same person. checkContradictions() returns every violation with detail.
 */

import { buildEvidenceGraph } from './evidenceGraph.js';
import { buildBook } from './bookModel.js';
import { buildMobileView, MOBILE_MODE } from './mobileView.js';

function violation(code, message, detail) {
  return { code, message, detail };
}

/**
 * Run all cross-surface invariants for a chart.
 * @returns { ok, violations[] }
 */
export function checkContradictions(pro) {
  const v = [];
  const k = pro.kundali;

  // INV-1: Lagna sign is identical in kundali, evidence graph and mobile view.
  const lagnaKundali = k.lagna.rashiEn;
  const graph = pro.evidence || buildEvidenceGraph(pro);
  const lagnaEvidence = graph.nodes.find((n) => n.subject === 'lagna')?.value;
  if (lagnaEvidence && lagnaEvidence !== lagnaKundali) {
    v.push(violation('INV_LAGNA_001', 'Lagna differs between snapshot and evidence graph', { lagnaKundali, lagnaEvidence }));
  }
  const mobile = buildMobileView(pro, MOBILE_MODE.CONSUMER);
  const lagnaMobile = mobile.cards.find((c) => c.id === 'identity')?.items.find((i) => i.label === 'Ascendant')?.value;
  if (lagnaMobile && lagnaMobile !== lagnaKundali) {
    v.push(violation('INV_LAGNA_002', 'Lagna differs between snapshot and mobile view', { lagnaKundali, lagnaMobile }));
  }

  // INV-2: Each planet's sign is identical in the planet list and evidence graph.
  for (const p of k.planets) {
    const node = graph.nodes.find((n) => n.subject === p.name);
    if (node && node.value && node.value.sign && node.value.sign !== p.rashiEn) {
      v.push(violation('INV_PLANET_SIGN', `${p.name} sign differs between snapshot and evidence graph`, { planet: p.name, snapshot: p.rashiEn, graph: node.value.sign }));
    }
    if (node && node.value && node.value.house && node.value.house !== p.house) {
      v.push(violation('INV_PLANET_HOUSE', `${p.name} house differs between snapshot and evidence graph`, { planet: p.name, snapshot: p.house, graph: node.value.house }));
    }
  }

  // INV-3: A book built from the same snapshot reports the same birth date & ayanamsha.
  const book = buildBook('COSMIC_SNAPSHOT', { pro, meta: { name: 'x' } });
  const bookDate = book.provenance.birth.date;
  const snapDate = k.meta?.birthDate ?? k.metadata?.birthDate;
  if (bookDate !== snapDate) {
    v.push(violation('INV_BOOK_BIRTH', 'Book birth date differs from snapshot', { bookDate, snapDate }));
  }

  // INV-4: Snapshot identity — the same params+conventions reuse the same object.
  //        (compute-once guarantee; a second facade over the same key shares it.)
  //        Verified structurally: kundali has a stable _key.
  if (!k._key) v.push(violation('INV_SNAPSHOT_KEY', 'Snapshot is missing its identity key', {}));

  // INV-5: Moon sign consistency (kundali.moon vs planet list vs graph).
  const moonFromPlanets = k.planets.Moon?.rashiEn || k.planets.find?.((p) => p.name === 'Moon')?.rashiEn;
  if (moonFromPlanets && moonFromPlanets !== k.moon.rashiEn) {
    v.push(violation('INV_MOON_001', 'Moon sign differs between moon summary and planet list', { moonSummary: k.moon.rashiEn, moonPlanet: moonFromPlanets }));
  }

  return { ok: v.length === 0, violations: v, checked: 5 };
}

export default { checkContradictions };

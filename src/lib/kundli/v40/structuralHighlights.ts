/**
 * KUNDLI V40 — structural highlights (§8).
 *
 * Surfaces the structures a Pandit would notice first, chosen by declared
 * salience rules over canonical facts. No model, no LLM, no hand-written
 * per-chart content: the same rules run for every chart.
 *
 * Each rule states why it fired, so a scholar can disagree with the ranking
 * without being unable to see the ranking.
 */

import type { KundliCanonicalModel } from '../types';
import type { ContentType, JyotishSystem } from './contentTypes';
import { FACT } from './factPaths';
import type { GrahaConditionResult } from './grahaCondition';
import type { BhavaIntelligenceResult } from './bhavaIntelligence';
import { dm } from './format';

export const STRUCTURAL_HIGHLIGHTS_VERSION = 'structural-highlights-v1';

export interface StructuralHighlight {
  id: string;
  /** Declared salience rule that produced this line. */
  ruleId: string;
  /** Higher = surfaced earlier. Set by the rule, not tuned per chart. */
  priority: number;
  statement: string;
  contentType: ContentType;
  system: JyotishSystem;
  evidenceIds: string[];
}

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

export function buildStructuralHighlights(
  canonical: KundliCanonicalModel,
  conditions: GrahaConditionResult,
  bhavas: BhavaIntelligenceResult,
  limit = 8,
): StructuralHighlight[] {
  const out: StructuralHighlight[] = [];
  const push = (h: StructuralHighlight) => out.push(h);

  /* R1 — graha concentration (3 or more grahas in one bhava). */
  const byHouse = new Map<number, string[]>();
  for (const p of canonical.planets) {
    byHouse.set(p.house, [...(byHouse.get(p.house) ?? []), p.id]);
  }
  for (const [house, grahas] of byHouse) {
    if (grahas.length >= 3) {
      push({
        id: `HL_STELLIUM_H${house}`,
        ruleId: 'SALIENCE_CONCENTRATION_3_PLUS',
        priority: 100 + grahas.length,
        statement: `${grahas.join(' + ')} together in the ${ORDINAL[house]} bhava (${grahas.length} grahas in one bhava).`,
        contentType: 'DERIVED_JYOTISH_FACT',
        system: 'PARASHARI',
        evidenceIds: grahas.map((g) => FACT.planetHouse(g)),
      });
    }
  }

  /* R2 — exalted / debilitated / own-sign / moolatrikona placements. */
  for (const c of conditions.conditions) {
    const strong = c.dignity.category;
    if (strong === 'EXALTED' || strong === 'DEBILITATED' || strong === 'OWN_SIGN' || strong === 'MOOLATRIKONA') {
      const priority = strong === 'EXALTED' ? 95 : strong === 'DEBILITATED' ? 94 : strong === 'MOOLATRIKONA' ? 90 : 88;
      push({
        id: `HL_DIGNITY_${c.graha}`,
        ruleId: 'SALIENCE_DIGNITY_EXTREME',
        priority,
        statement: `${c.graha} in ${c.signName} — ${strong.replace(/_/g, ' ').toLowerCase()} — in the ${ORDINAL[c.house]} bhava at ${dm(c.degreeInSign)}.`,
        contentType: 'DERIVED_JYOTISH_FACT',
        system: 'PARASHARI',
        evidenceIds: [FACT.planetDignity(c.graha), FACT.planetSignId(c.graha), FACT.planetHouse(c.graha)],
      });
    }
  }

  /* R3 — lagnesha placement (always relevant). */
  const lagnesha = bhavas.bhavas.find((b) => b.house === 1)?.lord;
  if (lagnesha) {
    const c = conditions.conditions.find((x) => x.graha === lagnesha);
    if (c) {
      push({
        id: 'HL_LAGNESHA',
        ruleId: 'SALIENCE_LAGNESHA',
        priority: 99,
        statement: `Lagnesha ${lagnesha} occupies the ${ORDINAL[c.house]} bhava in ${c.signName} at ${dm(c.degreeInSign)}.`,
        contentType: 'DERIVED_JYOTISH_FACT',
        system: 'PARASHARI',
        evidenceIds: [FACT.houseSignLord(1), FACT.planetHouse(lagnesha), FACT.planetSignId(lagnesha)],
      });
    }
  }

  /* R4 — yogakaraka placement. */
  for (const c of conditions.conditions) {
    if (c.functionalLordship.yogakaraka) {
      push({
        id: `HL_YOGAKARAKA_${c.graha}`,
        ruleId: 'SALIENCE_YOGAKARAKA',
        priority: 93,
        statement: `${c.graha} is yogakaraka for this lagna (rules the ${c.functionalLordship.ruledHouses.map((h) => ORDINAL[h]).join(' and ')}) and sits in the ${ORDINAL[c.house]} bhava.`,
        contentType: 'DERIVED_JYOTISH_FACT',
        system: 'PARASHARI',
        evidenceIds: [FACT.planetHouse(c.graha), ...c.functionalLordship.ruledHouses.map((h) => FACT.houseSignId(h))],
      });
    }
  }

  /* R5 — Moon placement (the mind, always read). */
  const moon = conditions.conditions.find((c) => c.graha === 'Moon');
  if (moon) {
    push({
      id: 'HL_MOON',
      ruleId: 'SALIENCE_MOON',
      priority: 92,
      statement: `Moon in ${moon.signName} in the ${ORDINAL[moon.house]} bhava, nakshatra ${moon.nakshatra} pada ${moon.pada}.`,
      contentType: 'DERIVED_JYOTISH_FACT',
      system: 'PARASHARI',
      evidenceIds: [FACT.planetHouse('Moon'), FACT.planetSignId('Moon'), FACT.planetNakshatra('Moon')],
    });
  }

  /* R6 — grahas in a kendra or trikona other than those already surfaced. */
  for (const c of conditions.conditions) {
    if ([1, 4, 7, 10, 5, 9].includes(c.house) && !out.some((h) => h.id.endsWith(`_${c.graha}`))) {
      push({
        id: `HL_ANGULAR_${c.graha}`,
        ruleId: 'SALIENCE_ANGULAR',
        priority: 70 + (c.house === 10 ? 6 : c.house === 1 ? 5 : 0),
        statement: `${c.graha} in the ${ORDINAL[c.house]} bhava (${c.signName}) at ${dm(c.degreeInSign)}.`,
        contentType: 'DERIVED_JYOTISH_FACT',
        system: 'PARASHARI',
        evidenceIds: [FACT.planetHouse(c.graha), FACT.planetSignId(c.graha)],
      });
    }
  }

  /* R7 — retrograde taragrahas. */
  const retro = conditions.conditions.filter(
    (c) => c.motion.retrograde && !['Rahu', 'Ketu'].includes(c.graha),
  );
  if (retro.length > 0) {
    push({
      id: 'HL_RETROGRADE',
      ruleId: 'SALIENCE_RETROGRADE',
      priority: 65,
      statement: `Retrograde at birth: ${retro.map((c) => `${c.graha} (${ORDINAL[c.house]} bhava)`).join(', ')}.`,
      contentType: 'DERIVED_JYOTISH_FACT',
      system: 'PARASHARI',
      evidenceIds: retro.map((c) => FACT.planetRetrograde(c.graha)),
    });
  }

  /* R8 — combustion. */
  const combust = conditions.conditions.filter((c) => c.combustion.status === 'COMBUST');
  if (combust.length > 0) {
    push({
      id: 'HL_COMBUST',
      ruleId: 'SALIENCE_COMBUSTION',
      priority: 80,
      statement: `Combust (asta): ${combust.map((c) => `${c.graha} at ${c.combustion.angularDistance?.toFixed(2)}° from the Sun, orb ${c.combustion.orbUsed}°`).join('; ')}.`,
      contentType: 'DERIVED_JYOTISH_FACT',
      system: 'PARASHARI',
      evidenceIds: combust.flatMap((c) => c.combustion.evidenceIds),
    });
  }

  /* R9 — vargottama grahas. */
  const vargottama = conditions.conditions.filter((c) => c.vargottama.status === 'CALCULATED' && c.vargottama.value);
  if (vargottama.length > 0) {
    push({
      id: 'HL_VARGOTTAMA',
      ruleId: 'SALIENCE_VARGOTTAMA',
      priority: 75,
      statement: `Vargottama (same sign in D1 and D9): ${vargottama.map((c) => c.graha).join(', ')}.`,
      contentType: 'DERIVED_JYOTISH_FACT',
      system: 'PARASHARI',
      evidenceIds: vargottama.flatMap((c) => c.vargottama.evidenceIds),
    });
  }

  /* R10 — node axis. */
  const rahu = conditions.conditions.find((c) => c.graha === 'Rahu');
  const ketu = conditions.conditions.find((c) => c.graha === 'Ketu');
  if (rahu && ketu) {
    push({
      id: 'HL_NODE_AXIS',
      ruleId: 'SALIENCE_NODE_AXIS',
      priority: 60,
      statement: `Rahu–Ketu axis across the ${ORDINAL[rahu.house]} and ${ORDINAL[ketu.house]} bhavas (${rahu.signName} / ${ketu.signName}).`,
      contentType: 'DERIVED_JYOTISH_FACT',
      system: 'PARASHARI',
      evidenceIds: [FACT.planetHouse('Rahu'), FACT.planetHouse('Ketu')],
    });
  }

  return out
    .sort((a, b) => (b.priority - a.priority) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

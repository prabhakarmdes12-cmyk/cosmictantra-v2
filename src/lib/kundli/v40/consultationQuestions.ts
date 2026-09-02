/**
 * KUNDLI V40 — Pandit discussion points (§24).
 *
 * Questions, not predictions. Each is generated from a structure that actually
 * exists in this chart, and each carries the evidence that raised it, so a
 * Pandit can see why the question was asked and dismiss it in one glance if it
 * is not worth their time.
 *
 * These prompts exist to augment the Pandit's judgement. They never answer
 * themselves.
 */

import type { KundliCanonicalModel } from '../types';
import type { ContentType, JyotishSystem } from './contentTypes';
import { FACT } from './factPaths';
import type { GrahaConditionResult } from './grahaCondition';
import type { BhavaIntelligenceResult } from './bhavaIntelligence';
import type { DashaActivation } from './dashaActivation';
import type { JyotishSynthesis } from './careerSynthesis';

export const CONSULTATION_QUESTIONS_VERSION = 'consultation-questions-v1';

export interface DiscussionPoint {
  id: string;
  ruleId: string;
  question: string;
  /** Structure that raised the question, in one line. */
  basis: string;
  templateId?: string;
  templateParams?: Record<string, string | number>;
  contentType: ContentType;
  system: JyotishSystem;
  evidenceIds: string[];
  priority: number;
}

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

export function buildDiscussionPoints(
  canonical: KundliCanonicalModel,
  conditions: GrahaConditionResult,
  bhavas: BhavaIntelligenceResult,
  activation: DashaActivation,
  career: JyotishSynthesis,
  limit = 8,
): DiscussionPoint[] {
  const out: DiscussionPoint[] = [];
  const add = (d: DiscussionPoint) => out.push(d);
  const conditionOf = (g: string) => conditions.conditions.find((c) => c.graha === g);

  /* Q1 — bhava concentration. */
  const byHouse = new Map<number, string[]>();
  for (const p of canonical.planets) byHouse.set(p.house, [...(byHouse.get(p.house) ?? []), p.id]);
  for (const [house, grahas] of byHouse) {
    if (grahas.length >= 3) {
      add({
        id: `Q_CONCENTRATION_H${house}`,
        ruleId: 'QUESTION_CONCENTRATION',
        question: `How should the ${ORDINAL[house]}-bhava concentration of ${grahas.join(', ')} be judged once graha strength and D10 are taken into account?`,
        basis: `${grahas.length} grahas occupy bhava ${house}.`,
        templateId: 'CQ_CONCENTRATION',
        templateParams: { grahas: grahas.join(', '), house: house },
        contentType: 'PRACTICAL_REFLECTION',
        system: 'PARASHARI',
        evidenceIds: grahas.map((g) => FACT.planetHouse(g)),
        priority: 100,
      });
    }
  }

  /* Q2 — present yogas: how strongly do they operate? */
  for (const y of canonical.yogas.filter((x) => x.status === 'PRESENT')) {
    add({
      id: `Q_YOGA_${y.id}`,
      ruleId: 'QUESTION_PRESENT_YOGA',
      question: `${y.name} is present by rule. How strongly does it operate here once the graha's own condition is weighed?`,
      basis: `${y.name} satisfied every condition of the applied ${y.system} rule.`,
      templateId: 'CQ_YOGA',
      templateParams: { name: y.name },
      contentType: 'PRACTICAL_REFLECTION',
      system: y.system,
      evidenceIds: [FACT.yogaStatus(y.id)],
      priority: 95,
    });
  }

  /* Q3 — Mars in a manglik bhava: marriage assessment. */
  const mars = conditionOf('Mars');
  const manglik = canonical.doshas.find((d) => d.id === 'manglik');
  if (mars && manglik && (manglik.result as { present?: boolean }).present) {
    add({
      id: 'Q_MANGLIK',
      ruleId: 'QUESTION_MANGLIK',
      question: `How should Mars in the ${ORDINAL[mars.house]} bhava modify the marriage assessment, and which cancellation rules does the family's tradition accept?`,
      basis: `Manglik computed as present from Mars in bhava ${mars.house}.`,
      templateId: 'CQ_MANGLIK',
      templateParams: { house: mars.house },
      contentType: 'PRACTICAL_REFLECTION',
      system: 'PARASHARI',
      evidenceIds: [FACT.planetHouse('Mars')],
      priority: 90,
    });
  }

  /* Q4 — current period themes. */
  const overlaps = activation.overlappingThemes.slice(0, 2).map((t) => t.houses[0]);
  add({
    id: 'Q_CURRENT_PERIOD',
    ruleId: 'QUESTION_CURRENT_PERIOD',
    question:
      `Which themes are actually live in the running ${activation.current.mahadasha} / ${activation.current.antardasha} period` +
      (overlaps.length > 0 ? `, given that bhava(s) ${overlaps.join(' and ')} are touched by more than one active lord?` : '?'),
    basis: `Mahadasha ${activation.current.mahadasha}, antardasha ${activation.current.antardasha}, pratyantardasha ${activation.current.pratyantardasha || '—'}.`,
    templateId: 'CQ_CURRENT_PERIOD',
    templateParams: { mahadasha: activation.current.mahadasha, antardasha: activation.current.antardasha, overlapText: overlaps.length > 0 ? `, यह देखते हुए कि ${overlaps.join(' और ')} भाव एक से अधिक सक्रिय स्वामियों द्वारा स्पर्श किए जा रहे हैं` : '' },
    contentType: 'PRACTICAL_REFLECTION',
    system: 'PARASHARI',
    evidenceIds: [FACT.currentMahadasha, FACT.currentAntardasha],
    priority: 88,
  });

  /* Q5 — career contradictions worth resolving in the room. */
  if (career.challengingFactors.length > 0 && career.supportiveFactors.length > 0) {
    add({
      id: 'Q_CAREER_CONTRADICTION',
      ruleId: 'QUESTION_CAREER_CONTRADICTION',
      question:
        `The career factors disagree (${career.supportiveFactors.length} supporting, ${career.challengingFactors.length} challenging). ` +
        'Which side does the Pandit weight higher for this chart, and on what classical ground?',
      basis: 'Career synthesis produced both supporting and challenging factors.',
      templateId: 'CQ_CAREER_CONTRADICTION',
      templateParams: { support: career.supportiveFactors.length, challenge: career.challengingFactors.length },
      contentType: 'PRACTICAL_REFLECTION',
      system: 'PARASHARI',
      evidenceIds: [FACT.houseSignId(10), FACT.houseSignLord(10)],
      priority: 85,
    });
  }

  /* Q6 — dusthana lord placements. */
  for (const b of bhavas.bhavas) {
    if ([6, 8, 12].includes(b.house) && b.lordHouse && [1, 4, 7, 10, 5, 9].includes(b.lordHouse)) {
      add({
        id: `Q_DUSTHANA_LORD_${b.house}`,
        ruleId: 'QUESTION_DUSTHANA_LORD_ANGULAR',
        question: `The ${ORDINAL[b.house]} lord ${b.lord} sits in the ${ORDINAL[b.lordHouse]} bhava, ${[1, 4, 7, 10].includes(b.lordHouse) ? 'a kendra' : 'a trikona'}. Is this read as a viparita indication, or as affliction of the bhava it occupies, in the tradition being applied?`,
        basis: `${b.lord} rules bhava ${b.house} and occupies bhava ${b.lordHouse}.`,
        templateId: 'CQ_DUSTHANA_LORD_ANGULAR',
        templateParams: { house: b.house, lord: b.lord ?? '', lordHouse: b.lordHouse, kendraTrikona: [1, 4, 7, 10].includes(b.lordHouse) ? 'केन्द्र' : 'त्रिकोण' },
        contentType: 'PRACTICAL_REFLECTION',
        system: 'PARASHARI',
        evidenceIds: [FACT.houseSignLord(b.house), FACT.planetHouse(b.lord ?? '')],
        priority: 78,
      });
    }
  }

  /* Q7 — retrograde grahas. */
  const retro = conditions.conditions.filter((c) => c.motion.retrograde && !['Rahu', 'Ketu'].includes(c.graha));
  if (retro.length > 0) {
    add({
      id: 'Q_RETROGRADE',
      ruleId: 'QUESTION_RETROGRADE',
      question: `${retro.map((c) => c.graha).join(' and ')} ${retro.length > 1 ? 'are' : 'is'} retrograde at birth. Which reading of vakri graha does the Pandit apply here?`,
      basis: `Retrograde: ${retro.map((c) => `${c.graha} in bhava ${c.house}`).join(', ')}.`,
      templateId: 'CQ_RETROGRADE',
      templateParams: { grahas: retro.map((c) => c.graha).join(' और '), verb: retro.length > 1 ? 'हैं' : 'है' },
      contentType: 'PRACTICAL_REFLECTION',
      system: 'PARASHARI',
      evidenceIds: retro.map((c) => FACT.planetRetrograde(c.graha)),
      priority: 70,
    });
  }

  /* Q8 — near-combustion, where the verdict turns on the orb chosen. */
  const near = conditions.conditions.filter((c) => c.combustion.nearCombust);
  if (near.length > 0) {
    add({
      id: 'Q_NEAR_COMBUST',
      ruleId: 'QUESTION_NEAR_COMBUSTION',
      question: `${near.map((c) => c.graha).join(', ')} sits just outside the adopted combustion orb. Does the Pandit's own orb table make it combust?`,
      basis: near.map((c) => `${c.graha} ${c.combustion.angularDistance?.toFixed(2)}° from the Sun against orb ${c.combustion.orbUsed}°`).join('; '),
      templateId: 'CQ_NEAR_COMBUST',
      templateParams: { grahas: near.map((c) => c.graha).join(', ') },
      contentType: 'PRACTICAL_REFLECTION',
      system: 'PARASHARI',
      evidenceIds: near.flatMap((c) => c.combustion.evidenceIds),
      priority: 68,
    });
  }

  /* Q9 — the birth-time question, always worth asking. */
  add({
    id: 'Q_BIRTH_TIME',
    ruleId: 'QUESTION_BIRTH_TIME',
    question: `The lagna stands at ${canonical.ascendant.degreeInSign.toFixed(2)}° of ${canonical.ascendant.sign.name}. How confident is the family in the recorded birth time, and is a birth-time rectification warranted before acting on bhava-level readings?`,
    basis: `Lagna ${canonical.ascendant.sign.name} ${canonical.ascendant.degreeInSign.toFixed(2)}°; the lagna moves about 1° every four minutes.`,
    templateId: 'CQ_BIRTH_TIME',
    templateParams: { sign: canonical.ascendant.sign.name, degree: canonical.ascendant.degreeInSign.toFixed(2) },
    contentType: 'PRACTICAL_REFLECTION',
    system: 'PARASHARI',
    evidenceIds: [FACT.lagnaDegree, FACT.lagnaSign],
    priority: 66,
  });

  return out
    .sort((a, b) => (b.priority - a.priority) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

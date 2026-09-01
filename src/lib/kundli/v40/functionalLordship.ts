/**
 * KUNDLI V40 — functional lordship engine (§16).
 *
 * Derives, for one lagna, which bhavas each graha rules and what that makes it
 * FUNCTIONALLY for this chart. It keeps two things apart on purpose:
 *
 *   NATURAL CHARACTER    — what a graha is in itself (naisargika shubha/papa).
 *   FUNCTIONAL ROLE      — what its ownership makes it for THIS lagna.
 *
 * Nothing here reads the sky. It reads the canonical lagna sign and the
 * classical sign-lord table, which is a rule, not an observation.
 *
 * Deliberately NOT implemented (reported as NOT_CALCULATED rather than
 * guessed): badhaka lordship, and the "maraka activates" judgement. Maraka is
 * emitted only as a *candidate* flag from the 2nd/7th ownership rule.
 */

import type { KundliCanonicalModel } from '../types';
import type { ContentType, JyotishSystem } from './contentTypes';
import { FACT } from './factPaths';

export const FUNCTIONAL_LORDSHIP_ENGINE_VERSION = 'functional-lordship-v1';
export const FUNCTIONAL_LORDSHIP_SYSTEM: JyotishSystem = 'PARASHARI';

/** Classical sign lords. Sign id 1..12 (1 = Mesha/Aries). */
export const SIGN_LORD: Record<number, string> = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
  7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter',
};

export const KENDRA_HOUSES = [1, 4, 7, 10];
export const TRIKONA_HOUSES = [1, 5, 9];
export const DUSTHANA_HOUSES = [6, 8, 12];
export const MARAKA_HOUSES = [2, 7];
export const UPACHAYA_HOUSES = [3, 6, 10, 11];

export type NaturalCharacter = 'BENEFIC' | 'MALEFIC' | 'CONDITIONAL' | 'NOT_CALCULATED';

export interface FunctionalLordship {
  graha: string;
  /** Bhavas (1..12) this graha rules for this lagna. Empty for the nodes. */
  ruledHouses: number[];
  rulesKendra: boolean;
  rulesTrikona: boolean;
  rulesDusthana: boolean;
  /** Rules a kendra AND a trikona (5 or 9) — the classical yogakaraka rule. */
  yogakaraka: boolean;
  /** Owns the 2nd or the 7th. A candidate under the rule, not a verdict. */
  marakaCandidate: boolean;
  naturalCharacter: NaturalCharacter;
  naturalCharacterBasis: string;
  /** Plain statement of the functional position, for the report. */
  functionalStatement: string;
  contentType: ContentType;
  system: JyotishSystem;
  evidenceIds: string[];
  /** Explicit list of what this engine did not decide for this graha. */
  notCalculated: { item: string; reason: string }[];
}

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const NODE_IDS = ['Rahu', 'Ketu'];

/**
 * Natural character.
 *
 * Sun / Mars / Saturn / Rahu / Ketu — naisargika papa.
 * Jupiter / Venus — naisargika shubha.
 * Moon — paksha-dependent: shukla paksha benefic, krishna paksha malefic.
 *        (A variant grades by elongation from the Sun; not adopted, declared.)
 * Mercury — conditional on association; the association is computed, but the
 *        classical verdict differs between sources, so it stays CONDITIONAL.
 */
function naturalCharacterOf(
  graha: string,
  canonical: KundliCanonicalModel,
): { character: NaturalCharacter; basis: string; evidenceIds: string[] } {
  switch (graha) {
    case 'Jupiter':
    case 'Venus':
      return { character: 'BENEFIC', basis: 'Naisargika shubha graha.', evidenceIds: [] };
    case 'Sun':
    case 'Mars':
    case 'Saturn':
      return { character: 'MALEFIC', basis: 'Naisargika papa graha.', evidenceIds: [] };
    case 'Rahu':
    case 'Ketu':
      return { character: 'MALEFIC', basis: 'Chhaya graha, counted among the naisargika papa grahas.', evidenceIds: [] };
    case 'Moon': {
      const paksha = canonical.panchanga.tithi.paksha ?? '';
      if (/shukla/i.test(paksha)) {
        return {
          character: 'BENEFIC',
          basis: `Shukla paksha at birth (${paksha}) — waxing Moon is taken as benefic. Variant grading by solar elongation is not adopted.`,
          evidenceIds: ['panchanga.tithi.paksha'],
        };
      }
      if (/krishna/i.test(paksha)) {
        return {
          character: 'MALEFIC',
          basis: `Krishna paksha at birth (${paksha}) — waning Moon is taken as malefic. Variant grading by solar elongation is not adopted.`,
          evidenceIds: ['panchanga.tithi.paksha'],
        };
      }
      return {
        character: 'NOT_CALCULATED',
        basis: 'Paksha could not be resolved from the canonical panchanga, so the Moon\'s natural character is not asserted.',
        evidenceIds: ['panchanga.tithi.paksha'],
      };
    }
    case 'Mercury': {
      const mercury = canonical.planets.find((p) => p.id === 'Mercury');
      const companions = mercury
        ? canonical.planets.filter((p) => p.id !== 'Mercury' && p.sign.id === mercury.sign.id).map((p) => p.id)
        : [];
      return {
        character: 'CONDITIONAL',
        basis: companions.length > 0
          ? `Conditional graha: benefic when unafflicted, taking the character of its companions. Sign companions: ${companions.join(', ')}.`
          : 'Conditional graha: benefic when unafflicted. No graha shares its sign in this chart.',
        evidenceIds: mercury ? [FACT.planetSignId('Mercury')] : [],
      };
    }
    default:
      return { character: 'NOT_CALCULATED', basis: 'Unknown graha.', evidenceIds: [] };
  }
}

/**
 * Builds the functional lordship table for the chart's lagna.
 *
 * Whole-sign houses: bhava n carries the sign (lagnaSign + n - 1).
 * The canonical houses array is used directly rather than recomputed, so a
 * disagreement between the two can never be hidden here.
 */
export function buildFunctionalLordship(canonical: KundliCanonicalModel): FunctionalLordship[] {
  const houseSignById = new Map<number, number>();
  for (const h of canonical.houses) houseSignById.set(h.number, h.sign.id);

  const ownership = new Map<string, number[]>();
  for (let house = 1; house <= 12; house++) {
    const signId = houseSignById.get(house);
    if (!signId) continue;
    const lord = SIGN_LORD[signId];
    if (!lord) continue;
    ownership.set(lord, [...(ownership.get(lord) ?? []), house]);
  }

  const grahaIds = canonical.planets.map((p) => p.id);

  return grahaIds.map((graha) => {
    const ruledHouses = (ownership.get(graha) ?? []).slice().sort((a, b) => a - b);
    const rulesKendra = ruledHouses.some((h) => KENDRA_HOUSES.includes(h));
    const rulesTrikona = ruledHouses.some((h) => TRIKONA_HOUSES.includes(h));
    const rulesDusthana = ruledHouses.some((h) => DUSTHANA_HOUSES.includes(h));
    // Classical yogakaraka: one graha owning a kendra AND a trikona. The
    // lagna is both; owning only the lagna does not make a yogakaraka, so
    // the trikona side of the test uses 5 and 9.
    const yogakaraka = rulesKendra && ruledHouses.some((h) => h === 5 || h === 9);
    const marakaCandidate = ruledHouses.some((h) => MARAKA_HOUSES.includes(h));

    const natural = naturalCharacterOf(graha, canonical);
    const isNode = NODE_IDS.includes(graha);

    const evidenceIds = [
      FACT.lagnaSign,
      ...ruledHouses.map((h) => FACT.houseSignId(h)),
      ...natural.evidenceIds,
    ];

    const parts: string[] = [];
    if (isNode) {
      parts.push('Rules no sign in the classical scheme, so it has no functional lordship. It acts through its dispositor and its house.');
    } else if (ruledHouses.length === 0) {
      parts.push('Rules no bhava in this chart.');
    } else {
      parts.push(`Rules the ${ruledHouses.map((h) => ORDINAL[h]).join(' and ')} bhava.`);
      if (yogakaraka) parts.push('Kendra and trikona lord together — yogakaraka for this lagna.');
      else if (rulesTrikona && !rulesDusthana) parts.push('Trikona lord.');
      else if (rulesDusthana && !rulesTrikona) parts.push('Dusthana lord.');
      else if (rulesTrikona && rulesDusthana) parts.push('Owns both a trikona and a dusthana — a mixed functional position that a scholar must weigh.');
      else if (rulesKendra) parts.push('Kendra lord.');
      if (marakaCandidate) parts.push('Owns a maraka bhava (2nd/7th) — candidate only; no maraka verdict is issued by this engine.');
    }

    const notCalculated: { item: string; reason: string }[] = [
      {
        item: 'Badhakesha (badhaka lordship)',
        reason: 'The badhaka house depends on lagna mobility and the rule variants are not settled in the sources held here.',
      },
      {
        item: 'Maraka verdict',
        reason: 'Ownership of the 2nd/7th makes a graha a candidate. Whether it acts as maraka depends on dasha and strength judgements this engine does not make, and the product forbids death-related prediction.',
      },
    ];
    if (isNode) {
      notCalculated.push({
        item: 'Node functional lordship',
        reason: 'Rahu and Ketu own no sign. Some traditions assign them co-lordship of Aquarius and Scorpio; that variant is not adopted here.',
      });
    }

    return {
      graha,
      ruledHouses,
      rulesKendra,
      rulesTrikona,
      rulesDusthana,
      yogakaraka,
      marakaCandidate,
      naturalCharacter: natural.character,
      naturalCharacterBasis: natural.basis,
      functionalStatement: parts.join(' '),
      contentType: 'DERIVED_JYOTISH_FACT' as ContentType,
      system: FUNCTIONAL_LORDSHIP_SYSTEM,
      evidenceIds,
      notCalculated,
    };
  });
}

/** Lord of a given bhava for this chart, or null when the sign is unresolved. */
export function lordOfHouse(canonical: KundliCanonicalModel, house: number): string | null {
  const h = canonical.houses.find((x) => x.number === house);
  if (!h) return null;
  return SIGN_LORD[h.sign.id] ?? null;
}

/**
 * KUNDLI V40 — Bhava Intelligence Matrix (§12).
 *
 * For every one of the twelve bhavas: its sign, its lord, where that lord
 * actually sits, who occupies it, what aspects it receives, and its natural
 * karakas. Everything is derived from canonical facts and declared rules.
 *
 * `strength` is deliberately NOT_CALCULATED. Bhava bala exists in balaEngine
 * but is unvalidated (see forensic/shadbala-validation.md), and a strength
 * number that a Pandit cannot check is worse than an honest blank.
 */

import type { KundliCanonicalModel } from '../types';
import type { CapabilityStatus, ContentType, JyotishSystem } from './contentTypes';
import { FACT } from './factPaths';
import {
  SIGN_LORD, KENDRA_HOUSES, TRIKONA_HOUSES, DUSTHANA_HOUSES, UPACHAYA_HOUSES,
} from './functionalLordship';
import {
  buildAspects, aspectsOnHouse, DEFAULT_ASPECT_POLICY,
  type AspectEngineResult, type AspectRelation, type AspectPolicy,
} from './aspectEngine';

export const BHAVA_INTELLIGENCE_VERSION = 'bhava-intelligence-v1';

/**
 * Natural karakas per bhava.
 *
 * A declared, conservative table. Where the tradition assigns several karakas
 * to one bhava they are all listed; where sources disagree materially the
 * disputed graha is omitted rather than silently included.
 */
export const BHAVA_KARAKAS: Record<number, string[]> = {
  1: ['Sun'],
  2: ['Jupiter'],
  3: ['Mars'],
  4: ['Moon'],
  5: ['Jupiter'],
  6: ['Mars', 'Saturn'],
  7: ['Venus'],
  8: ['Saturn'],
  9: ['Jupiter'],
  10: ['Sun', 'Mercury', 'Jupiter', 'Saturn'],
  11: ['Jupiter'],
  12: ['Saturn'],
};

export const KARAKA_SOURCE_NOTE =
  'Natural (naisargika) karakas as commonly taught in the Parashari stream. The 10th bhava ' +
  'carries the four karmic karakas (Sun, Mercury, Jupiter, Saturn). Contested assignments are ' +
  'omitted rather than included silently.';

export type BhavaClass = 'KENDRA' | 'TRIKONA' | 'DUSTHANA' | 'UPACHAYA' | 'OTHER';

export interface BhavaIntelligence {
  house: number;
  signId: number;
  signName: string;
  signEn: string;
  /** Bhava classes this house belongs to (a house can be both kendra and trikona). */
  classes: BhavaClass[];
  lord: string | null;
  /** Bhava the lord occupies, or null when unresolved. */
  lordHouse: number | null;
  lordSignId: number | null;
  lordSignName: string | null;
  lordDignity: string | null;
  lordRetrograde: boolean | null;
  occupants: string[];
  aspectsReceived: AspectRelation[];
  karakas: string[];
  strength: { status: CapabilityStatus; reason: string };
  contentType: ContentType;
  system: JyotishSystem;
  evidenceIds: string[];
  /** One-line plain reading of the structure, no interpretation. */
  structureStatement: string;
}

export interface BhavaIntelligenceResult {
  engineVersion: string;
  aspectPolicy: AspectPolicy;
  bhavas: BhavaIntelligence[];
}

function classesOf(house: number): BhavaClass[] {
  const out: BhavaClass[] = [];
  if (KENDRA_HOUSES.includes(house)) out.push('KENDRA');
  if (TRIKONA_HOUSES.includes(house)) out.push('TRIKONA');
  if (DUSTHANA_HOUSES.includes(house)) out.push('DUSTHANA');
  if (UPACHAYA_HOUSES.includes(house)) out.push('UPACHAYA');
  return out.length > 0 ? out : ['OTHER'];
}

export function buildBhavaIntelligence(
  canonical: KundliCanonicalModel,
  options: { aspectPolicy?: AspectPolicy; aspects?: AspectEngineResult } = {},
): BhavaIntelligenceResult {
  const policy = options.aspectPolicy ?? DEFAULT_ASPECT_POLICY;
  const aspects = options.aspects ?? buildAspects(canonical, policy);
  const planetById = new Map(canonical.planets.map((p) => [p.id, p]));

  const bhavas: BhavaIntelligence[] = [];
  for (let house = 1; house <= 12; house++) {
    const h = canonical.houses.find((x) => x.number === house);
    if (!h) continue;
    const lord = SIGN_LORD[h.sign.id] ?? null;
    const lordPlanet = lord ? planetById.get(lord) : undefined;
    const occupants = canonical.planets.filter((p) => p.house === house).map((p) => p.id);
    const received = aspectsOnHouse(aspects, house);

    const evidenceIds = [
      FACT.houseSignId(house),
      FACT.houseOccupants(house),
      ...(lord ? [FACT.planetHouse(lord), FACT.planetSignId(lord), FACT.planetDignity(lord)] : []),
      ...occupants.map((o) => FACT.planetHouse(o)),
    ];

    const statementParts: string[] = [
      `${h.sign.name} (${h.sign.en}) occupies bhava ${house}.`,
    ];
    if (lord && lordPlanet) {
      statementParts.push(`Its lord ${lord} sits in bhava ${lordPlanet.house} in ${lordPlanet.sign.name}.`);
    } else if (lord) {
      statementParts.push(`Its lord is ${lord}; its placement could not be resolved.`);
    }
    statementParts.push(
      occupants.length > 0
        ? `Occupied by ${occupants.join(', ')}.`
        : 'No graha occupies this bhava.',
    );
    if (received.length > 0) {
      statementParts.push(`Receives full drishti from ${received.map((a) => a.from).join(', ')}.`);
    } else {
      statementParts.push('Receives no full Parashari drishti.');
    }

    bhavas.push({
      house,
      signId: h.sign.id,
      signName: h.sign.name,
      signEn: h.sign.en,
      classes: classesOf(house),
      lord,
      lordHouse: lordPlanet?.house ?? null,
      lordSignId: lordPlanet?.sign.id ?? null,
      lordSignName: lordPlanet?.sign.name ?? null,
      lordDignity: lordPlanet?.dignity ?? null,
      lordRetrograde: lordPlanet ? lordPlanet.retrograde : null,
      occupants,
      aspectsReceived: received,
      karakas: BHAVA_KARAKAS[house] ?? [],
      strength: {
        status: 'NOT_CALCULATED',
        reason:
          'Bhava bala is computed by balaEngine but has not passed independent validation, so no strength value is reported. ' +
          'See forensic/shadbala-validation.md.',
      },
      contentType: 'DERIVED_JYOTISH_FACT',
      system: 'PARASHARI',
      evidenceIds,
      structureStatement: statementParts.join(' '),
    });
  }

  return { engineVersion: BHAVA_INTELLIGENCE_VERSION, aspectPolicy: policy, bhavas };
}

export function bhavaOf(result: BhavaIntelligenceResult, house: number): BhavaIntelligence | undefined {
  return result.bhavas.find((b) => b.house === house);
}

/**
 * KUNDLI V40 — Parashari graha drishti (§17).
 *
 * Full aspects only:
 *   every graha    -> 7th
 *   Mars           -> 4th, 8th   (in addition to the 7th)
 *   Jupiter        -> 5th, 9th
 *   Saturn         -> 3rd, 10th
 *
 * Two policies are declared rather than assumed:
 *
 *  1. NODE POLICY. `relationshipEngine.calculateGrahaDrishti` grants Rahu and
 *     Ketu the Jupiter-like 5th/9th aspects with no flag. That is a contested
 *     tradition. V40 defaults to NOT_ADOPTED: the nodes cast the universal 7th
 *     only, and the 5/9 variant is emitted as a declared, unadopted variant so
 *     a scholar can see it was considered.
 *
 *  2. PARTIAL ASPECTS. The 15/30/45-shashtiamsha partial drishti values are a
 *     strength model, not "an aspect exists". They are not emitted as aspects.
 *
 * Everything is derived from canonical house placements. No longitude is
 * recomputed; no orb is invented.
 */

import type { KundliCanonicalModel } from '../types';
import type { ContentType, JyotishSystem } from './contentTypes';
import { FACT } from './factPaths';

export const ASPECT_ENGINE_VERSION = 'parashari-drishti-v1';

export type NodeAspectPolicy = 'SEVENTH_ONLY' | 'JUPITER_LIKE_5_9' | 'NO_ASPECT';

export interface AspectPolicy {
  nodes: NodeAspectPolicy;
  /** Whether partial (15/30/45 shashtiamsha) drishti is emitted as an aspect. */
  includePartial: false;
  declaration: string;
}

export const DEFAULT_ASPECT_POLICY: AspectPolicy = {
  nodes: 'SEVENTH_ONLY',
  includePartial: false,
  declaration:
    'Full Parashari graha drishti only. Rahu and Ketu cast the universal 7th aspect; ' +
    'the Jupiter-like 5th/9th node aspect is a declared variant and is NOT adopted. ' +
    'Partial drishti (15/30/45 shashtiamsha) is a strength model and is not reported as an aspect.',
};

export interface AspectRelation {
  id: string;
  from: string;
  /** Bhava the aspect falls on, 1..12. */
  toHouse: number;
  /** House-count offset from the aspecting graha's own bhava (4, 5, 7, 8, 9, 3 or 10). */
  offset: number;
  aspectType: 'UNIVERSAL_7TH' | 'MARS_4_8' | 'JUPITER_5_9' | 'SATURN_3_10';
  /** Grahas standing in the aspected bhava. May be empty (aspect on an empty bhava). */
  toPlanets: string[];
  ruleId: string;
  system: JyotishSystem;
  contentType: ContentType;
  evidenceIds: string[];
}

export interface AspectEngineResult {
  policy: AspectPolicy;
  engineVersion: string;
  aspects: AspectRelation[];
  /** Variants considered and explicitly not applied. */
  unadoptedVariants: { id: string; description: string; wouldHaveAdded: number }[];
}

const SPECIAL: Record<string, { offsets: number[]; type: AspectRelation['aspectType'] }> = {
  Mars: { offsets: [4, 8], type: 'MARS_4_8' },
  Jupiter: { offsets: [5, 9], type: 'JUPITER_5_9' },
  Saturn: { offsets: [3, 10], type: 'SATURN_3_10' },
};

const NODES = ['Rahu', 'Ketu'];

/** house + (offset - 1), wrapped to 1..12. */
export function houseAtOffset(fromHouse: number, offset: number): number {
  return ((fromHouse - 1 + (offset - 1)) % 12) + 1;
}

export function buildAspects(
  canonical: KundliCanonicalModel,
  policy: AspectPolicy = DEFAULT_ASPECT_POLICY,
): AspectEngineResult {
  const occupantsByHouse = new Map<number, string[]>();
  for (const p of canonical.planets) {
    if (p.house < 1 || p.house > 12) continue;
    occupantsByHouse.set(p.house, [...(occupantsByHouse.get(p.house) ?? []), p.id]);
  }

  const aspects: AspectRelation[] = [];
  let unadoptedNodeAspects = 0;

  for (const p of canonical.planets) {
    if (p.house < 1 || p.house > 12) continue;
    const isNode = NODES.includes(p.id);

    const emit = (offset: number, type: AspectRelation['aspectType'], ruleId: string) => {
      const toHouse = houseAtOffset(p.house, offset);
      aspects.push({
        id: `ASPECT:${p.id}:${offset}:H${toHouse}`,
        from: p.id,
        toHouse,
        offset,
        aspectType: type,
        toPlanets: (occupantsByHouse.get(toHouse) ?? []).filter((x) => x !== p.id),
        ruleId,
        system: 'PARASHARI',
        contentType: 'DERIVED_JYOTISH_FACT',
        evidenceIds: [FACT.planetHouse(p.id), FACT.houseSignId(toHouse)],
      });
    };

    if (isNode) {
      if (policy.nodes === 'SEVENTH_ONLY') {
        emit(7, 'UNIVERSAL_7TH', 'DRISHTI_UNIVERSAL_7');
        unadoptedNodeAspects += 2;
      } else if (policy.nodes === 'JUPITER_LIKE_5_9') {
        emit(7, 'UNIVERSAL_7TH', 'DRISHTI_UNIVERSAL_7');
        emit(5, 'JUPITER_5_9', 'DRISHTI_NODE_5_9_VARIANT');
        emit(9, 'JUPITER_5_9', 'DRISHTI_NODE_5_9_VARIANT');
      }
      // 'NO_ASPECT' emits nothing for the nodes.
      continue;
    }

    emit(7, 'UNIVERSAL_7TH', 'DRISHTI_UNIVERSAL_7');
    const special = SPECIAL[p.id];
    if (special) {
      for (const offset of special.offsets) emit(offset, special.type, `DRISHTI_SPECIAL_${p.id.toUpperCase()}`);
    }
  }

  aspects.sort((a, b) => (a.from === b.from ? a.offset - b.offset : a.from.localeCompare(b.from)));

  const unadoptedVariants = [
    {
      id: 'DRISHTI_NODE_5_9_VARIANT',
      description:
        'Rahu and Ketu casting the Jupiter-like 5th and 9th aspects. Held by part of the tradition and implemented in this repository\'s relationshipEngine; not adopted by the V40 report because no source held here settles it.',
      wouldHaveAdded: policy.nodes === 'SEVENTH_ONLY' ? unadoptedNodeAspects : 0,
    },
    {
      id: 'DRISHTI_PARTIAL_SHASHTIAMSHA',
      description:
        'Partial drishti at 15/30/45 shashtiamsha on the 3rd/10th, 5th/9th and 4th/8th. A strength model rather than a yes/no aspect; not emitted as an aspect relation.',
      wouldHaveAdded: 0,
    },
  ];

  return { policy, engineVersion: ASPECT_ENGINE_VERSION, aspects, unadoptedVariants };
}

/** Aspects falling on one bhava. */
export function aspectsOnHouse(result: AspectEngineResult, house: number): AspectRelation[] {
  return result.aspects.filter((a) => a.toHouse === house);
}

/** Aspects falling on the bhava a given graha occupies (i.e. onto that graha). */
export function aspectsOnPlanet(result: AspectEngineResult, planetId: string): AspectRelation[] {
  return result.aspects.filter((a) => a.toPlanets.includes(planetId));
}

/** Aspects cast by one graha. */
export function aspectsFrom(result: AspectEngineResult, planetId: string): AspectRelation[] {
  return result.aspects.filter((a) => a.from === planetId);
}

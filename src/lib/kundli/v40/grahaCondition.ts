/**
 * KUNDLI V40 — Graha Condition Engine (§15).
 *
 * A normalized statement of the condition of each graha, assembled ONLY from
 * canonical facts plus declared classical rules. KUNDLI_INV_001: nothing here
 * recomputes a position. Combustion arcs are measured between two canonical
 * longitudes; vargottama compares two canonical charts; dignity is the
 * engine's own verdict, re-labelled, never re-derived.
 *
 * Where a field cannot be filled honestly it is NOT_CALCULATED with a reason.
 * That applies to:
 *   - the five-fold compound relationship (GREAT_FRIEND / GREAT_ENEMY): the
 *     calculation engine collapses "Neutral / Enemy" into one label, so the
 *     compound grade cannot be recovered from the canonical model;
 *   - the winner of a planetary war (needs celestial latitude, which the
 *     canonical model does not carry);
 *   - shadbala (computed by balaEngine, not validated — see
 *     forensic/shadbala-validation.md).
 */

import type { KundliCanonicalModel, PlanetPosition } from '../types';
import type { ContentType, JyotishSystem, CapabilityStatus } from './contentTypes';
import { FACT } from './factPaths';
import { buildFunctionalLordship, type FunctionalLordship } from './functionalLordship';
import {
  buildAspects, aspectsFrom, aspectsOnPlanet, DEFAULT_ASPECT_POLICY,
  type AspectEngineResult, type AspectRelation, type AspectPolicy,
} from './aspectEngine';
// Classical combustion orbs are a declared constant of the existing kernel.
// They are imported rather than restated so the two can never drift apart.
import { COMBUSTION_ORBS } from '../../jyotish/relationshipEngine';

export const GRAHA_CONDITION_ENGINE_VERSION = 'graha-condition-v1';

export type DignityCategory =
  | 'EXALTED' | 'MOOLATRIKONA' | 'OWN_SIGN' | 'GREAT_FRIEND' | 'FRIEND'
  | 'NEUTRAL' | 'ENEMY' | 'GREAT_ENEMY' | 'DEBILITATED' | 'NOT_CALCULATED';

export interface DignityBlock {
  category: DignityCategory;
  /** The canonical enum this category was mapped from. */
  canonicalValue: string;
  evidenceIds: string[];
  /**
   * Compound (panchadha) relationship. NOT_CALCULATED in V40: the canonical
   * model does not distinguish great-friend from friend.
   */
  compoundRelationship: { status: CapabilityStatus; reason: string };
}

export interface CombustionBlock {
  status: 'COMBUST' | 'NOT_COMBUST' | 'NOT_APPLICABLE';
  /** Arc between the graha and the Sun, in degrees, 0..180. */
  angularDistance?: number;
  orbUsed?: number;
  /** True when inside orb + 2°, i.e. approaching but not yet combust. */
  nearCombust?: boolean;
  /** Sprint H (RSK_002): |arc − orb| ≤ 1° — the verdict is orb-contingent. */
  borderline?: boolean;
  /** True when `borderline`: a scholar must adjudicate before the verdict is settled. */
  scholarJudgementRequired?: boolean;
  /** Registry rule of record (Sprint H). */
  registryRuleId?: string;
  ruleId: string;
  evidenceIds: string[];
  note?: string;
}

export interface PlanetaryWarBlock {
  status: 'IN_WAR' | 'NO_WAR' | 'NOT_APPLICABLE';
  opponent?: string;
  separationDeg?: number;
  winner: { status: CapabilityStatus; value?: string; reason?: string };
  ruleId: string;
  evidenceIds: string[];
}

export interface VargottamaBlock {
  status: CapabilityStatus;
  value?: boolean;
  d1Sign?: string;
  d9Sign?: string;
  evidenceIds: string[];
  reason?: string;
}

export interface ConjunctionRelation {
  with: string;
  signId: number;
  house: number;
  separationDeg: number;
  evidenceIds: string[];
}

export interface GrahaCondition {
  graha: string;
  /* placement, copied from the canonical model (never recomputed) */
  signId: number;
  signName: string;
  signEn: string;
  degreeInSign: number;
  longitudeDeg: number;
  house: number;
  nakshatra: string;
  pada: number;

  dignity: DignityBlock;
  motion: {
    retrograde: boolean;
    /** Nodes are always retrograde by convention, not by observed motion. */
    convention?: string;
    evidenceIds: string[];
  };
  combustion: CombustionBlock;
  planetaryWar: PlanetaryWarBlock;
  vargottama: VargottamaBlock;

  functionalLordship: FunctionalLordship;

  conjunctions: ConjunctionRelation[];
  aspectsGiven: AspectRelation[];
  aspectsReceived: AspectRelation[];

  shadbala: { status: CapabilityStatus; value?: number; reason: string };

  contentType: ContentType;
  system: JyotishSystem;
  evidenceIds: string[];
}

export interface GrahaConditionResult {
  engineVersion: string;
  aspectPolicy: AspectPolicy;
  conditions: GrahaCondition[];
}

const DIGNITY_MAP: Record<PlanetPosition['dignity'], DignityCategory> = {
  EXALTED: 'EXALTED',
  DEBILITATED: 'DEBILITATED',
  MOOLATRIKONA: 'MOOLATRIKONA',
  OWN_SIGN: 'OWN_SIGN',
  FRIEND_SIGN: 'FRIEND',
  NEUTRAL: 'NEUTRAL',
  ENEMY_SIGN: 'ENEMY',
};

const NODES = ['Rahu', 'Ketu'];

/** Shortest arc between two longitudes, 0..180. */
export function arcBetween(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

function combustionFor(
  p: PlanetPosition,
  sun: PlanetPosition | undefined,
): CombustionBlock {
  if (p.id === 'Sun') {
    return {
      status: 'NOT_APPLICABLE',
      ruleId: 'COMBUSTION_ORB_TABLE_V1',
      evidenceIds: [],
      note: 'The Sun cannot be combust by its own light.',
    };
  }
  if (NODES.includes(p.id)) {
    return {
      status: 'NOT_APPLICABLE',
      ruleId: 'COMBUSTION_ORB_TABLE_V1',
      evidenceIds: [],
      note: 'Chhaya grahas are not subject to asta (combustion) in the adopted rule.',
    };
  }
  const orbs = COMBUSTION_ORBS[p.id];
  if (!orbs || !sun) {
    return {
      status: 'NOT_APPLICABLE',
      ruleId: 'COMBUSTION_ORB_TABLE_V1',
      evidenceIds: [],
      note: 'No combustion orb is declared for this graha.',
    };
  }
  const orb = p.retrograde ? orbs.retrograde : orbs.direct;
  const arc = arcBetween(p.longitudeDeg, sun.longitudeDeg);
  return {
    status: arc <= orb ? 'COMBUST' : 'NOT_COMBUST',
    angularDistance: arc,
    orbUsed: orb,
    nearCombust: arc > orb && arc <= orb + 2,
    // Sprint H (RSK_002): within +/-1 deg of the adopted orb the verdict is
    // threshold-contingent — flagged for scholar adjudication, never hidden.
    borderline: Math.abs(arc - orb) <= 1,
    scholarJudgementRequired: Math.abs(arc - orb) <= 1,
    registryRuleId: 'RULE_COMBUSTION_ORBS',
    ruleId: 'COMBUSTION_ORB_TABLE_V1',
    evidenceIds: [FACT.planetLongitude(p.id), FACT.planetLongitude('Sun'), FACT.planetRetrograde(p.id)],
  };
}

const WAR_GRAHAS = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

function planetaryWarFor(p: PlanetPosition, all: PlanetPosition[]): PlanetaryWarBlock {
  if (!WAR_GRAHAS.includes(p.id)) {
    return {
      status: 'NOT_APPLICABLE',
      winner: { status: 'NOT_CALCULATED', reason: 'Graha yuddha applies to the five taragrahas only.' },
      ruleId: 'GRAHA_YUDDHA_1DEG_V1',
      evidenceIds: [],
    };
  }
  for (const other of all) {
    if (other.id === p.id || !WAR_GRAHAS.includes(other.id)) continue;
    const sep = arcBetween(p.longitudeDeg, other.longitudeDeg);
    if (sep <= 1) {
      return {
        status: 'IN_WAR',
        opponent: other.id,
        separationDeg: sep,
        winner: {
          status: 'NOT_CALCULATED',
          reason: 'Deciding the victor requires celestial latitude / apparent disc, which the canonical model does not carry.',
        },
        ruleId: 'GRAHA_YUDDHA_1DEG_V1',
        evidenceIds: [FACT.planetLongitude(p.id), FACT.planetLongitude(other.id)],
      };
    }
  }
  return {
    status: 'NO_WAR',
    winner: { status: 'NOT_CALCULATED', reason: 'No war; no victor to decide.' },
    ruleId: 'GRAHA_YUDDHA_1DEG_V1',
    evidenceIds: [FACT.planetLongitude(p.id)],
  };
}

function vargottamaFor(p: PlanetPosition, canonical: KundliCanonicalModel): VargottamaBlock {
  const d9 = canonical.divisionalCharts.find((c) => c.division === 9);
  const placement = d9?.planets.find((x) => x.id === p.id);
  if (!d9 || !placement) {
    return {
      status: 'NOT_CALCULATED',
      evidenceIds: [],
      reason: 'D9 placement for this graha is not present in the canonical model.',
    };
  }
  // The canonical D9 carries the Sanskrit sign name; D1 carries both. Compare
  // on the Sanskrit name, which both sides use.
  return {
    status: 'CALCULATED',
    value: placement.sign === p.sign.name,
    d1Sign: p.sign.name,
    d9Sign: placement.sign,
    evidenceIds: [FACT.planetSignName(p.id), FACT.vargaLagna(9)],
  };
}

export function buildGrahaConditions(
  canonical: KundliCanonicalModel,
  options: { aspectPolicy?: AspectPolicy; aspects?: AspectEngineResult } = {},
): GrahaConditionResult {
  const policy = options.aspectPolicy ?? DEFAULT_ASPECT_POLICY;
  const aspects = options.aspects ?? buildAspects(canonical, policy);
  const lordships = new Map(buildFunctionalLordship(canonical).map((f) => [f.graha, f]));
  const sun = canonical.planets.find((p) => p.id === 'Sun');

  const conditions: GrahaCondition[] = canonical.planets.map((p) => {
    const conjunctions: ConjunctionRelation[] = canonical.planets
      .filter((o) => o.id !== p.id && o.sign.id === p.sign.id)
      .map((o) => ({
        with: o.id,
        signId: o.sign.id,
        house: o.house,
        separationDeg: arcBetween(p.longitudeDeg, o.longitudeDeg),
        evidenceIds: [FACT.planetSignId(p.id), FACT.planetSignId(o.id), FACT.planetLongitude(o.id)],
      }));

    const lordship = lordships.get(p.id)!;

    return {
      graha: p.id,
      signId: p.sign.id,
      signName: p.sign.name,
      signEn: p.sign.en,
      degreeInSign: p.degreeInSign,
      longitudeDeg: p.longitudeDeg,
      house: p.house,
      nakshatra: p.nakshatra.name,
      pada: p.nakshatra.pada,

      dignity: {
        category: NODES.includes(p.id) ? 'NOT_CALCULATED' : (DIGNITY_MAP[p.dignity] ?? 'NOT_CALCULATED'),
        canonicalValue: NODES.includes(p.id) ? 'TRADITION_DEPENDENT' : p.dignity,
        evidenceIds: [FACT.planetDignity(p.id), FACT.planetSignId(p.id)],
        compoundRelationship: {
          status: 'NOT_CALCULATED',
          reason: NODES.includes(p.id)
            ? 'Node dignity (Rahu/Ketu exaltation, moolatrikona, rulership) is tradition-dependent and contested across classical texts (Parashara vs Jaimini vs Phaladeepika); no single verdict is declared.'
            : 'The calculation engine reports one dignity label per graha and collapses "neutral / enemy" into a single value, ' +
              'so the five-fold panchadha grades GREAT_FRIEND and GREAT_ENEMY cannot be recovered without a second, unverified derivation.',
        },
      },

      motion: {
        retrograde: p.retrograde,
        convention: NODES.includes(p.id)
          ? 'Mean nodes are retrograde by definition in this configuration; this is a node convention, not observed motion.'
          : undefined,
        evidenceIds: [FACT.planetRetrograde(p.id)],
      },

      combustion: combustionFor(p, sun),
      planetaryWar: planetaryWarFor(p, canonical.planets),
      vargottama: vargottamaFor(p, canonical),

      functionalLordship: lordship,

      conjunctions,
      aspectsGiven: aspectsFrom(aspects, p.id),
      aspectsReceived: aspectsOnPlanet(aspects, p.id),

      shadbala: {
        status: 'NOT_CALCULATED',
        reason:
          'Shadbala is computed by balaEngine but has not passed independent validation. ' +
          'See forensic/shadbala-validation.md. It is not exposed as a report value and no conclusion uses it.',
      },

      contentType: 'DERIVED_JYOTISH_FACT',
      system: 'PARASHARI',
      evidenceIds: [
        FACT.planetSignId(p.id), FACT.planetDegree(p.id), FACT.planetHouse(p.id),
        FACT.planetDignity(p.id), FACT.planetRetrograde(p.id), FACT.planetNakshatra(p.id),
      ],
    };
  });

  return { engineVersion: GRAHA_CONDITION_ENGINE_VERSION, aspectPolicy: policy, conditions };
}

export function conditionOf(result: GrahaConditionResult, graha: string): GrahaCondition | undefined {
  return result.conditions.find((c) => c.graha === graha);
}

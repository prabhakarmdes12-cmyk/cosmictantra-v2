/**
 * YOGA ENGINE — rule-evaluated yoga registry.
 *
 * Replaces the previous unconditional yoga strings in
 * `canonicalSnapshot.ts` (rajYogas / specialCombinations), which declared
 * the same three yogas for every chart regardless of the computed positions.
 *
 * Contract (Scholar Kundli requirement — zero fabrication):
 *  every yoga carries a stable id, a formal rule, its inputs, every
 *  evaluated condition with the evidence it was judged on, a result, and a
 *  status of PRESENT | ABSENT | INDETERMINATE | NOT_CALCULATED.
 *
 * Status semantics:
 *  PRESENT        — every condition evaluated and every one is true.
 *  ABSENT         — every condition evaluated and at least one is false.
 *  INDETERMINATE  — a required input is unknown (house 0 / missing sign /
 *                   missing planet), so the rule cannot be judged either way.
 *  NOT_CALCULATED — the rule is known but not implemented in this engine.
 *                   It is reported explicitly, never silently omitted.
 *
 * Nothing here infers a yoga from prose, fills a gap with a plausible value,
 * or treats a missing value as zero.
 */

import { YOGA_SOURCE_REGISTRY_VERSION, sourceEntryFor, type YogaSourceEntry } from './yogaSourceRegistry';

export { YOGA_SOURCE_REGISTRY_VERSION };

export type YogaStatus = 'PRESENT' | 'ABSENT' | 'INDETERMINATE' | 'NOT_CALCULATED';

export type JyotishSystem = 'PARASHARI' | 'JAIMINI' | 'KP';

export interface YogaConditionResult {
  /** Stable condition id, e.g. `jupiter.kendra-from-moon`. */
  id: string;
  /** Human-readable statement of what was tested. */
  description: string;
  /** true / false, or null when the condition could not be evaluated. */
  satisfied: boolean | null;
  /** Canonical facts used to judge this condition. */
  evidence: string[];
}

export interface YogaInputs {
  planets: string[];
  houses: number[];
  signs: string[];
}

/**
 * Charter §15: existence and strength MUST remain separate concepts. The
 * engine judges EXISTENCE only; strength (dignity, combustion, aspects,
 * divisional reinforcement, ...) is never quantified here and never guessed.
 */
export interface YogaStrengthAssessment {
  status: 'SCHOLAR_JUDGEMENT_REQUIRED' | 'NOT_APPLICABLE';
  note: string;
}

export interface YogaEvaluation {
  id: string;
  name: string;
  system: JyotishSystem;
  /** Formal statement of the rule actually implemented. */
  rule: string;
  inputs: YogaInputs;
  conditions: YogaConditionResult[];
  /** Versioned source-registry entry describing provenance and limits. */
  source: YogaSourceEntry;
  /** Same value as `status`; kept explicit for report/evidence consumers. */
  result: YogaStatus;
  evidenceRefs: string[];
  status: YogaStatus;
  /** Present only when status === 'NOT_CALCULATED'. */
  notCalculatedReason?: string;
  /** Sprint I (charter §15): strength is a SEPARATE concept, never quantified by this engine. */
  strength: YogaStrengthAssessment;
}

export interface YogaPlanetInput {
  id: string;
  /** Bhava number 1..12. 0 means "not resolved" (never silently defaulted). */
  house: number;
  /** Sidereal sign id 1..12. 0 means "not resolved". */
  signId: number;
  signName: string;
  longitudeDeg: number;
}

export interface YogaChartInput {
  planets: YogaPlanetInput[];
  /** houseSigns[0] is the sign occupying house 1. null = not resolved. */
  houseSigns: (number | null)[];
  ascendantSignId: number;
}

/* ------------------------------------------------------------------ */
/* Classical constants (Parashari)                                      */
/* ------------------------------------------------------------------ */

export const SIGN_LORDS: Record<number, string> = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
  7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter',
};

export const OWN_SIGNS: Record<string, number[]> = {
  Sun: [5], Moon: [4], Mars: [1, 8], Mercury: [3, 6],
  Jupiter: [9, 12], Venus: [2, 7], Saturn: [10, 11],
};

export const EXALTATION_SIGNS: Record<string, number> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7,
};

/** Houses counted as kendra (quadrants): 1st, 4th, 7th, 10th. */
export const KENDRA_OFFSETS = [0, 3, 6, 9];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const planetOf = (chart: YogaChartInput, id: string): YogaPlanetInput | undefined =>
  chart.planets.find((p) => p.id === id);

const houseSignOf = (chart: YogaChartInput, house: number): number | null =>
  house >= 1 && house <= 12 ? (chart.houseSigns[house - 1] ?? null) : null;

const signNameOf = (chart: YogaChartInput, signId: number): string => {
  const p = chart.planets.find((q) => q.signId === signId);
  return p ? p.signName : `sign ${signId}`;
};

/** Bhava offset from `from` to `to`, 0..11. */
const houseOffset = (from: number, to: number): number => ((to - from + 12) % 12);

const isKendra = (from: number, to: number): boolean => KENDRA_OFFSETS.includes(houseOffset(from, to));

const signLord = (signId: number | null): string | null => (signId ? SIGN_LORDS[signId] ?? null : null);

/**
 * AND-based status resolution.
 *
 *   any condition conclusively false  -> ABSENT        (a false condition is
 *                                                       logically decisive,
 *                                                       even if another
 *                                                       condition is unknown)
 *   else any condition unresolved     -> INDETERMINATE
 *   else (every condition true)       -> PRESENT
 */
export function resolveStatus(conditions: YogaConditionResult[]): YogaStatus {
  if (conditions.length === 0) return 'NOT_CALCULATED';
  if (conditions.some((c) => c.satisfied === false)) return 'ABSENT';
  if (conditions.some((c) => c.satisfied === null)) return 'INDETERMINATE';
  return 'PRESENT';
}

interface YogaRuleMeta {
  id: string;
  name: string;
  rule: string;
  inputs: YogaInputs;
  implemented: boolean;
  notCalculatedReason?: string;
  evaluate: (chart: YogaChartInput) => YogaConditionResult[];
}

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

function conjunctionRule(meta: {
  id: string;
  name: string;
  a: string;
  b: string;
  rule: string;
}): YogaRuleMeta {
  return {
    id: meta.id,
    name: meta.name,
    rule: meta.rule,
    inputs: { planets: [meta.a, meta.b], houses: [], signs: [] },
    implemented: true,
    evaluate: (chart) => {
      const pa = planetOf(chart, meta.a);
      const pb = planetOf(chart, meta.b);
      const conditions: YogaConditionResult[] = [
        {
          id: `${meta.a.toLowerCase()}.placed`,
          description: `${meta.a} position resolved`,
          satisfied: pa && pa.signId > 0 ? true : null,
          evidence: pa ? [`${meta.a} in ${pa.signName} (sign ${pa.signId}), house ${pa.house || 'unresolved'}`] : [`${meta.a} not present in chart`],
        },
        {
          id: `${meta.b.toLowerCase()}.placed`,
          description: `${meta.b} position resolved`,
          satisfied: pb && pb.signId > 0 ? true : null,
          evidence: pb ? [`${meta.b} in ${pb.signName} (sign ${pb.signId}), house ${pb.house || 'unresolved'}`] : [`${meta.b} not present in chart`],
        },
      ];
      if (!pa || !pb || !pa.signId || !pb.signId) {
        conditions.push({
          id: `${meta.a.toLowerCase()}-${meta.b.toLowerCase()}.same-sign`,
          description: `${meta.a} and ${meta.b} occupy the same sign`,
          satisfied: null,
          evidence: ['not evaluated: at least one position unresolved'],
        });
        return conditions;
      }
      const separation = Math.abs(((pa.longitudeDeg - pb.longitudeDeg + 540) % 360) - 180);
      conditions.push({
        id: `${meta.a.toLowerCase()}-${meta.b.toLowerCase()}.same-sign`,
        description: `${meta.a} and ${meta.b} occupy the same sign`,
        satisfied: pa.signId === pb.signId,
        evidence: [
          `${meta.a} sign ${pa.signId} (${pa.signName})`,
          `${meta.b} sign ${pb.signId} (${pb.signName})`,
          `angular separation ${separation.toFixed(2)}°`,
        ],
      });
      return conditions;
    },
  };
}

function panchaMahapurushaRule(meta: {
  id: string;
  name: string;
  planet: string;
}): YogaRuleMeta {
  const own = OWN_SIGNS[meta.planet] ?? [];
  const exalt = EXALTATION_SIGNS[meta.planet];
  return {
    id: meta.id,
    name: meta.name,
    rule:
      `${meta.planet} occupies a kendra (house 1, 4, 7 or 10 counted from the lagna) ` +
      `AND is in its own sign (${own.join(' / ')}) or its sign of exaltation (${exalt}).`,
    inputs: { planets: [meta.planet], houses: [1, 4, 7, 10], signs: [] },
    implemented: true,
    evaluate: (chart) => {
      const p = planetOf(chart, meta.planet);
      if (!p) {
        return [{
          id: `${meta.planet.toLowerCase()}.placed`,
          description: `${meta.planet} position resolved`,
          satisfied: null,
          evidence: [`${meta.planet} not present in chart`],
        }];
      }
      const inKendra = p.house >= 1 && p.house <= 12 ? [1, 4, 7, 10].includes(p.house) : null;
      const strongSign = p.signId > 0 ? (own.includes(p.signId) || p.signId === exalt) : null;
      return [
        {
          id: `${meta.planet.toLowerCase()}.placed`,
          description: `${meta.planet} position resolved`,
          satisfied: true,
          evidence: [`${meta.planet} in ${p.signName} (sign ${p.signId}), house ${p.house || 'unresolved'}`],
        },
        {
          id: `${meta.planet.toLowerCase()}.in-kendra`,
          description: `${meta.planet} occupies a kendra from the lagna (house 1, 4, 7 or 10)`,
          satisfied: inKendra,
          evidence: p.house >= 1
            ? [`${meta.planet} in house ${p.house}`, `lagna sign ${chart.ascendantSignId}`]
            : ['house unresolved — not evaluated'],
        },
        {
          id: `${meta.planet.toLowerCase()}.own-or-exalted`,
          description: `${meta.planet} is in its own sign or exaltation sign`,
          satisfied: strongSign,
          evidence: p.signId > 0
            ? [`${meta.planet} in sign ${p.signId} (${p.signName})`, `own signs ${own.join('/')}`, `exaltation sign ${exalt}`]
            : ['sign unresolved — not evaluated'],
        },
      ];
    },
  };
}

const GajaKesariRule: YogaRuleMeta = {
  id: 'YOGA_GAJA_KESARI',
  name: 'Gaja-Kesari Yoga',
  rule:
    'Jupiter occupies a kendra (1st, 4th, 7th or 10th) counted from the Moon — ' +
    'i.e. the bhava offset from Moon to Jupiter is 0, 3, 6 or 9.',
  inputs: { planets: ['Moon', 'Jupiter'], houses: [1, 4, 7, 10], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const moon = planetOf(chart, 'Moon');
    const jupiter = planetOf(chart, 'Jupiter');
    const conditions: YogaConditionResult[] = [
      {
        id: 'moon.house-resolved',
        description: 'Moon house resolved',
        satisfied: moon && moon.house >= 1 ? true : null,
        evidence: moon ? [`Moon in ${moon.signName} (sign ${moon.signId}), house ${moon.house || 'unresolved'}`] : ['Moon not present in chart'],
      },
      {
        id: 'jupiter.house-resolved',
        description: 'Jupiter house resolved',
        satisfied: jupiter && jupiter.house >= 1 ? true : null,
        evidence: jupiter ? [`Jupiter in ${jupiter.signName} (sign ${jupiter.signId}), house ${jupiter.house || 'unresolved'}`] : ['Jupiter not present in chart'],
      },
    ];
    if (!moon || !jupiter || moon.house < 1 || jupiter.house < 1) {
      conditions.push({
        id: 'jupiter.kendra-from-moon',
        description: 'Jupiter is in a kendra counted from the Moon',
        satisfied: null,
        evidence: ['not evaluated: Moon or Jupiter house unresolved'],
      });
      return conditions;
    }
    const offset = houseOffset(moon.house, jupiter.house);
    conditions.push({
      id: 'jupiter.kendra-from-moon',
      description: 'Jupiter is in a kendra counted from the Moon',
      satisfied: KENDRA_OFFSETS.includes(offset),
      evidence: [
        `Moon house ${moon.house}`,
        `Jupiter house ${jupiter.house}`,
        `offset ${offset} house(s) — kendra requires 0, 3, 6 or 9`,
      ],
    });
    return conditions;
  },
};

const DharmaKarmaAdhipatiRule: YogaRuleMeta = {
  id: 'YOGA_DHARMA_KARMA_ADHIPATI',
  name: 'Dharma-Karmadhipati Yoga (conjunction or parivartana only)',
  rule:
    'LIMITED RULE: the lord of the 9th house and the lord of the 10th house ' +
    'are conjoined (occupy the same house) OR are in parivartana (each ' +
    'occupying a sign owned by the other). Generic mutual-kendra placement is ' +
    'NOT sufficient under this rule and is registered separately as ' +
    'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA (NOT_CALCULATED).',
  inputs: { planets: [], houses: [9, 10], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const sign9 = houseSignOf(chart, 9);
    const sign10 = houseSignOf(chart, 10);
    const lord9 = signLord(sign9);
    const lord10 = signLord(sign10);
    const conditions: YogaConditionResult[] = [
      {
        id: 'house-9.sign-resolved',
        description: 'Sign occupying the 9th house resolved',
        satisfied: sign9 ? true : null,
        evidence: sign9 ? [`house 9 sign ${sign9} (${signNameOf(chart, sign9)})`] : ['house 9 sign unresolved'],
      },
      {
        id: 'house-10.sign-resolved',
        description: 'Sign occupying the 10th house resolved',
        satisfied: sign10 ? true : null,
        evidence: sign10 ? [`house 10 sign ${sign10} (${signNameOf(chart, sign10)})`] : ['house 10 sign unresolved'],
      },
      {
        id: 'lords-resolved',
        description: 'Both house lords identified',
        satisfied: lord9 && lord10 ? true : null,
        evidence: [`9th lord ${lord9 ?? 'unresolved'}`, `10th lord ${lord10 ?? 'unresolved'}`],
      },
    ];
    if (!lord9 || !lord10) {
      conditions.push({
        id: 'lord-relation',
        description: '9th lord and 10th lord are conjoined or in parivartana (mutual kendra is not adopted)',
        satisfied: null,
        evidence: ['not evaluated: house lord(s) unresolved'],
      });
      return conditions;
    }
    const p9 = planetOf(chart, lord9);
    const p10 = planetOf(chart, lord10);
    if (!p9 || !p10 || p9.house < 1 || p10.house < 1) {
      conditions.push({
        id: 'lord-relation',
        description: '9th lord and 10th lord are conjoined or in parivartana (mutual kendra is not adopted)',
        satisfied: null,
        evidence: [
          `${lord9} house ${p9?.house ?? 'unresolved'}`,
          `${lord10} house ${p10?.house ?? 'unresolved'}`,
        ],
      });
      return conditions;
    }
    const conjoined = p9.house === p10.house;
    const parivartana =
      (OWN_SIGNS[lord9] ?? []).includes(p10.signId) &&
      (OWN_SIGNS[lord10] ?? []).includes(p9.signId);
    conditions.push({
      id: 'lord-relation',
      description: '9th lord and 10th lord are conjoined or in parivartana (mutual kendra is not adopted)',
      satisfied: conjoined || parivartana,
      evidence: [
        `9th lord ${lord9} in house ${p9.house}, sign ${p9.signId}`,
        `10th lord ${lord10} in house ${p10.house}, sign ${p10.signId}`,
        `conjoined: ${conjoined}`,
        `parivartana: ${parivartana}`,
        `mutual kendra: ${isKendra(p9.house, p10.house)} (offset ${houseOffset(p9.house, p10.house)}) — recorded for a scholar, NOT adopted as sufficient`,
      ],
    });
    return conditions;
  },
};

const DharmaKarmaAdhipatiMutualKendraRule: YogaRuleMeta = {
  id: 'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA',
  name: 'Dharma-Karmadhipati Yoga — mutual-kendra variant (not adopted)',
  rule:
    'NOT ADOPTED: the 9th lord and the 10th lord occupy kendra positions ' +
    'relative to each other (offset 0, 3, 6 or 9). Reported as evidence only; ' +
    'the status is always NOT_CALCULATED because no licensed source in this ' +
    'repository settles whether this variant is sufficient on its own.',
  inputs: { planets: [], houses: [9, 10], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const sign9 = houseSignOf(chart, 9);
    const sign10 = houseSignOf(chart, 10);
    const lord9 = signLord(sign9);
    const lord10 = signLord(sign10);
    const conditions: YogaConditionResult[] = [
      {
        id: 'lords-resolved',
        description: 'Both house lords identified',
        satisfied: lord9 && lord10 ? true : null,
        evidence: [`9th lord ${lord9 ?? 'unresolved'}`, `10th lord ${lord10 ?? 'unresolved'}`],
      },
    ];
    const p9 = lord9 ? planetOf(chart, lord9) : undefined;
    const p10 = lord10 ? planetOf(chart, lord10) : undefined;
    if (!p9 || !p10 || p9.house < 1 || p10.house < 1) {
      conditions.push({
        id: 'mutual-kendra-offset',
        description: '9th lord and 10th lord are in mutual kendra (offset 0, 3, 6 or 9)',
        satisfied: null,
        evidence: [
          `${lord9 ?? '9th lord'} house ${p9?.house ?? 'unresolved'}`,
          `${lord10 ?? '10th lord'} house ${p10?.house ?? 'unresolved'}`,
        ],
      });
      return conditions;
    }
    const offset = houseOffset(p9.house, p10.house);
    conditions.push({
      id: 'mutual-kendra-offset',
      description: '9th lord and 10th lord are in mutual kendra (offset 0, 3, 6 or 9)',
      satisfied: KENDRA_OFFSETS.includes(offset),
      evidence: [
        `9th lord ${lord9} in house ${p9.house}`,
        `10th lord ${lord10} in house ${p10.house}`,
        `offset ${offset} — recorded for a scholar; NOT adopted as sufficient`,
      ],
    });
    return conditions;
  },
};

const KemadrumaRule: YogaRuleMeta = {
  id: 'YOGA_KEMADRUMA',
  name: 'Kemadruma Yoga',
  rule: 'Not implemented — the classical definition of which grahas neutralise Kemadruma is contested across sources.',
  inputs: { planets: ['Moon'], houses: [], signs: [] },
  implemented: false,
  notCalculatedReason:
    'Kemadruma rule not implemented: sources disagree on whether the Sun and the nodes count as occupant grahas. No status is inferred.',
  evaluate: () => [],
};

/* ------------------------------------------------------------------ */
/* Sprint I — curated classical catalog (charter §15).                  */
/* Every rule below pairs with a YOGA_SOURCE_REGISTRY entry (v2).       */
/* ------------------------------------------------------------------ */

const TARAGRAHAS = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const SEVEN_GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const NATURAL_BENEFICS = ['Mercury', 'Jupiter', 'Venus'];
const MOVABLE_SIGNS = [1, 4, 7, 10];
const FIXED_SIGNS = [2, 5, 8, 11];
const DUAL_SIGNS = [3, 6, 9, 12];
const KENDRA_BHAVAS = [1, 4, 7, 10];
const TRIKONA_BHAVAS = [1, 5, 9];
const DUSTHANA_BHAVAS = [6, 8, 12];
const UPACHAYA_BHAVAS = [3, 6, 10, 11];

const cond = (
  id: string,
  description: string,
  satisfied: boolean | null,
  evidence: string[]
): YogaConditionResult => ({ id, description, satisfied, evidence });

/** Bhava offset from planet a to planet b (0..11), or null when unresolved. */
const planetOffset = (chart: YogaChartInput, fromId: string, toId: string): number | null => {
  const f = planetOf(chart, fromId);
  const t = planetOf(chart, toId);
  if (!f || !t || f.house < 1 || t.house < 1) return null;
  return houseOffset(f.house, t.house);
};

const lordOfBhava = (chart: YogaChartInput, bhava: number): string | null =>
  signLord(houseSignOf(chart, bhava));

/** Planets of `pool` (resolved) whose bhava offset from `anchorId` is in `offsets`. */
const occupantsAtOffsetFrom = (
  chart: YogaChartInput,
  anchorId: string,
  offsets: number[],
  pool: string[]
): string[] =>
  pool.filter((id) => {
    const o = planetOffset(chart, anchorId, id);
    return o !== null && offsets.includes(o);
  });

/** Generic "<pool> planet in <offsets> from <anchor>" existence rule. */
function flankingRule(meta: {
  id: string;
  name: string;
  anchor: string;
  offsets: number[];
  offsetLabel: string;
  pool: string[];
  require: 'ANY' | 'BOTH_SIDES';
  secondOffsets?: number[];
  secondLabel?: string;
}): YogaRuleMeta {
  const oneSide = (chart: YogaChartInput, offsets: number[]): { hit: string[]; resolved: boolean; ev: string[] } => {
    const anchor = planetOf(chart, meta.anchor);
    if (!anchor || anchor.house < 1) return { hit: [], resolved: false, ev: [`${meta.anchor} position unresolved`] };
    const hit = occupantsAtOffsetFrom(chart, meta.anchor, offsets, meta.pool);
    const ev = [
      `${meta.anchor} in house ${anchor.house}`,
      ...meta.pool.map((id) => {
        const o = planetOffset(chart, meta.anchor, id);
        const pl = planetOf(chart, id);
        return `${id}: offset ${o === null ? 'unresolved' : o} (house ${pl ? pl.house || 'unresolved' : '?'})`;
      })
    ];
    return { hit, resolved: true, ev };
  };
  return {
    id: meta.id,
    name: meta.name,
    rule: meta.offsetLabel,
    inputs: { planets: [meta.anchor, ...meta.pool], houses: [], signs: [] },
    implemented: true,
    evaluate: (chart) => {
      const first = oneSide(chart, meta.offsets);
      const anchorResolved = cond(
        'anchor.resolved',
        `${meta.anchor} position resolved`,
        first.resolved ? true : null,
        first.ev
      );
      if (!first.resolved) {
        return [anchorResolved, cond('occupancy', 'occupancy evaluated', null, ['not evaluated: anchor unresolved'])];
      }
      if (meta.require === 'ANY') {
        return [
          anchorResolved,
          cond(
            'occupancy',
            `at least one counted graha occupies the stated house(s) from ${meta.anchor}`,
            first.hit.length > 0,
            [`occupants found: ${first.hit.length ? first.hit.join(', ') : 'none'}`, ...first.ev]
          )
        ];
      }
      const second = oneSide(chart, meta.secondOffsets ?? []);
      return [
        anchorResolved,
        cond(
          'occupancy.both-sides',
          `at least one counted graha on EACH stated side of ${meta.anchor}`,
          first.hit.length > 0 && second.hit.length > 0,
          [
            `first side occupants: ${first.hit.length ? first.hit.join(', ') : 'none'}`,
            `second side occupants: ${second.hit.length ? second.hit.join(', ') : 'none'}`,
            ...first.ev
          ]
        )
      ];
    }
  };
}

/** "All benefics in <bhavas> counted from <anchor>" existence rule. */
function allBeneficsInRule(meta: {
  id: string;
  name: string;
  anchor: 'LAGNA' | 'MOON';
  bhavas: number[];
  bhavaLabel: string;
}): YogaRuleMeta {
  const anchorId = meta.anchor === 'MOON' ? 'Moon' : null;
  return {
    id: meta.id,
    name: meta.name,
    rule: `All three natural benefics (Mercury, Jupiter, Venus) occupy ${meta.bhavaLabel} ${meta.anchor === 'MOON' ? 'counted from the Moon' : 'counted from the lagna'}.`,
    inputs: { planets: anchorId ? [anchorId, ...NATURAL_BENEFICS] : [...NATURAL_BENEFICS], houses: meta.bhavas, signs: [] },
    implemented: true,
    evaluate: (chart) => {
      // bhava number counted FROM the anchor: 1 = same bhava as the anchor
      const rel = (id: string): number | null => {
        if (!anchorId) {
          const p = planetOf(chart, id);
          return p && p.house >= 1 ? p.house : null;
        }
        const o = planetOffset(chart, anchorId, id);
        return o === null ? null : o + 1;
      };
      const anchorEv = anchorId
        ? (() => {
            const a = planetOf(chart, anchorId);
            return [`${anchorId} house ${a && a.house >= 1 ? a.house : 'unresolved'}`];
          })()
        : ['lagna anchor'];
      const parts = NATURAL_BENEFICS.map((id) => {
        const r = rel(id);
        const p = planetOf(chart, id);
        return `${id}: ${r === null ? 'unresolved' : `bhava ${r} from anchor (house ${p?.house ?? '?'})`}`;
      });
      const allResolved =
        NATURAL_BENEFICS.every((id) => (planetOf(chart, id)?.house ?? 0) >= 1) &&
        NATURAL_BENEFICS.every((id) => rel(id) !== null) &&
        (!anchorId || (planetOf(chart, anchorId)?.house ?? 0) >= 1);
      const satisfied = allResolved
        ? NATURAL_BENEFICS.every((id) => meta.bhavas.includes(rel(id)!))
        : null;
      return [
        cond('positions.resolved', 'all counted positions resolved', allResolved ? true : null, [...anchorEv, ...parts]),
        cond('benefics.in-houses', `all benefics within ${meta.bhavaLabel}`, satisfied, [...parts, `required bhavas (from anchor): ${meta.bhavas.join('/')}`])
      ];
    }
  };
}

/** "Lord of bhava L stands in bhava set S" existence rule (Viparita / Dhana placements). */
const ordinalSuffix = (n: number): string => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

function lordPlacementRule(meta: {
  id: string;
  name: string;
  lordBhava: number;
  targetBhavas: number[];
}): YogaRuleMeta {
  const targetText = meta.targetBhavas.length === 1
    ? `bhava ${meta.targetBhavas[0]}`
    : `${meta.targetBhavas.slice(0, -1).join(', ')} or bhava ${meta.targetBhavas[meta.targetBhavas.length - 1]}`;
  return {
    id: meta.id,
    name: meta.name,
    rule: `The lord of the ${meta.lordBhava}${ordinalSuffix(meta.lordBhava)} bhava occupies ${targetText}.`,
    inputs: { planets: [], houses: [meta.lordBhava, ...meta.targetBhavas], signs: [] },
    implemented: true,
    evaluate: (chart) => {
      const lord = lordOfBhava(chart, meta.lordBhava);
      const houseSign = houseSignOf(chart, meta.lordBhava);
      if (!lord || !houseSign) {
        return [cond('lord.resolved', `lord of bhava ${meta.lordBhava} resolved`, null, [`bhava ${meta.lordBhava} sign unresolved`])];
      }
      const p = planetOf(chart, lord);
      const placedAt = p && p.house >= 1 ? p.house : null;
      return [
        cond('lord.resolved', `lord of bhava ${meta.lordBhava} resolved`, true, [
          `bhava ${meta.lordBhava} holds sign ${houseSign}; its lord is ${lord}`,
          `${lord} in house ${placedAt ?? 'unresolved'}`
        ]),
        cond('lord.in-target', `${lord} (lord of ${meta.lordBhava}) occupies bhava ${meta.targetBhavas.join(' / ')}`, placedAt === null ? null : meta.targetBhavas.includes(placedAt), [
          `${lord} house: ${placedAt ?? 'unresolved'}`,
          `target bhavas: ${meta.targetBhavas.join('/')}`
        ])
      ];
    }
  };
}

/** Nabhasa Sankhya/Asraya family over the seven grahas. */
function nabhasaRule(meta: { id: string; name: string; mode: 'ALL_IN_SIGNS' | 'EXACTLY_N_SIGNS' | 'ALL_IN_KENDRAS'; signs?: number[]; n?: number }): YogaRuleMeta {
  const ruleText =
    meta.mode === 'ALL_IN_SIGNS' ? `All seven grahas (Sun..Saturn) occupy ${meta.signs!.length === 4 ? 'the' : 'the'} sign set ${meta.signs!.join('/')} (nodes excluded).`
    : meta.mode === 'EXACTLY_N_SIGNS' ? `All seven grahas (Sun..Saturn) occupy exactly ${meta.n} distinct sign(s) between them (nodes excluded).`
    : 'All seven grahas (Sun..Saturn) occupy kendra bhavas (1/4/7/10) from the lagna (nodes excluded).';
  return {
    id: meta.id,
    name: meta.name,
    rule: ruleText,
    inputs: { planets: [...SEVEN_GRAHAS], houses: meta.mode === 'ALL_IN_KENDRAS' ? KENDRA_BHAVAS : [], signs: [] },
    implemented: true,
    evaluate: (chart) => {
      const positions = SEVEN_GRAHAS.map((id) => {
        const p = planetOf(chart, id);
        return { id, house: p?.house ?? 0, signId: p?.signId ?? 0 };
      });
      const allResolved = positions.every((x) => x.house >= 1 && x.signId > 0);
      const posEv = positions.map((x) => `${x.id}: house ${x.house || 'unresolved'}, sign ${x.signId || 'unresolved'}`);
      if (!allResolved) {
        return [
          cond('positions.resolved', 'all seven graha positions resolved', null, [...posEv, 'not evaluated: at least one position unresolved'])
        ];
      }
      let satisfied: boolean;
      let how: string;
      if (meta.mode === 'ALL_IN_SIGNS') {
        satisfied = positions.every((x) => meta.signs!.includes(x.signId));
        how = `required signs: ${meta.signs!.join('/')}`;
      } else if (meta.mode === 'EXACTLY_N_SIGNS') {
        const distinct = new Set(positions.map((x) => x.signId));
        satisfied = distinct.size === meta.n;
        how = `distinct signs occupied: ${distinct.size} (required exactly ${meta.n})`;
      } else {
        satisfied = positions.every((x) => KENDRA_BHAVAS.includes(x.house));
        how = `required kendra bhavas: ${KENDRA_BHAVAS.join('/')}`;
      }
      return [
        cond('positions.resolved', 'all seven graha positions resolved', true, posEv),
        cond(meta.mode === 'ALL_IN_KENDRAS' ? 'grahas.in-kendra-bhavas' : meta.mode === 'ALL_IN_SIGNS' ? 'grahas.in-sign-set' : 'grahas.exactly-n-signs', ruleText, satisfied, [...posEv, how])
      ];
    }
  };
}

/** Amala: a benefic in the 10th from the lagna OR the 10th from the Moon. */
const AmalaRule: YogaRuleMeta = {
  id: 'YOGA_AMALA',
  name: 'Amala Yoga',
  rule: 'At least one natural benefic (Mercury, Jupiter or Venus) occupies the 10th bhava from the lagna OR the 10th house counted from the Moon.',
  inputs: { planets: ['Moon', ...NATURAL_BENEFICS], houses: [10], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const fromLagna = NATURAL_BENEFICS.map((id) => {
      const p = planetOf(chart, id);
      return { id, bhava: p && p.house >= 1 ? p.house : null };
    });
    const fromMoon = NATURAL_BENEFICS.map((id) => {
      const o = planetOffset(chart, 'Moon', id);
      return { id, bhava: o === null ? null : o + 1 };
    });
    const moon = planetOf(chart, 'Moon');
    const lagnaResolved = fromLagna.every((x) => x.bhava !== null);
    const moonResolved = !!moon && moon.house >= 1 && fromMoon.every((x) => x.bhava !== null);
    const ev = [
      `Moon house: ${moon && moon.house >= 1 ? moon.house : 'unresolved'}`,
      ...fromLagna.map((x) => `${x.id} bhava from lagna: ${x.bhava ?? 'unresolved'}`),
      ...fromMoon.map((x) => `${x.id} bhava from Moon: ${x.bhava ?? 'unresolved'}`)
    ];
    if (!lagnaResolved && !moonResolved) {
      return [cond('positions.resolved', 'benefic positions resolved', null, [...ev, 'not evaluated: positions unresolved'])];
    }
    const hitLagna = fromLagna.filter((x) => x.bhava === 10).map((x) => x.id);
    const hitMoon = fromMoon.filter((x) => x.bhava === 10).map((x) => x.id);
    return [
      cond('positions.resolved', 'benefic positions resolved', true, ev),
      cond('benefic.in-10th', 'a benefic stands in the 10th from the lagna or the Moon', hitLagna.length > 0 || hitMoon.length > 0, [
        `10th-from-lagna benefics: ${hitLagna.length ? hitLagna.join(', ') : 'none'}`,
        `10th-from-Moon benefics: ${hitMoon.length ? hitMoon.join(', ') : 'none'}`
      ])
    ];
  }
};

/** 2nd/11th lords in Parivartana (mutual sign exchange). */
const DhanaLordsExchangeRule: YogaRuleMeta = {
  id: 'YOGA_DHANA_LORDS_EXCHANGE',
  name: 'Dhana Yoga (2nd-11th lords in Parivartana)',
  rule: 'The lord of the 2nd bhava and the lord of the 11th bhava occupy each other\'s signs.',
  inputs: { planets: [], houses: [2, 11], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const sign2 = houseSignOf(chart, 2);
    const sign11 = houseSignOf(chart, 11);
    const lord2 = signLord(sign2);
    const lord11 = signLord(sign11);
    if (!lord2 || !lord11 || !sign2 || !sign11) {
      return [cond('lords.resolved', '2nd and 11th lords resolved', null, ['bhava signs unresolved'])];
    }
    const p2 = planetOf(chart, lord2);
    const p11 = planetOf(chart, lord11);
    const signOf2 = p2?.signId ?? 0;
    const signOf11 = p11?.signId ?? 0;
    const resolved = signOf2 > 0 && signOf11 > 0;
    if (!resolved) {
      return [cond('lords.resolved', '2nd and 11th lords resolved', null, [`lord2 ${lord2} sign unresolved; lord11 ${lord11} sign unresolved`])];
    }
    const exchanged = signOf2 === sign11 && signOf11 === sign2;
    return [
      cond('lords.resolved', '2nd and 11th lords resolved', true, [
        `bhava 2 holds sign ${sign2}, lord ${lord2} (in sign ${signOf2})`,
        `bhava 11 holds sign ${sign11}, lord ${lord11} (in sign ${signOf11})`
      ]),
      cond('exchange', `${lord2} and ${lord11} occupy each other\'s signs`, exchanged, [
        `required: ${lord2} in ${sign11} and ${lord11} in ${sign2}`
      ])
    ];
  }
};

/** 2nd/11th lords in the same sign. */
const DhanaLordsConjunctRule: YogaRuleMeta = {
  id: 'YOGA_DHANA_LORDS_CONJUNCT',
  name: 'Dhana Yoga (2nd and 11th lords conjunct)',
  rule: 'The lord of the 2nd bhava and the lord of the 11th bhava occupy the same sign.',
  inputs: { planets: [], houses: [2, 11], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const sign2 = houseSignOf(chart, 2);
    const sign11 = houseSignOf(chart, 11);
    const lord2 = signLord(sign2);
    const lord11 = signLord(sign11);
    if (!lord2 || !lord11) {
      return [cond('lords.resolved', '2nd and 11th lords resolved', null, ['bhava signs unresolved'])];
    }
    const signOf2 = planetOf(chart, lord2)?.signId ?? 0;
    const signOf11 = planetOf(chart, lord11)?.signId ?? 0;
    if (!signOf2 || !signOf11) {
      return [cond('lords.resolved', '2nd and 11th lords resolved', null, [`lord placements unresolved (${lord2} sign ${signOf2 || '?'}, ${lord11} sign ${signOf11 || '?'})`])];
    }
    return [
      cond('lords.resolved', '2nd and 11th lords resolved', true, [
        `bhava 2 lord ${lord2} in sign ${signOf2}`,
        `bhava 11 lord ${lord11} in sign ${signOf11}`
      ]),
      cond('conjunction', `${lord2} and ${lord11} share a sign`, signOf2 === signOf11, [`signs: ${signOf2} vs ${signOf11}`])
    ];
  }
};

/** Lakshmi: 9th lord in own/exaltation sign AND in a kendra bhava. */
const LakshmiRule: YogaRuleMeta = {
  id: 'YOGA_LAKSHMI',
  name: 'Lakshmi Yoga',
  rule: 'The lord of the 9th bhava occupies its own sign or exaltation sign AND stands in a kendra bhava (1/4/7/10) from the lagna. (The classical Venus-strength qualifier is a strength concept and is NOT applied.)',
  inputs: { planets: [], houses: [9, 1, 4, 7, 10], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const sign9 = houseSignOf(chart, 9);
    const lord9 = signLord(sign9);
    if (!lord9 || !sign9) {
      return [cond('lord9.resolved', '9th lord resolved', null, ['bhava 9 sign unresolved'])];
    }
    const p = planetOf(chart, lord9);
    const signId = p?.signId ?? 0;
    const house = p?.house ?? 0;
    if (!signId || !house) {
      return [cond('lord9.resolved', '9th lord resolved', null, [`${lord9} position unresolved`])];
    }
    const dignified = OWN_SIGNS[lord9]?.includes(signId) || signId === EXALTATION_SIGNS[lord9];
    const inKendra = KENDRA_BHAVAS.includes(house);
    return [
      cond('lord9.resolved', '9th lord resolved', true, [
        `bhava 9 holds sign ${sign9}, lord ${lord9} in sign ${signId}, house ${house}`
      ]),
      cond('lord9.own-or-exalted', `${lord9} in own or exaltation sign`, dignified, [
        `own signs of ${lord9}: ${(OWN_SIGNS[lord9] ?? []).join('/')}; exaltation sign: ${EXALTATION_SIGNS[lord9]}`,
        `observed sign: ${signId}`
      ]),
      cond('lord9.in-kendra', `${lord9} in a kendra bhava (1/4/7/10)`, inKendra, [`observed house: ${house}`])
    ];
  }
};

/** Raja Sambandha: a trikona lord and a kendra lord (distinct grahas) conjunct or exchanged. */
const RajaSambandhaRule: YogaRuleMeta = {
  id: 'YOGA_RAJA_SAMBANDHA',
  name: 'Raja Yoga (kendra-lord / trikona-lord association)',
  rule: 'Some lord of a trikona bhava (1/5/9) and some lord of a kendra bhava (1/4/7/10) — two different grahas — are associated by whole-sign conjunction or by sign exchange.',
  inputs: { planets: [], houses: [1, 4, 5, 7, 9, 10], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const lordOf = (bh: number): { lord: string | null; sign: number | null } => ({ lord: signLord(houseSignOf(chart, bh)), sign: houseSignOf(chart, bh) });
    const trikonaLords = TRIKONA_BHAVAS.map(lordOf);
    const kendraLords = KENDRA_BHAVAS.map(lordOf);
    if (trikonaLords.some((x) => !x.lord) || kendraLords.some((x) => !x.lord)) {
      return [cond('lords.resolved', 'kendra and trikona lords resolved', null, ['one or more bhava signs unresolved'])];
    }
    const signOf = (id: string): number => planetOf(chart, id)?.signId ?? 0;
    const pairs: string[] = [];
    let hit: string | null = null;
    for (let i = 0; i < TRIKONA_BHAVAS.length; i++) {
      for (let j = 0; j < KENDRA_BHAVAS.length; j++) {
        const a = trikonaLords[i].lord!;
        const b = kendraLords[j].lord!;
        if (a === b) continue; // a lone lagna lord does not self-associate
        const sa = signOf(a), sb = signOf(b);
        if (!sa || !sb) continue;
        const conjunct = sa === sb;
        const exchanged = sa === kendraLords[j].sign && sb === trikonaLords[i].sign;
        pairs.push(`${a}(T${TRIKONA_BHAVAS[i]}, sign ${sa}) x ${b}(K${KENDRA_BHAVAS[j]}, sign ${sb}): ${conjunct ? 'conjunct' : exchanged ? 'exchange' : 'no association'}`);
        if ((conjunct || exchanged) && !hit) hit = `${a} (lord of T${TRIKONA_BHAVAS[i]}) with ${b} (lord of K${KENDRA_BHAVAS[j]}) — ${conjunct ? 'conjunction' : 'exchange'}`;
      }
    }
    return [
      cond('lords.resolved', 'kendra and trikona lords resolved', true, trikonaLords.concat(kendraLords).map((x, idx) => `bhava lord ${idx}: ${x.lord} (sign ${x.sign})`)),
      cond('association', 'a trikona lord and a kendra lord are conjunct or exchanged', hit !== null, [...(pairs.length ? pairs : ['no eligible distinct pairs']), hit ?? 'no qualifying association'])
    ];
  }
};

/** Neecha Bhanga: a debilitated graha whose dispositor is in a kendra from the lagna or the Moon. */
const NeechaBhangaRule: YogaRuleMeta = {
  id: 'YOGA_NEECHA_BHANGA',
  name: 'Neecha Bhanga (debilitation cancellation)',
  rule: 'A graha stands in its debilitation sign AND its dispositor (lord of that sign) occupies a kendra bhava (1/4/7/10) from the lagna or from the Moon. (The exaltation-lord and debilitated-in-kendra conditions are declared alternatives, NOT adopted.)',
  inputs: { planets: [...SEVEN_GRAHAS], houses: KENDRA_BHAVAS, signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const debSignOf = (id: string): number => (((EXALTATION_SIGNS[id] - 1 + 6) % 12) + 1);
    const rows = SEVEN_GRAHAS.map((id) => {
      const p = planetOf(chart, id);
      const deb = debSignOf(id);
      const isDeb = !!p && p.signId === deb;
      const dispositor = isDeb ? signLord(deb) : null;
      const dispHouse = dispositor ? planetOf(chart, dispositor)?.house ?? 0 : 0;
      const kendraLagna = dispHouse >= 1 && KENDRA_BHAVAS.includes(dispHouse);
      const offMoon = dispositor ? planetOffset(chart, 'Moon', dispositor!) : null;
      const kendraMoon = offMoon !== null && KENDRA_OFFSETS.includes(offMoon);
      return { id, deb, isDeb, dispositor, dispHouse, kendraLagna, kendraMoon };
    });
    const ev = rows.map((r) => r.isDeb
      ? `${r.id} DEBILITATED in sign ${r.deb}; dispositor ${r.dispositor} in house ${r.dispHouse || 'unresolved'} — kendra-from-lagna: ${r.kendraLagna}, kendra-from-Moon: ${r.kendraMoon}`
      : `${r.id} not debilitated (deb sign would be ${r.deb})`);
    const anyDeb = rows.some((r) => r.isDeb);
    if (!anyDeb && rows.every((r) => planetOf(chart, r.id)?.signId)) {
      return [
        cond('debilitation.scan', 'scan for debilitated grahas', true, ev),
        cond('cancellation', 'a debilitated graha has its dispositor in a kendra from the lagna or Moon', false, ['no graha is debilitated — nothing to cancel'])
      ];
    }
    const unresolved = rows.some((r) => !planetOf(chart, r.id)?.signId || (r.isDeb && (!r.dispositor || r.dispHouse === 0)));
    const satisfied = unresolved ? null : rows.some((r) => r.isDeb && (r.kendraLagna || r.kendraMoon));
    return [
      cond('debilitation.scan', 'scan for debilitated grahas', !unresolved, ev),
      cond('cancellation', 'a debilitated graha has its dispositor in a kendra from the lagna or Moon', satisfied, [
        ...ev,
        unresolved ? 'not fully evaluated: positions unresolved' : 'scan complete'
      ])
    ];
  }
};

/** Parivartana: mutual sign exchange between any two of the seven grahas. */
const ParivartanaRule: YogaRuleMeta = {
  id: 'YOGA_PARIVARTANA',
  name: 'Parivartana Yoga (sign exchange)',
  rule: 'At least two of the seven grahas (Sun..Saturn) occupy each other\'s signs (nodes excluded).',
  inputs: { planets: [...SEVEN_GRAHAS], houses: [], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const exchanges: string[] = [];
    const unresolved: string[] = [];
    for (let i = 0; i < SEVEN_GRAHAS.length; i++) {
      for (let j = i + 1; j < SEVEN_GRAHAS.length; j++) {
        const a = SEVEN_GRAHAS[i], b = SEVEN_GRAHAS[j];
        const pa = planetOf(chart, a), pb = planetOf(chart, b);
        if (!pa || !pb || !pa.signId || !pb.signId) { unresolved.push(`${a}/${b}`); continue; }
        const lordA = SIGN_LORDS[pa.signId], lordB = SIGN_LORDS[pb.signId];
        if (lordA === b && lordB === a && pa.signId !== pb.signId) {
          exchanges.push(`${a} (sign ${pa.signId}) <-> ${b} (sign ${pb.signId})`);
        }
      }
    }
    const allResolved = unresolved.length === 0;
    return [
      cond('positions.resolved', 'all seven graha signs resolved', allResolved ? true : null,
        SEVEN_GRAHAS.map((id) => `${id}: sign ${planetOf(chart, id)?.signId || 'unresolved'}`)),
      cond('exchange', 'a mutual sign exchange exists between two grahas', allResolved ? exchanges.length > 0 : null, [
        exchanges.length ? `exchanges: ${exchanges.join('; ')}` : 'no exchange found',
        ...SEVEN_GRAHAS.map((id) => `${id}: sign ${planetOf(chart, id)?.signId || 'unresolved'}`)
      ])
    ];
  }
};

/** Kartari: <pool> planets occupy BOTH the 2nd and the 12th bhava from the lagna. */
function KartariRule(id: string, name: string, pool: string[], poolLabel: string): YogaRuleMeta {
  return {
    id,
    name,
    rule: `${poolLabel.charAt(0).toUpperCase() + poolLabel.slice(1)} occupy BOTH the 2nd and the 12th bhava from the lagna (flanking the ascendant).`,
    inputs: { planets: [...pool], houses: [2, 12], signs: [] },
    implemented: true,
    evaluate: (chart) => {
      const inBhava = (bh: number): string[] =>
        pool.filter((pid) => planetOf(chart, pid)?.house === bh);
      const second = inBhava(2);
      const twelfth = inBhava(12);
      const ev = [
        `bhava 2 occupants among counted pool: ${second.length ? second.join(', ') : 'none'}`,
        `bhava 12 occupants among counted pool: ${twelfth.length ? twelfth.join(', ') : 'none'}`,
        ...pool.map((pid) => `${pid}: house ${planetOf(chart, pid)?.house || 'unresolved'}`)
      ];
      return [
        cond('flank.2nd', `a counted ${poolLabel.includes('benefics') ? 'benefic' : 'malefic'} occupies bhava 2`, second.length > 0, ev),
        cond('flank.12th', `a counted ${poolLabel.includes('benefics') ? 'benefic' : 'malefic'} occupies bhava 12`, twelfth.length > 0, ev)
      ];
    }
  };
}

/** Saraswati: Me/Ju/Ve each in kendra/trikona/2nd, AND Jupiter in own/exaltation sign. */
const SaraswatiRule: YogaRuleMeta = {
  id: 'YOGA_SARASWATI',
  name: 'Saraswati Yoga',
  rule: 'Mercury, Jupiter and Venus EACH occupy a kendra (1/4/7/10), trikona (1/5/9) or the 2nd bhava, AND Jupiter occupies its own sign or exaltation sign. (The friendly-sign allowance is a declared alternative, NOT adopted.)',
  inputs: { planets: [...NATURAL_BENEFICS], houses: [2, 1, 4, 5, 7, 9, 10], signs: [] },
  implemented: true,
  evaluate: (chart) => {
    const allowed = [1, 2, 4, 5, 7, 9, 10];
    const rows = NATURAL_BENEFICS.map((id) => {
      const p = planetOf(chart, id);
      return { id, house: p?.house ?? 0, signId: p?.signId ?? 0 };
    });
    const ev = rows.map((r) => `${r.id}: house ${r.house || 'unresolved'}, sign ${r.signId || 'unresolved'}`);
    const allResolved = rows.every((r) => r.house >= 1 && r.signId > 0);
    const placedOk = allResolved ? rows.every((r) => allowed.includes(r.house)) : null;
    const jup = rows.find((r) => r.id === 'Jupiter')!;
    const jupDignified = allResolved ? (OWN_SIGNS.Jupiter.includes(jup.signId) || jup.signId === EXALTATION_SIGNS.Jupiter) : null;
    return [
      cond('positions.resolved', 'benefic positions resolved', allResolved ? true : null, ev),
      cond('benefics.placed', 'each of Mercury/Jupiter/Venus in kendra (1/4/7/10), trikona (1/5/9) or bhava 2', placedOk, [...ev, `allowed bhavas: ${allowed.join('/')}`]),
      cond('jupiter.dignified', 'Jupiter in its own sign or exaltation sign', jupDignified, [
        `Jupiter sign: ${jup.signId || 'unresolved'}; own signs 9/12; exaltation sign 4`
      ])
    ];
  }
};

const KalpadrumaRule: YogaRuleMeta = {
  id: 'YOGA_KALPADRUMA',
  name: 'Kalpadruma (Kalpavriksha) Yoga',
  rule: 'Not implemented — the chained dispositor formulation is contested across sources.',
  inputs: { planets: [], houses: [], signs: [] },
  implemented: false,
  notCalculatedReason:
    'Kalpadruma rule not implemented: the multi-level dispositor chain is formulated differently across compilations. No status is inferred.',
  evaluate: () => [],
};

const YOGA_RULES: YogaRuleMeta[] = [
  GajaKesariRule,
  conjunctionRule({
    id: 'YOGA_BUDHADITYA',
    name: 'Budhaditya Yoga',
    a: 'Sun',
    b: 'Mercury',
    rule: 'The Sun and Mercury occupy the same sign.',
  }),
  conjunctionRule({
    id: 'YOGA_CHANDRA_MANGALA',
    name: 'Chandra-Mangala Yoga',
    a: 'Moon',
    b: 'Mars',
    rule: 'The Moon and Mars occupy the same sign.',
  }),
  DharmaKarmaAdhipatiRule,
  DharmaKarmaAdhipatiMutualKendraRule,
  panchaMahapurushaRule({ id: 'YOGA_RUCHAKA', name: 'Ruchaka Yoga (Pancha Mahapurusha)', planet: 'Mars' }),
  panchaMahapurushaRule({ id: 'YOGA_HAMSA', name: 'Hamsa Yoga (Pancha Mahapurusha)', planet: 'Jupiter' }),
  panchaMahapurushaRule({ id: 'YOGA_MALAVYA', name: 'Malavya Yoga (Pancha Mahapurusha)', planet: 'Venus' }),
  panchaMahapurushaRule({ id: 'YOGA_SASA', name: 'Sasa Yoga (Pancha Mahapurusha)', planet: 'Saturn' }),
  panchaMahapurushaRule({ id: 'YOGA_BHADRA', name: 'Bhadra Yoga (Pancha Mahapurusha)', planet: 'Mercury' }),
  KemadrumaRule,

  /* ---- Sprint I: curated catalog expansion (charter §15) -------------- */

  flankingRule({
    id: 'YOGA_SUNAPHA',
    name: 'Sunapha Yoga',
    anchor: 'Moon',
    offsets: [1], // 2nd from Moon (offset 1)
    offsetLabel: 'At least one of Mars, Mercury, Jupiter, Venus or Saturn occupies the 2nd house (rashi) from the Moon (Sun and nodes excluded).',
    pool: TARAGRAHAS,
    require: 'ANY'
  }),
  flankingRule({
    id: 'YOGA_ANAPHA',
    name: 'Anapha Yoga',
    anchor: 'Moon',
    offsets: [11], // 12th from Moon
    offsetLabel: 'At least one of Mars, Mercury, Jupiter, Venus or Saturn occupies the 12th house (rashi) from the Moon (Sun and nodes excluded).',
    pool: TARAGRAHAS,
    require: 'ANY'
  }),
  flankingRule({
    id: 'YOGA_DURUDHARA',
    name: 'Durudhara Yoga',
    anchor: 'Moon',
    offsets: [1],
    offsetLabel: 'At least one taragraha occupies the 2nd from the Moon AND at least one occupies the 12th from the Moon (Sun and nodes excluded).',
    pool: TARAGRAHAS,
    require: 'BOTH_SIDES',
    secondOffsets: [11]
  }),
  allBeneficsInRule({ id: 'YOGA_ADHI', name: 'Adhi Yoga (from the Moon)', anchor: 'MOON', bhavas: [6, 7, 8], bhavaLabel: 'houses 6/7/8' }),
  allBeneficsInRule({ id: 'YOGA_LAGNADHI', name: 'Lagnadhi Yoga', anchor: 'LAGNA', bhavas: [6, 7, 8], bhavaLabel: 'bhavas 6/7/8' }),
  flankingRule({
    id: 'YOGA_SAKATA',
    name: 'Sakata Yoga',
    anchor: 'Jupiter',
    offsets: [5, 7, 11], // Moon in 6/8/12 from Jupiter
    offsetLabel: 'The Moon occupies the 6th, 8th or 12th house counted from Jupiter.',
    pool: ['Moon'],
    require: 'ANY'
  }),
  AmalaRule,
  flankingRule({
    id: 'YOGA_VESI',
    name: 'Vesi Yoga',
    anchor: 'Sun',
    offsets: [1],
    offsetLabel: 'At least one planet other than the Sun and Moon occupies the 2nd house (rashi) from the Sun (nodes excluded).',
    pool: TARAGRAHAS,
    require: 'ANY'
  }),
  flankingRule({
    id: 'YOGA_VASI',
    name: 'Vasi Yoga',
    anchor: 'Sun',
    offsets: [11],
    offsetLabel: 'At least one planet other than the Sun and Moon occupies the 12th house (rashi) from the Sun (nodes excluded).',
    pool: TARAGRAHAS,
    require: 'ANY'
  }),
  flankingRule({
    id: 'YOGA_UBHAYACHARI',
    name: 'Ubhayachari Yoga',
    anchor: 'Sun',
    offsets: [1],
    offsetLabel: 'At least one taragraha occupies the 2nd from the Sun AND at least one occupies the 12th from the Sun (Sun, Moon and nodes excluded).',
    pool: TARAGRAHAS,
    require: 'BOTH_SIDES',
    secondOffsets: [11]
  }),

  lordPlacementRule({ id: 'YOGA_DHANA_2L_IN_11TH', name: 'Dhana Yoga (2nd lord in the 11th)', lordBhava: 2, targetBhavas: [11] }),
  lordPlacementRule({ id: 'YOGA_DHANA_11L_IN_2ND', name: 'Dhana Yoga (11th lord in the 2nd)', lordBhava: 11, targetBhavas: [2] }),
  lordPlacementRule({ id: 'YOGA_VIPARITA_HARSHA', name: 'Viparita Raja Yoga — Harsha', lordBhava: 6, targetBhavas: [6, 8, 12] }),
  lordPlacementRule({ id: 'YOGA_VIPARITA_SARALA', name: 'Viparita Raja Yoga — Sarala', lordBhava: 8, targetBhavas: [6, 8, 12] }),
  lordPlacementRule({ id: 'YOGA_VIPARITA_VIMALA', name: 'Viparita Raja Yoga — Vimala', lordBhava: 12, targetBhavas: [6, 8, 12] }),

  /* ---- Sprint I: composite rules defined with explicit evaluators ----- */
  DhanaLordsExchangeRule,
  DhanaLordsConjunctRule,
  LakshmiRule,
  RajaSambandhaRule,
  NeechaBhangaRule,
  ParivartanaRule,
  KartariRule('YOGA_SHUBHA_KARTARI', 'Shubha Kartari Yoga', NATURAL_BENEFICS, 'benefics'),
  KartariRule('YOGA_PAPA_KARTARI', 'Papa Kartari Yoga', ['Saturn', 'Mars'], 'malefics (Saturn/Mars)'),
  SaraswatiRule,
  KalpadrumaRule,

  /* ---- Sprint I: Nabhasa family --------------------------------------- */
  nabhasaRule({ id: 'YOGA_RAJJU', name: 'Nabhasa Yoga — Rajju', mode: 'ALL_IN_SIGNS', signs: MOVABLE_SIGNS }),
  nabhasaRule({ id: 'YOGA_MUSALA', name: 'Nabhasa Yoga — Musala', mode: 'ALL_IN_SIGNS', signs: FIXED_SIGNS }),
  nabhasaRule({ id: 'YOGA_NALA', name: 'Nabhasa Yoga — Nala', mode: 'ALL_IN_SIGNS', signs: DUAL_SIGNS }),
  nabhasaRule({ id: 'YOGA_GOLA', name: 'Nabhasa Yoga — Gola', mode: 'EXACTLY_N_SIGNS', n: 1 }),
  nabhasaRule({ id: 'YOGA_YUGA', name: 'Nabhasa Yoga — Yuga', mode: 'EXACTLY_N_SIGNS', n: 2 }),
  nabhasaRule({ id: 'YOGA_SULA', name: 'Nabhasa Yoga — Sula', mode: 'EXACTLY_N_SIGNS', n: 3 }),
  nabhasaRule({ id: 'YOGA_KEDARA', name: 'Nabhasa Yoga — Kedara', mode: 'EXACTLY_N_SIGNS', n: 4 }),
  nabhasaRule({ id: 'YOGA_KAMALA', name: 'Nabhasa Yoga — Kamala (Padma)', mode: 'ALL_IN_KENDRAS' }),
];

export const YOGA_RULE_IDS: string[] = YOGA_RULES.map((r) => r.id);

/**
 * Evaluate every registered yoga rule against a chart.
 * Rules are always returned — including ABSENT, INDETERMINATE and
 * NOT_CALCULATED — so a report can never imply silence where the engine
 * simply did not check.
 */
export function evaluateYogas(chart: YogaChartInput): YogaEvaluation[] {
  return YOGA_RULES.map((rule) => {
    // A rule without a source-registry entry cannot be reported at all.
    const source = sourceEntryFor(rule.id);

    // NOT_ADOPTED rules still compute their conditions as evidence for a
    // scholar, but their status is always NOT_CALCULATED: the engine does not
    // claim PRESENT or ABSENT for an interpretation it has not adopted.
    if (!rule.implemented || source.adoption === 'NOT_ADOPTED') {
      const conditions = rule.evaluate(chart);
      const reason = rule.notCalculatedReason
        ?? `Rule not adopted (registry ${YOGA_SOURCE_REGISTRY_VERSION}). ${source.limitations.join(' ')}`;
      return {
        id: rule.id,
        name: rule.name,
        system: 'PARASHARI' as JyotishSystem,
        rule: rule.rule,
        inputs: rule.inputs,
        conditions,
        source,
        result: 'NOT_CALCULATED' as YogaStatus,
        evidenceRefs: conditions.flatMap((c) => c.evidence),
        status: 'NOT_CALCULATED' as YogaStatus,
        notCalculatedReason: reason,
        strength: { status: 'NOT_APPLICABLE', note: 'No existence verdict was reached, so there is no strength to assess.' },
      };
    }

    const conditions = rule.evaluate(chart);
    const status = resolveStatus(conditions);

    // Defensive: an adopted rule that produced no conditions cannot be judged,
    // so it is reported NOT_CALCULATED rather than defaulted to PRESENT.
    if (conditions.length === 0) {
      return {
        id: rule.id,
        name: rule.name,
        system: 'PARASHARI' as JyotishSystem,
        rule: rule.rule,
        inputs: rule.inputs,
        conditions,
        source,
        result: 'NOT_CALCULATED' as YogaStatus,
        evidenceRefs: [],
        status: 'NOT_CALCULATED' as YogaStatus,
        notCalculatedReason:
          'Rule produced no conditions for this chart — not judged (fail-closed).',
        strength: { status: 'NOT_APPLICABLE', note: 'No existence verdict was reached, so there is no strength to assess.' },
      };
    }

    return {
      id: rule.id,
      name: rule.name,
      system: 'PARASHARI' as JyotishSystem,
      rule: rule.rule,
      inputs: rule.inputs,
      conditions,
      source,
      result: status,
      evidenceRefs: conditions.flatMap((c) => c.evidence),
      status,
      strength:
        status === 'PRESENT'
          ? {
              status: 'SCHOLAR_JUDGEMENT_REQUIRED',
              note: 'Existence engine only (charter §15): strength — dignity, combustion, aspects, divisional reinforcement — is a separate concept and is never quantified by this engine.'
            }
          : { status: 'NOT_APPLICABLE', note: 'No PRESENT verdict, so there is no strength to assess.' }
    };
  });
}

/** Yoga ids currently declared PRESENT — the only names allowed in a report. */
export function presentYogaNames(evaluations: YogaEvaluation[]): string[] {
  return evaluations.filter((y) => y.status === 'PRESENT').map((y) => y.name);
}

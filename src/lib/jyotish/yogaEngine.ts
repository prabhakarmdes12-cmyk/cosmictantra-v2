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

export interface YogaEvaluation {
  id: string;
  name: string;
  system: JyotishSystem;
  /** Formal statement of the rule actually implemented. */
  rule: string;
  inputs: YogaInputs;
  conditions: YogaConditionResult[];
  /** Same value as `status`; kept explicit for report/evidence consumers. */
  result: YogaStatus;
  evidenceRefs: string[];
  status: YogaStatus;
  /** Present only when status === 'NOT_CALCULATED'. */
  notCalculatedReason?: string;
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

function resolveStatus(conditions: YogaConditionResult[]): YogaStatus {
  if (conditions.some((c) => c.satisfied === null)) return 'INDETERMINATE';
  return conditions.every((c) => c.satisfied === true) ? 'PRESENT' : 'ABSENT';
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
  name: 'Dharma-Karmadhipati Yoga',
  rule:
    'The lord of the 9th house and the lord of the 10th house are conjoined ' +
    '(same house), in mutual kendra (offset 0, 3, 6 or 9), or in parivartana ' +
    '(each occupying a sign owned by the other).',
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
        description: '9th lord and 10th lord are conjoined, in mutual kendra, or in parivartana',
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
        description: '9th lord and 10th lord are conjoined, in mutual kendra, or in parivartana',
        satisfied: null,
        evidence: [
          `${lord9} house ${p9?.house ?? 'unresolved'}`,
          `${lord10} house ${p10?.house ?? 'unresolved'}`,
        ],
      });
      return conditions;
    }
    const conjoined = p9.house === p10.house;
    const mutualKendra = isKendra(p9.house, p10.house);
    const parivartana =
      (OWN_SIGNS[lord9] ?? []).includes(p10.signId) &&
      (OWN_SIGNS[lord10] ?? []).includes(p9.signId);
    conditions.push({
      id: 'lord-relation',
      description: '9th lord and 10th lord are conjoined, in mutual kendra, or in parivartana',
      satisfied: conjoined || mutualKendra || parivartana,
      evidence: [
        `9th lord ${lord9} in house ${p9.house}, sign ${p9.signId}`,
        `10th lord ${lord10} in house ${p10.house}, sign ${p10.signId}`,
        `conjoined: ${conjoined}`,
        `mutual kendra: ${mutualKendra} (offset ${houseOffset(p9.house, p10.house)})`,
        `parivartana: ${parivartana}`,
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
  panchaMahapurushaRule({ id: 'YOGA_RUCHAKA', name: 'Ruchaka Yoga (Pancha Mahapurusha)', planet: 'Mars' }),
  panchaMahapurushaRule({ id: 'YOGA_HAMSA', name: 'Hamsa Yoga (Pancha Mahapurusha)', planet: 'Jupiter' }),
  panchaMahapurushaRule({ id: 'YOGA_MALAVYA', name: 'Malavya Yoga (Pancha Mahapurusha)', planet: 'Venus' }),
  panchaMahapurushaRule({ id: 'YOGA_SASA', name: 'Sasa Yoga (Pancha Mahapurusha)', planet: 'Saturn' }),
  panchaMahapurushaRule({ id: 'YOGA_BHADRA', name: 'Bhadra Yoga (Pancha Mahapurusha)', planet: 'Mercury' }),
  KemadrumaRule,
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
    if (!rule.implemented) {
      return {
        id: rule.id,
        name: rule.name,
        system: 'PARASHARI' as JyotishSystem,
        rule: rule.rule,
        inputs: rule.inputs,
        conditions: [],
        result: 'NOT_CALCULATED' as YogaStatus,
        evidenceRefs: [],
        status: 'NOT_CALCULATED' as YogaStatus,
        notCalculatedReason: rule.notCalculatedReason,
      };
    }
    const conditions = rule.evaluate(chart);
    const status = resolveStatus(conditions);
    return {
      id: rule.id,
      name: rule.name,
      system: 'PARASHARI' as JyotishSystem,
      rule: rule.rule,
      inputs: rule.inputs,
      conditions,
      result: status,
      evidenceRefs: conditions.flatMap((c) => c.evidence),
      status,
    };
  });
}

/** Yoga ids currently declared PRESENT — the only names allowed in a report. */
export function presentYogaNames(evaluations: YogaEvaluation[]): string[] {
  return evaluations.filter((y) => y.status === 'PRESENT').map((y) => y.name);
}

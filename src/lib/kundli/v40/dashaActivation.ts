/**
 * KUNDLI V40 — Vimshottari precision + dasha activation profile (§14, §22).
 *
 * Two jobs:
 *
 *  1. Recover the Vimshottari balance at birth at full precision. The
 *     canonical adapter parses it out of the string "5.0 yrs of Sun", which
 *     destroys everything past one decimal. The value is re-derived here from
 *     the canonical Moon longitude using the SAME Vimshottari constants the
 *     dasha engine uses (DASHA_LORDS, 360/27 nakshatra span, 365.25-day year).
 *     This is a derivation over a canonical fact, not a new calculation, and
 *     it is cross-checked against the length of the first mahadasha the engine
 *     itself produced.
 *
 *  2. Build a deterministic activation profile for each active dasha lord:
 *     where it sits, what it rules, its condition, what it aspects, which
 *     yogas it participates in. Timing stays strictly separate from outcome —
 *     this module states what a period *touches*, never what it will *do*.
 */

import type { KundliCanonicalModel } from '../types';
import type { ContentType, JyotishSystem, CapabilityStatus } from './contentTypes';
import { FACT } from './factPaths';
import { yearsToYmd } from './format';
import type { GrahaConditionResult, GrahaCondition } from './grahaCondition';
// The Vimshottari lord order and year allotments are constants of the dasha
// engine. Imported, never restated.
import { DASHA_LORDS } from '../../dashaEngine.js';

export const DASHA_ACTIVATION_VERSION = 'dasha-activation-v1';

const NAKSHATRA_SPAN = 360 / 27;
const DAYS_PER_YEAR = 365.25;

export interface VimshottariBalance {
  status: CapabilityStatus;
  lord: string;
  /** Full-precision balance in years. */
  years: number;
  /** "5y 0m 3d" using the engine's own 365.25-day year. */
  ymd: string;
  days: number;
  /** Fraction of the birth nakshatra still to run at birth, 0..1. */
  nakshatraFractionRemaining: number;
  moonLongitudeDeg: number;
  nakshatraIndex: number;
  /**
   * Length of the first mahadasha as the engine actually emitted it
   * (endDate - startDate), used as an independent cross-check of the value
   * derived here. A disagreement beyond one day is reported, not hidden.
   */
  crossCheck: {
    engineFirstMahadashaDays: number | null;
    derivedDays: number;
    /** engine minus derived, in days. NaN when there is nothing to compare. */
    deltaDays: number;
    agreesWithinOneDay: boolean | null;
    note: string;
  };
  derivation: string;
  contentType: ContentType;
  evidenceIds: string[];
}

/** Recovers the balance at birth at full precision from the canonical Moon. */
export function computeVimshottariBalance(canonical: KundliCanonicalModel): VimshottariBalance {
  const moon = canonical.planets.find((p) => p.id === 'Moon');
  if (!moon) {
    return {
      status: 'NOT_CALCULATED',
      lord: '',
      years: NaN,
      ymd: '—',
      days: NaN,
      nakshatraFractionRemaining: NaN,
      moonLongitudeDeg: NaN,
      nakshatraIndex: -1,
      crossCheck: { engineFirstMahadashaDays: null, derivedDays: NaN, deltaDays: NaN, agreesWithinOneDay: null, note: 'Moon absent from canonical model.' },
      derivation: 'Not derived: the canonical model carries no Moon position.',
      contentType: 'NOT_CALCULATED',
      evidenceIds: [],
    };
  }

  const lon = ((moon.longitudeDeg % 360) + 360) % 360;
  const nakIndex = Math.floor(lon / NAKSHATRA_SPAN);
  const progressed = lon % NAKSHATRA_SPAN;
  const fractionRemaining = 1 - progressed / NAKSHATRA_SPAN;
  const lord = (DASHA_LORDS as { name: string; years: number }[])[nakIndex % 9];
  const years = lord.years * fractionRemaining;
  const derivedDays = years * DAYS_PER_YEAR;

  const first = canonical.dashas.mahadashas[0];
  let engineDays: number | null = null;
  if (first) {
    const a = Date.parse(`${first.startDate}T00:00:00Z`);
    const b = Date.parse(`${first.endDate}T00:00:00Z`);
    if (!Number.isNaN(a) && !Number.isNaN(b)) engineDays = (b - a) / 86_400_000;
  }
  const agrees = engineDays === null ? null : Math.abs(engineDays - derivedDays) <= 1;

  return {
    status: 'CALCULATED',
    lord: lord.name,
    years,
    ymd: yearsToYmd(years),
    days: derivedDays,
    nakshatraFractionRemaining: fractionRemaining,
    moonLongitudeDeg: lon,
    nakshatraIndex: nakIndex,
    crossCheck: {
      engineFirstMahadashaDays: engineDays,
      derivedDays,
      deltaDays: engineDays === null ? NaN : engineDays - derivedDays,
      agreesWithinOneDay: agrees,
      note: agrees === null
        ? 'The canonical model carries no first mahadasha to compare against.'
        : agrees
          ? 'The derived balance matches the first mahadasha the dasha engine emitted, to within one calendar day (the engine reports dates, not instants).'
          : 'The derived balance does NOT match the first mahadasha emitted by the dasha engine. This is reported rather than reconciled.',
    },
    derivation:
      `Moon sidereal longitude ${lon.toFixed(6)}° falls in nakshatra ${nakIndex + 1} of 27 ` +
      `(span ${NAKSHATRA_SPAN.toFixed(6)}°); ${(progressed).toFixed(6)}° elapsed, ` +
      `${(fractionRemaining * 100).toFixed(4)}% remaining; ${lord.name} mahadasha of ${lord.years} years ` +
      `× ${(fractionRemaining).toFixed(8)} = ${years.toFixed(6)} years.`,
    contentType: 'DERIVED_JYOTISH_FACT',
    evidenceIds: [FACT.planetLongitude('Moon'), FACT.planetNakshatra('Moon'), FACT.planetPada('Moon')],
  };
}

/* ------------------------------------------------------------------ */
/* Activation profile                                                  */
/* ------------------------------------------------------------------ */

export type DashaLevel = 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';

export interface ActivationProfile {
  level: DashaLevel;
  lord: string;
  status: CapabilityStatus;
  /** Everything below is empty when status !== 'CALCULATED'. */
  natalHouse?: number;
  natalSign?: string;
  rulesHouses?: number[];
  dignity?: string;
  nakshatra?: string;
  pada?: number;
  conjunctions?: string[];
  aspectsGivenTo?: number[];
  aspectsReceivedFrom?: string[];
  yogaParticipation?: { yogaId: string; name: string; status: string }[];
  d9Sign?: string;
  d10Sign?: { status: CapabilityStatus; value?: string; reason?: string };
  vargottama?: boolean;
  functionalStatement?: string;
  contentType: ContentType;
  system: JyotishSystem;
  evidenceIds: string[];
  notCalculatedReason?: string;
}

export interface DashaActivation {
  engineVersion: string;
  balanceAtBirth: VimshottariBalance;
  current: {
    mahadasha: string;
    antardasha: string;
    pratyantardasha: string;
    startDate: string;
    endDate: string;
  };
  /** Next mahadasha boundary after the current one. */
  nextTransition: { lord: string; onDate: string } | null;
  profiles: ActivationProfile[];
  /** Themes shared by two or more active lords, stated as bhava overlaps. */
  overlappingThemes: { houses: number[]; lords: string[]; statement: string; evidenceIds: string[] }[];
  timingNote: string;
}

function profileFor(
  level: DashaLevel,
  lord: string,
  canonical: KundliCanonicalModel,
  conditions: GrahaConditionResult,
): ActivationProfile {
  const c: GrahaCondition | undefined = conditions.conditions.find((x) => x.graha === lord);
  if (!lord) {
    return {
      level, lord: '', status: 'NOT_CALCULATED',
      contentType: 'NOT_CALCULATED', system: 'PARASHARI', evidenceIds: [],
      notCalculatedReason: 'The canonical dasha record does not name a lord at this level.',
    };
  }
  if (!c) {
    return {
      level, lord, status: 'NOT_CALCULATED',
      contentType: 'NOT_CALCULATED', system: 'PARASHARI', evidenceIds: [],
      notCalculatedReason: `${lord} has no graha condition in the canonical model.`,
    };
  }

  const yogaParticipation = canonical.yogas
    .filter((y) => y.inputs.planets.includes(lord))
    .map((y) => ({ yogaId: y.id, name: y.name, status: y.status }));

  const d10 = canonical.divisionalCharts.find((x) => x.division === 10);
  const d10Placement = d10?.planets.find((x) => x.id === lord);

  return {
    level,
    lord,
    status: 'CALCULATED',
    natalHouse: c.house,
    natalSign: c.signName,
    rulesHouses: c.functionalLordship.ruledHouses,
    dignity: c.dignity.category,
    nakshatra: c.nakshatra,
    pada: c.pada,
    conjunctions: c.conjunctions.map((x) => x.with),
    aspectsGivenTo: c.aspectsGiven.map((a) => a.toHouse),
    aspectsReceivedFrom: c.aspectsReceived.map((a) => a.from),
    yogaParticipation,
    d9Sign: c.vargottama.d9Sign,
    d10Sign: d10Placement
      ? {
          status: 'VALIDATION_PENDING',
          value: d10Placement.sign,
          reason: 'D10 is computed but has not been promoted to VERIFIED_FOR_REPORT; it is shown for reference and used in no conclusion.',
        }
      : { status: 'NOT_CALCULATED', reason: 'No D10 placement for this graha in the canonical model.' },
    vargottama: c.vargottama.value,
    functionalStatement: c.functionalLordship.functionalStatement,
    contentType: 'DERIVED_JYOTISH_FACT',
    system: 'PARASHARI',
    evidenceIds: [
      FACT.planetHouse(lord), FACT.planetSignId(lord), FACT.planetDignity(lord),
      FACT.planetNakshatra(lord),
      level === 'MAHADASHA' ? FACT.currentMahadasha
        : level === 'ANTARDASHA' ? FACT.currentAntardasha
        : FACT.currentPratyantardasha,
    ],
  };
}

export function buildDashaActivation(
  canonical: KundliCanonicalModel,
  conditions: GrahaConditionResult,
): DashaActivation {
  const cur = canonical.dashas.current;
  const profiles: ActivationProfile[] = [
    profileFor('MAHADASHA', cur.mahadasha, canonical, conditions),
    profileFor('ANTARDASHA', cur.antardasha, canonical, conditions),
    profileFor('PRATYANTARDASHA', cur.pratyantardasha, canonical, conditions),
  ];

  const currentIndex = canonical.dashas.mahadashas.findIndex((m) => m.isCurrent);
  const next = currentIndex >= 0 && currentIndex + 1 < canonical.dashas.mahadashas.length
    ? canonical.dashas.mahadashas[currentIndex + 1]
    : null;

  // Overlapping themes: bhavas that two or more active lords touch, either by
  // occupation, ownership or full drishti. Stated as an overlap of structures,
  // never as an outcome.
  const touched = new Map<number, Set<string>>();
  for (const p of profiles) {
    if (p.status !== 'CALCULATED') continue;
    const houses = new Set<number>();
    if (p.natalHouse) houses.add(p.natalHouse);
    for (const h of p.rulesHouses ?? []) houses.add(h);
    for (const h of p.aspectsGivenTo ?? []) houses.add(h);
    for (const h of houses) {
      touched.set(h, (touched.get(h) ?? new Set()).add(p.lord));
    }
  }
  const overlappingThemes = [...touched.entries()]
    .filter(([, lords]) => lords.size >= 2)
    .map(([house, lords]) => ({
      houses: [house],
      lords: [...lords],
      statement: `Bhava ${house} is touched by ${[...lords].join(' and ')} — by occupation, ownership or full drishti — in the running period.`,
      evidenceIds: [FACT.houseSignId(house), ...[...lords].map((l) => FACT.planetHouse(l))],
    }))
    .sort((a, b) => a.houses[0] - b.houses[0]);

  return {
    engineVersion: DASHA_ACTIVATION_VERSION,
    balanceAtBirth: computeVimshottariBalance(canonical),
    current: cur,
    nextTransition: next ? { lord: next.planet, onDate: next.startDate } : null,
    profiles,
    overlappingThemes,
    timingNote:
      'A dasha states WHEN a part of the chart becomes prominent. It does not name the events that follow. ' +
      'The structures listed here are the ones the running lords touch; the outcome is not calculated and is not predicted.',
  };
}

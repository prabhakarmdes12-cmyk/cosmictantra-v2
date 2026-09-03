/**
 * RUNTIME CONSISTENCY GATE
 *
 * A mandatory pipeline gate. Two stages:
 *
 *   checkCanonicalConsistency()  — after canonical-model creation (GATE 2b)
 *   checkReportConsistency()     — after the report model is built, before
 *                                  anything is rendered (GATE 3b)
 *
 * A CRITICAL finding fails the pipeline closed: no PDF, pdfBuffer null, no
 * READY_FOR_DELIVERY, a stable named error code, and both conflicting paths
 * identified.
 *
 * Sensitive-data rule: personal fields (name, place) are never emitted. They
 * are compared and reported as short SHA-256 prefixes. Astronomical numbers
 * (longitudes, signs, degrees, dates) are not personal and are shown, because
 * a contradiction that cannot be read is a contradiction that cannot be fixed.
 */

import { sha256Hex } from '../granth/checksum';
import { computeContentHash, REPORT_MODEL_VERSION } from './reportModel';
import { buildScholarSummary, scanBannedLanguage } from './scholarSummary';
import { scanPredictiveLanguage } from './reportLanguage';
import { PLANET_ABBREVIATIONS } from './chartModel';
import { YOGA_SOURCE_REGISTRY_VERSION } from '../jyotish/yogaSourceRegistry';
import type { KundliErrorCode } from './errors';
import type {
  DashaPeriodInfo,
  KundliCanonicalModel,
  KundliReportModel,
  PlanetPosition,
} from './types';

export const CONSISTENCY_GATE_VERSION = 'consistency-gate-v1';

/** Stable error code emitted for any critical contradiction. */
export const KUNDLI_CONSISTENCY_FAILED: KundliErrorCode = 'KUNDLI_CONSISTENCY_FAILED';
export const KUNDLI_CHART_INVALID: KundliErrorCode = 'KUNDLI_CHART_INVALID';
export const KUNDLI_SUMMARY_INVALID: KundliErrorCode = 'KUNDLI_SUMMARY_INVALID';

export type ConsistencySeverity = 'CRITICAL' | 'WARNING';

export interface ConsistencyFinding {
  /** Stable category code, e.g. CG_ASCENDANT_SIGN. */
  code: string;
  severity: ConsistencySeverity;
  /** Both sides of the contradiction. */
  pathA: string;
  valueA: string;
  pathB: string;
  valueB: string;
  message: string;
}

export interface ConsistencyReport {
  ok: boolean;
  gateVersion: string;
  checked: number;
  findings: ConsistencyFinding[];
  /** Names of the checks that ran, for the evidence record. */
  checks: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Only genuinely personal fields are masked. Sign and nakshatra names end in
 * "name" too — masking those would hide the contradiction the gate exists to
 * surface, so they stay readable.
 */
const PERSONAL = /(locationName|place|city|subject\.name|context\.name|profile\.name)/i;

/** Masks personal values; leaves astronomical numbers readable. */
function display(path: string, value: unknown): string {
  if (value === undefined || value === null) return '‹missing›';
  if (value === '') return '‹empty›';
  const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (PERSONAL.test(path)) return `sha256:${sha256Hex(raw).slice(0, 10)}`;
  return raw.length > 60 ? `${raw.slice(0, 57)}…` : raw;
}

const norm = (deg: number): number => ((deg % 360) + 360) % 360;

/** Sidereal sign index (1..12) of a longitude. */
export function signOfLongitude(longitudeDeg: number): number {
  return Math.floor(norm(longitudeDeg) / 30) + 1;
}

/** Nakshatra index (0..26) of a longitude. */
export function nakshatraIndexOfLongitude(longitudeDeg: number): number {
  return Math.floor(norm(longitudeDeg) / (360 / 27));
}

/** Pada (1..4) of a longitude. */
export function padaOfLongitude(longitudeDeg: number): number {
  const span = 360 / 27;
  return Math.floor((norm(longitudeDeg) % span) / (span / 4)) + 1;
}

/**
 * Classical navamsha (D9) sign index (1..12) from a rashi index (0..11) and a
 * degree within that rashi.
 *
 * The base offsets below are NOT taken from model memory. They are the
 * convention the engine already uses, independently confirmed by
 * tests/fixtures/external/astrosage-prabhakar-1989.json, where the engine's D9
 * placements match an external AstroSage report for 9 of 9 grahas. An
 * alternative "movable/fixed/dual = Aries/Capricorn/Libra" reading matches
 * only 5 of 9 and is wrong. See docs/scholar-kundli/RUNTIME-CONSISTENCY-GATE.md.
 */
export function navamshaSignOf(rashiIndex0: number, degreeInSign: number): number {
  const ninth = Math.floor(degreeInSign / (30 / 9)); // 0..8
  const baseOffsets = [0, 9, 6, 3];                  // Aries, Capricorn, Libra, Cancer
  const base = baseOffsets[((rashiIndex0 % 4) + 4) % 4];
  return ((base + ninth) % 12) + 1;
}

/** '10:30:00' and '10:30' are the same birth time. */
const normalizeTime = (t: unknown): string => {
  if (typeof t !== 'string') return String(t);
  const m = t.trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : t;
};

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?$/;
const ABSOLUTE_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})$/;

/**
 * Parses a LOCAL WALL-CLOCK value as a wall-clock tuple, never as an instant.
 *
 * '1995-06-15T10:30:00' carries no zone. Handing it to Date.parse() makes it
 * an instant in whatever zone the host happens to run in, so the same input
 * yields 10:30Z on a UTC server, 05:00Z on an Asia/Kolkata server and 14:30Z
 * on an America/New_York server. That is exactly the bug an earlier version
 * of this gate shipped: it reported a false CG_UTC_CONVERSION contradiction
 * for every Indian birth when the process ran under Asia/Kolkata.
 *
 * The components are read explicitly and reassembled with Date.UTC, which is
 * host-independent. A value that rolls over (31 February, hour 25) is
 * rejected rather than silently normalised.
 */
export function parseWallClockToUtcEpoch(localDateTime: string | undefined | null): number | null {
  if (typeof localDateTime !== 'string') return null;
  const m = WALL_CLOCK.exec(localDateTime.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = m[4] === undefined ? 0 : Number(m[4]);
  const minute = m[5] === undefined ? 0 : Number(m[5]);
  const second = m[6] === undefined ? 0 : Number(m[6]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;

  const epoch = Date.UTC(year, month - 1, day, hour, minute, second);
  // Date.UTC silently rolls invalid dates forward (1995-02-30 becomes March
  // 2nd). Round-tripping catches that, so a bad date fails honestly.
  const check = new Date(epoch);
  if (
    check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day || check.getUTCHours() !== hour ||
    check.getUTCMinutes() !== minute || check.getUTCSeconds() !== second
  ) return null;
  return epoch;
}

/**
 * Parses an ABSOLUTE instant. A timestamp with a time component but no zone
 * is rejected: it is ambiguous, and guessing is what caused the original bug.
 * A date-only value (YYYY-MM-DD) is UTC by the ECMAScript specification.
 */
export function parseAbsoluteInstant(value: string | undefined | null): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const m = ABSOLUTE_INSTANT.exec(trimmed);
  if (m) {
    const dateOnly = m[4] === undefined;
    const epoch = dateOnly
      ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      : Date.parse(
          `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}${m[7] === 'Z' ? 'Z' : m[7]}`,
        );
    if (!Number.isFinite(epoch)) return null;
    return epoch;
  }
  // Date-only without a time component is unambiguously UTC per ECMA-262.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, mo, d] = trimmed.split('-').map(Number);
    const epoch = Date.UTC(y, mo - 1, d);
    const check = new Date(epoch);
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
    return epoch;
  }
  return null;
}

class Checker {
  findings: ConsistencyFinding[] = [];
  checks: string[] = [];
  checked = 0;

  constructor(private stage: string) {}

  /** Compares two values; records a CRITICAL finding when they disagree. */
  eq(code: string, pathA: string, a: unknown, pathB: string, b: unknown, note = '') {
    this.checked++;
    this.checks.push(`${this.stage}.${code}`);
    const same = typeof a === 'number' && typeof b === 'number'
      ? Math.abs(a - b) < 1e-9
      : String(a) === String(b);
    if (!same) {
      this.findings.push({
        code,
        severity: 'CRITICAL',
        pathA,
        valueA: display(pathA, a),
        pathB,
        valueB: display(pathB, b),
        message: note || `${code}: ${pathA} disagrees with ${pathB}`,
      });
    }
  }

  /** Asserts a predicate; records a CRITICAL finding when it fails. */
  assert(code: string, condition: boolean, path: string, value: unknown, message: string) {
    this.checked++;
    this.checks.push(`${this.stage}.${code}`);
    if (!condition) {
      this.findings.push({
        code,
        severity: 'CRITICAL',
        pathA: path,
        valueA: display(path, value),
        pathB: path,
        valueB: display(path, value),
        message,
      });
    }
  }

  report(): ConsistencyReport {
    return {
      ok: this.findings.every((f) => f.severity !== 'CRITICAL'),
      gateVersion: CONSISTENCY_GATE_VERSION,
      checked: this.checked,
      findings: this.findings,
      checks: [...new Set(this.checks)],
    };
  }
}

/* ------------------------------------------------------------------ */
/* Stage 1 — canonical model                                           */
/* ------------------------------------------------------------------ */

export interface CanonicalConsistencyInput {
  canonical: KundliCanonicalModel;
  /** Raw engine snapshot, for cross-checks against the adapter output. */
  snapshot?: any;
  /** Caller-supplied profile, when it is a surface distinct from canonical.subject. */
  profile?: { name?: string; birthDate?: string; birthTime?: string };
  /** Rahu–Ketu opposition tolerance in degrees. */
  nodeToleranceDeg?: number;
}

export function checkCanonicalConsistency(input: CanonicalConsistencyInput): ConsistencyReport {
  const { canonical: m, snapshot } = input;
  const nodeTolerance = input.nodeToleranceDeg ?? 0.5;
  const c = new Checker('canonical');

  /* --- subject identity ------------------------------------------- */
  // `snapshot.context` is what the engine was actually asked to calculate.
  // It is the independent surface: if the report model says anything else,
  // the reader is being shown a chart for someone else's birth data.
  const profile = m.subject as any;
  const ctx = snapshot?.context ?? {};
  if (input.profile) {
    c.eq('CG_SUBJECT_NAME', 'profile.name', input.profile.name, 'canonical.subject.name', m.subject?.name);
    c.eq('CG_BIRTH_DATE', 'profile.birthDate', input.profile.birthDate, 'canonical.subject.birthDate', m.subject?.birthDate);
    c.eq('CG_BIRTH_TIME', 'profile.birthTime', normalizeTime(input.profile.birthTime), 'canonical.subject.birthTime', normalizeTime(m.subject?.birthTime));
  }
  if (ctx.birthDate !== undefined) {
    c.eq('CG_BIRTH_DATE', 'snapshot.context.birthDate', ctx.birthDate, 'canonical.subject.birthDate', m.subject?.birthDate);
  }
  if (ctx.birthTime !== undefined) {
    c.eq('CG_BIRTH_TIME', 'snapshot.context.birthTime', normalizeTime(ctx.birthTime), 'canonical.subject.birthTime', normalizeTime(m.subject?.birthTime));
  }
  if (ctx.name !== undefined && ctx.name !== null) {
    c.eq('CG_SUBJECT_NAME', 'snapshot.context.name', ctx.name, 'canonical.subject.name', m.subject?.name);
  }

  /* --- time ------------------------------------------------------- */
  const tz = profile?.timezone ?? {};
  c.eq('CG_LOCAL_DATETIME', 'profile.timezone.localDateTime', tz.localDateTime, 'calculationMetadata.localDateTime', m.calculationMetadata.localDateTime);
  c.eq('CG_UTC_DATETIME', 'profile.timezone.utcDateTime', tz.utcDateTime, 'calculationMetadata.utcDateTime', m.calculationMetadata.utcDateTime);

  // Local and UTC must actually differ by the declared offset.
  //
  // localDateTime is a WALL-CLOCK value: it is compared as a tuple rebuilt
  // with Date.UTC, never through Date.parse, so the result does not depend on
  // the timezone of the machine running the gate.
  const wallMs = parseWallClockToUtcEpoch(m.calculationMetadata.localDateTime);
  const utcMs = parseAbsoluteInstant(m.calculationMetadata.utcDateTime);
  const offsetHours = typeof tz.utcOffsetAtBirth === 'number' ? tz.utcOffsetAtBirth : NaN;

  if (wallMs === null) {
    c.assert(
      'CG_UTC_CONVERSION',
      false,
      'calculationMetadata.localDateTime',
      m.calculationMetadata.localDateTime,
      'local birth time is not a valid wall-clock value, so the conversion cannot be verified',
    );
  } else if (utcMs === null) {
    c.assert(
      'CG_UTC_CONVERSION',
      false,
      'calculationMetadata.utcDateTime',
      m.calculationMetadata.utcDateTime,
      'UTC birth instant is not an absolute timestamp (a time without a zone is ambiguous), so the conversion cannot be verified',
    );
  } else if (!Number.isFinite(offsetHours)) {
    c.assert('CG_UTC_CONVERSION', false, 'subject.timezone.utcOffsetAtBirth', tz.utcOffsetAtBirth, 'no historical UTC offset was recorded, so the conversion cannot be verified');
  } else {
    const deltaMinutes = (wallMs - utcMs) / 60000;
    // One minute of tolerance absorbs offsets given to the second (LMT values
    // such as +05:53:20) without hiding a genuinely wrong conversion.
    c.assert(
      'CG_UTC_CONVERSION',
      Math.abs(deltaMinutes - offsetHours * 60) <= 1,
      'calculationMetadata.localDateTime-utcDateTime',
      `${deltaMinutes.toFixed(2)} min`,
      `local wall clock minus UTC is ${deltaMinutes.toFixed(2)} min but the declared historical offset is ${(offsetHours * 60).toFixed(2)} min`,
    );
  }

  c.assert(
    'CG_TZ_PROVENANCE',
    !!tz.offsetProvenance && ['IANA_HISTORICAL', 'USER_SUPPLIED', 'ESTIMATED', 'REGION_INFERRED'].includes(String(tz.offsetProvenance)),
    'subject.timezone.offsetProvenance',
    tz.offsetProvenance,
    'timezone offset provenance is missing or unrecognised',
  );
  c.assert('CG_TZ_PROVENANCE', !!tz.timezoneId, 'subject.timezone.timezoneId', tz.timezoneId, 'timezone identifier is missing');

  /* --- coordinates ------------------------------------------------- */
  const coords = m.subject?.coordinates ?? ({} as any);
  c.assert('CG_COORDINATES', Number.isFinite(coords.latitude) && Math.abs(coords.latitude) <= 90, 'subject.coordinates.latitude', coords.latitude, 'latitude missing or out of range');
  c.assert('CG_COORDINATES', Number.isFinite(coords.longitude) && Math.abs(coords.longitude) <= 180, 'subject.coordinates.longitude', coords.longitude, 'longitude missing or out of range');
  c.assert('CG_COORDINATES', ['MANUAL', 'GEOCODE', 'CITY_TABLE', 'DEVICE', 'FALLBACK'].includes(String(coords.provenance)), 'subject.coordinates.provenance', coords.provenance, 'coordinate provenance is missing or unrecognised');
  if (Number.isFinite(ctx.latitude)) {
    c.eq('CG_COORDINATES', 'snapshot.context.latitude', ctx.latitude, 'subject.coordinates.latitude', coords.latitude);
  }
  if (Number.isFinite(ctx.longitude)) {
    c.eq('CG_COORDINATES', 'snapshot.context.longitude', ctx.longitude, 'subject.coordinates.longitude', coords.longitude);
  }

  /* --- ayanamsha --------------------------------------------------- */
  const meta = m.calculationMetadata ?? ({} as any);
  c.assert('CG_AYANAMSHA', Number.isFinite(meta.ayanamshaValueDegrees) && meta.ayanamshaValueDegrees > 15 && meta.ayanamshaValueDegrees < 30, 'calculationMetadata.ayanamshaValueDegrees', meta.ayanamshaValueDegrees, 'ayanamsha value missing or implausible for a sidereal calculation');
  c.assert('CG_AYANAMSHA', !!m.calculation?.ayanamshaName, 'calculation.ayanamshaName', m.calculation?.ayanamshaName, 'ayanamsha name is missing');
  // A silent substitution keeps the key but changes the label, or vice versa.
  const declaredName = AYANAMSHA_NAMES[String(m.calculation?.ayanamsha ?? '')];
  if (declaredName) {
    c.eq('CG_AYANAMSHA', 'calculation.ayanamshaName', m.calculation?.ayanamshaName, 'AYANAMSHA_NAMES[ayanamsha]', declaredName);
  }
  if (snapshot?.meta?.ayanamshaValue !== undefined) {
    c.eq('CG_AYANAMSHA', 'snapshot.meta.ayanamshaValue', snapshot.meta.ayanamshaValue, 'calculationMetadata.ayanamshaValueDegrees', meta.ayanamshaValueDegrees);
  }
  // Tropical minus sidereal must equal the ayanamsha actually applied.
  const implied = norm(m.ascendant.tropicalLongitudeDeg - m.ascendant.longitudeDeg);
  c.assert(
    'CG_AYANAMSHA',
    Math.abs(implied - meta.ayanamshaValueDegrees) < 0.01,
    'ascendant.tropicalLongitudeDeg-sidereal',
    implied.toFixed(4),
    `tropical minus sidereal ascendant is ${implied.toFixed(4)}° but the declared ayanamsha is ${meta.ayanamshaValueDegrees}°`,
  );

  /* --- ascendant ---------------------------------------------------- */
  c.assert('CG_ASCENDANT_SIGN', m.ascendant.sign?.id === signOfLongitude(m.ascendant.longitudeDeg), 'ascendant.longitudeDeg', m.ascendant.longitudeDeg.toFixed(4), `ascendant longitude implies sign ${signOfLongitude(m.ascendant.longitudeDeg)} but the model says ${m.ascendant.sign?.id}`);
  c.assert('CG_ASCENDANT_DEGREE', m.ascendant.degreeInSign >= 0 && m.ascendant.degreeInSign < 30, 'ascendant.degreeInSign', m.ascendant.degreeInSign, 'ascendant degree-in-sign out of range');
  const house1 = m.houses.find((h) => h.number === 1);
  c.eq('CG_ASCENDANT_SIGN', 'ascendant.sign.id', m.ascendant.sign?.id, 'houses[1].sign.id', house1?.sign?.id);
  if (snapshot?.lagna?.rashiName) {
    c.eq('CG_ASCENDANT_SIGN', 'snapshot.lagna.rashiName', snapshot.lagna.rashiName, 'ascendant.sign.name', m.ascendant.sign?.name);
  }

  /* --- Moon, nakshatra, pada ---------------------------------------- */
  const moon = m.planets.find((p) => p.id === 'Moon');
  if (moon) {
    c.assert('CG_MOON_SIGN', moon.sign?.id === signOfLongitude(moon.longitudeDeg), 'planets.Moon.longitudeDeg', moon.longitudeDeg.toFixed(4), `Moon longitude implies sign ${signOfLongitude(moon.longitudeDeg)} but the model says ${moon.sign?.id}`);
    const expectedPada = padaOfLongitude(moon.longitudeDeg);
    c.assert('CG_MOON_PADA', moon.nakshatra?.pada === expectedPada, 'planets.Moon.nakshatra.pada', moon.nakshatra?.pada, `Moon longitude implies pada ${expectedPada} but the model says ${moon.nakshatra?.pada}`);
    const nakIndex = nakshatraIndexOfLongitude(moon.longitudeDeg);
    c.assert('CG_MOON_NAKSHATRA', typeof moon.nakshatra?.name === 'string' && moon.nakshatra.name.length > 0, 'planets.Moon.nakshatra.name', moon.nakshatra?.name, 'Moon nakshatra is missing');
    // The Janma nakshatra in the panchanga must be the Moon's nakshatra.
    c.eq('CG_MOON_NAKSHATRA', 'planets.Moon.nakshatra.name', moon.nakshatra?.name, 'panchanga.nakshatra.name', m.panchanga?.nakshatra?.name);
    c.eq('CG_MOON_PADA', 'planets.Moon.nakshatra.pada', moon.nakshatra?.pada, 'panchanga.nakshatra.pada', m.panchanga?.nakshatra?.pada);
    if (snapshot?.moon?.rashiName) {
      c.eq('CG_MOON_SIGN', 'snapshot.moon.rashiName', snapshot.moon.rashiName, 'planets.Moon.sign.name', moon.sign?.name);
    }
    c.assert('CG_MOON_NAKSHATRA_INDEX', nakIndex >= 0 && nakIndex < 27, 'planets.Moon.longitudeDeg', nakIndex, 'Moon nakshatra index out of range');
  } else {
    c.assert('CG_MOON_SIGN', false, 'planets.Moon', null, 'Moon is missing from the canonical model');
  }

  /* --- planets: sign, longitude, house, retrograde ------------------- */
  for (const p of m.planets) {
    c.assert(`CG_PLANET_SIGN.${p.id}`, p.sign?.id === signOfLongitude(p.longitudeDeg), `planets.${p.id}.longitudeDeg`, p.longitudeDeg.toFixed(4), `${p.id} longitude implies sign ${signOfLongitude(p.longitudeDeg)} but the model says ${p.sign?.id}`);
    c.assert(`CG_PLANET_DEGREE.${p.id}`, p.degreeInSign >= 0 && p.degreeInSign < 30, `planets.${p.id}.degreeInSign`, p.degreeInSign, `${p.id} degree-in-sign out of range`);
    c.assert(`CG_PLANET_HOUSE.${p.id}`, p.house >= 1 && p.house <= 12, `planets.${p.id}.house`, p.house, `${p.id} house out of range`);

    // Whole-sign: a planet's house must carry the planet's sign.
    const house = m.houses.find((h) => h.number === p.house);
    if (house) {
      c.eq(`CG_PLANET_HOUSE.${p.id}`, `planets.${p.id}.sign.id`, p.sign?.id, `houses[${p.house}].sign.id`, house.sign?.id);
      c.assert(`CG_PLANET_HOUSE.${p.id}`, house.planets.includes(p.id), `houses[${p.house}].planets`, house.planets.join(','), `${p.id} is assigned house ${p.house} but is not listed as an occupant of it`);
    } else {
      c.assert(`CG_PLANET_HOUSE.${p.id}`, false, `houses[${p.house}]`, null, `${p.id} references a house that does not exist`);
    }

    if (snapshot?.planets) {
      const raw = (snapshot.planets as any[]).find((q: any) => q.name === p.id);
      if (raw) {
        c.eq(`CG_RETROGRADE.${p.id}`, `snapshot.planets.${p.id}.isRetrograde`, !!raw.isRetrograde, `planets.${p.id}.retrograde`, p.retrograde);
        c.eq(`CG_PLANET_SIGN.${p.id}`, `snapshot.planets.${p.id}.rashiId`, raw.rashiId ?? raw.rasiId, `planets.${p.id}.sign.id`, p.sign?.id);
      }
    }
  }

  /* --- Rahu / Ketu opposition --------------------------------------- */
  const rahu = m.planets.find((p) => p.id === 'Rahu');
  const ketu = m.planets.find((p) => p.id === 'Ketu');
  if (rahu && ketu) {
    const separation = Math.abs(norm(rahu.longitudeDeg) - norm(ketu.longitudeDeg));
    const delta = Math.abs(separation - 180);
    c.assert(
      'CG_RAHU_KETU_OPPOSITION',
      delta <= nodeTolerance,
      'planets.Rahu.longitudeDeg / planets.Ketu.longitudeDeg',
      `${rahu.longitudeDeg.toFixed(4)} / ${ketu.longitudeDeg.toFixed(4)}`,
      `Rahu–Ketu separation is ${separation.toFixed(4)}°, which differs from 180° by ${delta.toFixed(4)}° (tolerance ${nodeTolerance}°)`,
    );
  }

  /* --- house-sign sequence ------------------------------------------- */
  const sorted = [...m.houses].sort((a, b) => a.number - b.number);
  c.eq('CG_HOUSE_COUNT', 'houses.length', m.houses.length, 'expected', 12);
  for (let i = 0; i < sorted.length; i++) {
    c.eq('CG_HOUSE_SEQUENCE', `houses[${i}].number`, sorted[i].number, 'expected house number', i + 1);
    const expectedSign = ((m.ascendant.sign.id - 1 + i) % 12) + 1;
    c.eq('CG_HOUSE_SIGN_SEQUENCE', `houses[${i + 1}].sign.id`, sorted[i].sign?.id, 'expected sign (equal-sign from lagna)', expectedSign);
  }

  /* --- functional lordship ------------------------------------------- */
  for (const h of sorted) {
    const expectedLord = SIGN_LORDS[h.sign.id];
    c.eq(`CG_LORDSHIP.${h.number}`, `houses[${h.number}].sign.lord`, h.sign?.lord, 'SIGN_LORDS[sign]', expectedLord);
  }

  /* --- Dasha ---------------------------------------------------------- */
  const md = m.dashas?.mahadashas ?? [];
  c.assert('CG_DASHA_BALANCE', Number.isFinite(m.dashas?.startingBalanceYears), 'dashas.startingBalanceYears', m.dashas?.startingBalanceYears, 'dasha balance at birth is missing');
  c.assert('CG_DASHA_SEQUENCE', md.length === 9, 'dashas.mahadashas.length', md.length, `Vimshottari must have 9 mahadashas, found ${md.length}`);
  for (let i = 0; i < md.length; i++) {
    const p: DashaPeriodInfo = md[i];
    const start = parseAbsoluteInstant(p.startDate);
    const end = parseAbsoluteInstant(p.endDate);
    c.assert(
      `CG_DASHA_DATES.${p.planet}`,
      start !== null && end !== null,
      `dashas.mahadashas[${i}].dates`,
      `${p.startDate}→${p.endDate}`,
      start === null || end === null
        ? `mahadasha ${p.planet} has a date that is not an absolute instant (a time without a zone is ambiguous): ${start === null ? p.startDate : p.endDate}`
        : `mahadasha ${p.planet} has an invalid date range`,
    );
    c.assert(`CG_DASHA_DATES.${p.planet}`, start !== null && end !== null && end > start, `dashas.mahadashas[${i}]`, `${p.startDate}→${p.endDate}`, `mahadasha ${p.planet} ends before it starts`);
    if (i > 0) {
      const prevEnd = parseAbsoluteInstant(md[i - 1].endDate);
      c.assert(
        `CG_DASHA_CONTINUITY.${p.planet}`,
        prevEnd !== null && start !== null && Math.abs(prevEnd - start) <= 1000,
        `dashas.mahadashas[${i - 1}].endDate / [${i}].startDate`,
        `${md[i - 1].endDate} → ${p.startDate}`,
        prevEnd !== null && start !== null
          ? `dasha timeline has a gap or overlap of ${((start - prevEnd) / 86400000).toFixed(3)} days between ${md[i - 1].planet} and ${p.planet}`
          : `dasha timeline contains a date that is not an absolute instant, so continuity between ${md[i - 1].planet} and ${p.planet} cannot be verified`,
      );
    }
  }
  const current = m.dashas?.current;
  const currentMd = md.find((d) => d.planet === current?.mahadasha);
  c.assert('CG_CURRENT_DASHA', !!currentMd, 'dashas.current.mahadasha', current?.mahadasha, `current mahadasha ${current?.mahadasha} is not present in the mahadasha sequence`);
  if (currentMd) {
    c.eq('CG_CURRENT_DASHA', 'dashas.current.startDate', current?.startDate, `dashas.mahadashas[${currentMd.planet}].startDate`, currentMd.startDate);
    c.eq('CG_CURRENT_DASHA', 'dashas.current.endDate', current?.endDate, `dashas.mahadashas[${currentMd.planet}].endDate`, currentMd.endDate);
  }
  const cs = parseAbsoluteInstant(current?.startDate);
  const ce = parseAbsoluteInstant(current?.endDate);
  c.assert('CG_CURRENT_DASHA', cs !== null && ce !== null, 'dashas.current.dates', `${current?.startDate}→${current?.endDate}`, 'current dasha dates are not absolute instants (a time without a zone is ambiguous)');
  c.assert('CG_CURRENT_DASHA', cs !== null && ce !== null && ce > cs, 'dashas.current', `${current?.startDate}→${current?.endDate}`, 'current dasha range is invalid');

  /* --- yogas ----------------------------------------------------------- */
  for (const y of m.yogas) {
    const statuses = ['PRESENT', 'ABSENT', 'INDETERMINATE', 'NOT_CALCULATED'];
    c.assert(`CG_YOGA_STATUS.${y.id}`, statuses.includes(y.status), `yogas.${y.id}.status`, y.status, 'unrecognised yoga status');
    c.eq(`CG_YOGA_STATUS.${y.id}`, `yogas.${y.id}.result`, y.result, `yogas.${y.id}.status`, y.status);
    if (y.status === 'PRESENT') {
      c.assert(`CG_YOGA_CONDITIONS.${y.id}`, y.conditions.length > 0 && y.conditions.every((x) => x.satisfied === true), `yogas.${y.id}.conditions`, y.conditions.map((x) => `${x.id}=${String(x.satisfied)}`).join(','), 'PRESENT yoga must have every condition satisfied');
    }
    if (y.status === 'ABSENT') {
      c.assert(`CG_YOGA_CONDITIONS.${y.id}`, y.conditions.some((x) => x.satisfied === false), `yogas.${y.id}.conditions`, y.conditions.map((x) => `${x.id}=${String(x.satisfied)}`).join(','), 'ABSENT yoga must have at least one conclusively false condition');
    }
    if (y.status === 'INDETERMINATE') {
      c.assert(`CG_YOGA_CONDITIONS.${y.id}`, y.conditions.some((x) => x.satisfied === null) && !y.conditions.some((x) => x.satisfied === false), `yogas.${y.id}.conditions`, y.conditions.map((x) => `${x.id}=${String(x.satisfied)}`).join(','), 'INDETERMINATE yoga must have an unresolved condition and no decisive false');
    }
    if (y.status === 'NOT_CALCULATED') {
      c.assert(`CG_YOGA_REASON.${y.id}`, !!y.notCalculatedReason, `yogas.${y.id}.notCalculatedReason`, y.notCalculatedReason, 'NOT_CALCULATED yoga must state a reason');
    } else {
      c.assert(`CG_YOGA_EVIDENCE.${y.id}`, y.evidenceRefs.length > 0, `yogas.${y.id}.evidenceRefs`, y.evidenceRefs.length, 'evaluated yoga must carry evidence');
      for (const cond of y.conditions) {
        c.assert(`CG_YOGA_EVIDENCE.${y.id}`, y.evidenceRefs.includes(cond.evidence[0]), `yogas.${y.id}.evidenceRefs`, cond.id, `evidence for condition ${cond.id} is missing from evidenceRefs`);
      }
    }
    c.eq(`CG_YOGA_SOURCE.${y.id}`, `yogas.${y.id}.source.ruleId`, y.source?.ruleId, `yogas.${y.id}.id`, y.id);
  }

  /* --- doshas ----------------------------------------------------------- */
  for (const d of m.doshas) {
    if (d.id === 'manglik') {
      const mars = m.planets.find((p) => p.id === 'Mars');
      const r = d.result as any;
      if (r.present && mars) {
        c.assert('CG_DOSHA_MANGLIK', (r.causeHouses ?? []).includes(mars.house), 'doshas.manglik.causeHouses', (r.causeHouses ?? []).join(','), `manglik cause house does not include Mars in house ${mars.house}`);
      }
    }
    if (d.id === 'kalsarpa') {
      const r = d.result as any;
      c.assert('CG_DOSHA_KALSARPA', r.status === 'NOT_CALCULATED' && !!r.notCalculatedReason, 'doshas.kalsarpa.result', r.status, 'kalsarpa must be declared NOT_CALCULATED with a reason, never silently omitted');
    }
  }

  /* --- D1 / D9 placements ----------------------------------------------- */
  const d1 = m.divisionalCharts.find((x) => x.division === 1);
  if (d1) {
    c.eq('CG_D1_LAGNA', 'divisionalCharts[D1].lagnaSign', d1.lagnaSign, 'ascendant.sign.name', m.ascendant.sign?.name);
    for (const p of d1.planets) {
      const canonical: PlanetPosition | undefined = m.planets.find((q) => q.id === p.id);
      if (canonical) {
        c.eq(`CG_D1_PLACEMENT.${p.id}`, `divisionalCharts[D1].planets.${p.id}.sign`, p.sign, `planets.${p.id}.sign.name`, canonical.sign?.name);
      }
    }
  } else {
    c.assert('CG_D1_LAGNA', false, 'divisionalCharts[D1]', null, 'D1 chart is missing');
  }

  const d9 = m.divisionalCharts.find((x) => x.division === 9);
  if (d9) {
    const expectedLagna = navamshaSignOf(m.ascendant.sign.id - 1, m.ascendant.degreeInSign);
    const actualLagna = SIGN_INDEX_BY_NAME[d9.lagnaSign];
    c.assert('CG_D9_LAGNA', actualLagna === undefined || actualLagna === expectedLagna, 'divisionalCharts[D9].lagnaSign', d9.lagnaSign, `D9 lagna is ${d9.lagnaSign} but the ascendant ${m.ascendant.degreeInSign.toFixed(2)}° in sign ${m.ascendant.sign.id} gives navamsha sign ${expectedLagna}`);
    for (const p of d9.planets) {
      const canonical = m.planets.find((q) => q.id === p.id);
      if (canonical) {
        const expected = navamshaSignOf(canonical.sign.id - 1, canonical.degreeInSign);
        const actual = SIGN_INDEX_BY_NAME[p.sign];
        c.assert(`CG_D9_PLACEMENT.${p.id}`, actual === undefined || actual === expected, `divisionalCharts[D9].planets.${p.id}.sign`, p.sign, `D9 ${p.id} is ${p.sign} but ${canonical.degreeInSign.toFixed(2)}° in sign ${canonical.sign.id} gives navamsha sign ${expected}`);
      }
    }
  }

  return c.report();
}

/** Authoritative label for each configured ayanamsha key. */
export const AYANAMSHA_NAMES: Record<string, string> = {
  LAHIRI_CHITRA_PAKSHA: 'Lahiri (Chitra Paksha)',
  RAMAN: 'Raman',
  KRISHNAMURTI: 'Krishnamurti',
  YUKTESHWAR: 'Yukteshwar',
};

export const SIGN_LORDS: Record<number, string> = {
  1: 'Mars', 2: 'Venus', 3: 'Mercury', 4: 'Moon', 5: 'Sun', 6: 'Mercury',
  7: 'Venus', 8: 'Mars', 9: 'Jupiter', 10: 'Saturn', 11: 'Saturn', 12: 'Jupiter',
};

/** Sign index by the Sanskrit sign names used in the canonical model. */
export const SIGN_INDEX_BY_NAME: Record<string, number> = {
  Mesha: 1, Vrishabha: 2, Mithuna: 3, Karka: 4, Karka4: 4, Simha: 5, Kanya: 6,
  Tula: 7, Vrishchika: 8, Dhanu: 9, Makara: 10, Kumbha: 11, Meena: 12,
};

/* ------------------------------------------------------------------ */
/* Stage 2 — report model (before rendering)                           */
/* ------------------------------------------------------------------ */

/**
 * Flattens every rendered value of a section into a searchable string.
 * Used for summary-versus-table and bilingual comparisons.
 */
export function sectionText(section: any, includeTitle = true): string {
  const parts: string[] = [];
  if (includeTitle && typeof section?.title === 'string') parts.push(section.title);
  const walk = (block: any) => {
    if (!block || typeof block !== 'object') return;
    if (typeof block.text === 'string') parts.push(block.text);
    if (typeof block.label === 'string') parts.push(block.label);
    if (typeof block.value === 'string') parts.push(block.value);
    if (Array.isArray(block.rows)) for (const row of block.rows) if (Array.isArray(row)) parts.push(row.join(' '));
    if (Array.isArray(block.blocks)) for (const b of block.blocks) walk(b);
  };
  for (const b of section?.blocks ?? []) walk(b);
  return parts.join(' | ');
}

export function checkReportConsistency(
  canonical: KundliCanonicalModel,
  report: KundliReportModel,
  options: { bilingual?: boolean } = {},
): ConsistencyReport {
  const c = new Checker('report');
  const byId = (id: string) => report.sections.find((s) => s.id === id);

  /* --- summary versus detailed tables -------------------------------- */
  const summary = byId('birth-summary');
  const positions = byId('planetary-positions');
  const housePositions = byId('house-positions');
  if (summary && positions) {
    const summaryText = sectionText(summary);
    const positionText = sectionText(positions);
    // The Moon's sign named in the summary must appear in the positions table.
    const moon = canonical.planets.find((p) => p.id === 'Moon');
    if (moon) {
      c.assert('CG_SUMMARY_VS_TABLES', positionText.includes(moon.sign.name), 'report.planetary-positions', moon.sign.name, `Moon sign ${moon.sign.name} is missing from the planetary positions table`);
    }
    c.assert('CG_SUMMARY_VS_TABLES', summaryText.length > 0, 'report.birth-summary', summaryText.length, 'birth summary is empty');
  }
  if (housePositions) {
    const text = sectionText(housePositions);
    c.assert('CG_SUMMARY_VS_TABLES', text.includes(canonical.ascendant.sign.name), 'report.house-positions', canonical.ascendant.sign.name, `ascendant sign ${canonical.ascendant.sign.name} is missing from the house positions table`);
  }

  /* --- every mandatory section has content --------------------------- */
  for (const s of report.sections) {
    // Body text only: a title with no content is still an empty section.
    const text = sectionText(s, false);
    c.assert('CG_SECTION_CONTENT', text.trim().length > 0, `report.sections.${s.id}`, text.length, `section ${s.id} rendered empty`);
  }

  /* --- bilingual equivalence ------------------------------------------ */
  // Values must be identical across languages; only labels may differ.
  // A WARNING (not a block) is recorded when the two renderings are
  // byte-identical, which means Hindi labels have not been applied yet.
  if (options.bilingual) {
    c.assert('CG_BILINGUAL', report.locale === 'en' || report.locale === 'hi', 'report.locale', report.locale, 'report locale is not set');
  }

  /* --- birth-data passport --------------------------------------------- */
  const passport = byId('birth-data-passport');
  c.assert('CG_PASSPORT_PRESENT', !!passport, 'report.sections', 'birth-data-passport', 'the birth data passport is missing');
  if (passport) {
    const kv = kvOf(passport);
    // 'prefix' is for fields whose rendered value carries an explanatory
    // suffix, e.g. "UTC+5.5 (IANA_HISTORICAL)". Everything else must match
    // the canonical value exactly, including multi-word names.
    const required: [string, string | null, 'exact' | 'prefix'][] = [
      ['Name', canonical.subject.name, 'exact'],
      ['Birth date (civil)', canonical.subject.birthDate, 'exact'],
      ['Birth place', canonical.subject.locationName, 'exact'],
      ['Timezone', canonical.subject.timezone.timezoneId, 'exact'],
      ['Historical UTC offset at birth', null, 'prefix'],
      ['Daylight saving time', null, 'prefix'],
      ['Zodiac', canonical.calculation.zodiac, 'exact'],
      ['House system', canonical.calculation.houseSystem, 'exact'],
      ['Node policy', canonical.calculation.nodeMode, 'exact'],
      ['Engine version', canonical.calculation.engineVersion, 'exact'],
      ['Report model version', REPORT_MODEL_VERSION, 'exact'],
    ];
    for (const [label, expected, mode] of required) {
      const actual = kv.get(label);
      c.assert(`CG_PASSPORT.${label}`, typeof actual === 'string' && actual.trim().length > 0, `report.birth-data-passport.${label}`, actual, `passport field "${label}" is missing or blank`);
      if (expected !== null && actual !== undefined) {
        const rendered = mode === 'prefix' ? actual.split(' ')[0] : actual;
        c.eq(`CG_PASSPORT.${label}`, `canonical.${label}`, expected, `report.birth-data-passport.${label}`, rendered);
      }
    }
    // DST must be answered, or explicitly declared undetermined. Never blank.
    const dstValue = kv.get('Daylight saving time') ?? '';
    c.assert(
      'CG_PASSPORT_DST',
      dstValue.startsWith('Yes, in effect at birth') ||
        dstValue.startsWith('No, not in effect at birth') ||
        dstValue.startsWith('Undetermined'),
      'report.birth-data-passport.Daylight saving time',
      dstValue,
      'daylight saving time must be answered or explicitly declared undetermined, never blank or assumed',
    );
    const lat = kv.get('Latitude') ?? '';
    const lng = kv.get('Longitude') ?? '';
    c.eq('CG_PASSPORT_COORDINATES', 'canonical.subject.coordinates.latitude', canonical.subject.coordinates.latitude.toFixed(4), 'report.birth-data-passport.Latitude', lat.replace('°', ''));
    c.eq('CG_PASSPORT_COORDINATES', 'canonical.subject.coordinates.longitude', canonical.subject.coordinates.longitude.toFixed(4), 'report.birth-data-passport.Longitude', lng.replace('°', ''));
  }

  /* --- calculation certificate ------------------------------------------ */
  const certificate = byId('calculation-certificate');
  c.assert('CG_CERTIFICATE_PRESENT', !!certificate, 'report.sections', 'calculation-certificate', 'the calculation certificate is missing');
  if (certificate) {
    const text = sectionText(certificate);
    const kv = kvOf(certificate);

    c.eq('CG_CERTIFICATE', 'report.reportId', report.reportId, 'lineage.reportId', report.lineage?.reportId);
    c.eq('CG_CERTIFICATE', 'lineage.fingerprint', report.lineage?.fingerprint, 'canonical.subject.fingerprint', canonical.subject.fingerprint);

    // The content hash must be the hash of THIS content, not a stale one.
    const recomputed = computeContentHash(canonical, report.reportId, report.locale);
    c.eq('CG_CERTIFICATE_HASH', 'lineage.contentHash', report.lineage?.contentHash, 'recomputed content hash', recomputed);
    c.assert('CG_CERTIFICATE_HASH', text.includes(recomputed), 'report.calculation-certificate', recomputed.slice(0, 16), 'the content hash is not rendered in the certificate');

    for (const [label, expected] of [
      ['Engine version', canonical.calculation.engineVersion],
      ['Ayanamsha', canonical.calculation.ayanamshaName],
      ['House system', canonical.calculation.houseSystem],
      ['Node policy', canonical.calculation.nodeMode],
      ['Timezone provenance', canonical.subject.timezone.offsetProvenance],
      ['Coordinate provenance', canonical.subject.coordinates.provenance],
      ['Report model version', REPORT_MODEL_VERSION],
      ['Source registry version', YOGA_SOURCE_REGISTRY_VERSION],
    ] as [string, string][]) {
      const actual = kv.get(label);
      c.assert(`CG_CERTIFICATE.${label}`, typeof actual === 'string' && actual.length > 0, `report.calculation-certificate.${label}`, actual, `certificate field "${label}" is missing`);
      if (actual !== undefined) {
        c.assert(`CG_CERTIFICATE.${label}`, actual.includes(String(expected)), `report.calculation-certificate.${label}`, actual, `certificate ${label} is "${actual}" but the calculation declares "${expected}"`);
      }
    }

    // The certificate must state its own limits, not just its credentials.
    c.assert('CG_CERTIFICATE_SCOPE', /What was NOT calculated/i.test(text), 'report.calculation-certificate', 'What was NOT calculated', 'the certificate does not state what was not calculated');
    c.assert('CG_CERTIFICATE_SCOPE', /was NOT calculated|not calculated/i.test(text), 'report.calculation-certificate', 'not calculated', 'the certificate does not declare any uncalculated item');
    c.assert('CG_CERTIFICATE_SCOPE', /unverified/i.test(text), 'report.calculation-certificate', 'unverified locators', 'the certificate does not disclose unverified source locators');
    c.assert('CG_CERTIFICATE_SCOPE', /interpretive/i.test(text) && /not a guarantee/i.test(text), 'report.calculation-certificate', 'interpretive status', 'the certificate does not state that Jyotish is interpretive and not a guarantee');
    c.assert('CG_CERTIFICATE_NO_QR', !/\bQR(?:[ -]?code)?\b/i.test(text), 'report.calculation-certificate', 'QR-free certificate', 'the certificate must not contain QR-code explanation copy');
  }

  return c.report();
}

/**
 * Labels excluded when comparing one rendering against another.
 *
 *  - wall-clock timestamps: these differ between any two renderings by
 *    design, exactly as they are excluded from the content hash;
 *  - the content hash: a hex digest whose digit runs are not astronomical
 *    values. It is compared exactly, per report, by CG_CERTIFICATE_HASH.
 */
const NON_VALUE_LABELS = new Set(['Generated at', 'Calculation instant', 'Content hash']);

/** Section text with non-comparable values removed. */
function stableText(section: any): string {
  const parts: string[] = [];
  const walk = (block: any) => {
    if (!block || typeof block !== 'object') return;
    if (block.kind === 'keyValue' && NON_VALUE_LABELS.has(block.label)) return;
    if (typeof block.text === 'string') parts.push(block.text);
    if (typeof block.label === 'string') parts.push(block.label);
    if (typeof block.value === 'string') parts.push(block.value);
    if (Array.isArray(block.rows)) for (const row of block.rows) if (Array.isArray(row)) parts.push(row.join(' '));
    if (Array.isArray(block.blocks)) for (const b of block.blocks) walk(b);
  };
  for (const b of section?.blocks ?? []) walk(b);
  return parts.join(' | ');
}

/** Key-value pairs of a section, for structured (not textual) checking. */
export function kvOf(section: any): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (block: any) => {
    if (!block || typeof block !== 'object') return;
    if (block.kind === 'keyValue' && typeof block.label === 'string') {
      out.set(block.label, String(block.value ?? ''));
    }
    if (Array.isArray(block.blocks)) for (const b of block.blocks) walk(b);
  };
  for (const b of section?.blocks ?? []) walk(b);
  return out;
}

/**
 * Compares the Hindi and English renderings of the same canonical model.
 *
 * CRITICAL  — an astronomical value differs between the two languages.
 * WARNING   — the two renderings are identical, i.e. Hindi labels have not
 *             been applied. Recorded, not blocked: it is a missing feature,
 *             not a contradiction the reader could be misled by.
 */
export function checkBilingualEquivalence(
  enReport: KundliReportModel,
  hiReport: KundliReportModel,
): ConsistencyReport {
  const c = new Checker('bilingual');
  // Timestamps and digests are excluded; see NON_VALUE_LABELS.
  const tokens = (r: KundliReportModel) =>
    (r.sections.map((s) => stableText(s)).join(' | ').match(/\d+(?:\.\d+)?/g) ?? []);

  const en = tokens(enReport);
  const hi = tokens(hiReport);

  // "Are Hindi labels actually applied" is measured, not assumed: a Hindi
  // report must contain more Devanagari text than the English one, which
  // already carries a Sanskrit invocation and some Sanskrit proper nouns.
  const devanagari = (r: KundliReportModel) =>
    (r.sections.map((s) => sectionText(s)).join(' | ').match(/[\u0900-\u097F]/g) ?? []).length; // titles included
  const enDev = devanagari(enReport);
  const hiDev = devanagari(hiReport);

  if (hiDev <= enDev) {
    c.findings.push({
      code: 'CG_BILINGUAL_NOT_APPLIED',
      severity: 'WARNING',
      pathA: 'report[en].sections',
      valueA: `${en.length} numeric tokens`,
      pathB: 'report[hi].sections',
      valueB: `${hi.length} numeric tokens`,
      message: `the Hindi rendering adds no Devanagari text (${hiDev} characters versus ${enDev} in English), so Hindi labels are not being applied`,
    });
    c.checked++;
    c.checks.push('bilingual.CG_BILINGUAL_NOT_APPLIED');
  } else {
    // Hindi is applied to some sections only. That is measured and reported
    // rather than rounded up to "bilingual", so the report never implies
    // more translation than it actually carries.
    const devSections = hiReport.sections.filter(
      (s) => ((sectionText(s, true).match(/[\u0900-\u097F]/g) ?? []).length) > 0,
    ).length;
    const total = hiReport.sections.length;
    if (devSections < total) {
      const untranslated = hiReport.sections
        .filter((s) => ((sectionText(s, true).match(/[\u0900-\u097F]/g) ?? []).length) === 0)
        .map((s) => s.id);
      c.findings.push({
        code: 'CG_BILINGUAL_PARTIAL',
        severity: 'WARNING',
        pathA: 'report[hi].sections',
        valueA: `${devSections}/${total} sections carry Devanagari`,
        pathB: 'report[hi].sections',
        valueB: untranslated.join(', '),
        message: `Hindi labels are applied to ${devSections} of ${total} sections (${hiDev} Devanagari characters); the remaining ${total - devSections} are English and are not translated`,
      });
      c.checked++;
      c.checks.push('bilingual.CG_BILINGUAL_PARTIAL');
    }

    // A value present in one language and missing in the other is as serious
    // as two different values, so the counts must agree first.
    if (en.length !== hi.length) {
      c.findings.push({
        code: 'CG_BILINGUAL_VALUE',
        severity: 'CRITICAL',
        pathA: 'report[en].values',
        valueA: `${en.length} values`,
        pathB: 'report[hi].values',
        valueB: `${hi.length} values`,
        message: `the English rendering carries ${en.length} numeric values and the Hindi one ${hi.length}, so the two do not describe the same chart`,
      });
      c.checked++;
      c.checks.push('bilingual.CG_BILINGUAL_VALUE');
      return c.report();
    }
    // Same length and same values, differing only where a label differs.
    for (let i = 0; i < Math.min(en.length, hi.length); i++) {
      if (en[i] !== hi[i]) {
        c.findings.push({
          code: 'CG_BILINGUAL_VALUE',
          severity: 'CRITICAL',
          pathA: `report[en].value[${i}]`,
          valueA: en[i],
          pathB: `report[hi].value[${i}]`,
          valueB: hi[i],
          message: `value ${i} differs between the English (${en[i]}) and Hindi (${hi[i]}) renderings`,
        });
        break;
      }
    }
    c.checked++;
    c.checks.push('bilingual.CG_BILINGUAL_VALUE');
  }
  return c.report();
}


/* ------------------------------------------------------------------ */
/* Stage 3 — charts and the Scholar Summary                            */
/* ------------------------------------------------------------------ */

export interface ChartSummaryConsistencyInput {
  canonical: KundliCanonicalModel;
  /** The report as it will be delivered, in its own language. */
  report: KundliReportModel;
  /** The same chart rendered in English, for the bilingual value check. */
  enReport?: KundliReportModel;
  locale?: 'en' | 'hi';
}

/** Pulls the validated chart render model out of a delivered report section. */
function chartModelOf(report: KundliReportModel, sectionId: string): any | undefined {
  const section = report.sections.find((s) => s.id === sectionId);
  if (!section) return undefined;
  const block: any = section.blocks.find((b: any) => b.kind === 'chart');
  return block?.data;
}

const SIGN_NAME_TO_INDEX: Record<string, number> = {
  Mesha: 1, Vrishabha: 2, Mithuna: 3, Karka: 4, Karka1: 4, Simha: 5, Kanya: 6,
  Tula: 7, Vrishchika: 8, Dhanu: 9, Makara: 10, Kumbha: 11, Meena: 12,
};

const signIndex = (value: unknown): number | null => {
  if (typeof value === 'number' && value >= 1 && value <= 12) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= 12) return n;
    return SIGN_NAME_TO_INDEX[value] ?? null;
  }
  return null;
};

/**
 * Fourteen checks over the charts and the Scholar Summary.
 *
 * Every one is CRITICAL on failure: a chart that disagrees with the canonical
 * model, or a summary that disagrees with the chart, must stop delivery. A
 * drawing is indistinguishable from a correct one once it is on the page, so
 * there is no safe way to ship it and warn about it afterwards.
 */
export function checkChartAndSummaryConsistency(
  input: ChartSummaryConsistencyInput,
): ConsistencyReport {
  const { canonical, report, enReport } = input;
  const c = new Checker('charts');
  const byId = (id: string) => report.sections.find((s) => s.id === id);

  const d1: any = chartModelOf(report, 'd1-chart');
  const d9: any = chartModelOf(report, 'd9-chart');
  // The summary facts, rebuilt from the same canonical model. The gate must
  // not trust the summary's own copy of itself: it checks the summary against
  // what the canonical model says.
  const summaryFacts = buildScholarSummary(canonical, input.locale ?? 'en').facts;

  /* 1 and 2 — all twelve houses present in both charts ---------------- */
  for (const [label, model] of [['D1', d1], ['D9', d9]] as const) {
    const numbers = (model?.houses ?? []).map((h: any) => h.houseNumber).sort((a: number, b: number) => a - b);
    const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    c.eq(
      `CG_CHART_${label}_HOUSES`,
      `canonical.divisionalCharts[${label === 'D1' ? 1 : 9}].houses`,
      expected.join(','),
      `report.${label.toLowerCase()}-chart.houses`,
      numbers.join(','),
      `${label} must show all twelve houses; found ${numbers.length}`,
    );
  }

  /* 3 — D1 lagna marker agrees with the canonical ascendant ----------- */
  if (d1) {
    c.eq(
      'CG_CHART_D1_LAGNA',
      'canonical.ascendant.sign.id',
      canonical.ascendant.sign.id,
      'report.d1-chart.lagnaSignNumber',
      d1.lagnaSignNumber,
      'the D1 lagna marker does not agree with the calculated ascendant',
    );
  } else {
    c.assert('CG_CHART_D1_PRESENT', false, 'report.d1-chart', 'missing', 'the D1 chart section carries no chart model');
  }

  /* 4 — D9 lagna agrees with the canonical navamsha lagna ------------- */
  const d9Canonical = canonical.divisionalCharts.find((d) => d.division === 9);
  if (d9 && d9Canonical) {
    const expected = signIndex(d9Canonical.lagnaSign);
    c.eq(
      'CG_CHART_D9_LAGNA',
      'canonical.divisionalCharts[9].lagnaSign',
      expected,
      'report.d9-chart.lagnaSignNumber',
      d9.lagnaSignNumber,
      'the D9 lagna marker does not agree with the calculated navamsha lagna',
    );
  } else {
    c.assert('CG_CHART_D9_PRESENT', !!(d9 && d9Canonical), 'report.d9-chart', d9 ? 'canonical D9 missing' : 'missing', 'the D9 chart or its canonical source is absent');
  }

  /* 5 — D1 placements agree with the canonical planets ---------------- */
  if (d1) {
    for (const p of canonical.planets) {
      const placement = (d1.placements ?? []).find((x: any) => x.planetId === p.id);
      if (!placement) {
        c.assert('CG_CHART_D1_PLANETS', false, `report.d1-chart.placements.${p.id}`, 'absent', `${p.id} is not drawn in the D1 chart`);
        continue;
      }
      c.eq(
        'CG_CHART_D1_PLANETS',
        `canonical.planets[${p.id}].house`,
        p.house,
        `report.d1-chart.placements[${p.id}].house`,
        placement.houseNumber,
        `${p.id} is drawn in house ${placement.houseNumber} but the canonical model places it in ${p.house}`,
      );
      c.eq(
        'CG_CHART_D1_PLANETS',
        `canonical.planets[${p.id}].sign.id`,
        p.sign.id,
        `report.d1-chart.placements[${p.id}].sign`,
        placement.signNumber,
        `${p.id} is drawn in sign ${placement.signNumber} but the canonical model places it in sign ${p.sign.id}`,
      );
    }
    // Nothing extra may be drawn.
    for (const placement of d1.placements ?? []) {
      c.assert(
        'CG_CHART_D1_PLANETS',
        canonical.planets.some((p) => p.id === placement.planetId),
        `report.d1-chart.placements[${placement.planetId}]`,
        'not in the canonical model',
        `${placement.planetId} is drawn but has no canonical placement`,
      );
    }
  }

  /* 6 — D9 placements agree with the navamsha of the canonical planets  */
  if (d9) {
    for (const p of canonical.planets) {
      const expectedSign = navamshaSignOf(p.sign.id - 1, p.degreeInSign);
      const placement = (d9.placements ?? []).find((x: any) => x.planetId === p.id);
      if (!placement) {
        c.assert('CG_CHART_D9_PLANETS', false, `report.d9-chart.placements.${p.id}`, 'absent', `${p.id} is not drawn in the D9 chart`);
        continue;
      }
      c.eq(
        'CG_CHART_D9_PLANETS',
        `navamsha(canonical.planets[${p.id}])`,
        expectedSign,
        `report.d9-chart.placements[${p.id}].sign`,
        placement.signNumber,
        `${p.id} is drawn in navamsha sign ${placement.signNumber} but the canonical longitude gives ${expectedSign}`,
      );
    }
  }

  /* 7 — retrograde markers agree with the canonical retrograde flags --- */
  for (const [label, model] of [['D1', d1], ['D9', d9]] as const) {
    if (!model) continue;
    for (const p of canonical.planets) {
      const placement = (model.placements ?? []).find((x: any) => x.planetId === p.id);
      if (!placement) continue;
      c.eq(
        'CG_CHART_RETROGRADE_MARKER',
        `canonical.planets[${p.id}].retrograde`,
        p.retrograde,
        `report.${label.toLowerCase()}-chart.placements[${p.id}].retrograde`,
        placement.retrograde,
        `the ${label} retrograde marker for ${p.id} disagrees with the canonical retrograde flag`,
      );
    }
  }

  /* 8 — Rahu and Ketu are both present, exactly once, in both charts --- */
  for (const [label, model] of [['D1', d1], ['D9', d9]] as const) {
    for (const node of ['Rahu', 'Ketu']) {
      const count = (model?.placements ?? []).filter((x: any) => x.planetId === node).length;
      c.assert(
        'CG_CHART_NODES',
        count === 1,
        `report.${label.toLowerCase()}-chart.placements[${node}]`,
        `${count} drawn`,
        `${node} must appear exactly once in ${label}; ${count} found`,
      );
    }
  }

  /* 9 — the textual equivalent matches the drawing --------------------- */
  for (const [label, model, tableId] of [['D1', d1, 'd1-placement-table'], ['D9', d9, 'd9-placement-table']] as const) {
    if (!model) continue;
    const table = byId(tableId);
    const tableText = table ? sectionText(table, false) : '';
    for (const p of model.placements ?? []) {
      c.assert(
        'CG_CHART_TEXTUAL_EQUIVALENT',
        tableText.includes(p.evidenceId),
        `report.${tableId}`,
        p.evidenceId,
        `the ${label} textual table is missing the evidence id for ${p.planetId}, so the drawing and the text do not agree`,
      );
    }
    // Every drawn graha must be named in the textual equivalent.
    const textual = (model.textual ?? []).join(' | ');
    for (const p of model.placements ?? []) {
      c.assert(
        'CG_CHART_TEXTUAL_EQUIVALENT',
        textual.includes(p.evidenceId),
        `report.${label.toLowerCase()}-chart.textual`,
        p.evidenceId,
        `the ${label} textual equivalent does not mention ${p.planetId}`,
      );
    }
  }

  /* 10 — English and Hindi charts carry identical values --------------- */
  if (enReport) {
    const enD1: any = chartModelOf(enReport, 'd1-chart');
    const enD9: any = chartModelOf(enReport, 'd9-chart');
    for (const [label, a, b] of [['D1', enD1, d1], ['D9', enD9, d9]] as const) {
      if (!a || !b) continue;
      const keyOf = (m: any) => (m.placements ?? [])
        .map((p: any) => `${p.planetId}:H${p.houseNumber}:S${p.signNumber}:${p.retrograde ? 'R' : 'D'}`)
        .sort()
        .join('|');
      c.eq(
        'CG_CHART_BILINGUAL_VALUES',
        `report[en].${label.toLowerCase()}-chart.placements`,
        keyOf(a),
        `report[hi].${label.toLowerCase()}-chart.placements`,
        keyOf(b),
        `the Hindi and English ${label} charts do not place the grahas identically`,
      );
      c.eq(
        'CG_CHART_BILINGUAL_VALUES',
        `report[en].${label.toLowerCase()}-chart.lagna`,
        a.lagnaSignNumber,
        `report[hi].${label.toLowerCase()}-chart.lagna`,
        b.lagnaSignNumber,
        `the Hindi and English ${label} charts do not share a lagna`,
      );
    }
  }

  const summary1 = byId('scholar-summary-1');
  const summary2 = byId('scholar-summary-2');
  c.assert('CG_SUMMARY_PRESENT', !!summary1 && !!summary2, 'report.sections', 'scholar-summary-1 / scholar-summary-2', 'the Scholar Summary is missing');

  /* 11 — every summary fact is already stated in the detailed sections --- */
  // The check is on the value, not on the evidence id: a summary-only id can
  // never appear in a detail section, so matching on the id would prove
  // nothing. Each fact names the section that must state the same value and
  // the token it is written with there.
  if (summary1) {
    for (const block of summary1.blocks) {
      if ((block as any).kind !== 'keyValue') continue;
      const kv = block as any;
      const match = /\[([A-Z0-9\-_]+)\]\s*$/.exec(String(kv.label ?? ''));
      if (!match) continue;
      const id = match[1];
      const fact = summaryFacts.find((f) => f.id === id);
      if (!fact) continue;
      const target = byId(fact.sectionId);
      // Case-insensitive: sections write labels in title case and the summary
      // in sentence case. The comparison is about the value, not the casing.
      const targetText = (target ? sectionText(target, false) : '').toLowerCase();
      c.assert(
        'CG_SUMMARY_FACT_PRESENT',
        targetText.includes(fact.valueToken.toLowerCase()),
        `report.${fact.sectionId}`,
        fact.valueToken,
        `the summary states ${id} as "${kv.value}", but the detailed section "${fact.sectionId}" never writes "${fact.valueToken}" — the summary would be the only place this value exists`,
      );
    }
  }

  /* 12 — only PRESENT yogas are summarised ------------------------------ */
  {
    const summaryText = `${summary1 ? sectionText(summary1, false) : ''} | ${summary2 ? sectionText(summary2, false) : ''}`;
    for (const yoga of canonical.yogas) {
      const id = `YOGA-${yoga.id.toUpperCase()}`;
      const mentioned = summaryText.includes(id) || summaryText.includes(yoga.name);
      if (!mentioned) continue;
      c.assert(
        'CG_SUMMARY_YOGA_STATUS',
        yoga.status === 'PRESENT',
        `canonical.yogas[${yoga.id}].status`,
        yoga.status,
        `${yoga.name} is named in the summary but its status is ${yoga.status}; only PRESENT yogas may be summarised`,
      );
    }
  }

  /* 13 — the summary dasha matches the canonical timeline --------------- */
  if (summary1) {
    const kv = kvOf(summary1);
    // Look the lines up by their evidence id, never by their label: the label
    // is translated, and a Hindi label would make this check blind.
    const valueFor = (id: string): string => {
      for (const block of summary1.blocks) {
        if ((block as any).kind !== 'keyValue') continue;
        const b = block as any;
        if (String(b.label ?? '').includes(`[${id}]`)) return String(b.value ?? '');
      }
      return '';
    };
    const current = canonical.dashas.current;
    const mahaLine = valueFor('DASHA-MAHA-CURRENT');
    // The period is identified by its boundaries and by the graha in any
    // script it is written in: the Hindi summary names राहु where the
    // canonical model says Rahu, and that is a translation, not a
    // disagreement.
    const planetForms = (id: string): string[] => {
      const entry = (PLANET_ABBREVIATIONS as Record<string, { full: { en: string; hi: string } }>)[id];
      return entry ? [id, entry.full.en, entry.full.hi] : [id];
    };
    const namesPlanet = (line: string, id: string) => planetForms(id).some((form) => line.includes(form));
    c.assert(
      'CG_SUMMARY_DASHA_MATCH',
      namesPlanet(mahaLine, current.mahadasha) && mahaLine.includes(current.startDate) && mahaLine.includes(current.endDate),
      'canonical.dashas.current.mahadasha',
      `${current.mahadasha} ${current.startDate}..${current.endDate}`,
      mahaLine,
    );
    const currentMd = canonical.dashas.mahadashas.find((p) => p.planet === current.mahadasha);
    const currentAd = currentMd?.antardashas?.find((a) => a.planet === current.antardasha);
    const antarLine = valueFor('DASHA-ANTAR-CURRENT');
    if (currentAd) {
      c.assert(
        'CG_SUMMARY_DASHA_MATCH',
        namesPlanet(antarLine, currentAd.planet) && antarLine.includes(currentAd.startDate) && antarLine.includes(currentAd.endDate),
        'canonical.dashas.mahadashas[].antardashas[]',
        `${current.antardasha} ${currentAd.startDate}..${currentAd.endDate}`,
        antarLine,
      );
    } else {
      c.assert(
        'CG_SUMMARY_DASHA_MATCH',
        antarLine.toLowerCase().includes('not calculated'),
        'canonical.dashas.current.antardasha',
        'not dated',
        antarLine,
      );
    }
  }

  /* 14 — every evidence reference resolves to exactly one record -------- */
  // An id may be cited in several places; that is the point of having one.
  // What must never happen is one id denoting two different records, or a
  // citation to an id that denotes nothing.
  {
    const resolved = new Map<string, string>();
    const bind = (id: string, record: string) => {
      const previous = resolved.get(id);
      if (previous === undefined) { resolved.set(id, record); return; }
      if (previous !== record) {
        c.eq(
          'CG_EVIDENCE_RESOLVES',
          `evidence[${id}] (first binding)`,
          previous,
          `evidence[${id}] (second binding)`,
          record,
          `evidence id ${id} is bound to two different records, so it does not resolve to exactly one`,
        );
      }
    };

    // Chart placements and lagna carry their canonical path with them.
    for (const model of [d1, d9]) {
      for (const p of model?.placements ?? []) bind(p.evidenceId, p.sourcePath);
      if (model?.lagnaEvidenceId) {
        bind(model.lagnaEvidenceId, `canonical.divisionalCharts[${model.division}].lagnaSign`);
      }
    }
    // Summary facts and interpretations carry theirs too.
    for (const f of summaryFacts) bind(f.id, f.canonicalPath);
    for (const i of buildScholarSummary(canonical, input.locale ?? 'en').interpretations) {
      bind(i.id, i.factPath);
      bind(i.sourceEvidence, 'sourceRegistry');
    }

    // Every id cited anywhere in the report must denote something.
    const cited = new Set<string>();
    for (const section of report.sections) {
      const ids = sectionText(section, false).match(/\b(?:FACT|CHART-D1|CHART-D9|CHART|DASHA|YOGA|DOSHA|SOURCE)-[A-Za-z0-9_\-]+/g) ?? [];
      for (const id of ids) cited.add(id);
    }
    for (const id of [...cited].sort()) {
      c.assert(
        'CG_EVIDENCE_RESOLVES',
        resolved.has(id),
        `evidence[${id}]`,
        'no canonical record',
        `the report cites ${id}, which is not bound to any canonical record`,
      );
    }
  }

  /* Language safety: a summary must never promise an event. ------------ */
  {
    const parts = [summary1, summary2]
      .filter(Boolean)
      .map((s) => ({ where: s!.id, text: sectionText(s!, false) }));
    for (const finding of scanBannedLanguage(parts)) {
      c.assert(
        'CG_SUMMARY_LANGUAGE',
        false,
        `report.${finding.where}`,
        finding.phrase,
        `the summary uses the phrase "${finding.phrase}", which promises an outcome; context: …${finding.excerpt}…`,
      );
    }
    c.checked++;
    c.checks.push('charts.CG_SUMMARY_LANGUAGE');
  }

  /* Language safety, whole report. -------------------------------------
     CG_SUMMARY_LANGUAGE covers the two Scholar Summary pages. This covers
     every other section — the interpretive life-area sections and the dasha
     commentary, which is where a promise about marriage, death, disease,
     wealth or litigation would most plausibly be written by accident.

     A report that trips this is not delivered. */
  {
    const summaryIds = new Set(['scholar-summary-1', 'scholar-summary-2']);
    for (const section of report.sections) {
      if (summaryIds.has(section.id)) continue;
      const text = sectionText(section, false);
      if (!text) continue;
      for (const finding of scanPredictiveLanguage(text)) {
        c.assert(
          'CG_REPORT_PREDICTIVE_LANGUAGE',
          false,
          `report.${section.id}`,
          finding.phrase,
          `report section '${section.id}' uses ${finding.kind} construction \"${finding.phrase}\"; context: …${finding.sentence}…`,
        );
      }
    }
    c.checked++;
    c.checks.push('charts.CG_REPORT_PREDICTIVE_LANGUAGE');
  }

  return c.report();
}

/** Renders a consistency report for logs without personal values. */
export function summariseForLog(r: ConsistencyReport): Record<string, unknown> {
  return {
    gateVersion: r.gateVersion,
    ok: r.ok,
    checked: r.checked,
    critical: r.findings.filter((f) => f.severity === 'CRITICAL').length,
    codes: r.findings.map((f) => f.code),
  };
}

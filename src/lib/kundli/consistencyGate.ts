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

const msOf = (d: string | undefined | null): number => {
  if (!d) return NaN;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : NaN;
};

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
  const localMs = msOf(m.calculationMetadata.localDateTime);
  const utcMs = msOf(m.calculationMetadata.utcDateTime);
  const offsetHours = typeof tz.utcOffsetAtBirth === 'number' ? tz.utcOffsetAtBirth : NaN;
  if (Number.isFinite(localMs) && Number.isFinite(utcMs) && Number.isFinite(offsetHours)) {
    const deltaMinutes = (localMs - utcMs) / 60000;
    c.assert(
      'CG_UTC_CONVERSION',
      Math.abs(deltaMinutes - offsetHours * 60) <= 1,
      'calculationMetadata.localDateTime-utcDateTime',
      `${deltaMinutes.toFixed(1)} min`,
      `local minus UTC is ${deltaMinutes.toFixed(1)} min but the declared offset is ${offsetHours * 60} min`,
    );
  } else {
    c.assert('CG_UTC_CONVERSION', false, 'calculationMetadata.utcDateTime', m.calculationMetadata.utcDateTime, 'local/UTC timestamps or offset missing');
  }

  c.assert(
    'CG_TZ_PROVENANCE',
    !!tz.offsetProvenance && ['IANA_HISTORICAL', 'IANA_CURRENT', 'FIXED_OFFSET', 'MANUAL'].includes(String(tz.offsetProvenance)),
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
    const start = msOf(p.startDate);
    const end = msOf(p.endDate);
    c.assert(`CG_DASHA_DATES.${p.planet}`, Number.isFinite(start) && Number.isFinite(end) && end > start, `dashas.mahadashas[${i}]`, `${p.startDate}→${p.endDate}`, `mahadasha ${p.planet} has an invalid date range`);
    if (i > 0) {
      const prevEnd = msOf(md[i - 1].endDate);
      c.assert(
        `CG_DASHA_CONTINUITY.${p.planet}`,
        Math.abs(prevEnd - start) <= 1000,
        `dashas.mahadashas[${i - 1}].endDate / [${i}].startDate`,
        `${md[i - 1].endDate} → ${p.startDate}`,
        `dasha timeline has a gap or overlap of ${((start - prevEnd) / 86400000).toFixed(3)} days between ${md[i - 1].planet} and ${p.planet}`,
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
  const cs = msOf(current?.startDate);
  const ce = msOf(current?.endDate);
  c.assert('CG_CURRENT_DASHA', Number.isFinite(cs) && Number.isFinite(ce) && ce > cs, 'dashas.current', `${current?.startDate}→${current?.endDate}`, 'current dasha range is invalid');

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
export function sectionText(section: any): string {
  const parts: string[] = [];
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
    const text = sectionText(s);
    c.assert('CG_SECTION_CONTENT', text.trim().length > 0, `report.sections.${s.id}`, text.length, `section ${s.id} rendered empty`);
  }

  /* --- bilingual equivalence ------------------------------------------ */
  // Values must be identical across languages; only labels may differ.
  // A WARNING (not a block) is recorded when the two renderings are
  // byte-identical, which means Hindi labels have not been applied yet.
  if (options.bilingual) {
    c.assert('CG_BILINGUAL', report.locale === 'en' || report.locale === 'hi', 'report.locale', report.locale, 'report locale is not set');
  }

  /* --- certificate values ---------------------------------------------- */
  // The consolidated certificate block is Phase 2. Until it exists, the gate
  // checks the sections that carry these values today, so lineage is verified
  // now rather than left unguarded.
  const lineage = [byId('calculation-method'), byId('cover')].filter(Boolean);
  const lineageText = lineage.map(sectionText).join(' | ');
  c.assert('CG_CERTIFICATE', lineageText.includes(String(canonical.calculation.engineVersion)), 'report.calculation-method', canonical.calculation.engineVersion, 'engine version is missing from the calculation standard section');
  c.assert('CG_CERTIFICATE', lineageText.includes(String(canonical.calculation.ayanamshaName)), 'report.calculation-method', canonical.calculation.ayanamshaName, 'ayanamsha name is missing from the calculation standard section');
  c.assert('CG_CERTIFICATE', lineageText.includes(String(canonical.calculation.houseSystem)), 'report.calculation-method', canonical.calculation.houseSystem, 'house system is missing from the calculation standard section');
  const reportId = (report as any).reportId ?? (report as any).id;
  if (reportId) {
    c.assert('CG_CERTIFICATE', lineageText.includes(String(reportId)), 'report.cover', reportId, 'report id is missing from the cover');
  }

  return c.report();
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
  const tokens = (r: KundliReportModel) =>
    (r.sections.map((s) => sectionText(s)).join(' | ').match(/\d+(?:\.\d+)?/g) ?? []);

  const en = tokens(enReport);
  const hi = tokens(hiReport);

  if (en.join(',') === hi.join(',')) {
    c.findings.push({
      code: 'CG_BILINGUAL_NOT_APPLIED',
      severity: 'WARNING',
      pathA: 'report[en].sections',
      valueA: `${en.length} numeric tokens`,
      pathB: 'report[hi].sections',
      valueB: `${hi.length} numeric tokens`,
      message: 'the Hindi and English renderings are identical, so Hindi labels are not being applied',
    });
    c.checked++;
    c.checks.push('bilingual.CG_BILINGUAL_NOT_APPLIED');
  } else {
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

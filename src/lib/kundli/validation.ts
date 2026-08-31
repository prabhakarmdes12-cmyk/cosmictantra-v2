/**
 * Kundli pipeline — validation gates.
 *
 * GATE 1  validateBirthInput         — raw input integrity, no silent defaults.
 * GATE 2  validateCalculationModel   — canonical calculation completeness.
 * GATE 3  validateReportModel        — no empty mandatory report sections.
 *
 * A KundliError is thrown at the first violated gate. Nothing downstream
 * runs unless the gate passes.
 */

import { KundliError } from './errors';
import { KUNDLI_PIPELINE_CONFIG } from './config';
import type {
  RawBirthInput, NormalizedBirthProfile, BirthCoordinates,
  ResolvedTimezone, KundliCanonicalModel, KundliReportModel, SectionStatus,
} from './types';

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // feb handled specially

export function isValidCalendarDate(dateStr: string): boolean {
  if (!DATE_RE.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const maxDay = m === 2 ? (isLeap ? 29 : 28) : MONTH_DAYS[m - 1];
  if (d < 1 || d > maxDay) return false;
  if (y < 1800 || y > 2200) return false;
  return true;
}

export function normalizeTimeStr(timeStr: string): string {
  const m = TIME_RE.exec(timeStr.trim());
  if (!m) throw new KundliError('KUNDLI_INPUT_INVALID', 'birth time must be HH:mm(:ss)', { birthTime: timeStr });
  const [h, min] = m[0].split(':').map(Number);
  const sec = m[2] !== undefined ? Number(m[2]) : 0;
  if (h > 23 || min > 59 || sec > 59) {
    throw new KundliError('KUNDLI_INPUT_INVALID', 'birth time out of range', { birthTime: timeStr });
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function normalizeDateStr(dateStr: string): string {
  if (!isValidCalendarDate(dateStr)) {
    throw new KundliError('KUNDLI_INPUT_INVALID', 'birth date invalid', { birthDate: dateStr });
  }
  return dateStr;
}

/* ------------------------------------------------------------------ */
/* GATE 1 — raw input                                                  */
/* ------------------------------------------------------------------ */

export interface ValidateBirthInputResult {
  name: string;
  birthDate: string;
  birthTime: string;
  locationName: string;
  coordinates: BirthCoordinates;
}

export interface FallbackApproval {
  by: string;
  reason: string;
  latitude: number;
  longitude: number;
}

/**
 * Validates raw user input. Throws KUNDLI_INPUT_INVALID /
 * KUNDLI_COORDINATES_INVALID / KUNDLI_FALLBACK_NOT_APPROVED /
 * KUNDLI_TIMEZONE_INVALID. Does NOT apply silent defaults.
 */
export function validateBirthInput(raw: RawBirthInput, options?: { allowFallback?: FallbackApproval }): ValidateBirthInputResult {
  const name = (raw.name ?? '').trim();
  if (!name) {
    throw new KundliError('KUNDLI_INPUT_INVALID', 'name is required', { field: 'name' });
  }
  if (name.length > 200) {
    throw new KundliError('KUNDLI_INPUT_INVALID', 'name too long', { field: 'name' });
  }

  const birthDate = normalizeDateStr(String(raw.birthDate ?? '').trim());
  const birthTime = normalizeTimeStr(String(raw.birthTime ?? '').trim());
  const locationNameRaw = (raw.locationName ?? '').trim();

  const lat = typeof raw.latitude === 'number' && Number.isFinite(raw.latitude) ? raw.latitude : null;
  const lng = typeof raw.longitude === 'number' && Number.isFinite(raw.longitude) ? raw.longitude : null;

  if (!locationNameRaw && lat === null && lng === null) {
    throw new KundliError('KUNDLI_LOCATION_UNRESOLVED', 'birth place and coordinates are both missing', {});
  }
  const locationName = locationNameRaw || 'Birth place (coordinates)';

  const provenance = raw.coordinateProvenance ?? (lat !== null && lng !== null ? 'MANUAL' : 'FALLBACK');

  if (lat !== null && lng !== null) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new KundliError('KUNDLI_COORDINATES_INVALID', 'coordinates out of range', { latitude: lat, longitude: lng });
    }
    return {
      name, birthDate, birthTime, locationName,
      coordinates: { latitude: lat, longitude: lng, provenance },
    };
  }

  // Missing / partial coordinates
  if (provenance !== 'FALLBACK') {
    throw new KundliError('KUNDLI_COORDINATES_INVALID', 'complete coordinates are required', {
      latitude: raw.latitude, longitude: raw.longitude,
    });
  }
  if (!options?.allowFallback) {
    throw new KundliError('KUNDLI_FALLBACK_NOT_APPROVED', 'FALLBACK coordinates require explicit approval', {});
  }
  const fb = options.allowFallback;
  if (!Number.isFinite(fb.latitude) || !Number.isFinite(fb.longitude)) {
    throw new KundliError('KUNDLI_FALLBACK_NOT_APPROVED', 'approved fallback coordinates missing', {});
  }
  return {
    name, birthDate, birthTime, locationName,
    coordinates: {
      latitude: fb.latitude,
      longitude: fb.longitude,
      provenance: 'FALLBACK',
      fallbackApproved: { by: fb.by, at: new Date().toISOString(), reason: fb.reason },
    },
  };
}

/* ------------------------------------------------------------------ */
/* GATE 1b — timezone                                                  */
/* ------------------------------------------------------------------ */

export function validateResolvedTimezone(tz: ResolvedTimezone): ResolvedTimezone {
  if (!tz.timezoneId || !tz.localDateTime || !tz.utcDateTime) {
    throw new KundliError('KUNDLI_TIMEZONE_INVALID', 'timezone resolution incomplete', { tz });
  }
  if (!Number.isFinite(tz.utcOffsetAtBirth) || tz.utcOffsetAtBirth < -14 || tz.utcOffsetAtBirth > 14) {
    throw new KundliError('KUNDLI_TIMEZONE_INVALID', 'resolved offset out of range', { offset: tz.utcOffsetAtBirth });
  }
  return tz;
}

/* ------------------------------------------------------------------ */
/* GATE 2 — canonical calculation model                                */
/* ------------------------------------------------------------------ */

export function validateCalculationModel(model: KundliCanonicalModel): KundliCanonicalModel {
  const missing: string[] = [];

  if (!model.panchanga.tithi.name || !model.panchanga.nakshatra.name || !model.panchanga.yoga.name) {
    missing.push('panchanga.tithi/nakshatra/yoga');
  }

  if (!model.ascendant.sign.name) missing.push('ascendant.sign');

  const expectedPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const planetIds = model.planets.map((p) => p.id);
  for (const id of expectedPlanets) {
    if (!planetIds.includes(id)) missing.push(`planets.${id}`);
    const p = model.planets.find((x) => x.id === id);
    if (p && (!Number.isFinite(p.longitudeDeg) || !p.sign.name)) missing.push(`planets.${id}.position`);
  }
  if (model.planets.length !== 9) missing.push('planets.count');

  if (model.houses.length !== 12) missing.push('houses.count');
  for (const h of model.houses) {
    if (!h.sign.name) missing.push(`houses.${h.number}.sign`);
  }

  if (!model.dashas.current.mahadasha || !model.dashas.current.antardasha) missing.push('dashas.current');
  if (model.dashas.mahadashas.length !== 9) missing.push('dashas.mahadashas.count');
  for (const md of model.dashas.mahadashas) {
    if (!md.planet || !md.startDate || !md.endDate) missing.push(`dashas.mahadasha.${md.planet}`);
  }

  if (missing.length > 0) {
    throw new KundliError('KUNDLI_CALCULATION_INCOMPLETE', 'calculation model missing required values', { missing });
  }
  return model;
}

/** Alias kept for the invariants suite. */
export const validateCanonicalModel = validateCalculationModel;

/**
 * Full GATE-1 normalization: validates raw input and resolves geo+timezone.
 * Returns the normalized profile (fingerprint still empty — set it after
 * the calculation config is known).
 */
export function validateAndNormalizeBirthInput(
  raw: RawBirthInput,
  options?: { allowFallback?: FallbackApproval },
): { profile: NormalizedBirthProfile } {
  const validated = validateBirthInput(raw, options);
  const { resolveGeoTimezone } = requireGeoModule();
  const { profile } = resolveGeoTimezone(validated, raw);
  return { profile };
}

function requireGeoModule(): typeof import('./geoTz') {
  // local require avoids a circular import at module-eval time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./geoTz');
}

/* ------------------------------------------------------------------ */
/* GATE 3 — report model                                               */
/* ------------------------------------------------------------------ */

export const MANDATORY_REPORT_SECTIONS = [
  'birth-summary',
  'calculation-method',
  'panchanga',
  'planetary-positions',
  'vimshottari-dasha',
  'current-dasha',
  'disclaimer',
] as const;

export function validateReportModel(report: KundliReportModel): KundliReportModel {
  const byId = new Map(report.sections.map((s) => [s.id, s]));
  const emptyMandatory: string[] = [];

  for (const id of MANDATORY_REPORT_SECTIONS) {
    const sec = byId.get(id);
    if (!sec) {
      emptyMandatory.push(`${id}:missing`);
      continue;
    }
    if (sec.status !== 'READY' || sec.blocks.length === 0) {
      emptyMandatory.push(`${id}:empty`);
    }
  }

  if (emptyMandatory.length > 0) {
    throw new KundliError('KUNDLI_REPORT_INCOMPLETE', `REPORT_SECTION_EMPTY: mandatory report sections are empty: ${emptyMandatory.join(', ')}`, { emptyMandatory });
  }
  return report;
}

/* ------------------------------------------------------------------ */
/* Completeness score (INV-014)                                        */
/* ------------------------------------------------------------------ */

export interface CompletenessScore {
  total: number;
  ready: number;
  notApplicable: number;
  failed: number;
  score: number; // 0..1 (failed domains count against the score)
  allReady: boolean;
  /** Per-domain status for the canonical model (INV-014). */
  allMandatoryReady: boolean;
  domains: Record<string, SectionStatus>;
}

/** Legacy array form (kept for compatibility). */
export function computeCompletenessScoreFromStatuses(statuses: SectionStatus[]): CompletenessScore {
  const total = statuses.length;
  const ready = statuses.filter((s) => s === 'READY').length;
  const notApplicable = statuses.filter((s) => s === 'NOT_APPLICABLE').length;
  const failed = statuses.filter((s) => s === 'FAILED').length;
  const score = total === 0 ? 0 : (ready + notApplicable) / total;
  return {
    total, ready, notApplicable, failed, score, allReady: failed === 0 && total > 0,
    allMandatoryReady: failed === 0 && total > 0,
    domains: {},
  };
}

/** Completeness score over a canonical model (INV-014). */
export function computeCompletenessScore(model: KundliCanonicalModel): CompletenessScore {
  const domains: Record<string, SectionStatus> = {};
  const set = (d: string, ok: boolean) => { domains[d] = ok ? 'READY' : 'FAILED'; };

  set('input', !!model.subject.name && !!model.subject.birthDate && !!model.subject.birthTime);
  set('geo', Number.isFinite(model.subject.coordinates.latitude) && Number.isFinite(model.subject.coordinates.longitude));
  set('timezone', !!model.subject.timezone.timezoneId && Number.isFinite(model.subject.timezone.utcOffsetAtBirth));
  set('panchanga', !!model.panchanga.tithi.name && !!model.panchanga.nakshatra.name);
  set('ascendant', !!model.ascendant.sign.name);
  set('planets', model.planets.length === 9 && model.planets.every((p) => Number.isFinite(p.longitudeDeg)));
  set('houses', model.houses.length === 12 && model.houses.every((h) => !!h.sign.name));
  set('dashas', model.dashas.mahadashas.length === 9 && !!model.dashas.current.mahadasha);
  set('yogas', true);   // engine-declared list (may be empty — still valid)
  set('doshas', model.doshas.length > 0);
  set('calculation-config', !!model.calculation.ayanamsha && !!model.calculation.ephemerisProvider);

  const statuses = Object.values(domains);
  const total = statuses.length;
  const ready = statuses.filter((s) => s === 'READY').length;
  const failed = statuses.filter((s) => s === 'FAILED').length;
  const score = total === 0 ? 0 : ready / total;
  return {
    total, ready, notApplicable: 0, failed, score,
    allReady: failed === 0 && total > 0,
    allMandatoryReady: failed === 0 && total > 0,
    domains,
  };
}

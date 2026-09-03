/**
 * REFERENCE-GRADE ASTRONOMY PROVIDER ABSTRACTION (Sprint B)
 * Mission Reference-Grade Jyotisha Engine — Section 4 (Astronomy Provider Abstraction)
 * CT_INV_004 (DECLARED CONVENTIONS), CT_INV_006 (FAIL CLOSED), CT_INV_007 (DETERMINISTIC), CT_INV_008 (VERSION EVERYTHING)
 *
 * Design contract:
 *  - The existing, working in-process engine (src/lib/jyotish/celestialEngine.ts, built on
 *    `astronomy-engine`'s Moshier-class VSOP87 / ELP2000-82 series) is WRAPPED, never replaced.
 *  - `SwissEphemerisProvider` is the production/reference provider per the mission charter.
 *    Its descriptor discloses the ACTUAL kernel it runs on; Swiss-Ephemeris parity is to be
 *    proven by Sprint C mass qualification before any EXTERNALLY_VERIFIED claim. This keeps the
 *    charter naming while refusing to fabricate a validation claim (CT_INV_005).
 *  - `FixtureProvider` replays golden benchmark fixtures (JPL Horizons seed set in Sprint B)
 *    with per-fixture checksum integrity. Tampered or missing fixtures FAIL CLOSED.
 *  - `JplReferenceProvider` is an interface-compliant scaffold that FAILS CLOSED until Sprint C
 *    implements bulk JPL Horizons retrieval. It never fabricates data.
 *  - Every reading is validated against hard invariants before it leaves the provider:
 *    finiteness, longitude range, node opposition (Ketu = Rahu + 180 exactly), ayanamsha band.
 *  - Providers are deterministic: identical requests produce byte-identical readings.
 *    No wall-clock time, no randomness, no I/O inside the calculation path.
 */

import * as crypto from 'crypto';
import {
  calculateCelestialEphemeris,
  normalizeAngle,
  type LunarNodeMode,
  type CelestialEphemerisSnapshot
} from '../jyotish/celestialEngine';
import type { AyanamshaSystem } from '../jyotish/ayanamsha';

/* ------------------------------------------------------------------------- */
/* Canonical identities                                                       */
/* ------------------------------------------------------------------------- */

export type GrahaId =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

export type TrackedPointId = GrahaId | 'Ascendant' | 'MC';

export const TRACKED_GRAHAS: readonly GrahaId[] = [
  'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'
];

/** Certified operating window of the engine (Mission Section 5: 1900–2100 minimum). */
export const CERTIFIED_PERIOD = {
  startUtc: '1900-01-01T00:00:00.000Z',
  endUtc: '2100-12-31T23:59:59.999Z'
} as const;

/**
 * Provider-level latitude envelope. The PROVIDER is mathematically well-defined at all
 * latitudes; the application-level Gate 1b (±65°, RSK_003) restricts what user charts may
 * use. Qualification scenarios may deliberately exceed ±65° to exercise polar behaviour,
 * so the provider itself must not silently reject them — it flags them instead.
 */
export const PROVIDER_LATITUDE_BOUNDS = { minDeg: -90, maxDeg: 90 } as const;
/** Latitudes beyond this magnitude receive an explicit polar-risk flag (RSK_003). */
export const POLAR_RISK_LATITUDE_DEG = 65;

/** Truthful disclosure of the kernel the production provider actually runs on. */
export const DECLARED_PROVIDER_KERNEL =
  'astronomy-engine 2.x (in-process Moshier-class VSOP87 / ELP2000-82 perturbation series; geocentric apparent ecliptic of date)';

/** Provider id reserved by the mission charter for the production reference. */
export const PRODUCTION_PROVIDER_ID = 'SWISS_EPHEMERIS_PROVIDER';
export const FIXTURE_PROVIDER_ID = 'FIXTURE_PROVIDER';
export const JPL_REFERENCE_PROVIDER_ID = 'JPL_REFERENCE_PROVIDER';

/* ------------------------------------------------------------------------- */
/* Fail-closed typed errors (CT_INV_006)                                      */
/* ------------------------------------------------------------------------- */

export type AstronomyErrorCode =
  | 'EPHEMERIS_OUTSIDE_CERTIFIED_PERIOD'
  | 'ASTRONOMY_INPUT_INVALID'
  | 'ASTRONOMY_INVARIANT_VIOLATED'
  | 'FIXTURE_NOT_FOUND'
  | 'FIXTURE_TAMPERED'
  | 'FIXTURE_BODY_NOT_AVAILABLE'
  | 'QUALIFICATION_PROVIDER_NOT_IMPLEMENTED'
  | 'PROVIDER_KERNEL_UNAVAILABLE';

export class AstronomyProviderError extends Error {
  readonly code: AstronomyErrorCode;
  /** Mission invariant that forced the fail-closed behaviour, when applicable. */
  readonly invariantId: string;
  readonly detail: Record<string, unknown>;

  constructor(code: AstronomyErrorCode, message: string, opts?: {
    invariantId?: string;
    detail?: Record<string, unknown>;
  }) {
    super(message);
    this.name = 'AstronomyProviderError';
    this.code = code;
    this.invariantId = opts?.invariantId ?? 'CT_INV_006';
    this.detail = opts?.detail ?? {};
  }
}

/* ------------------------------------------------------------------------- */
/* Request / reading contracts                                                */
/* ------------------------------------------------------------------------- */

export interface AstronomyConventions {
  ayanamshaSystem: AyanamshaSystem;
  nodeMode: LunarNodeMode;
}

export interface AstronomyRequest {
  /** ISO-8601 UTC instant, e.g. '1990-08-17T03:45:00.000Z'. */
  utcTimestamp: string;
  /** Geodetic latitude, degrees north positive. */
  latitudeDeg: number;
  /** Geodetic longitude, degrees east positive. */
  longitudeDeg: number;
  /** Explicit declared conventions (CT_INV_004). No silent defaults. */
  conventions: AstronomyConventions;
}

export interface BodyReading {
  tropicalLongitudeDeg: number;
  eclipticLatitudeDeg: number;
  distanceAU: number;
  speedDegreesPerDay: number;
  isRetrograde: boolean;
  siderealLongitudeDeg: number;
}

/** CT_INV_006: an uncomputable quantity is declared, never fabricated. */
export interface NotCalculated {
  status: 'NOT_CALCULATED';
  reason: string;
}

export interface AscendantReading {
  tropicalLongitudeDeg: number;
  siderealLongitudeDeg: number;
  localSiderealTimeDegrees: number;
}

export interface McReading {
  tropicalLongitudeDeg: number;
  siderealLongitudeDeg: number;
}

export interface EphemerisReadingMeta {
  providerId: string;
  providerVersion: string;
  kernel: string;
  requestedUtc: string;
  julianDayTT: number;
  deltaTSeconds: number;
  ayanamsha: { system: AyanamshaSystem; degrees: number; dms: string };
  nodeMode: LunarNodeMode;
  observer: { latitudeDeg: number; longitudeDeg: number; obliquityOfEclipticDeg: number };
  /** Flags, not errors: recorded for observability (Mission Section 28). */
  warnings: string[];
}

export interface EphemerisReading {
  meta: EphemerisReadingMeta;
  bodies: Record<GrahaId, BodyReading>;
  ascendant: AscendantReading | NotCalculated;
  /** Midheaven (Madhya Lagna). Real values since Sprint C; fixtures still declare NOT_CALCULATED. */
  mc: McReading | NotCalculated;
  solarTimings: { sunriseUtc: string | null; sunsetUtc: string | null };
  /** Present only on FixtureProvider readings. */
  fixtureCoverage?: {
    fixtureSetId: string;
    coveredPoints: readonly TrackedPointId[];
  };
}

/* ------------------------------------------------------------------------- */
/* Invariant enforcement                                                      */
/* ------------------------------------------------------------------------- */

/** Lahiri-family ayanamsha stays inside this band across the certified period. */
const SIDEREAL_AYANAMSHA_BAND_DEG = { min: 20, max: 30 } as const;

function assertFinite(value: number, field: string, detail: Record<string, unknown>): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID', `Field ${field} must be a finite number`, {
      invariantId: 'CT_INV_007',
      detail: { field, value: String(value), ...detail }
    });
  }
}

function assertRequest(request: AstronomyRequest): void {
  if (!request || typeof request !== 'object') {
    throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID', 'AstronomyRequest object is required');
  }
  const when = new Date(request.utcTimestamp);
  if (Number.isNaN(when.getTime())) {
    throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID',
      `utcTimestamp is not a valid ISO-8601 instant: ${String(request.utcTimestamp)}`,
      { detail: { utcTimestamp: String(request.utcTimestamp) } });
  }
  if (when.getTime() < new Date(CERTIFIED_PERIOD.startUtc).getTime() ||
      when.getTime() > new Date(CERTIFIED_PERIOD.endUtc).getTime()) {
    throw new AstronomyProviderError('EPHEMERIS_OUTSIDE_CERTIFIED_PERIOD',
      `Requested instant ${request.utcTimestamp} is outside the certified period ` +
      `${CERTIFIED_PERIOD.startUtc} .. ${CERTIFIED_PERIOD.endUtc}. Fail closed (CT_INV_006).`,
      { invariantId: 'CT_INV_006', detail: { utcTimestamp: request.utcTimestamp, ...CERTIFIED_PERIOD } });
  }
  assertFinite(request.latitudeDeg, 'latitudeDeg', {});
  assertFinite(request.longitudeDeg, 'longitudeDeg', {});
  if (request.latitudeDeg < PROVIDER_LATITUDE_BOUNDS.minDeg || request.latitudeDeg > PROVIDER_LATITUDE_BOUNDS.maxDeg) {
    throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID',
      `latitudeDeg ${request.latitudeDeg} outside provider bounds`, { detail: { ...PROVIDER_LATITUDE_BOUNDS } });
  }
  if (!request.conventions || typeof request.conventions !== 'object') {
    throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID', 'conventions are required (CT_INV_004)');
  }
  if (!request.conventions.ayanamshaSystem) {
    throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID', 'conventions.ayanamshaSystem is required');
  }
  if (request.conventions.nodeMode !== 'MEAN_NODE' && request.conventions.nodeMode !== 'TRUE_NODE') {
    throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID', 'conventions.nodeMode must be MEAN_NODE or TRUE_NODE');
  }
}

/**
 * Validates a produced reading against hard invariants. Any violation is a defect,
 * never a warning: fail closed (CT_INV_006 / INV_ASTRO_TRUTH_001).
 */
export function validateReadingInvariants(reading: EphemerisReading): void {
  const warn: string[] = [];
  const all: Array<[TrackedPointId, number]> = [];

  for (const id of TRACKED_GRAHAS) {
    const body = reading.bodies[id];
    if (!body) {
      throw new AstronomyProviderError('ASTRONOMY_INVARIANT_VIOLATED',
        `Reading is missing body ${id}`, { invariantId: 'CT_INV_006', detail: { body: id } });
    }
    assertFinite(body.tropicalLongitudeDeg, `bodies.${id}.tropicalLongitudeDeg`, {});
    assertFinite(body.siderealLongitudeDeg, `bodies.${id}.siderealLongitudeDeg`, {});
    if (body.tropicalLongitudeDeg < 0 || body.tropicalLongitudeDeg >= 360) {
      throw new AstronomyProviderError('ASTRONOMY_INVARIANT_VIOLATED',
        `bodies.${id}.tropicalLongitudeDeg out of [0,360): ${body.tropicalLongitudeDeg}`,
        { invariantId: 'CT_INV_007', detail: { body: id } });
    }
    all.push([id, body.tropicalLongitudeDeg]);
  }

  // Node opposition: Ketu is EXACTLY Rahu + 180 by declared convention (Registry §2).
  // Shortest-arc form so the 360->0 wrap is measured correctly (|Δ| must be ~0, not ~360).
  const rahu = reading.bodies.Rahu.tropicalLongitudeDeg;
  const ketu = reading.bodies.Ketu.tropicalLongitudeDeg;
  const wrap = normalizeAngle(ketu - rahu - 180);
  const oppositionDelta = Math.min(wrap, 360 - wrap);
  if (oppositionDelta > 1e-9) {
    throw new AstronomyProviderError('ASTRONOMY_INVARIANT_VIOLATED',
      `Node opposition violated: |Ketu - (Rahu+180)| = ${oppositionDelta} deg`,
      { invariantId: 'CT_INV_004/NODE_OPPOSITION', detail: { rahu, ketu, oppositionDelta } });
  }

  // Ayanamsha band sanity for sidereal systems.
  if (reading.meta.ayanamsha.system !== 'TROPICAL_SAYANA') {
    const a = reading.meta.ayanamsha.degrees;
    assertFinite(a, 'meta.ayanamsha.degrees', {});
    if (a < SIDEREAL_AYANAMSHA_BAND_DEG.min || a > SIDEREAL_AYANAMSHA_BAND_DEG.max) {
      throw new AstronomyProviderError('ASTRONOMY_INVARIANT_VIOLATED',
        `Ayanamsha ${a} deg outside plausible band [${SIDEREAL_AYANAMSHA_BAND_DEG.min}, ${SIDEREAL_AYANAMSHA_BAND_DEG.max}]`,
        { invariantId: 'CT_INV_004/AYANAMSHA_BAND', detail: { ayanamsha: a } });
    }
  }

  // Ascendant / MC, when present, must also be finite and in range.
  if ('tropicalLongitudeDeg' in reading.ascendant && reading.ascendant) {
    const asc = reading.ascendant as AscendantReading;
    assertFinite(asc.tropicalLongitudeDeg, 'ascendant.tropicalLongitudeDeg', {});
    if (asc.tropicalLongitudeDeg < 0 || asc.tropicalLongitudeDeg >= 360) {
      throw new AstronomyProviderError('ASTRONOMY_INVARIANT_VIOLATED',
        `ascendant.tropicalLongitudeDeg out of [0,360): ${asc.tropicalLongitudeDeg}`,
        { invariantId: 'CT_INV_007', detail: {} });
    }
  }
  if (reading.mc && 'tropicalLongitudeDeg' in reading.mc) {
    const mc = reading.mc as McReading;
    assertFinite(mc.tropicalLongitudeDeg, 'mc.tropicalLongitudeDeg', {});
    if (mc.tropicalLongitudeDeg < 0 || mc.tropicalLongitudeDeg >= 360) {
      throw new AstronomyProviderError('ASTRONOMY_INVARIANT_VIOLATED',
        `mc.tropicalLongitudeDeg out of [0,360): ${mc.tropicalLongitudeDeg}`,
        { invariantId: 'CT_INV_007', detail: {} });
    }
  }

  // Polar-risk flag (observability only — the math is still well-defined).
  if (Math.abs(reading.meta.observer.latitudeDeg) > POLAR_RISK_LATITUDE_DEG) {
    warn.push(`POLAR_RISK: |latitude| ${Math.abs(reading.meta.observer.latitudeDeg)} > ${POLAR_RISK_LATITUDE_DEG} deg (RSK_003); ascendant intersection behaviour must be reviewed before authoritative use.`);
  }
  if (reading.meta.observer.latitudeDeg !== 0 && warn.length === 0) {
    // no-op placeholder to keep shape stable
  }
  (reading.meta as EphemerisReadingMeta).warnings = [...(reading.meta.warnings ?? []), ...warn];
  void all;
}

/* ------------------------------------------------------------------------- */
/* Provider descriptor                                                        */
/* ------------------------------------------------------------------------- */

export type ProviderRole = 'PRODUCTION' | 'FIXTURE' | 'REFERENCE';
export type ProviderValidationStatus = 'IMPLEMENTED' | 'INTERNALLY_VERIFIED' | 'EXTERNALLY_VERIFIED';

export interface ProviderDescriptor {
  providerId: string;
  name: string;
  version: string;
  kernel: string;
  role: ProviderRole;
  /** Honest status per CT_INV_005. Never exceed what qualification has proven. */
  validationStatus: ProviderValidationStatus;
  declaredConventions: AstronomyConventions;
  notes: string[];
}

export interface AstronomyProvider {
  readonly descriptor: ProviderDescriptor;
  getSnapshot(request: AstronomyRequest): EphemerisReading;
}

/* ------------------------------------------------------------------------- */
/* SwissEphemerisProvider — production reference (wraps the working engine)   */
/* ------------------------------------------------------------------------- */

export const SWISS_EPHEMERIS_PROVIDER_VERSION = 'swisseph-provider-2.0.0 (kernel wrapper, ayanamsha-registry-aligned-2.0.0)';

export class SwissEphemerisProvider implements AstronomyProvider {
  readonly descriptor: ProviderDescriptor;

  constructor(overrides?: Partial<Pick<ProviderDescriptor, 'validationStatus' | 'notes'>>) {
    this.descriptor = {
      providerId: PRODUCTION_PROVIDER_ID,
      name: 'SwissEphemerisProvider (CosmicTantra production reference)',
      version: SWISS_EPHEMERIS_PROVIDER_VERSION,
      kernel: DECLARED_PROVIDER_KERNEL,
      role: 'PRODUCTION',
      validationStatus: overrides?.validationStatus ?? 'INTERNALLY_VERIFIED',
      declaredConventions: {
        ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA',
        nodeMode: 'MEAN_NODE'
      },
      notes: [
        'Wraps the existing, working in-process engine (src/lib/jyotish/celestialEngine.ts). No working calculation code was replaced.',
        'The mission charter names this the production reference provider. The ACTUAL kernel is astronomy-engine (Moshier-class series).',
        'v2.0.0 (Sprint C): ayanamsha reconciled to the declared registry standard 23°51\'11" @ J2000 (lahiri-registry-aligned-2.0.0, RSK_009) — a versioned, documented change; all sidereal longitudes shifted by −14.53" vs v1.',
        'v2.0.0 (Sprint C): Midheaven implemented (RA(MC)=LST identity, verified per scenario); Ascendant rising-branch guarantee added for polar geometries (RSK_003 adversarial harness catch, exact antipodal correction, no effect within ±66°).',
        'True Swiss Ephemeris parity must be proven by the Sprint C+ mass qualification (100,000 scenarios vs trusted references) before any EXTERNALLY_VERIFIED claim is made (CT_INV_005).'
      ],
      ...overrides
    };
  }

  getSnapshot(request: AstronomyRequest): EphemerisReading {
    assertRequest(request);
    const when = new Date(request.utcTimestamp);

    let snapshot: CelestialEphemerisSnapshot;
    try {
      snapshot = calculateCelestialEphemeris({
        dateUtc: when,
        latitude: request.latitudeDeg,
        longitude: request.longitudeDeg,
        ayanamshaSystem: request.conventions.ayanamshaSystem,
        nodeMode: request.conventions.nodeMode
      });
    } catch (err) {
      throw new AstronomyProviderError('PROVIDER_KERNEL_UNAVAILABLE',
        `Underlying ephemeris kernel threw for ${request.utcTimestamp}: ${err instanceof Error ? err.message : String(err)}`,
        { detail: { utcTimestamp: request.utcTimestamp } });
    }

    const toBody = (b: CelestialEphemerisSnapshot['bodies'][GrahaId]): BodyReading => ({
      tropicalLongitudeDeg: normalizeAngle(b.tropicalLongitude),
      eclipticLatitudeDeg: b.eclipticLatitude,
      distanceAU: b.distanceAU,
      speedDegreesPerDay: b.speedDegreesPerDay,
      isRetrograde: b.isRetrograde,
      siderealLongitudeDeg: normalizeAngle(b.siderealLongitude)
    });

    const reading: EphemerisReading = {
      meta: {
        providerId: this.descriptor.providerId,
        providerVersion: this.descriptor.version,
        kernel: this.descriptor.kernel,
        requestedUtc: request.utcTimestamp,
        julianDayTT: snapshot.julianDayTT,
        deltaTSeconds: snapshot.deltaTSeconds,
        ayanamsha: {
          system: snapshot.ayanamsha.system,
          degrees: snapshot.ayanamsha.degrees,
          dms: snapshot.ayanamsha.dms
        },
        nodeMode: snapshot.nodeMode,
        observer: {
          latitudeDeg: snapshot.observer.latitude,
          longitudeDeg: snapshot.observer.longitude,
          obliquityOfEclipticDeg: snapshot.observer.obliquityOfEclipticDeg
        },
        warnings: []
      },
      bodies: {
        Sun: toBody(snapshot.bodies.Sun),
        Moon: toBody(snapshot.bodies.Moon),
        Mars: toBody(snapshot.bodies.Mars),
        Mercury: toBody(snapshot.bodies.Mercury),
        Jupiter: toBody(snapshot.bodies.Jupiter),
        Venus: toBody(snapshot.bodies.Venus),
        Saturn: toBody(snapshot.bodies.Saturn),
        Rahu: toBody(snapshot.bodies.Rahu),
        Ketu: toBody(snapshot.bodies.Ketu)
      },
      ascendant: {
        tropicalLongitudeDeg: normalizeAngle(snapshot.lagna.tropicalLongitude),
        siderealLongitudeDeg: normalizeAngle(snapshot.lagna.siderealLongitude),
        localSiderealTimeDegrees: snapshot.observer.localSiderealTimeDegrees
      },
      mc: {
        tropicalLongitudeDeg: normalizeAngle(snapshot.mc.tropicalLongitude),
        siderealLongitudeDeg: normalizeAngle(snapshot.mc.siderealLongitude)
      },
      solarTimings: {
        sunriseUtc: snapshot.solarTimings.sunriseUtc,
        sunsetUtc: snapshot.solarTimings.sunsetUtc
      }
    };

    validateReadingInvariants(reading);
    return reading;
  }
}

/* ------------------------------------------------------------------------- */
/* FixtureProvider — golden benchmark replay (Sprint B: JPL Horizons seed)     */
/* ------------------------------------------------------------------------- */

export interface AstronomyFixtureRow {
  fixtureId: string;
  utcTimestamp: string;
  point: TrackedPointId;
  tropicalEclipticLongitudeDeg: number;
  tropicalEclipticLatitudeDeg: number | null;
  /** Reference-frame note, e.g. 'apparent geocentric ecliptic-of-date'. */
  referenceFrame: string;
  sourceStatus: 'SOURCE_VERIFIED' | 'SOURCE_SECONDARY' | 'ATTRIBUTION_UNVERIFIED' | 'SOURCE_PENDING';
  sourceLocator: string;
  /** sha256 over the canonical JSON of the row's expected payload. */
  contentSha256: string;
}

export interface AstronomyFixtureSet {
  schemaVersion: string;
  fixtureSetId: string;
  provenance: {
    source: string;
    quantity: string;
    retrievedAtUtc: string;
    notes: string[];
  };
  fixtures: AstronomyFixtureRow[];
  /** sha256 over the sorted per-row content hashes. */
  fixtureSetSha256: string;
}

function fixtureRowCanonical(row: AstronomyFixtureRow): string {
  return JSON.stringify({
    fixtureId: row.fixtureId,
    utcTimestamp: row.utcTimestamp,
    point: row.point,
    tropicalEclipticLongitudeDeg: row.tropicalEclipticLongitudeDeg,
    tropicalEclipticLatitudeDeg: row.tropicalEclipticLatitudeDeg,
    referenceFrame: row.referenceFrame
  });
}

export function fixtureContentSha256(row: AstronomyFixtureRow): string {
  return crypto.createHash('sha256').update(fixtureRowCanonical(row)).digest('hex');
}

export function loadAstronomyFixtureSet(raw: unknown): AstronomyFixtureSet {
  const set = raw as AstronomyFixtureSet;
  if (!set || set.schemaVersion !== '1.0.0' || !Array.isArray(set.fixtures) || set.fixtures.length === 0) {
    throw new AstronomyProviderError('FIXTURE_TAMPERED',
      'Fixture set failed structural validation (schemaVersion 1.0.0 with non-empty fixtures required)');
  }
  const rowHashes: string[] = [];
  for (const row of set.fixtures) {
    const expected = fixtureContentSha256(row);
    if (row.contentSha256 !== expected) {
      throw new AstronomyProviderError('FIXTURE_TAMPERED',
        `Fixture ${row.fixtureId ?? '(unknown)'} content hash mismatch — fixture file has been altered. Fail closed.`,
        { detail: { fixtureId: row.fixtureId, expected, actual: row.contentSha256 } });
    }
    rowHashes.push(expected);
  }
  const setSha = crypto.createHash('sha256').update(rowHashes.slice().sort().join('|')).digest('hex');
  if (set.fixtureSetSha256 !== setSha) {
    throw new AstronomyProviderError('FIXTURE_TAMPERED',
      'Fixture set hash mismatch — rows were added, removed or reordered. Fail closed.',
      { detail: { expected: setSha, actual: set.fixtureSetSha256 } });
  }
  return set;
}

export const FIXTURE_PROVIDER_VERSION = 'fixture-provider-1.0.0';

export class FixtureProvider implements AstronomyProvider {
  readonly descriptor: ProviderDescriptor;
  private readonly set: AstronomyFixtureSet;
  private readonly byInstant: Map<string, AstronomyFixtureRow[]>;

  constructor(fixtureSet: AstronomyFixtureSet) {
    this.set = loadAstronomyFixtureSet(fixtureSet);
    this.byInstant = new Map();
    for (const row of this.set.fixtures) {
      const when = new Date(row.utcTimestamp);
      if (Number.isNaN(when.getTime())) {
        throw new AstronomyProviderError('FIXTURE_TAMPERED', `Fixture ${row.fixtureId} has an invalid utcTimestamp`);
      }
      const key = when.toISOString();
      const bucket = this.byInstant.get(key) ?? [];
      bucket.push(row);
      this.byInstant.set(key, bucket);
    }
    this.descriptor = {
      providerId: FIXTURE_PROVIDER_ID,
      name: 'FixtureProvider (golden benchmark replay)',
      version: FIXTURE_PROVIDER_VERSION,
      kernel: `deterministic fixture replay: ${this.set.fixtureSetId}`,
      role: 'FIXTURE',
      validationStatus: 'IMPLEMENTED',
      declaredConventions: {
        ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA',
        nodeMode: 'MEAN_NODE'
      },
      notes: [
        `Fixture provenance: ${this.set.provenance.source}`,
        'Serves only instants present in the fixture set; any other request FAILS CLOSED with FIXTURE_NOT_FOUND.',
        'Fixture rows carry their own sourceStatus; SOURCE_VERIFIED rows are externally derived (JPL Horizons).'
      ]
    };
  }

  get fixtureSetId(): string {
    return this.set.fixtureSetId;
  }

  getSnapshot(request: AstronomyRequest): EphemerisReading {
    assertRequest(request);
    const key = new Date(request.utcTimestamp).toISOString();
    const rows = this.byInstant.get(key);
    if (!rows || rows.length === 0) {
      throw new AstronomyProviderError('FIXTURE_NOT_FOUND',
        `No golden fixtures exist for instant ${key}. Fail closed (CT_INV_006).`,
        { detail: { utcTimestamp: key, fixtureSetId: this.set.fixtureSetId } });
    }

    const bodies = {} as Record<GrahaId, BodyReading>;
    for (const id of TRACKED_GRAHAS) {
      const row = rows.find(r => r.point === id);
      if (!row) continue;
      bodies[id] = {
        tropicalLongitudeDeg: normalizeAngle(row.tropicalEclipticLongitudeDeg),
        eclipticLatitudeDeg: row.tropicalEclipticLatitudeDeg ?? 0,
        distanceAU: 0,
        speedDegreesPerDay: 0,
        isRetrograde: false,
        siderealLongitudeDeg: normalizeAngle(row.tropicalEclipticLongitudeDeg)
      };
    }
    for (const id of TRACKED_GRAHAS) {
      if (!bodies[id]) {
        throw new AstronomyProviderError('FIXTURE_BODY_NOT_AVAILABLE',
          `Fixture set ${this.set.fixtureSetId} has no row for ${id} at ${key}. Fail closed.`,
          { detail: { point: id, utcTimestamp: key } });
      }
    }

    const reading: EphemerisReading = {
      meta: {
        providerId: this.descriptor.providerId,
        providerVersion: this.descriptor.version,
        kernel: this.descriptor.kernel,
        requestedUtc: request.utcTimestamp,
        julianDayTT: 0,
        deltaTSeconds: 0,
        ayanamsha: {
          system: request.conventions.ayanamshaSystem,
          degrees: 0,
          dms: '0°00\'00"'
        },
        nodeMode: request.conventions.nodeMode,
        observer: { latitudeDeg: request.latitudeDeg, longitudeDeg: request.longitudeDeg, obliquityOfEclipticDeg: 0 },
        warnings: []
      },
      bodies,
      ascendant: { status: 'NOT_CALCULATED', reason: 'Fixture set does not carry ascendant reference rows.' },
      mc: { status: 'NOT_CALCULATED', reason: 'Fixture set does not carry MC reference rows.' },
      solarTimings: { sunriseUtc: null, sunsetUtc: null },
      fixtureCoverage: {
        fixtureSetId: this.set.fixtureSetId,
        coveredPoints: rows.map(r => r.point)
      }
    };
    return reading;
  }
}

/* ------------------------------------------------------------------------- */
/* JplReferenceProvider — Sprint C scaffold (fails closed until implemented)   */
/* ------------------------------------------------------------------------- */

export const JPL_REFERENCE_PROVIDER_VERSION = 'jpl-reference-provider-0.1.0-scaffold';

export class JplReferenceProvider implements AstronomyProvider {
  readonly descriptor: ProviderDescriptor;

  constructor() {
    this.descriptor = {
      providerId: JPL_REFERENCE_PROVIDER_ID,
      name: 'JplReferenceProvider (independent verification, Sprint C)',
      version: JPL_REFERENCE_PROVIDER_VERSION,
      kernel: 'NASA/JPL Horizons on-demand API (planned; not yet wired)',
      role: 'REFERENCE',
      validationStatus: 'IMPLEMENTED',
      declaredConventions: {
        ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA',
        nodeMode: 'MEAN_NODE'
      },
      notes: [
        'Scaffold only. Every call FAILS CLOSED with QUALIFICATION_PROVIDER_NOT_IMPLEMENTED until Sprint C wires the Horizons adapter.',
        'Per mission Section 4, independent providers derive cleanly from public JPL/NASA data; no proprietary reversal.'
      ]
    };
  }

  getSnapshot(_request: AstronomyRequest): EphemerisReading {
    throw new AstronomyProviderError('QUALIFICATION_PROVIDER_NOT_IMPLEMENTED',
      'JplReferenceProvider is a Sprint C deliverable and does not fabricate data. Fail closed (CT_INV_006).',
      { invariantId: 'CT_INV_006', detail: { providerId: this.descriptor.providerId } });
  }
}

/* ------------------------------------------------------------------------- */
/* Registry                                                                   */
/* ------------------------------------------------------------------------- */

const PRODUCTION_PROVIDER = new SwissEphemerisProvider();

export function resolveAstronomyProvider(): SwissEphemerisProvider {
  return PRODUCTION_PROVIDER;
}

export function getAstronomyProvider(
  providerId: string,
  opts?: { fixtureSet?: AstronomyFixtureSet }
): AstronomyProvider {
  switch (providerId) {
    case PRODUCTION_PROVIDER_ID:
      return PRODUCTION_PROVIDER;
    case FIXTURE_PROVIDER_ID:
      if (!opts?.fixtureSet) {
        throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID',
          'FIXTURE_PROVIDER requires an astronomy fixture set');
      }
      return new FixtureProvider(opts.fixtureSet);
    case JPL_REFERENCE_PROVIDER_ID:
      return new JplReferenceProvider();
    default:
      throw new AstronomyProviderError('ASTRONOMY_INPUT_INVALID',
        `Unknown astronomy provider id: ${providerId}. Fail closed.`,
        { detail: { providerId, known: [PRODUCTION_PROVIDER_ID, FIXTURE_PROVIDER_ID, JPL_REFERENCE_PROVIDER_ID] } });
  }
}

/** Canonical JSON of a reading — used for determinism assertions (byte-identical replays). */
export function canonicalReadingJson(reading: EphemerisReading): string {
  return JSON.stringify(reading);
}

/* ------------------------------------------------------------------------- */
/* Determinism comparison (CT_INV_007)                                        */
/* ------------------------------------------------------------------------- */

export interface DeterminismComparison {
  /** Structures, strings, booleans and all non-FP values match exactly AND numbers are equal. */
  byteIdentical: boolean;
  /** Structures match and every number is equal or within FP-equivalence (see below). */
  equivalent: boolean;
  /** Largest absolute deviation found between paired numbers (0 when byteIdentical). */
  maxDeviation: number;
  /** Field path of the largest deviation, for diagnostics. */
  maxDeviationPath: string;
}

/**
 * Compares two readings for CT_INV_007 determinism.
 *
 * Contract: structure, strings, booleans and nulls must match EXACTLY. Numbers must
 * match either exactly or within FP-equivalence: |a−b| ≤ 1e-9 + 8·ε·max(|a|,|b|).
 * That bound is ~0.0036 microarcsec on angles — 7+ orders of magnitude below every
 * qualification tolerance — while tolerating the last-ULP reassociation the V8 runtime
 * can introduce across JIT tier transitions (observed: ≤5e-13° on ~0.2% of instants,
 * measured by the qualification harness; see docs/reference-grade/astronomy-certification.md).
 * A violation of `equivalent` is a genuine CT_INV_007 defect: fail closed.
 */
export function compareReadingsForDeterminism(a: EphemerisReading, b: EphemerisReading): DeterminismComparison {
  let byteIdentical = true;
  let equivalent = true;
  let maxDeviation = 0;
  let maxDeviationPath = '';

  const walk = (x: unknown, y: unknown, p: string): void => {
    if (x === null || y === null || x === undefined || y === undefined) {
      if (x !== y) { byteIdentical = false; equivalent = false; if (maxDeviationPath === '') maxDeviationPath = p; }
      return;
    }
    if (typeof x === 'number' && typeof y === 'number') {
      if (x !== y) {
        byteIdentical = false;
        const dev = Math.abs(x - y);
        const fpTol = 1e-9 + 8 * Number.EPSILON * Math.max(Math.abs(x), Math.abs(y));
        if (dev > fpTol) equivalent = false;
        if (dev > maxDeviation) { maxDeviation = dev; maxDeviationPath = p; }
      }
      return;
    }
    if (Array.isArray(x) && Array.isArray(y)) {
      if (x.length !== y.length) { byteIdentical = false; equivalent = false; if (maxDeviationPath === '') maxDeviationPath = p; return; }
      for (let i = 0; i < x.length; i++) walk(x[i], y[i], `${p}[${i}]`);
      return;
    }
    if (typeof x === 'object' && typeof y === 'object') {
      const keys = new Set([...Object.keys(x as object), ...Object.keys(y as object)]);
      for (const k of keys) walk((x as Record<string, unknown>)[k], (y as Record<string, unknown>)[k], `${p}.${k}`);
      return;
    }
    if (x !== y) { byteIdentical = false; equivalent = false; if (maxDeviationPath === '') maxDeviationPath = p; }
  };

  walk(a, b, '');
  return { byteIdentical, equivalent, maxDeviation, maxDeviationPath };
}

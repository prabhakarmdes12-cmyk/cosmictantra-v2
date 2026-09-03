/**
 * ASTRONOMY QUALIFICATION SCENARIO GENERATOR (Sprint B scaffold for Sprint C)
 * Mission Section 5: deterministic, reproducible generation of the 100,000-scenario
 * qualification corpus covering the certified period 1900–2100.
 *
 * Determinism contract (CT_INV_007): generation uses a seeded integer hash stream
 * (xmur3 + mulberry32) only. No wall-clock time, no randomness, no I/O.
 * scenarioStreamFingerprint(count, seed) is a stable checksum of the whole stream:
 * any change to generation logic or order changes the fingerprint and is therefore
 * a visible, versioned event — never a silent one.
 *
 * Coverage dimensions (Mission §5):
 *   1900–2100 span, latitudes (incl. high-latitude ±58..70 adversarial beyond Gate 1b),
 *   longitudes (incl. antimeridian ±180, Greenwich), timezones (incl. :30/:45 offsets),
 *   DST/civil-boundary instants, midnight boundaries, date/year boundaries,
 *   leap days, India-specific cases, historical/epoch corner cases.
 * Sign/Nakshatra/Varga/Dasha boundary proximity is DERIVED from computed readings by
 * the runner (boundary-aware tagging), not guessed at generation time.
 */

export const SCENARIO_GENERATOR_VERSION = 'scenario-generator-1.0.0';
export const DEFAULT_SCENARIO_SEED = 0x51514a31; // 'QTQJ1' — stable default seed

export type ScenarioGenerationBasis =
  | 'STRATIFIED_RANDOM'
  | 'TARGETED_MIDNIGHT'
  | 'TARGETED_DATE_BOUNDARY'
  | 'TARGETED_LEAP_DAY'
  | 'TARGETED_DST_CIVIL_BOUNDARY'
  | 'TARGETED_INDIA_SPECIFIC'
  | 'TARGETED_HIGH_LATITUDE_ADVERSARIAL'
  | 'TARGETED_ANTIMERIDIAN'
  | 'TARGETED_EPOCH_CORNER';

export interface AstronomyScenario {
  scenarioId: string;
  index: number;
  utcTimestamp: string;
  latitudeDeg: number;
  longitudeDeg: number;
  basis: ScenarioGenerationBasis;
  /** Coverage tags demonstrated by construction (runtime-derived tags are added by the runner). */
  coverageTags: string[];
  note?: string;
}

/* --- deterministic PRNG (xmur3 hash + mulberry32) ------------------------- */

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* --- constants for stratification ----------------------------------------- */

const PERIOD_START_MS = Date.UTC(1900, 0, 1);
const PERIOD_END_MS = Date.UTC(2100, 11, 31, 23, 59, 59, 999);

/** Canonical Indian locations (convention: INDIAN_CITY_DB_IANA). */
export const INDIA_ANCHORS: ReadonlyArray<{ name: string; lat: number; lon: number }> = [
  { name: 'Patna', lat: 25.5941, lon: 85.1376 },
  { name: 'Varanasi', lat: 25.3176, lon: 82.9739 },
  { name: 'New Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
  { name: 'Jammu', lat: 32.7266, lon: 74.857 },
  { name: 'Kanyakumari', lat: 8.0883, lon: 77.5385 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Leh', lat: 34.1526, lon: 77.5771 }
];

/** Leap days across the certified period (1904..2096). */
function leapDays(): string[] {
  const out: string[] = [];
  for (let y = 1904; y <= 2096; y += 4) {
    if ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) out.push(`${y}-02-29`);
  }
  return out;
}

/** Curated DST / civil-time corner instants (documented provenance per entry). */
export const DST_CORNER_INSTANTS: ReadonlyArray<{ utc: string; note: string }> = [
  { utc: '2024-03-10T07:00:00.000Z', note: 'US spring-forward instant: 02:00 local America/New_York does not exist on clocks' },
  { utc: '2024-11-03T06:00:00.000Z', note: 'US fall-back instant: 01:00 local America/New_York occurs twice' },
  { utc: '2026-03-29T01:00:00.000Z', note: 'EU summer-time start: 01:00 UTC, 02:00 CET springs to 03:00' },
  { utc: '2026-10-25T01:00:00.000Z', note: 'EU summer-time end: 01:00 UTC, 03:00 CEST falls back to 02:00' },
  { utc: '1942-08-31T18:30:00.000Z', note: 'WWII India DST era (Calcutta +1): civil-time history corner' },
  { utc: '1962-12-31T23:59:59.000Z', note: 'Pre-universal-UTC era boundary (EOP data-based coverage starts 1962)' }
];

/** Fractional-offset timezones exercised by midnight-boundary scenarios. */
export const FRACTIONAL_TZ_OFFSETS_HOURS: ReadonlyArray<number> = [
  -9.5, -3.5, 3.5, 4.5, 5.5, 5.75, 6.5, 8.75, 9.75, 10.5, 12.75, 13.75, 14
];

function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0');
}

function isoFromMs(ms: number): string {
  return new Date(ms).toISOString();
}

/** Stable scenario id derived from seed+index+payload (independent of array order). */
function scenarioId(seed: number, index: number, utc: string): string {
  const h = xmur3(`${seed}:${index}:${utc}`)();
  return `AQ-${seed.toString(16).toUpperCase()}-${pad(index, 6)}-${h.toString(16).padStart(8, '0').toUpperCase()}`;
}

/* --- the generator --------------------------------------------------------- */

/**
 * Generates exactly `count` deterministic scenarios. Composition per 1000-scenario block:
 *   500 stratified-random, ~85 midnight/date-boundary, ~60 leap-day, ~60 DST corner,
 *   ~120 India-specific, ~60 high-latitude adversarial, ~35 antimeridian, ~25 epoch corner,
 *   rounded within the block. The final block is truncated proportionally.
 */
export function generateAstronomyScenarios(count: number, seed: number = DEFAULT_SCENARIO_SEED): AstronomyScenario[] {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`count must be a positive integer, got ${count}`);
  }
  const rand = mulberry32(xmur3(`astronomy-qualification:${SCENARIO_GENERATOR_VERSION}:${seed}`)());
  const scenarios: AstronomyScenario[] = [];
  const leapDayList = leapDays();

  for (let i = 0; i < count; i++) {
    const slot = i % 1000;
    let scenario: AstronomyScenario;

    if (slot < 500) {
      // Stratified random over the full certified period + full lat/lon envelope.
      const ms = Math.floor(PERIOD_START_MS + rand() * (PERIOD_END_MS - PERIOD_START_MS));
      const lat = (rand() * 2 - 1) * 66; // up to just beyond Gate 1b (±65)
      const lon = (rand() * 2 - 1) * 180;
      scenario = {
        scenarioId: scenarioId(seed, i, isoFromMs(ms)),
        index: i,
        utcTimestamp: isoFromMs(ms),
        latitudeDeg: Number(lat.toFixed(4)),
        longitudeDeg: Number(lon.toFixed(4)),
        basis: 'STRATIFIED_RANDOM',
        coverageTags: ['PERIOD_1900_2100', 'LATITUDE_ENVELOPE', 'LONGITUDE_ENVELOPE']
      };
    } else if (slot < 585) {
      // Midnight / date / year boundaries at fractional-offset zones.
      const off = FRACTIONAL_TZ_OFFSETS_HOURS[Math.floor(rand() * FRACTIONAL_TZ_OFFSETS_HOURS.length)];
      const year = 1900 + Math.floor(rand() * 201);
      const month = Math.floor(rand() * 12);
      const day = 1 + Math.floor(rand() * 28);
      const isNextMidnight = rand() < 0.5;
      const localMs = Date.UTC(year, month, day, isNextMidnight ? 23 : 0, isNextMidnight ? 59 : 0, isNextMidnight ? 59 : 0, 0);
      const utcMs = localMs - off * 3600000;
      scenario = {
        scenarioId: scenarioId(seed, i, isoFromMs(utcMs)),
        index: i,
        utcTimestamp: isoFromMs(utcMs),
        latitudeDeg: Number((((rand() * 2 - 1) * 66)).toFixed(4)),
        longitudeDeg: Number((((rand() * 2 - 1) * 180)).toFixed(4)),
        basis: 'TARGETED_MIDNIGHT',
        coverageTags: ['MIDNIGHT_BOUNDARY', 'FRACTIONAL_TZ'],
        note: `local ${isNextMidnight ? '23:59:59' : '00:00:00'} at UTC${off >= 0 ? '+' : ''}${off}h`
      };
    } else if (slot < 645) {
      // Leap-day boundary.
      const d = leapDayList[Math.floor(rand() * leapDayList.length)];
      const hour = Math.floor(rand() * 24);
      const utcMs = Date.parse(`${d}T${pad(hour)}:00:00.000Z`);
      scenario = {
        scenarioId: scenarioId(seed, i, isoFromMs(utcMs)),
        index: i,
        utcTimestamp: isoFromMs(utcMs),
        latitudeDeg: Number((((rand() * 2 - 1) * 66)).toFixed(4)),
        longitudeDeg: Number((((rand() * 2 - 1) * 180)).toFixed(4)),
        basis: 'TARGETED_LEAP_DAY',
        coverageTags: ['LEAP_DAY']
      };
    } else if (slot < 705) {
      // DST / civil-time corners (cycling deterministically).
      const inst = DST_CORNER_INSTANTS[(i + Math.floor(rand() * DST_CORNER_INSTANTS.length)) % DST_CORNER_INSTANTS.length];
      scenario = {
        scenarioId: scenarioId(seed, i, inst.utc),
        index: i,
        utcTimestamp: inst.utc,
        latitudeDeg: Number((((rand() * 2 - 1) * 66)).toFixed(4)),
        longitudeDeg: Number((((rand() * 2 - 1) * 180)).toFixed(4)),
        basis: 'TARGETED_DST_CIVIL_BOUNDARY',
        coverageTags: ['DST_CIVIL_BOUNDARY', 'HISTORICAL_TIME'],
        note: inst.note
      };
    } else if (slot < 825) {
      // India-specific: canonical anchors across the full period (IST +5:30 domain).
      const anchor = INDIA_ANCHORS[Math.floor(rand() * INDIA_ANCHORS.length)];
      const ms = Math.floor(PERIOD_START_MS + rand() * (PERIOD_END_MS - PERIOD_START_MS));
      scenario = {
        scenarioId: scenarioId(seed, i, isoFromMs(ms)),
        index: i,
        utcTimestamp: isoFromMs(ms),
        latitudeDeg: anchor.lat,
        longitudeDeg: anchor.lon,
        basis: 'TARGETED_INDIA_SPECIFIC',
        coverageTags: ['INDIA_SPECIFIC', 'IST_DOMAIN'],
        note: anchor.name
      };
    } else if (slot < 885) {
      // High-latitude adversarial (58..70 absolute), both hemispheres — beyond Gate 1b by design.
      const mag = 58 + rand() * 12;
      const lat = (rand() < 0.5 ? -1 : 1) * mag;
      const ms = Math.floor(PERIOD_START_MS + rand() * (PERIOD_END_MS - PERIOD_START_MS));
      scenario = {
        scenarioId: scenarioId(seed, i, isoFromMs(ms)),
        index: i,
        utcTimestamp: isoFromMs(ms),
        latitudeDeg: Number(lat.toFixed(4)),
        longitudeDeg: Number((((rand() * 2 - 1) * 180)).toFixed(4)),
        basis: 'TARGETED_HIGH_LATITUDE_ADVERSARIAL',
        coverageTags: ['HIGH_LATITUDE', 'POLAR_RISK_RSK_003'],
        note: 'RSK_003 adversarial band; ascendant behaviour flagged by provider'
      };
    } else if (slot < 920) {
      // Antimeridian & Greenwich meridian cases.
      const meridians = [180, -180, 179.99, -179.99, 0, 0.01, -0.01, 97.4, 68.1];
      const lon = meridians[Math.floor(rand() * meridians.length)];
      const ms = Math.floor(PERIOD_START_MS + rand() * (PERIOD_END_MS - PERIOD_START_MS));
      scenario = {
        scenarioId: scenarioId(seed, i, isoFromMs(ms)),
        index: i,
        utcTimestamp: isoFromMs(ms),
        latitudeDeg: Number((((rand() * 2 - 1) * 66)).toFixed(4)),
        longitudeDeg: lon,
        basis: 'TARGETED_ANTIMERIDIAN',
        coverageTags: ['LONGITUDE_EXTREME']
      };
    } else {
      // Epoch corners: certified-period first/last second, century turns, J2000.
      const corners = [
        '1900-01-01T00:00:00.000Z', '2100-12-31T23:59:59.999Z',
        '1900-01-01T00:00:00.001Z', '2100-12-31T23:59:59.998Z',
        '2000-01-01T12:00:00.000Z', '1950-01-01T12:00:00.000Z',
        '2050-01-01T12:00:00.000Z', '2100-01-01T12:00:00.000Z'
      ];
      const utc = corners[(i + Math.floor(rand() * corners.length)) % corners.length];
      scenario = {
        scenarioId: scenarioId(seed, i, utc),
        index: i,
        utcTimestamp: utc,
        latitudeDeg: Number((((rand() * 2 - 1) * 66)).toFixed(4)),
        longitudeDeg: Number((((rand() * 2 - 1) * 180)).toFixed(4)),
        basis: 'TARGETED_EPOCH_CORNER',
        coverageTags: ['PERIOD_EDGE']
      };
    }

    scenarios.push(scenario);
  }

  return scenarios;
}

/**
 * Fingerprint of an entire scenario stream. Byte-stable for a given (count, seed).
 * Used by tests and the runner to prove generation determinism (CT_INV_007).
 */
export function scenarioStreamFingerprint(count: number, seed: number = DEFAULT_SCENARIO_SEED): string {
  const scenarios = generateAstronomyScenarios(count, seed);
  let h = xmur3(`stream:${seed}:${count}`)();
  for (const s of scenarios) {
    const chunk = `${s.scenarioId}|${s.utcTimestamp}|${s.latitudeDeg}|${s.longitudeDeg}|${s.basis}`;
    for (let k = 0; k < chunk.length; k++) {
      h = Math.imul(h ^ chunk.charCodeAt(k), 2654435761);
      h = (h << 13) | (h >>> 19);
    }
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
}

/** Coverage dimension checklist required by Mission Section 5. */
export const REQUIRED_COVERAGE_TAGS: readonly string[] = [
  'PERIOD_1900_2100',
  'LATITUDE_ENVELOPE',
  'LONGITUDE_ENVELOPE',
  'MIDNIGHT_BOUNDARY',
  'FRACTIONAL_TZ',
  'LEAP_DAY',
  'DST_CIVIL_BOUNDARY',
  'HISTORICAL_TIME',
  'INDIA_SPECIFIC',
  'IST_DOMAIN',
  'HIGH_LATITUDE',
  'POLAR_RISK_RSK_003',
  'LONGITUDE_EXTREME',
  'PERIOD_EDGE'
];

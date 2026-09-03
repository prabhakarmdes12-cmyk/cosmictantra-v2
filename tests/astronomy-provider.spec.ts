/**
 * REFERENCE-GRADE SPRINT B: AstronomyProvider abstraction (src/lib/astronomy/astronomyProvider.ts)
 * Guards: CT_INV_004 (declared conventions), CT_INV_005 (honest validation status),
 * CT_INV_006 (fail closed), CT_INV_007 (deterministic), CT_INV_008 (versioned).
 */
import { test, expect } from '@playwright/test';
import * as fixturesJson from '../qualification/fixtures/astronomy-golden-fixtures.json';
import {
  AstronomyProviderError,
  FixtureProvider,
  JplReferenceProvider,
  PRODUCTION_PROVIDER_ID,
  SwissEphemerisProvider,
  canonicalReadingJson,
  compareReadingsForDeterminism,
  getAstronomyProvider,
  loadAstronomyFixtureSet,
  resolveAstronomyProvider,
  validateReadingInvariants,
  type AstronomyFixtureSet,
  type EphemerisReading
} from '../src/lib/astronomy/astronomyProvider';

const MEAN_NODE_LAHIRI = { ayanamshaSystem: 'LAHIRI_CHITRA_PAKSHA', nodeMode: 'MEAN_NODE' } as const;
const PATNA = { latitudeDeg: 25.5941, longitudeDeg: 85.1376 };

function request(overrides: Partial<Parameters<SwissEphemerisProvider['getSnapshot']>[0]> = {}) {
  return {
    utcTimestamp: '2000-01-01T12:00:00.000Z',
    ...PATNA,
    conventions: MEAN_NODE_LAHIRI,
    ...overrides
  };
}

test.describe('SPRINT-B: AstronomyProvider abstraction', () => {

  test('production provider wraps the working engine and passes all reading invariants', () => {
    const provider = resolveAstronomyProvider();
    expect(provider.descriptor.providerId).toBe(PRODUCTION_PROVIDER_ID);
    // CT_INV_005 honesty: descriptor must disclose the ACTUAL kernel, not claim Swiss parity.
    expect(provider.descriptor.kernel).toContain('astronomy-engine');
    expect(provider.descriptor.notes.join(' ')).toContain('Sprint C');

    const reading = provider.getSnapshot(request());
    expect(() => validateReadingInvariants(reading)).not.toThrow();
    for (const id of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const) {
      const b = reading.bodies[id];
      expect(Number.isFinite(b.tropicalLongitudeDeg)).toBe(true);
      expect(b.tropicalLongitudeDeg).toBeGreaterThanOrEqual(0);
      expect(b.tropicalLongitudeDeg).toBeLessThan(360);
    }
    // Registry §2.2: Ketu is exactly Rahu + 180.
    const wrap = ((reading.bodies.Ketu.tropicalLongitudeDeg - reading.bodies.Rahu.tropicalLongitudeDeg - 180) % 360 + 360) % 360;
    expect(Math.min(wrap, 360 - wrap)).toBeLessThan(1e-9);
    // CT_INV_006: MC must be declared NOT_CALCULATED, never fabricated.
    expect(reading.mc.status).toBe('NOT_CALCULATED');
  });

  test('CT_INV_007: identical requests produce byte-identical readings', () => {
    const provider = resolveAstronomyProvider();
    const a = provider.getSnapshot(request({ utcTimestamp: '1990-08-17T03:45:00.000Z' }));
    const b = provider.getSnapshot(request({ utcTimestamp: '1990-08-17T03:45:00.000Z' }));
    expect(canonicalReadingJson(a)).toBe(canonicalReadingJson(b));
  });

  test('CT_INV_007 comparator: last-ULP float noise is FP-equivalent; real differences are defects', () => {
    const provider = resolveAstronomyProvider();
    const a = provider.getSnapshot(request());
    // (1) identical readings are byte-identical and equivalent
    const same = compareReadingsForDeterminism(a, provider.getSnapshot(request()));
    expect(same.byteIdentical).toBe(true);
    expect(same.equivalent).toBe(true);

    // (2) a 1-ULP nudge on one angle is NOT byte-identical but MUST be FP-equivalent
    const nudged: EphemerisReading = JSON.parse(canonicalReadingJson(a));
    nudged.bodies.Moon.tropicalLongitudeDeg = a.bodies.Moon.tropicalLongitudeDeg + 5e-13;
    const cmp = compareReadingsForDeterminism(a, nudged);
    expect(cmp.byteIdentical).toBe(false);
    expect(cmp.equivalent).toBe(true);
    // (JSON/FP round-trip of the nudge introduces its own last-ULP error, hence the loose bound.)
    expect(cmp.maxDeviation).toBeGreaterThan(0);
    expect(cmp.maxDeviation).toBeLessThan(1e-11);

    // (3) a real difference (1 arcsec) is a hard equivalence failure
    const wrong: EphemerisReading = JSON.parse(canonicalReadingJson(a));
    wrong.bodies.Mars.tropicalLongitudeDeg = a.bodies.Mars.tropicalLongitudeDeg + 1 / 3600;
    expect(compareReadingsForDeterminism(a, wrong).equivalent).toBe(false);

    // (4) structural changes fail closed (string and shape drift)
    const drift: EphemerisReading = JSON.parse(canonicalReadingJson(a));
    drift.meta.providerId = 'SOMETHING_ELSE';
    expect(compareReadingsForDeterminism(a, drift).equivalent).toBe(false);
    const missing: EphemerisReading = JSON.parse(canonicalReadingJson(a));
    delete (missing.bodies as Partial<Record<string, unknown>>).Venus;
    expect(compareReadingsForDeterminism(a, missing).equivalent).toBe(false);
  });

  test('fail closed: instants outside the certified 1900–2100 period are rejected with a typed error', () => {
    const provider = resolveAstronomyProvider();
    for (const bad of ['1899-12-31T23:59:59.999Z', '2101-01-01T00:00:00.000Z', 'not-a-date']) {
      try {
        provider.getSnapshot(request({ utcTimestamp: bad }));
        throw new Error(`expected rejection for ${bad}`);
      } catch (err) {
        expect(err).toBeInstanceOf(AstronomyProviderError);
        const e = err as AstronomyProviderError;
        expect(['EPHEMERIS_OUTSIDE_CERTIFIED_PERIOD', 'ASTRONOMY_INPUT_INVALID']).toContain(e.code);
        expect(e.invariantId).toContain('CT_INV_006');
      }
    }
  });

  test('fail closed: non-finite or malformed inputs are rejected, never coerced', () => {
    const provider = resolveAstronomyProvider();
    expect(() => provider.getSnapshot(request({ latitudeDeg: NaN }))).toThrow(AstronomyProviderError);
    expect(() => provider.getSnapshot(request({ longitudeDeg: Infinity }))).toThrow(AstronomyProviderError);
    expect(() => provider.getSnapshot({ ...request(), conventions: undefined as never })).toThrow(AstronomyProviderError);
    expect(() => provider.getSnapshot({ ...request(), conventions: { ...MEAN_NODE_LAHIRI, nodeMode: 'SOMETHING' as never } })).toThrow(AstronomyProviderError);
  });

  test('node-oposition invariant survives the 360° wrap boundary (regression for shortest-arc check)', () => {
    // Scenario band where Rahu sits near the 0°/360° wrap: the original
    // normalizeAngle(ketu-(rahu+180)) check produced a false 360° delta there.
    const provider = resolveAstronomyProvider();
    const scenarios = ['1950-01-01T12:00:00.000Z', '2000-01-01T12:00:00.000Z', '2050-01-01T12:00:00.000Z', '2100-01-01T12:00:00.000Z'];
    for (const utc of scenarios) {
      const reading = provider.getSnapshot(request({ utcTimestamp: utc }));
      expect(() => validateReadingInvariants(reading)).not.toThrow();
    }
  });

  test('FixtureProvider serves genuine JPL seed values with full integrity checks', () => {
    const fixtureSet = loadAstronomyFixtureSet(fixturesJson);
    expect(fixtureSet.fixtures.length).toBe(36);
    expect(fixtureSet.fixtureSetId).toBe('ASTRO_SEED_JPL_DE441_001');

    const provider = new FixtureProvider(fixturesJson as unknown as AstronomyFixtureSet);
    const reading = provider.getSnapshot(request()); // 2000-01-01T12:00:00Z is in the seed set
    expect(reading.fixtureCoverage?.coveredPoints.length).toBe(9);

    // Exact JPL value, never approximated: Sun @ J2000 = 280.3689092° (Horizons DE441).
    const sunRow = fixtureSet.fixtures.find(r => r.point === 'Sun' && r.utcTimestamp === '2000-01-01T12:00:00.000Z')!;
    expect(reading.bodies.Sun.tropicalLongitudeDeg).toBeCloseTo(sunRow.tropicalEclipticLongitudeDeg, 9);
    expect(sunRow.sourceStatus).toBe('SOURCE_VERIFIED');
    expect(sunRow.sourceLocator).toContain('horizons.api');

    // Fail closed: unknown instant, and MC/ascendant are declared NOT_CALCULATED.
    expect(() => provider.getSnapshot(request({ utcTimestamp: '2001-01-01T00:00:00.000Z' })))
      .toThrow(/FIXTURE_NOT_FOUND|No golden fixtures/);
    expect(reading.mc.status).toBe('NOT_CALCULATED');
  });

  test('fail closed: a single altered fixture byte trips the checksum (FIXTURE_TAMPERED)', () => {
    const tampered: AstronomyFixtureSet = JSON.parse(JSON.stringify(fixturesJson));
    tampered.fixtures[0].tropicalEclipticLongitudeDeg += 0.0001; // 0.36 arcsec — invisible to the eye
    expect(() => loadAstronomyFixtureSet(tampered)).toThrow(/content hash mismatch/);
  });

  test('fail closed: removing a fixture row trips the set hash', () => {
    const tampered: AstronomyFixtureSet = JSON.parse(JSON.stringify(fixturesJson));
    tampered.fixtures.pop();
    // Row hashes still valid individually, but the SET hash must catch the removal.
    expect(() => loadAstronomyFixtureSet(tampered)).toThrow(/set hash mismatch/);
  });

  test('JplReferenceProvider scaffold fails closed until Sprint C implements it', () => {
    const provider = new JplReferenceProvider();
    expect(provider.descriptor.kernel).toContain('Horizons');
    try {
      provider.getSnapshot(request());
      throw new Error('expected QUALIFICATION_PROVIDER_NOT_IMPLEMENTED');
    } catch (err) {
      expect(err).toBeInstanceOf(AstronomyProviderError);
      expect((err as AstronomyProviderError).code).toBe('QUALIFICATION_PROVIDER_NOT_IMPLEMENTED');
    }
  });

  test('provider registry resolves known ids and fails closed on unknown ids', () => {
    expect(getAstronomyProvider(PRODUCTION_PROVIDER_ID).descriptor.role).toBe('PRODUCTION');
    expect(() => getAstronomyProvider('DOES_NOT_EXIST')).toThrow(/Unknown astronomy provider/);
    expect(() => getAstronomyProvider('FIXTURE_PROVIDER')).toThrow(/requires an astronomy fixture set/);
  });

  test('sweep: 200 stratified scenarios all satisfy every reading invariant', () => {
    const provider = resolveAstronomyProvider();
    // Spread across the certified period including both period edges and polar-risk band.
    const samples = 200;
    const start = Date.parse('1900-01-02T00:00:00.000Z');
    const end = Date.parse('2100-12-30T00:00:00.000Z');
    for (let i = 0; i < samples; i++) {
      const ms = start + Math.floor(((end - start) * i) / samples);
      const lat = i % 5 === 0 ? 66.5 : 25.5941; // periodically cross the polar-risk threshold
      let reading: EphemerisReading;
      try {
        reading = provider.getSnapshot(request({ utcTimestamp: new Date(ms).toISOString(), latitudeDeg: lat }));
      } catch (err) {
        // Only acceptable abort: explicit NOT_CALCULATED-style typed error, never a silent wrong value.
        expect(err).toBeInstanceOf(AstronomyProviderError);
        continue;
      }
      expect(() => validateReadingInvariants(reading)).not.toThrow();
      if (Math.abs(lat) > 65) {
        expect(reading.meta.warnings.join(' ')).toContain('POLAR_RISK');
      }
    }
  });
});

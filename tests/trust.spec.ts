import { test, expect } from '@playwright/test';
import { professionalChart, getSnapshot } from '../src/lib/pro/index.js';
import { snapshotKey } from '../src/lib/pro/snapshot.js';
import {
  AYANAMSHA, NODE_MODE, resolveConventions, conventionKey, ayanamshaFor, ayanamshaDelta,
  COSMICTANTRA_STANDARD_PARASHARI,
} from '../src/lib/pro/conventions.js';
import { versionStamp, isCurrent, ENGINE_VERSION } from '../src/lib/pro/versions.js';
import { runCase, runCorpus, CLASSIFICATION } from '../src/lib/pro/qualificationLab.js';
import { corpusToCases, corpusStats, INTERNAL_GOLDEN } from '../src/lib/pro/goldenCorpus.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, place: 'Patna' };

test.describe('TRUST-01 — Snapshot v2 (conventions + versions)', () => {
  test('standard Parashari preserves canonical golden (Leo lagna, Sagittarius moon)', () => {
    const c = professionalChart(BP);
    expect(c.kundali.lagna.rashiEn).toBe('Leo');
    expect(c.kundali.moon.rashiEn).toBe('Sagittarius');
    expect(c.kundali.moon.nakshatra.name).toBe('Uttara Ashadha');
  });

  test('snapshot key embeds convention identity — different conventions → different key/context', () => {
    const kLahiri = snapshotKey(BP, { ayanamsha: AYANAMSHA.LAHIRI });
    const kRaman = snapshotKey(BP, { ayanamsha: AYANAMSHA.RAMAN });
    const kKP = snapshotKey(BP, { ayanamsha: AYANAMSHA.KP });
    expect(kLahiri).not.toBe(kRaman);
    expect(kLahiri).not.toBe(kKP);
    expect(kRaman).not.toBe(kKP);
  });

  test('every snapshot carries a version stamp for reproducibility', () => {
    const c = professionalChart(BP);
    expect(c.versions.engineVersion).toBe(ENGINE_VERSION);
    expect(c.versions.generatedAt).toBeTruthy();
    expect(isCurrent(c.versions)).toBe(true);
    expect(isCurrent({ engineVersion: '0.0.1' })).toBe(false);
  });
});

test.describe('TRUST-01 — Convention engine (non-destructive shifts)', () => {
  test('Raman & KP ayanamsha are documented offsets from Lahiri (engine never edited)', () => {
    const jd = getSnapshot(BP).julianDay;
    const lahiri = ayanamshaFor(jd, AYANAMSHA.LAHIRI);
    expect(ayanamshaFor(jd, AYANAMSHA.RAMAN)).toBeCloseTo(lahiri - 1.1067, 4);
    expect(ayanamshaFor(jd, AYANAMSHA.KP)).toBeCloseTo(lahiri - 0.883, 4);
    expect(ayanamshaDelta(jd, AYANAMSHA.LAHIRI)).toBeCloseTo(0, 9);
  });

  test('changing ayanamsha shifts longitudes but keeps a coherent chart', () => {
    const lahiri = professionalChart(BP, { conventions: { ayanamsha: AYANAMSHA.LAHIRI } });
    const raman = professionalChart(BP, { conventions: { ayanamsha: AYANAMSHA.RAMAN } });
    expect(raman.kundali.lagna.longitude).not.toBeCloseTo(lahiri.kundali.lagna.longitude, 3);
    // Raman ayanamsha smaller → sidereal longitude larger by ~1.1°
    expect(raman.kundali.lagna.longitude - lahiri.kundali.lagna.longitude).toBeCloseTo(1.1067, 2);
    expect(raman.kundali.planets).toHaveProperty('Sun');
    expect(raman.kundali.houses).toHaveLength(12);
  });

  test('true node differs from mean node', () => {
    const mean = professionalChart(BP, { conventions: { nodeMode: NODE_MODE.MEAN } });
    const tru = professionalChart(BP, { conventions: { nodeMode: NODE_MODE.TRUE } });
    expect(tru.kundali.planets.Rahu.longitude).not.toBeCloseTo(mean.kundali.planets.Rahu.longitude, 4);
  });

  test('standard preset & convention key are stable', () => {
    expect(resolveConventions({}).ayanamsha).toBe(AYANAMSHA.LAHIRI);
    expect(conventionKey(COSMICTANTRA_STANDARD_PARASHARI)).toContain('LAHIRI:MEAN');
  });
});

test.describe('TRUST-01 — Jyotish Qualification Lab (honesty)', () => {
  test('a case without external reference is PENDING_EXTERNAL_REFERENCE, never silently passed', () => {
    const r = runCase({ subjectId: 'X', birthInput: BP, capabilityId: 'lagna.sign', expected: null });
    expect(r.classification).toBe(CLASSIFICATION.PENDING_EXTERNAL_REFERENCE);
    expect(r.actual).toBe('Leo');
    expect(r.versions).toBeTruthy();
  });

  test('a matching external reference classifies as MATCH', () => {
    const r = runCase({ subjectId: 'X', birthInput: BP, capabilityId: 'lagna.sign', expected: 'Leo', reference: { product: 'Manual', productVersion: 'test' }, reviewer: 'test', reviewDate: '2026-08-30' });
    expect(r.classification).toBe(CLASSIFICATION.MATCH);
  });

  test('a numeric reference within tolerance is WITHIN_TOLERANCE', () => {
    const jd = getSnapshot(BP).julianDay;
    const actualAyan = ayanamshaFor(jd, AYANAMSHA.LAHIRI);
    const r = runCase({ subjectId: 'X', birthInput: BP, capabilityId: 'ayanamsha', expected: Number((actualAyan - 0.01).toFixed(4)) });
    expect([CLASSIFICATION.WITHIN_TOLERANCE, CLASSIFICATION.MATCH]).toContain(r.classification);
  });

  test('corpus scaffold reports honest external coverage (currently zero external refs)', () => {
    const stats = corpusStats();
    expect(stats.targetSubjects).toBe(100);
    expect(stats.slotsWithExternalReference).toBe(0);
    expect(stats.honestStatus).toContain('NO EXTERNAL REFERENCES');
    const summary = runCorpus(corpusToCases());
    expect(summary.total).toBeGreaterThan(0);
    // With no external refs recorded, all corpus cases must be pending — not fake-passed.
    expect(summary.pendingExternalReference).toBe(summary.total);
  });

  test('internal golden anchors reproduce their locked invariants', () => {
    for (const g of INTERNAL_GOLDEN) {
      const c = professionalChart(g.birthInput);
      for (const [cap, expected] of Object.entries(g.invariants)) {
        if (cap === 'lagna.sign') expect(c.kundali.lagna.rashiEn).toBe(expected);
        if (cap === 'moon.sign') expect(c.kundali.moon.rashiEn).toBe(expected);
        if (cap === 'moon.nakshatra') expect(c.kundali.moon.nakshatra.name).toBe(expected);
      }
    }
  });
});

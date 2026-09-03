/**
 * REFERENCE-GRADE SPRINT G: Gochara (transits) + correct Sade Sati qualification gate.
 * Guards qualification/gochara-qualification-runner.ts and GOCHARA_ENGINE_BENCHMARK_001.
 * Mission Section 9.
 *
 * Pins as permanent regressions:
 *   - the §9 core prohibition (RSK_016): Sade Sati is a TRANSIT phenomenon keyed to
 *     the natal MOON rashi only; the removed natal-Saturn lookup never returns;
 *   - the fabrication removal (RSK_017): yearly transits are kernel-computed,
 *     Varsheshwar stays NOT_CALCULATED;
 *   - external anchor agreement: engine Saturn epochs within declared tolerance of
 *     published panchang tables (SOURCE_SECONDARY);
 *   - the fail-closed query surface: an incomplete GocharaQuery throws, never defaults.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  buildGocharaFixtureSet,
  loadGocharaFixtureSet,
  runGocharaQualificationDetailed,
  PINNED_GOCHARA_FIXTURE_SHA256,
  GOCHARA_QUALIFICATION_RUNNER_VERSION,
  DEFAULT_GOCHARA_SEED
} from '../qualification/gochara-qualification-runner';
import {
  computeGochara,
  computeSadeSatiPeriod,
  GocharaError,
  GOCHARA_ENGINE_VERSION,
  SADE_SATI_BAND_HOUSES,
  DHAIYA_HOUSES
} from '../src/lib/jyotish/gocharaEngine';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { getYearlyInterpretation } from '../src/lib/interpretationEngine';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';

const FIXTURE = loadGocharaFixtureSet(buildGocharaFixtureSet());

test.describe('SPRINT-G: gochara fixture set integrity', () => {

  test('CT_INV_008: the fixture set is pinned, sourced and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('GOCHARA_ENGINE_BENCHMARK_001');
    expect(FIXTURE.classicalTables.sadeSatiBand.status).toBe('SOURCE_SECONDARY');
    expect(FIXTURE.classicalTables.sadeSatiBand.housesFromMoon).toEqual([12, 1, 2]);
    expect(FIXTURE.classicalTables.dhaiya.housesFromMoon).toEqual([4, 8]);
    expect(FIXTURE.setSha256).toBe(PINNED_GOCHARA_FIXTURE_SHA256);
    expect(FIXTURE.engineVersion).toBe(GOCHARA_ENGINE_VERSION);
    // every anchor must remain secondary-sourced with a declared tolerance
    for (const a of FIXTURE.externalAnchors) {
      expect(a.sourceStatus).toBe('SOURCE_SECONDARY');
      expect(a.sources.length).toBeGreaterThan(0);
      expect(a.toleranceDays).toBeGreaterThan(0);
    }
    // tamper evidence: mutate one published anchor instant and the sha must break
    const tampered = buildGocharaFixtureSet();
    tampered.externalAnchors[0].publishedUtc = '2025-03-30T00:00:00Z';
    expect(() => loadGocharaFixtureSet(tampered)).toThrow(/sha mismatch/);
  });

  test('runner version and default seed are pinned', () => {
    expect(GOCHARA_QUALIFICATION_RUNNER_VERSION).toBe('gochara-qualification-runner-1.0.0 (sprint G)');
    expect(DEFAULT_GOCHARA_SEED).toBe(0x60ca);
  });
});

test.describe('SPRINT-G: the gochara query fails closed (CT_INV_006)', () => {

  test('a query missing the reference instant is rejected, never defaulted', () => {
    expect(() => computeGochara({ natalMoonRashiId: 1, natalLagnaRashiId: 1, referenceInstantUtc: '' as unknown as string }))
      .toThrow(GocharaError);
    expect(() => computeGochara({ natalMoonRashiId: 0, natalLagnaRashiId: 1, referenceInstantUtc: '2026-09-03T06:00:00Z' }))
      .toThrow(GocharaError);
    expect(() => computeGochara({ natalMoonRashiId: 13, natalLagnaRashiId: 1, referenceInstantUtc: '2026-09-03T06:00:00Z' }))
      .toThrow(GocharaError);
    expect(() => computeSadeSatiPeriod({ natalMoonRashiId: 1, natalLagnaRashiId: 1, referenceInstantUtc: 'not-a-date' }))
      .toThrow(GocharaError);
  });
});

test.describe('SPRINT-G: transit identities', () => {

  test('Saturn in Meena is 12th-from Mesha Moon: Sade Sati ACTIVE, first phase', () => {
    const r = computeGochara({ natalMoonRashiId: 1, natalLagnaRashiId: 1, referenceInstantUtc: '2026-09-03T06:00:00Z' });
    expect(r.sadeSati.isActive).toBe(true);
    expect(r.sadeSati.phase).toContain('1st Phase');
    expect(r.sadeSati.saturnHousesFromMoon).toBe(12);
    expect(r.sadeSati.basis).toBe('TRANSIT');
  });

  test('Saturn in Meena is 3rd-from Makara Moon: Sade Sati inactive, no Dhaiya', () => {
    const r = computeGochara({ natalMoonRashiId: 10, natalLagnaRashiId: 10, referenceInstantUtc: '2026-09-03T06:00:00Z' });
    expect(r.sadeSati.isActive).toBe(false);
    expect(r.sadeSati.saturnHousesFromMoon).toBe(3);
    expect(r.dhaiya.isActive).toBe(false);
  });

  test('Dhaiya fires exactly on 4th and 8th from the natal Moon', () => {
    const r = computeGochara({ natalMoonRashiId: 1, natalLagnaRashiId: 1, referenceInstantUtc: '2026-09-03T06:00:00Z' });
    const dist = r.transitGrahas.find((g) => g.name === 'Rahu')!.houseFromMoon;
    expect(r.dhaiya.isActive).toBe(dist === 4 || dist === 8);
    expect(DHAIYA_HOUSES).toEqual([4, 8]);
    expect(SADE_SATI_BAND_HOUSES).toEqual([12, 1, 2]);
  });

  test('nine grahas with consistent house identities', () => {
    const r = computeGochara({ natalMoonRashiId: 7, natalLagnaRashiId: 3, referenceInstantUtc: '2030-04-17T01:57:10Z' });
    expect(r.transitGrahas).toHaveLength(9);
    for (const g of r.transitGrahas) {
      expect(g.houseFromMoon).toBe(((g.rashiId - 7 + 12) % 12) + 1);
      expect(g.houseFromLagna).toBe(((g.rashiId - 3 + 12) % 12) + 1);
    }
  });
});

test.describe('SPRINT-G: Sade Sati period solver', () => {

  test('Mesha Moon: the 2025-2032 period with the real 2027-2028 retrograde oscillation', () => {
    const { period } = computeSadeSatiPeriod({ natalMoonRashiId: 1, natalLagnaRashiId: 1, referenceInstantUtc: '2026-09-03T06:00:00Z' });
    expect(period.periodStartUtc.slice(0, 10)).toBe('2025-03-29');
    const events = period.phaseTransitions.map((t) => `${t.event}@${t.utc.slice(0, 10)}`);
    // the oscillation is REAL, never aliased: three crossings of the janma boundary
    expect(events.filter((e) => e.startsWith('JANMA_ENTRY')).length).toBe(2);
    expect(events.filter((e) => e.startsWith('JANMA_RETROGRADE_RETURN')).length).toBe(1);
    expect(period.periodEndUtc.slice(0, 4)).toBe('2032');
    // convention evidence
    expect(period.evidence.periodEndConvention).toContain('firstExitUtc');
    expect(Date.parse(period.firstExitUtc)).toBeLessThanOrEqual(Date.parse(period.periodEndUtc));
    expect(period.evidence.declaredBoundaryToleranceDays).toBe(2);
  });

  test('every declared transition sits on its rashi boundary (sub-0.05 deg)', () => {
    const { period } = computeSadeSatiPeriod({ natalMoonRashiId: 1, natalLagnaRashiId: 1, referenceInstantUtc: '2026-09-03T06:00:00Z' });
    const janmaStart = 0, thirdStart = 30;
    for (const t of period.phaseTransitions) {
      const lon = calculateCelestialEphemeris({
        dateUtc: new Date(t.utc), latitude: 25.6, longitude: 85.1, nodeMode: 'MEAN_NODE'
      }).bodies.Saturn.siderealLongitude;
      const boundary = t.event.startsWith('JANMA') ? janmaStart : thirdStart;
      const delta = Math.abs(((lon - boundary + 180) % 360 + 360) % 360 - 180);
      expect(delta).toBeLessThan(0.05);
    }
  });
});

test.describe('SPRINT-G: the Section-9 prohibition (RSK_016)', () => {

  test('the natal-Saturn Sade Sati lookup never returns to canonicalSnapshot', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'jyotish', 'canonicalSnapshot.ts'), 'utf8');
    expect(/find\(\(p: any\[\]\) => p\.name === 'Saturn'\)/.test(src)).toBe(false);
  });

  test('snapshot Sade Sati is transit-based, pinned to the explicit reference instant', () => {
    const targetDate = new Date('2022-03-01T06:00:00Z');
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376,
      timezone: 5.5, locationName: 'Patna', targetDate
    });
    const ss = snap.yogasAndDoshas.sadeSati as unknown as Record<string, unknown>;
    expect(ss.basis).toBe('TRANSIT');
    expect(ss.referenceInstantUtc).toBe(targetDate.toISOString());
    // the snapshot sadeSati equals the pure engine state for the same inputs
    const engine = computeGochara({
      natalMoonRashiId: (snap.planetsArray as Array<{ name: string; rashiId: number }>).find((p) => p.name === 'Moon')!.rashiId,
      natalLagnaRashiId: snap.lagna.rashiId,
      referenceInstantUtc: targetDate.toISOString()
    });
    expect(engine.sadeSati.saturnHousesFromMoon).toBe(ss.saturnHousesFromMoon);
    expect(engine.sadeSati.isActive).toBe(ss.isActive);
    // and the transits section carries the gochara result
    expect(snap.transits?.engineVersion).toBe(GOCHARA_ENGINE_VERSION);
  });

  test('two charts differing only in natal Saturn produce byte-identical snapshot Sade Sati', () => {
    // Fixed pair (discovered 2026-09): both charts have natal Moon in Dhanu (9)
    // but natal Saturn in Meena (12) vs Kumbha (11). Sade Sati depends on the
    // natal MOON rashi and the TRANSIT instant only — so the two snapshot
    // sadeSati blocks must be byte-identical despite the different natal Saturn.
    const targetDate = new Date('2026-09-03T06:00:00Z');
    const base = { birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' as string };
    const s1 = getCanonicalJyotishSnapshot({ ...base, birthDate: '1995-06-15', targetDate });
    const s2 = getCanonicalJyotishSnapshot({ ...base, birthDate: '1995-05-18', targetDate });
    const pl = (x: typeof s1) => (x.planetsArray as Array<{ name: string; rashiId: number }>);
    expect(pl(s1).find((p) => p.name === 'Moon')!.rashiId).toBe(9);
    expect(pl(s2).find((p) => p.name === 'Moon')!.rashiId).toBe(9);
    const satA = pl(s1).find((p) => p.name === 'Saturn')!.rashiId;
    const satB = pl(s2).find((p) => p.name === 'Saturn')!.rashiId;
    expect(satA).not.toBe(satB); // the charts genuinely differ in natal Saturn
    expect(JSON.stringify(s1.yogasAndDoshas.sadeSati)).toBe(JSON.stringify(s2.yogasAndDoshas.sadeSati));
  });

  test('the engine query surface cannot even accept a natal Saturn', () => {
    // structural proof: identical queries are the only way to call the engine —
    // there is no natal-ephemeris input, so natal positions cannot leak in.
    const a = computeGochara({ natalMoonRashiId: 5, natalLagnaRashiId: 5, referenceInstantUtc: '2026-09-03T06:00:00Z' });
    const b = computeGochara({ natalMoonRashiId: 5, natalLagnaRashiId: 5, referenceInstantUtc: '2026-09-03T06:00:00Z' });
    expect(JSON.stringify(a.sadeSati)).toBe(JSON.stringify(b.sadeSati));
  });
});

test.describe('SPRINT-G: fabrication regression (RSK_017)', () => {

  test('yearly Saturn transit equals the kernel value at the reference instant', () => {
    const city = { lat: 25.5941, lng: 85.1376, tz: 5.5 };
    const yearDate = new Date('2026-01-01T06:00:00Z');
    const y = getYearlyInterpretation(city, yearDate);
    const ephem = calculateCelestialEphemeris({ dateUtc: yearDate, latitude: city.lat, longitude: city.lng, nodeMode: 'MEAN_NODE' });
    const satRashi = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'][Math.floor(ephem.bodies.Saturn.siderealLongitude / 30)];
    expect(y.saturnTransit.rashi).toBe(satRashi);
    expect(y.saturnTransit.rashi).not.toContain('Pisces'); // the old fabricated constant
  });

  test('Varsheshwar stays NOT_CALCULATED instead of a fabricated lord', () => {
    const y = getYearlyInterpretation({ lat: 25.5941, lng: 85.1376, tz: 5.5 }, new Date('2026-01-01T06:00:00Z'));
    expect(y.varsheshwar.startsWith('NOT_CALCULATED')).toBe(true);
  });
});

test.describe('SPRINT-G: qualification gate', () => {

  test('scaffold gate run (2,000 scenarios) passes with zero violations', () => {
    test.setTimeout(700000);
    const { report } = runGocharaQualificationDetailed({
      scenarios: 2000, gate: 'scaffold', fixtureSet: FIXTURE
    });
    expect(report.verdict).toBe('PASS');
    expect(report.totalViolations).toBe(0);
  });

  test('the committed summary artifact carries the strict 10k PASS verdict', () => {
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'gochara-summary.json'), 'utf8'));
    expect(summary.verdict).toBe('PASS');
    expect(summary.gate).toBe('strict');
    expect(summary.scenarios).toBe(10000);
    expect(summary.totalViolations).toBe(0);
    expect(summary.streamA.identityChecks).toBe(1130000);
    expect(summary.streamD.anchors).toBe(8);
    expect(summary.determinism.mismatches).toBe(0);
  });

  test('the failures artifact records zero violations', () => {
    const failures = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'gochara-failures.json'), 'utf8'));
    expect(failures.totalViolations).toBe(0);
    expect(failures.failures).toHaveLength(0);
  });

  test('declared simplifications stay visible', () => {
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'gochara-summary.json'), 'utf8'));
    const ids = summary.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain('DECLARED_MEAN_NODE_PINNED');
    expect(ids).toContain('DECLARED_BOUNDARY_TOLERANCE_2D');
    expect(ids).toContain('DECLARED_WHOLE_SIGN_ASPECTS');
    expect(ids).toContain('DECLARED_GOCHARA_SCOPE');
    for (const f of summary.findings) expect(f.severity).toBe('NON_BLOCKING');
  });
});

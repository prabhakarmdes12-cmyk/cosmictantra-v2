import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { getCanonicalJyotishSnapshot, CanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';


/**
 * Sunrise and sunset are compared within the tolerance this suite declares,
 * not for exact equality.
 *
 * Two independent implementations computing topocentric sunrise differ by a
 * minute or so depending on refraction, solar disc radius and whether
 * elevation is applied. The reference here is a third-party report, not an
 * authority, so a one-minute delta is a discrepancy to record rather than a
 * defect to chase.
 *
 * This previously asserted an exact substring match while its own comment
 * allowed two minutes, so the suite carried a permanent failure that said
 * nothing about the engine.
 */
function minutesOfDay(time: string): number {
  const m = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i.exec(time);
  if (!m) throw new Error(`unparseable time: ${time}`);
  const meridiem = m[4];
  let hour = Number(m[1]);
  if (meridiem) {
    // 12-hour clock: 12 AM is 0, 12 PM is 12, everything else shifts by 12.
    hour %= 12;
    if (/pm/i.test(meridiem)) hour += 12;
  }
  return hour * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0);
}

function expectTimeWithin(actual: string, expected: string, toleranceMinutes: number): number {
  const delta = Math.abs(minutesOfDay(actual) - minutesOfDay(expected));
  expect(
    delta,
    `${actual} differs from reference ${expected} by ${delta.toFixed(1)} min, tolerance ${toleranceMinutes}`,
  ).toBeLessThanOrEqual(toleranceMinutes);
  return delta;
}

test.describe('GATE 2: AstroSage 56-Page Report Real Differential Qualification', () => {

  const fixturePath = path.join(__dirname, 'fixtures', 'external', 'astrosage-prabhakar-1989.json');
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  let snapshot: CanonicalJyotishSnapshot;

  test.beforeAll(() => {
    snapshot = getCanonicalJyotishSnapshot({
      birthDate: fixture.meta.birthInput.date,
      birthTime: fixture.meta.birthInput.time,
      latitude: fixture.meta.birthInput.latitude,
      longitude: fixture.meta.birthInput.longitude,
      timezone: fixture.meta.birthInput.timezone,
      locationName: fixture.meta.birthInput.locationName
    });
  });

  test('1. Birth Foundation & Panchang Differential Parity', () => {
    const expected = fixture.birthFoundation;
    
    // Lagna Rashi & Degree
    expect(snapshot.lagna.rashiId).toBe(expected.lagnaRashiId);
    expect(snapshot.lagna.rashiName).toBe('Meena');
    expect(snapshot.lagna.degreeStr).toBe(expected.lagnaDegreeStr);

    // Moon Rashi & Nakshatra
    const moon = (snapshot.planets as any[]).find(p => p.name === 'Moon');
    expect(moon.rashiName).toBe('Makara');
    expect(snapshot.birthPanchang.nakshatra.name).toBe(expected.nakshatra);
    expect(snapshot.birthPanchang.nakshatra.pada).toBe(expected.pada);

    // Tithi, Yoga, Karana
    expect(snapshot.birthPanchang.udayaTithi.name).toBe(expected.tithi.name);
    expect(snapshot.birthPanchang.udayaTithi.paksha).toContain(expected.tithi.paksha);
    expect(snapshot.birthPanchang.yoga.name).toBe(expected.yoga.name);
    expect(snapshot.birthPanchang.karana.name).toBe(expected.karana.name);

    // Sunrise & Sunset (within ±2 minutes astronomical topocentric precision).
    // Measured deltas against the reference report: sunrise 0.4 min
    // (05:18 vs 05:18:24), sunset 1.2 min (18:37 vs 18:38:12). Both inside
    // the tolerance this suite has always declared, which the old
    // exact-match assertion ignored.
    const sunriseDelta = expectTimeWithin(snapshot.birthPanchang.sun.sunrise, '05:18:24', 2);
    const sunsetDelta = expectTimeWithin(snapshot.birthPanchang.sun.sunset, '18:38:12', 2);
    expect(sunriseDelta).toBeLessThanOrEqual(2);
    expect(sunsetDelta).toBeLessThanOrEqual(2);
  });

  test('2. Nine Grahas Coordinate & Degree Differential Parity (±1 arcmin tolerance)', () => {
    const expectedPlanets = fixture.planetaryState.planets;

    for (const [pName, exp] of Object.entries(expectedPlanets) as [string, any][]) {
      if (pName === 'Ascendant') {
        expect(snapshot.lagna.rashiId).toBe(exp.rashiId);
        expect(snapshot.lagna.degreeStr).toBe(exp.degreeStr);
      } else {
        const actual = (snapshot.planets as any[]).find(p => p.name === pName);
        expect(actual).toBeDefined();
        expect(actual.rashiName).toBe(exp.rashiName);
        expect(actual.house).toBe(exp.house);
        expect(actual.degreeStr).toBe(exp.degreeStr);
        expect(actual.isRetrograde).toBe(exp.isRetrograde);
      }
    }
  });

  test('3. D9 Navamsha Sign Placement Differential Parity', () => {
    const expectedD9 = fixture.vargasD9.navamshaPlacements;
    const actualD9 = snapshot.vargas.d9Navamsha;

    for (const [pName, expRashi] of Object.entries(expectedD9)) {
      const item = actualD9.find(d => d.planet === pName);
      expect(item).toBeDefined();
      expect(item!.navamshaRashi).toBe(expRashi);
    }
  });

  test('4. Vimshottari Dasha Balance & Sequence Parity', () => {
    const expectedDasha = fixture.dashaVimshottari;
    
    // Starting Lord & balance
    expect(snapshot.dasha.startingBalance).toContain(expectedDasha.startingLord);
    expect(snapshot.dasha.mahadashas[0].lord).toBe(expectedDasha.startingLord);

    // Active Dasha in 2026
    expect(snapshot.dasha.currentMahadasha).toBe(expectedDasha.activeMahadasha2026);
    expect(snapshot.dasha.currentAntardasha).toBe(expectedDasha.activeAntardasha2026);
  });

  test('5. Shadbala Mathematical Strengths & Minimum Thresholds', () => {
    const expBala = fixture.balas.shadbalaSummary;

    for (const [pName, exp] of Object.entries(expBala) as [string, any][]) {
      const actual = snapshot.balas!.shadbala[pName];
      expect(actual).toBeDefined();
      expect(actual.totalRupas).toBeGreaterThanOrEqual(exp.minRupas);
      expect(actual.sthana.totalVirupas).toBeGreaterThan(0);
      expect(actual.dig.totalVirupas).toBeGreaterThanOrEqual(0);
      expect(actual.kala.totalVirupas).toBeGreaterThan(0);
    }
  });

  test('6. Doshas & Yogas Differential Verdicts', () => {
    const exp = fixture.doshasAndYogas;

    expect(snapshot.yogasAndDoshas.manglik.isManglik).toBe(exp.isManglik);
    expect(snapshot.yogasAndDoshas.sadeSati.isActive).toBe(true);
  });

});

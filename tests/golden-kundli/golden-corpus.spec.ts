import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { calculatePanchang } from '../../src/lib/panchang.js';
import kundliFixtures from './fixtures/kundli-fixtures.json';
import panchangFixtures from './fixtures/panchang-fixtures.json';

test.describe('Golden Kundli & Panchang 30-Fixture Verification Suite', () => {

  test.describe('10 Reference Kundli Benchmark Tests', () => {
    for (const fixture of kundliFixtures) {
      test(`[Kundli ${fixture.id}] ${fixture.name} (${fixture.referenceSoftware})`, () => {
        const snapshot = getCanonicalJyotishSnapshot({
          birthDate: fixture.birthDate,
          birthTime: fixture.birthTime,
          latitude: fixture.latitude,
          longitude: fixture.longitude,
          timezone: fixture.timezone,
          locationName: fixture.locationName
        });

        // 1. Verify Snapshot Structure Completeness
        expect(snapshot.meta.julianDay).toBeGreaterThan(2400000);
        expect(snapshot.meta.ayanamshaValue).toBeGreaterThan(20.0);
        expect(snapshot.planetsArray.length).toBe(9);
        expect(snapshot.houses.length).toBe(12);
        expect(snapshot.dasha.mahadashas.length).toBe(9);
        expect(snapshot.vargas.d9Navamsha.length).toBe(9);

        // 2. Verify Reference Expectations
        if (fixture.expected.lagnaRashi) {
          expect(snapshot.lagna.rashiName).toBe(fixture.expected.lagnaRashi);
        }
        if (fixture.expected.moonRashi) {
          expect(snapshot.planets.Moon.rashiName).toBe(fixture.expected.moonRashi);
        }
        if (fixture.expected.sunRashi) {
          expect(snapshot.planets.Sun.rashiName).toBe(fixture.expected.sunRashi);
        }
        if (fixture.expected.moonNakshatra) {
          expect(snapshot.planets.Moon.nakshatra.name).toBe(fixture.expected.moonNakshatra);
        }
        if (fixture.expected.lagnaNakshatra) {
          expect(snapshot.lagna.nakshatra.name).toBe(fixture.expected.lagnaNakshatra);
        }
      });
    }
  });

  test.describe('20 Reference Panchang Benchmark Tests', () => {
    for (const pFixture of panchangFixtures) {
      test(`[Panchang ${pFixture.id}] ${pFixture.label} (${pFixture.city})`, () => {
        const d = new Date(pFixture.dateStr);
        const pRes = calculatePanchang(d, {
          lat: pFixture.lat,
          lng: pFixture.lng,
          tz: pFixture.tz,
          name: pFixture.city
        });

        // Verify 5 Limbs of Panchanga
        expect(pRes.tithi.number).toBeGreaterThanOrEqual(1);
        expect(pRes.tithi.number).toBeLessThanOrEqual(30);
        expect(pRes.nakshatra.name).toBeDefined();
        expect(pRes.nakshatra.pada).toBeGreaterThanOrEqual(1);
        expect(pRes.nakshatra.pada).toBeLessThanOrEqual(4);
        expect(pRes.yoga.name).toBeDefined();
        expect(pRes.karana.name).toBeDefined();
        expect(pRes.sun.sunrise).toBeDefined();
        expect(pRes.sun.sunset).toBeDefined();
        expect(pRes.timings.rahuKalam).toBeDefined();
      });
    }
  });

});

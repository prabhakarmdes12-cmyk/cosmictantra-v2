import { test, expect } from '@playwright/test';
import {
  calculateCanonicalBody,
  calculateCanonicalBodies,
  getLahiriAyanamsha,
  normalizeAngle,
} from '../src/lib/astronomy/canonicalBodies';
import {
  ECLIPTIC_NAKSHATRAS,
  getNakshatraForLongitude,
  getRashiForLongitude,
  getRashiIndex,
  plotEclipticPosition,
  tropicalToSiderealLongitude,
} from '../src/lib/astronomy/eclipticProjection';
import { localSiderealTime, projectStar, SiderealTime } from '../src/lib/astronomy/projection';
import { CONTEXT_STARS, contextStarsForZoom } from '../src/lib/astronomy/contextStars';
import { STARS } from '../src/lib/astronomy/stars';
import { getCelestialDetail, getConstellationDetail, parseCelestialSelection, PLANET_DETAILS } from '../src/lib/astronomy/celestialCatalog';
import { altitudeBand, angularSeparationDeg, calculateMoonPhase, calculateSolarDayEvents, compassDirection, findNextHorizonEvent, isAboveObservationHorizon, isWithinLimitingMagnitude, OBSERVATION_LIMITS, planObservation, skyLightState, summarizeObservations } from '../src/lib/astronomy/observation';
import { applyViewportTransform, clampViewportTransform, DEFAULT_VIEWPORT_TRANSFORM, zoomViewportAt } from '../src/lib/astronomy/viewTransform';
import { localEphemerisResult } from '../src/lib/astronomy/providers/localApproximation';
import { compareWithReference, findReferenceObservation, MISSING_REFERENCE_FIXTURE_STATUS, parseReferenceFixture, referenceFixtureStatus } from '../src/lib/astronomy/providers/referenceFixture';
import { createObservationLogEntry, observationLogToCsv, parseObservationLog, serializeObservationLog, type ObservationLogDraft } from '../src/lib/astronomy/observationLog';

test.describe('Observatory coordinate and ephemeris invariants', () => {
  const instant = new Date('2026-08-25T00:00:00.000Z');

  test('the bright-star catalogue contains 70 typed J2000 anchors', () => {
    expect(STARS).toHaveLength(70);
    expect(STARS.find(star => star.id === 'sirius')?.raHours).toBeCloseTo(6.7525, 3);
    expect(STARS.every(star => Number.isFinite(star.raHours) && Number.isFinite(star.decDeg))).toBe(true);
  });

  test('zoomed sky detail is deterministic and progressively denser', () => {
    expect(CONTEXT_STARS).toHaveLength(900);
    expect(contextStarsForZoom(1)).toHaveLength(0);
    expect(contextStarsForZoom(1.3)).toHaveLength(220);
    expect(contextStarsForZoom(2)).toHaveLength(560);
    expect(contextStarsForZoom(4)).toHaveLength(900);
    expect(CONTEXT_STARS.every(star => star.raHours >= 0 && star.raHours < 24 && star.decDeg >= -90 && star.decDeg <= 90)).toBe(true);
    expect(new Set(CONTEXT_STARS.map(star => star.id)).size).toBe(900);
  });

  test('sidereal time is expressed in a 24-hour range', () => {
    expect(SiderealTime(instant)).toBeGreaterThanOrEqual(0);
    expect(SiderealTime(instant)).toBeLessThan(24);
    expect(localSiderealTime(instant, 82.9739)).toBeGreaterThanOrEqual(0);
    expect(localSiderealTime(instant, 82.9739)).toBeLessThan(24);
  });

  test('a J2000 star projects to a finite sky point', () => {
    const point = projectStar(STARS[0], instant, { latitude: 25.3176, longitude: 82.9739 }, 600, 600);
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
    expect(Number.isFinite(point.altitudeDeg)).toBe(true);
    expect(Number.isFinite(point.azimuthDeg)).toBe(true);
  });

  test('tropical longitude converts to sidereal without leaving the circle', () => {
    expect(tropicalToSiderealLongitude(10, 24)).toBeCloseTo(346, 8);
    expect(tropicalToSiderealLongitude(359, 24)).toBeCloseTo(335, 8);
    expect(tropicalToSiderealLongitude(-1, 24)).toBeCloseTo(335, 8);
  });

  test('rashi boundaries are half-open and wrap at Pisces', () => {
    expect(getRashiIndex(0)).toBe(0);
    expect(getRashiIndex(29.999)).toBe(0);
    expect(getRashiIndex(30)).toBe(1);
    expect(getRashiIndex(359.999)).toBe(11);
    expect(getRashiForLongitude(360).name).toBe('Mesha');
  });

  test('rashi descriptors include glyph and 30-degree extent', () => {
    const rashi = getRashiForLongitude(124.5);
    expect(rashi.name).toBe('Simha');
    expect(rashi.englishName).toBe('Leo');
    expect(rashi.glyph).toBe('♌');
    expect(rashi.endDeg - rashi.startDeg).toBe(30);
  });

  test('27 nakshatra sectors and four padas are deterministic', () => {
    expect(ECLIPTIC_NAKSHATRAS).toHaveLength(27);
    expect(getNakshatraForLongitude(0).name).toBe('Ashwini');
    expect(getNakshatraForLongitude(13.34).name).toBe('Bharani');
    expect(getNakshatraForLongitude(3.2).pada).toBe(1);
    expect(getNakshatraForLongitude(13.2).pada).toBe(4);
  });

  test('planisphere plotting puts zero longitude at the top', () => {
    const top = plotEclipticPosition(0, 100, 100, 50);
    const opposite = plotEclipticPosition(180, 100, 100, 50);
    expect(top.x).toBeCloseTo(100, 8);
    expect(top.y).toBeCloseTo(50, 8);
    expect(opposite.x).toBeCloseTo(100, 8);
    expect(opposite.y).toBeCloseTo(150, 8);
  });

  test('planisphere points retain the requested radius', () => {
    const point = plotEclipticPosition(217.25, 240, 180, 92);
    expect(Math.hypot(point.x - 240, point.y - 180)).toBeCloseTo(92, 8);
    expect(point.angleDeg).toBeCloseTo(217.25, 8);
  });

  test('all canonical visible bodies expose tropical and sidereal longitudes', () => {
    const bodies = calculateCanonicalBodies(instant);
    expect(bodies).toHaveLength(9);
    bodies.forEach(body => {
      expect(body.tropicalLongitude).toBeGreaterThanOrEqual(0);
      expect(body.tropicalLongitude).toBeLessThan(360);
      expect(body.siderealLongitude).toBeGreaterThanOrEqual(0);
      expect(body.siderealLongitude).toBeLessThan(360);
      expect(body.rightAscensionHours).toBeGreaterThanOrEqual(0);
      expect(body.rightAscensionHours).toBeLessThan(24);
    });
  });

  test('Rahu and Ketu use the explicit mean-node path and stay opposite', () => {
    const rahu = calculateCanonicalBody('Rahu', instant);
    const ketu = calculateCanonicalBody('Ketu', instant);
    expect(rahu.source).toBe('mean-node');
    expect(ketu.source).toBe('mean-node');
    expect(rahu.isRetrograde).toBe(true);
    expect(ketu.isRetrograde).toBe(true);
    expect(normalizeAngle(ketu.tropicalLongitude - rahu.tropicalLongitude)).toBeCloseTo(180, 8);
    expect(normalizeAngle(ketu.siderealLongitude - rahu.siderealLongitude)).toBeCloseTo(180, 8);
  });

  test('node aliases and object form resolve to the same canonical answer', () => {
    const rahu = calculateCanonicalBody('ascending-node', instant);
    const objectForm = calculateCanonicalBody({ body: 'Ketu', date: instant });
    expect(rahu.body).toBe('Rahu');
    expect(objectForm.body).toBe('Ketu');
    expect(getLahiriAyanamsha(2451545)).toBeCloseTo(23.856, 5);
  });

  test('every selectable graha has an image-ready detail record', () => {
    expect(Object.keys(PLANET_DETAILS)).toHaveLength(9);
    Object.values(PLANET_DETAILS).forEach(detail => {
      expect(detail.imageAlt.length).toBeGreaterThan(20);
      expect(detail.astronomy.length).toBeGreaterThan(40);
      expect(detail.imageCredit.length).toBeGreaterThan(5);
    });
  });

  test('constellation selections resolve from a catalogue star', () => {
    const detail = getConstellationDetail('Ori');
    expect(getCelestialDetail({ kind: 'constellation', id: 'Ori' }).displayName).toBe('Orion');
    expect(detail.kind).toBe('constellation');
    expect(detail.featuredStars).toContain('Betelgeuse');
  });

  test('detail deep links accept known planets and constellations only', () => {
    expect(parseCelestialSelection('moon', 'planet')).toEqual({ kind: 'planet', id: 'Moon' });
    expect(parseCelestialSelection('Ori', 'constellation')).toEqual({ kind: 'constellation', id: 'Ori' });
    expect(parseCelestialSelection('not-a-body', 'planet')).toBeNull();
    expect(parseCelestialSelection('Ori', 'planet')).toBeNull();
  });

  test('display zoom preserves a point under the chosen focus', () => {
    const current = { ...DEFAULT_VIEWPORT_TRANSFORM };
    const next = zoomViewportAt(current, 2, { x: 180, y: 120 }, 600, 480);
    const point = { x: 300, y: 240 };
    const before = applyViewportTransform(point, 600, 480, current);
    const after = applyViewportTransform(point, 600, 480, next);
    expect(before.x).not.toBeCloseTo(after.x, 3);
    const focusBefore = applyViewportTransform({ x: 180, y: 120 }, 600, 480, current);
    const focusAfter = applyViewportTransform({ x: 180, y: 120 }, 600, 480, next);
    expect(focusBefore.x).toBeCloseTo(focusAfter.x, 8);
    expect(focusBefore.y).toBeCloseTo(focusAfter.y, 8);
    expect(clampViewportTransform({ scale: 20, offsetX: 9999, offsetY: -9999 }, 600, 480).scale).toBe(4);
  });

  test('observation helpers expose honest local planning signals', () => {
    const observer = { latitude: 25.3176, longitude: 82.9739 };
    const events = calculateSolarDayEvents(instant, observer, 5.5);
    expect(events.approximate).toBe(true);
    expect(events.localDate).toBe('2026-08-25');
    expect(events.sunrise).not.toBeNull();
    expect(events.sunset).not.toBeNull();
    expect(skyLightState(10)).toBe('daylight');
    expect(skyLightState(-9)).toBe('nautical twilight');
    expect(compassDirection(0)).toBe('N');
    expect(compassDirection(90)).toBe('E');
    expect(altitudeBand(60)).toBe('high');
    expect(altitudeBand(-2)).toBe('below horizon');
    expect(summarizeObservations(instant, observer)).toHaveLength(7);
  });

  test('Moon phase is bounded and derived from the Sun–Moon angle', () => {
    const phase = calculateMoonPhase(instant);
    expect(phase.angleDeg).toBeGreaterThanOrEqual(0);
    expect(phase.angleDeg).toBeLessThan(360);
    expect(phase.fraction).toBeGreaterThanOrEqual(0);
    expect(phase.fraction).toBeLessThan(1);
    expect(phase.illumination).toBeGreaterThanOrEqual(0);
    expect(phase.illumination).toBeLessThanOrEqual(1);
  });

  test('observation filters keep masking and limiting-magnitude semantics explicit', () => {
    expect(OBSERVATION_LIMITS.minimumAltitudeDeg.max).toBe(20);
    expect(OBSERVATION_LIMITS.limitingMagnitude.step).toBe(0.5);
    expect(isAboveObservationHorizon(0, 0)).toBe(true);
    expect(isAboveObservationHorizon(-0.1, 0)).toBe(false);
    expect(isAboveObservationHorizon(8, 10)).toBe(false);
    expect(isAboveObservationHorizon(10, 10)).toBe(true);
    expect(isWithinLimitingMagnitude(4.5, 4.5)).toBe(true);
    expect(isWithinLimitingMagnitude(4.51, 4.5)).toBe(false);
    expect(isWithinLimitingMagnitude(Number.NaN, 4.5)).toBe(false);
  });

  test('the observation planner provides bounded physical-body windows and node exceptions', () => {
    const observer = { latitude: 25.3176, longitude: 82.9739 };
    const sun = planObservation(instant, observer, 'Sun');
    const rahu = planObservation(instant, observer, 'Rahu');
    expect(sun.body.body).toBe('Sun');
    expect(sun.nextHorizonEvent).not.toBeNull();
    expect(sun.nextHorizonEvent?.approximate).toBe(true);
    expect(sun.nextHorizonEvent?.time.getTime()).toBeGreaterThanOrEqual(instant.getTime());
    expect(rahu.horizontal).toBeNull();
    expect(rahu.direction).toBeNull();
    expect(rahu.nextHorizonEvent).toBeNull();
    expect(rahu.lunarSeparationDeg).toBeNull();
    expect(sun.nextHorizonEvent?.kind).toBe('rise');
    expect(angularSeparationDeg(sun.body, sun.body)).toBeCloseTo(0, 8);
    expect(angularSeparationDeg({ rightAscensionHours: 0, declinationDeg: 0 }, { rightAscensionHours: 12, declinationDeg: 0 })).toBeCloseTo(180, 8);
    expect(angularSeparationDeg({ rightAscensionHours: 23.9, declinationDeg: 0 }, { rightAscensionHours: 0.1, declinationDeg: 0 })).toBeCloseTo(3, 8);
    expect(findNextHorizonEvent(instant, observer, 'Ketu')).toBeNull();
  });

  test('observation logs round-trip locally and export escaped study fields', () => {
    const observer = { latitude: 25.3176, longitude: 82.9739 };
    const plan = planObservation(instant, observer, 'Jupiter');
    const draft: ObservationLogDraft = {
      observedAt: instant.toISOString(),
      cityId: 'varanasi',
      cityName: 'Varanasi',
      observer,
      timezoneOffsetHours: 5.5,
      body: plan.body.body,
      source: plan.body.source,
      physicalSky: Boolean(plan.horizontal),
      altitudeDeg: plan.horizontal?.altitudeDeg ?? null,
      azimuthDeg: plan.horizontal?.azimuthDeg ?? null,
      direction: plan.direction,
      altitudeBand: plan.altitudeBand,
      tropicalLongitude: plan.body.tropicalLongitude,
      siderealLongitude: plan.body.siderealLongitude,
      rashi: 'Mithuna',
      nakshatra: 'Ardra',
      pada: 2,
      lunarSeparationDeg: plan.lunarSeparationDeg,
      moonPhase: 'Waxing Crescent',
      status: 'observed',
      note: 'Clear, steady seeing; ask "why?"',
    };
    const entry = createObservationLogEntry(draft, 'entry-1', '2026-08-25T00:01:00.000Z');
    const longEntry = createObservationLogEntry({ ...draft, note: 'x'.repeat(1500) }, 'entry-2', '2026-08-25T00:02:00.000Z');
    expect(entry.note).toBe('Clear, steady seeing; ask "why?"');
    expect(longEntry.note).toHaveLength(1200);
    expect(parseObservationLog(serializeObservationLog([entry]))).toEqual([entry]);
    expect(parseObservationLog('not-json')).toEqual([]);
    expect(parseObservationLog(JSON.stringify([entry, { broken: true }]))).toHaveLength(1);
    expect(parseObservationLog(JSON.stringify([{ ...entry, body: 'Rahu', source: 'mean-node', physicalSky: true }]))).toEqual([]);
    const csv = observationLogToCsv([entry]);
    expect(csv).toContain('"Clear, steady seeing; ask ""why?"""');
    expect(csv.split('\n')).toHaveLength(2);
  });

  test('local ephemeris adapts to the shared provenance contract', () => {
    const moon = localEphemerisResult('Moon', instant, { latitude: 25.3176, longitude: 82.9739 });
    const rahu = localEphemerisResult('Rahu', instant);
    expect(moon.provenance.provider).toBe('local-approximation');
    expect(moon.provenance.quality).toBe('illustrative');
    expect(moon.provenance.model).toContain('lunar');
    expect(moon.provenance.epochUtc).toBe(instant.toISOString());
    expect(rahu.provenance.note).toContain('Mathematical lunar node');
  });

  test('reference fixture boundary fails closed until a reviewed fixture exists', () => {
    expect(referenceFixtureStatus(undefined)).toEqual(MISSING_REFERENCE_FIXTURE_STATUS);
    expect(parseReferenceFixture(null)).toBeNull();
    expect(parseReferenceFixture({ schemaVersion: 1, fixtureId: 'untrusted' })).toBeNull();
  });

  test('reviewed fixture schema keeps frame and body observations explicit', () => {
    const fixture = parseReferenceFixture({
      schemaVersion: 1,
      fixtureId: 'observatory-test-fixture',
      generatedAt: '2026-08-26T00:00:00.000Z',
      epochUtc: instant.toISOString(),
      timeScale: 'UTC',
      center: '500@399 (geocentric)',
      frame: 'ICRF',
      plane: 'ecliptic',
      apparent: true,
      refraction: false,
      quantities: '1,31,33',
      sourceUrl: 'https://ssd.jpl.nasa.gov/horizons/',
      reviewNote: 'Test fixture only.',
      observations: [{ body: 'Sun', epochUtc: instant.toISOString(), longitudeDeg: 152.4, latitudeDeg: 0, rightAscensionHours: 10.2, declinationDeg: 11.5 }],
    });
    expect(fixture).not.toBeNull();
    expect(referenceFixtureStatus(fixture).available).toBe(true);
    expect(findReferenceObservation(fixture, 'Sun', instant.toISOString())?.longitudeDeg).toBe(152.4);
    const comparison = compareWithReference(localEphemerisResult('Sun', instant), fixture);
    expect(comparison.available).toBe(true);
    expect(comparison.errors?.longitudeDeg).toBeGreaterThanOrEqual(0);
    expect(compareWithReference(localEphemerisResult('Rahu', instant), fixture).available).toBe(false);
    expect(parseReferenceFixture({ ...(fixture as object), observations: [{ body: 'Rahu', epochUtc: instant.toISOString(), longitudeDeg: 1, latitudeDeg: 0 }] })).toBeNull();
  });
});

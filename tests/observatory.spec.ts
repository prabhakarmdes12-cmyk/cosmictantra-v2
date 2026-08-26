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
import { STARS } from '../src/lib/astronomy/stars';
import { getCelestialDetail, getConstellationDetail, parseCelestialSelection, PLANET_DETAILS } from '../src/lib/astronomy/celestialCatalog';
import { altitudeBand, calculateMoonPhase, calculateSolarDayEvents, compassDirection, skyLightState, summarizeObservations } from '../src/lib/astronomy/observation';
import { applyViewportTransform, clampViewportTransform, DEFAULT_VIEWPORT_TRANSFORM, zoomViewportAt } from '../src/lib/astronomy/viewTransform';

test.describe('Observatory coordinate and ephemeris invariants', () => {
  const instant = new Date('2026-08-25T00:00:00.000Z');

  test('the bright-star catalogue contains 70 typed J2000 anchors', () => {
    expect(STARS).toHaveLength(70);
    expect(STARS.find(star => star.id === 'sirius')?.raHours).toBeCloseTo(6.7525, 3);
    expect(STARS.every(star => Number.isFinite(star.raHours) && Number.isFinite(star.decDeg))).toBe(true);
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
});

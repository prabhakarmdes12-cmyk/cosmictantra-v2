import { test, expect } from '@playwright/test';
import { calculateKundali } from '../../src/lib/astrologyEngine.js';
import { createObservatoryTime } from '../../src/lib/astronomy/time';
import { calculateCanonicalBody } from '../../src/lib/astronomy/ephemeris';

test('OBS_INV_001: Observatory Moon preserves canonical Jyotish classification', () => {
  const location = { name: 'Dhanbad, Jharkhand', latitude: 23.7957, longitude: 86.4304, timezone: 'Asia/Kolkata', source: 'catalogue' as const };
  const instant = new Date('2026-08-25T21:11:00.000Z'); // 26 Aug 02:41 IST
  const time = createObservatoryTime(instant, location);
  const moon = calculateCanonicalBody('Moon', time);
  const direct = calculateKundali('2026-08-26', '02:41', 23.7957, 86.4304, 5.5);
  expect(moon.siderealLongitude.value).toBeCloseTo(direct.planets.Moon.longitude, 10);
  expect(moon.rashi).toBe(direct.planets.Moon.rasiName);
  expect(moon.nakshatra.name).toBe(direct.planets.Moon.nakshatra.name);
  expect(moon.nakshatra.pada).toBe(direct.planets.Moon.nakshatra.pada);
  expect(moon.tropicalLongitude.source).toContain('Astronomy Engine');
  expect(Number.isFinite(moon.scientific?.altitude)).toBeTruthy();
  expect(moon.crossEngine.canonicalSidereal).toBeCloseTo(direct.planets.Moon.longitude, 10);
});

test('OBS_INV_003: one UTC instant has one Julian date regardless of observer zone', () => {
 const instant = new Date('2026-08-25T21:11:00.000Z');
 const india = createObservatoryTime(instant, { name:'Dhanbad', latitude:23.7957, longitude:86.4304, timezone:'Asia/Kolkata', source:'catalogue' });
 const london = createObservatoryTime(instant, { name:'London', latitude:51.5074, longitude:-.1278, timezone:'Europe/London', source:'catalogue' });
 expect(india.utcInstant).toBe(london.utcInstant); expect(india.julianDate).toBe(london.julianDate); expect(india.userLocalTime).not.toBe(london.userLocalTime);
});

test('astronomical horizon events are deterministic and observer-dependent', () => {
  const { calculateRiseTransitSet } = require('../../src/lib/astronomy/events');
  const instant = new Date('2026-08-25T21:11:00.000Z');
  const dhanbad = { name:'Dhanbad', latitude:23.7957, longitude:86.4304, timezone:'Asia/Kolkata', source:'catalogue' };
  const london = { name:'London', latitude:51.5074, longitude:-.1278, timezone:'Europe/London', source:'catalogue' };
  const a = calculateRiseTransitSet('Moon', instant, dhanbad); const b = calculateRiseTransitSet('Moon', instant, london);
  expect(a.source).toContain('Astronomy Engine'); expect(a.observerDependent).toBeTruthy(); expect(a.rise).toBeTruthy(); expect(a.transit).toBeTruthy(); expect(a.set).toBeTruthy(); expect(a.rise).not.toBe(b.rise);
});

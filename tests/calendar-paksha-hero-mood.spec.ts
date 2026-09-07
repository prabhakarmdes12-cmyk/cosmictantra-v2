/**
 * Calendar Paksha "hero mood" — regression suite.
 *
 * Guards the Paksha hero-mood integration shipped from the arena calendar work
 * (Krishna-Indigo vs Shukla-Marigold banner + "शुभ रात्रि/दिवस 🙏" seal).
 *
 * REGRESSION (arena calendar integration): the banner previously derived the
 * mood from `tithi.name`, but the deterministic engine reports the bare tithi
 * as `name` ("Dwadashi") and reserves the paksha for `tithi.paksha` /
 * `tithi.fullName` ("Krishna Paksha" / "Krishna Paksha Dwadashi").  A bare
 * name never contains "krishna", so every day rendered with the Shukla
 * marigold mood and the seal falsely claimed "शुक्ल पक्ष" for half the lunar
 * month.  Resolution must come from paksha/fullName, never from name alone.
 */

import { test, expect } from '@playwright/test';
import { calculatePanchang } from '../src/lib/panchang.js';
import { resolvePakshaMood, resolveTithiDisplayName, PakshaMood } from '../src/lib/panchang/pakshaTheme';

const VARANASI = { lat: 25.3176, lng: 82.9739, tz: 5.5, name: 'Varanasi' };
const DHANBAD = { lat: 23.7957, lng: 86.4304, tz: 5.5, name: 'Dhanbad' };

/** Pure (non-browser) regression suite — see calendar-paksha-hero-mood-browser.spec.ts for the UI check. */

function assertConsistentWithEngine(tithi: any) {
  const mood = resolvePakshaMood(tithi);
  const expectedKrishna = tithi.paksha === 'Krishna Paksha';
  expect(mood.isKrishna, `mood.isKrishna for ${JSON.stringify(tithi)}`).toBe(expectedKrishna);
  expect(mood.isShukla).toBe(!expectedKrishna);
}

test.describe('resolvePakshaMood — engine object shape (regression)', () => {
  test('Krishna tithi object (bare name, structured paksha) is Krishna — the exact regression case', () => {
    // 2026-08-30 in Dhanbad is Krishna Paksha Dwitiya/Tritiya (existing engine fixture).
    const p = calculatePanchang(new Date('2026-08-30T04:05:20+05:30'), DHANBAD);
    expect(p.tithi.paksha).toBe('Krishna Paksha');

    const mood = resolvePakshaMood(p.tithi);
    expect(mood.isKrishna).toBe(true);
    expect(mood.isShukla).toBe(false);

    // The regression: a bare name must NOT flip the mood to Shukla.
    const bareNameMood = resolvePakshaMood({ name: p.tithi.name, paksha: 'Krishna Paksha' });
    expect(bareNameMood.isKrishna).toBe(true);

    // Display name must be the qualified fullName, not the bare name.
    expect(resolveTithiDisplayName(p.tithi)).toBe('Krishna Paksha ' + p.tithi.name);
  });

  test('Shukla tithi object resolves as Shukla', () => {
    // Ganesh Chaturthi window: Shukla Paksha in Bhadrapada (September 2026).
    const p = calculatePanchang(new Date('2026-09-12T10:00:00+05:30'), VARANASI);
    expect(p.tithi.paksha).toBe('Shukla Paksha');

    const mood = resolvePakshaMood(p.tithi);
    expect(mood.isShukla).toBe(true);
    expect(mood.isKrishna).toBe(false);
  });

  test('Engine invariant: mood matches tithi.paksha for a 60-day sweep', () => {
    for (let i = 0; i < 60; i++) {
      const d = new Date('2026-08-01T09:30:00+05:30');
      d.setDate(d.getDate() + i);
      const p = calculatePanchang(d, VARANASI);
      assertConsistentWithEngine(p.tithi);
    }
  });

  test('Devanagari fullName is recognised', () => {
    expect(resolvePakshaMood({ fullName: 'कृष्ण पक्ष द्वादशी' }).isKrishna).toBe(true);
    expect(resolvePakshaMood({ fullName: 'शुक्ल पक्ष प्रतिपदा' }).isShukla).toBe(true);
  });

  test('Legacy plain-string inputs are honoured', () => {
    expect(resolvePakshaMood('Krishna Paksha Dwadashi').isKrishna).toBe(true);
    expect(resolvePakshaMood('Shukla Paksha Pratipada').isShukla).toBe(true);
  });

  test('Unknown input does not fabricate a paksha claim', () => {
    const mood = resolvePakshaMood({ name: 'Dwadashi' }) as PakshaMood;
    expect(mood.isKrishna).toBe(false);
    expect(mood.isShukla).toBe(false);
    expect(resolvePakshaMood(null).isKrishna).toBe(false);
    expect(resolvePakshaMood(undefined).isShukla).toBe(false);
  });
});

/**
 * V40.1 GATE 6 — degrees, minutes and seconds (§9).
 *
 * The brief asks for DMS on the Pandit-facing pages and decimals only in the
 * appendix, and asks specifically that the conversion be verified
 * MECHANICALLY rather than by reading a few examples off a page. Rounding at a
 * 59.9-arcminute boundary is exactly the kind of bug that survives eyeballing:
 * 12.9999 must not print as 12°60′.
 */

import { test, expect } from '@playwright/test';
import { dm, dms } from '../../src/lib/kundli/v40/format';
import { goldenV3Artifact } from './qa/artifact';

const DEG = '\u00B0';
const PRIME = '\u2032';
const DOUBLE_PRIME = '\u2033';

/** Independent re-derivation: decimal degrees back out of a DMS string. */
function parseDms(s: string): number {
  const m = /^(-?\d+)\u00B0(?:(\d+)\u2032)?(?:(\d+)\u2033)?$/.exec(s.trim());
  if (!m) throw new Error(`not a DMS string: ${JSON.stringify(s)}`);
  const d = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const sec = Number(m[3] ?? 0);
  const mag = Math.abs(d) + min / 60 + sec / 3600;
  return d < 0 || Object.is(d, -0) ? -mag : mag;
}

test.describe('the conversion is arithmetic, not formatting', () => {
  test('worked examples', () => {
    expect(dm(12.1)).toBe(`12${DEG}06${PRIME}`);
    expect(dm(0)).toBe(`0${DEG}00${PRIME}`);
    expect(dm(29.86)).toBe(`29${DEG}52${PRIME}`);
    expect(dms(11.72)).toBe(`11${DEG}43${PRIME}12${DOUBLE_PRIME}`);
  });

  test('minutes and seconds are always two digits', () => {
    // "12°6′" mis-sorts and mis-aligns in a table column.
    for (let i = 0; i < 2000; i += 1) {
      const v = (i * 0.0173) % 30;
      expect(dm(v), `dm(${v})`).toMatch(/^\d+\u00B0\d{2}\u2032$/);
      expect(dms(v), `dms(${v})`).toMatch(/^\d+\u00B0\d{2}\u2032\d{2}\u2033$/);
    }
  });

  test('no output ever carries 60 minutes or 60 seconds', () => {
    // The carry bug. 12.99999 degrees is 12°59.9994′, which rounds to 13°00′,
    // never to 12°60′.
    const nasty = [
      12.999999, 0.9999999, 29.9999999, 11.9999, 5.008333, 5.00833333,
      0.0166666, 0.016666666, 359.999999, 12.99166666, 12.99999999999,
    ];
    for (const v of nasty) {
      expect(dm(v), `dm(${v})`).not.toMatch(/60\u2032/);
      expect(dms(v), `dms(${v})`).not.toMatch(/60[\u2032\u2033]/);
    }
    for (let i = 0; i < 5000; i += 1) {
      const v = i / 5000 * 30;
      expect(dm(v)).not.toMatch(/60\u2032/);
      expect(dms(v)).not.toMatch(/60[\u2032\u2033]/);
    }
  });

  test('round-tripping DMS back to degrees lands within half the last unit', () => {
    for (let i = 0; i < 3000; i += 1) {
      const v = (i * 0.0097) % 30;
      // dm() rounds to the nearest arcminute: error must be under 30 arcsec.
      expect(Math.abs(parseDms(dm(v)) - v), `dm(${v})`).toBeLessThanOrEqual(0.5 / 60 + 1e-9);
      // dms() rounds to the nearest arcsecond: error must be under 0.5 arcsec.
      expect(Math.abs(parseDms(dms(v)) - v), `dms(${v})`).toBeLessThanOrEqual(0.5 / 3600 + 1e-9);
    }
  });

  test('dms is never less precise than dm', () => {
    for (let i = 0; i < 1000; i += 1) {
      const v = (i * 0.031) % 30;
      const coarse = Math.abs(parseDms(dm(v)) - v);
      const fine = Math.abs(parseDms(dms(v)) - v);
      expect(fine, `at ${v}`).toBeLessThanOrEqual(coarse + 1e-9);
    }
  });
});

test.describe('the finished pages use DMS where a Pandit reads, decimals where an engineer does', () => {
  test('Part A shows degrees in DMS', async () => {
    const { result, inspection } = await goldenV3Artifact();
    const partAPages = result.pageTitles.findIndex((t) => /Scholar Appendix|Part B/i.test(t));
    const partA = inspection.pages.slice(0, partAPages).map((p) => p.text).join('\n');

    const dmsHits = partA.match(/\d+\u00B0\d{2}\u2032/g) ?? [];
    expect(dmsHits.length, 'Part A has no DMS at all').toBeGreaterThan(10);

    // Every graha longitude in the golden chart, as it must appear.
    for (const expected of ['29\u00B052\u2032', '28\u00B052\u2032', '16\u00B011\u2032', '11\u00B043\u2032', '12\u00B006\u2032']) {
      expect(partA, `${expected} missing from the consultation pages`).toContain(expected);
    }

    // And every one of them parses back to a real angle.
    for (const hit of dmsHits) {
      const v = parseDms(hit);
      expect(v, `${hit} is not a valid angle`).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(360);
    }
  });

  test('a bare decimal longitude never appears as a graha position in Part A', async () => {
    const { result, inspection } = await goldenV3Artifact();
    const partAPages = result.pageTitles.findIndex((t) => /Scholar Appendix|Part B/i.test(t));
    const partA = inspection.pages.slice(0, partAPages).map((p) => p.text).join('\n');

    // Latitude, longitude and the ayanamsha are coordinates and settings, not
    // graha positions, so they legitimately stay decimal.
    const allowed = ['25.5941\u00B0', '85.1376\u00B0', '23.7936\u00B0'];
    const decimals = (partA.match(/\d+\.\d+\u00B0/g) ?? []).filter((d) => !allowed.includes(d));
    expect(decimals, `decimal degrees left on a consultation page: ${decimals.join(', ')}`).toEqual([]);
  });

  test('the appendix keeps full precision', async () => {
    const { result, inspection } = await goldenV3Artifact();
    const partAPages = result.pageTitles.findIndex((t) => /Scholar Appendix|Part B/i.test(t));
    const partB = inspection.pages.slice(partAPages).map((p) => p.text).join('\n');
    // Canonical data must survive somewhere, or the report is not verifiable.
    expect(partB).toMatch(/\d+\.\d{4,}/);
  });
});

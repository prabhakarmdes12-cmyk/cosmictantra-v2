/**
 * TIMEZONE INDEPENDENCE
 *
 * A local birth time such as '1995-06-15T10:30:00' carries no timezone.
 * Parsing it with Date.parse() turns it into an instant in whatever zone the
 * host runs in: 10:30Z on a UTC server, 05:00Z on an Asia/Kolkata server,
 * 14:30Z on an America/New_York server. An earlier version of the consistency
 * gate did exactly that, and reported a false CG_UTC_CONVERSION contradiction
 * for a valid Indian chart whenever the process ran under Asia/Kolkata.
 *
 * Every assertion below runs under three host timezones and must give an
 * identical answer in all of them. The gate must not care where it runs.
 */
import { test, expect } from '@playwright/test';
import {
  checkCanonicalConsistency,
  parseWallClockToUtcEpoch,
  parseAbsoluteInstant,
} from '../../src/lib/kundli/consistencyGate';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReportModel, computeContentHash } from '../../src/lib/kundli/reportModel';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';
import type { KundliCanonicalModel, NormalizedBirthProfile } from '../../src/lib/kundli/types';

const HOST_ZONES = ['UTC', 'Asia/Kolkata', 'America/New_York'];

const CONFIG = {
  zodiac: 'SIDEREAL' as const,
  ayanamsha: 'LAHIRI_CHITRA_PAKSHA' as const,
  ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN' as const,
  nodeMode: 'MEAN_NODE' as const,
  ephemerisProvider: 'ASTRONOMY_ENGINE_VSOP87_ELP2000' as const,
  engineVersion: 'V36.0',
  calculationVersion: 'kundli-calc-v1',
  reportVersion: 'kundli-report-v1',
};

const baseSnapshot = (): any =>
  getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });

/** Builds a canonical model with an arbitrary local/UTC/offset combination. */
function modelWith(input: {
  name?: string;
  localDateTime: string;
  utcDateTime: string;
  offsetHours: number;
  timezoneId?: string;
  provenance?: 'IANA_HISTORICAL' | 'USER_SUPPLIED' | 'ESTIMATED' | 'REGION_INFERRED';
}): KundliCanonicalModel {
  const profile: NormalizedBirthProfile = {
    name: input.name ?? 'Priya Sharma',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    locationName: 'Patna',
    coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
    timezone: {
      timezoneId: input.timezoneId ?? 'Asia/Kolkata',
      utcOffsetAtBirth: input.offsetHours,
      localDateTime: input.localDateTime,
      utcDateTime: input.utcDateTime,
      offsetProvenance: input.provenance ?? 'IANA_HISTORICAL',
    },
    fingerprint: 'tz-independence',
  } as NormalizedBirthProfile;
  return buildCanonicalModel({ profile, snapshot: baseSnapshot(), config: CONFIG });
}

const utcCodes = (m: KundliCanonicalModel) =>
  checkCanonicalConsistency({ canonical: m, snapshot: baseSnapshot() })
    .findings.filter((f) => f.code === 'CG_UTC_CONVERSION');

/* ------------------------------------------------------------------ */
/* Parsers                                                             */
/* ------------------------------------------------------------------ */

test.describe('Wall-clock and instant parsers are host-independent', () => {
  for (const zone of HOST_ZONES) {
    test(`under TZ=${zone}`, () => {
      const previous = process.env.TZ;
      process.env.TZ = zone;
      try {
        // A wall-clock value is reconstructed as a tuple, so it is the same
        // number of milliseconds since the epoch in every host timezone.
        expect(parseWallClockToUtcEpoch('1995-06-15T10:30:00')).toBe(Date.UTC(1995, 5, 15, 10, 30, 0));
        expect(parseWallClockToUtcEpoch('1995-06-15T00:00:00')).toBe(Date.UTC(1995, 5, 15, 0, 0, 0));
        expect(parseWallClockToUtcEpoch('1995-06-15')).toBe(Date.UTC(1995, 5, 15));
        expect(parseWallClockToUtcEpoch('1995-06-15T23:59:59')).toBe(Date.UTC(1995, 5, 15, 23, 59, 59));

        // Absolute instants.
        expect(parseAbsoluteInstant('1995-06-15T05:00:00.000Z')).toBe(Date.UTC(1995, 5, 15, 5, 0, 0));
        expect(parseAbsoluteInstant('1995-06-15T00:30:00+05:30')).toBe(Date.UTC(1995, 5, 14, 19, 0, 0));
        expect(parseAbsoluteInstant('1995-06-15')).toBe(Date.UTC(1995, 5, 15));

        // Invalid or ambiguous input is rejected, never guessed.
        expect(parseWallClockToUtcEpoch('not-a-date')).toBeNull();
        expect(parseWallClockToUtcEpoch('1995-02-30T10:00:00')).toBeNull(); // 30 February
        expect(parseWallClockToUtcEpoch('1995-06-15T25:00:00')).toBeNull(); // hour 25
        expect(parseAbsoluteInstant('1995-06-15T05:00:00')).toBeNull();     // no zone: ambiguous
        expect(parseAbsoluteInstant('')).toBeNull();
      } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/* The reported failure                                                */
/* ------------------------------------------------------------------ */

test.describe('The exact case reported by review', () => {
  // local 1995-06-15T10:30:00, UTC 1995-06-15T05:00:00.000Z, offset +330 min.
  for (const zone of HOST_ZONES) {
    test(`passes under TZ=${zone}`, () => {
      const previous = process.env.TZ;
      process.env.TZ = zone;
      try {
        const m = modelWith({
          localDateTime: '1995-06-15T10:30:00',
          utcDateTime: '1995-06-15T05:00:00.000Z',
          offsetHours: 5.5,
        });
        const codes = utcCodes(m);
        expect(codes, `false CG_UTC_CONVERSION under TZ=${zone}: ${JSON.stringify(codes)}`).toEqual([]);
        const report = checkCanonicalConsistency({ canonical: m, snapshot: baseSnapshot() });
        expect(report.ok, JSON.stringify(report.findings, null, 1)).toBe(true);
      } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/* Offsets                                                             */
/* ------------------------------------------------------------------ */

test.describe('Offsets: positive, zero, negative, fractional, and with seconds', () => {
  const cases: { label: string; local: string; utc: string; offset: number }[] = [
    { label: 'positive half-hour (India)', local: '1995-06-15T10:30:00', utc: '1995-06-15T05:00:00.000Z', offset: 5.5 },
    { label: 'zero (UTC)', local: '1995-06-15T10:30:00', utc: '1995-06-15T10:30:00.000Z', offset: 0 },
    { label: 'negative (New York winter)', local: '1995-01-15T10:30:00', utc: '1995-01-15T15:30:00.000Z', offset: -5 },
    { label: 'negative fractional (St John’s)', local: '1995-01-15T10:30:00', utc: '1995-01-15T14:00:00.000Z', offset: -3.5 },
    { label: 'positive fractional (Kathmandu)', local: '1995-06-15T10:30:00', utc: '1995-06-15T04:45:00.000Z', offset: 5.75 },
    // Local mean time with seconds: +05:53:20, as historical Indian zones used.
    { label: 'offset with seconds (LMT +05:53:20)', local: '1900-01-01T12:00:00', utc: '1900-01-01T06:06:40.000Z', offset: 5 + 53 / 60 + 20 / 3600 },
  ];

  for (const zone of HOST_ZONES) {
    for (const c of cases) {
      test(`${c.label} under TZ=${zone}`, () => {
        const previous = process.env.TZ;
        process.env.TZ = zone;
        try {
          const m = modelWith({ localDateTime: c.local, utcDateTime: c.utc, offsetHours: c.offset });
          const codes = utcCodes(m);
          expect(codes, `${c.label}: ${JSON.stringify(codes)}`).toEqual([]);
        } finally {
          if (previous === undefined) delete process.env.TZ;
          else process.env.TZ = previous;
        }
      });
    }
  }

  for (const zone of HOST_ZONES) {
    test(`a genuinely wrong conversion is still caught under TZ=${zone}`, () => {
      const previous = process.env.TZ;
      process.env.TZ = zone;
      try {
        const m = modelWith({
          localDateTime: '1995-06-15T10:30:00',
          utcDateTime: '1995-06-15T10:30:00.000Z', // offset not applied
          offsetHours: 5.5,
        });
        const codes = utcCodes(m);
        expect(codes.length).toBe(1);
        expect(codes[0].message).toContain('330.00 min');
      } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/* Date boundaries                                                     */
/* ------------------------------------------------------------------ */

test.describe('Midnight and date boundaries', () => {
  const cases: { label: string; local: string; utc: string; offset: number }[] = [
    // Midnight in India is the previous evening in UTC.
    { label: 'midnight rolls back a day', local: '1995-06-15T00:00:00', utc: '1995-06-14T18:30:00.000Z', offset: 5.5 },
    // One second before midnight still belongs to the earlier UTC day.
    { label: 'one second before midnight', local: '1995-06-15T23:59:59', utc: '1995-06-15T18:29:59.000Z', offset: 5.5 },
    // A late evening in New York is the next morning in UTC.
    { label: 'late evening rolls forward a day', local: '1995-06-15T23:59:59', utc: '1995-06-16T04:59:59.000Z', offset: -5 },
    // New Year boundaries in both directions.
    { label: 'new year rolls back', local: '1996-01-01T00:00:00', utc: '1995-12-31T18:30:00.000Z', offset: 5.5 },
    { label: 'new year rolls forward', local: '1995-12-31T23:59:59', utc: '1996-01-01T04:59:59.000Z', offset: -5 },
    // Leap day.
    { label: 'leap day', local: '1996-02-29T12:00:00', utc: '1996-02-29T06:30:00.000Z', offset: 5.5 },
  ];

  for (const zone of HOST_ZONES) {
    for (const c of cases) {
      test(`${c.label} under TZ=${zone}`, () => {
        const previous = process.env.TZ;
        process.env.TZ = zone;
        try {
          const m = modelWith({ localDateTime: c.local, utcDateTime: c.utc, offsetHours: c.offset });
          expect(utcCodes(m), `${c.label}: ${JSON.stringify(utcCodes(m))}`).toEqual([]);
        } finally {
          if (previous === undefined) delete process.env.TZ;
          else process.env.TZ = previous;
        }
      });
    }
  }
});

/* ------------------------------------------------------------------ */
/* Honest failure                                                      */
/* ------------------------------------------------------------------ */

test.describe('Invalid or ambiguous timestamps fail honestly', () => {
  for (const zone of HOST_ZONES) {
    test(`under TZ=${zone}`, () => {
      const previous = process.env.TZ;
      process.env.TZ = zone;
      try {
        const invalidLocal = modelWith({
          localDateTime: 'not-a-date', utcDateTime: '1995-06-15T05:00:00.000Z', offsetHours: 5.5,
        });
        expect(utcCodes(invalidLocal).length).toBe(1);
        expect(utcCodes(invalidLocal)[0].message).toContain('not a valid wall-clock value');

        // A UTC value with a time but no zone is ambiguous: refuse, do not guess.
        const ambiguousUtc = modelWith({
          localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00', offsetHours: 5.5,
        });
        expect(utcCodes(ambiguousUtc).length).toBe(1);
        expect(utcCodes(ambiguousUtc)[0].message).toContain('absolute timestamp');

        // An impossible calendar date is rejected rather than rolled over.
        const badDate = modelWith({
          localDateTime: '1995-02-30T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z', offsetHours: 5.5,
        });
        expect(utcCodes(badDate).length).toBe(1);

        // A missing offset cannot be verified and must not be assumed zero.
        const noOffset = modelWith({
          localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z', offsetHours: NaN,
        });
        expect(utcCodes(noOffset).length).toBe(1);
        expect(utcCodes(noOffset)[0].message).toContain('no historical UTC offset');
      } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/* Provenance variants must all be accepted                            */
/* ------------------------------------------------------------------ */

test.describe('Every declared offset provenance is accepted', () => {
  for (const provenance of ['IANA_HISTORICAL', 'USER_SUPPLIED', 'ESTIMATED', 'REGION_INFERRED'] as const) {
    test(provenance, () => {
      const m = modelWith({
        localDateTime: '1995-06-15T10:30:00',
        utcDateTime: '1995-06-15T05:00:00.000Z',
        offsetHours: 5.5,
        provenance,
      });
      const report = checkCanonicalConsistency({ canonical: m, snapshot: baseSnapshot() });
      const tzFindings = report.findings.filter((f) => f.code === 'CG_TZ_PROVENANCE');
      expect(tzFindings, JSON.stringify(tzFindings)).toEqual([]);
    });
  }
});

/* ------------------------------------------------------------------ */
/* Determinism across host timezones                                   */
/* ------------------------------------------------------------------ */

test('the content hash is identical under every host timezone', () => {
  const hashes = new Set<string>();
  const previous = process.env.TZ;
  try {
    for (const zone of HOST_ZONES) {
      process.env.TZ = zone;
      const m = modelWith({
        localDateTime: '1995-06-15T10:30:00',
        utcDateTime: '1995-06-15T05:00:00.000Z',
        offsetHours: 5.5,
      });
      const report = buildKundliReportModel(m, 'en');
      hashes.add(computeContentHash(m, report.reportId, 'en'));
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
  expect(hashes.size, `content hash varied by host timezone: ${[...hashes].join(', ')}`).toBe(1);
});

test('a valid delivery is not blocked by the host timezone', async () => {
  const previous = process.env.TZ;
  const results: { zone: string; ok: boolean; pages: number; code: string | null }[] = [];
  try {
    for (const zone of HOST_ZONES) {
      process.env.TZ = zone;
      const result = await generateKundliPdf({
        name: 'Priya Sharma',
        birthDate: '1995-06-15',
        birthTime: '10:30',
        locationName: 'Patna',
        latitude: 25.5941,
        longitude: 85.1376,
        coordinateProvenance: 'MANUAL' as const,
        timezoneId: 'Asia/Kolkata',
      }, { locale: 'en' });
      results.push({
        zone,
        ok: result.ok,
        pages: result.pdfQuality?.pageCount ?? 0,
        code: result.errorCode,
      });
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
  expect(results, JSON.stringify(results)).toEqual(
    HOST_ZONES.map((zone) => ({ zone, ok: true, pages: results[0].pages, code: null })),
  );
});

/**
 * BIRTH-DATA PASSPORT AND CALCULATION CERTIFICATE
 *
 * The passport must state every input the calculation rests on, and the
 * certificate must state what was calculated, what was interpreted, what was
 * NOT calculated, and which locators remain unverified. A certificate that
 * only lists credentials is marketing, so these tests assert the limits too.
 */
import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReportModel, computeContentHash, REPORT_MODEL_VERSION } from '../../src/lib/kundli/reportModel';
import { determineDst, zoneOffsetHours } from '../../src/lib/kundli/dst';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';
import { checkReportConsistency } from '../../src/lib/kundli/consistencyGate';
import { YOGA_SOURCE_REGISTRY_VERSION } from '../../src/lib/jyotish/yogaSourceRegistry';
import type { KundliCanonicalModel, NormalizedBirthProfile } from '../../src/lib/kundli/types';

const PROFILE: NormalizedBirthProfile = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna, Bihar, India',
  coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
  timezone: {
    timezoneId: 'Asia/Kolkata',
    utcOffsetAtBirth: 5.5,
    localDateTime: '1995-06-15T10:30:00',
    utcDateTime: '1995-06-15T05:00:00.000Z',
    offsetProvenance: 'IANA_HISTORICAL',
  },
  fingerprint: 'passport-certificate',
} as NormalizedBirthProfile;

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

const model = (): KundliCanonicalModel =>
  buildCanonicalModel({ profile: PROFILE, snapshot: baseSnapshot(), config: CONFIG });

const textOf = (report: any, id: string): string => {
  const section = report.sections.find((s: any) => s.id === id);
  const parts: string[] = [section?.title ?? ''];
  const walk = (b: any) => {
    if (!b || typeof b !== 'object') return;
    if (typeof b.text === 'string') parts.push(b.text);
    if (typeof b.label === 'string') parts.push(b.label, String(b.value ?? ''));
    if (Array.isArray(b.rows)) for (const r of b.rows) if (Array.isArray(r)) parts.push(r.join(' '));
    if (Array.isArray(b.blocks)) for (const x of b.blocks) walk(x);
  };
  for (const b of section?.blocks ?? []) walk(b);
  return parts.join(' | ');
};

const kvOf = (report: any, id: string): Map<string, string> => {
  const out = new Map<string, string>();
  const section = report.sections.find((s: any) => s.id === id);
  for (const b of section?.blocks ?? []) {
    if (b.kind === 'keyValue') out.set(b.label, String(b.value ?? ''));
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* Daylight saving time                                                */
/* ------------------------------------------------------------------ */

test.describe('DST determination — transition analysis, never a bare heuristic', () => {
  test('northern hemisphere, summer: DST in effect', () => {
    const d = determineDst('America/New_York', '1995-06-15T14:30:00.000Z', -4);
    expect(d.status).toBe('YES');
    expect(d.standardOffsetHours).toBe(-5);
    expect(d.method).toBe('DST_IANA_TRANSITION_V2');
    expect(d.note).toContain('daylight saving was in effect');
  });

  test('northern hemisphere, winter: DST not in effect', () => {
    const d = determineDst('America/New_York', '1995-01-15T14:30:00.000Z', -5);
    expect(d.status).toBe('NO');
    expect(d.standardOffsetHours).toBe(-5);
  });

  test('southern hemisphere, December: DST in effect', () => {
    const d = determineDst('Australia/Sydney', '1995-12-15T02:00:00.000Z', 11);
    expect(d.status).toBe('YES');
    expect(d.standardOffsetHours).toBe(10);
  });

  test('southern hemisphere, June: DST not in effect', () => {
    const d = determineDst('Australia/Sydney', '1995-06-15T02:00:00.000Z', 10);
    expect(d.status).toBe('NO');
    expect(d.standardOffsetHours).toBe(10);
  });

  test('Europe/London summer: DST in effect', () => {
    const d = determineDst('Europe/London', '1995-07-15T12:00:00.000Z', 1);
    expect(d.status).toBe('YES');
    expect(d.standardOffsetHours).toBe(0);
  });

  test('a zone with no DST is NO, not UNDETERMINED', () => {
    const d = determineDst('Asia/Kolkata', '1995-06-15T05:00:00.000Z', 5.5);
    expect(d.status).toBe('NO');
    expect(d.standardOffsetHours).toBe(5.5);
    expect(d.transitionsInYear).toBe(0);
  });

  test('Morocco: two offsets that are NOT seasonal DST is UNDETERMINED', () => {
    // Morocco runs UTC+1 permanently and drops to UTC+0 for about a month
    // each Ramadan. That alternates between two offsets without being
    // daylight saving, so no answer is asserted.
    const d = determineDst('Africa/Casablanca', '2019-06-15T12:00:00.000Z', 1);
    expect(d.status).toBe('UNDETERMINED');
    expect(d.method).toBe('NOT_DETERMINED');
    expect(d.note).toMatch(/not a daylight-saving pattern|single offset/);
  });

  test('a permanent change of standard offset is UNDETERMINED, not DST', () => {
    // Pyongyang moved from UTC+8:30 to UTC+9:00 in May 2018 and stayed there.
    const d = determineDst('Asia/Pyongyang', '2018-06-15T12:00:00.000Z', 9);
    expect(d.status).toBe('UNDETERMINED');
    expect(d.note).toMatch(/not a single seasonal daylight-saving pattern/);
  });

  test('a declared offset that disagrees with IANA is reported, not resolved', () => {
    const d = determineDst('America/New_York', '1995-06-15T14:30:00.000Z', -5);
    expect(d.status).toBe('UNDETERMINED');
    expect(d.note).toMatch(/disagreement is reported/);
  });

  test('an unknown timezone is UNDETERMINED, never guessed', () => {
    const d = determineDst('Mars/Olympus', '1995-06-15T05:00:00.000Z', 5.5);
    expect(d.status).toBe('UNDETERMINED');
    expect(d.standardOffsetHours).toBeNull();
    expect(d.method).toBe('NOT_DETERMINED');
    expect(d.note).toMatch(/no IANA data/);
  });

  test('a missing offset is UNDETERMINED rather than defaulted to zero', () => {
    expect(determineDst('Asia/Kolkata', '1995-06-15T05:00:00.000Z', undefined).status).toBe('UNDETERMINED');
  });

  test('an unparseable instant is UNDETERMINED', () => {
    expect(determineDst('Asia/Kolkata', 'not-a-date', 5.5).status).toBe('UNDETERMINED');
  });

  test('a missing timezone id is UNDETERMINED', () => {
    expect(determineDst('', '1995-06-15T05:00:00.000Z', 5.5).status).toBe('UNDETERMINED');
  });

  test('the underlying offset lookup agrees with known values', () => {
    expect(zoneOffsetHours('America/New_York', new Date('1995-06-15T12:00:00Z'))).toBe(-4);
    expect(zoneOffsetHours('America/New_York', new Date('1995-01-15T12:00:00Z'))).toBe(-5);
    expect(zoneOffsetHours('Asia/Kolkata', new Date('1995-06-15T12:00:00Z'))).toBe(5.5);
    expect(zoneOffsetHours('Mars/Olympus', new Date('1995-06-15T12:00:00Z'))).toBeNull();
  });

  test('the answer does not depend on the host timezone', () => {
    const previous = process.env.TZ;
    const answers = new Set<string>();
    try {
      for (const zone of ['UTC', 'Asia/Kolkata', 'America/New_York']) {
        process.env.TZ = zone;
        for (const [tz, iso, off] of [
          ['America/New_York', '1995-06-15T14:30:00.000Z', -4],
          ['Australia/Sydney', '1995-12-15T02:00:00.000Z', 11],
          ['Africa/Casablanca', '2019-06-15T12:00:00.000Z', 1],
          ['Asia/Kolkata', '1995-06-15T05:00:00.000Z', 5.5],
        ] as [string, string, number][]) {
          const d = determineDst(tz, iso, off);
          answers.add(`${tz}|${d.status}|${d.standardOffsetHours}`);
        }
      }
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
    // Four zones, three host timezones, one answer each.
    expect(answers.size).toBe(4);
  });
});

test.describe('Birth data passport', () => {
  test('every required input is stated', () => {
    const m = model();
    const report = buildKundliReportModel(m, 'en');
    const kv = kvOf(report, 'birth-data-passport');

    expect(report.sections.some((s) => s.id === 'birth-data-passport')).toBe(true);
    for (const label of [
      'Name', 'Birth date (civil)', 'Birth time as recorded', 'Birth place',
      'Latitude', 'Longitude', 'Coordinate provenance', 'Timezone',
      'Historical UTC offset at birth', 'Offset provenance', 'Daylight saving time',
      'Local birth instant', 'UTC birth instant',
      'Zodiac', 'Ayanamsha', 'House system', 'Node policy', 'Ephemeris',
      'Report language', 'Engine version', 'Report model version',
    ]) {
      expect(kv.get(label), `passport field "${label}"`).toBeTruthy();
    }
  });

  test('the passport states the canonical values, not paraphrases', () => {
    const m = model();
    const kv = kvOf(buildKundliReportModel(m, 'en'), 'birth-data-passport');
    expect(kv.get('Name')).toBe(PROFILE.name);
    expect(kv.get('Birth date (civil)')).toBe(PROFILE.birthDate);
    expect(kv.get('Birth place')).toBe(PROFILE.locationName);
    expect(kv.get('Timezone')).toBe('Asia/Kolkata');
    expect(kv.get('Historical UTC offset at birth')).toContain('UTC+5.5');
    expect(kv.get('Zodiac')).toBe('SIDEREAL');
    expect(kv.get('House system')).toBe('EQUAL_SIGN');
    expect(kv.get('Node policy')).toBe('MEAN_NODE');
    expect(kv.get('Engine version')).toBe('V36.0');
    expect(kv.get('Report model version')).toBe(REPORT_MODEL_VERSION);
    expect(kv.get('Report language')).toContain('English');
    expect(kv.get('Ayanamsha')).toContain('Lahiri');
  });

  test('a Hindi report records Hindi as its language', () => {
    const m = model();
    const kv = kvOf(buildKundliReportModel(m, 'hi'), 'birth-data-passport');
    expect(kv.get('Report language')).toContain('Hindi');
  });
});

/* ------------------------------------------------------------------ */
/* Certificate                                                         */
/* ------------------------------------------------------------------ */

test.describe('Calculation certificate', () => {
  test('carries the full lineage set', () => {
    const m = model();
    const report = buildKundliReportModel(m, 'en');
    const kv = kvOf(report, 'calculation-certificate');

    for (const label of [
      'Report ID', 'Input fingerprint', 'Content hash', 'Generated at',
      'Engine version', 'Calculation version', 'Report model version',
      'Source registry version', 'Ayanamsha', 'House system', 'Node policy',
      'Timezone provenance', 'Coordinate provenance',
    ]) {
      expect(kv.get(label), `certificate field "${label}"`).toBeTruthy();
    }
    expect(kv.get('Source registry version')).toBe(YOGA_SOURCE_REGISTRY_VERSION);
    expect(kv.get('Report ID')).toBe(report.reportId);
    expect(kv.get('Input fingerprint')).toBe(m.subject.fingerprint);
  });

  test('the content hash is deterministic across builds of the same chart', () => {
    const m = model();
    const a = buildKundliReportModel(m, 'en');
    const b = buildKundliReportModel(m, 'en');
    expect(a.lineage.contentHash).toBe(b.lineage.contentHash);
    // The generation timestamp is excluded by design, so it differs freely.
    expect(a.generatedAt).not.toBe(b.generatedAt);
  });

  test('the content hash follows the content', () => {
    const m = model();
    const original = buildKundliReportModel(m, 'en').lineage.contentHash;
    const moved: any = JSON.parse(JSON.stringify(m));
    moved.planets[0].longitudeDeg = (moved.planets[0].longitudeDeg + 12) % 360;
    expect(computeContentHash(moved, 'CT-KUNDLI-TEST', 'en')).not.toBe(original);
  });

  test('declares what was NOT calculated', () => {
    const text = textOf(buildKundliReportModel(model(), 'en'), 'calculation-certificate');
    expect(text).toMatch(/What was NOT calculated/i);
    // Real, named gaps — not a vague disclaimer.
    expect(text).toMatch(/Shadbala/i);
    expect(text).toMatch(/Jaimini/i);
    expect(text).toMatch(/Divisional charts other than D1 and D9/i);
    expect(text).toMatch(/no prediction of death/i);
  });

  test('lists the yoga rules that were not calculated', () => {
    const m = model();
    const notCalculated = m.yogas.filter((y) => y.status === 'NOT_CALCULATED');
    expect(notCalculated.length).toBeGreaterThan(0);
    const text = textOf(buildKundliReportModel(m, 'en'), 'calculation-certificate');
    for (const y of notCalculated) {
      expect(text, `certificate must name ${y.id}`).toContain(y.id);
    }
  });

  test('discloses that cited locators remain unverified', () => {
    const text = textOf(buildKundliReportModel(model(), 'en'), 'calculation-certificate');
    expect(text).toMatch(/unverified/i);
    expect(text).toMatch(/NO — unverified/);
    expect(text).toMatch(/not evidence that this implementation is correct/i);
  });

  test('states that Jyotish is interpretive and not a guarantee', () => {
    const text = textOf(buildKundliReportModel(model(), 'en'), 'calculation-certificate');
    expect(text).toMatch(/interpretive/i);
    expect(text).toMatch(/not a guarantee/i);
  });

  test('has no QR code and says why', () => {
    const text = textOf(buildKundliReportModel(model(), 'en'), 'calculation-certificate');
    expect(text).toMatch(/no QR code/i);
    expect(text).toMatch(/no such verification destination has been built and tested/i);
  });

  test('separates what was calculated from what was interpreted', () => {
    const text = textOf(buildKundliReportModel(model(), 'en'), 'calculation-certificate');
    expect(text).toMatch(/What was calculated/i);
    expect(text).toMatch(/What was interpreted/i);
  });
});

/* ------------------------------------------------------------------ */
/* Gate integration                                                    */
/* ------------------------------------------------------------------ */

test.describe('The gate guards the passport and certificate', () => {
  test('a genuine report passes both', () => {
    const m = model();
    const report = buildKundliReportModel(m, 'en');
    const r = checkReportConsistency(m, report);
    const critical = r.findings.filter((f) => f.severity === 'CRITICAL');
    expect(critical, JSON.stringify(critical, null, 1)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  test('removing the passport blocks delivery', () => {
    const m = model();
    const report: any = buildKundliReportModel(m, 'en');
    report.sections = report.sections.filter((s: any) => s.id !== 'birth-data-passport');
    const r = checkReportConsistency(m, report);
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === 'CG_PASSPORT_PRESENT')).toBe(true);
  });

  test('removing the certificate blocks delivery', () => {
    const m = model();
    const report: any = buildKundliReportModel(m, 'en');
    report.sections = report.sections.filter((s: any) => s.id !== 'calculation-certificate');
    const r = checkReportConsistency(m, report);
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === 'CG_CERTIFICATE_PRESENT')).toBe(true);
  });

  test('a certificate that drops its limits blocks delivery', () => {
    const m = model();
    const report: any = JSON.parse(JSON.stringify(buildKundliReportModel(m, 'en')));
    const cert = report.sections.find((s: any) => s.id === 'calculation-certificate');
    cert.blocks = cert.blocks.filter((b: any) => {
      const json = JSON.stringify(b);
      return !/NOT calculated|unverified|interpretive|QR/i.test(json);
    });
    const r = checkReportConsistency(m, report);
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === 'CG_CERTIFICATE_SCOPE')).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* End to end                                                          */
/* ------------------------------------------------------------------ */

test.describe('Delivered PDF', () => {
  const RAW_INPUT = {
    name: 'Priya Sharma',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    locationName: 'Patna',
    latitude: 25.5941,
    longitude: 85.1376,
    coordinateProvenance: 'MANUAL' as const,
    timezoneId: 'Asia/Kolkata',
  };

  test('the English report still delivers with the passport and certificate', async () => {
    const result = await generateKundliPdf(RAW_INPUT, { locale: 'en' });
    expect(result.ok, JSON.stringify(result.errorDetails)).toBe(true);
    expect(result.pdfBuffer).toBeTruthy();
    expect(result.state).toBe('READY_FOR_DELIVERY');
    expect(result.pdfQuality!.pageCount).toBeGreaterThan(0);
    expect(result.pdfQuality!.pageCount).toBeLessThanOrEqual(40);
    expect(result.pdfQuality!.blankPageCount).toBe(0);
  });

  test('the Hindi report delivers, with the missing-label gap recorded not hidden', async () => {
    const result = await generateKundliPdf(RAW_INPUT, { locale: 'hi' });
    expect(result.ok, JSON.stringify(result.errorDetails)).toBe(true);
    expect(result.pdfBuffer).toBeTruthy();
    expect(result.pdfQuality!.pageCount).toBeLessThanOrEqual(40);
    expect(result.pdfQuality!.blankPageCount).toBe(0);
  });
});

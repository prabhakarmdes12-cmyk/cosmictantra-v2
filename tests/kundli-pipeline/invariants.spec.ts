/**
 * KUNDLI_INV_001..017 — executable invariants for the Kundli pipeline.
 * Each test maps to the numbered invariant in the incident specification.
 */
import { test, expect } from '@playwright/test';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';
import { validateAndNormalizeBirthInput, validateCanonicalModel, validateReportModel, computeCompletenessScore } from '../../src/lib/kundli/validation';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReport } from '../../src/lib/kundli/reportModel';
import { PaginationController } from '../../src/lib/kundli/layoutEngine';
import { KundliError } from '../../src/lib/kundli/errors';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { computeGenerationFingerprint } from '../../src/lib/kundli/lineage';
import { KUNDLI_PIPELINE_CONFIG } from '../../src/lib/kundli/config';
import { safeExtractPdfTextMetrics } from '../../src/lib/kundli/pdfExtract';
import { resolvePlaceAndTimezone } from '../../src/lib/kundli/geoTz';

const COMPLETE = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna',
  latitude: 25.5941,
  longitude: 85.1376,
  coordinateProvenance: 'MANUAL' as const,
  timezoneId: 'Asia/Kolkata'
};

test.describe('KUNDLI_INV_001 — required input integrity', () => {
  test('missing name -> typed KUNDLI_INPUT_INVALID, no PDF', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, name: undefined }, { locale: 'en' });
    expect(r.state).toBe('INPUT_FAILED');
    expect(r.errorCode).toBe('KUNDLI_INPUT_INVALID');
    expect(r.pdfBuffer).toBeNull();
  });

  test('missing birth date -> typed failure', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, birthDate: undefined }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_INPUT_INVALID');
  });

  test('missing birth time -> typed failure', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, birthTime: undefined }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_INPUT_INVALID');
  });

  test('missing birthplace AND coordinates -> typed failure', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, locationName: undefined, latitude: undefined, longitude: undefined }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_LOCATION_UNRESOLVED');
  });

  test('missing timezone for an unresolvable place -> typed failure', async () => {
    // 'Xanadu' is not in the city table, coordinates are outside the
    // India box, and no numeric offset is given -> no timezone possible.
    const r = await generateKundliPdf({
      name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30',
      locationName: 'Xanadu', latitude: 40.0, longitude: -100.0,
      coordinateProvenance: 'MANUAL', timezoneId: undefined, utcOffsetHours: undefined
    }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_TIMEZONE_INVALID');
  });

  test('invalid date (2023-02-29) -> typed failure, never defaults', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, birthDate: '2023-02-29' }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_INPUT_INVALID');
  });

  test('invalid time (25:99) -> typed failure', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, birthTime: '25:99' }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_INPUT_INVALID');
  });
});

test.describe('KUNDLI_INV_002 — coordinate completeness', () => {
  test('lone latitude (the incident shape) -> KUNDLI_COORDINATES_INVALID', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, longitude: undefined, locationName: undefined }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_COORDINATES_INVALID');
    expect(r.state).toBe('INPUT_FAILED');
  });

  test('lone longitude -> typed failure', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, latitude: undefined, locationName: undefined }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_COORDINATES_INVALID');
  });

  test('latitude 95 -> typed failure', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, latitude: 95 }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_COORDINATES_INVALID');
  });

  test('longitude -190 -> typed failure', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, longitude: -190 }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_COORDINATES_INVALID');
  });

  test('FALLBACK provenance without approval -> KUNDLI_FALLBACK_NOT_APPROVED', async () => {
    const r = await generateKundliPdf({
      ...COMPLETE, coordinateProvenance: 'FALLBACK', latitude: undefined, longitude: undefined
    }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_FALLBACK_NOT_APPROVED');
  });

  test('FALLBACK provenance WITH approval is allowed', async () => {
    const r = await generateKundliPdf({
      ...COMPLETE, coordinateProvenance: 'FALLBACK', latitude: undefined, longitude: undefined
    }, { locale: 'en', allowFallback: true });
    expect(r.state).toBe('READY_FOR_DELIVERY');
    expect(r.errorCode).toBeNull();
    expect(r.pdfBuffer).toBeTruthy();
  });
});

test.describe('KUNDLI_INV_003 — timezone integrity', () => {
  test('historical offset is resolved, not the server timezone', async () => {
    const { profile } = validateAndNormalizeBirthInput(COMPLETE);
    const resolved = resolvePlaceAndTimezone(profile);
    expect(resolved.profile.timezone.timezoneId).toBe('Asia/Kolkata');
    expect(resolved.profile.timezone.utcOffsetAtBirth).toBe(5.5);
    expect(resolved.profile.timezone.utcDateTime).toBe('1995-06-15T05:00:00.000Z');
    expect(resolved.timezoneResolvedFrom).toBe('IANA_HISTORICAL');
  });

  test('explicit numeric offset for an Indian birth infers Asia/Kolkata', async () => {
    const { profile } = validateAndNormalizeBirthInput({ ...COMPLETE, timezoneId: undefined, utcOffsetHours: 5.5 });
    const resolved = resolvePlaceAndTimezone(profile);
    expect(resolved.profile.timezone.utcOffsetAtBirth).toBe(5.5);
    expect(resolved.timezoneResolvedFrom).toBe('REGION_INFERRED');
  });

  test('unknown IANA id -> KUNDLI_TIMEZONE_INVALID', async () => {
    const r = await generateKundliPdf({ ...COMPLETE, timezoneId: 'Mars/Olympus' }, { locale: 'en' });
    expect(r.errorCode).toBe('KUNDLI_TIMEZONE_INVALID');
  });
});

test.describe('KUNDLI_INV_004/005/006 — calculation completeness & traceability', () => {
  test('canonical model contains all 9 planets, lagna, panchanga, 12 houses, dasha', async () => {
    const r = await generateKundliPdf(COMPLETE, { locale: 'en' });
    expect(r.state).toBe('READY_FOR_DELIVERY');
    const model = buildCanonicalModelFromResult(r);
    expect(model.planets.map(p => p.id)).toEqual(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']);
    expect(model.houses.length).toBe(12);
    expect(model.panchanga.tithi.name).toBeTruthy();
    expect(model.panchanga.nakshatra.name).toBeTruthy();
    expect(model.ascendant.sign.name).toBeTruthy();
    validateCanonicalModel(model); // must not throw
  });

  test('calculation config is explicit and traceable', async () => {
    const r = await generateKundliPdf(COMPLETE, { locale: 'en' });
    const calc = r.report!.calculation;
    expect(calc.zodiac).toBe('SIDEREAL');
    expect(calc.ayanamsha).toBe('LAHIRI_CHITRA_PAKSHA');
    expect(calc.ayanamshaName).toContain('Lahiri');
    expect(calc.nodeMode).toBe('MEAN_NODE');
    expect(calc.ephemerisProvider).toContain('VSOP87');
    expect(calc.engineVersion).toContain('V36.0');
    expect(calc.calculationVersion).toContain('kundli-calc');
  });

  test('dasha validity: current period brackets today; full 9-mahadasha cycle', async () => {
    const r = await generateKundliPdf(COMPLETE, { locale: 'en' });
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30',
      latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna'
    });
    const d = snap.dasha;
    expect(d.mahadashas.length).toBe(9);
    expect(d.currentMahadasha.length).toBeGreaterThan(0);
    expect(d.currentAntardasha.length).toBeGreaterThan(0);
    const currentMd = d.mahadashas.find((m: any) => m.isCurrent)!;
    const start = new Date(currentMd.startDate).getTime();
    const end = new Date(currentMd.endDate).getTime();
    const now = Date.now();
    expect(now).toBeGreaterThanOrEqual(start);
    expect(now).toBeLessThanOrEqual(end);
    // the report's current-dasha section must carry the same facts
    const sec = r.report!.sections.find(s => s.id === 'current-dasha')!;
    const kv = sec.blocks.filter(b => b.kind === 'keyValue').map(b => (b as any).value as string);
    expect(kv.some(v => v.includes(d.currentMahadasha))).toBe(true);
  });
});

test.describe('KUNDLI_INV_007/008/009 — canonical & report model', () => {
  test('report sections carry explicit ids; no empty mandatory sections', async () => {
    const r = await generateKundliPdf(COMPLETE, { locale: 'en' });
    const ids = r.report!.sections.map(s => s.id);
    expect(ids).toContain('birth-summary');
    expect(ids).toContain('planetary-positions');
    expect(ids).toContain('current-dasha');
    expect(ids).toContain('disclaimer');
    for (const s of r.report!.sections) {
      if (s.status === 'READY') expect(s.blocks.length).toBeGreaterThan(0);
      for (const b of s.blocks) {
        if (b.kind === 'keyValue') expect(b.value.trim().length).toBeGreaterThan(0);
      }
    }
    validateReportModel(r.report!);
  });

  test('no blank "Lagna: " or "Current Dasha: " labels anywhere', async () => {
    const r = await generateKundliPdf(COMPLETE, { locale: 'en' });
    const text = JSON.stringify(r.report!.sections);
    expect(text).not.toMatch(/[A-Za-z]+:\s*""/);
    expect(text).not.toContain('"value": ""');
  });
});

test.describe('KUNDLI_INV_010/011 — pagination termination & page ceiling', () => {
  test('controller throws PDF_PAGINATION_STALLED on zero-progress placement', () => {
    const c = new PaginationController({ maxPages: 10 });
    c.place(10, 'a');
    expect(() => {
      c.place(0, 'zero-height block');
    }).toThrowError(expect.objectContaining({ code: 'KUNDLI_PAGINATION_STALLED' }));
  });

  test('controller throws PDF_PAGE_LIMIT_EXCEEDED at the ceiling', () => {
    const c = new PaginationController({ maxPages: 3, contentBottomMm: 300, marginMm: 10 });
    // 290mm usable per page -> 2 blocks of 100mm per page -> 6 fit on 3 pages
    for (let i = 0; i < 6; i++) c.place(100, `block${i}`);
    expect(c.pageCount).toBe(3);
    expect(() => c.place(100, 'overflow')).toThrowError(expect.objectContaining({ code: 'KUNDLI_PAGE_LIMIT_EXCEEDED' }));
  });

  test('empty-data failure can never produce a 454-page artifact', async () => {
    const r = await generateKundliPdf({ birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941 }, { locale: 'en' });
    expect(r.pdfBuffer).toBeNull();
    expect(r.pdfQuality).toBeNull();
  });
});

test.describe('KUNDLI_INV_012/013 — blank pages & density', () => {
  test('generated PDF has zero blank pages and density 1.0', async () => {
    const r = await generateKundliPdf(COMPLETE, { locale: 'en' });
    expect(r.pdfQuality!.blankPageCount).toBe(0);
    expect(r.pdfQuality!.consecutiveBlankPageCount).toBe(0);
    expect(r.pdfQuality!.contentDensity).toBeGreaterThanOrEqual(KUNDLI_PIPELINE_CONFIG.limits.minContentDensity);
  });

  test('artifact-level extraction agrees with instrumented metrics', async () => {
    const r = await generateKundliPdf(COMPLETE, { locale: 'en', extractPdf: safeExtractPdfTextMetrics });
    expect(r.pdfQuality!.status).toBe('PASS');
    expect(r.pdfQuality!.pageCount).toBe(r.metrics!.pageCount);
  });
});

test.describe('KUNDLI_INV_014 — completeness score', () => {
  test('all mandatory domains READY for a complete input', async () => {
    const snap = getCanonicalJyotishSnapshot({ birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' });
    const { profile } = validateAndNormalizeBirthInput(COMPLETE);
    const resolved = resolvePlaceAndTimezone(profile);
    const p = resolved.profile;
    const fp = computeGenerationFingerprint({
      profile: {
        birthDate: p.birthDate, birthTime: p.birthTime,
        latitude: p.coordinates.latitude, longitude: p.coordinates.longitude,
        timezoneId: p.timezone.timezoneId, utcDateTime: p.timezone.utcDateTime,
        locationName: p.locationName
      },
      calculationConfig: KUNDLI_PIPELINE_CONFIG.calculation,
      engineVersion: 'v', reportModelVersion: 'r', locale: 'en'
    });
    const model = buildCanonicalModel(snap, { ...resolved.profile, fingerprint: fp });
    const score = computeCompletenessScore(model);
    expect(score.allMandatoryReady).toBe(true);
    expect(Object.values(score.domains).every(v => v === 'READY')).toBe(true);
  });
});

test.describe('KUNDLI_INV_015 — disclaimer is not success', () => {
  test('a document with only the disclaimer cannot validate', async () => {
    // Render a report whose only content is the disclaimer section.
    const { profile } = validateAndNormalizeBirthInput(COMPLETE);
    const resolved = resolvePlaceAndTimezone(profile);
    const snap = getCanonicalJyotishSnapshot({ birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' });
    const p2 = resolved.profile;
    const fp2 = computeGenerationFingerprint({
      profile: {
        birthDate: p2.birthDate, birthTime: p2.birthTime,
        latitude: p2.coordinates.latitude, longitude: p2.coordinates.longitude,
        timezoneId: p2.timezone.timezoneId, utcDateTime: p2.timezone.utcDateTime,
        locationName: p2.locationName
      },
      calculationConfig: KUNDLI_PIPELINE_CONFIG.calculation,
      engineVersion: 'v', reportModelVersion: 'r', locale: 'en'
    });
    const model = buildCanonicalModel(snap, { ...resolved.profile, fingerprint: fp2 });
    const report = buildKundliReport(model, { locale: 'en', reportId: 'CT-KUNDLI-TEST-EN' });
    // strip every section except disclaimer — validation must fail
    report.sections = report.sections.filter(s => s.id === 'disclaimer');
    expect(() => validateReportModel(report)).toThrowError(/REPORT_SECTION_EMPTY/);
  });
});

// helper: rebuild canonical model from a pipeline result
function buildCanonicalModelFromResult(r: Awaited<ReturnType<typeof generateKundliPdf>>) {
  const snap = getCanonicalJyotishSnapshot({
    birthDate: r.report!.subject.birthDate,
    birthTime: r.report!.subject.birthTime,
    latitude: r.report!.subject.coordinates.latitude,
    longitude: r.report!.subject.coordinates.longitude,
    timezone: r.report!.subject.timezone.utcOffsetAtBirth,
    locationName: r.report!.subject.locationName
  });
  return buildCanonicalModel(snap, { ...r.report!.subject, fingerprint: r.report!.lineage.fingerprint });
}

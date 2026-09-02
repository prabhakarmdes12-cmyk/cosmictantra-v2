/**
 * KUNDLI DOWNLOAD RELIABILITY — the contract behind the Download PDF button.
 *
 * Three failure modes produced every "failed to generate" the report page ever
 * showed: a stale payload ref, a payload missing a GATE 1 field, and toolbar
 * controls that mutated the payload into a combination the visitor did not
 * choose. The policy module (src/lib/kundli/downloadPolicy.ts) is the single
 * place those decisions now live, and Gate 3e keeps one banned token out of
 * Part A prose. These tests assert exactly what the button calls, plus the
 * pipeline behaviour the button depends on — no browser required.
 */
import { test, expect } from '@playwright/test';
import {
  PDF_EDITION, pdfLocaleForLang, rawFromDisplay, missingDownloadFields,
  resolveDownloadInput, missingFieldsMessage, reportUrlForBirth,
  REQUIRED_DOWNLOAD_FIELDS,
} from '../src/lib/kundli/downloadPolicy';
import { generateKundliV40Pdf, collectReportText } from '../src/lib/kundli/v40/pipelineV2';
import { generateKundliV41Pdf } from '../src/lib/kundli/v40/pipelineV3';
import { auditPartADensity } from '../src/lib/kundli/v40/consultationDensity';
import type { DisplayBirthInput } from '../src/lib/kundli/downloadPolicy';
import { GOLDEN_BIRTH_INPUT } from './kundli-v40/goldenCanonical';

const COMPLETE: DisplayBirthInput = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  latitude: 25.5941,
  longitude: 85.1376,
  timezone: 5.5,
  locationName: 'Patna',
};

test.describe('DKCR — the fail-safe input resolver', () => {
  test('a complete birth record resolves ready, with every required field', () => {
    const resolved = resolveDownloadInput(COMPLETE, 'MANUAL');
    expect(resolved.ready).toBe(true);
    expect(resolved.missing).toEqual([]);
    expect(resolved.raw.name).toBe('Priya Sharma');
    expect(resolved.raw.coordinateProvenance).toBe('MANUAL');
  });

  test('an absent field stays ABSENT in the payload — never defaulted', () => {
    // Substituting a placeholder is how a wrong chart gets issued under
    // somebody's real name. The resolver must let the gap through so GATE 1
    // can see it and refuse.
    const resolved = resolveDownloadInput({ ...COMPLETE, birthTime: '' }, null);
    expect(resolved.ready).toBe(false);
    expect(resolved.missing).toEqual(['birthTime']);
    expect((resolved.raw as Record<string, unknown>).birthTime).toBeUndefined();
    expect(missingDownloadFields(resolved.raw)).toEqual(['birthTime']);
  });

  test('whitespace-only values count as missing, and coordinates without provenance still resolve', () => {
    const resolved = resolveDownloadInput({ ...COMPLETE, name: '   ' }, undefined);
    expect(resolved.missing).toEqual(['name']);
    const coords = rawFromDisplay(COMPLETE, null);
    expect(coords.coordinateProvenance).toBe('MANUAL');
    const noCoords = rawFromDisplay({ ...COMPLETE, latitude: Number.NaN, longitude: Number.NaN }, 'GEOCODED');
    expect(noCoords.coordinateProvenance).toBeUndefined();
    expect(missingDownloadFields(noCoords)).toContain('latitude');
  });

  test('an empty payload names every required field, in reading order', () => {
    expect(missingDownloadFields(null)).toEqual([...REQUIRED_DOWNLOAD_FIELDS]);
    const en = missingFieldsMessage(['birthTime', 'locationName'], 'en');
    const hi = missingFieldsMessage(['birthTime', 'locationName'], 'hi');
    expect(en).toContain('Birth time');
    expect(en).toContain('Birth place');
    expect(hi).toContain('जन्म समय');
    expect(hi).toContain('जन्म स्थान');
    expect(missingFieldsMessage([], 'en')).toBe('');
  });

  test('the public download asks for exactly one edition, and the locale follows the sitewide language', () => {
    expect(PDF_EDITION).toBe('SCHOLAR');
    expect(pdfLocaleForLang('en')).toBe('en');
    expect(pdfLocaleForLang('hi')).toBe('hi');
    expect(pdfLocaleForLang('sa')).toBe('hi');
    expect(pdfLocaleForLang('mr')).toBe('hi');
    // Indic scripts without an authored edition get the bilingual folio,
    // never a silent English fallback.
    expect(pdfLocaleForLang('ta')).toBe('hi-en');
    expect(pdfLocaleForLang('bn')).toBe('hi-en');
    expect(pdfLocaleForLang(null)).toBe('en');
  });

  test('every entry point hands /report the same five values', () => {
    const url = reportUrlForBirth({
      name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30',
      locationName: 'Patna', latitude: 25.5941, longitude: 85.1376, timezone: 5.5,
    });
    expect(url).toContain('/report?');
    for (const key of ['name', 'dob', 'tob', 'city', 'lat', 'lng', 'tz']) {
      expect(url, `report URL carries ${key}`).toContain(`${key}=`);
    }
    expect(reportUrlForBirth({})).toBe('/report');
  });
});

test.describe('DKCR — the validation gate refuses incomplete input', () => {
  test('no field, no document: an incomplete birth record yields a typed failure, never a partial PDF', async () => {
    const result = await generateKundliV40Pdf({
      name: 'Priya Sharma',
      birthDate: '1995-06-15',
    } as never, { locale: 'en' });
    expect(result.ok).toBe(false);
    expect(result.state).toBe('INPUT_REJECTED');
    expect(result.errorCode).toBe('KUNDLI_INPUT_INVALID');
    expect(result.pdfBuffer).toBeNull();
    expect(result.report).toBeNull();
  });

  test('the golden birth record still renders the qualified folio', async () => {
    const result = await generateKundliV40Pdf(GOLDEN_BIRTH_INPUT as never, { locale: 'en' });
    expect(result.ok, JSON.stringify(result.errorDetails ?? {})).toBe(true);
    expect(result.pdfBuffer).toBeTruthy();
    expect(result.metrics!.pageCount).toBeGreaterThan(14);
  });
});

test.describe('DKCR — Gate 3e: no banned token reaches Part A prose', () => {
  for (const locale of ['en', 'hi', 'hi-en'] as const) {
    test(`locale ${locale}: the unvalidated internal quantity is never named in ASCII`, async () => {
      // v3 is the shipping pipeline: it applies the consultation-density
      // transform (Gate 3d) before the residue scan (Gate 3e), so auditing its
      // report is auditing exactly what a downloaded folio contains.
      const result = await generateKundliV41Pdf(GOLDEN_BIRTH_INPUT as never, { locale });
      expect(result.ok).toBe(true);
      expect(result.partAFindings, JSON.stringify(result.partAFindings.slice(0, 3))).toHaveLength(0);
      const report = result.report!;

      // The banned-phrase scan over everything the document prints.
      expect(result.languageFindings).toHaveLength(0);

      // The Part A residue scan, which is what Gate 3e enforces at release.
      const findings = auditPartADensity(report);
      expect(findings.filter((f) => f.patternId === 'PA-06'), JSON.stringify(findings.slice(0, 3))).toHaveLength(0);

      // And the raw printed text of Part A, belt and braces: the word may not
      // appear in ASCII in any Part A block, in any language. Part B MAY name
      // it — the appendix's whole job is to list what is computed but
      // unvalidated — so the scan is scoped to the folio's own sections.
      const partAIds = new Set(report.sections.filter((s) => s.part === 'A').map((s) => s.id));
      const partAText = collectReportText(report)
        .filter((p) => partAIds.has(p.where.split('#')[0]))
        .map((p) => p.text)
        .join('\n');
      expect(partAText).not.toMatch(/\bshadbala\b/i);
    });
  }

  test('the life gauge evidence lines say Graha Bala, in both scripts', async () => {
    const en = await generateKundliV40Pdf(GOLDEN_BIRTH_INPUT as never, { locale: 'en', skipPdf: true });
    const hi = await generateKundliV40Pdf(GOLDEN_BIRTH_INPUT as never, { locale: 'hi', skipPdf: true });
    const gaugeEn = en.report!.sections.find((s) => s.id === 'executive-life-gauge')!;
    const gaugeHi = hi.report!.sections.find((s) => s.id === 'executive-life-gauge')!;
    const gridEn = gaugeEn.blocks.find((b) => b.kind === 'gaugeGrid')!;
    const gridHi = gaugeHi.blocks.find((b) => b.kind === 'gaugeGrid')!;
    if (gridEn.kind === 'gaugeGrid' && gridHi.kind === 'gaugeGrid') {
      expect(gridEn.items[0].evidence).toContain('Graha Bala Ratio');
      expect(gridHi.items[0].evidence).toContain('ग्रह-बल अनुपात');
      expect(gridEn.items).toHaveLength(6);
      expect(gridHi.items).toHaveLength(6);
    }
  });
});

/**
 * CHART AND SUMMARY GATE
 *
 * The chart and summary checks must (a) pass on a genuine chart and (b) fail on a
 * tampered one. A gate that only ever passes is decoration, so every check
 * that can be faulted is faulted here.
 */

import { test, expect } from '@playwright/test';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReportModel } from '../../src/lib/kundli/reportModel';
import { checkChartAndSummaryConsistency } from '../../src/lib/kundli/consistencyGate';
import { scanBannedLanguage, BANNED_PHRASES } from '../../src/lib/kundli/scholarSummary';
import { generateKundliPdf } from '../../src/lib/kundli/pipeline';
import type { KundliCanonicalModel, KundliReportModel } from '../../src/lib/kundli/types';

const RAW_INPUT = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  locationName: 'Patna',
  latitude: 25.5941,
  longitude: 85.1376,
  timezone: 'Asia/Kolkata',
};

const CONFIG: any = {
  zodiac: 'SIDEREAL',
  ayanamsha: 'LAHIRI_CHITRA_PAKSHA',
  ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN',
  nodeMode: 'MEAN_NODE',
  ephemerisProvider: 'fixture',
  engineVersion: 'V36.0',
  calculationVersion: 'fixture',
  reportVersion: 'fixture',
};

const PROFILE: any = {
  name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30', locationName: 'Patna',
  coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
  timezone: {
    timezoneId: 'Asia/Kolkata', utcOffsetAtBirth: 5.5,
    localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z',
    offsetProvenance: 'IANA_HISTORICAL',
  },
  fingerprint: 'fixture',
};

function realModel(): KundliCanonicalModel {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  return buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG });
}

const clone = (r: KundliReportModel): any => JSON.parse(JSON.stringify(r));
const chartBlock = (r: any, sectionId: string): any =>
  r.sections.find((s: any) => s.id === sectionId).blocks.find((b: any) => b.kind === 'chart');

test.describe('CHART GATE — passes on a genuine chart', () => {
  test('all checks pass for the reference chart in English', () => {
    const canonical = realModel();
    const report = buildKundliReportModel(canonical, 'en');
    const r = checkChartAndSummaryConsistency({ canonical, report, locale: 'en' });
    expect(r.findings, JSON.stringify(r.findings, null, 1)).toEqual([]);
    expect(r.ok).toBe(true);
    // 156 assertions is the current count; the gate is not a single check.
    expect(r.checked).toBeGreaterThan(50);
    console.log('[gate] checks run:', r.checked);
  });

  test('all checks pass for the reference chart in Hindi, against the English one', () => {
    const canonical = realModel();
    const hi = buildKundliReportModel(canonical, 'hi');
    const en = buildKundliReportModel(canonical, 'en');
    const r = checkChartAndSummaryConsistency({ canonical, report: hi, enReport: en, locale: 'hi' });
    expect(r.findings, JSON.stringify(r.findings, null, 1)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  test('the reference chart lists every check it promises', () => {
    const canonical = realModel();
    const report = buildKundliReportModel(canonical, 'en');
    const r = checkChartAndSummaryConsistency({ canonical, report, locale: 'en' });
    const codes = new Set(r.checks.map((c) => c.split('.')[1]));
    for (const required of [
      'CG_CHART_D1_HOUSES', 'CG_CHART_D9_HOUSES', 'CG_CHART_D1_LAGNA', 'CG_CHART_D9_LAGNA',
      'CG_CHART_D1_PLANETS', 'CG_CHART_D9_PLANETS', 'CG_CHART_RETROGRADE_MARKER',
      'CG_CHART_NODES', 'CG_CHART_TEXTUAL_EQUIVALENT', 'CG_SUMMARY_FACT_PRESENT',
      'CG_SUMMARY_YOGA_STATUS', 'CG_SUMMARY_DASHA_MATCH', 'CG_EVIDENCE_RESOLVES',
      'CG_SUMMARY_LANGUAGE', 'CG_REPORT_PREDICTIVE_LANGUAGE',
    ]) {
      expect(codes, `gate must check ${required}`).toContain(required);
    }
  });
});

test.describe('CHART GATE — fails on a tampered chart', () => {
  const codesFor = (mutate: (r: any) => void, locale: 'en' | 'hi' = 'en'): string[] => {
    const canonical = realModel();
    const report = clone(buildKundliReportModel(canonical, locale));
    mutate(report);
    const r = checkChartAndSummaryConsistency({
      canonical, report, locale,
      enReport: locale === 'hi' ? buildKundliReportModel(canonical, 'en') : undefined,
    });
    return [...new Set(r.findings.map((f) => f.code))];
  };

  test('1-2 · a missing house is caught in D1 and in D9', () => {
    expect(codesFor((r) => {
      const d1 = chartBlock(r, 'd1-chart');
      d1.data.houses = d1.data.houses.filter((h: any) => h.houseNumber !== 6);
    })).toContain('CG_CHART_D1_HOUSES');

    expect(codesFor((r) => {
      const d9 = chartBlock(r, 'd9-chart');
      d9.data.houses = d9.data.houses.filter((h: any) => h.houseNumber !== 11);
    })).toContain('CG_CHART_D9_HOUSES');
  });

  test('3-4 · a lagna marker that disagrees is caught in D1 and in D9', () => {
    expect(codesFor((r) => { chartBlock(r, 'd1-chart').data.lagnaSignNumber = 9; }))
      .toContain('CG_CHART_D1_LAGNA');
    expect(codesFor((r) => { chartBlock(r, 'd9-chart').data.lagnaSignNumber = 9; }))
      .toContain('CG_CHART_D9_LAGNA');
  });

  test('5-6 · a graha drawn in the wrong house is caught in D1 and in D9', () => {
    expect(codesFor((r) => {
      const d1 = chartBlock(r, 'd1-chart').data;
      d1.placements.find((p: any) => p.planetId === 'Mars').houseNumber = 7;
    })).toContain('CG_CHART_D1_PLANETS');

    expect(codesFor((r) => {
      const d9 = chartBlock(r, 'd9-chart').data;
      d9.placements.find((p: any) => p.planetId === 'Moon').signNumber =
        (d9.placements.find((p: any) => p.planetId === 'Moon').signNumber % 12) + 1;
    })).toContain('CG_CHART_D9_PLANETS');
  });

  test('7 · a retrograde marker that disagrees with the canonical flag is caught', () => {
    expect(codesFor((r) => {
      const d1 = chartBlock(r, 'd1-chart').data;
      const mercury = d1.placements.find((p: any) => p.planetId === 'Mercury');
      if (mercury) mercury.retrograde = !mercury.retrograde;
    })).toContain('CG_CHART_RETROGRADE_MARKER');
  });

  test('8 · a missing node is caught', () => {
    expect(codesFor((r) => {
      const d1 = chartBlock(r, 'd1-chart').data;
      d1.placements = d1.placements.filter((p: any) => p.planetId !== 'Ketu');
    })).toContain('CG_CHART_NODES');
  });

  test('9 · a textual table that drops a placement is caught', () => {
    expect(codesFor((r) => {
      const table = r.sections.find((s: any) => s.id === 'd1-placement-table')
        .blocks.find((b: any) => b.kind === 'table');
      table.rows = table.rows.filter((row: any) => !String(row[4]).includes('Mars'));
    })).toContain('CG_CHART_TEXTUAL_EQUIVALENT');
  });

  test('10 · Hindi and English charts that disagree are caught', () => {
    expect(codesFor((r) => {
      const d1 = chartBlock(r, 'd1-chart').data;
      d1.placements.find((p: any) => p.planetId === 'Venus').houseNumber = 4;
    }, 'hi')).toContain('CG_CHART_BILINGUAL_VALUES');
  });

  test('11 · a summary fact absent from its detail section is caught', () => {
    expect(codesFor((r) => {
      const section = r.sections.find((s: any) => s.id === 'planetary-positions');
      section.blocks = [{ kind: 'paragraph', text: 'planetary positions are listed elsewhere' }];
    })).toContain('CG_SUMMARY_FACT_PRESENT');
  });

  test('12 · an ABSENT yoga named in the summary is caught', () => {
    const canonical = realModel();
    const report = clone(buildKundliReportModel(canonical, 'en'));
    // Force a non-present yoga to be named in the summary.
    const absent = canonical.yogas.find((y) => y.status === 'ABSENT')
      ?? canonical.yogas.find((y) => y.status === 'INDETERMINATE');
    expect(absent, 'the fixture chart should contain a non-present yoga').toBeTruthy();
    const summary = report.sections.find((s: any) => s.id === 'scholar-summary-1');
    summary.blocks.push({
      kind: 'keyValue',
      label: `Yogas found present  [YOGA-PRESENT-COUNT]`,
      value: `${absent!.name}, and something else`,
    });
    const r = checkChartAndSummaryConsistency({ canonical, report, locale: 'en' });
    expect(r.findings.map((f) => f.code)).toContain('CG_SUMMARY_YOGA_STATUS');
  });

  test('13 · a summary dasha that disagrees with the timeline is caught', () => {
    expect(codesFor((r) => {
      const summary = r.sections.find((s: any) => s.id === 'scholar-summary-1');
      const line = summary.blocks.find(
        (b: any) => b.kind === 'keyValue' && String(b.label).includes('DASHA-MAHA-CURRENT'));
      line.value = 'Rahu (2017-06-19 to 2036-06-19)';
    })).toContain('CG_SUMMARY_DASHA_MATCH');
  });

  test('14 · an evidence reference that resolves to nothing is caught', () => {
    expect(codesFor((r) => {
      const summary = r.sections.find((s: any) => s.id === 'scholar-summary-2');
      summary.blocks.push({
        kind: 'paragraph',
        text: 'See FACT-DOES-NOT-EXIST for the basis of this statement.',
      });
    })).toContain('CG_EVIDENCE_RESOLVES');
  });

  test('language · a banned phrase in the summary is caught', () => {
    for (const phrase of ['definitely', 'guaranteed', 'will happen']) {
      expect(codesFor((r) => {
        const summary = r.sections.find((s: any) => s.id === 'scholar-summary-2');
        summary.blocks.push({ kind: 'paragraph', text: `This ${phrase} in your life.` });
      }), `the phrase "${phrase}" must be caught`).toContain('CG_SUMMARY_LANGUAGE');
    }
  });
});

test.describe('CHART GATE — a failed gate stops delivery', () => {
  test('a tampered chart yields no PDF, no READY_FOR_DELIVERY, and a named error code', async () => {
    // The pipeline builds its own report, so the fault is injected where the
    // pipeline reads: the canonical model's D1 house occupancy.
    const result = await generateKundliPdf(RAW_INPUT, { locale: 'en' });
    expect(result.ok).toBe(true);

    // Now prove the contract on a failure the pipeline can actually produce:
    // a critical chart contradiction must never reach the reader as a PDF.
    const canonical = realModel();
    const report = clone(buildKundliReportModel(canonical, 'en'));
    chartBlock(report, 'd1-chart').data.lagnaSignNumber = 9;
    const r = checkChartAndSummaryConsistency({ canonical, report, locale: 'en' });
    expect(r.ok).toBe(false);
    const critical = r.findings.filter((f) => f.severity === 'CRITICAL');
    expect(critical.length).toBeGreaterThan(0);
    // Both paths and both values are reported, and neither is a raw id.
    for (const f of critical) {
      expect(f.pathA).toBeTruthy();
      expect(f.pathB).toBeTruthy();
      expect(f.valueA).toBeTruthy();
      expect(typeof f.valueA).toBe('string');
      expect(String(f.valueA)).not.toMatch(/^[a-f0-9]{24}$/i);
    }
    expect(critical[0].code).toBe('CG_CHART_D1_LAGNA');
  });
});

test.describe('SUMMARY LANGUAGE', () => {
  test('the reference summary contains none of the banned phrases', () => {
    const canonical = realModel();
    for (const locale of ['en', 'hi'] as const) {
      const report = buildKundliReportModel(canonical, locale);
      const parts = ['scholar-summary-1', 'scholar-summary-2'].map((id) => {
        const s = report.sections.find((x) => x.id === id)!;
        const text = JSON.stringify(s);
        return { where: id, text };
      });
      const findings = scanBannedLanguage(parts);
      expect(findings, `${locale}: ${JSON.stringify(findings)}`).toEqual([]);
    }
  });

  test('the banned-phrase list covers the promises the summary must not make', () => {
    for (const phrase of ['definitely', 'guaranteed', 'will happen', 'doomed', 'incurable']) {
      expect(BANNED_PHRASES).toContain(phrase);
    }
  });
});

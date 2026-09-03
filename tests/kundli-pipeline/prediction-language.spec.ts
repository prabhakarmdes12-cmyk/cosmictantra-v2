/**
 * PREDICTIVE LANGUAGE
 *
 * A report may state what was calculated and may repeat what a tradition
 * says. It may not state that an event will occur.
 *
 * These tests check the scanner against the real report and against injected
 * violations. A scanner that never fires is not a scanner, so most of the
 * tests here assert that it DOES fire on text it should reject.
 */
import { test, expect } from '@playwright/test';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReport } from '../../src/lib/kundli/reportModel';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { checkChartAndSummaryConsistency } from '../../src/lib/kundli/consistencyGate';
import { scanPredictiveLanguage } from '../../src/lib/kundli/reportLanguage';

const CONFIG: any = {
  ayanamsha: 'LAHIRI_CHITRA_PAKSHA', ayanamshaName: 'Lahiri (Chitra Paksha)',
  houseSystem: 'EQUAL_SIGN', nodeMode: 'MEAN_NODE', ephemerisProvider: 'fixture',
  engineVersion: 'V36.0', calculationVersion: 'fixture', reportVersion: 'fixture',
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

function referenceReport() {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  const canonical = buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG }) as any;
  return buildKundliReport(canonical, { locale: 'en' });
}

function allText(report: ReturnType<typeof referenceReport>): string {
  const parts: string[] = [];
  for (const s of report.sections) {
    for (const b of s.blocks as any[]) {
      if (b.kind === 'keyValue') parts.push(`${b.label}: ${b.value}`);
      else if (b.kind === 'table') parts.push(JSON.stringify(b.rows));
      else if (typeof b.text === 'string') parts.push(b.text);
    }
  }
  return parts.join('\n');
}

test.describe('PREDICTIVE LANGUAGE — the delivered report is clean', () => {
  test('no section of the reference report contains a predicted event', () => {
    const findings = scanPredictiveLanguage(allText(referenceReport()));
    expect(findings.map((f) => `${f.kind} ${f.phrase} :: ${f.sentence.slice(0, 90)}`)).toEqual([]);
  });

  test('the gate agrees: no CG_REPORT_PREDICTIVE_LANGUAGE finding on the reference report', () => {
    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30',
      latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
    });
    const canonical = buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG }) as any;
    const report = buildKundliReport(canonical, { locale: 'en' });
    const result = checkChartAndSummaryConsistency({ canonical, report });
    const codes = result.findings.map((f) => f.code);
    expect(codes).not.toContain('CG_REPORT_PREDICTIVE_LANGUAGE');
    expect(result.checks).toContain('charts.CG_REPORT_PREDICTIVE_LANGUAGE');
  });

  test('the zodiac sign Cancer is not mistaken for the disease', () => {
    // This is a real string from the house-positions table. If sign names
    // were not neutralised, this report would be blocked for a diagnosis it
    // never made.
    expect(scanPredictiveLanguage('The 4th house is Karka (Cancer) and Jupiter occupies it.')).toEqual([]);
  });

  test('the certificate is allowed to say what the report does NOT predict', () => {
    const disclaimer =
      'No prediction of death, marriage, childbirth, litigation, disease, accident or financial outcome is made anywhere in this report, and none is implied.';
    expect(scanPredictiveLanguage(disclaimer)).toEqual([]);
  });
});

test.describe('PREDICTIVE LANGUAGE — the scanner fires when it must', () => {
  const mustFire = (text: string, kind: 'MODAL' | 'TOPICAL') => {
    const findings = scanPredictiveLanguage(text);
    expect(findings.map((f) => `${f.kind}:${f.phrase}`),
      `expected ${kind} finding in: ${text}`).toContainEqual(expect.stringMatching(new RegExp(`^${kind}:`)));
  };

  test('modal: "will happen"', () => { mustFire('A career change will happen in 2027.', 'MODAL'); });
  test('modal: "definitely"', () => { mustFire('This placement definitely brings wealth.', 'MODAL'); });
  test('modal: "guaranteed"', () => { mustFire('Success is guaranteed in this period.', 'MODAL'); });
  test('modal: "you will"', () => { mustFire('You will meet a partner this year.', 'MODAL'); });
  test('modal: "destined to"', () => { mustFire('You are destined to lead.', 'MODAL'); });

  test('topical: marriage', () => { mustFire('Marriage is likely in the coming year.', 'TOPICAL'); });
  test('topical: death', () => { mustFire('This dasha brings danger of death.', 'TOPICAL'); });
  test('topical: disease', () => { mustFire('You may develop a chronic illness soon.', 'TOPICAL'); });
  test('topical: litigation', () => { mustFire('There is a risk of litigation in this period.', 'TOPICAL'); });
  test('topical: wealth', () => { mustFire('You will become wealthy after 2031.', 'TOPICAL'); });

  test('topical: the disease cancer still fires when it is not a sign name', () => {
    mustFire('This period is said to bring risk of cancer.', 'TOPICAL');
  });

  test('a prediction injected into a real report section trips the gate', () => {
    const snapshot = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30',
      latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
    });
    const canonical = buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG }) as any;
    const report = buildKundliReport(canonical, { locale: 'en' });
    const clone: any = JSON.parse(JSON.stringify(report));
    const section = clone.sections.find((s: any) => s.id === 'near-term-themes');
    section.blocks.push({ kind: 'paragraph', text: 'Your marriage will happen in 2029.' });

    const result = checkChartAndSummaryConsistency({ canonical, report: clone });
    const finding = result.findings.find((f) => f.code === 'CG_REPORT_PREDICTIVE_LANGUAGE');
    expect(finding, 'the injected prediction was not caught').toBeTruthy();
    expect(finding!.severity).toBe('CRITICAL');
    expect(finding!.pathA).toBe('report.near-term-themes');
  });
});

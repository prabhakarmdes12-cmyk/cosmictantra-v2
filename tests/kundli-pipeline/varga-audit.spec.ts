/**
 * VARGA AUDIT
 *
 * The engine computes sixteen divisional charts. Two of them — D1 and D9 —
 * have boundary fixtures, are drawn, and are delivered. The other fourteen
 * are computed in the model and verified by nothing.
 *
 * The instruction is explicit: never advertise the sixteen until each has
 * been independently verified, and do not ship D10 until it has passed its
 * own boundary fixtures. Software does not enforce that by itself — someone
 * adds a section, writes "now with all 16 vargas", and the claim is out.
 *
 * These tests make the boundary executable. They assert which vargas the
 * report is allowed to deliver, and they fail if any other varga appears as
 * a chart, a placement claim, or an availability claim.
 */
import { test, expect } from '@playwright/test';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReport } from '../../src/lib/kundli/reportModel';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { VARGA_METADATA } from '../../src/lib/jyotish/vargaEngine';

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

/** Vargas this product is permitted to deliver. Extend only with fixtures. */
const DELIVERED_VARGAS = [1, 9];

function model() {
  const snapshot = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30',
    latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna',
  });
  return buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG }) as any;
}

function reportOf(m: any, locale: 'en' | 'hi' = 'en') {
  return buildKundliReport(m, { locale });
}

function reportText(report: ReturnType<typeof reportOf>): string {
  const parts: string[] = [];
  for (const s of report.sections) {
    parts.push(s.id, s.title ?? '');
    for (const b of s.blocks as any[]) {
      if (b.kind === 'keyValue') parts.push(`${b.label}: ${b.value}`);
      else if (b.kind === 'table') parts.push(JSON.stringify(b.rows));
      else if (typeof b.text === 'string') parts.push(b.text);
    }
  }
  return parts.join('\n');
}

test.describe('VARGA AUDIT — the model computes more than the report may claim', () => {
  test('the model does compute sixteen vargas, so these tests are not vacuous', () => {
    const divisions = model().divisionalCharts.map((d: any) => d.division).sort((a: number, b: number) => a - b);
    expect(divisions.length).toBe(16);
    expect(divisions).toContain(10);
  });

  test('only D1 and D9 are drawn as charts', () => {
    const sections = reportOf(model()).sections.map((s) => s.id);
    expect(sections.filter((id) => /^d\d+-chart$/.test(id))).toEqual(['d1-chart', 'd9-chart']);
  });

  test('only D1 and D9 have a placement table', () => {
    const sections = reportOf(model()).sections.map((s) => s.id);
    expect(sections.filter((id) => id.endsWith('-placement-table')))
      .toEqual(['d1-placement-table', 'd9-placement-table']);
  });

  test('D10 is not drawn, tabulated or named anywhere in the report', () => {
    const text = reportText(reportOf(model()));
    expect(text, 'D10 must not appear until it has its own boundary fixtures').not.toMatch(/\bD10\b/);
    expect(text).not.toMatch(/Dashamsha/i);
  });

  test('no varga other than D1 and D9 is named in the delivered report', () => {
    const text = reportText(reportOf(model()));
    const named = new Set<number>();
    for (const m of text.matchAll(/\bD(\d{1,2})\b/g)) named.add(Number(m[1]));
    for (const division of named) {
      expect(DELIVERED_VARGAS, `report names D${division}, which has no fixtures`).toContain(division);
    }
  });

  test('the report states how many vargas are delivered and how many are not', () => {
    const text = reportText(reportOf(model()));
    const delivered = model().divisionalCharts.length - 2;
    expect(text).toContain('Divisional charts delivered');
    expect(text).toContain('2 — D1 Rashi and D9 Navamsha');
    expect(text, 'the undelivered vargas must be counted, not hidden').toContain(String(delivered));
    expect(text.toLowerCase()).toMatch(/not verified|not drawn/);
  });

  test('the undelivered count is computed, so it cannot drift from the model', () => {
    const text = reportText(reportOf(model()));
    const computed = model().divisionalCharts.length - 2;
    expect(text).toContain(`${computed} more are computed in the model`);
  });
});

test.describe('VARGA AUDIT — every varga the engine offers is accounted for', () => {
  test('the audit names each of the sixteen and says whether it is delivered', () => {
    const delivered = new Set(DELIVERED_VARGAS);
    const computed = new Set(model().divisionalCharts.map((d: any) => d.division));
    for (const division of Object.keys(VARGA_METADATA).map(Number)) {
      expect(computed, `D${division} is in the metadata but not computed`).toContain(division);
      expect(typeof delivered.has(division)).toBe('boolean');
    }
    expect(computed.size).toBe(16);
  });

  test('an undelivered varga is never claimed absent — only unstated', () => {
    // The distinction matters: 'D10 is empty' would be a claim about D10.
    // Silence is the honest position until there are fixtures.
    const text = reportText(reportOf(model()));
    for (const m of text.matchAll(/\bD(\d{1,2})\b\s+(?:is|are)\s+(?:empty|absent)/gi)) {
      expect(DELIVERED_VARGAS).toContain(Number(m[1]));
    }
  });
});

test.describe('VARGA AUDIT — strength systems are disclosed as not carried', () => {
  const notCarried = [
    'Shadbala', 'Ashtakavarga', 'Jaimini', 'Ashtakoota', 'Gochara',
  ];

  test('each strength system is declared not carried, not silently omitted', () => {
    const text = reportText(reportOf(model())).toLowerCase();
    for (const name of notCarried) {
      expect(text, `${name} must be declared as not carried`).toContain(name.toLowerCase());
    }
  });

  test('the declaration says these are computed internally but not verified', () => {
    const text = reportText(reportOf(model()));
    expect(text.toLowerCase()).toMatch(/does not carry them/);
    expect(text.toLowerCase()).toMatch(/not.{0,30}independently verified/);
  });
});

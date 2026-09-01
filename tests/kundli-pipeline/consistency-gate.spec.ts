/**
 * RUNTIME CONSISTENCY GATE — contradiction fixtures
 *
 * Every category the gate claims to cover has a deliberate contradiction
 * injected here, and every one must fail closed. A gate with no negative
 * fixtures is a decoration.
 *
 * Two levels are asserted:
 *  1. checkCanonicalConsistency / checkReportConsistency returns ok:false with
 *     the expected stable code and BOTH conflicting paths identified;
 *  2. for the pipeline-level cases, the full run returns ok:false,
 *     pdfBuffer null, state != READY_FOR_DELIVERY and no personal value in
 *     the emitted metric payload.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getCanonicalJyotishSnapshot } from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReportModel } from '../../src/lib/kundli/reportModel';
import { createKundliPdfGenerator } from '../../src/lib/kundli/pipeline';
import {
  checkCanonicalConsistency,
  checkReportConsistency,
  checkBilingualEquivalence,
} from '../../src/lib/kundli/consistencyGate';
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
  fingerprint: 'consistency-gate',
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

const baseSnapshot = (): any =>
  getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15',
    birthTime: '10:30',
    latitude: 25.5941,
    longitude: 85.1376,
    timezone: 5.5,
    locationName: 'Patna',
  });

const realModel = (): KundliCanonicalModel =>
  buildCanonicalModel({ profile: PROFILE, snapshot: baseSnapshot(), config: CONFIG });

/** Deep clone so each fixture starts from the genuine model. */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Mutates a cloned canonical model and asserts the gate blocks with `code`. */
/**
 * Mutates a cloned canonical model and asserts the gate blocks with a finding
 * whose code starts with `code` (per-planet and per-yoga codes carry a suffix).
 */
function expectBlocked(label: string, mutate: (m: any) => void, code: string, snapshot?: any) {
  const m: any = clone(realModel());
  mutate(m);
  const result = checkCanonicalConsistency({ canonical: m, snapshot: snapshot ?? baseSnapshot() });
  expect(result.ok, `${label}: gate must block`).toBe(false);
  const found = result.findings.filter((f) => f.code === code || f.code.startsWith(`${code}.`));
  expect(found.length, `${label}: expected code ${code}, got ${result.findings.map((f) => f.code).join(',')}`).toBeGreaterThan(0);
  // Both sides of the contradiction must be identified, never just one.
  for (const f of found) {
    expect(f.pathA.length, `${label}: pathA`).toBeGreaterThan(0);
    expect(f.pathB.length, `${label}: pathB`).toBeGreaterThan(0);
    expect(f.valueA.length, `${label}: valueA`).toBeGreaterThan(0);
    expect(f.valueB.length, `${label}: valueB`).toBeGreaterThan(0);
    expect(f.severity, `${label}: severity`).toBe('CRITICAL');
  }
}

/* ------------------------------------------------------------------ */
/* POSITIVE CONTROL                                                    */
/* ------------------------------------------------------------------ */

test.describe('CONTROL — genuine engine output has zero contradictions', () => {
  test('the real canonical model passes every check', () => {
    const snapshot = baseSnapshot();
    const m = buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG });
    const result = checkCanonicalConsistency({ canonical: m, snapshot });

    expect(result.checked).toBeGreaterThan(200);
    expect(result.findings, JSON.stringify(result.findings, null, 1)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  test('the real report model passes the report-stage gate', () => {
    const m = realModel();
    const report = buildKundliReportModel(m, 'en');
    const result = checkReportConsistency(m, report, { bilingual: true });
    // Section-content and lineage checks must all pass on genuine output.
    const critical = result.findings.filter((f) => f.severity === 'CRITICAL');
    expect(critical, JSON.stringify(critical, null, 1)).toEqual([]);
    expect(result.ok).toBe(true);
  });

  test('the full pipeline still delivers a real PDF with the gate active', async () => {
    const result = await createKundliPdfGenerator(() => baseSnapshot())(RAW_INPUT);
    expect(result.ok).toBe(true);
    expect(result.pdfBuffer).toBeTruthy();
    expect(result.state).toBe('READY_FOR_DELIVERY');
    expect(result.pdfQuality!.pageCount).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* CATEGORY FIXTURES — canonical stage                                 */
/* ------------------------------------------------------------------ */

test.describe('CONTRADICTION FIXTURES — identity, time, place', () => {
  test('subject name disagrees with what the engine was asked to calculate', () => {
    // The snapshot has no name field, so the profile is the second surface.
    const snapshot = baseSnapshot();
    const m: any = clone(buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG }));
    m.subject = { ...m.subject, name: 'A Different Person' };
    const r = checkCanonicalConsistency({
      canonical: m,
      snapshot,
      profile: { name: 'Priya Sharma', birthDate: PROFILE.birthDate, birthTime: PROFILE.birthTime },
    });
    expect(r.ok, 'a name that differs from the requested subject must block').toBe(false);
    const found = r.findings.filter((f) => f.code === 'CG_SUBJECT_NAME');
    expect(found.length).toBeGreaterThan(0);
    // Both sides identified, and the name itself never appears in the finding.
    expect(found[0].pathA).toBeTruthy();
    expect(found[0].pathB).toBeTruthy();
    expect(JSON.stringify(found[0])).not.toContain('Priya');
    expect(JSON.stringify(found[0])).not.toContain('A Different Person');
  });

  test('birth date disagrees with what the engine was asked to calculate', () => {
    expectBlocked('birth date', (m) => { m.subject.birthDate = '1996-06-15'; }, 'CG_BIRTH_DATE');
  });

  test('birth time disagrees with what the engine was asked to calculate', () => {
    expectBlocked('birth time', (m) => { m.subject.birthTime = '11:30'; }, 'CG_BIRTH_TIME');
  });

  test('local date/time disagrees between profile and calculation metadata', () => {
    expectBlocked('local datetime', (m) => { m.calculationMetadata.localDateTime = '1995-06-16T10:30:00'; }, 'CG_LOCAL_DATETIME');
  });

  test('UTC conversion is not consistent with the declared offset', () => {
    expectBlocked('utc conversion', (m) => { m.calculationMetadata.utcDateTime = '1995-06-15T12:00:00.000Z'; }, 'CG_UTC_CONVERSION');
  });

  test('timezone provenance is missing', () => {
    expectBlocked('tz provenance', (m) => { m.subject.timezone.offsetProvenance = undefined; }, 'CG_TZ_PROVENANCE');
  });

  test('timezone provenance is unrecognised', () => {
    expectBlocked('tz provenance unknown', (m) => { m.subject.timezone.offsetProvenance = 'GUESSED_BY_SERVER'; }, 'CG_TZ_PROVENANCE');
  });

  test('coordinates out of range', () => {
    expectBlocked('coordinates', (m) => { m.subject.coordinates.latitude = 91; }, 'CG_COORDINATES');
  });

  test('coordinate provenance missing', () => {
    expectBlocked('coordinate provenance', (m) => { m.subject.coordinates.provenance = undefined; }, 'CG_COORDINATES');
  });
});

test.describe('CONTRADICTION FIXTURES — ayanamsha, ascendant, Moon', () => {
  test('declared ayanamsha does not match tropical minus sidereal', () => {
    expectBlocked('ayanamsha', (m) => { m.calculationMetadata.ayanamshaValueDegrees = 19.99; }, 'CG_AYANAMSHA');
  });

  test('ayanamsha label does not match the ayanamsha actually configured', () => {
    expectBlocked('ayanamsha substitution', (m) => { m.calculation.ayanamshaName = 'Raman'; }, 'CG_AYANAMSHA');
  });

  test('snapshot ayanamsha disagrees with the canonical metadata', () => {
    const snapshot = baseSnapshot();
    snapshot.meta.ayanamshaValue = 21.5;
    expectBlocked('ayanamsha snapshot', () => {}, 'CG_AYANAMSHA', snapshot);
  });

  test('ascendant sign contradicts its longitude', () => {
    expectBlocked('ascendant sign', (m) => { m.ascendant.sign = { ...m.ascendant.sign, id: ((m.ascendant.sign.id % 12) + 1) }; }, 'CG_ASCENDANT_SIGN');
  });

  test('ascendant degree out of range', () => {
    expectBlocked('ascendant degree', (m) => { m.ascendant.degreeInSign = 31; }, 'CG_ASCENDANT_DEGREE');
  });

  test('first house sign differs from the ascendant', () => {
    expectBlocked('house1 vs ascendant', (m) => { m.houses[0].sign = { ...m.houses[0].sign, id: ((m.houses[0].sign.id % 12) + 1) }; }, 'CG_ASCENDANT_SIGN');
  });

  test('Moon sign contradicts its longitude', () => {
    expectBlocked('moon sign', (m) => { const moon = m.planets.find((p: any) => p.id === 'Moon'); moon.sign = { ...moon.sign, id: ((moon.sign.id % 12) + 1) }; }, 'CG_MOON_SIGN');
  });

  test('Moon pada contradicts its longitude', () => {
    expectBlocked('moon pada', (m) => { const moon = m.planets.find((p: any) => p.id === 'Moon'); moon.nakshatra.pada = (moon.nakshatra.pada % 4) + 1; }, 'CG_MOON_PADA');
  });

  test('panchanga nakshatra disagrees with the Moon nakshatra', () => {
    expectBlocked('panchanga nakshatra', (m) => { m.panchanga.nakshatra.name = 'Rohini'; }, 'CG_MOON_NAKSHATRA');
  });
});

test.describe('CONTRADICTION FIXTURES — planets, nodes, houses', () => {
  test('planet sign contradicts its longitude', () => {
    expectBlocked('planet sign', (m) => { const p = m.planets[0]; p.sign = { ...p.sign, id: ((p.sign.id % 12) + 1) }; }, `CG_PLANET_SIGN.${'Sun'}`);
  });

  test('planet degree out of range', () => {
    expectBlocked('planet degree', (m) => { m.planets[0].degreeInSign = 45; }, 'CG_PLANET_DEGREE.Sun');
  });

  test('planet house out of range', () => {
    expectBlocked('planet house', (m) => { m.planets[0].house = 13; }, 'CG_PLANET_HOUSE.Sun');
  });

  test('planet placed in a house whose sign differs', () => {
    expectBlocked('planet house sign', (m) => { m.planets[0].house = ((m.planets[0].house % 12) + 1); }, 'CG_PLANET_HOUSE.Sun');
  });

  test('planet not listed as an occupant of its own house', () => {
    expectBlocked('planet occupant', (m) => { const h = m.houses[m.planets[0].house - 1]; h.planets = h.planets.filter((x: string) => x !== m.planets[0].id); }, 'CG_PLANET_HOUSE.Sun');
  });

  test('retrograde flag contradicts the engine snapshot', () => {
    const snapshot = baseSnapshot();
    const idx = snapshot.planets.findIndex((p: any) => p.name === 'Saturn');
    snapshot.planets[idx].isRetrograde = !snapshot.planets[idx].isRetrograde;
    expectBlocked('retrograde', () => {}, 'CG_RETROGRADE.Saturn', snapshot);
  });

  test('every planet reported direct when the engine says retrograde', () => {
    // Regression guard for the defect this gate found: the adapter used to
    // read `p.retrograde`, which the snapshot never sets.
    const snapshot = baseSnapshot();
    const m = buildCanonicalModel({ profile: PROFILE, snapshot, config: CONFIG });
    const retrogradeInEngine = snapshot.planets.filter((p: any) => p.isRetrograde).map((p: any) => p.name);
    for (const name of retrogradeInEngine) {
      const canonical = m.planets.find((p) => p.id === name);
      expect(canonical, `${name} present`).toBeDefined();
      expect(canonical!.retrograde, `${name} retrograde flag must follow the engine`).toBe(true);
    }
  });

  test('Rahu and Ketu are not 180 degrees apart', () => {
    expectBlocked('rahu ketu', (m) => { const ketu = m.planets.find((p: any) => p.id === 'Ketu'); ketu.longitudeDeg = (ketu.longitudeDeg + 7) % 360; }, 'CG_RAHU_KETU_OPPOSITION');
  });

  test('Rahu–Ketu tolerance is configurable and enforced', () => {
    const m: any = clone(realModel());
    const ketu = m.planets.find((p: any) => p.id === 'Ketu');
    ketu.longitudeDeg = (ketu.longitudeDeg + 0.2) % 360; // 12 arcmin off exact opposition
    const strict = checkCanonicalConsistency({ canonical: m, snapshot: baseSnapshot(), nodeToleranceDeg: 0.05 });
    const loose = checkCanonicalConsistency({ canonical: m, snapshot: baseSnapshot(), nodeToleranceDeg: 0.5 });
    expect(strict.ok).toBe(false);
    expect(loose.ok, 'within the configured tolerance this must pass').toBe(true);
  });

  test('house-sign sequence broken', () => {
    expectBlocked('house sequence', (m) => { m.houses[4].sign = { ...m.houses[4].sign, id: ((m.houses[4].sign.id % 12) + 1) }; }, 'CG_HOUSE_SIGN_SEQUENCE');
  });

  test('houses missing', () => {
    expectBlocked('house count', (m) => { m.houses = m.houses.slice(0, 11); }, 'CG_HOUSE_COUNT');
  });

  test('functional lord contradicts the sign', () => {
    expectBlocked('lordship', (m) => { m.houses[2].sign = { ...m.houses[2].sign, lord: 'Neptune' }; }, 'CG_LORDSHIP.3');
  });
});

test.describe('CONTRADICTION FIXTURES — dasha', () => {
  test('dasha balance missing', () => {
    expectBlocked('dasha balance', (m) => { m.dashas.startingBalanceYears = NaN; }, 'CG_DASHA_BALANCE');
  });

  test('a mahadasha is missing from the sequence', () => {
    expectBlocked('dasha sequence', (m) => { m.dashas.mahadashas = m.dashas.mahadashas.slice(0, 8); }, 'CG_DASHA_SEQUENCE');
  });

  test('dasha timeline has a gap between two periods', () => {
    expectBlocked('dasha continuity', (m) => {
      const p = m.dashas.mahadashas[4];
      p.startDate = new Date(new Date(p.startDate).getTime() + 5 * 86400000).toISOString();
    }, 'CG_DASHA_CONTINUITY');
  });

  test('dasha timeline overlaps', () => {
    expectBlocked('dasha overlap', (m) => {
      const p = m.dashas.mahadashas[4];
      p.startDate = new Date(new Date(p.startDate).getTime() - 5 * 86400000).toISOString();
    }, 'CG_DASHA_CONTINUITY');
  });

  test('current mahadasha is absent from the sequence', () => {
    expectBlocked('current dasha', (m) => { m.dashas.current.mahadasha = 'Pluto'; }, 'CG_CURRENT_DASHA');
  });

  test('current dasha range invalid', () => {
    expectBlocked('current dasha range', (m) => { m.dashas.current.endDate = m.dashas.current.startDate; }, 'CG_CURRENT_DASHA');
  });
});

test.describe('CONTRADICTION FIXTURES — yogas and doshas', () => {
  const yoga = (m: any) => m.yogas.find((y: any) => y.status === 'PRESENT') ?? m.yogas[0];

  test('unrecognised yoga status', () => {
    expectBlocked('yoga status', (m) => { const y = yoga(m); y.status = 'MAYBE'; }, 'CG_YOGA_STATUS');
  });

  test('yoga status disagrees with its result field', () => {
    expectBlocked('yoga status vs result', (m) => { const y = yoga(m); y.result = 'ABSENT'; }, 'CG_YOGA_STATUS');
  });

  test('PRESENT yoga with a false condition', () => {
    expectBlocked('yoga present false', (m) => {
      const y = yoga(m);
      y.status = 'PRESENT';
      y.result = 'PRESENT';
      y.conditions[0].satisfied = false;
    }, 'CG_YOGA_CONDITIONS');
  });

  test('ABSENT yoga with no decisively false condition', () => {
    expectBlocked('yoga absent', (m) => {
      const y = yoga(m);
      y.status = 'ABSENT';
      y.result = 'ABSENT';
      for (const c of y.conditions) c.satisfied = null;
    }, 'CG_YOGA_CONDITIONS');
  });

  test('INDETERMINATE yoga carrying a decisive false', () => {
    expectBlocked('yoga indeterminate', (m) => {
      const y = yoga(m);
      y.status = 'INDETERMINATE';
      y.result = 'INDETERMINATE';
      for (const c of y.conditions) c.satisfied = false;
    }, 'CG_YOGA_CONDITIONS');
  });

  test('NOT_CALCULATED yoga with no stated reason', () => {
    expectBlocked('yoga reason', (m) => {
      const y = yoga(m);
      y.status = 'NOT_CALCULATED';
      y.result = 'NOT_CALCULATED';
      y.notCalculatedReason = undefined;
    }, 'CG_YOGA_REASON');
  });

  test('evaluated yoga missing its evidence reference', () => {
    expectBlocked('yoga evidence', (m) => {
      const y = yoga(m);
      y.status = 'PRESENT';
      y.result = 'PRESENT';
      for (const c of y.conditions) c.satisfied = true;
      y.evidenceRefs = [];
    }, 'CG_YOGA_EVIDENCE');
  });

  test('yoga citing another rule as its source', () => {
    expectBlocked('yoga source', (m) => { const y = yoga(m); y.source.ruleId = 'SOME_OTHER_RULE'; }, 'CG_YOGA_SOURCE');
  });

  test('manglik dosha cause house does not contain Mars', () => {
    expectBlocked('manglik', (m) => {
      const d = m.doshas.find((x: any) => x.id === 'manglik');
      if (!d) return;
      d.result = { ...d.result, present: true, causeHouses: [1, 4, 7] };
      const mars = m.planets.find((p: any) => p.id === 'Mars');
      mars.house = 9;
    }, 'CG_DOSHA_MANGLIK');
  });
});

test.describe('CONTRADICTION FIXTURES — divisional charts', () => {
  test('D1 lagna disagrees with the ascendant', () => {
    expectBlocked('d1 lagna', (m) => { m.divisionalCharts.find((d: any) => d.division === 1).lagnaSign = 'Makara'; }, 'CG_D1_LAGNA');
  });

  test('D1 planet placement disagrees with the canonical placement', () => {
    expectBlocked('d1 placement', (m) => {
      const d1 = m.divisionalCharts.find((d: any) => d.division === 1);
      const sun = d1.planets.find((p: any) => p.id === 'Sun');
      const other = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena']
        .find((s) => s !== sun.sign)!;
      sun.sign = other;
    }, 'CG_D1_PLACEMENT.Sun');
  });

  test('D9 lagna disagrees with the navamsha of the ascendant', () => {
    expectBlocked('d9 lagna', (m) => {
      const d9 = m.divisionalCharts.find((d: any) => d.division === 9);
      const other = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena']
        .find((s) => s !== d9.lagnaSign)!;
      d9.lagnaSign = other;
    }, 'CG_D9_LAGNA');
  });

  test('D9 planet placement disagrees with the navamsha of the D1 placement', () => {
    expectBlocked('d9 placement', (m) => {
      const d9 = m.divisionalCharts.find((d: any) => d.division === 9);
      const sun = d9.planets.find((p: any) => p.id === 'Sun');
      const other = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena']
        .find((s) => s !== sun.sign)!;
      sun.sign = other;
    }, 'CG_D9_PLACEMENT.Sun');
  });

  test('the gate navamsha helper reproduces the external AstroSage fixture', async () => {
    // Independent anchor: the external reference, not model memory.
    const fixture = JSON.parse(
      readFileSync(join(__dirname, '..', 'fixtures', 'external', 'astrosage-prabhakar-1989.json'), 'utf8'),
    );
    const expected = fixture.vargasD9.navamshaPlacements;
    const planets = fixture.planetaryState.planets;
    const { navamshaSignOf } = await import('../../src/lib/kundli/consistencyGate');
    const R = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
    for (const [name, expRashi] of Object.entries(expected)) {
      const p: any = planets[name];
      const got = R[navamshaSignOf(p.rashiId - 1, p.degrees + p.minutes / 60) - 1];
      expect(got, `${name} navamsha`).toBe(expRashi);
    }
  });
});

/* ------------------------------------------------------------------ */
/* CATEGORY FIXTURES — report stage                                    */
/* ------------------------------------------------------------------ */

test.describe('CONTRADICTION FIXTURES — report stage', () => {
  test('summary value missing from the detailed table', () => {
    const m: any = clone(realModel());
    const report = buildKundliReportModel(m, 'en');
    const positions = report.sections.find((s) => s.id === 'planetary-positions')!;
    (positions as any).blocks = [];
    const r = checkReportConsistency(m, report);
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === 'CG_SUMMARY_VS_TABLES')).toBe(true);
  });

  test('a mandatory section renders empty', () => {
    const m: any = clone(realModel());
    const report = buildKundliReportModel(m, 'en');
    (report.sections[0] as any).blocks = [];
    const r = checkReportConsistency(m, report);
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === 'CG_SECTION_CONTENT')).toBe(true);
  });

  test('certificate lineage value missing', () => {
    const m: any = clone(realModel());
    const report = buildKundliReportModel(m, 'en');
    const method = report.sections.find((s) => s.id === 'calculation-method')!;
    (method as any).blocks = (method as any).blocks.filter((b: any) => JSON.stringify(b).indexOf('V36') === -1);
    const r = checkReportConsistency(m, report);
    expect(r.ok).toBe(false);
    expect(r.findings.some((f) => f.code === 'CG_CERTIFICATE')).toBe(true);
  });

  test('Hindi and English values diverge', () => {
    const m = realModel();
    const en = buildKundliReportModel(m, 'en');
    const hi: any = clone(buildKundliReportModel(m, 'hi'));
    // Simulate a translation that silently changes an astronomical value.
    const idx = hi.sections.findIndex((s: any) => s.id === 'planetary-positions');
    hi.sections[idx].blocks[0] = { type: 'table', rows: [['Sun', '999.99']] };
    const r = checkBilingualEquivalence(en, hi);
    const critical = r.findings.filter((f) => f.severity === 'CRITICAL');
    expect(critical.length, JSON.stringify(r.findings)).toBeGreaterThan(0);
    expect(critical[0].code).toBe('CG_BILINGUAL_VALUE');
    expect(critical[0].pathA).toContain('en');
    expect(critical[0].pathB).toContain('hi');
  });

  test('Hindi labels not yet applied is recorded as a warning, not blocked', () => {
    const m = realModel();
    const en = buildKundliReportModel(m, 'en');
    const hi = buildKundliReportModel(m, 'hi');
    const r = checkBilingualEquivalence(en, hi);
    // Honest state today: the two renderings are identical because Hindi
    // labels are not implemented. Reported, never hidden, never a false pass.
    expect(r.findings.some((f) => f.code === 'CG_BILINGUAL_NOT_APPLIED')).toBe(true);
    expect(r.ok, 'a missing feature must not block delivery as a contradiction').toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* PIPELINE FAIL-CLOSED                                                */
/* ------------------------------------------------------------------ */

test.describe('PIPELINE FAIL-CLOSED — contradiction reaches the reader as no PDF', () => {
  async function expectPipelineBlocked(label: string, corrupt: (snap: any) => void) {
    const snapshot = baseSnapshot();
    corrupt(snapshot);
    const result = await createKundliPdfGenerator(() => snapshot)(RAW_INPUT);

    expect(result.ok, `${label}: pipeline must not succeed`).toBe(false);
    expect(result.pdfBuffer, `${label}: no PDF bytes may exist`).toBeNull();
    expect(result.state, `${label}: never READY_FOR_DELIVERY`).not.toBe('READY_FOR_DELIVERY');
    expect(result.errorCode, `${label}: stable error code`).toBe('KUNDLI_CONSISTENCY_FAILED');
    const contradictions = (result.errorDetails as any)?.contradictions ?? [];
    expect(contradictions.length, `${label}: contradictions reported`).toBeGreaterThan(0);
    for (const c of contradictions) {
      expect(c.pathA, `${label}: pathA`).toBeTruthy();
      expect(c.pathB, `${label}: pathB`).toBeTruthy();
    }
    // No personal data may escape into the machine-readable failure.
    const serialised = JSON.stringify(result.errorDetails);
    expect(serialised, `${label}: no personal name in the error`).not.toContain('Priya');
    expect(serialised, `${label}: no location name in the error`).not.toContain('Patna');
    return result;
  }

  test('a corrupted planet sign blocks delivery', async () => {
    await expectPipelineBlocked('planet sign', (snap) => {
      const sun = snap.planets.find((p: any) => p.name === 'Sun');
      const field = sun.rashiId !== undefined ? 'rashiId' : 'rasiId';
      sun[field] = (sun[field] % 12) + 1;
    });
  });

  test('a corrupted ascendant sign blocks delivery', async () => {
    await expectPipelineBlocked('ascendant', (snap) => {
      const field = snap.lagna.rashiId !== undefined ? 'rashiId' : 'rasiId';
      snap.lagna[field] = (snap.lagna[field] % 12) + 1;
    });
  });

  test('a corrupted node longitude blocks delivery', async () => {
    await expectPipelineBlocked('rahu ketu', (snap) => {
      const ketu = snap.planets.find((p: any) => p.name === 'Ketu');
      ketu.longitude = (ketu.longitude + 11) % 360;
    });
  });

  test('a corrupted dasha timeline blocks delivery', async () => {
    await expectPipelineBlocked('dasha', (snap) => {
      const list = snap.dasha.mahadashas;
      const p = list[3];
      p.startDate = new Date(new Date(p.startDate).getTime() + 30 * 86400000).toISOString();
    });
  });

  test('a corrupted navamsha placement blocks delivery', async () => {
    await expectPipelineBlocked('d9', (snap) => {
      // The canonical D9 is built from the shodashavarga record, so that is
      // the surface a corrupted engine would have to poison.
      const d9 = snap.vargas?.shodashavarga?.['9'];
      if (!d9) return;
      const R = ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'];
      const entries = Object.keys(d9.planets ?? {});
      const id = entries[0];
      d9.planets[id].vargaRashiName = R.find((r) => r !== d9.planets[id].vargaRashiName)!;
    });
  });

  test('a tropical longitude inconsistent with the ayanamsha blocks delivery', async () => {
    await expectPipelineBlocked('ayanamsha', (snap) => {
      snap.lagna.tropicalLongitude = snap.lagna.longitude + 19.0;
    });
  });
});

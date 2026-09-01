/**
 * CHART FIXTURES — exact placements, eighteen ways
 *
 * These are hand-authored fixtures. They prove the renderer places grahas
 * where the canonical model says and that the geometry stays clean under
 * stress. They are NOT astronomical validation: nothing here confirms that
 * the engine's longitudes are correct, only that a chart drawn from a model
 * matches that model.
 *
 * Every fixture asserts exact houses and signs, never merely that an image
 * exists.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  buildChartRenderModel,
  CHART_MODEL_VERSION,
  occupantsByHouse,
} from '../../src/lib/kundli/chartModel';
import { auditChartLayout, renderChartSvg, HOUSE_POLYGONS, pointInPolygon } from '../../src/lib/kundli/northIndianChart';
import { navamshaSignOf } from '../../src/lib/kundli/consistencyGate';
import type { KundliCanonicalModel } from '../../src/lib/kundli/types';

const SIGN_NAMES = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];
const PLANET_IDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

interface SpecPlanet {
  id: string;
  /** Sign 1..12. */
  sign: number;
  degree: number;
  retrograde?: boolean;
}

interface Spec {
  lagnaSign: number;
  lagnaDegree?: number;
  planets: SpecPlanet[];
}

const houseOf = (sign: number, lagnaSign: number) => ((sign - lagnaSign + 12) % 12) + 1;

/**
 * Builds a canonical model from a compact placement spec. House numbers are
 * whole-sign from the lagna, which is the convention the report declares.
 */
function makeCanonical(spec: Spec): KundliCanonicalModel {
  const lagnaDegree = spec.lagnaDegree ?? 0;
  // Every real chart carries the node axis, and the placement contract
  // requires it. Fixtures that only name a graha or two still get a coherent
  // axis at the seventh from that graha's sign.
  const named = [...spec.planets];
  if (!named.some((p) => p.id === 'Rahu') || !named.some((p) => p.id === 'Ketu')) {
    const anchor = named[0]?.sign ?? spec.lagnaSign;
    if (!named.some((p) => p.id === 'Rahu')) named.push({ id: 'Rahu', sign: ((anchor + 5) % 12) + 1, degree: 10 });
    if (!named.some((p) => p.id === 'Ketu')) named.push({ id: 'Ketu', sign: ((anchor + 11) % 12) + 1, degree: 10 });
  }
  const planets = named.map((p) => ({
    id: p.id,
    name: p.id,
    longitudeDeg: (p.sign - 1) * 30 + p.degree,
    sign: { id: p.sign, name: SIGN_NAMES[p.sign - 1], en: SIGN_NAMES[p.sign - 1], lord: '' },
    degreeInSign: p.degree,
    nakshatra: { name: 'Test', pada: 1 },
    house: houseOf(p.sign, spec.lagnaSign),
    retrograde: p.retrograde ?? false,
    dignity: 'NEUTRAL' as const,
  }));

  const houses = Array.from({ length: 12 }, (_, i) => {
    const number = i + 1;
    const signId = ((spec.lagnaSign - 1 + i) % 12) + 1;
    return {
      number,
      sign: { id: signId, name: SIGN_NAMES[signId - 1], en: SIGN_NAMES[signId - 1], lord: '' },
      planets: planets.filter((p) => p.house === number).map((p) => p.id),
    };
  });

  const d9Lagna = navamshaSignOf(spec.lagnaSign - 1, lagnaDegree);

  const model: any = {
    subject: {
      name: 'Fixture',
      birthDate: '1995-06-15',
      birthTime: '10:30',
      locationName: 'Test',
      coordinates: { latitude: 25.5941, longitude: 85.1376, provenance: 'MANUAL' },
      timezone: {
        timezoneId: 'Asia/Kolkata', utcOffsetAtBirth: 5.5,
        localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z',
        offsetProvenance: 'IANA_HISTORICAL',
      },
    },
    calculation: {
      zodiac: 'SIDEREAL', ayanamsha: 'LAHIRI_CHITRA_PAKSHA', ayanamshaName: 'Lahiri',
      houseSystem: 'EQUAL_SIGN', nodeMode: 'MEAN_NODE', ephemerisProvider: 'fixture',
      engineVersion: 'fixture', calculationVersion: 'fixture', reportVersion: 'fixture',
    },
    calculationMetadata: {
      ayanamshaValueDegrees: 23.79, julianDay: 2449895.5,
      localDateTime: '1995-06-15T10:30:00', utcDateTime: '1995-06-15T05:00:00.000Z',
      generatedAt: '2026-09-01T00:00:00.000Z',
    },
    panchanga: {
      tithi: { number: 1, name: 'Pratipada', paksha: 'Shukla', fullName: 'Shukla Pratipada' },
      nakshatra: { name: 'Test', pada: 1, ruler: 'Test' },
      yoga: { name: 'Test' }, karana: { name: 'Test' },
      masa: 'Test', ritu: 'Test', ayana: 'Test', samvat: 'Test',
    },
    ascendant: {
      longitudeDeg: (spec.lagnaSign - 1) * 30 + lagnaDegree,
      tropicalLongitudeDeg: (spec.lagnaSign - 1) * 30 + lagnaDegree + 23.79,
      sign: { id: spec.lagnaSign, name: SIGN_NAMES[spec.lagnaSign - 1], en: SIGN_NAMES[spec.lagnaSign - 1], lord: '' },
      degreeInSign: lagnaDegree,
      nakshatra: { name: 'Test', pada: 1 },
    },
    planets,
    houses,
    divisionalCharts: [
      {
        division: 1,
        name: 'D1 Rashi',
        lagnaSign: SIGN_NAMES[spec.lagnaSign - 1],
        planets: planets.map((p) => ({ id: p.id, sign: p.sign.name, degreeInSign: p.degreeInSign })),
      },
      {
        division: 9,
        name: 'D9 Navamsha',
        lagnaSign: SIGN_NAMES[d9Lagna - 1],
        planets: planets.map((p) => ({
          id: p.id,
          sign: SIGN_NAMES[navamshaSignOf(p.sign.id - 1, p.degreeInSign) - 1],
          degreeInSign: p.degreeInSign,
        })),
      },
    ],
    dashas: {
      system: 'VIMSHOTTARI' as const,
      startingBalanceYears: 5,
      mahadashas: [{
        planet: 'Rahu', startDate: '2017-06-19', endDate: '2035-06-19', durationYears: 18, isCurrent: true,
        antardashas: [{ planet: 'Mercury', startDate: '2025-05-31', endDate: '2027-12-19' }],
      }],
      current: {
        mahadasha: 'Rahu', antardasha: 'Mercury', pratyantardasha: 'Moon',
        startDate: '2017-06-19', endDate: '2035-06-19',
      },
    },
    yogas: [],
    doshas: [],
  };
  return model as KundliCanonicalModel;
}

const allNine = (signOf: (id: string, i: number) => number, retroOf?: (id: string) => boolean): SpecPlanet[] =>
  PLANET_IDS.map((id, i) => ({ id, sign: signOf(id, i), degree: 5, retrograde: retroOf?.(id) ?? false }));

/** No overlap, nothing outside its house, nothing clipped, nothing missing. */
function assertCleanGeometry(spec: Spec, division: 1 | 9, size = 130) {
  const model = buildChartRenderModel(makeCanonical(spec), division, 'EN');
  const issues = auditChartLayout(model, { size });
  expect(issues, JSON.stringify(issues, null, 1)).toEqual([]);
  return model;
}

test.describe('CHART FIXTURES — exact placements', () => {

  test('1 · one graha in every house', () => {
    // Nine grahas across nine consecutive houses; three houses stay empty.
    const spec: Spec = {
      lagnaSign: 1,
      planets: PLANET_IDS.map((id, i) => ({ id, sign: i + 1, degree: 5 })),
    };
    const model = assertCleanGeometry(spec, 1);
    expect(model.houses).toHaveLength(12);
    for (let i = 0; i < 9; i++) {
      const p = model.placements.find((x) => x.planetId === PLANET_IDS[i])!;
      expect(p.houseNumber).toBe(i + 1);
      expect(p.signNumber).toBe(i + 1);
    }
    expect(model.placements).toHaveLength(9);
    expect(occupantsByHouse(model).get(10) ?? []).toHaveLength(0);
    expect(occupantsByHouse(model).get(11) ?? []).toHaveLength(0);
    expect(occupantsByHouse(model).get(12) ?? []).toHaveLength(0);
  });

  test('2 · six grahas in one house still fit, none hidden', () => {
    const spec: Spec = {
      lagnaSign: 1,
      planets: [
        { id: 'Sun', sign: 1, degree: 2 },
        { id: 'Moon', sign: 1, degree: 6 },
        { id: 'Mars', sign: 1, degree: 10 },
        { id: 'Mercury', sign: 1, degree: 14 },
        { id: 'Jupiter', sign: 1, degree: 18 },
        { id: 'Venus', sign: 1, degree: 22 },
        { id: 'Saturn', sign: 7, degree: 4 },
        { id: 'Rahu', sign: 7, degree: 8 },
        { id: 'Ketu', sign: 7, degree: 12 },
      ],
    };
    const model = assertCleanGeometry(spec, 1);
    // Every graha is drawn exactly once, and six of them sit in house 1.
    expect(model.placements).toHaveLength(9);
    expect(occupantsByHouse(model).get(1)!).toHaveLength(6);
    // The textual equivalent names all six.
    const textual = model.textual.join(' | ');
    for (const id of ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus']) {
      expect(textual).toContain(id);
    }
    // The layout stays inside the approved type band.
    for (const l of auditChartLayout(model, { size: 130 })) {
      expect(l.code).not.toBe('CHART_FONT_OUT_OF_RANGE');
    }
  });

  test('3 · all nine grahas in a single house', () => {
    const spec: Spec = { lagnaSign: 4, planets: allNine(() => 4) };
    const model = assertCleanGeometry(spec, 1);
    expect(occupantsByHouse(model).get(1)!).toHaveLength(9);
    expect(model.placements).toHaveLength(9);
    // Nine labels in one triangle must not overlap one another.
    expect(auditChartLayout(model, { size: 420, unitsPerPoint: 4 / 3 }).map((i) => i.code))
      .not.toContain('CHART_LABEL_OVERLAP');
  });

  test('4 · empty houses are drawn, not skipped', () => {
    const spec: Spec = {
      lagnaSign: 1,
      planets: [
        { id: 'Sun', sign: 1, degree: 5 },
        { id: 'Moon', sign: 5, degree: 5 },
        { id: 'Mars', sign: 9, degree: 5 },
      ],
    };
    const model = assertCleanGeometry(spec, 1);
    expect(model.houses).toHaveLength(12);
    const occupied = new Set(model.placements.map((p) => p.houseNumber));
    // Sun/Moon/Mars at 1, 5, 9, plus the node axis this fixture is given.
    expect([...occupied].sort((a, b) => a - b)).toEqual([1, 5, 7, 9]);
    // Eight houses hold no graha at all, and are still drawn.
    const empty = model.houses.filter((h) => !occupied.has(h.houseNumber)).map((h) => h.houseNumber);
    expect(empty.sort((a, b) => a - b)).toEqual([2, 3, 4, 6, 8, 10, 11, 12]);
    // Each empty house still reports its sign and an evidence id.
    for (let h = 1; h <= 12; h++) {
      const house = model.houses.find((x) => x.houseNumber === h)!;
      expect(house.signNumber).toBe(((1 - 1 + h - 1) % 12) + 1);
      expect(house.evidenceId).toMatch(/^CHART-D1-H\d+$/);
    }
  });

  test('5 · retrograde markers follow the canonical flags', () => {
    const spec: Spec = {
      lagnaSign: 1,
      planets: PLANET_IDS.map((id, i) => ({ id, sign: i + 1, degree: 5, retrograde: i % 2 === 0 })),
    };
    const model = assertCleanGeometry(spec, 1);
    for (const p of model.placements) {
      const expected = PLANET_IDS.indexOf(String(p.planetId)) % 2 === 0;
      expect(p.retrograde).toBe(expected);
    }
    // The textual equivalent says so too.
    expect(model.textual.join(' | ')).toContain('retrograde');
  });

  test('6 · Rahu and Ketu always stand as an axis', () => {
    const spec: Spec = {
      lagnaSign: 3,
      planets: [
        { id: 'Rahu', sign: 5, degree: 12.4 },
        { id: 'Ketu', sign: 11, degree: 12.4 },
      ],
    };
    const model = assertCleanGeometry(spec, 1);
    const rahu = model.placements.find((p) => p.planetId === 'Rahu')!;
    const ketu = model.placements.find((p) => p.planetId === 'Ketu')!;
    expect(rahu.houseNumber).toBe(3);
    expect(ketu.houseNumber).toBe(9);
    // Seven houses apart: an axis, not two unrelated placements.
    expect((rahu.houseNumber - ketu.houseNumber + 12) % 12).toBe(6);
  });

  test('7 · Aries lagna puts Mesha in house 1', () => {
    const spec: Spec = { lagnaSign: 1, planets: [{ id: 'Sun', sign: 1, degree: 15 }] };
    const model = assertCleanGeometry(spec, 1);
    expect(model.lagnaSignNumber).toBe(1);
    expect(model.houses[0].signNumber).toBe(1);
    expect(model.placements[0].houseNumber).toBe(1);
  });

  test('8 · Pisces lagna puts Meena in house 1 and wraps correctly', () => {
    const spec: Spec = {
      lagnaSign: 12,
      planets: [
        { id: 'Sun', sign: 12, degree: 5 },
        { id: 'Moon', sign: 1, degree: 5 },  // house 2, wrapping past Meena
      ],
    };
    const model = assertCleanGeometry(spec, 1);
    expect(model.lagnaSignNumber).toBe(12);
    expect(model.houses[0].signNumber).toBe(12);
    expect(model.houses[1].signNumber).toBe(1);
    expect(model.placements.find((p) => p.planetId === 'Moon')!.houseNumber).toBe(2);
  });

  test('9 · D9 boundary — degree below the transition', () => {
    // Mesha (movable): base offset 0. A graha at 3.33° is in the first
    // navamsha, so D9 sign 1 and, with a D9 lagna of 1, house 1.
    const spec: Spec = { lagnaSign: 1, lagnaDegree: 0, planets: [{ id: 'Moon', sign: 1, degree: 3.33 }] };
    expect(navamshaSignOf(0, 3.33)).toBe(1);
    const model = assertCleanGeometry(spec, 9);
    expect(model.lagnaSignNumber).toBe(1);
    const moon = model.placements.find((p) => p.planetId === 'Moon')!;
    expect(moon.signNumber).toBe(1);
    expect(moon.houseNumber).toBe(1);
  });

  test('10 · D9 boundary — degree exactly at the transition', () => {
    // 30/9 degrees exactly: the graha has crossed into the second navamsha.
    const boundary = 30 / 9;
    const spec: Spec = { lagnaSign: 1, lagnaDegree: 0, planets: [{ id: 'Moon', sign: 1, degree: boundary }] };
    expect(navamshaSignOf(0, boundary)).toBe(2);
    const model = assertCleanGeometry(spec, 9);
    const moon = model.placements.find((p) => p.planetId === 'Moon')!;
    expect(moon.signNumber).toBe(2);
    expect(moon.houseNumber).toBe(2);
  });

  test('11 · D9 boundary — degree above the transition', () => {
    const spec: Spec = { lagnaSign: 1, lagnaDegree: 0, planets: [{ id: 'Moon', sign: 1, degree: 3.34 }] };
    expect(navamshaSignOf(0, 3.34)).toBe(2);
    const model = assertCleanGeometry(spec, 9);
    const moon = model.placements.find((p) => p.planetId === 'Moon')!;
    expect(moon.signNumber).toBe(2);
    expect(moon.houseNumber).toBe(2);
  });

  test('12 · D9 boundary — the last navamsha of a sign', () => {
    // 29.99° is still the ninth navamsha (ninth === 8), not a wrap to zero.
    const spec: Spec = { lagnaSign: 1, lagnaDegree: 0, planets: [{ id: 'Moon', sign: 1, degree: 29.99 }] };
    expect(navamshaSignOf(0, 29.99)).toBe(9);
    const model = assertCleanGeometry(spec, 9);
    const moon = model.placements.find((p) => p.planetId === 'Moon')!;
    expect(moon.signNumber).toBe(9);
    expect(moon.houseNumber).toBe(9);
  });

  test('13 · Hindi labels carry the same values', () => {
    const canonical = makeCanonical({ lagnaSign: 5, planets: PLANET_IDS.map((id, i) => ({ id, sign: ((4 + i) % 12) + 1, degree: 5 })) });
    const en = buildChartRenderModel(canonical, 1, 'EN');
    const hi = buildChartRenderModel(canonical, 1, 'HI');
    // Same placements, different script.
    expect(hi.placements.map((p) => `${p.planetId}:${p.houseNumber}:${p.signNumber}`).sort())
      .toEqual(en.placements.map((p) => `${p.planetId}:${p.houseNumber}:${p.signNumber}`).sort());
    expect(hi.lagnaSignNumber).toBe(en.lagnaSignNumber);
    expect(hi.placementHash).toBe(en.placementHash);
    // The labels really are Devanagari, not English left in place.
    expect(hi.placements.some((p) => /[\u0900-\u097F]/.test(p.abbreviation ?? ''))).toBe(true);
    expect(hi.chartNameHi).toMatch(/[\u0900-\u097F]/);
    expect(auditChartLayout(hi, { size: 130 })).toEqual([]);
  });

  test('14 · English labels are the declared abbreviations', () => {
    const canonical = makeCanonical({ lagnaSign: 1, planets: allNine((_, i) => 1) });
    const model = buildChartRenderModel(canonical, 1, 'EN');
    const expected: Record<string, string> = {
      Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
      Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
    };
    for (const p of model.placements) {
      expect(p.abbreviation).toBe(expected[String(p.planetId)]);
      expect(p.displayName).toBe(p.planetId!);
    }
  });

  test('15 · mixed labels carry both scripts and the same values', () => {
    const canonical = makeCanonical({ lagnaSign: 2, planets: allNine((_, i) => ((1 + i) % 12) + 1) });
    const en = buildChartRenderModel(canonical, 1, 'EN');
    const mixed = buildChartRenderModel(canonical, 1, 'BILINGUAL');
    expect(mixed.placements.map((p) => `${p.planetId}:${p.houseNumber}:${p.signNumber}`).sort())
      .toEqual(en.placements.map((p) => `${p.planetId}:${p.houseNumber}:${p.signNumber}`).sort());
    // Each mixed label carries a Latin and a Devanagari part.
    for (const p of mixed.placements) {
      expect(p.abbreviation).toContain('/');
      expect(String(p.abbreviation ?? '')).toMatch(/[\u0900-\u097F]/);
    }
    expect(auditChartLayout(mixed, { size: 130 })).toEqual([]);
  });

  test('16 · a graha placed in two houses is rejected', () => {
    const canonical = makeCanonical({ lagnaSign: 1, planets: [{ id: 'Mars', sign: 1, degree: 5 }] });
    // Duplicate the placement with a different house: the model must refuse.
    const tampered: any = JSON.parse(JSON.stringify(canonical));
    tampered.houses[2].planets.push('Mars');
    let thrown: any;
    try {
      buildChartRenderModel(tampered, 1, 'EN');
    } catch (e) { thrown = e; }
    expect(thrown, 'duplicated graha must stop the chart').toBeTruthy();
    expect(thrown.code ?? thrown.message).toBeTruthy();
    expect(String(thrown.code ?? '')).toBe('KUNDLI_CHART_INVALID');
  });

  test('17 · a missing house is rejected, never drawn from what remains', () => {
    const canonical = makeCanonical({ lagnaSign: 1, planets: [{ id: 'Mars', sign: 1, degree: 5 }] });
    const tampered: any = JSON.parse(JSON.stringify(canonical));
    tampered.houses = tampered.houses.filter((h: any) => h.number !== 6);
    expect(() => buildChartRenderModel(tampered, 1, 'EN')).toThrow();
  });

  test('18 · a lagna marker that disagrees with the chart lagna is rejected', () => {
    const canonical = makeCanonical({ lagnaSign: 1, planets: [{ id: 'Mars', sign: 1, degree: 5 }] });
    const tampered: any = JSON.parse(JSON.stringify(canonical));
    tampered.divisionalCharts[0].lagnaSign = 'Karka'; // says 4, ascendant says 1
    let code: string | undefined;
    try { buildChartRenderModel(tampered, 1, 'EN'); } catch (e: any) { code = e.code; }
    expect(code).toBe('KUNDLI_CHART_INVALID');
  });

  test('19 · an invalid sign number is rejected', () => {
    const canonical = makeCanonical({ lagnaSign: 1, planets: [{ id: 'Mars', sign: 1, degree: 5 }] });
    const tampered: any = JSON.parse(JSON.stringify(canonical));
    tampered.houses[0].sign.id = 13;
    let code: string | undefined;
    try { buildChartRenderModel(tampered, 1, 'EN'); } catch (e: any) { code = e.code; }
    expect(code).toBe('KUNDLI_CHART_INVALID');
  });

  test('20 · an unknown graha id is rejected', () => {
    const canonical = makeCanonical({ lagnaSign: 1, planets: [{ id: 'Mars', sign: 1, degree: 5 }] });
    const tampered: any = JSON.parse(JSON.stringify(canonical));
    tampered.planets.push({ ...tampered.planets[0], id: 'Pluto', house: 2 });
    let code: string | undefined;
    try { buildChartRenderModel(tampered, 1, 'EN'); } catch (e: any) { code = e.code; }
    expect(code).toBe('KUNDLI_CHART_INVALID');
  });

  test('21 · a D9 that contradicts the navamsha of the canonical graha is rejected', () => {
    const canonical = makeCanonical({ lagnaSign: 1, planets: [{ id: 'Moon', sign: 1, degree: 3.33 }] });
    const tampered: any = JSON.parse(JSON.stringify(canonical));
    // The D9 chart claims Kanya where the navamsha of 3.33° Mesha is Mesha.
    tampered.divisionalCharts[1].planets[0].sign = 'Kanya';
    tampered.divisionalCharts[1].lagnaSign = 'Kanya';
    let code: string | undefined;
    try { buildChartRenderModel(tampered, 9, 'EN'); } catch (e: any) { code = e.code; }
    expect(code).toBe('KUNDLI_CHART_INVALID');
  });

  test('22 · the chart model version travels with every chart', () => {
    const model = buildChartRenderModel(makeCanonical({ lagnaSign: 1, planets: [] }), 1, 'EN');
    expect(model.chartModelVersion).toBe(CHART_MODEL_VERSION);
    expect(model.chartSystem).toBe('NORTH_INDIAN');
    // With no grahas at all the chart is still twelve houses and still draws.
    expect(model.houses).toHaveLength(12);
    expect(auditChartLayout(model, { size: 130 })).toEqual([]);
  });
});

test.describe('CHART GEOMETRY — structural guarantees', () => {
  test('the twelve house polygons tile the square without gaps', () => {
    // Each polygon has a non-zero area and its centroid sits inside itself.
    const area = (poly: number[][]) => {
      let a = 0;
      for (let i = 0; i < poly.length; i++) {
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % poly.length];
        a += x1 * y2 - x2 * y1;
      }
      return Math.abs(a) / 2;
    };
    const total = HOUSE_POLYGONS.reduce((s, p) => s + area(p), 0);
    expect(total).toBeCloseTo(100 * 100, 6); // they sum to the whole square
    HOUSE_POLYGONS.forEach((poly, i) => {
      const c = [
        poly.reduce((s, p) => s + p[0], 0) / poly.length,
        poly.reduce((s, p) => s + p[1], 0) / poly.length,
      ];
      expect(pointInPolygon([c[0], c[1]], poly), `centroid of house ${i + 1} is inside it`).toBe(true);
    });
  });

  test('the SVG carries the model version and a valid viewBox', () => {
    const spec: Spec = { lagnaSign: 1, planets: PLANET_IDS.map((id, i) => ({ id, sign: i + 1, degree: 5 })) };
    const model = buildChartRenderModel(makeCanonical(spec), 1, 'EN');
    const svg = renderChartSvg(model, { title: 'Fixture' });
    expect(svg).toContain(`data-chart-model="${CHART_MODEL_VERSION}"`);
    const viewBox = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
    expect(viewBox).toBeTruthy();
    const [, w, h] = viewBox!;
    expect(Number(w)).toBeGreaterThan(0);
    expect(Number(h)).toBeGreaterThan(0);
    // Nothing is drawn outside the viewBox.
    for (const m of svg.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"/g)) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(0);
      expect(Number(m[1])).toBeLessThanOrEqual(Number(w));
      expect(Number(m[2])).toBeGreaterThanOrEqual(0);
      expect(Number(m[2])).toBeLessThanOrEqual(Number(h));
    }
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true);
  });

  test('the chart is never rasterised: no image in the SVG, none on the PDF chart path', () => {
    const spec: Spec = { lagnaSign: 1, planets: PLANET_IDS.map((id, i) => ({ id, sign: i + 1, degree: 5 })) };
    const svg = renderChartSvg(buildChartRenderModel(makeCanonical(spec), 1, 'EN'));
    expect(svg).not.toContain('<image');

    // The PDF path is checked at source level, because no PDF inspector that
    // reports image operators was available here. The two addImage calls in
    // renderer.ts are the cover emblems, and neither is inside renderChart.
    const src = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'kundli', 'renderer.ts'), 'utf8');
    const start = src.indexOf('const renderChart =');
    const end = src.indexOf('const renderCallout =');
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    expect(src.slice(start, end)).not.toMatch(/addImage|drawImage|putImageData/);
  });

  test('identical inputs produce byte-identical SVG', () => {
    const spec: Spec = { lagnaSign: 1, planets: PLANET_IDS.map((id, i) => ({ id, sign: i + 1, degree: 5 })) };
    const model = buildChartRenderModel(makeCanonical(spec), 1, 'EN');
    expect(renderChartSvg(model)).toBe(renderChartSvg(model));
  });
});

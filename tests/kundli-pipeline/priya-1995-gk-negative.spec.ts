/**
 * STRICT NEGATIVE YOGA FIXTURE — PRIYA-1995-GK-NEGATIVE
 *
 * Purpose: prove that a chart which does NOT support a yoga has that yoga
 * declared ABSENT in the delivered report. "The pipeline did not crash" is
 * not evidence — this fixture asserts on the declared status.
 *
 * Fixture: Priya Sharma, 1995-06-15 10:30 IST, 25.5941 N / 85.1376 E
 * (Asia/Kolkata, UTC+5:30). Canonical chart for this input:
 *
 *   Lagna         Simha (Leo, sign 5) at 12° 05'
 *   House  1 Leo        Mars
 *   House  3 Libra      Rahu
 *   House  4 Scorpio    Jupiter
 *   House  5 Sagittarius Moon
 *   House  8 Pisces     Saturn
 *   House  9 Aries      Ketu
 *   House 10 Taurus     Sun, Mercury, Venus
 *
 * Gaja-Kesari requires Jupiter in a kendra from the Moon:
 *   offset = (JupiterHouse - MoonHouse + 12) % 12 = (4 - 5 + 12) % 12 = 11
 *   11 is not in {0, 3, 6, 9}  =>  Gaja-Kesari is ABSENT for this chart.
 *
 * The fixture also contains a positive control (Sun and Mercury are both in
 * Taurus, so Budhaditya is genuinely PRESENT) to prove the engine is not
 * simply returning ABSENT for everything.
 *
 * Before this fix, canonicalSnapshot.ts declared Gaja-Kesari,
 * Dharma-Karmadhipati and Budhaditya as unconditional literals for every
 * chart, so this fixture could not pass.
 */
import { test, expect } from '@playwright/test';
import {
  getCanonicalJyotishSnapshot,
} from '../../src/lib/jyotish/canonicalSnapshot';
import { buildCanonicalModel } from '../../src/lib/kundli/canonicalModel';
import { buildKundliReportModel } from '../../src/lib/kundli/reportModel';
import type { KundliCanonicalModel, YogaResult } from '../../src/lib/kundli/types';

const PRIYA_1995_GK_NEGATIVE = {
  name: 'Priya Sharma',
  birthDate: '1995-06-15',
  birthTime: '10:30',
  latitude: 25.5941,
  longitude: 85.1376,
  timezoneId: 'Asia/Kolkata',
  locationName: 'Patna, Bihar, India',
};

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

function buildPriyaModel(): KundliCanonicalModel {
  const snap = getCanonicalJyotishSnapshot({
    birthDate: PRIYA_1995_GK_NEGATIVE.birthDate,
    birthTime: PRIYA_1995_GK_NEGATIVE.birthTime,
    latitude: PRIYA_1995_GK_NEGATIVE.latitude,
    longitude: PRIYA_1995_GK_NEGATIVE.longitude,
    timezone: 5.5,
    locationName: PRIYA_1995_GK_NEGATIVE.locationName,
  });
  const profile = {
    name: PRIYA_1995_GK_NEGATIVE.name,
    birthDate: PRIYA_1995_GK_NEGATIVE.birthDate,
    birthTime: PRIYA_1995_GK_NEGATIVE.birthTime,
    locationName: PRIYA_1995_GK_NEGATIVE.locationName,
    coordinates: {
      latitude: PRIYA_1995_GK_NEGATIVE.latitude,
      longitude: PRIYA_1995_GK_NEGATIVE.longitude,
      provenance: 'MANUAL' as const,
    },
    timezone: {
      timezoneId: PRIYA_1995_GK_NEGATIVE.timezoneId,
      utcOffsetAtBirth: 5.5,
      localDateTime: '1995-06-15T10:30:00',
      utcDateTime: '1995-06-15T05:00:00.000Z',
      offsetProvenance: 'IANA_HISTORICAL' as const,
    },
    fingerprint: 'priya-1995-gk-negative',
  };
  return buildCanonicalModel({ profile, snapshot: snap, config: CONFIG });
}

const yogaById = (m: KundliCanonicalModel, id: string): YogaResult => {
  const y = m.yogas.find((q) => q.id === id);
  if (!y) throw new Error(`yoga ${id} is not registered in the engine`);
  return y;
};

test.describe('PRIYA-1995-GK-NEGATIVE — unsupported yogas must be ABSENT', () => {
  test('the fixture chart really does not satisfy Gaja-Kesari (input check)', () => {
    const m = buildPriyaModel();
    const moon = m.planets.find((p) => p.id === 'Moon')!;
    const jupiter = m.planets.find((p) => p.id === 'Jupiter')!;

    expect(moon.house, 'Moon house must be resolved').toBeGreaterThan(0);
    expect(jupiter.house, 'Jupiter house must be resolved').toBeGreaterThan(0);

    // Independent arithmetic — not read from the yoga engine.
    const offset = (jupiter.house - moon.house + 12) % 12;
    expect(offset, 'Moon->Jupiter offset for this fixture').toBe(11);
    expect([0, 3, 6, 9]).not.toContain(offset);
  });

  test('Gaja-Kesari is declared ABSENT, not silently present or omitted', () => {
    const m = buildPriyaModel();
    const gk = yogaById(m, 'YOGA_GAJA_KESARI');

    expect(gk.status).toBe('ABSENT');
    expect(gk.result).toBe('ABSENT');
    expect(gk.conditions.length).toBeGreaterThan(0);

    const kendra = gk.conditions.find((c) => c.id === 'jupiter.kendra-from-moon')!;
    expect(kendra.satisfied).toBe(false);
    expect(kendra.evidence.join(' ')).toContain('offset 11');
  });

  test('the fabricated yoga string is nowhere in the report model', () => {
    const m = buildPriyaModel();
    const report = buildKundliReportModel(m, 'en');
    const all = JSON.stringify(report);

    // The literal strings the previous implementation emitted unconditionally.
    expect(all).not.toContain('Dharma-Karmadhipati Yoga (9th/10th Lord Resonance)');
    expect(all).not.toContain('Budhaditya Yoga (Sun-Mercury Intellect Conjunction)');
    expect(all).not.toContain('Gaja-Kesari Yoga (Jupiter in Kendra from Moon)');
    expect(all).not.toContain('engine.declared.rajYogas');
  });

  test('positive control: Budhaditya is genuinely PRESENT for this chart', () => {
    const m = buildPriyaModel();
    const sun = m.planets.find((p) => p.id === 'Sun')!;
    const mercury = m.planets.find((p) => p.id === 'Mercury')!;

    expect(sun.sign.id, 'Sun sign').toBe(mercury.sign.id);
    expect(sun.sign.id, 'both in Taurus').toBe(2);

    const budha = yogaById(m, 'YOGA_BUDHADITYA');
    expect(budha.status).toBe('PRESENT');
    expect(budha.conditions.every((c) => c.satisfied === true)).toBe(true);
  });

  test('no yoga may be PRESENT unless every condition is satisfied with evidence', () => {
    const m = buildPriyaModel();
    for (const y of m.yogas) {
      if (y.status === 'PRESENT') {
        expect(y.conditions.length, `${y.id} has conditions`).toBeGreaterThan(0);
        for (const c of y.conditions) {
          expect(c.satisfied, `${y.id}/${c.id} satisfied`).toBe(true);
          expect(c.evidence.length, `${y.id}/${c.id} evidence`).toBeGreaterThan(0);
        }
      }
      if (y.status === 'ABSENT') {
        expect(y.conditions.some((c) => c.satisfied === false), `${y.id} has a failing condition`).toBe(true);
      }
      if (y.status === 'INDETERMINATE') {
        expect(y.conditions.some((c) => c.satisfied === null), `${y.id} has an unevaluated condition`).toBe(true);
      }
    }
  });

  test('the report states the ABSENT status in human-readable form', () => {
    const m = buildPriyaModel();
    const report = buildKundliReportModel(m, 'en');
    const yogaSection = report.sections.find((s) => s.id === 'major-yogas')!;
    expect(yogaSection).toBeDefined();

    const text = JSON.stringify(yogaSection.blocks);
    expect(text).toContain('Gaja-Kesari Yoga');
    expect(text).toContain('Absent');
    expect(text).toContain('Not calculated');   // Kemadruma — rule not implemented
  });

  test('kalsarpa is declared NOT_CALCULATED rather than silently omitted', () => {
    const m = buildPriyaModel();
    const kalsarpa = m.doshas.find((d) => d.id === 'kalsarpa');
    expect(kalsarpa).toBeDefined();
    expect(kalsarpa!.result.status).toBe('NOT_CALCULATED');
    expect('notCalculatedReason' in kalsarpa!.result).toBe(true);
  });
});

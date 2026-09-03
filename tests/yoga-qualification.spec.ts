/**
 * REFERENCE-GRADE SPRINT I: Yoga/Dosha expansion qualification gate.
 * Guards qualification/yoga-qualification-runner.ts and YOGA_CATALOG_001.
 * Mission Sections 15-16.
 *
 * Pins as permanent regressions:
 *   - the curated catalog (44 yoga rules) pairing 1:1 with source-registry entries
 *     AND ruleRegistry cross-links;
 *   - existence/strength separation (charter §15): PRESENT ⇒ SCHOLAR_JUDGEMENT_REQUIRED,
 *     never a fabricated strength;
 *   - the ADHI bhava off-by-one regression (fixed during Sprint I: houses 6/7/8 from
 *     the Moon, not 7/8/9);
 *   - the Kalsarpa adoption: ONE_HEMISPHERE_NODE_AXIS, boundary ⇒ INDETERMINATE,
 *     twelve-name typing stays NOT_CALCULATED, four declared alternatives.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadYogaFixtureSet,
  runYogaQualificationDetailed,
  YOGA_QUALIFICATION_RUNNER_VERSION,
  DEFAULT_YOGA_SEED
} from '../qualification/yoga-qualification-runner';
import {
  evaluateYogas,
  YOGA_RULE_IDS,
  type YogaChartInput,
  type YogaPlanetInput
} from '../src/lib/jyotish/yogaEngine';
import { sourceEntryFor } from '../src/lib/jyotish/yogaSourceRegistry';
import { getClassicalRule, classicalRuleRegistryFingerprint, listClassicalRules, CLASSICAL_RULE_REGISTRY_VERSION } from '../src/lib/jyotish/ruleRegistry';
import { evaluateKalsarpa, DOSHA_ENGINE_VERSION } from '../src/lib/jyotish/doshaEngine';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

// fs-loaded (not a JSON import): the bundler reshapes JSON imports
const FIXTURE = loadYogaFixtureSet(
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'fixtures', 'yoga-fixtures.json'), 'utf8'))
);

/** Synthetic whole-sign chart builder: planetName -> bhava (1..12). Signs derived from Aries-lagna. */
function syntheticChart(bhavaOf: Record<string, number>): YogaChartInput {
  const planets: YogaPlanetInput[] = Object.entries(bhavaOf).map(([id, bhava]) => ({
    id,
    house: bhava,
    signId: ((bhava - 1 + 0) % 12) + 1, // Aries lagna: bhava k holds sign k
    signName: `sign ${((bhava - 1) % 12) + 1}`,
    longitudeDeg: ((bhava - 1) * 30) + 5
  }));
  return {
    planets,
    houseSigns: Array.from({ length: 12 }, (_, i) => i + 1),
    ascendantSignId: 1
  };
}

test.describe('SPRINT-I: fixture set integrity', () => {

  test('CT_INV_008: the fixture set is pinned and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('YOGA_CATALOG_001');
    expect(FIXTURE.yogaRuleCount).toBe(YOGA_RULE_IDS.length);
    expect(FIXTURE.registryRuleCount).toBe(listClassicalRules().length);
    expect(FIXTURE.ruleRegistryFingerprint).toBe(classicalRuleRegistryFingerprint());
    expect(FIXTURE.kalsarpaVariant).toBe('ONE_HEMISPHERE_NODE_AXIS');
    const tampered = JSON.parse(JSON.stringify(FIXTURE));
    tampered.yogaRuleCount = 99;
    expect(() => loadYogaFixtureSet(tampered)).toThrow(/sha mismatch/);
  });

  test('runner version and seed are pinned', () => {
    expect(YOGA_QUALIFICATION_RUNNER_VERSION).toBe('yoga-qualification-runner-1.0.0 (sprint I)');
    expect(DEFAULT_YOGA_SEED).toBe(0x9091);
    expect(DOSHA_ENGINE_VERSION).toContain('sprint I');
  });
});

test.describe('SPRINT-I: catalog ↔ registry pairing', () => {

  test('every yoga rule pairs with a source-registry entry and a ruleRegistry cross-link', () => {
    for (const id of YOGA_RULE_IDS) {
      const entry = sourceEntryFor(id); // throws when missing
      expect(entry.adoptedInterpretation.length).toBeGreaterThan(20);
      const cross = getClassicalRule(id);
      expect(cross, `${id} cross-link`).toBeDefined();
      expect(cross!.category).toBe('YOGA');
      expect(cross!.sourceLocator).toContain('NOT VERIFIED');
    }
    expect(YOGA_RULE_IDS).toHaveLength(44);
  });

  test('the NOT_ADOPTED set stays closed and reported NOT_CALCULATED', () => {
    for (const id of ['YOGA_KEMADRUMA', 'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA', 'YOGA_KALPADRUMA']) {
      expect(sourceEntryFor(id).adoption).toBe('NOT_ADOPTED');
    }
    const chart = syntheticChart({ Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 2 });
    for (const e of evaluateYogas(chart)) {
      if (['YOGA_KEMADRUMA', 'YOGA_DHARMA_KARMA_ADHIPATI_MUTUAL_KENDRA', 'YOGA_KALPADRUMA'].includes(e.id)) {
        expect(e.status).toBe('NOT_CALCULATED');
        expect(e.notCalculatedReason).toBeTruthy();
      }
    }
  });
});

test.describe('SPRINT-I: existence vs strength (charter §15)', () => {

  test('PRESENT yogas carry SCHOLAR_JUDGEMENT_REQUIRED strength — never a score', () => {
    // Budhaditya: Sun+Mercury in the same sign (bhava 1)
    const chart = syntheticChart({ Sun: 1, Mercury: 1, Moon: 4, Mars: 3, Jupiter: 5, Venus: 2, Saturn: 7, Rahu: 8, Ketu: 2 });
    const budhaditya = evaluateYogas(chart).find((e) => e.id === 'YOGA_BUDHADITYA')!;
    expect(budhaditya.status).toBe('PRESENT');
    expect(budhaditya.strength.status).toBe('SCHOLAR_JUDGEMENT_REQUIRED');
    expect(budhaditya.strength.note).toContain('charter');
    // ABSENT yogas carry NOT_APPLICABLE strength
    // Saturn at bhava 6 (Virgo): not a kendra, not own/exaltation — Sasa absent.
    const withSaturn6 = syntheticChart({ Sun: 1, Mercury: 1, Moon: 4, Mars: 3, Jupiter: 5, Venus: 2, Saturn: 6, Rahu: 8, Ketu: 2 });
    const sasa = evaluateYogas(withSaturn6).find((e) => e.id === 'YOGA_SASA')!;
    expect(sasa.status).toBe('ABSENT');
    expect(sasa.strength.status).toBe('NOT_APPLICABLE');
  });

  test('ADHI regression pin: benefics in 6/7/8 from the Moon — the fixed off-by-one', () => {
    // Aries-lagna synthetic; Moon in bhava 1 (sign 1). Benefics in bhavas 6/7/8
    // are the 6th/7th/8th FROM the Moon (Moon at bhava 1).
    const present = syntheticChart({ Sun: 3, Moon: 1, Mars: 4, Mercury: 6, Jupiter: 7, Venus: 8, Saturn: 10, Rahu: 9, Ketu: 3 });
    const adhi = evaluateYogas(present).find((e) => e.id === 'YOGA_ADHI')!;
    expect(adhi.status).toBe('PRESENT');
    // benefics one house later (7/8/9) must be ABSENT — this was the pre-fix PASSING case
    const absent = syntheticChart({ Sun: 3, Moon: 1, Mars: 4, Mercury: 7, Jupiter: 8, Venus: 9, Saturn: 10, Rahu: 10, Ketu: 4 });
    expect(evaluateYogas(absent).find((e) => e.id === 'YOGA_ADHI')!.status).toBe('ABSENT');
  });
});

test.describe('SPRINT-I: Kalsarpa adoption (charter §16)', () => {

  const all = (r: number): Record<string, number> =>
    Object.fromEntries(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map((g, i) => [g, ((r - 1 + 1 + (i % 4)) % 12) + 1]));

  test('all grahas in the Rahu→Ketu arc: PRESENT with declared variant and arc', () => {
    const r = evaluateKalsarpa({ grahaRashis: all(1), rahuRashiId: 1, ketuRashiId: 7 });
    expect(r.status).toBe('PRESENT');
    expect(r.arc).toBe('RAHU_TO_KETU');
    expect(r.variant).toBe('ONE_HEMISPHERE_NODE_AXIS');
    expect(r.typeNaming.status).toBe('NOT_CALCULATED');
    expect(r.declaredAlternatives).toHaveLength(4);
  });

  test('the mirrored arc also qualifies, with the arc recorded (direction-qualified reading declared as alternative)', () => {
    const r = evaluateKalsarpa({ grahaRashis: all(7), rahuRashiId: 1, ketuRashiId: 7 });
    expect(r.status).toBe('PRESENT');
    expect(r.arc).toBe('KETU_TO_RAHU');
  });

  test('split hemispheres: ABSENT with straddler evidence', () => {
    const grahaRashis = all(1);
    grahaRashis.Mars = ((7 - 1 + 3) % 12) + 1; // send Mars to the other arc
    const r = evaluateKalsarpa({ grahaRashis, rahuRashiId: 1, ketuRashiId: 7 });
    expect(r.status).toBe('ABSENT');
    expect(r.evidence.some((line) => line.includes('split'))).toBe(true);
  });

  test('a graha on a node rashi: INDETERMINATE (boundary variant, never guessed)', () => {
    const grahaRashis = all(1);
    grahaRashis.Sun = 1; // Rahu's own rashi
    const r = evaluateKalsarpa({ grahaRashis, rahuRashiId: 1, ketuRashiId: 7 });
    expect(r.status).toBe('INDETERMINATE');
    expect(r.notCalculatedReason).toContain('boundary');
  });

  test('inconsistent node axis: fail-closed NOT_CALCULATED', () => {
    const r = evaluateKalsarpa({ grahaRashis: all(1), rahuRashiId: 1, ketuRashiId: 2 });
    expect(r.status).toBe('NOT_CALCULATED');
    expect(r.notCalculatedReason).toContain('inconsistent');
  });

  test('the registry carries the adopted rule and the snapshot computes it', () => {
    const rule = getClassicalRule('RULE_KALSARPA_HEMISPHERE');
    expect(rule?.adoption).toBe('ADOPTED');
    expect(rule?.sourceVerification).toBe('SOURCE_SECONDARY');
    expect(getClassicalRule('RULE_KALSARPA_VARIANTS')?.adoption).toBe('NOT_ADOPTED'); // the variant register itself
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376,
      timezone: 5.5, locationName: 'Patna', targetDate: new Date('2026-09-03T06:00:00Z')
    });
    const ks = snap.yogasAndDoshas.kalsarpa as unknown as Record<string, unknown>;
    expect(['PRESENT', 'ABSENT', 'INDETERMINATE']).toContain(ks.status);
    expect(ks.variant).toBe('ONE_HEMISPHERE_NODE_AXIS');
    expect(Array.isArray(ks.evidence)).toBe(true);
    expect((ks.typeNaming as { status: string }).status).toBe('NOT_CALCULATED');
  });
});

test.describe('SPRINT-I: qualification gate', () => {

  test('scaffold gate run (400 scenarios) passes with zero violations', () => {
    test.setTimeout(600000);
    const { report } = runYogaQualificationDetailed({
      scenarios: 400, gate: 'scaffold', fixtureSet: FIXTURE
    });
    expect(report.verdict).toBe('PASS');
    expect(report.totalViolations).toBe(0);
  });

  test('the committed summary artifact carries the strict 2k PASS verdict', () => {
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'yoga-summary.json'), 'utf8'));
    expect(summary.verdict).toBe('PASS');
    expect(summary.gate).toBe('strict');
    expect(summary.scenarios).toBe(2000);
    expect(summary.totalViolations).toBe(0);
    expect(summary.streamB.checks).toBe(170000);
    expect(summary.streamA.yogaRuleCount).toBe(44);
    expect(summary.determinism.mismatches).toBe(0);
  });

  test('the failures artifact records zero violations', () => {
    const failures = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'yoga-failures.json'), 'utf8'));
    expect(failures.totalViolations).toBe(0);
    expect(failures.failures).toHaveLength(0);
  });

  test('declared simplifications stay visible', () => {
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'yoga-summary.json'), 'utf8'));
    const ids = summary.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain('DECLARED_EXISTENCE_ONLY_ENGINE');
    expect(ids).toContain('DECLARED_KALSARPA_NAMING_OPEN');
    for (const f of summary.findings) expect(f.severity).toBe('NON_BLOCKING');
    expect(CLASSICAL_RULE_REGISTRY_VERSION).toContain('sprint H');
  });
});

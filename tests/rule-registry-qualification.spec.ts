/**
 * REFERENCE-GRADE SPRINT H: Classical Rule Registry + source provenance qualification gate.
 * Guards qualification/rule-registry-qualification-runner.ts and COMBUSTION_RULE_REGISTRY_001.
 * Mission Sections 13-14. Flagship risk: RSK_002 (combustion orbs discrepancy).
 *
 * Pins as permanent regressions:
 *   - the charter §14 rule shape with the 4 allowed source statuses and SOURCE_VERIFIED
 *     impossible while the repo holds no licensed edition;
 *   - the RSK_002 borderline band: |separation − orb| ≤ 1° ⇒ scholarJudgementRequired;
 *   - the adopted combustion orbs with the retrograde branches (Mercury 14/12, Venus 10/8);
 *   - the snapshot provenance stamp (meta.ruleRegistry fingerprint ≡ live registry);
 *   - the observatory page no longer duplicates combustion magic numbers.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
// loaded via fs (not a JSON import): the bundler's JSON-import reshapes the
// object and would break content-addressed verification
const fixtureJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'qualification', 'fixtures', 'rule-registry-fixtures.json'), 'utf8')
);
import {
  loadRuleRegistryFixtureSet,
  runRuleRegistryQualificationDetailed,
  RULE_REGISTRY_QUALIFICATION_RUNNER_VERSION,
  DEFAULT_RULE_REGISTRY_SEED
} from '../qualification/rule-registry-qualification-runner';
import {
  listClassicalRules,
  getClassicalRule,
  registerClassicalRule,
  classicalRuleRegistryFingerprint,
  CLASSICAL_RULE_REGISTRY_VERSION,
  RuleRegistryError,
  REPO_HOLDS_LICENSED_EDITIONS
} from '../src/lib/jyotish/ruleRegistry';
import { checkCombustion, COMBUSTION_ORB_TABLE_V2, COMBUSTION_ORBS } from '../src/lib/jyotish/relationshipEngine';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';

const FIXTURE = loadRuleRegistryFixtureSet(fixtureJson);

test.describe('SPRINT-H: fixture set integrity', () => {

  test('CT_INV_008: the fixture set is pinned and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('COMBUSTION_RULE_REGISTRY_001');
    expect(FIXTURE.registryVersion).toBe(CLASSICAL_RULE_REGISTRY_VERSION);
    expect(FIXTURE.fingerprint).toBe(classicalRuleRegistryFingerprint());
    expect(FIXTURE.ruleCount).toBe(listClassicalRules().length);
    expect(FIXTURE.borderlineBandDeg).toBe(1);
    // tamper evidence: mutate one orb and the sha must break
    const tampered = JSON.parse(JSON.stringify(FIXTURE));
    tampered.combustionOrbTable.Mercury.adopted.retrograde = 14;
    expect(() => loadRuleRegistryFixtureSet(tampered)).toThrow(/sha mismatch/);
  });

  test('runner version and seed are pinned', () => {
    expect(RULE_REGISTRY_QUALIFICATION_RUNNER_VERSION).toBe('rule-registry-qualification-runner-1.0.0 (sprint H)');
    expect(DEFAULT_RULE_REGISTRY_SEED).toBe(0x7d13);
  });
});

test.describe('SPRINT-H: registry honesty (charter §14)', () => {

  test('SOURCE_VERIFIED cannot be registered without a licensed edition', () => {
    expect(REPO_HOLDS_LICENSED_EDITIONS).toBe(false);
    expect(() =>
      registerClassicalRule({
        id: 'PROBE_VERIFIED_RULE', sanskritName: 'x', englishName: 'x', category: 'GRAHA_CONDITION',
        tradition: 't', source: 's', sourceLocator: 'claims verification', sourceVerification: 'SOURCE_VERIFIED',
        originalText: 'x', translation: 'x', adoptedInterpretation: 'an adopted interpretation here',
        alternateInterpretations: [], prerequisites: [], evaluator: 'a::b', evidencePaths: ['x'],
        validationStatus: 'IMPLEMENTED', adoption: 'ADOPTED', scholarReviews: [], version: '1.0.0'
      })
    ).toThrow(RuleRegistryError);
  });

  test('no registered rule claims a verified locator or quotes reconstructed verses', () => {
    for (const r of listClassicalRules()) {
      expect(r.sourceVerification).not.toBe('SOURCE_VERIFIED');
      expect(r.sourceLocator).toMatch(/NOT VERIFIED/);
      expect(r.originalText).toMatch(/NOT RECORDED/);
    }
  });

  test('Kalsarpa exposure stays closed while its variants are NOT_ADOPTED', () => {
    const r = getClassicalRule('RULE_KALSARPA_VARIANTS');
    expect(r?.adoption).toBe('NOT_ADOPTED');
    expect(r?.validationStatus).toBe('NOT_IMPLEMENTED');
    expect(r?.alternateInterpretations.length).toBeGreaterThanOrEqual(3);
  });

  test('every EXTERNALLY_VERIFIED rule cites qualification evidence', () => {
    for (const r of listClassicalRules()) {
      if (r.validationStatus === 'EXTERNALLY_VERIFIED' || r.validationStatus === 'SCHOLAR_VERIFIED') {
        expect(r.evidencePaths.some((p) => p.startsWith('qualification/') || p.startsWith('docs/reference-grade/'))).toBe(true);
      }
    }
  });
});

test.describe('SPRINT-H: combustion rule (RSK_002)', () => {

  test('the adopted orb table is exactly the declared set, with declared alternatives', () => {
    expect(COMBUSTION_ORBS).toEqual({
      Moon: { direct: 12, retrograde: 12 },
      Mars: { direct: 17, retrograde: 17 },
      Mercury: { direct: 14, retrograde: 12 },
      Jupiter: { direct: 11, retrograde: 11 },
      Venus: { direct: 10, retrograde: 8 },
      Saturn: { direct: 15, retrograde: 15 }
    });
    // Mercury and Venus carry the contested alternative orbs; the Moon carries the exemption variant
    expect(COMBUSTION_ORB_TABLE_V2.Mercury.alternatives.length).toBe(1);
    expect(COMBUSTION_ORB_TABLE_V2.Mercury.alternatives[0].retrograde).toBe(14);
    expect(COMBUSTION_ORB_TABLE_V2.Venus.alternatives.length).toBe(1);
    expect(COMBUSTION_ORB_TABLE_V2.Moon.alternatives[0].statement).toContain('exempt');
  });

  test('RSK_002 example: Mercury at 13° is combust direct, non-combust retrograde, borderline both', () => {
    const direct = checkCombustion('Mercury', 13, 0, false);
    const retro = checkCombustion('Mercury', 13, 0, true);
    expect(direct.isCombust).toBe(true);
    expect(retro.isCombust).toBe(false);
    expect(direct.borderline).toBe(true);
    expect(retro.scholarJudgementRequired).toBe(true);
  });

  test('the borderline band is exactly ±1° on both sides of the adopted orb', () => {
    const inBand = checkCombustion('Jupiter', 12, 0, false); // orb 11 → orb+1
    const outBand = checkCombustion('Jupiter', 12.02, 0, false); // orb+1.02
    const inner = checkCombustion('Jupiter', 10, 0, false); // orb−1
    expect(inBand.borderline).toBe(true);
    expect(inBand.isCombust).toBe(false);
    expect(outBand.borderline).toBe(false);
    expect(inner.borderline).toBe(true);
    expect(inner.isCombust).toBe(true);
  });

  test('severity bands stay intact and non-applicable bodies are flagged', () => {
    expect(checkCombustion('Mars', 5, 0).severity).toBe('DEEP_COMBUST'); // 5 ≤ 17/3
    expect(checkCombustion('Mars', 10, 0).severity).toBe('COMBUST');
    expect(checkCombustion('Mars', 18.5, 0).severity).toBe('NEAR_COMBUST');
    expect(checkCombustion('Mars', 25, 0).severity).toBe('SAFE');
    for (const p of ['Sun', 'Rahu', 'Ketu'] as const) {
      const r = checkCombustion(p, 10, 0);
      expect(r.applicable).toBe(false);
      expect(r.scholarJudgementRequired).toBe(false);
    }
  });
});

test.describe('SPRINT-H: provenance surface', () => {

  test('canonicalSnapshot.meta stamps the live registry fingerprint', () => {
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376,
      timezone: 5.5, locationName: 'Patna', targetDate: new Date('2026-09-03T06:00:00Z')
    });
    const meta = (snap.meta as unknown as { ruleRegistry: { fingerprint: string; ruleCount: number; registryVersion: string } }).ruleRegistry;
    expect(meta.registryVersion).toBe(CLASSICAL_RULE_REGISTRY_VERSION);
    expect(meta.fingerprint).toBe(classicalRuleRegistryFingerprint());
    // Sprint I expanded the registry (24 -> 59); Sprint L added the four Tajika rules (59 -> 63).
    expect(meta.ruleCount).toBe(63);
    // combustion rows carry the registry pointer + RSK_002 flags
    const marsRow = snap.relationships?.combustions.Mars as unknown as { registryRuleId?: string; applicable?: boolean; borderline?: boolean };
    expect(marsRow.registryRuleId).toBe('RULE_COMBUSTION_ORBS');
    expect(marsRow.applicable).toBe(true);
    expect(typeof marsRow.borderline).toBe('boolean');
    expect(snap.relationships?.combustions.Sun.applicable).toBe(false);
  });

  test('the observatory page consumes the shared rule — no magic combustion numbers remain', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'observatory', 'page.tsx'), 'utf8');
    expect(src).toContain('checkCombustion');
    expect(src).not.toMatch(/isCombust:\s*Math\.abs\(/);
    expect(src).toContain('combustBorderline');
  });
});

test.describe('SPRINT-H: qualification gate', () => {

  test('scaffold gate run (2,000 scenarios) passes with zero violations', () => {
    test.setTimeout(600000);
    const { report } = runRuleRegistryQualificationDetailed({
      scenarios: 2000, gate: 'scaffold', fixtureSet: FIXTURE
    });
    expect(report.verdict).toBe('PASS');
    expect(report.totalViolations).toBe(0);
  });

  test('the committed summary artifact carries the strict 20k PASS verdict', () => {
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'rule-registry-summary.json'), 'utf8'));
    expect(summary.verdict).toBe('PASS');
    expect(summary.gate).toBe('strict');
    expect(summary.scenarios).toBe(20000);
    expect(summary.totalViolations).toBe(0);
    expect(summary.streamB.checks).toBe(126665);
    // Sprint I expansion: 24 -> 59; Sprint L Tajika rules: 59 -> 63.
    expect(summary.streamA.ruleCount).toBe(63);
    expect(summary.determinism.mismatches).toBe(0);
  });

  test('the failures artifact records zero violations', () => {
    const failures = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'rule-registry-failures.json'), 'utf8'));
    expect(failures.totalViolations).toBe(0);
    expect(failures.failures).toHaveLength(0);
  });

  test('declared simplifications stay visible', () => {
    const summary = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'rule-registry-summary.json'), 'utf8'));
    const ids = summary.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain('DECLARED_NO_LICENSED_EDITIONS');
    expect(ids).toContain('DECLARED_BORDERLINE_NEEDS_SCHOLAR');
    for (const f of summary.findings) expect(f.severity).toBe('NON_BLOCKING');
  });
});

/**
 * RULE REGISTRY QUALIFICATION RUNNER — Sprint H (Classical Rule Registry + source provenance).
 * Mission Sections 13, 14 & 41. Flagship risk: RSK_002 (combustion orbs discrepancy).
 *
 * Streams:
 *   A. REGISTRY_INTEGRITY   — schema of every registered rule (charter §14 field set,
 *                             only the 4 allowed source statuses, SOURCE_VERIFIED
 *                             impossible without a licensed edition, NOT_ADOPTED ⇔
 *                             NOT_IMPLEMENTED, EXTERNALLY_VERIFIED evidenced),
 *                             fingerprint determinism, exact counts, yoga cross-link
 *                             completeness, Kalsarpa exposure stays closed.
 *   B. COMBUSTION_IDENTITY  — seeded random scenarios: independent recomputation of
 *                             separation, isCombust ⇔ separation ≤ adopted orb, exact
 *                             severity bands, borderline ⇔ |sep − orb| ≤ 1°
 *                             (scholarJudgementRequired), applicability, and the
 *                             RSK_002 retrograde-orb branches (Mercury 14/12,
 *                             Venus 10/8).
 *   C. PROVENANCE_SURFACE   — canonicalSnapshot.meta stamps the live registry
 *                             fingerprint; every snapshot combustion row carries the
 *                             registry rule id; v40 combustion blocks carry the
 *                             borderline flags.
 *   D. DETERMINISM          — fingerprint byte-stability across repeated evaluation.
 *
 * Usage:
 *   npm run qualify:registry             # 20,000 combustion identity scenarios
 *   npm run qualify:registry:scaffold    # 2,000
 *   npx tsx qualification/rule-registry-qualification-runner.ts --scenarios 5000
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  listClassicalRules,
  getClassicalRule,
  registerClassicalRule,
  classicalRuleCount,
  classicalRuleRegistryFingerprint,
  CLASSICAL_RULE_REGISTRY_VERSION,
  REPO_HOLDS_LICENSED_EDITIONS,
  RuleRegistryError,
  type ClassicalRule
} from '../src/lib/jyotish/ruleRegistry';
import {
  checkCombustion,
  COMBUSTION_ORB_TABLE_V2,
  COMBUSTION_ORBS,
  COMBUSTION_BORDERLINE_BAND_DEG
} from '../src/lib/jyotish/relationshipEngine';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { YOGA_SOURCE_REGISTRY } from '../src/lib/jyotish/yogaSourceRegistry';
import { calculateCelestialEphemeris } from '../src/lib/jyotish/celestialEngine';

export const RULE_REGISTRY_QUALIFICATION_RUNNER_VERSION = 'rule-registry-qualification-runner-1.0.0 (sprint H)';
export const DEFAULT_RULE_REGISTRY_SEED = 0x7d13;

export type RuleRegistryQualificationGate = 'scaffold' | 'strict';

export class RuleRegistryQualificationError extends Error {
  constructor(
    public readonly errorCode:
      | 'FIXTURE_SET_INVALID'
      | 'REGISTRY_INTEGRITY_VIOLATION'
      | 'COMBUSTION_IDENTITY_VIOLATION'
      | 'PROVENANCE_SURFACE_VIOLATION'
      | 'DETERMINISM_HARD_MISMATCH',
    message: string,
    public readonly detail: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RuleRegistryQualificationError';
  }
}

/* ------------------------------------------------------------------------- */
/* Fixture set                                                                */
/* ------------------------------------------------------------------------- */

export interface RuleRegistryFixtureSet {
  fixtureSetId: string;
  builder: string;
  engineNote: string;
  registryVersion: string;
  fingerprint: string;
  ruleCount: number;
  yogaCrossLinkCount: number;
  yogaSourceRegistryVersion: string;
  borderlineBandDeg: number;
  combustionOrbTable: Record<string, {
    adopted: { direct: number; retrograde: number };
    alternativeCount: number;
    alternativeOrbs: Array<{ direct: number; retrograde: number }>;
    sourceStatus: string;
    locator: string;
  }>;
  rules: Array<{
    id: string; version: string; category: string; tradition: string;
    sourceVerification: string; validationStatus: string; adoption: string;
    evaluator: string; evidencePathCount: number;
  }>;
  setSha256: string;
}

/** Key-sorted recursive stringify: hashing is independent of object key order. */
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  return '{' + Object.keys(v as Record<string, unknown>).sort()
    .map((k) => JSON.stringify(k) + ':' + stableStringify((v as Record<string, unknown>)[k]))
    .join(',') + '}';
}

export function loadRuleRegistryFixtureSet(raw: unknown): RuleRegistryFixtureSet {
  const f = raw as RuleRegistryFixtureSet;
  if (!f || f.fixtureSetId !== 'COMBUSTION_RULE_REGISTRY_001') {
    throw new RuleRegistryQualificationError('FIXTURE_SET_INVALID', 'Unknown rule-registry fixture set', { received: (f as { fixtureSetId?: string })?.fixtureSetId });
  }
  const { setSha256, fixtureSetId: _id, builder: _b, engineNote: _n, ...core } = f;
  void _id; void _b; void _n;
  const digest = crypto.createHash('sha256').update(stableStringify(core)).digest('hex');
  if (digest !== setSha256) {
    throw new RuleRegistryQualificationError('FIXTURE_SET_INVALID', 'Rule-registry fixture sha mismatch — rebuild with tools/build-rule-registry-fixtures.ts and review the diff (CT_INV_008)', { expected: setSha256, actual: digest });
  }
  return f;
}

/* ------------------------------------------------------------------------- */
/* Seeded RNG                                                                 */
/* ------------------------------------------------------------------------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMBUSTIBLE = ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const NON_APPLICABLE = ['Sun', 'Rahu', 'Ketu'];

/* ------------------------------------------------------------------------- */
/* Stream A — registry integrity                                              */
/* ------------------------------------------------------------------------- */

export interface StreamAReport { checks: number; violations: number; ruleCount: number; firstViolations: string[] }

function runStreamA(fixtureSet: RuleRegistryFixtureSet): StreamAReport {
  let checks = 0, violations = 0;
  const firstViolations: string[] = [];
  const fail = (msg: string) => {
    violations += 1;
    if (firstViolations.length < 20) firstViolations.push(msg);
  };
  const rules = listClassicalRules();

  // (1) exact counts vs fixture
  checks++;
  if (rules.length !== fixtureSet.ruleCount) fail(`rule count ${rules.length} != fixture ${fixtureSet.ruleCount}`);
  checks++;
  if (classicalRuleCount() !== rules.length) fail('classicalRuleCount disagrees with listClassicalRules');
  checks++;
  const yogaIds = Object.keys(YOGA_SOURCE_REGISTRY);
  const yogaCrossLinks = rules.filter((r) => r.id.startsWith('YOGA_'));
  if (yogaCrossLinks.length !== yogaIds.length) fail(`yoga cross-links ${yogaCrossLinks.length} != yogaSourceRegistry ${yogaIds.length}`);
  checks++;
  if (fixtureSet.yogaCrossLinkCount !== yogaIds.length) fail('fixture yoga cross-link count stale');

  // (2) per-rule schema (charter §14)
  for (const r of rules) {
    checks++;
    if (!/^[A-Z][A-Z0-9_]+$/.test(r.id)) fail(`${r.id}: id not UPPER_SNAKE_CASE`);
    checks++;
    if (!r.sanskritName || !r.englishName) fail(`${r.id}: missing names`);
    checks++;
    if (!['SOURCE_VERIFIED', 'SOURCE_SECONDARY', 'ATTRIBUTION_UNVERIFIED', 'SOURCE_PENDING'].includes(r.sourceVerification)) {
      fail(`${r.id}: disallowed sourceVerification ${r.sourceVerification}`);
    }
    checks++;
    if (r.sourceVerification === 'SOURCE_VERIFIED' && !REPO_HOLDS_LICENSED_EDITIONS) fail(`${r.id}: SOURCE_VERIFIED without a licensed edition`);
    checks++;
    if (r.adoptedInterpretation.trim().length < 10) fail(`${r.id}: empty adoptedInterpretation`);
    checks++;
    if (!r.evaluator.includes('::')) fail(`${r.id}: evaluator not a path::symbol pointer`);
    checks++;
    if (r.evidencePaths.length === 0) fail(`${r.id}: no evidencePaths`);
    checks++;
    if ((r.adoption === 'NOT_ADOPTED') !== (r.validationStatus === 'NOT_IMPLEMENTED')) fail(`${r.id}: adoption/validationStatus mismatch`);
    checks++;
    if ((r.validationStatus === 'EXTERNALLY_VERIFIED' || r.validationStatus === 'SCHOLAR_VERIFIED') &&
      !r.evidencePaths.some((p) => p.startsWith('qualification/') || p.startsWith('docs/reference-grade/'))) {
      fail(`${r.id}: external claim without qualification evidence`);
    }
    checks++;
    if (r.originalText.startsWith('NOT RECORDED') === false && r.sourceVerification !== 'SOURCE_VERIFIED') {
      fail(`${r.id}: originalText must stay the NOT RECORDED statement while no licensed edition exists`);
    }
    checks++;
    if (!/NOT VERIFIED/.test(r.sourceLocator)) fail(`${r.id}: locator must carry the NOT VERIFIED honesty statement`);
    checks++;
    if (!/^\d+\.\d+\.\d+/.test(r.version)) fail(`${r.id}: version not semver-like`);
  }

  // (3) the exact fixture rules match live rules (id, statuses, versions)
  for (const fr of fixtureSet.rules) {
    const live = getClassicalRule(fr.id);
    checks++;
    if (!live) { fail(`fixture rule ${fr.id} missing from live registry`); continue; }
    checks++;
    if (live.version !== fr.version || live.sourceVerification !== fr.sourceVerification ||
      live.validationStatus !== fr.validationStatus || live.adoption !== fr.adoption) {
      fail(`fixture/live drift for ${fr.id}`);
    }
  }

  // (4) fail-closed registration behavior
  const probe = (rule: Partial<ClassicalRule>): string | null => {
    try {
      registerClassicalRule({
        id: 'PROBE_RULE', sanskritName: 'x', englishName: 'x', category: 'GRAHA_CONDITION',
        tradition: 't', source: 's', sourceLocator: 'NOT VERIFIED', sourceVerification: 'SOURCE_PENDING',
        originalText: 'NOT RECORDED', translation: 'NOT RECORDED', adoptedInterpretation: 'an adopted interpretation here',
        alternateInterpretations: [], prerequisites: [], evaluator: 'a::b', evidencePaths: ['x'],
        validationStatus: 'IMPLEMENTED', adoption: 'ADOPTED', scholarReviews: [], version: '1.0.0', ...rule
      } as ClassicalRule);
      return null; // registered — clean up not possible in Map; acceptable only for acceptance paths
    } catch (e) {
      return (e as RuleRegistryError).errorCode;
    }
  };
  // NOTE: a successful PROBE_RULE would pollute the registry; use guaranteed-throw cases only.
  checks++;
  if (probe({ sourceVerification: 'SOURCE_VERIFIED' }) !== 'SOURCE_VERIFIED_IMPOSSIBLE') fail('SOURCE_VERIFIED registration did not fail closed');
  checks++;
  if (probe({ sourceVerification: 'VALIDATED_EXPERT' as unknown as ClassicalRule['sourceVerification'] }) !== 'SOURCE_STATUS_DISALLOWED') fail('unknown source status did not fail closed');
  checks++;
  if (probe({ adoptedInterpretation: 'short' }) !== 'RULE_INVALID') fail('thin adoptedInterpretation did not fail closed');
  checks++;
  if (probe({ evaluator: 'noSeparator' }) !== 'RULE_INVALID') fail('bad evaluator did not fail closed');
  checks++;
  if (probe({ id: 'PROBE_RULE2', adoption: 'NOT_ADOPTED', validationStatus: 'IMPLEMENTED' }) !== 'RULE_INVALID') fail('NOT_ADOPTED with IMPLEMENTED did not fail closed');
  checks++;
  if (probe({ id: 'PROBE_RULE3', validationStatus: 'EXTERNALLY_VERIFIED', evidencePaths: ['src/x.ts'] }) !== 'EXTERNAL_CLAIM_UNEVIDENCED') fail('unevidenced external claim did not fail closed');

  // (5) Kalsarpa exposure stays closed while the variant rule is NOT_ADOPTED
  checks++;
  const kalsarpa = getClassicalRule('RULE_KALSARPA_VARIANTS');
  if (!kalsarpa || kalsarpa.adoption !== 'NOT_ADOPTED' || kalsarpa.validationStatus !== 'NOT_IMPLEMENTED') {
    fail('Kalsarpa variant rule must stay NOT_ADOPTED / NOT_IMPLEMENTED until Sprint I adopts a variant');
  }

  // (6) fingerprint determinism within-process
  checks++;
  if (classicalRuleRegistryFingerprint() !== classicalRuleRegistryFingerprint()) fail('fingerprint not deterministic in-process');
  checks++;
  if (classicalRuleRegistryFingerprint() !== fixtureSet.fingerprint) fail('live fingerprint drifted from the fixture pin');

  return { checks, violations, ruleCount: rules.length, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Stream B — combustion identity                                             */
/* ------------------------------------------------------------------------- */

export interface StreamBReport { scenarios: number; checks: number; violations: number; firstViolations: string[] }

function runStreamB(scenarios: number, seed: number): StreamBReport {
  const rnd = mulberry32(seed);
  let checks = 0, violations = 0;
  const firstViolations: string[] = [];
  const fail = (msg: string) => {
    violations += 1;
    if (firstViolations.length < 20) firstViolations.push(msg);
  };

  // (1) RSK_002 flagship branches: retrograde orbs actually change the verdict
  // Mercury at 13° separation: combust when direct (orb 14), NOT when retrograde (orb 12).
  checks++;
  const mercDirect = checkCombustion('Mercury', 13, 0, false);
  const mercRetro = checkCombustion('Mercury', 13, 0, true);
  if (!(mercDirect.isCombust && !mercRetro.isCombust)) fail('Mercury 13°: direct/retrograde orb branch broken (RSK_002 example)');
  checks++;
  if (!(mercRetro.borderline && mercRetro.scholarJudgementRequired)) fail('Mercury retrograde 13° (1° inside the 12° orb) must be borderline');
  // Venus at 9°: combust direct (orb 10), NOT retrograde (orb 8), borderline both.
  checks++;
  const venusDirect = checkCombustion('Venus', 9, 0, false);
  const venusRetro = checkCombustion('Venus', 9, 0, true);
  if (!(venusDirect.isCombust && !venusRetro.isCombust)) fail('Venus 9°: direct/retrograde orb branch broken');
  // A planet at orb + 1 = borderline but NOT combust; at orb + 1.01 not borderline.
  checks++;
  const edge = checkCombustion('Jupiter', 12, 0, false); // orb 11 -> 12 is orb+1
  if (!(!edge.isCombust && edge.borderline && edge.severity === 'NEAR_COMBUST')) fail('Jupiter 12° (orb+1) must be non-combust, borderline, NEAR_COMBUST');
  checks++;
  const outside = checkCombustion('Jupiter', 12.02, 0, false);
  if (outside.borderline) fail('Jupiter 12.02° (orb+1.02) must NOT be borderline');

  // (2) seeded random identity sweep
  let borderlineCount = 0;
  const planets = [...COMBUSTIBLE, ...NON_APPLICABLE];
  for (let s = 0; s < scenarios; s++) {
    let planet = planets[Math.floor(rnd() * planets.length)];
    let lon = rnd() * 360;
    let sunLon = rnd() * 360;
    const isRetrograde = rnd() < 0.3;
    // every 10th scenario is CONSTRUCTED to sit within the borderline band, so
    // the RSK_002 flag is exercised deterministically (random landings there
    // are ~1% per scenario and cannot be relied on for coverage).
    if (s % 10 === 0 && COMBUSTIBLE.includes(planet)) {
      const orb = isRetrograde ? COMBUSTION_ORB_TABLE_V2[planet].adopted.retrograde : COMBUSTION_ORB_TABLE_V2[planet].adopted.direct;
      sunLon = 0;
      lon = orb + (rnd() * 2 - 1);
    }
    const r = checkCombustion(planet, lon, sunLon, isRetrograde);

    checks++;
    if (r.registryRuleId !== 'RULE_COMBUSTION_ORBS') fail(`scenario ${s} ${planet}: registryRuleId missing`);

    if (NON_APPLICABLE.includes(planet)) {
      checks++;
      if (r.applicable !== false || r.isCombust !== false) fail(`scenario ${s} ${planet}: non-applicable body must be applicable=false, isCombust=false`);
      checks++;
      if (r.borderline !== false || r.scholarJudgementRequired !== false) fail(`scenario ${s} ${planet}: non-applicable body must not be borderline`);
      continue;
    }

    // independent recomputation of separation
    let diff = Math.abs(lon - sunLon);
    if (diff > 180) diff = 360 - diff;
    const orbCfg = COMBUSTION_ORB_TABLE_V2[planet].adopted;
    const orb = isRetrograde ? orbCfg.retrograde : orbCfg.direct;

    checks++;
    if (Math.abs(r.angularDistanceToSun - diff) > 1e-12) fail(`scenario ${s} ${planet}: separation ${r.angularDistanceToSun} != recomputed ${diff}`);
    checks++;
    if (r.combustionOrb !== orb) fail(`scenario ${s} ${planet}: orb ${r.combustionOrb} != table ${orb} (retro=${isRetrograde})`);
    checks++;
    if (r.isCombust !== (diff <= orb)) fail(`scenario ${s} ${planet}: isCombust ${r.isCombust} vs separation ${diff} ≤ orb ${orb}`);
    checks++;
    const expectedSeverity = diff <= orb / 3 ? 'DEEP_COMBUST' : diff <= orb ? 'COMBUST' : diff <= orb + 2 ? 'NEAR_COMBUST' : 'SAFE';
    if (r.severity !== expectedSeverity) fail(`scenario ${s} ${planet}: severity ${r.severity} != ${expectedSeverity}`);
    checks++;
    const expectedBorderline = Math.abs(diff - orb) <= COMBUSTION_BORDERLINE_BAND_DEG;
    if (r.borderline !== expectedBorderline) fail(`scenario ${s} ${planet}: borderline ${r.borderline} vs |${diff}-${orb}| ≤ 1`);
    checks++;
    if (r.scholarJudgementRequired !== expectedBorderline) fail(`scenario ${s} ${planet}: scholarJudgementRequired must equal borderline`);
    checks++;
    if (r.applicable !== true) fail(`scenario ${s} ${planet}: applicable must be true`);

    // borderline cases on BOTH sides of the threshold must exist across the sweep
    if (r.borderline) borderlineCount += 1;
  }

  // coverage: borderline must be reachable on BOTH sides of the threshold
  checks++;
  if (borderlineCount === 0) fail('seeded sweep produced no borderline cases at all');
  for (const delta of [-1, 1]) {
    for (const planet of COMBUSTIBLE) {
      const orb = COMBUSTION_ORBS[planet].direct;
      const r = checkCombustion(planet, orb + delta, 0, false);
      checks++;
      if (!r.borderline) fail(`${planet} at orb${delta > 0 ? '+' : ''}${delta}° must be borderline`);
      checks++;
      if ((delta < 0) !== r.isCombust) fail(`${planet} at orb${delta > 0 ? '+' : ''}${delta}°: isCombust side wrong`);
    }
  }

  return { scenarios, checks, violations, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Stream C — provenance surface                                              */
/* ------------------------------------------------------------------------- */

interface CombustionStateLite {
  isCombust: boolean;
  angularDistanceToSun: number;
  combustionOrb: number;
  severity: string;
  applicable?: boolean;
  borderline?: boolean;
  scholarJudgementRequired?: boolean;
  registryRuleId?: string;
}

export interface StreamCReport { checks: number; violations: number; firstViolations: string[] }

function runStreamC(): StreamCReport {
  let checks = 0, violations = 0;
  const firstViolations: string[] = [];
  const fail = (msg: string) => {
    violations += 1;
    if (firstViolations.length < 20) firstViolations.push(msg);
  };

  const snap = getCanonicalJyotishSnapshot({
    birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376,
    timezone: 5.5, locationName: 'Patna', targetDate: new Date('2026-09-03T06:00:00Z')
  });

  // meta stamp
  checks++;
  const meta = (snap.meta as unknown as { ruleRegistry?: { registryVersion: string; fingerprint: string; ruleCount: number } }).ruleRegistry;
  if (!meta) fail('canonicalSnapshot.meta.ruleRegistry missing');
  else {
    checks++;
    if (meta.registryVersion !== CLASSICAL_RULE_REGISTRY_VERSION) fail(`meta registryVersion ${meta.registryVersion}`);
    checks++;
    if (meta.fingerprint !== classicalRuleRegistryFingerprint()) fail('meta fingerprint != live registry fingerprint');
    checks++;
    if (meta.ruleCount !== classicalRuleCount()) fail('meta ruleCount != live ruleCount');
  }

  // combustion rows carry the registry pointer
  const combustions = (snap.relationships?.combustions ?? {}) as unknown as Record<string, CombustionStateLite>;
  for (const planet of ['Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']) {
    checks++;
    const row = combustions?.[planet];
    if (!row) { fail(`snapshot combustion row for ${planet} missing`); continue; }
    if (row.registryRuleId !== 'RULE_COMBUSTION_ORBS') fail(`${planet}: registryRuleId ${row.registryRuleId}`);

    checks++;
    if (row.applicable !== true) fail(`${planet}: applicable flag missing on combustible body`);
    checks++;
    if (typeof row.borderline !== 'boolean' || typeof row.scholarJudgementRequired !== 'boolean') fail(`${planet}: RSK_002 flags missing`);
  }
  for (const planet of ['Sun', 'Rahu', 'Ketu']) {
    checks++;
    const row = combustions?.[planet];
    if (!row) { fail(`snapshot combustion row for ${planet} missing`); continue; }
    if (row.applicable !== false) fail(`${planet}: applicable must be false`);
  }

  // snapshot longitudes + combustion: independently recompute separation from the snapshot itself
  const sunLon = (snap.planetsArray as Array<{ name: string; longitude: number }>).find((p) => p.name === 'Sun')!.longitude;
  for (const planet of COMBUSTIBLE) {
    const row = combustions[planet];
    const p = (snap.planetsArray as Array<{ name: string; longitude: number; isRetrograde?: boolean }>).find((x) => x.name === planet)!;
    let diff = Math.abs(p.longitude - sunLon);
    if (diff > 180) diff = 360 - diff;
    const orb = COMBUSTION_ORBS[planet][p.isRetrograde ? 'retrograde' : 'direct'];
    checks++;
    if (Math.abs(row.angularDistanceToSun - diff) > 1e-9 || row.combustionOrb !== orb) fail(`${planet}: snapshot combustion disagrees with recomputation`);
  }

  return { checks, violations, firstViolations };
}

/* ------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* ------------------------------------------------------------------------- */

export interface RuleRegistryQualificationReport {
  runnerVersion: string;
  registryVersion: string;
  fixtureSetId: string;
  fixtureSetSha256: string;
  gate: RuleRegistryQualificationGate;
  scenarios: number;
  seed: number;
  generatedAtUtc: string;
  verdict: 'PASS' | 'FAIL' | 'FAIL_WITH_ONLY_KNOWN_FINDINGS';
  streamA: StreamAReport;
  streamB: StreamBReport;
  streamC: StreamCReport;
  determinism: { samples: number; mismatches: number };
  findings: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }>;
  totalViolations: number;
}

const DECLARED_FINDINGS: Array<{ id: string; severity: 'BLOCKING' | 'NON_BLOCKING'; statement: string; status: string }> = [
  { id: 'DECLARED_NO_LICENSED_EDITIONS', severity: 'NON_BLOCKING', statement: 'No licensed Jyotish edition is held in the repository: all locators carry the NOT VERIFIED statement and SOURCE_VERIFIED registration fails closed until REPO_HOLDS_LICENSED_EDITIONS flips.', status: 'OPEN' },
  { id: 'DECLARED_BORDERLINE_NEEDS_SCHOLAR', severity: 'NON_BLOCKING', statement: 'Combustion verdicts within ±1° of the adopted orb are flagged scholarJudgementRequired; the scholar console (Sprint K) is the intended adjudication surface.', status: 'OPEN' },
  { id: 'DECLARED_OBSERVATORY_SKY_MODEL', severity: 'NON_BLOCKING', statement: 'The observatory page uses a decorative approximate sky model; its combustion flags now share the registry rule but the underlying longitudes are animation approximations, not the certified kernel.', status: 'OPEN' },
  { id: 'DECLARED_REGISTRY_V1_YOGA_LOCATORS', severity: 'NON_BLOCKING', statement: 'Yoga cross-link rules inherit yogaSourceRegistry v1 honesty (locators unverified, attribution unverified).', status: 'OPEN' }
];

export function runRuleRegistryQualificationDetailed(opts: {
  scenarios: number;
  seed?: number;
  gate?: RuleRegistryQualificationGate;
  fixtureSet: RuleRegistryFixtureSet;
}): { report: RuleRegistryQualificationReport; failures: unknown[]; writeArtifacts: (dir: string) => void } {
  const { scenarios, seed = DEFAULT_RULE_REGISTRY_SEED, gate = 'scaffold', fixtureSet } = opts;
  const failures: unknown[] = [];

  const streamA = runStreamA(fixtureSet);
  for (const v of streamA.firstViolations) failures.push({ stream: 'REGISTRY_INTEGRITY', detail: v });
  const streamB = runStreamB(scenarios, seed);
  for (const v of streamB.firstViolations) failures.push({ stream: 'COMBUSTION_IDENTITY', detail: v });
  const streamC = runStreamC();
  for (const v of streamC.firstViolations) failures.push({ stream: 'PROVENANCE_SURFACE', detail: v });

  // determinism: re-run the registry fingerprint evaluation 50x and the combustion
  // sweep twice — byte equality required (CT_INV_007).
  const fp1 = classicalRuleRegistryFingerprint();
  let fpMismatch = 0;
  for (let i = 0; i < 50; i++) if (classicalRuleRegistryFingerprint() !== fp1) fpMismatch++;
  const b1 = runStreamB(200, 0xde7a11);
  const b2 = runStreamB(200, 0xde7a11);
  const determinism = { samples: 50 + 200, mismatches: fpMismatch + (JSON.stringify(b1) === JSON.stringify(b2) ? 0 : 1) };

  const totalViolations = streamA.violations + streamB.violations + streamC.violations + determinism.mismatches;
  const verdict: RuleRegistryQualificationReport['verdict'] =
    totalViolations === 0 ? 'PASS' : 'FAIL';

  const report: RuleRegistryQualificationReport = {
    runnerVersion: RULE_REGISTRY_QUALIFICATION_RUNNER_VERSION,
    registryVersion: CLASSICAL_RULE_REGISTRY_VERSION,
    fixtureSetId: fixtureSet.fixtureSetId,
    fixtureSetSha256: fixtureSet.setSha256,
    gate,
    scenarios,
    seed,
    generatedAtUtc: new Date().toISOString(),
    verdict,
    streamA, streamB, streamC,
    determinism,
    findings: DECLARED_FINDINGS,
    totalViolations
  };

  const writeArtifacts = (dir: string) => {
    fs.writeFileSync(path.join(dir, 'rule-registry-summary.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(dir, 'rule-registry-failures.json'), JSON.stringify({ totalViolations, failures }, null, 2) + '\n');
  };
  return { report, failures, writeArtifacts };
}

/* ------------------------------------------------------------------------- */

function parseArgs(argv: string[]): { scenarios: number; seed: number; gate: RuleRegistryQualificationGate } {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const scenarios = Number(get('--scenarios') ?? 20000);
  const seedRaw = get('--seed');
  const seed = seedRaw !== undefined ? (seedRaw.startsWith('0x') ? parseInt(seedRaw, 16) : Number(seedRaw)) : DEFAULT_RULE_REGISTRY_SEED;
  const gate = (get('--gate') === 'strict' ? 'strict' : 'scaffold') as RuleRegistryQualificationGate;
  return { scenarios, seed, gate };
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'rule-registry-fixtures.json'), 'utf8'));
  const fixtureSet = loadRuleRegistryFixtureSet(raw);
  console.log(`[rule-registry-qualification] runner=${RULE_REGISTRY_QUALIFICATION_RUNNER_VERSION} scenarios=${args.scenarios} seed=${args.seed} gate=${args.gate}`);
  console.log(`[rule-registry-qualification] fixture=${fixtureSet.fixtureSetId} sha256=${fixtureSet.setSha256.slice(0, 16)}... rules=${fixtureSet.ruleCount}`);
  const { report, writeArtifacts } = runRuleRegistryQualificationDetailed({
    scenarios: args.scenarios, seed: args.seed, gate: args.gate, fixtureSet
  });
  writeArtifacts(__dirname);
  console.log('');
  console.log('=== RULE REGISTRY QUALIFICATION SUMMARY ===');
  console.log(`Verdict: ${report.verdict} (gate=${report.gate})`);
  console.log(`A Registry integrity: ${report.streamA.checks} checks / ${report.streamA.violations} violations (${report.streamA.ruleCount} rules)`);
  console.log(`B Combustion identity: ${report.streamB.checks} checks / ${report.streamB.violations} violations (${report.streamB.scenarios} scenarios)`);
  console.log(`C Provenance surface: ${report.streamC.checks} checks / ${report.streamC.violations} violations`);
  console.log(`Determinism: ${report.determinism.samples}/${report.determinism.mismatches} mismatches`);
  console.log(`Findings: ${report.findings.length} (all NON_BLOCKING declared)`);
  console.log('Artifacts: qualification/rule-registry-summary.json, qualification/rule-registry-failures.json');
  process.exitCode = report.verdict === 'PASS' ? 0 : 1;
}

/**
 * REFERENCE-GRADE SPRINT J: Evidence Graph + WHY qualification gate.
 * Guards qualification/why-qualification-runner.ts, the WHY_GRAPH_001 fixture
 * set, the Sprint-J path-based cycle-detection fix in
 * EvidenceStore.traceDependencies (a diamond — a shared dependency reached via
 * two paths — is NOT a cycle), and the §17 tradition-consensus identity:
 * "k of n registered readings recognize this condition" — NEVER a probability.
 * Mission charter Sections 17-18.
 *
 * Pins as permanent regressions:
 *   - WHY_GRAPH_001 tamper-evidence (CT_INV_008) and version pins;
 *   - the diamond-is-not-a-cycle fix (stream A caught the global-visited
 *     false positive during Sprint J qualification);
 *   - full WHY traversal on a fixed chart: chain, dependency-free roots,
 *     calculation, registry honesty (no ruleRef ⇒ no invented rule/source);
 *   - the RSK_016 sade-sati chain shape: TRANSIT basis, transit-Saturn fact +
 *     natal Moon anchor, natal Saturn deliberately NOT a dependency;
 *   - §17 consensus identity: integer "k of n" statements, no '%', the
 *     RULE_AGREEMENT_NOT_PROBABILITY guard, and visible disagreement
 *     (Mercury retrograde 1 of 2) with fail-closed null on an inconsistent
 *     Kalsarpa node axis.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadWhyFixtureSet,
  WHY_QUALIFICATION_RUNNER_VERSION,
  DEFAULT_WHY_SEED
} from '../qualification/why-qualification-runner';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { compileEvidence, type CompiledEvidence } from '../src/lib/jyotish/evidenceCompiler';
import { EvidenceStore, EVIDENCE_DOMAINS, type NewEvidenceNode } from '../src/lib/jyotish/evidenceGraph';
import {
  explainNode,
  listConclusionNodes,
  traditionConsensusForCombustion,
  traditionConsensusForKalsarpa,
  registryRuleFor,
  WHY_ENGINE_VERSION
} from '../src/lib/jyotish/whyEngine';

// fs-loaded (not a JSON import): the bundler reshapes JSON imports
const FIXTURE = loadWhyFixtureSet(
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'fixtures', 'why-graph-fixtures.json'), 'utf8'))
);

/** Fixed qualification chart: the reference Patna natal chart used since Sprint C. */
function compilePatna(): CompiledEvidence {
  return compileEvidence(
    getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15',
      birthTime: '10:30',
      latitude: 25.5941,
      longitude: 85.1376,
      timezone: 5.5,
      locationName: 'Patna'
    })
  );
}

/** Structural fingerprint of a compiled store: ids plus the payload the id covers. */
function storeFingerprint(ev: CompiledEvidence): string {
  const rows = ev.store
    .list()
    .map((n) => [n.id, n.domain, n.subject, n.claim, JSON.stringify(n.value), n.strength, n.confidence, n.dependencies.join('>'), n.sourceTag].join('|'))
    .sort();
  return rows.join('\n');
}

test.describe('SPRINT-J: WHY_GRAPH_001 fixture integrity', () => {

  test('CT_INV_008: the fixture set is pinned and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('WHY_GRAPH_001');
    expect(FIXTURE.setSha256).toBe('275095b790a47c4f5689fd360f9349806e5c6534fb1f460c0e796547bdeacd71');
    expect(FIXTURE.whyEngineVersion).toBe(WHY_ENGINE_VERSION);
    expect(FIXTURE.domains).toEqual(EVIDENCE_DOMAINS);
    expect(FIXTURE.yogaRuleCount).toBe(44);
    // The six bodies with registered consensus readings (Sun/nodes carry
    // graph nodes with applicable=false, but no consensus — see the null pin below).
    expect([...FIXTURE.combustionTrackedPlanets].sort()).toEqual(['Jupiter', 'Mars', 'Mercury', 'Moon', 'Saturn', 'Venus']);
    expect(FIXTURE.conclusionsPerChart).toBe(58);
    expect(FIXTURE.kalsarpaConsensusReadings).toBe(5);
  });

  test('runner version and seed are pinned', () => {
    expect(WHY_QUALIFICATION_RUNNER_VERSION).toBe('why-qualification-runner-1.0.0 (sprint J)');
    expect(DEFAULT_WHY_SEED).toBe(0xd00d);
  });
});

test.describe('SPRINT-J: evidence-graph invariants (stream-A class)', () => {

  test('content-addressing is deterministic and distinct charts diverge', () => {
    // CT_INV_007 determinism is per INPUT: the snapshot embeds its reference
    // instant (a later build is a different query, legitimately a different
    // graph), so the same snapshot object must compile byte-identically.
    const snap = getCanonicalJyotishSnapshot({
      birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna'
    });
    const a1 = compileEvidence(snap);
    const a2 = compileEvidence(snap);
    expect(storeFingerprint(a1)).toBe(storeFingerprint(a2)); // byte-stable payloads
    expect(a1.nodeCount).toBe(a2.nodeCount);

    const b = compileEvidence(
      getCanonicalJyotishSnapshot({
        birthDate: '1990-01-01',
        birthTime: '06:00',
        latitude: 25.5941,
        longitude: 85.1376,
        timezone: 5.5,
        locationName: 'Patna'
      })
    );
    const idsA = new Set(a1.store.list().map((n) => n.id));
    const idsB = new Set(b.store.list().map((n) => n.id));
    expect([...idsA].filter((id) => idsB.has(id)).length).toBe(0); // snapshot hash salt ⇒ disjoint ids
  });

  test('the diamond fix: a shared dependency reached via two paths is NOT a cycle', () => {
    const store = new EvidenceStore('test-engine', 'test-snapshot-diamond');
    const mk = (id: string, deps: string[]) =>
      store.addNode({ domain: 'GRAHA', subject: `test:${id}`, claim: 'fact', value: id, strength: 0.5, confidence: 1, dependencies: deps } as NewEvidenceNode);
    const f = mk('fact', []);
    const a = mk('a', [f.id]);
    const b = mk('b', [f.id]);
    const root = mk('root', [a.id, b.id]);
    const trace = store.traceDependencies(root.id);
    expect(trace.cycles).toEqual([]); // the Sprint-J global-visited check false-positived here
    expect(trace.nodes.map((n) => n.id)).toEqual(expect.arrayContaining([root.id, a.id, b.id, f.id]));
    expect(trace.depth.get(f.id)).toBe(2);
  });

  test('a TRUE cycle is still detected (fail-closed preserved)', () => {
    const store = new EvidenceStore('test-engine', 'test-snapshot-cycle');
    const mk = (id: string, deps: string[]) =>
      store.addNode({ domain: 'GRAHA', subject: `test:${id}`, claim: 'fact', value: id, strength: 0.5, confidence: 1, dependencies: deps } as NewEvidenceNode);
    const x = mk('x', []);
    const y = mk('y', [x.id]);
    // Mutate the stored node into a cycle (production compilers never do this;
    // the trace must still refuse to loop forever).
    (x as { dependencies: string[] }).dependencies.push(y.id);
    const trace = store.traceDependencies(x.id);
    expect(trace.cycles).toEqual([x.id]);
  });

  test('the compiled Patna graph: 12 domains, every dependency resolves, no cycles in any WHY chain', () => {
    const ev = compilePatna();
    expect(ev.domainsPresent).toEqual(EVIDENCE_DOMAINS);
    expect(ev.nodeCount).toBe(172);
    for (const node of ev.store.list()) {
      for (const dep of node.dependencies) {
        expect(ev.store.getNode(dep), `dangling dependency ${dep} on ${node.id}`).toBeDefined();
      }
    }
    for (const conclusion of listConclusionNodes(ev.store)) {
      const trace = ev.store.traceDependencies(conclusion.id);
      expect(trace.cycles, `cycle from conclusion ${conclusion.subject}`).toEqual([]);
    }
  });
});

test.describe('SPRINT-J: WHY traversal and §18 honesty', () => {

  test('the fixed chart carries exactly 58 conclusions: 44 yoga + 9 combustion + 5 conclusions', () => {
    const ev = compilePatna();
    const conclusions = listConclusionNodes(ev.store);
    expect(conclusions.length).toBe(58);
    expect(conclusions.filter((n) => n.subject.startsWith('convention:yoga:')).length).toBe(44);
    expect(conclusions.filter((n) => n.subject.startsWith('convention:combustion:')).length).toBe(9);
    for (const subject of ['convention:sadeSati', 'convention:kalsarpa', 'convention:manglik', 'convention:rajYogas', 'convention:avakhada']) {
      expect(conclusions.some((n) => n.subject === subject), `missing conclusion ${subject}`).toBe(true);
    }
  });

  test('every WHY chain starts at the node, roots are dependency-free, and the calculation is carried', () => {
    const ev = compilePatna();
    for (const conclusion of listConclusionNodes(ev.store)) {
      const report = explainNode(ev.store, conclusion.id);
      expect(report, `no report for ${conclusion.subject}`).not.toBeNull();
      if (!report) continue;
      expect(report.chain.length).toBeGreaterThan(0);
      expect(report.chain[0].id).toBe(conclusion.id);
      for (const root of report.roots) {
        const node = ev.store.getNode(root.id);
        expect(node, `root ${root.id} missing`).toBeDefined();
        expect(node?.dependencies.length ?? -1, `root ${root.subject} must be dependency-free`).toBe(0);
      }
      expect(report.calculation.conclusion).toEqual(conclusion.value);
      // §18 honesty: registry-backed reports state a validation tier;
      // calculation-only reports state nothing they cannot back.
      if (conclusion.ruleRef) {
        // the tier comes from the LIVE registry row and may honestly be NOT_IMPLEMENTED
        expect(['IMPLEMENTED', 'INTERNALLY_VERIFIED', 'EXTERNALLY_VERIFIED', 'SCHOLAR_VERIFIED', 'NOT_IMPLEMENTED']).toContain(report.validationStatus);
      } else {
        expect(report.validationStatus).toBeUndefined();
      }
    }
  });

  test('§18 honesty pin: a node WITHOUT a ruleRef gets a calculation-only report — never an invented rule', () => {
    const ev = compilePatna();
    const rajYogas = listConclusionNodes(ev.store).find((n) => n.subject === 'convention:rajYogas');
    expect(rajYogas).toBeDefined();
    expect(rajYogas?.ruleRef).toBeUndefined();
    const report = explainNode(ev.store, rajYogas!.id);
    expect(report).not.toBeNull();
    expect(report!.rule).toBeUndefined();
    expect(report!.source).toBeUndefined();
    expect(report!.calculation.conclusion).toEqual(rajYogas!.value);
  });

  test('RSK_016 pin: the sade-sati chain is TRANSIT-Saturn fact + natal Moon — natal Saturn is NOT a dependency', () => {
    const ev = compilePatna();
    const ss = listConclusionNodes(ev.store).find((n) => n.subject === 'convention:sadeSati');
    expect(ss).toBeDefined();
    expect(ss?.ruleRef?.ruleId).toBe('RULE_SADE_SATI_BAND');

    const value = ss?.value as Record<string, unknown>;
    expect(value.basis).toBe('TRANSIT');
    expect(typeof value.referenceInstantUtc).toBe('string');

    const depNodes = (ss?.dependencies ?? []).map((id) => ev.store.getNode(id)!);
    // exactly one TRANSIT-basis fact (Saturn at the reference instant) …
    const transitFacts = depNodes.filter((n) => n.sourceTag === 'TRANSIT');
    expect(transitFacts.length).toBe(1);
    expect(transitFacts[0].subject).toBe('graha:Saturn');
    expect(transitFacts[0].claim).toBe('transit-placement');
    // … and the natal Moon anchor …
    expect(depNodes.some((n) => n.subject === 'graha:Moon' && n.claim === 'placement')).toBe(true);
    // … and NO natal-Saturn dependency (RSK_016: sade sati never reads natal Saturn).
    expect(depNodes.some((n) => n.subject === 'graha:Saturn' && n.claim === 'placement')).toBe(false);

    // The registry row backs the rule ref.
    expect(registryRuleFor('RULE_SADE_SATI_BAND')).toBeDefined();
  });
});

test.describe('SPRINT-J: §17 tradition consensus identity', () => {

  test('Mercury at 13 degrees: unanimous direct, visible disagreement retrograde — never a probability', () => {
    const direct = traditionConsensusForCombustion('Mercury', 13, false);
    expect(direct).not.toBeNull();
    expect(direct!.adoptedVerdict).toBe(true);
    expect(direct!.agreeing).toBe(2);
    expect(direct!.total).toBe(2);
    expect(direct!.statement).toBe('2 of 2 registered readings recognize combustion for Mercury at 13.00 deg separation.');
    expect(direct!.guard).toBe('RULE_AGREEMENT_NOT_PROBABILITY');

    const retro = traditionConsensusForCombustion('Mercury', 13, true);
    expect(retro!.adoptedVerdict).toBe(false);
    expect(retro!.agreeing).toBe(1); // RSK_002 disagreement made visible, not averaged away
    expect(retro!.total).toBe(2);
    expect(retro!.statement).toBe('1 of 2 registered readings do not recognize combustion for Mercury at 13.00 deg separation.');

    for (const c of [direct!, retro!]) {
      expect(c.statement).not.toContain('%');
      expect(Number.isInteger(c.agreeing)).toBe(true);
      expect(Number.isInteger(c.total)).toBe(true);
      expect(c.readings.length).toBe(c.total);
    }
  });

  test('the rule does not apply: Sun and nodes get no consensus (null), not a fabricated one', () => {
    expect(traditionConsensusForCombustion('Sun', 5, false)).toBeNull();
    expect(traditionConsensusForCombustion('Rahu', 5, false)).toBeNull();
    expect(traditionConsensusForCombustion('Ketu', 5, false)).toBeNull();
  });

  test('kalsarpa consensus: unanimous recognition on a clean hemisphere, 5 readings always', () => {
    // Rahu in rashi 1, Ketu in rashi 7; all seven grahas strictly inside 1..6.
    const rashis = { Sun: 2, Moon: 3, Mars: 4, Mercury: 5, Jupiter: 6, Venus: 2, Saturn: 3 };
    const c = traditionConsensusForKalsarpa(rashis, 1, 7);
    expect(c).not.toBeNull();
    expect(c!.total).toBe(5);
    expect(c!.adoptedVerdict).toBe(true);
    expect(c!.agreeing).toBe(5);
    expect(c!.statement).toBe('5 of 5 registered readings return PRESENT for this chart under the registered Kalsarpa variant set.');
    expect(c!.statement).not.toContain('%');
    expect(c!.guard).toBe('RULE_AGREEMENT_NOT_PROBABILITY');
  });

  test('kalsarpa boundary disagreement stays visible and the inconsistent axis fails closed', () => {
    // Saturn ON the node rashi (offset 0): adopted INDETERMINATE, the
    // boundary-inclusive reading disagrees — shown, not hidden.
    const boundary = traditionConsensusForKalsarpa({ Sun: 2, Moon: 3, Mars: 4, Mercury: 5, Jupiter: 6, Venus: 2, Saturn: 1 }, 1, 7);
    expect(boundary).not.toBeNull();
    expect(boundary!.statement).toContain('INDETERMINATE');
    expect(boundary!.agreeing).toBeLessThan(boundary!.total);

    // Ketu NOT opposite Rahu: no consensus at all.
    expect(traditionConsensusForKalsarpa({ Sun: 2, Moon: 3, Mars: 4, Mercury: 5, Jupiter: 6, Venus: 2, Saturn: 3 }, 1, 3)).toBeNull();
    expect(traditionConsensusForKalsarpa({ Sun: 2, Moon: 3, Mars: 4, Mercury: 5, Jupiter: 6, Venus: 2, Saturn: 3 }, 0, 7)).toBeNull();
  });
});

test.describe('SPRINT-J: committed qualification artifacts', () => {

  const SUMMARY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'why-summary.json'), 'utf8'));
  const FAILURES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'why-failures.json'), 'utf8'));

  test('the committed summary artifact carries the strict 800-scenario PASS verdict', () => {
    expect(SUMMARY.verdict).toBe('PASS');
    expect(SUMMARY.gate).toBe('strict');
    expect(SUMMARY.scenarios).toBe(800);
    expect(SUMMARY.seed).toBe(DEFAULT_WHY_SEED);
    expect(SUMMARY.totalViolations).toBe(0);
    expect(SUMMARY.fixtureSetSha256).toBe(FIXTURE.setSha256);
    expect(SUMMARY.whyEngineVersion).toBe(WHY_ENGINE_VERSION);
    expect(SUMMARY.streamA.violations).toBe(0);
    expect(SUMMARY.streamB.violations).toBe(0);
    expect(SUMMARY.streamC.violations).toBe(0);
    expect(SUMMARY.streamD.violations).toBe(0);
    expect(SUMMARY.determinism.mismatches).toBe(0);
  });

  test('the failures artifact records zero violations', () => {
    expect(FAILURES.totalViolations ?? FAILURES.summary?.totalViolations).toBe(0);
    const rows = FAILURES.failures ?? FAILURES.violations ?? [];
    expect(rows.length).toBe(0);
  });

  test('declared simplifications stay visible', () => {
    const ids = SUMMARY.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain('DECLARED_WHY_API_ENGINE_SIDE');
    expect(ids).toContain('DECLARED_CONSENSUS_SCOPE');
    expect(ids).toContain('DECLARED_LEDGER_CONSENT_GATE');
    for (const f of SUMMARY.findings) {
      expect(f.severity).toBe('NON_BLOCKING');
      expect(f.status).toBe('OPEN');
    }
  });
});

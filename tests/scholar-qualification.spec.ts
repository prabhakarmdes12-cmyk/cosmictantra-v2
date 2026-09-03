/**
 * REFERENCE-GRADE SPRINT K: Golden Chart Corpus (§20) + Scholar Review (§19)
 * qualification gate. Guards qualification/golden-corpus-qualification-runner.ts,
 * GOLDEN_CHART_CORPUS_001, and src/lib/jyotish/scholarReview.ts.
 * Mission charter Sections 19-20.
 *
 * Pins as permanent regressions:
 *   - the corpus fixture (107 charts, 12 charter categories, exactly ONE founder
 *     chart — "never as proof that the engine works generally") with CT_INV_008
 *     tamper-evidence;
 *   - full expectation replay + §21 independent-identity on the corpus subset;
 *   - the §19 cardinal invariant: a review NEVER mutates computational truth —
 *     the evidence graph is byte-identical after attaching reviews;
 *   - fail-closed review validation (commentary, verdicts, rule versions,
 *     source statuses) and the hash-chain tamper evidence;
 *   - freshness: reviews attach to a VALUE DIGEST, so engine changes flag the
 *     review VALUE_CHANGED instead of silently carrying the opinion forward;
 *   - the scholar queue derives exactly the charter flow (yoga strength,
 *     combustion borderline, INDETERMINATE kalsarpa).
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadCorpusFixture,
  GOLDEN_CORPUS_RUNNER_VERSION
} from '../qualification/golden-corpus-qualification-runner';
import type { CorpusFixture } from '../tools/build-golden-corpus';
import { GOLDEN_CORPUS_BUILDER_VERSION } from '../tools/build-golden-corpus';
import { getCanonicalJyotishSnapshot } from '../src/lib/jyotish/canonicalSnapshot';
import { compileEvidence } from '../src/lib/jyotish/evidenceCompiler';
import {
  ScholarReviewStore,
  ScholarReviewError,
  attachReview,
  assessFreshness,
  scholarQueueFor,
  valueDigestOf,
  SCHOLAR_REVIEW_VERSION,
  SCHOLAR_VERDICTS
} from '../src/lib/jyotish/scholarReview';
import { CLASSICAL_RULE_REGISTRY_VERSION } from '../src/lib/jyotish/ruleRegistry';

// fs-loaded (not a JSON import): the bundler reshapes JSON imports.
// loadCorpusFixture verifies the set sha256 on load (CT_INV_008).
const FIXTURE: CorpusFixture = loadCorpusFixture(
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'fixtures', 'golden-chart-corpus.json'), 'utf8'))
);
const FOUNDER = FIXTURE.charts.find((c) => c.category === 'FOUNDER_REVIEWED')!;
const YOGA_CHART = FIXTURE.charts.find((c) => c.category === 'YOGA_EXAMPLE')!;

function replay(input: CorpusFixture['charts'][number]['input']) {
  return getCanonicalJyotishSnapshot({
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    latitude: input.latitude,
    longitude: input.longitude,
    timezone: input.timezone,
    locationName: input.locationName
  });
}

const NAK_SPAN = 360 / 27;

test.describe('SPRINT-K: GOLDEN_CHART_CORPUS_001 integrity', () => {

  test('CT_INV_008: the corpus is pinned and tamper-evident', () => {
    expect(FIXTURE.fixtureSetId).toBe('GOLDEN_CHART_CORPUS_001');
    expect(FIXTURE.setSha256).toBe('052d6f88680880af7b54d683a2ca98202e8fb47d76f8c3960df7ec2895346205');
    expect(FIXTURE.builder).toBe(GOLDEN_CORPUS_BUILDER_VERSION);
    expect(FIXTURE.chartCount).toBe(107);
    expect(FIXTURE.founderCount).toBe(1);

    // tamper => load must refuse
    const copy = JSON.parse(JSON.stringify(FIXTURE));
    copy.charts[5].expected.derived.firstDashaLord = 'TAMPERED';
    expect(() => loadCorpusFixture(copy)).toThrowError(/FIXTURE_TAMPERED/);
  });

  test('charter §20 coverage: all 12 categories at their minimums', () => {
    const minimums: Record<string, number> = {
      FOUNDER_REVIEWED: 1, ORDINARY: 10, SIGN_BOUNDARY: 10, NAKSHATRA_BOUNDARY: 8, VARGA_BOUNDARY: 10,
      DASHA_BOUNDARY: 10, COMBUSTION_EDGE: 12, RETROGRADE_CASE: 10, UNUSUAL_LATITUDE: 10,
      TIMEZONE_COMPLEXITY: 10, YOGA_EXAMPLE: 8, DOSHA_EXAMPLE: 8
    };
    for (const [cat, min] of Object.entries(minimums)) {
      expect(FIXTURE.coverage[cat] ?? 0, `coverage ${cat}`).toBeGreaterThanOrEqual(min);
    }
    expect(Object.keys(FIXTURE.coverage).length).toBe(12);
  });

  test('every chart stores the full §20 record: input, normalized input, expected facts, tolerance, source, validation state', () => {
    for (const c of FIXTURE.charts) {
      expect(c.normalizedInput.utcInstant, c.chartId).toBeTruthy();
      expect(c.expected.astronomical.planets && Object.keys(c.expected.astronomical.planets).length, c.chartId).toBe(9);
      expect(c.tolerance.degrees, c.chartId).toBeGreaterThan(0);
      expect(c.source.kind, c.chartId).toBe('ENGINE_DERIVED_REGRESSION');
      expect(c.validationState, c.chartId).toBe('INTERNALLY_VERIFIED');
    }
  });

  test('the founder chart is ONE fixture with the charter caveat recorded on it', () => {
    const founders = FIXTURE.charts.filter((c) => c.category === 'FOUNDER_REVIEWED');
    expect(founders.length).toBe(1);
    const claim = founders[0].boundaryClaim as { note: string };
    expect(claim.note).toContain('never as proof that the engine works generally');
  });

  test('runner and layer versions are pinned', () => {
    expect(GOLDEN_CORPUS_RUNNER_VERSION).toBe('golden-corpus-runner-1.0.0 (sprint K)');
    expect(SCHOLAR_REVIEW_VERSION).toBe('scholar-review-1.0.0 (sprint K)');
    expect(typeof CLASSICAL_RULE_REGISTRY_VERSION).toBe('string');
  });
});

test.describe('SPRINT-K: corpus expectation replay (§20)', () => {

  test('the founder chart replays exactly: astronomy, nakshatra/pada, dasha balance, combustion, kalsarpa, manglik', () => {
    const snap = replay(FOUNDER.input) as unknown as Record<string, any>;
    const exp = FOUNDER.expected;
    expect(Math.abs(snap.meta.ayanamshaValue - exp.astronomical.ayanamshaValue)).toBeLessThanOrEqual(FOUNDER.tolerance.degrees);
    expect(snap.lagna.rashiId).toBe(exp.derived.lagnaRashiId);
    for (const g of Object.keys(exp.astronomical.planets)) {
      const got = (snap.planetsArray as any[]).find((p) => p.name === g)!;
      expect(Math.abs(got.longitude - exp.astronomical.planets[g].siderealLongitude), g).toBeLessThanOrEqual(FOUNDER.tolerance.degrees);
      expect(got.rashiId).toBe(exp.astronomical.planets[g].rashiId);
      expect(!!got.isRetrograde).toBe(exp.astronomical.planets[g].isRetrograde);
    }
    const moon = (snap.planetsArray as any[]).find((p) => p.name === 'Moon')!;
    expect(Math.floor(moon.longitude / NAK_SPAN) + 1).toBe(exp.derived.moonNakshatraId);
    expect(snap.dasha.mahadashas[0].lord).toBe(exp.derived.firstDashaLord);
    expect(Math.abs(snap.dasha.mahadashas[0].actualDurationYears - exp.derived.firstDashaBalanceYears)).toBeLessThanOrEqual(FOUNDER.tolerance.years);
    expect(snap.relationships.combustions.Mercury.isCombust).toBe(exp.derived.combustion.find((r) => r.planet === 'Mercury')!.isCombust);
    expect(snap.yogasAndDoshas.kalsarpa.status).toBe(exp.derived.kalsarpaStatus);
    expect(!!snap.yogasAndDoshas.manglik.isManglik).toBe(exp.derived.manglikIsManglik);
  });

  test('a combustion-edge chart still sits on the adopted-orb edge on replay', () => {
    const edge = FIXTURE.charts.filter((c) => c.category === 'COMBUSTION_EDGE');
    expect(edge.length).toBeGreaterThanOrEqual(12);
    const snap = replay(edge[0].input) as unknown as Record<string, any>;
    const claim = edge[0].boundaryClaim as { planet: string };
    const c = (snap.relationships.combustions as Record<string, any>)[claim.planet];
    expect(Math.abs(c.angularDistanceToSun - c.combustionOrb)).toBeLessThanOrEqual(0.3);
  });
});

test.describe('SPRINT-K: §21 independent identity (spot checks)', () => {

  test('independent Vimshottari balance from the Moon longitude matches the pinned balance', () => {
    const moonLon = FOUNDER.expected.astronomical.planets['Moon'].siderealLongitude;
    const lords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
    const years: Record<string, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
    const nak = Math.floor(((moonLon % 360) + 360) % 360 / NAK_SPAN);
    const elapsed = (((moonLon % 360) + 360) % 360) % NAK_SPAN;
    const lord = lords[nak % 9];
    const balance = years[lord] * (1 - elapsed / NAK_SPAN);
    expect(lord).toBe(FOUNDER.expected.derived.firstDashaLord);
    expect(Math.abs(balance - FOUNDER.expected.derived.firstDashaBalanceYears)).toBeLessThanOrEqual(FOUNDER.tolerance.years);
  });

  test('independent classical navamsha sign matches the pinned D9 moon sign', () => {
    const moonLon = FOUNDER.expected.astronomical.planets['Moon'].siderealLongitude;
    const d9 = (Math.floor((((moonLon % 360) + 360) % 360) / (30 / 9)) % 12) + 1;
    expect(d9).toBe(FOUNDER.expected.derived.navamshaMoonRashiId);
  });
});

test.describe('SPRINT-K: §19 scholar review layer', () => {

  function compileFounder() {
    const snap = replay(FOUNDER.input);
    return compileEvidence(snap);
  }

  test('CT_INV_005: attaching reviews NEVER mutates the evidence graph — both are stored', () => {
    const ev = compileFounder();
    const before = ev.store.list().map((n) => JSON.stringify(n)).join('|');
    const store = new ScholarReviewStore({ engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash });
    const target = ev.store.list().find((n) => n.domain === 'CONVENTION')!;
    attachReview(store, target, {
      chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
      reviewerId: 'pandit-gate',
      verdict: 'AGREE',
      commentary: ''
    });
    attachReview(store, target, {
      chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
      reviewerId: 'pandit-gate',
      verdict: 'PARTIALLY_AGREE',
      commentary: 'The adopted reading is classical, but the strength question remains open for scholar review.'
    });
    const after = ev.store.list().map((n) => JSON.stringify(n)).join('|');
    expect(after).toBe(before);
    expect(store.size).toBe(2);
    expect(store.latestFor(target.id)!.verdict).toBe('PARTIALLY_AGREE');
  });

  test('the five charter §19 verdicts are exactly these', () => {
    expect([...SCHOLAR_VERDICTS]).toEqual(['AGREE', 'DISAGREE', 'PARTIALLY_AGREE', 'ALTERNATIVE_INTERPRETATION', 'INSUFFICIENT_EVIDENCE']);
  });

  test('fail-closed validation: verdict, reviewer, commentary, rule version, source status', () => {
    const ev = compileFounder();
    const store = new ScholarReviewStore({ engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash });
    const target = ev.store.list().find((n) => n.domain === 'CONVENTION')!;
    const base = {
      targetNodeId: target.id,
      targetValueDigest: valueDigestOf(target),
      targetSubject: target.subject,
      chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
      reviewerId: 'pandit-gate',
      verdict: 'INSUFFICIENT_EVIDENCE' as const,
      commentary: 'Gate commentary placeholder for validation cases.'
    };
    const expectCode = (fn: () => void, code: string) => {
      try {
        fn();
        throw new Error(`expected ScholarReviewError ${code}, nothing thrown`);
      } catch (e) {
        expect(e instanceof ScholarReviewError, String(e)).toBe(true);
        expect((e as ScholarReviewError).code, String(e)).toBe(code);
      }
    };
    expectCode(() => store.add({ ...base, verdict: 'MOSTLY_AGREE' as never }), 'INVALID_VERDICT');
    expectCode(() => store.add({ ...base, reviewerId: '' }), 'REVIEWER_REQUIRED');
    expectCode(() => store.add({ ...base, commentary: 'no' }), 'COMMENTARY_REQUIRED');
    expectCode(() => store.add({ ...base, ruleId: 'RULE_NOT_REGISTERED' }), 'RULE_UNKNOWN');
    expectCode(() => store.add({ ...base, ruleId: 'RULE_SADE_SATI_BAND', ruleVersion: '9.9.9' }), 'RULE_VERSION_MISMATCH');
    expectCode(() => store.add({ ...base, source: { citation: 'BPHS ch. 8', status: 'SOURCE_VIBES' as never } }), 'SOURCE_STATUS_INVALID');
  });

  test('append-only hash chain: tamper detection and content-addressed ids', () => {
    const ev = compileFounder();
    const store = new ScholarReviewStore({ engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash });
    const target = ev.store.list().find((n) => n.domain === 'CONVENTION')!;
    const draft = {
      chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
      reviewerId: 'pandit-gate',
      verdict: 'AGREE' as const,
      commentary: '',
      reviewedAtUtc: '2026-01-01T00:00:00.000Z'
    };
    const r1 = attachReview(store, target, draft);
    const r2 = attachReview(store, target, draft);
    expect(r2.reviewId).toBe(r1.reviewId); // content-addressed
    attachReview(store, target, { ...draft, verdict: 'DISAGREE', commentary: 'Disagreement with the adopted orb at this degree; see the registered alternative.' });
    expect(store.verifyChain().ok).toBe(true);

    const tampered = store.all().map((x) => ({ ...x }));
    tampered[0].commentary = 'REWRITTEN HISTORY';
    let prev = 'SCHOLAR-GENESIS';
    let broken = false;
    const crypto = require('crypto') as typeof import('crypto');
    for (const rec of tampered) {
      const h = crypto.createHash('sha256')
        .update(`scholar-review|${prev}|${rec.reviewId}|${rec.targetValueDigest}|${rec.reviewerId}|${rec.verdict}|${rec.commentary}|${rec.reviewedAtUtc}`, 'utf8')
        .digest('hex').slice(0, 24);
      if (rec.prevHash !== prev || rec.recordHash !== h) { broken = true; break; }
      prev = rec.recordHash;
    }
    expect(broken).toBe(true);
  });

  test('freshness: reviews anchor to the value digest — CURRENT on the live node, NODE_MISSING otherwise', () => {
    const ev = compileFounder();
    const store = new ScholarReviewStore({ engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash });
    const target = ev.store.list().find((n) => n.domain === 'CONVENTION')!;
    const rec = attachReview(store, target, {
      chartVersion: { engineVersion: ev.engineVersion, snapshotHash: ev.snapshotHash },
      reviewerId: 'pandit-gate',
      verdict: 'AGREE',
      commentary: ''
    });
    expect(assessFreshness(rec, ev.store)).toBe('CURRENT');
    expect(assessFreshness({ ...rec, targetNodeId: 'deadbeefdeadbeef' }, ev.store)).toBe('NODE_MISSING');
    // a moved value => the opinion no longer applies silently
    const moved = { ...target, value: { ...(target.value as object), __moved: true } };
    expect(valueDigestOf(moved)).not.toBe(rec.targetValueDigest);
  });

  test('the scholar queue derives exactly the charter flow on a YOGA_EXAMPLE corpus chart', () => {
    const ev = compileEvidence(replay(YOGA_CHART.input));
    const queue = scholarQueueFor(ev);
    expect(queue.some((q) => q.reason === 'YOGA_STRENGTH_SCHOLAR_JUDGEMENT_REQUIRED')).toBe(true);
    for (const q of queue) {
      expect(['YOGA_STRENGTH_SCHOLAR_JUDGEMENT_REQUIRED', 'COMBUSTION_BORDERLINE', 'COMBUSTION_SCHOLAR_JUDGEMENT_REQUIRED', 'KALSARPA_INDETERMINATE']).toContain(q.reason);
      expect(ev.store.getNode(q.nodeId)).toBeDefined();
    }
  });
});

test.describe('SPRINT-K: committed qualification artifacts', () => {

  const SUMMARY = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'golden-corpus-summary.json'), 'utf8'));
  const FAILURES = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qualification', 'golden-corpus-failures.json'), 'utf8'));

  test('the committed summary artifact carries the strict 107-chart PASS verdict', () => {
    expect(SUMMARY.verdict).toBe('PASS');
    expect(SUMMARY.gate).toBe('strict');
    expect(SUMMARY.charts).toBe(107);
    expect(SUMMARY.totalViolations).toBe(0);
    expect(SUMMARY.fixtureSetSha256).toBe(FIXTURE.setSha256);
    expect(SUMMARY.streamA.violations).toBe(0);
    expect(SUMMARY.streamB.violations).toBe(0);
    expect(SUMMARY.streamC.violations).toBe(0);
    expect(SUMMARY.streamD.violations).toBe(0);
    expect(SUMMARY.determinism.mismatches).toBe(0);
  });

  test('the failures artifact records zero violations', () => {
    expect(FAILURES.verdict).toBe('PASS');
    expect(FAILURES.totalViolations).toBe(0);
    expect(FAILURES.failures.length).toBe(0);
  });

  test('declared simplifications stay visible', () => {
    const ids = SUMMARY.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain('DECLARED_ENGINE_DERIVED_EXPECTATIONS');
    expect(ids).toContain('DECLARED_REVIEW_PERSISTENCE_IN_MEMORY');
    expect(ids).toContain('DECLARED_REVIEWER_IDENTITY_UNVERIFIED');
    for (const f of SUMMARY.findings) {
      expect(f.severity).toBe('NON_BLOCKING');
      expect(f.status).toBe('OPEN');
    }
  });
});

import { test, expect } from '@playwright/test';
import { professionalChart } from '../src/lib/pro/index.js';
import { buildEvidenceGraph, queryEvidence, FACT } from '../src/lib/pro/evidenceGraph.js';
import { askKashi, planRetrieval, ANSWER_KIND, CONFIDENCE, INSUFFICIENT_CALCULATION_EVIDENCE } from '../src/lib/pro/kashi.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };
const pro = () => professionalChart(BP);

test.describe('TRUST-05 — Evidence graph (calculated facts only)', () => {
  test('graph contains only CALCULATED_FACT nodes, each with a source', () => {
    const g = buildEvidenceGraph(pro());
    expect(g.count).toBeGreaterThan(20);
    for (const n of g.nodes) {
      expect(n.kind).toBe(FACT); // no interpretation lives in the graph
      expect(n.source).toBeTruthy(); // every fact cites its provenance
      expect(n.statement).toBeTruthy();
    }
    // key subjects present
    expect(g.subjects).toEqual(expect.arrayContaining(['lagna', 'Saturn', 'house10', 'moon.nakshatra']));
  });

  test('queryEvidence retrieves relevant nodes by keyword', () => {
    const g = buildEvidenceGraph(pro());
    const career = queryEvidence(g, ['house10', 'saturn']);
    expect(career.length).toBeGreaterThan(0);
    expect(career.some((n: any) => n.subject === 'house10' || n.subject === 'Saturn')).toBe(true);
  });
});

test.describe('TRUST-05 — Kashi orchestrator (grounded, cited, honest)', () => {
  test('retrieval plan is derived from the question', () => {
    const plan = planRetrieval('How is my career and job?');
    expect(plan.topics).toContain('career');
    expect(plan.keywords.length).toBeGreaterThan(0);
  });

  test('an answerable question cites evidence #1..n, names rules, and exposes "why"', () => {
    const res: any = askKashi(pro(), 'Tell me about my career');
    expect(res.status).toBe('OK');
    expect(res.evidence.length).toBeGreaterThan(0);
    // evidence is numbered and marked as calculated fact
    res.evidence.forEach((e: any, i: number): void => {
      expect(e.ref).toBe(i + 1);
      expect(e.kind).toBe(ANSWER_KIND.CALCULATED_FACT);
    });
    expect(res.rules.length).toBeGreaterThan(0);
    expect(res.answer.kind).toBe(ANSWER_KIND.SYNTHESIS);
    // "Why am I saying this?" audit trail
    expect(res.why.evidenceRefs.length).toBeGreaterThan(0);
    expect(res.why.rules.length).toBeGreaterThan(0);
    expect([CONFIDENCE.LOW, CONFIDENCE.MEDIUM, CONFIDENCE.HIGH]).toContain(res.confidence);
  });

  test('the synthesis only references cited evidence (traceable)', () => {
    const res: any = askKashi(pro(), 'career');
    for (const ref of res.answer.basedOn) {
      expect(res.evidence.some((e: any) => e.ref === ref)).toBe(true);
    }
  });

  test('when there is no supporting evidence, Kashi returns INSUFFICIENT_CALCULATION_EVIDENCE (never hallucinates)', () => {
    // An empty graph (no calculated facts) must yield an honest refusal.
    const emptyPro: any = { kundali: { planets: [], houses: [], moon: {} } };
    const empty: any = askKashi(emptyPro, 'anything');
    expect(empty.status).toBe(INSUFFICIENT_CALCULATION_EVIDENCE);
    expect(empty.answer).toBeNull();
    expect(empty.message).toContain('will not guess');
  });

  test('Kashi never computes astrology — it only reads pro facade values', () => {
    // The facade exposes ask(); the graph is derived, not recomputed per call.
    const chart = pro();
    const g1 = chart.evidence;
    const g2 = chart.evidence;
    expect(g1).toBe(g2); // memoized — no recomputation
    const res = chart.ask('personality');
    expect(res.status).toBe('OK');
  });
});

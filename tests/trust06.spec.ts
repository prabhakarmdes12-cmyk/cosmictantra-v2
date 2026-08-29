import { test, expect } from '@playwright/test';

class MemStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
(globalThis as any).localStorage = new MemStore();
(globalThis as any).window = globalThis;

import { professionalChart } from '../src/lib/pro/index.js';
import { buildTimeline, activeOn, ZOOM } from '../src/lib/pro/timeline.js';
import {
  OUTCOME, recordPrediction, listPredictions, recordOutcome, latestOutcome, accuracyLedger,
} from '../src/lib/outcomeStore.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };
const pro = () => professionalChart(BP);

test.describe('TRUST-06 — Personal Timeline', () => {
  test('timeline has dasha tracks, Sade Sati windows and Varshaphala year bands', () => {
    const tl = buildTimeline(pro(), { years: 90 });
    expect(tl.tracks.mahadasha.length).toBe(9);
    expect(tl.tracks.antardasha.length).toBeGreaterThan(50);
    expect(tl.tracks.varshaphala.length).toBe(90);
    expect(tl.tracks.sadeSati.length).toBeGreaterThan(0);
    // Sade Sati windows are ~7.5 years long
    const w: any = tl.tracks.sadeSati[0];
    const span = (new Date(w.end).getTime() - new Date(w.start).getTime()) / (365.25 * 24 * 3600 * 1000);
    expect(span).toBeGreaterThan(6);
    expect(span).toBeLessThan(9);
    expect(tl.zoomLevels).toEqual(expect.arrayContaining([ZOOM.LIFE, ZOOM.YEAR, ZOOM.MONTH, ZOOM.WEEK]));
  });

  test('activeOn returns the current maha/antar/pratyantar for a date', () => {
    const a = activeOn(buildTimeline(pro()), '2026-08-30');
    expect(a.mahadasha).toBeTruthy();
    expect(a.antardasha).toBeTruthy();
    expect(a.varshaphala).toBeTruthy();
  });

  test('facade exposes memoized timeline', () => {
    const chart = pro();
    expect(chart.timeline).toBe(chart.timeline);
  });
});

test.describe('TRUST-06 — Outcome Memory (immutable audit trail)', () => {
  test.beforeEach(() => { (globalThis as any).localStorage.clear(); });

  test('a recorded prediction is immutable; outcomes are appended, not overwritten', () => {
    const rec = recordPrediction({ kundliId: 'k1', text: 'Career change likely', basis: ['#3', '#5'], forWindow: { start: '2026-01-01', end: '2026-12-31' }, versions: { engineVersion: '1.0.0' } });
    const originalText = rec.prediction.text;
    const originalAt = rec.prediction.recordedAt;

    recordOutcome(rec.id, OUTCOME.PARTIALLY, 'switched teams, not company');
    recordOutcome(rec.id, OUTCOME.YES, 'changed company later');

    const [stored] = listPredictions('k1');
    // prediction core unchanged
    expect(stored.prediction.text).toBe(originalText);
    expect(stored.prediction.recordedAt).toBe(originalAt);
    // both outcomes retained in order (audit trail)
    expect(stored.outcomes).toHaveLength(2);
    expect(stored.outcomes[0].status).toBe(OUTCOME.PARTIALLY);
    expect(stored.outcomes[1].status).toBe(OUTCOME.YES);
    expect(latestOutcome(stored)).toBe(OUTCOME.YES);
  });

  test('invalid outcome status is rejected', () => {
    const rec = recordPrediction({ kundliId: 'k2', text: 'x' });
    expect(recordOutcome(rec.id, 'MAYBE' as any, '').error).toBe('INVALID_STATUS');
  });

  test('accuracy ledger is honest — no percentage without recorded outcomes', () => {
    recordPrediction({ kundliId: 'k3', text: 'a' });
    recordPrediction({ kundliId: 'k3', text: 'b' });
    const ledger0 = accuracyLedger('k3');
    expect(ledger0.total).toBe(2);
    expect(ledger0.resolved).toBe(0);
    expect(ledger0.note).toContain('never claim an accuracy figure');

    const preds = listPredictions('k3');
    recordOutcome(preds[0].id, OUTCOME.YES, '');
    const ledger1 = accuracyLedger('k3');
    expect(ledger1.counts.YES).toBe(1);
    expect(ledger1.resolved).toBe(1);
  });
});

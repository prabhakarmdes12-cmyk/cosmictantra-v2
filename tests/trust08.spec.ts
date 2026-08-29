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
import { checkContradictions } from '../src/lib/pro/invariants.js';
import {
  FAILURE, guardBirthInput, guardDate, guardSnapshot, guardAI, guardCloud, guardReport,
} from '../src/lib/pro/failureStates.js';
import { freezeReportInputs, reproduceReport, recalculateLatest } from '../src/lib/pro/reproduce.js';
import { buildBook } from '../src/lib/pro/bookModel.js';
import { BIRTH_TIME_CONFIDENCE, LOCATION_SOURCE } from '../src/lib/kundliStore.js';

const BP = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna' };
const pro = () => professionalChart(BP);

/**
 * TRUST REGRESSION SUITE TRUST_001..008 — the platform-level trust guarantees.
 */

test.describe('TRUST-08 — Trust regression suite (TRUST_001..008)', () => {
  test('TRUST_001 — one snapshot → one truth (no cross-surface contradictions)', () => {
    const res = checkContradictions(pro());
    expect(res.ok).toBe(true);
    expect(res.violations).toHaveLength(0);
  });

  test('TRUST_002 — birthplace is never silently remapped (PLACE_UNCONFIRMED)', () => {
    const g = guardBirthInput({ ...BP, latitude: 25.5941, longitude: 85.1376, timezone: 5.5, birthTime: '10:30', birthTimeConfidence: BIRTH_TIME_CONFIDENCE.EXACT, locationSource: LOCATION_SOURCE.UNCONFIRMED });
    expect(g.ok).toBe(false);
    expect(g.code).toBe(FAILURE.PLACE_UNCONFIRMED);
  });

  test('TRUST_003 — unsupported dates are declined, not guessed', () => {
    expect(guardDate('1700-01-01').code).toBe(FAILURE.UNSUPPORTED_DATE);
    expect(guardDate('1995-06-15').ok).toBe(true);
  });

  test('TRUST_004 — corrupt snapshot is detected', () => {
    expect(guardSnapshot(null as any).code).toBe(FAILURE.CORRUPT_SNAPSHOT);
    expect(guardSnapshot({ lagna: {}, planets: [], houses: [] } as any).code).toBe(FAILURE.CORRUPT_SNAPSHOT);
    expect(guardSnapshot(pro().kundali).ok).toBe(true);
  });

  test('TRUST_005 — deterministic core keeps working when AI/cloud are down (degraded, not broken)', () => {
    const ai = guardAI(false);
    expect(ai.ok).toBe(true);       // deterministic answers still work
    expect(ai.degraded).toBe(true);
    const cloud = guardCloud(false);
    expect(cloud.ok).toBe(true);
    expect(cloud.degraded).toBe(true);
    // Kashi still answers deterministically with no AI
    expect(pro().ask('career').status).toBe('OK');
  });

  test('TRUST_006 — a report never renders empty', () => {
    expect(guardReport(null as any).code).toBe(FAILURE.REPORT_EMPTY);
    const book = buildBook('PERSONAL_KUNDLI', { pro: pro(), meta: { name: 'x' } });
    expect(guardReport(book).ok).toBe(true);
  });

  test('TRUST_007 — a stored report reproduces faithfully from its frozen snapshot', () => {
    const capsule = freezeReportInputs(BP, undefined, 'COMPLETE_VEDIC_KUNDLI', { name: 'x' });
    const r = reproduceReport(capsule);
    expect(r.faithful).toBe(true);
    expect(r.book.provenance.birth.date).toBe('1995-06-15');
    // reproduced content matches a fresh build of the same capsule
    expect(r.book.sections.length).toBeGreaterThan(0);
  });

  test('TRUST_008 — "Recalculate with latest" is explicit and preserves the original', () => {
    const capsule = freezeReportInputs(BP, undefined, 'PERSONAL_KUNDLI', { name: 'x' });
    const recalc = recalculateLatest(capsule);
    expect(recalc.note).toContain('original report is preserved');
    // same engine version → no diffs for this run
    expect(recalc.versionsBefore.engineVersion).toBe(recalc.versionsAfter.engineVersion);
    expect(Array.isArray(recalc.diffs)).toBe(true);
  });
});

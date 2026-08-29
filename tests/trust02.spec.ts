import { test, expect } from '@playwright/test';

// --- Minimal localStorage/window polyfill so the browser-first store runs in Node ---
class MemStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
(globalThis as any).localStorage = new MemStore();
(globalThis as any).window = globalThis;

import {
  BIRTH_TIME_CONFIDENCE, LOCATION_SOURCE, INV_LOCATION_001,
  validateBirthContext, saveKundli, getKundli, listKundlis, deleteKundli, toBirthParams, getOwnerKey,
} from '../src/lib/kundliStore.js';

const CONFIRMED = {
  name: 'Test', birthDate: '1995-06-15', birthTime: '10:30',
  birthTimeConfidence: BIRTH_TIME_CONFIDENCE.EXACT,
  place: 'Patna, Bihar, India', latitude: 25.5941, longitude: 85.1376, timezone: 5.5,
  locationSource: LOCATION_SOURCE.CITY_DB,
};

test.beforeEach(() => { (globalThis as any).localStorage.clear(); });

test.describe('TRUST-02 — Birthplace trust (INV_LOCATION_001)', () => {
  test('an unconfirmed location is rejected before calculation', () => {
    const { valid, errors } = validateBirthContext({ ...CONFIRMED, locationSource: LOCATION_SOURCE.UNCONFIRMED });
    expect(valid).toBe(false);
    expect(errors.some((e: any) => e.code === INV_LOCATION_001.code)).toBe(true);
  });

  test('a confirmed location with coordinates validates', () => {
    expect(validateBirthContext(CONFIRMED).valid).toBe(true);
  });

  test('saveKundli refuses to persist an unconfirmed place', () => {
    const res = saveKundli({ ...CONFIRMED, locationSource: LOCATION_SOURCE.UNCONFIRMED });
    expect(res.ok).toBe(false);
  });
});

test.describe('TRUST-02 — Birth-time confidence', () => {
  test('EXACT/APPROXIMATE require a time; UNKNOWN falls back to noon default', () => {
    expect(validateBirthContext({ ...CONFIRMED, birthTime: '' }).valid).toBe(false);
    const unknown = { ...CONFIRMED, birthTime: '', birthTimeConfidence: BIRTH_TIME_CONFIDENCE.UNKNOWN };
    expect(validateBirthContext(unknown).valid).toBe(true);
    expect(toBirthParams(unknown).birthTime).toBe('12:00');
  });
});

test.describe('TRUST-02 — Persistence & ownership (no IDOR)', () => {
  test('a saved Kundli round-trips for its owner', () => {
    const res = saveKundli(CONFIRMED);
    expect(res.ok).toBe(true);
    const got = getKundli(res.kundli.id);
    expect(got.ok).toBe(true);
    expect(got.kundli.name).toBe('Test');
    expect(listKundlis()).toHaveLength(1);
  });

  test('changing the URL id to another owner is FORBIDDEN, not readable', () => {
    // Owner A saves a record
    const res = saveKundli(CONFIRMED);
    const id = res.kundli.id;
    // Simulate a different device/user by rotating the owner key
    (globalThis as any).localStorage.removeItem('cosmictantra_owner_key');
    const ownerB = getOwnerKey();
    expect(ownerB).toBeTruthy();
    // Owner B tries to open Owner A's id directly
    const attempt = getKundli(id);
    expect(attempt.ok).toBe(false);
    expect(attempt.error).toBe('FORBIDDEN');
    // Owner B's list never contains A's record
    expect(listKundlis()).toHaveLength(0);
  });

  test('deleting another owner\'s record is refused', () => {
    const res = saveKundli(CONFIRMED);
    const id = res.kundli.id;
    (globalThis as any).localStorage.removeItem('cosmictantra_owner_key');
    getOwnerKey();
    expect(deleteKundli(id).error).toBe('FORBIDDEN');
  });

  test('a missing id yields NOT_FOUND (no data leak)', () => {
    expect(getKundli('kdl_does_not_exist').error).toBe('NOT_FOUND');
  });
});

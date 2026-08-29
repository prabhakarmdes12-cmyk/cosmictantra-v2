import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildConsultationListResponse,
  assertCaseReviewAuthorized,
} from '../src/lib/auth';
import { createRateLimiter, clientKeyFor } from '../src/lib/rateLimit';

/**
 * CT-PJOS-01 · SEC-P0-001 / SEC-P0-002 regression suite.
 *
 * These tests pin the server-authoritative contracts that close:
 *  - SEC-P0-002: anonymous enumeration of consultation rows (birth data,
 *    case ids, questions) via GET /api/astrology/consultations
 *  - SEC-P0-001: unauthenticated / unassigned case review & delivery
 *    mutations (PATCH review, POST deliver, POST test-pipeline)
 *  - Fake "Guru AI" ChatBox removal (trust invariant INV-PJOS-002/010)
 *
 * Route handlers themselves require a live database; the shaping and
 * authorization LOGIC lives in pure functions in src/lib/auth.ts and
 * src/lib/rateLimit.ts, which is what this suite pins. The route files
 * are additionally asserted to actually invoke these guards.
 */

const SAMPLE_ROWS = [
  {
    id: 'case-uuid-001',
    publicId: 'pub-uuid-001',
    customerName: 'Ramesh Verma',
    customerPhone: '+919876543210',
    customerEmail: 'ramesh@example.com',
    customerQuestion: 'Will my career change this year?',
    birthDate: '1995-06-15T00:00:00.000Z',
    birthTime: '10:30',
    birthCity: 'Patna',
    isTestCase: false,
    status: 'PANDIT_REVIEW',
  },
  {
    id: 'case-uuid-002',
    publicId: 'pub-uuid-002',
    customerName: 'Sita Devi',
    customerPhone: '+919123456780',
    customerEmail: 'sita@example.com',
    customerQuestion: 'Marriage timing question',
    birthDate: '1992-10-24T00:00:00.000Z',
    birthTime: '06:45',
    birthCity: 'Varanasi',
    isTestCase: true,
    status: 'APPROVED',
  },
];

test.describe('SEC-P0-002: anonymous consultation listing cannot be enumerated', () => {
  test('anonymous view returns zero rows and no personal metadata', () => {
    const shaped = buildConsultationListResponse(SAMPLE_ROWS, false);

    expect(shaped.consultations).toEqual([]);
    expect(shaped.authenticated).toBe(false);
    expect(typeof shaped.notice).toBe('string');

    // Aggregate statistics are allowed (no per-case data).
    expect(shaped.stats.total).toBe(2);
    expect(shaped.stats.testCases).toBe(1);
    expect(shaped.stats.pendingReview).toBe(1);
    expect(shaped.stats.approved).toBe(1);

    // Nothing personal may leak anywhere in the anonymous payload.
    const payload = JSON.stringify(shaped);
    for (const secret of [
      'case-uuid-001',
      'pub-uuid-001',
      '1995-06-15',
      '1992-10-24',
      'Ramesh Verma',
      'sita@example.com',
      '9876543210',
      'Patna',
      'Varanasi',
      'career change',
      'Marriage timing',
      '10:30',
    ]) {
      expect(payload, `leak: ${secret}`).not.toContain(secret);
    }
  });

  test('operator (admin) view still receives rows with ids', () => {
    const shaped = buildConsultationListResponse(SAMPLE_ROWS, true);
    expect(shaped.authenticated).toBe(true);
    expect(shaped.consultations).toHaveLength(2);
    expect(shaped.consultations[0].id).toBe('case-uuid-001');
    expect(shaped.consultations[0].birthCity).toBe('Patna'); // admin visibility unchanged
  });

  test('route is wired to the server-authoritative shaper', () => {
    const route = fs.readFileSync(
      path.join(__dirname, '../src/app/api/astrology/consultations/route.ts'),
      'utf8'
    );
    expect(route).toContain('buildConsultationListResponse');
    expect(route).toContain('verifyAdminAuth');
  });
});

test.describe('SEC-P0-001: case review authorization is server-side', () => {
  test('unassigned case cannot be reviewed by anyone', () => {
    const res = assertCaseReviewAuthorized({ practitionerId: null }, 'pandit-1');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.status).toBe(403);
      expect(res.error).toMatch(/no assigned practitioner/i);
    }
  });

  test('practitioner mismatch is rejected (no cross-case impersonation)', () => {
    const res = assertCaseReviewAuthorized(
      { practitionerId: 'pandit-1' },
      'pandit-2'
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.status).toBe(403);
  });

  test('matching practitioner is authorized and identity is resolved server-side', () => {
    const res = assertCaseReviewAuthorized({ practitionerId: 'pandit-1' }, 'pandit-1');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.practitionerId).toBe('pandit-1');
  });

  test('omitted practitionerId resolves to the case assignment', () => {
    const res = assertCaseReviewAuthorized({ practitionerId: 'pandit-1' }, undefined);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.practitionerId).toBe('pandit-1');
  });

  test('review route requires admin auth + assignment check', () => {
    const route = fs.readFileSync(
      path.join(__dirname, '../src/app/api/astrology/cases/[id]/review/route.ts'),
      'utf8'
    );
    expect(route).toContain('requireAdminAuth');
    expect(route).toContain('assertCaseReviewAuthorized');
  });

  test('deliver + test-pipeline routes require admin auth', () => {
    const deliver = fs.readFileSync(
      path.join(__dirname, '../src/app/api/astrology/cases/[id]/deliver/route.ts'),
      'utf8'
    );
    expect(deliver).toContain('requireAdminAuth');

    const testRoute = fs.readFileSync(
      path.join(__dirname, '../src/app/api/astrology/consultations/test/route.ts'),
      'utf8'
    );
    expect(testRoute).toContain('requireAdminAuth');
  });
});

test.describe('Rate limiting (straightforward surfaces)', () => {
  test('fixed window limiter returns 429 after budget exhaustion', () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const key = 'test-ip';
    expect(limiter.check(key)).toBeNull();
    expect(limiter.check(key)).toBeNull();
    expect(limiter.check(key)).toBeNull();
    const denied = limiter.check(key);
    expect(denied).not.toBeNull();
    expect(denied!.status).toBe(429);
  });

  test('distinct keys have independent budgets', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check('ip-a')).toBeNull();
    expect(limiter.check('ip-a')?.status).toBe(429);
    expect(limiter.check('ip-b')).toBeNull();
  });

  test('client key resolution prefers forwarded-for first entry', () => {
    const headers = new Map([
      ['x-forwarded-for', '203.0.113.7, 10.0.0.1'],
      ['x-real-ip', '10.0.0.1'],
    ]);
    const req = { headers: { get: (n: string) => headers.get(n) || null } };
    expect(clientKeyFor(req)).toBe('203.0.113.7');
  });

  test('order creation, analytics and OTP request routes are rate limited', () => {
    const read = (rel: string) =>
      fs.readFileSync(path.join(__dirname, '../src', rel), 'utf8');

    expect(read('app/api/astrology/consultations/create/route.ts')).toContain(
      'createOrderLimiter.check'
    );
    expect(read('app/api/astrology/analytics/route.ts')).toContain(
      'analyticsLimiter.check'
    );
    expect(read('app/api/profile/otp/request/route.ts')).toContain(
      'otpRequestLimiter.check'
    );
  });
});

test.describe('Fake "Guru AI" ChatBox is permanently removed', () => {
  test('ChatBox component file no longer exists', () => {
    const p = path.join(__dirname, '../src/components/ChatBox.tsx');
    expect(fs.existsSync(p)).toBe(false);
  });

  test('no source file references the ChatBox component', () => {
    const srcRoot = path.join(__dirname, '../src');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
      }
    };
    walk(srcRoot);
    const offenders = files.filter((f) =>
      fs.readFileSync(f, 'utf8').includes('ChatBox')
    );
    expect(offenders).toEqual([]);
  });
});

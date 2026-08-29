import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Authentication and PII Protection Module for CosmicTantra
 *
 * SECURITY NOTE (P0-2 resolution):
 * - Secrets come ONLY from environment variables. There are NO hardcoded fallback
 *   values. In production, a missing secret FAILS CLOSED (auth denied / webhook
 *   returns 503 "misconfigured") so security never silently degrades.
 * - The development-only insecure key exists only when NODE_ENV !== 'production'
 *   and is clearly marked as non-production.
 */

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export function getAdminSecret(): string | null {
  const s = process.env.ADMIN_SECRET || process.env.ASTROLOGY_ADMIN_KEY || null;
  if (s) return s;
  if (IS_PRODUCTION) return null; // fail closed in production
  return 'dev-only-insecure-key-do-not-use-in-prod';
}

export function getRazorpayWebhookSecret(): string | null {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || null;
  if (s) return s;
  if (IS_PRODUCTION) return null; // fail closed in production
  return 'dev-only-razorpay-secret-do-not-use-in-prod';
}

/**
 * Verifies if request is authenticated as Admin
 */
export function verifyAdminAuth(req: NextRequest): boolean {
  const adminSecret = getAdminSecret();
  if (!adminSecret) return false; // production misconfiguration => deny

  // Development bypass is NEVER allowed in production
  if (!IS_PRODUCTION && req.headers.get('x-dev-bypass') === 'true') {
    return true;
  }

  const adminKey = req.headers.get('x-admin-key');
  if (adminKey && timingSafeEqual(adminKey, adminSecret)) {
    return true;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (timingSafeEqual(token, adminSecret)) {
      return true;
    }
  }

  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Guard function that returns a 401 Unauthorized Response if not admin
 */
export function requireAdminAuth(req: NextRequest): NextResponse | null {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Admin authentication required to access this endpoint.',
      },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Verifies Razorpay Webhook HMAC SHA256 Signature.
 * Returns false (never throws) when the secret is missing, so callers can
 * respond with an explicit 503 misconfiguration instead of a silent bypass.
 */
export function verifyRazorpaySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = getRazorpayWebhookSecret();
  if (!secret) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return timingSafeEqual(expectedSignature, signature);
  } catch {
    return false;
  }
}

/**
 * Masks customer PII (Phone, Email, Full Name) for non-admin viewers to comply with DPDP regulations
 */
export function maskCustomerPII(consultation: any, isAuthorized: boolean = false) {
  if (isAuthorized) return consultation;

  const copy = { ...consultation };

  if (copy.customerPhone) {
    const p = String(copy.customerPhone);
    copy.customerPhone = p.length > 5 ? `${p.slice(0, 3)}****${p.slice(-2)}` : '****';
  }

  if (copy.customerEmail) {
    const [user, domain] = String(copy.customerEmail).split('@');
    if (domain) {
      copy.customerEmail = `${user.slice(0, 2)}***@${domain}`;
    }
  }

  if (copy.customerName) {
    const parts = String(copy.customerName).split(' ');
    copy.customerName = parts.map((part, i) => (i === 0 ? part : `${part.slice(0, 1)}***`)).join(' ');
  }

  return copy;
}

/**
 * SEC-P0-002 (CT-PJOS-01): Server-authoritative consultation list shaping.
 *
 * ANONYMOUS VIEWERS receive aggregate statistics ONLY. No per-case rows,
 * no case ids, no birth data, no questions, no practitioner linkage.
 * This closes the enumeration path (anonymous list -> case id -> case
 * mutation) documented in docs/PJOS_ARCHAEOLOGY.md §9.
 *
 * AUTHORIZED OPERATORS (admin key) receive the current full list with
 * PII visibility rules unchanged.
 */
export function buildConsultationListResponse(consultations: any[], isAdmin: boolean) {
  const stats = {
    total: consultations.length,
    testCases: consultations.filter((c: any) => c.isTestCase).length,
    pendingReview: consultations.filter(
      (c: any) => c.status === 'PANDIT_REVIEW' || c.status === 'ASSIGNED'
    ).length,
    approved: consultations.filter(
      (c: any) => c.status === 'APPROVED' || c.status === 'DELIVERY_READY' || c.status === 'DELIVERED'
    ).length,
  };

  if (!isAdmin) {
    // Aggregates only. Deliberately no row-level data of any kind.
    return {
      consultations: [] as any[],
      stats,
      authenticated: false,
      notice:
        'Case-level details require authorized operator access. Aggregate statistics are shown for public transparency.',
    };
  }

  return {
    consultations: consultations.map((c: any) => maskCustomerPII(c, true)),
    stats,
    authenticated: true,
    notice: null,
  };
}

/**
 * SEC-P0-001 (CT-PJOS-01): Server-side authorization check for Pandit case
 * review mutations. Requires:
 *   1. An authenticated operator (enforced by requireAdminAuth at the route
 *      boundary — this function does NOT re-verify the key), and
 *   2. A case that is ASSIGNED to a practitioner (unassigned cases cannot
 *      be interpreted/approved by anyone), and
 *   3. When the caller names a practitionerId, it must match the case
 *      assignment (no cross-case impersonation).
 *
 * Note: dedicated Pandit login (role-based auth transport) is the PJOS-01
 * Phase-1 upgrade; the authenticated-operator channel is the replaceable
 * transport required by decision D-1.
 */
export function assertCaseReviewAuthorized(
  consultation: any,
  bodyPractitionerId: string | null | undefined
): { ok: true; practitionerId: string } | { ok: false; error: string; status: number } {
  const assignedId: string | null | undefined = consultation?.practitionerId ?? null;

  if (!assignedId) {
    return {
      ok: false,
      error: 'This case has no assigned practitioner. Assign a practitioner before review.',
      status: 403,
    };
  }

  if (bodyPractitionerId && bodyPractitionerId !== assignedId) {
    return {
      ok: false,
      error: 'Unauthorized: caller practitioner does not match case assignment.',
      status: 403,
    };
  }

  return { ok: true, practitionerId: assignedId };
}

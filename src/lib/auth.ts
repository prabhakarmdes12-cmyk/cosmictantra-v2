import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Authentication and PII Protection Module for CosmicTantra
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ASTROLOGY_ADMIN_KEY || 'cosmic-admin-live-key-2026';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_cosmic_2026';

/**
 * Verifies if request is authenticated as Admin
 */
export function verifyAdminAuth(req: NextRequest): boolean {
  const adminKey = req.headers.get('x-admin-key');
  const authHeader = req.headers.get('authorization');

  if (adminKey && adminKey === ADMIN_SECRET) {
    return true;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token === ADMIN_SECRET) {
      return true;
    }
  }

  // Development bypass when explicitly running in local dev without set headers
  if (process.env.NODE_ENV === 'development' && req.headers.get('x-dev-bypass') === 'true') {
    return true;
  }

  return false;
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
 * Verifies Razorpay Webhook HMAC SHA256 Signature
 */
export function verifyRazorpaySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch (err) {
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
    copy.customerName = parts.map((part, i) => i === 0 ? part : `${part.slice(0, 1)}***`).join(' ');
  }

  return copy;
}

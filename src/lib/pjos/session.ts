/**
 * PJOS-01 DOMAIN (Decision D-1): server-side session transport.
 *
 * This is the REPLACEABLE auth transport — deliberately minimal and
 * standard (HMAC-signed, expiring, server-verified), so it can later be
 * swapped for OTP-less tokens, email, or Google without changing Person
 * ownership (the token only binds to a PjosAccount id).
 *
 * D-1 red line respected: no insecure pilot token becomes permanent debt —
 * the secret comes ONLY from the environment (fails closed in production),
 * tokens expire, and verification is timing-safe.
 *
 * What a session token proves: "this PjosAccount exists and the holder
 * completed the channel's verification (e.g. phone OTP)." What it does NOT
 * prove anything about: any specific Person. Person-level access is ALWAYS
 * re-resolved through the ownership guard (relationship or grant) on every
 * request.
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { IS_PRODUCTION } from '../auth';
import { verifyAdminAuth } from '../auth';

export const PJOS_SESSION_COOKIE = 'pjos_session';
export const PJOS_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSessionSecret(): string | null {
  const s = process.env.PJOS_SESSION_SECRET || process.env.ADMIN_SECRET || process.env.ASTROLOGY_ADMIN_KEY || null;
  if (s) return s;
  if (IS_PRODUCTION) return null; // fail closed
  return 'dev-only-pjos-session-key-do-not-use-in-prod';
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

/**
 * Signed token: b64url(payload) . b64url(HMAC-SHA256(payload, secret))
 * payload = { sub: accountId, iat, exp, ch: authChannel, jti }
 */
export function createPjosSessionToken(accountId: string, authChannel: string, now: Date = new Date()): { token: string; expiresAt: Date } {
  const secret = getSessionSecret();
  if (!secret) throw new Error('PJOS_SESSION_SECRET not configured — refusing to issue sessions');
  const iat = Math.floor(now.getTime() / 1000);
  const exp = Math.floor((now.getTime() + PJOS_SESSION_TTL_MS) / 1000);
  const payload: Record<string, unknown> = {
    sub: accountId,
    iat,
    exp,
    ch: authChannel,
    jti: crypto.randomBytes(12).toString('hex'),
  };
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return { token: `${body}.${sig}`, expiresAt: new Date(exp * 1000) };
}

export function verifyPjosSessionToken(token: string | null | undefined, now: Date = new Date()): { accountId: string; authChannel: string } | null {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
    if (typeof payload.exp !== 'number' || payload.exp * 1000 < now.getTime()) return null;
    return { accountId: payload.sub, authChannel: typeof payload.ch === 'string' ? payload.ch : 'UNKNOWN' };
  } catch {
    return null;
  }
}

export function pjosSessionCookie(token: string): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: PJOS_SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PRODUCTION,
      path: '/',
      maxAge: PJOS_SESSION_TTL_MS / 1000,
    },
  };
}

/**
 * Resolve the PJOS actor for a request, in transport priority order:
 *  1. Operator (admin key) — professional transport; the practitioner
 *     identity MUST be named via x-practitioner-id to use the professional
 *     access path (never assumed).
 *  2. PJOS session cookie — consumer transport (OTP-verified account).
 *  3. Anonymous.
 * The actor NEVER self-claims person-level identity: person access comes
 * exclusively from the ownership guard.
 */
export interface PjosActor {
  accountId: string | null;
  practitionerId: string | null;
  isProfessional: boolean;
  channel: 'OPERATOR' | 'SESSION' | 'ANONYMOUS';
}

export function resolvePjosActor(req: NextRequest): PjosActor {
  if (verifyAdminAuth(req)) {
    const practitionerId = req.headers.get('x-practitioner-id');
    return {
      accountId: null,
      practitionerId: practitionerId && practitionerId.trim() ? practitionerId.trim() : null,
      isProfessional: true,
      channel: 'OPERATOR',
    };
  }
  const session = verifyPjosSessionToken(req.cookies.get(PJOS_SESSION_COOKIE)?.value);
  if (session) {
    return { accountId: session.accountId, practitionerId: null, isProfessional: false, channel: 'SESSION' };
  }
  return { accountId: null, practitionerId: null, isProfessional: false, channel: 'ANONYMOUS' };
}

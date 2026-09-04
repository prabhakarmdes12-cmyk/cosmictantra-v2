/**
 * RTC EPHEMERAL TURN CREDENTIALS — RFC 5766 REST API (POST /api/rtc/turn-credentials)
 *
 * Implements the ephemeral credential lifecycle from docs/CALL_SECURITY_MODEL.md §5:
 *   Username = `${unixExpiry}:${participantId}`
 *   Password = base64(HMAC-SHA1(username, TURN_STATIC_AUTH_SECRET))
 *
 * The coturn server verifies this credential offline with the shared secret —
 * no database lookup, no long-lived passwords in frontend JavaScript, no
 * bandwidth-leech reuse: new allocations are rejected once the window expires.
 *
 * STUN: Google public STUN (stun:stun.l.google.com:19302) is always included.
 * TURN: read from env (TURN_URLS + TURN_STATIC_AUTH_SECRET). When TURN is not
 * yet deployed, the response reports `turnConfigured: false` so clients can
 * show honest connectivity posture instead of pretending relay exists.
 *
 * SECURITY: The static secret NEVER leaves this module. Credentials are bound
 * to the caller's verified Sabha session token (HMAC-SHA256, auth.ts) and are
 * valid for a single participant. Responses are no-store.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SabhaAuthTokenEngine } from '@/lib/sabha/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CREDENTIAL_TTL_SECONDS = 30 * 60; // 30-minute ephemeral window (§5.2)

const GOOGLE_PUBLIC_STUN = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302'
];

function buildEphemeralTurnCredential(username: string, secret: string): string {
  return crypto.createHmac('sha1', secret).update(username).digest('base64');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token: string = body?.token || '';
    const sessionId: string = body?.sessionId || '';

    // Ephemeral crypto session authorization (HMAC-SHA256, constant-time compare).
    const verification = SabhaAuthTokenEngine.verifyToken(token, sessionId || undefined);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        { ok: false, error: verification.error || 'AUTH_TOKEN_INVALID', errorCode: 'AUTH_TOKEN_INVALID' },
        { status: 401 }
      );
    }

    const { participantId } = verification.payload;

    const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
      { urls: GOOGLE_PUBLIC_STUN }
    ];

    const turnUrls = (process.env.TURN_URLS || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);
    const turnSecret = process.env.TURN_STATIC_AUTH_SECRET || '';

    let turnConfigured = false;
    if (turnUrls.length > 0 && turnSecret.length > 0) {
      turnConfigured = true;
      const unixExpiry = Math.floor(Date.now() / 1000) + CREDENTIAL_TTL_SECONDS;
      const username = `${unixExpiry}:${participantId}`;
      const credential = buildEphemeralTurnCredential(username, turnSecret);
      iceServers.push({ urls: turnUrls, username, credential });
    }

    // Optional strict-privacy mode: force relay so peers exchange only relay
    // candidates and never see each other's host/reflexive IPs (§3.2).
    const forceRelay = body?.strictMaskedConnection === true && turnConfigured;

    return NextResponse.json(
      {
        ok: true,
        username: turnConfigured
          ? `${Math.floor(Date.now() / 1000) + CREDENTIAL_TTL_SECONDS}:${participantId}`
          : undefined,
        ttlSeconds: CREDENTIAL_TTL_SECONDS,
        iceServers,
        turnConfigured,
        relayAvailable: turnConfigured,
        recommendedIceTransportPolicy: forceRelay ? 'relay' : 'all',
        lifetimeDuration: `${CREDENTIAL_TTL_SECONDS}s`
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: any) {
    console.error('TURN credential issuance failed:', error);
    return NextResponse.json({ ok: false, error: 'TURN_CREDENTIAL_ISSUANCE_FAILED' }, { status: 500 });
  }
}

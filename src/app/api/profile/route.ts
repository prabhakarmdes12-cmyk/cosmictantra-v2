/**
 * Legacy profile compatibility endpoint.
 *
 * The former implementation accepted a phone number in a query string and
 * treated a direct POST as OTP-verified. Apart from leaking a person's family
 * data to anybody who knew a number, that bypassed the signed anonymous
 * session and OTP verification contracts that PJOS exists to enforce.
 *
 * There are no callers of this endpoint in the application. Rather than ship a
 * misleading half-profile API, retire it explicitly until a cookie-authenticated
 * profile read/delete contract is designed. New flows must use:
 *
 *   POST /api/pjos/session  — create/resume the signed anonymous session
 *   POST /api/pjos/claim    — attach it only after OTP verification
 *
 * A 410 is intentional: it prevents old clients from silently receiving a
 * fabricated "verified" profile and avoids making a public phone lookup part
 * of the production surface.
 */
import { NextResponse } from 'next/server';

const RETIRED_RESPONSE = {
  success: false,
  error: 'PROFILE_API_RETIRED',
  message: 'This legacy profile endpoint is retired. Use /api/pjos/session and /api/pjos/claim.',
} as const;

function retiredProfileResponse() {
  return NextResponse.json(RETIRED_RESPONSE, {
    status: 410,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  return retiredProfileResponse();
}

export async function POST() {
  return retiredProfileResponse();
}

export async function DELETE() {
  return retiredProfileResponse();
}

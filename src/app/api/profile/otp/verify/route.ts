import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createPjosSessionToken, pjosSessionCookie } from '@/lib/pjos/session';
import { getPjosDb } from '@/lib/pjos/pjosDbProvider';
import { pjosTablesAvailable } from '@/lib/pjos/prismaRepository';

const otpStore = new Map<string, { hash: string; expires: number; attempts: number }>();

/** Canonicalize a digit string to an E.164-ish subject id (India-first). */
function canonicalPhoneSubject(digitOnly: string): string {
  let d = digitOnly.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 10) return `+91${d}`;
  return d.startsWith('+') ? d : `+${d}`;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, purpose = 'PROFILE_VERIFY' } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: 'Phone and OTP required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const record = otpStore.get(cleanPhone);

    if (!record || record.expires < Date.now()) {
      return NextResponse.json({ success: false, error: 'OTP expired or not found' }, { status: 400 });
    }

    if (record.attempts >= 5) {
      return NextResponse.json({ success: false, error: 'Too many attempts' }, { status: 429 });
    }

    record.attempts++;
    const inputHash = crypto.createHash('sha256').update(otp + cleanPhone).digest('hex');

    if (inputHash !== record.hash) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
    }

    // Success — mark verified
    otpStore.delete(cleanPhone);

    // D-1: server-side persistent identity. The verified phone becomes a
    // PjosAccount (authChannel PHONE_OTP) and the holder receives a short-
    //lived signed session cookie. This is the REPLACEABLE transport — Person
    // ownership never lives in the token. If the PJOS tables are not migrated
    // yet, verify still succeeds (legacy behavior) without a session.
    let sessionCookie: ReturnType<typeof pjosSessionCookie> | null = null;
    try {
      const client = getPjosDb();
      if (await pjosTablesAvailable(client)) {
        const account = await client.pjosAccount.upsert({
          where: { authChannel_authSubject: { authChannel: 'PHONE_OTP', authSubject: `+91${cleanPhone.slice(-10)}` } },
          create: { authChannel: 'PHONE_OTP', authSubject: `+91${cleanPhone.slice(-10)}` },
          update: {},
        });
        const { token } = createPjosSessionToken(account.id, 'PHONE_OTP');
        sessionCookie = pjosSessionCookie(token);
      }
    } catch {
      // Identity layer unavailable: degrade to the pre-D-1 behavior.
      sessionCookie = null;
    }

    const response = NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verifiedAt: new Date().toISOString(),
      authenticated: Boolean(sessionCookie),
    });
    if (sessionCookie) {
      response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options as never);
    }
    return response;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
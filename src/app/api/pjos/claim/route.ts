import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { IdentityService } from '@/lib/pjos/identity/identityService';
import { PrismaIdentityStore } from '@/lib/pjos/identity/prismaIdentityStore';
import type { PjosAuthChannel, PjosSensitivity } from '@/lib/jyotish/pjosTypes';
import { OtpTransportService } from '@/lib/pjos/otp/otpTransport';

const COOKIE_NAME = 'pjos_token';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      channel: PjosAuthChannel;
      subject: string;
      otp: string;
      displayName?: string;
      sensitivity?: PjosSensitivity;
    };
    
    const token = cookies().get(COOKIE_NAME)?.value;
    
    if (!token) {
      return NextResponse.json({ success: false, error: 'No session token found' }, { status: 401 });
    }
    
    const tokenHash = hashToken(token);
    
    // Stub OTP verification - in a real scenario we'd use a robust mechanism
    const otpService = new OtpTransportService();
    const verified = await otpService.verifyOtp(body.channel, body.subject, body.otp);
    
    if (!verified) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 403 });
    }
    
    const repo = new PrismaIdentityStore(db);
    const identityService = new IdentityService(repo);
    
    const claimResult = await identityService.claimSession({
      tokenHash,
      channel: body.channel,
      subject: body.subject,
      verified: true,
      displayName: body.displayName,
      sensitivity: body.sensitivity,
    });
    
    return NextResponse.json({ success: true, ...claimResult });
  } catch (error: any) {
    console.error('[PJOS_CLAIM_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

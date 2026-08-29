import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const otpStore = new Map<string, { hash: string; expires: number; attempts: number }>();

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

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      verifiedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
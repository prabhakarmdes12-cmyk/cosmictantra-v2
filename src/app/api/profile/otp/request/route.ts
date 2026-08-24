import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Simple in-memory OTP store (replace with DB + real SMS in prod)
const otpStore = new Map<string, { hash: string; expires: number; attempts: number }>();

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose = 'PROFILE_VERIFY' } = await req.json();

    if (!phone || !/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ success: false, error: 'Valid phone required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const otpHash = crypto.createHash('sha256').update(otp + cleanPhone).digest('hex');
    const expires = Date.now() + 5 * 60 * 1000; // 5 min

    otpStore.set(cleanPhone, { hash: otpHash, expires, attempts: 0 });

    // In real prod: send via Twilio / MSG91 / WhatsApp template
    console.log(`[OTP] Sent to ${cleanPhone}: ${otp} (demo only)`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent via WhatsApp/SMS (demo)',
      expiresIn: 300,
      // Never return real OTP in production
      demoOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
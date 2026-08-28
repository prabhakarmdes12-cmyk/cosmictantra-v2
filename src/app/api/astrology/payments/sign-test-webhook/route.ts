import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const rawBody = await req.text();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev-only-razorpay-secret-do-not-use-in-prod';
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    return NextResponse.json({
      success: true,
      signature
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

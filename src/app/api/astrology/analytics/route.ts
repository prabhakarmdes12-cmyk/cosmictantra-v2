import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRateLimiter, clientKeyFor } from '@/lib/rateLimit';

const analyticsLimiter = createRateLimiter({ limit: 120, windowMs: 60 * 1000 });

export async function POST(req: NextRequest) {
  try {
    const limited = analyticsLimiter.check(clientKeyFor(req));
    if (limited) return limited;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { eventType, payload } = body;

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'Event type is required.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, eventType, recorded: false });
    }

    await db.astrologyAuditLog.create({
      data: {
        eventType: `ANALYTICS_${eventType}`,
        actorType: 'CUSTOMER',
        payload: payload || {},
      },
    });

    return NextResponse.json({ success: true, eventType });
  } catch (error: any) {
    console.error('Analytics log error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Analytics failed' }, { status: 500 });
  }
}

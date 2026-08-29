import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeEvent } from '@/lib/proAnalytics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, payload } = body;

    if (!eventType) {
      return NextResponse.json({ success: false, error: 'Event type is required.' }, { status: 400 });
    }

    // Defense-in-depth: scrub PII/free-text server-side too, so nothing
    // identifying is ever persisted to the audit log even from a crafted request.
    const clean = sanitizeEvent(eventType, payload || {}) as Record<string, any>;
    const { event: _evt, ...safePayload } = clean;

    await db.astrologyAuditLog.create({
      data: {
        eventType: `ANALYTICS_${eventType}`,
        actorType: 'CUSTOMER',
        payload: safePayload,
      },
    });

    return NextResponse.json({ success: true, eventType });
  } catch (error: any) {
    console.error('Analytics log error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Analytics failed' }, { status: 500 });
  }
}

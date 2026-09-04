/**
 * Chitigram v0.2 — Notifications (in-app first, Web Push/PWA ready)
 * Minimal safe info + link into conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { listNotifications, markNotificationRead } from '@/lib/chitigram/repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || url.searchParams.get('viewerId') || '';
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
    const notifications = await listNotifications(userId, unreadOnly);
    return NextResponse.json({ ok: true, notifications }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/notifications] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body?.action || 'MARK_READ';
    if (action === 'MARK_READ' || action === 'READ') {
      const notificationId: string = body?.notificationId || body?.id || '';
      const userId: string = body?.userId || '';
      if (!notificationId) return NextResponse.json({ ok: false, error: 'notificationId required' }, { status: 400 });
      if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
      const ok = await markNotificationRead(notificationId, userId);
      return NextResponse.json({ ok, notificationId }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ ok: false, error: 'invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('[chitigram/notifications] POST failed', e);
    return NextResponse.json({ ok: false, error: 'NOTIFICATION_FAILED' }, { status: 500 });
  }
}

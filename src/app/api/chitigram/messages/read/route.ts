/**
 * Chitigram v0.2 — Message Read Receipts
 * Updates lastReadMessageId, unread counts, SENT/DELIVERED/READ
 */

import { NextRequest, NextResponse } from 'next/server';
import { markRead, getConversation } from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conversationId: string = body?.conversationId || body?.sessionId || '';
    const userId: string = body?.userId || body?.viewerId || '';
    const lastReadMessageId: string = body?.lastReadMessageId || body?.messageId || '';
    const viewerRole = (body?.viewerRole || body?.role || 'devotee').toLowerCase();

    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });
    if (!lastReadMessageId) return NextResponse.json({ ok: false, error: 'lastReadMessageId required' }, { status: 400 });

    if (!hasCapability(viewerRole, 'READ')) return NextResponse.json({ ok: false, error: 'FORBIDDEN_READ' }, { status: 403 });

    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    const result = await markRead(conv.id, userId, lastReadMessageId);
    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 403 });

    return NextResponse.json({ ok: true, unreadCount: result.unreadCount }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/messages/read] POST failed', e);
    return NextResponse.json({ ok: false, error: 'READ_FAILED' }, { status: 500 });
  }
}

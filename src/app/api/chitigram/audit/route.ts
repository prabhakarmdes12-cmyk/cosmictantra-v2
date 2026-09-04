/**
 * Chitigram v0.2 — Audit Timeline
 * Persisted operational timeline: created → payment verified → assigned → accepted → call started → ended → notes → follow-up → closed
 */

import { NextRequest, NextResponse } from 'next/server';
import { listAudit, getConversation } from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId') || url.searchParams.get('sessionId') || '';
    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    const viewerRole = (url.searchParams.get('viewerRole') || 'operator').toLowerCase();
    if (!hasCapability(viewerRole, 'READ')) return NextResponse.json({ ok: false, error: 'FORBIDDEN_READ' }, { status: 403 });

    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    const timeline = await listAudit(conv.id);
    return NextResponse.json({ ok: true, conversationId: conv.id, timeline }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/audit] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

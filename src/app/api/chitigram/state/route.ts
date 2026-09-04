/**
 * Chitigram v0.2 — Consultation Lifecycle State Machine (Server-authoritative)
 * States: CREATED/WAITING/ASSIGNED/RINGING/ACCEPTED/LIVE/ENDED/FOLLOW_UP/CLOSED + DECLINED/NO_ANSWER/CANCELLED/FAILED/REASSIGNED
 */

import { NextRequest, NextResponse } from 'next/server';
import { transitionConversation, getConversation } from '@/lib/chitigram/repo';
import { hasCapability, ChitigramConversationState } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALL_STATES: ChitigramConversationState[] = [
  'CREATED',
  'WAITING',
  'ASSIGNED',
  'RINGING',
  'ACCEPTED',
  'LIVE',
  'ENDED',
  'FOLLOW_UP',
  'CLOSED',
  'DECLINED',
  'NO_ANSWER',
  'CANCELLED',
  'FAILED',
  'REASSIGNED',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conversationId: string = body?.conversationId || body?.sessionId || '';
    const toState: string = body?.toState || body?.state || '';
    const actorId: string = body?.actorId || body?.userId || 'system';
    const actorRole = (body?.actorRole || body?.role || 'operator').toLowerCase();
    const details: Record<string, any> | null = body?.details || null;

    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    if (!toState) return NextResponse.json({ ok: false, error: 'toState required' }, { status: 400 });
    if (!ALL_STATES.includes(toState as any)) return NextResponse.json({ ok: false, error: `invalid toState: ${toState}` }, { status: 400 });

    // Authorization: state transitions require appropriate capabilities
    // WAITING/ASSIGNED/REASSIGNED -> ASSIGN, RINGING/ACCEPTED/LIVE -> ACCEPT_CALL, CLOSED -> transfer/assign, etc.
    // For pilot, require READ + specific:
    if (['ASSIGNED', 'REASSIGNED'].includes(toState) && !hasCapability(actorRole, 'ASSIGN')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_ASSIGN' }, { status: 403 });
    }
    if (['RINGING', 'ACCEPTED', 'LIVE'].includes(toState) && !hasCapability(actorRole, 'ACCEPT_CALL') && !hasCapability(actorRole, 'ASSIGN')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_ACCEPT_CALL' }, { status: 403 });
    }
    if (toState === 'CLOSED' && !hasCapability(actorRole, 'ASSIGN') && !hasCapability(actorRole, 'TRANSFER')) {
      // Allow operator/pandit to close? For pilot, allow operator/system
      if (actorRole !== 'operator' && actorRole !== 'system' && actorRole !== 'pandit') {
        return NextResponse.json({ ok: false, error: 'FORBIDDEN_CLOSED' }, { status: 403 });
      }
    }

    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    const result = await transitionConversation(conv.id, toState as any, actorId, actorRole, details);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ ok: true, conversation: result.conversation }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/state] POST failed', e);
    return NextResponse.json({ ok: false, error: 'STATE_FAILED' }, { status: 500 });
  }
}

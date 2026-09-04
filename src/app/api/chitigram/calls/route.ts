/**
 * Chitigram v0.2 — Call Records API
 * Persist caller/recipients, timestamps, duration, outcome, reasons. Render missed/successful as messages.
 * Existing WebRTC untouched unless additive hooks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCall, listCalls, updateCall, getConversation } from '@/lib/chitigram/repo';
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
    const calls = await listCalls(conversationId);
    return NextResponse.json({ ok: true, calls }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/calls] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conversationId: string = body?.conversationId || body?.sessionId || '';
    const roomId: string | null = body?.roomId || null;
    const callerId: string = body?.callerId || body?.userId || '';
    const callerRole: string = (body?.callerRole || body?.role || 'operator').toLowerCase();
    const recipientIds: string[] = Array.isArray(body?.recipientIds) ? body.recipientIds : body?.recipientId ? [body.recipientId] : [];
    const isWarmTransfer: boolean = !!body?.isWarmTransfer;
    const organizationId = body?.organizationId || undefined;
    const domain = body?.domain || undefined;

    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    if (!callerId) return NextResponse.json({ ok: false, error: 'callerId required' }, { status: 400 });
    if (recipientIds.length === 0) return NextResponse.json({ ok: false, error: 'recipientIds required' }, { status: 400 });

    if (!hasCapability(callerRole, 'ACCEPT_CALL') && callerRole !== 'operator' && callerRole !== 'devotee') {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_CALL' }, { status: 403 });
    }

    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    const call = await createCall({
      conversationId: conv.id,
      roomId,
      callerId,
      callerRole,
      recipientIds,
      isWarmTransfer,
      organizationId: conv.organizationId,
      domain: conv.domain,
    });

    return NextResponse.json({ ok: true, call }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/calls] POST failed', e);
    return NextResponse.json({ ok: false, error: 'CALL_CREATE_FAILED' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const callId: string = body?.callId || body?.id || '';
    const outcome: string | null = body?.outcome || null;
    const failureReason: string | null = body?.failureReason || null;
    const acceptedAt: number | null = body?.acceptedAt ? Number(body.acceptedAt) : null;
    const startedAt: number | null = body?.startedAt ? Number(body.startedAt) : null;
    const endedAt: number | null = body?.endedAt ? Number(body.endedAt) : null;
    const durationSeconds: number | null = typeof body?.durationSeconds === 'number' ? body.durationSeconds : null;

    if (!callId) return NextResponse.json({ ok: false, error: 'callId required' }, { status: 400 });

    const updates: any = {};
    if (outcome) updates.outcome = outcome;
    if (failureReason !== null) updates.failureReason = failureReason;
    if (acceptedAt !== null) updates.acceptedAt = acceptedAt;
    if (startedAt !== null) updates.startedAt = startedAt;
    if (endedAt !== null) updates.endedAt = endedAt;
    if (durationSeconds !== null) updates.durationSeconds = durationSeconds;

    const call = await updateCall(callId, updates);
    if (!call) return NextResponse.json({ ok: false, error: 'CALL_NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, call }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/calls] PATCH failed', e);
    return NextResponse.json({ ok: false, error: 'CALL_UPDATE_FAILED' }, { status: 500 });
  }
}

/**
 * Chitigram v0.2 — Voice Notes (record → preview → send → play)
 * Uses Chitigram message protocol + persisted media metadata (no video gallery)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createVoiceMessage, getConversation } from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conversationId: string = body?.conversationId || body?.sessionId || '';
    const senderId: string = body?.senderId || body?.userId || '';
    const senderRole: string = (body?.senderRole || body?.role || 'devotee').toLowerCase();
    const senderName: string | null = body?.senderName || null;
    const durationSeconds: number = Number(body?.durationSeconds || 0);
    const mimeType: string = body?.mimeType || 'audio/webm;codecs=opus';
    const sizeBytes: number = Number(body?.sizeBytes || 0);
    const url: string | null = body?.url || body?.mediaUrl || null;
    const waveform: number[] | null = Array.isArray(body?.waveform) ? body.waveform : null;
    const visibility: string = body?.visibility || 'VISIBLE';

    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    if (!senderId) return NextResponse.json({ ok: false, error: 'senderId required' }, { status: 400 });
    if (!durationSeconds || durationSeconds <= 0 || durationSeconds > 300) return NextResponse.json({ ok: false, error: 'invalid durationSeconds (1-300)' }, { status: 400 });

    if (!hasCapability(senderRole, 'SEND')) return NextResponse.json({ ok: false, error: 'FORBIDDEN_SEND' }, { status: 403 });
    if (visibility === 'INTERNAL' && !hasCapability(senderRole, 'INTERNAL_NOTE')) return NextResponse.json({ ok: false, error: 'FORBIDDEN_INTERNAL_NOTE' }, { status: 403 });

    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    const result = await createVoiceMessage({
      conversationId: conv.id,
      senderId,
      senderRole,
      senderName: senderName || undefined,
      durationSeconds,
      mimeType,
      sizeBytes,
      url: url || undefined,
      waveform: waveform || undefined,
      visibility: visibility as any,
    });

    if (result.error) {
      if (result.degraded) return NextResponse.json({ ok: false, error: 'DEGRADED_PERSISTENCE', details: result.error }, { status: 503 });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: result.message }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/voice] POST failed', e);
    return NextResponse.json({ ok: false, error: 'VOICE_FAILED' }, { status: 500 });
  }
}

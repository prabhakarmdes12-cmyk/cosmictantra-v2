/**
 * FREE DURATION EXTENSION — POST /api/sabha/sessions/[id]/extend
 * Extends the entitled duration of a live free call. STRICT INVARIANT: this is
 * FREE — no payment, no wallet, no per-minute deduction. The caller must hold a
 * valid session token (either party may extend).
 */

import { NextRequest, NextResponse } from 'next/server';
import { SabhaAuthTokenEngine } from '@/lib/sabha/auth';
import { extendFreeSession } from '@/lib/sabha/freeCallEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '');
    const seconds = Math.min(Math.max(Number(body?.seconds) || 600, 60), 1800);

    const verification = SabhaAuthTokenEngine.verifyToken(token, params.id);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json({ ok: false, error: verification.error || 'Unauthorized.' }, { status: 401 });
    }

    const role = verification.payload.role;
    const result = extendFreeSession({
      sessionId: params.id,
      seconds,
      actorId: verification.payload.participantId,
      actor: role === 'SCHOLAR' ? 'SCHOLAR' : role === 'ADMIN' ? 'ADMIN' : 'DEVOTEE'
    });

    if (!result.ok || !result.session) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      extensionSeconds: result.session.extensionSeconds,
      totalEntitledSeconds: result.session.entitledDurationSeconds + result.session.extensionSeconds
    });
  } catch (error: any) {
    console.error('Extension failed:', error);
    return NextResponse.json({ ok: false, error: 'EXTENSION_FAILED' }, { status: 500 });
  }
}

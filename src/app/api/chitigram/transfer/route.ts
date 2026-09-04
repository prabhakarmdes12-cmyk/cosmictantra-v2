/**
 * Chitigram v0.2 — Warm Transfer Architecture
 * Devotee → Help Desk → Pandit via shared multi-participant room
 * Exposes Hold / Add Pandit / Transfer, preserves 1:1
 */

import { NextRequest, NextResponse } from 'next/server';
import { holdCall, resumeCall, addPanditToCall, transferCall, getConversation } from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body?.action || ''; // HOLD | RESUME | ADD_PANDIT | TRANSFER
    const callId: string = body?.callId || body?.id || '';
    const actorId: string = body?.actorId || body?.userId || '';
    const actorRole = (body?.actorRole || body?.role || 'operator').toLowerCase();
    const practitionerId: string | undefined = body?.practitionerId || body?.panditId || undefined;
    const practitionerName: string | undefined = body?.practitionerName || body?.panditName || undefined;
    const toPractitionerId: string | undefined = body?.toPractitionerId || practitionerId;

    if (!callId) return NextResponse.json({ ok: false, error: 'callId required' }, { status: 400 });
    if (!actorId) return NextResponse.json({ ok: false, error: 'actorId required' }, { status: 400 });
    if (!action) return NextResponse.json({ ok: false, error: 'action required' }, { status: 400 });

    if (!hasCapability(actorRole, 'TRANSFER')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_TRANSFER' }, { status: 403 });
    }

    let result: any = null;
    switch (action.toUpperCase()) {
      case 'HOLD':
        result = await holdCall(callId, actorId);
        break;
      case 'RESUME':
        result = await resumeCall(callId, actorId);
        break;
      case 'ADD_PANDIT':
      case 'ADD':
        if (!practitionerId) return NextResponse.json({ ok: false, error: 'practitionerId required for ADD_PANDIT' }, { status: 400 });
        result = await addPanditToCall(callId, practitionerId, practitionerName, actorId);
        break;
      case 'TRANSFER':
        if (!toPractitionerId) return NextResponse.json({ ok: false, error: 'toPractitionerId required for TRANSFER' }, { status: 400 });
        result = await transferCall(callId, actorId, toPractitionerId);
        break;
      default:
        return NextResponse.json({ ok: false, error: 'invalid action — expected HOLD|RESUME|ADD_PANDIT|TRANSFER' }, { status: 400 });
    }

    if (!result) return NextResponse.json({ ok: false, error: 'CALL_NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, call: result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/transfer] POST failed', e);
    return NextResponse.json({ ok: false, error: 'TRANSFER_FAILED' }, { status: 500 });
  }
}

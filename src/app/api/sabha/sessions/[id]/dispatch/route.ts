/**
 * CARE QUEUE DISPATCH — POST /api/sabha/sessions/[id]/dispatch
 * Customer-Care operator dispatches the assigned call. Both parties' devices
 * ring; the operator then DROPS OUT of the flow entirely — the room admits
 * exactly the two authorized peers (TEST A: Care is NOT in media).
 *
 * The consultant token is issued ONLY to the routing surface responsible for
 * delivering the ring to the Pandit's device (workspace console / notification).
 */

import { NextRequest, NextResponse } from 'next/server';
import { dispatchAssignedCall } from '@/lib/sabha/freeCallEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const operatorId = String(body?.operatorId || 'CARE-OPS-01').slice(0, 40);

    const result = dispatchAssignedCall({ sessionId: params.id, operatorId });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      consultantToken: result.consultantToken,
      consultantRoomUrl: `/consultation/room/${params.id}?role=pandit&token=${encodeURIComponent(result.consultantToken!)}`
    });
  } catch (error: any) {
    console.error('Dispatch failed:', error);
    return NextResponse.json({ ok: false, error: 'DISPATCH_FAILED' }, { status: 500 });
  }
}

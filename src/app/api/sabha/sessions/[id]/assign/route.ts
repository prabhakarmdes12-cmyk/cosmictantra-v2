/**
 * CARE QUEUE ASSIGNMENT — POST /api/sabha/sessions/[id]/assign
 * Customer-Care operator assigns a verified Pandit to a queued CARE_ASSISTED
 * request. This is ROUTING-layer only — the operator never joins the media room.
 */

import { NextRequest, NextResponse } from 'next/server';
import { assignScholarToSession } from '@/lib/sabha/freeCallEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const scholarId = String(body?.scholarId || '').slice(0, 40);
    const operatorId = String(body?.operatorId || 'CARE-OPS-01').slice(0, 40);

    if (!scholarId) {
      return NextResponse.json({ ok: false, error: 'scholarId is required.' }, { status: 400 });
    }

    const result = assignScholarToSession({
      sessionId: params.id,
      scholarId,
      operatorId
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      scholar: result.session
        ? { scholarId: result.session.scholar.scholarId, name: result.session.scholar.name, title: result.session.scholar.title }
        : undefined
    });
  } catch (error: any) {
    console.error('Assignment failed:', error);
    return NextResponse.json({ ok: false, error: 'ASSIGNMENT_FAILED' }, { status: 500 });
  }
}

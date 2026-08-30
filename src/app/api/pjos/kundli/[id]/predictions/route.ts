import { NextRequest, NextResponse } from 'next/server';
import { resolvePjosActor } from '@/lib/pjos/session';
import { getPjosDb } from '@/lib/pjos/pjosDbProvider';
import { handleCreatePrediction, handleListPredictions } from '@/lib/pjos/routes';

/**
 * /api/pjos/kundli/[id]/predictions — the immutable prediction ledger.
 * Status is DERIVED server-side from resolvable, non-conflicting evidence;
 * clients can never declare EVIDENCE_BACKED. Ownership enforced before
 * read or append.
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await handleListPredictions(getPjosDb(), resolvePjosActor(req), params.id);
    return NextResponse.json(res.body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await handleCreatePrediction(getPjosDb(), resolvePjosActor(req), params.id, body);
    return NextResponse.json(res.body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

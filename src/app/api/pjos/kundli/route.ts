import { NextRequest, NextResponse } from 'next/server';
import { resolvePjosActor } from '@/lib/pjos/session';
import { getPjosDb } from '@/lib/pjos/pjosDbProvider';
import { handleCreateKundli } from '@/lib/pjos/routes';

/**
 * POST /api/pjos/kundli — compute + persist a kundli for a person.
 * Ownership (resource -> personId -> grant) is enforced inside the handler
 * BEFORE any write.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await handleCreateKundli(getPjosDb(), resolvePjosActor(req), body);
    return NextResponse.json(res.body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

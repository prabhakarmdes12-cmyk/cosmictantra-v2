import { NextRequest, NextResponse } from 'next/server';
import { resolvePjosActor } from '@/lib/pjos/session';
import { getPjosDb } from '@/lib/pjos/pjosDbProvider';
import { handleCreatePerson, handleListPersons } from '@/lib/pjos/routes';

/**
 * PJOS person-scoped identity surface.
 * Actor comes from the server-issued session (or operator key) — never from
 * the request body. Person access is re-resolved through the ownership guard
 * inside every handler.
 */

export async function GET(req: NextRequest) {
  try {
    const res = await handleListPersons(getPjosDb(), resolvePjosActor(req));
    return NextResponse.json(res.body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await handleCreatePerson(getPjosDb(), resolvePjosActor(req), body);
    return NextResponse.json(res.body, { status: res.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Internal error.' }, { status: 500 });
  }
}

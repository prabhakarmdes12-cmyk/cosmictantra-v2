/**
 * SABHA SESSION ROOM VIEW — GET /api/sabha/sessions/[id]
 * Safe display model for the consultation room: display names only.
 * No tokens, no phone numbers (even masked), no ledger internals.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionRoomView } from '@/lib/sabha/freeCallEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const result = getSessionRoomView(id);
  if (!result.ok || !result.view) {
    return NextResponse.json({ ok: false, error: result.error || 'SESSION_NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, view: result.view }, { headers: { 'Cache-Control': 'no-store' } });
}

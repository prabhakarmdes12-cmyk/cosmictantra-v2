/**
 * Chitigram v0.2 — Real Presence API
 * Implements connection: ONLINE/AWAY/OFFLINE + practitioner availability: AVAILABLE/BUSY/DND/OFF_DUTY
 * Do not show Online/Available unless backed by server presence data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { setPresence, getPresence, listPresence } from '@/lib/chitigram/repo';
import { ChitigramConnectionState, ChitigramAvailability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const organizationId = url.searchParams.get('organizationId') || 'cosmic-tantra';

    if (userId) {
      const presence = await getPresence(userId);
      if (!presence) return NextResponse.json({ ok: true, presence: null }, { headers: { 'Cache-Control': 'no-store' } });
      return NextResponse.json({ ok: true, presence }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const all = await listPresence(organizationId);
    return NextResponse.json({ ok: true, presence: all }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/presence] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId: string = body?.userId || body?.id || '';
    const userRole: string = body?.userRole || body?.role || 'operator';
    const displayName: string | undefined = body?.displayName || undefined;
    const connectionState: ChitigramConnectionState = body?.connectionState || 'ONLINE';
    const availability: ChitigramAvailability | undefined = body?.availability || undefined;
    const organizationId = body?.organizationId || 'cosmic-tantra';
    const domain = body?.domain || 'cosmic-tantra';

    if (!userId) return NextResponse.json({ ok: false, error: 'userId required' }, { status: 400 });

    const allowedConnection: ChitigramConnectionState[] = ['ONLINE', 'AWAY', 'OFFLINE'];
    if (!allowedConnection.includes(connectionState)) return NextResponse.json({ ok: false, error: 'invalid connectionState' }, { status: 400 });

    if (availability) {
      const allowedAvail: ChitigramAvailability[] = ['AVAILABLE', 'BUSY', 'DND', 'OFF_DUTY'];
      if (!allowedAvail.includes(availability)) return NextResponse.json({ ok: false, error: 'invalid availability' }, { status: 400 });
    }

    const presence = await setPresence({
      userId,
      userRole,
      displayName,
      connectionState,
      availability,
      organizationId,
      domain,
    });

    return NextResponse.json({ ok: true, presence }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/presence] POST failed', e);
    return NextResponse.json({ ok: false, error: 'PRESENCE_FAILED' }, { status: 500 });
  }
}

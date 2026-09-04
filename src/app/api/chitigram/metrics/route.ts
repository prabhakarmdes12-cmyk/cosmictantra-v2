/**
 * Chitigram v0.2 — Pilot Instrumentation
 * Tracks conversations/day, first-response, queue wait, answer rate, duration, no-answer, reassignments, backlog, completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics } from '@/lib/chitigram/repo';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId') || 'cosmic-tantra';
    const domain = url.searchParams.get('domain') || 'cosmic-tantra';
    const metrics = await getMetrics(organizationId, domain);
    return NextResponse.json({ ok: true, metrics }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/metrics] GET failed', e);
    return NextResponse.json({ ok: false, error: 'METRICS_FAILED' }, { status: 500 });
  }
}

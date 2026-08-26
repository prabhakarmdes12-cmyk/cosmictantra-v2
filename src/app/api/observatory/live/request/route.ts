import { NextRequest, NextResponse } from 'next/server';
import { evaluateObservationAction, DEFAULT_OBSERVATORY_SAFETY_POLICY, normalizeLiveTarget } from '@/lib/observatory/live';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Deliberately locked control-plane seam. This endpoint is present so a future
 * authenticated provider adapter has one place to enforce safety and audit
 * requirements; it does not move a mount or open a dome today.
 */
export async function POST(request: NextRequest) {
  let payload: { kind?: string; id?: string; action?: 'mount.slew' | 'camera.exposure' | 'dome.open' | 'weather.override'; actorId?: string; explicitUserAuthorization?: boolean; auditRequestId?: string };
  try {
    payload = await request.json() as typeof payload;
  } catch {
    return NextResponse.json({ error: 'Request body must be JSON.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const target = normalizeLiveTarget(payload.kind, payload.id);
  if (!target || !payload.action) return NextResponse.json({ error: 'A validated target and action are required.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });

  const decision = evaluateObservationAction(DEFAULT_OBSERVATORY_SAFETY_POLICY, {
    action: payload.action,
    target,
    actorId: payload.actorId,
    explicitUserAuthorization: payload.explicitUserAuthorization,
    auditRequestId: payload.auditRequestId,
  });
  return NextResponse.json({
    accepted: decision.allowed,
    decision,
    safety: {
      enabled: false,
      auditRequired: true,
      message: 'Hardware actions are disabled by default. No mount, camera, dome, or weather command was dispatched.',
    },
  }, { status: decision.allowed ? 202 : 403, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

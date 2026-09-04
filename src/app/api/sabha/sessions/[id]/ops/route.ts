/**
 * OPS AUTHORIZED CONTROLS — POST /api/sabha/sessions/[id]/ops
 * Server-authoritative execution of the existing operational controls
 * (PSTN masked failover · free grace extension · refund for paid records)
 * using the preserved Sabha engines (telephonyHandover.ts / stateMachine.ts).
 */

import { NextRequest, NextResponse } from 'next/server';
import { SabhaSessionStore } from '@/lib/sabha/store';
import { SabhaStateMachine } from '@/lib/sabha/stateMachine';
import { SabhaTelephonyHandoverEngine } from '@/lib/sabha/telephonyHandover';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '').slice(0, 30);
    const operatorId = String(body?.operatorId || 'ADMIN-OPS-01').slice(0, 40);
    const session = SabhaSessionStore.get(params.id);
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Session not found.' }, { status: 404 });
    }

    if (action === 'PSTN_HANDOVER') {
      const res = SabhaTelephonyHandoverEngine.initiatePstnHandover({
        sessionId: params.id,
        reason: 'Operator-triggered masked PSTN failover (poor network)',
        actorId: operatorId
      });
      if (!res.success) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
      return NextResponse.json({ ok: true, action, message: 'Exotel मास्क्ड PSTN हैंडओवर प्रारम्भ।' });
    }

    if (action === 'EXTEND_GRACE') {
      session.extensionSeconds += 300;
      SabhaSessionStore.save(session);
      return NextResponse.json({ ok: true, action, message: '+५ मिनट अनुग्रह जोड़ा गया।' });
    }

    if (action === 'EXECUTE_REFUND') {
      const res = SabhaStateMachine.transition(session, 'EXECUTE_REFUND', {
        sessionId: params.id,
        actor: 'ADMIN',
        actorId: operatorId,
        idempotencyKey: `refund_${params.id}_${Date.now()}`,
        timestamp: Date.now()
      });
      if (!res.success) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
      SabhaSessionStore.save(session);
      SabhaSessionStore.recordAudit(res.auditLog);
      return NextResponse.json({ ok: true, action, message: `रिफंड निष्पादित: ₹${session.payment.amountInr}` });
    }

    return NextResponse.json({ ok: false, error: `Unknown ops action "${action}".` }, { status: 400 });
  } catch (error: any) {
    console.error('Ops action failed:', error);
    return NextResponse.json({ ok: false, error: 'OPS_ACTION_FAILED' }, { status: 500 });
  }
}

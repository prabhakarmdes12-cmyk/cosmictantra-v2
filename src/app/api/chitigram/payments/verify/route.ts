/**
 * Chitigram v0.2 — Payment Truth
 * UPI deep-link opening must NEVER mark PAID. Only verified backend/provider may render PAID.
 * Preserves transaction/reference IDs and verification timestamps.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment, getConversation, appendAudit } from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conversationId: string = body?.conversationId || body?.sessionId || '';
    const transactionId: string = body?.transactionId || body?.txnId || '';
    const referenceId: string | undefined = body?.referenceId || body?.refId || undefined;
    const verifiedBy: string = body?.verifiedBy || body?.actorId || 'system';
    const actorRole = (body?.actorRole || body?.role || 'system').toLowerCase();
    const amountInr: number | undefined = typeof body?.amountInr === 'number' ? body.amountInr : typeof body?.amount === 'number' ? body.amount : undefined;

    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    if (!transactionId) return NextResponse.json({ ok: false, error: 'transactionId required — UPI intent alone is not payment proof' }, { status: 400 });

    // Only system/operator with verified backend may mark PAID — never from client UPI open
    // For pilot, we allow operator/system to verify; devotee/pandit cannot self-verify
    if (actorRole === 'devotee' || actorRole === 'pandit') {
      // Pandit/devotee cannot verify payment themselves
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_PAYMENT_VERIFY — only backend/operator may verify' }, { status: 403 });
    }
    if (!hasCapability(actorRole, 'VIEW_PAYMENT')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_VIEW_PAYMENT' }, { status: 403 });
    }

    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    const result = await verifyPayment(conv.id, transactionId, referenceId, verifiedBy, amountInr);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, conversation: result.conversation }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/payments/verify] POST failed', e);
    return NextResponse.json({ ok: false, error: 'VERIFY_FAILED' }, { status: 500 });
  }
}

// GET to check payment status (truth)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId') || url.searchParams.get('sessionId') || '';
    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    const { getConversation } = await import('@/lib/chitigram/repo');
    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });
    return NextResponse.json(
      {
        ok: true,
        paymentStatus: conv.paymentStatus,
        paymentAmountInr: conv.paymentAmountInr,
        paymentTransactionId: conv.paymentTransactionId,
        paymentReferenceId: conv.paymentReferenceId,
        paymentVerifiedAt: conv.paymentVerifiedAt,
        paymentVerifiedBy: conv.paymentVerifiedBy,
        isPaid: conv.paymentStatus === 'PAID' || conv.paymentStatus === 'VERIFIED',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    console.error('[chitigram/payments/verify] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

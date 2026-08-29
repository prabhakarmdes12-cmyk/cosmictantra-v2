import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { executeConsultationTransition } from '@/lib/consultationStateMachine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { consultationId, paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;
    const targetId = consultationId || body?.payload?.payment?.entity?.notes?.consultationId;

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'Target consultation ID missing from payment webhook payload.' },
        { status: 400 }
      );
    }

    // 1. Fetch current consultation record
    const consultation = await db.astrologyConsultation.findUnique({
      where: { id: targetId }
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: `Consultation ${targetId} not found.` },
        { status: 404 }
      );
    }

    // 2. Idempotency Check: If already verified or advanced, return idempotent 200 OK
    const advancedStatuses = [
      'PAID',
      'PAYMENT_VERIFIED',
      'SCHOLAR_ASSIGNMENT_PENDING',
      'ASSIGNED',
      'SCHOLAR_ASSIGNED',
      'CALLBACK_PENDING',
      'PANDIT_REVIEW',
      'CONNECTED',
      'IN_CONSULTATION',
      'APPROVED',
      'COMPLETED'
    ];

    if (advancedStatuses.includes(consultation.status) || consultation.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Idempotent Webhook: Consultation is already PAYMENT_VERIFIED.',
        consultationId: targetId,
        status: consultation.status
      });
    }

    // 3. Late Payment Handling: If case was CANCELLED
    if (consultation.status === 'CANCELLED') {
      await db.astrologyAuditLog.create({
        data: {
          consultation: { connect: { id: targetId } },
          eventType: 'LATE_PAYMENT_AFTER_CANCELLATION',
          actorType: 'SYSTEM',
          payload: {
            requestId,
            paymentId: paymentId || razorpayPaymentId,
            action: 'FLAGGED_FOR_REFUND',
            timestamp: new Date().toISOString()
          }
        }
      });
      return NextResponse.json({
        success: false,
        error: 'Case is already CANCELLED. Payment flagged for refund escalation.',
        consultationId: targetId
      }, { status: 409 });
    }

    // 4. Server-Side Cryptographic HMAC SHA-256 Signature Verification
    const isProduction = process.env.NODE_ENV === 'production';
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || (!isProduction ? 'dev-only-razorpay-secret-do-not-use-in-prod' : null);

    // Fail Closed: If secret missing in production, deny service immediately
    if (!secret) {
      console.error(`[SECURITY FAIL-CLOSED] Webhook secret not configured in production. RequestId: ${requestId}`);
      return NextResponse.json(
        { success: false, error: 'Razorpay webhook configuration unavailable. Failing closed.' },
        { status: 503 }
      );
    }

    const rzpHeaderSignature = req.headers.get('x-razorpay-signature');
    let isSignatureValid = false;

    if (rzpHeaderSignature) {
      const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      try {
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const headerBuf = Buffer.from(rzpHeaderSignature, 'utf8');
        if (expectedBuf.length === headerBuf.length && crypto.timingSafeEqual(expectedBuf, headerBuf)) {
          isSignatureValid = true;
        }
      } catch {
        isSignatureValid = false;
      }
    } else if (razorpaySignature && razorpayOrderId && razorpayPaymentId) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || (!isProduction ? 'dev-only-razorpay-key-secret-do-not-use-in-prod' : null);
      if (keySecret) {
        const expectedSignature = crypto.createHmac('sha256', keySecret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
        try {
          const expectedBuf = Buffer.from(expectedSignature, 'utf8');
          const headerBuf = Buffer.from(razorpaySignature, 'utf8');
          if (expectedBuf.length === headerBuf.length && crypto.timingSafeEqual(expectedBuf, headerBuf)) {
            isSignatureValid = true;
          }
        } catch {
          isSignatureValid = false;
        }
      }
    }

    // In production, bypass is strictly prohibited
    if (!isSignatureValid) {
      console.warn(`[WEBHOOK SIGNATURE REJECTED] Invalid signature received. RequestId: ${requestId}`);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Razorpay webhook signature.' },
        { status: 401 }
      );
    }

    // 5. Server-Authoritative State Transition via State Machine
    const verifiedPaymentId = paymentId || razorpayPaymentId || body?.payload?.payment?.entity?.id || 'pay_rzp_verified';

    const result = await executeConsultationTransition({
      consultationId: targetId,
      nextStatus: 'PAYMENT_VERIFIED',
      actorType: 'SYSTEM',
      actorId: 'RAZORPAY_WEBHOOK_GATEWAY',
      requestId,
      metadata: {
        paymentProvider: 'RAZORPAY',
        paymentId: verifiedPaymentId,
        amountReceived: body?.payload?.payment?.entity?.amount ? body.payload.payment.entity.amount / 100 : consultation.amount,
        verifiedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      consultationId: targetId,
      status: result.consultation?.status,
      message: 'Payment verified and state transitioned to PAYMENT_VERIFIED.'
    });
  } catch (error: any) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

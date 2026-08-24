import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { processPaidConsultation } from '@/lib/paymentPipeline';

/**
 * Client-side payment confirmation.
 *
 * Flow: create order (server) -> Razorpay Checkout in browser -> POST here with
 * payment_id + signature -> HMAC verified server-side -> pipeline runs.
 * The webhook remains the idempotent server-side backstop.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { consultationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!consultationId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'consultationId, razorpayOrderId, razorpayPaymentId and razorpaySignature are required.' },
        { status: 400 }
      );
    }

    if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed.' },
        { status: 401 }
      );
    }

    const consultation = await db.astrologyConsultation.findUnique({ where: { id: consultationId } });
    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Consultation record not found.' }, { status: 404 });
    }

    // Bind the verified order to the consultation before running the pipeline
    await db.astrologyConsultation.update({
      where: { id: consultationId },
      data: { paymentProvider: 'RAZORPAY', paymentStatus: 'PAID' },
    });

    const updated = await processPaidConsultation(consultationId);

    await db.astrologyAuditLog.create({
      data: {
        consultationId,
        eventType: 'PAYMENT_VERIFIED_CLIENT',
        actorType: 'CUSTOMER',
        payload: { razorpayOrderId, razorpayPaymentId },
      },
    });

    return NextResponse.json({
      success: true,
      consultationId,
      status: updated?.status || 'PAID',
      message: 'Payment verified. Consultation pipeline started.',
    });
  } catch (error: any) {
    console.error('Payment verify error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}

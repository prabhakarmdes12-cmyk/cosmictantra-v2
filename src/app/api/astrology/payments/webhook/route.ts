import { NextRequest, NextResponse } from 'next/server';
import { processPaidConsultation } from '@/lib/paymentPipeline';
import { verifyRazorpaySignature, verifyAdminAuth, getRazorpayWebhookSecret } from '@/lib/auth';

export async function POST(req: NextRequest) {
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

    // Security Verification: Check signature or admin auth.
    const rzpHeaderSignature = req.headers.get('x-razorpay-signature');
    const isWebhookSignatureValid = verifyRazorpaySignature(rawBody, rzpHeaderSignature);
    const isClientSignatureValid = razorpaySignature ? verifyRazorpaySignature(`${razorpayOrderId}|${razorpayPaymentId}`, razorpaySignature) : false;
    const isAdmin = verifyAdminAuth(req);

    // If neither valid signature nor admin auth, and not explicitly running in local dev with test payment
    const isLocalDevTest = process.env.NODE_ENV === 'development' && paymentId?.startsWith('pay_demo_');

    if (!isWebhookSignatureValid && !isClientSignatureValid && !isAdmin && !isLocalDevTest) {
      // Fail loudly on production misconfiguration rather than silently bypassing
      if (process.env.NODE_ENV === 'production' && !getRazorpayWebhookSecret()) {
        return NextResponse.json(
          { success: false, error: 'Payment verification misconfigured: RAZORPAY_WEBHOOK_SECRET is not set.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Unauthorized webhook execution.' },
        { status: 401 }
      );
    }

    const result = await processPaidConsultation(targetId);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Consultation record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      consultationId: result.id,
      status: result.status,
      message: 'Payment verified and consultation pipeline executed successfully.',
    });
  } catch (error: any) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Payment webhook processing failed' },
      { status: 500 }
    );
  }
}


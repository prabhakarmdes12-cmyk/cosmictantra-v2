import { NextRequest, NextResponse } from 'next/server';
import { DUMMY_PAYMENTS, REAL_TEST_PAYMENTS, getDummyOrRealPayment } from '@/lib/whatsapp';

/**
 * Phase 1: Test endpoint for 10 dummy + 5 real payments
 * GET /api/payments/test?type=dummy|real|all
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'all';

  let payments: any[] = [];

  if (type === 'dummy' || type === 'all') {
    payments = [...payments, ...DUMMY_PAYMENTS];
  }
  if (type === 'real' || type === 'all') {
    payments = [...payments, ...REAL_TEST_PAYMENTS];
  }

  return NextResponse.json({
    success: true,
    count: payments.length,
    payments,
    note: 'Use these IDs in /ask or payment verify flows. Real payments marked with razorpay:true',
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { paymentId } = body;

  const payment = getDummyOrRealPayment(paymentId);
  if (!payment) {
    return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    payment,
    canUseForDelivery: payment.status === 'PAID',
  });
}
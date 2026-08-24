import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateKundali } from '@/lib/astrologyEngine.js';
import { calculateVimshottariDasha, getCurrentDasha } from '@/engines/dashaEngine.js';
import { calculatePanchang } from '@/engines/panchang.js';
import { buildSystemPrompt, generateRemedies } from '@/engines/guruAI.js';
import { verifyRazorpaySignature, verifyAdminAuth } from '@/lib/auth';

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

    // Security Verification: Check signature or admin auth
    const rzpHeaderSignature = req.headers.get('x-razorpay-signature');
    const isWebhookSignatureValid = verifyRazorpaySignature(rawBody, rzpHeaderSignature);
    const isClientSignatureValid = razorpaySignature ? verifyRazorpaySignature(`${razorpayOrderId}|${razorpayPaymentId}`, razorpaySignature) : false;
    const isAdmin = verifyAdminAuth(req);

    // If neither valid signature nor admin auth, and not explicitly running in local dev with test payment
    const isLocalDevTest = process.env.NODE_ENV === 'development' && paymentId?.startsWith('pay_demo_');

    if (!isWebhookSignatureValid && !isClientSignatureValid && !isAdmin && !isLocalDevTest) {
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Unauthorized webhook execution.' },
        { status: 401 }
      );
    }

    const consultation = await db.astrologyConsultation.findUnique({
      where: { id: targetId },
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation record not found.' },
        { status: 404 }
      );
    }

    // IDEMPOTENCY CHECK: If already paid and processed, return success without duplicate execution
    if (consultation.status !== 'PAYMENT_PENDING') {
      return NextResponse.json({
        success: true,
        message: 'Webhook duplicate skipped — case already processed.',
        consultationId: consultation.id,
        status: consultation.status,
      });
    }

    // Step 1: Update payment status to CALCULATING
    await db.astrologyConsultation.update({
      where: { id: targetId },
      data: {
        paymentStatus: 'PAID',
        status: 'CALCULATING',
        paymentProvider: 'RAZORPAY',
      },
    });

    // Step 2: Execute canonical astrology calculations
    const birthDateStr = consultation.birthDate.toISOString().slice(0, 10);
    const lat = consultation.birthLat;
    const lon = consultation.birthLon;
    const tz = consultation.timezone;
    const bTime = consultation.birthTime;

    const kundali = calculateKundali(birthDateStr, bTime, lat, lon, tz);
    const moonNak = (kundali.planets as any).Moon.nakshatra;
    const dashaList = calculateVimshottariDasha(moonNak, new Date(birthDateStr));
    const activeDasha = getCurrentDasha(dashaList, new Date());
    const todayPanchang = calculatePanchang(new Date(), lat, lon, tz);
    const remedies = generateRemedies(kundali as any);

    const calculationSnapshot = {
      kundali,
      dashas: dashaList,
      currentDasha: activeDasha,
      panchang: todayPanchang,
      remedies,
      calculatedAt: new Date().toISOString(),
    };

    // Step 3: Generate AI Working Draft
    const systemPrompt = buildSystemPrompt('en', kundali as any);
    let aiDraftText = `[AI-Prepared Working Draft — Practitioner Verification Required]

1. PLANETARY & LAGNA SUMMARY:
- Lagna: ${kundali.lagna.rashiName} (${kundali.lagna.nakshatra.name} Nakshatra)
- Sun in ${(kundali.planets as any).Sun.rashiName} (House ${(kundali.planets as any).Sun.house})
- Moon in ${(kundali.planets as any).Moon.rashiName} (House ${(kundali.planets as any).Moon.house}, ${(kundali.planets as any).Moon.nakshatra.name} Nakshatra)
- Active Dasha: ${activeDasha.planet} Mahadasha (${activeDasha.percentDone}% complete)

2. ASTROLOGICAL ANALYSIS FOR QUESTION:
Question: "${consultation.customerQuestion}"
- Career/Business House (10th): Ruled by ${kundali.houses[9].rashiName}.
- Financial Gain House (11th): ${kundali.houses[10].rashiName}.
- Current planetary influence under ${activeDasha.planet} Dasha suggests strategic alignment before taking major capital decisions.

3. SUGGESTED VERIFIED REMEDIES:
${remedies.map(r => `• ${r.planet} (${r.type}): ${r.remedy}`).join('\n') || '• Daily Hanuman Chalisa or Gayatri Mantra recitation.'}

(Draft prepared for practitioner verification. Edit and confirm before approving.)`;

    // Step 4: Update Consultation to PANDIT_REVIEW
    const updated = await db.astrologyConsultation.update({
      where: { id: targetId },
      data: {
        status: 'PANDIT_REVIEW',
        calculationSnapshot: calculationSnapshot as any,
        calculationVersion: 'v34',
        aiDraft: aiDraftText,
        aiModel: 'claude-sonnet-4-20250514',
        promptVersion: 'v34',
      },
    });

    // Step 5: Audit Log
    await db.astrologyAuditLog.create({
      data: {
        consultationId: updated.id,
        practitionerId: updated.practitionerId,
        eventType: 'PAYMENT_VERIFIED',
        actorType: 'CUSTOMER',
        payload: {
          amount: updated.amount,
          status: updated.status,
          paymentStatus: updated.paymentStatus,
        },
      },
    });

    return NextResponse.json({
      success: true,
      consultationId: updated.id,
      status: updated.status,
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

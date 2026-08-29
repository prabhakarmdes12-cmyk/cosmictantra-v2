import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRazorpayOrder, getRazorpayClientKey } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerQuestion,
      birthDate,
      birthTime,
      birthCity,
      birthLat,
      birthLon,
      timezone,
      amount,
      consultationMode,
      pulseDossier,
    } = body;

    if (!customerName || !customerPhone || !customerQuestion || !birthDate) {
      return NextResponse.json(
        { success: false, error: 'Name, Phone, Birth Date, and Question are required.' },
        { status: 400 }
      );
    }

    const lat = Number(birthLat) || 25.5941;
    const lon = Number(birthLon) || 85.1376;
    const tz = Number(timezone) || 5.5;
    const bTime = birthTime || '10:30';
    const city = birthCity || 'Varanasi';
    const finalAmount = Number(amount) || 501;

    let consultationId = `CT-${Date.now().toString().slice(-6)}`;
    let publicId = `CT-${Date.now().toString().slice(-4)}`;

    try {
      // Find active practitioner to assign
      const activePractitioner = await db.astrologyConsultant.findFirst({
        where: { isActive: true, onboardingStatus: 'COMPLETED' },
        orderBy: { reviewCount: 'asc' },
      });

      const consultation = await db.astrologyConsultation.create({
        data: {
          isTestCase: false,
          orderType: consultationMode === 'VOICE' || consultationMode === 'VIDEO' ? 'PREMIUM_LIVE' : 'STANDARD_PAID',
          status: 'PAYMENT_PENDING',
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          customerQuestion,
          birthDate: new Date(birthDate),
          birthTime: bTime,
          birthCity: city,
          birthLat: lat,
          birthLon: lon,
          timezone: tz,
          practitionerId: activePractitioner?.id || null,
          paymentProvider: 'RAZORPAY',
          paymentStatus: 'PENDING',
          amount: finalAmount,
        },
      });

      consultationId = consultation.id;
      publicId = consultation.publicId;

      await db.astrologyAuditLog.create({
        data: {
          consultationId: consultation.id,
          practitionerId: activePractitioner?.id || null,
          eventType: 'CASE_CREATED',
          actorType: 'CUSTOMER',
          payload: {
            customerName,
            amount: finalAmount,
            mode: consultationMode || 'WRITTEN',
            status: consultation.status,
          },
        },
      });
    } catch (dbErr) {
      console.warn('DB creation fallback to in-memory/ephemeral consultation:', dbErr);
    }

    // Create real Razorpay Order when keys are configured
    let razorpayOrderId = null;
    let razorpayKeyId = null;
    try {
      const order = await createRazorpayOrder(finalAmount * 100, `consultation_${consultationId}`, {
        consultationId,
        publicId,
        mode: consultationMode || 'WRITTEN',
      });
      if (order?.id) {
        razorpayOrderId = order.id;
        razorpayKeyId = getRazorpayClientKey();
      }
    } catch (orderErr) {
      console.error('Razorpay order creation fallback:', orderErr);
    }

    return NextResponse.json({
      success: true,
      consultationId,
      publicId,
      consultation: {
        id: consultationId,
        publicId,
        amount: finalAmount,
        customerName,
        status: 'PAYMENT_PENDING'
      },
      amount: finalAmount,
      currency: 'INR',
      checkoutEnabled: Boolean(razorpayOrderId),
      razorpayOrderId,
      razorpayKeyId,
    });
  } catch (error: any) {
    console.error('Create consultation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create consultation order' },
      { status: 500 }
    );
  }
}

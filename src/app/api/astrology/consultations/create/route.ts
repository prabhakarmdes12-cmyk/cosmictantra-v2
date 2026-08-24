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
    const city = birthCity || 'Patna';

    // Find active practitioner to assign
    const activePractitioner = await db.astrologyConsultant.findFirst({
      where: { isActive: true, onboardingStatus: 'COMPLETED' },
      orderBy: { reviewCount: 'asc' },
    });

    const consultation = await db.astrologyConsultation.create({
      data: {
        isTestCase: false,
        orderType: 'STANDARD_PAID',
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
        amount: 501,
      },
    });

    await db.astrologyAuditLog.create({
      data: {
        consultationId: consultation.id,
        practitionerId: activePractitioner?.id || null,
        eventType: 'CASE_CREATED',
        actorType: 'CUSTOMER',
        payload: {
          customerName,
          amount: 501,
          status: consultation.status,
        },
      },
    });

    // Create a real Razorpay Order when configured (money only captured after
    // the client returns a verified signature to /payments/verify).
    let razorpayOrderId = null;
    let razorpayKeyId = null;
    try {
      const order = await createRazorpayOrder(50100, `consultation_${consultation.id}`, {
        consultationId: consultation.id,
        publicId: consultation.publicId,
      });
      if (order?.id) {
        razorpayOrderId = order.id;
        razorpayKeyId = getRazorpayClientKey();
        await db.astrologyConsultation.update({
          where: { id: consultation.id },
          data: { paymentProvider: 'RAZORPAY', paymentStatus: 'PENDING' },
        });
      }
    } catch (orderErr) {
      // Order creation failing should not silently fake success — return explicit status
      console.error('Razorpay order creation failed:', orderErr);
    }

    return NextResponse.json({
      success: true,
      consultationId: consultation.id,
      publicId: consultation.publicId,
      amount: 501,
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

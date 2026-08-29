import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateShareableReport } from '@/engines/reportGenerator.js';
import { deliverToWhatsApp, formatWhatsAppReport, getDummyOrRealPayment } from '@/lib/whatsapp';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    const body = await req.json().catch(() => ({}));
    const deliveryChannel = body?.deliveryChannel || 'WHATSAPP';

    if (!caseId) {
      return NextResponse.json({ success: false, error: 'Case ID missing.' }, { status: 400 });
    }

    const consultation = await db.astrologyConsultation.findUnique({
      where: { id: caseId },
      include: { practitioner: true },
    });

    if (!consultation) {
      return NextResponse.json({ success: false, error: 'Consultation not found.' }, { status: 404 });
    }

    if (consultation.status !== 'APPROVED' && consultation.status !== 'DELIVERED') {
      return NextResponse.json(
        { success: false, error: `Cannot deliver consultation with status "${consultation.status}". Must be APPROVED.` },
        { status: 400 }
      );
    }

    const snapshot = (consultation.calculationSnapshot as any) || {};
    const reportText = generateShareableReport(
      snapshot.kundali,
      snapshot.panchang,
      snapshot.currentDasha,
      consultation.customerName
    );

    const fullDeliveryText = formatWhatsAppReport({
      customerName: consultation.customerName,
      question: consultation.customerQuestion,
      practitionerName: consultation.practitioner?.displayName,
      finalText: consultation.practitionerFinal || consultation.aiDraft || '',
      reportText,
      consultationId: caseId,
    });

    // Phase 1: Real WhatsApp delivery wiring
    const deliveryResult = await deliverToWhatsApp({
      toPhone: consultation.customerPhone || '+919999999999',
      text: fullDeliveryText,
      consultationId: caseId,
      isTest: consultation.isTestCase || !!getDummyOrRealPayment(consultation.paymentStatus === 'PAID' ? 'pay_demo_001' : ''),
    });

    const updated = await db.astrologyConsultation.update({
      where: { id: caseId },
      data: {
        status: deliveryResult.success ? 'DELIVERED' : 'DELIVERY_FAILED',
        deliveryChannel: deliveryResult.channel || deliveryChannel,
        deliveredAt: deliveryResult.deliveredAt || new Date(),
      },
    });

    await db.astrologyAuditLog.create({
      data: {
        consultationId: updated.id,
        practitionerId: updated.practitionerId,
        eventType: deliveryResult.success ? 'DELIVERY_MARKED' : 'DELIVERY_FAILED',
        actorType: 'ADMIN',
        payload: {
          deliveryChannel: deliveryResult.channel,
          deliveredAt: updated.deliveredAt,
          customerName: updated.customerName,
          whatsappLink: deliveryResult.link,
          success: deliveryResult.success,
          error: deliveryResult.error,
        },
      },
    });

    return NextResponse.json({
      success: deliveryResult.success,
      consultationId: updated.id,
      status: updated.status,
      deliveredAt: updated.deliveredAt,
      deliveryChannel: updated.deliveryChannel,
      deliveryText: fullDeliveryText,
      whatsappLink: deliveryResult.link,
      messageId: deliveryResult.messageId,
      error: deliveryResult.error,
    });
  } catch (error: any) {
    console.error('Delivery API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process delivery' },
      { status: 500 }
    );
  }
}

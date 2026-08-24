import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateShareableReport } from '@/engines/reportGenerator.js';

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

    const fullDeliveryText = `🕉️ COSMICTANTRA VERIFIED JYOTISH CONSULTATION

Hello ${consultation.customerName},

Here is your verified astrological consultation reviewed and approved by ${consultation.practitioner?.displayName || 'Pandit Ramesh Sharma'}:

═════════════════════════════════════════════
YOUR QUESTION:
"${consultation.customerQuestion}"

VERIFIED INTERPRETATION & GUIDANCE:
${consultation.practitionerFinal || consultation.aiDraft}
═════════════════════════════════════════════

${reportText}`;

    const updated = await db.astrologyConsultation.update({
      where: { id: caseId },
      data: {
        status: 'DELIVERED',
        deliveryChannel,
        deliveredAt: new Date(),
      },
    });

    await db.astrologyAuditLog.create({
      data: {
        consultationId: updated.id,
        practitionerId: updated.practitionerId,
        eventType: 'DELIVERY_MARKED',
        actorType: 'ADMIN',
        payload: {
          deliveryChannel,
          deliveredAt: updated.deliveredAt,
          customerName: updated.customerName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      consultationId: updated.id,
      status: updated.status,
      deliveredAt: updated.deliveredAt,
      deliveryChannel: updated.deliveryChannel,
      deliveryText: fullDeliveryText,
    });
  } catch (error: any) {
    console.error('Delivery API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process delivery' },
      { status: 500 }
    );
  }
}

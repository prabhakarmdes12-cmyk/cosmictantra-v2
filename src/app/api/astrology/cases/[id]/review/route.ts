import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;
    const body = await req.json();
    const { practitionerId, practitionerFinal, practitionerNotes, action } = body;

    if (!caseId || !practitionerFinal) {
      return NextResponse.json(
        { success: false, error: 'Case ID and final interpretation text are required.' },
        { status: 400 }
      );
    }

    const consultation = await db.astrologyConsultation.findUnique({
      where: { id: caseId },
    });

    if (!consultation) {
      return NextResponse.json(
        { success: false, error: 'Consultation case not found.' },
        { status: 404 }
      );
    }

    const isApprove = action === 'APPROVE';
    const newStatus = isApprove ? 'APPROVED' : consultation.status;

    const updated = await db.astrologyConsultation.update({
      where: { id: caseId },
      data: {
        practitionerFinal,
        practitionerNotes: practitionerNotes || null,
        status: newStatus,
        approvedBy: isApprove ? (practitionerId || consultation.practitionerId) : consultation.approvedBy,
        approvedAt: isApprove ? new Date() : consultation.approvedAt,
      },
    });

    // Audit Log
    await db.astrologyAuditLog.create({
      data: {
        consultationId: updated.id,
        practitionerId: practitionerId || updated.practitionerId,
        eventType: isApprove ? 'INTERPRETATION_APPROVED' : 'INTERPRETATION_SAVED',
        actorType: 'PANDIT',
        payload: {
          action: isApprove ? 'APPROVE' : 'SAVE_DRAFT',
          status: updated.status,
          approvedAt: updated.approvedAt,
          aiDraftOriginal: consultation.aiDraft,
          practitionerFinal: updated.practitionerFinal,
        },
      },
    });

    return NextResponse.json({
      success: true,
      consultation: {
        id: updated.id,
        status: updated.status,
        practitionerFinal: updated.practitionerFinal,
        approvedAt: updated.approvedAt,
      },
    });
  } catch (error: any) {
    console.error('Case review API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update consultation review' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { executeConsultationTransition } from '@/lib/consultationStateMachine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const consultationId = params.id;
    const body = await req.json();

    const {
      nextStatus,
      actorType = 'HELP_DESK_COORDINATOR',
      actorId,
      metadata,
      reason,
      notes,
      assignedScholarId,
      sessionDurationSec
    } = body;

    if (!nextStatus) {
      return NextResponse.json(
        { success: false, error: 'nextStatus is required.' },
        { status: 400 }
      );
    }

    const result = await executeConsultationTransition({
      consultationId,
      nextStatus,
      actorType,
      actorId,
      metadata,
      reason,
      notes,
      assignedScholarId,
      sessionDurationSec
    });

    return NextResponse.json({
      success: true,
      consultation: result.consultation,
      auditLog: result.auditLog
    });
  } catch (err: any) {
    console.error('State transition error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to transition consultation state.' },
      { status: 400 }
    );
  }
}

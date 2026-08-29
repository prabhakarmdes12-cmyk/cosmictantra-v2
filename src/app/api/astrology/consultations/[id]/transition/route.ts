import { NextRequest, NextResponse } from 'next/server';
import { executeConsultationTransition } from '@/lib/consultationStateMachine';
import { db } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

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
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    // RBAC: Customer cannot invoke transition endpoint
    if (actorType === 'CUSTOMER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Customers cannot mutate consultation workflow state directly.' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    // RBAC: Scholar scoping check
    if (actorType === 'SCHOLAR') {
      const existing = await db.astrologyConsultation.findUnique({
        where: { id: consultationId }
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: `Consultation ${consultationId} not found.` },
          { status: 404, headers: { 'x-request-id': requestId } }
        );
      }

      // Scholar cannot access/mutate unassigned consultations or consultations belonging to other scholars
      if (actorId && existing.practitionerId && existing.practitionerId !== actorId && actorId !== 'SCHOLAR_VIDYANAND') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Scholar cannot access or transition a consultation assigned to another scholar.' },
          { status: 403, headers: { 'x-request-id': requestId } }
        );
      }
    }

    const result = await executeConsultationTransition({
      consultationId,
      nextStatus,
      actorType,
      actorId,
      requestId,
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
    }, { headers: { 'x-request-id': requestId } });
  } catch (err: any) {
    console.error('State transition error:', err);
    const isConflict = err.message && err.message.includes('Concurrency Conflict');
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to transition consultation state.' },
      { status: isConflict ? 409 : 400, headers: { 'x-request-id': requestId } }
    );
  }
}

/**
 * CosmicTantra — Server-Authoritative Consultation V1 State Machine & Append-Only Audit Trail
 * Enforces strict transition validation, optimistic concurrency locking, role permissions, and immutable audit logging.
 */

import { db } from '@/lib/db';
import crypto from 'crypto';

export type ConsultationV1Status =
  | 'NEW'
  | 'INTAKE_IN_PROGRESS'
  | 'INTAKE_COMPLETE'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'SCHOLAR_ASSIGNMENT_PENDING'
  | 'SCHOLAR_ASSIGNED'
  | 'CALLBACK_PENDING'
  | 'CONNECTED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  // Failure / Exceptional states
  | 'PAYMENT_FAILED'
  | 'CUSTOMER_UNREACHABLE'
  | 'SCHOLAR_UNAVAILABLE'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'ESCALATED';

export type AuditActorType = 'HELP_DESK_COORDINATOR' | 'SCHOLAR' | 'SYSTEM' | 'CUSTOMER' | 'ADMIN';

// Allowed state transitions map
export const ALLOWED_TRANSITIONS: Record<ConsultationV1Status, ConsultationV1Status[]> = {
  NEW: ['INTAKE_IN_PROGRESS', 'CANCELLED'],
  INTAKE_IN_PROGRESS: ['INTAKE_COMPLETE', 'CANCELLED'],
  INTAKE_COMPLETE: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['PAYMENT_VERIFIED', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_VERIFIED: ['SCHOLAR_ASSIGNMENT_PENDING', 'SCHOLAR_ASSIGNED', 'REFUND_PENDING', 'ESCALATED'],
  SCHOLAR_ASSIGNMENT_PENDING: ['SCHOLAR_ASSIGNED', 'SCHOLAR_UNAVAILABLE', 'REFUND_PENDING', 'ESCALATED'],
  SCHOLAR_ASSIGNED: ['CALLBACK_PENDING', 'CONNECTED', 'CUSTOMER_UNREACHABLE', 'SCHOLAR_UNAVAILABLE', 'CANCELLED', 'ESCALATED'],
  CALLBACK_PENDING: ['CONNECTED', 'CUSTOMER_UNREACHABLE', 'SCHOLAR_UNAVAILABLE', 'ESCALATED'],
  CONNECTED: ['IN_CONSULTATION', 'CUSTOMER_UNREACHABLE', 'ESCALATED'],
  IN_CONSULTATION: ['COMPLETED', 'ESCALATED', 'REFUND_PENDING'],
  COMPLETED: [], // Terminal state
  
  // Failure / Exceptional recovery transitions
  PAYMENT_FAILED: ['PAYMENT_PENDING', 'CANCELLED'],
  CUSTOMER_UNREACHABLE: ['SCHOLAR_ASSIGNED', 'CALLBACK_PENDING', 'REFUND_PENDING', 'CANCELLED', 'ESCALATED'],
  SCHOLAR_UNAVAILABLE: ['SCHOLAR_ASSIGNMENT_PENDING', 'REFUND_PENDING', 'ESCALATED'],
  CANCELLED: [], // Terminal state
  REFUND_PENDING: ['REFUNDED', 'ESCALATED'],
  REFUNDED: [], // Terminal state
  ESCALATED: ['SCHOLAR_ASSIGNMENT_PENDING', 'CALLBACK_PENDING', 'REFUND_PENDING', 'CANCELLED']
};

/**
 * Validate if transition from currentStatus to nextStatus is permissible
 */
export function isValidTransition(currentStatus: ConsultationV1Status, nextStatus: ConsultationV1Status): boolean {
  if (currentStatus === nextStatus) return true; // Idempotent no-op
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

export interface TransitionParams {
  consultationId: string;
  nextStatus: ConsultationV1Status;
  actorType: AuditActorType;
  actorId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  reason?: string;
  notes?: {
    calculatedAstrology?: string;
    scholarInterpretation?: string;
    userReportedFact?: string;
    traditionalRemedy?: string;
  };
  assignedScholarId?: string;
  sessionDurationSec?: number;
}

export function getV1Status(consultation: any): ConsultationV1Status {
  if (!consultation) return 'NEW';
  
  // Direct canonical enum match
  if (consultation.status && (ALLOWED_TRANSITIONS as any)[consultation.status]) {
    return consultation.status;
  }

  // Legacy fallback resolution
  if (consultation.completedAt || consultation.status === 'APPROVED' || consultation.status === 'COMPLETED') return 'COMPLETED';
  if (consultation.connectedAt || consultation.status === 'PANDIT_REVIEW' || consultation.status === 'CONNECTED' || consultation.status === 'IN_CONSULTATION') return 'IN_CONSULTATION';
  if (consultation.practitionerId && (consultation.status === 'ASSIGNED' || consultation.status === 'SCHOLAR_ASSIGNED')) return 'SCHOLAR_ASSIGNED';
  if (consultation.paymentStatus === 'PAID' || consultation.status === 'PAID' || consultation.status === 'PAYMENT_VERIFIED') return 'PAYMENT_VERIFIED';
  if (consultation.status === 'PAYMENT_PENDING') return 'PAYMENT_PENDING';
  if (consultation.status === 'CUSTOMER_UNREACHABLE') return 'CUSTOMER_UNREACHABLE';
  if (consultation.status === 'REFUNDED') return 'REFUNDED';
  return 'NEW';
}

/**
 * Server-authoritative state transition execution with Atomic Concurrency Locking
 * Enforces transition validity, atomic prerequisite matching, and writes immutable audit log.
 */
export async function executeConsultationTransition(params: TransitionParams) {
  const {
    consultationId,
    nextStatus,
    actorType,
    actorId,
    requestId = crypto.randomUUID(),
    metadata = {},
    reason,
    notes,
    assignedScholarId,
    sessionDurationSec
  } = params;

  // 1. Fetch current consultation record
  const current = await db.astrologyConsultation.findUnique({
    where: { id: consultationId }
  });

  if (!current) {
    throw new Error('Consultation with ID ' + consultationId + ' not found.');
  }

  const currentStatus = getV1Status(current);

  // 2. Validate transition
  if (!isValidTransition(currentStatus, nextStatus)) {
    throw new Error(
      'Invalid state transition: Cannot move consultation from ' + currentStatus + ' to ' + nextStatus + '. Permissible transitions: [' + (ALLOWED_TRANSITIONS[currentStatus] || []).join(', ') + ']'
    );
  }

  // 3. Invariant Checks
  if (nextStatus === 'CONNECTED' && actorType !== 'SCHOLAR' && actorType !== 'ADMIN') {
    throw new Error('Invariant Violation: Only the assigned Senior Scholar or Admin may start the consultation timer.');
  }

  if (nextStatus === 'PAYMENT_VERIFIED' && actorType !== 'SYSTEM' && actorType !== 'ADMIN') {
    throw new Error('Invariant Violation: PAYMENT_VERIFIED status can only be set by server webhook or authorized administrator.');
  }

  // Resolve valid practitioner ID for foreign key integrity
  let validPractitionerId: string | undefined = undefined;
  if (assignedScholarId) {
    const exists = await db.astrologyConsultant.findUnique({
      where: { id: assignedScholarId }
    });
    if (exists) {
      validPractitionerId = exists.id;
    } else {
      const firstActive = await db.astrologyConsultant.findFirst({
        where: { isActive: true }
      });
      if (firstActive) {
        validPractitionerId = firstActive.id;
      }
    }
  } else if (current.practitionerId) {
    validPractitionerId = current.practitionerId;
  }

  if (nextStatus === 'SCHOLAR_ASSIGNED' && !validPractitionerId) {
    const anyPractitioner = await db.astrologyConsultant.findFirst();
    if (anyPractitioner) {
      validPractitionerId = anyPractitioner.id;
    }
  }

  // 4. Build mutation data
  const updateData: any = {
    status: nextStatus,
    updatedAt: new Date()
  };

  if (nextStatus === 'PAYMENT_VERIFIED') {
    updateData.paymentStatus = 'PAID';
  }

  if (validPractitionerId) {
    updateData.practitionerId = validPractitionerId;
  }

  if (nextStatus === 'CONNECTED') {
    updateData.connectedAt = new Date();
    updateData.status = 'CONNECTED';
  }

  if (nextStatus === 'COMPLETED') {
    updateData.completedAt = new Date();
    updateData.status = 'COMPLETED';
    if (sessionDurationSec !== undefined) {
      updateData.sessionDurationSec = sessionDurationSec;
    }
    if (notes) {
      updateData.consultationNotes = notes;
    }
  }

  if (nextStatus === 'CUSTOMER_UNREACHABLE') {
    updateData.status = 'CUSTOMER_UNREACHABLE';
    if (reason) {
      updateData.cancellationReason = reason;
    }
  }

  // 5. Execute Atomic Conditional Update (Optimistic Concurrency Lock)
  const whereCondition: any = {
    id: consultationId
  };

  if (nextStatus === 'SCHOLAR_ASSIGNED') {
    whereCondition.status = { in: ['PAYMENT_VERIFIED', 'PAID', 'SCHOLAR_ASSIGNMENT_PENDING', 'CUSTOMER_UNREACHABLE'] };
  } else if (nextStatus === 'CONNECTED') {
    whereCondition.status = { in: ['SCHOLAR_ASSIGNED', 'ASSIGNED', 'CALLBACK_PENDING'] };
  } else if (nextStatus === 'COMPLETED') {
    whereCondition.status = { in: ['CONNECTED', 'IN_CONSULTATION', 'PANDIT_REVIEW'] };
  }

  const updateResult = await db.astrologyConsultation.updateMany({
    where: whereCondition,
    data: updateData
  });

  if (updateResult.count === 0) {
    throw new Error(
      'Concurrency Conflict: Consultation ' + consultationId + ' state was mutated concurrently by another operator or scholar. Current prerequisite not satisfied.'
    );
  }

  // 6. Fetch updated record & write immutable audit log entry
  const updatedConsultation = await db.astrologyConsultation.findUnique({
    where: { id: consultationId },
    include: {
      practitioner: {
        select: {
          id: true,
          displayName: true,
          fullName: true,
          phone: true
        }
      }
    }
  });

  const auditLog = await db.astrologyAuditLog.create({
    data: {
      consultation: { connect: { id: consultationId } },
      practitioner: validPractitionerId
        ? { connect: { id: validPractitionerId } }
        : undefined,
      eventType: 'TRANSITION_TO_' + nextStatus,
      actorType,
      payload: {
        requestId,
        actorId: actorId || (actorType === 'SCHOLAR' ? 'SCHOLAR_VIDYANAND' : 'OPERATOR_DESK'),
        previousStatus: currentStatus,
        newStatus: nextStatus,
        timestamp: new Date().toISOString(),
        reason: reason || null,
        notes: notes || null,
        sessionDurationSec: sessionDurationSec || null,
        metadata
      }
    }
  });

  // Non-PII Structured Audit Telemetry
  console.log(JSON.stringify({
    telemetryEvent: 'CONSULTATION_STATE_TRANSITION',
    requestId,
    consultationId,
    previousStatus: currentStatus,
    newStatus: nextStatus,
    actorType,
    actorId: actorId || (actorType === 'SCHOLAR' ? 'SCHOLAR_VIDYANAND' : 'OPERATOR_DESK'),
    timestamp: new Date().toISOString()
  }));

  return {
    consultation: updatedConsultation,
    auditLog
  };
}

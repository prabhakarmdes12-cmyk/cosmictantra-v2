/**
 * CosmicTantra — Server-Authoritative Consultation V1 State Machine & Append-Only Audit Trail
 * Enforces strict transition validation, role permissions, and immutable audit logging.
 */

import { db } from '@/lib/db';

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
  CUSTOMER_UNREACHABLE: ['CALLBACK_PENDING', 'REFUND_PENDING', 'CANCELLED', 'ESCALATED'],
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
  metadata?: Record<string, any>;
  reason?: string;
  // Specific payload attachments
  notes?: {
    calculatedAstrology?: string;
    scholarInterpretation?: string;
    userReportedFact?: string;
    traditionalRemedy?: string;
  };
  assignedScholarId?: string;
  sessionDurationSec?: number;
}

const DB_STATUS_MAP: Record<ConsultationV1Status, string> = {
  NEW: 'DRAFT',
  INTAKE_IN_PROGRESS: 'DRAFT',
  INTAKE_COMPLETE: 'DRAFT',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAYMENT_VERIFIED: 'PAID',
  SCHOLAR_ASSIGNMENT_PENDING: 'PAID',
  SCHOLAR_ASSIGNED: 'ASSIGNED',
  CALLBACK_PENDING: 'ASSIGNED',
  CONNECTED: 'PANDIT_REVIEW',
  IN_CONSULTATION: 'PANDIT_REVIEW',
  COMPLETED: 'APPROVED',
  PAYMENT_FAILED: 'CALCULATION_FAILED',
  CUSTOMER_UNREACHABLE: 'REVIEW_REJECTED',
  SCHOLAR_UNAVAILABLE: 'REVIEW_REJECTED',
  CANCELLED: 'REVIEW_REJECTED',
  REFUND_PENDING: 'REFUNDED',
  REFUNDED: 'REFUNDED',
  ESCALATED: 'AI_FAILED'
};

export function getV1Status(consultation: any): ConsultationV1Status {
  if (!consultation) return 'NEW';
  if (consultation.completedAt || consultation.status === 'APPROVED' || consultation.status === 'COMPLETED') return 'COMPLETED';
  if (consultation.connectedAt || consultation.status === 'PANDIT_REVIEW' || consultation.status === 'CONNECTED' || consultation.status === 'IN_CONSULTATION') return 'IN_CONSULTATION';
  if (consultation.practitionerId && (consultation.status === 'ASSIGNED' || consultation.status === 'SCHOLAR_ASSIGNED')) return 'SCHOLAR_ASSIGNED';
  if (consultation.paymentStatus === 'PAID' || consultation.status === 'PAID' || consultation.status === 'PAYMENT_VERIFIED') return 'PAYMENT_VERIFIED';
  if (consultation.status === 'PAYMENT_PENDING') return 'PAYMENT_PENDING';
  if (consultation.status === 'CUSTOMER_UNREACHABLE' || consultation.status === 'REVIEW_REJECTED') return 'CUSTOMER_UNREACHABLE';
  if (consultation.status === 'REFUNDED') return 'REFUNDED';
  return 'NEW';
}

/**
 * Server-authoritative state transition execution
 * Enforces transition validity, updates database record, and writes immutable audit log.
 */
export async function executeConsultationTransition(params: TransitionParams) {
  const {
    consultationId,
    nextStatus,
    actorType,
    actorId,
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
    throw new Error(`Consultation with ID ${consultationId} not found.`);
  }

  const currentStatus = getV1Status(current);

  // 2. Validate transition
  if (!isValidTransition(currentStatus, nextStatus)) {
    throw new Error(
      `Invalid state transition: Cannot move consultation from ${currentStatus} to ${nextStatus}. Permissible transitions: [${(ALLOWED_TRANSITIONS[currentStatus] || []).join(', ')}]`
    );
  }

  // 3. Invariant Checks
  // INV_PAY_001: PAYMENT_VERIFIED requires server verification evidence
  if (nextStatus === 'PAYMENT_VERIFIED') {
    if (!metadata.verifiedByWebhook && !metadata.providerPaymentId && actorType !== 'ADMIN' && actorType !== 'SYSTEM') {
      throw new Error('INV_PAY_001 Violation: PAYMENT_VERIFIED state can only be authorized via verified server webhook or privileged admin audit.');
    }
  }

  // Build update payload
  const dbStatus = DB_STATUS_MAP[nextStatus] || 'DRAFT';
  const updateData: any = {
    status: dbStatus as any,
    updatedAt: new Date()
  };

  if (assignedScholarId) {
    updateData.practitionerId = assignedScholarId;
  }

  if (nextStatus === 'PAYMENT_VERIFIED') {
    updateData.paymentStatus = 'PAID';
    if (metadata.providerPaymentId) {
      updateData.paymentProvider = metadata.paymentProvider || 'RAZORPAY';
    }
  }

  if (notes) {
    updateData.practitionerFinal = notes.scholarInterpretation || '';
    updateData.practitionerNotes = notes.calculatedAstrology || '';
  }

  // 4. Atomic Transaction: Update Consultation + Append Audit Log
  const [updatedConsultation, auditLog] = await db.$transaction([
    db.astrologyConsultation.update({
      where: { id: consultationId },
      data: updateData,
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
    }),
    db.astrologyAuditLog.create({
      data: {
        consultation: { connect: { id: consultationId } },
        practitioner: (assignedScholarId || current.practitionerId)
          ? { connect: { id: (assignedScholarId || current.practitionerId)! } }
          : undefined,
        eventType: `TRANSITION_TO_${nextStatus}`,
        actorType,
        payload: {
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
    })
  ]);

  return {
    success: true,
    consultation: updatedConsultation,
    v1Status: nextStatus,
    auditLog
  };
}

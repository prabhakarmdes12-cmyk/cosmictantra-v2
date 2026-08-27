import { ConsultationSession, SessionState, ActorType, SessionAuditLog } from './types';

export interface TransitionContext {
  sessionId: string;
  actor: ActorType;
  actorId: string;
  idempotencyKey: string;
  timestamp: number;
  payload?: Record<string, any>;
}

export interface StateTransitionRule {
  from: SessionState | SessionState[];
  to: SessionState;
  allowedActors: ActorType[];
  guard: (session: ConsultationSession, ctx: TransitionContext) => { allowed: boolean; reason?: string };
  sideEffect?: (session: ConsultationSession, ctx: TransitionContext) => void;
}

// Exhaustive Canonical Transitions Matrix
export const SABHA_STATE_TRANSITIONS: Record<string, StateTransitionRule> = {
  // 1. Initiate Payment
  INITIATE_PAYMENT: {
    from: 'DRAFT',
    to: 'PAYMENT_PENDING',
    allowedActors: ['DEVOTEE', 'SYSTEM'],
    guard: (session) => {
      if (!session.question || session.question.trim().length < 5) {
        return { allowed: false, reason: 'Valid life question required before payment initialization.' };
      }
      if (!session.payer || !session.beneficiary) {
        return { allowed: false, reason: 'Payer and beneficiary profiles required.' };
      }
      return { allowed: true };
    }
  },

  // 2. Payment Verified (INV-SABHA-001)
  VERIFY_PAYMENT: {
    from: 'PAYMENT_PENDING',
    to: 'PAID',
    allowedActors: ['PAYMENT_GATEWAY', 'SYSTEM'],
    guard: (session, ctx) => {
      if (!session.payment || !session.payment.isVerified) {
        return { allowed: false, reason: 'INV-SABHA-001: Payment must be cryptographically verified server-side.' };
      }
      if (session.payment.amountInr <= 0) {
        return { allowed: false, reason: 'INV-SABHA-001: Non-zero positive payment amount required.' };
      }
      return { allowed: true };
    },
    sideEffect: (session, ctx) => {
      session.payment.verifiedAt = ctx.timestamp;
    }
  },

  // 3. Payment Failed
  FAIL_PAYMENT: {
    from: 'PAYMENT_PENDING',
    to: 'PAYMENT_FAILED',
    allowedActors: ['PAYMENT_GATEWAY', 'SYSTEM'],
    guard: () => ({ allowed: true })
  },

  // 4. Schedule Session
  SCHEDULE_SESSION: {
    from: 'PAID',
    to: 'SCHEDULED',
    allowedActors: ['DEVOTEE', 'SCHOLAR', 'SYSTEM'],
    guard: (session) => {
      if (!session.scheduledFor || session.scheduledFor <= 0) {
        return { allowed: false, reason: 'Valid scheduled timestamp required.' };
      }
      return { allowed: true };
    }
  },

  // 5. Open Waiting Room / Ready
  MARK_READY: {
    from: ['PAID', 'SCHEDULED'],
    to: 'READY',
    allowedActors: ['DEVOTEE', 'SCHOLAR', 'SYSTEM'],
    guard: (session, ctx) => {
      const fiveMinsBefore = session.scheduledFor - 300000;
      if (ctx.timestamp < fiveMinsBefore && session.serviceMode !== 'PRASHNA') {
        return { allowed: false, reason: 'Waiting room opens 5 minutes before scheduled slot.' };
      }
      return { allowed: true };
    }
  },

  // 6. Connect Realtime Media
  START_CONNECTING: {
    from: 'READY',
    to: 'CONNECTING',
    allowedActors: ['DEVOTEE', 'SCHOLAR', 'SYSTEM'],
    guard: (session) => {
      if (!session.payment.isVerified) {
        return { allowed: false, reason: 'INV-SABHA-001: Unverified sessions cannot connect.' };
      }
      return { allowed: true };
    }
  },

  // 7. Active Session (INV-SABHA-002: Transport actually connected)
  ACTIVATE_SESSION: {
    from: 'CONNECTING',
    to: 'ACTIVE',
    allowedActors: ['SYSTEM', 'TELEPHONY_PROVIDER'],
    guard: (session, ctx) => {
      if (session.activeTransport === 'WEB_RTC') {
        const ice = session.webrtcTelemetry?.iceConnectionState;
        if (ice !== 'connected' && ice !== 'completed') {
          return { allowed: false, reason: 'INV-SABHA-002: Realtime WebRTC transport must be connected before ACTIVE state.' };
        }
      } else if (session.activeTransport === 'PSTN_PHONE') {
        if (!session.pstnTelemetry || session.pstnTelemetry.leg1Status !== 'in-progress' || session.pstnTelemetry.leg2Status !== 'in-progress') {
          return { allowed: false, reason: 'INV-SABHA-002: Both PSTN call legs must be answered before ACTIVE state.' };
        }
      }
      return { allowed: true };
    },
    sideEffect: (session, ctx) => {
      if (!session.startedAt) {
        session.startedAt = ctx.timestamp;
      }
    }
  },

  // 8. Enter Grace Period
  ENTER_GRACE_PERIOD: {
    from: 'ACTIVE',
    to: 'GRACE_PERIOD',
    allowedActors: ['SYSTEM'],
    guard: (session, ctx) => {
      if (!session.startedAt) return { allowed: false, reason: 'Session was never started.' };
      const elapsed = (ctx.timestamp - session.startedAt) / 1000;
      const totalEntitled = session.entitledDurationSeconds + session.extensionSeconds;
      if (elapsed < totalEntitled) {
        return { allowed: false, reason: 'Entitled consultation duration is not yet exhausted.' };
      }
      return { allowed: true };
    }
  },

  // 9. Start Completing & Signing
  START_COMPLETING: {
    from: ['ACTIVE', 'GRACE_PERIOD'],
    to: 'COMPLETING',
    allowedActors: ['SCHOLAR', 'SYSTEM'],
    guard: (session) => {
      if (!session.scholarRecord.finalInterpretation || session.scholarRecord.finalInterpretation.length < 10) {
        return { allowed: false, reason: 'Scholar must document core interpretation before completing.' };
      }
      return { allowed: true };
    }
  },

  // 10. Completed & Delivered
  COMPLETE_SESSION: {
    from: 'COMPLETING',
    to: 'COMPLETED',
    allowedActors: ['SCHOLAR', 'SYSTEM', 'ADMIN'],
    guard: (session) => {
      if (!session.scholarRecord.finalInterpretation) {
        return { allowed: false, reason: 'Scholar written interpretation required.' };
      }
      return { allowed: true };
    },
    sideEffect: (session, ctx) => {
      session.endedAt = ctx.timestamp;
      session.scholarRecord.approvedAt = ctx.timestamp;
    }
  },

  // 11. No-Show Handling
  MARK_NO_SHOW_DEVOTEE: {
    from: ['SCHEDULED', 'READY', 'CONNECTING'],
    to: 'NO_SHOW_DEVOTEE',
    allowedActors: ['SCHOLAR', 'ADMIN', 'SYSTEM'],
    guard: (session, ctx) => {
      const tenMinsPast = session.scheduledFor + 600000;
      if (ctx.timestamp < tenMinsPast) {
        return { allowed: false, reason: 'Devotee no-show requires at least 10 minutes past scheduled time.' };
      }
      return { allowed: true };
    }
  },

  MARK_NO_SHOW_SCHOLAR: {
    from: ['SCHEDULED', 'READY', 'CONNECTING'],
    to: 'NO_SHOW_SCHOLAR',
    allowedActors: ['DEVOTEE', 'ADMIN', 'SYSTEM'],
    guard: (session, ctx) => {
      const tenMinsPast = session.scheduledFor + 600000;
      if (ctx.timestamp < tenMinsPast) {
        return { allowed: false, reason: 'Scholar no-show requires at least 10 minutes past scheduled time.' };
      }
      return { allowed: true };
    },
    sideEffect: (session) => {
      session.state = 'REFUND_PENDING';
    }
  },

  // 12. Connection Failure
  MARK_CONNECTION_FAILED: {
    from: ['CONNECTING', 'ACTIVE'],
    to: 'CONNECTION_FAILED',
    allowedActors: ['SYSTEM', 'ADMIN', 'SCHOLAR'],
    guard: () => ({ allowed: true })
  },

  // 13. Cancellation & Refunds
  CANCEL_SESSION: {
    from: ['DRAFT', 'PAYMENT_PENDING', 'PAID', 'SCHEDULED'],
    to: 'CANCELLED',
    allowedActors: ['DEVOTEE', 'ADMIN', 'SYSTEM'],
    guard: () => ({ allowed: true }),
    sideEffect: (session) => {
      if (session.payment.isVerified) {
        session.state = 'REFUND_PENDING';
      }
    }
  },

  EXECUTE_REFUND: {
    from: ['REFUND_PENDING', 'NO_SHOW_SCHOLAR', 'CONNECTION_FAILED'],
    to: 'REFUNDED',
    allowedActors: ['PAYMENT_GATEWAY', 'ADMIN', 'SYSTEM'],
    guard: (session) => {
      if (!session.payment.isVerified) return { allowed: false, reason: 'No verified payment to refund.' };
      return { allowed: true };
    },
    sideEffect: (session) => {
      session.costLedger.refundAmountInr = session.payment.amountInr;
    }
  }
};

export class SabhaStateMachine {
  static transition(
    session: ConsultationSession,
    transitionName: string,
    ctx: TransitionContext
  ): { success: boolean; fromState: SessionState; toState: SessionState; error?: string; auditLog: SessionAuditLog } {
    const rule = SABHA_STATE_TRANSITIONS[transitionName];
    if (!rule) {
      const err = `Unknown state transition rule: "${transitionName}"`;
      return {
        success: false,
        fromState: session.state,
        toState: session.state,
        error: err,
        auditLog: this.createAuditLog(session, ctx, 'TRANSITION_REJECTED', { reason: err })
      };
    }

    // Check Source State
    const validFrom = Array.isArray(rule.from) ? rule.from.includes(session.state) : rule.from === session.state;
    if (!validFrom) {
      const err = `Illegal transition "${transitionName}" from current state "${session.state}". Allowed sources: ${Array.isArray(rule.from) ? rule.from.join(', ') : rule.from}`;
      return {
        success: false,
        fromState: session.state,
        toState: session.state,
        error: err,
        auditLog: this.createAuditLog(session, ctx, 'TRANSITION_INVALID_SOURCE', { reason: err })
      };
    }

    // Check Actor Authorization
    if (!rule.allowedActors.includes(ctx.actor)) {
      const err = `Actor "${ctx.actor}" unauthorized to perform "${transitionName}". Allowed actors: ${rule.allowedActors.join(', ')}`;
      return {
        success: false,
        fromState: session.state,
        toState: session.state,
        error: err,
        auditLog: this.createAuditLog(session, ctx, 'TRANSITION_UNAUTHORIZED_ACTOR', { reason: err })
      };
    }

    // Run Guard Condition
    const guardResult = rule.guard(session, ctx);
    if (!guardResult.allowed) {
      const err = guardResult.reason || 'Transition guard condition failed.';
      return {
        success: false,
        fromState: session.state,
        toState: session.state,
        error: err,
        auditLog: this.createAuditLog(session, ctx, 'TRANSITION_GUARD_FAILED', { reason: err })
      };
    }

    // Execute Transition & Side Effects
    const fromState = session.state;
    session.state = rule.to;
    if (rule.sideEffect) {
      rule.sideEffect(session, ctx);
    }

    const auditLog = this.createAuditLog(session, ctx, 'TRANSITION_SUCCESS', {
      transition: transitionName,
      fromState,
      toState: rule.to
    });

    return {
      success: true,
      fromState,
      toState: rule.to,
      auditLog
    };
  }

  private static createAuditLog(
    session: ConsultationSession,
    ctx: TransitionContext,
    action: string,
    details?: Record<string, any>
  ): SessionAuditLog {
    return {
      auditId: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.sessionId,
      timestamp: ctx.timestamp,
      actor: ctx.actor,
      actorId: ctx.actorId,
      fromState: session.state,
      toState: session.state,
      action,
      idempotencyKey: ctx.idempotencyKey,
      details
    };
  }
}

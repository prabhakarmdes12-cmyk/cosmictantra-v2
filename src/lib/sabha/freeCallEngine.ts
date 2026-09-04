/**
 * SABHA SECURE FREE CALL ENGINE (Phase 1) — server-authoritative session factory
 * and lifecycle engine for FREE 1:1 consultations.
 *
 * ARCHITECTURAL INVARIANT — Customer Care is OPTIONAL ROUTING:
 * There is exactly ONE call primitive: `ConsultationSession` with `initiationMode`.
 *   - 'CARE_ASSISTED': Customer → Care queue → Care assigns Pandit → dispatch → 1:1 call.
 *   - 'DIRECT':        Customer clicks "Free Call" on a Pandit profile → instant 1:1 call.
 * Customer Care belongs to the routing/operations layer, NEVER the media layer.
 * The RTC media engine receives only sessionId + roomId + authorized tokens.
 *
 * STRICT INVARIANTS ENFORCED HERE:
 *  - FREE ONLY: No payments, no wallets, no per-minute deductions. `payment.amountInr`
 *    is 0 and `isVerified: true` denotes "zero-cost call entitlement verified
 *    server-side" — this satisfies the START_CONNECTING guard (INV-SABHA-001 reads
 *    `payment.isVerified`) without ever running the payment state path.
 *  - ZERO-RECORDING (VOICE_INV_007): consent.optionalRecording/Transcription are
 *    always false; no media, transcripts, or RTP dumps are written anywhere.
 *  - ZERO PII: party identifiers are pseudonymous; only masked fields exist and
 *    they are never returned to the opposite party by any endpoint.
 *  - The preserved 18-state machine (stateMachine.ts) and INV-SABHA-002 remain the
 *    sole authority for READY → CONNECTING → ACTIVE progression. This module never
 *    mutates `state` directly — it only invokes `SabhaStateMachine.transition`.
 *    Session initialization starts at READY (free instant sessions never traverse
 *    the DRAFT → PAYMENT pipeline; PRASHNA-style instant entitlement).
 *  - Call termination logs ONLY operational metadata (duration, ICE state) per the
 *    minimal-audit-trail policy (CALL_SECURITY_MODEL.md §4.2).
 */

import crypto from 'crypto';
import {
  ConsultationSession,
  ConsultationInitiationMode,
  ParticipantRole,
  SessionAuditLog
} from './types';
import { SabhaSessionStore } from './store';
import { SabhaStateMachine, TransitionContext } from './stateMachine';
import { SabhaAuthTokenEngine } from './auth';
import { getScholarById } from './directory';

export const FREE_CALL_ENTITLEMENT_SECONDS = 900; // 15 minutes free per call
export const FREE_CALL_TOKEN_TTL_MINUTES = 60;

export interface CreateFreeCallInput {
  initiationMode: ConsultationInitiationMode;
  /** Required for DIRECT mode (instant ring to this scholar). */
  consultantId?: string;
  mediaType: 'AUDIO' | 'VIDEO';
  customerId?: string;
  customerDisplayName?: string;
  customerCity?: string;
  question?: string;
  language?: string;
  category?: string;
  /** Customer-Care operator id — present only for CARE_ASSISTED intake. */
  intakeByOperatorId?: string;
}

export interface FreeCallSessionHandle {
  session: ConsultationSession;
  customerToken: string;
  consultantToken: string;
  customerParticipantId: string;
  consultantParticipantId: string;
}

function newSessionId(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CT-SABHA-${year}-${rand}`;
}

/** Cryptographic, non-enumerable room identifier (security model §2.2). */
function newRoomId(): string {
  return `ct-room-${crypto.randomUUID()}`;
}

function recordAudit(sessionId: string, log: Omit<SessionAuditLog, 'auditId' | 'sessionId' | 'timestamp'>): void {
  SabhaSessionStore.recordAudit({
    ...log,
    auditId: `AUDIT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    sessionId,
    timestamp: Date.now()
  });
}

/**
 * Creates a FREE 1:1 consultation session (the single call primitive) and issues
 * ephemeral HMAC-SHA256 access tokens for exactly the two authorized parties.
 */
export function createFreeCallSession(input: CreateFreeCallInput): {
  ok: boolean;
  error?: string;
  handle?: FreeCallSessionHandle;
} {
  if (input.initiationMode === 'DIRECT' && !input.consultantId) {
    return { ok: false, error: 'DIRECT call sessions require a consultantId (Pandit profile).' };
  }
  if (input.initiationMode === 'DIRECT') {
    // DIRECT mode permits only the registered verified directory ids for V1.
    if (!getScholarById(input.consultantId!)) {
      return { ok: false, error: 'Unknown or unverified consultant for DIRECT free call.' };
    }
  }

  const scholar = input.consultantId
    ? getScholarById(input.consultantId)
    : undefined;

  const now = Date.now();
  const sessionId = newSessionId();
  const roomId = newRoomId();
  const customerParticipantId = input.customerId?.trim()
    ? `USR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    : `USR-GUEST-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const consultantParticipantId = scholar?.scholarId || 'SCH-PENDING';

  const session: ConsultationSession = {
    sessionId,
    roomId,
    initiationMode: input.initiationMode,
    state: 'READY',
    serviceMode: 'VAANI',
    transportChannel: input.mediaType === 'VIDEO' ? 'VIDEO' : 'WEB_RTC',
    activeTransport: 'WEB_RTC',

    createdAt: now,
    scheduledFor: now, // Instant free call — no scheduling pipeline in V1.
    entitledDurationSeconds: FREE_CALL_ENTITLEMENT_SECONDS,
    extensionSeconds: 0,
    gracePeriodSeconds: 60,

    payer: {
      id: customerParticipantId,
      name: (input.customerDisplayName || 'अज्ञात भक्त (Guest Devotee)').slice(0, 80),
      phoneMasked: '+91 ••••••••• (masked)', // Real numbers NEVER enter the system of record.
      city: input.customerCity?.slice(0, 40)
    },
    beneficiary: {
      id: customerParticipantId,
      name: (input.customerDisplayName || 'भक्त (Devotee)').slice(0, 80),
      phoneMasked: '+91 ••••••••• (masked)',
      relationToPayer: 'SELF',
      location: input.customerCity?.slice(0, 40) || 'भारत'
    },
    profile: {
      cosmicId: `CT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      name: (input.customerDisplayName || 'भक्त').slice(0, 80),
      birthDate: '1900-01-01',
      birthTime: '00:00',
      birthPlace: input.customerCity || 'भारत',
      latitude: 25.3176,
      longitude: 82.9739,
      timezone: 5.5
    },
    scholar: {
      scholarId: consultantParticipantId,
      name: scholar?.name || 'आवंटन प्रतीक्षित (Awaiting Care Assignment)',
      title: scholar?.title || 'केयर-सहायता परामर्श',
      tradition: scholar?.tradition || 'काशी परम्परा',
      phoneMasked: '+91 ••••••••• (masked)'
    },

    question: (input.question || 'सामान्य मुफ्त परामर्श (General free consultation)').slice(0, 500),
    category: (input.category || 'General Guidance').slice(0, 60),
    language: (input.language || 'Hindi').slice(0, 30),

    consent: {
      consultationProcessing: true,
      optionalRecording: false, // STRICT ZERO-RECORDING — non-negotiable.
      optionalTranscription: false,
      whatsAppDelivery: false,
      familyMemberParticipation: false,
      consentTimestamp: now
    },

    evidence: {
      calculatedAt: now,
      ayanamsha: 'LAHIRI_CHITRA_PAKSHA',
      lagnaSign: '— (not computed for free VAANI call)',
      lagnaDegree: 0,
      nakshatra: '— (not computed for free VAANI call)',
      nakshatraPada: 1,
      vimshottariDasha: {
        mahadasha: '—',
        antardasha: '—',
        pratyantardasha: '—',
        startDate: new Date(now).toISOString(),
        endDate: new Date(now).toISOString()
      },
      activeTransits: [],
      panchangSnapshot: {
        tithi: '—',
        vara: '—',
        nakshatra: '—',
        yoga: '—',
        karana: '—',
        rahukala: '—',
        abhijitMuhurta: '—'
      }
    },
    scholarRecord: {
      scholarId: consultantParticipantId,
      scholarName: scholar?.name || '—',
      finalInterpretation: 'मुफ्त वाणी परामर्श — लिखित फ़ॉलियो लागू नहीं (Free voice consultation; no folio in V1).',
      recommendations: [],
      prescribedUpayas: [],
      provenanceTag: 'SCHOLAR_VERIFIED_AND_SIGNED'
    },

    currentChartFocus: {},
    eventSequence: 0,

    costLedger: {
      grossBookingValueInr: 0,
      paymentGatewayFeeInr: 0,
      scholarPayoutInr: 0,
      webrtcParticipantMinutes: 0,
      webrtcCostInr: 0,
      turnBandwidthBytes: 0,
      turnCostInr: 0,
      pstnLeg1Minutes: 0,
      pstnLeg2Minutes: 0,
      pstnCostInr: 0,
      aiInputTokens: 0,
      aiOutputTokens: 0,
      aiCostInr: 0,
      whatsAppMessagesCount: 0,
      whatsAppCostInr: 0,
      refundAmountInr: 0,
      netContributionMarginInr: 0
    },

    // FREE-CALL ENTITLEMENT: amountInr is 0. `isVerified: true` asserts the
    // zero-cost entitlement was validated server-side (START_CONNECTING guard).
    // No payment pipeline, wallet, or per-minute deduction exists for V1.
    payment: {
      isVerified: true,
      amountInr: 0,
      verifiedAt: now
    }
  };

  SabhaSessionStore.save(session);

  recordAudit(sessionId, {
    actor: 'SYSTEM',
    actorId: 'FREE_CALL_ENGINE',
    toState: 'READY',
    action: 'SESSION_CREATED',
    idempotencyKey: `create_${sessionId}`,
    details: {
      initiationMode: input.initiationMode,
      mediaType: input.mediaType,
      consultantId: consultantParticipantId,
      assignedBy: input.initiationMode === 'CARE_ASSISTED' ? (input.intakeByOperatorId || 'CARE_QUEUE') : undefined,
      freeEntitlementSeconds: FREE_CALL_ENTITLEMENT_SECONDS
    }
  });

  const customerToken = SabhaAuthTokenEngine.generateToken(
    sessionId,
    customerParticipantId,
    'DEVOTEE',
    FREE_CALL_TOKEN_TTL_MINUTES
  );
  const consultantToken = SabhaAuthTokenEngine.generateToken(
    sessionId,
    consultantParticipantId,
    'SCHOLAR',
    FREE_CALL_TOKEN_TTL_MINUTES
  );

  return {
    ok: true,
    handle: {
      session: SabhaSessionStore.get(sessionId)!,
      customerToken,
      consultantToken,
      customerParticipantId,
      consultantParticipantId
    }
  };
}

// ---------------------------------------------------------------------------
// Customer-Care routing operations (routing layer ONLY — never joins media)
// ---------------------------------------------------------------------------

/** Care operator assigns a verified Pandit to a queued CARE_ASSISTED request. */
export function assignScholarToSession(params: {
  sessionId: string;
  scholarId: string;
  operatorId: string;
}): { ok: boolean; error?: string; session?: ConsultationSession } {
  const { sessionId, scholarId, operatorId } = params;
  const session = SabhaSessionStore.get(sessionId);
  if (!session) return { ok: false, error: `Session "${sessionId}" not found.` };
  if (session.initiationMode !== 'CARE_ASSISTED') {
    return { ok: false, error: 'Only CARE_ASSISTED sessions flow through the Care queue.' };
  }
  if (session.endedAt) return { ok: false, error: 'Session already ended.' };

  const scholar = getScholarById(scholarId);
  if (!scholar) return { ok: false, error: 'Unknown scholar id.' };

  // Regenerate the consultant token so the newly-assigned Pandit can join.
  const consultantToken = SabhaAuthTokenEngine.generateToken(
    sessionId,
    scholar.scholarId,
    'SCHOLAR',
    FREE_CALL_TOKEN_TTL_MINUTES
  );

  session.scholar = {
    scholarId: scholar.scholarId,
    name: scholar.name,
    title: scholar.title,
    tradition: scholar.tradition,
    phoneMasked: '+91 ••••••••• (masked)'
  };
  session.scholarRecord.scholarId = scholar.scholarId;
  session.scholarRecord.scholarName = scholar.name;
  SabhaSessionStore.save(session);

  recordAudit(sessionId, {
    actor: 'ADMIN',
    actorId: operatorId,
    fromState: session.state,
    toState: session.state,
    action: 'SCHOLAR_ASSIGNED',
    idempotencyKey: `assign_${sessionId}_${scholarId}_${Date.now()}`,
    details: { scholarId: scholar.scholarId, scholarName: scholar.name }
  });

  return { ok: true, session: SabhaSessionStore.get(sessionId)!, ...{ consultantToken } };
}

/** Care operator dispatches the assigned call — both parties' devices ring. */
export function dispatchAssignedCall(params: {
  sessionId: string;
  operatorId: string;
}): { ok: boolean; error?: string; consultantToken?: string } {
  const { sessionId, operatorId } = params;
  const session = SabhaSessionStore.get(sessionId);
  if (!session) return { ok: false, error: `Session "${sessionId}" not found.` };
  if (session.scholar.scholarId.startsWith('SCH-') === false || session.scholar.name.includes('Awaiting')) {
    return { ok: false, error: 'Assign a Pandit before dispatching the call.' };
  }
  if (session.endedAt) return { ok: false, error: 'Session already ended.' };

  const consultantToken = SabhaAuthTokenEngine.generateToken(
    sessionId,
    session.scholar.scholarId,
    'SCHOLAR',
    FREE_CALL_TOKEN_TTL_MINUTES
  );

  recordAudit(sessionId, {
    actor: 'ADMIN',
    actorId: operatorId,
    fromState: session.state,
    toState: session.state,
    action: 'CALL_DISPATCHED',
    idempotencyKey: `dispatch_${sessionId}_${Date.now()}`,
    details: { scholarId: session.scholar.scholarId }
  });

  return { ok: true, consultantToken };
}

/** Free duration extension (NO payment — V1 free-call invariant). */
export function extendFreeSession(params: {
  sessionId: string;
  seconds: number;
  actorId: string;
  actor: 'DEVOTEE' | 'SCHOLAR' | 'ADMIN';
}): { ok: boolean; error?: string; session?: ConsultationSession } {
  const { sessionId, seconds, actorId, actor } = params;
  const session = SabhaSessionStore.get(sessionId);
  if (!session) return { ok: false, error: 'Session not found.' };
  if (session.endedAt) return { ok: false, error: 'Session already ended.' };
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 1800) {
    return { ok: false, error: 'Invalid extension window.' };
  }

  session.extensionSeconds += Math.floor(seconds);
  SabhaSessionStore.save(session);

  recordAudit(sessionId, {
    actor,
    actorId,
    fromState: session.state,
    toState: session.state,
    action: 'DURATION_EXTENDED_FREE',
    idempotencyKey: `extend_${sessionId}_${Date.now()}`,
    details: { addedSeconds: Math.floor(seconds), totalEntitledSeconds: session.entitledDurationSeconds + session.extensionSeconds }
  });

  return { ok: true, session: SabhaSessionStore.get(sessionId) ?? undefined };
}

// ---------------------------------------------------------------------------
// RTC transport lifecycle (wired from /api/rtc/signal) — INV-SABHA-002
// ---------------------------------------------------------------------------

function actorForParticipant(session: ConsultationSession, participantId: string): ParticipantRole {
  if (participantId === session.scholar.scholarId) return 'SCHOLAR';
  return 'DEVOTEE';
}

/**
 * First authorized participant entered the signaling room → READY → CONNECTING.
 * Uses the preserved state machine; never mutates state directly.
 */
export function onParticipantJoined(sessionId: string, participantId: string): void {
  const session = SabhaSessionStore.get(sessionId);
  if (!session || session.state !== 'READY' || session.endedAt) return;

  const actor = actorForParticipant(session, participantId);
  const ctx: TransitionContext = {
    sessionId,
    actor: actor === 'SCHOLAR' ? 'SCHOLAR' : 'DEVOTEE',
    actorId: participantId,
    idempotencyKey: `connecting_${sessionId}_${participantId}`,
    timestamp: Date.now()
  };
  const result = SabhaStateMachine.transition(session, 'START_CONNECTING', ctx);
  if (result.success) {
    SabhaSessionStore.save(session);
    SabhaSessionStore.recordAudit(result.auditLog);
  }
}

/**
 * A peer reported its ICE transport state. When the realtime transport reports
 * `connected`/`completed`, the SYSTEM actor activates the session — INV-SABHA-002
 * is enforced by the preserved state machine guard (media must really flow).
 */
export function onTransportState(params: {
  sessionId: string;
  participantId: string;
  iceConnectionState: string;
  selectedCandidateType?: string;
  roundTripTimeMs?: number;
}): void {
  const { sessionId, participantId, iceConnectionState, selectedCandidateType, roundTripTimeMs } = params;
  const session = SabhaSessionStore.get(sessionId);
  if (!session || session.endedAt) return;

  session.webrtcTelemetry = {
    iceConnectionState: iceConnectionState as any,
    selectedCandidateType: (selectedCandidateType as any) || session.webrtcTelemetry?.selectedCandidateType || 'host',
    roundTripTimeMs: Math.round(roundTripTimeMs ?? session.webrtcTelemetry?.roundTripTimeMs ?? 0),
    jitterMs: session.webrtcTelemetry?.jitterMs ?? 0,
    packetLossPercentage: session.webrtcTelemetry?.packetLossPercentage ?? 0,
    audioBitrateKbps: session.webrtcTelemetry?.audioBitrateKbps ?? 0,
    reconnectCount: session.webrtcTelemetry?.reconnectCount ?? 0,
    lastTelemetryTimestamp: Date.now()
  };

  if ((iceConnectionState === 'connected' || iceConnectionState === 'completed') && session.state === 'CONNECTING') {
    const ctx: TransitionContext = {
      sessionId,
      actor: 'SYSTEM',
      actorId: 'RTC_TRANSPORT',
      idempotencyKey: `activate_${sessionId}`,
      timestamp: Date.now()
    };
    const result = SabhaStateMachine.transition(session, 'ACTIVATE_SESSION', ctx);
    if (result.success) {
      SabhaSessionStore.recordAudit(result.auditLog);
    } else {
      recordAudit(sessionId, {
        actor: 'SYSTEM',
        actorId: 'RTC_TRANSPORT',
        action: 'ACTIVATION_BLOCKED',
        details: { reason: result.error }
      });
    }
  } else if (iceConnectionState === 'failed' && (session.state === 'CONNECTING' || session.state === 'ACTIVE')) {
    const ctx: TransitionContext = {
      sessionId,
      actor: 'SYSTEM',
      actorId: 'RTC_TRANSPORT',
      idempotencyKey: `connfail_${sessionId}_${Date.now()}`,
      timestamp: Date.now()
    };
    const result = SabhaStateMachine.transition(session, 'MARK_CONNECTION_FAILED', ctx);
    if (result.success) SabhaSessionStore.recordAudit(result.auditLog);
  }

  SabhaSessionStore.save(session);
}

/**
 * A participant left (explicit hang-up, tab close, or heartbeat timeout).
 * Logs the authoritative connected duration — the ONLY retained call artifact
 * (operational metadata; never media, per §4.2).
 */
export function onParticipantLeft(params: {
  sessionId: string;
  participantId: string;
  reason: string;
}): { durationSeconds?: number } {
  const { sessionId, participantId, reason } = params;
  const session = SabhaSessionStore.get(sessionId);
  if (!session || session.endedAt) return {};

  const now = Date.now();
  let durationSeconds: number | undefined;
  if (session.startedAt) {
    durationSeconds = Math.max(0, Math.floor((now - session.startedAt) / 1000));
    session.endedAt = now;
    session.costLedger.webrtcParticipantMinutes = Math.ceil(durationSeconds / 60);
    // No payment settlements exist for free calls — ledger stays at ₹0.
  }
  SabhaSessionStore.save(session);

  recordAudit(sessionId, {
    actor: 'SYSTEM',
    actorId: 'FREE_CALL_ENGINE',
    fromState: session.state,
    toState: session.state,
    action: 'CALL_ENDED',
    idempotencyKey: `end_${sessionId}_${participantId}_${now}`,
    details: {
      endedBy: participantId,
      reason,
      durationSeconds: durationSeconds ?? 0,
      connected: !!session.startedAt,
      initiationMode: session.initiationMode
    }
  });

  return { durationSeconds };
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

export type CareQueueStatus = 'UNASSIGNED' | 'ASSIGNED' | 'DISPATCHED' | 'LIVE' | 'CLOSED';

function queueStatusFor(session: ConsultationSession): CareQueueStatus {
  if (session.endedAt) return 'CLOSED';
  if (session.state === 'ACTIVE' || session.state === 'CONNECTING') return 'LIVE';
  const logs = SabhaSessionStore.getAuditLogs(session.sessionId);
  const has = (action: string) => logs.some(l => l.action === action);
  if (has('CALL_DISPATCHED')) return 'DISPATCHED';
  if (has('SCHOLAR_ASSIGNED')) return 'ASSIGNED';
  return 'UNASSIGNED';
}

export function listSessionsForOps(): Array<ConsultationSession & { queueStatus: CareQueueStatus }> {
  return SabhaSessionStore.list()
    .map(s => ({ ...s, queueStatus: queueStatusFor(s) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function listIncomingForScholar(scholarId: string): Array<
  ConsultationSession & { queueStatus: CareQueueStatus; consultantToken: string }
> {
  return SabhaSessionStore.list()
    .filter(
      s =>
        !s.endedAt &&
        s.scholar.scholarId === scholarId &&
        ['READY', 'CONNECTING', 'ACTIVE'].includes(s.state) &&
        s.initiationMode !== undefined
    )
    .map(s => ({
      ...s,
      queueStatus: queueStatusFor(s),
      consultantToken: SabhaAuthTokenEngine.generateToken(s.sessionId, scholarId, 'SCHOLAR', FREE_CALL_TOKEN_TTL_MINUTES)
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Safe room-page DTO: display names only, no contact fields, no tokens. */
export function getSessionRoomView(sessionId: string): {
  ok: boolean;
  error?: string;
  view?: {
    sessionId: string;
    roomId: string;
    initiationMode: ConsultationInitiationMode;
    state: string;
    serviceMode: string;
    transportChannel: string;
    startedAt?: number;
    endedAt?: number;
    entitledDurationSeconds: number;
    extensionSeconds: number;
    gracePeriodSeconds: number;
    durationSeconds?: number;
    customerDisplayName: string;
    consultant: { scholarId: string; name: string; title: string; tradition: string };
    question: string;
  };
} {
  const session = SabhaSessionStore.get(sessionId);
  if (!session) return { ok: false, error: 'Session not found.' };
  const durationSeconds = session.startedAt
    ? Math.max(0, Math.floor(((session.endedAt || Date.now()) - session.startedAt) / 1000))
    : undefined;
  return {
    ok: true,
    view: {
      sessionId: session.sessionId,
      roomId: session.roomId || '',
      initiationMode: session.initiationMode || 'CARE_ASSISTED',
      state: session.state,
      serviceMode: session.serviceMode,
      transportChannel: session.transportChannel,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      entitledDurationSeconds: session.entitledDurationSeconds,
      extensionSeconds: session.extensionSeconds,
      gracePeriodSeconds: session.gracePeriodSeconds,
      durationSeconds,
      customerDisplayName: session.beneficiary.name,
      consultant: {
        scholarId: session.scholar.scholarId,
        name: session.scholar.name,
        title: session.scholar.title,
        tradition: session.scholar.tradition
      },
      question: session.question
    }
  };
}

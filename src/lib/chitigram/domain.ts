/**
 * Chitigram v0.2 — Canonical Domain Models
 * Organisation/domain-scoped, stable IDs, server timestamps.
 * Every object uses server-authoritative timestamps; client clocks never trusted.
 */

export const ORGANIZATION_DEFAULT = 'cosmic-tantra';
export const DOMAIN_DEFAULT = 'cosmic-tantra';

// ---------------------------------------------------------------------------
// Conversation Lifecycle — server-authoritative state machine
// ---------------------------------------------------------------------------

export type ChitigramConversationState =
  | 'CREATED'
  | 'WAITING'
  | 'ASSIGNED'
  | 'RINGING'
  | 'ACCEPTED'
  | 'LIVE'
  | 'ENDED'
  | 'FOLLOW_UP'
  | 'CLOSED'
  | 'DECLINED'
  | 'NO_ANSWER'
  | 'CANCELLED'
  | 'FAILED'
  | 'REASSIGNED';

export const CONVERSATION_STATE_ORDER: Record<ChitigramConversationState, number> = {
  CREATED: 0,
  WAITING: 1,
  ASSIGNED: 2,
  RINGING: 3,
  ACCEPTED: 4,
  LIVE: 5,
  ENDED: 6,
  FOLLOW_UP: 7,
  CLOSED: 8,
  DECLINED: 90,
  NO_ANSWER: 91,
  CANCELLED: 92,
  FAILED: 93,
  REASSIGNED: 94,
};

// Valid transitions — validated server-side, audit appended on each
export const VALID_TRANSITIONS: Record<ChitigramConversationState, ChitigramConversationState[]> = {
  CREATED: ['WAITING', 'CANCELLED', 'FAILED'],
  WAITING: ['ASSIGNED', 'CANCELLED', 'FAILED', 'CLOSED'],
  ASSIGNED: ['RINGING', 'REASSIGNED', 'CANCELLED', 'FAILED', 'WAITING'],
  RINGING: ['ACCEPTED', 'DECLINED', 'NO_ANSWER', 'FAILED', 'CANCELLED'],
  ACCEPTED: ['LIVE', 'FAILED', 'CANCELLED'],
  LIVE: ['ENDED', 'FAILED', 'CANCELLED'],
  ENDED: ['FOLLOW_UP', 'CLOSED', 'REASSIGNED'],
  FOLLOW_UP: ['CLOSED', 'REASSIGNED', 'WAITING'],
  CLOSED: [], // terminal — only audit, no state change (reopen creates new conversation)
  DECLINED: ['REASSIGNED', 'WAITING', 'CLOSED', 'FAILED'],
  NO_ANSWER: ['REASSIGNED', 'WAITING', 'CLOSED', 'FAILED'],
  CANCELLED: [], // terminal
  FAILED: ['REASSIGNED', 'WAITING', 'CLOSED'],
  REASSIGNED: ['ASSIGNED', 'WAITING', 'RINGING'],
};

export function canTransition(
  from: ChitigramConversationState,
  to: ChitigramConversationState
): boolean {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

// Inbox filter mapping — spec: ALL / WAITING / ACTIVE / FOLLOW-UP / CLOSED
export type InboxFilter = 'ALL' | 'WAITING' | 'ACTIVE' | 'FOLLOW_UP' | 'CLOSED';
export function matchesInboxFilter(
  state: ChitigramConversationState,
  filter: InboxFilter
): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'WAITING') return state === 'WAITING' || state === 'CREATED';
  if (filter === 'ACTIVE')
    return ['ASSIGNED', 'RINGING', 'ACCEPTED', 'LIVE', 'ENDED'].includes(state);
  if (filter === 'FOLLOW_UP') return state === 'FOLLOW_UP';
  if (filter === 'CLOSED') return ['CLOSED', 'CANCELLED', 'FAILED', 'DECLINED', 'NO_ANSWER'].includes(state);
  return false;
}

// ---------------------------------------------------------------------------
// Message Protocol — extensible, backward compatible
// ---------------------------------------------------------------------------

export type ChitigramMessageType =
  | 'TEXT'
  | 'SYSTEM'
  | 'CONTEXT'
  | 'ACTION'
  | 'PAYMENT'
  | 'CALL'
  | 'VOICE'
  | 'FILE';

export type ChitigramMessageSubType =
  // CosmicTantra namespace
  | 'ASTROLOGY.KUNDLI_INSIGHT'
  | 'ASTROLOGY.CONSULTATION'
  | 'ASTROLOGY.DAKSHINA'
  | 'ASTROLOGY.MUHURAT'
  // Legacy compat
  | 'KUNDLI_INSIGHT'
  | 'DAKSHINA_PAYMENT'
  | 'CALL_EVENT'
  | string; // extensible

export type ChitigramMessageStatus = 'SENT' | 'DELIVERED' | 'READ';
export type ChitigramVisibility = 'VISIBLE' | 'INTERNAL';

// Legacy cardType -> new protocol mapping
export function mapLegacyCardToProtocol(cardType?: string): {
  type: ChitigramMessageType;
  subType: ChitigramMessageSubType;
} | null {
  if (!cardType) return null;
  switch (cardType) {
    case 'KUNDLI_INSIGHT':
      return { type: 'CONTEXT', subType: 'ASTROLOGY.KUNDLI_INSIGHT' };
    case 'DAKSHINA_PAYMENT':
      return { type: 'PAYMENT', subType: 'ASTROLOGY.DAKSHINA' };
    case 'CALL_EVENT':
      return { type: 'CALL', subType: 'CALL_EVENT' };
    default:
      return null;
  }
}

export function mapProtocolToLegacyCard(
  type: ChitigramMessageType,
  subType?: string
): string | undefined {
  if (type === 'CONTEXT' && subType === 'ASTROLOGY.KUNDLI_INSIGHT') return 'KUNDLI_INSIGHT';
  if (type === 'PAYMENT' && subType === 'ASTROLOGY.DAKSHINA') return 'DAKSHINA_PAYMENT';
  if (type === 'CALL' && subType === 'CALL_EVENT') return 'CALL_EVENT';
  if (type === 'CONTEXT' && subType === 'KUNDLI_INSIGHT') return 'KUNDLI_INSIGHT';
  if (type === 'PAYMENT' && subType === 'DAKSHINA_PAYMENT') return 'DAKSHINA_PAYMENT';
  if (subType && ['KUNDLI_INSIGHT', 'DAKSHINA_PAYMENT', 'CALL_EVENT'].includes(subType)) return subType;
  return undefined;
}

// ---------------------------------------------------------------------------
// Presence — connection + practitioner availability, server-backed
// ---------------------------------------------------------------------------

export type ChitigramConnectionState = 'ONLINE' | 'AWAY' | 'OFFLINE';
export type ChitigramAvailability = 'AVAILABLE' | 'BUSY' | 'DND' | 'OFF_DUTY';

export interface ChitigramPresence {
  id: string;
  organizationId: string;
  domain: string;
  userId: string;
  userRole: string; // devotee | pandit | operator | system
  displayName?: string;
  connectionState: ChitigramConnectionState;
  availability: ChitigramAvailability;
  lastSeenAt: number; // server timestamp
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Core domain objects — stable IDs, server timestamps, org/domain scope
// ---------------------------------------------------------------------------

export interface ChitigramConversation {
  id: string; // stable conversationId
  organizationId: string;
  domain: string;
  sessionId?: string; // backward compat: consultation sessionId alias
  seekerName?: string;
  seekerPhoneMasked?: string;
  seekerUserId?: string;
  language: string;
  category: string;
  originalQuestion?: string;
  kundliRef?: string;
  kundliSummary?: Record<string, any> | null;
  paymentStatus: string; // PENDING | VERIFIED | PAID | FAILED
  paymentAmountInr: number;
  paymentTransactionId?: string | null;
  paymentReferenceId?: string | null;
  paymentVerifiedAt?: number | null;
  paymentVerifiedBy?: string | null;
  state: ChitigramConversationState;
  assignedPractitionerId?: string | null;
  assignedPractitionerName?: string | null;
  assignedBy?: string | null;
  assignedAt?: number | null;
  assignmentAcceptance?: string | null; // PENDING | ACCEPTED | DECLINED
  waitingSince?: number | null;
  lastActivityAt: number;
  closedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface ChitigramParticipant {
  id: string;
  organizationId: string;
  domain: string;
  conversationId: string;
  userId: string;
  role: string; // devotee | pandit | operator | system
  displayName?: string;
  capabilities: ChitigramCapability[];
  joinedAt: number;
  lastReadMessageId?: string | null;
  lastSeenAt: number;
  isActive: boolean;
}

export interface ChitigramMessage {
  id: string; // stable messageId — server-assigned
  organizationId: string;
  domain: string;
  conversationId: string;
  clientMessageId?: string | null; // for idempotent POST
  sequence: number; // per-conversation strictly increasing
  senderId?: string | null;
  senderRole: string; // devotee | pandit | operator | system
  senderName?: string | null;
  type: ChitigramMessageType;
  subType?: string | null;
  text?: string | null;
  // Legacy compat — kept for v0.1
  cardType?: string | null;
  cardPayload?: Record<string, any> | null;
  payload?: Record<string, any> | null; // generic extensible
  visibility: ChitigramVisibility;
  status: ChitigramMessageStatus;
  createdAt: number; // server timestamp
  updatedAt: number;
  deliveredAt?: number | null;
  readAt?: number | null;
}

export interface ChitigramCall {
  id: string;
  organizationId: string;
  domain: string;
  conversationId: string;
  roomId?: string | null;
  callerId: string;
  callerRole: string;
  recipientIds: string[];
  createdAt: number;
  ringingAt?: number | null;
  acceptedAt?: number | null;
  startedAt?: number | null;
  endedAt?: number | null;
  durationSeconds?: number | null;
  outcome?: string | null; // COMPLETED | NO_ANSWER | DECLINED | FAILED | CANCELLED | MISSED
  failureReason?: string | null;
  isWarmTransfer?: boolean;
  transferredBy?: string | null;
  transferredAt?: number | null;
  holdState?: string | null; // NONE | HOLD | RESUMED
}

export interface ChitigramAssignment {
  id: string;
  organizationId: string;
  domain: string;
  conversationId: string;
  practitionerId: string;
  practitionerName?: string | null;
  assignedBy: string;
  assignedAt: number;
  acceptanceState: string; // PENDING | ACCEPTED | DECLINED
  acceptedAt?: number | null;
  declinedReason?: string | null;
  isActive: boolean;
}

export interface ChitigramAuditEvent {
  id: string;
  organizationId: string;
  domain: string;
  conversationId: string;
  actorId?: string | null;
  actorRole?: string | null;
  eventType: string; // CONVERSATION_CREATED | PAYMENT_VERIFIED | ASSIGNED | ACCEPTED | CALL_STARTED | CALL_ENDED | NOTE_ADDED | FOLLOW_UP | CLOSED | REASSIGNED | TRANSFER | HOLD etc
  fromState?: string | null;
  toState?: string | null;
  details?: Record<string, any> | null;
  createdAt: number;
}

export interface ChitigramNotification {
  id: string;
  organizationId: string;
  domain: string;
  userId: string;
  conversationId: string;
  type: string; // MESSAGE | CALL | ASSIGNMENT | TRANSFER | FOLLOW_UP
  title: string;
  body?: string | null; // minimal safe info only
  link?: string | null;
  read: boolean;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Capabilities — server-side enforcement, query params NEVER grant perms
// ---------------------------------------------------------------------------

export type ChitigramCapability =
  | 'READ'
  | 'SEND'
  | 'VIEW_KUNDLI'
  | 'VIEW_PAYMENT'
  | 'ACCEPT_CALL'
  | 'ASSIGN'
  | 'TRANSFER'
  | 'INTERNAL_NOTE';

export const ROLE_CAPABILITIES: Record<string, ChitigramCapability[]> = {
  devotee: ['READ', 'SEND', 'VIEW_KUNDLI', 'VIEW_PAYMENT'],
  pandit: ['READ', 'SEND', 'VIEW_KUNDLI', 'VIEW_PAYMENT', 'ACCEPT_CALL', 'INTERNAL_NOTE'],
  operator: ['READ', 'SEND', 'VIEW_KUNDLI', 'VIEW_PAYMENT', 'ASSIGN', 'TRANSFER', 'INTERNAL_NOTE', 'ACCEPT_CALL'],
  system: ['READ', 'SEND', 'VIEW_KUNDLI', 'VIEW_PAYMENT', 'ASSIGN', 'TRANSFER', 'INTERNAL_NOTE', 'ACCEPT_CALL'],
  admin: ['READ', 'SEND', 'VIEW_KUNDLI', 'VIEW_PAYMENT', 'ASSIGN', 'TRANSFER', 'INTERNAL_NOTE', 'ACCEPT_CALL'],
};

export function hasCapability(role: string, cap: ChitigramCapability): boolean {
  const caps = ROLE_CAPABILITIES[role] || ROLE_CAPABILITIES['devotee'];
  return caps.includes(cap);
}

export function canEnforceCapabilities(
  actorRole: string,
  required: ChitigramCapability[]
): boolean {
  return required.every(c => hasCapability(actorRole, c));
}

// ---------------------------------------------------------------------------
// Helpers — stable IDs, server timestamps
// ---------------------------------------------------------------------------

export function generateId(prefix: string): string {
  // stable ID: prefix-timestamp-random
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function serverNow(): number {
  return Date.now(); // server-authoritative — never trust client clock
}

// ---------------------------------------------------------------------------
// Payment truth — UPI deep-link NEVER marks PAID
// ---------------------------------------------------------------------------

export const PAYMENT_PENDING = 'PENDING';
export const PAYMENT_VERIFIED = 'VERIFIED';
export const PAYMENT_PAID = 'PAID';
export const PAYMENT_FAILED = 'FAILED';

export function isPaymentVerified(status?: string | null): boolean {
  return status === PAYMENT_VERIFIED || status === PAYMENT_PAID;
}

// ---------------------------------------------------------------------------
// Voice note metadata — persisted via Chitigram message protocol
// ---------------------------------------------------------------------------

export interface ChitigramVoiceMetadata {
  durationSeconds: number;
  mimeType: string; // e.g. audio/webm;codecs=opus
  sizeBytes: number;
  url?: string; // persisted media ref (not actual media bytes in DB)
  waveform?: number[]; // optional preview
}

// For file messages
export interface ChitigramFileMetadata {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
}

// ---------------------------------------------------------------------------
// Inbox row — denormalized view for operator inbox
// ---------------------------------------------------------------------------

export interface ChitigramInboxRow {
  conversation: ChitigramConversation;
  latestMessage?: ChitigramMessage | null;
  unreadCount: number;
  participantCount: number;
  assignedPractitioner?: { id: string; name: string; availability?: string } | null;
  timeWaitingSeconds?: number | null;
  presence?: ChitigramPresence | null;
}

// ---------------------------------------------------------------------------
// Instrumentation — pilot metrics
// ---------------------------------------------------------------------------

export interface ChitigramMetrics {
  conversationsPerDay: number;
  avgFirstResponseSeconds: number | null;
  avgQueueWaitSeconds: number | null;
  callAnswerRate: number | null; // 0-1
  avgCallDurationSeconds: number | null;
  noAnswerRate: number | null; // 0-1
  reassignmentCount: number;
  unreadBacklog: number;
  consultationCompletionRate: number | null; // 0-1
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  generatedAt: number;
}

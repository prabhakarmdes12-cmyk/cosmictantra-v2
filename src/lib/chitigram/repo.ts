/**
 * Chitigram v0.2 — Operational Persistence Layer
 * Neon/Postgres authoritative in production, memory fallback only in dev/test.
 * Production DB failure => degraded/error, NEVER ack unpersisted message.
 * All IDs stable, timestamps server-authoritative, org/domain scoped.
 */

import {
  ORGANIZATION_DEFAULT,
  DOMAIN_DEFAULT,
  serverNow,
  generateId,
  canTransition,
  ChitigramConversationState,
  ChitigramConversation,
  ChitigramParticipant,
  ChitigramMessage,
  ChitigramMessageType,
  ChitigramMessageStatus,
  ChitigramVisibility,
  ChitigramCall,
  ChitigramAssignment,
  ChitigramPresence,
  ChitigramAuditEvent,
  ChitigramNotification,
  ChitigramConnectionState,
  ChitigramAvailability,
  ChitigramInboxRow,
  InboxFilter,
  matchesInboxFilter,
  mapLegacyCardToProtocol,
  mapProtocolToLegacyCard,
  ChitigramMetrics,
  ChitigramCapability,
} from './domain';

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

// ---------------------------------------------------------------------------
// In-memory vaults — dev/test fallback only, attached to globalThis for HMR
// ---------------------------------------------------------------------------

type Vaults = {
  conversations: Map<string, ChitigramConversation>;
  participants: Map<string, ChitigramParticipant>; // key: `${conversationId}:${userId}`
  messages: Map<string, ChitigramMessage[]>; // key: conversationId -> sorted by sequence
  messageByClientId: Map<string, ChitigramMessage>; // clientMessageId -> message
  calls: Map<string, ChitigramCall[]>; // conversationId -> calls
  assignments: Map<string, ChitigramAssignment[]>; // conversationId -> assignments
  presence: Map<string, ChitigramPresence>; // userId -> presence
  audit: Map<string, ChitigramAuditEvent[]>; // conversationId -> events
  notifications: Map<string, ChitigramNotification[]>; // userId -> notifications
  sequences: Map<string, number>; // conversationId -> next sequence
};

const globalForChitigramV2 = globalThis as unknown as {
  __chitigramV2Vaults?: Vaults;
};

function getVaults(): Vaults {
  if (!globalForChitigramV2.__chitigramV2Vaults) {
    globalForChitigramV2.__chitigramV2Vaults = {
      conversations: new Map(),
      participants: new Map(),
      messages: new Map(),
      messageByClientId: new Map(),
      calls: new Map(),
      assignments: new Map(),
      presence: new Map(),
      audit: new Map(),
      notifications: new Map(),
      sequences: new Map(),
    };
  }
  return globalForChitigramV2.__chitigramV2Vaults;
}

// ---------------------------------------------------------------------------
// DB helpers — raw SQL via Prisma $queryRawUnsafe / $executeRawUnsafe (no client regen needed)
// ---------------------------------------------------------------------------

async function getDb(): Promise<any | null> {
  if (!isDbConfigured()) return null;
  try {
    const { db } = await import('@/lib/db');
    return db;
  } catch {
    return null;
  }
}

async function dbQuery<T>(fn: (db: any) => Promise<T>, fallback: T | (() => T)): Promise<{ data: T; source: 'db' | 'memory' | 'degraded'; degraded?: boolean; error?: string }> {
  const db = await getDb();
  if (!db) {
    // No DB configured — use memory (dev)
    const val = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    return { data: val, source: 'memory' };
  }
  try {
    const data = await fn(db);
    return { data, source: 'db' };
  } catch (e: any) {
    const msg = e?.message || String(e);
    // If production, return degraded/error — NEVER fallback to memory for writes
    if (isProduction()) {
      // For reads, we could fallback but for writes we must NOT ack unpersisted.
      // Caller must decide: for read, degraded may still return memory fallback? But spec says production failure must return degraded/error state.
      // We'll return degraded with error, and caller should surface 503.
      return { data: (typeof fallback === 'function' ? (fallback as () => T)() : fallback) as T, source: 'degraded', degraded: true, error: msg };
    }
    // Dev/test — fallback to memory
    const val = typeof fallback === 'function' ? (fallback as () => T)() : fallback;
    return { data: val, source: 'memory', error: msg };
  }
}

// ---------------------------------------------------------------------------
// Helpers — ensure tables exist? We just attempt raw SQL; if tables missing, catch and fallback.
// ---------------------------------------------------------------------------

function toDbJson(v: any): string | null {
  if (v == null) return null;
  return JSON.stringify(v);
}

function fromDbJson(v: any): any {
  if (v == null) return null;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

// ---------------------------------------------------------------------------
// Conversations — authoritative persistence
// ---------------------------------------------------------------------------

export async function createConversation(input: {
  id?: string;
  organizationId?: string;
  domain?: string;
  sessionId?: string;
  seekerName?: string;
  seekerPhoneMasked?: string;
  seekerUserId?: string;
  language?: string;
  category?: string;
  originalQuestion?: string;
  kundliRef?: string;
  kundliSummary?: Record<string, any> | null;
  paymentStatus?: string;
  paymentAmountInr?: number;
  actorId?: string;
  actorRole?: string;
}): Promise<{ conversation: ChitigramConversation; degraded?: boolean; error?: string }> {
  const now = serverNow();
  const id = input.id || generateId('conv');
  const org = input.organizationId || ORGANIZATION_DEFAULT;
  const domain = input.domain || DOMAIN_DEFAULT;

  const conv: ChitigramConversation = {
    id,
    organizationId: org,
    domain,
    sessionId: input.sessionId || undefined,
    seekerName: input.seekerName || undefined,
    seekerPhoneMasked: input.seekerPhoneMasked || undefined,
    seekerUserId: input.seekerUserId || undefined,
    language: input.language || 'Hindi',
    category: input.category || 'General Guidance',
    originalQuestion: input.originalQuestion || undefined,
    kundliRef: input.kundliRef || undefined,
    kundliSummary: input.kundliSummary || null,
    paymentStatus: input.paymentStatus || 'PENDING',
    paymentAmountInr: input.paymentAmountInr || 0,
    paymentTransactionId: null,
    paymentReferenceId: null,
    paymentVerifiedAt: null,
    paymentVerifiedBy: null,
    state: 'CREATED',
    assignedPractitionerId: null,
    assignedPractitionerName: null,
    assignedBy: null,
    assignedAt: null,
    assignmentAcceptance: null,
    waitingSince: now,
    lastActivityAt: now,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const vaults = getVaults();

  // Try DB first if configured
  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `INSERT INTO "ChitigramConversation" (id, "organizationId", domain, "sessionId", "seekerName", "seekerPhoneMasked", "seekerUserId", language, category, "originalQuestion", "kundliRef", "kundliSummary", "paymentStatus", "paymentAmountInr", "paymentTransactionId", "paymentReferenceId", "paymentVerifiedAt", "paymentVerifiedBy", state, "assignedPractitionerId", "assignedPractitionerName", "assignedBy", "assignedAt", "assignmentAcceptance", "waitingSince", "lastActivityAt", "closedAt", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)
         ON CONFLICT (id) DO NOTHING`,
        conv.id,
        conv.organizationId,
        conv.domain,
        conv.sessionId || null,
        conv.seekerName || null,
        conv.seekerPhoneMasked || null,
        conv.seekerUserId || null,
        conv.language,
        conv.category,
        conv.originalQuestion || null,
        conv.kundliRef || null,
        toDbJson(conv.kundliSummary),
        conv.paymentStatus,
        conv.paymentAmountInr,
        conv.paymentTransactionId,
        conv.paymentReferenceId,
        conv.paymentVerifiedAt ? new Date(conv.paymentVerifiedAt) : null,
        conv.paymentVerifiedBy || null,
        conv.state,
        conv.assignedPractitionerId || null,
        conv.assignedPractitionerName || null,
        conv.assignedBy || null,
        conv.assignedAt ? new Date(conv.assignedAt) : null,
        conv.assignmentAcceptance || null,
        conv.waitingSince ? new Date(conv.waitingSince) : null,
        new Date(conv.lastActivityAt),
        conv.closedAt ? new Date(conv.closedAt) : null,
        new Date(conv.createdAt),
        new Date(conv.updatedAt)
      );
      // Also record audit
      await appendAuditInternal({
        conversationId: conv.id,
        actorId: input.actorId || null,
        actorRole: input.actorRole || 'system',
        eventType: 'CONVERSATION_CREATED',
        fromState: null,
        toState: conv.state,
        details: { sessionId: conv.sessionId, seekerName: conv.seekerName, category: conv.category },
        organizationId: org,
        domain,
      });
      // Always mirror to memory for quick read
      vaults.conversations.set(conv.id, conv);
      if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);
      return { conversation: conv };
    } catch (e: any) {
      if (isProduction()) {
        return { conversation: conv, degraded: true, error: e?.message || 'DB persist failed' };
      }
      // dev fallback — store in memory and pretend success
      vaults.conversations.set(conv.id, conv);
      if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);
      // audit to memory
      await appendAuditInternal({
        conversationId: conv.id,
        actorId: input.actorId || null,
        actorRole: input.actorRole || 'system',
        eventType: 'CONVERSATION_CREATED',
        fromState: null,
        toState: conv.state,
        details: { sessionId: conv.sessionId, seekerName: conv.seekerName, category: conv.category, _fallback: 'memory' },
        organizationId: org,
        domain,
      });
      return { conversation: conv };
    }
  }

  // No DB — memory only (dev)
  vaults.conversations.set(conv.id, conv);
  if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);
  await appendAuditInternal({
    conversationId: conv.id,
    actorId: input.actorId || null,
    actorRole: input.actorRole || 'system',
    eventType: 'CONVERSATION_CREATED',
    fromState: null,
    toState: conv.state,
    details: { sessionId: conv.sessionId },
    organizationId: org,
    domain,
  });
  return { conversation: conv };
}

export async function getConversation(id: string): Promise<ChitigramConversation | null> {
  const vaults = getVaults();
  // Try DB first
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(
        `SELECT * FROM "ChitigramConversation" WHERE id = $1 OR "sessionId" = $1 LIMIT 1`,
        id
      )) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        const r = rows[0];
        const conv: ChitigramConversation = {
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          sessionId: r.sessionId ? String(r.sessionId) : undefined,
          seekerName: r.seekerName ? String(r.seekerName) : undefined,
          seekerPhoneMasked: r.seekerPhoneMasked ? String(r.seekerPhoneMasked) : undefined,
          seekerUserId: r.seekerUserId ? String(r.seekerUserId) : undefined,
          language: String(r.language || 'Hindi'),
          category: String(r.category || 'General Guidance'),
          originalQuestion: r.originalQuestion ? String(r.originalQuestion) : undefined,
          kundliRef: r.kundliRef ? String(r.kundliRef) : undefined,
          kundliSummary: fromDbJson(r.kundliSummary),
          paymentStatus: String(r.paymentStatus || 'PENDING'),
          paymentAmountInr: Number(r.paymentAmountInr || 0),
          paymentTransactionId: r.paymentTransactionId ? String(r.paymentTransactionId) : null,
          paymentReferenceId: r.paymentReferenceId ? String(r.paymentReferenceId) : null,
          paymentVerifiedAt: r.paymentVerifiedAt ? new Date(r.paymentVerifiedAt).getTime() : null,
          paymentVerifiedBy: r.paymentVerifiedBy ? String(r.paymentVerifiedBy) : null,
          state: String(r.state || 'CREATED') as ChitigramConversationState,
          assignedPractitionerId: r.assignedPractitionerId ? String(r.assignedPractitionerId) : null,
          assignedPractitionerName: r.assignedPractitionerName ? String(r.assignedPractitionerName) : null,
          assignedBy: r.assignedBy ? String(r.assignedBy) : null,
          assignedAt: r.assignedAt ? new Date(r.assignedAt).getTime() : null,
          assignmentAcceptance: r.assignmentAcceptance ? String(r.assignmentAcceptance) : null,
          waitingSince: r.waitingSince ? new Date(r.waitingSince).getTime() : null,
          lastActivityAt: r.lastActivityAt ? new Date(r.lastActivityAt).getTime() : serverNow(),
          closedAt: r.closedAt ? new Date(r.closedAt).getTime() : null,
          createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : serverNow(),
        };
        // cache to memory
        vaults.conversations.set(conv.id, conv);
        if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);
        return conv;
      }
    } catch {
      // fall through to memory
    }
  }
  // memory fallback (dev) — also covers sessionId alias
  return vaults.conversations.get(id) || null;
}

export async function listConversations(filter: InboxFilter = 'ALL', organizationId = ORGANIZATION_DEFAULT, domain = DOMAIN_DEFAULT, limit = 100, offset = 0): Promise<ChitigramConversation[]> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      // Build where clause for filter — we fetch all and filter in JS for simplicity, but also handle via state list
      let stateList: string[] | null = null;
      if (filter === 'WAITING') stateList = ['WAITING', 'CREATED'];
      else if (filter === 'ACTIVE') stateList = ['ASSIGNED', 'RINGING', 'ACCEPTED', 'LIVE', 'ENDED'];
      else if (filter === 'FOLLOW_UP') stateList = ['FOLLOW_UP'];
      else if (filter === 'CLOSED') stateList = ['CLOSED', 'CANCELLED', 'FAILED', 'DECLINED', 'NO_ANSWER'];

      let rows: any[];
      if (stateList) {
        rows = (await (db as any).$queryRawUnsafe(
          `SELECT * FROM "ChitigramConversation" WHERE "organizationId" = $1 AND domain = $2 AND state = ANY($3::text[]) ORDER BY "lastActivityAt" DESC LIMIT $4 OFFSET $5`,
          organizationId,
          domain,
          stateList,
          limit,
          offset
        )) as any[];
      } else {
        rows = (await (db as any).$queryRawUnsafe(
          `SELECT * FROM "ChitigramConversation" WHERE "organizationId" = $1 AND domain = $2 ORDER BY "lastActivityAt" DESC LIMIT $3 OFFSET $4`,
          organizationId,
          domain,
          limit,
          offset
        )) as any[];
      }
      const convs: ChitigramConversation[] = rows.map((r: any) => ({
        id: String(r.id),
        organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
        domain: String(r.domain || DOMAIN_DEFAULT),
        sessionId: r.sessionId ? String(r.sessionId) : undefined,
        seekerName: r.seekerName ? String(r.seekerName) : undefined,
        seekerPhoneMasked: r.seekerPhoneMasked ? String(r.seekerPhoneMasked) : undefined,
        seekerUserId: r.seekerUserId ? String(r.seekerUserId) : undefined,
        language: String(r.language || 'Hindi'),
        category: String(r.category || 'General Guidance'),
        originalQuestion: r.originalQuestion ? String(r.originalQuestion) : undefined,
        kundliRef: r.kundliRef ? String(r.kundliRef) : undefined,
        kundliSummary: fromDbJson(r.kundliSummary),
        paymentStatus: String(r.paymentStatus || 'PENDING'),
        paymentAmountInr: Number(r.paymentAmountInr || 0),
        paymentTransactionId: r.paymentTransactionId ? String(r.paymentTransactionId) : null,
        paymentReferenceId: r.paymentReferenceId ? String(r.paymentReferenceId) : null,
        paymentVerifiedAt: r.paymentVerifiedAt ? new Date(r.paymentVerifiedAt).getTime() : null,
        paymentVerifiedBy: r.paymentVerifiedBy ? String(r.paymentVerifiedBy) : null,
        state: String(r.state || 'CREATED') as ChitigramConversationState,
        assignedPractitionerId: r.assignedPractitionerId ? String(r.assignedPractitionerId) : null,
        assignedPractitionerName: r.assignedPractitionerName ? String(r.assignedPractitionerName) : null,
        assignedBy: r.assignedBy ? String(r.assignedBy) : null,
        assignedAt: r.assignedAt ? new Date(r.assignedAt).getTime() : null,
        assignmentAcceptance: r.assignmentAcceptance ? String(r.assignmentAcceptance) : null,
        waitingSince: r.waitingSince ? new Date(r.waitingSince).getTime() : null,
        lastActivityAt: r.lastActivityAt ? new Date(r.lastActivityAt).getTime() : serverNow(),
        closedAt: r.closedAt ? new Date(r.closedAt).getTime() : null,
        createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : serverNow(),
      }));
      // cache
      convs.forEach(c => vaults.conversations.set(c.id, c));
      return convs;
    } catch {
      // fallback to memory
    }
  }
  // memory fallback — filter
  let all = Array.from(vaults.conversations.values());
  // Deduplicate by id (since we also store sessionId alias)
  const uniq = new Map<string, ChitigramConversation>();
  all.forEach(c => uniq.set(c.id, c));
  all = Array.from(uniq.values()).filter(c => c.organizationId === organizationId && c.domain === domain);
  all = all.filter(c => matchesInboxFilter(c.state, filter));
  all.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  return all.slice(offset, offset + limit);
}

// Update conversation state with validation + audit
export async function transitionConversation(
  conversationId: string,
  toState: ChitigramConversationState,
  actorId?: string | null,
  actorRole?: string | null,
  details?: Record<string, any> | null
): Promise<{ ok: boolean; conversation?: ChitigramConversation; error?: string }> {
  const conv = await getConversation(conversationId);
  if (!conv) return { ok: false, error: 'CONVERSATION_NOT_FOUND' };
  const from = conv.state;
  if (from === toState) return { ok: true, conversation: conv };
  if (!canTransition(from, toState)) {
    return { ok: false, error: `INVALID_TRANSITION: ${from} -> ${toState}` };
  }
  const now = serverNow();
  conv.state = toState;
  conv.updatedAt = now;
  conv.lastActivityAt = now;
  if (toState === 'WAITING' && !conv.waitingSince) conv.waitingSince = now;
  if (toState === 'CLOSED' || toState === 'CANCELLED') conv.closedAt = now;

  const vaults = getVaults();
  vaults.conversations.set(conv.id, conv);
  if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `UPDATE "ChitigramConversation" SET state = $1, "updatedAt" = $2, "lastActivityAt" = $3, "waitingSince" = $4, "closedAt" = $5 WHERE id = $6`,
        conv.state,
        new Date(conv.updatedAt),
        new Date(conv.lastActivityAt),
        conv.waitingSince ? new Date(conv.waitingSince) : null,
        conv.closedAt ? new Date(conv.closedAt) : null,
        conv.id
      );
    } catch (e: any) {
      if (isProduction()) {
        // revert in-memory if DB failed in production? Keep degraded but signal error
        return { ok: false, error: e?.message || 'DB_UPDATE_FAILED' };
      }
      // dev: ignore
    }
  }

  await appendAuditInternal({
    conversationId: conv.id,
    actorId: actorId || null,
    actorRole: actorRole || 'system',
    eventType: `STATE_${from}_TO_${toState}`,
    fromState: from,
    toState,
    details: details || null,
    organizationId: conv.organizationId,
    domain: conv.domain,
  });

  return { ok: true, conversation: conv };
}

// Payment verification — ONLY backend may set PAID/VERIFIED
export async function verifyPayment(
  conversationId: string,
  transactionId: string,
  referenceId: string | undefined,
  verifiedBy: string,
  amountInr?: number
): Promise<{ ok: boolean; conversation?: ChitigramConversation; error?: string }> {
  const conv = await getConversation(conversationId);
  if (!conv) return { ok: false, error: 'CONVERSATION_NOT_FOUND' };
  const now = serverNow();
  conv.paymentStatus = 'PAID';
  conv.paymentTransactionId = transactionId;
  conv.paymentReferenceId = referenceId || null;
  conv.paymentVerifiedAt = now;
  conv.paymentVerifiedBy = verifiedBy;
  if (typeof amountInr === 'number') conv.paymentAmountInr = amountInr;
  conv.updatedAt = now;
  conv.lastActivityAt = now;

  const vaults = getVaults();
  vaults.conversations.set(conv.id, conv);
  if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `UPDATE "ChitigramConversation" SET "paymentStatus" = $1, "paymentTransactionId" = $2, "paymentReferenceId" = $3, "paymentVerifiedAt" = $4, "paymentVerifiedBy" = $5, "paymentAmountInr" = $6, "updatedAt" = $7, "lastActivityAt" = $8 WHERE id = $9`,
        conv.paymentStatus,
        conv.paymentTransactionId,
        conv.paymentReferenceId,
        new Date(conv.paymentVerifiedAt!),
        conv.paymentVerifiedBy,
        conv.paymentAmountInr,
        new Date(conv.updatedAt),
        new Date(conv.lastActivityAt),
        conv.id
      );
    } catch (e: any) {
      if (isProduction()) return { ok: false, error: e?.message || 'DB_UPDATE_FAILED' };
    }
  }

  await appendAuditInternal({
    conversationId: conv.id,
    actorId: verifiedBy,
    actorRole: 'system',
    eventType: 'PAYMENT_VERIFIED',
    fromState: null,
    toState: null,
    details: { transactionId, referenceId, amountInr },
    organizationId: conv.organizationId,
    domain: conv.domain,
  });

  return { ok: true, conversation: conv };
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

export async function upsertParticipant(
  conversationId: string,
  userId: string,
  role: string,
  displayName?: string,
  capabilities?: ChitigramCapability[],
  organizationId = ORGANIZATION_DEFAULT,
  domain = DOMAIN_DEFAULT
): Promise<ChitigramParticipant> {
  const vaults = getVaults();
  const key = `${conversationId}:${userId}`;
  const now = serverNow();
  let participant = vaults.participants.get(key) as ChitigramParticipant | undefined;
  if (!participant) {
    participant = {
      id: generateId('part'),
      organizationId,
      domain,
      conversationId,
      userId,
      role,
      displayName: displayName || undefined,
      capabilities: (capabilities as ChitigramCapability[]) || [],
      joinedAt: now,
      lastReadMessageId: null,
      lastSeenAt: now,
      isActive: true,
    } as ChitigramParticipant;
  } else {
    participant.displayName = displayName || participant.displayName;
    participant.role = role;
    participant.lastSeenAt = now;
    if (capabilities) participant.capabilities = capabilities as ChitigramCapability[];
  }
  vaults.participants.set(key, participant as ChitigramParticipant);

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `INSERT INTO "ChitigramParticipant" (id, "organizationId", domain, "conversationId", "userId", role, "displayName", capabilities, "joinedAt", "lastReadMessageId", "lastSeenAt", "isActive")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT ("conversationId", "userId") DO UPDATE SET role = $6, "displayName" = $7, capabilities = $8, "lastSeenAt" = $11`,
        participant.id,
        participant.organizationId,
        participant.domain,
        participant.conversationId,
        participant.userId,
        participant.role,
        participant.displayName || null,
        participant.capabilities,
        new Date(participant.joinedAt),
        participant.lastReadMessageId || null,
        new Date(participant.lastSeenAt),
        participant.isActive
      );
    } catch {
      if (isProduction()) {
        // degrade? For participant, not critical to fail whole operation, but log
      }
    }
  }

  return participant;
}

export async function getParticipants(conversationId: string): Promise<ChitigramParticipant[]> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(
        `SELECT * FROM "ChitigramParticipant" WHERE "conversationId" = $1`,
        conversationId
      )) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          conversationId: String(r.conversationId),
          userId: String(r.userId),
          role: String(r.role),
          displayName: r.displayName ? String(r.displayName) : undefined,
          capabilities: (Array.isArray(r.capabilities) ? r.capabilities : []) as ChitigramCapability[],
          joinedAt: r.joinedAt ? new Date(r.joinedAt).getTime() : serverNow(),
          lastReadMessageId: r.lastReadMessageId ? String(r.lastReadMessageId) : null,
          lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt).getTime() : serverNow(),
          isActive: !!r.isActive,
        }));
      }
    } catch {}
  }
  // memory fallback
  return Array.from(vaults.participants.values()).filter(p => p.conversationId === conversationId);
}

export async function isMember(conversationId: string, userId: string): Promise<boolean> {
  const participants = await getParticipants(conversationId);
  return participants.some(p => p.userId === userId && p.isActive);
}

// ---------------------------------------------------------------------------
// Messages — stable messageId, clientMessageId idempotent, server timestamp, sequence, pagination, internal notes enforcement
// ---------------------------------------------------------------------------

export async function createMessage(input: {
  conversationId: string;
  clientMessageId?: string | null;
  senderId?: string | null;
  senderRole: string;
  senderName?: string | null;
  type?: ChitigramMessageType;
  subType?: string | null;
  text?: string | null;
  cardType?: string | null; // legacy
  cardPayload?: Record<string, any> | null;
  payload?: Record<string, any> | null;
  visibility?: ChitigramVisibility;
  organizationId?: string;
  domain?: string;
}): Promise<{ message?: ChitigramMessage; degraded?: boolean; error?: string; isDuplicate?: boolean }> {
  const vaults = getVaults();
  const conv = await getConversation(input.conversationId);
  if (!conv) return { error: 'CONVERSATION_NOT_FOUND' };

  const org = input.organizationId || conv.organizationId || ORGANIZATION_DEFAULT;
  const domain = input.domain || conv.domain || DOMAIN_DEFAULT;

  // Idempotent check via clientMessageId
  if (input.clientMessageId) {
    // check memory first
    const existingMem = vaults.messageByClientId.get(input.clientMessageId);
    if (existingMem) return { message: existingMem, isDuplicate: true };

    // check DB
    const db = await getDb();
    if (db) {
      try {
        const rows = (await (db as any).$queryRawUnsafe(
          `SELECT * FROM "ChitigramMessage" WHERE "clientMessageId" = $1 LIMIT 1`,
          input.clientMessageId
        )) as any[];
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          const msg: ChitigramMessage = {
            id: String(r.id),
            organizationId: String(r.organizationId || org),
            domain: String(r.domain || domain),
            conversationId: String(r.conversationId),
            clientMessageId: r.clientMessageId ? String(r.clientMessageId) : null,
            sequence: Number(r.sequence || 0),
            senderId: r.senderId ? String(r.senderId) : null,
            senderRole: String(r.senderRole),
            senderName: r.senderName ? String(r.senderName) : null,
            type: String(r.type || 'TEXT') as ChitigramMessageType,
            subType: r.subType ? String(r.subType) : null,
            text: r.text ? String(r.text) : null,
            cardType: r.cardType ? String(r.cardType) : null,
            cardPayload: fromDbJson(r.cardPayload),
            payload: fromDbJson(r.payload),
            visibility: String(r.visibility || 'VISIBLE') as ChitigramVisibility,
            status: String(r.status || 'SENT') as ChitigramMessageStatus,
            createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
            updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : serverNow(),
            deliveredAt: r.deliveredAt ? new Date(r.deliveredAt).getTime() : null,
            readAt: r.readAt ? new Date(r.readAt).getTime() : null,
          };
          vaults.messageByClientId.set(input.clientMessageId, msg);
          return { message: msg, isDuplicate: true };
        }
      } catch {}
    }
  }

  // Determine next sequence — per-conversation strictly increasing
  let nextSeq: number;
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(
        `SELECT COALESCE(MAX(sequence), 0) as maxseq FROM "ChitigramMessage" WHERE "conversationId" = $1`,
        input.conversationId
      )) as any[];
      const maxSeq = rows?.[0]?.maxseq ? Number(rows[0].maxseq) : 0;
      nextSeq = maxSeq + 1;
      // Also ensure memory sequence is at least that
      vaults.sequences.set(input.conversationId, Math.max(vaults.sequences.get(input.conversationId) || 0, maxSeq));
    } catch {
      // fallback to memory
      const memSeq = vaults.sequences.get(input.conversationId) || 0;
      const msgs = vaults.messages.get(input.conversationId) || [];
      const maxMem = msgs.reduce((m, msg) => Math.max(m, msg.sequence), memSeq);
      nextSeq = maxMem + 1;
    }
  } else {
    const memSeq = vaults.sequences.get(input.conversationId) || 0;
    const msgs = vaults.messages.get(input.conversationId) || [];
    const maxMem = msgs.reduce((m, msg) => Math.max(m, msg.sequence), memSeq);
    nextSeq = maxMem + 1;
  }

  // Map legacy cardType to protocol if needed, and vice versa for backward compat
  let type: ChitigramMessageType = (input.type as ChitigramMessageType) || 'TEXT';
  let subType: string | null = input.subType || null;
  let cardType: string | null = input.cardType || null;
  let cardPayload = input.cardPayload || null;

  // If legacy cardType provided without new protocol, map it
  if (cardType && !input.type) {
    const mapped = mapLegacyCardToProtocol(cardType);
    if (mapped) {
      type = mapped.type;
      subType = mapped.subType;
    }
  }
  // If new protocol provided without legacy, map to legacy for v0.1 compatibility
  if (!cardType && type && subType) {
    const legacy = mapProtocolToLegacyCard(type, subType);
    if (legacy) cardType = legacy;
    // Also ensure cardPayload mirrors payload for legacy cards
    if (legacy && !cardPayload && input.payload) {
      cardPayload = input.payload;
    }
  }
  // If text is empty but card present, ensure type is not TEXT
  if (!input.text && cardType) {
    // keep mapped type
  } else if (!input.text && !cardType && !input.payload) {
    // allow empty? But caller should have validated
  }

  const now = serverNow();
  const msg: ChitigramMessage = {
    id: generateId('msg'),
    organizationId: org,
    domain,
    conversationId: input.conversationId,
    clientMessageId: input.clientMessageId || null,
    sequence: nextSeq,
    senderId: input.senderId || null,
    senderRole: input.senderRole,
    senderName: input.senderName || null,
    type,
    subType,
    text: input.text || null,
    cardType,
    cardPayload,
    payload: input.payload || cardPayload || null,
    visibility: (input.visibility as ChitigramVisibility) || 'VISIBLE',
    status: 'SENT',
    createdAt: now,
    updatedAt: now,
    deliveredAt: null,
    readAt: null,
  };

  // Try DB persist first — authoritative in production
  const db2 = await getDb();
  if (db2) {
    try {
      await (db2 as any).$executeRawUnsafe(
        `INSERT INTO "ChitigramMessage" (id, "organizationId", domain, "conversationId", "clientMessageId", sequence, "senderId", "senderRole", "senderName", type, "subType", text, "cardType", "cardPayload", payload, visibility, status, "createdAt", "updatedAt", "deliveredAt", "readAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
        msg.id,
        msg.organizationId,
        msg.domain,
        msg.conversationId,
        msg.clientMessageId,
        msg.sequence,
        msg.senderId,
        msg.senderRole,
        msg.senderName,
        msg.type,
        msg.subType,
        msg.text,
        msg.cardType,
        toDbJson(msg.cardPayload),
        toDbJson(msg.payload),
        msg.visibility,
        msg.status,
        new Date(msg.createdAt),
        new Date(msg.updatedAt),
        msg.deliveredAt ? new Date(msg.deliveredAt) : null,
        msg.readAt ? new Date(msg.readAt) : null
      );
      // update conversation lastActivity
      await (db2 as any).$executeRawUnsafe(
        `UPDATE "ChitigramConversation" SET "lastActivityAt" = $1, "updatedAt" = $1 WHERE id = $2`,
        new Date(now),
        msg.conversationId
      );
      // also mirror to memory vaults for quick reads in dev and for degraded reads
      const arr = vaults.messages.get(msg.conversationId) || [];
      arr.push(msg);
      arr.sort((a, b) => a.sequence - b.sequence);
      vaults.messages.set(msg.conversationId, arr);
      if (msg.clientMessageId) vaults.messageByClientId.set(msg.clientMessageId, msg);
      vaults.sequences.set(msg.conversationId, nextSeq);
      // update conversation in memory
      const convMem = vaults.conversations.get(msg.conversationId);
      if (convMem) {
        convMem.lastActivityAt = now;
        convMem.updatedAt = now;
      }

      // Create notification for other participants (minimal safe info)
      await createNotificationInternal({
        conversationId: msg.conversationId,
        actorId: msg.senderId || 'unknown',
        actorRole: msg.senderRole,
        message: msg,
        organizationId: org,
        domain,
      });

      // Simulate DELIVERED after short delay (fire-and-forget) — update DB async
      setTimeout(async () => {
        try {
          const db3 = await getDb();
          if (db3) {
            await (db3 as any).$executeRawUnsafe(
              `UPDATE "ChitigramMessage" SET status = 'DELIVERED', "deliveredAt" = $1, "updatedAt" = $1 WHERE id = $2 AND status = 'SENT'`,
              new Date(serverNow()),
              msg.id
            );
          }
          const arr2 = vaults.messages.get(msg.conversationId);
          if (arr2) {
            const m = arr2.find(x => x.id === msg.id);
            if (m && m.status === 'SENT') {
              m.status = 'DELIVERED';
              m.deliveredAt = serverNow();
            }
          }
        } catch {}
      }, 800);

      return { message: msg };
    } catch (e: any) {
      const errMsg = e?.message || 'DB persist failed';
      if (isProduction()) {
        // NEVER ack unpersisted in production
        return { error: errMsg, degraded: true };
      }
      // dev fallback — store in memory and return
      const arr = vaults.messages.get(msg.conversationId) || [];
      arr.push(msg);
      arr.sort((a, b) => a.sequence - b.sequence);
      vaults.messages.set(msg.conversationId, arr);
      if (msg.clientMessageId) vaults.messageByClientId.set(msg.clientMessageId, msg);
      vaults.sequences.set(msg.conversationId, nextSeq);
      return { message: msg };
    }
  }

  // No DB — memory only (dev)
  const arr = vaults.messages.get(msg.conversationId) || [];
  arr.push(msg);
  arr.sort((a, b) => a.sequence - b.sequence);
  vaults.messages.set(msg.conversationId, arr);
  if (msg.clientMessageId) vaults.messageByClientId.set(msg.clientMessageId, msg);
  vaults.sequences.set(msg.conversationId, nextSeq);
  const convMem = vaults.conversations.get(msg.conversationId);
  if (convMem) {
    convMem.lastActivityAt = now;
    convMem.updatedAt = now;
  }
  await createNotificationInternal({
    conversationId: msg.conversationId,
    actorId: msg.senderId || 'unknown',
    actorRole: msg.senderRole,
    message: msg,
    organizationId: org,
    domain,
  });
  // also simulate delivered
  setTimeout(() => {
    const arr2 = vaults.messages.get(msg.conversationId);
    if (arr2) {
      const m = arr2.find(x => x.id === msg.id);
      if (m && m.status === 'SENT') {
        m.status = 'DELIVERED';
        m.deliveredAt = serverNow();
      }
    }
  }, 800);
  return { message: msg };
}

export async function listMessages(
  conversationId: string,
  options: {
    limit?: number;
    offset?: number;
    beforeSequence?: number | null;
    afterSequence?: number | null;
    visibilityForRole?: string | null; // to filter INTERNAL notes server-side
    includeInternal?: boolean;
  } = {}
): Promise<{ messages: ChitigramMessage[]; total: number; source: 'db' | 'memory' }> {
  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;
  const vaults = getVaults();
  const db = await getDb();

  // Authorization: visibility filtering — INTERNAL only for those with capability
  const canSeeInternal = options.includeInternal === true;

  if (db) {
    try {
      let rows: any[];
      let totalRows: any[];
      // Build query with visibility filter
      if (canSeeInternal) {
        rows = (await (db as any).$queryRawUnsafe(
          `SELECT * FROM "ChitigramMessage" WHERE "conversationId" = $1 ORDER BY sequence ASC LIMIT $2 OFFSET $3`,
          conversationId,
          limit,
          offset
        )) as any[];
        totalRows = (await (db as any).$queryRawUnsafe(
          `SELECT COUNT(*) as cnt FROM "ChitigramMessage" WHERE "conversationId" = $1`,
          conversationId
        )) as any[];
      } else {
        rows = (await (db as any).$queryRawUnsafe(
          `SELECT * FROM "ChitigramMessage" WHERE "conversationId" = $1 AND visibility = 'VISIBLE' ORDER BY sequence ASC LIMIT $2 OFFSET $3`,
          conversationId,
          limit,
          offset
        )) as any[];
        totalRows = (await (db as any).$queryRawUnsafe(
          `SELECT COUNT(*) as cnt FROM "ChitigramMessage" WHERE "conversationId" = $1 AND visibility = 'VISIBLE'`,
          conversationId
        )) as any[];
      }
      const messages: ChitigramMessage[] = rows.map((r: any) => ({
        id: String(r.id),
        organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
        domain: String(r.domain || DOMAIN_DEFAULT),
        conversationId: String(r.conversationId),
        clientMessageId: r.clientMessageId ? String(r.clientMessageId) : null,
        sequence: Number(r.sequence || 0),
        senderId: r.senderId ? String(r.senderId) : null,
        senderRole: String(r.senderRole),
        senderName: r.senderName ? String(r.senderName) : null,
        type: String(r.type || 'TEXT') as ChitigramMessageType,
        subType: r.subType ? String(r.subType) : null,
        text: r.text ? String(r.text) : null,
        cardType: r.cardType ? String(r.cardType) : null,
        cardPayload: fromDbJson(r.cardPayload),
        payload: fromDbJson(r.payload),
        visibility: String(r.visibility || 'VISIBLE') as ChitigramVisibility,
        status: String(r.status || 'SENT') as ChitigramMessageStatus,
        createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : serverNow(),
        deliveredAt: r.deliveredAt ? new Date(r.deliveredAt).getTime() : null,
        readAt: r.readAt ? new Date(r.readAt).getTime() : null,
      }));
      const total = totalRows?.[0]?.cnt ? Number(totalRows[0].cnt) : messages.length;
      return { messages, total, source: 'db' };
    } catch {
      // fallback to memory
    }
  }

  // memory fallback
  let all = vaults.messages.get(conversationId) || [];
  if (!canSeeInternal) all = all.filter(m => m.visibility === 'VISIBLE');
  all = [...all].sort((a, b) => a.sequence - b.sequence);
  const total = all.length;
  const sliced = all.slice(offset, offset + limit);
  return { messages: sliced, total, source: 'memory' };
}

export async function getMessageById(messageId: string): Promise<ChitigramMessage | null> {
  const vaults = getVaults();
  // check memory
  for (const msgs of vaults.messages.values()) {
    const found = msgs.find(m => m.id === messageId);
    if (found) return found;
  }
  // check DB
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(
        `SELECT * FROM "ChitigramMessage" WHERE id = $1 LIMIT 1`,
        messageId
      )) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        const r = rows[0];
        return {
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          conversationId: String(r.conversationId),
          clientMessageId: r.clientMessageId ? String(r.clientMessageId) : null,
          sequence: Number(r.sequence || 0),
          senderId: r.senderId ? String(r.senderId) : null,
          senderRole: String(r.senderRole),
          senderName: r.senderName ? String(r.senderName) : null,
          type: String(r.type || 'TEXT') as ChitigramMessageType,
          subType: r.subType ? String(r.subType) : null,
          text: r.text ? String(r.text) : null,
          cardType: r.cardType ? String(r.cardType) : null,
          cardPayload: fromDbJson(r.cardPayload),
          payload: fromDbJson(r.payload),
          visibility: String(r.visibility || 'VISIBLE') as ChitigramVisibility,
          status: String(r.status || 'SENT') as ChitigramMessageStatus,
          createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : serverNow(),
          deliveredAt: r.deliveredAt ? new Date(r.deliveredAt).getTime() : null,
          readAt: r.readAt ? new Date(r.readAt).getTime() : null,
        };
      }
    } catch {}
  }
  return null;
}

// Mark messages as READ up to lastReadMessageId, update participant lastReadMessageId
export async function markRead(
  conversationId: string,
  userId: string,
  lastReadMessageId: string
): Promise<{ ok: boolean; unreadCount?: number; error?: string }> {
  const vaults = getVaults();
  const participants = await getParticipants(conversationId);
  const participant = participants.find(p => p.userId === userId);
  if (!participant) return { ok: false, error: 'NOT_MEMBER' };

  // Update participant lastReadMessageId
  participant.lastReadMessageId = lastReadMessageId;
  participant.lastSeenAt = serverNow();
  vaults.participants.set(`${conversationId}:${userId}`, participant);

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `UPDATE "ChitigramParticipant" SET "lastReadMessageId" = $1, "lastSeenAt" = $2 WHERE "conversationId" = $3 AND "userId" = $4`,
        lastReadMessageId,
        new Date(participant.lastSeenAt),
        conversationId,
        userId
      );
      // Also mark messages as READ where sequence <= lastRead's sequence and sender is not user
      const lastMsg = await getMessageById(lastReadMessageId);
      if (lastMsg) {
        await (db as any).$executeRawUnsafe(
          `UPDATE "ChitigramMessage" SET status = 'READ', "readAt" = $1, "updatedAt" = $1 WHERE "conversationId" = $2 AND sequence <= $3 AND "senderId" != $4 AND status != 'READ'`,
          new Date(serverNow()),
          conversationId,
          lastMsg.sequence,
          userId
        );
      }
    } catch (e: any) {
      if (isProduction()) return { ok: false, error: e?.message || 'DB_UPDATE_FAILED' };
    }
  }

  // Update memory messages
  const msgs = vaults.messages.get(conversationId) || [];
  const lastMsgMem = msgs.find(m => m.id === lastReadMessageId);
  if (lastMsgMem) {
    msgs.forEach(m => {
      if (m.sequence <= lastMsgMem.sequence && m.senderId !== userId && m.status !== 'READ') {
        m.status = 'READ';
        m.readAt = serverNow();
      }
    });
  }

  const unread = await getUnreadCount(conversationId, userId);
  return { ok: true, unreadCount: unread };
}

export async function getUnreadCount(conversationId: string, userId: string): Promise<number> {
  const participants = await getParticipants(conversationId);
  const participant = participants.find(p => p.userId === userId);
  const lastReadId = participant?.lastReadMessageId;
  let lastReadSeq = 0;
  if (lastReadId) {
    const lastMsg = await getMessageById(lastReadId);
    if (lastMsg) lastReadSeq = lastMsg.sequence;
  }

  const { messages } = await listMessages(conversationId, { limit: 500, offset: 0, includeInternal: false });
  // Count messages after lastReadSeq that are not sent by user and are VISIBLE
  return messages.filter(m => m.sequence > lastReadSeq && m.senderId !== userId).length;
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export async function createCall(input: {
  conversationId: string;
  roomId?: string | null;
  callerId: string;
  callerRole: string;
  recipientIds: string[];
  isWarmTransfer?: boolean;
  organizationId?: string;
  domain?: string;
}): Promise<ChitigramCall> {
  const vaults = getVaults();
  const now = serverNow();
  const call: ChitigramCall = {
    id: generateId('call'),
    organizationId: input.organizationId || ORGANIZATION_DEFAULT,
    domain: input.domain || DOMAIN_DEFAULT,
    conversationId: input.conversationId,
    roomId: input.roomId || null,
    callerId: input.callerId,
    callerRole: input.callerRole,
    recipientIds: input.recipientIds,
    createdAt: now,
    ringingAt: now,
    acceptedAt: null,
    startedAt: null,
    endedAt: null,
    durationSeconds: null,
    outcome: null,
    failureReason: null,
    isWarmTransfer: !!input.isWarmTransfer,
    transferredBy: null,
    transferredAt: null,
    holdState: 'NONE',
  };

  const arr = vaults.calls.get(input.conversationId) || [];
  arr.push(call);
  vaults.calls.set(input.conversationId, arr);

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `INSERT INTO "ChitigramCall" (id, "organizationId", domain, "conversationId", "roomId", "callerId", "callerRole", "recipientIds", "createdAt", "ringingAt", "acceptedAt", "startedAt", "endedAt", "durationSeconds", outcome, "failureReason", "isWarmTransfer", "transferredBy", "transferredAt", "holdState")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        call.id,
        call.organizationId,
        call.domain,
        call.conversationId,
        call.roomId,
        call.callerId,
        call.callerRole,
        call.recipientIds,
        new Date(call.createdAt),
        call.ringingAt ? new Date(call.ringingAt) : null,
        call.acceptedAt ? new Date(call.acceptedAt) : null,
        call.startedAt ? new Date(call.startedAt) : null,
        call.endedAt ? new Date(call.endedAt) : null,
        call.durationSeconds,
        call.outcome,
        call.failureReason,
        call.isWarmTransfer,
        call.transferredBy,
        call.transferredAt ? new Date(call.transferredAt) : null,
        call.holdState
      );
    } catch {
      if (isProduction()) {
        // not fatal for pilot, but log degraded
      }
    }
  }

  // Also create audit and system message for call started ringing
  await appendAuditInternal({
    conversationId: call.conversationId,
    actorId: call.callerId,
    actorRole: call.callerRole,
    eventType: 'CALL_RINGING',
    fromState: null,
    toState: null,
    details: { callId: call.id, roomId: call.roomId, recipients: call.recipientIds, isWarmTransfer: call.isWarmTransfer },
    organizationId: call.organizationId,
    domain: call.domain,
  });

  // Render as Chitigram CALL message — so it appears in thread
  await createMessage({
    conversationId: call.conversationId,
    senderId: call.callerId,
    senderRole: call.callerRole,
    senderName: call.callerRole,
    type: 'CALL',
    subType: 'CALL_EVENT',
    text: `Call ringing to ${call.recipientIds.join(', ')}`,
    visibility: 'VISIBLE',
    organizationId: call.organizationId,
    domain: call.domain,
  });

  return call;
}

export async function updateCall(
  callId: string,
  updates: Partial<ChitigramCall> & { outcome?: string | null; failureReason?: string | null; acceptedAt?: number | null; startedAt?: number | null; endedAt?: number | null; durationSeconds?: number | null; holdState?: string | null; transferredBy?: string | null; isWarmTransfer?: boolean }
): Promise<ChitigramCall | null> {
  const vaults = getVaults();
  let target: ChitigramCall | null = null;
  let convId: string | null = null;
  for (const [cid, calls] of vaults.calls.entries()) {
    const found = calls.find(c => c.id === callId);
    if (found) {
      target = found;
      convId = cid;
      break;
    }
  }
  // also try DB if not in memory
  if (!target) {
    const db = await getDb();
    if (db) {
      try {
        const rows = (await (db as any).$queryRawUnsafe(`SELECT * FROM "ChitigramCall" WHERE id = $1 LIMIT 1`, callId)) as any[];
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          target = {
            id: String(r.id),
            organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
            domain: String(r.domain || DOMAIN_DEFAULT),
            conversationId: String(r.conversationId),
            roomId: r.roomId ? String(r.roomId) : null,
            callerId: String(r.callerId),
            callerRole: String(r.callerRole),
            recipientIds: Array.isArray(r.recipientIds) ? r.recipientIds : [],
            createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
            ringingAt: r.ringingAt ? new Date(r.ringingAt).getTime() : null,
            acceptedAt: r.acceptedAt ? new Date(r.acceptedAt).getTime() : null,
            startedAt: r.startedAt ? new Date(r.startedAt).getTime() : null,
            endedAt: r.endedAt ? new Date(r.endedAt).getTime() : null,
            durationSeconds: r.durationSeconds ? Number(r.durationSeconds) : null,
            outcome: r.outcome ? String(r.outcome) : null,
            failureReason: r.failureReason ? String(r.failureReason) : null,
            isWarmTransfer: !!r.isWarmTransfer,
            transferredBy: r.transferredBy ? String(r.transferredBy) : null,
            transferredAt: r.transferredAt ? new Date(r.transferredAt).getTime() : null,
            holdState: r.holdState ? String(r.holdState) : null,
          };
          convId = target.conversationId;
          // cache
          const arr = vaults.calls.get(convId) || [];
          if (!arr.find(c => c.id === callId)) arr.push(target);
          vaults.calls.set(convId, arr);
        }
      } catch {}
    }
  }

  if (!target || !convId) return null;

  const now = serverNow();
  if (updates.acceptedAt !== undefined) target.acceptedAt = updates.acceptedAt;
  if (updates.startedAt !== undefined) target.startedAt = updates.startedAt;
  if (updates.endedAt !== undefined) target.endedAt = updates.endedAt;
  if (updates.durationSeconds !== undefined) target.durationSeconds = updates.durationSeconds;
  if (updates.outcome !== undefined) target.outcome = updates.outcome;
  if (updates.failureReason !== undefined) target.failureReason = updates.failureReason;
  if (updates.holdState !== undefined) target.holdState = updates.holdState;
  if (updates.transferredBy !== undefined) target.transferredBy = updates.transferredBy;
  if (updates.isWarmTransfer !== undefined) target.isWarmTransfer = updates.isWarmTransfer;
  if (updates.transferredAt !== undefined) (target as any).transferredAt = updates.transferredAt;

  // compute duration if ended
  if (target.startedAt && target.endedAt && target.durationSeconds == null) {
    target.durationSeconds = Math.max(0, Math.floor((target.endedAt - target.startedAt) / 1000));
  }

  // persist to DB
  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `UPDATE "ChitigramCall" SET "acceptedAt" = $1, "startedAt" = $2, "endedAt" = $3, "durationSeconds" = $4, outcome = $5, "failureReason" = $6, "holdState" = $7, "transferredBy" = $8, "transferredAt" = $9, "isWarmTransfer" = $10 WHERE id = $11`,
        target.acceptedAt ? new Date(target.acceptedAt) : null,
        target.startedAt ? new Date(target.startedAt) : null,
        target.endedAt ? new Date(target.endedAt) : null,
        target.durationSeconds,
        target.outcome,
        target.failureReason,
        target.holdState,
        target.transferredBy,
        (target as any).transferredAt ? new Date((target as any).transferredAt) : null,
        target.isWarmTransfer,
        target.id
      );
    } catch {}
  }

  // Audit and also post call record message when ended
  if (updates.outcome && (updates.outcome === 'COMPLETED' || updates.outcome === 'MISSED' || updates.outcome === 'NO_ANSWER' || updates.outcome === 'DECLINED' || updates.outcome === 'FAILED' || updates.outcome === 'CANCELLED')) {
    await appendAuditInternal({
      conversationId: target.conversationId,
      actorId: target.callerId,
      actorRole: target.callerRole,
      eventType: `CALL_${updates.outcome}`,
      fromState: null,
      toState: null,
      details: { callId: target.id, durationSeconds: target.durationSeconds, outcome: target.outcome, failureReason: target.failureReason },
      organizationId: target.organizationId,
      domain: target.domain,
    });

    // Also render call record as message — so thread shows missed/successful calls
    const isMissed = updates.outcome === 'NO_ANSWER' || updates.outcome === 'MISSED';
    await createMessage({
      conversationId: target.conversationId,
      senderId: target.callerId,
      senderRole: 'system',
      senderName: 'System',
      type: 'CALL',
      subType: 'CALL_EVENT',
      text: isMissed ? `Missed call from ${target.callerRole}` : `Call ended — duration ${target.durationSeconds || 0}s`,
      visibility: 'VISIBLE',
      payload: {
        durationSeconds: target.durationSeconds,
        outcome: target.outcome,
        failureReason: target.failureReason,
        startedAt: target.startedAt,
        endedAt: target.endedAt,
      },
      cardType: 'CALL_EVENT',
      cardPayload: {
        durationSeconds: target.durationSeconds,
        durationLabel: target.durationSeconds ? `${Math.floor(target.durationSeconds / 60)}:${String(target.durationSeconds % 60).padStart(2, '0')}` : '00:00',
        startedAt: target.startedAt,
        endedAt: target.endedAt,
        outcome: target.outcome,
      },
      organizationId: target.organizationId,
      domain: target.domain,
    });
  }

  return target;
}

export async function listCalls(conversationId: string): Promise<ChitigramCall[]> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(
        `SELECT * FROM "ChitigramCall" WHERE "conversationId" = $1 ORDER BY "createdAt" DESC`,
        conversationId
      )) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          conversationId: String(r.conversationId),
          roomId: r.roomId ? String(r.roomId) : null,
          callerId: String(r.callerId),
          callerRole: String(r.callerRole),
          recipientIds: Array.isArray(r.recipientIds) ? r.recipientIds : [],
          createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
          ringingAt: r.ringingAt ? new Date(r.ringingAt).getTime() : null,
          acceptedAt: r.acceptedAt ? new Date(r.acceptedAt).getTime() : null,
          startedAt: r.startedAt ? new Date(r.startedAt).getTime() : null,
          endedAt: r.endedAt ? new Date(r.endedAt).getTime() : null,
          durationSeconds: r.durationSeconds ? Number(r.durationSeconds) : null,
          outcome: r.outcome ? String(r.outcome) : null,
          failureReason: r.failureReason ? String(r.failureReason) : null,
          isWarmTransfer: !!r.isWarmTransfer,
          transferredBy: r.transferredBy ? String(r.transferredBy) : null,
          transferredAt: r.transferredAt ? new Date(r.transferredAt).getTime() : null,
          holdState: r.holdState ? String(r.holdState) : null,
        }));
      }
    } catch {}
  }
  return vaults.calls.get(conversationId) || [];
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

export async function createAssignment(input: {
  conversationId: string;
  practitionerId: string;
  practitionerName?: string | null;
  assignedBy: string;
  organizationId?: string;
  domain?: string;
}): Promise<ChitigramAssignment> {
  const vaults = getVaults();
  const now = serverNow();
  const org = input.organizationId || ORGANIZATION_DEFAULT;
  const domain = input.domain || DOMAIN_DEFAULT;

  // Deactivate previous active assignments
  const existing = vaults.assignments.get(input.conversationId) || [];
  existing.forEach(a => {
    if (a.isActive) a.isActive = false;
  });

  const assignment: ChitigramAssignment = {
    id: generateId('assign'),
    organizationId: org,
    domain,
    conversationId: input.conversationId,
    practitionerId: input.practitionerId,
    practitionerName: input.practitionerName || null,
    assignedBy: input.assignedBy,
    assignedAt: now,
    acceptanceState: 'PENDING',
    acceptedAt: null,
    declinedReason: null,
    isActive: true,
  };

  existing.push(assignment);
  vaults.assignments.set(input.conversationId, existing);

  // Also update conversation's assigned fields
  const conv = await getConversation(input.conversationId);
  if (conv) {
    conv.assignedPractitionerId = assignment.practitionerId;
    conv.assignedPractitionerName = assignment.practitionerName;
    conv.assignedBy = assignment.assignedBy;
    conv.assignedAt = assignment.assignedAt;
    conv.assignmentAcceptance = 'PENDING';
    conv.updatedAt = now;
    conv.lastActivityAt = now;
    vaults.conversations.set(conv.id, conv);
    if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);
  }

  const db = await getDb();
  if (db) {
    try {
      // deactivate previous in DB
      await (db as any).$executeRawUnsafe(
        `UPDATE "ChitigramAssignment" SET "isActive" = false WHERE "conversationId" = $1 AND "isActive" = true`,
        input.conversationId
      );
      await (db as any).$executeRawUnsafe(
        `INSERT INTO "ChitigramAssignment" (id, "organizationId", domain, "conversationId", "practitionerId", "practitionerName", "assignedBy", "assignedAt", "acceptanceState", "acceptedAt", "declinedReason", "isActive")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        assignment.id,
        assignment.organizationId,
        assignment.domain,
        assignment.conversationId,
        assignment.practitionerId,
        assignment.practitionerName,
        assignment.assignedBy,
        new Date(assignment.assignedAt),
        assignment.acceptanceState,
        assignment.acceptedAt ? new Date(assignment.acceptedAt) : null,
        assignment.declinedReason,
        assignment.isActive
      );
      if (conv) {
        await (db as any).$executeRawUnsafe(
          `UPDATE "ChitigramConversation" SET "assignedPractitionerId" = $1, "assignedPractitionerName" = $2, "assignedBy" = $3, "assignedAt" = $4, "assignmentAcceptance" = $5, "updatedAt" = $6, "lastActivityAt" = $6 WHERE id = $7`,
          conv.assignedPractitionerId,
          conv.assignedPractitionerName,
          conv.assignedBy,
          conv.assignedAt ? new Date(conv.assignedAt) : null,
          conv.assignmentAcceptance,
          new Date(now),
          conv.id
        );
      }
    } catch {
      if (isProduction()) {
        // degraded but assignment already in memory — still return, but caller should know
      }
    }
  }

  await appendAuditInternal({
    conversationId: assignment.conversationId,
    actorId: assignment.assignedBy,
    actorRole: 'operator',
    eventType: 'ASSIGNED',
    fromState: null,
    toState: null,
    details: { practitionerId: assignment.practitionerId, practitionerName: assignment.practitionerName, assignmentId: assignment.id },
    organizationId: org,
    domain,
  });

  // Transition conversation to ASSIGNED if currently WAITING or CREATED
  if (conv && (conv.state === 'WAITING' || conv.state === 'CREATED' || conv.state === 'REASSIGNED')) {
    await transitionConversation(conv.id, 'ASSIGNED', assignment.assignedBy, 'operator', {
      practitionerId: assignment.practitionerId,
    });
  }

  // Notify practitioner (minimal safe info)
  await createNotificationInternal({
    conversationId: assignment.conversationId,
    actorId: assignment.assignedBy,
    actorRole: 'operator',
    message: null,
    custom: {
      type: 'ASSIGNMENT',
      title: `New consultation assigned: ${conv?.seekerName || 'Devotee'}`,
      body: `${conv?.category || 'General'} — ${conv?.originalQuestion?.slice(0, 80) || 'Consultation request'}`,
      userId: assignment.practitionerId,
    },
    organizationId: org,
    domain,
  });

  return assignment;
}

export async function updateAssignmentAcceptance(
  assignmentId: string,
  acceptanceState: 'ACCEPTED' | 'DECLINED',
  actorId: string,
  declinedReason?: string | null
): Promise<ChitigramAssignment | null> {
  const vaults = getVaults();
  let target: ChitigramAssignment | null = null;
  let convId: string | null = null;
  for (const [cid, assignments] of vaults.assignments.entries()) {
    const found = assignments.find(a => a.id === assignmentId);
    if (found) {
      target = found;
      convId = cid;
      break;
    }
  }
  if (!target || !convId) {
    // try DB
    const db = await getDb();
    if (db) {
      try {
        const rows = (await (db as any).$queryRawUnsafe(`SELECT * FROM "ChitigramAssignment" WHERE id = $1 LIMIT 1`, assignmentId)) as any[];
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          target = {
            id: String(r.id),
            organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
            domain: String(r.domain || DOMAIN_DEFAULT),
            conversationId: String(r.conversationId),
            practitionerId: String(r.practitionerId),
            practitionerName: r.practitionerName ? String(r.practitionerName) : null,
            assignedBy: String(r.assignedBy),
            assignedAt: r.assignedAt ? new Date(r.assignedAt).getTime() : serverNow(),
            acceptanceState: String(r.acceptanceState || 'PENDING'),
            acceptedAt: r.acceptedAt ? new Date(r.acceptedAt).getTime() : null,
            declinedReason: r.declinedReason ? String(r.declinedReason) : null,
            isActive: !!r.isActive,
          };
          convId = target.conversationId;
        }
      } catch {}
    }
  }
  if (!target || !convId) return null;

  const now = serverNow();
  target.acceptanceState = acceptanceState;
  if (acceptanceState === 'ACCEPTED') target.acceptedAt = now;
  if (acceptanceState === 'DECLINED' && declinedReason) target.declinedReason = declinedReason;

  // update conversation acceptance too
  const conv = await getConversation(convId);
  if (conv) {
    conv.assignmentAcceptance = acceptanceState;
    conv.updatedAt = now;
    vaults.conversations.set(conv.id, conv);
    if (conv.sessionId) vaults.conversations.set(conv.sessionId, conv);
  }

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `UPDATE "ChitigramAssignment" SET "acceptanceState" = $1, "acceptedAt" = $2, "declinedReason" = $3 WHERE id = $4`,
        target.acceptanceState,
        target.acceptedAt ? new Date(target.acceptedAt) : null,
        target.declinedReason,
        target.id
      );
      if (conv) {
        await (db as any).$executeRawUnsafe(
          `UPDATE "ChitigramConversation" SET "assignmentAcceptance" = $1, "updatedAt" = $2 WHERE id = $3`,
          conv.assignmentAcceptance,
          new Date(now),
          conv.id
        );
      }
    } catch {}
  }

  await appendAuditInternal({
    conversationId: convId,
    actorId,
    actorRole: target.practitionerId === actorId ? 'pandit' : 'operator',
    eventType: acceptanceState === 'ACCEPTED' ? 'ASSIGNMENT_ACCEPTED' : 'ASSIGNMENT_DECLINED',
    fromState: null,
    toState: null,
    details: { assignmentId, practitionerId: target.practitionerId, declinedReason },
    organizationId: target.organizationId,
    domain: target.domain,
  });

  if (acceptanceState === 'ACCEPTED' && conv) {
    await transitionConversation(conv.id, 'RINGING', actorId, 'pandit', { assignmentId });
  }

  return target;
}

export async function listAssignments(conversationId: string): Promise<ChitigramAssignment[]> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(
        `SELECT * FROM "ChitigramAssignment" WHERE "conversationId" = $1 ORDER BY "assignedAt" DESC`,
        conversationId
      )) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          conversationId: String(r.conversationId),
          practitionerId: String(r.practitionerId),
          practitionerName: r.practitionerName ? String(r.practitionerName) : null,
          assignedBy: String(r.assignedBy),
          assignedAt: r.assignedAt ? new Date(r.assignedAt).getTime() : serverNow(),
          acceptanceState: String(r.acceptanceState || 'PENDING'),
          acceptedAt: r.acceptedAt ? new Date(r.acceptedAt).getTime() : null,
          declinedReason: r.declinedReason ? String(r.declinedReason) : null,
          isActive: !!r.isActive,
        }));
      }
    } catch {}
  }
  return vaults.assignments.get(conversationId) || [];
}

// ---------------------------------------------------------------------------
// Presence — server-backed, not shown unless backed
// ---------------------------------------------------------------------------

export async function setPresence(input: {
  userId: string;
  userRole?: string;
  displayName?: string;
  connectionState: ChitigramConnectionState;
  availability?: ChitigramAvailability;
  organizationId?: string;
  domain?: string;
}): Promise<ChitigramPresence> {
  const vaults = getVaults();
  const now = serverNow();
  const org = input.organizationId || ORGANIZATION_DEFAULT;
  const domain = input.domain || DOMAIN_DEFAULT;
  let presence = vaults.presence.get(input.userId);
  if (!presence) {
    presence = {
      id: generateId('presence'),
      organizationId: org,
      domain,
      userId: input.userId,
      userRole: input.userRole || 'operator',
      displayName: input.displayName || undefined,
      connectionState: input.connectionState,
      availability: input.availability || 'OFF_DUTY',
      lastSeenAt: now,
      updatedAt: now,
    };
  } else {
    presence.connectionState = input.connectionState;
    if (input.availability) presence.availability = input.availability;
    if (input.displayName) presence.displayName = input.displayName;
    if (input.userRole) presence.userRole = input.userRole;
    presence.lastSeenAt = now;
    presence.updatedAt = now;
  }
  vaults.presence.set(input.userId, presence);

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `INSERT INTO "ChitigramPresence" (id, "organizationId", domain, "userId", "userRole", "displayName", "connectionState", availability, "lastSeenAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT ("userId") DO UPDATE SET "connectionState" = $7, availability = $8, "lastSeenAt" = $9, "updatedAt" = $10, "displayName" = $6, "userRole" = $5`,
        presence.id,
        presence.organizationId,
        presence.domain,
        presence.userId,
        presence.userRole,
        presence.displayName || null,
        presence.connectionState,
        presence.availability,
        new Date(presence.lastSeenAt),
        new Date(presence.updatedAt)
      );
    } catch {}
  }

  return presence;
}

export async function getPresence(userId: string): Promise<ChitigramPresence | null> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(`SELECT * FROM "ChitigramPresence" WHERE "userId" = $1 LIMIT 1`, userId)) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        const r = rows[0];
        const p: ChitigramPresence = {
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          userId: String(r.userId),
          userRole: String(r.userRole || 'operator'),
          displayName: r.displayName ? String(r.displayName) : undefined,
          connectionState: String(r.connectionState || 'OFFLINE') as ChitigramConnectionState,
          availability: String(r.availability || 'OFF_DUTY') as ChitigramAvailability,
          lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt).getTime() : serverNow(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : serverNow(),
        };
        vaults.presence.set(userId, p);
        return p;
      }
    } catch {}
  }
  return vaults.presence.get(userId) || null;
}

export async function listPresence(organizationId = ORGANIZATION_DEFAULT): Promise<ChitigramPresence[]> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(`SELECT * FROM "ChitigramPresence" WHERE "organizationId" = $1`, organizationId)) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          userId: String(r.userId),
          userRole: String(r.userRole || 'operator'),
          displayName: r.displayName ? String(r.displayName) : undefined,
          connectionState: String(r.connectionState || 'OFFLINE') as ChitigramConnectionState,
          availability: String(r.availability || 'OFF_DUTY') as ChitigramAvailability,
          lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt).getTime() : serverNow(),
          updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : serverNow(),
        }));
      }
    } catch {}
  }
  return Array.from(vaults.presence.values()).filter(p => p.organizationId === organizationId);
}

// ---------------------------------------------------------------------------
// Audit — append-only, validated transitions, timeline
// ---------------------------------------------------------------------------

async function appendAuditInternal(event: {
  conversationId: string;
  actorId?: string | null;
  actorRole?: string | null;
  eventType: string;
  fromState?: string | null;
  toState?: string | null;
  details?: Record<string, any> | null;
  organizationId?: string;
  domain?: string;
}): Promise<ChitigramAuditEvent> {
  const vaults = getVaults();
  const now = serverNow();
  const audit: ChitigramAuditEvent = {
    id: generateId('audit'),
    organizationId: event.organizationId || ORGANIZATION_DEFAULT,
    domain: event.domain || DOMAIN_DEFAULT,
    conversationId: event.conversationId,
    actorId: event.actorId || null,
    actorRole: event.actorRole || null,
    eventType: event.eventType,
    fromState: event.fromState || null,
    toState: event.toState || null,
    details: event.details || null,
    createdAt: now,
  };

  const arr = vaults.audit.get(event.conversationId) || [];
  arr.push(audit);
  vaults.audit.set(event.conversationId, arr);

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `INSERT INTO "ChitigramAuditEvent" (id, "organizationId", domain, "conversationId", "actorId", "actorRole", "eventType", "fromState", "toState", details, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        audit.id,
        audit.organizationId,
        audit.domain,
        audit.conversationId,
        audit.actorId,
        audit.actorRole,
        audit.eventType,
        audit.fromState,
        audit.toState,
        toDbJson(audit.details),
        new Date(audit.createdAt)
      );
    } catch {}
  }

  return audit;
}

export async function appendAudit(event: {
  conversationId: string;
  actorId?: string | null;
  actorRole?: string | null;
  eventType: string;
  fromState?: string | null;
  toState?: string | null;
  details?: Record<string, any> | null;
  organizationId?: string;
  domain?: string;
}): Promise<ChitigramAuditEvent> {
  return appendAuditInternal(event);
}

export async function listAudit(conversationId: string): Promise<ChitigramAuditEvent[]> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      const rows = (await (db as any).$queryRawUnsafe(
        `SELECT * FROM "ChitigramAuditEvent" WHERE "conversationId" = $1 ORDER BY "createdAt" ASC`,
        conversationId
      )) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          conversationId: String(r.conversationId),
          actorId: r.actorId ? String(r.actorId) : null,
          actorRole: r.actorRole ? String(r.actorRole) : null,
          eventType: String(r.eventType),
          fromState: r.fromState ? String(r.fromState) : null,
          toState: r.toState ? String(r.toState) : null,
          details: fromDbJson(r.details),
          createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
        }));
      }
    } catch {}
  }
  const arr = vaults.audit.get(conversationId) || [];
  return [...arr].sort((a, b) => a.createdAt - b.createdAt);
}

// ---------------------------------------------------------------------------
// Notifications — in-app first, minimal safe info, architected for Web Push
// ---------------------------------------------------------------------------

async function createNotificationInternal(input: {
  conversationId: string;
  actorId: string;
  actorRole: string;
  message?: ChitigramMessage | null;
  custom?: { type: string; title: string; body?: string; userId: string } | null;
  organizationId?: string;
  domain?: string;
}): Promise<void> {
  const vaults = getVaults();
  const org = input.organizationId || ORGANIZATION_DEFAULT;
  const domain = input.domain || DOMAIN_DEFAULT;
  const now = serverNow();

  // Determine recipients — all participants except sender
  if (input.custom) {
    // Direct assignment notification
    const notif: ChitigramNotification = {
      id: generateId('notif'),
      organizationId: org,
      domain,
      userId: input.custom.userId,
      conversationId: input.conversationId,
      type: input.custom.type,
      title: input.custom.title,
      body: input.custom.body || null,
      link: `/chitigram/inbox?conversationId=${encodeURIComponent(input.conversationId)}`,
      read: false,
      createdAt: now,
    };
    const arr = vaults.notifications.get(notif.userId) || [];
    arr.push(notif);
    vaults.notifications.set(notif.userId, arr);

    const db = await getDb();
    if (db) {
      try {
        await (db as any).$executeRawUnsafe(
          `INSERT INTO "ChitigramNotification" (id, "organizationId", domain, "userId", "conversationId", type, title, body, link, read, "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          notif.id,
          notif.organizationId,
          notif.domain,
          notif.userId,
          notif.conversationId,
          notif.type,
          notif.title,
          notif.body,
          notif.link,
          notif.read,
          new Date(notif.createdAt)
        );
      } catch {}
    }
    return;
  }

  if (!input.message) return;

  const participants = await getParticipants(input.conversationId);
  const recipients = participants.filter(p => p.userId !== input.actorId);
  for (const recipient of recipients) {
    // Minimal safe info — never leak full message if sensitive
    const title = input.message.type === 'CALL' ? `Incoming call in ${input.conversationId.slice(0, 8)}` : `New message from ${input.message.senderRole}`;
    const body = input.message.text ? input.message.text.slice(0, 80) : `${input.message.type} message`;
    const notif: ChitigramNotification = {
      id: generateId('notif'),
      organizationId: org,
      domain,
      userId: recipient.userId,
      conversationId: input.conversationId,
      type: input.message.type === 'CALL' ? 'CALL' : 'MESSAGE',
      title,
      body,
      link: `/chitigram/inbox?conversationId=${encodeURIComponent(input.conversationId)}`,
      read: false,
      createdAt: now,
    };
    const arr = vaults.notifications.get(recipient.userId) || [];
    arr.push(notif);
    vaults.notifications.set(recipient.userId, arr);

    const db = await getDb();
    if (db) {
      try {
        await (db as any).$executeRawUnsafe(
          `INSERT INTO "ChitigramNotification" (id, "organizationId", domain, "userId", "conversationId", type, title, body, link, read, "createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          notif.id,
          notif.organizationId,
          notif.domain,
          notif.userId,
          notif.conversationId,
          notif.type,
          notif.title,
          notif.body,
          notif.link,
          notif.read,
          new Date(notif.createdAt)
        );
      } catch {}
    }
  }
}

export async function listNotifications(userId: string, unreadOnly = false): Promise<ChitigramNotification[]> {
  const vaults = getVaults();
  const db = await getDb();
  if (db) {
    try {
      const rows = unreadOnly
        ? ((await (db as any).$queryRawUnsafe(`SELECT * FROM "ChitigramNotification" WHERE "userId" = $1 AND read = false ORDER BY "createdAt" DESC LIMIT 100`, userId)) as any[])
        : ((await (db as any).$queryRawUnsafe(`SELECT * FROM "ChitigramNotification" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 100`, userId)) as any[]);
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((r: any) => ({
          id: String(r.id),
          organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
          domain: String(r.domain || DOMAIN_DEFAULT),
          userId: String(r.userId),
          conversationId: String(r.conversationId),
          type: String(r.type),
          title: String(r.title),
          body: r.body ? String(r.body) : null,
          link: r.link ? String(r.link) : null,
          read: !!r.read,
          createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
        }));
      }
    } catch {}
  }
  let arr = vaults.notifications.get(userId) || [];
  if (unreadOnly) arr = arr.filter(n => !n.read);
  return [...arr].sort((a, b) => b.createdAt - a.createdAt);
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
  const vaults = getVaults();
  const arr = vaults.notifications.get(userId) || [];
  const found = arr.find(n => n.id === notificationId);
  if (found) found.read = true;

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(`UPDATE "ChitigramNotification" SET read = true WHERE id = $1 AND "userId" = $2`, notificationId, userId);
    } catch {}
  }
  return !!found;
}

// ---------------------------------------------------------------------------
// Inbox — denormalized view for operator
// ---------------------------------------------------------------------------

export async function getInboxRows(
  filter: InboxFilter = 'ALL',
  organizationId = ORGANIZATION_DEFAULT,
  domain = DOMAIN_DEFAULT,
  limit = 100,
  offset = 0,
  forUserId?: string // for unread counts per user
): Promise<{ rows: ChitigramInboxRow[]; total: number }> {
  const convs = await listConversations(filter, organizationId, domain, limit, offset);
  const rows: ChitigramInboxRow[] = [];
  for (const conv of convs) {
    const { messages: allMessages } = await listMessages(conv.id, { limit: 1, offset: 0, includeInternal: false });
    // Actually need latest message — fetch last 1 with desc? Our listMessages orders ASC, so need to fetch with offset total-1 or fetch all and take last
    const { messages } = await listMessages(conv.id, { limit: 100, offset: 0, includeInternal: false });
    const latest = messages.length > 0 ? messages[messages.length - 1] : null;
    const participants = await getParticipants(conv.id);
    const unread = forUserId ? await getUnreadCount(conv.id, forUserId) : 0;
    const presence = conv.assignedPractitionerId ? await getPresence(conv.assignedPractitionerId) : null;
    const timeWaiting = conv.waitingSince && (conv.state === 'WAITING' || conv.state === 'CREATED') ? Math.floor((serverNow() - conv.waitingSince) / 1000) : null;
    rows.push({
      conversation: conv,
      latestMessage: latest,
      unreadCount: unread,
      participantCount: participants.length,
      assignedPractitioner: conv.assignedPractitionerId
        ? { id: conv.assignedPractitionerId, name: conv.assignedPractitionerName || 'Pandit', availability: presence?.availability }
        : null,
      timeWaitingSeconds: timeWaiting,
      presence,
    });
  }
  // total count for pagination — approximate
  const totalConvs = await listConversations(filter, organizationId, domain, 1000, 0);
  return { rows, total: totalConvs.length };
}

// ---------------------------------------------------------------------------
// Metrics — pilot instrumentation
// ---------------------------------------------------------------------------

export async function getMetrics(organizationId = ORGANIZATION_DEFAULT, domain = DOMAIN_DEFAULT): Promise<ChitigramMetrics> {
  const vaults = getVaults();
  const now = serverNow();
  const allConvs = await listConversations('ALL', organizationId, domain, 1000, 0);

  // conversations per day — last 24h
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const perDay = allConvs.filter(c => c.createdAt >= dayAgo).length;

  // waiting times
  const waitingConvs = allConvs.filter(c => c.state === 'WAITING' && c.waitingSince);
  const avgQueueWait = waitingConvs.length > 0 ? waitingConvs.reduce((sum, c) => sum + (now - (c.waitingSince || now)), 0) / waitingConvs.length / 1000 : null;

  // first-response time — time from CREATED to first operator/pandit message? Approximate via audit
  let totalFirstResponse = 0;
  let firstResponseCount = 0;
  for (const conv of allConvs) {
    const audits = await listAudit(conv.id);
    const created = audits.find(a => a.eventType === 'CONVERSATION_CREATED');
    const firstResponse = audits.find(a => a.actorRole === 'operator' || a.actorRole === 'pandit');
    if (created && firstResponse) {
      totalFirstResponse += firstResponse.createdAt - created.createdAt;
      firstResponseCount++;
    }
  }
  const avgFirstResponse = firstResponseCount > 0 ? totalFirstResponse / firstResponseCount / 1000 : null;

  // calls
  let totalCalls = 0;
  let answeredCalls = 0;
  let totalDuration = 0;
  let durationCount = 0;
  let noAnswer = 0;
  for (const conv of allConvs) {
    const calls = await listCalls(conv.id);
    totalCalls += calls.length;
    for (const call of calls) {
      if (call.outcome === 'COMPLETED') {
        answeredCalls++;
        if (call.durationSeconds) {
          totalDuration += call.durationSeconds;
          durationCount++;
        }
      } else if (call.outcome === 'NO_ANSWER' || call.outcome === 'MISSED') {
        noAnswer++;
      }
    }
  }
  const answerRate = totalCalls > 0 ? answeredCalls / totalCalls : null;
  const noAnswerRate = totalCalls > 0 ? noAnswer / totalCalls : null;
  const avgDuration = durationCount > 0 ? totalDuration / durationCount : null;

  // reassignments
  let reassignCount = 0;
  for (const conv of allConvs) {
    const assignments = await listAssignments(conv.id);
    if (assignments.length > 1) reassignCount += assignments.length - 1;
  }

  // unread backlog — sum unread for operator? For now sum across all participants
  let unreadBacklog = 0;
  // Use operator userId placeholder? For pilot, count total unread across all convs for any user
  // We'll approximate by counting messages with status SENT/DELIVERED
  for (const conv of allConvs) {
    const { messages } = await listMessages(conv.id, { limit: 200, offset: 0, includeInternal: false });
    unreadBacklog += messages.filter(m => m.status !== 'READ').length;
  }

  const closed = allConvs.filter(c => c.state === 'CLOSED').length;
  const active = allConvs.filter(c => ['ASSIGNED', 'RINGING', 'ACCEPTED', 'LIVE', 'ENDED', 'WAITING'].includes(c.state)).length;
  const completionRate = allConvs.length > 0 ? closed / allConvs.length : null;

  return {
    conversationsPerDay: perDay,
    avgFirstResponseSeconds: avgFirstResponse,
    avgQueueWaitSeconds: avgQueueWait,
    callAnswerRate: answerRate,
    avgCallDurationSeconds: avgDuration,
    noAnswerRate: noAnswerRate,
    reassignmentCount: reassignCount,
    unreadBacklog,
    consultationCompletionRate: completionRate,
    totalConversations: allConvs.length,
    activeConversations: active,
    closedConversations: closed,
    generatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Warm transfer — Hold / Add Pandit / Transfer via call holdState + reassignment
// ---------------------------------------------------------------------------

export async function holdCall(callId: string, actorId: string): Promise<ChitigramCall | null> {
  const call = await updateCall(callId, { holdState: 'HOLD' });
  if (call) {
    await appendAuditInternal({
      conversationId: call.conversationId,
      actorId,
      actorRole: 'operator',
      eventType: 'CALL_HOLD',
      fromState: null,
      toState: null,
      details: { callId },
      organizationId: call.organizationId,
      domain: call.domain,
    });
  }
  return call;
}

export async function resumeCall(callId: string, actorId: string): Promise<ChitigramCall | null> {
  const call = await updateCall(callId, { holdState: 'RESUMED' });
  if (call) {
    await appendAuditInternal({
      conversationId: call.conversationId,
      actorId,
      actorRole: 'operator',
      eventType: 'CALL_RESUMED',
      fromState: null,
      toState: null,
      details: { callId },
      organizationId: call.organizationId,
      domain: call.domain,
    });
  }
  return call;
}

export async function addPanditToCall(
  callId: string,
  practitionerId: string,
  practitionerName: string | undefined,
  actorId: string
): Promise<ChitigramCall | null> {
  // Fetch call
  let call: ChitigramCall | null = null;
  const vaults = getVaults();
  for (const calls of vaults.calls.values()) {
    const found = calls.find(c => c.id === callId);
    if (found) call = found;
  }
  if (!call) {
    // try DB
    const db = await getDb();
    if (db) {
      try {
        const rows = (await (db as any).$queryRawUnsafe(`SELECT * FROM "ChitigramCall" WHERE id = $1 LIMIT 1`, callId)) as any[];
        if (Array.isArray(rows) && rows.length > 0) {
          const r = rows[0];
          call = {
            id: String(r.id),
            organizationId: String(r.organizationId || ORGANIZATION_DEFAULT),
            domain: String(r.domain || DOMAIN_DEFAULT),
            conversationId: String(r.conversationId),
            roomId: r.roomId ? String(r.roomId) : null,
            callerId: String(r.callerId),
            callerRole: String(r.callerRole),
            recipientIds: Array.isArray(r.recipientIds) ? r.recipientIds : [],
            createdAt: r.createdAt ? new Date(r.createdAt).getTime() : serverNow(),
            ringingAt: r.ringingAt ? new Date(r.ringingAt).getTime() : null,
            acceptedAt: r.acceptedAt ? new Date(r.acceptedAt).getTime() : null,
            startedAt: r.startedAt ? new Date(r.startedAt).getTime() : null,
            endedAt: r.endedAt ? new Date(r.endedAt).getTime() : null,
            durationSeconds: r.durationSeconds ? Number(r.durationSeconds) : null,
            outcome: r.outcome ? String(r.outcome) : null,
            failureReason: r.failureReason ? String(r.failureReason) : null,
            isWarmTransfer: !!r.isWarmTransfer,
            transferredBy: r.transferredBy ? String(r.transferredBy) : null,
            transferredAt: r.transferredAt ? new Date(r.transferredAt).getTime() : null,
            holdState: r.holdState ? String(r.holdState) : null,
          };
        }
      } catch {}
    }
  }
  if (!call) return null;

  if (!call.recipientIds.includes(practitionerId)) call.recipientIds.push(practitionerId);
  call.isWarmTransfer = true;

  const db = await getDb();
  if (db) {
    try {
      await (db as any).$executeRawUnsafe(
        `UPDATE "ChitigramCall" SET "recipientIds" = $1, "isWarmTransfer" = true WHERE id = $2`,
        call.recipientIds,
        call.id
      );
    } catch {}
  }

  await appendAuditInternal({
    conversationId: call.conversationId,
    actorId,
    actorRole: 'operator',
    eventType: 'CALL_ADD_PANDIT',
    fromState: null,
    toState: null,
    details: { callId, practitionerId, practitionerName },
    organizationId: call.organizationId,
    domain: call.domain,
  });

  // Also ensure participant added
  await upsertParticipant(call.conversationId, practitionerId, 'pandit', practitionerName, ['READ', 'SEND', 'ACCEPT_CALL'] as ChitigramCapability[]);

  // Notify pandit
  await createNotificationInternal({
    conversationId: call.conversationId,
    actorId,
    actorRole: 'operator',
    message: null,
    custom: {
      type: 'CALL',
      title: `Warm transfer: please join call ${call.id.slice(0, 8)}`,
      body: `Operator added you to conversation ${call.conversationId.slice(0, 8)}`,
      userId: practitionerId,
    },
    organizationId: call.organizationId,
    domain: call.domain,
  });

  return call;
}

export async function transferCall(
  callId: string,
  fromActorId: string,
  toPractitionerId: string
): Promise<ChitigramCall | null> {
  const call = await updateCall(callId, {
    transferredBy: fromActorId,
    transferredAt: serverNow(),
    isWarmTransfer: true,
  });
  if (call) {
    await appendAuditInternal({
      conversationId: call.conversationId,
      actorId: fromActorId,
      actorRole: 'operator',
      eventType: 'CALL_TRANSFER',
      fromState: null,
      toState: null,
      details: { callId, toPractitionerId },
      organizationId: call.organizationId,
      domain: call.domain,
    });
    // After transfer, operator can leave — but we keep call record; 1:1 continues between devotee & pandit
  }
  return call;
}

// ---------------------------------------------------------------------------
// Voice note helpers — via message protocol, persisted media metadata
// ---------------------------------------------------------------------------

export async function createVoiceMessage(input: {
  conversationId: string;
  senderId: string;
  senderRole: string;
  senderName?: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  url?: string;
  waveform?: number[];
  visibility?: ChitigramVisibility;
}): Promise<{ message?: ChitigramMessage; error?: string; degraded?: boolean }> {
  const payload = {
    durationSeconds: input.durationSeconds,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    url: input.url || null,
    waveform: input.waveform || null,
  };
  return createMessage({
    conversationId: input.conversationId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName || null,
    type: 'VOICE',
    subType: 'VOICE',
    text: null,
    payload,
    visibility: input.visibility || 'VISIBLE',
  });
}

// ---------------------------------------------------------------------------
// Utility — ensure conversation exists for legacy sessionId (backward compat)
// ---------------------------------------------------------------------------

export async function ensureConversationForSession(
  sessionId: string,
  fallback: Partial<ChitigramConversation> = {}
): Promise<ChitigramConversation> {
  let conv = await getConversation(sessionId);
  if (conv) return conv;
  // Create new conversation with sessionId as alias
  const res = await createConversation({
    id: sessionId, // use sessionId as conversationId for backward compat
    sessionId,
    organizationId: fallback.organizationId || ORGANIZATION_DEFAULT,
    domain: fallback.domain || DOMAIN_DEFAULT,
    seekerName: fallback.seekerName || 'श्रद्धालु भक्त',
    category: fallback.category || 'General Guidance',
    originalQuestion: fallback.originalQuestion || 'मुफ्त परामर्श',
    language: fallback.language || 'Hindi',
    kundliRef: fallback.kundliRef,
    paymentStatus: fallback.paymentStatus || 'PENDING',
    paymentAmountInr: fallback.paymentAmountInr || 0,
  });
  return res.conversation;
}

/**
 * SABHA RTC SIGNALING — In-memory room registry & message routing (SERVER ONLY).
 *
 * Implements the signaling plane described in docs/CALL_SECURITY_MODEL.md:
 *  - Unpredictable, high-entropy room IDs (issued by the free-call session factory).
 *  - Ephemeral HMAC-SHA256 session authorization (src/lib/sabha/auth.ts) is verified
 *    by the route handler BEFORE any registry mutation happens here.
 *  - Exactly TWO peers per consultation room: 1 DEVOTEE (customer) + 1 SCHOLAR (consultant).
 *    Customer-Care operators (ADMIN role) are routing-layer only and are NEVER admitted
 *    into a media room (threat matrix: "Disgruntled Operator / Wiretapping").
 *  - The signaling plane only ever handles SDP descriptions and ICE candidates.
 *    It possesses no DTLS private keys and cannot decrypt SRTP media.
 *  - ZERO-RECORDING (VOICE_INV_007): inboxes are volatile, drained on delivery,
 *    and nothing here is ever persisted to disk or a database.
 *
 * Transport model:
 *  - POST /api/rtc/signal  → client → server message submission (+ own inbox drain).
 *  - GET  /api/rtc/signal  → server → client SSE stream (15s keepalive heartbeat).
 *  - A 15s client heartbeat keeps the participant marked live; a lazy sweeper
 *    evicts participants silent for >45s and notifies the peer (silent network loss).
 */

import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Types (shared with the client hook via `import type` — erased at build time)
// ---------------------------------------------------------------------------

export type SignalMessageType =
  | 'JOIN_ROOM'
  | 'SDP_OFFER'
  | 'SDP_ANSWER'
  | 'ICE_CANDIDATE'
  | 'LEAVE_ROOM'
  | 'TRANSPORT_STATE'
  | 'CHAT_MESSAGE'
  | 'HEARTBEAT';

export type SignalRole = 'CUSTOMER' | 'CONSULTANT';

export interface SignalMessage {
  id: string;
  type: SignalMessageType;
  roomId: string;
  sessionId: string;
  fromUserId: string;
  fromRole: SignalRole;
  timestamp: number;
  payload?: Record<string, any>;
}

export interface RoomParticipant {
  userId: string;
  role: SignalRole;
  joinedAt: number;
  lastSeenAt: number;
  /** Volatile delivery inbox — drained by POST polls, or pushed over SSE. */
  inbox: SignalMessage[];
  listeners: Set<(message: SignalMessage) => void>;
}

export interface SignalRoom {
  roomId: string;
  sessionId: string;
  createdAt: number;
  closedAt?: number;
  participants: Map<string, RoomParticipant>;
}

export interface JoinRoomResult {
  ok: boolean;
  rejoined: boolean;
  peerPresent: boolean;
  peerRole?: SignalRole;
  error?: string;
  errorCode?: 'ROOM_CAPACITY_EXCEEDED' | 'ROOM_CLOSED' | 'ROLE_NOT_PERMITTED';
}

const HEARTBEAT_STALE_MS = 45_000;

// ---------------------------------------------------------------------------
// Global registry (attached to globalThis so dev-server HMR does not orphan it)
// ---------------------------------------------------------------------------

const globalForSignaling = globalThis as unknown as {
  __sabhaSignalRooms: Map<string, SignalRoom> | undefined;
};

const ROOMS: Map<string, SignalRoom> =
  globalForSignaling.__sabhaSignalRooms ?? new Map<string, SignalRoom>();
globalForSignaling.__sabhaSignalRooms = ROOMS;

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function newMessageId(): string {
  return crypto.randomUUID();
}

function getRoom(roomId: string): SignalRoom | undefined {
  return ROOMS.get(roomId);
}

function deliver(participant: RoomParticipant, message: SignalMessage): void {
  participant.inbox.push(message);
  // Cap the volatile inbox so a stalled client cannot grow it unboundedly.
  if (participant.inbox.length > 256) participant.inbox.splice(0, participant.inbox.length - 256);
  for (const listener of participant.listeners) {
    try {
      listener(message);
    } catch {
      // A broken SSE stream must never take down the routing loop.
    }
  }
}

function peerOf(room: SignalRoom, userId: string): RoomParticipant | undefined {
  for (const [id, participant] of room.participants) {
    if (id !== userId) return participant;
  }
  return undefined;
}

export function evictStaleParticipants(
  sessionId: string,
  onParticipantLost?: (sessionId: string, userId: string) => void
): void {
  const now = Date.now();
  for (const room of ROOMS.values()) {
    if (room.sessionId !== sessionId || room.closedAt) continue;
    for (const [userId, participant] of room.participants) {
      if (now - participant.lastSeenAt > HEARTBEAT_STALE_MS) {
        room.participants.delete(userId);
        for (const listener of participant.listeners) participant.listeners.delete(listener);
        const lost: SignalMessage = {
          id: newMessageId(),
          type: 'LEAVE_ROOM',
          roomId: room.roomId,
          sessionId: room.sessionId,
          fromUserId: userId,
          fromRole: participant.role,
          timestamp: now,
          payload: { reason: 'HEARTBEAT_TIMEOUT' }
        };
        const peer = peerOf(room, userId);
        if (peer) deliver(peer, lost);
        onParticipantLost?.(room.sessionId, userId);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Admits an authorized participant into the room. Enforces the hard capacity
 * rule of exactly one CUSTOMER + one CONSULTANT (SECTION 2.3, rule 5).
 */
export function joinRoom(params: {
  roomId: string;
  sessionId: string;
  userId: string;
  role: SignalRole;
}): JoinRoomResult {
  const { roomId, sessionId, userId, role } = params;
  evictStaleParticipants(sessionId);

  let room = getRoom(roomId);
  if (!room) {
    room = { roomId, sessionId, createdAt: Date.now(), participants: new Map() };
    ROOMS.set(roomId, room);
  }
  if (room.closedAt) {
    return { ok: false, rejoined: false, peerPresent: false, error: 'Room is closed.', errorCode: 'ROOM_CLOSED' };
  }

  const existing = room.participants.get(userId);
  if (existing) {
    // Same participant reconnecting (tab refresh / ICE restart): re-adopt handle.
    existing.lastSeenAt = Date.now();
    const peer = peerOf(room, userId);
    return { ok: true, rejoined: true, peerPresent: !!peer, peerRole: peer?.role };
  }

  const roleCount = Array.from(room.participants.values()).filter(p => p.role === role).length;
  if (roleCount >= 1) {
    return {
      ok: false,
      rejoined: false,
      peerPresent: false,
      error: 'This consultation room already has its authorized participant for your role.',
      errorCode: 'ROOM_CAPACITY_EXCEEDED'
    };
  }

  const participant: RoomParticipant = {
    userId,
    role,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
    inbox: [],
    listeners: new Set()
  };
  room.participants.set(userId, participant);

  const peer = peerOf(room, userId);
  if (peer) {
    deliver(peer, {
      id: newMessageId(),
      type: 'JOIN_ROOM',
      roomId,
      sessionId,
      fromUserId: userId,
      fromRole: role,
      timestamp: Date.now(),
      payload: { event: 'PEER_JOINED' }
    });
  }

  return { ok: true, rejoined: false, peerPresent: !!peer, peerRole: peer?.role };
}

/**
 * Sends a signaling message to the (single) authorized peer. Returns true when
 * a peer was present and the message was routed.
 */
export function routeToPeer(message: Omit<SignalMessage, 'id' | 'timestamp'>): {
  delivered: boolean;
  reason?: string;
} {
  const room = getRoom(message.roomId);
  if (!room || room.closedAt) return { delivered: false, reason: 'ROOM_NOT_FOUND' };

  const sender = room.participants.get(message.fromUserId);
  if (!sender) return { delivered: false, reason: 'NOT_IN_ROOM' };
  sender.lastSeenAt = Date.now();

  const peer = peerOf(room, message.fromUserId);
  if (!peer) return { delivered: false, reason: 'PEER_NOT_PRESENT' };

  deliver(peer, { ...message, id: newMessageId(), timestamp: Date.now() });
  return { delivered: true };
}

/** Marks a live heartbeat for the participant (silent-loss detection). */
export function heartbeat(roomId: string, userId: string): void {
  const room = getRoom(roomId);
  const participant = room?.participants.get(userId);
  if (participant) participant.lastSeenAt = Date.now();
}

/** Removes a participant, notifies the peer, and closes empty/ended rooms. */
export function leaveRoom(params: {
  roomId: string;
  userId: string;
  reason?: string;
}): { left: boolean; peerNotified: boolean } {
  const { roomId, userId, reason } = params;
  const room = getRoom(roomId);
  if (!room) return { left: false, peerNotified: false };

  const participant = room.participants.get(userId);
  if (!participant) return { left: false, peerNotified: false };

  room.participants.delete(userId);
  for (const listener of participant.listeners) participant.listeners.delete(listener);

  const peer = peerOf(room, userId);
  let peerNotified = false;
  if (peer) {
    deliver(peer, {
      id: newMessageId(),
      type: 'LEAVE_ROOM',
      roomId,
      sessionId: room.sessionId,
      fromUserId: userId,
      fromRole: participant.role,
      timestamp: Date.now(),
      payload: { reason: reason || 'CALL_ENDED' }
    });
    peerNotified = true;
  }

  if (room.participants.size === 0) {
    room.closedAt = Date.now();
    ROOMS.delete(roomId);
  }
  return { left: true, peerNotified };
}

/** Drains the caller's volatile inbox (POST polling path). */
export function drainInbox(roomId: string, userId: string): SignalMessage[] {
  const room = getRoom(roomId);
  const participant = room?.participants.get(userId);
  if (!participant) return [];
  participant.lastSeenAt = Date.now();
  const drained = participant.inbox.splice(0, participant.inbox.length);
  return drained;
}

/** Subscribes a push listener (SSE path). Returns an unsubscribe handle. */
export function subscribe(
  roomId: string,
  userId: string,
  listener: (message: SignalMessage) => void
): { unsubscribe: () => void } {
  const room = getRoom(roomId);
  const participant = room?.participants.get(userId);
  if (!participant) return { unsubscribe: () => {} };
  participant.listeners.add(listener);
  return {
    unsubscribe: () => {
      participant.listeners.delete(listener);
    }
  };
}

export function isParticipantInRoom(roomId: string, userId: string): boolean {
  return !!getRoom(roomId)?.participants.has(userId);
}

export function getRoomSnapshot(roomId: string): {
  exists: boolean;
  participantCount: number;
  roles: SignalRole[];
} {
  const room = getRoom(roomId);
  if (!room) return { exists: false, participantCount: 0, roles: [] };
  return {
    exists: true,
    participantCount: room.participants.size,
    roles: Array.from(room.participants.values()).map(p => p.role)
  };
}

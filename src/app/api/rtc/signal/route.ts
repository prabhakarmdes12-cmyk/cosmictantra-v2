/**
 * RTC SIGNALING ROUTE — /api/rtc/signal
 *
 * Room signaling for the single 1:1 consultation call primitive:
 *   JOIN_ROOM · SDP_OFFER · SDP_ANSWER · ICE_CANDIDATE · LEAVE_ROOM
 * plus TRANSPORT_STATE (feeds INV-SABHA-002 activation), CHAT_MESSAGE
 * (ephemeral relay; never stored) and HEARTBEAT (silent-loss detection).
 *
 * Client → server: POST (message submission + own inbox drain).
 * Server → client: GET SSE stream (15s keepalive heartbeat comment).
 *
 * SECURITY (docs/CALL_SECURITY_MODEL.md §2.3):
 *  - Every message requires a valid ephemeral SabhaAccessToken (HMAC-SHA256,
 *    constant-time verification in auth.ts). Expired token → 401 AUTH_TOKEN_EXPIRED.
 *  - roomId is derived server-side from the session record; a token authorized
 *    for one room can never signal into another.
 *  - Room capacity is strictly TWO (1 DEVOTEE + 1 SCHOLAR); a third join is
 *    rejected with ROOM_CAPACITY_EXCEEDED. Customer-Care operators are routing
 *    layer only and are never admitted into a media room.
 *  - This server sees only SDP/ICE — it holds no DTLS keys and cannot decrypt
 *    SRTP media. Nothing on this path is ever recorded (VOICE_INV_007).
 */

import { NextRequest, NextResponse } from 'next/server';
import { SabhaAuthTokenEngine } from '@/lib/sabha/auth';
import { SabhaSessionStore } from '@/lib/sabha/store';
import {
  SignalMessage,
  SignalRole,
  SignalMessageType,
  drainInbox,
  heartbeat,
  isParticipantInRoom,
  joinRoom,
  leaveRoom,
  routeToPeer,
  subscribe
} from '@/lib/sabha/signaling';
import {
  onParticipantJoined,
  onParticipantLeft,
  onTransportState
} from '@/lib/sabha/freeCallEngine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROUTABLE_TYPES: SignalMessageType[] = [
  'SDP_OFFER',
  'SDP_ANSWER',
  'ICE_CANDIDATE',
  'CHAT_MESSAGE'
];

interface AuthContext {
  sessionId: string;
  roomId: string;
  userId: string;
  role: SignalRole;
}

function authorize(token: string, sessionId: string): { ctx?: AuthContext; error?: string; errorCode?: string } {
  const verification = SabhaAuthTokenEngine.verifyToken(token, sessionId || undefined);
  if (!verification.valid || !verification.payload) {
    const expired = verification.error?.toLowerCase().includes('expire');
    return { error: verification.error || 'Unauthorized.', errorCode: expired ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID' };
  }

  const { sessionId: tokenSessionId, participantId, role } = verification.payload;
  const session = SabhaSessionStore.get(tokenSessionId);
  if (!session) return { error: 'Associated consultation session does not exist.', errorCode: 'SESSION_NOT_FOUND' };
  if (!session.roomId) return { error: 'Session has no RTC room.', errorCode: 'ROOM_NOT_PROVISIONED' };
  if (sessionId && sessionId !== tokenSessionId) {
    return { error: 'Token is not authorized for the target session.', errorCode: 'ROOM_MISMATCH' };
  }

  // Routing-layer roles must NEVER enter the media plane (threat matrix §6).
  const signalRole: SignalRole | null =
    role === 'DEVOTEE' ? 'CUSTOMER' : role === 'SCHOLAR' ? 'CONSULTANT' : null;
  if (!signalRole) {
    return { error: 'This role is not permitted in a private media room.', errorCode: 'ROLE_NOT_PERMITTED' };
  }

  return { ctx: { sessionId: tokenSessionId, roomId: session.roomId, userId: participantId, role: signalRole } };
}

function sdpLike(payload: any): boolean {
  return (
    !!payload &&
    typeof payload === 'object' &&
    typeof payload.type === 'string' &&
    (payload.type === 'offer' || payload.type === 'answer' || payload.type === 'candidate' || payload.type === 'chat')
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token: string = body?.token || '';
    const sessionId: string = body?.sessionId || '';
    const type: string = body?.type || '';
    const payload: Record<string, any> = body?.payload || {};

    const auth = authorize(token, sessionId);
    if (!auth.ctx) {
      return NextResponse.json(
        { ok: false, error: auth.error, errorCode: auth.errorCode },
        { status: 401 }
      );
    }
    const { sessionId: sid, roomId, userId, role } = auth.ctx;

    switch (type as SignalMessageType) {
      case 'JOIN_ROOM': {
        const join = joinRoom({ roomId, sessionId: sid, userId, role });
        if (!join.ok) {
          return NextResponse.json(
            { ok: false, error: join.error, errorCode: join.errorCode },
            { status: join.errorCode === 'ROOM_CAPACITY_EXCEEDED' ? 409 : 410 }
          );
        }
        if (!join.rejoined) {
          onParticipantJoined(sid, userId);
        }
        return NextResponse.json({
          ok: true,
          type: 'JOIN_ROOM',
          rejoined: join.rejoined,
          peerPresent: join.peerPresent,
          peerRole: join.peerRole,
          youAre: role,
          inbox: drainInbox(roomId, userId)
        });
      }

      case 'SDP_OFFER':
      case 'SDP_ANSWER':
      case 'ICE_CANDIDATE':
      case 'CHAT_MESSAGE': {
        if (!isParticipantInRoom(roomId, userId)) {
          return NextResponse.json({ ok: false, error: 'Join the room first.', errorCode: 'NOT_IN_ROOM' }, { status: 409 });
        }
        if (!sdpLike(payload) && type !== 'ICE_CANDIDATE') {
          return NextResponse.json({ ok: false, error: 'Malformed signaling payload.', errorCode: 'BAD_PAYLOAD' }, { status: 400 });
        }
        if (type === 'CHAT_MESSAGE') {
          const text = String(payload?.text || '').slice(0, 500);
          if (!text.trim()) {
            return NextResponse.json({ ok: false, error: 'Empty chat payload.', errorCode: 'BAD_PAYLOAD' }, { status: 400 });
          }
          const delivered = routeToPeer({ type: type as SignalMessageType, roomId, sessionId: sid, fromUserId: userId, fromRole: role, payload: { type: 'chat', text } });
          return NextResponse.json({ ok: true, ...delivered, inbox: drainInbox(roomId, userId) });
        }
        const delivered = routeToPeer({ type: type as SignalMessageType, roomId, sessionId: sid, fromUserId: userId, fromRole: role, payload });
        return NextResponse.json({ ok: true, ...delivered, inbox: drainInbox(roomId, userId) });
      }

      case 'TRANSPORT_STATE': {
        // INV-SABHA-002 feed: the preserved state machine activates only on real
        // ICE connectivity reported by the peers.
        onTransportState({
          sessionId: sid,
          participantId: userId,
          iceConnectionState: String(payload?.iceConnectionState || 'new').slice(0, 20),
          selectedCandidateType: payload?.selectedCandidateType ? String(payload.selectedCandidateType).slice(0, 10) : undefined,
          roundTripTimeMs: Number.isFinite(Number(payload?.roundTripTimeMs)) ? Number(payload.roundTripTimeMs) : undefined
        });
        return NextResponse.json({ ok: true, inbox: drainInbox(roomId, userId) });
      }

      case 'HEARTBEAT': {
        heartbeat(roomId, userId);
        return NextResponse.json({ ok: true, inbox: drainInbox(roomId, userId) });
      }

      case 'LEAVE_ROOM': {
        const reason = String(payload?.reason || 'CALL_ENDED').slice(0, 40);
        const left = leaveRoom({ roomId, userId, reason });
        const ended = onParticipantLeft({ sessionId: sid, participantId: userId, reason });
        return NextResponse.json({ ok: true, ...left, durationSeconds: ended.durationSeconds, inbox: [] });
      }

      default:
        return NextResponse.json({ ok: false, error: `Unknown signaling type "${type}".`, errorCode: 'BAD_TYPE' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Signal POST failed:', error);
    return NextResponse.json({ ok: false, error: 'SIGNAL_PROCESSING_FAILED' }, { status: 500 });
  }
}

/**
 * SSE stream: pushes the participant's inbox in real time with a 15s keepalive
 * heartbeat. The stream is read-only (no room mutation); disconnects do NOT
 * imply a hang-up — heartbeat timeout governs silent-loss eviction.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const sessionId = url.searchParams.get('sessionId') || '';

    const auth = authorize(token, sessionId);
    if (!auth.ctx) {
      return new Response(
        `event: signal_error\ndata: ${JSON.stringify({ errorCode: auth.errorCode, error: auth.error })}\n\n`,
        { status: 401, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }
    const { sessionId: sid, roomId, userId } = auth.ctx;

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let closed = false;
        const send = (data: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            closed = true;
          }
        };

        // Initial room-state snapshot so the client can reconcile instantly.
        send(`event: room_state\ndata: ${JSON.stringify({ sessionId: sid, connected: isParticipantInRoom(roomId, userId) })}\n\n`);

        const { unsubscribe } = subscribe(roomId, userId, (message: SignalMessage) => {
          send(`event: signal\ndata: ${JSON.stringify(message)}\n\n`);
        });

        // 15s keepalive heartbeat (audit item #19 — silent network loss detection).
        const keepalive = setInterval(() => {
          if (closed) return;
          send(`: keepalive ${Date.now()}\n\n`);
          if (!isParticipantInRoom(roomId, userId)) {
            // Participant evicted (heartbeat timeout elsewhere) — tell the client.
            send(`event: signal\ndata: ${JSON.stringify({
              id: `evict-${Date.now()}`,
              type: 'LEAVE_ROOM',
              roomId,
              sessionId: sid,
              fromUserId: userId,
              fromRole: 'CUSTOMER',
              timestamp: Date.now(),
              payload: { reason: 'HEARTBEAT_TIMEOUT_SELF' }
            } as SignalMessage)}\n\n`);
          }
        }, 15_000);

        const cleanup = () => {
          if (closed) return;
          closed = true;
          clearInterval(keepalive);
          unsubscribe();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        };

        req.signal.addEventListener('abort', cleanup);
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error: any) {
    console.error('Signal SSE failed:', error);
    return new Response('event: signal_error\ndata: {"errorCode":"SSE_FAILED"}\n\n', { status: 500 });
  }
}

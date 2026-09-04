# 🔐 SECURE FREE CALL ENGINE — PHASE 1 IMPLEMENTATION REPORT
**Branch lineage**: `feat/secure-call-engine-v1` (from `main` @ `81e0acb`)
**Standards**: docs/CALL_ENGINE_FORENSIC_AUDIT.md · docs/CALL_SECURITY_MODEL.md (RFC 3711/5766/8827)
**Date**: September 4, 2026

---

## 1. What Was Built (Forensic Audit → Implementation Map)

| Audit Finding | Status | Implementation |
|---|---|---|
| #1 WebRTC Client Engine (mocked) | ✅ **REPLACED** | `src/hooks/useWebRTC.ts` + native media room (`src/app/consultation/room/[id]/page.tsx`) — the 1.5s `setTimeout` simulation is gone; `<audio>`/`<video playsInline autoPlay>` bind real `MediaStream`s. |
| #2 Signaling Server | ✅ **NEW** | `src/app/api/rtc/signal` — POST (send + inbox drain) + **SSE GET** (server→client push, 15s keepalive), in-memory room pub/sub in `src/lib/sabha/signaling.ts`. Messages: `JOIN_ROOM`, `SDP_OFFER`, `SDP_ANSWER`, `ICE_CANDIDATE`, `LEAVE_ROOM` (+ `TRANSPORT_STATE`, `CHAT_MESSAGE`, `HEARTBEAT`). |
| #3 STUN Configuration | ✅ | Google public STUN (`stun:stun.l.google.com:19302`, `stun1`) always served. |
| #4/#5 TURN + Credential Lifecycle | ✅ | `src/app/api/rtc/turn-credentials` — RFC 5766 ephemeral HMAC-SHA1 REST credentials (30-min TTL, coturn-compatible). Enable by setting `TURN_URLS` + `TURN_STATIC_AUTH_SECRET` env. |
| #6 Session Authorization | ✅ wired | Every signaling/TURN request carries the preserved `SabhaAuthTokenEngine` HMAC-SHA256 token (constant-time verify, expiry, room binding). |
| #7 State Machine INV-SABHA-002 | ✅ wired | Peers report ICE state via `TRANSPORT_STATE`; the preserved `SabhaStateMachine` performs `START_CONNECTING` → `ACTIVATE_SESSION` **only** when ICE truly reports `connected/completed`. The engine never mutates `state` directly. |
| #13/#14 Mute/Cam Controls | ✅ | Mute toggles live **audio** tracks; camera toggle enables/disables or **acquires** video tracks mid-call with glare-safe renegotiation. |
| #16 Disconnect & Hangup | ✅ | `LEAVE_ROOM` → `pc.close()`, all tracks stopped (volatile memory destroyed), peer notified, duration logged server-side. Tab-close sends `sendBeacon` hang-up. |
| #17/#18 ICE Restart / Network Switch | ✅ | `pc.restartIce()` on `disconnected` → RECONNECTING state; failed → FAILED + session `MARK_CONNECTION_FAILED` via the state machine. |
| #19 Heartbeat | ✅ | 15s client heartbeat; silent participants evicted at 45s with peer notification. |
| #20/#21 Ops Console | ✅ wired | `src/app/admin/sabha-ops` now reads the **server-authoritative** session vault (5s polling) and executes assign/dispatch/PSTN/grace/refund through server APIs. |
| #24 Zero Recording | ✅ enforced | No `MediaRecorder`, no RTP dumps, no storage. `consent.optionalRecording/Transcription` hard-set `false` at creation. Closing panel states exactly what is retained: duration + telemetry metadata only. |

## 2. The One Call Primitive (Architectural Invariant)

There is **no** `CustomerCareCall` / `DirectPanditCall` split. Exactly one primitive:
`ConsultationSession` (preserved types) + `initiationMode`:

```
CARE_ASSISTED (TEST A):
  /consultation/pandits "केयर-सहायता मुफ्त कॉल"
    → POST /api/sabha/sessions {initiationMode:'CARE_ASSISTED'}   [queue: UNASSIGNED]
    → sabha-ops console: assign verified Pandit                    [ASSIGNED]
    → sabha-ops console: dispatch (Pandit ring link issued)        [DISPATCHED]
    → both join room → operator has NO room presence → 1:1 DTLS-SRTP call
    → end → duration logged

DIRECT (TEST B):
  /consultation/pandits "मुफ्त कॉल करें (Free Call)" on a profile
    → POST /api/sabha/sessions {initiationMode:'DIRECT', consultantId}
    → Pandit workspace panel rings → Accept → room
    → 1:1 DTLS-SRTP call with ZERO Care touchpoints
    → end → duration logged
```

Customer Care is strictly the **routing/operations layer** — the signaling route
admits only `DEVOTEE` + `SCHOLAR` roles (max 1+1; third join → `ROOM_CAPACITY_EXCEEDED`).

## 3. Security Posture (CALL_SECURITY_MODEL.md Compliance)

- **Zero PII**: directories/room views/listings expose display names only. Phone
  numbers never enter the free-call path (`phoneMasked` is a static masked literal).
- **Unpredictable rooms**: `roomId = ct-room-<UUIDv4>`; rooms are not joinable by
  URL guessing — a valid participant token is mandatory (room page shows an
  honest access-required gate without one).
- **Token discipline**: customer tokens are returned only to the requesting
  customer; consultant tokens only to the care-dispatch/pandit-workspace surface.
  The pandit view provably never contains the customer token (QA-asserted).
- **Ephemeral TURN**: `username = <unixExpiry>:<participantId>`,
  `password = base64(HMAC-SHA1(username, TURN_STATIC_AUTH_SECRET))` — static
  secret never leaves the server; forged tokens → 401 (QA-asserted).
- **Server cannot decrypt media**: signaling sees SDP/ICE only; SRTP keys are
  negotiated browser-to-browser via DTLS.
- **Free invariant**: `payment.amountInr = 0`; `isVerified: true` denotes the
  server-verified *zero-cost entitlement* that satisfies the preserved
  `START_CONNECTING` guard. No payment/wallet/per-minute deduction exists; the
  room's "+10 मिनट" button adds **free** entitlement (`DURATION_EXTENDED_FREE`).

### Environment (production TURN)
```
TURN_URLS=turn:turn.your-domain.in:3478?transport=udp,turns:turn.your-domain.in:5349?transport=tcp
TURN_STATIC_AUTH_SECRET=<openssl rand -hex 32>   # must equal coturn's static-auth-secret
```
Without these, clients run STUN-only and the API reports `turnConfigured:false`
(honest posture; same-NAT/loopback calls still connect).

## 4. Qualification Evidence

### API-level harness (both tests, 42 assertions — all green)
Simulates both real peers over HTTP: session creation → join/ring → offer/answer/ICE
relay → INV-SABHA-002 activation (`READY → CONNECTING → ACTIVE`) → ephemeral chat →
leave → **duration logged** (`endedAt` + `durationSeconds` + `CALL_ENDED` audit),
plus guard rails (forged token 401, unknown consultant 400, token isolation,
capacity, preserved PSTN handover engine).

### Browser-level test (committed, run where Chromium CDN is reachable)
`tests/e2e-free-call-engine.spec.ts` — two real browser contexts, fake mic/cam,
genuine `RTCPeerConnection` through the production UI:
```bash
npm run dev -- --port 4311 &
BASE_URL=http://localhost:4311 npx playwright test tests/e2e-free-call-engine.spec.ts
```
Verifies: directory → Free Call → room; workspace ring → accept; both sides
`CONNECTED`; `<audio>` bound to a real remote `MediaStream`; mute control live;
ended panel with zero-recording statement; duration in ops view.

## 5. File Inventory (Phase 1)

**New — server**: `src/lib/sabha/signaling.ts`, `src/lib/sabha/freeCallEngine.ts`,
`src/lib/sabha/directory.ts`, `src/app/api/rtc/turn-credentials/route.ts`,
`src/app/api/rtc/signal/route.ts`, `src/app/api/sabha/sessions/route.ts`,
`src/app/api/sabha/sessions/[id]/route.ts`, `…/[id]/assign/route.ts`,
`…/[id]/dispatch/route.ts`, `…/[id]/extend/route.ts`, `…/[id]/ops/route.ts`,
`src/app/api/sabha/directory/route.ts`
**New — client**: `src/hooks/useWebRTC.ts`, `src/app/consultation/pandits/page.tsx`,
`src/components/sabha/IncomingFreeCallsPanel.tsx`
**Rewired (mocks removed)**: `src/app/consultation/room/[id]/page.tsx`,
`src/app/admin/sabha-ops/page.tsx`, `src/app/pandit/workspace/page.tsx` (panel only)
**Untouched (preserved, verified by QA)**: `types.ts`, `stateMachine.ts`, `auth.ts`,
`telephonyHandover.ts`, `store.ts`, `orchestrator.ts`, `timer.ts`, `events.ts`,
`costLedger.ts`, `paymentEntitlement.ts`

## 6. Phase-1 Trust Notes (documented pragmisms)

1. **Pandit/ops surfaces are console-trusted** (consistent with the existing
   repo posture). SSO-bound identities and WhatsApp ring delivery land in Phase 2.
2. **Signaling store is in-memory** (single-node V1) — matches the existing
   `SabhaSessionStore` convention; multi-region needs a Redis/Postgres adapter behind
   the same interfaces.
3. WebRTC requires a **secure context** (HTTPS or localhost) — production is served
   over TLS per `next.config.mjs` headers; `Permissions-Policy: camera=(self), microphone=(self)`.

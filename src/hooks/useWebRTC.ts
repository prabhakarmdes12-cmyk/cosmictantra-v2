'use client';

/**
 * useWebRTC — CosmicTantra Secure Free Call Engine (Phase 1) client media hook.
 *
 * Owns the entire native WebRTC media pipeline for the single 1:1 call primitive:
 *   - getUserMedia capture (mic always; camera on demand / video mode)
 *   - RTCPeerConnection with STUN (Google public) + ephemeral TURN (RFC 5766 REST)
 *   - Signaling over /api/rtc/signal: JOIN_ROOM, SDP_OFFER, SDP_ANSWER,
 *     ICE_CANDIDATE, LEAVE_ROOM (+ TRANSPORT_STATE heartbeat chat)
 *   - SSE push delivery with automatic poll-drain fallback (1.2s) and 15s
 *     keepalive heartbeat for silent network-loss detection
 *   - Perfect-negotiation (polite = CONSULTANT) so mid-call camera-add/mute
 *     renegotiation is glare-safe
 *   - ICE restart on disconnect; TRANSPORT_STATE reporting feeds INV-SABHA-002
 *
 * STRICT ZERO-RECORDING (VOICE_INV_007): this hook NEVER uses MediaRecorder,
 * never persists frames or audio, and destroys every track on teardown.
 * It also holds NO PII — only opaque session ids and ephemeral tokens.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type WebRTCConnectionState =
  | 'IDLE'
  | 'ACQUIRING_MEDIA'
  | 'RINGING'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ENDED'
  | 'FAILED';

export type WebRTCRole = 'CUSTOMER' | 'CONSULTANT';

export interface WebRTCChatEntry {
  id: string;
  sender: 'SELF' | 'PEER';
  text: string;
  timestamp: number;
}

export interface WebRTCEndedInfo {
  reason: string;
  durationSeconds?: number;
}

export interface UseWebRTCOptions {
  sessionId: string;
  /** Ephemeral SabhaAccessToken (HMAC-SHA256) issued for THIS participant. */
  token: string;
  role: WebRTCRole;
  mode: 'voice' | 'video';
  autoJoin?: boolean;
  /** Ringing patience before surfacing "no answer" (does not abort the call). */
  ringTimeoutMs?: number;
}

export interface UseWebRTCApi {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: WebRTCConnectionState;
  peerPresent: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  hasVideoTrack: boolean;
  error: string | null;
  endedInfo: WebRTCEndedInfo | null;
  iceConnectionState: string;
  selectedCandidateType: string | null;
  roundTripTimeMs: number | null;
  chatMessages: WebRTCChatEntry[];
  join: () => Promise<void>;
  leave: (reason?: string) => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => Promise<void>;
  sendChat: (text: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Signaling client
// ---------------------------------------------------------------------------

interface SignalEnvelope {
  id: string;
  type: string;
  roomId: string;
  sessionId: string;
  fromUserId: string;
  fromRole: string;
  timestamp: number;
  payload?: Record<string, any>;
}

async function postSignal(
  sessionId: string,
  token: string,
  type: string,
  payload?: Record<string, any>
): Promise<{ ok: boolean; delivered?: boolean; peerPresent?: boolean; durationSeconds?: number; inbox?: SignalEnvelope[]; errorCode?: string; error?: string }> {
  try {
    const res = await fetch('/api/rtc/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, token, type, payload }),
      cache: 'no-store'
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data?.ok !== false, ...data };
  } catch {
    return { ok: false };
  }
}

async function fetchIceServers(
  sessionId: string,
  token: string
): Promise<{ iceServers: RTCIceServer[]; recommendedIceTransportPolicy: RTCIceTransportPolicy }> {
  try {
    const res = await fetch('/api/rtc/turn-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, token }),
      cache: 'no-store'
    });
    const data = await res.json();
    if (data?.ok && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      return {
        iceServers: data.iceServers as RTCIceServer[],
        recommendedIceTransportPolicy: (data.recommendedIceTransportPolicy === 'relay'
          ? 'relay'
          : 'all') as RTCIceTransportPolicy
      };
    }
  } catch {
    // Fall through to STUN-only default.
  }
  // Absolute minimum viable traversal posture (dev): Google public STUN.
  return {
    iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }],
    recommendedIceTransportPolicy: 'all'
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWebRTC(options: UseWebRTCOptions): UseWebRTCApi {
  const { sessionId, token, role, mode, autoJoin = false, ringTimeoutMs = 45_000 } = options;

  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>('IDLE');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerPresent, setPeerPresent] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(mode === 'video');
  const [hasVideoTrack, setHasVideoTrack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endedInfo, setEndedInfo] = useState<WebRTCEndedInfo | null>(null);
  const [iceConnectionState, setIceConnectionState] = useState('new');
  const [selectedCandidateType, setSelectedCandidateType] = useState<string | null>(null);
  const [roundTripTimeMs, setRoundTripTimeMs] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<WebRTCChatEntry[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const joiningRef = useRef(false);

  // Perfect negotiation state (polite = CONSULTANT).
  const politeRef = useRef(role === 'CONSULTANT');
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const receivedRemoteDescRef = useRef(false);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const sseOpenRef = useRef(false);
  const lastHeartbeatSentRef = useRef(0);
  const startedAtRef = useRef(0); // monotonic ms when connect began (ring timeout)
  const selectedCandidateTypeRef = useRef<string | null>(null);
  const rttRef = useRef<number | null>(null);
  const roleRef = useRef<WebRTCRole>(role);
  roleRef.current = role;

  /** Incremented after a successful join so the delivery effect subscribes exactly once. */
  const [joinEpoch, setJoinEpoch] = useState(0);

  const stateRef = useRef<WebRTCConnectionState>('IDLE');
  const setState = useCallback((next: WebRTCConnectionState) => {
    stateRef.current = next;
    setConnectionState(next);
  }, []);

  // -------------------------------------------------------------------------
  // Transport state reporting (feeds server-side INV-SABHA-002 activation)
  // -------------------------------------------------------------------------
  const reportTransportState = useCallback(
    (state: string) => {
      if (!joinedRef.current) return;
      postSignal(sessionId, token, 'TRANSPORT_STATE', {
        iceConnectionState: state,
        selectedCandidateType: selectedCandidateTypeRef.current || undefined,
        roundTripTimeMs: rttRef.current ?? undefined
      });
    },
    [sessionId, token]
  );

  /** One-shot getStats sample once media flows (candidate type + RTT). */
  const sampleConnectionStats = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await new Promise(r => setTimeout(r, 2000));
      if (pcRef.current !== pc || pc.connectionState === 'closed') return;
      const stats = await pc.getStats();
      let pair: any = null;
      stats.forEach((report: any) => {
        if (report.type === 'candidate-pair' && (report.selected || report.nominated || report.state === 'succeeded')) {
          pair = report;
        }
      });
      if (pair) {
        const local: any = pair.localCandidateId ? stats.get(pair.localCandidateId) : null;
        if (local?.candidateType) {
          selectedCandidateTypeRef.current = local.candidateType;
          setSelectedCandidateType(local.candidateType);
        }
        if (Number.isFinite(pair.currentRoundTripTime)) {
          rttRef.current = Math.round(pair.currentRoundTripTime * 1000);
          setRoundTripTimeMs(rttRef.current);
        }
        reportTransportState(pc.iceConnectionState || 'connected');
      }
    } catch {
      // Telemetry is best-effort; never disturb the media path.
    }
  }, [reportTransportState]);

  // -------------------------------------------------------------------------
  // Peer connection factory
  // -------------------------------------------------------------------------
  const handlePeerLeft = useCallback(
    async (reason: string, durationSeconds?: number) => {
      if (stateRef.current === 'ENDED') return;
      setPeerPresent(false);
      setEndedInfo({ reason, durationSeconds });
      setState('ENDED');
      // Full local teardown — tracks are volatile and destroyed immediately.
      const pc = pcRef.current;
      pcRef.current = null;
      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onnegotiationneeded = null;
        pc.oniceconnectionstatechange = null;
        try {
          pc.close();
        } catch {
          /* noop */
        }
      }
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setHasVideoTrack(false);
    },
    [setState]
  );

  const ensurePeerConnection = useCallback(
    async (iceServers: RTCIceServer[], transportPolicy: RTCIceTransportPolicy): Promise<RTCPeerConnection> => {
      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection({
        iceServers,
        iceTransportPolicy: transportPolicy,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      });
      pcRef.current = pc;

      pc.onicecandidate = event => {
        if (event.candidate) {
          postSignal(sessionId, token, 'ICE_CANDIDATE', { type: 'candidate', candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = event => {
        const [stream] = event.streams;
        if (stream) {
          setRemoteStream(stream);
        } else {
          // Fallback: bind the bare track into a fresh volatile stream.
          const s = new MediaStream([event.track]);
          setRemoteStream(s);
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          // CONSULTANT never initiates the first negotiation; it answers.
          if (roleRef.current === 'CONSULTANT' && !receivedRemoteDescRef.current) return;
          makingOfferRef.current = true;
          await pc.setLocalDescription();
          if (pc.localDescription) {
            const res = await postSignal(sessionId, token, 'SDP_OFFER', {
              type: 'offer',
              sdp: pc.localDescription.sdp
            });
            if (res?.delivered && !receivedRemoteDescRef.current) {
              // Initial offer successfully routed — transition RINGING → CONNECTING.
              if (stateRef.current === 'RINGING') setState('CONNECTING');
            }
          }
        } catch (err) {
          console.error('Negotiation failed', err);
        } finally {
          makingOfferRef.current = false;
        }
      };

      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        setIceConnectionState(s);
        switch (s) {
          case 'connected':
          case 'completed':
            setState('CONNECTED');
            setError(null);
            reportTransportState(s);
            void sampleConnectionStats();
            break;
          case 'disconnected':
            if (stateRef.current === 'CONNECTED') {
              setState('RECONNECTING');
              reportTransportState(s);
              try {
                pc.restartIce();
              } catch {
                /* older engines */
              }
            }
            break;
          case 'failed':
            reportTransportState(s);
            setState('FAILED');
            setError('मीडिया कनेक्शन विफल (ICE failed). कृपया पुनः प्रयास करें या नेटवर्क बदलें।');
            break;
          case 'closed':
            if (stateRef.current !== 'ENDED') setState('ENDED');
            break;
          default:
            break;
        }
      };

      return pc;
    },
    [sessionId, token, reportTransportState, sampleConnectionStats, setState]
  );

  // -------------------------------------------------------------------------
  // Incoming signal processing
  // -------------------------------------------------------------------------
  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const queued = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        if (!ignoreOfferRef.current) console.warn('ICE candidate add failed');
      }
    }
  }, []);

  const processSignal = useCallback(
    async (message: SignalEnvelope) => {
      const pc = pcRef.current;
      if (!pc) return;

      switch (message.type) {
        case 'JOIN_ROOM': {
          // payload.event === 'PEER_JOINED'
          setPeerPresent(true);
          if (stateRef.current === 'RINGING') setState('CONNECTING');
          break;
        }

        case 'SDP_OFFER': {
          const offerCollision =
            makingOfferRef.current || pc.signalingState !== 'stable';
          ignoreOfferRef.current = !politeRef.current && offerCollision;
          if (ignoreOfferRef.current) return;

          setPeerPresent(true);
          await pc.setRemoteDescription({
            type: 'offer',
            sdp: message.payload?.sdp
          } as RTCSessionDescriptionInit);
          receivedRemoteDescRef.current = true;
          await flushPendingIce();
          if (stateRef.current === 'RINGING') setState('CONNECTING');

          await pc.setLocalDescription(); // Creates the answer implicitly.
          if (pc.localDescription) {
            await postSignal(sessionId, token, 'SDP_ANSWER', {
              type: 'answer',
              sdp: pc.localDescription.sdp
            });
          }
          break;
        }

        case 'SDP_ANSWER': {
          if (pc.signalingState === 'have-local-offer' || pc.signalingState === 'stable') {
            try {
              await pc.setRemoteDescription({
                type: 'answer',
                sdp: message.payload?.sdp
              } as RTCSessionDescriptionInit);
              receivedRemoteDescRef.current = true;
              await flushPendingIce();
            } catch (err) {
              console.error('Failed to apply answer', err);
            }
          }
          break;
        }

        case 'ICE_CANDIDATE': {
          const candidateInit = message.payload?.candidate as RTCIceCandidateInit | undefined;
          if (!candidateInit) return;
          if (!receivedRemoteDescRef.current) {
            pendingIceRef.current.push(candidateInit); // Buffer until remote description exists.
          } else {
            try {
              await pc.addIceCandidate(candidateInit);
            } catch {
              if (!ignoreOfferRef.current) console.warn('ICE candidate add failed');
            }
          }
          break;
        }

        case 'LEAVE_ROOM': {
          await handlePeerLeft(
            String(message.payload?.reason || 'PEER_LEFT'),
            message.payload?.durationSeconds
          );
          break;
        }

        case 'CHAT_MESSAGE': {
          const text = String(message.payload?.text || '').slice(0, 500);
          if (text) {
            setChatMessages(prev => [
              ...prev.slice(-80),
              { id: message.id, sender: 'PEER', text, timestamp: message.timestamp || Date.now() }
            ]);
          }
          break;
        }

        default:
          break;
      }
    },
    [sessionId, token, flushPendingIce, handlePeerLeft, setState]
  );

  // -------------------------------------------------------------------------
  // Inbox delivery: SSE push with poll-drain fallback + 15s heartbeat
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!joinedRef.current) return;
    if (!sessionId || !token) return;

    // SSE push channel (tokens travel in query params — EventSource cannot set headers).
    let es: EventSource | null = null;
    try {
      es = new EventSource(
        `/api/rtc/signal?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`
      );
      es.addEventListener('signal', event => {
        sseOpenRef.current = true;
        try {
          const message = JSON.parse((event as MessageEvent).data) as SignalEnvelope;
          void processSignal(message);
        } catch {
          /* malformed frame — ignore */
        }
      });
      es.addEventListener('room_state', () => {
        sseOpenRef.current = true;
      });
      es.onerror = () => {
        sseOpenRef.current = false; // Poll-drain fallback keeps signaling alive.
      };
    } catch {
      sseOpenRef.current = false;
    }

    // Heartbeat + poll-drain: 1.2s cadence when SSE is down, 15s keepalive when up.
    const drainTimer = setInterval(() => {
      if (!joinedRef.current) return;
      const now = Date.now();
      if (!sseOpenRef.current || now - lastHeartbeatSentRef.current >= 15_000) {
        lastHeartbeatSentRef.current = now;
        void postSignal(sessionId, token, 'HEARTBEAT').then(res => {
          if (res?.ok && Array.isArray(res.inbox)) {
            res.inbox.forEach(m => void processSignal(m));
          }
        });
      }
    }, 1_200);

    // Ringing patience: surface "no answer" guidance without aborting the room.
    const ringTimer = ringTimeoutMs
      ? setTimeout(() => {
          if (stateRef.current === 'RINGING') {
            setError('विद्वान् जी अभी तक उत्तर नहीं दे रहे। कुछ और क्षण प्रतीक्षा करें या कॉल रद्द करें।');
          }
        }, ringTimeoutMs)
      : null;

    return () => {
      es?.close();
      sseOpenRef.current = false;
      clearInterval(drainTimer);
      if (ringTimer) clearTimeout(ringTimer);
    };
  }, [sessionId, token, processSignal, ringTimeoutMs, joinEpoch]);

  // -------------------------------------------------------------------------
  // Lifecycle: join / leave
  // -------------------------------------------------------------------------
  const join = useCallback(async () => {
    if (joiningRef.current || joinedRef.current) return;
    joiningRef.current = true;
    setError(null);

    try {
      setState('ACQUIRING_MEDIA');

      // 1. Capture media (mic mandatory; camera only in video mode).
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video:
            mode === 'video'
              ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
              : false
        });
      } catch (err: any) {
        const name = err?.name || '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          throw new Error('माइक/कैमरा अनुमति अस्वीकृत। ब्राउज़र सेटिंग्स में अनुमति देकर पुनः प्रयास करें।');
        }
        if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          // No camera (or video unsupported) — degrade gracefully to audio-only.
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsCameraOn(false);
        } else {
          throw new Error('मीडिया डिवाइस प्रारंभ नहीं हो सका।');
        }
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setHasVideoTrack(stream.getVideoTracks().length > 0);
      setIsCameraOn(stream.getVideoTracks().some(t => t.enabled));

      // 2. ICE servers: Google public STUN + ephemeral TURN (RFC 5766 REST).
      const { iceServers, recommendedIceTransportPolicy } = await fetchIceServers(sessionId, token);

      // 3. Peer connection + local tracks.
      const pc = await ensurePeerConnection(iceServers, recommendedIceTransportPolicy);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 4. Enter the signaling room (capacity strictly 1 CUSTOMER + 1 CONSULTANT).
      const res = await postSignal(sessionId, token, 'JOIN_ROOM');
      if (!res.ok) {
        throw new Error(res.errorCode === 'ROOM_CAPACITY_EXCEEDED'
          ? 'यह कक्ष पहले ही दो स्वीकृत सहभागियों से भर चुका है।'
          : res.error || 'सिग्नलिंग कक्ष में प्रवेश विफल।');
      }

      joinedRef.current = true;
      setPeerPresent(!!res.peerPresent);
      startedAtRef.current = Date.now();

      if (res.peerPresent) {
        setState('CONNECTING');
        // Drain any messages queued while we were joining.
        (res.inbox || []).forEach(m => void processSignal(m));
      } else {
        setState('RINGING');
      }

      // 5. Customer initiates the initial offer as soon as the peer is present.
      if (roleRef.current === 'CUSTOMER' && res.peerPresent && !makingOfferRef.current) {
        makingOfferRef.current = true;
        try {
          await pc.setLocalDescription();
          if (pc.localDescription) {
            await postSignal(sessionId, token, 'SDP_OFFER', {
              type: 'offer',
              sdp: pc.localDescription.sdp
            });
          }
        } finally {
          makingOfferRef.current = false;
        }
      }

      // Subscribe the delivery layer (SSE + heartbeat drain) exactly once.
      setJoinEpoch(e => e + 1);
    } catch (err: any) {
      setError(err?.message || 'कॉल प्रारंभ विफल।');
      setState('FAILED');
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      try {
        pcRef.current?.close();
      } catch {
        /* noop */
      }
      pcRef.current = null;
    } finally {
      joiningRef.current = false;
    }
  }, [sessionId, token, mode, ensurePeerConnection, processSignal, setState]);

  const leave = useCallback(
    async (reason: string = 'CALL_ENDED') => {
      if (leavingRef.current) return;
      leavingRef.current = true;

      let durationSeconds: number | undefined;
      if (joinedRef.current) {
        const res = await postSignal(sessionId, token, 'LEAVE_ROOM', { reason });
        durationSeconds = res?.durationSeconds;
      }
      joinedRef.current = false;

      await handlePeerLeft(reason, durationSeconds);
    },
    [sessionId, token, handlePeerLeft]
  );

  // Tab close / reload while in-call → best-effort hang-up so the peer
  // is released and the authoritative duration gets logged.
  useEffect(() => {
    const handleUnload = () => {
      if (!joinedRef.current || !pcRef.current) return;
      const body = JSON.stringify({
        sessionId,
        token,
        type: 'LEAVE_ROOM',
        payload: { reason: 'TAB_CLOSED' }
      });
      try {
        navigator.sendBeacon?.('/api/rtc/signal', new Blob([body], { type: 'application/json' }));
      } catch {
        /* best effort */
      }
    };
    window.addEventListener('pagehide', handleUnload);
    return () => window.removeEventListener('pagehide', handleUnload);
  }, [sessionId, token]);

  // Unmount teardown — zero-recording invariant: destroy all volatile tracks.
  useEffect(() => {
    return () => {
      joinedRef.current = false;
      const pc = pcRef.current;
      pcRef.current = null;
      if (pc) {
        try {
          pc.close();
        } catch {
          /* noop */
        }
      }
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Media controls
  // -------------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) return;
    // If any track is live we are about to mute; otherwise we unmute.
    const shouldMute = tracks.some(t => t.enabled);
    tracks.forEach(t => {
      t.enabled = !shouldMute;
    });
    setIsMuted(shouldMute);
  }, []);

  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    const pc = pcRef.current;
    if (!stream || !pc) return;

    const existingVideo = stream.getVideoTracks();
    if (existingVideo.length > 0) {
      const shouldDisable = existingVideo.some(t => t.enabled);
      existingVideo.forEach(t => {
        t.enabled = !shouldDisable;
      });
      setIsCameraOn(!shouldDisable);
      return;
    }

    // No video track yet (voice mode) — acquire camera and renegotiate.
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      const [videoTrack] = cameraStream.getVideoTracks();
      if (!videoTrack) return;
      stream.addTrack(videoTrack);
      pc.addTrack(videoTrack, stream);
      setHasVideoTrack(true);
      setIsCameraOn(true);
      // onnegotiationneeded fires → offer → peer answers (perfect negotiation).
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setError('कैमरा अनुमति अस्वीकृत।');
      } else {
        setError('कैमरा उपलब्ध नहीं है।');
      }
    }
  }, []);

  const sendChat = useCallback(
    async (text: string) => {
      const trimmed = text.trim().slice(0, 500);
      if (!trimmed || !joinedRef.current) return;
      setChatMessages(prev => [
        ...prev.slice(-80),
        { id: `self-${Date.now()}`, sender: 'SELF', text: trimmed, timestamp: Date.now() }
      ]);
      await postSignal(sessionId, token, 'CHAT_MESSAGE', { type: 'chat', text: trimmed });
    },
    [sessionId, token]
  );

  // Auto-join (customer side) when requested.
  useEffect(() => {
    if (autoJoin && connectionState === 'IDLE') {
      void join();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoJoin]);

  return {
    localStream,
    remoteStream,
    connectionState,
    peerPresent,
    isMuted,
    isCameraOn,
    hasVideoTrack,
    error,
    endedInfo,
    iceConnectionState,
    selectedCandidateType,
    roundTripTimeMs,
    chatMessages,
    join,
    leave,
    toggleMute,
    toggleCamera,
    sendChat
  };
}

'use client';

/**
 * SECURE FREE CONSULTATION ROOM — native WebRTC (Phase 1).
 *
 * Replaces the previous 1.5s setTimeout client-simulation with the real media
 * engine (src/hooks/useWebRTC.ts):
 *   - getUserMedia capture → RTCPeerConnection → <audio>/<video playsInline autoPlay>
 *   - Mute/unmute toggles AUDIO tracks; camera toggle toggles VIDEO tracks
 *   - Real peer connection state: CONNECTING → CONNECTED → ENDED (INV-SABHA-002:
 *     the server activates the session only when ICE actually connects)
 *   - Entry points (ONE primitive, two routings): ?role=devotee joins via
 *     initiationMode CARE_ASSISTED or DIRECT sessions alike — the media engine
 *     is identical; Customer Care is routing-only and never joins this room.
 *
 * STRICT INVARIANTS HONORED IN UI:
 *   - FREE: the extension button adds FREE duration — no payment, no wallet,
 *     no per-minute deduction exists on this surface.
 *   - ZERO-RECORDING: no MediaRecorder anywhere; streams live only in volatile
 *     buffers and are destroyed on teardown. The closing panel states plainly
 *     that only the duration is logged.
 *   - ZERO PII: peer labels use display names only; the security banner states
 *     the technically accurate DTLS-SRTP posture (no marketing crypto claims).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Clock,
  Send,
  Lock,
  Layers,
  ArrowLeft,
  ShieldCheck,
  Radio,
  UserRound,
  PhoneIncoming,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';
import { useWebRTC, WebRTCChatEntry } from '@/hooks/useWebRTC';

interface RoomView {
  sessionId: string;
  roomId: string;
  initiationMode: 'CARE_ASSISTED' | 'DIRECT' | 'SCHEDULED';
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
}

interface ChatMessage {
  id: string;
  sender: 'SELF' | 'PEER' | 'SYSTEM';
  text: string;
  timestamp: number;
}

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function EncryptedConsultationRoom() {
  const params = useParams();
  const searchParams = useSearchParams();

  const sessionId = (params?.id as string) || '';
  const urlToken = searchParams?.get('token') || '';
  const initialMode = (searchParams?.get('mode') as 'voice' | 'video' | 'chat') || 'voice';
  const roleParam = (searchParams?.get('role') as 'devotee' | 'pandit') || 'devotee';
  const isPandit = roleParam === 'pandit';

  const autoAccept = searchParams?.get('autoAccept') === '1';
  const [activeMode, setActiveMode] = useState<'voice' | 'video'>(initialMode === 'video' ? 'video' : 'voice');
  const [accepted, setAccepted] = useState(!isPandit || autoAccept); // Pandit auto-accepts if coming from workspace accept button
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showKundaliDrawer, setShowKundaliDrawer] = useState(true);
  const [sessionView, setSessionView] = useState<RoomView | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [extendBusy, setExtendBusy] = useState(false);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------
  // Real WebRTC engine — the single call primitive for BOTH entry paths.
  // ---------------------------------------------------------------------
  const webrtc = useWebRTC({
    sessionId,
    token: urlToken,
    role: isPandit ? 'CONSULTANT' : 'CUSTOMER',
    mode: activeMode,
    autoJoin: (accepted || autoAccept || !isPandit) && !!urlToken,
    ringTimeoutMs: 45_000
  });

  const {
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
  } = webrtc;

  const handleAccept = useCallback(() => {
    chitiSensory.playTick();
    setAccepted(true);
    void join();
  }, [join]);

  const handleDecline = useCallback(() => {
    chitiSensory.playTick();
    void leave('DECLINED');
    setAccepted(false);
  }, [leave]);

  // ---------------------------------------------------------------------
  // Session context + server-authoritative duration view
  // ---------------------------------------------------------------------
  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/sabha/sessions/${sessionId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) setSessionView(data.view as RoomView);
    } catch {
      /* display-only failure */
    }
  }, [sessionId]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession, connectionState]);

  // Countdown strictly from server timestamps (entitlement + free extensions).
  useEffect(() => {
    if (connectionState !== 'CONNECTED' || !sessionView?.startedAt) return;
    const tick = () => {
      const total = sessionView.entitledDurationSeconds + sessionView.extensionSeconds;
      const elapsed = Math.max(0, Math.floor((Date.now() - sessionView.startedAt!) / 1000));
      setRemainingSec(Math.max(0, total - elapsed));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [connectionState, sessionView]);

  // Auto-end when the entitled + grace window is fully exhausted.
  useEffect(() => {
    if (remainingSec === 0 && connectionState === 'CONNECTED') {
      void leave('DURATION_EXPIRED');
    }
  }, [remainingSec, connectionState, leave]);

  // Free extension (NO payment — strict free-call invariant).
  const handleExtendFree = async () => {
    if (extendBusy || !urlToken) return;
    chitiSensory.playTick();
    setExtendBusy(true);
    try {
      await fetch(`/api/sabha/sessions/${sessionId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: urlToken, seconds: 600 })
      });
      await refreshSession();
    } finally {
      setExtendBusy(false);
    }
  };

  // ---------------------------------------------------------------------
  // Media element binding (native <audio>/<video> ← MediaStream)
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.volume = isSpeakerOn ? 1 : 0;
      if (remoteStream) {
        remoteAudioRef.current.play().catch(() => {
          /* autoplay guard — user gesture precedes join */
        });
      }
    }
  }, [remoteStream, isSpeakerOn, activeMode]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream, activeMode]);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream, activeMode]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ---------------------------------------------------------------------
  // Derived UI state — REAL peer connection state (no simulation)
  // ---------------------------------------------------------------------
  const statusLabel: Record<string, string> = {
    IDLE: isPandit && !accepted ? 'इनकमिंग कॉल — स्वीकार करें' : 'तैयार',
    ACQUIRING_MEDIA: 'माइक/कैमरा प्रारंभ...',
    RINGING: isPandit ? 'कॉल स्वीकार हेतु प्रतीक्षा' : 'पंडित जी का फ़ोन घंटियां... (RINGING)',
    CONNECTING: 'मीडिया कनेक्ट हो रहा है... (CONNECTING)',
    CONNECTED: 'जुड़ा हुआ • DTLS-SRTP एन्क्रिप्टेड (CONNECTED)',
    RECONNECTING: 'नेटवर्क स्विच — पुनः कनेक्ट... (RECONNECTING)',
    ENDED: 'कॉल समाप्त (ENDED)',
    FAILED: 'कनेक्शन विफल (FAILED)'
  };

  const callStatus =
    connectionState === 'CONNECTED' ? 'CONNECTED' : connectionState === 'ENDED' ? 'ENDED' : 'CONNECTING';

  const displayTimer =
    callStatus === 'CONNECTED' && remainingSec !== null ? formatClock(remainingSec) : null;

  // ---------------------------------------------------------------------
  // Chat (ephemeral signaling relay — never stored server-side)
  // ---------------------------------------------------------------------
  const allMessages: ChatMessage[] = [
    {
      id: 'sys-welcome',
      sender: 'SYSTEM',
      text: '🔒 यह कक्ष DTLS-SRTP से एन्क्रिप्टेड है। फ़ोन नंबर दोनों ओर मास्क्ड हैं। कोई रिकॉर्डिंग नहीं — केवल कॉल अवधि अभिलेखित होती है।',
      timestamp: 0
    },
    ...chatMessages
  ];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim()) return;
    chitiSensory.playTick();
    void sendChat(inputMsg);
    setInputMsg('');
  };

  // ---------------------------------------------------------------------
  // Gate: missing token → honest access-required screen (rooms are NOT joinable
  // by URL guessing — security model §2.2/§2.3).
  // ---------------------------------------------------------------------
  if (!urlToken) {
    return (
      <CosmicTantraShell shellMode="minimal" footerMode="none">
        <div className="max-w-lg mx-auto px-6 py-24 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 mx-auto text-amber-600 dark:text-[#D4AF37]" />
          <h1 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
            प्राधिकृत कॉल लिंक आवश्यक
          </h1>
          <p className="text-xs text-[#696256] dark:text-[#9E988D] leading-relaxed">
            यह परामर्श कक्ष क्रिप्टोग्राफिक रूप से सुरक्षित है। प्रवेश हेतु आपके ephemeral access token
            युक्त वैयक्तिक लिंक की आवश्यकता है — कृपया अपने "मुफ्त कॉल" पुष्टि स्क्रीन से पुनः प्रवेश करें।
          </p>
          <Link
            href="/consultation/pandits"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            मुफ्त कॉल प्रारंभ करें
          </Link>
        </div>
      </CosmicTantraShell>
    );
  }

  return (
    <CosmicTantraShell shellMode="minimal" footerMode="none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 h-[calc(100vh-80px)] flex flex-col font-mono-data">
        {/* Native media transport — remote audio always bound (voice mode) */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* PRIVACY & SECURITY TOP BAR */}
        <div className="p-3 sm:px-5 bg-white dark:bg-[#0A0C14] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0 mb-3">
          <div className="flex items-center gap-3">
            <Link
              href="/consultation/pandits"
              className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[#696256] dark:text-[#9E988D] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[#1C1917] dark:text-white">
                  {isPandit ? 'भक्त परामर्श कक्ष' : 'परामर्श कक्ष'} • {sessionView?.sessionId || sessionId}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  <Lock className="w-2.5 h-2.5" />
                  <span>DTLS-SRTP E2EE</span>
                </span>
                <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-[10px] font-bold">
                  <Radio className="w-2.5 h-2.5" />
                  <span>{sessionView?.initiationMode === 'DIRECT' ? 'DIRECT' : 'CARE-ASSISTED'}</span>
                </span>
              </div>
              <p className="text-[11px] text-[#696256] dark:text-[#9E988D] hidden sm:block">
                {sessionView?.consultant.name || 'पंडित (प्रतीक्षित)'} • फ़ोन नंबर मास्क्ड • शून्य रिकॉर्डिंग
              </p>
            </div>
          </div>

          {/* Session Timer & FREE Extender */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                callStatus === 'ENDED'
                  ? 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-300'
                  : remainingSec !== null && remainingSec < 120
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {callStatus === 'CONNECTED'
                  ? displayTimer || '--:--'
                  : callStatus === 'ENDED'
                  ? `अवधि: ${formatClock(sessionView?.durationSeconds ?? endedInfo?.durationSeconds ?? 0)}`
                  : statusLabel[connectionState]}
              </span>
            </div>

            {callStatus === 'CONNECTED' && (
              <button
                onClick={handleExtendFree}
                disabled={extendBusy}
                className="px-3 py-1.5 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs flex items-center gap-1 hover:scale-102 transition-transform cursor-pointer shadow-xs disabled:opacity-50"
              >
                {extendBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">+10 मिनट (निःशुल्क)</span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN SPLIT STAGE */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          {/* LEFT: MEDIA STAGE */}
          <div className="lg:col-span-7 bg-[#07080D] border border-black/10 dark:border-white/10 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#8E6F1D]/10 via-transparent to-black/60 pointer-events-none" />

            {/* Mode Tabs */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-2xl">
                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    setActiveMode('voice');
                    if (hasVideoTrack && isCameraOn) void toggleCamera();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMode === 'voice' ? 'bg-[#8E6F1D] text-white shadow-md' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Voice Call</span>
                </button>

                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    setActiveMode('video');
                    if (!hasVideoTrack || !isCameraOn) void toggleCamera();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeMode === 'video' ? 'bg-indigo-600 text-white shadow-md' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video Darshan</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Real transport diagnostics */}
                {connectionState === 'CONNECTED' && (
                  <span className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    ICE: {iceConnectionState} • {selectedCandidateType ? `route: ${selectedCandidateType}` : 'route: …'}
                    {roundTripTimeMs !== null ? ` • ${roundTripTimeMs}ms` : ''}
                  </span>
                )}
                <button
                  onClick={() => setShowKundaliDrawer(!showKundaliDrawer)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/20 transition-colors lg:hidden"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showKundaliDrawer ? 'Hide' : 'Kundali'}</span>
                </button>
              </div>
            </div>

            {/* STAGE CANVAS */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4">
              {/* INCOMING RING GATE (Pandit accepts) */}
              {isPandit && !accepted ? (
                <div className="text-center space-y-6 animate-in zoom-in-95">
                  <div className="relative mx-auto">
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-4xl shadow-2xl animate-pulse">
                      <PhoneIncoming className="w-12 h-12" />
                    </div>
                    <div className="absolute -inset-3 rounded-full border border-emerald-400/40 animate-ping" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-editorial text-white">इनकमिंग मुफ्त कॉल</h3>
                    <p className="text-xs text-emerald-300/80">
                      भक्त: {sessionView?.customerDisplayName || '—'} • प्रश्न:{' '}
                      {sessionView?.question?.slice(0, 60) || '—'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleAccept}
                      className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      <span>स्वीकार करें (Accept)</span>
                    </button>
                    <button
                      onClick={handleDecline}
                      className="px-6 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>अस्वीकार</span>
                    </button>
                  </div>
                </div>
              ) : activeMode === 'voice' ? (
                // === MASKED VOICE CALL INTERFACE ===
                <div className="text-center space-y-6 animate-in zoom-in-95">
                  <div className="relative mx-auto">
                    <div
                      className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-white text-3xl sm:text-4xl shadow-2xl ${
                        connectionState === 'CONNECTED' ? '' : 'animate-pulse'
                      }`}
                    >
                      {connectionState === 'ENDED' ? <PhoneOff className="w-10 h-10" /> : '🕉️'}
                    </div>
                    {connectionState !== 'CONNECTED' && connectionState !== 'ENDED' && (
                      <div className="absolute -inset-3 rounded-full border border-amber-400/30 animate-ping" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl font-bold font-editorial text-white">
                      {sessionView?.consultant.name || 'पंडित (जुड़ रहे हैं)'}
                    </h3>
                    <p className="text-xs text-amber-300/80">{statusLabel[connectionState]}</p>
                    {error && <p className="text-[11px] text-rose-400 max-w-sm mx-auto">{error}</p>}
                    {peerPresent && connectionState !== 'CONNECTED' && (
                      <p className="text-[10px] text-emerald-400">दोनों सहभागी उपस्थित — मीडिया समझौता जारी...</p>
                    )}
                  </div>

                  {/* Live audio level placeholders — honest CONNECTING pulse */}
                  <div className="flex items-center justify-center gap-1 h-10">
                    {[40, 65, 80, 45, 90, 100, 70, 85, 60, 95, 50, 75, 90, 60, 40].map((h, i) => (
                      <div
                        key={i}
                        style={{ height: `${connectionState === 'CONNECTED' ? h : 15}%` }}
                        className={`w-1.5 bg-gradient-to-t from-amber-500 to-amber-200 rounded-full transition-all duration-150 ${
                          connectionState === 'CONNECTED' ? 'opacity-100' : 'opacity-40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                // === HD VIDEO DARSHAN INTERFACE — REAL <video> STREAMS ===
                <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/10 bg-[#0F111A] flex items-center justify-center">
                  {/* Remote video */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover ${
                      remoteStream && connectionState === 'CONNECTED' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {/* Connecting veil */}
                  {(!remoteStream || connectionState !== 'CONNECTED') && (
                    <div className="text-center space-y-3 z-10">
                      <div className="w-24 h-24 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-3xl mx-auto text-white animate-pulse">
                        🪔
                      </div>
                      <div className="text-white font-bold text-sm">
                        {sessionView?.consultant.name || 'पंडित (Kashi Sanctum)'}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                        {statusLabel[connectionState]}
                      </span>
                      {error && <p className="text-[11px] text-rose-400 max-w-sm mx-auto">{error}</p>}
                    </div>
                  )}

                  {/* Local camera PiP — REAL local preview */}
                  <div className="absolute bottom-4 right-4 w-28 h-36 rounded-xl bg-black/80 border border-white/20 overflow-hidden shadow-lg">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${hasVideoTrack ? 'opacity-100' : 'opacity-0'}`}
                    />
                    {!hasVideoTrack && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                        <UserRound className="w-6 h-6 text-white/60 mb-1" />
                        <span className="text-[10px] text-white/80 font-bold">आप (Voice Only)</span>
                      </div>
                    )}
                    {hasVideoTrack && (
                      <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] text-emerald-400 font-bold bg-black/50 rounded py-0.5">
                        {isCameraOn ? 'Camera On' : 'Camera Off'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM CALL CONTROLS DOCK — bound to REAL tracks */}
            <div className="relative z-10 p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center gap-4 sm:gap-6">
              {/* Mic Mute — toggles the live AUDIO track(s) */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  toggleMute();
                }}
                disabled={connectionState !== 'CONNECTED' && connectionState !== 'CONNECTING' && connectionState !== 'RECONNECTING'}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isMuted ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera toggle — toggles/acquires the live VIDEO track(s) */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  void toggleCamera();
                }}
                disabled={!localStream}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  !isCameraOn ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
                title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              {/* Speaker — binds remote <audio> output */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  setIsSpeakerOn(!isSpeakerOn);
                }}
                className="p-3.5 rounded-2xl border bg-white/10 border-white/15 text-white hover:bg-white/20 transition-all cursor-pointer active:scale-95"
                title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-white/50" />}
              </button>

              {/* End Call — LEAVE_ROOM → server logs authoritative duration */}
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  void leave('CALL_ENDED');
                }}
                disabled={connectionState === 'ENDED' || connectionState === 'IDLE'}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <PhoneOff className="w-4 h-4" />
                <span>कॉल समाप्त (End)</span>
              </button>
            </div>
          </div>

          {/* RIGHT: DOSSIER + CHAT */}
          <div className="lg:col-span-5 flex flex-col gap-3 h-full min-h-0">
            {/* Dossier */}
            {showKundaliDrawer && (
              <div className="bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-4 shadow-md space-y-3 shrink-0">
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-2">
                  <span className="font-bold text-xs text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>परामर्श संदर्भ (Context Dossier)</span>
                  </span>
                  <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">
                    {sessionView?.initiationMode === 'DIRECT' ? 'DIRECT मुफ्त कॉल' : 'केयर-सहायता मुफ्त कॉल'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">भक्त</span>
                    <strong className="text-[#1C1917] dark:text-white text-[11px]">
                      {sessionView?.customerDisplayName || '—'}
                    </strong>
                  </div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">पंडित जी</span>
                    <strong className="text-[#1C1917] dark:text-white text-[11px]">
                      {sessionView?.consultant.name || '—'}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-[#78350F] dark:text-[#FDE68A] leading-tight">
                  <strong>मुख्य प्रश्न: </strong>
                  {sessionView?.question || '—'}
                </div>

                {/* Zero-recording + free-call transparency */}
                <div className="flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>मुफ्त कॉल • कोई रिकॉर्डिंग नहीं • कोई भुगतान नहीं</span>
                </div>
              </div>
            )}

            {/* Ephemeral Chat */}
            <div className="flex-1 bg-white dark:bg-[#0E101D] border border-black/10 dark:border-white/10 rounded-3xl flex flex-col shadow-md overflow-hidden min-h-0">
              <div className="p-3 bg-[#FAF7F2] dark:bg-[#121522] border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                <span className="font-bold text-xs text-[#1C1917] dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                  <span>गोपनीय संवाद (Ephemeral Chat)</span>
                </span>
                <span className={`text-[10px] font-bold ${connectionState === 'CONNECTED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {connectionState === 'CONNECTED' ? '● Real-time' : '○ Waiting'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                {allMessages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.sender === 'SELF' ? 'items-end' : m.sender === 'PEER' ? 'items-start' : 'items-center'}`}>
                    {m.sender === 'SYSTEM' ? (
                      <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-[10px] text-[#696256] dark:text-[#9E988D] text-center max-w-[90%]">
                        {m.text}
                      </div>
                    ) : (
                      <div
                        className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          m.sender === 'SELF'
                            ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] rounded-br-xs'
                            : 'bg-[#FAF7F2] dark:bg-[#151828] border border-black/10 dark:border-white/10 text-[#1C1917] dark:text-white rounded-bl-xs'
                        }`}
                      >
                        <div className="font-bold text-[10px] opacity-75 mb-0.5">
                          {m.sender === 'SELF' ? 'आप' : sessionView?.consultant.name || 'पीयर'}
                        </div>
                        <p>{m.text}</p>
                      </div>
                    )}
                    {m.timestamp > 0 && (
                      <span className="text-[9px] text-[#696256] dark:text-[#9E988D] mt-0.5 px-2">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
                <div ref={chatScrollRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-2.5 bg-[#FAF7F2] dark:bg-[#121522] border-t border-black/10 dark:border-white/10 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="संदेश लिखें..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D]"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || connectionState === 'ENDED'}
                  className="p-2 rounded-xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ENDED CLOSING PANEL — duration-logged, zero-recording statement */}
        {connectionState === 'ENDED' && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
              {endedInfo?.reason === 'CALL_ENDED' || endedInfo?.reason === 'TAB_CLOSED' || endedInfo?.reason === 'DURATION_EXPIRED' ? (
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              ) : (
                <XCircle className="w-10 h-10 mx-auto text-rose-500" />
              )}
              <h2 className="font-editorial text-lg font-bold text-[#1C1917] dark:text-white">कॉल समाप्त</h2>
              <p className="text-xs text-[#696256] dark:text-[#9E988D] leading-relaxed">
                अवधि: <strong>{formatClock(sessionView?.durationSeconds ?? endedInfo?.durationSeconds ?? 0)}</strong> (सर्वर-प्राधिकृत अभिलेख)
                <br />
                केवल अवधि व कनेक्शन टेलीमीट्री अभिलेखित हुई। <strong>कोई ऑडियो/वीडियो रिकॉर्डिंग नहीं</strong> की गई — सभी मीडिया ट्रैक तुरंत नष्ट कर दिए गए।
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/consultation/pandits"
                  className="px-5 py-2.5 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#080A10] font-bold text-xs"
                >
                  नई मुफ्त कॉल प्रारंभ करें
                </Link>
                <button onClick={() => window.location.reload()} className="px-5 py-2 text-[10px] text-[#696256] dark:text-[#9E988D] underline">
                  कक्ष पुनः लोड करें
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CosmicTantraShell>
  );
}

'use client';

/**
 * CHITI-CONNECT SECURE CONSULTATION ROOM — CosmicTantra Edition
 *
 * Universal WebRTC consultation chamber adhering to Nielsen Norman Usability Heuristics:
 *   - Zero Heuristic Violations: clear system status, natural Vedic metaphors,
 *     easy user control/freedom, consistent bottom dock, aesthetic obsidian glass.
 *   - Zero Visual Clashing: Unified Obsidian Midnight (#070913 / #0D101C) and
 *     Antique Brass / Saffron (#D4AF37 / #8E6F1D) temple palette.
 *   - Strict Persona Isolation:
 *       • DEVOTEE (Caller): Focused, reverent sanctum with Pandit Ji's portrait,
 *         reassurance badges, timer, live audio wave, and floating controls.
 *       • SCHOLAR (Receiver): Operational console with Devotee dossier, verbatim
 *         prashna card, Lagna/Dasha folio notes, and encrypted chat.
 *   - Zero Cost & Zero Recording Invariant: Hard-enforced free consultation
 *     without wallet deduction or media storage.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  PhoneOff,
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
  XCircle,
  FileText,
  Copy,
  ExternalLink,
  Check,
  Sparkles,
  X
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';
import { useWebRTC, WebRTCChatEntry } from '@/hooks/useWebRTC';
import ChitiConnectVisualizer from '@/components/connect/ChitiConnectVisualizer';
import ChitiConnectDock from '@/components/connect/ChitiConnectDock';

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
  customerCity?: string;
  category?: string;
  language?: string;
  consultant: { scholarId: string; name: string; title: string; tradition: string };
  question: string;
}

const formatClock = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const cleanDevoteeName = (raw?: string) => {
  if (!raw) return 'श्रद्धालु भक्त';
  const trimmed = raw.replace(/^भक्त\s*:\s*/i, '').trim();
  return trimmed || 'श्रद्धालु भक्त';
};

export default function EncryptedConsultationRoom() {
  const params = useParams();
  const searchParams = useSearchParams();

  const sessionId = (params?.id as string) || '';
  const urlToken = searchParams?.get('token') || '';
  const initialMode = (searchParams?.get('mode') as 'voice' | 'video' | 'chat') || 'voice';
  const roleParam = searchParams?.get('role');

  // Token-authoritative role verification:
  // Decodes base64url payload of SabhaAccessToken to prevent role confusion/impersonation.
  const tokenRole = useMemo(() => {
    if (!urlToken || !urlToken.includes('.')) return null;
    try {
      const b64 = urlToken.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
      const json = typeof window !== 'undefined' ? atob(b64) : Buffer.from(b64, 'base64').toString('utf8');
      const payload = JSON.parse(json);
      return payload.role as string;
    } catch {
      return null;
    }
  }, [urlToken]);

  // Strict persona assignment
  const isPandit = tokenRole === 'CONSULTANT' 
    ? true 
    : (tokenRole === 'BENEFICIARY' || tokenRole === 'PAYER') 
      ? false 
      : roleParam === 'pandit';

  const autoAccept = searchParams?.get('autoAccept') === '1';
  const [activeMode, setActiveMode] = useState<'voice' | 'video'>(initialMode === 'video' ? 'video' : 'voice');
  const [accepted, setAccepted] = useState(!isPandit || autoAccept);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showFolioDrawer, setShowFolioDrawer] = useState(true);
  const [showDevoteeChat, setShowDevoteeChat] = useState(false);
  const [sessionView, setSessionView] = useState<RoomView | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [inputMsg, setInputMsg] = useState('');
  const [extendBusy, setExtendBusy] = useState(false);

  // Scholar Folio & Workspace state (when isPandit === true)
  const [scholarTab, setScholarTab] = useState<'DOSSIER' | 'FOLIO' | 'CHAT'>('DOSSIER');
  const [scholarNotes, setScholarNotes] = useState('');
  const [scholarRemedy, setScholarRemedy] = useState('');
  const [copiedNotes, setCopiedNotes] = useState(false);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------
  // Real WebRTC engine
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
    const poll = setInterval(() => void refreshSession(), 4000);
    return () => clearInterval(poll);
  }, [refreshSession, connectionState]);

  // Countdown from server timestamps
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

  // Auto-end when time expires
  useEffect(() => {
    if (remainingSec === 0 && connectionState === 'CONNECTED') {
      void leave('DURATION_EXPIRED');
    }
  }, [remainingSec, connectionState, leave]);

  // Free extension (strict free-call invariant)
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
    } catch {
      /* non-critical */
    } finally {
      setExtendBusy(false);
    }
  };

  // Bind remote audio element
  useEffect(() => {
    if (!remoteAudioRef.current) return;
    if (remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = !isSpeakerOn;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStream, isSpeakerOn]);

  // Bind video elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream, activeMode]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, activeMode]);

  // Chat message submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || connectionState === 'ENDED') return;
    chitiSensory.playTick();
    sendChat(inputMsg.trim());
    setInputMsg('');
  };

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCopyFolio = () => {
    chitiSensory.playTick();
    const text = `=== COSMIC TANTRA परामर्श फ़ोलियो ===\nसत्र ID: ${sessionId}\nभक्त: ${cleanDevoteeName(sessionView?.customerDisplayName)} (${sessionView?.customerCity || 'वाराणसी'})\nप्रश्न: ${sessionView?.question || 'मुफ्त परामर्श'}\n\nज्योतिषीय अवलोकन:\n${scholarNotes || 'निरीक्षण पूर्ण'}\n\nअनुशंसित उपाय:\n${scholarRemedy || 'नित्य प्रार्थना एवं दीप प्रज्ज्वलन'}\n\nपंडित: ${sessionView?.consultant.name || 'विद्वान् ज्योतिर्विद'}`;
    navigator.clipboard.writeText(text);
    setCopiedNotes(true);
    setTimeout(() => setCopiedNotes(false), 2500);
  };

  const statusLabel: Record<string, string> = {
    IDLE: 'कक्ष तैयार हो रहा है...',
    ACQUIRING_MEDIA: 'माइक अनुमतियाँ जाँची जा रही हैं...',
    RINGING: isPandit ? '🔔 इनकमिंग कॉल बज रही है...' : 'पंडित जी से संपर्क हो रहा है...',
    CONNECTING: 'सुरक्षित मीडिया चैनल स्थापित हो रहा है...',
    CONNECTED: 'सक्रिय परामर्श (Live)',
    RECONNECTING: 'कनेक्शन पुनः स्थापित किया जा रहा है...',
    ENDED: 'परामर्श समाप्त हुआ',
    FAILED: 'कनेक्शन में व्यवधान'
  };

  const displayTimer = remainingSec !== null ? formatClock(remainingSec) : null;
  const isAudioActive = connectionState === 'CONNECTED' && !isMuted;

  return (
    <CosmicTantraShell shellMode="minimal" footerMode="none">
      <div className="min-h-[calc(100vh-70px)] bg-[#070913] text-[#FAF7F2] p-2 sm:p-4 lg:p-6 flex flex-col font-mono-data">
        {/* Native media audio transport */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

        {/* TOP SECURITY & TELEMETRY BAR */}
        <div className="p-3 sm:px-5 bg-[#0D101C] border border-[#D4AF37]/25 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0 mb-4">
          <div className="flex items-center gap-3">
            <Link
              href={isPandit ? '/pandit/workspace' : '/consultation/pandits'}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#C5BEB3] hover:text-white transition-colors flex items-center gap-1.5"
              title={isPandit ? 'वापस पंडित कार्यक्षेत्र' : 'पंडित सूची'}
            >
              <ArrowLeft className="w-4 h-4" />
              {isPandit && <span className="text-xs font-bold hidden md:inline">कार्यक्षेत्र</span>}
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[#FAF7F2]">
                  {isPandit ? 'विद्वान् परामर्श कंसोल' : 'परामर्श कक्ष (Devotee Sanctum)'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                  {isPandit ? 'पंडित डेस्क' : '१५ मिनट निःशुल्क'}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  <Lock className="w-2.5 h-2.5" />
                  <span>DTLS-SRTP E2EE</span>
                </span>
                <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] font-bold">
                  <Radio className="w-2.5 h-2.5" />
                  <span>{sessionView?.initiationMode === 'DIRECT' ? 'DIRECT' : 'CARE-ASSISTED'}</span>
                </span>
              </div>
              <p className="text-[11px] text-[#A69F94] hidden sm:block mt-0.5">
                {isPandit
                  ? `श्रद्धालु: ${cleanDevoteeName(sessionView?.customerDisplayName)}${sessionView?.customerCity ? ` (${sessionView.customerCity})` : ''} • विषय: ${sessionView?.category || 'सामान्य ज्योतिष'} • शून्य रिकॉर्डिंग`
                  : `${sessionView?.consultant.name || 'पंडित (प्रतीक्षित)'} • फ़ोन नंबर पूर्णतः मास्क्ड • शून्य रिकॉर्डिंग`}
              </p>
            </div>
          </div>

          {/* Session Countdown Timer & Extender */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                connectionState === 'ENDED'
                  ? 'bg-slate-500/15 border-slate-500/30 text-slate-300'
                  : remainingSec !== null && remainingSec < 120
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                  : 'bg-[#D4AF37]/15 border-[#D4AF37]/35 text-[#F0C968]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {connectionState === 'CONNECTED'
                  ? displayTimer || '--:--'
                  : connectionState === 'ENDED'
                  ? `अवधि: ${formatClock(sessionView?.durationSeconds ?? endedInfo?.durationSeconds ?? 0)}`
                  : statusLabel[connectionState]}
              </span>
            </div>

            {connectionState === 'CONNECTED' && isPandit && (
              <button
                onClick={handleExtendFree}
                disabled={extendBusy}
                className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#080A10] font-bold text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {extendBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">+10 मिनट (निःशुल्क)</span>
              </button>
            )}

            {!isPandit && (
              <button
                onClick={() => {
                  chitiSensory.playTick();
                  setShowDevoteeChat(!showDevoteeChat);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="गोपनीय चैट"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">चैट</span>
                {chatMessages.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-black text-[10px] font-bold flex items-center justify-center">
                    {chatMessages.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PERSONA 1: DEVOTEE SANCTUM VIEW (Focused, Reverent & Zero Clutter) */}
        {/* ========================================================================= */}
        {!isPandit ? (
          <div className="flex-1 flex flex-col items-center justify-between max-w-4xl w-full mx-auto relative min-h-[500px]">
            {/* Center Sanctum Card */}
            <div className="w-full flex-1 flex flex-col items-center justify-center p-6 sm:p-10 rounded-3xl bg-[#0D101C]/95 border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden backdrop-blur-xl my-2">
              <div className="absolute inset-0 bg-radial from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />

              {/* HD Video Darshan Display */}
              {activeMode === 'video' ? (
                <div className="w-full h-full max-h-[460px] rounded-2xl overflow-hidden relative border border-white/10 bg-[#0F111A] flex items-center justify-center">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`absolute inset-0 w-full h-full object-cover ${
                      remoteStream && connectionState === 'CONNECTED' ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {(!remoteStream || connectionState !== 'CONNECTED') && (
                    <div className="text-center space-y-3 z-10">
                      <div className="w-24 h-24 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-4xl mx-auto animate-pulse shadow-lg">
                        🕉️
                      </div>
                      <div className="text-white font-bold text-base">
                        {sessionView?.consultant.name || 'पंडित जी'}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                        {statusLabel[connectionState]}
                      </span>
                    </div>
                  )}

                  {/* Devotee Picture-in-Picture Local Video */}
                  {localStream && isCameraOn && (
                    <div className="absolute bottom-3 right-3 w-28 sm:w-36 aspect-3/4 rounded-xl overflow-hidden border-2 border-amber-400/40 shadow-2xl bg-black/60 z-20">
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ) : (
                /* Pure Voice Darshan Experience */
                <div className="text-center space-y-6 max-w-lg w-full relative z-10 animate-in zoom-in-95">
                  {/* Pandit Halo Portrait */}
                  <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#8E6F1D] via-[#D4AF37] to-amber-300 opacity-25 blur-xl animate-pulse" />
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-[#8E6F1D] to-[#D4AF37] border-2 border-[#D4AF37]/60 flex items-center justify-center text-5xl sm:text-6xl shadow-2xl relative z-10">
                      🕉️
                    </div>
                    {connectionState !== 'CONNECTED' && connectionState !== 'ENDED' && (
                      <div className="absolute -inset-3 rounded-full border-2 border-[#D4AF37]/40 animate-ping" />
                    )}
                  </div>

                  {/* Pandit Details & Reverence */}
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                      <span>{sessionView?.consultant.title || 'वरिष्ठ वैदिक ज्योतिर्विद'}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-white tracking-wide">
                      {sessionView?.consultant.name || 'पंडित जी'}
                    </h2>
                    <p className="text-xs text-[#D4AF37] font-medium">
                      {statusLabel[connectionState]}
                    </p>
                  </div>

                  {/* Devotee's Prashna Card */}
                  {sessionView?.question && (
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-[#D4AF37]/20 text-xs text-left space-y-1 backdrop-blur-md shadow-inner">
                      <span className="text-[10px] font-bold text-[#D4AF37] block">आपका प्रश्न (Your Inquiry):</span>
                      <p className="text-white/90 text-[13px] leading-relaxed italic">
                        "{sessionView.question}"
                      </p>
                    </div>
                  )}

                  {/* Reactive Audio Visualizer */}
                  <div className="pt-2">
                    <ChitiConnectVisualizer isActive={isAudioActive} colorScheme="saffron" />
                  </div>
                </div>
              )}
            </div>

            {/* Devotee Bottom Floating Dock */}
            <div className="w-full pt-2 pb-1">
              <ChitiConnectDock
                isMuted={isMuted}
                onToggleMute={toggleMute}
                isSpeakerOn={isSpeakerOn}
                onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
                activeMode={activeMode}
                onToggleMode={() => {
                  const next = activeMode === 'voice' ? 'video' : 'voice';
                  setActiveMode(next);
                  if (next === 'video' && (!hasVideoTrack || !isCameraOn)) void toggleCamera();
                  if (next === 'voice' && hasVideoTrack && isCameraOn) void toggleCamera();
                }}
                onEndCall={() => leave('CALL_ENDED')}
                endCallLabel={connectionState === 'CONNECTED' ? 'कॉल समाप्त करें' : 'कॉल रद्द करें'}
                isEnded={connectionState === 'ENDED'}
              />
            </div>

            {/* Optional Devotee Ephemeral Chat Slide-over / Modal */}
            {showDevoteeChat && (
              <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#0D101C] border-l border-[#D4AF37]/30 shadow-2xl flex flex-col p-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="font-bold text-xs text-[#FAF7F2] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                    <span>गोपनीय संदेश (Live Chat)</span>
                  </span>
                  <button
                    onClick={() => setShowDevoteeChat(false)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-white/50">
                      पंडित जी को कोई विवरण या जन्म समय यहाँ लिख कर भेज सकते हैं।
                    </div>
                  ) : (
                    chatMessages.map(m => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === 'SELF' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            m.sender === 'SELF'
                              ? 'bg-[#D4AF37] text-black font-medium'
                              : 'bg-white/10 text-white border border-white/10'
                          }`}
                        >
                          <div className="font-bold text-[9px] opacity-75 mb-0.5">
                            {m.sender === 'SELF' ? 'आप' : sessionView?.consultant.name || 'पंडित जी'}
                          </div>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatScrollRef} />
                </div>

                <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value)}
                    placeholder="संदेश लिखें..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    disabled={!inputMsg.trim() || connectionState === 'ENDED'}
                    className="p-2.5 rounded-xl bg-[#D4AF37] text-black disabled:opacity-40 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* PERSONA 2: SCHOLAR CONSULTATION CONSOLE (Pandit Ji's Cockpit) */
          /* ========================================================================= */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
            {/* LEFT: MEDIA STAGE & INCOMING CALL GATE */}
            <div className="lg:col-span-7 bg-[#0D101C] border border-[#D4AF37]/25 rounded-3xl p-4 sm:p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 via-transparent to-black/60 pointer-events-none" />

              {/* Mode Tabs & Diagnostics */}
              <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button
                    onClick={() => {
                      chitiSensory.playTick();
                      setActiveMode('voice');
                      if (hasVideoTrack && isCameraOn) void toggleCamera();
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeMode === 'voice' ? 'bg-[#D4AF37] text-black shadow-md' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Voice Consultation</span>
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
                  {connectionState === 'CONNECTED' && (
                    <span className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                      ICE: {iceConnectionState}
                      {roundTripTimeMs !== null ? ` • ${roundTripTimeMs}ms` : ''}
                    </span>
                  )}
                  <button
                    onClick={() => setShowFolioDrawer(!showFolioDrawer)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/15 transition-colors lg:hidden"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{showFolioDrawer ? 'Hide' : 'फ़ोलियो'}</span>
                  </button>
                </div>
              </div>

              {/* Center Canvas */}
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-4">
                {/* Incoming Ring Gate (when pandit must accept) */}
                {!accepted ? (
                  <div className="text-center space-y-6 animate-in zoom-in-95 max-w-sm">
                    <div className="relative mx-auto">
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white text-4xl shadow-2xl animate-pulse">
                        <PhoneIncoming className="w-12 h-12" />
                      </div>
                      <div className="absolute -inset-3 rounded-full border border-emerald-400/40 animate-ping" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold font-editorial text-white">इनकमिंग मुफ्त परामर्श कॉल</h3>
                      <p className="text-xs text-emerald-300/80">
                        श्रद्धालु: {cleanDevoteeName(sessionView?.customerDisplayName)}
                        {sessionView?.customerCity ? ` (${sessionView.customerCity})` : ''}
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
                  /* Pandit Voice Call Stage */
                  <div className="text-center space-y-5 animate-in zoom-in-95 max-w-md w-full">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>विद्वान् परामर्श डेस्क (Scholar Cockpit)</span>
                    </div>

                    <div className="relative mx-auto">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-amber-700 via-[#8E6F1D] to-[#D4AF37] flex items-center justify-center text-white text-3xl sm:text-4xl shadow-2xl">
                        <UserRound className="w-12 h-12 text-white" />
                      </div>
                      {connectionState !== 'CONNECTED' && connectionState !== 'ENDED' && (
                        <div className="absolute -inset-3 rounded-full border border-amber-400/30 animate-ping" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-bold font-editorial text-white">
                        {cleanDevoteeName(sessionView?.customerDisplayName)}
                      </h3>
                      <p className="text-xs text-amber-300/80">{statusLabel[connectionState]}</p>
                      {sessionView?.customerCity && (
                        <p className="text-[11px] text-white/70">
                          स्थान: {sessionView.customerCity} • भाषा: {sessionView.language || 'हिंदी'}
                        </p>
                      )}
                    </div>

                    {/* Verbatim Devotee Question prominently visible */}
                    {sessionView?.question && (
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-amber-400/25 text-xs text-left space-y-1 backdrop-blur-md shadow-lg w-full">
                        <div className="flex items-center justify-between text-[10px] font-bold text-[#D4AF37]">
                          <span>भक्त का मुख्य प्रश्न (Prashna / Inquiry)</span>
                          <span className="text-emerald-400">{sessionView.category || 'ज्योतिषीय परामर्श'}</span>
                        </div>
                        <p className="text-white text-[12px] font-medium leading-relaxed italic">
                          "{sessionView.question}"
                        </p>
                      </div>
                    )}

                    <ChitiConnectVisualizer isActive={isAudioActive} colorScheme="saffron" />
                  </div>
                ) : (
                  /* HD Video Darshan Stage */
                  <div className="w-full h-full rounded-2xl overflow-hidden relative border border-white/10 bg-[#0F111A] flex items-center justify-center min-h-[300px]">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className={`absolute inset-0 w-full h-full object-cover ${
                        remoteStream && connectionState === 'CONNECTED' ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    {(!remoteStream || connectionState !== 'CONNECTED') && (
                      <div className="text-center space-y-3 z-10">
                        <div className="w-20 h-20 rounded-full bg-indigo-600/30 border border-indigo-400 flex items-center justify-center text-3xl mx-auto text-white animate-pulse">
                          👤
                        </div>
                        <div className="text-white font-bold text-sm">
                          {cleanDevoteeName(sessionView?.customerDisplayName)}
                        </div>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                          {statusLabel[connectionState]}
                        </span>
                      </div>
                    )}

                    {localStream && isCameraOn && (
                      <div className="absolute bottom-3 right-3 w-28 aspect-3/4 rounded-xl overflow-hidden border border-amber-400/40 shadow-2xl bg-black/60 z-20">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Dock Controls */}
              <div className="relative z-10 pt-2">
                <ChitiConnectDock
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  isSpeakerOn={isSpeakerOn}
                  onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
                  activeMode={activeMode}
                  onToggleMode={() => {
                    const next = activeMode === 'voice' ? 'video' : 'voice';
                    setActiveMode(next);
                    if (next === 'video' && (!hasVideoTrack || !isCameraOn)) void toggleCamera();
                    if (next === 'voice' && hasVideoTrack && isCameraOn) void toggleCamera();
                  }}
                  showDrawer={showFolioDrawer}
                  onToggleDrawer={() => setShowFolioDrawer(!showFolioDrawer)}
                  onEndCall={() => leave('CALL_ENDED')}
                  endCallLabel="कॉल समाप्त (End)"
                  isEnded={connectionState === 'ENDED'}
                />
              </div>
            </div>

            {/* RIGHT: SCHOLAR WORKSPACE & FOLIO DRAWER */}
            {showFolioDrawer && (
              <div className="lg:col-span-5 bg-[#0D101C] border border-[#D4AF37]/25 rounded-3xl p-4 sm:p-5 flex flex-col shadow-2xl min-h-[500px]">
                {/* 3 Unified Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/5 mb-4">
                  <button
                    onClick={() => { chitiSensory.playTick(); setScholarTab('DOSSIER'); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      scholarTab === 'DOSSIER' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>भक्त संदर्भ</span>
                  </button>
                  <button
                    onClick={() => { chitiSensory.playTick(); setScholarTab('FOLIO'); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      scholarTab === 'FOLIO' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>परामर्श फ़ोलियो</span>
                  </button>
                  <button
                    onClick={() => { chitiSensory.playTick(); setScholarTab('CHAT'); }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      scholarTab === 'CHAT' ? 'bg-[#D4AF37] text-black shadow-sm' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>चैट ({chatMessages.length})</span>
                  </button>
                </div>

                {/* Tab 1: DOSSIER */}
                {scholarTab === 'DOSSIER' && (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#F0C968]">भक्त विवरण (Devotee Profile)</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[9px]">
                          {sessionView?.initiationMode === 'DIRECT' ? 'DIRECT प्रोफ़ाइल' : 'CARE-ASSISTED'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-[9px] text-[#A69F94] block">नाम</span>
                          <strong className="text-white">{cleanDevoteeName(sessionView?.customerDisplayName)}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-[9px] text-[#A69F94] block">स्थान / शहर</span>
                          <strong className="text-white">{sessionView?.customerCity || 'वाराणसी'}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-[9px] text-[#A69F94] block">विषय श्रेणी</span>
                          <strong className="text-white">{sessionView?.category || 'सामान्य'}</strong>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-[9px] text-[#A69F94] block">भाषा</span>
                          <strong className="text-white">{sessionView?.language || 'हिंदी'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                      <span className="font-bold text-[10px] text-[#D4AF37] block">भक्त का मुख्य प्रश्न:</span>
                      <p className="text-xs text-white/90 leading-relaxed italic">
                        "{sessionView?.question || 'मुफ्त वैदिक परामर्श'}"
                      </p>
                    </div>

                    <Link
                      href="/kundli"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[#F0C968] font-bold text-xs flex items-center justify-between transition-colors shadow-xs"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <span>कुंडली / गोचर विश्लेषक खोलें (New Tab)</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[10px] text-[#A69F94] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>गोपनीयता नीति: फ़ोन नंबर दोनों ओर मास्क्ड हैं। मीडिया स्ट्रीम्स में शून्य रिकॉर्डिंग।</span>
                    </div>
                  </div>
                )}

                {/* Tab 2: FOLIO */}
                {scholarTab === 'FOLIO' && (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs flex flex-col">
                    <div className="space-y-1 flex-1 flex flex-col">
                      <label className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-1.5">
                        <FileText className="w-3 h-3" />
                        <span>ज्योतिषीय अवलोकन (Astrological Findings / Lagna / Dasha):</span>
                      </label>
                      <textarea
                        value={scholarNotes}
                        onChange={e => setScholarNotes(e.target.value)}
                        placeholder="जैसे: धनु लग्न, गुरु महादशा, दशम भाव में सूर्य का प्रभाव, करियर में अनुकूल परिवर्तन की संभावना..."
                        className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37] min-h-[90px] resize-none"
                      />
                    </div>

                    <div className="space-y-1 flex-1 flex flex-col">
                      <label className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>अनुशंसित उपाय एवं मंत्र (Prescribed Upayas / Mantras):</span>
                      </label>
                      <textarea
                        value={scholarRemedy}
                        onChange={e => setScholarRemedy(e.target.value)}
                        placeholder="जैसे: ॐ नमो भगवते वासुदेवाय (१०८ जप), बृहस्पतिवार को चने की दाल का दान, पीले पुष्प अर्पण..."
                        className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37] min-h-[90px] resize-none"
                      />
                    </div>

                    <button
                      onClick={handleCopyFolio}
                      className="w-full py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-sm"
                    >
                      {copiedNotes ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedNotes ? 'फ़ोलियो कॉपी हो गया!' : 'फ़ोलियो कॉपी करें (Copy Notes)'}</span>
                    </button>
                  </div>
                )}

                {/* Tab 3: CHAT */}
                {scholarTab === 'CHAT' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-2 space-y-2.5 text-xs">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-10 text-[11px] text-white/50">
                          भक्त के साथ कोई संदेश अभी दर्ज नहीं हुआ।
                        </div>
                      ) : (
                        chatMessages.map(m => (
                          <div
                            key={m.id}
                            className={`flex flex-col ${m.sender === 'SELF' ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                                m.sender === 'SELF'
                                  ? 'bg-[#D4AF37] text-black font-medium rounded-br-xs'
                                  : 'bg-white/10 border border-white/10 text-white rounded-bl-xs'
                              }`}
                            >
                              <div className="font-bold text-[9px] opacity-75 mb-0.5">
                                {m.sender === 'SELF' ? 'आप (पंडित जी)' : cleanDevoteeName(sessionView?.customerDisplayName)}
                              </div>
                              <p>{m.text}</p>
                            </div>
                            {m.timestamp > 0 && (
                              <span className="text-[9px] text-[#A69F94] mt-0.5 px-2">
                                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                      <div ref={chatScrollRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="pt-2 border-t border-white/10 flex items-center gap-2">
                      <input
                        type="text"
                        value={inputMsg}
                        onChange={e => setInputMsg(e.target.value)}
                        placeholder="भक्त को संदेश भेजें..."
                        className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        type="submit"
                        disabled={!inputMsg.trim() || connectionState === 'ENDED'}
                        className="p-2 rounded-xl bg-[#D4AF37] text-black disabled:opacity-40 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CALL ENDED POST-CONSULTATION STATEMENT PANEL */}
        {/* ========================================================================= */}
        {connectionState === 'ENDED' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-[#0D101C] border border-[#D4AF37]/35 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
              {endedInfo?.reason === 'CALL_ENDED' || endedInfo?.reason === 'TAB_CLOSED' || endedInfo?.reason === 'DURATION_EXPIRED' ? (
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
              ) : (
                <XCircle className="w-12 h-12 mx-auto text-amber-400" />
              )}
              <h2 className="font-editorial text-xl font-bold text-white">परामर्श सम्पन्न हुआ</h2>
              <p className="text-xs text-[#C5BEB3] leading-relaxed">
                सत्र अवधि: <strong>{formatClock(sessionView?.durationSeconds ?? endedInfo?.durationSeconds ?? 0)}</strong>
                <br />
                <span className="text-[11px] text-emerald-400 block mt-2">
                  ✓ शून्य रिकॉर्डिंग: मीडिया स्ट्रीम्स नष्ट कर दिए गए हैं। केवल परामर्श अवधि दर्ज हुई।
                </span>
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href={isPandit ? '/pandit/workspace' : '/consultation/pandits'}
                  className="px-5 py-2.5 rounded-2xl bg-[#D4AF37] text-black font-bold text-xs shadow-md hover:brightness-110 transition-all"
                >
                  {isPandit ? 'वापस पंडित कार्यक्षेत्र (Return to Workspace)' : 'पंडित सूची पर लौटें (Return)'}
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-1.5 text-[11px] text-[#A69F94] hover:text-white underline cursor-pointer"
                >
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

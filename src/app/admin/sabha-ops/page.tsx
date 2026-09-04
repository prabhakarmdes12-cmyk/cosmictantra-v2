'use client';

/**
 * SABHA OPS CONSOLE — Customer-Care routing & operations (P1).
 *
 * WIRING (Phase 1): previously this console mutated a client-side in-memory
 * store; it now reads the SERVER-authoritative session vault via
 * GET /api/sabha/sessions?view=ops (5s polling) and executes every control
 * through the server APIs. The console is strictly a ROUTING layer:
 *   • CARE QUEUE: assign a verified Pandit → dispatch the call → copy the
 *     Pandit's ring link. The operator NEVER joins the media room; after
 *     dispatch both parties are alone on their private DTLS-SRTP call (TEST A).
 *   • Authorized controls (PSTN masked failover / grace / refund) run through
 *     the preserved Sabha engines server-side.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Phone,
  Clock,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  RotateCcw,
  Activity,
  Radio,
  Headset,
  Send,
  Copy,
  CopyCheck,
  PhoneIncoming,
  Loader2,
  Zap
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';

interface OpsSession {
  sessionId: string;
  initiationMode: 'CARE_ASSISTED' | 'DIRECT' | 'SCHEDULED';
  state: string;
  activeTransport: 'WEB_RTC' | 'PSTN_PHONE';
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  durationSeconds?: number;
  queueStatus: 'UNASSIGNED' | 'ASSIGNED' | 'DISPATCHED' | 'LIVE' | 'CLOSED';
  payerName: string;
  beneficiaryName: string;
  scholar: { scholarId: string; name: string; title: string };
  question: string;
  category: string;
  language: string;
  webrtcTelemetry?: {
    iceConnectionState: string;
    roundTripTimeMs: number;
    jitterMs: number;
    packetLossPercentage: number;
    selectedCandidateType: string;
  } | null;
  pstnTelemetry?: { leg1Status: string; leg2Status: string } | null;
  costLedger: {
    grossBookingValueInr: number;
    paymentGatewayFeeInr: number;
    scholarPayoutInr: number;
    webrtcCostInr: number;
    turnCostInr: number;
    aiCostInr: number;
    whatsAppCostInr: number;
    netContributionMarginInr: number;
  };
  payment: { isVerified: boolean; amountInr: number };
}

interface DirectoryScholar {
  scholarId: string;
  name: string;
  title: string;
}

const queueStatusBadge: Record<string, { label: string; cls: string }> = {
  UNASSIGNED: { label: 'कतार — आवंटन शेष', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  ASSIGNED: { label: 'पंडित आवंटित — डिस्पैच शेष', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-400' },
  DISPATCHED: { label: 'डिस्पैच — रिंग जारी', cls: 'bg-violet-500/15 text-violet-700 dark:text-violet-400' },
  LIVE: { label: 'लाइव कॉल', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse' },
  CLOSED: { label: 'समाप्त', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' }
};

export default function SabhaOperationsConsole() {
  const [sessions, setSessions] = useState<OpsSession[]>([]);
  const [scholars, setScholars] = useState<DirectoryScholar[]>([]);
  const [selectedSession, setSelectedSession] = useState<OpsSession | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>('ALL');
  const [assignPick, setAssignPick] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sabha/sessions?view=ops', { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) {
        const list: OpsSession[] = data.sessions || [];
        setSessions(list);
        setSelectedSession(prev =>
          prev ? list.find(s => s.sessionId === prev.sessionId) || list[0] || null : list[0] || null
        );
      }
    } catch {
      /* console keeps last snapshot on transient errors */
    }
  }, []);

  useEffect(() => {
    void loadSessions();
    const poll = setInterval(() => void loadSessions(), 5000);
    return () => clearInterval(poll);
  }, [loadSessions]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sabha/directory', { cache: 'no-store' });
        const data = await res.json();
        if (data?.ok) setScholars(data.scholars || []);
      } catch {
        /* directory optional */
      }
    })();
  }, []);

  // ------------------------------------------------------------------
  // CARE QUEUE — assign → dispatch (TEST A routing, media-never)
  // ------------------------------------------------------------------
  const handleAssign = async (s: OpsSession) => {
    if (!assignPick) {
      setActionNotice('पहले सत्यापित पंडित चुनें।');
      return;
    }
    chitiSensory.playTick();
    setBusy(`assign-${s.sessionId}`);
    try {
      const res = await fetch(`/api/sabha/sessions/${s.sessionId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scholarId: assignPick, operatorId: 'CARE-OPS-01' })
      });
      const data = await res.json();
      if (data?.ok) {
        setActionNotice(`पंडित आवंटित: ${data.scholar?.name}। अब कॉल डिस्पैच करें।`);
        await loadSessions();
      } else {
        setActionNotice(data?.error || 'आवंटन विफल।');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleDispatch = async (s: OpsSession) => {
    chitiSensory.playTick();
    setBusy(`dispatch-${s.sessionId}`);
    try {
      const res = await fetch(`/api/sabha/sessions/${s.sessionId}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: 'CARE-OPS-01' })
      });
      const data = await res.json();
      if (data?.ok) {
        await loadSessions();
        // Hand the Pandit's ring link to the delivery surface (workspace/notification).
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${data.consultantRoomUrl}`);
          setCopiedFor(s.sessionId);
          if (copiedTimer.current) clearTimeout(copiedTimer.current);
          copiedTimer.current = setTimeout(() => setCopiedFor(null), 4000);
          setActionNotice('कॉल डिस्पैच! पंडित रिंग-लिंक क्लिपबोर्ड पर कॉपी हो गया — पंडित वर्कस्पेस को भेजें। ऑपरेटर मीडिया में शामिल नहीं होता।');
        } catch {
          setActionNotice('कॉल डिस्पैच! पंडित रिंग-लिंक पंडित वर्कस्पेस पर दिखेगा।');
        }
      } else {
        setActionNotice(data?.error || 'डिस्पैच विफल।');
      }
    } finally {
      setBusy(null);
    }
  };

  // ------------------------------------------------------------------
  // Authorized operational controls (server-executed, preserved engines)
  // ------------------------------------------------------------------
  const handleOpsAction = async (s: OpsSession, action: 'PSTN_HANDOVER' | 'EXTEND_GRACE' | 'EXECUTE_REFUND') => {
    chitiSensory.playTick();
    setBusy(`${action}-${s.sessionId}`);
    try {
      const res = await fetch(`/api/sabha/sessions/${s.sessionId}/ops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, operatorId: 'ADMIN-OPS-01' })
      });
      const data = await res.json();
      setActionNotice(data?.ok ? data.message : data?.error || 'क्रिया विफल।');
      await loadSessions();
    } finally {
      setBusy(null);
    }
  };

  const careQueue = sessions.filter(
    s => s.initiationMode === 'CARE_ASSISTED' && ['UNASSIGNED', 'ASSIGNED', 'DISPATCHED'].includes(s.queueStatus)
  );

  const filteredSessions =
    filterState === 'ALL' ? sessions : sessions.filter(s => s.state === filterState);

  return (
    <CosmicTantraShell shellMode="scholar" footerMode="none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 font-mono-data text-[#1C1917] dark:text-[#FAF7F2]">
        {/* Ops Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>COSMICTANTRA SABHA • LIVE OPERATIONS CONSOLE (P1)</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold mt-1">
              वास्तविक परामर्श नियंत्रण एवं विश्वसनीयता बेंच
            </h1>
            <p className="text-[11px] text-[#857E74] mt-1">
              केयर = रूटिंग परत (मीडिया में कभी नहीं) • मुफ्त 1:1 कॉल • शून्य रिकॉर्डिंग
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                chitiSensory.playTick();
                void loadSessions();
              }}
              className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>रिफ्रेश</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>सर्वर-प्राधिकृत स्टेट इंजन</span>
            </div>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Headset className="w-3.5 h-3.5 shrink-0" />
              {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="font-bold underline text-xs shrink-0">
              बंद करें
            </button>
          </div>
        )}

        {/* CARE QUEUE — routing panel */}
        <div className="mt-6 p-5 rounded-3xl bg-white dark:bg-[#090B12] border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
            <span className="font-bold text-sm flex items-center gap-2 text-[#8E6F1D] dark:text-[#F0C968]">
              <PhoneIncoming className="w-4 h-4" />
              केयर कतार — आवंटन एवं डिस्पैच (Routing Layer)
            </span>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
              {careQueue.length} प्रतीक्षारत
            </span>
          </div>

          {careQueue.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-[#857E74]">
              कोई केयर-सहायता अनुरोध कतार में नहीं। (नया अनुरोध /consultation/pandits से पंजीकृत होता है।)
            </p>
          ) : (
            <div className="pt-3 space-y-3">
              {careQueue.map(s => (
                <div key={s.sessionId} className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0E101D] border border-black/10 dark:border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-[#1C1917] dark:text-white">{s.beneficiaryName}</span>
                      <span className="text-[10px] text-[#857E74] block mt-0.5">
                        {s.sessionId} • {s.category} • {s.language} • सेवा: मुफ्त (₹0)
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${queueStatusBadge[s.queueStatus].cls}`}>
                      {queueStatusBadge[s.queueStatus].label}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#57524A] dark:text-[#D1C9BF] italic">“{s.question}”</p>

                  {s.queueStatus === 'UNASSIGNED' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={assignPick}
                        onChange={e => setAssignPick(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white dark:bg-[#070912] border border-black/10 dark:border-white/10 text-xs focus:outline-none focus:border-[#8E6F1D]"
                      >
                        <option value="">— सत्यापित पंडित चुनें —</option>
                        {scholars.map(sc => (
                          <option key={sc.scholarId} value={sc.scholarId}>
                            {sc.name} ({sc.scholarId})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(s)}
                        disabled={busy === `assign-${s.sessionId}`}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                      >
                        {busy === `assign-${s.sessionId}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span>पंडित आवंटित करें</span>
                      </button>
                    </div>
                  )}

                  {s.queueStatus === 'ASSIGNED' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {s.scholar.name}
                      </span>
                      <button
                        onClick={() => handleDispatch(s)}
                        disabled={busy === `dispatch-${s.sessionId}`}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                      >
                        {busy === `dispatch-${s.sessionId}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        <span>कॉल डिस्पैच करें (दोनों ओर रिंग)</span>
                      </button>
                    </div>
                  )}

                  {s.queueStatus === 'DISPATCHED' && (
                    <div className="text-[11px] text-violet-700 dark:text-violet-300 font-bold flex items-center gap-1.5">
                      <PhoneIncoming className="w-3.5 h-3.5 animate-pulse" />
                      दोनों पक्षों को रिंग भेजी गई — ऑपरेटर अब हट चुका है। कॉल पूर्णतः निजी १:१ है।
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Split: Sessions & Inspection */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Live Sessions */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#857E74]">
              <span className="font-bold">सक्रिय सत्र ({filteredSessions.length})</span>
              <div className="flex items-center gap-1">
                {['ALL', 'CONNECTING', 'ACTIVE', 'COMPLETED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterState(f)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      filterState === f ? 'bg-[#8E6F1D] text-white' : 'bg-black/5 dark:bg-white/5'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredSessions.map(s => {
              const isSelected = selectedSession?.sessionId === s.sessionId;
              return (
                <div
                  key={s.sessionId}
                  onClick={() => {
                    chitiSensory.playTick();
                    setSelectedSession(s);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF7F2] dark:bg-[#121522] border-[#8E6F1D] dark:border-[#D4AF37] shadow-md'
                      : 'bg-white dark:bg-[#090B12] border-black/10 dark:border-white/10 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#1C1917] dark:text-white">{s.beneficiaryName}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.state === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 animate-pulse'
                          : s.state === 'COMPLETED'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      {s.state}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#857E74] mt-1 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        s.initiationMode === 'DIRECT'
                          ? 'bg-violet-500/15 text-violet-700 dark:text-violet-400'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {s.initiationMode}
                    </span>
                    <span>{s.sessionId}</span>
                    <span>• {s.activeTransport === 'WEB_RTC' ? '🌐 Web Sabha' : '📞 Exotel PSTN'}</span>
                    {s.durationSeconds !== undefined && s.durationSeconds > 0 && (
                      <span>• ⏱ {Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s</span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#857E74] mt-1">
                    विद्वान्: {s.scholar.name} • {s.payment.amountInr === 0 ? 'मुफ्त कॉल (₹0)' : `भुगतान: ₹${s.payment.amountInr}`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Mission Control */}
          <div className="lg:col-span-7 space-y-4">
            {selectedSession ? (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#090B12] border border-black/10 dark:border-white/10 space-y-4 shadow-lg">
                <div className="pb-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#857E74] uppercase tracking-wider block">परामर्श पहचान पत्र</span>
                    <span className="font-bold text-sm text-[#8E6F1D] dark:text-[#F0C968]">{selectedSession.sessionId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#857E74] block">प्रवेश मोड</span>
                    <span className="font-bold text-xs">{selectedSession.initiationMode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <span className="text-[10px] text-[#857E74] block font-bold">भक्त (Devotee):</span>
                    <strong className="text-[#1C1917] dark:text-white block mt-0.5">{selectedSession.beneficiaryName}</strong>
                    <span className="text-[10px] text-[#857E74]">फ़ोन मास्क्ड (कभी साझा नहीं)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5">
                    <span className="text-[10px] text-[#857E74] block font-bold">पंडित जी (Scholar):</span>
                    <strong className="text-[#1C1917] dark:text-white block mt-0.5">{selectedSession.scholar.name}</strong>
                    <span className="text-[10px] text-[#857E74]">{selectedSession.scholar.title}</span>
                  </div>
                </div>

                {/* Real-time Telemetry */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-black/40 border border-black/5 dark:border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span>रियल-टाइम मीडिया टेलीमेट्री</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      ICE: {selectedSession.webrtcTelemetry?.iceConnectionState || selectedSession.state}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#57524A] dark:text-[#D1C9BF]">
                    <div>RTT: <strong>{selectedSession.webrtcTelemetry?.roundTripTimeMs ?? '—'} ms</strong></div>
                    <div>Jitter: <strong>{selectedSession.webrtcTelemetry?.jitterMs ?? '—'} ms</strong></div>
                    <div>Pkt Loss: <strong>{selectedSession.webrtcTelemetry?.packetLossPercentage ?? '—'}%</strong></div>
                    <div>Candidate: <strong>{selectedSession.webrtcTelemetry?.selectedCandidateType ?? '—'}</strong></div>
                  </div>

                  {selectedSession.durationSeconds !== undefined && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                      <Clock className="w-3 h-3" />
                      अभिलेखित अवधि: {Math.floor(selectedSession.durationSeconds / 60)}m {selectedSession.durationSeconds % 60}s
                      (केवल मेटाडेटा — कोई रिकॉर्डिंग नहीं)
                    </div>
                  )}
                </div>

                {/* Free-call ledger note */}
                {selectedSession.payment.amountInr === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    मुफ्त कॉल सत्र — शून्य लागत, शून्य भुगतान (Free Call Invariant सक्रिय)
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1.5 text-[#57524A] dark:text-[#D1C9BF]">
                    <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                      <span>वास्तविक लागत बहीखाता</span>
                      <span>₹{selectedSession.costLedger.grossBookingValueInr}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10.5px]">
                      <div>गेटवे शुल्क: ₹{selectedSession.costLedger.paymentGatewayFeeInr}</div>
                      <div>विद्वान् मानदेय: ₹{selectedSession.costLedger.scholarPayoutInr}</div>
                      <div>शुद्ध मार्जिन: <strong className="text-emerald-600 dark:text-emerald-400">₹{selectedSession.costLedger.netContributionMarginInr}</strong></div>
                    </div>
                  </div>
                )}

                {/* Authorized Controls */}
                <div>
                  <span className="text-xs font-bold text-[#857E74] block mb-2">प्राधिकृत ऑपरेशन्स (सर्वर-निष्पादित):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleOpsAction(selectedSession, 'PSTN_HANDOVER')}
                      disabled={busy === `PSTN_HANDOVER-${selectedSession.sessionId}`}
                      className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>PSTN पर स्विच</span>
                    </button>

                    <button
                      onClick={() => handleOpsAction(selectedSession, 'EXTEND_GRACE')}
                      disabled={busy === `EXTEND_GRACE-${selectedSession.sessionId}`}
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>+५ मिनट अनुग्रह</span>
                    </button>

                    <button
                      onClick={() => handleOpsAction(selectedSession, 'EXECUTE_REFUND')}
                      disabled={busy === `EXECUTE_REFUND-${selectedSession.sessionId}` || selectedSession.payment.amountInr === 0}
                      className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>रिफंड (मुफ्त कॉल पर लागू नहीं)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl border border-dashed border-black/10 dark:border-white/10 text-center text-xs text-[#857E74]">
                कृपया निरीक्षण हेतु सत्र का चयन करें।
              </div>
            )}
          </div>
        </div>

        {/* Ops footer: entry points */}
        <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px]">
          <span className="text-[#857E74] font-bold">प्रवेश बिंदु:</span>
          <Link href="/consultation/pandits" className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 font-bold hover:bg-black/10">
            मुफ्त कॉल डायरेक्टरी (Customer)
          </Link>
          <Link href="/pandit/workspace" className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 font-bold hover:bg-black/10">
            पंडित वर्कस्पेस (Incoming Rings)
          </Link>
          <span className="text-[#857E74] flex items-center gap-1">
            <Copy />&nbsp;डिस्पैच पर पंडित-लिंक स्वतः कॉपी
            {copiedFor && <CopyCheck className="w-3 h-3 text-emerald-500" />}
          </span>
          <span className="text-[#857E74] flex items-center gap-1">
            <Send className="w-3 h-3" /> Phase 2: WhatsApp ring delivery
          </span>
        </div>
      </div>
    </CosmicTantraShell>
  );
}

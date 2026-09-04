'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import ChitigramInbox from '@/components/chitigram/ChitigramInbox';
import ChitigramChatDrawer from '@/components/chitigram/ChitigramChatDrawer';
import ChitigramContextHeader from '@/components/chitigram/ChitigramContextHeader';
import ChitigramAuditTimeline from '@/components/chitigram/ChitigramAuditTimeline';
import ChitigramNotifications from '@/components/chitigram/ChitigramNotifications';
import { chitiSensory } from '@/lib/chitiAudio';
import {
  Users,
  Phone,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Award,
  Clock,
  Pause,
  Play,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function ChitigramInboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialConversationId = searchParams.get('conversationId') || '';

  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId || null);
  const [conversation, setConversation] = useState<any | null>(null);
  const [contextHeader, setContextHeader] = useState<any | null>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [assignments, setAssignments] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [presence, setPresence] = useState<any[]>([]);
  const [assignPractitionerId, setAssignPractitionerId] = useState('');
  const [assignName, setAssignName] = useState('');
  const [transferCallId, setTransferCallId] = useState('');
  const [busy, setBusy] = useState(false);

  const viewerId = 'operator-1';
  const viewerRole = 'operator';

  const fetchConversation = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/chitigram/conversations/${encodeURIComponent(id)}?viewerId=${encodeURIComponent(viewerId)}&viewerRole=${viewerRole}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) {
        setConversation(data.conversation);
        setContextHeader(data.contextHeader);
        setAudit(data.audit || []);
        setParticipants(data.participants || []);
        setAssignments(data.assignments || []);
        setCalls(data.calls || []);
      }
    } catch {}
  }, []);

  const fetchPresence = useCallback(async () => {
    try {
      const res = await fetch('/api/chitigram/presence?organizationId=cosmic-tantra', { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.presence)) setPresence(data.presence);
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedId) void fetchConversation(selectedId);
  }, [selectedId, fetchConversation]);

  useEffect(() => {
    void fetchPresence();
    const iv = setInterval(() => void fetchPresence(), 5000);
    return () => clearInterval(iv);
  }, [fetchPresence]);

  const handleSelect = (id: string) => {
    chitiSensory.playTick();
    setSelectedId(id);
    router.push(`/chitigram/inbox?conversationId=${encodeURIComponent(id)}`);
  };

  const handleAssign = async () => {
    if (!selectedId || !assignPractitionerId) return;
    setBusy(true);
    try {
      chitiSensory.playTick();
      const res = await fetch('/api/chitigram/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedId,
          practitionerId: assignPractitionerId,
          practitionerName: assignName || assignPractitionerId,
          assignedBy: viewerId,
          actorRole: viewerRole,
        }),
      });
      const data = await res.json();
      if (data?.ok) await fetchConversation(selectedId);
    } finally {
      setBusy(false);
    }
  };

  const handleState = async (toState: string) => {
    if (!selectedId) return;
    setBusy(true);
    try {
      chitiSensory.playTick();
      const res = await fetch('/api/chitigram/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, toState, actorId: viewerId, actorRole: viewerRole }),
      });
      await res.json();
      await fetchConversation(selectedId);
    } finally {
      setBusy(false);
    }
  };

  const handleHold = async (action: 'HOLD' | 'RESUME') => {
    const callId = transferCallId || calls[0]?.id;
    if (!callId) return;
    setBusy(true);
    try {
      chitiSensory.playTick();
      await fetch('/api/chitigram/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, callId, actorId: viewerId, actorRole: viewerRole }),
      });
      await fetchConversation(selectedId!);
    } finally {
      setBusy(false);
    }
  };

  const handleAddPandit = async () => {
    const callId = transferCallId || calls[0]?.id;
    if (!callId || !assignPractitionerId) return;
    setBusy(true);
    try {
      chitiSensory.playTick();
      await fetch('/api/chitigram/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_PANDIT', callId, practitionerId: assignPractitionerId, practitionerName: assignName, actorId: viewerId, actorRole: viewerRole }),
      });
      await fetchConversation(selectedId!);
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async () => {
    const callId = transferCallId || calls[0]?.id;
    if (!callId || !assignPractitionerId) return;
    setBusy(true);
    try {
      chitiSensory.playTick();
      await fetch('/api/chitigram/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TRANSFER', callId, toPractitionerId: assignPractitionerId, actorId: viewerId, actorRole: viewerRole }),
      });
      await fetchConversation(selectedId!);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      chitiSensory.playTick();
      await fetch('/api/chitigram/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedId,
          transactionId: `TXN-${Date.now()}`,
          referenceId: `REF-${Math.random().toString(36).slice(2, 8)}`,
          verifiedBy: viewerId,
          actorRole: viewerRole,
          amountInr: 501,
        }),
      });
      await fetchConversation(selectedId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <CosmicTantraShell shellMode="minimal" footerMode="none">
      <div className="min-h-[calc(100vh-70px)] bg-[#070913] text-[#FAF7F2] p-2 sm:p-4 flex flex-col gap-4">
        <div className="px-4 py-3 rounded-2xl bg-[#0D101C] border border-[#D4AF37]/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8E6F1D] flex items-center justify-center text-black font-bold">◉</div>
            <div>
              <div className="text-sm font-bold text-white">Chitigram Operator Inbox — CosmicTantra Pilot v0.2</div>
              <div className="text-[11px] text-white/50">One help-desk operator • Multiple Pandits • Real devotees • Server-truth</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ChitigramNotifications userId={viewerId} onNavigate={id => handleSelect(id)} />
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {presence.filter(p => p.connectionState === 'ONLINE').length} online
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs">{presence.length} known</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
          <div className="lg:col-span-5 flex flex-col min-h-[600px]">
            <ChitigramInbox
              viewerId={viewerId}
              viewerRole={viewerRole}
              onSelectConversation={handleSelect}
              selectedConversationId={selectedId}
              className="flex-1"
            />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4 min-h-[600px]">
            {!selectedId || !conversation ? (
              <div className="flex-1 rounded-2xl bg-[#0D101C] border border-[#D4AF37]/20 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#8E6F1D]/20 border border-[#D4AF37]/20 flex items-center justify-center text-3xl mb-4">🕉️</div>
                <div className="text-sm font-bold text-white">Select a conversation from inbox</div>
                <div className="text-xs text-white/50 mt-1 max-w-md">Opening a row loads the existing Chitigram conversation with context header, messages, calls, assignments, audit timeline and warm-transfer controls.</div>
                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-white/50 text-left max-w-md">
                  <div className="font-bold text-white mb-1">Pilot E2E demo:</div>
                  <div>1. Devotee creates consultation → 2. Help desk sees unread → 3. Assign Pandit → 4. Pandit accepts → 5. All three join call → 6. Operator exits → 7. Call record appears → 8. Internal note → 9. Follow-up → 10. Closed • Restart server → history persists</div>
                </div>
              </div>
            ) : (
              <>
                <ChitigramContextHeader
                  seekerName={contextHeader?.seekerIdentity?.name || conversation.seekerName}
                  seekerPhoneMasked={contextHeader?.seekerIdentity?.phoneMasked || conversation.seekerPhoneMasked}
                  language={contextHeader?.language || conversation.language}
                  category={contextHeader?.topic || conversation.category}
                  originalQuestion={contextHeader?.originalQuestion || conversation.originalQuestion}
                  paymentStatus={contextHeader?.paymentStatus || conversation.paymentStatus}
                  paymentAmountInr={contextHeader?.paymentAmountInr || conversation.paymentAmountInr}
                  paymentVerifiedAt={contextHeader?.paymentVerifiedAt || conversation.paymentVerifiedAt}
                  kundliRef={contextHeader?.kundliRef || conversation.kundliRef}
                  kundliSummary={contextHeader?.kundliSummary || conversation.kundliSummary}
                  assignedPandit={contextHeader?.assignedPandit || (conversation.assignedPractitionerId ? { id: conversation.assignedPractitionerId, name: conversation.assignedPractitionerName || '' } : null)}
                />

                <div className="p-3 rounded-2xl bg-[#0D101C] border border-[#D4AF37]/20 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> State: <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white">{conversation.state}</span>
                    </span>
                    <div className="ml-auto flex items-center gap-1.5 flex-wrap">
                      {['WAITING', 'ASSIGNED', 'RINGING', 'ACCEPTED', 'LIVE', 'ENDED', 'FOLLOW_UP', 'CLOSED'].map(s => (
                        <button
                          key={s}
                          onClick={() => void handleState(s)}
                          disabled={busy || conversation.state === s}
                          className="px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold disabled:opacity-30 cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
                      <div className="text-[11px] font-bold text-[#D4AF37] flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> Manual Assignment (Operator)
                      </div>
                      <div className="flex gap-2">
                        <input value={assignPractitionerId} onChange={e => setAssignPractitionerId(e.target.value)} placeholder="Pandit ID" className="flex-1 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/30" />
                        <input value={assignName} onChange={e => setAssignName(e.target.value)} placeholder="Name" className="w-24 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/30" />
                      </div>
                      <button onClick={handleAssign} disabled={busy || !assignPractitionerId} className="w-full py-2 rounded-xl bg-[#D4AF37] text-black text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> Assign Pandit
                      </button>
                      {assignments.length > 0 && <div className="text-[10px] text-white/40">History: {assignments.map(a => `${a.practitionerName || a.practitionerId} (${a.acceptanceState})`).join(' → ')}</div>}
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-2">
                      <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> Warm Transfer — Devotee → Desk → Pandit
                      </div>
                      <input value={transferCallId} onChange={e => setTransferCallId(e.target.value)} placeholder="Call ID (or auto latest)" className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/30" />
                      <div className="grid grid-cols-3 gap-1.5">
                        <button onClick={() => void handleHold('HOLD')} disabled={busy} className="py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                          <Pause className="w-3 h-3" /> Hold
                        </button>
                        <button onClick={() => void handleHold('RESUME')} disabled={busy} className="py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                          <Play className="w-3 h-3" /> Resume
                        </button>
                        <button onClick={handleAddPandit} disabled={busy || !assignPractitionerId} className="py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                          <UserPlus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <button onClick={handleTransfer} disabled={busy || !assignPractitionerId} className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                        <RefreshCw className="w-3 h-3" /> Transfer
                      </button>
                      <div className="text-[10px] text-white/30">Shared multi-participant room • Operator can leave after intro • Preserves 1:1</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={handleVerifyPayment} disabled={busy} className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify Payment (backend only) — PAID
                    </button>
                    <span className="text-[11px] text-white/40">UPI intent never marks PAID — only this verifies</span>
                    <span className={`ml-auto px-2 py-1 rounded-full text-[11px] font-bold border ${conversation.paymentStatus === 'PAID' || conversation.paymentStatus === 'VERIFIED' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'}`}>
                      {conversation.paymentStatus} {conversation.paymentAmountInr ? `₹${conversation.paymentAmountInr}` : ''}
                    </span>
                  </div>

                  {calls.length > 0 && (
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                      <div className="font-bold text-white flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#D4AF37]" /> Call Records ({calls.length})
                      </div>
                      {calls.map(c => (
                        <div key={c.id} className="flex items-center gap-2 text-[11px] text-white/60 font-mono">
                          <span className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">{c.outcome || 'RINGING'}</span>
                          <span>{c.callerRole} → {c.recipientIds.join(', ')}</span>
                          <span className="ml-auto">{c.durationSeconds ? `${c.durationSeconds}s` : '—'}</span>
                          <span className="text-[10px] text-white/30">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-h-[420px]">
                  <ChitigramChatDrawer
                    conversationId={conversation.id}
                    role="operator"
                    consultantName={conversation.assignedPractitionerName || 'Pandit'}
                    seekerName={conversation.seekerName || 'श्रद्धालु भक्त'}
                    prashna={conversation.originalQuestion || ''}
                    organizationId={conversation.organizationId}
                    domain={conversation.domain}
                    viewerId={viewerId}
                    enableInternalNotes
                    enableVoice
                    className="h-full min-h-[520px]"
                  />
                </div>

                <ChitigramAuditTimeline events={audit} />
              </>
            )}
          </div>
        </div>

        <div className="px-3 py-2 rounded-xl bg-black/30 border border-white/5 text-[11px] text-white/40 flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Pilot instrumentation: metrics auto-refresh • All transitions audited • Presence server-backed • Payment truth enforced • Internal notes team-only</span>
        </div>
      </div>
    </CosmicTantraShell>
  );
}

export default function ChitigramOperatorInboxPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-70px)] bg-[#070913] flex items-center justify-center text-white/60">Loading Chitigram Inbox…</div>}>
      <ChitigramInboxContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Clock, CreditCard, User, MessageSquare, Phone, AlertCircle, CheckCircle2, Filter, Timer, Users, Inbox as InboxIcon, Loader2 } from 'lucide-react';
import { chitiSensory } from '@/lib/chitiAudio';
import type { ChitigramInboxRow, ChitigramConversationState, InboxFilter } from '@/lib/chitigram/domain';

// Props for inbox — operator view
export interface ChitigramInboxProps {
  organizationId?: string;
  domain?: string;
  viewerId?: string;
  viewerRole?: string;
  onSelectConversation?: (conversationId: string, row: ChitigramInboxRow) => void;
  selectedConversationId?: string | null;
  className?: string;
}

const FILTERS: { label: string; value: InboxFilter; desc: string }[] = [
  { label: 'ALL', value: 'ALL', desc: 'All conversations' },
  { label: 'WAITING', value: 'WAITING', desc: 'Queue' },
  { label: 'ACTIVE', value: 'ACTIVE', desc: 'Assigned / Live' },
  { label: 'FOLLOW-UP', value: 'FOLLOW_UP', desc: 'Follow-up' },
  { label: 'CLOSED', value: 'CLOSED', desc: 'Closed' },
];

function formatWaiting(seconds?: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function stateBadge(state: ChitigramConversationState): { label: string; color: string } {
  switch (state) {
    case 'WAITING':
    case 'CREATED':
      return { label: 'WAITING', color: 'bg-amber-500/15 border-amber-500/30 text-amber-300' };
    case 'ASSIGNED':
      return { label: 'ASSIGNED', color: 'bg-sky-500/15 border-sky-500/30 text-sky-300' };
    case 'RINGING':
      return { label: 'RINGING', color: 'bg-violet-500/15 border-violet-500/30 text-violet-300 animate-pulse' };
    case 'ACCEPTED':
      return { label: 'ACCEPTED', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' };
    case 'LIVE':
      return { label: 'LIVE', color: 'bg-emerald-600 text-white border-emerald-600 animate-pulse' };
    case 'ENDED':
      return { label: 'ENDED', color: 'bg-slate-500/15 border-slate-500/30 text-slate-300' };
    case 'FOLLOW_UP':
      return { label: 'FOLLOW-UP', color: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300' };
    case 'CLOSED':
      return { label: 'CLOSED', color: 'bg-white/5 border-white/10 text-white/50' };
    case 'DECLINED':
      return { label: 'DECLINED', color: 'bg-rose-500/15 border-rose-500/30 text-rose-300' };
    case 'NO_ANSWER':
      return { label: 'NO ANSWER', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
    case 'CANCELLED':
      return { label: 'CANCELLED', color: 'bg-slate-500/10 border-slate-500/20 text-slate-400' };
    case 'FAILED':
      return { label: 'FAILED', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400' };
    case 'REASSIGNED':
      return { label: 'REASSIGNED', color: 'bg-sky-500/10 border-sky-500/20 text-sky-300' };
    default:
      return { label: state, color: 'bg-white/5 border-white/10 text-white/60' };
  }
}

function paymentBadge(status: string): { label: string; color: string } {
  if (status === 'PAID' || status === 'VERIFIED') return { label: 'PAID', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' };
  if (status === 'PENDING') return { label: 'PENDING', color: 'bg-amber-500/15 border-amber-500/30 text-amber-300' };
  if (status === 'FAILED') return { label: 'FAILED', color: 'bg-rose-500/15 border-rose-500/30 text-rose-300' };
  return { label: status, color: 'bg-white/5 border-white/10 text-white/50' };
}

export default function ChitigramInbox({
  organizationId = 'cosmic-tantra',
  domain = 'cosmic-tantra',
  viewerId,
  viewerRole = 'operator',
  onSelectConversation,
  selectedConversationId,
  className = '',
}: ChitigramInboxProps) {
  const [filter, setFilter] = useState<InboxFilter>('ALL');
  const [rows, setRows] = useState<ChitigramInboxRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [metrics, setMetrics] = useState<any>(null);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        organizationId,
        domain,
        limit: '100',
        offset: '0',
      });
      if (viewerId) params.set('viewerId', viewerId);
      if (viewerRole) params.set('viewerRole', viewerRole);
      const res = await fetch(`/api/chitigram/conversations?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.rows)) {
        setRows(data.rows as ChitigramInboxRow[]);
        setTotal(typeof data.total === 'number' ? data.total : data.rows.length);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, organizationId, domain, viewerId, viewerRole]);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`/api/chitigram/metrics?organizationId=${encodeURIComponent(organizationId)}&domain=${encodeURIComponent(domain)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok && data.metrics) setMetrics(data.metrics);
    } catch {}
  }, [organizationId, domain]);

  useEffect(() => {
    void fetchInbox();
    void fetchMetrics();
    const iv = setInterval(() => {
      void fetchInbox();
      void fetchMetrics();
    }, 4000);
    return () => clearInterval(iv);
  }, [fetchInbox, fetchMetrics]);

  const filteredRows = search.trim()
    ? rows.filter(r => {
        const q = search.toLowerCase();
        return (
          (r.conversation.seekerName || '').toLowerCase().includes(q) ||
          (r.conversation.originalQuestion || '').toLowerCase().includes(q) ||
          (r.conversation.category || '').toLowerCase().includes(q) ||
          (r.conversation.id || '').toLowerCase().includes(q) ||
          (r.conversation.assignedPractitionerName || '').toLowerCase().includes(q) ||
          (r.latestMessage?.text || '').toLowerCase().includes(q)
        );
      })
    : rows;

  return (
    <div className={`flex flex-col h-full bg-[#0D101C] border border-[#D4AF37]/20 rounded-2xl shadow-xl overflow-hidden ${className}`} data-testid="chitigram-inbox">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-[#0D101C] via-[#12152A] to-[#0D101C] border-b border-[#D4AF37]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8E6F1D] flex items-center justify-center shadow-md">
            <InboxIcon className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              CosmicTantra Chitigram Inbox
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">{total}</span>
            </div>
            <div className="text-[11px] text-white/50">Help-desk operator • {domain} • {organizationId}</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[11px] text-white/50">
          {metrics && (
            <>
              <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1">
                <Users className="w-3 h-3" /> {metrics.activeConversations} active
              </span>
              <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {metrics.unreadBacklog} unread
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="shrink-0 px-3 py-2 bg-black/20 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => {
              chitiSensory.playTick();
              setFilter(f.value);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === f.value ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title={f.desc}
          >
            {f.label === 'ALL' && <Filter className="w-3 h-3" />}
            {f.label === 'WAITING' && <Timer className="w-3 h-3" />}
            {f.label === 'ACTIVE' && <Phone className="w-3 h-3" />}
            {f.label === 'FOLLOW-UP' && <MessageSquare className="w-3 h-3" />}
            {f.label === 'CLOSED' && <CheckCircle2 className="w-3 h-3" />}
            <span>{f.label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search seeker, topic, Pandit..."
              className="pl-8 pr-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/30 w-44 md:w-56"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-white/50 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading conversations...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-3">📭</div>
            <div className="text-sm font-bold text-white">No conversations in {filter}</div>
            <div className="text-xs text-white/50 mt-1 max-w-xs">New devotee messages and consultation requests will appear here. Try changing filter or search.</div>
          </div>
        ) : (
          filteredRows.map(row => {
            const c = row.conversation;
            const sBadge = stateBadge(c.state as ChitigramConversationState);
            const pBadge = paymentBadge(c.paymentStatus);
            const isSelected = selectedConversationId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  chitiSensory.playTick();
                  onSelectConversation?.(c.id, row);
                }}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors cursor-pointer ${isSelected ? 'bg-[#D4AF37]/10 border-l-2 border-l-[#D4AF37]' : 'border-l-2 border-l-transparent'}`}
                data-testid={`inbox-row-${c.id}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37]/30 to-[#8E6F1D]/30 border border-[#D4AF37]/20 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {(c.seekerName || 'भ')[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{c.seekerName || 'श्रद्धालु भक्त'}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sBadge.color}`}>{sBadge.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pBadge.color} flex items-center gap-1`}>
                      <CreditCard className="w-3 h-3" /> {pBadge.label}
                    </span>
                    {row.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {row.unreadCount} unread
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-white/50">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {c.category || 'General'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="flex items-center gap-1 truncate max-w-[160px]">
                      Pandit: {c.assignedPractitionerName || 'Unassigned'}
                      {row.assignedPractitioner?.availability && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] border ${row.presence?.connectionState === 'ONLINE' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-white/40'}`}>
                          {row.presence?.connectionState === 'ONLINE' ? row.presence.availability || 'AVAILABLE' : 'OFFLINE'}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="text-white/70 truncate max-w-[260px]">
                      {row.latestMessage ? (row.latestMessage.text || `[${row.latestMessage.type} ${row.latestMessage.subType || ''}]`) : c.originalQuestion || 'No messages yet'}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-3 text-[10px] text-white/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(c.lastActivityAt).toLocaleString()}
                    </span>
                    {c.waitingSince && (c.state === 'WAITING' || c.state === 'CREATED') && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Timer className="w-3 h-3" /> waiting {formatWaiting(row.timeWaitingSeconds)}
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[9px] text-white/20">{c.id.slice(0, 8)}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer metrics */}
      {metrics && (
        <div className="shrink-0 px-3 py-2 bg-black/30 border-t border-white/5 flex items-center gap-3 text-[11px] text-white/50 overflow-x-auto">
          <span>
            {metrics.conversationsPerDay}/day • First response {metrics.avgFirstResponseSeconds ? `${Math.round(metrics.avgFirstResponseSeconds)}s` : '—'} • Queue {metrics.avgQueueWaitSeconds ? `${Math.round(metrics.avgQueueWaitSeconds)}s` : '—'}
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span>
            Answer {metrics.callAnswerRate != null ? `${Math.round(metrics.callAnswerRate * 100)}%` : '—'} • Avg {metrics.avgCallDurationSeconds ? `${Math.round(metrics.avgCallDurationSeconds)}s` : '—'} • No-answer {metrics.noAnswerRate != null ? `${Math.round(metrics.noAnswerRate * 100)}%` : '—'}
          </span>
        </div>
      )}
    </div>
  );
}

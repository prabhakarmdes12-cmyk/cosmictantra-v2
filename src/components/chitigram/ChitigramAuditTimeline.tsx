'use client';

import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Phone, User, CreditCard, FileText, ArrowRight, Award, MessageSquare, RefreshCw } from 'lucide-react';
import type { ChitigramAuditEvent } from '@/lib/chitigram/domain';

export interface ChitigramAuditTimelineProps {
  events: ChitigramAuditEvent[];
  className?: string;
}

function eventIcon(eventType: string): React.ReactNode {
  if (eventType.includes('CONVERSATION_CREATED') || eventType.includes('CREATED')) return <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />;
  if (eventType.includes('PAYMENT')) return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
  if (eventType.includes('ASSIGNED') || eventType.includes('REASSIGNED')) return <User className="w-3.5 h-3.5 text-sky-400" />;
  if (eventType.includes('CALL')) return <Phone className="w-3.5 h-3.5 text-violet-400" />;
  if (eventType.includes('ACCEPT')) return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
  if (eventType.includes('DECLINED') || eventType.includes('FAILED') || eventType.includes('NO_ANSWER')) return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
  if (eventType.includes('STATE')) return <ArrowRight className="w-3.5 h-3.5 text-white/60" />;
  if (eventType.includes('NOTE')) return <MessageSquare className="w-3.5 h-3.5 text-white/60" />;
  if (eventType.includes('FOLLOW_UP') || eventType.includes('CLOSED')) return <Award className="w-3.5 h-3.5 text-[#D4AF37]" />;
  if (eventType.includes('TRANSFER') || eventType.includes('HOLD')) return <RefreshCw className="w-3.5 h-3.5 text-sky-400" />;
  return <Clock className="w-3.5 h-3.5 text-white/40" />;
}

function formatTime(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return String(ts);
  }
}

export default function ChitigramAuditTimeline({ events, className = '' }: ChitigramAuditTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={`p-6 rounded-2xl bg-white/5 border border-white/10 text-center ${className}`}>
        <Clock className="w-8 h-8 mx-auto text-white/20 mb-2" />
        <div className="text-xs font-bold text-white/60">No audit events yet</div>
        <div className="text-[11px] text-white/40 mt-1">Timeline will populate as conversation progresses</div>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className={`p-4 rounded-2xl bg-[#0D101C] border border-[#D4AF37]/20 shadow-xl ${className}`} data-testid="chitigram-audit-timeline">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8E6F1D] flex items-center justify-center">
          <Clock className="w-4 h-4 text-black" />
        </div>
        <div>
          <div className="text-xs font-bold text-white">Operational Timeline</div>
          <div className="text-[10px] text-white/50">Server-authoritative • {sorted.length} events</div>
        </div>
      </div>

      <div className="relative pl-6 space-y-3">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-[#D4AF37]/40 via-white/10 to-transparent" />
        {sorted.map(ev => (
          <div key={ev.id} className="relative flex gap-3">
            <div className="absolute left-[-22px] w-5 h-5 rounded-full bg-[#0D101C] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
              {eventIcon(ev.eventType)}
            </div>
            <div className="flex-1 min-w-0 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">{ev.eventType}</span>
                {ev.fromState && ev.toState && (
                  <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-mono text-white/60">
                    {ev.fromState} → {ev.toState}
                  </span>
                )}
                {ev.actorRole && (
                  <span className="px-1.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[9px] font-bold">
                    {ev.actorRole}:{ev.actorId?.slice(0, 6) || 'system'}
                  </span>
                )}
              </div>
              {ev.details && (
                <div className="mt-1 text-[11px] text-white/50 font-mono break-words">
                  {JSON.stringify(ev.details).slice(0, 180)}
                  {JSON.stringify(ev.details).length > 180 ? '…' : ''}
                </div>
              )}
              <div className="text-[10px] text-white/30 mt-1">{formatTime(ev.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

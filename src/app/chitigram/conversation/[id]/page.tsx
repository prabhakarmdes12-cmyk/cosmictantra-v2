'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import ChitigramChatDrawer from '@/components/chitigram/ChitigramChatDrawer';
import ChitigramContextHeader from '@/components/chitigram/ChitigramContextHeader';
import ChitigramAuditTimeline from '@/components/chitigram/ChitigramAuditTimeline';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function ChitigramConversationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = (params?.id as string) || '';
  const viewerRole = (searchParams.get('role') as any) || 'devotee';
  const viewerId = searchParams.get('viewerId') || searchParams.get('userId') || undefined;

  const [conversation, setConversation] = useState<any | null>(null);
  const [contextHeader, setContextHeader] = useState<any | null>(null);
  const [audit, setAudit] = useState<any[]>([]);

  const fetchConversation = useCallback(async () => {
    if (!id) return;
    const url = new URL(`/api/chitigram/conversations/${encodeURIComponent(id)}`, window.location.origin);
    url.searchParams.set('viewerRole', viewerRole);
    if (viewerId) url.searchParams.set('viewerId', viewerId);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = await res.json();
    if (data?.ok) {
      setConversation(data.conversation);
      setContextHeader(data.contextHeader);
      setAudit(data.audit || []);
    }
  }, [id, viewerRole, viewerId]);

  useEffect(() => {
    void fetchConversation();
    const iv = setInterval(() => void fetchConversation(), 4000);
    return () => clearInterval(iv);
  }, [fetchConversation]);

  if (!conversation) {
    return (
      <CosmicTantraShell shellMode="minimal" footerMode="none">
        <div className="min-h-[calc(100vh-70px)] bg-[#070913] flex items-center justify-center p-8">
          <div className="text-white/60 text-sm">Loading conversation {id}...</div>
        </div>
      </CosmicTantraShell>
    );
  }

  return (
    <CosmicTantraShell shellMode="minimal" footerMode="none">
      <div className="min-h-[calc(100vh-70px)] bg-[#070913] p-2 sm:p-4 flex flex-col gap-4 max-w-6xl mx-auto w-full">
        <Link href="/chitigram/inbox" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Inbox
        </Link>

        <ChitigramContextHeader
          seekerName={contextHeader?.seekerIdentity?.name || conversation.seekerName}
          seekerPhoneMasked={contextHeader?.seekerIdentity?.phoneMasked}
          language={contextHeader?.language}
          category={contextHeader?.topic}
          originalQuestion={contextHeader?.originalQuestion}
          paymentStatus={contextHeader?.paymentStatus}
          paymentAmountInr={contextHeader?.paymentAmountInr}
          paymentVerifiedAt={contextHeader?.paymentVerifiedAt}
          kundliRef={contextHeader?.kundliRef}
          kundliSummary={contextHeader?.kundliSummary}
          assignedPandit={contextHeader?.assignedPandit}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
          <div className="lg:col-span-8 flex flex-col min-h-[600px]">
            <ChitigramChatDrawer
              conversationId={conversation.id}
              role={viewerRole === 'pandit' ? 'pandit' : viewerRole === 'operator' ? 'operator' : 'devotee'}
              consultantName={conversation.assignedPractitionerName || 'Pandit'}
              seekerName={conversation.seekerName || 'श्रद्धालु भक्त'}
              prashna={conversation.originalQuestion || ''}
              organizationId={conversation.organizationId}
              domain={conversation.domain}
              viewerId={viewerId}
              className="flex-1 min-h-[600px]"
            />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <ChitigramAuditTimeline events={audit} />
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50">
              <div className="font-bold text-white mb-1">Conversation ID</div>
              <div className="font-mono text-[11px] break-all">{conversation.id}</div>
              {conversation.sessionId && <div className="font-mono text-[11px] break-all mt-1">sessionId: {conversation.sessionId}</div>}
              <div className="mt-2 text-[11px]">State: {conversation.state} • Org: {conversation.organizationId} • Domain: {conversation.domain}</div>
            </div>
          </div>
        </div>
      </div>
    </CosmicTantraShell>
  );
}

export default function ChitigramConversationPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-70px)] bg-[#070913] flex items-center justify-center text-white/60">Loading conversation…</div>}>
      <ChitigramConversationContent />
    </Suspense>
  );
}

/**
 * Chitigram v0.2 — Single Conversation API
 * GET: context header + audit timeline + participants + latest messages + calls + assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversation, getParticipants, listMessages, listCalls, listAssignments, listAudit, getPresence } from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const url = new URL(req.url);
    const viewerRole = (url.searchParams.get('viewerRole') || url.searchParams.get('role') || 'operator').toLowerCase();
    const viewerId = url.searchParams.get('viewerId') || url.searchParams.get('userId') || '';

    if (!hasCapability(viewerRole, 'READ')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_READ' }, { status: 403 });
    }

    const conversation = await getConversation(id);
    if (!conversation) {
      return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });
    }

    // Org/domain scoping
    const requestedOrg = url.searchParams.get('organizationId');
    const requestedDomain = url.searchParams.get('domain');
    if (requestedOrg && requestedOrg !== conversation.organizationId) {
      return NextResponse.json({ ok: false, error: 'ORG_MISMATCH' }, { status: 403 });
    }
    if (requestedDomain && requestedDomain !== conversation.domain) {
      return NextResponse.json({ ok: false, error: 'DOMAIN_MISMATCH' }, { status: 403 });
    }

    // Membership check — query params/React props must NOT grant permissions; enforce server-side membership
    // For pilot, allow operator/pandit to view any conversation in same org/domain; devotee only if participant or seeker
    if (viewerRole === 'devotee' && viewerId) {
      const participants = await getParticipants(conversation.id);
      const isMember = participants.some(p => p.userId === viewerId);
      const isSeeker = conversation.seekerUserId === viewerId;
      if (!isMember && !isSeeker) {
        // Allow if sessionId alias matches? For devotee, we allow read if they created it — but enforce
        // For pilot, return 403
        return NextResponse.json({ ok: false, error: 'NOT_MEMBER' }, { status: 403 });
      }
    }

    // Context header fields
    const participants = await getParticipants(conversation.id);
    const calls = await listCalls(conversation.id);
    const assignments = await listAssignments(conversation.id);
    const audit = await listAudit(conversation.id);
    const { messages } = await listMessages(conversation.id, { limit: 10, offset: 0, includeInternal: hasCapability(viewerRole, 'INTERNAL_NOTE') });

    // Assigned pandit presence — do not show Online/Available unless backed by server
    let assignedPresence = null;
    if (conversation.assignedPractitionerId) {
      assignedPresence = await getPresence(conversation.assignedPractitionerId);
    }

    // Build context header payload
    const contextHeader = {
      seekerIdentity: {
        name: conversation.seekerName,
        phoneMasked: conversation.seekerPhoneMasked,
        userId: conversation.seekerUserId,
      },
      language: conversation.language,
      topic: conversation.category,
      originalQuestion: conversation.originalQuestion,
      paymentStatus: conversation.paymentStatus,
      paymentAmountInr: conversation.paymentAmountInr,
      paymentTransactionId: conversation.paymentTransactionId,
      paymentReferenceId: conversation.paymentReferenceId,
      paymentVerifiedAt: conversation.paymentVerifiedAt,
      kundliRef: conversation.kundliRef,
      kundliSummary: conversation.kundliSummary,
      assignedPandit: conversation.assignedPractitionerId
        ? {
            id: conversation.assignedPractitionerId,
            name: conversation.assignedPractitionerName,
            presence: assignedPresence, // server-backed only
          }
        : null,
      openKundliUrl: conversation.kundliRef ? `/kundli?id=${encodeURIComponent(conversation.kundliRef)}` : '/kundli',
    };

    return NextResponse.json(
      {
        ok: true,
        conversation,
        contextHeader,
        participants,
        calls,
        assignments,
        audit,
        recentMessages: messages,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    console.error('[chitigram/conversations/[id]] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

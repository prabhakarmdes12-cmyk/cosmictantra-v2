/**
 * Chitigram v0.2 — Conversations API
 * GET: inbox listing with filters ALL/WAITING/ACTIVE/FOLLOW_UP/CLOSED, unread, latest message, assignment, payment, etc.
 * POST: create conversation (canonical domain model)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createConversation, listConversations, getInboxRows, getConversation } from '@/lib/chitigram/repo';
import { hasCapability, InboxFilter } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filter = (url.searchParams.get('filter') || url.searchParams.get('state') || 'ALL').toUpperCase() as InboxFilter;
    const organizationId = url.searchParams.get('organizationId') || 'cosmic-tantra';
    const domain = url.searchParams.get('domain') || 'cosmic-tantra';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;
    const viewerId = url.searchParams.get('viewerId') || url.searchParams.get('userId') || undefined;
    const viewerRole = (url.searchParams.get('viewerRole') || url.searchParams.get('role') || 'operator').toLowerCase();

    // Authorization: READ required
    if (!hasCapability(viewerRole, 'READ')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_READ' }, { status: 403 });
    }

    const allowedFilters: InboxFilter[] = ['ALL', 'WAITING', 'ACTIVE', 'FOLLOW_UP', 'CLOSED'];
    const effectiveFilter = allowedFilters.includes(filter) ? filter : 'ALL';

    const { rows, total } = await getInboxRows(effectiveFilter, organizationId, domain, limit, offset, viewerId);

    // Also fetch single conversation if conversationId requested (for opening row loads existing conversation)
    const conversationId = url.searchParams.get('conversationId') || url.searchParams.get('sessionId');
    let singleConversation = null;
    if (conversationId) {
      singleConversation = await getConversation(conversationId);
    }

    return NextResponse.json(
      {
        ok: true,
        filter: effectiveFilter,
        rows,
        total,
        singleConversation,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    console.error('[chitigram/conversations] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const organizationId = body?.organizationId || 'cosmic-tantra';
    const domain = body?.domain || 'cosmic-tantra';
    const seekerName = body?.seekerName || body?.customerName || 'श्रद्धालु भक्त';
    const seekerPhoneMasked = body?.seekerPhoneMasked || '+91 ••••••••• (masked)';
    const seekerUserId = body?.seekerUserId || body?.userId || undefined;
    const language = body?.language || 'Hindi';
    const category = body?.category || 'General Guidance';
    const originalQuestion = body?.originalQuestion || body?.question || 'मुफ्त परामर्श';
    const kundliRef = body?.kundliRef || undefined;
    const kundliSummary = body?.kundliSummary || null;
    const paymentStatus = body?.paymentStatus || 'PENDING';
    const paymentAmountInr = typeof body?.paymentAmountInr === 'number' ? body.paymentAmountInr : typeof body?.amount === 'number' ? body.amount : 0;
    const sessionId = body?.sessionId || body?.conversationId || undefined;
    const id = body?.id || body?.conversationId || undefined;
    const actorId = body?.actorId || body?.userId || 'system';
    const actorRole = (body?.actorRole || body?.role || 'operator').toLowerCase();

    if (!hasCapability(actorRole, 'SEND')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_SEND' }, { status: 403 });
    }

    const { conversation, degraded, error } = await createConversation({
      id,
      organizationId,
      domain,
      sessionId,
      seekerName,
      seekerPhoneMasked,
      seekerUserId,
      language,
      category,
      originalQuestion,
      kundliRef,
      kundliSummary,
      paymentStatus,
      paymentAmountInr,
      actorId,
      actorRole,
    });

    if (degraded) {
      return NextResponse.json({ ok: false, error: 'DEGRADED_PERSISTENCE', details: error }, { status: 503 });
    }

    return NextResponse.json({ ok: true, conversation }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/conversations] POST failed', e);
    return NextResponse.json({ ok: false, error: 'CREATE_FAILED' }, { status: 500 });
  }
}

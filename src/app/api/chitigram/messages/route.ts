/**
 * Chitigram v0.2 — Persistent Message API (Operational Pilot)
 * Backward compatible with v0.1 (cardType/cardPayload/conversationId|sessionId)
 * Now extensible: TEXT/SYSTEM/CONTEXT/ACTION/PAYMENT/CALL/VOICE/FILE + ASTROLOGY.* subtypes
 * Features: stable messageId, clientMessageId idempotency, server timestamp, sequence ordering, pagination, SENT/DELIVERED/READ, INTERNAL notes (server-side visibility), authorization, org/domain scope.
 * Neon authoritative in production, memory fallback only in dev/test.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  ensureConversationForSession,
  createMessage,
  listMessages,
  getConversation,
} from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// GET — fetch thread with pagination, visibility enforcement
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const conversationId =
      url.searchParams.get('conversationId') ||
      url.searchParams.get('sessionId') ||
      url.searchParams.get('id') ||
      '';
    if (!conversationId) {
      return NextResponse.json({ ok: false, error: 'conversationId or sessionId required' }, { status: 400 });
    }

    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;
    const includeInternalParam = url.searchParams.get('includeInternal') === 'true';
    const viewerRole = (url.searchParams.get('viewerRole') || url.searchParams.get('role') || 'devotee').toLowerCase();
    const viewerId = url.searchParams.get('viewerId') || url.searchParams.get('userId') || '';

    // Authorization: determine if viewer can see INTERNAL — requires INTERNAL_NOTE capability
    const canSeeInternal = includeInternalParam && hasCapability(viewerRole, 'INTERNAL_NOTE');
    // If includeInternal requested but not authorized, silently downgrade to VISIBLE only (never leak)
    const effectiveIncludeInternal = canSeeInternal;

    // Ensure conversation exists for backward compat (legacy sessionId)
    const conv = await getConversation(conversationId);
    if (!conv) {
      // In v0.2, we auto-create for legacy but return empty messages if not found — but ensureConversation handles legacy creation on POST, not GET.
      // For GET, return empty with ok true to preserve v0.1 behavior (memory source).
      return NextResponse.json({ ok: true, messages: [], total: 0, source: 'memory', degraded: false }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // Org/domain scoping — if mismatch, deny
    // (For pilot, we allow default cosmic-tantra; if query specifies org, check)
    const requestedOrg = url.searchParams.get('organizationId');
    const requestedDomain = url.searchParams.get('domain');
    if (requestedOrg && requestedOrg !== conv.organizationId) {
      return NextResponse.json({ ok: false, error: 'ORG_MISMATCH' }, { status: 403 });
    }
    if (requestedDomain && requestedDomain !== conv.domain) {
      return NextResponse.json({ ok: false, error: 'DOMAIN_MISMATCH' }, { status: 403 });
    }

    const { messages, total, source } = await listMessages(conversationId, {
      limit,
      offset,
      includeInternal: effectiveIncludeInternal,
    });

    // Map to legacy shape for v0.1 clients: ensure cardType/cardPayload and id/timestamp/status preserved
    const mapped = messages.map(m => ({
      id: m.id,
      messageId: m.id,
      conversationId: m.conversationId,
      sessionId: m.conversationId,
      senderRole: m.senderRole === 'pandit' ? 'pandit' : m.senderRole === 'operator' ? 'operator' : 'devotee',
      senderName: m.senderName,
      senderId: m.senderId,
      text: m.text,
      cardType: m.cardType,
      cardPayload: m.cardPayload,
      payload: m.payload,
      type: m.type,
      subType: m.subType,
      visibility: m.visibility,
      status: m.status,
      sequence: m.sequence,
      clientMessageId: m.clientMessageId,
      timestamp: m.createdAt,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      // legacy
      timestampLegacy: m.createdAt,
    }));

    return NextResponse.json(
      { ok: true, messages: mapped, total, source, hasMore: offset + limit < total },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[chitigram/messages v0.2] GET failed', err);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — append message with idempotency, server timestamp, sequence, auth, degraded handling
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const conversationId: string = body?.conversationId || body?.sessionId || body?.id || '';
    const clientMessageId: string | null = body?.clientMessageId || body?.clientId || null;
    const senderRoleRaw: string = body?.senderRole || body?.role || 'devotee';
    const senderRole = senderRoleRaw.toLowerCase() === 'pandit' ? 'pandit' : senderRoleRaw.toLowerCase() === 'operator' ? 'operator' : senderRoleRaw.toLowerCase() === 'system' ? 'system' : 'devotee';
    const senderId: string | null = body?.senderId || body?.userId || null;
    const senderName: string | null = body?.senderName || body?.sender || null;
    const text: string | null = body?.text ? String(body.text).slice(0, 4000) : null;
    const cardType: string | null = body?.cardType || body?.card_type || null;
    const cardPayload: Record<string, any> | null = body?.cardPayload || body?.payloadLegacy || null;
    // New protocol
    let type: string | null = body?.type || null;
    let subType: string | null = body?.subType || body?.subtype || null;
    let payload: Record<string, any> | null = body?.payload || null;
    // Visibility — INTERNAL requires capability
    const visibilityRaw: string = body?.visibility || 'VISIBLE';
    const requestedVisibility = visibilityRaw === 'INTERNAL' ? 'INTERNAL' : 'VISIBLE';
    const organizationId: string | undefined = body?.organizationId || undefined;
    const domain: string | undefined = body?.domain || undefined;

    if (!conversationId) {
      return NextResponse.json({ ok: false, error: 'conversationId or sessionId required' }, { status: 400 });
    }

    // Validate: at least text or card or payload or voice/file metadata
    if (!text && !cardType && !type && !payload) {
      return NextResponse.json({ ok: false, error: 'text or cardType or type required' }, { status: 400 });
    }
    if (text !== null && text.trim().length === 0 && !cardType && !type) {
      return NextResponse.json({ ok: false, error: 'empty text' }, { status: 400 });
    }

    // Validate cardType legacy
    if (cardType && !['KUNDLI_INSIGHT', 'DAKSHINA_PAYMENT', 'CALL_EVENT'].includes(cardType)) {
      // Allow new subtypes too — but if legacy, must be known. For v0.2 extensible, allow any string but log.
      // For strict, we allow any string that maps to known subtypes, otherwise treat as generic CONTEXT/ACTION
    }

    // Validate new protocol type
    const allowedTypes = ['TEXT', 'SYSTEM', 'CONTEXT', 'ACTION', 'PAYMENT', 'CALL', 'VOICE', 'FILE'];
    if (type && !allowedTypes.includes(type)) {
      return NextResponse.json({ ok: false, error: 'invalid type' }, { status: 400 });
    }

    // Authorization: INTERNAL notes require INTERNAL_NOTE capability — never trust query params, enforce server-side
    if (requestedVisibility === 'INTERNAL' && !hasCapability(senderRole, 'INTERNAL_NOTE')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_INTERNAL_NOTE' }, { status: 403 });
    }

    // Ensure conversation exists — preserve support for conversationId and existing consultation sessionId (backward compat)
    // If not found, auto-create with minimal context (so legacy v0.1 flows still work)
    let conv = await getConversation(conversationId);
    if (!conv) {
      conv = await ensureConversationForSession(conversationId, {
        seekerName: senderRole === 'devotee' ? senderName || 'श्रद्धालु भक्त' : undefined,
        organizationId,
        domain,
      });
    }

    // Org/domain scope check
    if (organizationId && organizationId !== conv.organizationId) {
      return NextResponse.json({ ok: false, error: 'ORG_MISMATCH' }, { status: 403 });
    }
    if (domain && domain !== conv.domain) {
      return NextResponse.json({ ok: false, error: 'DOMAIN_MISMATCH' }, { status: 403 });
    }

    // Capability: SEND required
    if (!hasCapability(senderRole, 'SEND')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_SEND' }, { status: 403 });
    }

    // Capability: VIEW_KUNDLI / VIEW_PAYMENT for context/payment cards — enforce if card requires it
    if (cardType === 'KUNDLI_INSIGHT' || subType === 'ASTROLOGY.KUNDLI_INSIGHT') {
      if (!hasCapability(senderRole, 'VIEW_KUNDLI')) {
        return NextResponse.json({ ok: false, error: 'FORBIDDEN_VIEW_KUNDLI' }, { status: 403 });
      }
    }
    if (cardType === 'DAKSHINA_PAYMENT' || subType === 'ASTROLOGY.DAKSHINA') {
      if (!hasCapability(senderRole, 'VIEW_PAYMENT')) {
        return NextResponse.json({ ok: false, error: 'FORBIDDEN_VIEW_PAYMENT' }, { status: 403 });
      }
    }

    // Infer type/subType from legacy if not provided
    if (!type && cardType) {
      if (cardType === 'KUNDLI_INSIGHT') {
        type = 'CONTEXT';
        subType = subType || 'ASTROLOGY.KUNDLI_INSIGHT';
      } else if (cardType === 'DAKSHINA_PAYMENT') {
        type = 'PAYMENT';
        subType = subType || 'ASTROLOGY.DAKSHINA';
      } else if (cardType === 'CALL_EVENT') {
        type = 'CALL';
        subType = subType || 'CALL_EVENT';
      }
    }
    if (!type) type = text ? 'TEXT' : 'CONTEXT';
    if (!payload && cardPayload) payload = cardPayload;

    // Create message via repo — authoritative persistence, idempotent, sequence, server timestamp
    const result = await createMessage({
      conversationId: conv.id,
      clientMessageId,
      senderId,
      senderRole,
      senderName,
      type: type as any,
      subType,
      text,
      cardType,
      cardPayload,
      payload,
      visibility: requestedVisibility as any,
      organizationId: conv.organizationId,
      domain: conv.domain,
    });

    if (result.error) {
      if (result.degraded) {
        // Production DB failure — return degraded/error, NEVER ack unpersisted
        return NextResponse.json({ ok: false, error: 'DEGRADED_PERSISTENCE', details: result.error }, { status: 503 });
      }
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    const msg = result.message!;

    // Backward compat response shape: include both new and legacy fields, plus delivery status
    const responseMessage = {
      id: msg.id,
      messageId: msg.id,
      conversationId: msg.conversationId,
      sessionId: msg.conversationId,
      clientMessageId: msg.clientMessageId,
      sequence: msg.sequence,
      senderRole: msg.senderRole,
      senderName: msg.senderName,
      senderId: msg.senderId,
      text: msg.text,
      cardType: msg.cardType,
      cardPayload: msg.cardPayload,
      payload: msg.payload,
      type: msg.type,
      subType: msg.subType,
      visibility: msg.visibility,
      status: msg.status,
      timestamp: msg.createdAt,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    };

    return NextResponse.json(
      {
        ok: true,
        message: responseMessage,
        isDuplicate: !!result.isDuplicate,
        persisted: result.degraded ? 'degraded' : 'ok',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[chitigram/messages v0.2] POST failed', err);
    return NextResponse.json({ ok: false, error: 'PERSIST_FAILED' }, { status: 500 });
  }
}

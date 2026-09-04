/**
 * Chitigram Persistent Message API
 * GET: Returns messages for conversationId or sessionId (supports in-memory + Neon DB)
 * POST: Appends a new message (text or JSON card payload) with timestamp and delivery status
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ---------------------------------------------------------------------------
// In-memory vault (server) — attached to globalThis for HMR resilience
// Supports both Neon DB (if table exists) and fallback memory store.
// ---------------------------------------------------------------------------

export type ChitigramCardType = 'KUNDLI_INSIGHT' | 'DAKSHINA_PAYMENT' | 'CALL_EVENT';
export type ChitigramMessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface ChitigramMessage {
  id: string;
  conversationId: string;
  senderRole: 'devotee' | 'pandit';
  senderName?: string;
  text?: string;
  cardType?: ChitigramCardType;
  cardPayload?: Record<string, any>;
  timestamp: number;
  status: ChitigramMessageStatus;
  sessionId?: string;
}

const globalForChitigram = globalThis as unknown as {
  __chitigramVault?: Map<string, ChitigramMessage[]>;
};

const VAULT: Map<string, ChitigramMessage[]> =
  globalForChitigram.__chitigramVault ?? new Map();
globalForChitigram.__chitigramVault = VAULT;

function getMessages(conversationId: string): ChitigramMessage[] {
  if (!conversationId) return [];
  return VAULT.get(conversationId) || [];
}

function appendMessage(msg: ChitigramMessage): void {
  const key = msg.conversationId;
  const existing = VAULT.get(key) || [];
  existing.push(msg);
  if (existing.length > 500) existing.splice(0, existing.length - 500);
  VAULT.set(key, existing);
}

// ---------------------------------------------------------------------------
// GET — fetch thread
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

    // Try Neon DB (best-effort). If table does not exist, silently fall back.
    if (process.env.DATABASE_URL) {
      try {
        const { db } = await import('@/lib/db');
        try {
          const rows = (await (db as any).$queryRawUnsafe(
            `SELECT id, "conversationId", "senderRole", "senderName", text, "cardType", "cardPayload", timestamp, status FROM "ChitigramMessage" WHERE "conversationId" = $1 ORDER BY timestamp ASC LIMIT 500`,
            conversationId
          )) as any[];
          if (Array.isArray(rows) && rows.length > 0) {
            const mapped: ChitigramMessage[] = rows.map((r: any) => ({
              id: String(r.id),
              conversationId: String(r.conversationId),
              senderRole: r.senderRole === 'pandit' ? 'pandit' : 'devotee',
              senderName: r.senderName || undefined,
              text: r.text || undefined,
              cardType: r.cardType || undefined,
              cardPayload: r.cardPayload || undefined,
              timestamp: Number(r.timestamp) || Date.now(),
              status: (r.status as ChitigramMessage['status']) || 'DELIVERED',
            }));
            return NextResponse.json(
              { ok: true, messages: mapped, source: 'db' },
              { headers: { 'Cache-Control': 'no-store' } }
            );
          }
        } catch {
          // Table/model not present — fall through to memory
        }
      } catch {
        // DB import/connect failure — fall through
      }
    }

    const messages = getMessages(conversationId);
    return NextResponse.json(
      { ok: true, messages, source: 'memory' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[chitigram/messages] GET failed', err);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — append message
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const conversationId: string =
      body?.conversationId || body?.sessionId || body?.id || '';
    const senderRole: ChitigramMessage['senderRole'] =
      body?.senderRole === 'pandit' ? 'pandit' : body?.role === 'pandit' ? 'pandit' : 'devotee';
    const senderName: string | undefined = body?.senderName || body?.sender || undefined;
    const text: string | undefined = body?.text ? String(body.text).slice(0, 2000) : undefined;
    const cardType: ChitigramCardType | undefined = body?.cardType || body?.card_type || undefined;
    const cardPayload: Record<string, any> | undefined = body?.cardPayload || body?.payload || undefined;

    if (!conversationId) {
      return NextResponse.json({ ok: false, error: 'conversationId or sessionId required' }, { status: 400 });
    }
    if (!text && !cardType) {
      return NextResponse.json({ ok: false, error: 'text or cardType required' }, { status: 400 });
    }
    if (cardType && !['KUNDLI_INSIGHT', 'DAKSHINA_PAYMENT', 'CALL_EVENT'].includes(cardType)) {
      return NextResponse.json({ ok: false, error: 'invalid cardType' }, { status: 400 });
    }
    if (text !== undefined && text.trim().length === 0 && !cardType) {
      return NextResponse.json({ ok: false, error: 'empty text' }, { status: 400 });
    }

    const now = Date.now();
    const message: ChitigramMessage = {
      id: `ctm-${now}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId,
      senderRole,
      senderName,
      text: text?.trim() || undefined,
      cardType: cardType || undefined,
      cardPayload: cardPayload || undefined,
      timestamp: now,
      status: 'SENT',
      sessionId: conversationId,
    };

    // Persist to Neon DB best-effort
    let dbPersisted = false;
    if (process.env.DATABASE_URL) {
      try {
        const { db } = await import('@/lib/db');
        try {
          await (db as any).$executeRawUnsafe(
            `INSERT INTO "ChitigramMessage" (id, "conversationId", "senderRole", "senderName", text, "cardType", "cardPayload", timestamp, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            message.id,
            message.conversationId,
            message.senderRole,
            message.senderName || null,
            message.text || null,
            message.cardType || null,
            message.cardPayload ? JSON.stringify(message.cardPayload) : null,
            String(message.timestamp),
            message.status
          );
          dbPersisted = true;
        } catch {
          // Table not present — ignore
        }
      } catch {
        // DB unavailable — ignore
      }
    }

    // Always append to in-memory vault for immediate read-back and HMR resilience
    appendMessage(message);

    // Simulate delivery progression: SENT -> DELIVERED after short delay (fire-and-forget)
    setTimeout(() => {
      try {
        const vault = getMessages(conversationId);
        const target = vault.find(m => m.id === message.id);
        if (target && target.status === 'SENT') target.status = 'DELIVERED';
      } catch {}
    }, 800);

    return NextResponse.json(
      { ok: true, message, persisted: dbPersisted ? 'db+memory' : 'memory' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('[chitigram/messages] POST failed', err);
    return NextResponse.json({ ok: false, error: 'PERSIST_FAILED' }, { status: 500 });
  }
}

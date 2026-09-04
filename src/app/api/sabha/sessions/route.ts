/**
 * SABHA FREE-CALL SESSION API — POST/GET /api/sabha/sessions
 *
 * The single entry point that creates the ONE call primitive:
 * `ConsultationSession` with `initiationMode` — either
 *   'CARE_ASSISTED' (Customer → Care queue → operator assigns/dispatches) or
 *   'DIRECT'        (Customer clicks "Free Call" on a Pandit profile; zero Care).
 *
 * FREE ONLY: sessions are created with a zero-cost verified entitlement.
 * No payment, wallet, or per-minute deduction exists on this path.
 * ZERO-RECORDING: consent flags are hard-set false; nothing media-related is stored.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createFreeCallSession,
  listIncomingForScholar,
  listSessionsForOps
} from '@/lib/sabha/freeCallEngine';
import { SabhaAuthTokenEngine } from '@/lib/sabha/auth';
import { initSeedSessions } from '@/lib/sabha/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Cache-Control': 'no-store'
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const initiationMode = body?.initiationMode === 'DIRECT' ? 'DIRECT' : 'CARE_ASSISTED';
    const mediaType = body?.mediaType === 'VIDEO' ? 'VIDEO' : 'AUDIO';

    const result = await createFreeCallSession({
      initiationMode,
      consultantId: body?.consultantId ? String(body.consultantId).slice(0, 40) : undefined,
      mediaType,
      customerDisplayName: body?.customerDisplayName ? String(body.customerDisplayName).slice(0, 80) : undefined,
      customerCity: body?.customerCity ? String(body.customerCity).slice(0, 40) : undefined,
      customerId: body?.customerId ? String(body.customerId).slice(0, 40) : undefined,
      question: body?.question ? String(body.question).slice(0, 500) : undefined,
      language: body?.language ? String(body.language).slice(0, 30) : undefined,
      category: body?.category ? String(body.category).slice(0, 60) : undefined,
      intakeByOperatorId: body?.intakeByOperatorId ? String(body.intakeByOperatorId).slice(0, 40) : undefined
    });

    if (!result.ok || !result.handle) {
      return NextResponse.json({ ok: false, error: result.error || 'SESSION_CREATION_FAILED' }, { status: 400, headers: CORS_HEADERS });
    }

    const { session, customerToken } = result.handle;
    const customerRoomUrl = `/consultation/room/${session.sessionId}?role=devotee&token=${encodeURIComponent(customerToken)}`;

    return NextResponse.json(
      {
        ok: true,
        sessionId: session.sessionId,
        roomId: session.roomId,
        initiationMode: session.initiationMode,
        state: session.state,
        entitledDurationSeconds: session.entitledDurationSeconds,
        customerToken, // Only ever returned to the requesting customer, never to the peer.
        customerRoomUrl,
        consultant: {
          scholarId: session.scholar.scholarId,
          name: session.scholar.name,
          title: session.scholar.title
        }
      },
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error('Free-call session creation failed:', error);
    return NextResponse.json({ ok: false, error: 'SESSION_CREATION_FAILED' }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function GET(req: NextRequest) {
  try {
    initSeedSessions(); // Ensure the ops console always has its demo record.
    const url = new URL(req.url);
    const view = url.searchParams.get('view') || 'ops';

    // Ops console view: full operational read model with computed queue status.
    if (view === 'ops') {
      const sessions = listSessionsForOps().map(s => ({
        sessionId: s.sessionId,
        roomId: s.roomId,
        initiationMode: s.initiationMode || 'CARE_ASSISTED',
        state: s.state,
        serviceMode: s.serviceMode,
        transportChannel: s.transportChannel,
        activeTransport: s.activeTransport,
        createdAt: s.createdAt,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        entitledDurationSeconds: s.entitledDurationSeconds,
        extensionSeconds: s.extensionSeconds,
        gracePeriodSeconds: s.gracePeriodSeconds,
        durationSeconds:
          s.startedAt !== undefined
            ? Math.max(0, Math.floor(((s.endedAt || Date.now()) - s.startedAt) / 1000))
            : undefined,
        queueStatus: s.queueStatus,
        payerName: s.payer.name,
        beneficiaryName: s.beneficiary.name,
        scholar: { scholarId: s.scholar.scholarId, name: s.scholar.name, title: s.scholar.title },
        question: s.question,
        category: s.category,
        language: s.language,
        webrtcTelemetry: s.webrtcTelemetry,
        pstnTelemetry: s.pstnTelemetry,
        costLedger: s.costLedger,
        payment: { isVerified: s.payment.isVerified, amountInr: s.payment.amountInr }
      }));
      return NextResponse.json({ ok: true, sessions }, { headers: CORS_HEADERS });
    }

    // Pandit console view: incoming free-call requests for this scholar.
    // Phase-1 trust note: the pandit console is the authorized holder of its own
    // consultant tokens (SSO lands in Phase 2). Customer tokens are NEVER exposed here.
    if (view === 'pandit') {
      const scholarId = url.searchParams.get('scholarId') || 'SCH-KASHI-01';
      const incoming = listIncomingForScholar(scholarId).map(s => ({
        sessionId: s.sessionId,
        initiationMode: s.initiationMode,
        state: s.state,
        createdAt: s.createdAt,
        queueStatus: s.queueStatus,
        customerDisplayName: s.beneficiary.name,
        customerCity: s.beneficiary.location,
        question: s.question,
        category: s.category,
        language: s.language,
        mediaType: s.transportChannel === 'VIDEO' ? 'VIDEO' : 'AUDIO',
        consultantToken: s.consultantToken,
        consultantRoomUrl: `/consultation/room/${s.sessionId}?role=pandit&token=${encodeURIComponent(s.consultantToken)}`
      }));
      return NextResponse.json({ ok: true, incoming }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: false, error: 'Unknown view.' }, { status: 400, headers: CORS_HEADERS });
  } catch (error: any) {
    console.error('Session listing failed:', error);
    return NextResponse.json({ ok: false, error: 'SESSION_LISTING_FAILED' }, { status: 500, headers: CORS_HEADERS });
  }
}

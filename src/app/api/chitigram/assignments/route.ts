/**
 * Chitigram v0.2 — Pandit Assignment API
 * POST: operator manually assign/reassign consultation to available Pandit
 * PATCH: pandit accept/decline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAssignment, listAssignments, updateAssignmentAcceptance, getConversation } from '@/lib/chitigram/repo';
import { hasCapability } from '@/lib/chitigram/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const conversationId = url.searchParams.get('conversationId') || url.searchParams.get('sessionId') || '';
    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    const viewerRole = (url.searchParams.get('viewerRole') || 'operator').toLowerCase();
    if (!hasCapability(viewerRole, 'READ')) return NextResponse.json({ ok: false, error: 'FORBIDDEN_READ' }, { status: 403 });
    const assignments = await listAssignments(conversationId);
    return NextResponse.json({ ok: true, assignments }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/assignments] GET failed', e);
    return NextResponse.json({ ok: false, error: 'FETCH_FAILED' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const conversationId: string = body?.conversationId || body?.sessionId || '';
    const practitionerId: string = body?.practitionerId || body?.panditId || '';
    const practitionerName: string | null = body?.practitionerName || body?.panditName || null;
    const assignedBy: string = body?.assignedBy || body?.actorId || body?.userId || 'operator';
    const actorRole = (body?.actorRole || body?.role || 'operator').toLowerCase();
    const organizationId = body?.organizationId || undefined;
    const domain = body?.domain || undefined;

    if (!conversationId) return NextResponse.json({ ok: false, error: 'conversationId required' }, { status: 400 });
    if (!practitionerId) return NextResponse.json({ ok: false, error: 'practitionerId required' }, { status: 400 });

    if (!hasCapability(actorRole, 'ASSIGN')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_ASSIGN' }, { status: 403 });
    }

    const conv = await getConversation(conversationId);
    if (!conv) return NextResponse.json({ ok: false, error: 'CONVERSATION_NOT_FOUND' }, { status: 404 });

    if (organizationId && organizationId !== conv.organizationId) return NextResponse.json({ ok: false, error: 'ORG_MISMATCH' }, { status: 403 });
    if (domain && domain !== conv.domain) return NextResponse.json({ ok: false, error: 'DOMAIN_MISMATCH' }, { status: 403 });

    const assignment = await createAssignment({
      conversationId: conv.id,
      practitionerId,
      practitionerName,
      assignedBy,
      organizationId: conv.organizationId,
      domain: conv.domain,
    });

    return NextResponse.json({ ok: true, assignment }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/assignments] POST failed', e);
    return NextResponse.json({ ok: false, error: 'ASSIGN_FAILED' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const assignmentId: string = body?.assignmentId || body?.id || '';
    const acceptanceState: string = body?.acceptanceState || body?.state || '';
    const actorId: string = body?.actorId || body?.userId || '';
    const declinedReason: string | null = body?.declinedReason || null;
    const actorRole = (body?.actorRole || body?.role || 'pandit').toLowerCase();

    if (!assignmentId) return NextResponse.json({ ok: false, error: 'assignmentId required' }, { status: 400 });
    if (!['ACCEPTED', 'DECLINED'].includes(acceptanceState)) return NextResponse.json({ ok: false, error: 'invalid acceptanceState' }, { status: 400 });
    if (!actorId) return NextResponse.json({ ok: false, error: 'actorId required' }, { status: 400 });

    // Pandit can ACCEPT_CALL, operator can also update
    if (!hasCapability(actorRole, 'ACCEPT_CALL') && !hasCapability(actorRole, 'ASSIGN')) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN_ACCEPT' }, { status: 403 });
    }

    const updated = await updateAssignmentAcceptance(assignmentId, acceptanceState as any, actorId, declinedReason);
    if (!updated) return NextResponse.json({ ok: false, error: 'ASSIGNMENT_NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, assignment: updated }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    console.error('[chitigram/assignments] PATCH failed', e);
    return NextResponse.json({ ok: false, error: 'UPDATE_FAILED' }, { status: 500 });
  }
}

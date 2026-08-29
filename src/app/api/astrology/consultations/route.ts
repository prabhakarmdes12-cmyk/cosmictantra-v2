import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminAuth, buildConsultationListResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isAdmin = verifyAdminAuth(req);

    const consultations = await db.astrologyConsultation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        practitioner: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
            phone: isAdmin,
          },
        },
      },
    });

    // SEC-P0-002: server-authoritative list shaping — anonymous callers
    // receive aggregate statistics only (no rows, no ids, no birth data).
    const shaped = buildConsultationListResponse(consultations, isAdmin);

    return NextResponse.json({
      success: true,
      consultations: shaped.consultations,
      stats: shaped.stats,
      authenticated: shaped.authenticated,
      notice: shaped.notice,
    });
  } catch (error: any) {
    console.error('Fetch consultations error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}

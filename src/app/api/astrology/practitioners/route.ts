import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const consultants = await db.astrologyConsultant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        auditLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const pendingInvites = await db.astrologyPractitionerInvite.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      consultants,
      pendingInvites,
      stats: {
        total: consultants.length,
        active: consultants.filter((c: any) => c.isActive && c.onboardingStatus === 'COMPLETED').length,
        pendingOnboarding: pendingInvites.length,
        paused: consultants.filter((c: any) => !c.isActive).length,
      },
    });
  } catch (error: any) {
    console.error('Fetch practitioners error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch practitioners' },
      { status: 500 }
    );
  }
}

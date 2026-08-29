import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, strictly exclude test fixtures from public/operational visibility
    const whereClause: any = {
      isActive: true,
      onboardingStatus: 'COMPLETED'
    };

    if (isProduction) {
      whereClause.isTestFixture = false;
    }

    const consultants = await db.astrologyConsultant.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        auditLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const pendingInvites = isProduction
      ? []
      : await db.astrologyPractitionerInvite.findMany({
          where: { usedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        });

    return NextResponse.json({
      success: true,
      consultants: consultants.map(c => ({
        ...c,
        displayName: !isProduction && (c as any).isTestFixture ? `[DEV FIXTURE] ${c.displayName}` : c.displayName
      })),
      pendingInvites,
      stats: {
        total: consultants.length,
        active: consultants.filter((c: any) => c.isActive && c.onboardingStatus === 'COMPLETED').length,
        pendingOnboarding: pendingInvites.length,
        paused: 0,
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

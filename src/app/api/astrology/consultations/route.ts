import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const consultations = await db.astrologyConsultation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        practitioner: {
          select: {
            id: true,
            displayName: true,
            profilePhoto: true,
            phone: true,
          },
        },
      },
    });

    const stats = {
      total: consultations.length,
      testCases: consultations.filter(c => c.isTestCase).length,
      pendingReview: consultations.filter(c => c.status === 'PANDIT_REVIEW' || c.status === 'ASSIGNED').length,
      approved: consultations.filter(c => c.status === 'APPROVED' || c.status === 'DELIVERY_READY' || c.status === 'DELIVERED').length,
    };

    return NextResponse.json({
      success: true,
      consultations,
      stats,
    });
  } catch (error: any) {
    console.error('Fetch consultations error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch consultations' },
      { status: 500 }
    );
  }
}

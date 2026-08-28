import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const CANONICAL_SERVICES = [
  {
    id: 'srv_consult_15',
    code: 'CONSULT_15',
    name: '15-Minute Senior Vedic Consultation',
    durationMinutes: 15,
    priceInr: 501,
    isActive: true,
    isFeatured: true
  },
  {
    id: 'srv_consult_30',
    code: 'CONSULT_30',
    name: '30-Minute In-Depth Vedic Consultation',
    durationMinutes: 30,
    priceInr: 1100,
    isActive: true,
    isFeatured: false
  }
];

export async function GET(req: NextRequest) {
  try {
    // Attempt database catalog lookup if table exists
    let services = [];
    try {
      if ((db as any).astrologyService) {
        services = await (db as any).astrologyService.findMany({
          where: { isActive: true },
          orderBy: { priceInr: 'asc' }
        });
      }
    } catch (e) {
      // Table may not yet be migrated in dev
    }

    if (!services || services.length === 0) {
      services = CANONICAL_SERVICES;
    }

    return NextResponse.json({
      success: true,
      services,
      source: services === CANONICAL_SERVICES ? 'CANONICAL_DEFAULT' : 'DATABASE_CATALOG'
    });
  } catch (error: any) {
    console.error('Fetch services error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

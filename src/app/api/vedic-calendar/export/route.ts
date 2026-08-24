import { NextRequest, NextResponse } from 'next/server';
import { buildICS } from '@/lib/vedicAlerts';

export const dynamic = 'force-dynamic';

/**
 * ICS export for the personal Vedic calendar (no DB, no auth — stateless).
 * Query: name, birthDate, birthTime, lat, lng, tz, birthCity, days (default 90).
 * Subscribable in Google Calendar / Apple Calendar / Outlook.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const birthDate = sp.get('birthDate');
    if (!birthDate) {
      return NextResponse.json({ success: false, error: 'birthDate is required.' }, { status: 400 });
    }

    const profile = {
      id: 'export',
      name: sp.get('name') || 'Profile',
      birthDate,
      birthTime: sp.get('birthTime') || '12:00',
      birthCity: sp.get('birthCity') || 'Patna',
      lat: Number(sp.get('lat')) || 25.5941,
      lng: Number(sp.get('lng')) || 85.1376,
      tz: Number(sp.get('tz')) || 5.5,
    };

    const days = Math.min(Math.max(Number(sp.get('days')) || 90, 1), 365);

    const ics = buildICS([profile], days, profile.tz);

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="cosmictantra-vedic-alerts-${profile.name.replace(/[^a-zA-Z0-9]/g, '-')}.ics"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('ICS export error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'ICS generation failed' }, { status: 500 });
  }
}

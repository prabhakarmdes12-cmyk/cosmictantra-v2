/**
 * VERIFIED SCHOLAR DIRECTORY — GET /api/sabha/directory
 * Public customer-facing listing for DIRECT "Free Call" entry.
 * ZERO PII: no phone numbers, emails, or WhatsApp IDs exist on this surface.
 */

import { NextResponse } from 'next/server';
import { getAllScholars } from '@/lib/sabha/directory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const scholars = await getAllScholars();
  return NextResponse.json(
    {
      ok: true,
      scholars: scholars.map(s => ({
        scholarId: s.scholarId,
        name: s.name,
        title: s.title,
        tradition: s.tradition,
        city: s.city,
        languages: s.languages,
        specialities: s.specialities,
        experienceYears: s.experienceYears,
        glyph: s.glyph
      }))
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

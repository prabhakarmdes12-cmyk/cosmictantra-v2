import { NextRequest, NextResponse } from 'next/server';
import { recordIntakeLead } from '@/lib/chitiCrmBridge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, birthDate, birthTime, birthCity, domain, question, lagna, nakshatra, dasha } = body;

    if (!phone || !question) {
      return NextResponse.json(
        { success: false, error: 'Phone and Question are required for intake' },
        { status: 400 }
      );
    }

    const result = await recordIntakeLead({
      name: name || 'Seeker',
      phone,
      birthDate,
      birthTime,
      birthCity,
      domain,
      question,
      lagna,
      nakshatra,
      dasha,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Intake lead API error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process intake lead' },
      { status: 500 }
    );
  }
}

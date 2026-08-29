import { NextRequest, NextResponse } from 'next/server';
import { processKashiSahayakQuery } from '@/lib/ai/gateway';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await processKashiSahayakQuery(message, history || [], context || {});
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API /api/guru/chat error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message },
      { status: 500 }
    );
  }
}

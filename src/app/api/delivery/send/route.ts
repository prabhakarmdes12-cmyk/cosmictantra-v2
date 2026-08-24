import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsappDelivery';

export async function POST(req: NextRequest) {
  try {
    const { phone, message, consultationId } = await req.json();

    if (!phone || !message || !consultationId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const result = await sendWhatsAppMessage(phone, message, consultationId);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

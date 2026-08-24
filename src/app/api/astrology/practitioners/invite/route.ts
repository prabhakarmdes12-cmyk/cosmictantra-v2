import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, languages, internalNote } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and Phone number are required.' },
        { status: 400 }
      );
    }

    // Generate unguessable 256-bit token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

    const invite = await db.astrologyPractitionerInvite.create({
      data: {
        token,
        name,
        phone,
        email: email || null,
        languages: languages && languages.length ? languages : ['Hindi', 'English'],
        internalNote: internalNote || null,
        expiresAt,
      },
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const inviteUrl = `${protocol}://${host}/pandit/onboard/${token}`;

    return NextResponse.json({
      success: true,
      token,
      inviteUrl,
      invite,
    });
  } catch (error: any) {
    console.error('Invite generation error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate practitioner invite' },
      { status: 500 }
    );
  }
}

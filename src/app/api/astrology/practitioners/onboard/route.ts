import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token missing' }, { status: 400 });
    }

    const invite = await db.astrologyPractitionerInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json({ valid: false, error: 'Invalid invitation link.' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ valid: false, error: 'This invitation link has already been used.' }, { status: 400 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json({ valid: false, error: 'This invitation link has expired.' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      invite: {
        name: invite.name,
        phone: invite.phone,
        email: invite.email,
        languages: invite.languages,
      },
    });
  } catch (error: any) {
    console.error('Onboard GET error:', error);
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      fullName,
      displayName,
      phone,
      email,
      city,
      state,
      languages,
      expertise,
      yearsExperience,
      biography,
      tradition,
      qualifications,
      profilePhoto,
      aiReviewConsent,
      videoContentInterest,
    } = body;

    if (!token || !fullName || !displayName || !phone || !city || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing required onboarding fields.' },
        { status: 400 }
      );
    }

    // Verify token
    const invite = await db.astrologyPractitionerInvite.findUnique({
      where: { token },
    });

    if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired onboarding token.' },
        { status: 400 }
      );
    }

    // Check if consultant exists by phone
    const existing = await db.astrologyConsultant.findFirst({
      where: { phone },
    });

    let consultant;
    const payloadData = {
      fullName,
      displayName,
      phone,
      email: email || null,
      city,
      state,
      languages: languages && languages.length ? languages : ['Hindi', 'English'],
      expertise: expertise && expertise.length ? expertise : ['Kundali Analysis'],
      yearsExperience: Number(yearsExperience) || 0,
      biography: biography || null,
      tradition: tradition || null,
      qualifications: qualifications || null,
      profilePhoto: profilePhoto || '🧙',
      onboardingStatus: 'COMPLETED' as const,
      isActive: true,
      aiReviewConsent: Boolean(aiReviewConsent),
      videoContentInterest: Boolean(videoContentInterest),
      onboardedAt: new Date(),
    };

    if (existing) {
      consultant = await db.astrologyConsultant.update({
        where: { id: existing.id },
        data: payloadData,
      });
    } else {
      consultant = await db.astrologyConsultant.create({
        data: payloadData,
      });
    }

    // Mark invite token as used
    await db.astrologyPractitionerInvite.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    // Audit Log
    await db.astrologyAuditLog.create({
      data: {
        practitionerId: consultant.id,
        eventType: 'PRACTITIONER_ONBOARDED',
        actorType: 'PANDIT',
        payload: {
          displayName: consultant.displayName,
          phone: consultant.phone,
          city: consultant.city,
          state: consultant.state,
          yearsExperience: consultant.yearsExperience,
          aiReviewConsent: consultant.aiReviewConsent,
        },
      },
    });

    return NextResponse.json({
      success: true,
      practitioner: {
        id: consultant.id,
        displayName: consultant.displayName,
        onboardingStatus: consultant.onboardingStatus,
      },
    });
  } catch (error: any) {
    console.error('Onboard POST error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

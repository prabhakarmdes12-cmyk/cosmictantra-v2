import { NextRequest, NextResponse } from 'next/server';

// Placeholder: In real app use Prisma + db.ts
// For now: in-memory demo + localStorage bridge (Phase 2)
const profiles = new Map<string, any>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'phone required' }, { status: 400 });
  }

  const profile = profiles.get(phone) || {
    whatsappPhone: phone,
    fullName: null,
    consentGiven: false,
    otpVerified: false,
    familyMembers: [],
  };

  return NextResponse.json({ success: true, profile });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { whatsappPhone, fullName, consentGiven = false, familyMembers = [] } = body;

    if (!whatsappPhone) {
      return NextResponse.json({ success: false, error: 'whatsappPhone required' }, { status: 400 });
    }

    const profile = {
      whatsappPhone,
      fullName,
      consentGiven,
      consentAt: consentGiven ? new Date() : null,
      consentVersion: 'v1-dpdp-2023',
      otpVerified: true, // assume verified via OTP endpoint
      familyMembers,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    profiles.set(whatsappPhone, profile);

    return NextResponse.json({ success: true, profile });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DPDP deletion (right to be forgotten)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone required' }, { status: 400 });
    }

    const profile = profiles.get(phone);
    if (profile) {
      profile.isDeleted = true;
      profile.deletedAt = new Date();
      profiles.set(phone, profile);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile marked for deletion per DPDP Act (data retention policy applied)',
      deletedAt: new Date(),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
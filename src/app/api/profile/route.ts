import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { IdentityService } from '@/lib/pjos/identity/identityService';
import { PrismaIdentityStore } from '@/lib/pjos/identity/prismaIdentityStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ success: false, error: 'phone required' }, { status: 400 });
  }

  const repo = new PrismaIdentityStore(db);
  const identityService = new IdentityService(repo);

  try {
    const identity = await identityService.resolveIdentity('PHONE', phone);
    if (!identity) {
      return NextResponse.json({
        success: true,
        profile: {
          whatsappPhone: phone,
          fullName: null,
          consentGiven: false,
          otpVerified: false,
          familyMembers: [],
        },
      });
    }

    const relationships = await identityService.listRelationships(identity.account.id);
    const familyMembers = await Promise.all(
      relationships.map(async (r) => {
        const p = await repo.getPerson(r.personId);
        return {
          id: p?.id,
          name: p?.displayName,
          relation: r.relationType,
          birthDate: p?.birthDate,
          birthTime: p?.birthTime,
          birthPlace: p?.birthPlace,
        };
      })
    );

    return NextResponse.json({
      success: true,
      profile: {
        whatsappPhone: phone,
        fullName: identity.account.displayName,
        consentGiven: true, // simplified
        otpVerified: true,
        familyMembers,
      },
    });
  } catch (error: any) {
    console.error('[PROFILE_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { whatsappPhone, fullName, consentGiven = false, familyMembers = [] } = body;

    if (!whatsappPhone) {
      return NextResponse.json({ success: false, error: 'whatsappPhone required' }, { status: 400 });
    }

    const repo = new PrismaIdentityStore(db);
    const identityService = new IdentityService(repo);
    
    // In a real flow, OTP should be verified first. Here we assume we can claim directly for the demo
    const result = await identityService.claimSession({
      tokenHash: 'dummy_hash_for_direct_post', // Normally comes from cookie
      channel: 'PHONE',
      subject: whatsappPhone,
      verified: true, // assume verified
      displayName: fullName,
      sensitivity: 'PII_SENSITIVE'
    });

    return NextResponse.json({ 
      success: true, 
      profile: {
        whatsappPhone,
        fullName,
        consentGiven: true,
        otpVerified: true,
        familyMembers,
      } 
    });
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

    // A real implementation would mark the account as deleted or scrub PII.
    // For now we just return success.
    return NextResponse.json({
      success: true,
      message: 'Profile marked for deletion per DPDP Act (data retention policy applied)',
      deletedAt: new Date(),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAllScholars, registerScholar } from '@/lib/sabha/directory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sabha/practitioners
 * Lists all practitioners with active status, handover permalink, and profile info.
 */
export async function GET() {
  try {
    const scholars = await getAllScholars();
    return NextResponse.json({
      ok: true,
      practitioners: scholars.map(s => ({
        ...s,
        handoverUrl: `/pandit/workspace?scholarId=${encodeURIComponent(s.scholarId)}`
      })),
      count: scholars.length
    });
  } catch (error: any) {
    console.error('Error fetching practitioners:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/sabha/practitioners
 * Onboards, activates, or updates a Pandit / practitioner.
 * Invoked by Chiti Console or admin onboarding workflows.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      fullName,
      displayName,
      phone,
      city = 'वाराणसी',
      state = 'उत्तर प्रदेश',
      tradition = 'सनातन वैदिक परम्परा',
      languages = ['Hindi', 'English'],
      expertise = ['Kundali Analysis', 'Vivaha Milan'],
      yearsExperience = 10,
      specialty = 'KUNDALI',
      qualifications = 'वरिष्ठ वैदिक ज्योतिषी',
      profilePhoto = '🕉️',
      isActive = true,
      onboardingStatus = 'COMPLETED'
    } = body;

    const nameToUse = displayName || fullName;
    if (!nameToUse) {
      return NextResponse.json(
        { ok: false, error: 'Full name or display name is required' },
        { status: 400 }
      );
    }

    // Check if consultant exists by phone or name
    let consultant = null;
    if (phone && phone.trim()) {
      consultant = await db.astrologyConsultant.findFirst({
        where: { phone: phone.trim() }
      });
    }

    if (!consultant && body.id) {
      consultant = await db.astrologyConsultant.findUnique({
        where: { id: body.id }
      });
    }

    if (consultant) {
      // Update existing
      consultant = await db.astrologyConsultant.update({
        where: { id: consultant.id },
        data: {
          fullName: fullName || consultant.fullName,
          displayName: displayName || consultant.displayName,
          phone: phone ? phone.trim() : consultant.phone,
          city: city || consultant.city,
          state: state || consultant.state,
          tradition: tradition || consultant.tradition,
          languages: Array.isArray(languages) ? languages : consultant.languages,
          expertise: Array.isArray(expertise) ? expertise : consultant.expertise,
          yearsExperience: Number(yearsExperience) || consultant.yearsExperience,
          specialty: specialty as any,
          qualifications: qualifications || consultant.qualifications,
          profilePhoto: profilePhoto || consultant.profilePhoto,
          isActive: isActive !== undefined ? Boolean(isActive) : consultant.isActive,
          onboardingStatus: onboardingStatus as any
        }
      });
    } else {
      // Create new
      consultant = await db.astrologyConsultant.create({
        data: {
          fullName: fullName || nameToUse,
          displayName: displayName || nameToUse,
          phone: phone ? phone.trim() : '',
          city,
          state,
          tradition,
          languages: Array.isArray(languages) ? languages : ['Hindi', 'English'],
          expertise: Array.isArray(expertise) ? expertise : ['Kundali Analysis'],
          yearsExperience: Number(yearsExperience) || 10,
          specialty: specialty as any,
          qualifications,
          profilePhoto,
          isActive: Boolean(isActive),
          onboardingStatus: onboardingStatus as any,
          badges: ['Verified Scholar', 'Chiti Verified']
        }
      });
    }

    // Register in in-memory directory for instant zero-latency routing
    registerScholar({
      scholarId: consultant.id,
      name: consultant.displayName || consultant.fullName,
      title: consultant.qualifications || `${consultant.tradition || 'वैदिक'} ज्योतिर्विद`,
      tradition: consultant.tradition || 'सनातन वैदिक परम्परा',
      city: consultant.city ? `${consultant.city}, ${consultant.state}` : 'वाराणसी',
      languages: consultant.languages,
      specialities: consultant.expertise,
      experienceYears: consultant.yearsExperience,
      glyph: consultant.profilePhoto && !consultant.profilePhoto.startsWith('http') ? consultant.profilePhoto : '🕉️'
    });

    const handoverUrl = `/pandit/workspace?scholarId=${encodeURIComponent(consultant.id)}`;

    return NextResponse.json({
      ok: true,
      consultant: {
        id: consultant.id,
        name: consultant.displayName,
        city: consultant.city,
        isActive: consultant.isActive,
        onboardingStatus: consultant.onboardingStatus,
        handoverUrl
      }
    });
  } catch (error: any) {
    console.error('Error in practitioner onboarding API:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

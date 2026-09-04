/**
 * SABHA VERIFIED SCHOLAR DIRECTORY — routing-layer reference data (ZERO PII).
 *
 * This directory exists ONLY for the Customer-Care routing layer and the public
 * "Free Call" listing. It deliberately contains NO phone numbers, WhatsApp IDs,
 * or email addresses (CALL_SECURITY_MODEL.md §3.1 — Zero Phone Number Disclosure
 * Invariant). Personal contact details of scholars never touch client code;
 * they exist only as masked fields inside ConsultationSession records.
 */

export interface VerifiedScholar {
  scholarId: string;
  name: string;
  title: string;
  tradition: string;
  city: string;
  languages: string[];
  specialities: string[];
  experienceYears: number;
  glyph: string;
}

export const VERIFIED_SCHOLARS: VerifiedScholar[] = [
  {
    scholarId: 'SCH-KASHI-01',
    name: 'पं. विद्यानंद शास्त्री',
    title: 'वरिष्ठ मानव ज्योतिषी • काशी विद्वत् परिषद्',
    tradition: 'काशी परम्परा',
    city: 'वाराणसी (Kashi)',
    languages: ['Hindi', 'Sanskrit', 'English'],
    specialities: ['Career & Business', 'Vivaha Milan', 'Health Muhurta'],
    experienceYears: 28,
    glyph: '🕉️'
  },
  {
    scholarId: 'SCH-KASHI-02',
    name: 'पं. रामकृष्ण त्रिपाठी',
    title: 'ज्योतिष आचार्य • प्राश्न विशेषज्ञ',
    tradition: 'काशी परम्परा',
    city: 'वाराणसी (Kashi)',
    languages: ['Hindi', 'Bhojpuri'],
    specialities: ['Prashna Kundali', 'Griha Pravesh', 'Upaya'],
    experienceYears: 19,
    glyph: '🪔'
  },
  {
    scholarId: 'SCH-PUne-03',
    name: 'वि. पं. श्रीनिवास जोशी',
    title: 'ज्योतिर्विद • महाराष्ट्र परम्परा',
    tradition: 'चित्पावन परम्परा',
    city: 'पुणे (Pune)',
    languages: ['Marathi', 'Hindi', 'English'],
    specialities: ['Career & Finance', 'Varga Analysis'],
    experienceYears: 22,
    glyph: '✨'
  }
];

// Dynamic registry for practitioners onboarded via DB or admin console
const DYNAMIC_SCHOLARS = new Map<string, VerifiedScholar>();

export function registerScholar(scholar: VerifiedScholar): void {
  DYNAMIC_SCHOLARS.set(scholar.scholarId, scholar);
}

export function getScholarById(scholarId: string): VerifiedScholar | undefined {
  return VERIFIED_SCHOLARS.find(s => s.scholarId === scholarId) || DYNAMIC_SCHOLARS.get(scholarId);
}

/**
 * Returns all verified scholars combining static foundational scholars and
 * approved, active practitioners from the database.
 */
export async function getAllScholars(): Promise<VerifiedScholar[]> {
  const scholarsMap = new Map<string, VerifiedScholar>();

  // Add static foundational scholars first
  for (const s of VERIFIED_SCHOLARS) {
    scholarsMap.set(s.scholarId, s);
  }

  // Query database for active, onboarded consultants
  try {
    const { db } = await import('@/lib/db');
    const isProduction = process.env.NODE_ENV === 'production';
    const dbConsultants = await db.astrologyConsultant.findMany({
      where: {
        isActive: true,
        onboardingStatus: 'COMPLETED',
        ...(isProduction ? { isTestFixture: false } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    for (const c of dbConsultants) {
      const scholar: VerifiedScholar = {
        scholarId: c.id,
        name: c.displayName || c.fullName || 'पं. ज्योतिषी',
        title: c.qualifications || `${c.tradition || 'वैदिक'} ज्योतिर्विद`,
        tradition: c.tradition || 'सनातन वैदिक परम्परा',
        city: c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : 'वाराणसी',
        languages: c.languages && c.languages.length ? c.languages : ['Hindi', 'English'],
        specialities: c.expertise && c.expertise.length ? c.expertise : [c.specialty],
        experienceYears: c.yearsExperience || 10,
        glyph: c.profilePhoto && !c.profilePhoto.startsWith('http') ? c.profilePhoto : '🕉️'
      };
      registerScholar(scholar);
      scholarsMap.set(scholar.scholarId, scholar);
    }
  } catch (error) {
    console.warn('[getAllScholars] Falling back to static scholars list:', error);
  }

  return Array.from(scholarsMap.values());
}

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

export function getScholarById(scholarId: string): VerifiedScholar | undefined {
  return VERIFIED_SCHOLARS.find(s => s.scholarId === scholarId);
}

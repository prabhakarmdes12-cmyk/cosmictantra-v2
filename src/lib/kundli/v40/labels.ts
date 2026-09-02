/**
 * KUNDLI V40 — bilingual term registry (§30).
 *
 * One place where every Jyotish term used by the report is written, in
 * Devanagari and in English. Proper Jyotish terminology is NOT translated
 * into awkward English: `bhava`, `nakshatra`, `mahadasha`, `lagna` keep their
 * Sanskrit form and carry an English gloss beside them.
 *
 * Label modes:
 *   'hi'    — Devanagari only
 *   'en'    — English only
 *   'hi-en' — "प्रथम भाव — First House" (the Pandit-facing default)
 */

export type LabelMode = 'en' | 'hi' | 'hi-en';

export interface Term {
  hi: string;
  en: string;
}

const T = (hi: string, en: string): Term => ({ hi, en });

export const TERMS = {
  /* document */
  kundli: T('कुण्डली', 'Kundli'),
  janmaKundli: T('जन्म कुण्डली', 'Birth Chart'),
  consultationPart: T('परामर्श कुण्डली', 'Consultation Kundli'),
  scholarPart: T('विद्वत् परिशिष्ट', 'Scholar Appendix'),
  invocation: T('॥ श्री गणेशाय नमः ॥', 'Shri Ganeshaya Namah'),

  /* passport */
  birthDetails: T('जन्म विवरण', 'Birth Details'),
  placeAndTime: T('स्थान एवं समय', 'Place and Time'),
  panchangaIdentity: T('पंचांग पहचान', 'Panchanga Identity'),
  calculationMethod: T('गणना पद्धति', 'Calculation Method'),
  name: T('नाम', 'Name'),
  date: T('दिनांक', 'Date'),
  localTime: T('स्थानीय समय', 'Local Time'),
  weekday: T('वार', 'Weekday'),
  place: T('स्थान', 'Place'),
  latitude: T('अक्षांश', 'Latitude'),
  longitude: T('देशांतर', 'Longitude'),
  timezone: T('समय क्षेत्र', 'Timezone'),
  utcInstant: T('यूटीसी क्षण', 'UTC Instant'),
  timezoneProvenance: T('समय क्षेत्र स्रोत', 'Timezone Provenance'),
  coordinateProvenance: T('निर्देशांक स्रोत', 'Coordinate Provenance'),

  /* panchanga */
  tithi: T('तिथि', 'Tithi'),
  paksha: T('पक्ष', 'Paksha'),
  nakshatra: T('नक्षत्र', 'Nakshatra'),
  // चरण, not पद. Both are correct Jyotish for a nakshatra quarter, but चरण is
  // what a North Indian Pandit says aloud, and V41 §6 specifies it by name.
  // One concept, one Hindi word, everywhere in the document.
  pada: T('चरण', 'Pada'),
  yoga: T('योग', 'Yoga'),
  karana: T('करण', 'Karana'),
  ayana: T('अयन', 'Ayana'),
  ritu: T('ऋतु', 'Ritu'),
  amantaMasa: T('अमांत मास', 'Amanta Masa'),
  purnimantaMasa: T('पूर्णिमांत मास', 'Purnimanta Masa'),
  samvat: T('संवत्', 'Samvat'),

  /* core identity */
  saar: T('कुण्डली सार', 'Kundli Summary'),
  coreIdentity: T('मूल पहचान', 'Core Identity'),
  lagna: T('लग्न', 'Ascendant'),
  lagnesha: T('लग्नेश', 'Lagna Lord'),
  rashi: T('राशि', 'Sign'),
  chandraRashi: T('चन्द्र राशि', 'Moon Sign'),
  suryaRashi: T('सूर्य राशि', 'Sun Sign'),
  janmaNakshatra: T('जन्म नक्षत्र', 'Birth Nakshatra'),
  nakshatraLord: T('नक्षत्र स्वामी', 'Nakshatra Lord'),

  /* bhava */
  bhava: T('भाव', 'House'),
  bhavesha: T('भावेश', 'House Lord'),
  bhavaMatrix: T('भाव विश्लेषण', 'Bhava Intelligence'),
  occupants: T('स्थित ग्रह', 'Occupants'),
  lordPlacement: T('भावेश स्थिति', 'Lord Placement'),
  aspectsReceived: T('प्राप्त दृष्टि', 'Aspects Received'),
  karaka: T('कारक', 'Karaka'),

  /* graha */
  graha: T('ग्रह', 'Planet'),
  grahaDossier: T('ग्रह स्थिति', 'Graha Dossier'),
  degree: T('अंश', 'Degree'),
  motion: T('गति', 'Motion'),
  dignity: T('बल/अवस्था', 'Dignity'),
  retrograde: T('वक्री', 'Retrograde'),
  direct: T('मार्गी', 'Direct'),
  combust: T('अस्त', 'Combust'),
  vargottama: T('वर्गोत्तम', 'Vargottama'),
  functionalRole: T('कार्येश भूमिका', 'Functional Role'),
  naturalCharacter: T('नैसर्गिक स्वभाव', 'Natural Character'),

  /* charts */
  d1: T('जन्म कुण्डली (D1)', 'Rashi Chart (D1)'),
  d9: T('नवांश (D9)', 'Navamsha (D9)'),
  d10: T('दशांश (D10)', 'Dashamsha (D10)'),

  /* dasha */
  vimshottari: T('विंशोत्तरी दशा', 'Vimshottari Dasha'),
  mahadasha: T('महादशा', 'Mahadasha'),
  antardasha: T('अन्तर्दशा', 'Antardasha'),
  pratyantardasha: T('प्रत्यन्तर्दशा', 'Pratyantardasha'),
  balanceAtBirth: T('जन्म समय दशा शेष', 'Balance at Birth'),
  nextAntardasha: T('अगली अन्तर्दशा', 'Next Antardasha'),
  nextMahadasha: T('अगली महादशा', 'Next Mahadasha'),
  nextTransition: T('अगला परिवर्तन', 'Next Transition'),
  currentPeriod: T('वर्तमान दशा', 'Current Period'),

  /* yoga / dosha */
  yogaDashboard: T('योग एवं दोष', 'Yoga and Dosha'),
  confirmed: T('विद्यमान', 'Confirmed'),
  absent: T('अनुपस्थित', 'Absent'),
  scholarJudgement: T('विद्वत् विवेक', 'Scholar Judgement'),
  notCalculated: T('गणित नहीं', 'Not Calculated'),
  dosha: T('दोष', 'Dosha'),

  /* synthesis */
  career: T('कर्म एवं आजीविका', 'Career'),
  natalPromise: T('जन्मकालीन संकेत', 'Natal Indication'),
  supportive: T('सहायक कारक', 'Supportive Factors'),
  challenging: T('बाधक कारक', 'Challenging Factors'),
  mixed: T('मिश्रित कारक', 'Mixed Factors'),
  activation: T('दशा सक्रियता', 'Dasha Activation'),
  evidenceCoverage: T('प्रमाण व्याप्ति', 'Evidence Coverage'),

  /* pandit workbench */
  discussionPoints: T('पंडित चर्चा बिंदु', 'Pandit Discussion Points'),
  panditNotes: T('पंडित टिप्पणी', 'Pandit Notes'),
  mainObservation: T('मुख्य अवलोकन', 'Main Observation'),
  marriage: T('विवाह', 'Marriage'),
  finance: T('धन', 'Finance'),
  remedy: T('उपाय', 'Remedy'),
  followUp: T('अगली भेंट', 'Follow-up'),
} as const;

export type TermKey = keyof typeof TERMS;

/** Ordinal bhava names, 1..12. */
export const BHAVA_NAMES: Term[] = [
  T('प्रथम भाव', 'First House'),
  T('द्वितीय भाव', 'Second House'),
  T('तृतीय भाव', 'Third House'),
  T('चतुर्थ भाव', 'Fourth House'),
  T('पंचम भाव', 'Fifth House'),
  T('षष्ठ भाव', 'Sixth House'),
  T('सप्तम भाव', 'Seventh House'),
  T('अष्टम भाव', 'Eighth House'),
  T('नवम भाव', 'Ninth House'),
  T('दशम भाव', 'Tenth House'),
  T('एकादश भाव', 'Eleventh House'),
  T('द्वादश भाव', 'Twelfth House'),
];

/** Sign id 1..12 -> Devanagari / Sanskrit-transliterated / English. */
export const SIGN_TERMS: { hi: string; sanskrit: string; en: string }[] = [
  { hi: 'मेष', sanskrit: 'Mesha', en: 'Aries' },
  { hi: 'वृषभ', sanskrit: 'Vrishabha', en: 'Taurus' },
  { hi: 'मिथुन', sanskrit: 'Mithuna', en: 'Gemini' },
  { hi: 'कर्क', sanskrit: 'Karka', en: 'Cancer' },
  { hi: 'सिंह', sanskrit: 'Simha', en: 'Leo' },
  { hi: 'कन्या', sanskrit: 'Kanya', en: 'Virgo' },
  { hi: 'तुला', sanskrit: 'Tula', en: 'Libra' },
  { hi: 'वृश्चिक', sanskrit: 'Vrishchika', en: 'Scorpio' },
  { hi: 'धनु', sanskrit: 'Dhanu', en: 'Sagittarius' },
  { hi: 'मकर', sanskrit: 'Makara', en: 'Capricorn' },
  { hi: 'कुम्भ', sanskrit: 'Kumbha', en: 'Aquarius' },
  { hi: 'मीन', sanskrit: 'Meena', en: 'Pisces' },
];

export const PLANET_TERMS: Record<string, Term & { abbrHi: string; abbrEn: string }> = {
  Sun: { hi: 'सूर्य', en: 'Sun', abbrHi: 'सू', abbrEn: 'Su' },
  Moon: { hi: 'चन्द्र', en: 'Moon', abbrHi: 'चं', abbrEn: 'Mo' },
  Mars: { hi: 'मंगल', en: 'Mars', abbrHi: 'मं', abbrEn: 'Ma' },
  Mercury: { hi: 'बुध', en: 'Mercury', abbrHi: 'बु', abbrEn: 'Me' },
  Jupiter: { hi: 'गुरु', en: 'Jupiter', abbrHi: 'गु', abbrEn: 'Ju' },
  Venus: { hi: 'शुक्र', en: 'Venus', abbrHi: 'शु', abbrEn: 'Ve' },
  Saturn: { hi: 'शनि', en: 'Saturn', abbrHi: 'श', abbrEn: 'Sa' },
  Rahu: { hi: 'राहु', en: 'Rahu', abbrHi: 'रा', abbrEn: 'Ra' },
  Ketu: { hi: 'केतु', en: 'Ketu', abbrHi: 'के', abbrEn: 'Ke' },
};

/** 27 nakshatras, in order, with their Devanagari names. */
export const NAKSHATRA_TERMS: Term[] = [
  T('अश्विनी', 'Ashwini'), T('भरणी', 'Bharani'), T('कृत्तिका', 'Krittika'),
  T('रोहिणी', 'Rohini'), T('मृगशिरा', 'Mrigashira'), T('आर्द्रा', 'Ardra'),
  T('पुनर्वसु', 'Punarvasu'), T('पुष्य', 'Pushya'), T('आश्लेषा', 'Ashlesha'),
  T('मघा', 'Magha'), T('पूर्वा फाल्गुनी', 'Purva Phalguni'), T('उत्तरा फाल्गुनी', 'Uttara Phalguni'),
  T('हस्त', 'Hasta'), T('चित्रा', 'Chitra'), T('स्वाति', 'Swati'),
  T('विशाखा', 'Vishakha'), T('अनुराधा', 'Anuradha'), T('ज्येष्ठा', 'Jyeshtha'),
  T('मूल', 'Mula'), T('पूर्वाषाढ़ा', 'Purva Ashadha'), T('उत्तराषाढ़ा', 'Uttara Ashadha'),
  T('श्रवण', 'Shravana'), T('धनिष्ठा', 'Dhanishta'), T('शतभिषा', 'Shatabhisha'),
  T('पूर्व भाद्रपद', 'Purva Bhadrapada'), T('उत्तर भाद्रपद', 'Uttara Bhadrapada'), T('रेवती', 'Revati'),
];

export const DIGNITY_TERMS: Record<string, Term> = {
  EXALTED: T('उच्च', 'Exalted'),
  MOOLATRIKONA: T('मूलत्रिकोण', 'Moolatrikona'),
  OWN_SIGN: T('स्वक्षेत्र', 'Own Sign'),
  FRIEND: T('मित्र क्षेत्र', 'Friendly Sign'),
  NEUTRAL: T('सम क्षेत्र', 'Neutral Sign'),
  ENEMY: T('शत्रु क्षेत्र', 'Enemy Sign'),
  DEBILITATED: T('नीच', 'Debilitated'),
  NOT_CALCULATED: T('गणित नहीं', 'Not Calculated'),
};

export const STATUS_TERMS: Record<string, Term> = {
  PRESENT: T('विद्यमान', 'Present'),
  ABSENT: T('अनुपस्थित', 'Absent'),
  INDETERMINATE: T('अनिश्चित', 'Indeterminate'),
  NOT_CALCULATED: T('गणित नहीं', 'Not Calculated'),
  VALIDATION_PENDING: T('सत्यापन शेष', 'Validation Pending'),
};

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

export function renderTerm(term: Term, mode: LabelMode): string {
  if (mode === 'hi') return term.hi;
  if (mode === 'en') return term.en;
  return `${term.hi} — ${term.en}`;
}

export function label(key: TermKey, mode: LabelMode): string {
  return renderTerm(TERMS[key], mode);
}

export function bhavaLabel(house: number, mode: LabelMode): string {
  const term = BHAVA_NAMES[house - 1];
  if (!term) return String(house);
  return renderTerm(term, mode);
}

/** Sign name. `hi` gives Devanagari, `en` gives the English name, `hi-en` both. */
export function signLabelV40(signId: number, mode: LabelMode): string {
  const s = SIGN_TERMS[signId - 1];
  if (!s) return String(signId);
  if (mode === 'hi') return s.hi;
  if (mode === 'en') return s.en;
  return `${s.hi} — ${s.en}`;
}

/** Sanskrit-transliterated sign name, used where a compact Latin token is needed. */
export function signSanskrit(signId: number): string {
  return SIGN_TERMS[signId - 1]?.sanskrit ?? String(signId);
}

export function planetLabel(id: string, mode: LabelMode): string {
  const p = PLANET_TERMS[id];
  if (!p) return id;
  if (mode === 'hi') return p.hi;
  if (mode === 'en') return p.en;
  return `${p.hi} — ${p.en}`;
}

export function planetAbbr(id: string, mode: LabelMode): string {
  const p = PLANET_TERMS[id];
  if (!p) return id.slice(0, 2);
  return mode === 'hi' ? p.abbrHi : p.abbrEn;
}

export function nakshatraLabel(name: string, mode: LabelMode): string {
  const term = NAKSHATRA_TERMS.find((n) => n.en.toLowerCase() === name.trim().toLowerCase());
  if (!term) return name;
  return renderTerm(term, mode);
}

export function dignityLabel(category: string, mode: LabelMode): string {
  const t = DIGNITY_TERMS[category];
  return t ? renderTerm(t, mode) : category.replace(/_/g, ' ');
}

export function statusLabel(status: string, mode: LabelMode): string {
  const t = STATUS_TERMS[status];
  return t ? renderTerm(t, mode) : status.replace(/_/g, ' ');
}

/** Locale -> default label mode. Hindi reports are bilingual for Jyotish terms. */
/**
 * V41 §2 — the locale IS the label mode.
 *
 * This used to read `locale === 'hi' ? 'hi-en' : 'en'`, which meant the `'hi'`
 * label mode — implemented in every render function in this file — could never
 * be reached. Worse, call sites defensively wrote `mode === 'hi' ? 'hi' : 'en'`
 * to route Devanagari, and that ternary was therefore ALWAYS false: the graha
 * dossier, the bhava matrix and the chart cells printed English planets and
 * rashis in a Hindi report while the Devanagari sat unused in this registry.
 *
 * That single line is most of why Hindi coverage measured 4%.
 */
export function labelModeForLocale(locale: LabelMode): LabelMode {
  return locale;
}

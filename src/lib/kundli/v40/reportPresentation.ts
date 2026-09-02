/**
 * Reader-facing presentation helpers for the V41 report model.
 *
 * The canonical and derived layers intentionally keep stable English enum
 * values, fact paths and raw degrees. This module is the boundary where those
 * values become language-aware report copy. Keeping it here avoids a second
 * set of astrology calculations in PDF/SVG renderers and prevents developer
 * identifiers from leaking into Part A.
 */
import {
  DIGNITY_TERMS,
  NAKSHATRA_TERMS,
  PLANET_TERMS,
  SIGN_TERMS,
  type LabelMode,
  bhavaLabel,
  dignityLabel,
  nakshatraLabel,
  planetLabel,
  signLabelV40,
} from './labels';
import { dm, dms } from './format';
import { numeral, numeralPolicyFor } from './numerals';
import { STRUCTURAL_HI, tr } from './structuralTerms';

const EN_ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
const HI_ORDINAL_STEMS = ['', 'प्रथम', 'द्वितीय', 'तृतीय', 'चतुर्थ', 'पंचम', 'षष्ठ', 'सप्तम', 'अष्टम', 'नवम', 'दशम', 'एकादश', 'द्वादश'];

const numericPolicy = (mode: LabelMode) => numeralPolicyFor(mode === 'hi' ? 'hi' : 'en');

/** A number that follows the report's one-script-per-value policy. */
export function readerNumber(value: string | number, mode: LabelMode): string {
  return numeral(String(value), numericPolicy(mode));
}

/** Compact degrees-and-minutes with the same numeral policy as chart houses. */
export function readerDm(value: number, mode: LabelMode): string {
  return readerNumber(dm(value), mode);
}

/** Full DMS with the same numeral policy as chart houses. */
export function readerDms(value: number, mode: LabelMode): string {
  return readerNumber(dms(value), mode);
}

function asHouseNumber(value: string | number): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12) return value;
  const match = /\b(1[0-2]|[1-9])(?:st|nd|rd|th)?\b/.exec(String(value));
  return match ? Number(match[1]) : null;
}

/** A complete bhava label for table cells and prose that does not append "भाव" itself. */
export function readerBhava(value: string | number, mode: LabelMode): string {
  const house = asHouseNumber(value);
  if (!house) return readerNumber(value, mode);
  return bhavaLabel(house, mode);
}

/**
 * The ordinal stem used by Hindi templates that append "भाव" after the slot.
 * English remains an ordinal; bilingual keeps a concise English gloss.
 */
export function readerBhavaStem(value: string | number, mode: LabelMode): string {
  const house = asHouseNumber(value);
  if (!house) return readerNumber(value, mode);
  if (mode === 'en') return EN_ORDINAL[house];
  if (mode === 'hi') return HI_ORDINAL_STEMS[house];
  return `${HI_ORDINAL_STEMS[house]} (${EN_ORDINAL[house]})`;
}

function localizedTerm(en: string, hi: string, mode: LabelMode): string {
  if (mode === 'en') return en;
  return mode === 'hi' ? hi : `${hi} / ${en}`;
}

const DYNAMIC_HI: Record<string, string> = {
  'own sign': 'स्वगृह',
  'friendly sign': 'मित्र राशि',
  'neutral sign': 'सम राशि',
  'enemy sign': 'शत्रु राशि',
  'moolatrikona': 'मूलत्रिकोण',
  'exalted': 'उच्च',
  'debilitated': 'नीच',
  'Natural benefic': 'नैसर्गिक शुभ ग्रह',
  'Natural malefic': 'नैसर्गिक पाप ग्रह',
  'Natural neutral': 'नैसर्गिक सम ग्रह',
  'benefic': 'शुभ',
  'malefic': 'पाप',
  'neutral': 'सम',
  'friend': 'मित्र',
  'conditional': 'शर्तानुसार',
  'mahadasha': 'महादशा',
  'antardasha': 'अन्तर्दशा',
  'pratyantardasha': 'प्रत्यन्तर्दशा',
  'natural benefic': 'नैसर्गिक शुभ ग्रह',
  'natural malefic': 'नैसर्गिक पाप ग्रह',
  'natural neutral': 'नैसर्गिक सम ग्रह',
  'yogakaraka': 'योगकारक',
  'kendra': 'केन्द्र',
  'trikona': 'त्रिकोण',
  'kendra lord': 'केन्द्रेश',
  'trikona lord': 'त्रिकोणेश',
  'dusthana lord': 'दुःस्थानेश',
  'maraka candidate': 'मारकेश सम्भावना',
  'neutral bhava lord': 'सम भावेश',
  'no sign lordship (node)': 'राशि-स्वामित्व नहीं (छाया ग्रह)',
  'Mahadasha': 'महादशा',
  'Antardasha': 'अन्तर्दशा',
  'Pratyantardasha': 'प्रत्यन्तर्दशा',
  'current': 'वर्तमान',
  'severity': 'तीव्रता',
  'MEDIUM': 'मध्यम',
  'HIGH': 'उच्च',
  'LOW': 'न्यून',
  'not active at birth': 'जन्म के समय सक्रिय नहीं',
  'rising': 'आरम्भिक चरण',
  'peak': 'मध्य चरण',
  'setting': 'अन्तिम चरण',
  'bhava': 'भाव',
  'bhavas': 'भाव',
  'orb': 'दीप्तांश',
  'combustion': 'अस्तता',
  'retrograde': 'वक्री',
  'at birth': 'जन्म के समय',
  'from the Sun': 'सूर्य से',
  'from Sun': 'सूर्य से',
  'and': 'और',
};

/**
 * Closed reader vocabulary used inside runtime templates. It intentionally
 * maps terms rather than attempting to machine-translate an English sentence.
 * A missing sentence remains visible to the Hindi completeness gate.
 */
function vocabulary(): Record<string, string> {
  const out: Record<string, string> = { ...STRUCTURAL_HI, ...DYNAMIC_HI };
  for (const [en, term] of Object.entries(PLANET_TERMS)) out[en] = term.hi;
  for (const sign of SIGN_TERMS) {
    out[sign.sanskrit] = sign.hi;
    out[sign.en] = sign.hi;
  }
  for (const nakshatra of NAKSHATRA_TERMS) out[nakshatra.en] = nakshatra.hi;
  for (const [en, term] of Object.entries(DIGNITY_TERMS)) {
    out[en] = term.hi;
    out[term.en] = term.hi;
  }
  return out;
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Localize known Jyotish vocabulary embedded in a generated parameter. */
export function localizeKnownText(value: string | number, mode: LabelMode): string {
  const source = String(value);
  if (mode === 'en') return source;

  const terms = vocabulary();
  const keys = Object.keys(terms).sort((a, b) => b.length - a.length).map(escapeRegex);
  if (keys.length === 0) return source;
  const matcher = new RegExp(`(?<![A-Za-z])(?:${keys.join('|')})(?![A-Za-z])`, 'g');
  return source.replace(matcher, (matched) => localizedTerm(matched, terms[matched], mode));
}

function localizeOrdinals(value: string | number, mode: LabelMode): string {
  const source = String(value);
  return source.replace(/\b(1[0-2]|[1-9])(?:st|nd|rd|th)\b/g, (_, n: string) => readerBhavaStem(Number(n), mode));
}

/** Localised wording for the dignity phrases emitted by careerSynthesis. */
function localizeDignityPhrase(value: string | number, mode: LabelMode): string {
  const source = String(value);
  const phrases: Record<string, string> = {
    'in its own sign': 'स्वगृह में',
    'in its moolatrikona': 'मूलत्रिकोण में',
    'in a friendly sign': 'मित्र राशि में',
    'in an inimical sign': 'शत्रु राशि में',
    'in a neutral sign': 'सम राशि में',
    exalted: 'उच्च',
    debilitated: 'नीच',
    friend: 'मित्र',
  };
  return phrases[source]
    ? localizedTerm(source, phrases[source], mode)
    : localizeKnownText(source, mode);
}

/**
 * Functional lordship is generated as English for stable audit records.
 * Parse its deliberately closed sentence grammar at the presentation boundary
 * instead of exposing that generator prose in a Hindi report.
 */
function localizeFunctionalStatement(value: string | number, mode: LabelMode): string {
  const source = String(value);
  if (mode === 'en') return source;
  const hindiTerm = (hi: string, en: string) => localizedTerm(en, hi, mode);
  const out: string[] = [];
  const rules = /^Rules the (.+?) bhava\./.exec(source);
  if (rules) {
    const houses = [...rules[1].matchAll(/\b(1[0-2]|[1-9])(?:st|nd|rd|th)\b/g)]
      .map((match) => readerBhava(Number(match[1]), mode));
    if (houses.length > 0) out.push(`${houses.join(mode === 'hi' ? ' और ' : ' और / and ')} का स्वामी।`);
  }
  const clauses: [RegExp, string, string][] = [
    [/Kendra and trikona lord together — yogakaraka for this lagna\./, 'केन्द्र और त्रिकोण दोनों का स्वामी — इस लग्न का योगकारक।', 'Kendra and trikona lord together — yogakaraka for this lagna.'],
    [/Trikona lord\./, 'त्रिकोणेश।', 'Trikona lord.'],
    [/Dusthana lord\./, 'दुःस्थानेश।', 'Dusthana lord.'],
    [/Kendra lord\./, 'केन्द्रेश।', 'Kendra lord.'],
    [/Owns both a trikona and a dusthana — a mixed functional position that a scholar must weigh\./, 'त्रिकोण और दुःस्थान दोनों का स्वामी — मिश्रित कार्यात्मक स्थिति।', 'Owns both a trikona and a dusthana — a mixed functional position that a scholar must weigh.'],
    [/Owns a maraka bhava \(2nd\/7th\) — candidate only; no maraka verdict is issued by this engine\./, 'मारक भावों का स्वामी है; केवल सम्भावना है, कोई मारक निर्णय नहीं।', 'Owns a maraka bhava (2nd/7th) — candidate only; no maraka verdict is issued by this engine.'],
    [/Rules no sign in the classical scheme, so it has no functional lordship\. It acts through its dispositor and its house\./, 'शास्त्रीय पद्धति में कोई राशि-स्वामित्व नहीं; फल अपने अधिपति और स्थित भाव से देखा जाता है।', 'Rules no sign in the classical scheme, so it has no functional lordship. It acts through its dispositor and its house.'],
    [/Rules no bhava in this chart\./, 'इस कुण्डली में कोई भाव-स्वामित्व नहीं।', 'Rules no bhava in this chart.'],
  ];
  for (const [pattern, hi, en] of clauses) {
    if (pattern.test(source)) out.push(mode === 'hi' ? hi : `${hi} / ${en}`);
  }
  return out.length > 0 ? out.join(' ') : localizeKnownText(source, mode);
}

/**
 * Adapter for `trTemplate` parameters. Parameter names carry useful semantic
 * information (a `house` is not just a number), so this is more precise than
 * a blanket transliteration pass and keeps pure-Hindi numerals consistent.
 */
export function localizeTemplateValue(
  key: string,
  value: string | number,
  mode: LabelMode,
): string {
  if (mode === 'en') return String(value);

  const houseKeys = new Set(['house', 'rahuHouse', 'ketuHouse', 'lagnaHouse', 'tenthHouse', 'lordHouse']);
  const numericKeys = new Set(['count', 'support', 'challenge', 'offset', 'pada', 'degree', 'distance', 'orb', 'separation', 'coverage', 'total', 'resolved']);
  const ordinalListKeys = new Set(['ruled', 'houses']);

  if (houseKeys.has(key)) return readerBhavaStem(value, mode);
  if (numericKeys.has(key)) return readerNumber(value, mode);
  if (key === 'dignity') return localizeDignityPhrase(value, mode);
  if (key === 'functionalStatement') return localizeFunctionalStatement(value, mode);

  let localized = localizeKnownText(value, mode);
  if (ordinalListKeys.has(key) || key === 'list' || key === 'occupancy') {
    localized = localizeOrdinals(localized, mode);
  }
  // Lists such as "Mercury (10th bhava)" keep their data grammatical after
  // vocabulary replacement without pretending to translate arbitrary prose.
  localized = localized.replace(/\bbhava\b/gi, mode === 'hi' ? 'भाव' : 'भाव / bhava');
  if (key === 'houses' || key === 'occupancy' || key === 'arthas') localized = readerNumber(localized, mode);
  return localized;
}

const YOGA_NAME_BY_ID: Record<string, string> = {
  YOGA_GAJA_KESARI: 'Gaja-Kesari Yoga',
  YOGA_BUDHADITYA: 'Budhaditya Yoga',
  YOGA_CHANDRA_MANGALA: 'Chandra-Mangala Yoga',
  YOGA_KEMADRUMA: 'Kemadruma Yoga',
  YOGA_RUCHAKA: 'Ruchaka Yoga (Pancha Mahapurusha)',
  YOGA_BHADRA: 'Bhadra Yoga (Pancha Mahapurusha)',
  YOGA_HAMSA: 'Hamsa Yoga (Pancha Mahapurusha)',
  YOGA_MALAVYA: 'Malavya Yoga (Pancha Mahapurusha)',
  YOGA_SASA: 'Sasa Yoga (Pancha Mahapurusha)',
  YOGA_DHARMA_KARMADHIPATI: 'Dharma-Karmadhipati Yoga (conjunction or parivartana only)',
};

/**
 * Convert a canonical fact path into a short reader-facing evidence cue.
 * Raw paths remain available in the Scholar lineage appendix; Part A should
 * explain what was checked, not print an implementation address.
 */
export function readerEvidence(path: string, mode: LabelMode): string {
  const p = String(path);
  if (p === 'ascendant.sign.en' || p === 'ascendant.sign.name') return localizedTerm('Ascendant sign', 'लग्न राशि', mode);
  if (p === 'ascendant.degreeInSign') return localizedTerm('Ascendant degree', 'लग्न अंश', mode);
  if (p === 'dashas.current.mahadasha') return localizedTerm('Current Mahadasha', 'वर्तमान महादशा', mode);
  if (p === 'dashas.current.antardasha') return localizedTerm('Current Antardasha', 'वर्तमान अन्तर्दशा', mode);
  if (p === 'dashas.current.pratyantardasha') return localizedTerm('Current Pratyantardasha', 'वर्तमान प्रत्यन्तर्दशा', mode);

  const planet = /^planets\[([^\]]+)\]\.(house|sign(?:\.en|\.name|\.id)?|degreeInSign|dignity|retrograde|nakshatra\.name|nakshatra\.pada)$/.exec(p);
  if (planet) {
    const [, id, field] = planet;
    const name = planetLabel(id, mode);
    const detail: Record<string, [string, string]> = {
      house: ['house', 'भाव'],
      sign: ['sign', 'राशि'],
      'sign.en': ['sign', 'राशि'],
      'sign.name': ['sign', 'राशि'],
      'sign.id': ['sign', 'राशि'],
      degreeInSign: ['degree', 'अंश'],
      dignity: ['dignity', 'अवस्था'],
      retrograde: ['motion', 'गति'],
      'nakshatra.name': ['nakshatra', 'नक्षत्र'],
      'nakshatra.pada': ['nakshatra pada', 'नक्षत्र चरण'],
    };
    const label = detail[field] ?? ['chart fact', 'कुण्डली तथ्य'];
    return `${name} — ${localizedTerm(label[0], label[1], mode)}`;
  }

  const house = /^houses\[(\d+)\]\.(sign(?:\.en|\.id|\.lord)?|planets)$/.exec(p);
  if (house) {
    const [, number, field] = house;
    const detail = field === 'planets' ? ['occupants', 'स्थित ग्रह'] : field === 'sign.lord' ? ['house lord', 'भावेश'] : ['sign', 'राशि'];
    return `${readerBhava(Number(number), mode)} — ${localizedTerm(detail[0], detail[1], mode)}`;
  }

  const yoga = /^yogas\[([^\]]+)\]\.(status|rule)$/.exec(p);
  if (yoga) {
    const [, id, field] = yoga;
    const name = YOGA_NAME_BY_ID[id] ?? id.replace(/^YOGA_/, '').replace(/_/g, ' ');
    return `${localizeKnownText(name, mode)} — ${localizedTerm(field === 'status' ? 'status' : 'rule', field === 'status' ? 'स्थिति' : 'नियम', mode)}`;
  }

  // Never fall back to the raw developer address in a reader-facing cell.
  return localizedTerm('Declared chart evidence', 'घोषित कुण्डली प्रमाण', mode);
}

/** Friendly localized name for a raw status enum. */
export function readerStatus(value: string, mode: LabelMode): string {
  const spaced = value.replace(/_/g, ' ');
  const titled = spaced.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  const known = tr(value, mode);
  if (known !== value) return known;
  const knownSpaced = tr(spaced, mode);
  if (knownSpaced !== spaced) return knownSpaced;
  const knownTitled = tr(titled, mode);
  if (knownTitled !== titled) return knownTitled;
  return localizeKnownText(spaced, mode);
}

/** Full label for a known rashi name (Sanskrit or English). */
export function readerSign(value: string, mode: LabelMode): string {
  const sign = SIGN_TERMS.find((s) => s.sanskrit === value || s.en === value || s.hi === value);
  return sign ? signLabelV40(SIGN_TERMS.indexOf(sign) + 1, mode) : localizeKnownText(value, mode);
}

/** Full label for a known nakshatra name. */
export function readerNakshatra(value: string, mode: LabelMode): string {
  return nakshatraLabel(value, mode);
}

/** Full label for a known graha. */
export function readerPlanet(value: string, mode: LabelMode): string {
  return PLANET_TERMS[value] ? planetLabel(value, mode) : localizeKnownText(value, mode);
}

/** Full label for a dignity enum or phrase. */
export function readerDignity(value: string, mode: LabelMode): string {
  if (DIGNITY_TERMS[value]) return dignityLabel(value, mode);
  return localizeKnownText(value, mode);
}

/** Local clock notation without English AM/PM in a pure Hindi edition. */
export function readerClock(value: string, mode: LabelMode): string {
  if (mode === 'en') return value;
  const hindi = value
    .replace(/\bAM\b/g, 'पूर्वाह्न')
    .replace(/\bPM\b/g, 'अपराह्न');
  return mode === 'hi' ? readerNumber(hindi, mode) : `${readerNumber(hindi, mode)} / ${value}`;
}

/** Compact Vimshottari balance, e.g. `५ वर्ष ० मास ४ दिन` in Hindi. */
export function readerYmd(value: string, mode: LabelMode): string {
  if (mode === 'en') return value;
  const match = /^(\d+)y\s*(\d+)m\s*(\d+)d$/.exec(value.trim());
  if (!match) return readerNumber(value, mode);
  const hindi = `${readerNumber(match[1], 'hi')} वर्ष ${readerNumber(match[2], 'hi')} मास ${readerNumber(match[3], 'hi')} दिन`;
  return mode === 'hi' ? hindi : `${hindi} / ${value}`;
}

/** Civil/dasha dates preserve their ISO shape while honoring pure-Hindi digits. */
export function readerDateValue(value: string, mode: LabelMode): string {
  return readerNumber(value, mode);
}

/** Samvat is data, but its era names need not remain untranslated. */
export function readerSamvat(value: string, mode: LabelMode): string {
  if (mode === 'en') return value;
  const hindi = readerNumber(value, 'hi')
    .replace(/\bVikram\b/g, 'विक्रम')
    .replace(/\bShaka\b/g, 'शक');
  return mode === 'hi' ? hindi : `${hindi} / ${value}`;
}

/** Render an implementation ephemeris identifier as reader-facing method copy. */
export function readerEphemeris(value: string, mode: LabelMode): string {
  if (mode === 'en') return value;
  const normalized = value.replace(/_/g, ' ').toLowerCase();
  if (normalized === 'astronomy engine vsop87 elp2000') {
    const hindi = `खगोलीय गणक वीएसओपी${readerNumber('87', 'hi')} / ईएलपी${readerNumber('2000', 'hi')}`;
    return mode === 'hi' ? hindi : `${hindi} / ${value}`;
  }
  return localizeKnownText(value, mode);
}

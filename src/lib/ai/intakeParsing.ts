/**
 * SEEKER INPUT PARSERS (सहज इनपुट समझने वाला इंजन)
 * ------------------------------------------------------------------
 * Devotees type naturally: "2.20" for a birth time, "bilaspur ,cg" for a
 * birth place, "15 aug 1996" for a birth date — often with Devanagari
 * digits. These parsers normalise such input into canonical values so the
 * chatbot never stores garbage, and they always round-trip through a
 * human-readable label so the UI can ask "क्या यह सही है?" (re-confirm).
 *
 *  parseBirthTime('2.20')        → { ok: true, time24: '02:20', label: 'सुबह 2:20 AM' }
 *  parseBirthTime('shaam 7 baje') → { ok: true, time24: '19:00', label: 'शाम 7:00 PM' }
 *  parseBirthDate('15 aug 1996') → { ok: true, iso: '1996-08-15', labelHi/labelEn }
 *  resolveBirthCity('bilaspur cg') → exact Bilaspur, Chhattisgarh (lat/lng/tz)
 */

import { CITIES } from '../cities';

// ---------------------------------------------------------------------------
// DIGIT NORMALISATION (०-९ / ٠-٩ → 0-9)
// ---------------------------------------------------------------------------

const DEVANAGARI_DIGITS = '०१२३४५६७८९';
const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(text: string): string {
  return String(text || '')
    .replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

function toDevanagariDigits(text: string): string {
  return String(text).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[parseInt(d, 10)]);
}

// ---------------------------------------------------------------------------
// BIRTH TIME
// ---------------------------------------------------------------------------

export interface ParsedBirthTime {
  ok: boolean;
  time24?: string; // 'HH:MM' or 'HH:MM:SS', preserving supplied seconds
  label?: string; // human readable, e.g. 'दोपहर 2:20 PM'
  labelEn?: string;
}

const DAYPARTS: Array<{ re: RegExp; shift: 'am' | 'pm' | 'noon' | 'night'; hi: string }> = [
  { re: /(subah|subaah|saver|pratah|prataha?|suprabhat|morning|सुबह|सुबह|प्रातः|प्रात|सवेरे)/i, shift: 'am', hi: 'सुबह' },
  { re: /(dopahar|dopehar|dopehr|madhyahn|noon|afternoon|दोपहर|मध्याह्न)/i, shift: 'noon', hi: 'दोपहर' },
  { re: /(shaam|sham|sanjh|sandhya|saanjh|evening|सायं|सांय|शाम|संध्या)/i, shift: 'pm', hi: 'शाम' },
  { re: /(raat|rat|ratri|raatri|night|रात|रात्रि)/i, shift: 'night', hi: 'रात' },
];

export function parseBirthTime(raw: string): ParsedBirthTime {
  if (!raw) return { ok: false };
  let t = normalizeDigits(raw).toLowerCase().trim();

  // Detect day-part tokens & meridiem
  let meridiem: 'am' | 'pm' | null = null;
  if (/\bp\.?\s?m\.?\b|पी\s?एम/i.test(t)) meridiem = 'pm';
  else if (/\ba\.?\s?m\.?\b|ए\s?एम/i.test(t)) meridiem = 'am';

  let daypart: (typeof DAYPARTS)[number] | null = null;
  for (const dp of DAYPARTS) {
    if (dp.re.test(t)) { daypart = dp; break; }
  }

  // Strip filler words: "baje", "बजे", "o'clock", daypart words, am/pm
  t = t
    .replace(/(bajkar|baaje|baje?|baji?e?|बजे|o'?clock)/gi, ' ')
    .replace(/\b[pa]\.?\s?m\b\.?/gi, ' ')
    .replace(/\b(subaah|subah|saver|prataha?|pratah|suprabhat|morning|dopahar|dopehar|dopehr|madhyahn|afternoon|noon|shaam|sham|sanjh|sandhya|saanjh|evening|raatri|ratri|raat|rat|night|at)\b/gi, ' ')
    .replace(/[ऀ-ॿ\s]+/g, ' ') // leftover Devanagari words
    .replace(/[()]/g, ' ')
    .trim();

  // Numeric forms: "2.20", "2:20", "2 20", "2,20", "2-20", "730", "14:45", "7"
  let hh = NaN;
  let mm = 0;
  let ss: number | undefined;
  let m: RegExpMatchArray | null;

  if ((m = t.match(/^(\d{1,2}):([0-5]\d):([0-5]\d)$/))) {
    hh = Number(m[1]); mm = Number(m[2]); ss = Number(m[3]);
  } else if ((m = t.match(/^(\d{1,2})(?:\s*[:.,\-]\s*|\s+)(\d{1,2})$/))) {
    hh = parseInt(m[1], 10);
    mm = parseInt(m[2], 10);
  } else if ((m = t.match(/^(\d{3,4})$/))) {
    // "730" → 7:30, "1430" → 14:30 (only when minutes are sensible)
    const s = m[1];
    const h = parseInt(s.slice(0, s.length - 2), 10);
    const mi = parseInt(s.slice(-2), 10);
    if (h <= 24 && mi <= 59) { hh = h; mm = mi; }
  } else if ((m = t.match(/^(\d{1,2})\s*बजे?$/)) || (m = t.match(/^(\d{1,2})$/))) {
    hh = parseInt(m[1], 10);
    mm = 0;
  }

  if (isNaN(hh) || hh > 23 || mm > 59) return { ok: false };
  if (meridiem && (hh < 1 || hh > 12)) return { ok: false };

  // Apply meridiem; if only a Hindi day-part was given, derive meridiem from it
  if (!meridiem && daypart) {
    if (daypart.shift === 'am') meridiem = 'am';
    else if (daypart.shift === 'noon' || daypart.shift === 'pm') meridiem = 'pm';
    else meridiem = hh < 6 || hh === 12 ? 'am' : 'pm'; // रात 2 = 02:00, रात 10 = 22:00
  }

  if (meridiem && hh <= 12) {
    if (meridiem === 'pm' && hh < 12) hh += 12;
    if (meridiem === 'am' && hh === 12) hh = 0;
  }

  const hh24 = String(hh).padStart(2, '0');
  const mm2 = String(mm).padStart(2, '0');
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const meridiemEn = hh < 12 ? 'AM' : 'PM';

  // A friendly Hindi time-of-day word for the label
  const dayHi =
    hh < 4 ? 'रात्रि' :
    hh < 12 ? 'सुबह' :
    hh < 16 ? 'दोपहर' :
    hh < 20 ? 'शाम' :
    'रात्रि';

  return {
    ok: true,
    time24: `${hh24}:${mm2}${ss === undefined ? '' : ':' + String(ss).padStart(2, '0')}`,
    label: `${dayHi} ${h12}:${mm2}${ss === undefined ? '' : ':' + String(ss).padStart(2, '0')} ${meridiemEn}`,
    labelEn: `${h12}:${mm2}${ss === undefined ? '' : ':' + String(ss).padStart(2, '0')} ${meridiemEn}`,
  };
}

// ---------------------------------------------------------------------------
// BIRTH DATE
// ---------------------------------------------------------------------------

export interface ParsedBirthDate {
  ok: boolean;
  iso?: string; // 'YYYY-MM-DD'
  labelHi?: string; // '१५ अगस्त १९९६'
  labelEn?: string; // '15 August 1996'
}

const HINDI_MONTHS = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_TOKENS: Array<{ re: RegExp; month: number }> = [
  { re: /jan|जनवरी/i, month: 1 },
  { re: /feb|फरवरी|फ़रवरी/i, month: 2 },
  { re: /mar|मार्च/i, month: 3 },
  { re: /apr|अप्रैल/i, month: 4 },
  { re: /may|मई|मई$/i, month: 5 },
  { re: /jun|जून/i, month: 6 },
  { re: /jul|जुलाई/i, month: 7 },
  { re: /aug|अगस्त/i, month: 8 },
  { re: /sep|सितंबर|सितम्बर/i, month: 9 },
  { re: /oct|अक्टूबर|अक्तूबर/i, month: 10 },
  { re: /nov|नवंबर|नवम्बर/i, month: 11 },
  { re: /dec|दिसंबर|दिसम्बर/i, month: 12 },
];

function isRealDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const cur = new Date().getFullYear();
  if (y < 1900 || y > cur) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getTime() > Date.now()) return false;
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function parseBirthDate(raw: string): ParsedBirthDate {
  if (!raw) return { ok: false };
  const t = normalizeDigits(raw).toLowerCase().trim();

  let y = NaN; let mo = NaN; let d = NaN;
  let m: RegExpMatchArray | null;

  if ((m = t.match(/(\d{4})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{1,2})/))) {
    // ISO-first: 1996-08-15
    y = parseInt(m[1], 10); mo = parseInt(m[2], 10); d = parseInt(m[3], 10);
  } else if ((m = t.match(/(\d{1,2})\s*[-\/.]\s*(\d{1,2})\s*[-\/.]\s*(\d{4})/))) {
    // Indian convention: 15/08/1996 or 15.08.1996
    d = parseInt(m[1], 10); mo = parseInt(m[2], 10); y = parseInt(m[3], 10);
  } else if ((m = t.match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/))) {
    // Named month: 15 aug 1996 / 15 अगस्त १९९६
    d = parseInt(m[1], 10); y = parseInt(m[3], 10);
    for (const tok of MONTH_TOKENS) {
      if (tok.re.test(m[2])) { mo = tok.month; break; }
    }
  } else if ((m = t.match(/([^\s\d]+)\s+(\d{1,2})[\s,]+(\d{4})/))) {
    // August 15, 1996
    d = parseInt(m[2], 10); y = parseInt(m[3], 10);
    for (const tok of MONTH_TOKENS) {
      if (tok.re.test(m[1])) { mo = tok.month; break; }
    }
  }

  if (!isRealDate(y, mo, d)) return { ok: false };

  const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return {
    ok: true,
    iso,
    labelHi: `${toDevanagariDigits(String(d))} ${HINDI_MONTHS[mo - 1]} ${toDevanagariDigits(String(y))}`,
    labelEn: `${d} ${EN_MONTHS[mo - 1]} ${y}`,
  };
}

// ---------------------------------------------------------------------------
// BIRTH CITY
// ---------------------------------------------------------------------------

export interface CityChoice {
  id: string;
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  tz: number;
  nameHi?: string;
}

export interface CityResolution {
  status: 'exact' | 'choices' | 'none';
  primary?: CityChoice;
  choices: CityChoice[];
}

/** Common state abbreviations & spellings → canonical state names in CITIES. */
const STATE_ALIASES: Record<string, string> = {
  'बिहार': 'bihar', 'छत्तीसगढ़': 'chhattisgarh', 'छत्तीसगढ़': 'chhattisgarh',
  'महाराष्ट्र': 'maharashtra', 'गुजरात': 'gujarat', 'राजस्थान': 'rajasthan',
  'उत्तर प्रदेश': 'uttar pradesh', 'मध्य प्रदेश': 'madhya pradesh',
  cg: 'chhattisgarh', 'c.g': 'chhattisgarh', chattisgarh: 'chhattisgarh', chhatisgarh: 'chhattisgarh',
  up: 'uttar pradesh', 'u.p': 'uttar pradesh',
  mp: 'madhya pradesh', 'm.p': 'madhya pradesh',
  uk: 'uttarakhand', 'u.k': 'uttarakhand', uttaranchal: 'uttarakhand',
  wb: 'west bengal', 'w.b': 'west bengal', bengal: 'west bengal',
  tn: 'tamil nadu', 't.n': 'tamil nadu', tamilnadu: 'tamil nadu',
  ap: 'andhra pradesh', 'a.p': 'andhra pradesh',
  ts: 'telangana',
  jk: 'jammu and kashmir', 'j&k': 'jammu and kashmir',
  hp: 'himachal pradesh', 'h.p': 'himachal pradesh',
  rj: 'rajasthan', gj: 'gujarat', mh: 'maharashtra', ka: 'karnataka',
  kl: 'kerala', pb: 'punjab', hr: 'haryana', br: 'bihar', od: 'odisha',
  orissa: 'odisha', jh: 'jharkhand', as: 'assam', tr: 'tripura',
  ga: 'goa', dl: 'delhi',
};

/** Well-known historical/alternate city names → canonical names in CITIES. */
const CITY_ALIASES: Record<string, string> = {
  banaras: 'varanasi', benaras: 'varanasi', kashi: 'varanasi', benares: 'varanasi',
  bombay: 'mumbai', calcutta: 'kolkata', madras: 'chennai', bangalore: 'bengaluru',
  mysore: 'mysuru', gurgaon: 'gurugram', allahabad: 'prayagraj', poona: 'pune',
  pondicherry: 'puducherry', trivandrum: 'thiruvananthapuram', cochin: 'kochi',
  coimbatore: 'coimbatore', baroda: 'vadodara', simla: 'shimla', nainital: 'nainital',
  // Devanagari spellings (nameHi covers canonical names; these cover aliases)
  'बनारस': 'varanasi', 'काशी': 'varanasi', 'कासी': 'varanasi',
  'बम्बई': 'mumbai', 'मुम्बई': 'mumbai', 'मुंबई': 'mumbai', 'कलकत्ता': 'kolkata', 'मद्रास': 'chennai',
  'बैंगलोर': 'bengaluru', 'गुड़गांव': 'gurugram', 'इलाहाबाद': 'prayagraj',
  'एलाहाबाद': 'prayagraj', 'पूना': 'pune', 'शिमला': 'shimla', 'त्रिवेन्द्रम': 'thiruvananthapuram',
};

export function resolveBirthCity(raw: string): CityResolution {
  const empty: CityResolution = { status: 'none', choices: [] };
  if (!raw || !raw.trim()) return empty;

  // Normalise: Devanagari digits, lowercase, strip punctuation noise
  let q = normalizeDigits(raw).toLowerCase().trim();
  q = q.replace(/\b([a-z])\.([a-z])\.?/g, '$1$2')
    .replace(/[,;|]+/g, ' ').replace(/\./g, ' ').replace(/\s+/g, ' ').trim();

  // Expand aliases token-by-token ("bilaspur cg" → "bilaspur chhattisgarh")
  const aliasValues = Object.values(STATE_ALIASES);
  let cityQuery = q;
  const stateTokens: string[] = [];
  const stateNames = [...new Set([...Object.keys(STATE_ALIASES), ...CITIES.map(c => c.state.toLowerCase())])]
    .sort((a, b) => b.length - a.length);
  for (const stateName of stateNames) {
    if (cityQuery.endsWith(' ' + stateName)) {
      stateTokens.push(STATE_ALIASES[stateName] || stateName);
      cityQuery = cityQuery.slice(0, -stateName.length).trim();
      break;
    }
  }
  const cityTokens = cityQuery.split(' ').filter(Boolean).map(tok => CITY_ALIASES[tok] || tok);
  const expanded = cityTokens.join(' ');
  const rawHi = cityQuery;

  const scored: Array<{ city: (typeof CITIES)[number]; score: number }> = [];
  for (const city of CITIES) {
    const name = city.name.toLowerCase();
    const hi = (city.nameHi || '').toLowerCase();
    const state = city.state.toLowerCase();
    if (stateTokens.length && !stateTokens.includes(state)) continue;
    let score = -1;

    if (expanded === name || expanded === `${name} ${state}`) score = 120;
    else if (hi && rawHi === hi) score = 115;
    else {
      // City token must appear; an explicit state token refines/excludes.
      const cityHit = cityTokens.some(
        (tok) => name === tok || (tok.length >= 3 && name.startsWith(tok)) || (tok.length >= 4 && name.includes(tok))
      );
      const hiHit = hi !== '' && rawHi.length >= 2 && hi.includes(rawHi);
      if (cityHit || hiHit) {
        score = cityTokens[0] === name ? 100 : name.startsWith(cityTokens[0] || '~~~') ? 80 : 55;
        // A solid Devanagari match inside the official Hindi name is certain
        // enough to auto-resolve ('वाराणसी' ⊂ 'काशी (वाराणसी धाम)').
        if (hiHit && rawHi.length >= 3) score += 45;
        if (stateTokens.length > 0) {
          if (stateTokens.some((tok) => state.includes(tok))) score += 40;
          else continue; // explicit state given but mismatched — exclude
        }
        if ((city as { isPopular?: boolean }).isPopular) score += 6;
      }
    }
    if (score >= 0) scored.push({ city, score });
  }

  if (scored.length === 0) return empty;

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const choices = scored.slice(0, 4).map((s) => s.city as CityChoice);

  // High-confidence single answer → 'exact'; otherwise let the user choose.
  const secondScore = scored[1]?.score ?? -1;
  if (top.score >= 100 && top.score - secondScore >= 20) {
    return { status: 'exact', primary: top.city as CityChoice, choices: [top.city as CityChoice] };
  }
  return { status: 'choices', choices };
}

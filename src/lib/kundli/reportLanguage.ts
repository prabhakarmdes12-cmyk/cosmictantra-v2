/**
 * PREDICTIVE LANGUAGE SCANNER
 *
 * A Jyotish report may state what was calculated and may repeat what a
 * tradition says about it. It may not state that an event will occur. The
 * difference is one careless sentence, and it is the sentence a reader will
 * remember and act on.
 *
 * This scanner runs over a whole report — not only the Scholar Summary — and
 * is wired into the delivery gate as check CG_REPORT_PREDICTIVE_LANGUAGE. A
 * report that trips it is not delivered.
 *
 * Two kinds of finding:
 *
 *   MODAL   — a construction that asserts certainty. "will happen",
 *             "definitely", "guaranteed", "you will". Never acceptable
 *             anywhere, in any section, for any reason.
 *
 *   TOPICAL — a named life event used as though it were an outcome: death,
 *             marriage, disease, litigation, wealth. Banned unless the
 *             sentence is a disclosure about what the report does NOT do.
 *
 * Disclosure is not prediction. A sentence that says "no prediction of death
 * or marriage is made anywhere in this report" is the opposite of a
 * prediction, and the scanner steps over sentences that carry a negation
 * marker before applying the topical ban.
 */

export type LanguageFindingKind = 'MODAL' | 'TOPICAL';

export interface LanguageFinding {
  kind: LanguageFindingKind;
  /** The construction that was matched. */
  phrase: string;
  /** The sentence it appeared in, trimmed for the log. */
  sentence: string;
}

/** Constructions that assert certainty. Never permitted. */
const MODAL_BANS: RegExp[] = [
  /\bwill\s+(?:happen|occur|take\s+place|definitely|certainly)\b/i,
  /\b(?:is|are)\s+(?:certain|sure|guaranteed)\s+to\b/i,
  /\byou\s+will\b/i,
  /\b(?:definitely|undoubtedly|assuredly)\b/i,
  /\b(?:guaranteed|guarantee)\b/i,
  /\b(?:promise|promised)\s+(?:that|you)\b/i,
  /\b(?:will|shall)\s+(?:definitely|certainly)\b/i,
  /\bfated\s+to\b/i,
  /\bdestined\s+to\b/i,
];

/**
 * Named life events. These are banned as predictions, not as subjects: a
 * report may discuss what a tradition says about the 7th house, but it may
 * not say when someone marries.
 */
const TOPICAL_BANS: RegExp[] = [
  /\b(?:death|die[sd]?|dying|decease[sd]?)\b/i,
  /\b(?:marriage|marry|married|wedding|divorce[sd]?)\b/i,
  /\b(?:disease|illness|sickness|cancer|tumou?r|surgery|operation|hospitali[sz]\w*)\b/i,
  /\b(?:accident|injury|injured|fatal)\b/i,
  /\b(?:litigation|lawsuit|sued|court\s+case|legal\s+trouble|imprison\w*|jail)\b/i,
  /\b(?:bankrupt\w*|insolven\w*)\b/i,
  /\b(?:wealthy|become\s+rich|windfall|lottery|jackpot)\b/i,
  /\b(?:childbirth|pregnan\w+|conceive|conception|infertil\w+)\b/i,
];

/** Sentences carrying one of these are disclosures, not predictions. */
const NEGATION_MARKERS =
  /\b(?:no\s+prediction|not\s+predict\w*|does\s+not\s+predict|never\s+predict\w*|is\s+not\s+a\s+prediction|are\s+not\s+predictions|without\s+predicting|makes?\s+no\s+claim|not\s+a\s+guarantee|no\s+guarantee|not\s+a\s+certainty|not\s+a\s+forecast)\b/i;

/**
 * A date or year in the same sentence as a disclaimer means the sentence is
 * doing more than disclaiming. Without this guard, "it is not a guarantee,
 * but your marriage is in 2029" would be read as a disclosure and let
 * through.
 */
const DATE_REFERENCE =
  /\b(?:19|20)\d{2}\b|\b(?:next|this|coming|following)\s+(?:year|month|week|decade)\b/i;

/**
 * Remove zodiac-sign usages before scanning. "Karka (Cancer)" is a sign, not
 * a diagnosis; the scanner must not fire on it, and it must still fire on the
 * word cancer used as a disease.
 */
const SIGN_NAMES = [
  'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)',
  'Simha (Leo)', 'Kanya (Virgo)', 'Tula (Libra)', 'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)',
];

const ENGLISH_SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** 'Cancer (exaltation)', 'Leo (own sign)' — a sign, not a diagnosis. */
const SIGN_WITH_QUALITY = new RegExp(
  '\\b(?:' + ENGLISH_SIGN_NAMES.join('|') + ')\\s*\\((?:exaltation|own sign|debilitation|moolatrikona)\\)',
  'gi',
);

/**
 * A bare capitalised sign name: the 'Cancer' in a table's Sign column.
 *
 * Deliberately case-sensitive. The zodiac sign is written capitalised; the
 * disease is written lowercase ('risk of cancer'). Matching only the
 * capitalised form keeps the sign and still catches the disease.
 *
 * The limitation is real and stated: a sentence that opens with the word
 * Cancer as a diagnosis would be read as a sign. That is accepted, because
 * the alternative — ignoring the word entirely — would blind the scanner to
 * the thing it exists to catch.
 */
const SIGN_NAME_CAPITALISED = new RegExp(
  '\\b(?:' + ENGLISH_SIGN_NAMES.join('|') + ')\\b',
  'g',
);

function neutraliseSignNames(text: string): string {
  let out = text;
  for (const sign of SIGN_NAMES) out = out.split(sign).join('ZODIACSIGN');
  out = out.replace(SIGN_WITH_QUALITY, 'ZODIACSIGN');
  out = out.replace(SIGN_NAME_CAPITALISED, 'ZODIACSIGN');
  return out;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Scan report text. Returns every finding, so logs can show all of them. */
export function scanPredictiveLanguage(text: string): LanguageFinding[] {
  const findings: LanguageFinding[] = [];
  const cleaned = neutraliseSignNames(text);

  for (const sentence of sentences(cleaned)) {
    // A sentence that disclaims is a disclosure, not a prediction — "it is
    // not a guarantee" must not be read as "guarantee". Unless it also names
    // a date, in which case it is doing more than disclaiming.
    if (NEGATION_MARKERS.test(sentence) && !DATE_REFERENCE.test(sentence)) continue;

    for (const pattern of MODAL_BANS) {
      const m = pattern.exec(sentence);
      if (m) findings.push({ kind: 'MODAL', phrase: m[0], sentence: sentence.slice(0, 240) });
    }
    for (const pattern of TOPICAL_BANS) {
      const m = pattern.exec(sentence);
      if (m) findings.push({ kind: 'TOPICAL', phrase: m[0], sentence: sentence.slice(0, 240) });
    }
  }
  return findings;
}

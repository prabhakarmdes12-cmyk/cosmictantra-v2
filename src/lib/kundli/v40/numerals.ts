/**
 * KUNDLI V41 §4 — numeral policy.
 *
 * A chart must never show `१ २ ३ ... ९ 10 11 12`. That is what the code did
 * before V41, and not because anyone decided it: `signLabel` indexed a
 * ten-element Devanagari digit array by the sign number, so 1–9 converted and
 * 10–12 fell through to `String(n)`. The mixing was an off-by-array-length,
 * and it appeared on the two most-looked-at pages in the document.
 *
 * The fix is a policy, not a longer array, because "which numerals" is a real
 * editorial decision and it differs by edition:
 *
 *   hi      pure Hindi   — Devanagari throughout. A Hindi reader expects १२.
 *   hi-en   bilingual    — Western. The page already carries English terms;
 *                          Devanagari digits beside them read as decoration,
 *                          and a Pandit cross-checking against software or a
 *                          panchang is reading Western digits there anyway.
 *   en      English      — Western.
 *
 * Scope: display numerals only. Nothing here touches a computed value. Dates,
 * coordinates, hashes, report IDs and everything in the Scholar Appendix stay
 * Western in every mode — an identifier that changes script is not the same
 * identifier, and a Pandit reading `२५.५९४१°` back to a colleague over the
 * phone has gained nothing.
 */

export const NUMERAL_POLICY_VERSION = 'kundli-numerals-v1';

export type NumeralLocale = 'en' | 'hi' | 'hi-en';

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'] as const;
const ASCII_DIGIT = /[0-9]/g;
const DEVANAGARI_DIGIT = /[०-९]/g;

export interface NumeralPolicy {
  /** When true, user-visible counting numerals are drawn in Devanagari. */
  devanagariNumerals: boolean;
}

/**
 * The policy for a locale.
 *
 * `hi` is the only locale that gets Devanagari numerals. This is the whole of
 * §4: one switch, decided once, applied everywhere, so the two scripts can
 * never meet inside a single chart.
 */
export function numeralPolicyFor(locale: NumeralLocale): NumeralPolicy {
  return { devanagariNumerals: locale === 'hi' };
}

/** Converts every ASCII digit in `s` to Devanagari. Multi-digit safe. */
export function toDevanagariDigits(s: string): string {
  return s.replace(ASCII_DIGIT, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

/** Converts every Devanagari digit in `s` to ASCII. */
export function toAsciiDigits(s: string): string {
  return s.replace(DEVANAGARI_DIGIT, (d) => String(DEVANAGARI_DIGITS.indexOf(d as typeof DEVANAGARI_DIGITS[number])));
}

/**
 * Renders a display numeral under a policy.
 *
 * Use for counting numbers a reader is meant to read as numbers: sign numbers,
 * house numbers, nakshatra pada, dasha years. Not for identifiers.
 */
export function numeral(value: number | string, policy: NumeralPolicy): string {
  const s = String(value);
  return policy.devanagariNumerals ? toDevanagariDigits(s) : toAsciiDigits(s);
}

/**
 * Normalises a whole display string so it cannot contain both scripts.
 *
 * The safety net rather than the mechanism: individual call sites should use
 * `numeral()`, but any string that reaches the page having been assembled from
 * several sources gets forced to one script here.
 */
export function enforceNumeralPolicy(s: string, policy: NumeralPolicy): string {
  return policy.devanagariNumerals ? toDevanagariDigits(s) : toAsciiDigits(s);
}

/**
 * Detects a violation: both numeral scripts in one string.
 *
 * Used by the §4 gate. Returns the offending characters so a failure names
 * what it found rather than only that something is wrong.
 */
export function findMixedNumerals(s: string): { ascii: string[]; devanagari: string[] } | null {
  const ascii = s.match(ASCII_DIGIT) ?? [];
  const deva = s.match(DEVANAGARI_DIGIT) ?? [];
  if (ascii.length === 0 || deva.length === 0) return null;
  return { ascii: [...new Set(ascii)], devanagari: [...new Set(deva)] };
}

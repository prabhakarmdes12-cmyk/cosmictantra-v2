/**
 * Paksha "hero mood" resolution for the Vedic calendar hero banner.
 *
 * The deterministic panchang engine (`src/lib/panchang.js`) reports tithi as
 * an object shaped `{ number, name, paksha, fullName }` where `name` is the
 * bare tithi ("Dwadashi") and `paksha` / `fullName` carry the lunar fortnight
 * ("Krishna Paksha" / "Krishna Paksha Dwadashi").  Some legacy consumers pass
 * a plain string ("Krishna Dwadashi").
 *
 * Theme decisions must never rely on `name` alone — a bare "Dwadashi" is
 * ambiguous and would silently paint every day with the Shukla (marigold)
 * mood.  Resolve the mood from `paksha` first, then `fullName`, and only then
 * fall back to scanning the rendered string for a Devanagari/English marker.
 */

export interface TithiLike {
  /** Bare tithi name, e.g. "Dwadashi" (no paksha). */
  name?: string;
  /** e.g. "Krishna Paksha Dwadashi" or "कृष्ण पक्ष द्वादशी". */
  fullName?: string;
  /** e.g. "Krishna Paksha" | "Shukla Paksha". */
  paksha?: string;
  [key: string]: unknown;
}

export interface PakshaMood {
  /** True only when the day belongs to Krishna Paksha (waning moon). */
  isKrishna: boolean;
  /** True only when the day belongs to Shukla Paksha (waxing moon). */
  isShukla: boolean;
}

const KRISHNA_PAKSHA_RE = /krishna|कृष्ण/i;
const SHUKLA_PAKSHA_RE = /shukla|शुक्ल/i;

function isKrishnaPakshaText(text: string): boolean {
  return KRISHNA_PAKSHA_RE.test(text);
}

function isShuklaPakshaText(text: string): boolean {
  return SHUKLA_PAKSHA_RE.test(text);
}

/**
 * Prefer the fully-qualified display name ("Krishna Paksha Dwadashi") when the
 * engine provides it, so the UI never shows an ambiguous bare tithi.
 */
export function resolveTithiDisplayName(tithi: TithiLike | string | null | undefined): string {
  if (!tithi) return '';
  if (typeof tithi === 'string') return tithi;
  return tithi.fullName || tithi.name || '';
}

/**
 * Deterministic Krishna-vs-Shukla mood resolution.
 *
 * Resolution order (first match wins):
 *   1. structured `paksha` field on the tithi object;
 *   2. `fullName` field (English or Devanagari);
 *   3. a plain string argument scanned for English/Devanagari markers.
 *
 * When the input carries neither a paksha field nor any paksha marker the
 * result is `{ isKrishna: false, isShukla: false }` — callers must not
 * fabricate a paksha claim for unknown input.
 */
export function resolvePakshaMood(tithi: TithiLike | string | null | undefined): PakshaMood {
  if (!tithi) return { isKrishna: false, isShukla: false };

  if (typeof tithi !== 'string') {
    const paksha = (tithi.paksha || '').trim().toLowerCase();
    if (paksha === 'krishna paksha') return { isKrishna: true, isShukla: false };
    if (paksha === 'shukla paksha') return { isKrishna: false, isShukla: true };

    const fullName = resolveTithiDisplayName(tithi);
    if (fullName) {
      if (isKrishnaPakshaText(fullName)) return { isKrishna: true, isShukla: false };
      if (isShuklaPakshaText(fullName)) return { isKrishna: false, isShukla: true };
    }
    // Neither a paksha field nor a qualified name — do not guess.
    return { isKrishna: false, isShukla: false };
  }

  // Legacy plain-string consumers.
  if (isKrishnaPakshaText(tithi)) return { isKrishna: true, isShukla: false };
  if (isShuklaPakshaText(tithi)) return { isKrishna: false, isShukla: true };
  return { isKrishna: false, isShukla: false };
}

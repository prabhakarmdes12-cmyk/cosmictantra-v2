/**
 * Devanagari numeral conversion (shared).
 *
 * The calendar UI renders numbers (dates, samvat, week counts) in Devanagari
 * digits alongside the Latin forms. This util is the single converter for new
 * surfaces; existing components keep their local copies until refactored.
 */

export const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toHindiDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => HINDI_DIGITS[parseInt(d, 10)]);
}

/** Ordinal-friendly Hindi word for small day counts ("आज", "कल", "३ दिन में"). */
export function hindiCountdown(days: number): string {
  if (days <= 0) return 'आज';
  if (days === 1) return 'कल';
  return `${toHindiDigits(days)} दिन में`;
}

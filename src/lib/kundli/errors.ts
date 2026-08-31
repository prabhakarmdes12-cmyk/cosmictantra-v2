/**
 * Kundli pipeline — typed errors.
 *
 * Every failure in the pipeline is a KundliError carrying a stable machine
 * code plus structured details. The client maps codes to safe user-facing
 * messages; codes are NEVER shown to the end user as the primary message
 * and stack traces never reach the user.
 */

export type KundliErrorCode =
  | 'KUNDLI_INPUT_INVALID'
  | 'KUNDLI_LOCATION_UNRESOLVED'
  | 'KUNDLI_COORDINATES_INVALID'
  | 'KUNDLI_FALLBACK_NOT_APPROVED'
  | 'KUNDLI_TIMEZONE_INVALID'
  | 'KUNDLI_CALCULATION_INCOMPLETE'
  | 'KUNDLI_DASHA_INCOMPLETE'
  | 'KUNDLI_REPORT_INCOMPLETE'
  | 'KUNDLI_INTERPRETATION_INCOMPLETE'
  | 'KUNDLI_PDF_RENDER_FAILED'
  | 'KUNDLI_PAGINATION_STALLED'
  | 'KUNDLI_PAGE_LIMIT_EXCEEDED'
  | 'KUNDLI_PDF_QUALITY_FAILED';

export class KundliError extends Error {
  readonly code: KundliErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: KundliErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'KundliError';
    this.code = code;
    this.details = details;
  }
}

/** Safe, human-readable messages (no internals). Keyed by stable code. */
export const KUNDLI_SAFE_MESSAGES: Record<KundliErrorCode, string> = {
  KUNDLI_LOCATION_UNRESOLVED:
    'We could not identify the birth place. Please enter the city of birth or its exact coordinates and try again.',
  KUNDLI_INPUT_INVALID:
    'We could not complete this Kundli because some birth details are missing or not in the expected format. Please verify the date, time, and place of birth and try again.',
  KUNDLI_COORDINATES_INVALID:
    'The birth coordinates could not be validated. Please check the latitude and longitude of the birth place and try again.',
  KUNDLI_FALLBACK_NOT_APPROVED:
    'The birth place could not be located precisely, and approximate coordinates were not approved for this report. Please enter the exact latitude and longitude of the birth place.',
  KUNDLI_TIMEZONE_INVALID:
    'We could not determine a valid timezone for the birth place. Please select the correct timezone and try again.',
  KUNDLI_CALCULATION_INCOMPLETE:
    'The astronomical calculation did not complete for every required value. Please verify the birth details and try again.',
  KUNDLI_DASHA_INCOMPLETE:
    'The dasha calculation could not be completed for the full timeline. Please verify the birth details and try again.',
  KUNDLI_REPORT_INCOMPLETE:
    'The report could not be assembled because a required section is missing. Please verify the birth details and try again.',
  KUNDLI_INTERPRETATION_INCOMPLETE:
    'Interpretations could not be generated for a required part of the chart. Please verify the birth details and try again.',
  KUNDLI_PDF_RENDER_FAILED:
    'The PDF document could not be rendered. Please try again.',
  KUNDLI_PAGINATION_STALLED:
    'The PDF layout did not make progress and was stopped to prevent an oversized document. Please try again.',
  KUNDLI_PAGE_LIMIT_EXCEEDED:
    'The PDF exceeded the maximum allowed length and was not delivered. Please try again.',
  KUNDLI_PDF_QUALITY_FAILED:
    'The generated PDF failed quality checks and was not delivered. Please try again.',
};

export function isKundliError(e: unknown): e is KundliError {
  return e instanceof KundliError;
}

export function safeMessageFor(code: string | null | undefined): string {
  if (code && code in KUNDLI_SAFE_MESSAGES) {
    return KUNDLI_SAFE_MESSAGES[code as KundliErrorCode];
  }
  return 'The Kundli could not be generated. Please verify the birth details and try again.';
}

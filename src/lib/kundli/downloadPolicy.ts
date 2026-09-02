/**
 * The public Kundli download policy — one edition, one language source, and an
 * input resolver that never lets a doomed request leave the browser.
 *
 * ── Why this module exists ─────────────────────────────────────────────────
 * "Failed to generate" on `/report` had three causes, and none of them was the
 * renderer:
 *
 *   1. the payload was assembled from a ref that could be stale with respect
 *      to what the visitor was looking at (URL params > localStorage > demo);
 *   2. the payload was missing a field the pipeline's GATE 1 requires, so the
 *      server answered 400/422 and the visitor got an error with nothing to
 *      act on;
 *   3. the toolbar offered two extra controls (an edition pill and a PDF
 *      language pill) that changed that same payload, so a visitor could put
 *      the request into a combination they did not intend.
 *
 * The policy below is the single place those three decisions are made. It is
 * deliberately free of React and of astronomy so it can be unit-tested: the
 * report page imports it, and `tests/kundli-download-reliability.spec.ts`
 * asserts the same functions the button calls.
 *
 * The renderer, the pipeline and the release gates are untouched — this is a
 * client-side contract about WHAT is asked for, never about what is produced.
 */

import type { RawBirthInput, CoordinateProvenance } from './types';

/* ------------------------------------------------------------------ */
/* Edition                                                             */
/* ------------------------------------------------------------------ */

/**
 * The one qualified edition the public download issues: Part A (the
 * consultation folio) plus the complete evidence appendix.
 *
 * Nothing is hidden behind a toggle. CLIENT and PANDIT remain real, tested
 * editions of the API (`/api/kundli/pdf` accepts all three) — they are simply
 * no longer something a visitor has to understand before they can download
 * their own chart.
 */
export const PDF_EDITION = 'SCHOLAR' as const;

export type PdfEdition = typeof PDF_EDITION;

/* ------------------------------------------------------------------ */
/* Language                                                            */
/* ------------------------------------------------------------------ */

export type PdfLocale = 'en' | 'hi' | 'hi-en';

/** The three locales the qualified report is actually authored in. */
export const PDF_LOCALES: PdfLocale[] = ['en', 'hi', 'hi-en'];

/** Sitewide languages whose script the Hindi edition already sets. */
const DEVANAGARI_LANG_CODES = new Set(['hi', 'sa', 'mr']);

/**
 * Maps the sitewide language (owned by the Global Header) onto an authored PDF
 * locale.
 *
 * `hi-en` is a first-class bilingual artifact, never an English fallback: a
 * visitor reading the site in Tamil or Bengali has no edition authored in their
 * own script yet, so they receive Devanagari with English alongside rather than
 * a document that silently ignores their choice.
 */
export function pdfLocaleForLang(code: string | null | undefined): PdfLocale {
  const c = String(code ?? 'en').toLowerCase();
  if (c === 'en') return 'en';
  if (DEVANAGARI_LANG_CODES.has(c)) return 'hi';
  return 'hi-en';
}

/* ------------------------------------------------------------------ */
/* Input resolver                                                      */
/* ------------------------------------------------------------------ */

/** The birth details as the report page displays and edits them. */
export interface DisplayBirthInput {
  name: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  timezone: number;
  locationName: string;
}

/**
 * The fields a qualified PDF cannot be issued without, in the order a person
 * reads a birth record. GATE 1 of the pipeline requires the same set; listing
 * it here means the browser can say WHICH field is missing instead of firing a
 * request that is guaranteed to be refused.
 */
export const REQUIRED_DOWNLOAD_FIELDS = [
  'name',
  'birthDate',
  'birthTime',
  'locationName',
  'latitude',
  'longitude',
] as const;

export type RequiredDownloadField = (typeof REQUIRED_DOWNLOAD_FIELDS)[number];

/** Reader-facing label per required field, in both authored UI languages. */
export const REQUIRED_FIELD_LABELS: Record<RequiredDownloadField, { en: string; hi: string }> = {
  name: { en: 'Name', hi: 'नाम' },
  birthDate: { en: 'Birth date', hi: 'जन्म तिथि' },
  birthTime: { en: 'Birth time', hi: 'जन्म समय' },
  locationName: { en: 'Birth place', hi: 'जन्म स्थान' },
  latitude: { en: 'Latitude', hi: 'अक्षांश' },
  longitude: { en: 'Longitude', hi: 'देशान्तर' },
};

const hasText = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;
const hasNumber = (v: unknown): boolean => typeof v === 'number' && Number.isFinite(v);

/**
 * Builds the download payload from what the visitor currently sees.
 *
 * Fidelity rule: a field the visitor has not supplied stays ABSENT in the
 * payload (`undefined`), never defaulted. Substituting a placeholder here is
 * exactly how a wrong chart gets issued under somebody's real name — the
 * pipeline must be able to see the gap and refuse.
 */
export function rawFromDisplay(
  display: DisplayBirthInput,
  provenance: CoordinateProvenance | null | undefined,
): RawBirthInput {
  const coordsPresent = hasNumber(display.latitude) && hasNumber(display.longitude);
  const resolvedProvenance: CoordinateProvenance | undefined = coordsPresent
    ? (provenance ?? 'MANUAL')
    : undefined;

  return {
    ...(hasText(display.name) ? { name: display.name.trim() } : {}),
    ...(hasText(display.birthDate) ? { birthDate: display.birthDate.trim() } : {}),
    ...(hasText(display.birthTime) ? { birthTime: display.birthTime.trim() } : {}),
    ...(hasText(display.locationName) ? { locationName: display.locationName.trim() } : {}),
    ...(hasNumber(display.latitude) ? { latitude: display.latitude } : {}),
    ...(hasNumber(display.longitude) ? { longitude: display.longitude } : {}),
    ...(hasNumber(display.timezone) ? { utcOffsetHours: display.timezone } : {}),
    ...(resolvedProvenance ? { coordinateProvenance: resolvedProvenance } : {}),
  };
}

/** Which required fields this payload is missing. Empty means "downloadable". */
export function missingDownloadFields(raw: RawBirthInput | null | undefined): RequiredDownloadField[] {
  if (!raw || typeof raw !== 'object') return [...REQUIRED_DOWNLOAD_FIELDS];
  const missing: RequiredDownloadField[] = [];
  if (!hasText(raw.name)) missing.push('name');
  if (!hasText(raw.birthDate)) missing.push('birthDate');
  if (!hasText(raw.birthTime)) missing.push('birthTime');
  if (!hasText(raw.locationName)) missing.push('locationName');
  if (!hasNumber(raw.latitude)) missing.push('latitude');
  if (!hasNumber(raw.longitude)) missing.push('longitude');
  return missing;
}

export interface ResolvedDownloadInput {
  /** The payload to POST — faithful, never padded with defaults. */
  raw: RawBirthInput;
  /** Required fields the visitor still has to supply. */
  missing: RequiredDownloadField[];
  /** True when the payload can be issued as-is. */
  ready: boolean;
}

/**
 * The single entry point the Download button uses.
 *
 * Resolving and validating happen together so the two can never disagree: the
 * caller either gets a payload it may send, or a list of fields to highlight in
 * the edit modal.
 */
export function resolveDownloadInput(
  display: DisplayBirthInput,
  provenance: CoordinateProvenance | null | undefined,
): ResolvedDownloadInput {
  const raw = rawFromDisplay(display, provenance);
  const missing = missingDownloadFields(raw);
  return { raw, missing, ready: missing.length === 0 };
}

/**
 * Human-readable reason a download was withheld, for the guidance strip.
 *
 * Naming the missing fields is the whole point: "failed to generate" tells a
 * visitor nothing they can act on, "birth time is missing" tells them exactly
 * which box to fill.
 */
export function missingFieldsMessage(missing: RequiredDownloadField[], lang: 'hi' | 'en' = 'en'): string {
  const labels = missing.map((f) => (lang === 'hi' ? REQUIRED_FIELD_LABELS[f].hi : REQUIRED_FIELD_LABELS[f].en));
  if (labels.length === 0) return '';
  if (lang === 'hi') {
    return `कुण्डली पीडीएफ़ हेतु ये विवरण आवश्यक हैं — ${labels.join(', ')}। कृपया भरें; तब डाउनलोड तुरंत जारी होगा।`;
  }
  return `These details are required for a qualified Kundli PDF — ${labels.join(', ')}. Fill them in and the download is issued immediately.`;
}

/**
 * Builds the `/report` URL that carries a birth record with it.
 *
 * Every entry point into the report (the chatbot's kundli intake, the kundli
 * workspace, a shared link) must hand over the SAME five values, or the report
 * page silently falls back to sample data and the visitor downloads somebody
 * else's chart under their own name.
 */
export function reportUrlForBirth(display: {
  name?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: number | null;
}): string {
  const q = new URLSearchParams();
  if (hasText(display.name)) q.set('name', String(display.name).trim());
  if (hasText(display.birthDate)) q.set('dob', String(display.birthDate).trim());
  if (hasText(display.birthTime)) q.set('tob', String(display.birthTime).trim());
  if (hasText(display.locationName)) q.set('city', String(display.locationName).trim());
  if (hasNumber(display.latitude)) q.set('lat', String(display.latitude));
  if (hasNumber(display.longitude)) q.set('lng', String(display.longitude));
  if (hasNumber(display.timezone)) q.set('tz', String(display.timezone));
  const query = q.toString();
  return query ? `/report?${query}` : '/report';
}

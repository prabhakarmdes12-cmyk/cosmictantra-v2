/**
 * KASHI SAHAYAK — JOURNEY CONTEXT (Sprint C §12/§13).
 *
 * A minimal, additive bridge so the conversion journey can hand structured
 * context to the existing assistant WITHOUT the assistant recalculating
 * anything: chart identity, current route, Dasha identifiers, evidence ids,
 * language, and validation statuses are carried — never birth data.
 *
 * The event + storage key are the contract. The assistant listens for the
 * event; nothing in this module knows the astrology engine.
 */

export type KashiJourneyValidationStatus =
  | 'READY'
  | 'VALIDATION_PENDING'
  | 'INPUT_INCOMPLETE'
  | 'FAILED';

export interface KashiJourneyContext {
  /** Contract version consumers may gate on. */
  contractVersion: 'kashi-journey-context-v1';
  /** Route the user is on when asking. */
  route: string;
  /** Stable chart reference (record id) only — never birth data. */
  chartId?: string;
  /** Current Dasha identifiers, as emitted by the engine. */
  dasha?: {
    mahadasha?: string;
    antardasha?: string;
    periodString?: string;
  };
  /** Evidence ids shown to the user (e.g. dasha-why steps). */
  evidenceIds?: string[];
  /** The user's own question — shown as typed, never fabricated. */
  question?: string;
  /** Active UI language code (e.g. 'en', 'hi'). */
  language: string;
  /** Declared consumer chart state (see deriveConsumerChartState). */
  validationStatuses?: KashiJourneyValidationStatus[];
  /** Where the context originated. */
  source: 'CONVERSION_JOURNEY';
}

export const KASHI_JOURNEY_CONTEXT_EVENT = 'cosmictantra:kashi-journey-context';
export const KASHI_JOURNEY_CONTEXT_STORAGE = 'cosmictantra_kashi_journey_context';

/**
 * Dispatch context to any listening assistant surface and persist it for the
 * active session so later handovers can reference the same chart.
 */
export function dispatchKashiJourneyContext(ctx: KashiJourneyContext): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent<KashiJourneyContext>(KASHI_JOURNEY_CONTEXT_EVENT, { detail: ctx }));
    window.localStorage.setItem(KASHI_JOURNEY_CONTEXT_STORAGE, JSON.stringify(ctx));
  } catch {
    // storage unavailable — the event still delivered the context
  }
}

/** Read the last journey context (client-only). */
export function readKashiJourneyContext(): KashiJourneyContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KASHI_JOURNEY_CONTEXT_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KashiJourneyContext;
    return parsed && typeof parsed === 'object' && parsed.contractVersion === 'kashi-journey-context-v1'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

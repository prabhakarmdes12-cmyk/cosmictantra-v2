/**
 * CosmicTantra V34 — Analytics Event Architecture
 * Tracks intent router usage, tool interactions, and conversion progression.
 */

export type AnalyticsEventType =
  | 'HOME_VIEW'
  | 'LOCATION_CHANGED'
  | 'TODAY_PANCHANG_OPENED'
  | 'INTENT_SELECTED'
  | 'MUHURAT_CATEGORY_SELECTED'
  | 'FESTIVAL_SELECTED'
  | 'KUNDALI_STARTED'
  | 'KUNDALI_GENERATED'
  | 'DASHA_OPENED'
  | 'SWARGA_LOK_OPENED'
  | 'PRACTITIONER_VIEWED'
  | 'ASK_JYOTISHI_CLICKED'
  | 'QUESTION_REFINER_OPENED'
  | 'ASK_STARTED'
  | 'CHECKOUT_STARTED'
  | 'PAYMENT_COMPLETED';

export function trackEvent(eventType: AnalyticsEventType, payload: Record<string, any> = {}) {
  if (typeof window === 'undefined') return;

  fetch('/api/astrology/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, payload }),
  }).catch(err => {
    console.warn('Analytics event logging error:', err);
  });
}

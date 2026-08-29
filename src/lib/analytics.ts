/**
 * INTENT-DRIVEN ANALYTICS & ATTRIBUTION PIPELINE
 * Records visitor journey across discovery, calculations, and human consultation.
 *
 * PRIVACY (TRUST-09 / PROGRAM 15): every event payload is scrubbed at this
 * boundary via sanitizeEvent() before it is stored in the local session OR sent
 * to the network. Birth PII (date/time/coordinates/place) and free-text
 * (questions, names, phone, email) are NEVER recorded. See proAnalytics.js for
 * the field whitelist and docs/SECURITY_IDOR_AUDIT.md.
 */

import { sanitizeEvent } from './proAnalytics.js';

const STORAGE_KEY = 'cosmictantra_intent_session';

export const ANALYTICS_EVENTS = {
  HOME_VIEW: 'HOME_VIEW',
  LOCATION_CHANGED: 'LOCATION_CHANGED',
  TODAY_PANCHANG_OPENED: 'TODAY_PANCHANG_OPENED',
  INTENT_SELECTED: 'INTENT_SELECTED',
  MUHURAT_CATEGORY_SELECTED: 'MUHURAT_CATEGORY_SELECTED',
  FESTIVAL_SELECTED: 'FESTIVAL_SELECTED',
  KUNDALI_STARTED: 'KUNDALI_STARTED',
  KUNDALI_GENERATED: 'KUNDALI_GENERATED',
  DASHA_OPENED: 'DASHA_OPENED',
  SWARGA_LOK_OPENED: 'SWARGA_LOK_OPENED',
  PRACTITIONER_VIEWED: 'PRACTITIONER_VIEWED',
  PRACTITIONER_VIDEO_PLAYED: 'PRACTITIONER_VIDEO_PLAYED',
  ASK_JYOTISHI_CLICKED: 'ASK_JYOTISHI_CLICKED',
  QUESTION_REFINER_OPENED: 'QUESTION_REFINER_OPENED',
  ASK_STARTED: 'ASK_STARTED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED'
} as const;

class IntentTracker {
  private session: any;

  constructor() {
    this.session = this.loadSession();
  }

  private loadSession() {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) return JSON.parse(data);
      }
    } catch {
      // fallback
    }
    return {
      sessionId: 'sess_' + Math.random().toString(36).substring(2, 9),
      firstIntent: 'DIRECT_VISIT',
      productsUsed: [],
      events: [],
      timestamp: Date.now()
    };
  }

  private saveSession() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
      }
    } catch {
      // ignore
    }
  }

  public track(eventName: string, payload: Record<string, any> = {}) {
    // Scrub PII / free-text at the boundary. `clean` never contains birth data,
    // names, questions, phone or email — regardless of what the caller passed.
    const clean = sanitizeEvent(eventName, payload) as Record<string, any>;
    const { event: _evt, ...safePayload } = clean;

    const eventRecord = {
      event: eventName,
      payload: safePayload,
      time: new Date().toISOString()
    };

    if (this.session.events.length === 0 && safePayload.intent) {
      this.session.firstIntent = safePayload.intent;
    }

    if (safePayload.product && !this.session.productsUsed.includes(safePayload.product)) {
      this.session.productsUsed.push(safePayload.product);
    }

    this.session.events.push(eventRecord);
    this.saveSession();

    if (typeof window !== 'undefined') {
      fetch('/api/astrology/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: eventName, payload: safePayload }),
      }).catch(() => {});
    }
  }

  public getAttributionSummary() {
    return {
      sessionId: this.session.sessionId,
      firstIntent: this.session.firstIntent,
      productsUsed: this.session.productsUsed,
      totalEvents: this.session.events.length
    };
  }
}

export const analytics = new IntentTracker();

export function trackEvent(eventName: string, payload: Record<string, any> = {}) {
  analytics.track(eventName, payload);
}

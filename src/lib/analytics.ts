/**
 * INTENT-DRIVEN ANALYTICS & ATTRIBUTION PIPELINE
 * Records visitor journey across discovery, calculations, and human consultation.
 */

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
  KUNDLI_GENERATED: 'KUNDLI_GENERATED', // Sprint C funnel name (§25), alias of KUNDALI_GENERATED
  DASHA_OPENED: 'DASHA_OPENED',
  SWARGA_LOK_OPENED: 'SWARGA_LOK_OPENED',
  PRACTITIONER_VIEWED: 'PRACTITIONER_VIEWED',
  PRACTITIONER_VIDEO_PLAYED: 'PRACTITIONER_VIDEO_PLAYED',
  ASK_JYOTISHI_CLICKED: 'ASK_JYOTISHI_CLICKED',
  QUESTION_REFINER_OPENED: 'QUESTION_REFINER_OPENED',
  ASK_STARTED: 'ASK_STARTED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  // Sprint C conversion funnel (§25) — payloads carry no birth PII.
  LANDING_VIEW: 'LANDING_VIEW',
  KUNDLI_START: 'KUNDLI_START',
  KUNDLI_BIRTH_DETAILS_COMPLETE: 'KUNDLI_BIRTH_DETAILS_COMPLETE',
  FIRST_INSIGHT_VIEW: 'FIRST_INSIGHT_VIEW',
  WHY_OPEN: 'WHY_OPEN',
  ASK_ABOUT_CHART: 'ASK_ABOUT_CHART',
  SAVE_KUNDLI: 'SAVE_KUNDLI',
  CONSULT_INTENT: 'CONSULT_INTENT',
  TODAY_VIEW: 'TODAY_VIEW',
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
    const eventRecord = {
      event: eventName,
      payload,
      time: new Date().toISOString()
    };

    if (this.session.events.length === 0 && payload.intent) {
      this.session.firstIntent = payload.intent;
    }

    if (payload.product && !this.session.productsUsed.includes(payload.product)) {
      this.session.productsUsed.push(payload.product);
    }

    this.session.events.push(eventRecord);
    this.saveSession();

    if (typeof window !== 'undefined') {
      fetch('/api/astrology/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: eventName, payload }),
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

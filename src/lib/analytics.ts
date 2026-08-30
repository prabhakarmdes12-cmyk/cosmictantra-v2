/**
 * INTENT-DRIVEN ANALYTICS & ATTRIBUTION PIPELINE
 * Records visitor journey across discovery, calculations, and human consultation.
 */

const STORAGE_KEY = 'cosmictantra_intent_session';
const FIRST_VISIT_KEY = 'cosmictantra_first_visit_ms';

export const ANALYTICS_EVENTS = {
  HOME_VIEW: 'HOME_VIEW',
  LOCATION_CHANGED: 'LOCATION_CHANGED',
  TODAY_PANCHANG_OPENED: 'TODAY_PANCHANG_OPENED',
  INTENT_SELECTED: 'INTENT_SELECTED',
  MUHURAT_CATEGORY_SELECTED: 'MUHURAT_CATEGORY_SELECTED',
  FESTIVAL_SELECTED: 'FESTIVAL_SELECTED',
  KUNDALI_STARTED: 'KUNDALI_STARTED',
  KUNDALI_GENERATED: 'KUNDALI_GENERATED',
  KUNDALI_SHARED: 'KUNDALI_SHARED',
  FIRST_KUNDALI_GENERATED: 'FIRST_KUNDALI_GENERATED',
  PROFILE_SAVED: 'PROFILE_SAVED',
  CHECKLIST_TASK_CLICKED: 'CHECKLIST_TASK_CLICKED',
  ASK_STEP_VIEWED: 'ASK_STEP_VIEWED',
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
    // Stamp the visitor's first arrival once — powers time-to-value metrics
    try {
      if (typeof window !== 'undefined' && !localStorage.getItem(FIRST_VISIT_KEY)) {
        localStorage.setItem(FIRST_VISIT_KEY, String(Date.now()));
      }
    } catch {}

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

  /** Milliseconds since the visitor's first arrival (activation speed / TTV). */
  public getTimeToValueMs(): number | null {
    try {
      if (typeof window === 'undefined') return null;
      const t = localStorage.getItem(FIRST_VISIT_KEY);
      return t ? Date.now() - Number(t) : null;
    } catch {
      return null;
    }
  }

  /**
   * Fires an event at most once per visitor (e.g. FIRST_KUNDALI_GENERATED) and
   * automatically annotates it with time-to-value. Keyed dedupe flag in
   * localStorage keeps it stable across sessions.
   */
  public trackOnce(onceKey: string, eventName: string, payload: Record<string, any> = {}) {
    try {
      if (typeof window !== 'undefined') {
        const flagKey = `cosmictantra_once_${onceKey}`;
        if (localStorage.getItem(flagKey)) return;
        localStorage.setItem(flagKey, '1');
      }
    } catch {}
    this.track(eventName, { ...payload, ttfvMs: this.getTimeToValueMs() });
  }
}

export const analytics = new IntentTracker();

export function trackEvent(eventName: string, payload: Record<string, any> = {}) {
  analytics.track(eventName, payload);
}

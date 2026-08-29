/**
 * OBSERVABILITY & ANALYTICS (PROGRAM 15 / TRUST-09)
 * ================================================
 * Privacy-first, no-PII analytics. Events carry ONLY a whitelisted set of
 * non-identifying fields. Birth date/time/coordinates and free-text questions
 * are NEVER recorded (see docs/SECURITY_IDOR_AUDIT.md).
 *
 * Local ring buffer by default (no network); a sink can be attached for
 * aggregate reporting. Deterministic-core telemetry helps spot failures without
 * ever leaking who the user is.
 */

// Whitelist of allowed event field keys. Anything else is dropped.
const ALLOWED_FIELDS = new Set([
  'event', 'section', 'variant', 'mode', 'zoom', 'target', 'count',
  'durationMs', 'ok', 'code', 'degraded', 'confidence', 'status', 'topic',
]);

// Explicitly forbidden keys (defensive — also dropped by the whitelist).
const FORBIDDEN_FIELDS = new Set([
  'name', 'birthDate', 'birthTime', 'latitude', 'longitude', 'timezone',
  'place', 'question', 'phone', 'email', 'text', 'lat', 'lng', 'ownerKey',
]);

const RING_MAX = 200;
const _ring = [];
let _sink = null;

/** Attach an aggregate sink (must also respect the field whitelist). */
export function setAnalyticsSink(fn) { _sink = fn; }

/** Sanitize an event payload to non-PII whitelisted fields only. */
export function sanitizeEvent(name, payload = {}) {
  const clean = { event: String(name) };
  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_FIELDS.has(k)) continue;
    if (!ALLOWED_FIELDS.has(k)) continue;
    if (typeof v === 'string' && v.length > 64) continue; // avoid free-text leakage
    clean[k] = v;
  }
  return clean;
}

/** Record an analytics event (no PII). */
export function track(name, payload = {}) {
  const evt = { ...sanitizeEvent(name, payload), t: Date.now() };
  _ring.push(evt);
  if (_ring.length > RING_MAX) _ring.shift();
  try { if (_sink) _sink(evt); } catch { /* sink must never break the app */ }
  return evt;
}

export function recentEvents(n = 50) { return _ring.slice(-n); }
export function _clearAnalytics() { _ring.length = 0; }

export default { track, sanitizeEvent, setAnalyticsSink, recentEvents, _clearAnalytics };

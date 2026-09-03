/**
 * SPRINT C.1 INVARIANTS — CT_UX_INV_003 & CT_PRIV_INV_001.
 *
 * CT_UX_INV_003  Demo astrology data may NEVER be presented as if it
 *                belongs to the current user. Without a real profile the
 *                consumer must see a neutral "create your chart" state.
 *
 * CT_PRIV_INV_001 The assistant receives the MINIMUM personal data
 *                necessary for the requested experience — chart/evidence
 *                identifiers replace raw birth data wherever possible.
 */

export const CT_UX_INV_003 = 'CT_UX_INV_003';
export const CT_PRIV_INV_001 = 'CT_PRIV_INV_001';

/** Identifiers that mark a record as demo/preview — never user data. */
export const DEMO_MARKERS = ['pf_default', 'pf_spouse', 'pf_child', 'CT-4821', 'CT-4822', 'CT-4823'];

/** Raw personal fields that must never cross the analytics boundary. */
export const PRIVACY_FORBIDDEN_KEYS = [
  'birthDate',
  'birthTime',
  'fullName',
  'name',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'phone',
  'email',
  'birthCity',
  'locationName',
  'rawChart',
  'dob',
  'tob',
] as const;

/** Keys the Sprint C.1 funnel events are allowed to carry. */
export const ANALYTICS_ALLOWED_KEYS = [
  'route',
  'source',
  'lang',
  'theme',
  'chartId',
  'timeConfidence',
  'validationState',
  'evidenceCount',
  'dasha',
  'city',
  'horizon',
  'sessionId',
] as const;

export function isDemoRecord(record: { id?: string; cosmicId?: string; tags?: string[] }): boolean {
  const id = record?.id || '';
  const cosmicId = record?.cosmicId || '';
  const tags = record?.tags || [];
  return (
    DEMO_MARKERS.some((m) => id === m || id.startsWith(m)) ||
    DEMO_MARKERS.some((m) => cosmicId === m) ||
    tags.some((t) => /demo|preview|sample/i.test(String(t)))
  );
}

/** CT_PRIV_INV_001 payload guard — returns the offending keys ([] = safe). */
export function findPrivacyViolations(payload: Record<string, unknown>): string[] {
  return PRIVACY_FORBIDDEN_KEYS.filter((k) => k in payload && payload[k] !== undefined && payload[k] !== null);
}

/** Analytics payload guard — returns 'ok' or a reason. */
export function auditAnalyticsPayload(event: string, payload: Record<string, unknown>): { ok: boolean; reason?: string } {
  const violations = findPrivacyViolations(payload);
  if (violations.length > 0) {
    return { ok: false, reason: `${event} carries forbidden personal keys: ${violations.join(', ')}` };
  }
  const unexpected = Object.keys(payload).filter((k) => !(ANALYTICS_ALLOWED_KEYS as readonly string[]).includes(k));
  if (unexpected.length > 0) {
    return { ok: false, reason: `${event} carries undeclared keys: ${unexpected.join(', ')}` };
  }
  return { ok: true };
}

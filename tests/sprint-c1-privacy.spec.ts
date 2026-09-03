/**
 * SPRINT C.1 — ANALYTICS & ASK-CONTEXT PRIVACY (§13, §14).
 * Runtime guard + canonical funnel payload schema + static source audit.
 */
import { test, expect } from '@playwright/test';

const describe = test.describe;
const it = test;
import * as fs from 'node:fs';
import path from 'node:path';
import { auditAnalyticsPayload, findPrivacyViolations } from '../src/lib/invariants/sprintC1';
import { analytics, trackEvent, auditAnalyticsPayloadKeys, ANALYTICS_EVENTS } from '../src/lib/analytics';

const FUNNEL_PAYLOADS: Array<[string, Record<string, unknown>]> = [
  [ANALYTICS_EVENTS.LANDING_VIEW, { route: '/', theme: 'light', lang: 'en' }],
  [ANALYTICS_EVENTS.KUNDLI_START, { source: 'LANDING_HERO' }],
  [ANALYTICS_EVENTS.KUNDLI_BIRTH_DETAILS_COMPLETE, { source: 'LANDING_HERO', chartId: 'ct-1', timeConfidence: 'EXACT', lang: 'en' }],
  [ANALYTICS_EVENTS.KUNDLI_GENERATED, { source: 'LANDING_HERO', chartId: 'ct-1', timeConfidence: 'EXACT', lang: 'en' }],
  [ANALYTICS_EVENTS.FIRST_INSIGHT_VIEW, { route: '/kundli/ct-1', chartId: 'ct-1', timeConfidence: 'EXACT', validationState: 'READY', lang: 'en' }],
  [ANALYTICS_EVENTS.WHY_OPEN, { chartId: 'ct-1', route: '/kundli/ct-1', evidenceCount: 5, lang: 'en' }],
  [ANALYTICS_EVENTS.ASK_ABOUT_CHART, { chartId: 'ct-1', route: '/kundli/ct-1', lang: 'en' }],
  [ANALYTICS_EVENTS.SAVE_KUNDLI, { chartId: 'ct-1', route: '/kundli/ct-1', timeConfidence: 'EXACT', lang: 'en' }],
  [ANALYTICS_EVENTS.CONSULT_INTENT, { chartId: 'ct-1', route: '/kundli/ct-1', dasha: 'Saturn – Mercury', lang: 'en' }],
  [ANALYTICS_EVENTS.TODAY_VIEW, { route: '/daily', horizon: 'daily', lang: 'en' }],
];

describe('analytics privacy schema (§14)', () => {
  it('all 10 funnel payloads pass the schema', () => {
    for (const [event, payload] of FUNNEL_PAYLOADS) {
      const result = auditAnalyticsPayload(event, payload);
      expect(result.ok, `${event}: ${result.reason}`).toBe(true);
    }
  });

  it('forbidden personal keys are detected', () => {
    expect(findPrivacyViolations({ name: 'Priya', birthDate: '1995-06-15' })).toEqual(expect.arrayContaining(['name', 'birthDate']));
    expect(findPrivacyViolations({ chartId: 'ct-1', lang: 'en' })).toEqual([]);
  });

  it('runtime guard drops a payload carrying birth PII (nothing recorded)', () => {
    const session = (analytics as any).session;
    const before = session.events.length;
    trackEvent('SHOULD_BE_DROPPED', { name: 'Priya Sharma', birthDate: '1995-06-15', birthTime: '10:30', lat: 25.59, lng: 85.13 });
    expect(session.events.length).toBe(before);
  });

  it('runtime guard records an allowed payload', () => {
    const session = (analytics as any).session;
    const before = session.events.length;
    trackEvent('SAFE_EVENT', { chartId: 'ct-2', route: '/kundli/ct-2', lang: 'en' });
    expect(session.events.length).toBe(before + 1);
  });

  it('guard helper flags exact numeric coordinates too', () => {
    expect(auditAnalyticsPayloadKeys({ latitude: 25.5, longitude: 85.1 })).toEqual(expect.arrayContaining(['latitude', 'longitude']));
    expect(auditAnalyticsPayloadKeys({ city: 'Patna', lang: 'en' })).toEqual([]);
  });
});

describe('ask-context privacy (CT_PRIV_INV_001, §13)', () => {
  it('conversion journey context carries identifiers only (no name/birth data)', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/kundli/KundliFirstInsight.tsx'), 'utf8');
    const dispatchBlock = src.slice(src.indexOf('const dispatchAsk'), src.indexOf('};', src.indexOf('const dispatchAsk')) + 2);
    for (const forbidden of ['personName', 'birthDate', 'birthTime', 'birthContext', 'fullName', 'locationName', 'latitude', 'longitude', 'phone', 'email']) {
      expect(dispatchBlock).not.toContain(forbidden);
    }
    expect(dispatchBlock).toContain('chartId');
    expect(dispatchBlock).toContain('evidenceIds');
  });
});

describe('demo contamination removal (CT_UX_INV_003, §2)', () => {
  it('consumer daily page contains no fabricated demo profiles or silent cities', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/daily/page.tsx'), 'utf8');
    for (const marker of ['Priya Sharma', 'Amit Sharma', 'name: \'Priya', '25.5941', '85.1376']) {
      expect(src).not.toContain(marker);
    }
  });

  it('landing never computes panchang for a default city', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');
    expect(src).not.toContain('calculatePanchang(new Date(), DEFAULT_CITY)');
    expect(src).not.toContain("import { DEFAULT_CITY }");
  });
});

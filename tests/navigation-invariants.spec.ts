/**
 * NAVIGATION HARDENING — pure invariant suite (no browser needed).
 *
 * CT_UX_INV_001   no navigation item links to a non-existent route
 * CT_UX_INV_002   presentation components may not manufacture astrology facts
 * Location       canonical resolver precedence + no fake-city fallback
 * Adapter        read-only engine→consumer transform statuses
 * i18n           every navigationModel copy key exists in en + hi dictionaries
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import {
  PRIMARY_DESTINATIONS,
  MOBILE_BOTTOM_NAV_ITEMS,
  getAllNavigationHrefs,
  REMOVED_DEAD_ROUTES,
  resolvePrimaryDestination,
} from '../src/lib/navigation/navigationModel';
import { FUTURE_TECHNICAL_CAPABILITIES } from '../src/lib/navigation/navigationMetadata';
import { resolveActiveLocation, UNKNOWN_LOCATION } from '../src/lib/location/activeLocation';
import { resolveKashiContext, type KashiContextDomain } from '../src/lib/kashi/contextContract';
import { adaptKundliOverview } from '../src/lib/presentation/kundliOverviewAdapter';
import { buildGoldenCanonical } from './kundli-v40/goldenCanonical';
import { buildDerivedModel } from '../src/lib/kundli/v40/derivedModel';
import { TRANSLATIONS } from '../src/lib/translations';

const ROOT = path.resolve(__dirname, '..');

test.describe('CT_UX_INV_001 — navigation route resolution', () => {
  test('validator script passes (filesystem route inventory)', () => {
    const out = execSync(`npx tsx ${path.join('scripts', 'validate-navigation.ts')}`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(out).toContain('Navigation validation: PASS');
  });

  test('every model href is live and no removed dead route is linked', () => {
    const links = getAllNavigationHrefs();
    expect(links.length).toBeGreaterThan(10);
    for (const link of links) {
      expect(REMOVED_DEAD_ROUTES).not.toContain(link.href as never);
    }
  });

  test('future capabilities are metadata only and never clickable', () => {
    expect(FUTURE_TECHNICAL_CAPABILITIES.length).toBeGreaterThanOrEqual(4);
    for (const cap of FUTURE_TECHNICAL_CAPABILITIES) {
      expect(cap.clickable).toBe(false);
      expect(cap.routeHint.startsWith('/kundli/')).toBe(true);
    }
  });

  test('primary destinations form the five-destination hierarchy', () => {
    expect(PRIMARY_DESTINATIONS.map((d) => d.id)).toEqual([
      'TODAY', 'MY_KUNDLI', 'ASK', 'CONSULT', 'EXPLORE',
    ]);
    const explore = PRIMARY_DESTINATIONS.find((d) => d.id === 'EXPLORE')!;
    expect(explore.href).toBeNull();
    expect(explore.isMenu).toBe(true);
    expect(explore.children.map((c) => c.href)).toEqual([
      '/darshan', '/calendar', '/kundali-milan', '/muhurat/personalized',
      '/library', '/aarti-stotra', '/upaya', '/remedy-tracker',
    ]);
  });

  test('mobile bottom nav has exactly the five destinations with ASK central', () => {
    expect(MOBILE_BOTTOM_NAV_ITEMS).toHaveLength(5);
    expect(MOBILE_BOTTOM_NAV_ITEMS[2].id).toBe('ASK');
    expect(MOBILE_BOTTOM_NAV_ITEMS[2].isAsk).toBe(true);
    expect(MOBILE_BOTTOM_NAV_ITEMS.map((i) => i.id)).toEqual([
      'TODAY', 'MY_KUNDLI', 'ASK', 'CONSULT', 'EXPLORE',
    ]);
  });

  test('active-destination resolution maps real paths', () => {
    expect(resolvePrimaryDestination('/daily')).toBe('TODAY');
    expect(resolvePrimaryDestination('/kundli/gandhi-1869')).toBe('MY_KUNDLI');
    expect(resolvePrimaryDestination('/ask')).toBe('ASK');
    expect(resolvePrimaryDestination('/astrology/practitioners')).toBe('CONSULT');
    expect(resolvePrimaryDestination('/darshan')).toBe('EXPLORE');
    expect(resolvePrimaryDestination('/library')).toBe('EXPLORE');
  });
});

test.describe('CT_UX_INV_002 — presentation purity', () => {
  test('EvidenceBackedPattern has no engine imports and no template exports', () => {
    const fs = require('fs') as typeof import('fs');
    const src = fs.readFileSync(
      path.join(ROOT, 'src', 'components', 'kundli', 'EvidenceBackedPattern.tsx'),
      'utf8',
    );
    const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(stripped).not.toMatch(/from\s+['"][^'"]*(jyotish|astrologyEngine|dashaEngine|panchang|astronomy)/i);
    expect(stripped).not.toMatch(/export\s+(const|let|var)\s+(EVIDENCE|TEMPLATE|PATTERN_)/);
  });
});

test.describe('Location — canonical resolver precedence', () => {
  const profile = { birthCity: 'Jaipur', lat: 26.9124, lng: 75.7873, tz: 5.5 };
  const activeCity = { name: 'Varanasi', lat: 25.3176, lng: 82.9739, tz: 5.5 };
  const gps = { name: 'Live GPS Location', lat: 12.97, lng: 77.59, tz: 5.5 };
  const persisted = { name: 'Chennai', lat: 13.0827, lng: 80.2707, tz: 5.5 };

  test('profile is highest precedence', () => {
    const r = resolveActiveLocation({ profile, activeCity, gps, persisted });
    expect(r.status).toBe('KNOWN');
    expect(r.name).toBe('Jaipur');
    expect(r.source).toBe('PROFILE');
  });

  test('active city beats GPS + persisted', () => {
    const r = resolveActiveLocation({ activeCity, gps, persisted });
    expect(r.name).toBe('Varanasi');
    expect(r.source).toBe('ACTIVE_CITY');
  });

  test('GPS beats persisted when permission granted', () => {
    const r = resolveActiveLocation({ gps, persisted });
    expect(r.name).toBe('Live GPS Location');
    expect(r.source).toBe('GPS');
    expect(r.isGps).toBe(true);
  });

  test('persisted is used when nothing higher exists', () => {
    const r = resolveActiveLocation({ persisted });
    expect(r.name).toBe('Chennai');
    expect(r.source).toBe('PERSISTED');
  });

  test('no source ⇒ UNKNOWN — never an invented city', () => {
    const r = resolveActiveLocation({});
    expect(r).toEqual(UNKNOWN_LOCATION);
    expect(r.status).toBe('UNKNOWN');
    expect(r.name).toBe('');
  });

  test('partial/invalid entries do not fabricate coordinates', () => {
    expect(resolveActiveLocation({ activeCity: { name: 'X' } })).toEqual(UNKNOWN_LOCATION);
    expect(resolveActiveLocation({ profile: { birthCity: 'X', lat: null, lng: null } })).toEqual(UNKNOWN_LOCATION);
  });

  test('legacy lon field is honoured (CosmicNow uses lon)', () => {
    const r = resolveActiveLocation({ activeCity: { name: 'Pune', lat: 18.52, lon: 73.85, tz: 5.5 } });
    expect(r.lng).toBe(73.85);
  });
});

test.describe('Kashi context contract', () => {
  const loc = resolveActiveLocation({ activeCity: { name: 'Varanasi', lat: 25.3176, lng: 82.9739 } });

  test('maps destinations to domains', () => {
    const cases: [string, KashiContextDomain][] = [
      ['/daily', 'TODAY'],
      ['/', 'TODAY'],
      ['/dashboard', 'KUNDLI_OVERVIEW'],
      ['/kundali-milan', 'MATCHING'],
      ['/muhurat/personalized', 'MUHURAT'],
      ['/darshan', 'DARSHAN'],
      ['/upaya', 'PUJA'],
      ['/ask', 'ASK'],
    ];
    for (const [pathname, domain] of cases) {
      expect(resolveKashiContext(pathname, loc).domain).toBe(domain);
    }
  });

  test('carries location + suggested prompt keys', () => {
    const ctx = resolveKashiContext('/daily', loc);
    expect(ctx.location.name).toBe('Varanasi');
    expect(ctx.suggestionsEnabled).toBe(true);
    expect(ctx.suggestedPrompts[0].i18nKey).toBe('today');
    expect(TRANSLATIONS.en.context[ctx.suggestedPrompts[0].i18nKey]).toContain('Tithi');
  });
});

test.describe('Kundli overview adapter — read-only contract', () => {
  const canonical = buildGoldenCanonical();
  const derived = buildDerivedModel(canonical);

  test('no engine input ⇒ UNAVAILABLE, no invented patterns', () => {
    const result = adaptKundliOverview({});
    expect(result.available).toBe(false);
    expect(result.overallStatus).toBe('UNAVAILABLE');
    expect(result.patterns).toHaveLength(0);
    expect(result.domains.every((d) => d.status === 'UNAVAILABLE')).toBe(true);
  });

  test('maps golden chart into CAREER/DASHA/STRUCTURE patterns', () => {
    const result = adaptKundliOverview({ canonical, derived });
    expect(result.available).toBe(true);
    const ids = result.patterns.map((p) => p.id);
    expect(ids).toContain('CAREER');
    expect(ids).toContain('DASHA');
    expect(ids).toContain('STRUCTURE');

    const career = result.patterns.find((p) => p.id === 'CAREER')!;
    // Engine explicitly grades the indication — mapped, never inferred.
    expect(['STRONGLY_REPRESENTED', 'REPRESENTED', 'MIXED', 'WEAKLY_REPRESENTED', 'UNRESOLVED'])
      .toContain(career.representation);
    expect(career.evidenceNodes.length).toBeGreaterThan(0);
    expect(career.validationStatus).toBe('VALIDATION_PENDING'); // D10 quarantined + transits missing
    expect(career.scholarJudgementRequired).toBe(true); // INTERPRETIVE_SYNTHESIS
  });

  test('dasha pattern never invents a strength verdict', () => {
    const result = adaptKundliOverview({ canonical, derived });
    const dasha = result.patterns.find((p) => p.id === 'DASHA')!;
    expect(dasha.representation).toBe('UNRESOLVED');
    expect(dasha.evidenceNodes.length).toBeGreaterThan(0);
  });

  test('capability passthrough exposes VALIDATION_PENDING shadbala and NOT_CALCULATED ashtakavarga', () => {
    const result = adaptKundliOverview({ canonical, derived });
    const byId = new Map(result.capabilities.map((c) => [c.id, c]));
    expect(byId.get('CAP_SHADBALA')?.status).toBe('VALIDATION_PENDING');
    expect(byId.get('CAP_SHADBALA')?.mayInfluenceConclusions).toBe(false);
    expect(byId.get('CAP_ASHTAKAVARGA')?.status).toBe('NOT_CALCULATED');
    expect(result.d10?.status).toBe('VALIDATION_PENDING');
  });
});

test.describe('Translation wiring — no hardcoded nav copy in new navigation', () => {
  const en = TRANSLATIONS.en.navigation;
  const hi = TRANSLATIONS.hi.navigation;

  test('en and hi provide every navigationModel label key', () => {
    const keys = new Set<string>();
    for (const d of PRIMARY_DESTINATIONS) {
      keys.add(d.labelKey); keys.add(d.labelHiKey);
      keys.add(d.descriptionKey); keys.add(d.descriptionHiKey);
      for (const c of d.children) {
        keys.add(c.labelKey); keys.add(c.labelHiKey); keys.add(c.descriptionKey);
      }
    }
    for (const m of MOBILE_BOTTOM_NAV_ITEMS) {
      keys.add(m.labelKey); keys.add(m.labelHiKey);
    }
    const missing = [...keys].filter((k) => !(k in en) || !(k in hi));
    expect(missing, `missing dictionary keys: ${missing.join(', ')}`).toHaveLength(0);
  });

  test('regional languages inherit a non-empty navigation dictionary (no EN-only fallback)', () => {
    // hi (proxy fallback for regional langs) must carry navigation too
    expect((TRANSLATIONS.hi as any).navigation.today).toBeTruthy();
    // regional: fallback returns hi-based object including navigation
    const ta = TRANSLATIONS.ta as any;
    expect(ta.navigation).toBeTruthy();
    expect(ta.navigation.today).toBeTruthy();
  });
});

/**
 * SPRINT C — CONVERSION JOURNEY 01 — node-level invariants.
 *
 * These run without a browser (same philosophy as navigation-invariants):
 * they verify the read-only adapter, the canonical chart state machine,
 * the fact-first landing copy, the Executive-Life gating, the translation
 * coverage, the analytics privacy contract and the untouched engine.
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

/* ------------------------------------------------------------------ */
/* 1. Read-only adapter — engine fields mapped verbatim                */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — kundli consumer adapter (read-only)', () => {
  test('at-a-glance maps real engine snapshot fields for a benchmark chart', async () => {
    const { getKundliById } = await import('../src/lib/jyotish/kundliStore');
    const { adaptKundliAtAGlance, buildDashaWhyEvidence, buildDashaTechnicalEvidence, deriveConsumerChartState } =
      await import('../src/lib/presentation/kundliOverviewAdapter');

    const record = getKundliById('master-prabhakar-1989');
    expect(record).not.toBeNull();
    const glance = adaptKundliAtAGlance(record!);
    expect(glance).not.toBeNull();
    // These must be the engine's own values — never UI defaults.
    expect(glance!.lagna.value).toBe(record!.snapshot.lagna.rashiName);
    expect(glance!.mahadasha.value).toBe(record!.snapshot.dasha.currentMahadasha);
    expect(glance!.antardasha.value).toBe(record!.snapshot.dasha.currentAntardasha);
    expect(glance!.nakshatra.value).toBe(record!.snapshot.birthPanchang.nakshatra.name);
    expect(glance!.timeConfidence).toBe(record!.timeConfidence);

    const steps = buildDashaWhyEvidence(record!);
    expect(steps.length).toBeGreaterThan(3);
    // Every step carries engine-authored values only.
    expect(steps.some((s) => s.textKey === 'whyMoonNakshatra')).toBe(true);
    expect(steps.some((s) => s.textKey === 'whyBalance' && s.values.balance === record!.snapshot.dasha.startingBalance)).toBe(true);
    expect(steps.some((s) => s.textKey === 'whyMahadasha')).toBe(true);
    // All claims are truthful: engine numbers are CALCULATED.
    expect(steps.every((s) => ['CALCULATED', 'VALIDATION_PENDING'].includes(s.claim))).toBe(true);

    const tech = buildDashaTechnicalEvidence(record!);
    expect(tech.engineVersion).toBe(record!.snapshot.meta.engineVersion);
    expect(tech.ayanamshaName).toBe(record!.snapshot.meta.ayanamshaName);
    expect(tech.moonLongitude).not.toBeNull();

    const state = deriveConsumerChartState(record!);
    expect(['READY', 'VALIDATION_PENDING']).toContain(state.state);
  });

  test('missing data stays null (never invented)', async () => {
    const { deriveConsumerChartState, adaptKundliAtAGlance } = await import(
      '../src/lib/presentation/kundliOverviewAdapter'
    );
    const empty: any = {
      id: 'x',
      personName: 'X',
      birthContext: { birthDate: '2000-01-01', birthTime: '12:00', latitude: 1, longitude: 1, timezone: 5.5, locationName: 'X' },
      timeConfidence: 'EXACT',
      snapshot: { meta: {}, lagna: null, planetsArray: [], birthPanchang: {}, dasha: {} },
    };
    const glance = adaptKundliAtAGlance(empty);
    expect(glance).not.toBeNull();
    expect(glance!.lagna.value).toBeNull();
    expect(glance!.mahadasha.value).toBeNull();
    expect(glance!.periodString).toBeNull();
    expect(adaptKundliAtAGlance(null)).toBeNull();
    expect(deriveConsumerChartState(null).state).toBe('FAILED');
  });

  test('canonical chart state mirrors declared engine confidence', async () => {
    const { getKundliById } = await import('../src/lib/jyotish/kundliStore');
    const { deriveConsumerChartState } = await import('../src/lib/presentation/kundliOverviewAdapter');
    const rec = getKundliById('gandhi-1869')!;
    expect(deriveConsumerChartState(rec).state).toBe('READY');
    const approx = { ...rec, timeConfidence: 'APPROXIMATE' as const };
    const st = deriveConsumerChartState(approx);
    expect(st.state).toBe('VALIDATION_PENDING');
    expect(st.reasons).toContain('stateApproximateTime');

    const broken: any = { ...rec, birthContext: { ...rec.birthContext, latitude: Number.NaN } };
    expect(deriveConsumerChartState(broken).state).toBe('INPUT_INCOMPLETE');
  });
});

/* ------------------------------------------------------------------ */
/* 2. Fact-first landing — no prediction-market ticker                 */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — landing copy is fact-first', () => {
  test('PersonalisationBridge has no prediction-market ticker language', () => {
    const src = read('src/components/PersonalisationBridge.jsx');
    for (const banned of [
      'Financial Liquidity',
      'Deal Momentum',
      'Career Opportunity',
      '72H GLIMPSE',
      'DAY AFTER',
      'Breakthrough Focus',
      'tomorrowGlimpse',
      'dayAfterGlimpse',
    ]) {
      expect(src).not.toContain(banned);
    }
    // Fact-first: the strip only renders when the panchang calculation exists.
    expect(src).toContain('factLine');
    expect(src).toContain('Today in Vedic time');
  });

  test('Hero has no silent city fallback and no autoplay video layer', () => {
    const src = read('src/components/HeroSection.jsx');
    expect(src).not.toContain('New Delhi');
    expect(src).not.toContain('DEFAULT_CITY');
    expect(src).not.toContain('28.6139');
    expect(src).not.toContain('77.2090');
    expect(src).not.toContain('<video');
    expect(src).not.toContain('Ask a Jyotishi (₹501)');
    // Progressive certainty capture + real engine usage.
    expect(src).toContain('timeCertainty');
    expect(src).toContain('getCanonicalJyotishSnapshot');
    expect(src).toContain('createKundli');
    expect(src).toContain('kundli-calc-failed');
  });

  test('page passes today panchang facts into the strip', () => {
    const src = read('src/app/page.tsx');
    expect(src).toContain('panchangData={panchangData}');
    expect(src).toContain('<TrustStrip');
    expect(src).toContain('LANDING_VIEW');
  });
});

/* ------------------------------------------------------------------ */
/* 3. Executive Life Matrix gated behind Explorer/Experimental         */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — Executive Life Matrix gating', () => {
  test('synthetic score matrix is not in the default report Overview', () => {
    const src = read('src/app/report/MasterKundliReportClient.tsx');
    const overviewStart = src.indexOf("activeTab === 'OVERVIEW'");
    const workbenchStart = src.indexOf('MODE B: INTERACTIVE VISUAL WORKBENCH');
    const gaugeRender = src.indexOf('<ExecutiveLifeGaugeDashboard');
    expect(overviewStart).toBeGreaterThan(-1);
    expect(workbenchStart).toBeGreaterThan(-1);
    expect(gaugeRender).toBeGreaterThan(workbenchStart);
    expect(src).toContain('Explorer / Experimental');
    expect(src).toContain('Engine qualification pending');
  });
});

/* ------------------------------------------------------------------ */
/* 4. Translations coverage                                            */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — translation wiring', () => {
  test('en + hi conversion dictionaries cover the journey keys', async () => {
    const { TRANSLATIONS } = await import('../src/lib/translations');
    const required = [
      'promiseSupport', 'ctaCreateKundli', 'ctaTodayPanchang', 'ctaOpenMyKundli',
      'trustCalculatedTitle', 'trustConventionsTitle', 'trustInterpretationTitle', 'trustHumanTitle',
      'stepName', 'stepBirthDate', 'stepBirthTime', 'stepBirthPlace',
      'certaintyExact', 'certaintyApproximate', 'certaintyUnknown',
      'calcTitle', 'calcStep1', 'calcStep2', 'calcStep3', 'calcStep4', 'calcStep5',
      'calcFailedTitle', 'insightEyebrow', 'atAGlance', 'lagna', 'moonRashi', 'nakshatra',
      'currentMahadasha', 'currentAntardasha', 'whatIsActiveNow', 'whyBtn', 'askAboutThis',
      'claimCalculated', 'claimDerived', 'claimTraditional', 'claimScholar', 'claimValidationPending',
      'whyTitle', 'whyMoonNakshatra', 'whyNakshatraLord', 'whyBalance', 'whySequence',
      'whyMahadasha', 'whyAntardasha', 'whyTimeUncertain', 'showTechnical',
      'saveKundli', 'saveBenefits', 'saveDone', 'exploreMyChart', 'patternPlaceholder',
      'askAboutToday', 'legendNote',
    ];
    for (const lang of ['en', 'hi']) {
      const conv: any = (TRANSLATIONS as any)[lang]?.conversion;
      expect(conv, `${lang} conversion dictionary missing`).toBeTruthy();
      for (const key of required) {
        expect(conv[key], `${lang}.conversion.${key} missing`).toBeTruthy();
      }
    }
    // Regional languages inherit the Hindi conversion copy (never EN-only)
    const ta: any = (TRANSLATIONS as any).ta?.conversion;
    expect(ta?.promiseSupport).toBeTruthy();
    expect(ta?.ctaCreateKundli).toBeTruthy();
  });
});

/* ------------------------------------------------------------------ */
/* 5. Analytics — no birth PII in the new funnel events                */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — analytics privacy', () => {
  test('events exist and payloads carry no birth fields', async () => {
    const { ANALYTICS_EVENTS } = await import('../src/lib/analytics');
    for (const ev of [
      'LANDING_VIEW', 'KUNDLI_START', 'KUNDLI_BIRTH_DETAILS_COMPLETE', 'KUNDLI_GENERATED',
      'FIRST_INSIGHT_VIEW', 'WHY_OPEN', 'ASK_ABOUT_CHART', 'SAVE_KUNDLI', 'CONSULT_INTENT', 'TODAY_VIEW',
    ]) {
      expect((ANALYTICS_EVENTS as any)[ev], `missing ${ev}`).toBe(ev);
    }
    const trackCall = (src: string, eventName: string) => {
      const idx = src.indexOf(`ANALYTICS_EVENTS.${eventName}`);
      expect(idx, `no track for ${eventName}`).toBeGreaterThan(-1);
      const block = src.slice(idx, idx + 900);
      return block.slice(0, block.indexOf('});') + 3);
    };
    const insight = read('src/components/kundli/KundliFirstInsight.tsx');
    for (const ev of ['FIRST_INSIGHT_VIEW', 'WHY_OPEN', 'ASK_ABOUT_CHART', 'SAVE_KUNDLI', 'CONSULT_INTENT']) {
      const block = trackCall(insight, ev);
      for (const pii of ['birthDate', 'birthTime', 'latitude', 'longitude', 'locationName', 'dob', 'tob']) {
        expect(block, `${ev} leaks ${pii}`).not.toContain(pii);
      }
    }
    const hero = read('src/components/HeroSection.jsx');
    for (const ev of ['KUNDLI_START', 'KUNDLI_GENERATED', 'KUNDLI_BIRTH_DETAILS_COMPLETE']) {
      const block = trackCall(hero, ev);
      for (const pii of ['birthDate', 'birthTime', 'latitude', 'longitude', 'locationName']) {
        expect(block, `${ev} leaks ${pii}`).not.toContain(pii);
      }
    }
  });

  test('journey context contract is birth-data-free', () => {
    const src = read('src/lib/kashi/journeyContext.ts');
    for (const pii of ['birthDate', 'birthTime', 'latitude', 'longitude', 'locationName', 'phone', 'email']) {
      expect(src).not.toContain(pii);
    }
    expect(src).toContain('kashi-journey-context-v1');
    expect(src).toContain('cosmictantra:kashi-journey-context');
  });
});

/* ------------------------------------------------------------------ */
/* 6. First insight viewport wiring                                    */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — first insight viewport', () => {
  test('workspace renders insight above the untouched deep explorer', () => {
    const src = read('src/app/kundli/[id]/KundliWorkspaceClient.tsx');
    expect(src).toContain('KundliFirstInsight');
    expect(src).toContain('id="kundli-explore"');
    const insightIdx = src.indexOf('<KundliFirstInsight');
    const exploreIdx = src.indexOf('id="kundli-explore"');
    expect(insightIdx).toBeGreaterThan(-1);
    expect(exploreIdx).toBeGreaterThan(insightIdx);
    // Existing deep tabs remain (no redesign of deeper content).
    expect(src).toContain("id: 'charts'");
    expect(src).toContain("id: 'bala'");
    expect(src).toContain("id: 'dasha'");
    // Missing record → coherent FAILED state, not eternal loading.
    expect(src).toContain('This chart could not be opened');
    expect(src).not.toContain('Loading Kundli Workspace...');
  });

  test('insight component contains no astrology calculation or puja sales', () => {
    const src = read('src/components/kundli/KundliFirstInsight.tsx');
    for (const banned of ['calculateVimshottari', 'calculatePanchang', 'calculateKundali', 'computeExecutive', 'buyPuja', '₹', 'checkout', 'razorpay']) {
      expect(src).not.toContain(banned);
    }
    expect(src).toContain('buildDashaWhyEvidence');
    expect(src).toContain('deriveConsumerChartState');
    expect(src).toContain('patternPlaceholder');
    expect(src).toContain('kundli-why-drawer');
  });
});

/* ------------------------------------------------------------------ */
/* 7. Engine untouched                                                */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — astrology engine untouched', () => {
  test('no engine file modified since Sprint B.1 base', () => {
    const base = '0314aa7';
    let out = '';
    try {
      out = execSync(`git -C ${ROOT} diff --name-only ${base}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      // no git metadata (e.g. packaged build) — skip, non-blocking
      test.skip(true, 'git metadata unavailable');
      return;
    }
    const enginePrefixes = [
      'src/lib/jyotish/', 'src/lib/astronomy/', 'src/engines/',
      'src/lib/astrologyEngine.js', 'src/lib/dashaEngine.js', 'src/lib/panchang.js',
    ];
    const touchedEngine = out.split('\n').filter((f) => f && enginePrefixes.some((p) => f.startsWith(p)));
    expect(touchedEngine).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* 8. Daily page — Ask-about-today entry + Today view analytics        */
/* ------------------------------------------------------------------ */

test.describe('Sprint C — SEO structure (§24)', () => {
  test('landing promise, trust strip and explore tools are server-rendered (not client-gated)', () => {
    const page = read('src/app/page.tsx');
    const heroIdx = page.indexOf('<HeroSection');
    const trustIdx = page.indexOf('<TrustStrip');
    const gateIdx = page.indexOf('{isClientMounted &&');
    expect(heroIdx).toBeGreaterThan(-1);
    expect(trustIdx).toBeGreaterThan(-1);
    // Static conversion content must be OUTSIDE the client-mount gate.
    expect(heroIdx).toBeLessThan(gateIdx);
    expect(trustIdx).toBeLessThan(gateIdx);
    // The time-dependent live dial is the only gated hero part.
    expect(page).toContain('dialReady={isClientMounted}');
    expect(page).not.toContain('Loading current Vedic calculations');
  });

  test('landing emits truthful JSON-LD for existing routes only', () => {
    const page = read('src/app/page.tsx');
    expect(page).toContain('application/ld+json');
    for (const route of ['/dashboard', '/daily', '/calendar', '/milan', '/muhurat/personalized']) {
      expect(page).toContain(route);
    }
    expect(page).toContain('Vedic Precision. Human Wisdom.'); // matches the promise, no overclaim
  });

  test('hero dial renders a static server teaser instead of time-dependent content', () => {
    const hero = read('src/components/HeroSection.jsx');
    expect(hero).toContain('dialReady');
    expect(hero).toContain('cosmic-dial-static-teaser');
    // No time-dependent data on the server path: the live component is only
    // reached when dialReady flips true after hydration.
    expect(hero).toContain('dialReady ?');
  });

  test('root metadata mirrors the consumer promise without overclaiming', () => {
    const layout = read('src/app/layout.tsx');
    expect(layout).toContain('Vedic Precision. Human Wisdom.');
    for (const banned of ['100% accurate', 'scientifically proven', 'best astrologer', 'AI predicts your future']) {
      expect(layout).not.toContain(banned);
    }
  });
});

test.describe('Sprint C — Today page participation', () => {
  test('daily page has ASK ABOUT TODAY and TODAY_VIEW event', () => {
    const src = read('src/app/daily/page.tsx');
    expect(src).toContain('ask-about-today');
    expect(src).toContain('ASK ABOUT TODAY');
    expect(src).toContain('TODAY_VIEW');
  });

  test('daily page never seeds fabricated demo profiles or silent locations', () => {
    const src = read('src/app/daily/page.tsx');
    for (const banned of [
      'Priya Sharma',
      'Amit Sharma',
      "useState('1996-08-12')",
      "useState('14:30')",
      "useState('Varanasi')",
      'lat: 25.5941,\n      lng: 85.1376', // hardcoded member coords
    ]) {
      expect(src, `daily page still contains ${banned}`).not.toContain(banned);
    }
    expect(src).toContain('daily-empty-state');
    expect(/no fabricated demo profiles/i.test(src)).toBe(true);
    expect(src).toContain('searchCities(newMemberCity)');
    expect(src).toContain('no location is assumed');
    expect(src).toContain('member-form-error');
  });
});

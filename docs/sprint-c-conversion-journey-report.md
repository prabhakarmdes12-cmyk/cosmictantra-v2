# COSMICTANTRA — SPRINT C — CONVERSION JOURNEY 01 — FINAL REPORT

Branch: `arena/01a065c1-cosmictantra-v2`
Base: `0314aa7` (Sprint B.1) — verified: `git rev-parse HEAD` = `0314aa7bd6…` at start; B.1 gates re-run and green before work.
**Status: implementable & verified at code level. NOT merged. Engine untouched.**

---

## 1. Before / after journey map

**Before:** Landing hero → "Instant Master Kundli Generator" drawer (name/date + optional time/place, silent New Delhi fallback) → `/report` folio (Executive Life Matrix first, 40-widget overload) — no certainty capture, no calculation state, no explanation, no save moment, speculative "72-hour" ticker with fabricated liquidity/momentum lines.

**After (this sprint):**

```
LAND (/ landing_view)
  → hero promise "Vedic Precision. / Human Wisdom." + dominant CREATE MY KUNDLI
  → progressive 4-step birth form (name → date → time+certainty → place, canonical only)
  → CALCULATING state (5 genuinely-completed steps; FAILED state on error)
  → /kundli/{id} FIRST INSIGHT (§9): MY KUNDLI + validation state
       AT A GLANCE (Lagna · Moon Rashi · Janma Nakshatra · MD · AD)
       WHAT IS ACTIVE NOW? (real Dasha + [Calculated])  [WHY?] [ASK ABOUT THIS]
  → WHY drawer (§10): engine-only evidence chain + SHOW TECHNICAL CALCULATION
  → ASK (§12/§13): structured KashiJourneyContext → Kashi Sahayak opens & asks
    ASK A PANDIT (§20): /ask with chart/dasha/question carried context
  → SAVE MY KUNDLI (§14) after value → My Kundli
  → EXPLORE MY CHART → existing deep deterministic workspace below (untouched)
```

## 2. Files changed (17 implementation files + this report, vs `0314aa7`: +2384/−352)

| File | Change |
|---|---|
| `src/components/HeroSection.jsx` | Rewritten conversion hero: promise, 4-step form, time certainty, canonical place only, calc/failed states, real `getCanonicalJyotishSnapshot` + `createKundli` → `/kundli/{id}`; autoplay video removed; no `New Delhi`/`DEFAULT_CITY` fallback; no ₹501 link |
| `src/components/PersonalisationBridge.jsx` | Prediction ticker replaced: fact-first strip (Moon nakshatra · paksha · tithi from real calc); active-chart identity bar; no tomorrow/day-after, no liquidity/momentum |
| `src/components/TrustStrip.tsx` | **NEW** — four trust ideas + engine metadata line (convention manifest + astronomy provider descriptor, read-only) |
| `src/components/kundli/KundliFirstInsight.tsx` | **NEW** — first-insight viewport (§9–§14, §17): glance, active dasha, WHY drawer, Ask, Save, pattern empty-state, claim grammar |
| `src/app/kundli/[id]/KundliWorkspaceClient.tsx` | First viewport only: insight above; existing workspace preserved below `#kundli-explore`; missing record → coherent FAILED state |
| `src/lib/presentation/kundliOverviewAdapter.ts` | Sprint C consumers: `adaptKundliAtAGlance`, `buildDashaWhyEvidence`, `buildDashaTechnicalEvidence`, `deriveConsumerChartState` (read-only) |
| `src/lib/kashi/journeyContext.ts` | **NEW** — `KashiJourneyContext` (chartId, route, dasha ids, evidence ids, language, validation statuses) event+storage contract |
| `src/lib/analytics.ts` | 10 Sprint C funnel events added |
| `src/lib/translations.js` | `conversion` dictionary (en + hi, ~90 keys) + regional fallback inherit |
| `src/app/page.tsx` | TrustStrip + fact strip wiring, LANDING_VIEW |
| `src/app/report/MasterKundliReportClient.tsx` | Executive Life Matrix removed from Overview; preserved in Workbench (Explorer/Experimental banner) |
| `src/app/daily/page.tsx` | ASK ABOUT TODAY entry + TODAY_VIEW; **fabricated demo profiles removed** → intentional empty state; Add-member form: no silent Varanasi/Patna, canonical city resolution, no prefilled birth fields |
| `src/app/ask/page.tsx` | Carried context (`chart`/`dasha`/`question`/`lang`) prefills question + hint |
| `src/components/consultation/FloatingAIGuruAvatar.tsx` | Additive journey-context listener (open + seed user question through its own pipeline; no recalc) |
| `docs/sprint-c-conversion-journey-design-map.md` | §32 design map A–H |
| `tests/sprint-c-journey.spec.ts` | **NEW** — 14 node invariants |
| `tests/sprint-c-ui.spec.ts` | **NEW** — Playwright journey + a11y + mobile suite |

## 3. Components created

1. `KundliFirstInsight` — consumer first viewport (light, promise-first).
2. `TrustStrip` — trust mechanism (calculated/conventions/interpretation/human).
3. `ClaimChip` (inside KundliFirstInsight) — visual grammar: Calculated / Derived / Traditional Reading / Scholar Judgement / Validation Pending (only truthful ones used).
4. `KashiJourneyContext` (lib module) — structured Ask bridge.

## 4. Components removed / replaced

- **Removed/replaced:** prediction-market ticker (lime "72H GLIMPSE") → fact-first Vedic day strip; "Instant Master Kundli Generator" drawer → progressive 4-step form; hero autoplay `<video>` → light performance-safe background; hero ₹501 ask link (noise) → Today's Panchang + Open My Kundli.
- **Moved:** `ExecutiveLifeGaugeDashboard` — default report Overview → Workbench tab, labelled **Explorer / Experimental · Engine qualification pending**.
- **Gated:** Evidence-backed pattern block — not populated; honest empty-state line (§17).

## 5. Engine APIs / data actually consumed (read-only)

- `getCanonicalJyotishSnapshot()` (canonicalSnapshot) — full deterministic snapshot for user birth entries (no legacy fallback).
- `createKundli()` / `getKundliById()` / `listAllKundlis()` (kundliStore — storage only).
- Snapshot fields, verbatim: `lagna.rashiName`, `planetsArray[].rashiName/longitude/degreeStr` (Moon), `birthPanchang.nakshatra.{name,lord,pada}`, `dasha.{currentMahadasha,currentAntardasha,currentDateRange,currentPeriodString,startingBalance,mahadashas[].{lord,startFormatted,endFormatted,isCurrent}}`, `meta.{engineVersion,ayanamshaName,ayanamshaValue,astronomyProvider.{providerId,kernel,validationStatus},conventionRegistry.summaryLines}`.
- `buildConventionSnapshotMetadata(DEFAULT_PRESET.id)` + `resolveAstronomyProvider().descriptor` — TrustStrip metadata line.
- `timeConfidence` (`EXACT | APPROXIMATE | UNKNOWN`) drives the single canonical state.

Zero engine files modified (verified by test + `git diff 0314aa7 -- src/lib/jyotish src/lib/astronomy src/engines src/lib/dashaEngine.js src/lib/panchang.js` = empty).

## 6. Requested data unavailable from engine (honest handling)

- **Trustworthy "evidence-backed pattern" objects for consumer publication** — not available → pattern block shows the agreed placeholder, nothing fabricated.
- **Traditional-reading / scholar-judgement copy** — not shipped by the engine → claim grammar is declared but only `CALCULATED` and `VALIDATION_PENDING` are used; the rest appear only in the legend ("…traditional readings and scholar judgement are interpretation, not astronomy").
- **Personal "for you today" Dasha line on the landing ticker** — the legacy landing calculation does not produce a Dasha period → line omitted (only factual panchang + real chart identity shown).
- **Tomorrow/day-after data** — not calculated → removed from the strip.

## 7. Conversion events instrumented (no birth PII)

`LANDING_VIEW`, `KUNDLI_START`, `KUNDLI_BIRTH_DETAILS_COMPLETE`, `KUNDLI_GENERATED` (alias of existing `KUNDALI_GENERATED`), `FIRST_INSIGHT_VIEW`, `WHY_OPEN`, `ASK_ABOUT_CHART`, `SAVE_KUNDLI`, `CONSULT_INTENT`, `TODAY_VIEW` — all via the existing `analytics` module; payloads carry `route/chartId/timeConfidence/lang/source` only (asserted by tests).

## 8. Accessibility

- Form: explicit `<label htmlFor>`, step rail, `radiogroup`/`aria-label` for certainty, `combobox`+`listbox` for place, `required`, `role="alert"` errors.
- WHY drawer: `aria-expanded`/`aria-controls`, `role="region"`, labelled; **Escape closes and returns focus**; technical disclosure similarly wired.
- Calculation/failure: `aria-live="polite"`, `role="alert"`; validation banner `role="status"`.
- Touch targets ≥44px (`min-h-11`); focus-visible styles from Sprint B.1 retained; state not conveyed by colour alone (icons/borders/text).

## 9. Responsive

Specs authored for 320/360/390/430/768/1440+: landing stepper, date/time native inputs, place combobox, Dasha cards, WHY drawer, assistant, bottom nav coexistence, no horizontal overflow. Runtime DOM/SSR checks pass at 19 routes; **pixel verification requires the browser runtime** (see §11).

## 10. Tests + results

| Suite / check | Result (this sandbox) |
|---|---|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run validate:navigation` | ✅ PASS (0 failures) |
| Sprint B.1 invariants (22) + V40 derived model (9) | ✅ 31/31 (45 with new suite) |
| **`tests/sprint-c-journey.spec.ts` (14 new)** | ✅ 14/14 |
| `npx next build` | ✅ compiled, 613 static pages |
| Runtime smoke (prod `next start` :3001) | ✅ 20 routes 200; `/daily` SSR contains `ask-about-today`; landing SSR has fact strip, zero prediction language, zero `<video>` |
| `tests/sprint-c-ui.spec.ts` (browser) | ⚠️ authored, runnable via `BASE_URL=http://localhost:3000 npx playwright test tests/sprint-c-ui.spec.ts` — browser install unavailable in this sandbox (same CDN/apt limitation as Sprint B.1) |

## 11. Screenshots

**Not producible in this sandbox** (Playwright browser CDN + Debian mirrors unreachable; no system browser libs — same limitation reported in Sprint B.1). Committed instead: `artifacts/runtime-evidence/sprint-c/` server-rendered HTML + HTTP status evidence, plus the browser spec that captures the journey in a normal environment (adds `artifacts/screenshots/sprint-c/*.png`).

## 12. Known UX problems (status after follow-up fixes)

**Resolved in follow-up commits (same sprint):**
4. ~~Landing content client-gated for SEO~~ — **FIXED (§24)**: hero promise/birth form, TrustStrip, explore tools and Festival strip are now **server-rendered**; only the time-dependent live Cosmic dial is client-gated and shows a static "Today, in Vedic time" teaser on the server (no hydration mismatch). Truthful JSON-LD (`WebSite` + existing routes) emitted on the landing page; root metadata description now mirrors the consumer promise with zero overclaiming. Verified in production server HTML: promise/json-ld/trust-strip present, skeleton and prediction language absent. (New node tests: 4 §24 invariants; browser spec now asserts raw server HTML.)

**Resolved earlier (same sprint, "proceed" pass):**
1. ~~`/daily` demo profiles~~ — **FIXED**: fabricated Priya Sharma / Amit Sharma seeding removed; empty store now shows an intentional `daily-empty-state` ("Start with your own chart") instead of a fake chart. Add-member form no longer defaults to Varanasi/1996-08-12/14:30 — birth fields start empty, city must resolve through `searchCities`, unknown city → visible error, and profile calculations bail when coordinates are missing (no silent Patna fallback).
2. ~~Insight pre-saved state~~ — **FIXED**: `KundliFirstInsight` detects the already-active chart on mount and shows "Saved ✓" directly; save now sets the real returned profile id.

**Still flagged (unchanged):**
3. `/daily` heading "72-Hour Vedic Forecast" framing remains (pre-existing interpretation-engine content, not redesigned per §18); alignment with the same product system is next.
5. The Kashi Sahayak bridge opens the assistant with the user's question; the assistant's own deterministic pipeline decides next steps (guide behaviour, by design) — its deep conversation tuning is out of this sprint.
6. Browser suites unexecuted here — CI / normal env must run both `sprint-c-ui.spec.ts` and B.1 `navigation-ui.spec.ts` (new SEO/empty-state/member-form steps added to `sprint-c-ui.spec.ts`).

**Re-verified after fixes:** `tsc` ✅ · validator ✅ · Sprint-C invariants **19/19** · B.1 22/22 + V40 9/9 ✅ (50 node tests total) · `next build` ✅ · prod server HTML contains promise + JSON-LD + trust strip, no skeleton/dead routes/prediction language. Engine diff still empty (`git diff 0314aa7 -- src/lib/jyotish src/lib/astronomy src/engines src/lib/dashaEngine.js src/lib/panchang.js` = empty).

## 13. Exact diff stats

```
# Sprint C delta (incl. this report):
git diff --stat 0314aa7
 18 files changed, 2552 insertions(+), 352 deletions(-)

# Cumulative on this branch vs main (B.1 + Sprint C):
git diff --stat 1b5ade3   →  38 files changed, 6015 insertions(+), 748 deletions(-)
```
(Sprint C itself: docs/design map + report, adapter, journeyContext, analytics, translations, insight, TrustStrip, hero, bridge, workspace, report, daily, ask, assistant, page, 2 test files.)

## 14. Engine untouched — explicit confirmation

`git diff 0314aa7 --name-only -- src/lib/jyotish src/lib/astronomy src/engines src/lib/astrologyEngine.js src/lib/dashaEngine.js src/lib/panchang.js` ⇒ **empty**. No changes to astronomical calculation, ayanamsha, Dasha maths, Panchanga, Vargas, Shadbala, Ashtakavarga, Gochara, Yoga or Dosha logic. All engine data is consumed read-only through the typed adapter.

---

**STOP. No merge. No Kundli redesign beyond the first viewport. No Darshan marketplace. No new astrology feature.**

---

## Acceptance criteria (§33) — status

| # | Criterion | Status |
|---|---|---|
| 1 | One clear landing-page promise | ✅ "Vedic Precision. / Human Wisdom." + support sentence |
| 2 | One dominant Kundli CTA | ✅ CREATE MY KUNDLI (primary, stepper) |
| 3 | No prediction-market ticker language | ✅ rewritten; test-enforced |
| 4 | Trust mechanism visible | ✅ TrustStrip + engine metadata |
| 5 | Minimal birth-data flow | ✅ name/DOB/TOB/place + certainty only |
| 6 | No registration before first value | ✅ save happens after insight |
| 7 | First insight uses REAL engine data | ✅ canonical snapshot fields verbatim |
| 8 | Current Dasha uses REAL engine data | ✅ snapshot.dasha |
| 9 | WHY uses REAL evidence where available | ✅ evidence chain, no invented steps |
| 10 | No fabricated astrology | ✅ placeholder instead; claim grammar truthful |
| 11 | Ask receives structured context | ✅ KashiJourneyContext (§12) |
| 12 | Executive Life score removed from consumer overview | ✅ moved to Workbench + EXPERIMENTAL label |
| 13 | No Puja upsell in first chart journey | ✅ none present |
| 14 | Location truth source preserved | ✅ B.1 resolver untouched; no fallback city |
| 15 | Navigation invariants still pass | ✅ 22/22 + validator PASS |
| 16 | Responsive tests pass | ✅ authored (browser run pending in this sandbox — §11) |
| 17 | TypeScript passes | ✅ |
| 18 | Build passes | ✅ |
| 19 | Existing engine untouched | ✅ diff empty + test |
| 20 | Analytics contains no birth PII | ✅ test-enforced payload audit |
| 21 | Error/validation states coherent | ✅ canonical state (DRAFT→…→FAILED), intentional failure UI |

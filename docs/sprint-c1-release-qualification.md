# SPRINT C.1 — RELEASE QUALIFICATION REPORT

Qualification sprint for the completed Sprint C conversion journey.
Branch `arena/01a065c1-cosmictantra-v2`. No astrology engine code was edited.
Per Sprint C.1 §26 this report ends with exactly one recommendation and the
work stops there. No automatic merge was performed.

---

## 1. Base commits confirmed

- Branch: `arena/01a065c1-cosmictantra-v2`
- Working HEAD at qualification: `2f6aa6c` (contains the Sprint C §24 SEO work)
- `git merge-base --is-ancestor 0314aa7 HEAD` → **OK** (B.1 base)
- `git merge-base --is-ancestor 9b6a088 HEAD` → **OK** (Sprint C base)
- PR: #5 vs `main` (`1b5ade3`) — open, never merged, not merged by this work.

## 2. Demo contamination removed (CT_UX_INV_003)

| Surface | Before | After |
|---|---|---|
| `/daily` | header "Active Member … Patna" when no profile | neutral `daily-no-member` ("Personalize today's guidance") |
| `/dashboard` | seeded "Priya Sharma CT-4821" profile | neutral Create Profile CTA (no fake user) |
| `/family-panchang` | seeded + PERSISTED Priya/Amit/Aarav, always showed family data | neutral `family-empty-state`; engine call guarded |
| `/profile` | seeded प्रिया शर्मा profile; fake order history (#CT-SAMAGRI-8821, #CT-PUJA-4019); identity card hardcoded "PRIMARY COSMIC ID CT-7708", "+91 98765 43210 (Verified)" | no seeding; `orders-empty-state` "No orders yet"; identity card shows `—` / "Not set" with no Verified claim |
| `/family` | demo Cosmic ID card ("Priya Sharma & Family", fake phone/CT-4821) | neutral "Your family Cosmic ID appears here" placeholder |
| `/calendar`, `/my-calendar` | AuraMonthlyCalendar seeded Priya/Amit/Aarav; silent Patna default city | no seeding; `calendar-city-prompt` when no city chosen |
| `FamilyManager` form | prefilled Patna + 25.594/85.137 + noon time | empty until user chooses; city required; error surfaced |
| Landing panchang | computed for DEFAULT_CITY (Dhanbad) even with no known location | `panchangData` stays null until canonical resolver returns a known city |
| `TodayAtAGlance` | fabricated fallbacks: Ekadashi, Rohini, Siddha, Bava, Waxing Moon, pada 1, 75% illumination, sun 133° | absent engine values render '—' / are omitted |
| `DailyCosmicCard` | fabricated score 75, "Moon in Vrishabha", fake tara/nakshatra/tithi/dasha, hardcoded narratives, fake 11:45–12:35 / 15:00–16:30 windows, fake mantra | engine values only; no fabricated score (gauge hidden); '—' and "Traditional reading unavailable" |
| `/morning-digest` | marked RETENTION FEATURE preview with Priya | additional explicit `sample-preview-banner` (mock, not your data) |

Remaining demo content lives only in engine-kernel benchmark presets (explicit
reference URLs) and in **unlinked/dead** components (`KundaliExperience.jsx`,
`MyDaysPanchang`, `ShareableCard`, `VedicDayRibbon` hardcode Dhanbad coords;
`FinalChapterCta.jsx` unused). See §15 engine blockers.

## 3. Prediction / forecast language changed

- `/daily` heading: `72-Hour Vedic Forecast (आज • कल • परसों)` → **"Your Next Three Vedic Days (आज • कल • परसों)"**
- `/daily` tab: `📅 Daily (72 Hours)` → `📅 Upcoming 3 Days`
- `/daily` eyebrow: `PARIVAAR INTELLIGENCE & FORECAST` → `PARIVAAR PANCHANG`
- Weekly score, monthly ARTHA/SAMBANDH windows and DailyCosmicCard gauge now carry an explicit **"Traditional reading"** label; monthly windows no longer say `BEST`
- Weekly matrix caption: "Traditional reading — day weights are interpretive, not verified facts."
- `/dashboard` "Open Full Forecast" → "Open Today's Panchang"; `/pandit-ji` "View Daily Forecast" → "View Today's Panchang"; WhatsApp share "Daily Forecast" → "Vedic Panchang"
- Sweep of `src/app` + `src/components` (this qualification, post-build): no remaining "72-hour forecast", "72h Forecast", "72h Horoscopes", "financial momentum", "deal momentum", "career opportunity", "high liquidity", "prediction signal", "Daily Forecast" in live consumer copy.
  - Fixed this pass: `/profile` "72h forecast" copy; `/family-panchang` "View 72h Forecast →" → "View Three-Day Panchang →"; PWA install copy "Access 72h Horoscopes…" → Panchang/observatory wording; `routeRegistry` `/daily` title "Daily Vedic Weather & Forecast" → "Daily Vedic Panchang (Three Days)" (breadcrumb "Daily Forecast" → "Daily Panchang").
  - Remaining occurrences are in the engine kernel comment (`interpretationEngine.ts`, zero-edit per §23) and the unlinked `Navigation.jsx` (dead component, P2).

## 4. Chart status state machine (§5)

- Canonical module: `src/lib/kundli/chartStateMachine.ts`
- Status axis: `DRAFT → INPUT_INCOMPLETE → CALCULATING → CALCULATED → VALIDATION_PENDING → READY` (+ `FAILED` terminal)
- Documented: `docs/product/chart-state-machine.md`
- UI derives presentation from `deriveConsumerChartState` (read-only adapter, unchanged engine mapping: `INTERNALLY_VERIFIED`/`VALIDATED` trusted) + `normalizeChartStatus`

## 5. Persistence state machine (§4)

- `EPHEMERAL → SAVING → SAVED | SAVE_FAILED` implemented in `KundliFirstInsight.tsx`
- Wording: "YOUR KUNDLI IS READY" → [SAVE MY KUNDLI] → "Saving…" → "SAVED TO MY SPACE ✓"; failure shows calm `save-failed` alert + retry; never "saved" before persistence succeeds
- Contradictions forbidden (`combineChartStates`): FAILED+SAVED/SAVING, DRAFT+SAVED; FAILED stays EPHEMERAL
- Pre-saved detection now sets `SAVED` from the returned profile id; save requires a real created profile
- **Defect found by the browser gate and fixed this pass:** the hero journey called `createKundli()` AND wrote `cosmictantra_active_kundli` + `upsertProfile()`/`setActiveProfileId()` during generation, so the First Insight immediately showed "SAVED TO MY SPACE ✓" before the user ever clicked Save — a direct contradiction of §4. `HeroSection` now only creates the workspace record; the chart stays EPHEMERAL until the user explicitly saves. Re-tested green in the real browser (persistence suite: SAVE_FAILED → retry → SAVED).

## 6. Browser test environment

- **No pre-existing CI**: `.github/workflows/` absent, `gh workflow list` empty, Actions REST API 404.
- Created in-repo: `.github/workflows/browser-acceptance.yml`
  - `npm ci`, `npx playwright install --with-deps chromium`
  - TypeScript gate, node invariant suites, navigation validator, `next build`
  - prod server start (`next start -p 3000`), health/readiness probe
  - `tests/navigation-ui.spec.ts`, `tests/sprint-c-ui.spec.ts`, **`tests/sprint-c1-ui.spec.ts`**
  - failure artifacts + screenshots upload (`test-results/`, server log)
- No external production deployment prerequisite.
- Execution environment used for this qualification: production server (`next build` + `next start -p 3000` on 0.0.0.0) and a real Chromium 132 (`@sparticuz/chromium` binary launched headless via Playwright CDP with `--no-zygote`; `playwright.config.ts` wires `CHROMIUM_PATH`/`CHROMIUM_LD_LIBRARY_PATH`).

## 7. Browser results

**EXECUTED — real browser, production build. All three suites green.**

| Suite | Result | Duration |
|---|---|---|
| `tests/navigation-ui.spec.ts` | **21 passed / 0 failed** | ~22 s |
| `tests/sprint-c-ui.spec.ts` | **11 passed / 0 failed** | ~18 s |
| `tests/sprint-c1-ui.spec.ts` | **9 passed / 0 failed** (incl. GPS allowed/denied §10) | ~56 s (combined) |
| **Total** | **41 / 41** | — |

Command used (all runs, three executions):
`CHROMIUM_PATH=/tmp/chromium CHROMIUM_LD_LIBRARY_PATH=/tmp BASE_URL=http://localhost:3000 npx playwright test <suite>`

Coverage actually exercised (not just authored):
- Desktop nav (5 destinations, dead-link absence), keyboard focus + Enter, Escape / outside click, language selector → Hindi, location pill truth, Kashi context attributes; mobile bottom nav at 320/360/390/430/768 + Explore sheet + assistant collision; route overflow at landing/today/dashboard/master-kundli/report; landing mega menu; screen captures.
- Sprint C conversion journey end-to-end: hero form (name/date/time/certainty/city search) → calculation state → First Insight → WHY drawer (technical details, Escape + focus return) → Ask (live `cosmictantra:kashi-journey-context` payload inspected for forbidden keys) → Save → "SAVED TO MY SPACE ✓" → Explore anchor; preset chart (no save CTA); missing chart FAILED state; Today empty state ("no demo chart") + member-form real-city error; Executive Life Matrix absent from default report Overview and present only in Workbench with the experimental badge; hero truthiness (no day strip until a canonical location is chosen; factual strip after choosing Patna — "Moon Krittika · Krishna Paksha Saptami", no prediction language, no video, no horizontal overflow at 1440).
- C.1: 8 required viewports (320×700 → 1920×1080) landing overflow-free + captured; journey state captures (birth flow / calculation / first insight / WHY / Ask) at 390; persistence save-failure → retry → saved; UNKNOWN time limitation note + "reference only" Lagna; demo-contamination sweep (dashboard, family-panchang, family, profile) with no "Priya Sharma"/"Amit Sharma" anywhere; **GPS allowed** (truthful "Live GPS Location" anchor, no fake city, journey completes) and **GPS denied** (explicit "Location permission was not granted." + manual canonical city fallback completes).

Real-browser defects found and fixed this pass (not test-only adjustments):
1. Hydration race on interactive shell nav (desktop + mobile) — gates `data-nav-hydrated` on `PrimaryNavigation`, `data-header-hydrated` on `GlobalHeader` (4 variants incl. landing).
2. Hydration race on hero progressive form, `/daily` add-member flow, `/report` tab switch — `data-hero-hydrated` / `data-daily-hydrated` / `data-report-hydrated` + test gates.
3. **§4 contradiction**: hero journey auto-persisted the chart + profile before the user clicked Save (see §5) — fixed.
4. Stale selectors in authored suites (hero CTA now the progressive form; Workbench is `role=tab`; `primary-nav-mobile` is CSS-hidden by design; member form uses native `required` validation; profile Orders tab is Hindi-labelled) — corrected to reflect shipped product, and the suites re-run green.
5. **City-search ranking bug (real, user-facing):** `src/lib/cities.js` — the copy webpack actually bundles — and its typed twin `src/lib/cities.ts` had diverged: typing "Patna" returned Machilipatnam, Visakhapatnam, **then** Patna, so the manual birth-place path silently picked the wrong city. Fixed ranking in both twins (exact match → name-prefix → substring) and verified in the served bundle (`startsWith` present, "Patna" first) and in-browser.

Suite-level notes: hydration gates wait up to 15 s for `data-*-hydrated="true"`; no test was skipped, xfailed or retried into green.

## 8. Screenshot artifact locations

- `artifacts/screenshots/c1/` (captured by `tests/sprint-c1-ui.spec.ts`, all verified on disk):
  - landing-320x700 / 360x800 / 390x844 / 430x932 / 768x1024 / 1024x768 / 1440x900 / 1920x1080
  - birth-flow-390, calculation-390, first-insight-390, why-drawer-390, ask-state-390
  - today-360, desktop-landing-1440, mobile-nav-360, desktop-explore-1440
- `artifacts/screenshots/` (captured by `tests/navigation-ui.spec.ts`): desktop-landing, desktop-master-kundli, desktop-today, tablet-today, mobile-390-today, mobile-390-landing.
- SSR evidence `artifacts/runtime-evidence/sprint-c1/` — landing, daily, dashboard, family-panchang, family, profile, kundli workspace HTML (all 200):
  - landing contains "Set location" prompt, no "Today in Vedic time" strip before location, no Dhanbad/demo data
  - daily contains "Your Next Three Vedic Days" + "PARIVAAR PANCHANG", no 72-hour language, no "Daily Forecast" breadcrumb
  - dashboard/family-panchang/family show neutral states; profile shows neither fake user, fake orders nor fabricated identity (phone/CT-7708 removed)

## 9. Responsive & visual acceptance (§7–§8)

- Required viewport matrix implemented and **executed**: landing has no horizontal overflow at 320/360/390/430/768/1024/1440/1920; First Insight no overflow at 320/390/430/768; Today no overflow at 360/390; insight no overflow for the UNKNOWN-time (noon) case at 390.
- Mobile Kundli generation at 390 (name / date / time / certainty / city search / Next / Back / submit / calculation state / first result) — full journey executed with no horizontal movement; findability of the primary CTA at all widths asserted (`#kundli-name` visible).
- Location UX executed in-browser: GPS allowed → truthful live anchor (never a silently substituted city); GPS denied → calm explicit message; manual city search → exact city now ranks first and the journey completes with the chosen coordinates.
- No restyling was performed; only genuine interaction-race fixes (#7) and truthful copy/identity fixes (#2, #3, #13).

## 10. Accessibility results (§20)

Browser-verified green:
- WHY drawer: opens (mouse + keyboard Enter), closes on Escape, focus returns to the trigger (asserted in both `sprint-c-ui` and `navigation-ui`).
- Right-column interactive nav: Tab/Shift-Tab focus visible, Enter opens Explore menu, Escape closes.
- Form errors: `role="alert"` `#kundli-form-error` + `aria-describedby` + `aria-invalid` on all four hero inputs (code + a11y tests); city list box `combobox`/`option` semantics; `min-h-11` (≥44px) controls; `aria-live` calculation state.
- Remaining: no automated axe suite (no suitable existing dependency; not adding per §20) — manual/scripted checks above instead.

## 11. Analytics privacy audit (§14)

- Runtime boundary guard in `src/lib/analytics.ts` (`auditAnalyticsPayloadKeys`): forbidden keys → event **dropped**, never stored/sent. All 10 funnel events audited (payloads carry only source/route/chartId/timeConfidence/validationState/evidenceCount/dasha/lang/city-resolver fields).
- Schema tests (`tests/sprint-c1-privacy.spec.ts`): funnel schema pass, forbidden-key detection, runtime drop, exact-coordinate detection — green.
- Browser-level verification: the live Ask journey context was captured and asserted free of `personName`, `birthDate`, `birthTime`, `latitude`, `longitude`, `locationName`.

## 12. Ask-context privacy audit (CT_PRIV_INV_001, §13)

- `dispatchKashiJourneyContext` payload = contractVersion, route, chartId, dasha names + periodString, evidenceIds (why textKeys), question, language, validationStatuses, source. No full name, raw birth date/time, birthplace, phone or email. Static + live-browser tests assert the payload.

## 13. Trust-copy audit (§15)

- "Vedic Precision" retained as brand positioning (allowed).
- Softened/fixed overclaims this pass: "Practitioner Verified" → "Kashi Sahayak Practitioners" (TrustBar); profile identity "(Verified)" + fabricated phone removed; "Birthplace Coordinates Verified" → "(canonical resolver)"; Explorer label exactly `EXPERIMENTAL / NOT FOR AUTHORITATIVE INTERPRETATION`; no "Verified/Scientific/Guaranteed/authentic" claims on modified consumer pages.
- Executive Life Matrix absent from default report Overview; only in the labelled Experimental Explorer surface (§19).

## 14. Performance observations (§21)

- First Load JS: `/` 962 kB, `/daily` 888 kB, `/kundli/[id]` 330 kB (client-side jyotish kernel in the birth form — P2 candidate, not regressed this sprint).
- Landing computes no panchang until a known canonical location (no default-city work).
- Google Fonts CSS `@import` render-blocking (pre-existing, P2). Autoplay video remains removed from the conversion journey (browser-asserted `video` count 0); YouTube surfaces on `/aarti-stotra`/`/darshan` are out of C.1 scope.

## 15. Engine blockers (ZERO engine edits made)

| ID | Engine input/behavior | Expected UI requirement | Actual output | Evidence |
|---|---|---|---|---|
| ENGINE_BLOCKER_001 | `getFamilyCollectiveForecast([])` in `interpretationEngine.ts` (~line 557) | never present demo data as user's | substitutes `Priya Sharma 1995-06-15` internally | grep engine line; all consumer callers guard (`daily`, `family-panchang`) |
| ENGINE_BLOCKER_002 | `calculatePanchang(date, city)` default (`panchang.js` line ~160) | never silent Dhanbad | defaults to Dhanbad when city omitted | engine default; consumers no longer call with null city |

Neither was repaired (Sprint C.1 §23). Both are neutralized at the consumer layer. Engine diff across `src/lib/jyotish`, `src/lib/astronomy`, `src/lib/dashaEngine.js`, `src/lib/panchang.js`, `src/engines` = **zero**.

## 16. Remaining P0

None identified in code, data paths or runtime.

## 17. Remaining P1

None. (The single previously-recorded P1 — browser acceptance not executed — is resolved: all three browser suites ran against the production build in a real Chromium and passed 39/39.)

Repo-ops note (not a product defect): GitHub Actions is not enabled on this repository (workflows API 404), so `browser-acceptance.yml` has not been triggered on a GitHub runner. The identical command sequence was executed locally and is green; enabling Actions and running the workflow is the recommended pre-merge double-check, but does not block qualification because the suites actually executed and passed here.

## 18. Remaining P2

1. Landing First Load JS 962 kB (client jyotish kernel in the birth form).
2. Google Fonts CSS `@import` render-blocking; consider `next/font` self-hosting.
3. Dead/unlinked components still hardcode demo data / Dhanbad coords (`KundaliExperience.jsx`, `MyDaysPanchang.tsx`, `ShareableCard.tsx`, `VedicDayRibbon.tsx`, `FinalChapterCta.jsx`, legacy `Navigation.jsx` "72h Forecast") — remove or wire to canonical resolvers in a future sprint.
4. `/morning-digest` remains a marked sample preview by design.
5. Automated axe/ARIA audit not added (no suitable existing dependency).
6. `vikramSamvat = year + 57` static fallback label in `TodayAtAGlance.jsx` (display-only; engine Samvat preferred in a future sprint).

## 19. Exact diff

- 29 tracked files modified (+588/−360 incl. this pass) plus new files:
  - `.github/workflows/browser-acceptance.yml`
  - `docs/product/chart-state-machine.md`
  - `docs/sprint-c1-release-qualification.md`
  - `src/lib/invariants/sprintC1.ts`
  - `src/lib/kundli/chartStateMachine.ts`
  - `tests/sprint-c1-state-machine.spec.ts`
  - `tests/sprint-c1-privacy.spec.ts`
  - `tests/sprint-c1-ui.spec.ts`
- Modified this pass (on top of the Sprint C.1 work): `src/app/profile/page.tsx` (fake identity removed, hydration gate), `src/app/daily/page.tsx` (hydration gate), `src/app/report/MasterKundliReportClient.tsx` (hydration gate), `src/components/HeroSection.jsx` (EPHEMERAL persistence, hydration gate), `src/components/layout/GlobalHeader.tsx` (hydration gate, 4 variants), `src/components/layout/PrimaryNavigation.tsx` (hydration gate), `src/components/pwa/PwaRegister.tsx`, `src/components/visual/TrustBar.tsx`, `src/app/family-panchang/page.tsx` ("View Three-Day Panchang"), `src/lib/routeRegistry.ts` (truthful `/daily` title/breadcrumb), `playwright.config.ts`, `tests/navigation-ui.spec.ts`, `tests/sprint-c-ui.spec.ts`, `tests/sprint-c1-ui.spec.ts`.
- **Zero** changes under `src/lib/jyotish/`, `src/lib/astronomy/`, `src/lib/dashaEngine.js`, `src/lib/panchang.js`, `src/engines/` (verified via `git diff --stat` path filtering).

## 20. Merge recommendation

**MERGE_READY**

- Base confirmed (`9b6a088` ancestor of HEAD `2f6aa6c`; PR #5 open, not merged).
- Demo astrology removed from every consumer surface; demo data only in explicitly marked/benchmark surfaces.
- Prediction-market language removed; deterministic facts separated from "Traditional reading".
- Chart status + persistence state machines implemented (`docs/product/chart-state-machine.md`), contradictions forbidden, and the run-time EPHEMERAL→SAVE contradiction found by the real browser was fixed.
- Browser acceptance gates actually executed in a real Chromium against the production build: 41/41 green (navigation 21, Sprint C 11, C.1 9) with screenshots and runtime evidence.
- Node gates green: tsc clean, `validate:navigation` PASS, 70/70 invariant suites (B.1 navigation 22, Sprint C journey 19, derived-model 9, C.1 state machine 12, C.1 privacy 8); production build green (613 pages).
- Zero engine changes; ENGINE_BLOCKER_001/002 recorded, not repaired.
- No sensitive analytics keys in any funnel event or Ask context (runtime guard + schema + live-browser checks).
- No contradictory chart states remain; no P0; no unresolved P1.

No automatic merge was performed. After review, `arena/01a065c1-cosmictantra-v2` (PR #5) is safe to merge; enabling GitHub Actions is recommended so `browser-acceptance.yml` runs as the standing gate on future branches.

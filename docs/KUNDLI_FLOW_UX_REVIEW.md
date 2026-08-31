# Kundli Flow — UX Review vs. 30 Years of Kundli Software

**Date:** 30 August 2026 · **Scope:** the Kundli user journey (birth-details entry → chart/report → PDF/consultation), compared against the conventions established by kundli software from 1995→2026, with prioritized improvement suggestions mapped to current components.

## Implementation status (P0 + P1 core + P1-8 + Ganesh/format + cross-check — implemented 31 Aug 2026)

| Item | Status | Where |
|---|---|---|
| P0-1 city autocomplete + "Use my location" + live validation | ✅ | `MasterKundliReportClient.tsx` modal (`searchCities`, `navigator.geolocation`, `validateLive`) |
| P0-2 Kundli-at-a-glance card | ✅ | `MasterKundliReportClient.tsx` (Lagna, Moon Rashi, Nakshatra, Tithi, Manglik, Current Dasha, birth balance) |
| P0-3 header rename + demo chip + /ask empty placeholders | ✅ | `GlobalHeader.tsx` ("My Kundli"), demo chip in report header, `ask/page.tsx` (empty birth fields + "Try a sample birth" button) |
| P0-4 PDF filename `Kundli_<Name>_<dob>.pdf` + success meta | ✅ | download handler (`lastPdfMeta` shows pages · KB · quality PASS) |
| P1-5/7 Overview default view with progressive disclosure | ✅ | `activeTab` now `OVERVIEW` (default) / FOLIO / WORKBENCH; overview = glance card → D1 chart + current-period card → Vimshottari timeline → collapsible `<details>` interpretation highlights → PDF actions; SIMPLE/DETAILED/PANDIT switcher remains only inside the Book mode |
| P1-6 Vimshottari timeline slider | ✅ | `DashaTimeline` component: 9 proportional segments, ● NOW marker, tap a Mahadasha → antardasha chips (current highlighted), "back to current" reset |
| P1-10 Calculation standard on screen | ✅ | "How this Kundli was calculated" expander in Overview: sidereal zodiac, ayanamsha name + value, house system, node mode, ephemeris, engine version, Julian day |
| Client aligned to the gated pipeline API | ✅ | `generateKundliPdf(raw, { locale, onMetric })`; progress strip driven by real pipeline states; fail-safe codes via `KUNDLI_SAFE_MESSAGES` |
| P1-8 Tappable planets → deterministic detail sheet | ✅ | `NorthIndianChart.tsx` (`onPlanetClick(planet, house)` + `selectedPlanet` ring, pointer cursor) wired in Overview D1, Folio D1 and Workbench chart; detail card shows rashi, degree, nakshatra+pada, house, dignity/retrograde, karaka, sidereal longitude — deterministic evidence only, no LLM |
| Ganesh Vandana opens the Kundli (display + PDF) | ✅ | Web: banner `॥ श्री गणेशाय नमः ॥` + `ganesh_vandana_256.png` emblem above every report mode. PDF: cover draws the 42 mm emblem + invocation in Devanagari (Latin fallback); Node renders it from disk via `renderAssets.ts` (no server fetch needed) |
| Established kundli format | ✅ | `reportModel.ts` section order: cover (Ganesh + invocation) → birth summary → D1 chart → panchanga → planetary positions → house positions → **Navamsha (D9)** → Vimshottari dasha → yogas/doshas → interpretations → calculation standard → appendix → disclaimer; D9 first row = Lagna |
| Famous-people cross-check | ✅ | `tests/incident/famous-kundli-crosscheck.spec.ts` + `docs/CELEBRITY_KUNDLI_CROSSCHECK.md`: Kohli 10/10, Modi 8/9, Sachin 9/10, Dhoni 9/10 placements match independently published kundlis to nakshatra/pada level; two source conflicts documented (Modi zodii tropical-vs-sidereal mixing; Sachin contested birth time) |
| Production build gate | ✅ | `next build` passes (610 static pages); `src/lib/db.ts` made lazy so Prisma no longer blocks page-data collection |

Verification: `tsc --noEmit` clean; `next build` passes (610/610 static pages); KUNDLI_INV_001–015 + smoke + famous-people cross-check + hindi artifact + pdf rasterization + legacy-render-sim (454-page reproduction) + trace suites all pass in Node (39 passed / 0 failed / 0 skipped); `/report` (incl. incident-shaped URL → fail-safe) renders 200 on the dev server. Browser suites now run in-sandbox with real Chromium (env-gated `playwright.config.ts`): browser-report 2/2, mobile-clickability 6/6, responsive 10/10, engine suites 13/13; mobile 390px sweep clean with client-side PDF download verified (6 pages, gates 1–4 passed, 315 KB).

**Latent pagination bug found & fixed during this batch** (`layoutEngine.ensureFits`): the controller created "phantom" pages (counter advanced without calling jsPDF `addPage`), so the delivered PDF could have fewer physical pages than the metrics claimed — the exact silent-degradation class the incident mission targets. Fixed by passing the physical page-creator through `ensureFits` (all 6 call sites); pdfExtract now also supplies pdfjs's base-14 fonts so the GATE-4 title/blank checks run on real extracted text instead of silently falling back to renderer-instrumented metrics. Remaining backlog: P1-9 continue-where-you-left-off + share links, P2 items.

Related docs: `UX-SIMPLIFICATION-AUDIT.md` (whole-product simplification, Sprint 1 done), `PARASHARA_LIGHT_PARITY_MATRIX.md` (feature parity), `ASTROSAGE_REPORT_COVERAGE_MATRIX.md` (report coverage). This review is specifically about **flow UX**, not feature count.

---

## 1. The current flow (as built)

```
Home (3 intents: Today / My Chart / Ask Expert)
  └─ /report  "Folios Archive" (global header link)
       ├─ URL params (name, dob, tob, city, lat, lng, tz) or DEMO_PROFILE fallback
       ├─ Edit birth details modal (name, date, time, city, lat, lng, tz)
       ├─ FOLIO (17-Volume Book, default)  ⇄  WORKBENCH (chart explorer)
       │    ├─ reading depth SIMPLE / DETAILED / PANDIT
       │    ├─ language EN / HI
       │    └─ graha / division / dasha selectors, yogas, remedies, gochar
       ├─ PDF download → qualified pipeline (GATEs 1–4) → READY_FOR_DELIVERY only
       │    └─ progress strip + fail-safe panel (safe message + reason code)
       └─ print / share
  └─ /ask  consultation booking (birth details prefilled 1995-06-15, 10:30, Varanasi)
  └─ /kundli/[id]  saved-kundli workspace (tabs: overview, charts, dasha, …)
  └─ /kundali-milan  compatibility
```

Strengths already present (keep, don't regress):
- **Deterministic engine + typed validation gates** — no silent wrong data; the fail-safe never shows stack traces.
- **Bilingual PDF** with real Devanagari fonts; concise ≤40-page artifact with page-limit and blank-page guards.
- **Calculation-standard transparency** in the PDF (ayanamsha, ephemeris, engine version) — rare even in pro tools.
- **Report IDs + fingerprint** lineage instead of raw PII in logs.

---

## 2. Thirty years of kundli software — the conventions each era set

### Era 1 — Desktop professional tools (1995–2008)
*Parashara's Light (GeoSynth), Jagannatha Hora, Astro-Vision (1984→), Kundli Chakra Pro, Kala, Shri Jyoti Star.*

What they got right (and users still expect):
1. **Chart-first screen.** The D1 chart is the home page; everything else is a tab away. A pandit opens the tool and sees the Lagna chart immediately.
2. **16-varga grid** one click away; D9/D10/D60 are first-class, not buried.
3. **One-screen density with tabs** (Positions / Dashas / Transits / Ashtakavarga / Yogas / Matching) — power users navigate by tab, not by scrolling 17 volumes.
4. **Vimshottari balance shown at birth** — "balance at birth: X yr of Y" is a trust marker; our pipeline computes it but the UI doesn't surface it.
5. **Print-oriented reports** (Astro-Vision pioneered Hindi/English "parichay patrika" booklets) — the deliverable is a printable book.
6. **Expert trust markers**: ephemeris citations, ayanamsha/house-system/nodes settings visible at all times.

Their failings (don't copy): steep learning curve, no guidance for lay users, forms with 30+ options before any output, no notion of "explain this to me simply".

### Era 2 — Consumer web (2008–2018)
*AstroSage, GaneshaSpeaks, AstroYogi, Prokerala, DrikPanchang, Clickastro.*

Conventions that trained the Indian consumer:
1. **Birth-details form → instant kundli page** in one click; no account wall before the chart.
2. **"Kundli at a glance" card** — Lagna, Rashi, Nakshatra, Manglik badge, current Dasha on top.
3. **Tabbed sections**: Daily Horoscope / Kundli / Matching / Remedies / Gemstones.
4. **Long auto-generated PDF reports** (50–100 pages) gated behind email — the monetized artifact.
5. **Hindi/Hinglish toggle** on every page.

Their failings: ad-heavy, formulaic boilerplate reports, wrong-person data when inputs are partial (the exact bug class behind our incident), zero method transparency ("which ayanamsha?"), email-wall UX friction.

### Era 3 — Modern apps (2018–2026)
*AstroSage app, AstroVed, Cosmic Insights, PocketPandit; western UX benchmarks Co-Star, The Pattern, Sanctuary.*

New baseline expectations:
1. **3-step onboarding**: name → birth date/time → place (autocomplete + "use my location"), each step validated inline before "Next".
2. **Summary-first, progressive disclosure**: glance card → tap into details → expert views. No mode switcher; one scroll with collapsibles.
3. **Timeline visualizations**: Vimshottari dasha as a slider/timeline, not a table.
4. **Push/personalization**: "Saturn enters your 7th house next week" style triggers.
5. **Shareable cards** and clean typography; zero jargon on the surface.
6. **Privacy posture**: minimal PII in URLs/links, explicit "your data stays on device".

---

## 3. Comparative scorecard (current app vs the lineage)

| UX dimension | Legacy pro tools (Era 1) | Consumer web (Era 2) | Modern apps (Era 3) | CosmicTantra today |
|---|---|---|---|---|
| Time to first chart | minutes (form) | ~30 s | ~20 s | ~5 s with params, ~60 s via modal |
| Chart-first default | ✅ | ✅ | ✅ | ⚠️ FOLIO volumes are the default, chart is in Workbench |
| At-a-glance summary card | ❌ | ✅ | ✅ | ⚠️ scattered (workspace shows some) |
| Birth-place autocomplete | ❌ | ⚠️ | ✅ | ⚠️ city table exists (`searchCities`) but entry is free-text + manual lat/lng |
| "Use my location" | ❌ | ❌ | ✅ | ❌ |
| Inline validation | ❌ | ❌ | ✅ | ⚠️ validation exists but fires at generation, not at typing |
| Progressive disclosure | ❌ | ⚠️ | ✅ | ⚠️ SIMPLE/DETAILED/PANDIT modes replace one scroll |
| Vimshottari timeline | table | table | slider | table (workspace dasha tab) |
| Method transparency | ✅ | ❌ | ⚠️ | ✅ (PDF appendix; not on screen) |
| Wrong-data protection | ❌ | ❌ | ⚠️ | ✅ (GATEs + fail-safe) |
| Bilingual | ⚠️ (report only) | ✅ (toggle) | ✅ | ✅ (toggle, both UI and PDF) |
| Saved kundlis / continue | ❌ | ⚠️ | ✅ | ⚠️ (dashboard + localStorage exist, not surfaced in-flow) |
| Shareable output | print | email-gated PDF | share card | ⚠️ print + PDF (no share card / clean link) |
| Cross-sell (matching, muhurta, remedies) | ❌ | ✅ | ✅ | ⚠️ separate pages, not linked from chart |
| Mobile-first | ❌ | ⚠️ | ✅ | ⚠️ desktop-first page (audit flagged dense control bar) |

---

## 4. Gap analysis — what to deliberately copy

1. **Era 1:** chart-first + 16-varga access + birth-balance display + tab navigation for experts. Our Workbench has the data but it is not the default view.
2. **Era 2:** glance card + instant result + Hindi toggle + report-as-deliverable (we have the best-in-class PDF — but the on-screen page hides it behind "Folios Archive" naming).
3. **Era 3:** inline-validated 3-step entry, timeline slider, progressive disclosure, share card, privacy-first links, "continue where I left off".

And what to **deliberately not** copy: 30-option pro forms, email walls, boilerplate 100-page reports, ads, manglik-scare marketing, unvalidated partial inputs.

---

## 5. Prioritized suggestions

### P0 — quick wins, high impact (1–2 days each)

1. **Birth-details entry: autocomplete + live validation.**
   Replace the free-text city + manual lat/lng modal with a typeahead over `searchCities` (already exported from `src/lib/cities.ts`) + "Use my location" (browser geolocation, 2 lines). Show live preview: *"Patna · 25.5941°N, 85.1376°E · Asia/Kolkata (+05:30)"* with inline errors (red border + message) *while typing*, not at generation. This kills the incident input class at the source.
   *Files:* `MasterKundliReportClient.tsx` modal, `geoTz.ts` resolver, `src/lib/cities.ts`.

2. **Kundli-at-a-glance card above the 17 volumes.**
   One card: Lagna (Simha · Leo), Rashi, Janma Nakshatra, Manglik badge (with cancellation note), current Dasha ("Rahu Mahadasha · Mercury Antardasha · until 2035-06-19"), Vimshottari birth balance. Data already exists in the snapshot; it's a layout change. This is the Era-2/3 convention that builds instant trust.
   *Files:* `MasterKundliReportClient.tsx` (new `KundliGlanceCard` component above FOLIO/WORKBENCH).

3. **Fix the funnel naming & defaults.**
   - Rename header link "Folios Archive" → "My Kundli" (consumer intent) and keep "Cases Queue" for pandits.
   - `/report` with no params should ask for birth details (or show demo explicitly labelled "sample chart"), not silently render a profile the user didn't enter. The DEMO_PROFILE fallback should carry a visible "Sample data — edit to yours" chip.
   - `/ask` prefills `1995-06-15 / 10:30 / Varanasi` — make it empty placeholders with the demo as a "try a sample" button. Prefilled birth data is how wrong-person charts get generated.
   *Files:* `GlobalHeader.tsx`, `MasterKundliReportClient.tsx` demo fallback, `ask/page.tsx`.

4. **PDF delivery polish.**
   - Filename: `Kundli_<Name>_<yyyy-mm-dd>.pdf`.
   - Success toast: "5 pages · 48 KB · validated ✓" (page count + size already tracked in `lastPdfMeta`).
   - "Preview" action: open the blob in a new tab before saving.
   - Persist chosen language (EN/HI) in localStorage and apply on load.
   *Files:* `MasterKundliReportClient.tsx` download handler.

### P1 — structural UX (2–5 days each)

5. **Default view = Overview; 17-Volume Book becomes a section.**
   Make the default tab a summary scroll: glance card → D1 chart → current dasha timeline → interpretation highlights (13 sections, collapsible) → PDF actions. Keep FOLIO/WORKBENCH as expert modes one toggle down. Simplification audit already flagged 35 buttons on this page.
   *File:* `MasterKundliReportClient.tsx`.

6. **Vimshottari timeline slider.**
   Horizontal timeline of 9 mahadashas (data: `snapshot.dasha.mahadashas` with dates); tap a period → antardasha chips below; "now" marker. Replaces the dasha table as the primary interaction; table stays in the PDF.
   *Files:* new `VimshottariTimeline` component in the report client (and optionally in `kundli/[id]` workspace).

7. **Progressive disclosure instead of a depth switcher.**
   One content stream with `<details>`/collapsible cards: summary → detailed tables → "Pandit notes". The current SIMPLE/DETAILED/PANDIT toggle re-renders three different bodies and confuses depth with length.
   *File:* `MasterKundliReportClient.tsx`.

8. **Interactive chart.**
   Make `NorthIndianChart` planets tappable: tapping Mars opens a side sheet (sign, dignity, nakshatra, house, upcoming dasha periods of that planet). Data is present in the canonical model.
   *Files:* `src/components/NorthIndianChart.tsx`, report client.

9. **Continue-where-you-left-off + clean share link.**
   - Persist last chart (profileStore exists); dashboard shows "Continue your Kundli" card.
   - Share: generate a short shareable link keyed by reportId/fingerprint (server lookup) instead of sharing raw `?dob=&lat=` PII params; and/or a shareable chart image card.
   *Files:* `dashboard/page.tsx`, `report/page.tsx`, new `/api/kundli/share/[id]` route.

10. **Surface the calculation standard on screen.**
    Add a small "How this was calculated" expander on the report page (ayanamsha Lahiri · mean node · VSOP87/ELP2000 · engine V36) — the PDF has it; the screen should too. This is our differentiator vs AstroSage-class tools and a pandit trust marker.
    *File:* `MasterKundliReportClient.tsx`.

### P2 — strategic (backlog)

11. **Cross-sell inside the flow:** from a kundli page link to "Match with a partner" (`/kundali-milan`, prefill own chart), "Today's panchang/muhurat", "Ask a pandit" (`/ask`, prefill birth details).
12. **Remedy planner:** the remedies section in the PDF → on-screen "Add to My Calendar" (existing `my-calendar`), with reminders.
13. **Dasha/transit notifications:** alert when a mahadasha/antardasha changes or Saturn/Jupiter transit an angle to the natal Moon (ties into `morning-digest`).
14. **JSON export/import** of the canonical model (reportId + fingerprint) for pandits and portability.
15. **Accessibility pass:** keyboard navigation for the chart, ARIA on tabs/timeline, colorblind-safe dignity indicators (icon + text, not color alone).
16. **Mobile layout for /report** (audit flagged dense control bar; the Android blueprint exists).

---

## 6. Success measures

| Metric | Target |
|---|---|
| Time from "create kundli" click to chart visible | < 20 s (autocomplete + default Overview) |
| Wrong-data incidents (fail-safe triggered for complete inputs) | 0 |
| Users who reach the validated PDF | > 60% of chart viewers |
| Share link used | > 10% of sessions |
| Hindi toggle usage | ≥ 25% (measured) |
| Saved-kundli reuse (continue card) | > 20% return sessions |

---

## 7. Recommendation

Implement **P0-1, P0-2, P0-3** together (they are one coherent "entry + first screen" change and kill the incident input class at the UI layer), then **P1-5/6** (overview + timeline) before touching the PDF experience further. The PDF itself is already ahead of the 30-year field (validated, deterministic, bilingual, page-capped); the flow that leads to it is the weakest link.

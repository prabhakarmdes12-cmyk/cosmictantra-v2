# CT-PJOS-01 · PHASE 0 — COSMICTANTRA ARCHITECTURE & REUSE AUDIT

> **Program:** COSMICTANTRA — Personal Jyotish Operating System (CT-PJOS-01)
> **Phase:** 0 — Engineering Archaeology (mandatory before any implementation)
> **Date:** 2026-08-29 · **Branch:** `arena/01a04fb8-cosmictantra-v2` · **Base commit:** `dea9217`
> **Method:** full source read of `src/`, `prisma/`, `tests/`, `coc/` prior-phase documentation; baseline test/typecheck execution in-sandbox; grep-level cross-surface consistency checks.
> **Status of repo at audit time:** `tests/astrology.spec.ts` + `tests/features.spec.ts` → **13/13 passed**; `tsc --noEmit` → **0 errors**; `npm run build` → **cannot be verified in this sandbox** (`binaries.prisma.sh` network-blocked for Prisma engine download — same limitation recorded in `coc/PRODUCTION_VERIFICATION.md`, §1 claim 9).

---

## 0. EXECUTIVE SUMMARY

**The single most important finding of this phase:** the mission brief's premise ("existing Master Kundli demonstrates substantial calculation breadth … Shodashavarga, Shadbala/Bhava Bala/Vimshopaka, Ashtakavarga, Jaimini, KP, Panchang, Gochar, Varshaphala, Yoga/Dosha registry, Personal Timeline, Kashi evidence architecture, Workbench, Master Kundli report model") **does not match the actual repository state.** The repository's own capability registry (`src/lib/capabilities.ts`, `src/lib/capabilityRegistry.js`) honestly declares most of these `NOT_AVAILABLE`, and code inspection confirms it.

What the repository **actually contains** (verified):

1. **A unified D1 (rashi) chart engine** ("V34"): lagna, 12 rashi-based houses, 9 grahas (sign, house, nakshatra/pada, dignity), Lahiri ayanamsha — with a **single-term-truncated ephemeris approximation** and **no retrograde detection for the seven classical planets**. This is the "canonical engine" that was unified in prior work (`src/engines/astrologyEngine.js` is now a pure re-export of `src/lib/astrologyEngine.js`).
2. **Vimshottari Dasha** (MD/AD, and PD in one copy) — implemented **twice, with divergent APIs and date math**.
3. **Panchang** — implemented **twice, with divergent astronomy** (one copy hardcodes sunrise 06:00 / sunset 18:00; the other computes them). One copy adds personal energy (Tara Bala, Chandra Bala).
4. **A complete paid ₹199 consultation pipeline** (Razorpay order → HMAC-verified payment → deterministic calculation snapshot persisted in Postgres → Anthropic AI working draft → Pandit review → approve/deliver) with a **typed audit log on every transition**. This is the strongest asset in the repo and the true seed of Release C.
5. **Guna Milan (8 kootas + Mangal Dosha)**, numerology tools, festivals, personal Vedic calendar + ICS export, darshan page, SwargaLok canvas sphere, family profiles in **localStorage only**.
6. **No end-user account system, no server-side Kundli persistence, no Person/BirthRecord/Evidence/Event/Prediction/Practice models, no varga (D9/D10/…/D60) calculations, no Shadbala, no Ashtakavarga, no transit/Gochar engine, no Jaimini/KP/Varshaphala, no aspects (Drishti), no Prediction/LifeEvent/Practice/Sankalp persistence.**

**"Master Kundli V1 / Trust Qualification"** in the brief maps, in this repository, to: the unified V34 D1 engine + the paid consultation's immutable `calculationSnapshot` (versioned `v34`) + the independent Meeus-formula verification recorded in `coc/PRODUCTION_VERIFICATION.md` (§1, claim 3: ascendant independently verified to ~6′). There is no standalone "Master Kundli report" product beyond the paid pipeline's text report (`src/engines/reportGenerator.js`).

**Consequences for the program (see §15 dependency graph):**

- Releases A's *connection* value (Advantages 2–5) can genuinely start from this repo — the paid pipeline already demonstrates deterministic-snapshot → AI-draft → human-review with provenance.
- But Releases A's *depth* value (Advantage 1) requires **building** the missing deterministic domains (vargas, Shadbala, AVK, aspects, transits, Varshaphala) as new registered engines before the EvidenceCompiler can return complete evidence for domains like CAREER/MARRIAGE. Until then, `compileEvidence` must return structured `missing[]` evidence per INV-PJOS-002 — which is a feature, not a defect (honest gaps are the product).
- **Two P0 security defects found in this audit** (unauthenticated case-approval endpoint + unmasked enumeration of consultation birth data) must be fixed **before** any new surface is built, because Phase 1's Person domain will inherit and amplify them.
- **The ephemeris must be upgraded and unified** (currently 3 divergent low-precision implementations) before any professional-trust claim; this touches golden test values, so it is an explicit owner/Pandit decision point (§16, D-2).

---

## 1. REPOSITORY SNAPSHOT

| Item | Value |
|---|---|
| Framework | Next.js 14.2.18 (App Router, TS 5.6), React 18.3, Tailwind 3.4 |
| DB | PostgreSQL via Prisma 5.22 (`prisma/schema.prisma`) |
| AI | Anthropic Messages API, server-side only (`src/lib/paymentPipeline.ts`, `consultations/test` route); model env-driven, default `claude-sonnet-4-20250514` |
| Payments | Razorpay (server-side order + HMAC verify + webhook) |
| Tests | Playwright 1.62 — `tests/astrology.spec.ts` (2 golden-parity), `tests/features.spec.ts` (11), `tests/responsive.spec.ts` (browser-based, not runnable in this sandbox) |
| Node | `package.json` engines `24.x`; sandbox ran Node 22.22.3 — tests/typecheck pass regardless |
| Routes | 21 page routes, 12 API routes |
| Size | ~9.4k LOC in `src/`; 113 files under `src`+`prisma`+`tests` |
| Prior-phase docs | `coc/` — design journal, improvement audit, **production verification report (24 Aug 2026)**, review guide for PR #1 |

### Page inventory (21)

`/` (landing: panchang, intent router, muhurat, festivals, Kundali, Dasha, SwargaLok sphere, methodology, practitioners, ₹199 offer, knowledge graph), `/ask` + `/ask/success/[orderId]` (paid consultation funnel), `/astrology/cases` (admin case manager), `/astrology/practitioners` (practitioner directory), `/pandit` (Pandit dashboard, mobile-optimized), `/pandit/cases/[id]` (case detail + review UI), `/pandit/onboard/[token]`, `/family` (localStorage family profiles), `/my-calendar` (personal Vedic calendar + ICS), `/kundali-milan` (8-koota matching + Mangal Dosha), `/darshan` (curated temple streams + ritual windows), `/library` + `/library/[slug]`, `/panchang/[city]` (programmatic SEO), `/rashifal/[sign]`, `/festivals/[slug]`, `/numerology/{name,business-name,mobile-number,baby-names}`.

### API inventory (12)

| Route | Method | Auth (verified) | Notes |
|---|---|---|---|
| `/api/astrology/consultations` | GET | Admin key (optional → masked PII otherwise) | **leaks unmasked birth data + all IDs to anonymous callers** (§9, S-2) |
| `/api/astrology/consultations/create` | POST | none | public order creation; no rate limit |
| `/api/astrology/consultations/test` | POST | none | full AI pipeline; DB writes |
| `/api/astrology/payments/verify` | POST | none (Razorpay HMAC self-verifies) | idempotent via `paymentPipeline` |
| `/api/astrology/payments/webhook` | POST | Razorpay HMAC | fail-closed when unconfigured |
| `/api/astrology/cases/[id]/review` | PATCH | **none** | **anyone can set `practitionerFinal` + status `APPROVED`** (§9, S-1) |
| `/api/astrology/cases/[id]/deliver` | POST | **none** | generates report text; requires APPROVED |
| `/api/astrology/practitioners` / `invite` / `onboard` | GET/POST | none (onboard gated by one-time token) | |
| `/api/astrology/analytics` | POST | none | anonymous DB writes |
| `/api/vedic-calendar/export` | GET | none (stateless, PII in query string) | ICS subscription feed |

---

## 2. DETERMINISTIC CALCULATION INVENTORY

Reuse ratings: **R1** = directly reusable as EvidenceGraph source · **R2** = reusable after unification/fixes · **R3** = pattern/reference only · **NEW** = must be built.

### 2.1 D1 Kundali engine — `src/lib/astrologyEngine.js` (480 LOC) · `src/engines/astrologyEngine.js` (re-export) — **R2**

- **API:** `calculateKundali({birthDate,birthTime,latitude,longitude,timezone,locationName})` (dual positional-arg support); returns `{meta, metadata, lagna, moon, planets (array + named props), houses[12], ayanamsha, julianDay}`.
- **Computes:** Lahiri ayanamsha (linear: `23.856 + 1.396·T`), tropical→sidereal, lagna (LST-based ascendant), 9 grahas (longitude, rashi, house = equal-house offset from lagna rashi, nakshatra/pada, dignity via `getDignity`), house metadata (significance, karaka, lord).
- **Verified:** golden tests pin Lagna Simha/Magha + Moon Dhanu/Uttara Ashadha for 1995-06-15 10:30 Patna; independent Meeus verification (prior phase) → ascendant within ~6′.
- **Gaps (blocking for A5/A6/A7/A11):**
  - **No retrograde detection** — `isRetrograde` is hardcoded `false` for all seven classical planets (`astrologyEngine.js` rawPlanets array). Graha Inspector "Retrogression", combustion, and several traditional rules are impossible until this exists.
  - **No combustion** (Sun distance rule) and **no aspect (Graha Drishti) computation anywhere in the repo**.
  - **Houses are equal-rashi houses** (`houses[i].longitude = (rashiId-1)·30`). Fine for rashi-chart rendering; documented convention must be declared before Bhava-level precision claims (house-cusp algorithms are out of scope for rashi-based Jyotish but must be stated).
  - **Ephemeris is 2-term truncated** (e.g. Moon: `L + 6.289·sin M − 1.274·sin(2D−M)`, omitting the `+0.658·sin 2D − 0.186·sin l′ …` terms) → max error ≈ 0.6–0.7° for Moon. Near rashi/nakshatra boundaries the sign/nakshatra (and therefore the **dasha start lord**) can flip versus a reference ephemeris. See §3.
  - Ayanamsha is linearized (fine to ~0.03° within ±50 years; must be pinned as convention).
- **Suitable for EvidenceGraph:** yes, after §3 fixes — wrap `calculateKundali` as engine `D1_RASHI_V1` with `algorithmVersion` + `conventionVersion`.

### 2.2 Vimshottari Dasha — **TWO DIVERGENT IMPLEMENTATIONS** — **R2 (must unify first)**

| Copy | Path | API | Consumers |
|---|---|---|---|
| A | `src/lib/dashaEngine.js` (133) | `calculateVimshottariDasha(moonLongitude, birthDateStr, targetDate?)` → `{mahadashas[9] (with AD + PD), currentMD/AD, period strings}` | `DashaHero.jsx` (landing) |
| B | `src/engines/dashaEngine.js` (136) | `calculateVimshottariDasha(moonNakshatra, birthDate)` → `dashas[9]` array (AD only, no PD) + `getCurrentDasha(dashas, ref)` | `paymentPipeline.ts`, `consultations/test`, `vedicAlerts.js` |

- **Divergences:** result shape (tree vs flat), PD present only in A, AD proration for the first partial MD handled differently, date math (`365.25`-day years vs `setFullYear` + day remainder), `isCurrent` flagging uses local-time `Date` vs UTC-date-string comparison (timezone edge risk near midnight), B's `durationMonths` derivation differs from the ratio formula (totals still sum correctly).
- **Values agree on the reference case** (prior verification: Sun MD start 1995-06-15 → 2000-12-01/02 in both) — no live contradiction today, but dual maintenance is exactly the duplication the program must eliminate.
- **Reuse:** keep **one** implementation (recommend A as base: richer, PD included, matches UI), fix date arithmetic to real calendar math, add `dashaAt(date)` query API. This becomes engine `VIMSHOTTARI_V1`.

### 2.3 Panchang — **TWO DIVERGENT IMPLEMENTATIONS** — **R2 (must unify first)**

| Copy | Path | Astronomy | Personal layer | Consumers |
|---|---|---|---|---|
| A | `src/lib/panchang.js` (308) | computes real sunrise/sunset (declination + EoT), Rahu Kaal/Yamaganda/Gulika/Abhijit/Brahma muhurats from **computed** daylight; Tithi/Nakshatra/Yoga/Karana; moon phase | none | landing `TodayAtAGlance`, `vedicAlerts.js` (alerts + ICS) |
| B | `src/engines/panchang.js` (178) | **hardcoded sunrise 06:00 / sunset 18:00** → Rahu Kaal is wrong for most Indian cities; slightly different Sun/Moon series; Tithi/Nakshatra/Yoga/Karana/Vara | **Tara Bala (9 stars) + Chandra Bala → POWER/CAUTION day badge** | `CosmicNow`, `MyDaysPanchang`, `VedicDayRibbon`, `paymentPipeline.ts` (paid report) |

- **Live cross-surface contradiction (already violates "zero cross-surface contradiction" acceptance):** the same user's same day shows different Rahu Kaal on the landing ribbon (copy B) vs the My Vedic Calendar / panchang page (copy A).
- **Reuse:** unify into one engine with computed solar times (A's astronomy) + B's personal layer (Tara/Chandra Bala) as an opt-in "personal panchang" output. Engine `PANCHANG_V1` (+ `PANCHANG_PERSONAL_V1` view).

### 2.4 Guna Milan (Ashtakoota) — `src/lib/kundaliMilan.js` (205) — **R1 (mostly)**

- `kundaliMilan(a,b)` → 8 kootas (Varna 1 / Vashya 2 / Tara 3 / Yoni 4 / Graha Maitri 5 / Gana 6 / Bhakoot 7 / Nadi 8, sum 36, deterministic, unit-tested), `mangalDosha(k)` (Lagna+Moon houses [1,2,4,7,8,12]), `milanFromProfiles`.
- **Contradiction:** `capabilities.ts` declares `ASHTAKOOT: 'NOT_AVAILABLE'` while `/kundali-milan` ships the full implementation live. Registry is stale (or the page is over-advertising). One of the two must change — pick per owner; recommendation: mark `ASHTAKOOT: 'LIVE (8-koota, practitioner-advised)'` and add cancellation rules as a later engine extension (C7 needs the full rule set: Bhakoot 6/15, Nadi, Mangal cancellation, etc.).

### 2.5 Traditional-knowledge seed — `src/engines/guruAI.js` (93) — **R3**

- `generateRemedies(kundali)`: exactly 4 hardcoded rules (debilitated Saturn → Hanuman Chalisa/black sesame; debilitated Jupiter → chana-dal offering; Rahu in kendra → mantra; Mars in 7/8 → Mangal Stotram). This is the repo's entire "Yoga/Dosha registry".
- `buildSystemPrompt(lang, kundali)`: prompt with a fixed 9-line kundali snapshot block.
- **Reuse:** these 4 rules become the first entries of a real `TRADITIONAL_RULE` registry (typed, versioned, each with `ruleId`, `source`, `appliesTo`, `requiredEvidence`). The prompt builder becomes Kashi 2.0's evidence-injection template (§6).

### 2.6 Report generator — `src/engines/reportGenerator.js` — **R3**

- `generateShareableReport(kundali, panchang, currentDasha, name)` → plain-text report (used by `deliver` route). No PDF, no sections beyond D1+Panchang+Dasha. Becomes the first "view over shared evidence" (C6 pattern).

### 2.7 Personal Vedic calendar & alerts — `src/lib/vedicAlerts.js` (282) — **R1**

- `getDayAlerts(date, profile)`: Rahu Kaal, Yamaganda, Gulika, Abhijit, Panchak (5 nakshatras), Rikta Tithis (4/9/14), Janma-Nakshatra days, **Dasha transition detection**, festivals → typed alerts with `level` + start/end; `getMonthAlerts`; `buildICS` (validated by tests).
- This is the closest existing thing to **B1 (My Panchang)**, **B9 (notifications with reasons)** and **A8 timeline layers** — all deterministic, all testable.

### 2.8 Numerology — `src/lib/numerology.js` (198) — **out of PJOS scope** (Chaldean name numbers, Mulank/Bhagyank, mobile-number analysis; deterministic + tested). Keep as a separate product surface; do not wire into the Jyotish evidence graph.

### 2.9 ABSENT deterministic domains (brief assumes them; they do not exist)

| Domain | Status | First use by | Build cost note |
|---|---|---|---|
| Shodashavarga (D9/D10/D7/D12/D60/…) | **NEW** | A2, A5, A6, A7, A11, C6 | Varga lagna = (lagna + planet lon)·N mod 360 /N — cheap on top of D1 engine; full shodasha set is table-driven |
| Shadbala (Rashi/kaala/dega/drik/sthanaka bala) | **NEW** | A2, A3, A5 | ~300–500 LOC deterministic core with worked-example golden tests |
| Bhava Bala (12 house strengths) | **NEW** | A2, A3, A6 | from shadbala core |
| Vimshopaka (9 graha effect scores) | **NEW** | A2, A5 | small, table-driven |
| Ashtakavarga (per-planet per-house Shadashtaka + total AVK) | **NEW** | A2, A3, A6, A8, A9 | ~200–300 LOC; needs reference-table golden tests |
| Graha Drishti (aspects, incl. navamsha drishti, reception) | **NEW** | A5, A6, C7 | small table + degree rules |
| Combustion, avasthas (10), strength-of-lord aggregates | **NEW** | A5 | small |
| Gochar / transit engine (current + historical + ingress, Sade Sati) | **NEW** | A8, A9, A10, B2 | **critical path**: needs the same ephemeris as D1, parameterized by date — also unlocks A11 sensitivity |
| Varshaphala (annual chart from Sun position) | **NEW** | A2, A8 | moderate |
| Jaimini (Chara/Apada karakas, Chara Dasha, dashamsa, upapada) | **NEW** | A2 (extended domains) | larger; can be a later wave inside Release A |
| KP (sub-lords, cuspal signification) | **NEW** | A5 (KP view) | requires cusp engine; **later wave / Release C** |
| Yoga/Dosha registry (general) | **NEW** (4-rule seed exists) | A3, A6, C6 | table-driven over EvidenceGraph predicates |
| Muhurta search (C9) | **NEW** (data cards exist: `muhuratData.js`) | C9 | candidate-window search over panchang + natal rules |
| Prashna (C10) | **NEW** | C10 | lagna-at-question-time engine reuses D1 |

---

## 3. ACCURACY & CORRECTNESS AUDIT (blocks Advantage 1 — DEPTH)

1. **E-1 · Three divergent low-precision ephemerides.** `lib/astrologyEngine.js` (planets), `engines/panchang.js` (sun/moon), `lib/panchang.js` (sun/moon) each carry their own truncated series. Moon error ≈ 0.6–0.7° (2-term truncation). **Action:** one `ephemeris` module (Meeus low-precision **6-term** Moon, full VSOP0-lite Sun, proper node for Rahu/Ketu, retrograde from sign of dλ/dt) consumed by all engines. Golden tests re-pinned against a reference ephemeris (e.g. published Lahiri tables) — this changes some fixed values → **decision D-2**.
2. **E-2 · No retrograde detection** (hardcoded flags). Professional users verify this first (Persona 2).
3. **E-3 · No aspects (Drishti) computation** anywhere — Bhava/Graha explorers and C7 Moon/Venus aspects are impossible without it.
4. **E-4 · Dasha date math** — 365.25-day year accumulation drifts ~7 days across 19-year Saturn periods; `isCurrent` comparisons mix local `Date` and UTC date-strings. Fix during unification.
5. **E-5 · Hardcoded 06:00–18:00 daylight** in `engines/panchang.js` → wrong Rahu Kaal on `CosmicNow`, `VedicDayRibbon`, `MyDaysPanchang`, and the **paid consultation snapshot** (which is the record a Pandit reviews).
6. **E-6 · Ayanamsha linearization** — acceptable range must be declared (±50 yr fine; births before ~1930 need full Lahiri series). Convention decision D-2.
7. **E-7 · Birth-time confidence does not exist** — no field anywhere records EXACT/APPROXIMATE/UNKNOWN; the `/ask` form takes a bare `HH:MM`. INV-PJOS-005 has nothing to hook onto → added in Phase 1 domain model.

---

## 4. DUPLICATED SOURCES OF TRUTH (convergence matrix)

| Truth | Copies | Verdict |
|---|---|---|
| D1 chart math | `lib/astrologyEngine.js` (canonical) + `engines/astrologyEngine.js` (re-export) | ✅ already unified (prior phase) |
| Vimshottari Dasha | `lib/dashaEngine.js` ↔ `engines/dashaEngine.js` | ❌ divergent API/shape/date-math → unify to one module, re-export pattern |
| Panchang astronomy | `lib/panchang.js` ↔ `engines/panchang.js` | ❌ different solar times + different Moon series → unify (A's astronomy + B's personal layer) |
| Sun/Moon ephemeris | 3 inline copies (§3 E-1) | ❌ → single ephemeris module |
| Nakshatra tables | 2 copies (astrologyEngine, panchang copies) | ❌ → shared constants module |
| Capability claims | `capabilities.ts` vs `capabilityRegistry.js` vs live `/kundali-milan` | ❌ stale registry (ASHTAKOOT) → single registry, truth-checked in tests |
| "v34" version string | hardcoded in `paymentPipeline.ts` + schema default + report footer | ❌ → central `ENGINE_VERSIONS` manifest (feeds INV-PJOS-006/012) |

---

## 5. PERSISTENCE & STATE INVENTORY

### 5.1 What exists in Postgres (`prisma/schema.prisma`)

| Model | Role in PJOS |
|---|---|
| `AstrologyConsultation` | **The only existing "calculation snapshot" in the system**: `calculationSnapshot Json` = `{kundali, dashas, currentDasha, panchang, remedies, calculatedAt}` + `calculationVersion "v34"` + `aiDraft` + `aiModel` + `promptVersion` + `practitionerFinal` + `practitionerNotes` + `approvedBy/At`. This is the working model for **INV-PJOS-003 (separate fact layers)**, **INV-PJOS-006 (immutability)** and **C4/C5 (original AI output preserved, review stored separately)** — but encoded as free JSON + free text. |
| `AstrologyAuditLog` | `eventType / actorType / payload Json` per transition (`CASE_CREATED`, `PAYMENT_VERIFIED`, `INTERPRETATION_APPROVED`, `INTERPRETATION_SAVED` …) — **seed of the §8 typed domain-event system**; currently consultation-scoped only. |
| `AstrologyConsultant` | Practitioner registry (onboarding status, specialties, pricing). |
| `AstrologyPractitionerInvite` | One-time invite tokens. |

### 5.2 What exists client-side only

- `src/lib/profileStore.js` — localStorage family profiles (`cosmictantra_profiles_v1`): name, relation, birth DOB/time/city/lat/lon/tz, cached kundali, `cosmicId`. Its own header comment names the intended upgrade: *"the DB-backed AstrologyCustomerProfile model is the production upgrade path once phone-OTP accounts ship — the storage contract below is intentionally identical."* **That model does not exist.** This is the anchor of decision D-1.
- No predictions, events, practices, questions, notes, outcomes anywhere (browser or server).

### 5.3 Missing (Phase 1 migration surface — additive only, no destructive changes)

`Account` (owner), `Person` (account-owned, relation, sensitivity tag), `BirthRecord` (immutable + `BirthTimeConfidence`), `CalculationConvention`, `AstrologySnapshot` (versioned, immutable, supersedes consultation JSON), `EvidenceNode` + `EvidenceEdge`, `TemporalState` (cached), `Question`, `PredictionRecord` (+ `OutcomeRecord`), `LifeEvent`, `PracticeRecord` (+ Sankalp state), `Consultation` (evolve existing), `PanditNote` (typed), `ScholarReview`, `Report`, `Notification`.
Plus: **index on `personId` for every model** (INV-PJOS-008/CT-A-010), and **row-level ownership** (CT-A-001: no cross-person evidence references).

---

## 6. KASHI / AI SURFACE INVENTORY (refactor vs replace)

| Surface | Location | Reality | Disposition |
|---|---|---|---|
| "Guru AI Assistant" chat | `src/components/ChatBox.tsx` | **Fabricated replies**: `setTimeout(800ms)` returning hardcoded template sentences; no network call. (Currently **not imported by any page** — dead code, but a landmine.) | **REPLACE.** Must never ship. Kashi 2.0 (A14) is the real pipeline; if a lightweight free chat stays, it must call the evidence-backed orchestrator and degrade to "Kashi unavailable" (AI-failure-mode §11). |
| Paid AI working draft | `src/lib/paymentPipeline.ts` + `consultations/test` route | **Real**: deterministic calc → `buildSystemPrompt` with kundali block → Anthropic (15s abort, env model) → structured draft; on AI failure a **deterministic fallback draft** is generated (AI-failure-mode already half-implemented). | **REFCTOR → Kashi 2.0 core.** Replace the 9-line kundali block with the **EvidenceCompiler bundle**; add intent/temporal/domain resolution around it; keep the server-side-only AI boundary. |
| Pandit review | `/api/astrology/cases/[id]/review` + `/pandit/cases/[id]` | Real: `practitionerFinal` + notes + APPROVE; **audit log stores `aiDraftOriginal`** — the repo already "never modifies original Kashi output invisibly" (C5 principle exists!). Actions limited to save-draft / approve. | **REFACTOR.** Extend action enum to AGREE / AGREE_WITH_NOTE / MODIFY_INTERPRETATION / REJECT / REQUEST_MORE_INFORMATION (C4); add auth (S-1). |
| Intent structuring UX | `IntentRouter.jsx` (landing tiles), `AskBetterQuestions.jsx`, `QuestionRefiner.tsx` (unwired) | Real UI, no logic | **REUSE** as Kashi 2.0's intent/domain entry tiles (career/money/marriage/…) and question-refinement step. |
| "Kashi" the city | marketing copy across landing/darshan/library | Varanasi content, not an engine | no code action. |

**Kashi 2.0 pipeline landing point (A14)** — all boxes exist or are being built in Release A:
intent classification (IntentRouter/QuestionRefiner) → person resolution (Phase 1 `Person`) → temporal resolution (A8 TemporalService) → domain resolution (A2) → evidence plan + execution (A1/A2) → support/conflict (A3) → traditional rule retrieval (registry from §2.5) → synthesis (existing Anthropic boundary, evidence-injected prompt) → WHY? graph (A15, evidence IDs) → persistence (Phase 1 `Question`/`PredictionRecord`).

---

## 7. TIMELINE / UI REUSE MAP (A4/A5/A6/A8 seeds)

| Component | What it is today | Reuse for |
|---|---|---|
| `KundaliExperience.jsx` (479) | Free D1 generator + chart + per-house/planet explanation panels, i18n (en/hi/…via `translations.js`), analytics | **A4 Workbench shell** + Bhava/Graha drill-down pattern (it already has `selectedHouse`/`selectedPlanet` state) |
| `NorthIndianChart.jsx` | SVG rashi chart | Graha/Bhava Explorer chart base (clickable graha/house already implicit) |
| `SwargaLok.jsx` (639) | Canvas 27-nakshatra celestial sphere with planet nodes + selected-planet fact panel, driven by `kundaliData` | **A5 Graha Inspector visual** (sphere → planet) + D1 context |
| `DashaHero.jsx` (198) | MD/AD explorer with colors, current-period, period strings | **A8 Time Explorer** dasha layer |
| `DestinyTimeline.tsx` (91) | Band-style 120-yr dasha timeline (currently unwired) | A8 base timeline band |
| `MyDaysPanchang.tsx` (128) | Personal-energy day (Tara Bala, Chandra Bala) per selected date | **B1 "YOUR DAY"** + A8 user-day layer |
| `TodayAtAGlance.jsx` (303) | Universal sky (tithi/nakshatra/yoga + windows + guidance) | **B1 "UNIVERSAL SKY"** (separation of fact vs interpretation already partly structured) |
| `VedicDayRibbon.tsx` | Horizontal day-cycle ribbon | B1 layout primitive |
| `PersonalCalendar.jsx` + `vedicAlerts` | Month grid of personal alerts + ICS | A8 event/alert layer; B9 notification content source |
| `KnowledgeGraph.tsx`/`KnowledgeGraphSection.jsx` | Interactive concept lexicon (tithi→muhurat) | "Why?" explanatory substrate + SIMPLE/DETAILED/PANDIT depth renderer content |
| `CapabilityRegistryModal.jsx` | Honest capability disclosure modal | **Directly enforces INV-PJOS-010** — extend it to per-evidence-node confidence classes |
| `FamilyManager.jsx` | localStorage profile CRUD | B4 vault UI (data layer moves server-side, UI logic reusable) |
| `PersonalisationBridge.jsx` | Sticky "your chart is loaded" bar | Workbench top bar pattern |

**A8 Time Explorer has no existing scalable multi-layer timeline** — build new, but every layer's data source exists or is scheduled (dasha ✓, festivals ✓, panchang ✓, transits → NEW, Sade Sati → NEW (derived from Saturn transit), Varshaphala → NEW, user events → Phase 1 schema).

---

## 8. CONSULTATION / PANDIT ARCHITECTURE (Release C seed)

**Existing state machine** (`ConsultationStatus`): `DRAFT → PAYMENT_PENDING → PAID → CALCULATING → AI_DRAFT_READY → PANDIT_REVIEW → APPROVED → DELIVERY_READY → DELIVERED` (with `CALCULATION_FAILED / AI_FAILED / REVIEW_REJECTED / DELIVERY_FAILED / REFUNDED` branches). Idempotent post-payment processing (`paymentPipeline.processPaidConsultation`), audit log on every transition, PII masking on public list, payment webhook fail-closed.

**Gaps vs Release C:**
- C1 client workspace: Pandit list + case detail exist (mobile-optimized, weak identity — `practitionerName` is a hardcoded default in the dashboard page); no per-practitioner auth; no client history beyond the case itself.
- C2 consultation brief: `calculationSnapshot` is the brief's raw material — auto-render it as a structured brief (no new calculation).
- C3 structured notes: `practitionerNotes` is a free text blob → typed notes (CALCULATED_FACT / SCHOLAR_INTERPRETATION / USER_REPORTED_FACT / TRADITIONAL_REMEDY / FOLLOW_UP / QUESTION_FOR_NEXT_SESSION) per INV-PJOS-003.
- C6 specialized reports: only one text generator; C6 = new *views* over the same snapshot + EvidenceGraph (no new engines).
- Delivery: `deliver` route generates text; **no actual WhatsApp channel wired** (known since prior verification); keep as `DELIVERY_CHANNEL_TEXT` until integration is owned.

---

## 9. SECURITY BOUNDARY INVENTORY (current)

**Good (verified in code):** fail-closed admin secrets (`auth.ts` — no hardcoded fallbacks, dev key gated by `NODE_ENV`, constant-time compare); Razorpay webhook HMAC + 503-when-unconfigured; payment verify idempotent; PII masking (`maskCustomerPII`) on public consultation list; robots/sitemap exclude ops paths; DPDP-posture documentation on localStorage profiles; no PII in analytics payloads (spot-checked).

**Defects found in this audit:**

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| **S-1** | **P0** | `PATCH /api/astrology/cases/[id]/review` has **no authentication**: any caller with a case id can set `practitionerFinal`, force `status=APPROVED`, and write a self-asserted `PANDIT` audit entry. Combined with S-2 this is a full impersonation chain on paid deliverables. | `cases/[id]/review/route.ts` (no `requireAdminAuth`); audit-log write at end of handler |
| **S-2** | **P0** | `GET /api/astrology/consultations` (anonymous) returns **every** consultation with **unmasked `birthDate`, `birthTime`, `birthCity`** and full ids (masking covers name/phone/email only) → enumeration of personal birth data + case ids. | `consultations/route.ts` line ~26: `maskCustomerPII` does not touch birth fields; list is unfiltered |
| S-3 | P1 | Unauthenticated write endpoints: `/consultations/create` (public by design, but **no rate limit / no CSRF token**), `/consultations/test` (runs AI + DB writes, meant for admin), `/analytics` (anonymous DB insert), `/practitioners/invite` (creates invite tokens). | grep across `src/app/api` |
| S-4 | P1 | No rate limiting anywhere; `/api/vedic-calendar/export` carries full birth PII in query string (web-server/access logs retain it). | all routes; export route |
| S-5 | P1 | When the PJOS `Person` domain lands, **every** new endpoint must ship with server-side ownership checks + audit (CT-A-001/CT-A-010). No account system exists yet, so the pattern must be decided in Phase 1, not retrofitted. | — |

**Pre-Phase-1 hygiene (fix before building new surfaces):**
1. S-1: require practitioner identity (short-term: admin key + `practitionerId` ownership check; proper: practitioner login) — **one-day fix**.
2. S-2: mask/omit `birthDate`/`birthTime`/`birthCity` in the anonymous list DTO (return them only with admin auth or a scoped, owned case token).
3. S-3: rate-limit all public POSTs; move `/consultations/test` behind admin key; gate `/analytics` or move to client-only event store.
4. S-4: add basic rate limiting (Next middleware or per-route token bucket).

---

## 10. OBSERVABILITY & ANALYTICS (current)

- Client: `src/lib/analytics.ts` — `ANALYTICS_EVENTS` taxonomy + `trackEvent` (fires into the unauthenticated `/api/astrology/analytics` insert). Taxonomy already overlaps §16 PJOS events (kundli generated, intent selected, dasha opened …). **Reuse the taxonomy; keep PII out of payloads (verified today; add test).**
- Server: `console.error` only; no structured metrics. **Required new instruments (§15):** `evidence_compile_failed`, `prediction_contradiction`, `snapshot_version_mismatch`, `temporal_calculation_failure`, `kashi_missing_evidence`, `birth_time_sensitive_warning`, `report_contradiction`, `unauthorized_person_access`, `practice_state_failure` — none exist yet.
- **No performance measurements exist** (§19 targets: snapshot <500 ms, evidence compile <300 ms, planet switch <100 ms) — add timing around engine calls during Phase 2/3 and record baselines.

---

## 11. TEST INVENTORY & GAP MAP

| Layer | Exists | Gaps |
|---|---|---|
| L1 unit | `tests/features.spec.ts` (11): numerology, Guna Milan bounds + determinism, Mangal Dosha, Rikta/Panchak rules, day alerts, ICS, rashifal, **P0-1 regression** (nakshatra objects render safely) | No ephemeris accuracy suite vs reference tables; no dasha golden dates; no (yet) varga/shadbala/AVK/aspects/transits suites |
| L1' engine parity | `tests/astrology.spec.ts` (2): lib vs engines D1 parity + benchmark lagna/moon expectations | Parity test disappears after dasha/panchang unification (good); replace with **cross-engine golden** + **cross-surface parity** tests (same date → same Rahu Kaal on all surfaces) |
| L2 invariant | **none** | All of CT-A-001…010 new (Phase 2+); first two are cheap and can land with the security fixes (no cross-person refs; canonical degree equality) |
| L3 integration | none (paid pipeline untested end-to-end) | Add: create→pay-verify→snapshot-assertion→review→deliver with a fake gateway |
| L4 journey | `responsive.spec.ts` (browser, needs Playwright browsers — not installed in this sandbox) | New: workbench journey, why-graph journey, timeline journey, prediction-ledger journey |
| L5 human | `coc/` documents prior verification | Prepare PANDIT_TEST_PROTOCOL / FIRST_USER / RETURNING_USER protocols (no results fabricated) |

**Test strategy note:** the repo's golden tests pin values from a *truncated* ephemeris. Upgrading ephemeris precision (E-1) will break some pinned values — re-pin from a reference ephemeris in the **same commit** with a documented table, or every later invariant test inherits the approximation error.

---

## 12. BRIEF → REALITY RECONCILIATION MATRIX

Legend: ✅ exists & reusable · ◐ partial seed · ❌ absent (build new)

| Brief item | Status | Evidence / seed |
|---|---|---|
| **A1** EvidenceGraph | ❌ | New. Shape can borrow `calculationSnapshot` field layout + `AstrologyAuditLog` event pattern |
| **A2** EvidenceCompiler | ❌ | New. Domain→engine mapping table in §2.9; domains with missing engines must emit `missing[]` (INV-002) — e.g. CAREER today: D1 10th bhava ✓, dasha ✓, panchang ✓; D10 ✗, Shadbala ✗, AVK ✗, Gochar ✗, Varshaphala ✗ |
| **A3** Support/Conflict engine | ❌ | New (pure function over EvidenceNodes) |
| **A4** Life Question Workbench `/kundli/[id]/explore` | ◐ | `KundaliExperience` + `IntentRouter` tiles + `translations.js` i18n; route + evidence-driven sections new |
| **A5** Graha Explorer | ◐ | Natal position/dignity/nakshatra/dasha ✓; retrogression ✗ (E-2), combustion ✗, Shadbala/Vimshopaka/Avastha/AVK/Drishti ✗, transits ✗ |
| **A6** Bhava Explorer | ◐ | Occupants/lord/rashi ✓; Bhava Bala ✗, aspects ✗, AVK ✗, transit activation ✗ |
| **A7** Varga connection | ❌ | No varga math at all (D9/D10/D60) |
| **A8** Time Explorer `/kundli/[id]/time` | ◐ | Dasha layer ✓ (DashaHero, DestinyTimeline), festivals ✓, panchang ✓, alerts ✓; transits ✗, Sade Sati ✗, Varshaphala ✗; unified `TemporalJyotishState` new |
| **A9** Future window search | ❌ | New; depends on transit engine + dasha; deterministic decomposition required |
| **A10** Event Explorer | ◐ | `LifeEvent` schema new; dasha-at-date ✓, transit ✗; "astrological context, no causality" labeling pattern matches existing MethodologySection ethos |
| **A11** Birth-time sensitivity | ◐ | `calculateKundali` is fully date-time parameterized (cheap interval sweep for lagna/moon/nakshatra/dasha-start); D9/D10 lagna sensitivity needs varga engine |
| **A12/A13** Prediction ledger | ❌ | No persistence; `PredictionRecord` + ledger UI new; immutability pattern borrow from `calculationSnapshot` + audit log |
| **A14** Kashi 2.0 | ◐ | Paid pipeline = real core (§6); ChatBox fake = replace; IntentRouter/QuestionRefiner = UX seeds |
| **A15** Why graph | ❌ | New; node IDs come from A1 |
| **A16** Uncertainty model | ◐ | `calculationVersion`/`promptVersion` exist; birthDataReliability ✗ (E-7); evidenceAgreement from A3 |
| **B1** Personal Panchang | ◐ | TodayAtAGlance (universal) + MyDaysPanchang (Tara/Chandra Bala) + vedicAlerts (personal alerts) → restructure into 3-panel layout, unified engine |
| **B2** Cosmic Now → Me | ◐ | Personal panchang layer ✓; natal×dasha×AVK×Varshaphala needs new engines |
| **B3** DailyJyotishState cache | ❌ | New (per person/day; deterministic — cacheable) |
| **B4** Family Kundli Vault | ◐ | localStorage profiles (FamilyManager) → server-side `Person` with explicit relation + ownership; storage contract already documented as identical |
| **B5** Personal Astrology Vault `/my-cosmic-record` | ◐ | Consultation history exists; questions/predictions/events/practices/notes all new |
| **B6/B7** Practice / Sankalp | ❌ | No practice objects anywhere (Darshan page is content-only) |
| **B8** Darshan integration | ◐ | Darshan page (streams + ritual windows) exists; linking to Practice/Sankalp new |
| **B9** Notification engine | ◐ | `vedicAlerts` gives the deterministic "why" content (e.g. "Jupiter enters a period previously marked relevant…" is directly computable from dasha + alert data); delivery infra (in-app + email) new |
| **C1** Pandit client workspace | ◐ | `/pandit` + `/pandit/cases/[id]` exist (mobile-optimized, no auth, hardcoded name); client view over `Person` new |
| **C2** Consultation brief | ◐ | `calculationSnapshot` = raw material; auto-render new |
| **C3** Structured Pandit notes | ◐ | Free-text `practitionerNotes` → typed notes |
| **C4** Scholar review of Kashi | ◐ | Review route + audit-stored original exist; extend action enum + auth |
| **C5** Reviewed answer display | ◐ | `practitionerFinal` + `aiModel`/`promptVersion` provenance exist; labeling + evidence provenance UI new |
| **C6** Specialized reports | ◐ | One text generator; C6 = views over shared snapshot + evidence (no new engines) |
| **C7** Relationship workspace | ◐ | 8-koota Guna Milan + Mangal Dosha live (deterministic, tested); Moon/Lagna/D9/Venus/Mars/Jupiter/7th-bhava layer + cancellation rules + temporal compatibility new (D9 needed) |
| **C8** Relationship timeline | ◐ | Both persons' dasha layer ✓ (engine reusable); overlap rendering new |
| **C9** Muhurta search | ◐ | `muhuratData.js` cards + `MuhuratDiscovery` (marketing) exist; deterministic candidate-window engine new |
| **C10** Prashna | ❌ | Reuses D1 engine at question time; workspace + persistence new |

---

## 13. DEFECT REGISTER (found or confirmed in this audit)

| ID | Sev | Defect | Disposition |
|---|---|---|---|
| D-01 | P0 | Unauthenticated case approval (S-1) | Fix pre-Phase-1 (one-day) |
| D-02 | P0 | Anonymous enumeration of unmasked birth data (S-2) | Fix pre-Phase-1 |
| D-03 | P1 | `ChatBox.tsx` fabricated AI replies (dead code today; import anywhere = trust violation) | Delete or rewire to Kashi 2.0; add lint/test guard that no component fakes AI |
| D-04 | P1 | Hardcoded 06:00–18:00 daylight in `engines/panchang.js` → wrong Rahu Kaal on 3 surfaces + inside the **paid snapshot** | Unify panchang engines (E-5) |
| D-05 | P1 | 3 divergent ephemerides, ~0.6–0.7° Moon error, no retrograde (E-1/E-2) | Ephemeris module (decision D-2) |
| D-06 | P1 | Dasha engine divergence + 365.25-day date math (E-4) | Unify (§2.2) |
| D-07 | P1 | Capability registry stale vs live `/kundali-milan` (ASHTAKOOT) | Sync registry + add parity test |
| D-08 | P1 | No aspect (Drishti) computation | New engine (blocks A5/A6/C7) |
| D-09 | P2 | No birth-time confidence field (E-7) | Phase 1 domain |
| D-10 | P2 | `v34` version strings hardcoded in 3 places | `ENGINE_VERSIONS` manifest |
| D-11 | P2 | Unauthenticated `/analytics` writes, no rate limiting (S-3/S-4) | Hygiene wave |
| D-12 | P2 | WhatsApp delivery not wired (known since prior verification) | Out of scope for A; keep status honest |
| D-13 | P2 | Node engines 24.x vs sandbox Node 22 (tests pass; CI parity to confirm) | Note for CI |

*(Prior-phase P0-1 nakshatra render crash, P0-2 hardcoded secrets, P0-3 simulated payment: all verified FIXED in current tree — regression test #13, fail-closed `auth.ts`, real Razorpay order flow.)*

---

## 14. IMPLEMENTATION DEPENDENCY GRAPH (revised phase plan)

The brief's phase order is kept; where archaeology forces a dependency change it is marked **(ARC)** and justified.

```
PHASE 0  ✔ THIS DOCUMENT
   │
PHASE 1  Domain model + migration (additive Prisma) + account/ownership pattern + ENGINE_VERSIONS manifest
   │      ← decision D-1 (account/privacy) and D-2 (ephemeris standard) GATE this phase's Person/Account scope
   │      Parallel hygiene wave (independent of decisions): D-01, D-02, D-03, D-07, D-11  (S-1/S-2/ChatBox/registry/rate-limit)
   │      ARC: engine unification (dasha, panchang, ephemeris, shared constants) lands HERE, before EvidenceGraph,
   │           because EvidenceNode.sourceEngine/algorithmVersion must point at ONE engine per domain
   │      → checkpoint PJOS-01-DOMAIN
   ▼
PHASE 2  EvidenceGraph (entities + queries: findByPlanet/Bhava/Domain/DateRange/Dasha/Varga/Event, traceDependencies)
   │      + L2 invariant tests CT-A-001/002/005/007/008/010  → PJOS-02-EVIDENCE
   ▼
PHASE 3  EvidenceCompiler (12 domains) + evaluateEvidenceBalance
   │      + NEW deterministic engines wave 1: ephemeris upgrade, retrograde, aspects, combustion,
   │        Shodashavarga (D9/D10/D7/D12/D60), Vimshopaka, Bhava Bala   (E-1..E-3 resolution)
   │      + NEW engines wave 2: Shadbala core, Ashtakavarga, Gochar/transits (+Sade Sati), Varshaphala
   │      (waves may interleave with Phase 4 domains that only need D1/dasha/panchang; compiler emits
   │       structured missing[] per INV-002 until an engine lands)  → PJOS-03-COMPILER
   ▼
PHASE 4  Life Question Workbench /kundli/[id]/explore (12 domains)  → PJOS-04-DOMAINS
   ▼
PHASE 5  Graha / Bhava / Varga explorers (A5–A7)  → PJOS-05-EXPLORERS
   ▼
PHASE 6  Temporal engine + Time Explorer + findAstrologicalWindows (A8/A9)  → PJOS-06-TIME
   ▼
PHASE 7  Event Explorer (A10) + birth-time sensitivity (A11)  → PJOS-07-EVENTS
   ▼
PHASE 8  Prediction ledger (A12/A13) + immutability tests CT-A-003/004/006  → PJOS-08-PREDICTIONS
   ▼
PHASE 9  Kashi 2.0 (A14/A15/A16)  → PJOS-09-KASHI
   ▼
PHASE 10 Release B: daily personalization (B1–B3, B9)
PHASE 11 Family / personal vault (B4/B5)
PHASE 12 Practice / Sankalp / Darshan integration (B6–B8)
PHASE 13 Pandit operating system (C1–C5, C6 reports)
PHASE 14 Relationship / Muhurta / Prashna (C7–C10)
PHASE 15 Adversarial release audit (personas §28, matrix §29, verdict §31)
```

**Critical path:** ephemeris + retrograde + aspects + vargas + transits (Phase 3 waves) are on the critical path for everything time-aware and professional (A5–A11, B2, C7, C9). Everything dasha/panchang-based (A4 core, A8 layer 1, B1) can ship ahead of them with honest `missing[]` evidence.

**Explicitly deferred (per brief §5):** birth-time rectification (D1), research notebook (D2), cohort analysis (D3) — placeholders/interfaces only.

---

## 15. OWNER DECISION POINTS (program stop conditions, §26)

These are the **only** items that halt the program per the mission's own stop conditions. Everything else proceeds without further permission.

**D-1 · Account & privacy policy (halts Phase 1 Person/Account scope until answered).**
Server-side longitudinal records (predictions, events, questions) require a person→account ownership model; the existing design is localStorage-first with phone-OTP accounts explicitly deferred ("DB-backed AstrologyCustomerProfile … once phone-OTP accounts ship" — `profileStore.js` header). This is a DPDP/privacy-architecture policy decision (consent capture, family-profile permission semantics for another adult's data, account deletion/export).
**Recommendation:** Phase 1 defines `Account` + `Person` with `accountId` ownership + sensitivity tags (PUBLIC / ACCOUNT_PRIVATE / PERSONAL_ASTROLOGY / CONSULTATION_CONFIDENTIAL / PANDIT_INTERNAL) and an **additive** migration; account *mechanism* (phone-OTP) may remain a thin token for the pilot if the owner prefers, but the **ownership boundary must be server-side from day one** — localStorage cannot host prediction immutability (INV-006) or Pandit workspaces (C1).

**D-2 · Ephemeris precision & Jyotish conventions (halts ephemeris upgrade commit until confirmed).**
Upgrading from truncated series to Meeus 6-term/VSOP-lite changes some pinned golden values (lagna minutes, nakshatra pada near boundaries, dasha start dates). Needs a declared convention set: ayanamsha = Lahiri (full series), node = true vs mean for Rahu (affects drishti-heavy rules), house system = equal (rashi) for all rashi-based outputs, dasha AD proration rule for the first partial MD (choose and document one of the two current implementations). Pandit input is appropriate here (unresolved convention → human decision per §26).
**Recommendation:** Meeus low-precision (6-term), true node for Rahu/Ketu, equal-house (rashi) convention, AD proration = pro-rata of first MD (implementation A), golden table re-pinned against published Lahiri reference values for 10 benchmark births (1950–2020) committed alongside.

**D-3 · (non-blocking, flagged)** WhatsApp delivery ownership (D-12) and Node 24 CI parity (D-13) — record owners, no code gate.

---

## 16. IMMEDIATE ACTION LIST (pre-Phase-1, unblocked by decisions)

1. Fix D-01 (auth on case review) + D-02 (mask birth data in anonymous list) — with L2 tests.
2. Delete or quarantine D-03 `ChatBox.tsx` fake AI; add regression test that no shipped component contains simulated AI replies.
3. Sync capability registry with live `/kundali-milan` (D-07) + parity test.
4. Rate-limit public POSTs; gate `/consultations/test` and `/analytics` (D-11).
5. Add `test`/`typecheck` to CI config (scripts exist in `package.json`; no CI definition in repo).
6. Clean committed scratch artifacts (`scratch/`, `test-results/`, stray `workspace-*` file) per prior verification's hygiene note.

After owner answers D-1/D-2: **Phase 1 (PJOS-01-DOMAIN)** proceeds exactly as graphed in §14.

---

## Appendix A — File map (audit evidence index)

```
Canonical D1 engine ........ src/lib/astrologyEngine.js          (+ src/engines/astrologyEngine.js re-export)
Dasha (two copies) ......... src/lib/dashaEngine.js, src/engines/dashaEngine.js
Panchang (two copies) ...... src/lib/panchang.js, src/engines/panchang.js
Guna Milan ................. src/lib/kundaliMilan.js
Personal alerts/ICS ........ src/lib/vedicAlerts.js, src/lib/festivals.js, src/lib/muhuratData.js
Numerology ................. src/lib/numerology.js
Profiles (localStorage) .... src/lib/profileStore.js
AI boundary ................ src/lib/paymentPipeline.ts, src/engines/guruAI.js,
                             src/app/api/astrology/consultations/{create,test}/route.ts,
                             src/app/api/astrology/payments/{verify,webhook}/route.ts
Paid pipeline surfaces ..... src/app/ask/*, src/app/pandit/*, src/app/astrology/cases,
                             src/app/api/astrology/cases/[id]/{review,deliver}/route.ts
Security ................... src/lib/auth.ts, src/lib/razorpay.ts, src/middleware.ts
Persistence ................ prisma/schema.prisma, src/lib/db.ts
UI reuse seeds ............. src/components/{KundaliExperience,SwargaLok,DashaHero,DestinyTimeline,
                             MyDaysPanchang,TodayAtAGlance,VedicDayRibbon,PersonalCalendar,
                             IntentRouter,QuestionRefiner,KnowledgeGraph,CapabilityRegistryModal,
                             FamilyManager,PersonalisationBridge,ChatBox(dead)}.jsx|tsx
Tests ........................ tests/{astrology,features,responsive}.spec.ts
Prior-phase evidence ....... coc/PRODUCTION_VERIFICATION.md, coc/REVIEW_GUIDE_FOR_AGENT.md,
                             coc/PROJECT_DESIGN_JOURNAL.md, coc/IMPROVEMENT_AUDIT.md
```

*End of Phase 0. No implementation performed. Repository left green (13/13 tests, 0 typecheck errors, tree unmodified except this document).*

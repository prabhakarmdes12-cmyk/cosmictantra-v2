# COSMICTANTRA — SPRINT C — CONVERSION JOURNEY 01 — DESIGN MAP (§32)

Base: `0314aa7` (Sprint B.1). Builds on B.1 — no navigation/location/validator rollback.
Engine files: **read-only** (no modification). Everything below consumes engine data.

---

## A. Landing — desktop

- **Hero (light, first viewport).** Promise: *VEDIC PRECISION. / HUMAN WISDOM.*
  Secondary: *Understand your chart. Know today's timing. Ask when it matters.*
  Supporting: *Precise Jyotish calculations, explained clearly, designed to preserve
  human scholarly judgement where tradition requires interpretation.*
- **Primary CTA: CREATE MY KUNDLI** (opens the progressive birth form, dominant, gold).
  Secondary: **TODAY'S PANCHANG** (scrolls to the Today strip).
  Tertiary text link (honest, no fake engine): **Already have a chart? Open My Kundli →** (`/dashboard`).
  *No "Verify/Compare" link — no comparison engine exists. No ₹501 ask link in the hero.*
- Right: **Cosmic Now dial** — factual panchang telemetry; "Set location" gate when city unknown.
- Form (in-hero micro-drawer): 4 progressive steps — Name → Birth date → Birth time + certainty
  (Exact / Approximate / I don't know) → Birthplace (canonical city search or GPS; **no silent
  city fallback** — unresolved = error message). Calc state → `/kundli/{id}`.
- **Trust strip** immediately below hero: Calculated not guessed / Conventions declared /
  Interpretation is separate / Human judgement preserved (reads engine metadata read-only).
- **Ticker:** factual only — "Today: Moon in Rohini · Shukla Paksha Shashthi · Brahma Muhurta…"
  Personalised line only when legacy engine actually returns `dasha` for the active chart.

## B. Landing — mobile (320/360/390/430/768)

- Same hierarchy, single column. Hero CTA column-first; dial below; form steps full-width;
  touch targets ≥44px; sticky primary nav untouched; no horizontal overflow;
  keyboard-open inputs must not be hidden by the bottom nav (test).

## C. Birth details

- 4 steps with progress rail; only Name / DOB / TOB / Birthplace + time certainty.
  No email/phone/gender/gotra/marital/occupation. Place resolution is mandatory (city DB or GPS);
  unknown place → INPUT_INCOMPLETE error, never a default city.

## D. Calculation state

- "Calculating your chart…" + real steps that have genuinely run before navigation:
  Birth details normalized → Planetary positions calculated → Lagna & Nakshatra established
  → Dasha timeline prepared → Chart stored. Each is backed by `getCanonicalJyotishSnapshot` +
  `createKundli` completion. Failure → intentional FAILED card (retry), no partial chart.

## E. First Kundli insight (`/kundli/{id}` — new first viewport)

Light consumer viewport, above the existing dark workspace:
**MY KUNDLI** — name, birth line, validation state badge.
**AT A GLANCE** — Lagna · Moon Rashi · Janma Nakshatra · Current Mahadasha · Current Antardasha.
**WHAT IS ACTIVE NOW?** — engine Dasha card (MD/AD, dates, [Calculated] badge) + [WHY?] [ASK ABOUT THIS].
- Claim grammar (subtle): `CALCULATED` / `DERIVED` / `TRADITIONAL READING` / `SCHOLAR JUDGEMENT` /
  `VALIDATION PENDING` — only used where truthful (this sprint ships Calculated + Validation Pending;
  the rest appear as an honest legend, never as fabricated content).
- Evidence-backed pattern block: **not populated** (no trustworthy engine pattern objects) —
  honest empty state line only.
- **EXPLORE MY CHART →** divider; all existing dark workspace content remains below, untouched.

## F. WHY drawer

Progressive evidence drawer (current Dasha only), entirely from engine fields:
1. Moon Nakshatra at birth (engine) → 2. Nakshatra lord (engine) → 3. Dasha balance at birth
(engine) → 4. Vimshottari MD sequence with dates (engine) → 5. Current MD (engine dates)
→ 6. Current AD (engine). `SHOW TECHNICAL CALCULATION` (monospace): Moon longitude/degree,
Dasha balance, engine version, ayanamsha — verbatim. When birth time is not EXACT, an honest
note states Dasha boundaries may shift. **No invented steps, no tradition claims.**

## G. Ask continuation

`ASK ABOUT THIS` → dispatch `KashiJourneyContext` (chartId, route, MD/AD ids, evidence ids,
language, validation statuses — **no birth PII**) → Kashi Sahayak opens and receives the
question through its own deterministic pipeline (no recalculation, no hardcoded answer).
`ASK A PANDIT` → `/ask?chart=&dasha=&question=&lang=` carrying context; /ask prefills the
question + shows carried-context hint (existing consultation intake, no fake availability).

## H. Saved Kundli state

`SAVE MY KUNDLI` after value delivered (not before): sets active chart + profile (same existing
stores), benefit copy (daily guidance, Dasha timeline, questions, consultations), confirms
"Saved ✓" and links to My Kundli `/dashboard`. Preset charts (e.g. Gandhi) show no save CTA.

---

## Scope guards (from spec)

- Engine (astronomy, ayanamsha, Dasha maths, Panchanga, Vargas, Shadbala, Ashtakavarga,
  Gochara, Yoga, Dosha): **zero edits** — consumed read-only.
- Kundli page: only the first viewport changes; deeper content stays.
- Today page: only participates in the same system (Ask-about-today entry); no redesign.
- Executive Life Matrix: removed from the default consumer report Overview; preserved behind
  the existing WORKBENCH (Explorer) tab with an explicit EXPERIMENTAL label.
- Darshan & Puja: untouched (stays under Explore). No puja commerce in the journey.
- No new astrology calculation in UI; no fake loading; failure states intentional.

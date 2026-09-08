# Gap audit vs the other agent's calendar work + implementation plan

**Date**: 8 September 2026 · **Branch audited**: `arena/01a07d75-cosmictantra-v2` (`8e77019` + later festival-page/baidyanath commit)

## Status of the plan

| Phase | Scope | Status |
|---|---|---|
| **A — Astronomy correctness** | Amanta month tracker (festival months, Adhika-correct), sunrise skip-rescue + cross-month dedupe, Janmashtami Smarta duplicate removed, real-date anchors, spec fixes, 3-year sweep | ✅ **implemented & verified** — see `CALENDAR-ARTWORK-2026-09-08.md` §"Engine corrections" and the new spec suite. 23/23 web-confirmed 2026 observances within ±1 d (20 exact); every yearly festival fires exactly 3× over 2026–2028; pinned maas tests green (labels untouched); `artwork:verify` 100%; typecheck + build PASS. Caveat ±1 trio documented (Holi 2 vs 3 Mar, Raksha Bandhan tithi-day 27 vs observance 28 Aug — a real 2026 public debate, Bhai Dooj 10 vs 11 Nov). One note vs the other agent's report: their spot-check "Diwali 2028 = 15 Nov" does not match drik panchang (2028 Lakshmi Puja = **17 Oct**, exactly what this engine emits); their Navratri 2027 = 30 Sep and Dussehra 2027 = 9 Oct match exactly. |
| **B — Framed-Thangka आज hero + `heroMood` + gold-leaf headline + शुभ seal** | — | ⏳ not started |
| **C — Month-surface features** (mobile Today preview, forward-only festival tab, पूजा विधि button, instant Choghadiya, world-calendar modal, list/90-day planner) | — | ⏳ not started |
**Source of comparison**: the other session's notes (branch `arena/01a07c9f`, never pushed) covering the full Vedic-calendar programme: Amanta month tracker, Paksha `heroMood` + "Framed Thangka" आज hero, festival gold-leaf headline + शुभ seal, Choghadiya, mobile Today preview, world-calendar modal, list/planner views, 49-asset artwork program.

This audit is evidence-based: every "present/absent" claim below was checked by grep/probe on this branch. It does **not** rebuild their code (unreachable); it plans an equivalent re-implementation where the gap matters.

---

## 1. What we already include (parity confirmed)

| Item | State here | Evidence |
|---|---|---|
| 49-artwork asset set (15 core + 10 expanded + 16 tithi + 8 category), 16:9 WebP + `-sm` thumbs | ✅ complete | `public/assets/calendar/events/*` 49/49; `npm run artwork:verify` = 100% |
| Day-artwork resolver (festival → generic → category → tithi; 365/365, 30/30) | ✅ | `src/lib/calendar/festivalArtwork.ts` |
| Art strip in month-grid cells + art hero in day inspector | ✅ | `AuraMonthlyCalendar.tsx` |
| Paksha-correct theme toggle on `/calendar?view=today` banner (indigo vs marigold + शुभ रात्रि/दिवस chip) | ✅ | `pakshaTheme.ts` + `UnifiedPanchangCalendarClient.tsx` |
| Guru Purnima & Makar Sankranti emitted (previously never) | ✅ | engine + tests |
| Festival detail pages `/festivals/[slug]` hero art | ✅ | `resolveFestivalTitleArtwork` + SSG verified |
| Baidyanath Dham image (only missing referenced image) | ✅ | audit = 0 missing |

## 2. What the other agent did that we are NOT including

### A. Astronomy correctness (the big one) — **NOT included, and our current state is measurably wrong**

Their fix: an **ephemeris-driven Amanta month tracker** — months run new-moon → new-moon and take the name of their in-month Sankranti (Shukla paksha takes the month's Sankranti name; Krishna paksha takes the *following* Sankranti's name). Matched **14/14 web-confirmed 2026 dates** before implementation, 15/16 within ±1 day after.

Ours: single-line alignment `lunarMonthIdx = (sunRasi + 1) % 12` (a solar-sign approximation). Probe vs web-confirmed 2026 dates **23 observances → only 16 within ±1 day; 7 are a full lunar month (~29–30 d) EARLY**:

| Observance | Real 2026 (web) | Our engine | Δ |
|---|---|---|---|
| Guru Purnima | Jul 29 | Jun 29 | −30 d |
| Raksha Bandhan | Aug 28 | Jul 29 | −30 d |
| Janmashtami | Sep 4 | Aug 6 **and** Sep 4 | extra spurious occurrence |
| Durga Ashtami | Oct 18 | Sep 18 | −30 d |
| Vijayadashami | Oct 20 | Sep 21 | −29 d |
| Sharad Purnima | Oct 25 | Sep 26 | −29 d |
| Dev Deepawali (Kartika Purnima) | Nov 23 | Oct 25 | −29 d |

(Makar Sankranti, Vasant Panchami, Shivaratri, Chaitra Navratri, Ram Navami, Ganesh Chaturthi, Karwa Chauth, Dhanteras, Narak, Diwali, Govardhan, Chhath all exact; Holi/Bhai Dooj ±1 d — the ±1-day tithi-vs-celebration convention.)

Root cause: 2026 has an **Adhika (intercalary) lunar month**, so sun-sign month boundaries drift from amanta lunar months; a sign-anchored index cannot place month-qualified festivals correctly across the whole year. This also means **our month-grid artwork currently lights the wrong days for ~a third of observances**.

Also missing: their **per-day `tithisInDay()` evaluation + per-tithi centre-time month lookup + per-city cross-month dedupe** (fixes tithis that straddle a noon sample and vanish, and double-fires — our Janmashtami double is live evidence; a 3-year exactly-3× sweep was their acceptance).

### B. आज (Today) hero — "Framed Thangka" + `heroMood` — **NOT included**

`/calendar?view=today` here has **no artwork at all** (`grep "<img" UnifiedPanchangCalendarClient.tsx` = 0). Their committed `766dc84` built:
- full-bleed day-artwork hero (gold 2px frame, outer gold shadow, deep ink-brown base `#160C05`)
- a single **`heroMood`** object driving base colour + all three scrim layers + glow + frame + shadow: Shukla = warm marigold/diya-amber bloom; **Krishna = indigo `#0A0E24` night + cool moonlit glow** `rgba(165,180,252)` (we only switch the banner background/glow tint, not a unified mood system)
- tricolor hairline (saffron→white→green) top edge, vertical saffron→gold→green accent bar, frosted glass chips (संवत् + ऋतु/अयन), rangoli-dot corner
- typography split: festival day → gold kicker `🪔 आज का पर्व` + gold-leaf gradient festival name; regular day → `🙏 आज की तिथि` + तिथि • नक्षत्र headline; date line + solid-gold मास chip
- `eager` + `fetchPriority: high`, `onError` collapses to ink panel

### C. Festival-day seal 🪔 — **NOT included**

Their festival-day **gold-leaf gradient headline** (pale→antique gold `bg-clip-text`) + **शुभ 🙏 double-ring gold seal** beside the kicker (regular days stay plain white — festival days feel special). We only have the plain `🪔 शुभ दिवस/रात्रि` chip.

### D. Month-surface UI features — **NOT included**

| # | Feature (their work) | Grep evidence here |
|---|---|---|
| D1 | Mobile **Today Preview box** (`sm:hidden`) below grid: sunrise/sunset, Tithi/Nakshatra/Yoga/Karana, next-3 festivals | no `sm:hidden` preview block |
| D2 | **Festival tab forward-only**: past observances hidden when browsing earlier months | only filter pills (ALL/POWER/CAUTION/FESTIVALS) |
| D3 | **पूजा विधि** button always visible, tithi-based sankalp fallback on non-festival days | 0 hits for `पूजा विधि` |
| D4 | **Quick Choghadiya** (instant 8-kala row from sunrise/sunset) + scholar bundle lazy-loads only on Scholar tab | Choghadiya exists elsewhere (TodayAtAGlance/regional) but not as the sheet's instant row |
| D5 | **World-calendar modal** with live era years per system (आज: 2083 अश्विन / 1448 AH / 1433 …) | no such modal |
| D6 | **List view + 90-day festival planner** consuming the same artwork | none |

(Their extra artwork consumers — list view, festival tab, vrata tab, day-detail sheet — are partially covered by our inspector hero; full parity needs D-items.)

### E. Numbers nuance

Their verifier quoted 360/360 days / 121 festivals vs our 365/365 / 34 distinct types (125 occurrences) — both 100%-of-engine; the counts differ because the engines emit slightly different date sets (their month tracker is the difference).

---

## 3. Implementation plan

### Phase A — Astronomy correctness (P0; do first, artwork depends on it)
Port-equivalent of their Amanta tracker **into our `monthlyPanchangEngine.ts`** (keep this file's public API, day labels, masa chips, tithi/nakshatra/samvat output byte-stable):
1. Compute **amanta lunar month boundaries** from new moons (existing `getMoonLon`/tithi code) and name each month by its in-month **Sankranti** per the convention they derived (Shukla→in-month name, Krishna→next name), zero hardcoded dates.
2. Evaluate festivals **per day via `tithisInDay()`** (tithi that covers any part of the civil day / its applicable window, e.g. sunrise rules for Ekadashi, Udaya tithi) with centre-time month lookup and **cross-month dedupe** so short/straddling tithis neither double-fire nor vanish.
3. Move month-qualified rules onto the true month; keep universal vrats (Ekadashi/Pradosha/Purnima/Amavasya/Chaturthi) as-is.

**Acceptance (executable):**
- ≥20/23 of the reference table above within ±1 day (target: the same ~14/14 they matched; 2026 is the hard year) and no spurious Janmashtami.
- Existing `tests/panchang-maas-verification.spec.ts` (3/3) still green; masa/day labels byte-identical.
- **Update our own anchors in `tests/calendar-festival-artwork.spec.ts`** (currently assert the wrong dates we just shipped: Guru Purnima 2026-06-29, etc. → real dates).
- 3-year sweep 2026–28: every yearly festival fires **exactly 3×**; spot check Dussehra 2027 = Oct 9, Diwali 2028 = Nov 15, Navratri 2027 = Sep 30 (their anchors).
- `npm run artwork:verify` still 100%; typecheck/build PASS.

**Files:** `src/engines/monthlyPanchangEngine.ts`, `tests/calendar-festival-artwork.spec.ts`, `tests/panchang-maas-verification.spec.ts` (extend), new `tests/amanta-month-tracker.spec.ts`, `docs` update.
**Risk note (theirs, agreed):** fixing months changes *which days light up* across the calendar — that is the point; labels are unchanged, so pinned maas tests still pass.

### Phase B — आज hero: Framed Thangka + `heroMood` + seal (P1, visible wow)
In `UnifiedPanchangCalendarClient.tsx` (today view), reuse `resolveDayArtwork`:
1. Full-bleed 16:9 art hero under the existing banner: gold frame + outer shadow, ink-brown fallback panel, `eager`/`fetchPriority: high`, `onError` collapse.
2. Introduce a single `heroMood` derived from `resolvePakshaMood` (Shukla: marigold/diya-amber bloom, gold frame; Krishna: `#0A0E24` indigo scrims, moonlit `rgba(165,180,252)` glow, indigo frame) and drive every layer from it.
3. Tricolor hairline, accent bar, frosted glass chips (संवत्/ऋतु/अयन), rangoli corner.
4. Festival days: gold-leaf gradient headline + `शुभ 🙏` double-ring seal; regular days white `तिथि • नक्षत्र`.
**Acceptance:** SSR HTML carries the palette + art; mobile 390px no overflow; tests for mood mapping; keep existing paksha spec green.

### Phase C — Month-surface features (P2; can be split)
D1 Mobile Today preview · D2 forward-only festival tab · D3 पूजा विधि + sankalp fallback · D4 instant Choghadiya row + lazy scholar tab · D5 world-calendar modal with live era years · D6 list view + 90-day planner. Each a small self-contained change with a spec; D4/D5 first, D6 last (biggest).

### Cross-cutting
- After Phase A, **reconcile `src/lib/festivals.js` (`UPCOMING_EVENTS`)** hand-written dates with the engine (already flagged: Navratri dated 12 Sep vs engine 11 Oct).
- Keep the honest-gate discipline: verifier + pinned tests + SSR checks; no Chromium here → list the visual browser pass for the release-review machine.

## 4. Suggested order
**A → B → C** (A unblocks truthful artwork placement everywhere; B is the user-visible centrepiece; C is polish). Each phase lands as its own commit with the acceptance evidence above.

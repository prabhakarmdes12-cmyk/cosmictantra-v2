# Calendar UX Audit — /calendar vs "mobile-first, best-in-class" (2026-09-08)

> **⚠️ Concept image status.** The attached PNG *("ChatGPT Image … 09_22_19 PM.png")* did **not** arrive in this environment, and this session has no vision — but on 2026-09-08 the user supplied the concept as a **written design brief** (excerpted in §1A), which we can implement against directly. Nothing in this audit claims pixel fidelity to the image; it is the code-level baseline plus the design-brief-driven roadmap.
>
> **Progress:** Phase D1 (Today-tab unify: festivals + personal energy + अगले-पर्व rail, in the ivory/antique-gold system) is implemented and pushed; see §4.

---

## 1. What ships today (code map)

| Surface | Where | Notes |
|---|---|---|
| `/calendar` route | `src/app/calendar/page.tsx` | `CosmicTantraShell` + `UnifiedPanchangCalendarClient defaultView="month"`, container `px-3 … max-w-7xl` |
| `/my-calendar` route | `src/app/my-calendar/page.tsx` | **Duplicate** bare `AuraMonthlyCalendar` page, same `<title>`/canonical as `/calendar` (SEO + IA duplication) |
| Tabbed client (आज / मासिक) | `src/components/calendar/UnifiedPanchangCalendarClient.tsx` (550 L) | `?view=today\|month` URL param, `replaceState`; today-screen and month-screen shells |
| Monthly grid + day hero | `src/components/calendar/AuraMonthlyCalendar.tsx` (1039 L) | 12-month selector bar, dual-title header, city/language/profile/filter bars, 7-column grid, day-inspector modal |
| Day data | `src/engines/monthlyPanchangEngine.ts` | Per-day: tithi/nakshatra/yoga/karana, moon phase, sunrise tithi, festivals, personal energy (Tara/Chandra), Abhijit/Rahu/Brahma/Amrit/Yamaganda/Gulika timings. Amanta lunation tracker committed (Adhika-correct). |
| **Today-view data** | `src/lib/panchang.js` → `calculatePanchang` | ⚠️ **No `festivals`, no `personalEnergy`.** Only the 5 limbs + sun times + kāla windows |
| Artwork | `src/lib/calendar/festivalArtwork.ts` + 49 assets | Strip on every grid cell (thumb), 16:9 hero in day inspector |
| Paksha hero/seal | `src/lib/panchang/pakshaTheme.ts` | Banner mood (Krishna-Indigo / Shukla-Marigold) + "शुभ रात्रि/दिवस 🙏" seal |

**Architectural split worth naming up front:** the two tabs compute "today" from *two different engines*. The आज tab uses `calculatePanchang` (limbs + muhurats only); the मासिक tab uses `calculateMonthPanchang` (same limbs **plus** festivals + personal energy). Consequences: today's festival/vrat is invisible on the आज screen even though the very same date 30 rows below carries a festival banner; and "personal energy" never appears on the screen named for personal use. This is the single deepest inconsistency to fix while adopting the concept.

---

## 1A. The concept — user's written design brief (2026-09-08)

> *"Implement the CosmicTantra Vedic Calendar visual system… quiet editorial composition, warm ivory base, antique-gold emphasis, restrained sacred imagery, compact information-dense calendar, strong novice readability, scholar depth available on demand, premium Indian visual identity, mobile-first responsive behaviour, calendar visible in the first fold. A refined Indian astronomical almanac translated into a modern digital product — NOT a generic SaaS dashboard, NOT AstroTalk, NOT a neon astrology app, NOT a religious poster, NOT a dense enterprise table. CALM · EDITORIAL · PRECISE · PREMIUM · sacred but not ornamental · Indian without folklore · modern without generic. Light mode primary on warm parchment #FAF7F2; near-black primary text; antique muted gold only for active state, selected date, primary CTA and important sacred emphasis — never everywhere. Desktop = a centred editorial canvas ~1180–1280 px, generous side margins, a carefully typeset publication."*

That brief is the yardstick for every change in this roadmap. Note its tension points against the current code, tracked in the W-table: today's marigold-gradient hero headline and gold-flooded chips are louder than "restrained gold"; the month grid is denser than "compact editorial"; the desktop page is `max-w-7xl` (1280) which fits the brief's 1180–1280 bracket.

## 2. Mobile layout as it actually renders (measured from classes)

Viewport math for the month grid (AuraMonthlyCalendar, card `p-5`, day-grid `gap-1.5` below `sm`):
`cellWidth ≈ (100vw − 24 px-3 − 40 p-5 − 36 six×gap-1.5) ÷ 7`  — padding and gaps widen at `sm+`; the phone row is the case that matters here.

| Viewport | Cell width | Row min-height | What fits |
|---|---|---|---|
| 360 px | **≈ 37 px** | 115–135 px | art strip forced to 37×36, date + तिथि truncated, nakshatra line-clamped, two badges |
| 390 px | ≈ 41 px | 115–135 px | same stack, ~10 % wider |
| 640 px (sm) | ≈ 67 px | 135 px | readable date/tithi, cramped badges |
| 768 px (md+) | ≈ 85 px | 135 px | near-desktop density |
| ≥1024 px (lg, capped at 7xl) | ≈ 119–156 px | 135 px | designed-for density |

So on a 360–430 px phone the product ships a **desktop grid at 37 px cells**: the day card stacks 6 information layers vertically (art 36 px, date row, tithi, nakshatra, energy pill, rahu line) in a ~40 px column — each layer clipped by `line-clamp-1`/`truncate`. 30 `<img>` strips per month (~384×216 scaled to 37 px wide) still download/decodes — visible cost for near-zero information at that size. Rows run ≈130 px tall × 5–6 rows ≈ **800 px of grid** per month view.

The आज view fares better (it is genuinely `flex-col`, full-bleed cards) but the tab switcher and everything above it scrolls away; there is no sticky control, no list view, no swipe, no week numbers, no bottom "today" affordance.

---

## 3. UX-designer assessment of the current product

**Strong (keep — the concept should build on these, not replace them):**
1. Dual-language (Devanagari-first) and dual-calendar literacy (संवत्/शक, maas chip, paksha legend) is a genuine differentiation; the paksha-mood hero + seal is memorable and on-brand.
2. Location honesty (§10): no guessed city; city rail is one tap; per-coordinate sunrise drives kāla windows.
3. Deep day inspector: 5 limbs + 4 muhurats + sun/moon + festival + export (WhatsApp / Google Calendar / .ics) — rare completeness.
4. Art program: every cell resolves to art (never blank), festival-grade on observance days; consistent 16:9 hero.
5. Filter pills (All/Power/Caution/Festivals) with live month counts are a real energy-scanning tool.

**Weaknesses a best-in-class mobile calendar must fix (ranked):**

| # | Surface | Finding (evidence) | Best-in-class behaviour |
|---|---|---|---|
| W1 | आज screen | No today-festival/vrat callout, no personal-energy card — the two most personal fields are absent (data doesn't even exist in `calculatePanchang`) | "आज का पर्व/व्रत" hero chip row + "आपके लिए ऊर्जा" strip, sourced from the shared engine |
| W2 | Month grid, ≤640 px | 7-column desktop grid at ~37 px cells; 30 art images per month at thumbnail cost; layers clip | Mobile month = bigger cells via 5–6 day/week rows, art only on festival/power days *or* inside a horizontal "day strip"; keep 7-col from ~md up |
| W3 | Navigation | No swipe/gesture anywhere; prev/next are tiny 28 px icon buttons; no sticky month bar | Full-bleed horizontal swipe between months (edge-crossing rules), ≥44 px targets, sticky compact month header |
| W4 | "Where am I" | No week numbers (Shraavana/Bhadrapada weekly reading is a core North-Indian pattern), no row-week grouping, today highlight hides once you scroll | Wk numbers (ISO, Devanagari १…५३) at week-start; always-reachable "आज" pill + bottom bar |
| W5 | Orientation/context | When you tap a day → modal replaces context; month header not sticky; long scroll to next month | Tap = bottom sheet from the tapped cell (mobile), never a centered desktop modal; Esc/backdrop/gesture to dismiss |
| W6 | Planning | No "what's next" horizon: nothing tells you the *next* festival/vrat/muhurat from today | अगले प्रमुख पर्व rail (7/14/30/90-day horizon) with countdown chips; planner feed |
| W7 | Today≠Month data | Two engines, two "today" definitions (see §1) | One shared day model behind both tabs |
| W8 | Info architecture | `/my-calendar` duplicates `/calendar` with same canonical | Consolidate into `/calendar` (redirect), single metadata |
| W9 | Accessibility | Icon-only buttons rely on `title`; modal: no Esc, no focus trap, no `role="dialog"`/`aria-modal`; `animate-ping`/`blur` without `prefers-reduced-motion` | Full a11y pass: `aria-label`s, dialog semantics, focus management, reduced-motion |
| W10 | Micro-interactions | `playTick` on taps is nice; but no haptic-grade feedback on festival taps, no share-from-cell | Consistent press states; share/inspect from any cell; OS share sheet |

---

## 4. Delivered this session

**4a. Pure data layer** — typechecked, covered by `tests/calendar-ux-support-features.spec.ts` (12/12):

| File | Purpose | Consumed by |
|---|---|---|
| `src/lib/calendar/upcomingFestivals.ts` | Forward-only scan of the real engine for the next major observances (4-month window, cap, universal-vrat exclusion — fortnightly Ekadashi/Pradosha/Purnima/Amavasya/Chaturthi never drown the majors). Returns date, names en/hi, weekday, `daysAway`, full panchang snapshot + resolved art per event | अगले-पर्व rail (shipped, 4b); 90-day planner; list view |
| `src/lib/calendar/weekAndGrid.ts` | Monday-start week math, ISO week numbers (oracle-verified against Python `isocalendar`), leading-blank computation, deterministic one-screen month stepping (swipe/edge rules) | D2: week numbers, month swipe, "आज" jump |
| `src/lib/calendar/vedicDayChips.ts` | 2–3 chip summary of a day (तिथि • नक्षत्र), text-duplicate-safe against festival banners | आज-strip chips; list rows |
| `src/lib/hindiNumerals.ts` | Shared Devanagari numeral converter + countdown words | All new surfaces |

**4b. Phase D1 (Today tab, authorised by user)** — the आज tab now draws its festival roster and personal energy from the **same monthly engine that paints the मासिक grid** (W7 unified for day-level data), while live limbs keep `calculatePanchang(now)` semantics:

- **आज का व्रत एवं पर्व** card — the civil day's engine festival roster (major/minor split), absent before (`data-testid="today-festival-card"`).
- **आज की वैयक्तिक ऊर्जा** — Tara Bala + Chandra Bala card computed from the active Parivaar profile exactly as the grid does; honest add-profile note instead of any fabricated energy when no profile exists (`today-energy-card`).
- **अगले प्रमुख पर्व** rail — the upcoming-festivals feed with Devanagari countdowns (आज/कल/६ दिन); tapping a row deep-links into the month grid at that date and opens its day inspector (scholar depth on demand) (`today-upcoming-list`).
- Styling follows the brief: ivory panels, hairline borders, gold only for emphasis; Devanagari-primary bilingual text.

Files changed: `src/components/calendar/UnifiedPanchangCalendarClient.tsx` (new state/hooks + three panels + `focusDate` wiring), `src/components/calendar/AuraMonthlyCalendar.tsx` (optional `focusDate`/`onFocusHandled` deep-link props — default behaviour unchanged). 43/43 calendar regression tests pass (`festival-artwork` 20, `ux-support-features` 12, `paksha-hero-mood` + `panchang-maas-verification` + `panchang-precision`), `tsc` clean, production `next build` clean.

**4c. Status of the W-table** — W1, W6, W7 = implemented on the आज tab by 4b; W8/W9 partially (no new duplication added; new controls are labelled buttons with text); **W2–W5 + full-tab editorial restyle remain open as Phase D2**.

---

## 5. Phase D2 scope (next increment, awaiting authorisation)

D2 restructures the **मासिक** surface per the brief and the W-table:

1. **Fold-first mobile month** — collapse the intro stack so the calendar grid starts above the fold on phones; compact sticky month header while scrolling.
2. **Mobile density** (W2) — below `sm`, replace the 7-column × 6-layer cells with a readable pattern: either a wide-format week/row layout or a **list view** (day row: Devanagari date, तिथि/नक्षत्र chips via `vedicDayChips`, festival name, art thumb only on festival/power days); keep the dense 7-column grid from `md` up.
3. **Week numbers + week-start setting** (W4) — ISO week number (१…५३) at each Monday-start row; Sunday/Monday preference.
4. **Swipe & today affordances** (W3) — horizontal swipe between months using `weekAndGrid.cellScreenStep`; ≥44 px touch targets; persistent "आज" control.
5. **Bottom-sheet inspector on mobile, modal on desktop** (W5) — with Esc/backdrop dismissal and focus management (W9).
6. **Editorial restyle pass** — quiet ivory cards, restrained gold, calmer hero (per §1A), applied across both tabs; `prefers-reduced-motion`.

Regression contract that stays standing through any UI work: `npm run artwork:verify` 100 %, the 20-test festival-artwork spec, the 43-test calendar set above, byte-identical pinned day labels, Devanagari-first labels, real panchang dates as ground truth, and no unaudited `UPCOMING_EVENTS` edits. Visual/browser QA (incl. real screenshot comparison against the concept image) runs in the release-review environment (no Chromium in this sandbox).

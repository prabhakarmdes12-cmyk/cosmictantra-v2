# Calendar Paksha hero-mood qualification — 8 September 2026

**Branch**: `arena/01a07d75-cosmictantra-v2` (follow-up to `main` `35f6a95`).
**Baseline reviewed**: `main` `35f6a95` — "feat(calendar): integrate Paksha heroMood theme shift (Krishna Indigo vs Shukla Marigold), gold-leaf headline gradient and शुभ 🙏 festival seal from arena agent (3abb3fd)".
**Scope**: verification of the merged arena calendar-theme integration (the `/calendar` today-view hero banner), a blocking defect found in it, and the evidence added to prove the fix.

This is a scoped qualification of one vertical slice, not a whole-product release verdict.

---

## 1. What the reviewed integration contains

On `/calendar?view=today` (`src/components/calendar/UnifiedPanchangCalendarClient.tsx`):

- **Paksha "hero mood" banner**: Krishna Paksha renders a deep-indigo panel with an indigo glow; Shukla Paksha renders the marigold/gold panel.
- **Gold-leaf gradient headline** over the localised date.
- **Festival seal chip**: `🪔 शुभ रात्रि 🙏 (कृष्ण पक्ष)` on Krishna days, `☀️ शुभ दिवस 🙏 (शुक्ल पक्ष)` on Shukla days.
- Vikram Samvat / Shaka Samvat chips and the sun-arc daylight gauge.

## 2. Blocking defect found and corrected

The banner mood and seal were derived from `tithi.name`:

```ts
tithiName.toLowerCase().includes('krishna') || tithiName.toLowerCase().includes('कृष्ण')
```

The deterministic engine (`src/lib/panchang.js`, tithi assembly lines ~198–200 and ~329–330) reports:

```json
{ "number": 27, "name": "Dwadashi", "paksha": "Krishna Paksha",
  "fullName": "Krishna Paksha Dwadashi", "progressPercent": 39 }
```

`name` is the **bare** tithi and never contains a paksha marker — the paksha lives on `.paksha` and `.fullName`. Consequences (confirmed by probing the engine on 2026-09-07 20:05 UTC, i.e. Krishna Paksha Dwadashi, Varanasi and New Delhi):

- The Krishna-Indigo mood was **unreachable** — every day rendered with the Shukla marigold panel.
- The seal falsely claimed **शुक्ल पक्ष** for the entire waning half of every lunar month.

### Correction

- New shared helper `src/lib/panchang/pakshaTheme.ts`:
  - `resolvePakshaMood(tithi)` — structured `paksha` field first, then `fullName` (English/Devanagari), then plain-string markers; unknown input yields `{ isKrishna:false, isShukla:false }` (never fabricates a paksha claim).
  - `resolveTithiDisplayName(tithi)` — prefers the qualified `fullName` so the UI never shows a bare ambiguous tithi.
- `UnifiedPanchangCalendarClient.tsx` now consumes the helper for the banner classes, glow, seal text and the displayed tithi; the seal shows a neutral `🙏 शुभ दिन` only when no paksha is knowable.

## 3. Executed verification (exact commands and results)

| Command | Result |
|---|---|
| `npm run typecheck` | PASS, 0 errors |
| `npx next build` | PASS — full route graph built, exit 0 |
| `npx tsx scripts/verify-paksha-hero-mood.ts` | PASS — 71 checks |
| `npx playwright test tests/calendar-paksha-hero-mood.spec.ts --workers=1` | PASS — 6/6 |

The new pure regression spec covers: the exact regression case (bare-name Krishna object resolves Krishna), a Shukla fixture, a 60-day engine-invariant sweep, Devanagari fullName, legacy plain-string inputs, and unknown-input honesty.

### Browser suite — added but not executable in this sandbox

`tests/calendar-paksha-hero-mood-browser.spec.ts` asserts on the live `/calendar?view=today` page that the seal text, the displayed fullName and the banner panel class all match the engine's paksha for Varanasi "now". It was **not executed here**: this sandbox cannot download Playwright Chromium (browser CDN egress blocked) and `prisma generate` cannot reach `binaries.prisma.sh` (network-blocked). Run it in the local/CI release-review environment:

```bash
npm run dev        # or: npm run build && npm run start
npx playwright test tests/calendar-paksha-hero-mood-browser.spec.ts --workers=1
```

## 4. Environment notes for the local agent

- `node_modules` was installed with `npm ci`; the `postinstall` (`prisma generate`) fails only because the Prisma engine host is unreachable from this sandbox. The checked-in `node_modules/.prisma/client` type stub (`PrismaClient: any`) is enough for typecheck and build. DB-backed runtime flows were not exercised.
- `main` `35f6a95` is a single squashed root commit (no parent history); the arena-origin commit `3abb3fd` is referenced only in the message and is not present in the object store.
- The calendar route is statically prerendered with a client Suspense fallback, so curl of the HTML does not contain the banner; verification of the rendered banner requires the browser suite above.

## 5. Files changed by this follow-up

- `src/lib/panchang/pakshaTheme.ts` — new shared paksha-mood/display-name resolver (bug fix core).
- `src/components/calendar/UnifiedPanchangCalendarClient.tsx` — consume the helper for hero-mood theme + seal + tithi display.
- `tests/calendar-paksha-hero-mood.spec.ts` — new pure regression suite (6 tests).
- `tests/calendar-paksha-hero-mood-browser.spec.ts` — new browser suite (requires Chromium).
- `scripts/verify-paksha-hero-mood.ts` — standalone 71-check verifier.
- `docs/README.md`, `docs/RELEASE-REVIEW-2026-09-08.md` — this record.

## 6. Remaining gaps (explicitly NOT part of the reviewed change set)

The planning docs (`AGENT_PROMPT_COMPLETE_VEDIC_CALENDAR.md`, `CALENDAR_UI_PLAN.md`, `CALENDAR_RULES.md`, `EVENT_IMAGE_MANIFEST.json`, `WORLD_CALENDAR_SYSTEMS.md`) describe a larger calendar programme that is **not implemented** and was not claimed by this merge:

- `EVENT_IMAGE_MANIFEST.json` festival artwork pipeline — `public/assets/calendar/events/` does not exist and no `/calendar` component consumes the manifest.
- World-calendar-systems selector (Surya Siddhanta / Bikram Sambat / Saka / Tamil / Bengali / Kollam / Hijri).
- Novice vs. Scholar (विस्तृत पञ्चाङ्ग) dual information architecture.
- Mobile day-detail sheet with 16:9 hero artwork.

These remain roadmap items for owner approval, not regressions of this change set.

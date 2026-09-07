# Calendar festival-artwork program — 8 September 2026 (in progress)

**Branch**: `arena/01a07d75-cosmictantra-v2` · follows `main` `35f6a95` and the
Paksha hero-mood qualification (`docs/RELEASE-REVIEW-2026-09-08.md`).

## Goal

Give the Vedic calendar the "sticker on important days" treatment: **festival-grade
16:9 artwork on observance days and a symbolic tithi-art series on every other
day** inside the month grid and the day-detail hero — matching the artwork
program another arena session ran on `arena/01a07c9f` (that branch was never
pushed to GitHub, so this program is being rebuilt here from scratch against
the real engine in this checkout).

## Status — code complete, artwork partially generated

| Piece | Status |
|---|---|
| Engine corrections (see below) | ✅ done, tested |
| Artwork resolver `src/lib/calendar/festivalArtwork.ts` | ✅ done |
| UI: month-grid art strip + day-detail 16:9 hero (`AuraMonthlyCalendar.tsx`) | ✅ done |
| Pure regression suite `tests/calendar-festival-artwork.spec.ts` (12 tests) | ✅ green |
| Coverage verifier `scripts/verify-artwork-coverage.ts` | ✅ runs — **red until all 49 assets exist** |
| Assets `public/assets/calendar/events/*.webp` | 🔶 **20 of 49 generated** (rest blocked by per-turn image-generation cap) |

The verifier is the acceptance gate requested by the owner:

```bash
npm run artwork:verify   # = npx tsx scripts/verify-artwork-coverage.ts
```

Expected final output (once all 49 assets exist):

```
✅ 100% coverage — 0 missing files.
   365/365 days, <n>/<n> festival types, 30/30 tithi combos.
```

## Asset inventory (49 unique 16:9 WebP, under `public/assets/calendar/events/`)

- **15 core festival** files per `docs/EVENT_IMAGE_MANIFEST.json`:
  `ganesh_chaturthi, janmashtami, navratri, durga_ashtami, vijayadashami,
  diwali, mahashivaratri, chhath_puja, sharad_purnima, karwa_chauth,
  raksha_bandhan, guru_purnima, makar_sankranti, pradosh, ekadashi`
- **10 expanded festival**: `holi, ram_navami, hanuman_jayanti, navavarsh,
  dhanteras, annakut, bhai_dooj, dev_deepawali, vasant_panchami, nag_panchami`
- **16 tithi series**: `tithi_pratipada … tithi_chaturdashi` (14, shared across
  Shukla/Krishna paksha) + `tithi_purnima` + `tithi_amavasya`
- **8 category fallbacks**: `shiva_generic_dhyana, vishnu_krishna_generic,
  devi_shakti_generic, ganesha_generic, surya_sun_generic, ram_hanuman_generic,
  sharad_purnima_moon, diwali_diyas`

Each file also has a `-sm.webp` (384×216) thumb for the month-grid strips —
regenerate all thumbs with `npm run artwork:thumbs` after adding artwork.

**Generated so far (20):** the 8 category fallbacks, `ganesh_chaturthi`, `janmashtami`, and the 10 core-manifest festivals `navratri`, `durga_ashtami`, `vijayadashami`, `diwali`, `mahashivaratri`, `chhath_puja`, `sharad_purnima`, `karwa_chauth`, `raksha_bandhan`, `guru_purnima`. Remaining 29 (3 core: `makar_sankranti`, `pradosh`, `ekadashi`; the 10 expanded; the 16 tithi series) are queued for follow-up turns (per-turn image-generation cap), then `npm run artwork:verify` flips green. The UI degrades gracefully (art hidden on 404) until all files exist.

## Engine corrections this program depends on

Both are pure-astronomy/determinism defects found while building the token
table; each is covered by tests in `tests/calendar-festival-artwork.spec.ts`.

1. **Festival months were two rasi late.** `monthlyPanchangEngine.ts` fed the
   festival resolver `lunarMonthIdx = (sunRasi + 11) % 12` (i.e. `sunRasi − 1`)
   while the same file labels every day and the month chip with
   `(daySunRasi + 1) % 12`. Result: the visible chip said "भाद्रपद मास" while
   month-qualified festivals (Raksha Bandhan, Janmashtami, Ganesh Chaturthi,
   Navaratri, Diwali, Holi…) fired **two lunar months late** (Ganesh Chaturthi
   landed 13 Nov 2026 instead of 14 Sep 2026). Aligned to `(sunRasi + 1) % 12`.
2. **Guru Purnima and Makar Sankranti were never emitted.** Guru Purnima =
   Ashadha Purnima (`lMonth === 3 && purnima`). Makar Sankranti = the civil day
   the sidereal Sun crosses 270° (detected with a running previous-day noon
   `sunSid`; verified = 14 January, exactly, in both 2025 and 2026).

Post-correction 2026 anchors verified in tests: Ganesh Chaturthi **14 Sep**,
Diwali **8 Nov**, Sharad Navaratri **11 Oct**, Holika **2 Mar**, Maha
Shivaratri **15 Feb**, Makar Sankranti **14 Jan**. (2026 is an Adhika-māsa year;
a sign-anchored engine can still drift a month on some observances — inherent
to the engine's design, out of scope here.)

## Files

- `src/lib/calendar/festivalArtwork.ts` — resolver + token/category/tithi tables
- `src/engines/monthlyPanchangEngine.ts` — month-index fix + two astro festivals
- `src/components/calendar/AuraMonthlyCalendar.tsx` — grid art strips + hero
- `scripts/verify-artwork-coverage.ts`, `scripts/convert-to-webp.py`,
  `scripts/make-art-thumbs.py` — verifier + dev converters
- `tests/calendar-festival-artwork.spec.ts` — 12 pure regression tests
- `public/assets/calendar/events/*` — artwork (20/49 so far)

## Verification run (this sandbox)

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npx playwright test tests/calendar-festival-artwork.spec.ts tests/calendar-paksha-hero-mood.spec.ts` | 18 passed |
| `npx playwright test tests/panchang-maas-verification.spec.ts tests/panchang-precision.spec.ts tests/features.spec.ts tests/astrology.spec.ts` | 18 passed |
| `npx tsx scripts/verify-artwork-coverage.ts` | expected failures = 39 missing asset files (honest gate) |
| `npx next build` | PASS |

Browser rendering of the new cells was not executed here (no Chromium in this
sandbox) — validate visually in the release-review environment.

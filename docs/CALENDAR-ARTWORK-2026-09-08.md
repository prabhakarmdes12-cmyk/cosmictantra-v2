# Calendar festival-artwork program — 8 September 2026 (complete)

**Branch**: `arena/01a07d75-cosmictantra-v2` · follows `main` `35f6a95` and the
Paksha hero-mood qualification (`docs/RELEASE-REVIEW-2026-09-08.md`).

## Goal

Give the Vedic calendar the "sticker on important days" treatment: **festival-grade
16:9 artwork on observance days and a symbolic tithi-art series on every other
day** inside the month grid and the day-detail hero — matching the artwork
program another arena session ran on `arena/01a07c9f` (that branch was never
pushed to GitHub, so this program is being rebuilt here from scratch against
the real engine in this checkout).

## Status — complete and verified

| Piece | Status |
|---|---|
| Engine corrections (see below) | ✅ done, tested |
| Artwork resolver `src/lib/calendar/festivalArtwork.ts` | ✅ done |
| UI: month-grid art strip + day-detail 16:9 hero (`AuraMonthlyCalendar.tsx`) | ✅ done |
| Pure regression suite `tests/calendar-festival-artwork.spec.ts` (12 tests) | ✅ green |
| Coverage verifier `scripts/verify-artwork-coverage.ts` | ✅ **100% — 0 missing files** |
| Assets `public/assets/calendar/events/*.webp` | ✅ **49 of 49 generated — complete** |

The verifier is the acceptance gate requested by the owner:

```bash
npm run artwork:verify   # = npx tsx scripts/verify-artwork-coverage.ts
```

Actual final output:

```
✅ 100% coverage — 0 missing files.
   365/365 days, 34/34 festival types, 30/30 tithi combos.
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

Every file was generated in the shared style ("premium Indian spiritual
editorial illustration, warm golden-hour light, ivory + antique gold, soft
painterly devotional, 16:9, no text/watermark"), converted to 1280×720 WebP
(`python3 scripts/convert-to-webp.py`) and given a 384×216 `-sm.webp` thumb
(`npm run artwork:thumbs`).

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
- `public/assets/calendar/events/*` — 49 artwork WebP + 49 thumbs (complete)

## Verification run (this sandbox)

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| artwork + paksha + maas + precision specs | 23 passed |
| `npm run artwork:verify` | ✅ 100% coverage — 0 missing files |
| `npx next build` | PASS |
| HTTP smoke — `/`, `/calendar`, `/calendar?view=month` + all 98 asset files | all 200 |

Browser rendering of the new cells was not executed here (no Chromium in this
sandbox) — validate visually in the release-review environment.

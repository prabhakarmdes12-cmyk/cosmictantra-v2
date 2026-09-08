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
| Pure regression suite `tests/calendar-festival-artwork.spec.ts` (20 tests) | ✅ green |
| Coverage verifier `scripts/verify-artwork-coverage.ts` | ✅ **100% — 0 missing files** |
| Assets `public/assets/calendar/events/*.webp` | ✅ **49 of 49 generated — complete** |

The verifier is the acceptance gate requested by the owner:

```bash
npm run artwork:verify   # = npx tsx scripts/verify-artwork-coverage.ts
```

Actual final output:

```
✅ 100% coverage — 0 missing files.
   365/365 days, 33/33 festival types, 30/30 tithi combos.
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

### Festival detail pages (`/festivals/[slug]`) now carry hero artwork

The static festival pages (`UPCOMING_EVENTS` in `src/lib/festivals.js`) were
text-only. They now render a 16:9 artwork hero resolved from the same 49-file
set via `resolveFestivalTitleArtwork()` (server-safe, in `src/lib/calendar/
festivalArtwork.ts`): exact token → token-substring → ordered keyword aliases →
category fallback → generic festival-lights art (never a blank page). Verified
in SSG output: `shardiya-navratri → navratri.webp`, `dev-deepawali →
dev_deepawali.webp`, `mahalaya-amavasya → tithi_amavasya.webp`,
`sharad-purnima → sharad_purnima.webp`, `aja-ekadashi → ekadashi.webp`,
`bhadr-pradosh → pradosh.webp`.

**Known issue (pre-existing, not part of this image work):** `UPCOMING_EVENTS`
dates were hand-written and disagree with the corrected engine for some entries
(e.g. Shardiya Navratri Ghatasthapana is dated 12 Sep 2026 there, while the
engine — and the real 2026 calendar — place it on 11 Oct 2026). Recommend an
owner-approved reconciliation of that static file with the engine's output.

### Other gap closed: `public/images/darshan/baidyanath.jpg`

The only genuinely missing referenced image app-wide (full static-path audit of
`src/` + the event manifest) was Baidyanath Dham for the live-darshan carousel;
generated at 1376×768 to match its siblings. The audit now reports **0 missing
referenced images**.

## Engine corrections this program depends on

All are pure-astronomy/determinism defects found while building the token
table; each is covered by tests in `tests/calendar-festival-artwork.spec.ts`.

1. **Festival months are now Adhika-correct via a true Amanta lunation
   tracker.** The historical lineage: festival months were originally fed
   `(sunRasi + 11) % 12` (two rasi behind the file's own labels → festivals
   ~2 months late), then aligned to `(sunRasi + 1) % 12` to match the labels —
   but a *sign-anchored* index still drifts a full lunation whenever an
   intercalary month intervenes. 2026 is such a year (Adhika-Jyeshtha,
   17 May – 15 Jun): under `(sunRasi + 1)` Guru Purnima fired 29 Jun (really
   Jyeshtha Purnima) and Raksha Bandhan / the whole Sharad-Kartika cluster
   fired ~30 days early. `monthlyPanchangEngine.ts` now derives festival months
   from actual amavasya instants (`buildAmantaLunations` / `findNextAmavasya`):
   lunations run new-moon → new-moon and are named by their in-month sidereal
   saṅkrānti; a lunation with no saṅkrānti is Adhika and suppresses
   month-qualified festivals (only universal vrats fire); Kṛṣṇa-pakṣa days are
   named purnimanta-style (the following lunation — so Karwa Chauth stays
   "Kartika Krishna 4" before Diwali). Day/masa labels keep the old solar-sign
   convention (byte-stable; the pinned maas suite is untouched).
2. **Sunrise skip-rescue + cross-month dedupe.** Near the moon's perigee,
   tithis run shorter than a civil day and can slip entirely between two noon
   samples (the "dropped observance" class, e.g. Dhanteras 2028 and Hanuman
   Jayanti 2028). Each day is re-evaluated at local sunrise and a festival whose
   (lunation, tithi) occurrence no noon sampled is emitted on its sunrise day;
   month calls seed the seen-set from the previous civil month's last two noons
   so a boundary-straddling tithi never fires twice. Verified: every yearly
   festival fires **exactly 3× across 2026–2028** (no double-fires, no drops).
3. **Guru Purnima and Makar Sankranti were never emitted.** Guru Purnima =
   Ashadha Purnima (fires 29 Jul 2026 — Shuddha Ashadha; NOT 29 Jun which is
   Jyeshtha Purnima). Makar Sankranti = the civil day the sidereal Sun crosses
   270° (verified = 14 January, exactly, in both 2025 and 2026).
4. **Janmashtami Smarta duplicate removed.** A "Krishna Janmashtami (Smarta)"
   emission fired a whole lunation early in Shravana under the misaligned
   months; Janmashtami is Bhadrapada Krishna Ashtami and now fires exactly once
   per year (2026-09-04, 2027-08-25, 2028-08-13 — matching drik).

Web-confirmed 2026 anchors locked in the spec (all exact): Vasant Panchami
**23 Jan**, Maha Shivaratri **15 Feb**, Chaitra Navaratri **19 Mar**, Ram
Navami **26 Mar**, Hanuman Jayanti **1 Apr**, Guru Purnima **29 Jul**,
Janmashtami **4 Sep**, Ganesh Chaturthi **14 Sep**, Navaratri **11 Oct**,
Durga Ashtami **18 Oct**, Vijayadashami **20 Oct**, Sharad Purnima **25 Oct**,
Karwa Chauth **29 Oct**, Dhanteras **6 Nov**, Diwali **8 Nov**, Chhath
**15 Nov**, Dev Deepawali **24 Nov**. ±1-day regional splits kept as engine
tithi-days: Holika Dahan **2 Mar** (drik observance 3 Mar — Purnima begins
17:55 on the 2nd), Raksha Bandhan **27 Aug** (tithi day; the *observance* was
28 Aug 2026 — a nationally debated Bhadra case), Bhai Dooj **10 Nov**.

## Files

- `src/lib/calendar/festivalArtwork.ts` — resolver + token/category/tithi tables
- `src/engines/monthlyPanchangEngine.ts` — Amanta lunation tracker + sunrise skip-rescue + two astro festivals
- `src/components/calendar/AuraMonthlyCalendar.tsx` — grid art strips + hero
- `scripts/verify-artwork-coverage.ts`, `scripts/convert-to-webp.py`,
  `scripts/make-art-thumbs.py` — verifier + dev converters
- `tests/calendar-festival-artwork.spec.ts` — 20 pure regression tests (incl. the Phase A Amanta tracker suite)
- `public/assets/calendar/events/*` — 49 artwork WebP + 49 thumbs (complete)

## Verification run (this sandbox)

| Command | Result |
|---|---|
| `npm run typecheck` | PASS |
| artwork + paksha + maas + precision specs | 31 passed |
| `npm run artwork:verify` | ✅ 100% coverage — 0 missing files |
| `npx next build` | PASS |
| HTTP smoke — `/`, `/calendar`, `/calendar?view=month` + all 98 asset files | all 200 |

Browser rendering of the new cells was not executed here (no Chromium in this
sandbox) — validate visually in the release-review environment.

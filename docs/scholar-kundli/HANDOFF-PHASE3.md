# Handoff — Scholar Kundli, end of Phase 3

Written 2026-09-01 for whoever picks this up next. Everything below was
verified on the published commit, not recalled. Where something is not
verified, it says so.

---

## 1. Where things stand

| | |
|---|---|
| Branch | `arena/01a0593a-cosmictantra-v2` |
| Head | `4f921ff` |
| Base this session started from | `781c813`, then corrective commit `36a3c1b` |
| Phase 1 | Done — runtime consistency gate (`2ba20be`) |
| Phase 2 | Done — passport + certificate (`40a04ae`, `36a3c1b`) |
| **Phase 3** | **Done — charts + Scholar Summary (`2be0e8e` → `4f921ff`)** |
| Verdict claimed | `READY_FOR_INDEPENDENT_REVIEW` only |
| Visual QA | **NOT PERFORMED** — no one has looked at the charts |

Phases 1–3 are all on the remote. Nothing is merged, deployed, rebased,
squashed or force-pushed. Held Kashi commits `1698ab6` and `4d5a904` were
not touched.

### The six commits

```
2be0e8e  canonical chart model — placements validated before anything is drawn
6c234a6  North Indian D1/D9 vector charts — SVG and PDF primitives, never rasterised
be0e058  Scholar Summary — two pages, three levels kept apart
7d623e4  fourteen chart and summary checks in the delivery gate
a48959a  chart fixtures, gate tests, visual artifacts and Phase 3 documents
4f921ff  correct the Phase 3 commit SHAs and record the sandbox rollback
```

**These five feature commits were recreated, not authored in this order.** The
sandbox lost its commit objects twice; the second time the five had not yet
been pushed. Each commit therefore carries the *final* content of its files,
not the intermediate states that were lost. The published tree is the tree
that was tested. Details in §11 of `PHASE3-VERIFICATION.md`.

---

## 2. What Phase 3 built

Twenty files, ~4,200 lines added.

**`src/lib/kundli/chartModel.ts`** — the contract a renderer may consume.
Validates placements and rejects, as `KUNDLI_CHART_INVALID`: missing or
duplicated house numbers, invalid sign numbers, unknown planet ids, a graha in
two houses, D1 disagreeing with the canonical planets, D9 disagreeing with the
verified navamsha, and a lagna marker disagreeing with the chart lagna. Owns
the abbreviation registry (`Su Mo Ma Me Ju Ve Sa Ra Ke Lg`, with Hindi forms),
the textual equivalent, `FACT-*`/`CHART-D1-*`/`CHART-D9-*` evidence ids, and a
stable FNV-1a placement hash.

**`src/lib/kundli/northIndianChart.ts`** — one geometry, three surfaces. Draws
placements that already exist in the validated model; calculates nothing.
`layoutChart` derives every label deterministically from a 12-polygon /
8-line table. `renderChartSvg` for web and artifacts, `drawChartToPdf` through
jsPDF primitives. `auditChartLayout` checks without eyes for out-of-house
labels, overlaps, clipping, missing or duplicated grahas, and out-of-band type
sizes. `unitsPerPoint` makes point sizes real on both surfaces.

**`src/lib/kundli/scholarSummary.ts`** — page 1 is calculated facts, each with
an evidence id. Page 2 is three physically separated levels: calculated fact,
traditional interpretation (with all four required links), reflection. Only
PRESENT yogas appear. 23 not-calculated items, counted from a single source
list so the number cannot drift. `BANNED_PHRASES` scanned over every generated
sentence.

**`src/lib/kundli/consistencyGate.ts`** — `checkChartAndSummaryConsistency`
runs 15 checks: fourteen over charts and summary, plus a whole-report scan
for predictive language. Every one is critical: failure
returns `ok:false`, `pdfBuffer:null`, a stable named code, both conflicting
values and both safe paths.

**`src/lib/kundli/pipeline.ts`** — gate 3c, after the bilingual check and
before `gate3b`. Maps `CG_CHART*` to `KUNDLI_CHART_INVALID`, `CG_SUMMARY*` to
`KUNDLI_SUMMARY_INVALID`, otherwise `KUNDLI_CONSISTENCY_FAILED`.

### Tests

| Spec | Tests | What it proves |
|---|---|---|
| `chart-fixtures.spec.ts` | 26 | Exact placements, not "an image exists": one graha per house, six in one, all nine in one, empty houses, retrograde, node axis, Aries/Pisces lagna, four D9 boundary cases, three label modes, six rejection cases, four structural guarantees |
| `chart-gate.spec.ts` | 18 | The gate passes on the reference chart in EN and HI; all 14 codes exist; 11 injected faults each fire their intended check while the control passes |
| `chart-visual-artifacts.spec.ts` | 9 | Ink per house, monochrome tolerance, Devanagari glyphs vs tofu, rendering 220–900px |
| `chart-browser.spec.ts` | 5 | **Skipped** — no browser binary. Skips with its reason; never passes |
| `chartCanvasRaster.ts` | — | Test-only `@napi-rs/canvas` rasteriser. Deliberately outside `src/` so the product keeps two chart surfaces |

---

## 3. Environment — read this first

`.git` and `node_modules` are **not persisted between sessions** in this
sandbox. Both were lost mid-work, twice for git. Consequences:

1. **Commit and push before ending a session, not after.** If you finish a
   turn with unpushed commits, assume they may not exist next turn.
2. On starting: `npm ci --no-audit --no-fund --prefer-offline` (~24 s).
3. If `git log` shows the session-start commit and your work is missing from
   history, the files are almost certainly still in the working tree. Recover
   with `git fetch origin <branch>` then `git reset --mixed FETCH_HEAD` — this
   moves the branch pointer only, never the working tree, and rewrites nothing.

**No browser is obtainable.** `npx playwright install chromium` fails
(`Download failure, code=1`), `apt-get` fails (not root), no system Chrome.
Do not write browser tests that must run. Use `@napi-rs/canvas` for
rasterisation, or write tests that skip loudly with a reason.

**This agent has no vision.** It cannot look at an image. Any visual claim
must be programmatic, and visual approval must be reported as
`VISUAL_QA_NOT_PERFORMED`.

**GitHub auth expires mid-session.** If `git push` returns
`could not read Username`, run `gh auth status` and ask the user to reconnect
rather than reaching for credentials.

### Commands that work

```bash
npm ci --no-audit --no-fund --prefer-offline
npx tsc --noEmit                                  # must be clean
npx playwright test tests/kundli-pipeline         # 324 passed, 5 skipped
TZ=America/New_York npx playwright test tests/kundli-pipeline   # same
npx next build                                    # ~70 s

npx playwright test tests/golden-kundli tests/incident tests/granth-* \
                     tests/kashi-sahayak tests/astrosage-differential-benchmark
# 356 passed, 10 failed, 6 skipped
```

The env vars `CHROMIUM_PATH` and `CHROMIUM_LD_LIBRARY_PATH` appear in earlier
command lines but the binary they pointed at is gone; they are harmless and
unnecessary.

---

## 4. Known failures — none of these are Phase 3 regressions

- **9 failures**: `browserType.launch: Failed to launch chromium because
  executable doesn't exist`. Pre-existing browser specs, environment-blocked.
- **1 failure**: AstroSage GATE 2 sunset parity —
  `expect(snapshot.birthPanchang.sun.sunset).toContain('06:38')`. Pre-existing
  and unrelated.
- **`npx prisma generate` fails** (TLS to `binaries.prisma.sh` blocked).
  Pre-existing.

---

## 5. Gotchas that cost real time

These are things that will bite again if forgotten.

- **The four kendra houses are kites, not triangles.** Their centroids are
  (50,25), (25,50), (50,75), (75,50). A triangle reading covers only 7,500 of
  10,000 square units; the tiling test catches it.
- **Label blocks must be vertically centred**, not top-anchored. Top anchoring
  leaves kite centroids empty.
- **Never put `if (occupants.length === 0) continue;` above the house/sign
  labels.** Empty houses must still draw house number and sign number. This
  silently blanked six houses once.
- **Ink thresholds must reflect measurement.** Per-house ink ranges 25–322 px
  at 520 px on the reference chart; a blank house is <5. A `>40` threshold
  fails legitimately sparse houses.
- **The summary spills to a third page easily.** Three drafts did. After any
  summary edit, re-measure against
  `artifacts/scholar-kundli/priya-1995-gk-negative.pages.txt`.
- `KUNDLI_CHART_INVALID` is not exported from `chartModel.ts` — import it from
  `consistencyGate.ts` or use the string literal.
- Fixtures need a Rahu/Ketu axis; `makeCanonical` injects one. Find grahas by
  `placements.find(p => p.planetId === 'Moon')`, never `placements[0]`.
- **JS `.sort()` is lexicographic** — always `.sort((a,b) => a-b)`.
- **Never `as unknown as ReportBlock`.** `KeyValueBlock` is
  `{kind:'keyValue', label, value}`. That cast once hid a field-name mismatch.
- Gate check 11 must compare the *value token* in the named section, not the
  evidence id. Check 14 must bind ids to canonical paths.
- Evidence-id regex must allow lowercase: `[A-Za-z0-9_\-]+`.
- Script- and locale-blind gate checks fail on Hindi. Match canonical English
  tokens, look summary lines up by evidence id, match planet names through
  `PLANET_ABBREVIATIONS`.
- `sectionText()` matching is case-sensitive — lowercase both sides.
- Both `unitsPerPoint`/`fontSizePt` **and** `renderer.ts` `side=130` are
  required; one without the other yields wrong type sizes.
- Real section ids: `major-yogas`, `dosha-analysis`, `current-dasha`,
  `house-positions`, `planetary-positions`, `panchanga`, `vimshottari-dasha`,
  `d1-placement-table`, `d9-placement-table`, `calculation-certificate`.
- `src/lib/dashaEngine.js` is the real engine; `src/engines/dashaEngine.js` is
  a stale decoy.
- **Never `git add -A`.** It sweeps `docs/granth/coverage.json` (regenerated by
  test runs) and `scratch/screenshots/*`. Stage files explicitly.

---

## 6. What is not done

**Visual QA.** The single largest gap. 24 review images are in
`artifacts/scholar-kundli/owner-review/` (SVGs, PNGs, @2x) and have never been
seen. Programmatic checks prove the *absence of specific defects* — out-of-bounds,
overlap, clipping, missing glyphs, raster in the PDF — not that the chart looks
right. A human needs to open them.

**Other open items:**

| Item | State |
|---|---|
| Bilingual coverage | Hindi in 5 of 31 sections. Gate discloses this as `CG_BILINGUAL_PARTIAL` rather than implying a full translation |
| PDF Devanagari | Verified by text extraction, not pixels |
| Divisional charts | D1 and D9 only. D10 must not ship until it has independent boundary fixtures |
| 16 Vargas | Must not be advertised as supported until each is independently verified |
| `maxPages` | Still 40 |
| `prisma generate` | Blocked |
| Print-shop proof | Never produced |

**Outstanding documents**, carried from the mission:
`REPORT-SCHEMA-v1.md`, `VISUAL-QA.md`, `SOURCE-VERIFICATION.md`,
`MARKET-QUALITY-MATRIX.md`. Done already:
`RUNTIME-CONSISTENCY-GATE.md`, `CHART-RENDERING-v1.md`,
`SCHOLAR-SUMMARY-v1.md`, `PHASE3-VERIFICATION.md`.

**Remaining mission phases**, as carried in the task state (the mission
document itself is not in this repo, so treat this list as inherited and
confirm against the original before acting):

1. Bhava–Graha matrix
2. TZ-aware Dasha — no death, marriage, wealth, court or disease prediction
3. Scholarly verification — never upgrade a locator's status
4. Audit Shadbala and the Vargas; D10 only after D1/D9 pass
5. Visual standard — mark NOT PERFORMED if images cannot be inspected
6. Comparison matrix on observable qualities only

---

## 7. Standing constraints

These were set by the owner and remain binding.

- **No merge, deploy, history rewrite, squash, rebase or force-push.** Do not
  touch `1698ab6` or `4d5a904`.
- **Do not weaken** the runtime contradiction gate, deterministic timezone
  handling, host-independent Dasha dates, passport, certificate, yoga
  fail-closed contract, Priya negative fixture, 40-page ceiling, 454-page
  runaway protection, source-verification limitations, or `pdfBuffer:null` on
  critical failure.
- **Only three verdicts exist:** `READY_FOR_INDEPENDENT_REVIEW`,
  `NOT_READY`, `BLOCKED_NEEDS_HUMAN`. Never stronger. Never `SAFE_FOR_PRODUCTION`,
  `FULLY_TESTED_E2E`, or any visual approval without human inspection.
- **Zero fabrication.** No invented sources, coverage or test results. If a
  check cannot be run, say it was not run.
- **Report exact counts.** Never hide a whole-suite failure in truncated
  output.
- **No OS-font dependence** for Devanagari; if Hindi glyphs fail, delivery must
  stop rather than ship boxes.
- **Banned summary language**: "definitely", "guaranteed", "will happen",
  fear-based phrasing, deterministic marriage/death/disease/wealth/litigation
  predictions.
- **Evidence ids must be stable** between identical generations and must never
  expose raw database ids or internal paths.
- **Generated artifacts stay gitignored** unless explicitly approved.

---

## 8. Artifacts, all gitignored

```
artifacts/scholar-kundli/priya-1995-gk-negative.pdf   19 pages, 0 blank
artifacts/scholar-kundli/priya-1995-gk-negative.pNN.png
artifacts/scholar-kundli/priya-1995-gk-negative.pages.txt
artifacts/scholar-kundli/d1.svg, d9.svg
artifacts/scholar-kundli/owner-review/                24 files, unreviewed
```

Reference chart, if you need one: Priya, 1995-06-15 10:30, Patna
(25.5941, 85.1376, +5.5). D1 lagna sign 5, Mars in H1, Sun/Mercury/Venus in
H10; D9 lagna sign 4.

---

## 9. Suggested first moves

1. **Look at the charts.** Open `artifacts/scholar-kundli/owner-review/`. This
   is the one thing that cannot be done here and the reason the verdict is no
   stronger than it is.
2. Confirm the two-page summary on a real PDF — page 1 glance, page 2 the
   three levels, next section starting page 3.
3. Then pick a remaining phase from §6.

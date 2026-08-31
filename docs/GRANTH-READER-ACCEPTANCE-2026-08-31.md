# Granth library & reading session — acceptance report (31 Aug 2026)

Scope delivered in this increment: **Phase 0 (evidence baseline), Phase 1 (canonical scripture
library, edition-aware coverage, safe exact lookup) and Phase 2 (one shared reading session with
interruption / explain / resume)** of
[`AGENT-NEXT-WORK-2026-09-01.md`](./AGENT-NEXT-WORK-2026-09-01.md).

This report covers only what was executed here. It does **not** claim a whole-product
`SAFE_FOR_PRODUCTION` or `FULL_E2E` verdict, and it does not supersede
[`RELEASE-REVIEW-2026-09-01.md`](./RELEASE-REVIEW-2026-09-01.md), which remains the review of the
previous integration.

---

## 1. Environment & provenance of the evidence

| Item | Value |
| --- | --- |
| Branch | `arena/01a0593a-cosmictantra-v2` (pushed) |
| Parent commit | `ca5951c` (reviewed merge) |
| Delivery commit | recorded at the end of §7 |
| Working tree at start | clean, `ca5951c` |
| Node | v22.22.3 (repo `engines` wants 24.x — EBADENGINE warning, not a failure) |
| npm | 10.9.8 |
| next | 14.2.35 |
| typescript | 5.9.3 |
| @playwright/test | 1.62.1 |
| react | 18.3.1 |
| `package-lock.json` sha256 (first 16) | `07dc73fb677e5132` |
| Sandbox network | npm registry reachable; `binaries.prisma.sh` **unreachable** → `prisma generate` could not run |

**Environment blockers (not code defects):**

- `prisma generate` cannot run (network blocked), so `@prisma/client` ships no generated types and
  `npx tsc --noEmit` fails with a single error, `src/lib/db.ts(1,10): Module '"@prisma/client"' has
  no exported member 'PrismaClient'`, which also fails `next build`'s type step. To exercise the
  rest of the build, a **sandbox-only stub** was created at
  `node_modules/.prisma/client/` (node_modules is not committed and is not part of this diff).
  With it: `npx tsc --noEmit` → **exit 0**, `npx next build` → **PASS**. Without it, the only
  failing file is `src/lib/db.ts`, which this work does not touch. Re-run `npm run build` in an
  environment where `prisma generate` succeeds for a clean database-typing verdict.
- `npx playwright install chromium` fails (download blocked). **No browser test was executed in
  this environment.** Browser/device verification is reported as NOT TESTED in §5.

---

## 2. What changed and why

### New: shared, versioned scripture library (`src/lib/granth/`)

| File | Purpose |
| --- | --- |
| `data/granths/<slug>.ts`, `data/collections/*.ts` | Extracted text, one generated module per book/collection |
| `data/editions/bhagavad-gita.ts` | Per-edition manifest: expected units, grouping rules, provenance |
| `data/index.ts`, `data/manifest.ts` | Metadata index + SHA-256 checksums of every data module |
| `types.ts` | Passage/edition/lookup types (kinds, locators, failure codes) |
| `checksum.ts` | Dependency-free SHA-256 (record identity + text fingerprint) |
| `registry.ts` | Book registry, lazy per-book loaders, corruption scan, row → typed passage normalisation |
| `lookup.ts` | Exact retrieval with **distinct** failure codes |
| `coverage.ts` | Per-edition coverage measurement |
| `session.ts` | Reading-session state machine (chat + reader + future speech) |
| `commands.ts` | Hindi/English/Hinglish reader-command parsing (Devanagari digits supported) |
| `libraryData.ts` | Static access for the library page only (chat path stays lazy) |

Generators (deterministic, re-runnable):

- `scripts/extract-granth-library.cjs` — extracts the four collections into the data modules.
  Self-extracting after migration; `GRANTH_PAGE_SOURCE=<pre-migration page>` for a first run.
- `scripts/build-gita-edition-manifest.cjs` — builds the Gita edition manifest from `gita_raw/`
  (records SHA-256 of every source file it consumed).
- `scripts/audit-granth-inventory.cjs` — rewritten to read the generated index (the page no longer
  holds inline literals) and to print the extraction checksums.

### Changed

| File | Change |
| --- | --- |
| `src/app/aarti-stotra/page.tsx` | 6 552 lines of inline literals replaced by imports of the extracted modules. IDs, slugs, section ids and all text unchanged (verified, §4). The unsupported “100% COMPLETE” banner comments were replaced by an accurate note. |
| `src/lib/ai/granthReader.ts` | Now resolves through the shared library; async; returns distinct failure codes; added `handleReaderCommand` (session-aware turns) and `validateReference` |
| `src/lib/ai/gateway.ts` | Reader-session block (§3.5) before generic intent routing; Gita integrity check now uses real edition data (a valid-but-unstored verse is no longer reported as non-existent); returns `readingSession` + `cancelledReadingTokens` |
| `src/lib/ai/scriptureCorpus.ts` | `validateAndRetrieveScripture` no longer **manufactures** placeholder records for valid-but-absent verses; the `मृत्यsourceर्मुक्षीय` corruption is corrected to `मृत्योर्मुक्षीय` (see §3) |
| `src/components/consultation/FloatingAIGuruAvatar.tsx` | Persists the returned reading session (device-local `localStorage`), stops audio whose token the server invalidated, and routes `READER_*` chips to the same conversational commands |
| `tests/granth-interactive-flow.spec.ts` | Updated for the new capabilities (chapters/verses are now genuinely readable) while keeping every honest-failure assertion |
| `tests/granth-canonical-library.spec.ts`, `tests/granth-coverage.spec.ts`, `tests/granth-reading-session.spec.ts`, `tests/granth-reader-http.spec.ts` | New suites (§4) |

Deliberately **not** touched: the approved phone/browser voice selection, `useKashiVoice.ts`
speech internals, the Kundli pipeline, pricing or any paid/production configuration.

---

## 3. Source integrity

- **Corruption fixed:** the stored Rigvedic mantra contained `मृत्यsourceर्मुक्षीय`. Corrected to
  `मृत्योर्मुक्षीय` **against the transliteration field stored in the same record**
  (`mṛtyormukṣīya`) — not from model memory. The record is still flagged as pending human review
  against a printed Rigveda edition before any “verified scripture” claim is made about it.
- **Coverage vs edition:** `docs/granth/COVERAGE-REPORT.md` + `docs/granth/coverage.json`
  (regenerate: `npx playwright test tests/granth-coverage.spec.ts`).

| Book | Edition | Status | Stored rows | Verses | Expected | Missing | Corrupt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| श्रीमद्भगवद्गीता | `ct-gita-bundled-devanagari-hi-2026-08-31` | **COMPLETE_FOR_EDITION** | 770 | 701 | 701 | 0 | 0 |
| श्री रामचरितमानस | `unversioned:ramcharitmanas` | NO_EDITION_MANIFEST | 14 | 0 | unknown | n/a | 0 |
| श्री शिव महापुराण | `unversioned:shiva-mahapuran` | NO_EDITION_MANIFEST | 11 | 1 | unknown | n/a | 0 |
| श्रीमद् देवी भागवत | `unversioned:devi-bhagavata` | NO_EDITION_MANIFEST | 6 | 0 | unknown | n/a | 0 |

**What “COMPLETE_FOR_EDITION” does and does not mean.** It means every unit the *bundled
repository snapshot* (`gita_raw/gita.json` + `gita_raw/hi/*.txt`, SHA-256 of each file recorded in
the manifest) expects is present, uncorrupted and text-identical. `gita_raw/` carries **no**
publisher, editor, edition-year or licence statement, so `provenance.independentCollation = false`
and `rightsStatus = UNKNOWN`. **This is not a collation against a printed/critical edition**, and
it is not a rights clearance.

Counting note: this snapshot numbers **701 ślokas** (ch. 13 = 35, ch. 18 = 78). Recensions differ
(700 is commonly cited); forcing a universal count would be wrong, so the difference is recorded
in the manifest instead.

---

## 4. Executed verification

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS (exit 0)** with the sandbox-only Prisma stub described in §1; without the stub the single failure is `src/lib/db.ts` (untouched by this work) |
| `npx next build` | **PASS** — all pages generated (`/aarti-stotra` 125 kB page / 352 kB first load) |
| `node scripts/audit-granth-inventory.cjs` | PASS — granths 4, stotras 5, aartis 15, siddha-stuti 5; checksums printed for all 7 data modules |
| `npx playwright test tests/kundli-pipeline tests/granth-interactive-flow.spec.ts tests/kashi-sahayak-corpus.spec.ts tests/kashi-patch-regression.spec.ts tests/astrology.spec.ts tests/features.spec.ts tests/granth-canonical-library.spec.ts tests/granth-coverage.spec.ts tests/granth-reading-session.spec.ts` | **323 passed, 0 failed** (268 pre-existing + 55 new) |
| the same list **plus** `tests/granth-reader-http.spec.ts` (live server running) | **326 passed, 0 failed** |
| `npx playwright test tests/granth-reader-http.spec.ts` (against `npx next start`) | **3 passed** — live `/api/guru/chat` route: chapter → pause → explain → resume keeps the cursor; exact verse + citation + refusal of Gita 18.93; tampered client session rejected |
| `curl /aarti-stotra` before vs after migration | HTTP 200, **62 956 bytes both times** — rendered output unchanged |

### What the new suites actually prove

- **Extraction fidelity** — every string of the four collections is compared against the
  pre-migration page literals (read from `git show HEAD:…`); IDs, slugs and section ids (the
  bookmark keys) are asserted unchanged.
- **Edition fidelity** — all 701 stored Gita verses are compared, verse by verse, against
  `gita_raw/gita.json`; all 701 have a stored Hindi anuvāda.
- **Distinct failures** — `UNKNOWN_BOOK`, `UNKNOWN_SECTION`, `INVALID_CHAPTER`, `INVALID_VERSE`,
  `INVALID_RANGE`, `NOT_STORED`, `AMBIGUOUS`, `UNSUPPORTED_SCOPE` are separate and asserted; no
  failure path can return stored-looking text (asserted by checking that failure copy never
  contains a real verse).
- **Corruption** — the scanner flags the historical `मृत्यsourceर्मुक्षीय` string and reports zero
  findings on all four books.
- **No fabrication** — `validateAndRetrieveScripture('gita', 5, 3)` returns
  `isValid:false / status: NOT_STORED` and contains no bracketed placeholder.
- **Session** — start → pause → explain → resume → repeat → next/previous → speed/language/meaning
  → completion; cursor preserved across interruption; cancellation token rotated every turn;
  JSON round-trip restores the position; tampered sessions (bad version, unknown book, malformed
  queue) are rejected.
- **Ambiguity** — “गीता श्लोक ४७ पढ़ो” with no session asks exactly one question; with an active
  chapter-2 session it resolves to 2.47. “आगे पढ़ो” with no session never invents a book.

Resume granularity is **passage-level, with chunk-level position inside the current passage**
(`chunkIndex`). Word-level resume is **not** implemented and is not claimed.

---

## 5. Requirement matrix (Phase 0–2)

| # | Requirement | Implementation | Test | Status |
| --- | --- | --- | --- | --- |
| 1 | Extract page text into shared versioned data without changing it | `scripts/extract-granth-library.cjs`, `src/lib/granth/data/*` | extraction-fidelity test | **Done** |
| 2 | Preserve UI, IDs, bookmarks, available reading content | page imports modules; byte-identical render | fidelity + HTTP 200 | **Done** |
| 3 | No client page imported into the server gateway | gateway → `src/lib/granth` only | typecheck + build | **Done** |
| 4 | Split / lazy-load per book (chat must not ship the library) | `registry.ts` dynamic loaders; page keeps static import | build size + tests | **Partial** — chat path lazy; the library page still bundles all collections (unchanged from before, see gaps) |
| 5 | Native identifiers per book (Gita chapter/verse; Manas kāṇḍa + dohā/chaupāī; Purāṇa skandha/adhyāya) | `types.ts` locators; Gita mapped; others declared unmapped | lookup tests | **Partial** — Gita Done; Manas/Purāṇa numbering **Not implemented** (declared `UNSUPPORTED_SCOPE`, not guessed) |
| 6 | Speaker labels / invocations / colophons as distinct record types | `PassageKind` classification (701 verses + 60 speaker rows + 9 invocation rows) | coverage + canonical tests | **Done** |
| 7 | Per-record provenance (source locator, edition, rights, stable id, checksum) | `PassageRecord.source`, `editionId`, `textChecksum` | canonical tests | **Done** |
| 8 | Separate source quotation / stored meaning / AI explanation | `renderPassage` splits मूल vs भावार्थ; explain turn is labelled `AI_EXPLANATION` | session + gateway tests | **Done** |
| 9 | Reproducible per-edition coverage manifests | `coverage.ts` + `docs/granth/*` | coverage spec (frozen summary) | **Done for Gita**; other three report `NO_EDITION_MANIFEST` (Blocked, §6) |
| 10 | Valid-but-absent / nonexistent / wrong-book / invalid-range / ambiguous are distinct | `lookup.ts` failure codes | distinct-failure tests | **Done** |
| 11 | Corruption detection + correction with evidence | scanner + mantra correction | corruption test | **Done** (correction pending human review) |
| 12 | Explicit reading-session state machine | `session.ts` (`idle/loading/reading/paused/explaining/completed/error`) | session spec | **Done** |
| 13 | Hindi / English / Hinglish commands incl. Devanagari digits | `commands.ts` | 31 command-parsing cases | **Done** |
| 14 | Interruption: stop audio, keep cursor, answer, offer resume | gateway §3.5 + `explainCurrent` + `cancelledReadingTokens` | session + HTTP specs | **Done** (audio cancel wired; audio itself not verified on a device) |
| 15 | Full-book request = resumable queue, not one giant response | queue + one passage per turn | HTTP spec (1 passage, 71+ queued) | **Done** |
| 16 | Persist position/bookmarks with consent, versioned, device-local | `localStorage` key + `SESSION_SCHEMA_VERSION`, documented in code | round-trip test | **Partial** — persistence Done; explicit consent UI **Not implemented** (see gaps) |
| 17 | Browser/device verification of the reader (autoplay, real voice, refresh, offline, double-click) | — | **NOT RUN** | Not tested — Chromium download blocked in this sandbox, no device available |
| 18 | Phase 3–6 (grounded conversation, reader UI polish, Kundli hardening, privacy/docs reconciliation) | — | — | **Not implemented** in this increment |

---

## 6. Known gaps and blockers

1. **Missing source/permission (blocker for the other three Granths).** Ramcharitmanas, Shiva
   Mahapurana and Devi Bhagavata are stored as fragments (14 / 11 / 6 rows) with **no edition
   manifest** and no identified edition or rights record. They are reported as
   `NO_EDITION_MANIFEST`, never as complete. What is needed: an identified edition with display
   and audio rights, then a manifest built the same way as the Gita’s. I did not fabricate
   content to fill the gaps.
2. **Independent collation.** The Gita manifest is built from a repository-internal snapshot with
   no publisher statement. Comparing against a printed/critical edition is still outstanding.
3. **Rights.** The stored Hindi anuvāda and any modern translation/commentary have
   `rightsStatus: UNKNOWN`. Adding new translations needs a permission record first.
4. **Library page payload.** The library page still loads all four granths and the three
   collections eagerly (same behaviour as before the migration). Lazy per-book loading there is
   Phase 4 work because making it async changes the reading UX.
5. **Consent for position persistence.** The reading position is written to `localStorage`
   automatically, like the pre-existing “last read” bookmark. There is no explicit consent
   control yet, and it is device-local only — no account sync, no cross-device resume.
6. **Browser/device evidence.** Nothing here verifies real audio, autoplay rejection, the user’s
   accepted phone voice, refresh mid-chapter, offline interruption or double-click races on a real
   browser. Those need Chromium + a device.
7. **Prisma.** `prisma generate` could not run in this sandbox (network), so DB-backed flows and
   the one `db.ts` type error are unverified here.
8. **Phase 3–6** (emotion-map → grounded retrieval, `ये कहाँ लिखा है?` beyond the current
   passage, reader UI/mini-player, Kundli fault-injection/Dasha boundaries, `/api/guru/chat` input
   bounds and telemetry retention, dependency audit) are untouched.

---

## 7. Deployment status

**No deployment.** No push to `main`, no production deploy, no paid-service or delivery change.
Work is on `arena/01a0593a-cosmictantra-v2` only. A local production server was started for
verification (`npx next start -H 0.0.0.0 -p 3000`) and the live-route suite ran against it.

Delivery commit: **`801a1f3`** on `arena/01a0593a-cosmictantra-v2` (parent `ca5951c`; `3b81cd9` is the main implementation commit).
Verify with:

```
git fetch origin arena/01a0593a-cosmictantra-v2
git show --stat 801a1f3
```

Reproduce the evidence on that commit:

```
npm install
npx prisma generate            # needs network to binaries.prisma.sh
npm run typecheck && npm run build
npm run granth:audit
npm run test:granth
npx playwright test tests/kundli-pipeline tests/kashi-sahayak-corpus.spec.ts tests/kashi-patch-regression.spec.ts tests/astrology.spec.ts tests/features.spec.ts
npx next start -H 0.0.0.0 -p 3000   # then, in another shell:
npm run test:granth:http
```

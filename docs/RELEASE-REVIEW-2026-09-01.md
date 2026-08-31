# Reviewed Arena integration — 1 September 2026

## Scope and release boundary

Reviewed remote branch `arena/01a05842-cosmictantra-v2` at `eed3ba9`, relative to main `1ba1cc9`. Integration corrections are on `review/arena-integration-2026-09-01`, intended for local main. No remote push or production deployment is part of this review.

Review covered the complete changed-file inventory (41 files), changed executable paths/tests, incoming assessment/coverage reports, relevant product/architecture/UX/Kashi/Kundli documentation, library data structure, and supporting chat/API/provenance/validation call sites. This is NOT a claim that every legacy repository file, external service, scripture edition or live device has been exhaustively audited. The next-work prompt explicitly includes remaining validation.

User direction: trustworthy Kundli reports; full chosen-Granth reading through natural conversation with interruption/explanation/resume; simpler mobile UX; preserve the female voice already accepted on the user's live phone.

## Agent changes retained

- Report builder rejects a missing name, incomplete coordinates and absent mandatory interpretation entries.
- Pipeline regression/boundary/contradiction fixtures, with the corrections below.
- Exact-passage reader entry point and gateway integration, constrained to actual stored content.
- Synthetic ghanti/sankh WAV assets and optional Darshan response metadata. No new playback UI or live-recording claim.
- Historical forensic JSON/MP3 artifacts and reports, clearly superseded where claims conflict with executed evidence.

## Blocking defects corrected before integration

1. The incoming Granth tests were 2 passed / 4 failed. Worse, a chapter response contained only a heading/count/placeholder and `isFull: true`; any section ID could be returned as found. Replaced these paths with explicit unavailable responses until the shared library is implemented.
2. Gita lookup previously ignored the requested book when chapter/verse matched a Gita key. Retrieval now requires the correct book and exact stored record. Unknown chapters, missing verses, ranges and sections do not fabricate source text.
3. Replaced the unanchored read-expression parsing with conservative named-book parsing, Hindi/English numeric references and Devanagari digits. Generic “read my report” and contextless “आगे पढ़ो” do not create a scripture request. Range requests are not silently reduced to the first verse. Full conversational parsing remains future work.
4. Gateway unavailable responses are no longer labelled direct scripture quotations. Returned passages carry the chapter/verse reference. One working library link replaces unsupported quick-chip actions.
5. Restored `useKashiVoice.ts` to the approved main implementation. Removed the dead demo-playback API and misleading dynamic `voice-00` metadata from the hook. Historical metadata is explicitly labelled demo-only. No change to the user's working browser voice choice.
6. Added an explicit internal calculation dependency seam and a real engine-exception test. Valid input passes the input/timezone stages; injected engine failure returns `CALCULATION_FAILED`, `ok: false`, and null report/PDF/quality. No HTTP/input option can swap this dependency.
7. Required report-lineage assertions no longer skip when data is absent. The invalid-timezone test is named for GATE 1b. The required ascendant interpretation test now checks the canonical English sign unconditionally rather than a conditional Leo-or-any-text assertion.
8. Added a reproducible, non-executing TypeScript literal inventory script for the page's scripture data.

## Library inventory (not external edition qualification)

Reproduce with `node scripts/audit-granth-inventory.cjs`.

| Collection/text | Observed structure |
| --- | --- |
| Granths | 4 entries |
| Stotras | 5 entries |
| Aartis | 15 entries |
| Siddha stutis | 5 entries |
| Gita | dhyanam + 18 chapter containers; 770 stored rows |
| Ramcharitmanas | 3 sections, 14 rows |
| Shiva Mahapurana | 4 sections, 11 rows |
| Devi Bhagavata | 3 sections, 6 rows |
| Madhurashtakam | stotra collection; 1 section, 2 grouped rows |

Rows include grouping/speaker/other material: they are NOT canonical verse counts. No full-text completeness or translation/edition rights assertion follows from these counts. The small chat corpus remains separate from the library page.

## Executed verification

- `npm run typecheck`: PASS.
- `npm run build`: PASS, including Prisma generation and 610/610 static pages.
- Targeted Kundli pipeline + corrected Granth + Kashi corpus/intake + astrology/features: 268 tests PASS.
- Existing browser regression suite `tests/kashi-patch-browser.spec.ts`: 3 PASS against a local production server; avatar/intake/crisis paths preserved. This does not verify full reader audio or the user's phone.
- Local browser run emitted analytics database errors because `DATABASE_URL` is not configured here; real database-backed flows were not qualified. Browser voice output was not independently auditioned in this review.
- Existing valid PDF fixtures generated 7 pages, zero blanks, density 1.0 in this environment. These metrics do not establish astronomical correctness or full Hindi translation.
- Structural inventory script: PASS. No external edition comparison performed.
- `git diff --check`: PASS.

## Remaining gaps / evidence boundaries

P0/P1 for next agent:

- Shared complete Granth library, edition/source/rights manifests and passage-level coverage; chat currently supports three exact Gita verses, not full books.
- Real reading-session state and command handling shared by chat/UI/speech. No chapter pause/explain/resume implementation was supplied by this branch.
- Legacy `validateAndRetrieveScripture` manufactures placeholder records for valid-but-absent references; Rigvedic corpus text has the visible `source` corruption. New reader does not use that placeholder fallback or expose the corrupted mantra. Audit older consumers separately.
- Safety-first contextual retrieval, source expansion, citations and user-controlled reading preferences; substring emotion maps are not semantic retrieval.
- Stronger Dasha/date/boundary/negative-report tests, full output/reader browser qualification, source-independent astronomical benchmarks and actual delivery-path checks.
- `/api/guru/chat` only validates message type; error details, unbounded history/context and raw-query in-memory telemetry deserve hardening. Do not mistake localStorage for consent/retention compliance or durable cross-device memory.
- Static scholar/provenance labels, dependency security, payment/delivery ownership and external-service readiness require current checks; historical claims conflict.
- Claimed `docs/kundli/00-05` and six additional new astrology modules were not in this fetched change set. Inspect already-existing engine modules before any new implementation.

The imported reports contain unsupported completion statements, mutually inconsistent counts and self-attested JSON booleans. Preserve them as historical artifacts, not proof. This report supersedes their current-status claims. No `FULL_E2E` or whole-product `SAFE_FOR_PRODUCTION` verdict is issued.

## Next work

Use [the detailed next-agent mission](AGENT-NEXT-WORK-2026-09-01.md). Implement the canonical-library/reader vertical flow first, then complete broader qualification. Do not restart voice work the user has accepted or add more astrology frameworks instead of finishing the reader.

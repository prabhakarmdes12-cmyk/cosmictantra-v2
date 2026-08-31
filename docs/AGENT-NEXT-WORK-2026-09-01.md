# Next-agent mission: trusted Kundli + real conversational Granth reading

## Read this before changing code

You are continuing CosmicTantra, not building a replacement product. Work from the reviewed main branch, not an old Arena checkout. Read `docs/RELEASE-REVIEW-2026-09-01.md` first. Historical reports are evidence to investigate, not release guarantees. Your task is to implement the remaining gaps in ordered, reviewable increments, with executable evidence. Do not produce another completion report while leaving the actual integration unfinished.

Repository: `D:/Projects/Cosmic tantra AUGUST 2026`. Main may be checked out in `D:/Projects/cosmictantra-release-review`; inspect `git worktree list` before switching. Preserve all user modifications and other agents' work. Start a new feature branch from the latest reviewed main. Do not merge, push main, deploy, change paid services, or ingest restricted editions without separate authorization. Feature-branch push is allowed when requested by the user. Never hide failing checks or weaken tests merely to get a green result.

## Product direction and scope

CosmicTantra is a trustworthy Vedic utility and scholarly guidance product: today's Panchang, personal/family Kundli, source-grounded devotional reading, and optional human-scholar support. Kashi should feel attentive and conversational while remaining clear that she is an AI assistant. She is not divine authority, a clinician, or a substitute for a qualified human.

The user's immediate priority is complete, verified access to the chosen Granths through conversation: a full book, chapter, individual passage, range, or relevant passage requested by the user; read, pause, explain, and resume without losing position. Their phone's current female voice is accepted. Preserve it; do not restart the voice-provider project or replace speech with prerecorded greetings.

Keep three clear public entry points: Understand today, Understand my chart, Ask an expert. Add reading controls where reading happens, not a new catalogue of buttons on the home page. Read `docs/02_PRODUCT_SPECIFICATION.md`, `docs/UX-SIMPLIFICATION-AUDIT.md`, `docs/KASHI-PATCH-INTEGRATION.md`, and the engineering architecture/incident reports. Reconcile outdated prices, counts, dependencies and qualification claims against current code before repeating them.

The four primary Granth entries currently are Bhagavad Gita, Ramcharitmanas, Shiva Mahapurana and Devi Bhagavata. Supporting stotras/aartis are separate collections. Four complete Vedas are a separate expansion, not a synonym for these four Granths. Confirm any change to this scope with the owner.

## Verified starting point and known gaps

1. The reviewed Arena tip was `eed3ba9`. Its original reader suite failed 4 of 6 tests. Chapter/section responses falsely returned placeholders as complete content. The merge correction deliberately supports only exact Gita verses actually present in the small chat corpus and declines unconnected content. Do not re-enable success placeholders.
2. `src/app/aarti-stotra/page.tsx` contains four data arrays, not a shared library service. `granthsData`: 4 entries; `stotrasData`: 5; `aartisData`: 15; `siddhaStutiData`: 5. Run `node scripts/audit-granth-inventory.cjs` to reproduce structural counts.
3. Gita has a dhyanam section plus 18 chapter containers, 770 stored rows including non-verse/grouped material. Ramcharitmanas has 3 sections/14 rows; Shiva Mahapurana 4/11; Devi Bhagavata 3/6. Madhurashtakam has 2 grouped rows in the stotra collection. Row counts are NOT verse counts or proof of edition completeness. Do not assert a book is complete from its title, subtitle, a `verified: true` flag, or chapter containers.
4. `src/lib/ai/scriptureCorpus.ts` has only four records (three Gita verses and a Rigvedic mantra). The legacy `validateAndRetrieveScripture` returns placeholder records for valid-but-missing Gita verses; that is not retrieval. The Rigvedic text also contains the corruption `मृत्यsourceर्मुक्षीय`. Resolve these with an identified authoritative edition; never reconstruct original scripture from model memory.
5. `gateway.ts` accepts history, but current reading is not a stateful reader. `sessionRef` in speech code cancels stale queues; it is not a saved chapter/verse cursor. A bookmark in the library UI does not prove chat interruption/resumption works.
6. The merge preserves browser speech selection. `voice-00` MP3s are historical sandbox demos only. Neither a gender label nor `utterance.lang = 'hi-IN'` selects that voice. Do not claim a dynamic provider exists because a sample plays.
7. Kundli canonical/report guards and pagination protections exist. A dependency-injected engine exception test now exercises real `CALCULATION_FAILED` handling after valid input. Remaining boundary/date/provenance and delivery checks need stronger coverage; green smoke tests are not complete qualification.
8. Historical `docs/kundli/00-05` plus six allegedly completed astrology modules were not present as new files in the fetched branch. Existing Jyotish modules must be inspected before calling them missing or adding duplicate implementations.

## Phase 0 — establish an evidence-based baseline

- Record HEAD, branch, working-tree status, runtime versions, dependency lock hash and test commands.
- Inventory affected code: library page/data; `granthReader.ts`; `scriptureCorpus.ts`; `scriptureMap.ts`; `gateway.ts`; `provenance.ts`; `useKashiVoice.ts`; both chat components under `src/components/consultation/`; `/api/guru/chat` and `/api/ai/chat`; provider adapters; Kundli pipeline/model/validator/renderer; current delivery entry points.
- Create a requirement matrix: requirement, implementation file/function, test, actual outcome, remaining gap, and dependency. Use Done / Partial / Not implemented / Not tested / Blocked. Never classify unsupported functionality as merely untested.
- Run typecheck and targeted baseline suites. Record failures before changes. Use a configured local server for browser tests; label mocks separately. Missing credentials are a live-service blocker, not proof that application code is correct.

## Phase 1 — canonical scripture library and source integrity (highest priority)

Extract existing text from the client page into shared, versioned data without changing the text during extraction. Preserve the UI, IDs, bookmarks and available reading content. Avoid importing a client page into a server gateway. Split/lazy-load by book/chapter to avoid shipping the entire library with every chat or initial page.

Create native identifiers: book + edition + chapter/verse for Gita; kand + narrative section + doha/soratha/chaupai sequence for Manas; appropriate samhita/skandha/adhyaya units for Puranas. Support speaker labels, invocations and colophons as distinct record types. Do not treat them as numbered verses. Preserve grouped ranges explicitly rather than inventing numbering.

Each record needs original text, optional transliteration, independently attributed translations/commentary, source locator, edition/version, rights status, stable ID and checksum. Separate source quotation, stored meaning and AI explanation. A `verified` boolean is not sufficient provenance.

Build reproducible coverage manifests per edition: expected units, present units, missing ranges, duplicate IDs/text, corrupted characters, grouping rules, and verification status. Compare against an authoritative source, preserving its numbering conventions. Do not force a universal count where editions differ. Identify source and display/audio permissions before adding modern translations or commentary. If a permitted complete source is unavailable, report the exact missing source/permission rather than fabricating content.

Acceptance:

- Existing page content preserved during extraction; bookmarks migrate safely.
- Every returned passage resolves to a stored source record and edition.
- Valid-but-absent, nonexistent, wrong-book, invalid-range and ambiguous references are distinct failures/clarifications, never placeholder success.
- All four selected Granths have per-edition coverage reports. Complete means all expected units are present and verified, not only a chapter list.
- Source mismatch/corruption tests fail before correction and pass afterward.

## Phase 2 — one reading session shared by chat, reader and speech

Implement an explicit state machine (idle, loading, reading, paused, explaining, completed, error). Store book/edition, requested scope, current passage ID/index, chunk offset, last completed chunk, language, original/meaning preference, speed and a cancellation token. Define exactly whether resume is passage-level or chunk-level; never promise word-level precision without supported boundary events and tests.

Support Hindi, English and common Hinglish commands: full book, chapter, verse, range, section; stop/pause/resume/repeat/previous/next; slower/faster; only original; meaning too; explain this; show source. Handle Devanagari digits and ordinal chapter requests. Ambiguous “verse 47” may use an active book/chapter session; otherwise ask one clarification. “आगे पढ़ो” must use the active cursor, not invent a chapter or restart silently.

On interruption: stop outstanding audio, preserve cursor, answer using the current passage plus neighbouring context, then offer/respect resume. Cancel stale audio/results when switching books or starting a new request. A full-book request should create a resumable queue, not one giant LLM response or TTS string. Respect intentional stop, navigation, network failure and disabled audio. Do not make hidden playback continue after stop/unmount.

Persist reading position/bookmarks with consent and versioning. Keep emotional disclosures separate from reading position. Explain whether continuity is device-local or account-backed; never claim cross-device sync from localStorage.

Acceptance: browser test executes read chapter -> hear/observe queued actual passage -> pause -> explain current passage -> resume correct passage -> repeat -> previous -> change language/speed -> finish. Test refresh, navigation, offline interruption, stale network response and double-click races. Use a deterministic mocked speech adapter for automated scheduling tests plus a separately labelled real-device audio check. Do not substitute three prerecorded MP3s for this flow.

## Phase 3 — grounded, useful conversation

Keep crisis/safety checks before scripture, chart intake, commercial routing and reader commands. A distressed user asking to talk should not be forced into scripture or a paid consultation. Start with their actual concern; use brief, relevant follow-ups and practical next steps. Feminine self-reference applies to Kashi, not to original quotations or user phrases.

Replace fixed emotion-to-verse shortcuts with source-grounded retrieval: exact lookup first; lexical/concept search and metadata filtering; surrounding context; then optional semantic retrieval/reranking with an explicit provider/index and permission/budget. Never claim semantic search exists from substring matching. Before a long reading based on a situation, ask consent. Obey “बस सुनना है”, “सिर्फ पढ़ो”, “अर्थ भी”, “बस बात करो”.

For “ये कहाँ लिखा है?”, resolve the actual prior source record. If unsupported, correct the answer rather than invent a citation. Cross-Granth answers retain independent provenance and acknowledge differences. Kundli calculations do not mathematically prove the applicability of a scripture verse.

Acceptance: multi-turn cases covering job worry, normal grief, practical interview help, user-declined scripture, unknown citation, invalid Gita chapter, misquoted passage, and crisis overriding an active reader. Verify via the real HTTP/chat route, not just direct helper calls. Preserve current intake safety and profile-save regression tests.

## Phase 4 — concise reader UI and voice continuity

Use the existing library page and chat surfaces. Show book, chapter/passage, original/meaning distinction and one primary play/pause control. Put speed, source and bookmarks in compact secondary controls. Use a persistent mini-player only where lifecycle/state is actually shared. No duplicate Listen/Continue/Start buttons doing the same thing. Avoid scholar upsells during requested reading.

Preserve phone voice selection. If a user-controlled voice picker is added, show voices actually available and an honest fallback. A server TTS provider is a separate decision involving cost, privacy and credentials; request approval before changing this architecture.

Keep body text readable (target 16px+), touch targets about 44px, visible keyboard focus, semantic labels, no horizontal overflow at 320/360/390px, and no visual regression at desktop widths. Test long Hindi conjuncts, wrapping, enlarged fonts, screen-reader labels and autoplay rejection. Audio failure must be visible and retryable rather than silently skipped. Synthesized ghanti/sankh assets are synthetic effects, not live temple recordings; do not claim controls exist until UI consumes them.

## Phase 5 — finish Kundli reliability before adding advanced astrology

Preserve the canonical calculation -> report -> renderer -> PDF quality -> delivery chain. Add fault injection for invalid canonical results (empty planets, missing Moon/Lagna, invalid Dasha), report omissions, renderer exceptions, extraction errors, page ceiling and stalled progress. Assert the specific failing stage, no report/PDF leakage, and no downstream delivery invocation. Avoid `if (dataExists)` around assertions for required data.

Freeze the reference clock for Dasha tests. Check actual interval membership, start/end ordering, gaps/overlaps, timezone/date conversion and exact mathematical boundaries. A noon fixture with a valid sign is not a sign-boundary test. Build before/at/after fixtures for transitions and provenance-compatible external benchmarks. Self-comparison to the same engine is not an independent astronomy check.

Strengthen contradiction checks against canonical values and deliberately corrupted reports. Inspect the existing `src/lib/jyotish/contradictionDetector.ts` and actual delivery integration before creating a competing detector. Distinguish a test suite named “contradiction detector” from a runtime guard.

Generate at least two materially different valid English/Hindi PDFs, including long mixed-language content. Extract and visually inspect all pages for required values, chart readability, conjunct shaping, clipping, orphan headings and blanks. Test UI download, API/email/WhatsApp paths where configured, authorization and retry/idempotency. Do not issue real payments or external deliveries without permission.

Review typed errors: unexpected engine exceptions currently reach CALCULATION_FAILED but the generic helper may label their error code KUNDLI_PDF_RENDER_FAILED. Make stage-specific errors accurate without exposing stack traces. Review debug data retention and personal-data logging.

Only after these gates: inventory Shadbala, Varga, Jaimini, source registry and multi-volume implementations already present. For each list formulas/conventions, units, dependencies, external reference fixtures and limitations. Do not create duplicate engines, inflate report page counts, silently change traditions, or equate a framework/schema with complete functionality.

## Phase 6 — privacy, security and documentation reconciliation

Review `/api/guru/chat`: bound message/history/context shapes and sizes, handle malformed input, avoid returning internal error details, and apply appropriate abuse/rate controls. `gateway.ts` logs raw query metadata into an unbounded process-memory telemetry store; replace with minimized bounded metrics and suitable retention. Reading bookmarks must not preserve sensitive conversation by accident.

Review hardcoded provenance: fixed ayanamsha labels and scholar signatures must reflect actual calculation configuration and authenticated review records, not generic decorative badges. Verify consultation ownership, payment idempotency, source rights and production service configuration before declaring those flows ready. Do not assume historical reports of simulated payments still describe current payment code.

Run a current dependency audit and propose scoped upgrades with compatibility tests. Earlier review noted Next/PostCSS issues; reverify instead of repeating stale vulnerability counts. Do not mix framework upgrades into the reader merge without a clear rationale and regression coverage.

Maintain one dated release/acceptance report linked from docs/README.md. Mark superseded assessments visibly. Replace unsupported “100%”, “all tests passed”, “complete content” and “real voice integration” claims with scoped evidence. Missing modules claimed in chat must be supplied as commits or recorded as absent—not reconstructed from prose.

## Required tests and final handoff

Run on the exact delivered commit (not a prior workspace):

```
npm run typecheck
npm run build
node scripts/audit-granth-inventory.cjs
npx playwright test tests/kundli-pipeline tests/granth-interactive-flow.spec.ts tests/kashi-sahayak-corpus.spec.ts tests/kashi-patch-regression.spec.ts tests/astrology.spec.ts tests/features.spec.ts
```

Start a local production server and run `tests/kashi-patch-browser.spec.ts`, new reader browser tests and affected report/download tests using its BASE_URL. Add focused tests per change; run broader relevant suites as scope grows. Keep deterministic tests and real-provider/device tests separately labelled. A dev server “Ready” line is not E2E verification.

Final response must include exact commit/branch, changed files and why, completed requirements, known gaps, commands and actual exit/results, fixture/source versions, artifact paths, mobile/device evidence, and explicit deployment status. State whether each limitation is missing implementation, missing content, missing credentials or not-tested behaviour. Do not wait for a magic “complete/test/done” message while safe in-scope implementation remains; finish the selected phase, then hand off honestly.

First deliverable: canonical-library extraction plus reproducible edition-aware coverage and safe exact lookup, preserving the current UI and approved speech. Next: one demonstrably working chapter interruption/resume path. Broader completion follows only after that vertical flow works.

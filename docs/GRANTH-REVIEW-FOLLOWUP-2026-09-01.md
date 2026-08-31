# Granth reader — review follow-up (1 Sep 2026)

Response to the four defects reported against `801a1f3`. Increments:
[`GRANTH-READER-ACCEPTANCE-2026-08-31.md`](./GRANTH-READER-ACCEPTANCE-2026-08-31.md) (Phases 0–2)
→ [`GRANTH-GROUNDED-CONVERSATION-2026-09-01.md`](./GRANTH-GROUNDED-CONVERSATION-2026-09-01.md) (Phase 3)
→ this document.

**Delivery commit `b596c85`** on branch `arena/01a0593a-cmyk/cosmictantra-v2` (pushed).
Nothing merged to `main`, nothing deployed, no paid-service change.

## 1. The four reported defects

| # | Reported | Fix | Proof |
| --- | --- | --- | --- |
| 1 | Migration-preservation test reads `HEAD:…page.tsx`, which already contains imports — the comparison was empty and the guard **skipped itself** | Pinned to `ca5951c` (the reviewed main); the baseline is asserted to be the pre-migration page, and a missing baseline or missing literals now **fails** instead of skipping | `tests/granth-canonical-library.spec.ts` → 10 passed (the fidelity comparison is genuinely executed) |
| 2 | Reader buttons can submit stale input: `setInputVal(phrase)` + deferred `handleSendMessage()` reads the closure's **old** `inputVal` | `handleSendMessage(e?, commandText?)`; chips call `handleSendMessage(undefined, phrase)` — no state round trip | Browser test: text typed but not sent, then a chip click, must not send the typed text (`tests/granth-reader-browser.spec.ts`); source guard in `tests/granth-reader-progression.spec.ts` |
| 3 | Speech not connected to progression; “Continue” repeats the current passage; session speed not applied | `speak(text, { rate, onDone })`; the client asks for the next stored passage when a passage has been spoken; `CONTINUE` advances while `state === 'reading'` and resumes after an interruption; speed reaches the utterance rate | `tests/kashi-voice-progression.spec.ts` (8, headless Web Speech fake), `tests/granth-reader-progression.spec.ts`, `tests/granth-reader-http.spec.ts` (live), `tests/granth-reader-browser.spec.ts` (real browser) |
| 4 | Negative cursor, forged edition, invalid state and invalid speed accepted when the book is recognised | Every field validated (`validateSessionShape`) + corpus check (`reviveVerifiedSession`: every queued passage must exist, edition must match the stored manifest, labels come from the store); speed clamped on set/start | `tests/granth-reader-progression.spec.ts` — 20 tamper cases with distinct rejection reasons |

### 3. Progression semantics (deliberate change)

`आगे पढ़ो` / “continue” now means:

- **while reading** → read the **next** stored passage (previously it re-read the one just spoken);
- **after pause / explain / completion** → resume the interrupted passage from its start (unchanged).

Auto-advance is decided by the server's own session state, never guessed client-side
(`shouldAutoAdvance`), and is additionally stopped by: pause, explain, completion, a
single-passage reading, mute, closing the panel, a rejected session, or a turn that does not
move the cursor.

**Delivery guard (found by running the browser flow).** With no installed voice, Chromium fires
`onend` immediately; the reader raced from passage 0 to 21 in silence. Completion now counts only
when an utterance plausibly took the time its text requires (≥1.2 s and ≥20 % of the expected
duration), and an utterance that **errors** is never treated as “read”.

## 2. Evidence

| Check | Command | Result |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | exit 0 (sandbox Prisma stub, see §4) |
| Build | `npx next build` | PASS |
| Granth + Kashi suites | `npx playwright test tests/granth-*.spec.ts tests/kashi-voice-progression.spec.ts tests/kashi-sahayak-corpus.spec.ts` | **262 passed, 0 failed** |
| Live HTTP reader | `tests/granth-reader-http.spec.ts` | 5 passed (read → pause → explain → resume, exact verse, tamper rejection, advance vs resume) |
| **Browser flow** | `tests/granth-reader-browser.spec.ts` (real Chromium) | **2 passed** |
| Whole suite (with browser) | `npx playwright test` | **613 passed, 35 failed, 1 skipped** — see §3 |

Browser flow actually executed (`granth-reader-browser.spec.ts`):

1. `गीता अध्याय १२ पढ़ो` → “अध्याय पंक्ति तैयार”, session `reading`, cursor 0
2. typed text left in the input, then the **pause chip** → “रोका गया”, `paused`, cursor 0, and the
   typed text was never sent
3. **explain chip** → “संग्रहीत भावार्थ”, cursor 0
4. **continue chip** → resumes the interrupted passage, cursor 0, `reading`
5. **continue chip** again → cursor **1** (the next stored passage, not a repeat)
6. reload → same `sessionId`, cursor 1→(2), and the server accepts the restored session for the next passage

**Correction (commit `5b6d191`).** Step 4 above was not proved reliably. The test waited on the
cursor alone after clicking “आगे पढ़ो”:

```ts
await page.locator('button:has-text("आगे पढ़ो")').last().click();
await waitForCursor(page, 0);          // cursor is ALREADY 0 before the click
```

so the wait returned immediately and the assertion could read the previous `paused` state instead
of the `reading` state the response was about to persist. It passed on a fast run and failed on a
slow one — the result carried no information about the application.

`waitForTurn` now waits for the whole post-action condition: expected **state**, expected
**cursor**, and proof the session was **revised** by a new response (fresh `cancellationToken`,
rotated on every mutating turn, and an `updatedAt` strictly newer than the pre-click snapshot).
Polling only, no sleeps. Demonstrated with a temporary spec that delayed every `/api/guru/chat`
response by 1.5 s: the old wait provably observed the stale `paused` state, the new wait was
correct under the same delay. Re-verified with **3 consecutive runs** on a clean build
(`rm -rf .next && npx next build`) and a freshly restarted server — 2 passed each time.

## 3. Correction to an earlier claim, and the pre-existing failures

In a previous hand-off I reported the whole suite as “526 passed / 0 failed”. **That was wrong** —
I had read a truncated summary. The browser tests were failing because no Chromium could be
downloaded (`npx playwright install` is blocked here); the failures were above the visible window.

The true numbers:

- **Without a browser** (default sandbox): 101 failed / 527 passed / 1 skipped — every failure is a
  browser test that cannot launch.
- **With a browser** (a Chromium 132 binary extracted locally, not committed): **613 passed /
  35 failed / 1 skipped**.

The 35 remaining failures are **pre-existing and unrelated** to this work. Verified by stashing
these changes, rebuilding, and running the same 12 files on the parent commit `bddab56`:
**43 failed / 16 passed** on the parent vs **33 failed / 26 passed** with these changes (browser
timing makes the count move a few tests run to run). They are all in suites this increment does
not touch, and they fail for environment reasons:

- `analyze-1000-jpl`, `jpl-10-case-audit`, `astrosage-differential-benchmark` — need external
  NASA/JPL network access;
- `consultation-v1-*`, `helpdesk-whatsapp`, `consultation-flow` (pandit workspace) — need a real
  database (`prisma generate` cannot run here, so `@prisma/client` is a stub);
- `location-real-world`, `realtime-gps` — need geocoding network access / geolocation permission;
- `kundli-cities`, `single-flow-kundli`, `shell-integrity` (`/store`) — page/copy assertions this
  work does not touch.

No Granth, reader, Kashi-voice or corpus test fails.

## 4. Gaps — split by kind

**Missing implementation**

- Reading **consent UI**: the assistant asks before a long reading, but there is no yes/no control
  in the chat yet (bare “हाँ पढ़ो” is answered with “क्या पढ़ूँ?”).
- Word-level resume is still not implemented (resume is passage-level with a `chunkIndex`).
- No semantic/embedding retrieval (unchanged; needs a provider, index, budget and owner decision).

**Missing content**

- Only the Gita has a complete edition manifest. Ramcharitmanas / Shiva Mahapurana /
  Devi Bhagavata remain `NO_EDITION_MANIFEST` (14 / 11 / 6 rows); no restricted-edition ingest.

**Missing credentials / environment**

- `prisma generate` cannot run (`binaries.prisma.sh` unreachable) → DB type-safety NOT verified;
  `npx tsc --noEmit` and `next build` were run against a hand-written, **not committed** stub at
  `node_modules/.prisma/client`.
- `npx playwright install` is blocked. The browser evidence above used a Chromium 132 binary
  extracted from the npm package `@sparticuz/chromium` (installed with `--no-save`, not committed).
- Chromium in this sandbox has **no speech voices**, so audible output, voice selection, pacing and
  autoplay were **NOT** verified. The speech contract is verified against a fake Web Speech API.

**Not tested**

- Real audible reading with a Hindi voice on a real device (including the new auto-advance chain
  and the delivery guard under a real engine).
- Multilingual (non hi/en) wording of the new replies.
- Autoplay rejection / interruption behaviour on mobile Safari and Chrome Android.

## 5. Reproduction

```bash
git checkout arena/01a0593a-cosmictantra-v2 && git reset --hard b596c85
npm install --no-audit --no-fund --ignore-scripts
npx tsc --noEmit
npx playwright test tests/granth-*.spec.ts tests/kashi-voice-progression.spec.ts \
  tests/kashi-sahayak-corpus.spec.ts --reporter=line     # offline: 262 passed

npx next build && npx next start -H 0.0.0.0 -p 3000
npx playwright test tests/granth-reader-http.spec.ts --reporter=line
npx playwright install chromium                          # or CHROMIUM_PATH=…
npx playwright test tests/granth-reader-browser.spec.ts --reporter=line
```

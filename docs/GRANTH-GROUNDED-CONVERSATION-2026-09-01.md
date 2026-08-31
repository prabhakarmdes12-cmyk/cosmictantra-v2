# Grounded conversation — acceptance report (1 Sep 2026)

Increment: **Phase 3 (grounded conversation)** of
[`AGENT-NEXT-WORK-2026-09-01.md`](./AGENT-NEXT-WORK-2026-09-01.md).

This is an increment report, not a product release verdict. It covers only what was executed here
and it does **not** supersede
[`GRANTH-READER-ACCEPTANCE-2026-08-31.md`](./GRANTH-READER-ACCEPTANCE-2026-08-31.md) (Phases 0–2)
or [`RELEASE-REVIEW-2026-09-01.md`](./RELEASE-REVIEW-2026-09-01.md).

## 1. What the phase had to prove

The assistant must answer from the **stored** corpus or say that it has nothing. Specifically:

1. An explicit reference is answered from the stored edition (already delivered in Phase 1) and
   takes precedence over any fuzzy matching.
2. A **quoted** line is confirmed only when the stored corpus contains it; a fabricated line is
   refused instead of being "confirmed" from model memory.
3. A life question is answered concern-first (with a practical step where one exists) and quotes at
   most two stored passages, each with its reference, edition and checksum.
4. A stated preference to just talk (श्लोक मत सुनाओ / बस सुनना है / just talk) short-circuits
   scripture, chart intake and commercial routing.
5. A Kundli/chart question never treats a calculation as proof that a verse applies to someone.
6. A long reading is **offered**, not started.
7. Keyword matching is never presented as semantic search.

## 2. What was built

| File | Purpose |
| --- | --- |
| `src/lib/granth/retrieval.ts` (new) | `retrieveGroundedPassages()` — EXACT_LOOKUP → LEXICAL_STORED_CORPUS → NONE; `verifyQuotation()`; `extractQuotedFragment()`; `referenceFor()` |
| `src/lib/ai/conversationPrefs.ts` (new) | `detectConversationPreference()` → `DECLINE_SCRIPTURE` / `ONLY_LISTEN`, and a reply with no quotation, no upsell, no intake question |
| `src/lib/ai/groundedAnswer.ts` (new) | `buildGroundedAnswer()`, `buildPracticalAnswer()`, `practicalStepFor()`, `looksLikePracticalConcern()` |
| `src/lib/ai/gateway.ts` | block 3.1 quotation verification (after the safety blocks), 3.2 stated preference, 4.8 grounded retrieval, practical fallback, bare-consent clarification |
| `src/lib/ai/granthReader.ts` | `SOURCE` with no session answers honestly ("nothing quoted yet"); citation phrasings recognised as reading utterances |
| `tests/granth-grounded-conversation.spec.ts` (new) | 18 deterministic tests for the rules above |

### Honesty constraints encoded in code

- `retrieval.ts` header states there is **no embedding model, no vector index, no LLM re-ranking**
  and therefore no semantic search. `RetrievalOutcome.mode` says which stage produced a result and
  `structuredCard.retrieval.semanticSearch` is always `false`.
- `verifyQuotation()` requires ≥ 70 % of the quoted tokens to appear in one stored passage before
  answering "yes, this is in the corpus"; otherwise it refuses.
- Lexical hits are quoted **only** when the utterance actually asks about the text
  (गीता / शास्त्र / श्लोक / कहा गया / gita / verse …) or when the reference was exact. A keyword
  coincidence in an unrelated sentence is never presented as a relevant answer.
- Terms appearing in more than 30 % of a book's passages are treated as background and cannot
  produce a match; Devanagari is tokenised with combining marks (`\p{M}`), so आत्मा is not matched
  as "आत".
- Nothing in these paths generates scripture text: every quoted line is re-checked against
  `lookupVerse()` in the tests.

## 3. Evidence

| Check | Command | Result |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | exit 0 (sandbox Prisma stub, see §5) |
| Build | `npx next build` | PASS |
| New suite | `npx playwright test tests/granth-grounded-conversation.spec.ts --reporter=line` | **18 passed** |
| Regression corpus | `npx playwright test tests/kashi-sahayak-corpus.spec.ts --reporter=line` | **151 passed** |
| Whole suite | `npx playwright test --reporter=line` | **526 passed, 1 skipped, 0 failed** |
| Live HTTP (built server) | `bash /tmp/live_phase3.sh` (POST `/api/guru/chat`) | see §4 |

Delivery commit: **`66a31fb`** on branch **`arena/01a0593a-cmyk/cosmictantra-v2`** (pushed).
Parent: `c6c8e88`. No merge to `main`, no deploy, no paid-service change.

## 4. Observed behaviour (built server, POST /api/guru/chat, 1 Sep 2026)

| Input | intent / provenance | Output (abridged) |
| --- | --- | --- |
| गीता में लिखा है: कर्मण्येवाधिकारस्ते मा फलेषु कदाचन | GRANTH_READ / SOURCE_DOCUMENTED | "हाँ — यह पंक्ति संग्रहीत पाठ में है: गीता २.४७ …" + mūla + भावार्थ |
| गीता में लिखा है: जो डरेगा वह जीतेगा | GRANTH_READ / **AI_EXPLANATION** | "यह वाक्य संग्रहीत गीता-पाठ में मुझे नहीं मिला, … पुष्ट नहीं करूँगी।" — no verse quoted |
| श्लोक मत सुनाओ, बस बात करो | CONVERSATION_PREFERENCE / AI_EXPLANATION | "न कोई श्लोक, न मन्त्र, न कोई सुझाव। मैं बस आपकी बात सुन रही हूँ।" — no passage, no ₹, no intake |
| गीता में भय और चिन्ता पर श्लोक बताइए | LIFE_QUESTION / SOURCE_DOCUMENTED | concern-first, then `गीता ११.४५` verbatim; `retrieval.mode = LEXICAL_STORED_CORPUS`, `semanticSearch = false` |
| कल इंटरव्यू है, कुछ उपयोगी बताओ | UNKNOWN / AI_EXPLANATION | practical step + "मैं कुछ उद्धृत नहीं कर रही …" (`retrieval.mode = NONE`) |
| ये कहाँ लिखा है? | GRANTH_READ / AI_EXPLANATION | "…अभी तक संग्रहीत पाठ से कोई अंश उद्धृत नहीं हुआ है" — no invented source |
| हाँ पढ़ो (no session) | GRANTH_READ / AI_EXPLANATION | "क्या पढ़ूँ? जैसे — 'गीता अध्याय २ पढ़ो'" |
| गीता अध्याय २ पढ़ो | GRANTH_READ / SOURCE_DOCUMENTED | "अध्याय पंक्ति तैयार (७९ अंश)" + stored edition line |

Reading session (read → pause → explain → resume) re-verified against the rebuilt server:
`npx playwright test tests/granth-reader-http.spec.ts` → 3 passed.

## 5. Gaps — split by kind (nothing here is claimed as complete)

**Missing implementation**

- No semantic/embedding retrieval. Concept-level relevance is therefore limited: a query such as
  "आत्मा अमर है, इस पर गीता क्या कहती है?" can return a lexical hit that is only loosely related
  (or nothing). Adding embeddings would need a provider, an index, a budget and an owner decision.
- No cross-Granth concept index. Ramcharitmanas / Shiva Mahapurana / Devi Bhagavata are still
  `NO_EDITION_MANIFEST` (14 / 11 / 6 rows), so cross-Granth answers cannot be demonstrated yet.
- The reading **consent** UI is still not built: the assistant asks, the client does not yet render
  a yes/no control. Bare "हाँ पढ़ो" is answered with a clarifying question (see §4).
- Word-level resume inside a passage is not implemented (resume is passage-level with a
  `chunkIndex`); it must not be promised.

**Missing content**

- Only the Gita has a complete edition (`ct-gita-bundled-devanagari-hi-2026-08-31`, 770 rows).
  No restricted-edition ingest was performed.

**Missing credentials / environment**

- `prisma generate` cannot run in this sandbox (`binaries.prisma.sh` unreachable). `npx tsc` and
  `next build` were run against a hand-written, **not committed** stub at `node_modules/.prisma/client`.
  Database type-safety is therefore NOT verified.
- Chromium download is blocked, so voice rendering, autoplay behaviour and the reader UI are
  **NOT TESTED** on any device. All Phase-3 evidence above is offline logic plus HTTP responses.

**Not tested**

- Female voice quality / speech pacing for the new answer shapes.
- Multilingual (non hi/en) phrasing of the new refusals and preferences.
- Real-user comprehension of the "nothing quoted" replies.

## 6. Reproduction

```bash
git checkout arena/01a0593a-cosmictantra-v2 && git reset --hard 66a31fb
npm install --no-audit --no-fund --ignore-scripts
npx tsc --noEmit
npx playwright test tests/granth-grounded-conversation.spec.ts --reporter=line
npx playwright test tests/kashi-sahayak-corpus.spec.ts --reporter=line
npx next build && npx next start -H 0.0.0.0 -p 3000
curl -s -X POST http://localhost:3000/api/guru/chat -H 'Content-Type: application/json' \
  -d '{"message":"गीता में लिखा है: जो डरेगा वह जीतेगा","lang":"hi"}'
```

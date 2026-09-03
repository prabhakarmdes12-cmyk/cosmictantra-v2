# Kashi V3 & Kundli Revamp — Implementation Plan

**Status: IMPLEMENTED** (commits `1c38b34`, `666f3d1`, `df5f70a`, `ab02f6b`, `7d9a68c` on branch `arena/01a06413-cosmictantra-v2`; merged into the re-rooted `main` snapshot `0d65c24` by the local agent, reconciled back onto the session branch via merge `366eb25`, which also carries main's follow-up fix `f0ddab7`)

This document is the authoritative implementation plan for the Kashi Sahayak V3
revamp and the Kundli experience cleanup. It is written so a local agent can
verify every claim against the code. Module-by-module it records the
requirement, the decision taken, and the exact files that carry the change.

The companion specification — what Kashi Sahayak *does*, flow by flow — lives
in [`KASHI_SAHAYAK_FLOWS_AND_CAPABILITIES.md`](./KASHI_SAHAYAK_FLOWS_AND_CAPABILITIES.md).

---

## Module 1 — Zero-LLM conversational backbone

**Requirement.** Kashi must be the best possible *deterministic* conversational
assistant. The chat must never depend on a model being reachable, and the core
dialogue loop must be fully reproducible:

```
Utterance → LanguageNormalizer → WeightedIntentMatcher → EntityExtractor
          → ConversationState & FlowStack → MissingSlotResolver
          → Deterministic Router → TemplateEngine → NextBestActions → Voice
```

**Implementation.** `src/lib/kashi/conversationCore.ts` — a pure TypeScript
module (no React, no I/O, no network) implementing every stage of the pipeline:

| Stage | Export | Notes |
|---|---|---|
| LanguageNormalizer | `normalizeUtterance` | Whitespace collapse; case-insensitive synonym folding (`rahu kaal`→राहुकाल, `panchangam`→पंचांग, `kundali`→कुंडली …); `lang` judged *after* folding so Hinglish gets a Hindi voice |
| WeightedIntentMatcher | `matchIntent`, `INTENT_CUES`, `MATCH_THRESHOLD` | Weighted cues per intent, best-score wins above 0.6. **Devanagari-safe boundaries**: JS `\b` is ASCII-only, so Hindi cues use lookarounds against `\u0900-\u097F` — `/\bक्यों\b/` never matches `क्यों?`, and `क्योंकि` must not match either |
| EntityExtractor | `extractEntities` / `applyEntities` | Subject (SELF/PARTNER/CHILD/PARENT/SIBLING — stem-matched so `बेटा/बेटे` both hit), date words (आज/कल/परसों/उस दिन), 8 city cues, life domain (CAREER/MARRIAGE/HEALTH/REMEDY/PROPERTY from free text), detail level |
| Birth-input normalizers | `normalizeBirthDateInput` / `normalizeBirthTimeInput` | Intake answers (`15/06/1995`, `10:30 AM`) → canonical kernel form (`1995-06-15`, `10:30`); garbage → null, never a guessed date |
| ConversationState & FlowStack | `ConversationState`, `suspendFlow`, `resumeFlow` | Immutable state; LIFO frame stack |
| MissingSlotResolver | `nextMissingSlot`, `INTAKE_SLOT_ORDER` | name → birthDate → birthTime → birthCity → question |
| Deterministic Router | `routeFollowUp`, `recordFact`, `detectLifeConcern` | Returns `null` to fall through to the factual engines (`resolveDeterministicKashiIntent` in `src/lib/ai/kashiIntentEngine.ts`, which was already deterministic) |
| TemplateEngine | `FACT_FAMILY_EXPLANATIONS`, authored reply records | Every template is hand-authored Hindi; no generation |
| NextBestActions | `nextBestActions`, `LIFE_PATHWAY_CHIPS` | State-derived chips stamped onto messages |

**Wiring.** `src/components/consultation/FloatingAIGuruAvatar.tsx` runs
normalize → entities → match **before** the guided-intake slot machine, keeps
the state in `convStateRef`, and records every gateway `GET_*` answer as the
conversation's active fact (`postGuru`). The `SET_DOMAIN_*` intake chip writes
`activeDomain` directly, and free-text domain cues keep it updated afterwards. The LLM gateway (`/api/guru/chat` →
`processKashiSahayakQuery`) remains the *last* resort — deterministic panchang
first — and the V3 core never calls it.

**Tests.** `tests/kashi-conversation-core.spec.ts` (36 node-runnable contract
tests, KC1–KC10).

## Module 2 — Conversation state & flow interruption

**Requirement.** State carries active subject/date/location/domain/intent/fact,
the pending flow, the stack, and the detail level (SHORT/NORMAL/PANDIT). An
interruption must **never** lose the prior flow: `"आज राहुकाल?"` asked in the
middle of birth-time intake must get a full राहुकाल answer, the intake must be
suspended into `pendingFlow`, and the user must be offered to resume. Required
follow-ups: `उस दिन?`, `कल वाला?`, `उसकी राशि?`, `क्यों?`, `मतलब?`, `कब तक?`, `वापस`.

**Implementation.** In `handleSendMessage`, while intake is active the component
checks (a) `INTERRUPTING_INTENTS` from the matcher and (b)
`resolveDeterministicKashiIntent` for a factual question. On interrupt it calls
`suspendFlow(state, intakeFrame())`, sets `intakeStep='IDLE'`, answers fully,
then pushes a resume nudge with a `↩️ वापस — कुंडली इन्टेक जारी रखें` chip
(`RESUME_FLOW`). Resume restores slots + step and re-asks the exact pending slot
question. `उस दिन?` with a bound date re-runs the panchang engine on that date;
`उसकी राशि?` refuses to invent a sign. Detail level toggles acknowledgement copy.

**Tests.** KC2–KC6, KC10 (including ordering: the suspend branch precedes the
slot machine in source).

## Module 3 — Life concerns & Granth recitation

**Requirement.** Job anxiety / heartbreak / stress must receive an empathic
acknowledgement **first** — never forced Jyotish — followed by humane pathways:
[बात करना] [वर्तमान समय समझना] [शान्ति अभ्यास] [जप] [दर्शन] [पंडित से बात].
Granth Recitation flow with 8 scriptures and continuous narration controls.

**Implementation.** `detectLifeConcern` + `lifeConcernReply` (empathy copy is
authored per concern; the reply deliberately contains zero jyotish vocabulary)
+ `LIFE_PATHWAY_CHIPS` in the exact plan order (`OPEN_CONCIERGE` last). Chip
dispatch: TALK → mood chips, TIME → `handlePanchangQuery`, SHANTI → authored
3-step practice card (`SHANTI_PRACTICE_HI`) + ॐ playback + जप link, JAPA →
`/remedy-tracker`, DARSHAN → live darshan. The 8-scripture recital catalogue
(`src/lib/kashi/granthRecitals.ts`, 6 library-backed + 2 embedded sourced texts)
and continuous narration (`readingAutoAdvanceRef` + `shouldAutoAdvance` from
`src/lib/granth/session`) were delivered in Component 4/5 and verified intact.

**Tests.** KC7, plus existing `tests/kashi-sahayak-flows.spec.ts`.

## Module 4 — Kundli intake & VIP handover

**Requirement.** Intake → Lagna/Rashi/Nakshatra/Dasha → Astrological Pulse Card
→ two doors: [📄 View Full Kundli / Download PDF → `/report`] and
[📞 Talk to Astrologer → VIP Concierge Modal: **+91 9972934937**, WhatsApp
₹501 payment link, pandit group-call patch, PDF + Drive recording on WhatsApp,
**ScholarHandoverPacket generation** (new)].

**Implementation.** The pulse card now also **recites** (a `speakText` reads
out lagna, nakshatra, active dasha, the day's transit verdict and the top life
gauge) and displays the **Executive 6-Dimension Life Gauges**: birth answers
are normalized (`normalizeBirthDateInput`/`normalizeBirthTimeInput`), a
`CanonicalJyotishSnapshot` is built via *dynamic import* of
`src/lib/jyotish/canonicalSnapshot.ts` (chat bundle stays light), and
`computeExecutiveLifeDimensions` feeds a six-bar gauge strip on the card. A
kernel failure costs only the strip — never the pulse card. Verified at
runtime: 6 dimensions with real scores (89/85/84/93/71/…% on the golden
15-06-1995 10:30 Patna chart).

Pulse card + two CTAs + concierge modal existed from
Component 5. **New:** `src/lib/kashi/scholarHandover.ts` —
`buildScholarHandoverPacket({seeker, pulse}, now?)` produces a deterministic,
quotable packet (`SH-YYYYMMDD-XXXX`, FNV-1a suffix) with six Hindi sections:
साधक परिचय / खगोलीय सारांश / गोचर संदर्भ / प्रश्न / सिफारिश / स्रोत व प्रमाणन.
Gaps are declared as `इन्टेक अधूरा` — never bluffed. The packet is built the
moment intake completes, displayed in the concierge modal (with 📋 copy), and
becomes the full `wa.me` prefill text. Phone/tel/WA links unchanged
(`VIP_CONCIERGE_PHONE_DISPLAY` = +91 99729 34937).

**Tests.** KC9, KC10.

## Module 5 — Report UI declutter & PDF reliability

**Requirement.** Remove Print button, duplicate Language buttons,
Client/Pandit/Scholar toggles; keep Save Profile + Download PDF; harmonize
Overview/Folio/Workbench tabs; sync `birthState` with `rawInputRef`; never emit
lowercase `shadbala` in Part A (Gate 3e / PA-06); Executive gauges + 4-Quadrant
archetype cards in the PDF.

**Implementation.** Delivered in Components 1–3 (`src/lib/kundli/downloadPolicy.ts`,
`src/lib/kundli/executiveInsights.ts`, `/report` page cleanup, Gate 3e inside
`generateKundliV41Pdf` audit). Unchanged this cycle; re-verified by
`tests/kundli-download-reliability.spec.ts` (12/12).

## Module 6 — Darshan

**Requirement.** Wire playDiya/playFlowerDrop/playBell/playConch; HD video is
the default background; remove the image-fallback toggle from the UI but **keep
the image as a silent network-error catch**; remove mute clutter.

**Implementation.** Offerings audio wiring + toggle/mute removal: Component 5
(`tests/darshan-offerings.spec.ts`). **New refinement:** `src/app/darshan/page.tsx`
gains a `mediaFailed` state fed by `<video onError>` and `offline`/`online`
window listeners (YouTube iframe failures are undetectable cross-origin, so the
offline event is the proxy). When — and only when — `mediaFailed` is true, the
shrine's HD photograph renders in place of the stream. No toggle, no error
chrome; recovery is equally silent. A stray non-JSX `/* … */` text node that
would have rendered visibly was fixed into a proper JSX comment.

**Tests.** KC10 (source contract), `tests/darshan-offerings.spec.ts`.

---

## Acceptance checklist

- [x] `npx tsc --noEmit` — 0 errors (after `npm install --ignore-scripts` + `node scripts/stub-prisma-client.mjs`; the prisma engine download is network-blocked in this sandbox — the committed stub script makes `tsc` reproducible after every restore)
- [x] `tests/kashi-conversation-core.spec.ts` — 41/41 passed
- [x] `tests/kashi-sahayak-flows.spec.ts` + `tests/darshan-offerings.spec.ts` + `tests/kundli-download-reliability.spec.ts` — 69 passed, 4 browser-skipped (Chromium unavailable in this sandbox; guarded by `tests/support/browserAvailable.ts`), Gate 3e intact
- [x] `tests/kundli-v40/download-route.spec.ts` + `pdf-artifact.spec.ts` — 25/25 (incl. main's `f0ddab7` city-coordinate auto-resolve)
- [x] Live smoke after history reconciliation: `/`, `/darshan`, `/report` all 200
- [x] Pre-existing suites untouched (`kashi-sahayak-corpus` failures are pre-existing, stash-verified)
- [x] Committed & pushed to `arena/01a06413-cosmictantra-v2` after every component

### History note (important for reviewers)

`origin/main` was **re-rooted** by the local agent into a fresh two-commit
history (`0d65c24` snapshot of all V3 work + `f0ddab7` fixes) with no common
ancestor to the old line. The session branch reconciled this with
`git merge --allow-unrelated-histories -X theirs origin/main` (`366eb25`):
the merged tree is **identical to `origin/main`** — nothing from either side
was lost, and the session branch is now exactly the merge-ready state of main
plus the Module-2/4 gap closures described above.

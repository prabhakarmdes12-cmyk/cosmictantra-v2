# Kashi Sahayak — verification evidence

**Date:** 2026-09-01 · **Branch:** `arena/01a0593a-cosmictantra-v2` · **Build under test:** `1698ab6` + this increment

## 1. What is implemented

| Area | File | Status |
| --- | --- | --- |
| Emotional paths, verified verse selection, crisis safety | `src/lib/kashi/emotionalSupport.ts` | Engine, unit-tested |
| Modes, consent, voice states, clarification, session | `src/lib/kashi/interaction.ts` | Engine, unit-tested |
| Proactive offer policy, gentle questions | `src/lib/kashi/offerPolicy.ts` | Engine, unit-tested |
| React binding (speech recognition, persistence, revision) | `src/hooks/useKashiSahayak.ts` | Implemented |
| Composer (mic / send / mute / stop) | `src/components/kashi/KashiComposer.tsx` | Implemented |
| Verified passage card | `src/components/kashi/KashiVerseCard.tsx` | Implemented |
| Clarification + quick actions | `src/components/kashi/KashiClarification.tsx` | Implemented |
| Wired into the Kashi Sahayak avatar chat | `src/components/consultation/FloatingAIGuruAvatar.tsx` | Implemented, browser-tested |
| Wired into the /ask chatbot modal | `src/components/consultation/AIGuruChatbotModal.tsx` | Implemented, not browser-tested |

## 2. Automated browser results (Chromium 132, headless, sandbox)

`tests/kashi-sahayak-browser.spec.ts` — **5 passed**, run **three consecutive times** on a clean
build with a freshly restarted server:

| Test | Result |
| --- | --- |
| Sadness chip → verified verse from the canonical store (text asserted verbatim) | PASS ×3 |
| “बस मुझसे बात करो” → no verse card | PASS ×3 |
| Crisis text → safety guidance (14416) and no verse | PASS ×3 |
| Microphone control settles into a definite state; unavailable → no “hearing” claim | PASS ×3 |
| Mute toggles and bumps the companion revision | PASS ×3 |

Waiting discipline: every post-action wait is `waitForRevision(page, before)` — it polls the
companion's `data-revision` attribute until it exceeds the pre-action value. **No sleeps gate a
test outcome**, so a green run cannot be produced by reading state that was already true before
the action. (One 50 ms poll interval inside the helper is a loop cadence, not a correctness gate.)

Combined suite (Kashi unit 64 + browser 5 + kundli-pipeline 115 + golden-kundli + incident + three
granth suites): **299 passed / 0 failed**.

Screenshots of the four interaction states: `artifacts/kashi/*.png` (gitignored, not committed).
I generated them but **cannot see images myself** — they require the owner's visual confirmation.

## 3. Manual device matrix — NOT YET EXECUTED (no device in this environment)

| # | Check | Chrome Android | Safari iPhone | Status |
| --- | --- | --- | --- | --- |
| 1 | Hindi female voice selected and used | ☐ | ☐ | untested |
| 2 | Recitation audible, correct pronunciation of the verse | ☐ | ☐ | untested |
| 3 | Original verse pronounced separately from the meaning | ☐ | ☐ | untested |
| 4 | Mute / unmute during recitation | ☐ | ☐ | untested |
| 5 | Speed control (0.5×–2×) | ☐ | ☐ | untested |
| 6 | Pause → explain → resume | ☐ | ☐ | untested |
| 7 | Advance to the next passage | ☐ | ☐ | untested |
| 8 | Screen lock during recitation, then unlock | ☐ | ☐ | untested |
| 9 | Incoming call during recitation | ☐ | ☐ | untested |
| 10 | Refresh restores the non-sensitive reading state | ☐ | ☐ | untested |
| 11 | Autoplay rejection shows “श्लोक सुनें” | ☐ | ☐ | untested |
| 12 | Behaviour when no Hindi voice is installed | ☐ | ☐ | untested |
| 13 | Microphone permission prompt and denial | ☐ | ☐ | untested |
| 14 | Hinglish recognition accuracy | ☐ | ☐ | untested |

These rows are deliberately blank. A mocked Web Speech test is **not** evidence for any of them.

## 4. Unsupported browsers and fallbacks

| Environment | Behaviour |
| --- | --- |
| No `SpeechRecognition` (older Safari, Firefox, in-app webviews) | Mic button renders disabled with “इस ब्राउज़र में बोलकर बताने की सुविधा उपलब्ध नहीं है — कृपया लिखकर बताएँ”; typing always remains available; the UI never claims to hear the user |
| Permission denied | “माइक की अनुमति नहीं मिली — आप लिखकर बता सकती हैं…” |
| No microphone / audio capture failure | “इस डिवाइस पर माइक उपलब्ध नहीं है…” |
| Recognition service unreachable | “पहचान सेवा से संपर्क नहीं हो पाया — कृपया फिर से बोलें या लिखकर बताएँ” |
| Low confidence / no speech | Transcript is placed in the input for editing; send stays blocked until the user confirms |
| No Hindi TTS voice installed | Speech falls back to whatever voice the browser offers; the app does **not** claim a female Hindi voice was used (this branch adds no TTS voice-selection logic — the existing `useKashiVoice` is untouched) |

## 5. Honest list of untested voice behaviour

1. Any audible output — the sandbox has no audio device and no Hindi voice.
2. Female-voice selection and consistency of feminine self-reference **when spoken** (the text is
   feminine; the voice is not verified).
3. Real speech-recognition accuracy for Hindi, English and Hinglish (headless Chromium has no
   speech service; the mic test only proves the state machine and fallbacks).
4. Interruption handling (screen lock, incoming call) — needs a physical device.
5. Pause/resume/explain timing with a live utterance queue.
6. Whether the approved female voice is available on the owner's target devices.

## 6. Accessibility — self-assessed, with gaps

| Control | Attribute | Status |
| --- | --- | --- |
| Microphone | `aria-label`, `aria-pressed`, `data-voice-state`, `disabled` when unavailable, `title` explaining why | implemented |
| Mute / unmute | `aria-label` switches with state, `aria-pressed` | implemented |
| Stop speaking | `aria-label`, rendered only while speaking | implemented |
| Send | `aria-label`, `disabled` until there is safe text | implemented |
| Text input | `aria-label`, keyboard `Enter` to send | implemented |
| Listening indicator | `role="status"` message region, visible text (not colour alone) | implemented |
| Quick actions / clarification | real `<button>` elements with text labels | implemented |

**Gap:** no screen-reader run (VoiceOver/TalkBack), no contrast audit, and no keyboard-only
traversal test has been performed.

## 7. Remaining gaps in the build

- Recitation is not yet wired to the existing Granth reading engine (`src/lib/granth/session.ts`);
  the composer and controls are wired, but pressing “श्लोक सुनें” does not yet start a real
  utterance of the displayed passage.
- Proactive-offer timing depends on session state that is not yet surfaced for “scripture area
  opened”; only the first-interaction and capability-question triggers are exercised in the UI.
- Long-reading consent text is produced by the engine but no UI flow asks it yet.
- Stotras and aartis are not yet mapped to emotions (Gita only).
- No screen recordings were produced.

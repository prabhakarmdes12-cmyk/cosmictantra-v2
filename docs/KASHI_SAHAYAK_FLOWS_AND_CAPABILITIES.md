# Kashi Sahayak — Flows & Capabilities

Companion to [`KASHI_V3_AND_KUNDLI_REVAMP_IMPLEMENTATION_PLAN.md`](./KASHI_V3_AND_KUNDLI_REVAMP_IMPLEMENTATION_PLAN.md).
This file specifies observable behaviour: what the seeker can say, and what
Kashi Sahayak must do. Everything here is deterministic — reproducible from the
utterance and the clock alone, with the LLM gateway only as a last-resort
enrichment layer that never gates a core capability.

Core module: `src/lib/kashi/conversationCore.ts` · Wired in:
`src/components/consultation/FloatingAIGuruAvatar.tsx` · Contract tests:
`tests/kashi-conversation-core.spec.ts`.

---

## 1. The pipeline

```
Utterance
  → LanguageNormalizer      normalizeUtterance()
  → WeightedIntentMatcher   matchIntent()            (threshold 0.6, weighted cues)
  → EntityExtractor         extractEntities() → applyEntities()
  → ConversationState       activeSubject / activeDate / activeLocation / activeDomain
    & FlowStack             activeIntent / activeFact / pendingFlow / stack / detailLevel
  → MissingSlotResolver     nextMissingSlot()
  → Deterministic Router    routeFollowUp() · resolveDeterministicKashiIntent() · lifeConcernReply()
  → TemplateEngine          authored Hindi reply records (FACT_FAMILY_EXPLANATIONS, LIFE_CONCERN_ACK …)
  → NextBestActions         nextBestActions() → quickChips on the message
  → Voice                   speakText on every reply; lang=hi ⇒ Hindi voice
```

Ordering guarantee: the V3 core runs **before** the guided-intake slot machine,
so an utterance like `आज राहुकाल?` is never swallowed as a birth-time answer.

## 2. Conversation state

| Field | Values | Set by |
|---|---|---|
| `activeSubject` | SELF · PARTNER · CHILD · PARENT · SIBLING | `पति/पत्नी`, `बेटा/बेटी/बच्चा` (stem-matched, inflections included), `माता/पिता`, `भाई/बहन` |
| `activeDate` + label | ISO date + `आज/कल/परसों/उसी दिन` | date words; `उस दिन` **rebinds** to the already-active date instead of shifting |
| `activeLocation` | वाराणसी · पटना · दिल्ली · मुंबई · बेंगलुरु · कोलकाता · लखनऊ · प्रयागराज | city cues (incl. `banaras`, `इलाहाबाद`) |
| `activeDomain` | CAREER · MARRIAGE · HEALTH · REMEDY · PROPERTY | the intake's `SET_DOMAIN_*` chip, and free-text cues (`विवाह कब होगा` ⇒ MARRIAGE) |
| `activeIntent` / `activeFact` | last delivered factual answer + mined `…तक` validity window | `recordFact()` on every gateway `GET_*` reply |
| `pendingFlow` + `stack` | suspended FlowFrames, LIFO | `suspendFlow()` on interruption |
| `detailLevel` | SHORT · NORMAL · PANDIT | `संक्षेप में` / `विस्तार से` |

## 3. Interruption contract (the promise)

Mid-intake example — Kashi has just asked जन्म समय and the seeker types
`आज राहुकाल क्या है?`:

1. The question is answered **fully** (deterministic panchang engine).
2. The intake is suspended: `pendingFlow = {kind:'INTAKE', step:'ASK_BIRTH_TIME', slots:{name, birthDate,…}}`.
3. A nudge follows: `🙏 आपके प्रश्न से पहले "कुंडली इन्टेक" जन्म समय पर रुका था — वहीं से, बिना कुछ खोए, जारी करते हैं।` with chip `↩️ वापस — कुंडली इन्टेक जारी रखें`.
4. `वापस` (or the chip) restores slots and step and re-asks जन्म समय exactly.

Nested interruptions stack (GRANTH_RECITAL under INTAKE) and unwind LIFO.
Interrupting intents: all follow-ups, RESUME, and all three life concerns.
A factual question detected by `resolveDeterministicKashiIntent` also interrupts.

## 4. Follow-ups (all seven, from the plan)

| Utterance | Intent | Behaviour |
|---|---|---|
| `क्यों?` | FOLLOWUP_WHY | Authored reason for the **active fact's** family (राहुकाल ⇒ why the window falls where it does); no fact ⇒ asks for a question first, never bluffs |
| `मतलब?` | FOLLOWUP_MEANING | Family meaning + restates the original value |
| `कब तक?` | FOLLOWUP_UNTIL | Uses the mined `…तक` window from the fact; falls back to "valid for this panchang-day" |
| `उस दिन?` / `कल वाला?` | FOLLOWUP_THAT_DAY | With bound date ⇒ re-runs the panchang engine on that date; without ⇒ asks which day |
| `उसकी राशि?` | FOLLOWUP_SUBJECT_RASHI | Never invents a sign; points to the computed kundli summary, declines without birth data |
| `वापस` | RESUME_FLOW | Restores the suspended flow (§3); nothing pending ⇒ gentle "कोई रुका हुआ कार्य नहीं" + menu |
| `संक्षेप में` / `विस्तार से` | DETAIL_SHORT / DETAIL_PANDIT | Switches `detailLevel`, confirms in one line |

Matching is weighted: `कल वाला पंचांग फिर से बताओगे?` still routes to
THAT_DAY. Devanagari-safe boundaries mean `क्योंकि…` does **not** trigger WHY.
Factual panchang questions (`आज की तिथि`) deliberately match **nothing** in the
core — they fall through to the canonical engine.

## 5. Life concerns — empathy first

Triggers: job loss/anxiety (`नौकरी छूट गई`), heartbreak (`ब्रेक अप`, `दिल टूट`),
stress (`तनाव`, `नींद नहीं आती`, `अकेला`).

Behaviour: acknowledgement copy that is human before it is astrological — it
contains **zero** jyotish vocabulary — then, only *when the seeker is ready*,
the six pathways (fixed order):

| Chip | Action | Destination |
|---|---|---|
| 💬 बात करना | LIFE_PATH_TALK | mood chips, open listening |
| 🕰️ वर्तमान समय समझना | LIFE_PATH_TIME | today's panchang |
| 🕉️ शान्ति अभ्यास | LIFE_PATH_SHANTI | authored 3-step practice (4-7-8 breath · ॐ · fixed corner) + ॐ playback + जप |
| 📿 जप | LIFE_PATH_JAPA | `/remedy-tracker` |
| 🪔 दर्शन | LIFE_PATH_DARSHAN | live Kashi darshan |
| 📞 पंडित से बात | OPEN_CONCIERGE | VIP concierge modal |

## 6. Kundli intake → Pulse → two doors

Intake order (MissingSlotResolver): **name → birthDate → birthTime →
birthCity → question**. On completion:

1. Deterministic ephemeris (`calculateKundali`, Lahiri) ⇒ Lagna, चन्द्र
   Nakshatra, Vimshottari Dasha; birth answers pass through
   `normalizeBirthDateInput` / `normalizeBirthTimeInput` first — the canonical
   kernel never receives an un-normalized date.
2. **Executive Life Gauges**: `getCanonicalJyotishSnapshot` +
   `computeExecutiveLifeDimensions` (dynamically imported, same kernel as
   `/report`) ⇒ a six-bar षड्-आयामी जीवन मापक strip; a kernel failure costs
   only the strip, never the card.
3. **Astrological Pulse Card — recited and displayed**: POWER_DAY /
   CAUTION_DAY transit message + recommendation naming the seeker's question;
   `speakText` reads out lagna, nakshatra, dasha, the day's verdict and the
   strongest gauge dimension.
4. Two doors: **📄 सम्पूर्ण कुण्डली PDF** (`/report`, decluttered per Module 5)
   and **📞 पंडित जी से सीधी बात** (VIP Concierge).
5. A **ScholarHandoverPacket** (`src/lib/kashi/scholarHandover.ts`) is generated
   at the same moment — see §7.

## 7. VIP Concierge & ScholarHandoverPacket

Modal contents: 📞 call **+91 99729 34937** · 💬 WhatsApp with pre-filled text ·
five-step ₹501 roadmap (payment link only on the official WhatsApp thread;
pandit group-call patch; PDF + Drive recording delivered on WhatsApp) · fraud
notice.

The packet is the new piece: a quotable id (`SH-YYYYMMDD-XXXX`) and six Hindi
sections — साधक परिचय, खगोलीय सारांश (इंजन-संगणित), आज का गोचर संदर्भ, साधक
का प्रश्न (verbatim), सहायक की सिफारिश, स्रोत व प्रमाणन. Deterministic: same
inputs + same clock ⇒ identical packet. Missing intake fields are declared
`इन्टेक अधूरा — कृपया साधक से पूछें`; nothing is invented for the scholar. The
modal shows it with a 📋 copy button, and when it exists the wa.me prefill
carries the **whole packet**, so one tap transfers full context to the pandit.

## 8. Granth recitation

Eight scriptures (`src/lib/kashi/granthRecitals.ts`): Bhagavad Gita (१८ अध्याय),
Ramcharitmanas (७ काण्ड), Shiva Mahapuran, Devi Bhagavata, Hanuman Chalisa,
Shiva Tandava, Maha Mrityunjaya (Ṛgveda 7.59.12, embedded sourced), Shri
Suktam + Kanakadhara Stotram (embedded sourced from vignanam.org /
greenmesg.org). Recital cards offer mūla text with meaning; **continuous
narration** auto-advances across passages (`readingAutoAdvanceRef` +
`shouldAutoAdvance`), and an active recital is a FlowFrame — interruptible and
resumable like the intake.

## 9. Darshan

HD video stream is the only visible mode — no image toggle, no mute clutter.
Offerings are wired to audio: दीया, पुष्प वर्षा, घण्टा, शंख. If the local stream
errors (`<video onError>`) or the browser goes offline (YouTube iframe failures
are undetectable cross-origin, so `offline` events are the proxy), the shrine's
HD photograph **silently** takes over; recovery on `online` is equally silent.

## 10. Voice

Every reply carries `speakText`; `lang` is decided after synonym folding so
Hinglish (`aaj ka rahu kaal`) speaks in a Hindi voice. ॐ chant, bell, conch and
recital narration use the existing chitiAudio paths.

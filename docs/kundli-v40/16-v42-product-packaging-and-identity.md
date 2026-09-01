# 16 — V42: Product Packaging, Funnel and Identity

Status: **proposal for discussion**, not an implementation plan yet.
Written after inspecting kundali.io and auditing what this repo actually has.

---

## 1. Are we at a competitive level? An honest answer.

Two different questions hide inside that one, and they have opposite answers.

### 1a. The artifact — YES, we passed the bar.

The thing you asked for two turns ago ("30-year-old software produced perfect
Hindi Kundli, get to that level") is **done for the calculated layer**. The
`hi` Kundli now renders:

| | state |
|---|---|
| Chart | Devanagari numerals १–१२, Devanagari graha abbreviations, retrograde rules |
| Placement table | भाव / राशि / ग्रह fully in Devanagari |
| Graha dossier | ग्रह · राशि · अंश · भाव · नक्षत्र · चरण · गति · अवस्था, DMS |
| Panchanga | tithi, karana, all 27 nitya yogas, vara, ritu, ayana, masa |
| Dasha, yoga, dosha | Hindi names and status words |
| Beside-chart line | `लग्न: सिंह 12°06′ · लग्नेश: सूर्य → दशम भाव` |
| Script integrity | zero tofu, zero mixed-script corruption, in all three locales |

And we carry things no 1990s software and no current competitor has: an
evidence path for every claim, `NOT_CALCULATED` instead of invented data, D10
under quarantine until externally validated, and a 9-gate release pipeline
that refuses to emit a broken document. **On artifact quality we are ahead of
kundali.io, not behind it.**

### 1b. The Hindi *document* — NO, not yet. One number tells the story.

A Hindi CLIENT report still contains **1004 English words across 69
sentences**. PANDIT contains 1388 across 101. Every table is Hindi; every
*explanatory sentence* is still English.

So a first-time user in Patna opens a beautiful Devanagari Kundli and reads:

> "Every value on this page is an input or a declared setting. Nothing here is
> interpreted."

That is the whole remaining gap, and it is not a translation-tooling problem —
those sentences have to be **written** in Hindi by someone who can write
Jyotish Hindi, because a machine-translated explanation of a Jyotish concept
reads like a machine. This is the single blocker to claiming "competitive in
Hindi", and it is a content task, not an engineering task.

### 1c. Against kundali.io specifically

They are **not better than us at Hindi** — they are English-first with GPT-4o
on top. Their advantage is entirely **product**, and it is real:

| | kundali.io | us today |
|---|---|---|
| Time to first chart | ~30s, no signup | birth form exists, no funnel |
| Free tier | preview, then paywall | everything, no paywall |
| Price | ₹499 one-time, Razorpay | no packaging at all |
| Identity | none (deliberately) | schema exists, **zero code** |
| Post-chart engagement | dasha timeline, "AI chart chat" | report page only |
| Interpretation | GPT-4o, confident, "eerily accurate" | deliberately refuses |

**Verdict: we have a better engine and no product. They have a thinner engine
and a finished product.** That is the actual competitive position.

---

## 2. The tension you have to resolve before any packaging works

kundali.io sells **AI-generated prediction**: "Personality Blueprint",
"12-Month Forecast", "Current Transit Impact", "Personalized Action
Guidance". Their testimonial is *"the career section was eerily accurate."*

Your standing product constraints forbid exactly that:

- no speculative predictions
- no LLM replacing deterministic astrology
- `NOT_CALCULATED` is preferable to guessed data
- never auto-recommend a remedy
- maximise trustworthy conclusions, not prediction count

**We therefore cannot win by matching their feature list, and we should not
try.** If we bolt a GPT interpretation layer onto this engine to compete, we
throw away the only thing that makes the engine worth having, and we become a
worse-funded clone of a product that already exists.

The winning move is to make the refusal itself the product:

> **kundali.io sells you a machine's opinion. We sell you a verifiable
> document and a human being who will read it with you.**

That is not a consolation prize. For marriage, career and muhurat decisions —
the high-intent, high-value queries — an Indian buyer does not actually want a
chatbot's opinion. They want a Pandit. Nobody has built the *credible
document → real Pandit* pipeline properly. That is the gap.

---

## 3. The pricing axiom I'd recommend

You proposed: free basic · ₹250 full download · ₹501 download + call.
The instinct is right. Let me sharpen the *line* between tiers, because
"basic vs full" is the weakest possible cut and it is exactly the cut
kundali.io already makes.

Cut on **epistemic class**, not page count — we already have this separation
enforced in the codebase as `CALCULATED_FACT` / `TRADITIONAL_INTERPRETATION` /
`PRACTICAL_REFLECTION`:

> ### Facts are free. Judgement costs money.

| Tier | Contains | Why the line is there |
|---|---|---|
| **Free** | The whole *calculated* Kundli: chart, panchanga, all placements with DMS, dashas, yoga/dosha **status**. Downloadable. | Deterministic arithmetic. Charging for it is charging for a calendar. Giving it away is a trust weapon: *we are so sure of our numbers we let you check them for free.* |
| **₹250** | Adds the interpretive layer: what the tradition says, domain synthesis (career first), current-period reading, discussion prompts, Scholar Appendix with full lineage. | This is authored judgement and sourced tradition — real work. |
| **₹501** | Adds a Pandit call, and the report is prepared *for that call*. | Only a human may issue a judgement about a life. |

Three things this buys us that a page-count cut does not:

1. **The free tier is more generous than kundali.io's and still converts
   better**, because what we withhold is the thing people actually want
   (meaning), not the thing they can get anywhere (a chart image).
2. It is **honest and explainable in one line** — no "basic/advanced/pro"
   confusion, and it matches what the document already says about itself.
3. It is **defensible**. A competitor can copy a price. They cannot copy
   "every number is auditable and we'll show you the source" without building
   the evidence layer, which took us two sprints.

### The margin problem in your ladder — flagging it

₹250 → ₹501 is **₹251 marginal for a human call.** A 20–30 minute Pandit
consultation cannot be delivered for ₹251 once you pay the practitioner. You
have three honest options:

- **(a)** ₹501 buys a **short, scoped call** (10–12 min, one question,
  prepared from the report). Sustainable, and the scoping is a feature — the
  report tells the Pandit what to look at, so 12 focused minutes beat 30
  unfocused ones.
- **(b)** ₹501 is a **deliberate loss-leader** into a higher-priced full
  consultation. Fine, if you track the conversion.
- **(c)** Raise the call tier (₹751–₹999) and keep ₹501 for a **written**
  Pandit note instead of a live call — cheaper to deliver, async, scales.

I lean **(a)**, because the scoped call is genuinely differentiated: our
report already generates chart-specific *discussion questions*, so the Pandit
walks in prepared. Nobody else can do that.

---

## 4. The funnel — where we can beat them, concretely

Their flow: name · DOB · TOB · place · **chart style** → generate → paywall.

Four places to be better:

### 4.1 Never ask a beginner to choose a chart style
They ask "North Indian / South Indian / Western" *before* the user has seen
anything. A first-timer does not know and does not care. **Infer it** — North
Indian for the Hindi belt, South Indian for the south — and put the switch
*on the result*, where it is a delightful toggle instead of a quiz. We already
have city → region data in the birth form.

### 4.2 Replace "chart style" with intent — this is the big one
You liked that they ask what the user wants. Ask something far more valuable:

> **आप क्या जानना चाहते हैं?** — करियर · विवाह · वर्तमान समय · सम्पूर्ण

This single question:
- routes the report (we already have CLIENT / PANDIT / SCHOLAR modes),
- decides which domain synthesis leads (Career is our validated reference
  domain),
- **qualifies the ₹501 call before it is sold** — we know what they want to
  ask, so the Pandit is briefed,
- and costs the user one tap.

Asking "what chart style" extracts nothing. Asking "what do you want to know"
is the whole business.

### 4.3 Turn unknown birth time into a trust moment
kundali.io says "enter approximate, it'll be largely accurate." That is
quietly false — Lagna and all bhavas move. We should say plainly: *without a
birth time we cannot determine your Lagna, so here is what we can determine
(Moon, nakshatra, dashas) and here is what we have withheld.* We already have
`NOT_CALCULATED` semantics and a `timeConfidence` field. **Competitors fumble
this; being straight here is memorable.**

### 4.4 A deterministic explorer, not an "AI chart chat"
They advertise "AI Chart Chat" and an "Energy Dashboard". We should not build
a chatbot. We should build **tap-a-graha → its calculated conditions, its
dignity, its aspects, and the evidence path** — every derivation we already
compute in the v40 layer, exposed interactively. Same engagement, zero
invention, and far more impressive to anyone who actually knows Jyotish.

---

## 5. Identity: "entering details creates a profile"

Good news: **the schema for this already exists and is well designed.** Bad
news: **no code uses any of it.**

Present in `prisma/schema.prisma`, referenced by zero routes:

- `PjosAccount` — `authChannel` (PHONE_OTP / EMAIL / GOOGLE) + `authSubject`,
  with the right comment: *"the credential channel never owns the Person."*
- `PjosPerson` — birth data, `isMinor`
- `PjosPersonRelationship` — SELF / GUARDIAN_MANAGED / WITH_CONSENT / …
- `PjosAccessGrant`, `PjosConsentRecord` — append-only DPDP consent
- separately: `AstrologyCustomerProfile` (keyed on `whatsappPhone`),
  `AstrologyFamilyMember`, `OtpVerification`

Only `src/lib/jyotish/pjosTypes.ts` and `src/lib/pjos/ownershipGuard.ts` exist
in code. Razorpay **is** wired, for consultations.

### 5.1 The design: anonymous-first, claim-on-value

Do **not** ask for a phone number before the chart. kundali.io's "no signup"
is their single strongest conversion feature and they are right.

```
1. User enters birth details.
   → create PjosPerson immediately
   → bind it to a signed anonymous cookie (device-scoped session)
   → NO auth, NO friction. Chart renders.

2. User hits a value moment — download, save, "send to WhatsApp", or pay.
   → NOW ask for phone (or email)
   → create PjosAccount(authChannel, authSubject)
   → link PjosPersonRelationship(account, person, SELF)
   → write PjosConsentRecord(purpose, version) in the same transaction
   → the anonymous session is upgraded, nothing is re-entered
```

The user experiences "it just remembered me", never "please register". And
because the Person is created at step 1, **an abandoned funnel still leaves a
recoverable chart** — if they come back on the same device, it is there.

### 5.2 Two real gaps to decide on

1. **Channel merge.** `PjosAccount` is `@@unique([authChannel, authSubject])`,
   so a phone login and an email login are two accounts for one human. We need
   an explicit merge path (verify second channel → attach to same account) or
   we will fragment users. Worth solving before launch, painful after.
2. **Two competing identity models.** `AstrologyCustomerProfile`
   (whatsappPhone-keyed, with its own consent + OTP fields) overlaps
   `PjosAccount`/`PjosPerson` almost entirely. Shipping both guarantees
   divergence. **Recommendation: PJOS is canonical**, and
   `AstrologyCustomerProfile` becomes a view/adapter for the existing
   consultation flow, or is migrated.

### 5.3 WhatsApp, not email

The legacy model already says WhatsApp is canonical for this audience, and it
is right. "अपनी कुण्डली WhatsApp पर पाएं" is a far better capture prompt than
an email field — it is how the document actually gets shared with family,
which is our organic distribution.

---

## 6. What I'd build, in order

| # | Item | Why first |
|---|---|---|
| 1 | **Finish Hindi prose** (1004 words / 69 sentences, authored not translated) | Everything below is worthless to a Hindi user until this is done. Content task. |
| 2 | **§3 completeness gate** | Locks in #1 so it cannot regress. |
| 3 | **Anonymous-first Person + claim-on-value** (§5.1) | Unblocks every commercial feature; no paywall needed yet. |
| 4 | **Intent question + inferred chart style** (§4.1–4.2) | Cheap, and it is the qualification signal the ₹501 tier needs. |
| 5 | **Tier the existing report** — free = CALCULATED_FACT only | We already tag content types; this is a filter, not new content. |
| 6 | **Razorpay on the report** (reuse the consultation rail) | ₹250 tier live. |
| 7 | **₹501 = report + scoped call**, Pandit briefed by our discussion prompts | The actual differentiator. |
| 8 | Deterministic graha explorer (§4.4) | Engagement, zero invention. |

Items 1–2 are the current sprint. 3–4 are small. 5–7 are the business.

---

## 7. The one-line positioning

> **Every other Kundli site gives you a machine's opinion.
> CosmicTantra gives you a document you can check — and a Pandit who will
> read it with you.**

Free to verify. ₹250 to understand. ₹501 to be advised.

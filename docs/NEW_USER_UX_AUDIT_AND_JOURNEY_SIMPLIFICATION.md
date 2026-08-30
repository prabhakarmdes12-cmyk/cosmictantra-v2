# 🧭 CosmicTantra — New-User UX Audit & Journey Simplification Plan

> **Scope:** First-session usability for a brand-new visitor (Tier-2/3 India, mobile web, WhatsApp-native).
> **Method:** Live walkthrough of the running dev build (DOM-level), full code review of entry surfaces (`/`, `/ask`, `/onboarding`, `/dashboard`, `ConsultationModal`, `KundaliExperience`, `GlobalHeader`, `FullMegaMenuModal`, `PersonalisationBridge`, `FloatingAIGuruAvatar`, `HelpDeskCtaBanner`), plus external benchmark research on AstroTalk, AstroSage, InstaAstro and mobile-onboarding best practice.
> **Companion docs:** `IMPROVEMENT_AUDIT.md` (engineering defects), `HOW_TO_WIN_INDIA_PRODUCT_UX_STRATEGY.md` (strategy), `FIRST_USER_TRUST_PROTOCOL.md`.
> **🟢 Status update (Aug 2026):** the entire **P0 list below has shipped** — see the checklist in §5. The friction log (§2) is retained as the historical "before" record.

---

## 0. TL;DR — The 7 things that decide whether a new user succeeds

1. **🔴 A brand-new visitor is shown a fake "personal" strip.** `PersonalisationBridge` renders *"TODAY: Moon in Rohini (11th House) • High Financial Liquidity & Deal Momentum"* even when **no chart exists** — it falls back to hardcoded `Rohini`/`Vrishabha`. A first-time user believes this is *their* chart reading. For a product whose pitch is "calculation is not interpretation", fabricated personalisation is the single most dangerous trust defect.
2. **🔴 The free Kundali form is pre-filled with a demo person** ("Priya Sharma, 15-06-1995, 10:30, Patna") and the result **evaporates on refresh** — it never writes to the `profileStore` that every other page already uses. Users generate a stranger's chart by accident, then lose their own.
3. **🔴 `ConsultationModal` defaults the birth date to `'5015-05-15'`** (line 35) — a typo of 2015 that silently computes a chart from the year 5015 — and falls back to phone `+919876543210`.
4. **🟠 There is no first-run path at all.** `/onboarding` exists but is **orphaned** (zero links to it), is a mock (fake OTP, no birth details collected), and dead-ends on `/dashboard`, which greets a new user with an empty "Create Profile →" stub.
5. **🟠 6+ competing CTAs greet a first-time mobile user** (Free Help Desk, Consult, Menu, 3 hero CTAs, floating WhatsApp pill, floating AI-Guru avatar that auto-pops a **Hindi-only** tooltip after 2.5 s even in English mode) — and the two floating widgets **stack on the same corner** (`bottom-6 right-*`).
6. **🟠 Language default is split-brained:** home page opens in English, inner pages (`/ask`, `/dashboard`, …) open in Hindi (`CosmicTantraShell` defaults `'hi'`, `page.tsx` defaults `'en'`), and tier cards mix Hindi labels with English descriptions in one card.
7. **🟠 The paid funnel front-loads everything:** `/ask` shows 4 price tiers (₹501–₹2,100), 7 form fields, and 3 escape hatches (AI Guru free chat, WhatsApp help desk, pay now) on one screen, with no "I don't know my birth time" option anywhere on the platform.

**The fix in one sentence:** make *“generate my Kundli in 30 seconds → see 3 plain-language highlights → save it (auto Cosmic ID) → share on WhatsApp → ask a scholar when ready”* the single dominant first-session path, and move everything else behind progressive disclosure.

---

## 1. What exists today (inventory)

### 1.1 Surfaces (74 compiled routes; ~30 consumer-facing)

| Cluster | Routes | State |
|---|---|---|
| Home / Observatory | `/` (19 stacked sections, ~209 KB HTML), `/observatory`, `/daily`, `/panchang/[city]`, `/rashifal/[sign]`, `/sandhya`, `/calendar`, `/my-calendar`, `/festivals/[slug]`, `/regional` | Live, dense, expert-voiced |
| Free tools | Kundali form on `/` (`KundaliExperience`), `/kundali-milan`, `/numerology/{name,business-name,mobile-number,baby-names}`, `/family`, `/family-panchang`, `/morning-digest`, `/remedy-tracker` | Live; localStorage `profileStore` (family profiles + Cosmic ID `CT-XXXX`) powers most of them |
| Paid guidance | `/ask` (4 tiers: ₹501 written / ₹1,100 voice / ₹1,500 video / ₹2,100 parivaar), `ConsultationModal` (global), `/ask/success/[orderId]`, `/consultation/room/[id]` | Razorpay wired; mock fallback path still present |
| Trust / content | `/library`, `/library/[slug]`, `/aarti-stotra`, `/darshan`, `/store`, `/upaya` | Live |
| Help | WhatsApp Help Desk (real number +91 9972934937) — header pill, banner, floating pill, `/ask` block | Live |
| Account | `/profile` (OTP + Cosmic ID), `/dashboard` ("Scholar's Desk"), `/onboarding` (orphaned mock) | Fragmented |
| Internal | `/pandit/*`, `/astrology/*`, `/admin/*`, `/dev/*`, `/payments/test` | (security covered in `IMPROVEMENT_AUDIT.md`) |

### 1.2 The journey a new user actually experiences today

```
LANDING (mobile, English by default, city = Dhanbad by default)
 │
 ├─ Top bar: [भाषा] [🌙] [Dhanbad] … logo … [Free Help Desk][Consult][Menu]
 ├─ 72h strip (fake-personalised — see §2.1)
 ├─ Hero: video + 3 CTAs (Panchang / Kundali / Ask a Jyotishi)
 ├─ WhatsApp banner → Panchang → 8 Intent tiles → Muhurat → Festivals →
 │  Kundali form (prefilled demo person) → Dasha → 3D SwargaLok → Methodology →
 │  Practitioners → ₹501 offer → Sample folio → Ask-better-questions →
 │  Knowledge graph → Final CTA → Mega footer
 ├─ Floating: WhatsApp pill (bottom-right) + AI Guru avatar (bottom-right, auto-greets in Hindi @2.5s)
 │
 ├─ IF user finds Kundali form → instant chart (client-side) → NO save/share/download → gone on refresh
 ├─ IF user taps Consult/Ask → /ask page (Hindi by default) → 4 tiers + 7 fields + 3 CTAs at once
 ├─ IF user finds /onboarding → impossible: nothing links to it
 └─ IF user reaches /dashboard → "Create Profile →" empty stub
```

**Time-to-first-value:** excellent *if* the visitor already knows what a Kundali form is and scrolls ~6 sections down to find it. There is no guided alternative.

### 1.3 What's genuinely good (keep & build on)

- **Free Kundali is truly instant** (client-side engine, no signup wall) — same value-first pattern as AstroSage.
- **Intent Router ("What are you looking for?")** — the right instinct; it just scrolls instead of acting.
- **`profileStore`** is a well-designed localStorage family-vault with Cosmic ID, already wired into 10+ pages — the persistence layer exists; the home funnel just doesn't use it.
- **WhatsApp Help Desk** with a real number — differentiated, trust-building, exactly right for Tier-2/3.
- **City/GPS selector, EN/HI translation coverage, 12-language selector modal, day/night theme** — infrastructure is ahead of the competition.
- **Trust theatre** (methodology, sample folio, practitioner credentials, fixed price) answers the #1 objection in this category (predatory per-minute apps).

---

## 2. New-user friction log (evidence-based)

| # | Finding | Evidence | Severity |
|---|---|---|---|
| 2.1 | Fake-personalised "72h Glimpse" strip shown with **no chart** | `PersonalisationBridge.jsx:16-17` fallback `'Rohini'` / `'Vrishabha'` renders "TODAY: Moon in Rohini (11th House) • High Financial Liquidity…" | 🔴 Trust |
| 2.2 | Kundali form prefilled with demo person; result lost on refresh; never saved | `KundaliExperience.jsx:46-56` (`name:'Priya Sharma'…`, `handleDemoFill`), `page.tsx` keeps `kundaliData` in React state only; no `profileStore` import | 🔴 Activation |
| 2.3 | Consultation modal default birth date **year 5015**, placeholder phone | `ConsultationModal.jsx:35` (`'5015-05-15'`), `:74` (falls back to `'+919876543210'` on submit) | 🔴 Data quality |
| 2.4 | `/onboarding` orphaned + mock: collects name/phone, **not birth details**, fake OTP, ends at empty `/dashboard` | `app/onboarding/page.tsx` (no inbound links anywhere in `src/`); `dashboard` empty state is one line + "Create Profile →" | 🔴 Journey |
| 2.5 | Two floating widgets stacked on the same corner | `FloatingAIGuruAvatar.tsx:1132` `fixed bottom-6 right-4 z-50` vs `HelpDeskCtaBanner.tsx:53` `fixed bottom-6 right-6 z-40` | 🟠 Mobile |
| 2.6 | AI Guru auto-opens Hindi-only greeting after 2.5 s regardless of UI language | `FloatingAIGuruAvatar.tsx:250-265` (salutations all Hindi; no `lang` check) | 🟠 Cognitive load |
| 2.7 | Split-brain default language: home = EN, shell pages = HI; mixed-script cards on `/ask` | `page.tsx:31` (`'en'`) vs `CosmicTantraShell.tsx:40` (`'hi'`); `/ask` tier labels Hindi, descriptions English | 🟠 Consistency |
| 2.8 | Default city **Dhanbad** with no first-visit location prompt on home | `GlobalHeader` city pill only opens on click; no `navigator.geolocation` nudge, no city ask-on-first-visit | 🟠 Relevance |
| 2.9 | 19-tile mega-menu + 26-link footer + 8 intent tiles → choice overload; **no bottom navigation** on mobile web | `FullMegaMenuModal.tsx` (19 tiles), `GlobalFooter.tsx` (26 hrefs), no `BottomNav` component exists | 🟠 Navigation |
| 2.10 | `/ask` front-loads 4 tiers + 7 fields + 3 competing CTAs; no birth-time-unknown path anywhere | `ask/page.tsx:59-71,86-96`; grep for "don't know/unknown birth" → 0 results in consumer forms | 🟠 Conversion |
| 2.11 | Free Kundali result has **no share / save / PDF** action (the promised WhatsApp viral loop is missing) | `KundaliExperience.jsx` result block: only "Recalculate"-type buttons; no `ShareableCard`/`html2canvas`/WhatsApp link | 🟠 Growth |
| 2.12 | Expert jargon above the fold (Karana: Vanija, Lahiri 24.2296°, Vikram Samvat 2083, "Diurnal Ephemeris") with no plain-language layer | Rendered home DOM | 🟠 Comprehension |
| 2.13 | 9.7 MB autoplay hero video on mobile (poster exists, but `autoPlay` still downloads) | `HeroSection.jsx:26-35` | 🟠 Perf |
| 2.14 | `alert()` used for validation errors on `/ask` (blocking, untranslated-when-EN) | `ask/page.tsx:88-91` | 🟡 Polish |
| 2.15 | No activation analytics: no event for "first kundli generated per new visitor", time-to-value, or first-session checklist | `analytics.ts` has page/intent events only | 🟡 Measurement |

---

## 3. Benchmark research — how the market onboards new users

### 3.1 Competitor patterns (India)

| Platform | New-user pattern | What we should copy / counter |
|---|---|---|
| **AstroTalk** (market leader, ~5 Cr users) | Phone-OTP signup → **first chat free** → instant connect to astrologer; no booking; 4-step astrologer verification as trust proof; per-minute pricing [1](https://miracuves.com/blog/what-is-astrotalk-how-it-works/), [2](https://astrotalk.com/chat-with-astrologer), [3](https://leaveit2ai.com/ai-tools/astrology/astrotalk) | Copy the **free first taste** (our free Kundli + 3 free AI-Guru questions) while countering per-minute anxiety with **fixed ₹501** — that contrast must be visible *before* the paywall |
| **AstroSage** (utility leader) | Free Kundli **instantly, no signup**; account only sold as "save charts to cloud, access anywhere" [4](https://www.astrosage.com/kundli/) | Exactly our opportunity: instant free Kundli → *then* offer save-with-Cosmic-ID as the account pitch (value-first, account-later) |
| **InstaAstro** | Free Kundli = name, gender, DOB, time, place; ₹1 first consult; explicitly documents "kundli without birth time" limitation [5](https://instaastro.com/kundli/free-kundli/) | Copy the **birth-time-unknown** escape hatch + section-by-section labelled Kundli "even if reading for the first time" |
| **General onboarding evidence** | Value-first flows reach value **< 60 s**; progressive disclosure beats front-loading; activation is the strongest predictor of retention (D1 benchmark 25–40%); 3–5 screens max; every field should say why it matters [6](https://www.appcues.com/blog/essential-guide-mobile-user-onboarding-ui-ux), [7](https://www.digia.tech/post/mobile-app-onboarding-activation-retention/), [8](https://nextnative.dev/blog/mobile-onboarding-best-practices), [9](https://www.autviz.com/top-horoscope-apps/) | Our first session fails the 60-second test only because the Kundali form is buried and the entry screen is expert-voiced; the engine is already instant |

### 3.2 Category-specific rules distilled

1. **Free taste before commitment** (AstroTalk free chat, AstroSage free Kundli) — we have this, but it's not the *dominant* first screen action.
2. **Account = save-my-work**, never a gate (AstroSage's "Why sign up?" panel).
3. **Birth-time-unknown must be handled** — it's a top-3 abandonment cause in this category; InstaAstro answers it in FAQ, we handle it nowhere.
4. **Explain each field** ("exact time → exact Lagna") — reduces wrong-data charts (AstroSage even warns wrong time = wrong kundli on its form).
5. **Charts labelled for first-timers** (InstaAstro's "each section labelled and explained") vs our raw Karana/Yoga/ayanamsha readout.
6. **Trust visible pre-paywall** (AstroTalk's 4-step verification) — we have better material (methodology, sample folio) but it's below 10 sections of scroll.

---

## 4. The simplified journey (proposed North Star)

### 4.1 Design principles

1. **One primary action per screen.** Everything else is secondary/tertiary.
2. **Value in < 60 s:** first Kundali generated, saved, shareable — before any account/payment ask.
3. **Progressive disclosure:** expert detail stays, but *behind* "show technical detail" affordances.
4. **Account-later:** saving the chart creates the profile/Cosmic ID silently (localStorage → OTP later).
5. **One language decision, remembered everywhere** (single default; propagate through shell + guru).
6. **WhatsApp as the retention rail** (share card now, morning digest opt-in at chart save, help desk always one tap).

### 4.2 First-session flow (target)

```
┌───────────────────────────── 1. WELCOME (mobile) ─────────────────────────────┐
│  🕉  CosmicTantra                [भाषा: English ▾]                            │
│                                                                                │
│  आपका दिन, आपकी कुण्डली।                                                        │
│  Your day. Your chart. Ask when it matters.                                    │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────┐              │
│  │  ⚡ अपनी कुण्डली 30 सेकंड में बनाएं — मुफ़्त                        │  ← PRIMARY  │
│  │     Make my free Kundali                                      │              │
│  └──────────────────────────────────────────────────────────────┘              │
│  Where were you born?  [📍 Use my location]  or  [Type city ⌄]                 │
│                                                                                │
│  Today: Tithi Tritiya • राहुकाल 4:28–6:03 PM        (context, not hero)       │
│  ─────────────────────────────────────────────────────────────────────────     │
│  🏠 Home   📅 Today   ☸ Kundli   💬 Ask   ⋯ More        ← BOTTOM NAV (mobile)  │
└────────────────────────────────────────────────────────────────────────────────┘
        │ 1 tap
┌──────────────────────── 2. BIRTH DETAILS (4 fields) ──────────────────────────┐
│  Name            [ Aarav Kumar              ]  (placeholder, NOT prefilled)   │
│  Date of birth   [ DD/MM/YYYY ]                                              │
│  Time of birth   [ --:-- ]   ⓘ exact time = exact Lagna                      │
│      ☐ मुझे समय नहीं पता / I don't know my birth time  → Prashna-style flow    │
│  Place           [ auto-filled from step 1, editable ]                        │
│  Progress ●●○○  [  Generate my Kundali →  ]                                   │
└────────────────────────────────────────────────────────────────────────────────┘
        │ instant (engine already client-side)
┌──────────────────────── 3. RESULT + HOOKS (the "aha") ────────────────────────┐
│  North-Indian chart      ┌─ Your 3 highlights (plain language) ─────────────┐  │
│  (labelled: "Lagna =     │ • आपका लग्न वृषभ (Taurus) — स्थिर, भरोसेमंद स्वभाव │  │
│   your rising sign")     │ • चन्द्र रोहिणी नक्षत्र — …                       │  │
│                          │ • अभी चल रही दशा: चन्द्र महादशा (2031 तक)          │  │
│  [⬇ Save my Kundli]  [📤 WhatsApp par bhejein]  [Technical detail ▾]          │
│         │                    │            (Lahiri, Karana, Samvat — collapsed) │
│         ▼                    ▼                                               │
│  "Saved! Your Cosmic ID     Share card = viral loop                            │
│   is CT-4821 ✦"                                                             │
│  Next steps checklist: ○ Add family member  ○ Morning WhatsApp digest          │
│  [🧑‍🏫 कुछ समझ नहीं आया? Ask a scholar — ₹501 fixed, no per-minute]  ← ONE CTA  │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Escalation ladder (unchanged positioning, sequenced disclosure):**
free Kundli → free AI-Guru (3 chart-aware questions) → free WhatsApp help desk → **₹501 written folio** (fixed price, 5-stage pipeline visible) → voice/video/parivaar tiers shown *only after* written folio context.

### 4.3 Navigation simplification

| Today | Proposed |
|---|---|
| Header: lang, theme, city, help desk, consult, mega-menu (19 tiles) | Header: logo, lang, theme + **mobile bottom nav: Home · Today · Kundli · Ask · More** |
| 8 intent tiles that scroll | Intent tiles **act** (link to tool pages) instead of scroll; keep 6 max |
| Footer: 26 links | Footer stays (SEO), but grouped as "Tools / Learn / Help" with the 5 task-links promoted into nav |
| `/onboarding` orphaned | Delete it, or repurpose as the 2-step birth-details flow above (replacing the name/phone mock) |

### 4.4 `/ask` page — progressive 3-step form

- **Step 1 — Your question** (one field, 8 example questions as chips: *"शादी कब होगी?"*, *"Job कब लगेगी?"* — AstroTalk's proven pattern [3](https://astrotalk.com/astrology-blog/astrotalk-real-or-fake/)).
- **Step 2 — Birth details** (prefilled silently if profile exists; birth-time-unknown checkbox).
- **Step 3 — Choose help** (default = ₹501 written folio with sample preview; voice/video/parivaar as "Need to talk it through?" secondary). Help-desk + AI-Guru become contextual *within* step 3, not parallel top-level CTAs.

---

## 5. Prioritised roadmap

### P0 — Fix trust & data defects (this week, low effort) — ✅ SHIPPED (Aug 2026)
> **Status:** All 7 items implemented and verified on the dev build (`next build` compiles clean; `tsc --noEmit` clean for `src/`).

1. ✅ **Killed the fake 72h strip** — `PersonalisationBridge` ticker now renders *real computed transits* (today's Tithi/Paksha/Nakshatra + tomorrow's Nakshatra from `calculatePanchang`), plus a personal line **only when a chart actually exists** ("आपकी कुण्डली: लग्न X • चन्द्र Y"). *(§2.1)*
2. ✅ **`ConsultationModal`**: `'5015-05-15'` → empty (fields already `required`); removed `+919876543210` submit fallback (sends the real entered phone). *(§2.3)*
3. ✅ **Kundali form**: name/date/time now **empty with placeholders** (no demo person pre-filled); city defaults to the platform's `DEFAULT_CITY` (Dhanbad, consistent with header); sample button clearly labelled "Try Sample Data (Patna, 1995)" / "नमूना डेटा भरें" (also fixed the "5012"/"१९९२" label typos). *(§2.2)*
4. ✅ **Bonus (P1 #8 core) — charts now persist**: generating a Kundali silently saves it to the Parivaar vault (`upsertProfile` + `setActiveProfile`, deduped per Self+birth details) and shows a **"✓ कुण्डली सुरक्षित — Cosmic ID CT-XXXX"** chip; the home page re-hydrates the saved chart on refresh; returning visitors get the form **pre-filled from their profile**.
5. ✅ **Un-stacked floats**: AI Guru avatar moved to **bottom-left** (chat drawer opens left-anchored); WhatsApp Help Desk pill keeps bottom-right.
6. ✅ **Guru greeting**: bilingual (honours saved `cosmictantra_lang`), **no longer auto-opens after 2.5 s** — appears on hover; the pulse halo draws attention instead. *(§2.6)*
7. ✅ **One default language**: home page now defaults **Hindi** (matches `CosmicTantraShell` inner pages); saved preference still wins everywhere.
8. ✅ **`/dashboard` honest empty state**: removed the fake "Priya Sharma CT-4821" fallback profile and the fake `+91 98765 43210` in the Cosmic ID card; empty desk now routes users into the 30-second Kundali flow (`/#kundali-section`) with today's Panchang as the secondary action. *(§2.4)*
9. ✅ **Small extras**: `/ask` tier cards now fully Hindi (labels + descriptions, no mixed-script cards); hero video `preload="metadata"`.

### P1 — Ship the simplified journey (2–4 weeks) — 🟡 IN PROGRESS (items 8–12 shipped Aug 2026)
8. ✅ **First-session flow core** — free Kundali auto-saves to `profileStore` + Cosmic ID chip (P0 batch); added **3 plain-language highlights** on the result (Lagna meaning, Moon Nakshatra meaning, current Mahadasha with end-year) and a **1-tap WhatsApp share** button (Web Share API → `wa.me` fallback, `KUNDALI_SHARED` event). City-ask-first hero entry remains open.
9. ✅ **Birth-time-unknown path** — "समय नहीं पता / I don't know" checkbox on both the home Kundali form and `/ask` step 2: computes an honest noon chart, flags "Lagna approximate", suggests scholarly rectification, and stores `birthTimeKnown` on the profile.
10. ✅ **Mobile bottom nav** — new `MobileBottomNav` (Home · आज · कुण्डली · पूछें · अधिक → existing mega-menu) on the home page and every `CosmicTantraShell` page (phones only); floating AI Guru / WhatsApp pill / PWA toast raised above it (`bottom-20 md:bottom-*`). Intent-tiles-act-as-links still open.
11. ✅ **`/ask` progressive 3-step form** — Step 1 प्रश्न (textarea + 6 one-tap example questions + free AI Guru as secondary), Step 2 जन्म विवरण (name/DOB/time/place + unknown-time), Step 3 परामर्श (4 tiers + contact + recap + fixed-dakshina line + contextual help desk). Progress indicator with back-navigation, inline field validation (no more `alert()`), payment logic untouched. `tests/consultation-flow.spec.ts` updated to walk the steps.
12. ✅ **`/onboarding` wired** — the orphaned name/phone mock is now a server `redirect('/#kundali-section')`; the Kundali save **is** the onboarding.
13. ✅ **Plain-language glossary layer** — new `InfoTip` ⓘ component (bilingual, tap-to-open) wired into the CosmicNowDial telemetry plate (तिथि, नक्षत्र, योग/करण, राहु काल, अयनांश) with plain-language explanations; the Kundali result's 3-highlight block (P1 #8) covers Lagna/Dasha. Terms covered: tithi, nakshatra, yoga, karana, rahuKaal, lagna, ayanamsha, dasha.
14. ✅ **Hero video optimised** — poster-only on ≤ 768 px viewports (saves the 9.7 MB download on 4G phones; full video remains on desktop) + `preload="metadata"` (P0). A compressed ≤ 2 MB source is still worth adding when ffmpeg is available.

### P2 — Retention & scale — 🟡 IN PROGRESS (items 15–17 shipped Aug 2026)
15. ✅ **First-session checklist** — `FirstSessionChecklist` card on home (dismissible, client-only, no SSR flash): ① निःशुल्क कुण्डली बनाएं ② परिवार जोड़ें ③ सुबह का पञ्चाङ्ं digest देखें — live completion from the Parivaar vault, progress counter, "no account, no OTP" reassurance, re-checks on tab focus, `CHECKLIST_TASK_CLICKED` events.
16. 🟡 **Morning WhatsApp digest** — now surfaced as checklist task ③ linking to `/morning-digest` (preview simulator); a real WhatsApp opt-in still needs the backend delivery integration (see `WHATSAPP_HELP_DESK_AND_UX_COMPLIANCE_PLAN.md`).
17. ✅ **Activation analytics** — new events `FIRST_KUNDALI_GENERATED` (once per visitor, auto-annotated with **time-to-value** via the new `analytics.trackOnce()` + first-visit stamp), `PROFILE_SAVED`, `KUNDALI_SHARED`, `CHECKLIST_TASK_CLICKED`, and `ASK_STEP_VIEWED` (per-step funnel drop-off). Metrics to watch: activation % (target ≥ 35 %), median TTV (target < 60 s), save rate (≥ 60 %), share rate (≥ 15 %), `/ask` step drop-off.
18. ⬜ A/B: Hindi-default vs English-default; Kundali-form placement (hero vs section 6).
19. ⬜ Later: OTP accounts migrating localStorage profile → `AstrologyCustomerProfile` (schema path already designed in `profileStore.js` header comment).

---

## 6. How we'll know it worked

| Metric | Today | Target (post P1) |
|---|---|---|
| New visitors generating a Kundli in session 1 | unmeasured | instrument; target **≥ 35 %** (category-typical activation) |
| Time-to-first-Kundli (median) | ~6 sections of scroll | **< 60 s**, 2 taps |
| Charts saved / generated | 0 % (state lost) | **≥ 60 %** saved (Cosmic ID created) |
| Share-card sends per chart | 0 (feature absent) | ≥ 15 % |
| `/ask` reached with prefilled birth details | partial (only if profile pre-exists) | **100 %** after P1 step 8 |
| Day-1 return (pilot cohort) | unmeasured | 25–40 % benchmark [7](https://www.digia.tech/post/mobile-app-onboarding-activation-retention/) |

---

## 7. Sources

- [1] Miracuves — What is AstroTalk, how it works (2026): free first chat, freemium entry, wallet model. https://miracuves.com/blog/what-is-astrotalk-how-it-works/
- [2] AstroTalk — Chat with Astrologer (official): first chat free, 4-step astrologer verification, per-minute pricing. https://astrotalk.com/chat-with-astrologer
- [3] AstroTalk blog — "Is Astrotalk Real or Fake": free first chat/call for new users, example Hindi question chips. https://astrotalk.com/astrology-blog/astrotalk-real-or-fake/
- [4] AstroSage — Free Kundli: instant free chart, signup pitched as cloud-save. https://www.astrosage.com/kundli/
- [5] InstaAstro — Free Janam Kundli: required fields, birth-time-unknown limitation, first-timer-labelled report. https://instaastro.com/kundli/free-kundli/
- [6] Appcues — Essential guide to mobile onboarding: value < 60 s, progressive disclosure, 3–5 screens. https://www.appcues.com/blog/essential-guide-mobile-user-onboarding-ui-ux
- [7] Digia — Mobile onboarding, activation & retention: activation predicts retention, D1 25–40 %. https://www.digia.tech/post/mobile-app-onboarding-activation-retention/
- [8] NextNative — 7 mobile onboarding best practices 2025: value-first, minimal flow, progress indicators. https://nextnative.dev/blog/mobile-onboarding-best-practices
- [9] Autviz — Top horoscope apps 2026: "every field needs a short note on why it matters", calm first-timer UX. https://www.autviz.com/top-horoscope-apps/

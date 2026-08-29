# 🔭 CosmicTantra v2 — Improvement Audit (Aug 2026)

**Scope:** Full-codebase review (landing page, engines, API routes, Prisma schema, ops pages).
**Goal:** Prioritized action list to make the product *safe to charge money, trustworthy to sell, and fast to ship*.

---

## 0. TL;DR — The 5 things that matter most

1. **🔴 The free Kundali and the paid ₹199 report use two *different* astrology engines** that disagree with each other. Same birth data → free chart says **Leo Lagna / Magha**, paid pipeline says **Aquarius Lagna / Dhanishtha**. For a product whose entire pitch is *"deterministic calculation transparency"*, this is the #1 defect.
2. **🔴 There is no real payment.** The ₹199 flow is a simulation: the "Pay" modal just flips to a fake SUCCESS state, and `/ask` calls the payment webhook directly from the browser with a hardcoded `pay_demo_12345`. No Razorpay order, no signature verification, no money collected — but reports still get generated and delivered.
3. **🔴 Zero authentication anywhere, and customer PII is publicly readable.** `/astrology/cases`, `/astrology/practitioners`, `/pandit`, and every `/api/astrology/*` route are open. Any visitor can list every customer's name, question, birth date/time/city, phone and email, approve/deliver cases, and create practitioner invites. The ops pages are even listed in `sitemap.xml`.
4. **🟠 The landing page is one giant `'use client'` component** (~5,600 lines of sections/modals imported eagerly, incl. a 640-line Canvas animation). No server components, no `next/dynamic`, no image component, no lazy video.
5. **🟠 The "AI Guru" is fake.** `ChatBox` replies from a canned `setTimeout` template — it never calls any AI API, and the roadmap's "3 free AI questions using your chart" is not implemented. `kundaliData` also lives only in React state, so everything is lost on refresh (no auto-profile despite the growth plan).

---

## 1. What's already good (keep it, protect it)

- Strong, differentiated design language (Kashi Sandhya palette, editorial/mono typography, day/night themes) — not generic AI-template output.
- Real engineering ambition: sidereal engines, Lahiri ayanamsha, Vimshottari 3-tier drill-down, Panchang, knowledge graph.
- The **5-stage pipeline state machine** in `schema.prisma` (DRAFT → … → DELIVERED) with audit logs is a genuinely good trust model — it's just not wired to anything real yet.
- Transparent capability registry + "calculation vs interpretation" methodology section — truthful positioning.
- SEO groundwork: `layout.tsx` JSON-LD, `sitemap.ts`, `robots.ts`, `llms.txt`, Hindi/English translations (~43 KB).
- Proper invite token design (256-bit, 7-day expiry, single-use) — the pattern is right, the endpoint just needs auth.

---

## 2. 🔴 P0 — Fix these before taking any real payment

### 2.1 Two divergent astrology engines (credibility bug)

There are **two parallel implementations** of every engine:

| Domain | Public/landing page (`src/lib/`) | Paid pipeline (`src/engines/`) |
|---|---|---|
| Kundali | `calculateKundali({birthDate, birthTime, latitude, longitude, timezone})` — **object arg, array planets** | `calculateKundali(date, time, lat, lon, tz)` — **positional args, planets keyed by name** |
| Dasha | `calculateVimshottariDasha(moonLongitude, birthDateStr)` | `calculateVimshottariDasha(moonNakshatraObj, birthDate)` |
| Panchang | `calculatePanchang(date, cityObj)` | `calculatePanchang(date, lat, lon, tz)` |

They produce **different output shapes and different results**. Repro:

```bash
node -e "
const lib = require('./src/lib/astrologyEngine.js');
const eng = require('./src/engines/astrologyEngine.js');
const l = lib.calculateKundali({birthDate:'1995-06-15',birthTime:'10:30',latitude:25.5941,longitude:85.1376,timezone:5.5});
const e = eng.calculateKundali('1995-06-15','10:30',25.5941,85.1376,5.5);
console.log('FREE chart  -> Lagna:', l.lagna.rashiEn, '| Nakshatra:', l.lagna.nakshatra);
console.log('PAID engine -> Lagna:', e.lagna.rasiName, '| Nakshatra:', e.lagna.nakshatra.name);
"
# Observed output:
# FREE chart  -> Lagna: Leo | Nakshatra: Magha
# PAID engine -> Lagna: Aquarius | Nakshatra: Dhanishtha
```

A Lagna can't be both Leo and Aquarius for the same birth moment. One of them is wrong (the paid engine also puts the Sun at 29.8° Taurus while the free engine puts it at 29°52′ — close, so the disagreement is in the ascendant/house math, likely the local sidereal time or zoneline handling).

Also note the `src/lib` version ignores DST/zone rules entirely (`hour + minute/60 - timezone` arithmetic), and DOB handling uses `new Date('YYYY-MM-DD')` + naive `.split('-')` in both engines — timezone-fragile.

**Fix:**
- Decide one canonical engine (I'd keep `src/engines/` as the "protected domain logic" that the paid pipeline uses, and make `src/lib` import from it — or move to `src/engines/` single source, delete the duplicates).
- Add **golden-output tests**: ~20 fixed birth moments with expected Lagna/Moon/Nakshatra/ayanamsha verified against a trusted source (e.g., Swiss Ephemeris / drikpanchang fixtures). Free chart and paid snapshot must be byte-identical for identical input — enforce with a CI test.
- Store the input + a `calculationVersion` (already in schema) and validate version mismatch on display ("this chart was computed by v34").

### 2.2 No real payments (revenue + trust bug)

- `src/components/ConsultationModal.jsx`: `handleCompleteOrder()` only plays a tick + fires analytics, then shows a local SUCCESS step. **Nothing is created or charged.**
- `src/app/ask/page.tsx`: after `POST /consultations/create`, it calls `POST /api/astrology/payments/webhook` **from the browser** with `paymentId: 'pay_demo_12345'` — i.e., the client tells the server "payment succeeded". The webhook has **no Razorpay signature verification** (`x-razorpay-signature` HMAC check missing entirely).
- Result: the pipeline (LLM call + report) can be triggered to completion by anyone, for free, with a curl POST of a consultation ID; and even legit customers are never actually charged.

**Fix (proper flow):**
1. `POST /consultations/create` → server creates a **Razorpay Order** (`amount: 19900`, `currency: INR`), stores `razorpayOrderId`, returns `order_id` + key.
2. Client opens Razorpay Checkout (or a UPI intent link for WhatsApp-first users), gets `payment_id`/`signature`.
3. Client calls `POST /consultations/confirm` with `payment_id + signature` → server verifies HMAC with the webhook secret → only then moves status to `PAID` and triggers calculation.
4. Keep the webhook as the **server-side backstop** (idempotent key = `razorpayOrderId`; verify signature; skip if already processed — the idempotency check exists, good).
5. Move the Anthropic call off the request path into a queue-ish flow (`CALCULATING` → retry with backoff, not a 3-second `AbortController` that just drops timeouts).
6. Gate `/consultations/test` behind admin auth and make it cost-limited.

### 2.3 Zero auth → customer PII is public (legal + trust bug)

Every ops route and page is open:

| Endpoint / page | Exposure |
|---|---|
| `GET /api/astrology/consultations` | ALL consultations: customer name, phone, email, question, DOB/time/city — to anyone |
| `GET /api/astrology/practitioners` | All practitioners incl. phone/email + invite records |
| `POST /api/astrology/practitioners/invite` | Anyone can mint onboarding invites |
| `PATCH /cases/[id]/review`, `POST /cases/[id]/deliver` | Anyone can approve or mark a case delivered |
| `/astrology/cases`, `/astrology/practitioners`, `/pandit`, `/pandit/cases/[id]` | Ops dashboards render the PII above |
| `POST /api/astrology/analytics` | Unauthenticated writes to `AstrologyAuditLog` (spam/DB abuse) |
| `POST /payments/webhook` | Unverified trigger (see 2.2) |

Worse: `src/app/sitemap.ts` lists `/astrology/cases`, `/astrology/practitioners`, and `/pandit` for crawl, and `robots.txt` only disallows `/api/` — so Google can index the internal dashboards containing personal data. Under India's DPDP Act 2023, exposing birth data + phone + name of customers is a serious liability.

**Fix (minimum viable):**
- Add a real auth story: e.g., **Clerk/Auth0/NextAuth** for admin+pandit roles (or at minimum HTTP-only session cookie + `API_ADMIN_TOKEN` env guard for P0).
- In `middleware.ts` (currently a no-op that only rewrites `/` for host matching) enforce: `/(api/astrology)|(astrology)|(pandit)` → require session; public-only is `/`, `/ask`, `/ask/success/[id]` (and even success should fetch via a **public-id + OTP-verified** route, never list-all-then-filter client-side — see `ask/success` which fetches **the entire consultations list** and filters in the browser).
- Remove `/astrology/*` and `/pandit` from `sitemap.xml`; add them to `robots.txt` disallow list.
- Never return full records to the browser; add dedicated DTOs (public id, masked phone).
- Add rate limiting (e.g., `@upstash/ratelimit` or in-memory per-IP on `/create`, `/analytics`, `/webhook`).

### 2.4 Abstraction abuse of AI spend

- `POST /consultations/test` (called from the admin UI) computes + calls Anthropic and writes a full case.
- The webhook calls Anthropic with a **3s abort timeout** — likely to fail silently on slow networks, then still marks `PANDIT_REVIEW` with a useless draft. Add retries + a `CALCULATION_FAILED` path (the schema already has these statuses — use them).
- Model name is hardcoded (`claude-sonnet-4-20250514`) in two places; make it env-driven.
- With auth + rate limiting (2.3), cost abuse is capped.

---

## 3. 🟠 P1 — Product integrity & conversion gaps (their own plan, not yet built)

### 3.1 The growth plan's funnel is aspirational code
(Re: `VARANASI_GROWTH_PLAN.md` "Slice F & G")

| Roadmap promise | Reality |
|---|---|
| Free hook with interactive charts | ✅ Works on landing page |
| **Auto-profile / account (name + birth details saved)** | ❌ `kundaliData` is in-memory only — refresh wipes it. `localStorage` profile is never written. **No `AstrologyCustomerProfile` model in schema.** |
| **AI Guru teaser: 3 free questions using the user's chart** | ❌ `ChatBox` is `setTimeout` canned text; template strings don't use real dasha/panchang data and never hit an API. |
| 1-click ₹199 escalation from chat/Dasha | ❌ No escalation path; modal is fake payment. |
| Persisted Cosmic ID (`CT-8892`) | ❌ Doesn't exist. |

**Fix:** persist profile (localStorage + a customer table keyed by phone OTP later), pass it into KundaliExperience/DashaHero/ChatBox, add a `/api/guruchat` thin route (Anthropic w/ chart context, 3-question quota enforced server-side), and a `Escalate ₹199` button with pre-filled birth details.

### 3.2 Fragmenting the conversion path
The landing page has its own `ConsultationModal` (fake), but `/ask` has a *different*, real-ish form. Merge them: one checkout component driven by `POST /create` → Razorpay → `PAID`, reusing the profile data. Everything else (modal, sections) just routes to it.

### 3.3 Heavy landing page
- `src/app/page.tsx` is `'use client'` top-to-bottom; all ~19 sections + 4 modals are eagerly bundled (no `next/dynamic`, no `Suspense`).
- Hero `<video autoPlay loop muted>` loads a **9.7 MB mp4** on every mobile visit; `hero video/` sources (17 MB total, incl. an exact duplicate of `public/kashi-hero-video.mp4`) are committed to git.
- No `next/image` anywhere (`<img>` in PractitionersSection), Google Fonts via CSS `@import` (render-blocking).

**Fix:** make `page.tsx` a server component; wrap interactive sections in `next/dynamic(..., { ssr: false })` (SwargaLok, modals); `preload="metadata"` + smaller compressed hero (or poster-only on mobile via `matchMedia`); move `hero video/` + `scratch/` out of git (or ignore); self-host fonts with `next/font`.

### 3.4 Engineering hygiene
- **No README** (the only docs are the `coc/` strategy notes), **no `.env.example`** (DATABASE_URL, DIRECT_URL, ANTHROPIC_API_KEY, Razorpay keys unknown), **no lint config, no tests, no CI**, no `.github/`.
- `package.json` says `engines: node 24.x`; sandbox/typical Vercel runs Node 20/22 — align to a supported version or drop engines.
- Unused deps: `framer-motion`, `clsx`, `tailwind-merge` (zero imports in `src/`). Remove or actually use.
- `middleware.ts` is a no-op: the `host.startsWith / includes` logic does nothing but rewrite `/` to `/`. Replace with real routing/auth guard.
- `postinstall: prisma generate` + `binaryTargets` listing 4 Linux targets is fragile; prefer `prisma generate` in build only, target the deploy platform.
- Analytics route should be behind auth/batched; events currently fire one POST per interaction (DB noise, and it fails silently in production with no monitoring).
- `tsc --noEmit` currently reports implicit-`any` errors in the two list endpoints; there is no typecheck step anywhere to catch regressions. (Couldn't run full `prisma generate` in this sandbox because `binaries.prisma.sh` is blocked from this network — verify with a clean `npm run build` on your machine.)

---

## 4. 🟢 P2 — Nice-to-have / roadmap items

- **Correctness validation**: compare one week of Panchang output against drikpanchang.com fixtures; add a unit test suite for the engines (this is the highest-leverage quality investment).
- **Verification of astrology inputs**: ayanamsha value exposed in UI (currently declared ±0.01° in copy, not proven), house system documented (Equal House vs Sripati is an opinion — declare it).
- Performance: estimate/diff, image optimization, `loading="lazy"` below-fold, code-splitting, and a Lighthouse budget in CI.
- Accessibility: modals have no focus trap / `role="dialog"` / aria labels today; add them before public launch.
- Monitoring: structured logging on `AstrologyAuditLog` already exists — surface failures to an admin channel (WhatsApp/email) and add retries for delivery (`DELIVERY_FAILED` status exists but delivery is never wired: `deliver` route only generates text; no WhatsApp API integration).
- `llms.txt` is good — keep it synced when pages change.

---

## 5. Suggested sequence (30/60/90)

### Week 1–2 — Stop the bleeding (P0)
1. Unify engines; add 20 golden tests; delete `src/lib/{astrologyEngine,dashaEngine,panchang}` duplicates and re-point imports.
2. Add auth (Clerk or env-token MVP) + middleware guard; restrict ops pages; scrub sitemap/robots; add DTOs so APIs never return PII to anonymous callers.
3. Fix checkout: server-created Razorpay Order → browser checkout → server HMAC verify → `PAID` → calculate. Keep webhook as idempotent backstop. Kill the fake success path.
4. Add rate limits on public routes; move Anthropic call off request path with retries.

### Week 3–4 — Ship the promised funnel (P1)
5. `AstrologyCustomerProfile` model + localStorage profile bridge (auto-fill everywhere, incl. /ask).
6. Real `/api/guruchat` (chart-aware, 3-question quota) and escalation CTA.
7. Server-component landing page + dynamic imports + hero video optimization (mobile poster).

### Month 2 — Ops & quality (P1/P2)
8. Pandit WhatsApp delivery integration (or a simple sms/whatsapp provider), delivery retry + admin alerting.
9. Test suite + CI (lint, tsc, engine golden tests), README, `.env.example`, Lighthouse budget.
10. Performance & a11y polish, then scale the Dhanbad/Varanasi pilot per the existing growth docs.

---

## 6. Quick wins I can implement right now (small, safe)

- Remove the duplicate video from git + `.gitignore` `hero video/` & `scratch/`; add `preload="metadata"` + mobile poster strategy.
- Remove `/astrology/*` and `/pandit` from `sitemap.ts`, add to robots disallow.
- Delete unused deps (`framer-motion`, `clsx`, `tailwind-merge`) from `package.json`.
- Add `.env.example`, `README.md`, ESLint + `typecheck` script, minimal GitHub Actions (typecheck + build).
- Fix the webhook signature check + hardcoded model → env var (needs Razorpay keys to test).
- Wire `ConsultationModal` to the real create route so the modal submits instead of faking success.

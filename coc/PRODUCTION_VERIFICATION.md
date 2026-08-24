# ✅ Production Hardening — Independent Verification Report
**Date:** 24 Aug 2026 · **Verified against:** origin/main `7f29fd8` (+ `0589b94`), live https://cosmictantra.chiti.tech
**Method:** fetched exact committed tree into isolated checkout, ran the agent's own test suite, ran independent (Meeus-formula, non-derivative) astronomical verification, simulated React rendering, and probed the live production endpoints.

---

## 1. Claim-by-claim verdict

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| 1 | Unified canonical astrological engine | ✅ **TRUE** (verified deeper than claimed) | `src/engines/astrologyEngine.js` is now a pure re-export of `src/lib/astrologyEngine.js`. Dual API (object + positional args) confirmed. `planets` is an array **with** `planets.Sun/Moon/...` named props — both consumers work. |
| 2 | Golden test suite | ✅ **TRUE — I ran it myself: 2/2 passed** | `npx playwright test tests/astrology.spec.ts` in isolated checkout → `2 passed (719ms)`. |
| 3 | Engine math is actually correct (not just self-consistent) | ✅ **TRUE — independently verified** | I recomputed the ascendant with my own Meeus/IAU formulas (not derived from their code): sidereal ASC = **132.10° → Simha (Leo) 12°06′**, Lahiri ayanamsha 23.79° for 1995.45. Engine: **Simha 12°00′**. The old "Aquarius" paid engine was the bug; the fix chose the correct side. |
| 4 | Webhook signature verification | ⚠️ **Implemented, but bypassable** | HMAC-SHA256 + `timingSafeEqual` code present. **But** `src/lib/auth.ts` falls back to hardcoded secrets `'cosmic-admin-live-key-2026'` / `'rzp_secret_cosmic_2026'`, and `verifyAdminAuth` accepts them. Repo is **PUBLIC** (confirmed via `gh api` → `private: false`). Anyone can read the keys and authenticate unless prod env vars are set. |
| 5 | PII masking | ✅ **TRUE — verified LIVE** | `GET /api/astrology/consultations` (anonymous, production) returns `customerName: "Varanasi S***"`, `customerPhone: "+91****55"`, `customerEmail: "pr***@gmail.com"`. |
| 6 | Sitemap restricted | ✅ **TRUE — verified LIVE** | `sitemap.xml` now contains only `/` and `/ask` (internal dashboards removed). |
| 7 | Robots disallow ops paths | ✅ **TRUE — verified LIVE** | `robots.txt` disallows `/astrology/`, `/pandit/`, `/api/`, `/admin/`. |
| 8 | Dynamic imports (bundle) | ✅ TRUE (code) | `page.tsx` uses `next/dynamic(..., { ssr: false })` for SwargaLok + 4 modals. "~10 kB" reduction not measurable in this sandbox — plausible, unverified. |
| 9 | Build "16/16 routes compiled" | ⚠️ Unverifiable here | Prisma binary downloads are blocked in this sandbox, so `npm run build` can't run. No `.next` artifact to inspect. A build passing would NOT catch the P0s below (they're runtime-only). |
| 10 | "Deployed to production" | ✅ TRUE | Live sitemap/robots/PII-masking all reflect `7f29fd8`; `origin/main = 7f29fd8` confirmed via `git ls-remote`. |

**Also confirmed from commit `0589b94`:** the previously broken `/images/muhurat/*.jpg` (6 AI-generated images) now exist in `public/`, mobile-responsive hardening tests added, MuhuratDiscovery visuals upgraded. ✅

---

## 2. 🔴 CRITICAL — new P0 findings (introduced by this work)

### P0-1: The free Kundali **crashes in production** after this change
`getNakshatra()` now returns an **object** `{name, index, pada, ruler, degree, toString}`, but UI components still render it as a string:
- `KundaliExperience.jsx:184` → `{kundaliData.lagna.nakshatra}`
- `KundaliExperience.jsx:194` → `{kundaliData.moon.nakshatra}`
- `KundaliExperience.jsx:434` → `{planet.nakshatra}`
- `PersonalisationBridge.jsx:21` → `{kundaliData.moon.nakshatra}`

**Reproduced:** `renderToStaticMarkup(<div>{lagna.nakshatra}</div>)` with React 18 →
`Error: Objects are not valid as a React child (found: object with keys {name, index, pada, ruler, degree, toString})`.
No error boundary exists → the whole page unmounts the moment a user generates a chart. The free Kundali is the product's #1 acquisition hook — this is live-deployed and broken.
**Why tests missed it:** the golden suite checks `.name` properties only, and the responsive suite only browses the homepage — neither generates a Kundali.

### P0-2: Admin/webhook secrets are hardcoded with public fallbacks in a PUBLIC repo
`src/lib/auth.ts`:
```ts
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ASTROLOGY_ADMIN_KEY || 'cosmic-admin-live-key-2026';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_cosmic_2026';
```
Repository visibility: **public** (`gh api` → `"private": false`). Anyone can fetch these strings and:
- `x-admin-key: cosmic-admin-live-key-2026` → **full unmasked PII** from `/api/astrology/consultations` (defeats claim #5 wherever env vars aren't set in prod), and
- authorize the payment webhook (defeats claim #4).
Check Vercel env vars **now**; fail-open defaults must be replaced with fail-closed (`throw` in production when env missing).

### P0-3: Payment is STILL simulated end-to-end — and now silently broken
- `POST /api/astrology/consultations/create` was **NOT modified** — no Razorpay Order is created server-side.
- `ConsultationModal.jsx` (new) creates a DB record, then POSTs the webhook with `paymentId: pay_demo_${Date.now()}` and **no signature**. In production this gets **401** (correctly) — but the modal **ignores the webhook response and still sets `step = 'SUCCESS'`**.
- Net effect: customer sees "payment successful", case remains `PAYMENT_PENDING`, no money collected, no report generated. Worse than the old fake — it now looks real while breaking silently.
- Also: `PAYMENT_COMPLETED` analytics event fires before any payment exists.

---

## 3. 🟠 Important secondary findings

1. **Dasha/Panchang engines are still duplicated** — only the Kundali engine was unified. `src/lib/dashaEngine.js` (object-shape result, used by `DashaHero`) vs `src/engines/dashaEngine.js` (array result, used by webhook) and the two `panchang.js` copies still differ in API/shape. Values now agree (verified: Sun MD 1995-06-15→2000-12-01/02; Panchang tithi/nakshatra identical) — so no live correctness bug, but "one canonical engine" claim is only 1-of-3 implemented.
2. **Unauthenticated routes remain**: `/api/astrology/analytics`, `/consultations/create`, `/consultations/test`, `/practitioners*`, `/cases/*` have no auth — only the GET consultations list is gated by masking. DOB + birth city are still exposed unmasked in that list (DOB is sensitive under DPDP).
3. **No CI / no test script**: `package.json` has no `"test"` script; tests exist but ran manually; `test-results/`, `scratch/overflow_report.json` (7,752 lines), `scratch/test_engines.mjs`, and a stray `workspace-01a033fd-*` file are committed to the public repo (cleanup).
4. **WhatsApp delivery still not wired** — `deliver` route only generates text. The ₹199 promise ("delivered on WhatsApp") remains undelivered (no WhatsApp API integration, no retries; `DELIVERY_FAILED` status unused).
5. **No rate limiting** anywhere; analytics route still accepts anonymous writes (DB spam).
6. `aiModel` still hardcoded twice (`claude-sonnet-4-20250514`); Anthropic call still on the request path with a 3s abort.

---

## 4. 🎯 Next moves to win (in order)

### This week (blockers before any marketing)
1. **Fix P0-1 (30 min):** render `nakshatra.name` (or `String(nakshatra)`) in the 4 UI spots; add a Playwright test that generates a Kundali and asserts no page error. Redeploy.
2. **Fix P0-2 (30 min):** fail-closed env secrets; set `ADMIN_SECRET` + `RAZORPAY_WEBHOOK_SECRET` in Vercel; rotate values; never commit defaults.
3. **Fix P0-3 (1–2 days):** server-side Razorpay Order in `/create` → `checkout.razorpay.com` in modal → `POST /confirm` with `payment_id`+`signature` → server verifies HMAC → `PAID` → pipeline. Show SUCCESS only after server confirms. Keep webhook as idempotent backstop.
4. **Hygiene:** add `"test": "playwright test"` + `tsc --noEmit` to CI, delete committed test artifacts, add rate limits, mask birthDate/birthCity in public DTOs.
5. **Unify dasha/panchang** (single source, like the Kundali engine) — finish what was started.

### Then execute the growth plan (already written in `coc/MARKETING_GROWTH_ASSESSMENT.md`)
6. **SEO launch set (30 pages):** city × panchang (Patna, Varanasi, Dhanbad…), 12 rashifal, 6 muhurat, 8 festival (Pitru Paksha Sep 11 → Navratri Sep 12 → Dev Deepawali Nov 23), kundali, dasha calculator — programmatic, Hindi-first, hreflang, per-page schema.
7. **WhatsApp-first funnel live:** free chart → WhatsApp opt-in → ₹199 (real payment after #3) → delivery **on the same thread** (needs WhatsApp Business API — the constraint on everything).
8. **Trust & legal:** privacy/ToS/refund pages (DPDP), real reviews loop post-delivery, live delivery counter.
9. **Festival campaign dossier** for Sep–Nov 2026 + daily panchang content (text + 60s Reels/Shorts from the engine).
10. **Monetization ladder:** ₹199 → ₹699 premium tier → monthly subscription → remedies store (Astrotalk's store = ~12% of revenue).

> **Bottom line:** 8 of 10 claims verified true — including the two most important (engine parity + the math is actually correct). But the ship is not ready to take money: 3 new P0s (one live production crash, one public-secret bypass, one fake-feeling payment flow) must be closed before the growth plan starts.

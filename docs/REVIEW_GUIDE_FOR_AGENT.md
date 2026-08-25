# 🔍 Review Guide for the Local Agent — PR #1

> **Scope:** Review of PR #1 (`arena/01a034cc-cosmictantra-v2` → `main`), which lands on top of the audit-resolution commit `7f29fd8`.
> **Your job:** verify the claims below, challenge the design decisions, and either approve or list blocking issues. Do **not** push to `arena/01a034cc-cosmictantra-v2` directly — this branch belongs to the Arena session. If you need changes, open a follow-up PR from your own branch or leave review comments.

---

## 0. What this PR is

One commit (`2409f09`), 49 files, +4,064 / −183. Three parts:

1. **P0 fixes** — P0-1 (live production crash on Kundali generation), P0-2 (hardcoded public secrets in a public repo).
2. **Real payment flow** — server-side Razorpay Order → browser checkout → HMAC-verified `/payments/verify` → shared `paymentPipeline`. Replaces the simulated `pay_demo_*` flow (P0-3).
3. **Feature suite** from the growth assessment — numerology tools, baby names by nakshatra, Kundali Milan, family profiles, personal Vedic calendar + ICS export, live darshan, Vedic library, programmatic SEO pages (city panchang / rashifal / festivals), AdSense-ready slots.

---

## 1. Verification checklist (run in this order)

### Step 1 — Install & generate
```bash
npm install            # triggers prisma generate (needs binaries.prisma.sh reachable)
```
If `prisma generate` fails with a network error, **that is a sandbox network issue, not a code issue** — note it and continue with Steps 2–3 (they don't need Prisma).

### Step 2 — Engine & feature tests
```bash
npx playwright test
```
**Expected: 13 passed**
- `tests/astrology.spec.ts` — 2 golden-parity tests (from `7f29fd8`)
- `tests/features.spec.ts` — 11 tests: numerology (determinism, Mulank/Bhagyank, mobile +91 handling, harmony range), Kundali Milan (36-point bound + determinism), Mangal Dosh, Vedic alerts (Rikta/Panchak rules, Rahu Kaal + Abhijit present, ICS well-formed), rashifal, and **P0-1 regression** (raw-nakshatra render must throw; accessor render must work).

### Step 3 — Typecheck
```bash
npx tsc --noEmit
```
**Expected: 0 errors.** (This also fixed 6 pre-existing implicit-`any` errors from `7f29fd8` in the consultations/practitioners routes.)

### Step 4 — Production build (the one thing the author could NOT verify)
```bash
npm run build
```
The author's sandbox could not reach `binaries.prisma.sh`, so `next build` compiled all routes but failed at page-data collection on `@prisma/client` init. **Please confirm in an unblocked environment.** Report route count.

### Step 5 — Smoke test new routes (optional, `next dev` on any port)
```
/                     /numerology/name           /numerology/business-name
/numerology/mobile-number  /numerology/baby-names /kundali-milan
/family               /my-calendar               /darshan
/library              /library/{any slug}        /panchang/patna
/rashifal/mesha       /festivals/aja-ekadashi    /api/vedic-calendar/export?birthDate=1995-06-15&days=3
```
All should return 200 with unique SEO titles. The ICS endpoint should return `BEGIN:VCALENDAR ... BEGIN:VEVENT ... RAHU_KAAL`.

---

## 2. Security review points (be strict here)

- [ ] **`src/lib/auth.ts`** — confirm there are **no** hardcoded fallback secrets anywhere. Production must be fail-closed: missing `ADMIN_SECRET` → `verifyAdminAuth` returns false; missing `RAZORPAY_WEBHOOK_SECRET` → webhook returns 503, not a silent bypass. Dev-only keys must be gated by `NODE_ENV !== 'production'`. Constant-time compare must be used for both header and signature paths. `x-dev-bypass` must be impossible in production.
- [ ] **`src/lib/razorpay.ts` + `verify` route** — signature compared with `timingSafeEqual`; `verifyPaymentSignature` uses the real `RAZORPAY_KEY_SECRET` (env-only); verify route must not accept a consultation that has no matching order.
- [ ] **`paymentPipeline.ts`** — idempotent (returns existing record if status ≠ `PAYMENT_PENDING`); AI model env-driven (`NEXT_PUBLIC_GURU_AI_MODEL`, fallback `claude-sonnet-4-20250514`); no `process.env` key leaked to client bundle.
- [ ] **PII** — no new API returns unmasked customer PII; `/api/vedic-calendar/export` is stateless (query params only, no DB read, no PII echo beyond the name that was passed in — verify the ICS filename/description doesn't leak anything sensitive).

## 3. Feature review points (challenge the judgment calls)

- **Numerology (`src/lib/numerology.js`)** — Chaldean table values vs standard references (1:A I J Q Y; 2:B K R; 3:C G L S; 4:D M T; 5:E H N X; 6:U V W; 7:O Z; 8:F P). Check `reduceNumber` master-number handling (11/22/33 retained) and `nameHarmony` scoring — is the 70/85/40 heuristic defensible, or should it be simplified/documented?
- **Kundali Milan (`src/lib/kundaliMilan.js`)** — Pala tables (Varna 1 / Vashya 2 / Tara 3 / Yoni 4 / Graha Maitri 5 / Gana 6 / Bhakoot 7 / Nadi 8 = 36). Confirm the `VASHYA_GROUPS` mapping and `gamaOf` lists match the classical assignments you recognize. Cross-check one fixed pair against drikpanchang or a reference — if it disagrees, note it (UI copy declares lineage variation, but a real bug should be flagged). Mangal Dosh from Lagna + Moon, houses [1,2,4,7,8,12] — confirm.
- **Vedic alerts (`src/lib/vedicAlerts.js`)** — Rikta tithis (4, 9, 14), Panchak nakshatras (Dhanishtha → Revati), Abhijit window, festival matching by `dateStr` parse. ICS output: verify `VTIMEZONE` isn't required for the DTSTARTs produced (author used floating/all-day + fixed offset formatting), and that `DTSTAMP`/`UID` are valid.
- **Profile store (`src/lib/profileStore.js`)** — localStorage-first is intentional (free tier keeps PII on device; DB-backed `AstrologyCustomerProfile` is the later upgrade). Check `kundaliForProfile` lazy `require` won't break bundling in Next 14 client components (it's used inside `FamilyManager` on save — confirm no SSR/hydration issue), and that no PII is written into any URL or analytics event.
- **Pages** — `/panchang/[city]`, `/rashifal/[sign]`, `/festivals/[slug]`, `/library/[slug]` are server components with `generateStaticParams`/`revalidate`. Check: correct use of `notFound()`, canonical URLs, no `use client` leakage, and that `AmbientAdSlot` never renders when env IDs are absent.
- **Darshan** — embeds are official public YouTube streams only (IFrame API, attribution retained). Confirm there is no IPTV/HLS/m3u8 code and no `.m3u`/`videojs`/`hls.js` dependency added.

## 4. Claims the author "could not verify" — escalate if you see something different

| Claim | Author's status | What to confirm |
|---|---|---|
| `npm run build` passes | ❌ Could not run (sandbox blocked `binaries.prisma.sh`) | Run it; count compiled routes |
| Playwright 13/13 | ✅ Ran here (browser download blocked, but engine tests are browser-free and passed) | Re-run; note if `responsive.spec.ts` needs a browser |
| `tsc --noEmit` clean | ✅ Ran here | Re-run |
| All new routes 200 | ✅ Smoke-tested in dev | Re-run if you have browsers |

## 5. Env vars required before merge (fail-closed by design)

```
ADMIN_SECRET                      # long random string
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
ANTHROPIC_API_KEY
# optional: NEXT_PUBLIC_GURU_AI_MODEL, NEXT_PUBLIC_ADSENSE_CLIENT, NEXT_PUBLIC_ADSENSE_SLOT, NEXT_PUBLIC_SITE_URL
```
Without them: payments return `checkoutEnabled:false` (page shows "gateway not configured" — honest, not broken), admin APIs deny (401), webhook returns 503 "misconfigured". **Confirm none of these strings appear in code or the client bundle.**

## 6. Final decision format

Use the standard review pattern:
- **Approve** — with the run evidence (tests/types/build) quoted.
- **Request changes** — with exactly one actionable item per blocking issue, e.g. "P0-1 regression: `X.jsx` still renders raw `nakshatra` — fix and add a test."
- Leave a **summary comment** on the PR with: build route count, test count, security pass/fail, whether env vars were verified, and any non-blocking suggestions (naming, docs, follow-ups like AstrologyCustomerProfile migration, rate limiting, real WhatsApp delivery).

> Tip for the reviewer: the fastest way to spot regressions is `git diff 7f29fd8..2409f09 --stat` then reading the files in this order: `src/lib/auth.ts` → `src/lib/razorpay.ts` → `src/app/api/astrology/payments/verify/route.ts` → `src/lib/paymentPipeline.ts` → `src/lib/vedicAlerts.js` → `src/lib/kundaliMilan.js` → new pages.

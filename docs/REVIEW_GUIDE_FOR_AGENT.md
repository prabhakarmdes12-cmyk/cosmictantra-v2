# 🔍 Review Guide for the Local Agent — UX Journey PR

> **Scope:** Review of the **New-User Journey Simplification** PR (`arena/01a051f8-cosmictantra-v2` → `main`), one commit on top of `ff06648`.
> **Your job:** verify the claims below, challenge the UX/product decisions, and either approve or list blocking issues. Do **not** push to `arena/01a051f8-cosmictantra-v2` — this branch belongs to the Arena session. If you need changes, open a follow-up PR from your own branch or leave review comments.
> *(Supersedes the PR #1 review guide, which remains in git history.)*

---

## 0. What this PR is

One commit, 22 files (+~900/−~360). A complete new-user UX batch — **audit → P0 trust fixes → P1 activation journey → P2 retention rails** — driven by the research-backed audit doc added in this PR:

**📄 `docs/NEW_USER_UX_AUDIT_AND_JOURNEY_SIMPLIFICATION.md`** (new, indexed in `docs/INDEX.md`) — friction log with file:line evidence, competitor benchmarks (AstroTalk/AstroSage/InstaAstro, cited), the simplified journey spec, and the P0/P1/P2 roadmap with live ✅/🟡/⬜ statuses. **Read §0, §2 and §5 first** — they are the source of truth for every change here.

## 1. The changes, in verification order

### A. Trust & honesty fixes (audit §2.1–2.4)
| Claim | Verify |
|---|---|
| Fabricated "72h Glimpse" strip (hardcoded Rohini fallbacks) removed — ticker now renders **real computed** Tithi/Paksha/Nakshatra + tomorrow's Nakshatra, chart line only when a chart exists | `PersonalisationBridge.jsx`, `page.tsx` (passes `panchangData`/`tomorrowPanchangData`) — load `/` with empty localStorage: ticker must show today's real panchang, never "Moon in Rohini (11th House)" |
| `ConsultationModal` no longer defaults birth date to **year 5015** nor submits fake phone `+919876543210` | `ConsultationModal.jsx:35` area + submit body |
| Kundali form no longer pre-fills demo person "Priya Sharma" | `KundaliExperience.jsx` initial state — empty values, placeholders only |
| Dashboard fake fallback profile + fake WhatsApp number in Cosmic ID card removed | `dashboard/page.tsx`, `CosmicIdCard.tsx` |

### B. Activation loop (audit P1 #8–9)
- **Charts persist**: generating a Kundali calls `upsertProfile` + `setActiveProfile` (deduped on Self+birth details), shows "✓ कुण्डली सुरक्षित — Cosmic ID CT-XXXX"; home re-hydrates via `kundaliForProfile` on mount; returning visitors get prefilled forms.
- **3 plain-language highlights** on the result (Lagna meaning / Moon Nakshatra / current Mahadasha via `calculateVimshottariDasha(moon.longitude, birthDate)` → `mahadashas.find(isCurrent)`).
- **1-tap WhatsApp share** (Web Share API → `wa.me` fallback) + `KUNDALI_SHARED` event.
- **Birth-time-unknown checkbox** (home form + `/ask` step 2): noon chart, honest "Lagna approximate" flag, `birthTimeKnown` stored on profile.

### C. Navigation & cognitive load
- New **`MobileBottomNav`** (`होम · आज · कुण्डली · पूछें · अधिक`) on home + all `CosmicTantraShell` public pages; floats (AI Guru / WhatsApp pill / PWA toast) raised to `bottom-20 md:bottom-*`; AI Guru moved bottom-**left**, bilingual, hover-not-auto-open.
- **`/ask` rewritten as a progressive 3-step flow** (प्रश्न → जन्म विवरण → परामर्श) with one-tap example questions, inline validation (no `alert()`), question recap, fixed-dakshina trust line. **Razorpay/consultation-create/payment-verify logic is intentionally untouched** — diff the handlers to confirm.
- `/onboarding` mock → server `redirect('/#kundali-section')`.
- Hindi-first default on home (`page.tsx`), matching `CosmicTantraShell` — sticky saved preference wins.

### D. Retention rails (audit P2 #15–17)
- **`InfoTip`** bilingual glossary ⓘ on the CosmicNowDial telemetry plate (tithi/nakshatra/yoga/rahuKaal/ayanamsha).
- **`FirstSessionChecklist`** (dismissible, client-only): Kundali → परिवार → morning digest, live completion from the vault, refocus re-check.
- **Analytics**: `analytics.trackOnce()` + first-visit stamp → `FIRST_KUNDALI_GENERATED` with `ttfvMs`; plus `PROFILE_SAVED`, `CHECKLIST_TASK_CLICKED`, `ASK_STEP_VIEWED` (step funnel).
- Hero video **poster-only ≤768px** (saves 9.7 MB on mobile), `preload="metadata"`.

## 2. How to run it

```bash
npm install && npm run dev
# Walk: / (empty profile) → generate Kundali → refresh (chart persists)
#       /ask 3 steps → /dashboard empty state → mobile viewport (390px) bottom nav
npx playwright test tests/consultation-flow.spec.ts   # updated for 3-step /ask
npx playwright test tests/mobile-clickability.spec.ts tests/shell-integrity.spec.ts
npx tsc --noEmit    # src/ is clean
```

## 3. Known limitations / deliberate non-goals (not blockers)

1. **Playwright not run in the sandbox** (no browser binaries) — the two specs above must be run locally; `consultation-flow.spec.ts` was rewritten to walk the new steps.
2. `next build` stops at the **pre-existing** `src/lib/db.ts` Prisma type error when `prisma generate` can't run (sandbox network block); fine where Prisma binaries are reachable. Webpack compile of all components succeeds.
3. WhatsApp share is **text-card** (Web Share/wa.me) — the `html2canvas` image card, real digest delivery, OTP accounts, A/B infra, and a ≤2 MB compressed hero video remain open (audit §5, ⬜ items 16/18/19 + #14 note).
4. Bottom nav is hidden ≥`md`; mega-menu remains the desktop IA. `tests/mobile-clickability.spec.ts` hamburger expectations should still pass (menu unchanged).

## 4. Suggested review lens

- Does any change regress the **PANDIT/presentation shell modes**? (`MobileBottomNav` renders only for `shellMode === 'public'`.)
- Any hydration mismatch risk from the new client-only components? (Checklist/InfoTip guard with mounted flags / SSR-safe markup.)
- Is the `/ask` payment path byte-equivalent in behaviour to the old single-page form (create → Razorpay → verify → redirect)?

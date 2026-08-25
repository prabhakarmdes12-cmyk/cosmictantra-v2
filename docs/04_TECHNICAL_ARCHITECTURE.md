# ⚙️ COSMICTANTRA — TECHNICAL ARCHITECTURE & ENGINE MANUAL
**Stack**: Next.js 14.2 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL
**Design Standard**: Chiti Technologies Unified Design System v3

---

## 1. 🏗️ ARCHITECTURAL STACK & SYSTEM TOPOLOGY

```
                                  [ CLIENT TIER ]
             Next.js 14 App Router (React 18 SSR + Deterministic Hydration)
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
       [ EPHEMERIS ENGINES ]                           [ EDGE API ROUTES ]
       • Canonical Astrology Engine                    • /api/astrology/consultations
       • Meeus IAU-76 Solar/Lunar                      • /api/astrology/payments/webhook
       • Lahiri Sidereal Ephemeris                     • /api/delivery/send (WhatsApp)
       • Vimshottari 120-Year Dasha                    • /api/profile (OTP Auth)
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                 [ DATA & STORAGE ]
                         Prisma ORM + Neon PostgreSQL
```

---

## 2. 🌌 ASTRONOMICAL COMPUTATION FORMULAS

### A. Sidereal Lahiri Ayanamsha (Chitra Paksha)
The true sidereal position $\lambda_{\text{sidereal}}$ of any celestial body is derived from tropical apparent longitude $\lambda_{\text{tropical}}$:

$$\lambda_{\text{sidereal}} = (\lambda_{\text{tropical}} - \Delta\psi_{\text{Lahiri}}) \pmod{360^\circ}$$

Where the Lahiri ayanamsha $\Delta\psi_{\text{Lahiri}}$ is computed via the standard IAU precession formula anchored to the epoch $J2000.0$:

$$\Delta\psi_{\text{Lahiri}}(T) = 23^\circ 51' 11'' + 5029.0966'' T + 1.1116'' T^2$$
*(where $T = \frac{\text{JD} - 2451545.0}{36525}$ is Julian centuries from J2000.0).*

### B. Ascendant (Lagna) Calculation
The Ascendant degree $\lambda_{\text{Asc}}$ is computed using the local sidereal time $\theta_{\text{LST}}$ and observer latitude $\phi$:

$$\tan \lambda_{\text{Asc}} = \frac{-\cos \theta_{\text{LST}}}{\sin \epsilon \tan \phi + \cos \epsilon \sin \theta_{\text{LST}}}$$

Validated to within **$\pm 0.01^\circ$ precision** against Swiss Ephemeris golden baselines in `tests/astrology.spec.ts`.

---

## 3. 🛡️ SECURITY, DPDP COMPLIANCE & PRIVACY

1. **PII Masking Invariant**: Anonymous and unauthenticated API endpoints return masked PII:
   - `customerName`: `"Varanasi S***"`
   - `customerPhone`: `"+91****55"`
   - `customerEmail`: `"pr***@gmail.com"`
2. **Webhook Signature Verification**: Razorpay payment webhooks are authorized via HMAC-SHA256 constant-time comparison (`crypto.timingSafeEqual`) in `src/app/api/astrology/payments/webhook/route.ts`.
3. **Fail-Closed Secrets**: Fallback demo secrets are disabled in production runtime; missing environment variables trigger hard termination rather than silent pass-through.
4. **Zero Client-Side Ephemeris Drift**: All ephemeris data is computed deterministically with integer day indexing.

---

## 4. 🧪 TESTING & VERIFICATION QUALITY GATES

* **Golden Invariant Suite (`tests/astrology.spec.ts`)**: 2 canonical benchmark test cases verifying planetary degrees, signs, houses, and nakshatra objects.
* **Feature Engines Suite (`tests/features.spec.ts`)**: 12 deterministic test suites for Chaldean Numerology, 36-Point Kundali Milan, Mangal Dosha, and Vedic ICS calendar outputs.
* **Responsive Multi-Viewport Suite (`tests/responsive.spec.ts`)**: 9 viewports (320px to 1440px) verifying zero horizontal overflow, reachable CTAs, and mobile navigation drawer.

---
*CosmicTantra Technologies Pvt. Ltd. · Technical Specification*

# COSMICTANTRA — LAUNCH GAPS & PRE-RELEASE CHECKLIST

Prior to commercial launch, the following operational and technical gaps must be resolved:

---

## 1. Core Technical & Infrastructure Gaps

| Category | Gap Description | Resolution Path | Target Milestone |
| :--- | :--- | :--- | :--- |
| **Dynamic Festival Rules** | Current festivals rely on hardcoded 2026 dates (`src/lib/festivals.js`). | Build dynamic Tithi + Sunrise boundary rule engine for automated multi-year calculation. | Sprint E |
| **WebRTC TURN Server** | WebRTC voice calls use fallback STUN/TURN credentials. | Configure dedicated, high-concurrency production TURN cluster (e.g. Coturn / Xirsys). | Sprint E |
| **Pandit Onboarding** | Pandit directory relies on seed data (`src/lib/practitioners.js`). | Complete production practitioner verification portal and KYC document upload flow. | Pre-Launch |
| **Production Webhook Secrets**| Payment webhooks use development test endpoints. | Secure Razorpay production secret keys in environment configuration. | Pre-Launch |

---

## 2. Validation & Compliance Checklist

- [x] **0 TypeScript Errors**: Verified clean build via `npx tsc --noEmit`.
- [x] **Shodashavarga Qualified**: Certified D1–D60 against 3,420 BPHS boundary probes.
- [ ] **Pandit Beta Testing**: Conduct live call test sessions with 5 onboarded BHU scholars.
- [ ] **Data Deletion API**: Provide automated GDPR/DPDP compliant profile & birth chart deletion.

# ⚙️ COSMICTANTRA — TECHNICAL ARCHITECTURE & ENGINE MANUAL
**Stack**: Next.js 14.2 (App Router) · TypeScript · Tailwind CSS v4 · WebRTC · Exotel PSTN · Prisma + PostgreSQL
**Design Standard**: Chiti Technologies Unified Design System v3

---

## 1. 🏗️ SYSTEM TOPOLOGY & COMPONENT TOPOGRAPHY

```text
                                      [ DEVOTEE / SCHOLAR CLIENT TIER ]
                         Next.js 14 App Router (React 18 SSR + Deterministic Hydration)
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             │                                               │
               [ REAL-TIME SABHA ENGINE ]                           [ VEDIC AI GATEWAY ]
               • WebRTC Audio/Video (LiveKit)                       • Provider-Agnostic Gateway
               • Exotel Masked PSTN Bridge                          • Multi-Tier: Free / Flash / Local
               • Semantic Event Sync (DataChannel)                  • Deterministic Tool Executor
               • Durable Consultation Vault                         • 17 Scripture Wisdom Matcher
                             │                                               │
                             └───────────────────────┬───────────────────────┘
                                                     │
                                             [ EPHEMERIS ENGINES ]
                                             • Meeus IAU-76 Solar/Lunar
                                             • Lahiri Sidereal Ephemeris
                                             • 120-Year Vimshottari Progression
                                             • 12-Language Multi-Lingual Proxy
                                                     │
                                             [ DATA & STORAGE ]
                                             Prisma ORM + PostgreSQL / Devotee Vault
```

---

## 2. 📡 COSMICTANTRA SABHA CONSULTATION RUNTIME

### A. Semantic Event-Based Chart Synchronization
Rather than heavy screen sharing, CosmicTantra transmits lightweight JSON events over WebRTC DataChannels or WebSockets:
```json
{
  "event": "BHAVA_FOCUS",
  "sessionId": "CT-2026-0825-001",
  "target": { "bhavaNumber": 10 }
}
```
The seeker's client receives the payload and animates a golden aura over the 10th House in real-time with **< 20ms latency** and **near-zero bandwidth consumption**.

### B. Poor-Network Dynamic Handover
The client monitors WebRTC connection quality (RTT, jitter, packet loss). When degraded:
```text
WebRTC Connection Unstable
      ↓
Trigger 1-Click Handover: [Switch to Private Phone Call]
      ↓
Exotel REST API Initiates Two-Legged PSTN Call:
  • Leg 1: Dial Seeker Mobile (+91 98765*****10)
  • Leg 2: Dial Scholar Mobile (+91 94150*****22)
  • CLI: Masked Company DID (080-XXXX-XXXX)
      ↓
Both Parties Connect Privately on Same Session, Timer, and Notes
```

### C. Durable Consultation Memory & Retrieval
Every completed session stores a structured `ConsultationRecord`. When **Kashi Sahayak AI** receives a query about past consultations, it invokes `retrieveDurableConsultationMemory(query, cosmicId)` to return the verified scholar observations and prescribed remedies without hallucination.

---

## 3. 🌌 ASTRONOMICAL COMPUTATION ENGINES

### Sidereal Lahiri Ayanamsha (Chitra Paksha)
$$\lambda_{\text{sidereal}} = (\lambda_{\text{tropical}} - \Delta\psi_{\text{Lahiri}}) \pmod{360^\circ}$$
Where $\Delta\psi_{\text{Lahiri}}$ is computed via IAU precession formulas from J2000.0.

### Ascendant (Lagna) Computation
$$\tan \lambda_{\text{Asc}} = \frac{-\cos \theta_{\text{LST}}}{\sin \epsilon \tan \phi + \cos \epsilon \sin \theta_{\text{LST}}}$$

---

## 4. 🛡️ SECURITY, PRIVACY & DPDP COMPLIANCE

1. **PII Masking**: Anonymous and unauthenticated API endpoints return masked phone numbers (`+91 98765*****10`).
2. **Audio Recording Privacy**: Voice and video recording is **OFF by default**, requiring explicit dual-participant consent.
3. **Webhook Verification**: Payment and telephony webhooks are authorized via HMAC-SHA256 constant-time verification.

---
*CosmicTantra Technologies Pvt. Ltd. · Technical Specification 2026*

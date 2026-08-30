# 📋 COSMICTANTRA — COMPLETE PRODUCT SPECIFICATION (PRD)
**Version**: 3.1.0 · **Architecture**: Next.js 14 App Router · **State Engine**: CosmicTantra Consultation OS
**Design Standard**: Chiti Technologies Unified Design System v3

---

## CURRENT CUSTOMER EXPERIENCE BASELINE — 30 AUGUST 2026

The public information architecture now prioritizes three intents: **Understand today**, **Understand my chart**, and **Ask an expert**. The home page retains access to Calendar, Kundali Milan, Personal Muhurat, and the Vedic Library through a compact Explore section instead of rendering the complete product catalogue at once.

Customer-facing mobile surfaces use a 16px body-copy baseline and 44px minimum control height. Master Kundli exports support English and Hindi, including embedded licensed Noto Sans Devanagari Regular/Bold fonts, automatic wrapping, multi-page headers, page numbers, technical provenance, and graceful font-fetch fallback.

---

## 1. 🌟 CORE PRODUCT VISION
To build the world’s most precise, culturally authentic, and technologically defensible **Vedic Astronomical Observatory & Vertical Consultation Operating System**, seamlessly uniting classical Sanskrit scholarship with modern real-time WebRTC/PSTN communication and vernacular AI intelligence.

---

## 2. 👥 CORE USER PERSONAS

| Persona | Demographics & Context | Primary Need & Flow |
|---|---|---|
| **The Traditional Family Head (Karta)** | 42–65, Tier 1/2/3, manages family welfare, values Varanasi tradition. | Daily Panchang, Rahu Kaal avoidance, Parivaar Family Panchang, Family-Assisted Consultation booking. |
| **The Ambitious Urban Seeker** | 24–40, Metro/Tier-1, career crossroads, financial decisions. | ₹501 Written Folio PDF, ₹1,100 Web Sabha interactive session, 120-Year Vimshottari Dasha River. |
| **The Devout Daily Sadhak** | 30–70, Pan-India & NRI diaspora, daily puja & mantra practice. | 50 Aarti & Stotra Library, Daily Japa Counter & 108 Mala, Live Temple Darshan & Deepa Daan. |
| **The Verified Vedic Scholar (Pandit)** | 35–70, Varanasi / Haridwar / Mithila, Sanskrit scholar. | Pandit Verification Workbench, Live Sabha Cockpit with AI Copilot, 1-click Upaya prescribing. |

---

## 3. 🏛️ COSMICTANTRA SABHA (CONSULTATION OS ARCHITECTURE)

```text
COSMICTANTRA SABHA
Devotee Books Consultation
      │
      ▼
Payment + Consent + Slot Reservation (₹501 / ₹1,100 / ₹1,500)
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│                 CONSULTATION ORCHESTRATOR                     │
│  Profile • Kundali • Question • Language • Scholar • Channel  │
└───────────────────────────────┬───────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
   WEB SABHA               PHONE SABHA             VIDEO SABHA
In-Browser WebRTC       Exotel Masked PSTN       WebRTC Video +
 (Zero number shared)    (Calls mobile directly)  Interactive Chart
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                        SCHOLAR WORKSPACE
                 Live Cockpit with AI Copilot
                                │
                                ▼
                       SESSION ARTIFACTS
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Written Folio            Upaya Card           Muhurat Timeline
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                        COSMIC ID VAULT
              Durable Consultation Memory for AI
```

### 6 Core Service Primitives:
1. **प्रश्न (Prashna - ₹501)**: One focused written folio PDF signed by verified scholar.
2. **वाणी (Vaani - ₹1,100)**: 20-minute private voice consultation via WebRTC or masked PSTN.
3. **सभा (Sabha - ₹1,100)**: 20-minute interactive chart consultation with semantic co-browsing.
4. **दर्शन (Darshan - ₹1,500)**: 20-minute high-definition video consultation with chart overlay.
5. **अनुष्ठान (Anushthan - Custom)**: Sacred ritual booking & live Sankalpa streaming.
6. **पुनः परामर्श (Punah Paramarsh - Follow-up)**: Dedicated progress review.

---

## 4. 🤖 VEDIC AI GATEWAY & KASHI SAHAYAK (`src/lib/ai/`)

### A. Modular AI Topology
- **`gateway.ts`**: Central orchestrator managing model tiering, safety, tools, and scripture lookup.
- **`providers/`**: Provider-independent abstraction supporting OpenRouter, Gemini, and Local LLMs (Ollama `gemma:2b`, `mistral`).
- **`safety/boundaries.ts`**: Strict Vedic safety boundaries blocking fatalistic death predictions, black magic, and gambling.
- **`tools/`**: Deterministic tool execution for Panchang, Temple Darshan, Kashi Journey, Mantras, and Muhurta.

### B. Sacred Scripture Wisdom Map (17 Life Situations)
Maps seeker emotional states and dilemmas to authentic verses from **श्रीमद्भगवद्गीता**, **श्रीरामचरितमानस**, **ऋग्वेद**, **उपनिषद्**, and **चाणक्य नीति**:
1. *Sadness & Grief* (Gita 2.14)
2. *Future Anxiety* (Ramcharitmanas Ayodhya Kanda)
3. *Career Stress & Effort* (Gita 2.47)
4. *Low Confidence & Helplessness* (Ramcharitmanas Sundarkanda)
5. *Relationship Betrayal & Pain* (Ramcharitmanas Aranya Kanda)
6. *Health & Disease Protection* (Rigveda 7.59.12 • Mahamrityunjaya)
7. *Spiritual Surrender & Peace* (Gita 18.66)
8. *Financial Stress & Debt* (Gita 9.22)
9. *Anger & Restlessness* (Gita 2.63)
10. *Family Discord & Unity* (Atharvaveda 3.30.1 • Sammanasya Sukta)
11. *Dharma Crisis & Ethical Dilemma* (Gita 6.5)
12. *Enemies, Envy & Evil Eye* (Ramcharitmanas Uttarkanda)
13. *Loneliness & Isolation* (Gita 9.18)
14. *Procrastination & Laziness* (Chanakya Niti 2)
15. *Addiction & Sensory Traps* (Katha Upanishad 1.3.3)
16. *Parenting & Children's Future* (Taittiriya Upanishad Shikshavalli)
17. *Success & Gratitude* (Isha Upanishad 1)

---

## 5. 🌐 12 PRIME INDIAN LANGUAGES ARCHITECTURE

CosmicTantra natively supports **12 languages** with native script UI, regional almanac traditions, and ES6 Proxy safe fallback:
- **Sanskrit (संस्कृतम्)**
- **Hindi (हिन्दी)**
- **Tamil (தமிழ்)**
- **Telugu (తెలుగు)**
- **Kannada (ಕನ್ನಡ)**
- **Malayalam (മലയാളം)**
- **Bengali (বাংলা)**
- **Marathi (मराठी)**
- **Gujarati (ગુજરાતી)**
- **Odia (ଓଡ଼ିଆ)**
- **Punjabi (ਪੰਜਾਬੀ)**
- **English**

---

## 6. 🗺️ 21 CORE SURFACE ROUTES

1. **`/`** — Focused three-intent home: today, Master Kundli, and expert guidance, with compact Explore access.
2. **`/daily`** — Location-specific astrological weather & 9:16 WhatsApp cards.
3. **`/family-panchang`** — Multi-profile synchronized family diurnal intelligence.
4. **`/kundali-milan`** — Ashta-Koota 36-point compatibility & Mangal Dosha studio.
5. **`/numerology/*`** — Chaldean & Pythagorean Name, Mobile, Baby, and Business calculators.
6. **`/aarti-stotra`** — 50 Verified Sanskrit Mahagranthas, Aartis, and Stotras.
7. **`/upaya` & `/upaya/book`** — Chart-aligned planetary remedy engine.
8. **`/remedy-tracker`** — 108 Japa Mala counter with sensory sound feedback.
9. **`/my-calendar`** — Personalized lunar calendar & ICS sync.
10. **`/darshan`** — Live Temple Darshan, 12 Jyotirlingas, 52 Shakti Peeths, and Ganga Aarti.
11. **`/store`** — Consecrated Vedic Pooja Samagri & Samidha catalog.
12. **`/observatory`** — Stellarium celestial sky canvas with LST & Graha Sphuta.
13. **`/profile`** — Parivaar & Devotee Vault with DPDP export and alerts.
14. **`/presentation`** — Interactive scholar and institutional deck.
15. **`/pandit/workspace`** — Scholar workbench & CosmicTantra Sabha Cockpit.
16. **`/report`** — 17-volume Master Kundli with detailed English/Hindi Unicode PDF generation.
17. **`/api/guru/chat` & `/api/ai/chat`** — Kashi Sahayak AI Gateway endpoints.

---
*CosmicTantra Technologies Pvt. Ltd. · Product Specification 2026*

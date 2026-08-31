# 🕉️ CosmicTantra — Classical Ephemeris & Vertical Jyotish Consultation OS

> **The Sacred India Graph & Classical Vedic Observatory for 450 Million Indians.**  
> Grounded in sub-arcminute astronomical computation, **CosmicTantra Sabha (कॉस्मिकतंत्र सभा)**, **17 Sacred Scripture Mappings**, and **12 Prime Indian Languages**.

---

## Current Release — 31 August 2026

The reviewed agent release adds the validated Kundli PDF pipeline, report day/night mode,
remedy tracking, a coming-soon store, expanded devotional texts, and Kashi Sahayak voice
and multilingual intent handling. Review fixes correct chart geometry, PDF table backgrounds,
page-break font preservation, Windows PDF worker URLs, and the strict build command.

See [31 August release review](docs/RELEASE-REVIEW-2026-08-31.md) for checks and known limitations.
The current home first-load bundle is approximately 222 KB. Hindi names and invocation render
in PDFs, but the new pipeline's narrative remains predominantly English; full Hindi translation
is not yet verified or complete.

### Previous release — 30 August 2026

The current release focuses the public experience around three clear user intents:

1. **Understand today** — location-aware Panchang and daily guidance.
2. **Understand my chart** — create or open a Master Kundli.
3. **Ask an expert** — one consultation route at `/ask`.

Recent production-ready changes:

- simplified the home page from 90 visible buttons to 10 while retaining deeper tools under Explore;
- reduced the home first-load bundle from 243 KB to 193 KB;
- established a 16px mobile reading baseline and 44px interactive target baseline;
- simplified the public header and footer and removed duplicate consultation/help actions;
- added language-aware detailed Master Kundli PDFs;
- embedded licensed Noto Sans Devanagari Regular and Bold fonts in Hindi PDFs;
- added cached, chunked, browser-safe font loading with graceful fallback;
- resolved home-page hydration mismatches caused by live date calculations.

Implementation history: `14edd75` → `871ec59` → `0c35727`.

See [the UX simplification audit](docs/UX-SIMPLIFICATION-AUDIT.md) for measured before/after results.

---

## 🌟 What is CosmicTantra?

CosmicTantra is an atmospheric digital observatory and vertical consultation operating system replacing predatory "per-minute call timer apps" with:
- **CosmicTantra Sabha (कॉस्मिकतंत्र सभा)**: Private consultations via in-browser WebRTC (Web Sabha) and licensed Exotel masked PSTN (Phone Sabha) with semantic chart co-browsing and AI Copilot.
- **Kashi Sahayak AI Gateway (`src/lib/ai/`)**: Provider-agnostic conversational intelligence grounded in authentic scriptures and deterministic astronomical tools.
- **17 Sacred Scripture Mappings**: Connects life situations (grief, future anxiety, career dilemmas, family disputes) to exact verses from **श्रीमद्भगवद्गीता**, **श्रीरामचरितमानस**, **ऋग्वेद**, **उपनिषद्**, and **चाणक्य नीति**.
- **12 Prime Indian Languages**: Sanskrit, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Odia, Punjabi, and English.
- **Durable Consultation Memory**: Longitudinal spiritual records under unique **Cosmic ID** for lifelong continuity.

---

## 🚀 Key Modules & Surface Routes

| Surface | Description | Route |
|---|---|---|
| **Living Vedic Observatory** | Focused entry to today, Master Kundli, expert guidance, and Explore tools | `/` |
| **CosmicTantra Sabha** | Unified consultation intake and guidance route | `/ask` |
| **Master Kundli Report** | 17-volume report with detailed English/Hindi PDF export and Unicode Devanagari fonts | `/report` |
| **Pandit Workspace & Cockpit** | Scholar workbench with live chart sync, AI Copilot, and Upaya prescribing | `/pandit/workspace` |
| **Live Temple Darshan** | 12 Jyotirlingas, 52 Shakti Peeths, Char Dham & Dashashwamedh Ganga Aarti | `/darshan` |
| **Stellarium Observatory** | Celestial canvas with Local Sidereal Time (LST) & Graha Sphuta | `/observatory` |
| **Vedic Pooja Store** | Coming soon; no live checkout until suppliers are finalized | `/store` |
| **Aarti & Stotra Library** | 50 Verified Classical Sanskrit Mahagranthas, Aartis, and Stotras | `/aarti-stotra` |
| **Devotee & Parivaar Vault** | Multi-profile management, DPDP compliance, and consultation history | `/profile` |

---

## 🧪 Testing & Verification

```bash
# Type check with zero errors
npm run typecheck

# Production build (includes Prisma generation)
npm run build

# Run full end-to-end Playwright integrity test suite
npx playwright test tests/shell-integrity.spec.ts --workers=1
```

---
*© 2026 CosmicTantra Technologies Pvt. Ltd. All Rights Reserved.*

# 🔱 CosmicTantra — Pandit-Ready Visual Polish, Tone Elevation & Beautification Guide
## The Definitive Directive for Scholar-Grade Dignity, Daylight-Default Aesthetics & ₹501 Auspicious Dakshina

> **Objective:** Prepare CosmicTantra for direct presentation to our Founding Practitioner (Pandit Ji, Banaras Hindu University / Sampurnanand Tradition).  
> **Core Directives:**
> 1. **Default Daylight Theme:** Sacred Ivory / Parchment (`#FAF7F2`) with warm brass & temple gold accents.
> 2. **Auspicious Pricing:** Base written consultation honorarium elevated to **₹501 (शुभ दक्षिणा)**.
> 3. **High-Contrast Typography:** WCAG AAA readability for senior scholars and seekers.
> 4. **Elevated Vedic Tone:** Revering classical Jyotish as an inspectable navigational science, stripping away commercial marketplace jargon.
> 5. **Full Hindi Devanagari Parity:** Flawless Sanskrit/Hindi terminology across all calculators, cards, and reports.

---

## 🏛️ 1. Base Pricing: ₹501 Auspicious Dakshina (शुभ दक्षिणा)

In traditional Indian Jyotish, fees are received as **Shubh Dakshina (शुभ दक्षिणा — ₹५०१)** rather than commercial commodity pricing.

```
═══════════════════════════════════════════════════════════════════════════════════════════
 DIMENSION               OLD PRICING                     PANDIT-READY ANCHOR
═══════════════════════════════════════════════════════════════════════════════════════════
 Base Consultation       ₹199                            ₹501 (शुभ दक्षिणा ₹५०१)
 Database Default        pricePerSession: 199            pricePerSession: 501
                         amount: 199                     amount: 501
 Razorpay Paise Unit     19900 paise                     50100 paise
 Tone Descriptor         "Buy consultation"              "Request Scholarly Written Folio"
                         "Checkout"                      "Confirm Life Inquiry & Dakshina"
═══════════════════════════════════════════════════════════════════════════════════════════
```

### Key Files Updated:
- `prisma/schema.prisma`: `AstrologyConsultant.pricePerSession` (501), `AstrologyConsultation.amount` (501).
- `src/lib/translations.js`: All English `₹501` and Hindi `₹५०१` strings.
- `src/components/ConsultationModal.jsx`: Razorpay order amount `50100` paise.
- `src/components/ConsultationOffer.jsx`: Pricing card headers and deliverables breakdown.
- `src/app/ask/page.tsx` & `src/app/page.tsx`: Section headers and CTAs.

---

## ☀️ 2. Daylight (Light Mode) as Default Aesthetic

Pandit Ji and traditional seekers read best in **luminous, clean daylight conditions**. The default aesthetic represents sacred Banaras morning light (*Pratah Sandhya* over Ganga ghats).

### Color Palette Tokens (Tailwind & CSS Variables):

```css
/* Sacred Daylight Palette (Default) */
:root {
  --bg-deep: #FAF7F2;          /* Sacred Temple Parchment */
  --bg-mid: #F4EFE6;           /* Sandalwood / Ivory Surface */
  --bg-card: rgba(255, 255, 255, 0.95);
  --border-subtle: rgba(142, 111, 29, 0.22); /* Temple Brass Gold */
  
  --text-main: #1C1917;        /* Deep Stone Charcoal (WCAG AAA Contrast > 14:1) */
  --text-body: #44403C;        /* Warm Dark Slate */
  --text-muted: #665E55;       /* Earth Ochre Muted */
  
  --accent-gold: #8E6F1D;      /* Deep Banaras Gold */
  --accent-saffron: #9A3412;   /* Auspicious Sindoor / Saffron */
  --accent-emerald: #065F46;   /* Shubh Green (Tithi/Abhijit) */
  --accent-vermilion: #991B1B; /* Rahu Kaal Warning */
}
```

### Strict Contrast Rules (Never Use):
- ❌ Do **not** use light gray text (e.g. `#A8A29E`, `#D6D3D1`) on light backgrounds.
- ❌ Do **not** use pale yellow text on white cards.
- ✅ Always use `--text-main` (`#1C1917`) for headlines and numbers.
- ✅ Always use `--text-body` (`#44403C`) for descriptions and body copy.
- ✅ Always use bold saffron (`#9A3412`) or deep gold (`#8E6F1D`) for badges and timestamps.

---

## 📿 3. Elevated Editorial Tone & Lexicon Matrix

Ensure every word presented to Pandit Ji reflects **Shastric Dignity and Intellectual Rigor**:

```
═══════════════════════════════════════════════════════════════════════════════════════════
 AVOID (COMMERCIAL NOISE)                 USE INSTEAD (VEDIC SCHOLARLY DIGNITY)
═══════════════════════════════════════════════════════════════════════════════════════════
 "Astrology reading"                      "Vedic Decision Synthesis (विद्वत्-विवेचना)"
 "Buy report"                             "Receive Written Folio (लिखित परामर्श पत्र)"
 "Checkout / Pay"                         "Offer Shubh Dakshina (शुभ दक्षिणा ₹५०१)"
 "Customer / User"                        "Seeker / Inquirer (जिज्ञासु)"
 "Predictions / Fortune"                  "Ephemeris Indications (खगोलीय संरेखण)"
 "Astrologer call per min"                "Permanent Written Counsel (अक्षुण्ण लिखित परामर्श)"
 "Remedies / Magic fixes"                 "Satvik Upaya & Mantra Alignment (सात्त्विक उपाय)"
 "Good / Bad Luck"                        "High Harmony / Caution Interval (शुभ वेला / वर्ज्य काल)"
═══════════════════════════════════════════════════════════════════════════════════════════
```

---

## 🌐 4. Comprehensive Language & Terminology Parity

### 4.1 Hindi Devanagari Terminology Standard:
- **Panchang 5 Limbs:** तिथि (Tithi), वार (Vaara), नक्षत्र (Nakshatra), योग (Yoga), करण (Karana).
- **Ascendant & Houses:** लग्न (Lagna / Ascendant), भाव (Bhavas), ग्रह स्पष्ट (Graha Sphuta), कारक (Karakas).
- **Dasha Progression:** विंशोत्तरी दशा (Vimshottari Dasha), महादशा (Mahadasha), अन्तर्दशा (Antardasha).
- **Muhurat Attributes:** अभिजित मुहूर्त (Abhijit), राहुकाल (Rahu Kaal), चौघड़िया (Choghadiya), अमृत/शुभ (Amrit/Shubh).

### 4.2 Regional Traditions Framework:
When expanding to regional languages:
- **Eastern / Bengal:** Panjika conventions, Tithi sunrise rules.
- **Southern / Tamil Nadu:** Vakya vs Drik Panchangam terminologies, Rahu Kaalam & Yamagandam.
- **Western / Gujarat & Maharashtra:** Choghadiya-primary daily decision rhythms.

---

## 🎨 5. Beautification Opportunities for the Frontend Agent

### Opportunity 1: Sacred Geometry Brass Card Accents
- On all major cards (`TodayAtAGlance`, `KundaliExperience`, `DashaHero`, `DailyCosmicCard`):
  - Add subtle dual-line gold borders: `border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30`.
  - Add delicate traditional corner flourishes or stepped-ghat notch corners.

### Opportunity 2: Hero Section Morning Glow
- In Daylight mode, enhance the background gradient to emulate morning sunrise over the Ganges:
  `bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F2] to-[#F5EEDC]`
- Ensure the background video of Varanasi Ghats shines through with `opacity-80` in light mode.

### Opportunity 3: High-Resolution 9:16 WhatsApp Shareable Cards
- On the Panchang and Muhurat pages, the `Share` button triggers a downloadable 9:16 vertical card with:
  - Varanasi Sanskrit Masthead (*श्री काशी विश्वनाथो विजयते*)
  - Today's Tithi, Nakshatra, Sunrise, Rahu Kaal, and Abhijit Window
  - Beautiful gold seal: *Calculated by CosmicTantra • Lahiri Ephemeris*.

### Opportunity 4: Interactive Astrological Proof Accordions
- Add an expandable *"खगोलीय प्रमाण (Astronomical Proof)"* drawer on all Muhurat and Daily forecast cards, displaying:
  - Exact Julian Day Number
  - Lahiri Ayanamsha value (e.g. `24° 16' 42"`)
  - Local Sidereal Time (LST) and Geographic Coordinates.

---

## 🔒 6. Invariant Verification Checklist

Any incoming PR must satisfy:
- [ ] `npx playwright test` $\rightarrow$ **23/23 tests pass**.
- [ ] `npx tsc --noEmit` $\rightarrow$ **0 type errors**.
- [ ] `npm run build` $\rightarrow$ **81/81 routes compile**.
- [ ] Base price is consistently **₹501** across UI, Server Actions, and DB.
- [ ] Default theme is **Daylight (`light`)** across first loads.
- [ ] Text contrast meets **WCAG AAA** on all light-mode cards.

---
*Authored for CosmicTantra Engineering & Design Excellence — August 2026*

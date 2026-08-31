# पंडित जी समीक्षा पत्र • Pandit Ji Review Sheet

**Product:** CosmicTantra Master Kundli (screen + PDF) — प्रमाणित वैदिक कुण्डली
**Status:** Ready for scholar review — सभी गेट उत्तीर्ण (GATE 1–4 PASS)
**Date:** 2026-08-31

---

## 1. What is being reviewed • क्या समीक्षा होगी

| Item | Where |
|---|---|
| 17-Volume Kundli (screen) | `https://cosmictantra.chiti.tech/report` → "17-Volume Book" tab |
| Master Kundli PDF (6 pages) | "DOWNLOAD PDF" button on the same page |
| Review artifact | `scratch/pandit-review/Kundli_Prabhakar_Sharma_1989-05-26.pdf` (577 KB) |

## 2. Birth data used • प्रयुक्त जन्म विवरण (sample/demo)

| Field | Value |
|---|---|
| Name | Prabhakar Sharma (नमूना प्रोफ़ाइल — sample data, not a real devotee) |
| Birth date | 1989-05-26 |
| Birth time | 02:20:30 (recorded; ephemeris computed to the minute) |
| Place | Bilaspur, Chhattisgarh, India |
| Coordinates | 22.0797° N, 82.1391° E |
| Timezone | UTC+05:30 |

> Note: this is the **demo profile** used to validate structure, calculations and language.
> A real devotee review uses the devotee's own birth details via the same page.

## 3. Configuration under review (traceable) • विन्यास

Zodiac: **Sidereal** · Ayanamsha: **Lahiri** · House system: **Equal (whole-sign)** ·
Node mode: **Mean node** · Ephemeris: **CosmicTantra engine (astronomy-engine)**
· Engine version + calculation version printed in the PDF ("Calculation Standard").
Birth time precision: minute (recorded seconds retained). Julian day printed.

## 4. Pandit verification checklist • जाँच-सूची

### A. Birth summary & panchanga (PDF page 1 / Volume I)
- [ ] Name, date, time, place match the input exactly (time must read `02:20:30`)
- [ ] Tithi, Vara, Nakshatra (with pada), Yoga, Karana — verify against a 1989-05-26 panchanga
- [ ] Masa (Amanta/Purnimanta month name), Ritu, Ayana correct for the date

### B. Lagna & planetary positions (Volume II / "Kundli at a Glance")
- [ ] Lagna rashi + degree — verify with the given coordinates/time
- [ ] All 9 grahas: longitude, rashi, nakshatra + pada, degree
- [ ] Retrograde flags and combustion statuses correct
- [ ] House assignments match whole-sign convention

### C. Dasha system (Volume XVI / timeline)
- [ ] Vimshottari 120-year timeline: balance at birth, Mahadasha order & dates
- [ ] Current Mahadasha/Antardasha shown matches today's date (2026-08-31)
- [ ] Antardasha sub-periods (Pratyantar) correct
- [ ] Sade Sati phase (if any) correctly identified for Moon's sign

### D. Yogas & Doshas (Volume X / XI)
- [ ] Manglik (Mangal dosha) evaluation matches classical rules
- [ ] Any Panchanga/Parihara yoga statements are traditionally worded
- [ ] No AI-invented or modern-only concepts presented as classical

### E. The 17 volumes — traditional language & completeness
- [ ] Volume titles + Sanskrit subtitles (e.g. जीवन रेखा, वर्षफल) correctly spelled
- [ ] Every volume opens and shows full content (17 headers, tap to open; Volume I open)
- [ ] No clipped text at 390px mobile width
- [ ] Terminology in Hindi/Sanskrit matches traditional usage (not literal translations)
- [ ] Disclaimers present and appropriately humble about prediction limits

### F. PDF quality (download and open)
- [ ] 6 pages, no blank pages
- [ ] Cover: श्री गणेशाय नमः + Ganesh emblem left + CosmicTantra symbol right
- [ ] Website `www.cosmictantra.chiti.tech` in footer
- [ ] Devanagari renders correctly (not boxes/tofu)
- [ ] All 7 mandatory sections present: Birth Summary, Calculation Standard,
      Panchanga, Planetary Positions, Vimshottari Dasha, Current Dasha Period, Disclaimer

## 5. Deterministic vs interpretive content • निर्धारक बनाम व्याख्यात्मक

- **Deterministic (never LLM):** all calculations — positions, dashas, yogas, doshas,
  panchanga, timeline. These are engine-computed from the birth data + config above.
- **Interpretive (Volume XVII only):** life-domain synthesis (career, wealth, etc.) is
  AI-assisted but grounded ONLY in the validated deterministic chart data; it never
  invents missing values. Please review it as guidance, not scripture.

## 6. How to report findings • निष्कर्ष कैसे दें

Use this format (or write freely in Hindi/English):

```
Section (e.g. "Volume II — Planetary Positions")
Issue: …
Expected: …  Actual: …
Severity: [Critical / Correction / Suggestion]
```

Send the filled sheet back and we will fix every item before launch.

---
*CosmicTantra • वैदिक खगोल शुद्धता — every number traceable to a documented configuration.*

# 🔍 CosmicTantra Calendar Audit (`CALENDAR_AUDIT.md`)

**Date**: September 7, 2026  
**Target System**: CosmicTantra Vedic Panchang & Monthly Calendar  
**Core Codebase**: `D:\Projects\cosmictantra-release-review`

---

## 1. Existing Codebase Architecture & Data Flow

### A. Astronomical & Panchang Engines
1. **`src/lib/panchangFactBundle.ts`**:
   - Primary Drik ephemeris bundle provider.
   - Computes 5 Panchang limbs (Tithi, Nakshatra, Yoga, Karana, Vara), planetary positions, Sunrise/Sunset, Rahu Kaal, and Abhijit Muhurat.
   - Supports location coordinates (Varanasi, Dhanbad, Delhi, Mumbai, Kolkata, Bengaluru, Ujjain, etc.).
2. **`src/lib/jyotish/celestialEngine.ts`**:
   - Calculates planetary longitudes, Lahiri Ayanamsha ($24^\circ 13' 40''$ for 2026), and solar/lunar ecliptic coordinates.
3. **`src/engines/monthlyPanchangEngine.ts`**:
   - Generates 30-day monthly grid items with festival resolution (`resolveFestivals`).
4. **`src/lib/panchang.js`**:
   - Native astronomical equations for Sun/Moon longitudes and Tithi transitions.

### B. UI Components & Pages
1. **`/calendar/page.tsx` & `AuraMonthlyCalendar.tsx`**:
   - Monthly grid component with month navigation and festival tags.
2. **`MyDaysPanchang.tsx` & `VedicDayRibbon.tsx`**:
   - Today view cards and ribbon telemetry.

---

## 2. Identified Visual & UX Gaps

| Area | Current State | Goal State (Per Design Brief) |
|---|---|---|
| **First Fold Viewport** | Requires 2–3 scrolls to reach calendar grid due to large hero banner | Calendar grid visible immediately in first fold (rows 1–3 visible on desktop) |
| **Festival Visual Storytelling** | Text-only tags without imagery | Rich event image artwork for major festivals (Ganesh Chaturthi, Navratri, Durga Ashtami, Sharad Purnima, etc.) |
| **Mobile Grid UX** | Spills or requires zooming | Compact 7-column grid with date number, moon phase indicator, event dot, and drawer/sheet for day details |
| **Information Density** | Mixes scholar math with novice view | Two distinct modes: **Novice Mode** (*"आज क्या करें? किससे बचें?"*) vs **Scholar Mode** (*Exact boundary timestamps, Ayanamsha, Choghadiya, Hora*) |
| **World Calendar Selector** | Limited to Lahiri Drik Panchang | Selector to switch between Drik Panchang, Saka Samvat, Bikram Sambat, Tamil Solar, Malayalam Kollam, Bengali San, Hijri & Gregorian |

---

## 3. Risk Register & Mitigation Strategy
- **Risk 1 (Performance)**: Pre-computing 30 days of astronomical data must be fast (< 50ms).  
  *Mitigation*: Use month-level memoization in `monthlyPanchangEngine.ts`.
- **Risk 2 (Timezone/DST)**: Location change must immediately trigger Sunrise & Tithi recomputation.  
  *Mitigation*: Pass `LocationCoordinates` object through React Context.

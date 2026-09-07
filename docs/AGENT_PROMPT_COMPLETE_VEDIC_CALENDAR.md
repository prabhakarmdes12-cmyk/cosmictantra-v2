# 🤖 Master Agent Instruction Prompt: Complete CosmicTantra Vedic Calendar System

**Mission Target Repository**: `D:\Projects\cosmictantra-release-review`  
**Reference Specification Documents**:
- [CALENDAR_AUDIT.md](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/CALENDAR_AUDIT.md)
- [CALENDAR_RULES.md](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/CALENDAR_RULES.md)
- [CALENDAR_UI_PLAN.md](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/CALENDAR_UI_PLAN.md)
- [EVENT_IMAGE_MANIFEST.json](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/EVENT_IMAGE_MANIFEST.json)
- [WORLD_CALENDAR_SYSTEMS.md](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/WORLD_CALENDAR_SYSTEMS.md)
- Mockup Designs: [media_1788796702294.jpg](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/.user_uploaded/media_1788796702294.jpg) & [media_1788796702306.jpg](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/.user_uploaded/media_1788796702306.jpg)

---

## 🎯 AGENT EXECUTIVE INSTRUCTION

You are tasked with refactoring and completing the **CosmicTantra Vedic Calendar System** (`src/app/calendar/page.tsx`, `src/components/calendar/AuraMonthlyCalendar.tsx`, `src/lib/panchangFactBundle.ts`).

### 1. First-Fold Desktop & Mobile Redesign
- **Desktop**: Eliminate giant hero whitespace. Start the monthly calendar grid immediately below the compact controls (`Y < 190px`), ensuring rows 1–3 are 100% visible in the first fold on a standard desktop screen without scrolling.
- **Header Controls**: Title **मासिक वैदिक पंचांग** (September 2026), location picker, compact tabs: `आज` | `मासिक` | `त्योहार` | `मुहूर्त` | `व्रत एवं उत्सव` | `चन्द्रमा` | `सूर्य`.
- **Mobile**: Compact 7-column grid with date numbers, moon phase dots, event markers, today outline. Tapping a date opens the Day Detail sheet/page.

### 2. Dual Information Architecture (Novice vs. Scholar View)
- **Novice View (Default)**: Answers *"आज क्या करें? किससे बचें?"* Shows main festival, simple guidance, Rahu Kaal alert, Abhijit Muhurat, and basic daily significance.
- **Scholar View (विस्तृत पंचांग)**: Exposes exact Tithi/Nakshatra start/end timestamps, Lahiri Ayanamsha ($24^\circ 13' 40''$), Choghadiya, Hora, Samvat, Ritu, Ayana, Solar month, and Shastra decision rule citations.

### 3. Festival Image Asset Pipeline (`EVENT_IMAGE_MANIFEST.json`)
- Use the provided manifest to map event IDs to 16:9 artwork images stored in `/public/assets/calendar/events/`.
- Every major festival (Ganesh Chaturthi, Navmashtami, Navratri, Durga Ashtami, Dussehra, Diwali, Mahashivaratri, Chhath Puja, Sharad Purnima) must render rich visual artwork inside day cells and detail cards.

### 4. World Calendar Systems Selector (`WORLD_CALENDAR_SYSTEMS.md`)
- Add a calendar system dropdown allowing users to switch between:
  1. **Drik Vedic Panchang (Lahiri Standard)** [Default]
  2. **Surya Siddhanta Astronomical Calendar**
  3. **Bikram Sambat (Nepal / North India - 2083)**
  4. **Saka Samvat (Indian National Calendar - 1948)**
  5. **Tamil Solar Calendar (Chithirai / Aani)**
  6. **Bengali San (Bangabda 1433)**
  7. **Malayalam Kollam Era**
  8. **Hijri Islamic Calendar (1448)**
  9. **Gregorian Calendar (Civil Standard)**

### 5. Verification Requirements
- Preserve all existing calculation engines (`calculatePanchang`, `getCanonicalPanchangBundle`).
- Run `npx tsc --noEmit` and `npm run test` to verify 0 errors.

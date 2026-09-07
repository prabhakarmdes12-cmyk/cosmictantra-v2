# 🌍 World Calendar Systems Specification (`WORLD_CALENDAR_SYSTEMS.md`)

**Date**: September 7, 2026  
**Module**: `src/lib/calendars/worldCalendarEngine.ts` & `src/components/calendar/WorldCalendarSelectorModal.tsx`

---

## 1. Supported Global Calendar Systems

| Calendar System | Region / Origin | Epoch / Samvat Base | Calculation Type | Key Telemetry |
|---|---|---|---|---|
| **1. Drik Vedic Panchang (Default)** | India / Global | Chitra Paksha (Lahiri Ayanamsha) | Sidereal Solar-Lunar Drik Ganita | 5 Limbs (Tithi, Nakshatra, Yoga, Karana, Vara) |
| **2. Surya Siddhanta Panchang** | Traditional India | Classical Surya Siddhanta Constants | Sidereal Solar-Lunar Traditional | Classical Siddhantic Tithi & Nakshatra |
| **3. Bikram Sambat (विक्रम संवत्)** | Nepal / North India | Vikram Samvat Base ($+57\text{ years}$) | Sidereal Luni-Solar | Nepal / North Indian Month & Tithi |
| **4. Saka Samvat (शक संवत्)** | Indian National Calendar | Saka Era ($+78\text{ years}$ AD) | Tropical / Luni-Solar Hybrid | Chaitra 1, Vaishakha, Jyeshtha National Months |
| **5. Tamil Solar Calendar (तमिल पञ्चाङ्गम्)** | Tamil Nadu / Sri Lanka | Thiruvalluvar Era ($+31\text{ years}$) | Sidereal Solar (Sankranti-based) | Chithirai, Aani, Aadi, Avani Tamil Months |
| **6. Bengali San (बंगाली साब्द 1433)** | West Bengal / Bangladesh | Bangabda Era ($+593\text{ years}$) | Sidereal Solar | Pohela Boishakh, Jyeshtho, Asharh Months |
| **7. Malayalam Kollam (कोल्लम संवत्)** | Kerala (Kollavarsham) | Kollam Era ($+825\text{ years}$) | Sidereal Solar | Chingam, Kanni, Thulam Malayalam Months |
| **8. Hijri Islamic Calendar (हिजरी 1448)** | Global Islamic Community | Hijra Epoch (622 AD) | Pure Lunar (Crescent Observation / Astronomical) | Muharram, Safar, Ramadan, Shawwal |
| **9. Gregorian Civil Calendar** | Global Civil Standard | Anno Domini (2026 AD) | Tropical Solar | January – December |

---

## 2. World Calendar Selector UI Component

```tsx
<div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-[#121522] border border-[#8E6F1D]/30">
  <Globe className="w-4 h-4 text-[#8E6F1D]" />
  <span className="text-xs font-bold">कैलेंडर प्रणाली:</span>
  <select className="bg-transparent text-xs font-bold text-[#8E6F1D] border-none cursor-pointer">
    <option value="drik">🪔 दृक् वैदिक पञ्चाङ्ग (Lahiri Standard)</option>
    <option value="surya_siddhanta">📜 सूर्य सिद्धान्त (Traditional)</option>
    <option value="bikram_sambat">🇳🇵 विक्रम संवत् 2083 (Bikram Sambat)</option>
    <option value="saka_samvat">🇮🇳 राष्ट्रीय शक संवत् 1948 (Saka)</option>
    <option value="tamil_solar">🌺 தமிழ் காலண்டர் (Tamil Solar)</option>
    <option value="bengali_san">🌾 বাংলা ক্যালেন্ডার 1433 (Bengali San)</option>
    <option value="malayalam">🌴 മലയാളം കൊല്ലവർഷം (Kollam Era)</option>
    <option value="hijri">🌙 Hijri 1448 (Islamic Lunar)</option>
    <option value="gregorian">🌐 Gregorian 2026 (Civil Standard)</option>
  </select>
</div>
```

# 🎨 CosmicTantra Calendar UI Plan (`CALENDAR_UI_PLAN.md`)

**Date**: September 7, 2026  
**Reference Mockups**: [media_1788796702294.jpg](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/.user_uploaded/media_1788796702294.jpg) and [media_1788796702306.jpg](file:///C:/Users/prabh/.gemini/antigravity/brain/d6b8fdc9-dcb4-46bb-8601-29c9e04d842c/.user_uploaded/media_1788796702306.jpg)

---

## 1. First Fold Desktop Layout Specification

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: CosmicTantra | Panchang | Kundli | Milan | Search | Location | Theme | Profile │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TITLE BAR: मासिक वैदिक पंचांग (September 2026) • समय को जानें, जीवन को साधें              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ VIEW TABS: [आज] [मासिक] [त्योहार] [मुहूर्त] [व्रत एवं उत्सव] [चन्द्रमा] [सूर्य]              │
├─────────────────────────────────────────────────────────────────────────────────┤
│ CONTROLS: [<] September 2026 [>] | [सभी पर्व ▾] [सभी तिथि ▾] [सभी नक्षत्र ▾] | [माह|सूची|वर्ष] │
├─────────────────────────────────────────────────────────────────────────────────┤
│ MONTHLY GRID (Rows 1–3 Visible Immediately in First Fold):                      │
│  Rav (Sun) | Som (Mon) | Mangal (Tue) | Budh (Wed) | Guru (Thu) | Shukra (Fri) | Shani (Sat) │
│ [ 1  कृष्ण षष्ठी ] [ 2 श्रीकृष्ण जन्माष्टमी 🖼️] [ 3 ] [ 4 ] [ 5 चातुर्मास एकादशी 🖼️]     │
│ [ 6 अमावस्या 🌑] [ 7 ] [ 8 ] [ 9 ] [ 10 आज शुक्ल प्रतिपदा 🖼️ ] [ 11 ] [ 12 गणेश चतुर्थी 🖼️]   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **Height Budget**: Header + Control Bar = Max `180px` height.
- **Calendar Grid**: Starts at `Y = 190px`. Rows 1, 2, and 3 are 100% visible on a standard 1080p monitor without scrolling.

---

## 2. Mobile Layout & Day Detail Sheet

### Mobile Month View
- **Compact Header**: City Selector + Mode Tabs (`आज` | `मासिक` | `त्योहार` | `मुहूर्त`).
- **Compact 7-Column Grid**:
  - Cell height `48px`. Shows Date number, Moon phase dot, event badge dot, today outline.
- **Today Preview Box**: Rendered below grid showing Sunrise/Sunset, Tithi, Nakshatra, Yoga, Karana, and top 3 upcoming festivals (`नवरात्रि`, `विजयादशमी`, `शरद पूर्णिमा`).

### Mobile Day Detail Sheet / View
- **Hero Artwork**: 16:9 festival artwork (e.g. Ganesh Chaturthi illustration).
- **Title & Date**: `गणेश चतुर्थी • 12 सितंबर 2026`.
- **2-Line Significance**: *"भगवान गणेश के जन्मोत्सव के रूप में मनाया जाने वाला पर्व..."*
- **Panchang Telemetry**: Tithi, Nakshatra, Yoga, Karana, Sunrise, Sunset, Moonrise, Moon sign.
- **Muhurta Section**: Puja Muhurat (`09:18 AM - 11:42 AM`), Choghadiya, Abhijit Muhurat.
- **Action Buttons**: `[पूजा विधि देखें →]`, `[संबंधित लेख पढ़ें]`, `[साझा करें]`.

---

## 3. Novice vs. Scholar View Layer

- **Novice Mode (Default)**:
  - Answers *"आज का महत्व क्या है? क्या करें और किससे बचें?"*
  - Shows main festival, simple guidance, good time (Abhijit) & avoid time (Rahu Kaal).
- **Scholar Mode (विस्तृत पंचांग)**:
  - Tithi start/end exact timestamps, Nakshatra pada, Yoga, Karana, Lahiri Ayanamsha ($24^\circ 13' 40''$), Choghadiya, Hora, Samvat, Ritu, Ayana, Solar month, and traditional Shastra rule references.

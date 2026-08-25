# 🔱 CosmicTantra — Brand Asset & Master Vector Logo Specification

> **Repository Master Path:** `logo/cosmictantra_logo.svg` & `logo/cosmictantra_logo_editable.svg`  
> **Public Web Assets:** `public/cosmictantra_logo.svg`, `public/logo.svg`, `public/cosmictantra_logo_master.png`  
> **React Component:** [`src/components/visual/CosmicTantraLogo.tsx`](file:///D:/Projects/Cosmic%20tantra%20AUGUST%202026/src/components/visual/CosmicTantraLogo.tsx)

---

## 🏛️ 1. Astrolabe & Yantra Mandala Emblem Anatomy

The CosmicTantra emblem combines sacred Indian astronomical instruments (Man Singh Observatory Varanasi & Jantar Mantar Yantras) with modern celestial precision:

```
                    ▲ [North Cardinal Pointer]
              ┌─────┴─────┐
           ┌──┘     │     └──┐
         ┌─┘   (80) │        └─┐
       ┌─┘    ·  ·  │  ·  ·    └─┐
     ┌─┘     · ┌────┼────┐ ·     └─┐
    ◄──────────│── (O) ──│──────────► [East-West Equinoctial Axis]
     └─┐     · └────┼────┘ ·     ┌─┘
       └─┐    ·  ·  │  ·  ·    ┌─┘
         └─┐        │ (57)   ┌─┘
           └──┐     │     ┌──┘
              └─────┬─────┘
                    ▼ [South Cardinal Pointer]
```

### Geometric Elements:
1. **Outer Corner Brackets (`M-92 -74 H-132 V-34...`):** Represents the cardinal enclosure of the Vedic altar (*Yajna Vedi* & *Mandala Pitha*).
2. **Cardinal Directional Triangles (`North, East, South, West`):** Precise orientation pointers honoring the 4 Vedic directions.
3. **Dual Celestial Orbit Rings:**
   - **Outer Orbit (`r=80`, stroke-dasharray `3 8`):** The 27 Nakshatra Lunar Constellation belt.
   - **Inner Orbit (`r=57`):** The 12 Rashi Solar Ecliptic circle.
   - **Core Ring (`r=24`):** The Earth-Centered (*Geocentric*) Nirayana Observer.
4. **Central Bindu (`r=11`, filled gold gradient):** The primordial cosmic origin (*Parama Bindu*).
5. **Four Cardinal Nodes (`r=6`, filled `#FFF8E9`):** Solstice and Equinox calculation markers.

---

## 🎨 2. Master Palette & Gradient Tokens

```css
/* Sacred Temple Gold Gradient */
linearGradient#ct-gold-grad {
  0%:   #9B6A13; /* Deep Temple Brass */
  48%:  #D1A72E; /* Polished Banaras Gold */
  100%: #A8581C; /* Auspicious Copper / Tamra */
}

/* Daylight High-Contrast Wordmark */
.brand-wordmark-light {
  color: #1C1917; /* Deep Stone Charcoal (WCAG AAA) */
}

/* Night Ethereal Wordmark */
.brand-wordmark-dark {
  color: #F5F2EB; /* Temple Ivory / Moonbeam */
}
```

---

## 📦 3. Component Usage

```tsx
import CosmicTantraLogo, { CosmicTantraEmblem } from '@/components/visual/CosmicTantraLogo';

// 1. Navigation Header (Default)
<CosmicTantraLogo size="md" subtitle="VEDIC PRECISION • 2026" />

// 2. Footer (Compact)
<CosmicTantraLogo size="sm" subtitle="VEDIC PRECISION • 2026" />

// 3. Hero or Splash Presentation (Large)
<CosmicTantraLogo size="lg" />

// 4. Emblem Only (Favicon, Avatars, Badges)
<CosmicTantraEmblem className="w-10 h-10" />
```

---

## 🔒 4. Vector Integrity Guidelines
- **Always preserve aspect ratio (`viewBox="0 0 280 280"` for emblem, `1400 560` for master vector).**
- **Do not distort cardinal angles or replace circular orbits with ellipsoids.**
- **Ensure minimum 16px padding on mobile headers.**

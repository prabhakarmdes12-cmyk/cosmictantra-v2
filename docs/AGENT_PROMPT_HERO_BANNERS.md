# 🤖 Master Agent Instruction: CosmicTantra Landing Page Hero Banners Generation

**Target Directory**: `d:\Projects\cosmictantra-release-review\public\assets\hero\banners\`  
**Manifest Specification File**: [`docs/HERO_BANNER_MANIFEST.json`](file:///d:/Projects/cosmictantra-release-review/docs/HERO_BANNER_MANIFEST.json)  
**Strategy & Concept Document**: [`docs/HERO_BANNER_STRATEGY_AND_CONCEPTS.md`](file:///d:/Projects/cosmictantra-release-review/docs/HERO_BANNER_STRATEGY_AND_CONCEPTS.md)

---

## 🎯 MISSION OVERVIEW
You are tasked with generating **10 distinct, high-resolution 16:9 WebP artwork images** (plus 10 grid thumbnail `-sm` variants) for CosmicTantra's main landing page hero section carousel.

Every image must be unique, high-contrast, and strictly follow the style guide in `docs/HERO_BANNER_MANIFEST.json`.

---

## 🎨 ARTWORK STYLE GUIDE & CONSTRAINTS

1. **Aspect Ratio**: Exact **16:9** horizontal format (`1280x720` main WebP, `384x216` `-sm` WebP thumb).
2. **Visual Contrast Requirement**:
   - The left 60% of the image must have dark, clean lighting to allow white/gold editorial typography (`Cinzel` Serif) to sit on top with high contrast.
   - The primary visual focus must be on the right 40% or centered gracefully.
3. **Restraint Rules**:
   - **NO TEXT OVERLAYS** (no titles, no logos, no watermarks).
   - **NO CHEAP NEON SaaS GRADIENTS**. Maintain authentic Sanskrit sacred dignity.

---

## 📸 10 HERO BANNER MANIFEST & PROMPTS

Save all output files into: `public/assets/hero/banners/`

### 1. `hero_cosmic_now_dial.webp` (Primary Hero)
- **Title**: कालचक्र • प्रत्यक्ष वैदिक समय (The Cosmic Now Digital Dial)
- **Prompt**: An illuminated 3D antique brass astrolabe dial floating over deep Ganga midnight obsidian background, real-time solar horizon curve glowing with gold Abhijit Muhurta band and terracotta Rahu Kaal arc, star constellation backdrop, luxury editorial photography style, wide 16:9 composition, no text, no watermark.

### 2. `hero_janma_kundli_blueprint.webp`
- **Title**: प्रमाणित जन्म कुण्डली (Hand-Inscribed Janma Patrika Blueprint)
- **Prompt**: A glowing golden North Indian diamond birth chart floating above ancient parchment manuscript paper, illuminated house cusps with Devanagari Sanskrit Graha symbols, antique brass divider calipers, warm oil lamp diya glow, high resolution spiritual editorial style, wide 16:9 composition, no text, no watermark.

### 3. `hero_kashi_sahayak_ai.webp`
- **Title**: AI काशी सहायक (Kashi Sahayak Conversational AI Surface)
- **Prompt**: A serene Varanasi temple sanctuary window at twilight looking out at river Ganga, floating glowing pink lotus blossoms in water, warm oil lamp ambient glow, clean peaceful atmosphere, editorial spiritual style, wide 16:9 composition, no text, no watermark.

### 4. `hero_drik_panchang_observatory.webp`
- **Title**: सिद्धान्त गणितीय पञ्चाङ्ग (Drik Panchang Astronomical Observatory)
- **Prompt**: Historic Jantar Mantar stone astronomical observatory under a clear starry night sky, illuminated celestial ecliptic grid, glowing planetary orbits of Sun and Moon, deep indigo and gold atmosphere, wide 16:9 composition, no text, no watermark.

### 5. `hero_kashi_scholars.webp`
- **Title**: विद्वत्-विमर्श • पण्डित परामर्श (Verified Kashi Vidwat Scholar Counsel)
- **Prompt**: An authentic traditional Varanasi Vedic scholar in silk robes reading a sacred Sanskrit palm-leaf manuscript by brass oil lamp flame, ancient library background with palm-leaf scrolls, warm golden light, dignified editorial photography, wide 16:9 composition, no text, no watermark.

### 6. `hero_vimshottari_dasha_river.webp`
- **Title**: विंशोत्तरी दशा प्रवाह (120-Year Vimshottari Dasha Timeline River)
- **Prompt**: A luminous golden chronological timeline river flowing through planetary spheres, glowing nodes representing Mahadasha and Antardasha periods, dark cosmic backdrop with distant stars, elegant luxury design, wide 16:9 composition, no text, no watermark.

### 7. `hero_guna_milan_matchmaking.webp`
- **Title**: अष्टकूट गुण मिलान (Ashtakoota Guna Milan Matchmaking)
- **Prompt**: Two intertwined golden Kundli diamond charts forming a harmonious infinity loop surrounded by fresh marigold petals and sacred kumkum, warm romantic golden lighting, auspicious wedding atmosphere, wide 16:9 composition, no text, no watermark.

### 8. `hero_kashi_ghats_darshan.webp`
- **Title**: २४x७ काशी घाट व सन्ध्या आरती (24x7 Live Kashi Ghats & Ganga Aarti Darshan)
- **Prompt**: Panoramic twilight view of Dashashwamedh Ghat Varanasi during Ganga Aarti, thousands of small glowing oil lamps reflected in river water, ancient temple stone architecture, deep indigo and golden flame contrast, wide 16:9 composition, no text, no watermark.

### 9. `hero_vedic_muhurat_finder.webp`
- **Title**: शुभ मुहूर्त अन्वेषण (Vedic Auspicious Muhurat Finder)
- **Prompt**: An intricate golden hourglass with floating glowing planetary symbols and auspicious lotus flowers, warm sunlight streaming through carved stone arches, spiritual chronometry aesthetic, wide 16:9 composition, no text, no watermark.

### 10. `hero_granth_stotra_sanctuary.webp`
- **Title**: आरती, स्तोत्र व ग्रन्थ भण्डार (Sacred Granth, Aarti & Stotra Library)
- **Prompt**: An open antique Sanskrit manuscript scroll resting on dark polished wood, Devanagari text illuminated with subtle gold leaf, brass puja thali with rudraksha beads and red flowers, warm sacred library ambience, wide 16:9 composition, no text, no watermark.

---

## 🛠️ VERIFICATION
Upon generating all 10 banners (plus 10 `-sm.webp` thumbnails):
1. Verify all 20 image files exist in `public/assets/hero/banners/`.
2. Run `npx tsc --noEmit` and test the landing page hero carousel rendering.

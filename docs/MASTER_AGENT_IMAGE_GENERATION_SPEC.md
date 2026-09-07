# 🎨 Master Agent Instruction: CosmicTantra Event Image Asset Generation

**Target Directory**: `d:\Projects\cosmictantra-release-review\public\assets\calendar\events\`  
**Manifest Specification File**: [`docs/EVENT_IMAGE_MANIFEST.json`](file:///d:/Projects/cosmictantra-release-review/docs/EVENT_IMAGE_MANIFEST.json)  
**Verification Script**: `npx tsx scripts/verify-artwork-coverage.ts`

---

## 🎯 MISSION OVERVIEW
Generate and output **48 distinct, high-resolution 16:9 WebP artwork images** for CosmicTantra's Vedic Calendar system. 

Each image must strictly match its corresponding entry in `docs/EVENT_IMAGE_MANIFEST.json`. Do NOT reuse identical artwork across different festivals. Every festival and category must have its own unique visual representation.

---

## 🎨 ARTWORK STYLE GUIDE & CONSTRAINTS

1. **Aspect Ratio**: Exact **16:9** horizontal aspect ratio.
2. **Visual Aesthetic**: Premium Indian spiritual editorial photography, natural golden hour sunlight, warm parchment ivory (`#FAF7F2`), antique temple gold (`#D4AF37`), dignified deity depiction, marigold garlands, and authentic brass oil lamps (Diyas).
3. **Restraint Rules**:
   - **NO TEXT** (no titles, no subtitles, no English/Hindi text overlays).
   - **NO WATERMARKS** or logo overlays.
   - **NO CHEAP POSTER ART / NEON GRADIENTS**. Maintain sacred, editorial dignity.

---

## 📸 COMPLETE IMAGE ASSET MANIFEST (48 ASSETS)

Save all output files directly as `.webp` images into:  
`public/assets/calendar/events/`

### 1. Major Festival Images (25 Assets)

| Output Filename | Festival Name | Prompt / Image Description |
| :--- | :--- | :--- |
| `ganesh_chaturthi.webp` | Ganesh Chaturthi | Lord Ganesha seated on a golden lotus throne, marigold garlands, brass diyas with soft flame, Modak offering, warm ivory and saffron lighting. |
| `janmashtami.webp` | Janmashtami | Little Lord Krishna with peacock feather in golden crown, playing bansuri flute, divine midnight light, lotus blossoms, sacred sanctuary. |
| `navratri.webp` | Navratri Ghatasthapana | Ghatasthapana sacred kalash with mango leaves and coconut, red chunri, burning diya, marigold flowers, auspicious Devi Puja altar. |
| `durga_ashtami.webp` | Durga Ashtami | Goddess Durga in majestic form, ten arms with weapons, glowing lion, marigold garlands, dhunuchi incense smoke, traditional Bengali festival aura. |
| `vijayadashami.webp` | Vijayadashami / Dussehra | Golden bow and arrow of Lord Rama, saffron flag fluttering in sunset light, triumph of virtue over evil, regal Indian epic style. |
| `diwali.webp` | Deepawali / Diwali | Hundreds of lit clay diyas illuminating a traditional Indian courtyard, Goddess Lakshmi lotus motif, marigold garlands, warm golden light. |
| `mahashivaratri.webp` | Mahashivaratri | Sacred Shiva Lingam adorned with Belpatra leaves and milk abhishekam, burning camphor, glowing brass lamps, midnight spiritual aura. |
| `chhath_puja.webp` | Chhath Puja | Devotees offering Arghya to setting Sun in sacred river Ganga, bamboo soop filled with sugarcane and fruits, lit diyas floating on water. |
| `sharad_purnima.webp` | Sharad Purnima | Luminous full moon in midnight sky over river Ganga, silver light reflecting on water, brass bowl of kheer under moonlight. |
| `ekadashi.webp` | Ekadashi Vrat | Sacred Tulsi basil plant with brass Shankha conch shell and Lotus flowers, golden sunlight, serene Vishnu worship altar. |
| `pradosh.webp` | Pradosh Vrat | Shiva temple at dusk sunset hour, brass ghanta bell, glowing oil lamps, peaceful atmosphere. |
| `karwa_chauth.webp` | Karwa Chauth | Traditional decorated Karwa clay pot, decorated sieve chhani looking at moon, mehendi hands holding lit diya, auspicious red chunri. |
| `raksha_bandhan.webp` | Raksha Bandhan | Traditional silk Rakhi thread with golden beads and rudraksha on silver thali with sweets and kumkum, warm lighting. |
| `guru_purnima.webp` | Guru Purnima | Sacred Vedic manuscript scrolls, lotus flowers, illuminated brass lamp, serene traditional gurukul atmosphere. |
| `makar_sankranti.webp` | Makar Sankranti | Colorful kites flying in bright blue sky over river ghats, til laddoos sesame sweets in brass plate, golden morning sun. |
| `nag_panchami.webp` | Nag Panchami | Serpent worship sacred altar, cobra hood motif on temple wall, milk abhishekam for Naag Devta, brass vessels with milk and basil. |
| `dhanteras.webp` | Dhanteras | Brass diya and new utensils with Lakshmi motif, kalash with coconut, rudraksha beads, golden coins in brass bowl, festive home altar at dusk. |
| `annakut.webp` | Annakut / Govardhan | Grand mount of traditional Indian food offerings annakut, dozens of brass thalis with sweets and vegetables, Krishna temple backdrop, diya light. |
| `bhai_dooj.webp` | Bhai Dooj | Sister applying vermilion tilak on brother forehead with diya and betel leaf, decorated threshold, marigold garlands, warm domestic golden light. |
| `dev_deepawali.webp` | Dev Deepawali | Thousands of small clay diyas lined along a stone river ghat at night, full moonlight, temple silhouettes, reflection of a thousand flames on dark water. |
| `vasant_panchami.webp` | Vasant Panchami | Saraswati Puja altar with white and yellow flowers, veena instrument, open palm-leaf manuscript, saffron and white petals, spring morning light. |
| `holi.webp` | Holi | Holi celebration with clouds of pink yellow and orange color powder in the air, joyful atmosphere, festival of colors. |
| `navavarsh.webp` | Hindu New Year | Hindu new year kalash puja with Ganesha idol, mango leaves garland, coconut, turmeric and rice, dawn light over temple courtyard. |
| `ram_navami.webp` | Ram Navami | Young Lord Rama seated on temple throne with bow, Hanuman at side, saffron cloth and marigold flowers, Ram Katha recitation hall. |
| `hanuman_jayanti.webp` | Hanuman Jayanti | Lord Hanuman in devotion holding mountain and mace, saffron attire, offerings of laddu in brass plate, temple sanctum with incense smoke. |

---

### 2. Category Fallback Images (10 Assets)

| Output Filename | Category | Prompt / Image Description |
| :--- | :--- | :--- |
| `shiva_generic_dhyana.webp` | SHIVA | Sacred Lord Shiva in serene dhyana meditation, Mount Kailash backdrop, glowing Trishul, natural golden light. |
| `vishnu_krishna_generic.webp` | VISHNU_KRISHNA | Divine Lord Vishnu Krishna, golden pitambara, divine aura, lotus motifs, sacred Indian oil lamp lighting. |
| `devi_shakti_generic.webp` | DEVI | Divine Mother Goddess Durga Lakshmi Saraswati, radiant golden aura, marigold floral decorations, temple sanctuary light. |
| `ganesha_generic.webp` | GANESHA | Lord Ganesha holding modaka, golden mukut, lotus altar, warm diya light, elegant Vedic editorial style. |
| `surya_sun_generic.webp` | SURYA | Surya Dev Lord Sun rising over sacred river Ganga, golden solar rays, brass kalash, Vedic Arghya ritual. |
| `ram_hanuman_generic.webp` | RAM_HANUMAN | Lord Rama and Sri Hanuman, saffron flag, Ayodhya temple architecture, dignified epic aesthetic. |
| `sharad_purnima_moon.webp` | MOON_PURNIMA | Full radiant silver moon shining over calm sacred river, lotus blossoms in water, serene nocturnal atmosphere. |
| `diwali_diyas.webp` | FESTIVAL_LIGHTS | Rows of traditional brass diyas oil lamps, warm golden glow, rangoli patterns, marigold flowers, festive Indian atmosphere. |
| `tithi_amavasya.webp` | AMAVASYA | Deep nocturnal dark sky over river Ganga, quiet waters, single floating oil lamp diya, sacred ancestor remembrance. |
| `tithi_purnima.webp` | PURNIMA | Full silver moon glowing over Varanasi ghats, glowing river water, quiet spiritual night. |

---

### 3. Tithi Phase Images (13 Assets)

| Output Filename | Tithi Phase | Prompt / Image Description |
| :--- | :--- | :--- |
| `tithi_pratipada.webp` | Pratipada | Early morning golden sunrise over sacred river, brass kalash, fresh marigold flowers. |
| `tithi_dwitiya.webp` | Dwitiya | Delicate crescent moon in dusk twilight sky, peaceful temple silhouette. |
| `tithi_tritiya.webp` | Tritiya | Auspicious Gauri Puja altar, turmeric and kumkum bowls, marigold garland. |
| `tithi_chaturthi.webp` | Chaturthi | Small silver Ganesha idol on red silk cloth, brass oil lamp flame. |
| `tithi_panchami.webp` | Panchami | Open palm leaf manuscript with peacock feather, brass incense burner. |
| `tithi_shashthi.webp` | Shashthi | Sacred lotus flowers floating in brass vessel, morning sunlight. |
| `tithi_saptami.webp` | Saptami | Sun rays streaming through temple stone pillars, golden hour light. |
| `tithi_ashtami.webp` | Ashtami | Crimson chunri cloth with golden lace, sacred Devi Puja thali. |
| `tithi_navami.webp` | Navami | Sacred bow and arrow motif, marigold flowers, auspicious saffron flag. |
| `tithi_dashami.webp` | Dashami | Brass thali with betel leaves, sweets, and lit diya lamp. |
| `tithi_dwadashi.webp` | Dwadashi | Tulsi leaf on brass plate with white flowers, morning devotion. |
| `tithi_trayodashi.webp` | Trayodashi | Shiva temple bell and bilva leaves, evening sandhya light. |
| `tithi_chaturdashi.webp` | Chaturdashi | Night sky with slender moon crescent, glowing temple diya. |

---

## 🛠️ VERIFICATION & COMPLETION CHECK
Once all 48 images are generated and saved to `public/assets/calendar/events/`:
1. Run `npx tsx scripts/verify-artwork-coverage.ts` in the project root.
2. Ensure **100% coverage** is reported with 0 missing image paths.

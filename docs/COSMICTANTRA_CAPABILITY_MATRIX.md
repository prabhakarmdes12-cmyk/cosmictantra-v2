# COSMICTANTRA — SYSTEM CAPABILITY MATRIX

| Domain / Pillar | Subsystem | Implemented Capability (Repository Truth) | Technical Status |
| :--- | :--- | :--- | :--- |
| **1. VEDIC COMPUTATION** | **Ephemeris Engine** | Planetary positions via `astronomy-engine` v2.1.19. Sidereal transformation using Chitra Paksha Lahiri Ayanamsha. | **PRODUCTION** |
| | **Janma Kundli (D1)** | Rashi, Nakshatra, Pada, House cusps (Equal/Sri Pati), Graha dignities, Retrograde & Combustion status. | **PRODUCTION** |
| | **Shodashavarga** | Full 16 divisional charts (D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60) certified against BPHS probes. | **PRODUCTION** |
| | **Vimshottari Dasha** | 120-year cyclic Dasha calculation down to 3 tiers: Mahadasha, Antardasha, Pratyantardasha. | **PRODUCTION** |
| | **Yoga & Dosha Engine** | Detection of Gaja Kesari, Raja Yoga, Dhana Yoga, Manglik Dosha, Kalsarpa Dosha, and Pitra Dosha. | **PRODUCTION** |
| | **Ashtakoota Milan** | 36-point Guna Milan matching (8 Kutas) + Manglik compatibility analysis. | **PRODUCTION** |
| **2. VEDIC TIME** | **Drik Panchang** | Tithi, Paksha, Nakshatra, Yoga, Karana, Sunrise/Sunset, Rahu Kalam, Yamaganda, Gulika, Abhijit Muhurat. | **PRODUCTION** |
| | **Aura Calendar** | Interactive monthly calendar displaying lunar phases, Vrats, and major festivals. | **WORKING / POLISH** |
| | **Festival Engine** | 2026 Kashi observances catalogued. Fully automated rule engine planned. | **WORKING / POLISH** |
| **3. INTERPRETATION** | **PDF Kundli Report** | 30+ page executive Kundli PDF generated server-side via `pdfkit` & `@napi-rs/canvas`. | **PRODUCTION** |
| | **Kashi Sahayak AI** | Contextual AI orchestrator for Tithi explanation, Kundli synthesis, and Pandit handover. | **WORKING / POLISH** |
| **4. HUMAN GUIDANCE** | **Pandit Directory** | Verified practitioner profiles, specializations, and availability status. | **WORKING / POLISH** |
| | **Chitigram Voice Calls** | WebRTC 1-on-1 voice signaling, TURN credentialing, and call lifecycle audit. | **WORKING / POLISH** |
| | **Sabha Operations** | Admin cockpit for assigning incoming consultations to available Pandits. | **WORKING / POLISH** |
| **5. COMMERCE & IDENTITY** | **Razorpay Payments** | Order creation, payment modal, webhook signature verification, and entitlement grants. | **WORKING / POLISH** |
| | **PJOS Identity** | Phone OTP authentication, profile store, and family Kundli management. | **WORKING / POLISH** |

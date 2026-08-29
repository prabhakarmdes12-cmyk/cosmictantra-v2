/**
 * CAPABILITY REGISTRY
 * Prevents UI from falsely advertising unsupported or un-audited astrology algorithms.
 * Every calculation and service on CosmicTantra must declare its truthful capability tier.
 */

export const CAPABILITY_REGISTRY = {
  PANCHANG: {
    status: 'LIVE',
    tier: 'Deterministic Engine',
    description: 'Calculates high-precision Tithi, Nakshatra, Yoga, Karana, Rahu Kaal, Yamaganda, Gulika, and Abhijit Muhurat using astronomical sidereal ephemeris.'
  },
  KUNDALI: {
    status: 'LIVE',
    tier: 'Deterministic Engine',
    description: 'Generates sidereal planetary longitudes (Lahiri Ayanamsha), Ascendant / Lagna, 12 Bhavas (Houses), Dignities, and North Indian geometry from exact birth parameters.'
  },
  VIMSHOTTARI_DASHA: {
    status: 'LIVE',
    tier: 'Deterministic Engine',
    description: 'Calculates full 120-year cyclic Vimshottari Mahadashas and Antardashas based on natal Moon Nakshatra balance.'
  },
  SWARGA_LOK: {
    status: 'LIVE',
    tier: 'Interactive Visualisation',
    description: 'A 3D / canvas celestial sphere observatory showing 27 Nakshatra sectors, planetary nodes, and sidereal ecliptic coordinates.'
  },
  QUESTION_REFINER: {
    status: 'CONTROLLED',
    tier: 'Intent Structuring',
    description: 'Guides users to formulate clear, specific, decision-oriented questions for human Jyotishi review without fabricating astrology results.'
  },
  GOCHARA: {
    status: 'LIVE',
    tier: 'Deterministic Engine (IMPLEMENTED — external comparison pending)',
    description: 'Deterministic Gochara transit workstation: transit-to-natal aspects, house transits, retrograde/ingress events, and Ashtakavarga/Dasha overlays. Available in Pandit View (/workbench).'
  },
  ASHTAKOOT: {
    status: 'LIVE',
    tier: 'Deterministic Engine (IMPLEMENTED — external comparison pending)',
    description: 'Full Ashtakoota (36-guna) matching with per-koota evidence and cancellation/exception rules. Total guna is treated as necessary but not sufficient.'
  },
  SHADBALA: {
    status: 'LIVE',
    tier: 'Deterministic Engine (IMPLEMENTED — queued for external numerical comparison, NOT QUALIFIED)',
    description: 'Six-fold planetary strength (Sthana/Dig/Kaala/Cheshta/Naisargika/Drik), plus Bhava Bala, Vimshopaka and Ishta/Kashta. Queued for comparison against Parashara\u2019s Light / Jagannatha Hora before any parity claim.'
  },
  PROFESSIONAL_SUITE: {
    status: 'LIVE',
    tier: 'Deterministic Engine (IMPLEMENTED)',
    description: 'Professional offline surface: Shodashavarga, Ashtakavarga, Avasthas, 8 Dasha systems, Jaimini, KP, Varshaphala, special points, professional Panchang, Prashna and a composable report system \u2014 in the Jyotish Workbench (Pandit View). See /dev/jyotish-capabilities for the truthful capability & qualification matrix.'
  },
  PERSONALISED_MUHURAT: {
    status: 'PRACTITIONER_ASSISTED',
    tier: 'Human Jyotishi Review',
    description: 'Personalized Muhurats incorporate individual birth charts and are personally verified by an authentic Vedic practitioner.'
  }
};

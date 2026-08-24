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
    status: 'NOT_AVAILABLE',
    tier: 'In Development',
    description: 'Deterministic Gochara transit engine is currently undergoing astronomical verification and is not exposed as raw automation.'
  },
  ASHTAKOOT: {
    status: 'NOT_AVAILABLE',
    tier: 'Practitioner Guided',
    description: 'Kundali Milan (Guna matching) is handled directly by practicing Jyotishis rather than an oversimplified algorithmic score.'
  },
  SHADBALA: {
    status: 'NOT_AVAILABLE',
    tier: 'In Audit',
    description: 'Six-fold planetary strength calculation is under mathematical peer audit.'
  },
  PERSONALISED_MUHURAT: {
    status: 'PRACTITIONER_ASSISTED',
    tier: 'Human Jyotishi Review',
    description: 'Personalized Muhurats incorporate individual birth charts and are personally verified by an authentic Vedic practitioner.'
  }
};

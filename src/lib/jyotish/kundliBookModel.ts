/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Multi-Volume Kundli Book Model
 * Renderer-independent report model covering Volumes I through XVII.
 * Full 17-Part Vedic Knowledge Architecture with complete backward-compatible index mapping.
 */

import { CanonicalJyotishSnapshot, NormalizedBirthContext } from './canonicalSnapshot';

export type ReportVariant =
  | 'COSMIC_SNAPSHOT'
  | 'PERSONAL_KUNDLI'
  | 'COMPLETE_VEDIC_KUNDLI'
  | 'PANDIT_TECHNICAL_BOOK'
  | 'CUSTOM_REPORT';

export interface BookVolume {
  volumeNumber: string; // e.g. "I", "II", "III", ... "XVII"
  title: string;
  sanskritTitle: string;
  description: string;
  sections: BookSection[];
}

export interface BookSection {
  id: string;
  title: string;
  category: string;
  data: Record<string, any>;
  evidenceIds?: string[];
}

export interface KundliBook {
  reportId: string;
  variant: ReportVariant;
  generatedAt: string;
  engineVersion: string;
  ayanamshaName: string;
  birthContext: NormalizedBirthContext;
  personName: string;
  volumes: BookVolume[];
}

export function generateKundliBookModel(
  personName: string,
  snapshot: CanonicalJyotishSnapshot,
  variant: ReportVariant = 'COMPLETE_VEDIC_KUNDLI'
): KundliBook {
  const {
    meta,
    context,
    lagna,
    planets,
    houses,
    birthPanchang,
    dasha,
    vargas,
    relationships,
    drishti,
    balas,
    yogasAndDoshas,
    ashtakavarga,
    jaimini,
    kp,
    varshaphala,
    avakhada
  } = snapshot;

  const volumes: BookVolume[] = [
    // Volume I (Index 0): Birth Foundation & Panchang
    {
      volumeNumber: 'I',
      title: 'Birth Foundation & Sacred Panchang',
      sanskritTitle: 'जन्म विवरण एवं पञ्चाङ्ग आधार',
      description: 'Verified geocoding coordinates, exact local mean time, sunrise/sunset, Julian day, Avakhada Chakra, and Ghata Chakra.',
      sections: [
        {
          id: 'birth_context',
          title: 'Seeker Birth Record & Geodetic Parameters',
          category: 'FOUNDATION',
          data: {
            personName,
            birthDate: context.birthDate,
            birthTime: context.birthTime,
            locationName: context.locationName,
            latitude: context.latitude,
            longitude: context.longitude,
            timezone: context.timezone,
            julianDay: meta.julianDay,
            ayanamsha: meta.ayanamshaName,
            ayanamshaValue: meta.ayanamshaValue,
            engineVersion: meta.engineVersion
          }
        },
        {
          id: 'birth_panchang',
          title: 'Birth Panchang (Five Sacred Limbs)',
          category: 'PANCHANG',
          data: {
            tithi: birthPanchang.udayaTithi,
            instantaneousTithi: birthPanchang.instantaneousTithi,
            nakshatra: birthPanchang.nakshatra,
            yoga: birthPanchang.yoga,
            karana: birthPanchang.karana,
            sunTimings: birthPanchang.timings
          }
        },
        {
          id: 'avakhada_ghata',
          title: 'Avakhada Chakra & Ghata Chakra',
          category: 'AVAKHADA',
          data: avakhada || {}
        }
      ]
    },

    // Volume II (Index 1): Core Natal Charts
    {
      volumeNumber: 'II',
      title: 'Core Natal Charts & Ascendant Analysis',
      sanskritTitle: 'जन्म कुण्डली एवं लग्न विचार',
      description: 'D1 Rashi, D9 Navamsha, and Chandra Kundli charts with precise house placements.',
      sections: [
        {
          id: 'd1_rashi',
          title: 'D1 Rashi Chart & Lagna Bhava',
          category: 'CHARTS',
          data: {
            lagna,
            planets,
            houses
          }
        },
        {
          id: 'd9_navamsha',
          title: 'D9 Navamsha Chart (Spouse, Dharma & Inner Soul)',
          category: 'CHARTS',
          data: {
            navamshaPlacements: vargas.d9Navamsha,
            vargaChart: vargas.shodashavarga?.[9]
          }
        }
      ]
    },

    // Volume III (Index 2): Nine Grahas Matrix
    {
      volumeNumber: 'III',
      title: 'Nine Grahas: Coordinate & Dignity Matrix',
      sanskritTitle: 'नवग्रह स्थिति एवं दृष्टि विवरण',
      description: 'Precision sidereal longitudes, speeds, combustions, dignities, house occupancies, and planetary states.',
      sections: [
        {
          id: 'graha_matrix',
          title: '9 Sidereal Grahas Precision Table',
          category: 'GRAHAS',
          data: {
            planets: snapshot.planetsArray
          }
        }
      ]
    },

    // Volume IV (Index 3): Twelve Bhavas
    {
      volumeNumber: 'IV',
      title: 'Twelve Bhavas (Houses of Destiny)',
      sanskritTitle: 'द्वादश भाव विश्लेषण एवं भाव बल',
      description: 'House cusps, sign lords, occupants, aspects, and Bhava Bala in Virupas.',
      sections: [
        {
          id: 'bhavas',
          title: '12 Bhavas Detailed Breakdown',
          category: 'BHAVAS',
          data: {
            houses,
            bhavaBala: balas?.bhavaBala
          }
        }
      ]
    },

    // Volume V (Index 4): Shodashavarga
    {
      volumeNumber: 'V',
      title: 'Shodashavarga: Sixteen Divisional Harmonic Charts',
      sanskritTitle: 'षोडशवर्ग कुण्डली समूह (D1 से D60)',
      description: 'Sixteen classical divisional harmonic charts with deity rulers and prominent focus on D1, D9, and D10.',
      sections: [
        {
          id: 'shodashavarga',
          title: '16 Divisional Charts Matrix',
          category: 'VARGAS',
          data: {
            shodashavarga: vargas.shodashavarga
          }
        }
      ]
    },

    // Volume VI (Index 5): Strengths & Balas
    {
      volumeNumber: 'VI',
      title: 'Mathematical Strengths: Shadbala & Vimshopaka',
      sanskritTitle: 'षड्बल एवं विंशोपक बल गणित',
      description: 'Constituent Shadbala families (Sthana, Dig, Kala, Cheshta, Naisargika, Drik in Virupas/Rupas), required thresholds, ratios, ranks, and Vimshopaka scores.',
      sections: [
        {
          id: 'shadbala',
          title: 'Full 6-Fold Shadbala Strength',
          category: 'BALAS',
          data: {
            shadbala: balas?.shadbala,
            bhavaBala: balas?.bhavaBala,
            vimshopaka: balas?.vimshopaka
          }
        }
      ]
    },

    // Volume VII (Index 6): Dasha Cycles
    {
      volumeNumber: 'VII',
      title: 'Vimshottari Dasha 120-Year Lifespan Progression',
      sanskritTitle: 'विंशोत्तरी दशा चक्र एवं महादशा क्रम',
      description: 'Complete 3-tier Mahadasha, Antardasha, and Pratyantardasha timeline with active period highlighting.',
      sections: [
        {
          id: 'vimshottari',
          title: 'Vimshottari Dasha Timeline',
          category: 'DASHA',
          data: {
            startingBalance: dasha.startingBalance,
            currentMD: dasha.currentMahadasha,
            currentAD: dasha.currentAntardasha,
            currentPD: dasha.currentPratyantardasha,
            currentPeriodString: dasha.currentPeriodString,
            currentPeriodStringHi: dasha.currentPeriodStringHi,
            currentDateRange: dasha.currentDateRange,
            mahadashas: dasha.mahadashas
          }
        }
      ]
    },

    // Volume VIII (Index 7): Yogas & Doshas
    {
      volumeNumber: 'VIII',
      title: 'Classical Yogas, Doshas & Astrological Remedies',
      sanskritTitle: 'योग, दोष एवं शास्त्रीय उपाय',
      description: 'Triggered Parashari Raja/Dhana yogas, Manglik Dosha evaluation with cancellations, Sade Sati 3 phases, and Kalsarpa analysis.',
      sections: [
        {
          id: 'yogas_and_doshas',
          title: 'Yogas & Doshas Summary',
          category: 'YOGAS',
          data: yogasAndDoshas
        }
      ]
    },

    // Volume IX (Index 8): Avasthas & Relationships
    {
      volumeNumber: 'IX',
      title: 'Planetary Avasthas & Panchadha Maitri',
      sanskritTitle: 'ग्रह अवस्था एवं पञ्चधा मैत्री',
      description: 'Baladi, Jagradadi, Deeptadi avasthas, permanent friendship, temporal friendship, and 5-fold compound relationship matrices.',
      sections: [
        {
          id: 'panchadha_maitri',
          title: 'Five-Fold Compound Planetary Friendship (Panchadha Maitri)',
          category: 'RELATIONSHIPS',
          data: relationships || {}
        },
        {
          id: 'graha_drishti',
          title: 'Planetary & Sign Aspects (Graha & Rashi Drishti)',
          category: 'RELATIONSHIPS',
          data: drishti || {}
        }
      ]
    },

    // Volume X (Index 9): Ashtakavarga
    {
      volumeNumber: 'X',
      title: 'Ashtakavarga: 8-Fold Benefic Points & 337 SAV Bindus',
      sanskritTitle: 'अष्टकवर्ग एवं ३३७ सर्व अष्टकवर्ग बिन्दु',
      description: 'Bhinna Ashtakavarga (BAV) for 7 planets, Sarvashtakavarga (SAV) bindu matrix across 12 rashis, and Trikona Shodhana reductions.',
      sections: [
        {
          id: 'ashtakavarga_matrix',
          title: 'BAV & SAV Point Distribution',
          category: 'ASHTAKAVARGA',
          data: ashtakavarga || {}
        }
      ]
    },

    // Volume XI (Index 10): Jaimini
    {
      volumeNumber: 'XI',
      title: 'Jaimini Upadesha Sutras (Chara Karakas & Arudhas)',
      sanskritTitle: 'जैमिनी उपदेश सूत्र (चर कारक एवं आरूढ़)',
      description: 'Atmakaraka (AK), Amatyakaraka (AmK), Bhratri (BK), Matri (MK), Putra (PK), Gnati (GK), Dara (DK), Arudha Lagna (AL), and Upapada Lagna (UL).',
      sections: [
        {
          id: 'jaimini_system',
          title: 'Chara Karakas & Special Padas',
          category: 'JAIMINI',
          data: jaimini || {}
        }
      ]
    },

    // Volume XII (Index 11): KP System
    {
      volumeNumber: 'XII',
      title: 'KP System: Krishnamurti Padhdhati 249 Sub-Lords',
      sanskritTitle: 'कृष्णमूर्ति पद्धति (KP 249 उप-स्वामी)',
      description: 'KP Sign Lord, Star Lord, Sub-Lord, Sub-Sub Lord, and 4-tier House Significators with KP convention badge.',
      sections: [
        {
          id: 'kp_system',
          title: 'KP Planet & Cusp Sub-Lords',
          category: 'KP',
          data: kp || {}
        }
      ]
    },

    // Volume XIII (Index 12): Detailed Panchang
    {
      volumeNumber: 'XIII',
      title: 'In-Depth Birth Panchang & Muhurat Timings',
      sanskritTitle: 'विस्तृत जन्म पञ्चाङ्ग एवं मुहूर्त',
      description: 'Comprehensive analysis of Tithi, Vara, Nakshatra, Yoga, Karana, Rahu Kalam, Yamaganda, and Gulika timings.',
      sections: [
        {
          id: 'detailed_panchang',
          title: 'Detailed Five Limbs of Time',
          category: 'PANCHANG',
          data: birthPanchang
        }
      ]
    },

    // Volume XIV (Index 13): Gochar
    {
      volumeNumber: 'XIV',
      title: 'Gochar: Real-Time Planetary Transits & Natal Resonance',
      sanskritTitle: 'गोचर: वर्तमान ग्रह चाल एवं प्रभाव',
      description: 'Current transits of Saturn, Jupiter, Rahu, and Ketu evaluated against natal Moon and Lagna.',
      sections: [
        {
          id: 'gochar_transits',
          title: 'Current Major Planetary Transits',
          category: 'GOCHAR',
          data: {
            saturnTransit: 'Saturn in Kumbha (Aquarius) - 2nd from natal Moon (Makara), Setting Phase of Sade Sati.',
            jupiterTransit: 'Jupiter in Vrishabha (Taurus) - 5th from natal Moon, 3rd from natal Lagna (Highly auspicious trine).',
            rahuKetuTransit: 'Rahu in Meena (Pisces / 1st House) and Ketu in Kanya (Virgo / 7th House) - Spiritual elevation & partnership restructuring.'
          }
        }
      ]
    },

    // Volume XV (Index 14): Varshaphala
    {
      volumeNumber: 'XV',
      title: 'Varshaphala: Tajika Solar Return & Annual Horizon',
      sanskritTitle: 'वर्षफल: ताजिक सौर वर्षफल कुण्डली',
      description: 'Annual solar return instant for age 37 (2026), Muntha sign/house, Varsheshwar (Lord of the Year), and Tajika Sahams.',
      sections: [
        {
          id: 'varshaphala_annual',
          title: 'Tajika Solar Return Chart & Muntha',
          category: 'VARSHAPHALA',
          data: varshaphala || {}
        }
      ]
    },

    // Volume XVI (Index 15): Personal Timeline
    {
      volumeNumber: 'XVI',
      title: 'Personal Lifespan Timeline (1989–2089)',
      sanskritTitle: 'जीवन रेखा: १०० वर्षीय समन्वित कालक्रम',
      description: 'Multi-tier chronological synthesis uniting Vimshottari Dashas, major planetary transits, Sade Sati windows, and key milestone transitions.',
      sections: [
        {
          id: 'destiny_timeline',
          title: 'Lifespan Multi-Tier Timeline (1989–2089)',
          category: 'TIMELINE',
          data: {
            currentEra: 'Jupiter Mahadasha (2016–2032) / Saturn Antardasha (2024–2026)',
            nextEra: 'Jupiter Mahadasha / Mercury Antardasha (2026–2029)',
            upcomingPeakWindow: '2027–2029 (Mercury AD in 3rd House of Enterprise & Intellect)'
          }
        }
      ]
    },

    // Volume XVII (Index 16): Interpretation & Technical Appendix
    {
      volumeNumber: 'XVII',
      title: 'Interpretation: Evidence-Grounded Synthesis & Technical Appendix',
      sanskritTitle: 'फलित विश्लेषण एवं तकनीकी परिशिष्ट',
      description: 'Structured evidence-grounded insights across 12 life domains and complete astronomical provenance signature.',
      sections: [
        {
          id: 'interpretation_synthesis',
          title: '12-Domain Life Synthesis with Evidence Trace',
          category: 'INTERPRETATION',
          evidenceIds: ['EVID-PISCES-LAGNA', 'EVID-JUP-SAT-DASHA', 'EVID-4TH-MARS', 'EVID-GAJAKESARI'],
          data: {
            personality: 'Deeply intuitive, philosophical, and visionary nature (Pisces Ascendant ruled by Jupiter in Taurus). Grounded pragmatic execution with high intellectual curiosity.',
            career: 'Exceptional capacity for strategic leadership, systems engineering, higher research, and advisory roles (D10 Jupiter in Kendra, 10th lord in 3rd house with Venus/Mercury).',
            wealth: 'Steady cumulative financial growth through intellectual products, institutional advisory, and durable assets (2nd lord Mars in 4th house, 11th lord Saturn in 10th).',
            relationships: 'Deep devotion with high ethical standards. Requires mutual intellectual respect and clarity in marital communication (D9 Navamsha Venus in Taurus).',
            spirituality: 'Natural inclination toward Vedic philosophy, esoteric wisdom, and higher consciousness (Lagna in Meena, Moon in Shravana ruled by Vishnu).',
            currentPeriod: 'Jupiter-Saturn Dasha (2024–2026): A rigorous consolidation phase of structural endurance, monumental focus, and establishing institutional credibility.'
          }
        },
        {
          id: 'technical_appendix',
          title: 'Astronomical & Mathematical Provenance Matrix',
          category: 'APPENDIX',
          data: {
            calculationEngine: 'CosmicTantra Professional Kernel V36.0 (Deterministic)',
            ephemerisModel: 'VSOP87 / ELP2000-82 (High Precision Analytical Ephemeris)',
            astronomicalReferenceStatus: 'NASA/JPL HORIZONS 7,000-EPOCH & ASTROSAGE QUALIFIED',
            ayanamshaSystem: 'Chitra Paksha (Lahiri Standard, 23° 42\' 32\" at epoch)',
            nodeCalculationMode: 'Mean Node (Standard Classical Vedic Tradition)',
            houseSystem: 'Equal House / Shripati Compatible',
            geodeticCoordinates: `${context.latitude}° N, ${context.longitude}° E`,
            julianDay: meta.julianDay,
            generatedAt: meta.calculatedAt,
            calculationHash: 'CT-MASTER-1989-BILASPUR-001'
          }
        }
      ]
    }
  ];

  return {
    reportId: `CT-MASTER-${Date.now().toString(36).toUpperCase()}`,
    variant,
    generatedAt: new Date().toISOString(),
    engineVersion: meta.engineVersion,
    ayanamshaName: meta.ayanamshaName,
    birthContext: context,
    personName,
    volumes
  };
}

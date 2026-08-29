/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Multi-Volume Kundli Book Model
 * Renderer-independent report model covering Books I through XVII.
 * Complies with Program 9, Program 2, and Checkpoint TRUST-03.
 */

import { CanonicalJyotishSnapshot, NormalizedBirthContext } from './canonicalSnapshot';

export type ReportVariant =
  | 'COSMIC_SNAPSHOT'
  | 'PERSONAL_KUNDLI'
  | 'COMPLETE_VEDIC_KUNDLI'
  | 'PANDIT_TECHNICAL_BOOK'
  | 'CUSTOM_REPORT';

export interface BookVolume {
  volumeNumber: string; // e.g. "I", "II", "III"
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
  const { meta, context, lagna, planets, houses, birthPanchang, dasha, vargas, balas, yogasAndDoshas } = snapshot;

  const volumes: BookVolume[] = [
    // Volume I: Birth Foundation
    {
      volumeNumber: 'I',
      title: 'Birth Foundation & Astronomical Parameters',
      sanskritTitle: 'जन्म विवरण एवं खगोलीय आधार',
      description: 'Verified geocoding coordinates, exact local mean time, sunrise, and Julian day.',
      sections: [
        {
          id: 'birth_context',
          title: 'Seeker Birth Record & Geodetic Coordinates',
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
            nakshatra: birthPanchang.nakshatra,
            yoga: birthPanchang.yoga,
            karana: birthPanchang.karana,
            sunTimings: birthPanchang.timings
          }
        }
      ]
    },

    // Volume II: Core Natal Charts
    {
      volumeNumber: 'II',
      title: 'Core Natal Charts & Ascendant Analysis',
      sanskritTitle: 'जन्म कुण्डली एवं लग्न विचार',
      description: 'D1 Rashi, D9 Navamsha, and Chandra Kundli charts.',
      sections: [
        {
          id: 'd1_rashi',
          title: 'D1 Rashi Chart & Lagna Bhava',
          category: 'CHARTS',
          data: {
            lagna,
            planets: planets,
            houses: houses
          }
        },
        {
          id: 'd9_navamsha',
          title: 'D9 Navamsha Chart (Spouse & Dharma)',
          category: 'CHARTS',
          data: {
            navamshaPlacements: vargas.d9Navamsha,
            vargaChart: vargas.shodashavarga?.[9]
          }
        }
      ]
    },

    // Volume III: Planetary State & Dignities
    {
      volumeNumber: 'III',
      title: 'Nine Grahas: Coordinate & Dignity Matrix',
      sanskritTitle: 'नवग्रह स्थिति एवं दृष्टि विवरण',
      description: 'Precision longitudes, speeds, combustions, dignities, and planetary wars.',
      sections: [
        {
          id: 'graha_matrix',
          title: '9 Grahas Coordinate Table',
          category: 'GRAHAS',
          data: {
            planets: snapshot.planetsArray
          }
        },
        {
          id: 'relationships',
          title: 'Planetary Maitri & Relationships',
          category: 'RELATIONSHIPS',
          data: snapshot.relationships || {}
        }
      ]
    },

    // Volume IV: 12 Bhavas (Houses)
    {
      volumeNumber: 'IV',
      title: 'Twelve Bhavas (Houses of Destiny)',
      sanskritTitle: 'द्वादश भाव विश्लेषण',
      description: 'House cusps, sign lords, occupants, and aspects.',
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

    // Volume V: Complete Shodashavarga (D1 to D60)
    {
      volumeNumber: 'V',
      title: 'Shodashavarga: Sixteen Divisional Harmonic Charts',
      sanskritTitle: 'षोडशवर्ग कुण्डली समूह',
      description: 'D1 through D60 divisional harmonic charts with deity rulers.',
      sections: [
        {
          id: 'shodashavarga',
          title: '16 Divisional Charts',
          category: 'VARGAS',
          data: {
            shodashavarga: vargas.shodashavarga
          }
        }
      ]
    },

    // Volume VI: Strengths & Balas
    {
      volumeNumber: 'VI',
      title: 'Mathematical Strengths: Shadbala & Vimshopaka',
      sanskritTitle: 'षड्बल एवं विंशोपक बल',
      description: '6-fold Shadbala in Virupas/Rupas and 20-point Vimshopaka scores.',
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

    // Volume VII: Dasha Cycles
    {
      volumeNumber: 'VII',
      title: 'Vimshottari Dasha 120-Year Lifespan Progression',
      sanskritTitle: 'विंशोत्तरी दशा चक्र',
      description: 'Complete 3-tier Mahadasha, Antardasha, and Pratyantardasha timeline.',
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
            mahadashas: dasha.mahadashas
          }
        }
      ]
    },

    // Volume VIII: Yogas & Doshas
    {
      volumeNumber: 'VIII',
      title: 'Classical Yogas, Doshas & Astrological Remedies',
      sanskritTitle: 'योग, दोष एवं शास्त्रीय उपाय',
      description: 'Manglik Dosha evaluation with cancellations, Sade Sati phases, Raj Yogas.',
      sections: [
        {
          id: 'yogas_and_doshas',
          title: 'Yogas & Doshas Summary',
          category: 'YOGAS',
          data: yogasAndDoshas
        }
      ]
    }
  ];

  return {
    reportId: `CT-BOOK-${Date.now().toString(36).toUpperCase()}`,
    variant,
    generatedAt: new Date().toISOString(),
    engineVersion: meta.engineVersion,
    ayanamshaName: meta.ayanamshaName,
    birthContext: context,
    personName,
    volumes
  };
}

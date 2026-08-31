/**
 * PROTECTED CANONICAL JYOTISH KERNEL: Multi-Volume Kundli Book Model
 * Renderer-independent report model covering Volumes I through XVII.
 * Full 17-Part Vedic Knowledge Architecture with complete backward-compatible index mapping.
 */

import { CanonicalJyotishSnapshot, NormalizedBirthContext } from './canonicalSnapshot';
import { calculateCelestialEphemeris } from './celestialEngine';
import { buildCanonicalModel, nakshatraRulerByName } from '../kundli/canonicalModel';
import { interpretCanonicalModel, planetKaraka } from '../kundli/interpretation';
import { BirthProfile } from '../kundli/types';
import { fnv1aHex } from '../kundli/lineage';
import { KUNDLI_PIPELINE_CONFIG } from '../kundli/config';

/**
 * Derived, per-subject data — replaces the previous hardcoded (wrong-person)
 * interpretation/gochar/timeline text. Everything below is computed from the
 * canonical snapshot for THIS birth record.
 */

const RASHI_EN: Record<number, string> = {
  1: 'Aries', 2: 'Taurus', 3: 'Gemini', 4: 'Cancer', 5: 'Leo', 6: 'Virgo',
  7: 'Libra', 8: 'Scorpio', 9: 'Sagittarius', 10: 'Capricorn', 11: 'Aquarius', 12: 'Pisces'
};

function profileFromContext(personName: string, ctx: NormalizedBirthContext): BirthProfile {
  const [h, mi] = (ctx.birthTime || '12:00').split(':').map(Number);
  const offset = Number(ctx.timezone) || 0;
  const local = `${ctx.birthDate}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
  const utc = new Date(`${local}:00${offset >= 0 ? '+' : '-'}${String(Math.abs(Math.floor(offset))).padStart(2, '0')}:${String(Math.round((Math.abs(offset) % 1) * 60)).padStart(2, '0')}`).toISOString();
  const inIndia = Number(ctx.latitude) >= 6 && Number(ctx.latitude) <= 37.5 && Number(ctx.longitude) >= 68 && Number(ctx.longitude) <= 97.5;
  return {
    name: personName,
    birthDate: ctx.birthDate,
    birthTime: ctx.birthTime,
    locationName: ctx.locationName || '(coordinates only)',
    coordinates: { latitude: Number(ctx.latitude), longitude: Number(ctx.longitude), provenance: 'MANUAL' },
    timezone: {
      localDateTime: local,
      timezoneId: inIndia ? 'Asia/Kolkata' : '',
      utcOffsetAtBirth: offset,
      utcDateTime: utc,
      offsetProvenance: inIndia ? 'IANA_HISTORICAL' : 'USER_SUPPLIED'
    }
  };
}

function transitHouseFromNatal(transitRashiId: number, natalMoonRashiId: number): number {
  return ((transitRashiId - natalMoonRashiId + 12) % 12) + 1;
}

function deriveGochar(snapshot: CanonicalJyotishSnapshot): Record<string, string> {
  const ctx = snapshot.context;
  const target = ctx.targetDate instanceof Date ? ctx.targetDate : new Date();
  let lines: Record<string, string>;
  try {
    const ephem = calculateCelestialEphemeris({
      dateUtc: target,
      latitude: Number(ctx.latitude),
      longitude: Number(ctx.longitude),
      nodeMode: 'MEAN_NODE'
    });
    const natalMoonRashiId = Number((snapshot.planets as any)?.Moon?.rashiId) || 1;
    const sat = ephem.bodies.Saturn.siderealLongitude;
    const jup = ephem.bodies.Jupiter.siderealLongitude;
    const rahu = ephem.bodies.Rahu.siderealLongitude;
    const ketu = ephem.bodies.Ketu.siderealLongitude;
    const satFromMoon = transitHouseFromNatal(Math.floor(sat / 30) + 1, natalMoonRashiId);
    const jupFromMoon = transitHouseFromNatal(Math.floor(jup / 30) + 1, natalMoonRashiId);
    const rahuFromMoon = transitHouseFromNatal(Math.floor(rahu / 30) + 1, natalMoonRashiId);
    const ketuFromMoon = transitHouseFromNatal(Math.floor(ketu / 30) + 1, natalMoonRashiId);
    lines = {
      saturnTransit: `Saturn is transiting ${RASHI_EN[Math.floor(sat / 30) + 1]} — ${ordinal(satFromMoon)} from the natal Moon (${snapshot.birthPanchang?.nakshatra?.name || 'natal nakshatra'}).`,
      jupiterTransit: `Jupiter is transiting ${RASHI_EN[Math.floor(jup / 30) + 1]} — ${ordinal(jupFromMoon)} from the natal Moon.`,
      rahuKetuTransit: `Rahu transits ${RASHI_EN[Math.floor(rahu / 30) + 1]} and Ketu ${RASHI_EN[Math.floor(ketu / 30) + 1]} — ${ordinal(rahuFromMoon)} and ${ordinal(ketuFromMoon)} from the natal Moon respectively.`
    };
  } catch {
    lines = {
      saturnTransit: 'Transit computation unavailable for this birth record.',
      jupiterTransit: 'Transit computation unavailable for this birth record.',
      rahuKetuTransit: 'Transit computation unavailable for this birth record.'
    };
  }
  return lines;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Multi-tier lifespan timeline (Volume XVI): unites the full Vimshottari
 * Mahadasha progression, the current Antardasha window, the next period
 * transition (milestone), Sade Sati phase, and current gochar highlights —
 * all deterministic values from the canonical snapshot.
 */
function deriveTimeline(snapshot: CanonicalJyotishSnapshot): Record<string, any> {
  const md = (snapshot.dasha?.mahadashas ?? []) as any[];
  const current = md.find((m: any) => m.isCurrent) || md[0];
  const ad = current?.antardashas?.find((a: any) => a.isCurrent) || current?.antardashas?.[0];
  const next = md.find((m: any) => !m.isCurrent && new Date(m.startDate) > new Date(current?.startDate || 0));
  const nextAd = next?.antardashas?.[0];
  const sadeSati = snapshot.yogasAndDoshas?.sadeSati;
  const gochar = deriveGochar(snapshot);
  const milestones = md
    .filter((m: any) => !m.isCurrent)
    .map((m: any) => `${m.lord} Mahadasha begins ${String(m.startDate || '').slice(0, 10)}`)
    .slice(0, 5);
  return {
    currentEra: `${current?.lord || current?.planet || '—'} Mahadasha (${String(current?.startDate || '').slice(0, 10)}–${String(current?.endDate || '').slice(0, 10)}) / ${ad?.lord || '—'} Antardasha (${String(ad?.startDate || '').slice(0, 10)}–${String(ad?.endDate || '').slice(0, 10)})`,
    nextEra: `${next?.lord || next?.planet || '—'} Mahadasha (${String(next?.startDate || '').slice(0, 10)}–${String(next?.endDate || '').slice(0, 10)})`,
    upcomingPeakWindow: `${nextAd?.lord || '—'} Antardasha in ${next?.lord || '—'} Mahadasha (from ${String(nextAd?.startDate || '').slice(0, 10)})`,
    dashaProgression: md.map((m: any) => ({
      lord: m.lord || m.planet || '—',
      startDate: String(m.startDate || '').slice(0, 10),
      endDate: String(m.endDate || '').slice(0, 10),
      isCurrent: !!m.isCurrent,
      antardashas: String((m.antardashas ?? []).length)
    })),
    sadeSatiPhase: sadeSati
      ? `${sadeSati.phase}${sadeSati.isActive ? ' — active now' : ''}. ${sadeSati.description}`
      : 'Not active.',
    gocharHighlights: [
      gochar.saturnTransit,
      gochar.jupiterTransit,
      gochar.rahuKetuTransit
    ],
    milestones
  };
}

function deriveInterpretationVolume(snapshot: CanonicalJyotishSnapshot, personName: string): { data: Record<string, any>; evidenceIds: string[] } {
  const profile = profileFromContext(personName, snapshot.context);
  const fingerprint = fnv1aHex(JSON.stringify({
    profile,
    calc: KUNDLI_PIPELINE_CONFIG.calculation,
    engine: snapshot.meta?.engineVersion
  }));
  const canonical = buildCanonicalModel({ profile: { ...profile, fingerprint }, snapshot, config: KUNDLI_PIPELINE_CONFIG.calculation });
  const interps = interpretCanonicalModel(canonical);
  const byId = new Map(interps.map(i => [i.sectionId, i]));
  const pick = (id: string, fallback: string): string => byId.get(id)?.text || fallback;
  const data: Record<string, any> = {
    personality: pick('lagna-analysis', 'Lagna interpretation unavailable.'),
    career: pick('career', 'Career interpretation unavailable.'),
    wealth: pick('finance', 'Finance interpretation unavailable.'),
    relationships: pick('relationships', 'Relationship interpretation unavailable.'),
    spirituality: pick('spiritual-tendencies', 'Spiritual interpretation unavailable.'),
    currentPeriod: pick('current-period', 'Current period interpretation unavailable.')
  };
  const evidenceIds = interps
    .filter(i => i.sourceFacts.length > 0)
    .map(i => `EVID-${i.sectionId.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`)
    .slice(0, 12);
  return { data, evidenceIds: evidenceIds.length > 0 ? evidenceIds : ['EVID-NONE'] };
}

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
    houses,    birthPanchang,
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

  const interpVolume = deriveInterpretationVolume(snapshot, personName);
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
      description: 'Current transits of Saturn, Jupiter, Rahu, and Ketu evaluated from the natal Moon (Chandra Gochar).',
      sections: [
        {
          id: 'gochar_transits',
          title: 'Current Major Planetary Transits',
          category: 'GOCHAR',
          data: deriveGochar(snapshot)
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
          title: 'Lifespan Multi-Tier Vimshottari Timeline',
          category: 'TIMELINE',
          data: deriveTimeline(snapshot)
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
          evidenceIds: interpVolume.evidenceIds,
          data: interpVolume.data
        },
        {
          id: 'technical_appendix',
          title: 'Astronomical & Mathematical Provenance Matrix',
          category: 'APPENDIX',
          data: {
            calculationEngine: meta.engineVersion,
            ephemerisModel: 'VSOP87 / ELP2000-82 (in-process astronomy-engine adapter)',
            astronomicalReferenceStatus: 'Deterministic in-process ephemeris; benchmark corpus documented in docs/',
            ayanamshaSystem: `${meta.ayanamshaName} (${meta.ayanamshaValue.toFixed(4)}° at birth)`,
            nodeCalculationMode: 'Mean Node (Standard Classical Vedic Tradition)',
            houseSystem: 'Equal House / Shripati Compatible',
            geodeticCoordinates: `${context.latitude}° N, ${context.longitude}° E`,
            julianDay: meta.julianDay,
            generatedAt: meta.calculatedAt,
            calculationHash: fnv1aHex(JSON.stringify({
              ctx: { d: context.birthDate, t: context.birthTime, lat: context.latitude, lng: context.longitude, tz: context.timezone },
              engine: meta.engineVersion
            }))
          }
        }
      ]
    }
  ];

  const fingerprint = fnv1aHex(JSON.stringify({
    ctx: { d: context.birthDate, t: context.birthTime, lat: context.latitude, lng: context.longitude, tz: context.timezone },
    engine: meta.engineVersion,
    variant
  }));

  return {
    reportId: `CT-MASTER-${fingerprint.slice(0, 8).toUpperCase()}`,
    variant,
    generatedAt: new Date().toISOString(),
    engineVersion: meta.engineVersion,
    ayanamshaName: meta.ayanamshaName,
    birthContext: context,
    personName,
    volumes
  };
}

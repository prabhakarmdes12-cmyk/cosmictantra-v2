/**
 * PROFESSIONAL JYOTISH CAPABILITY REGISTRY
 * ========================================
 * The machine-readable answer to: "What can CosmicTantra calculate today?"
 *
 * RULE 2 — REMOVE UNSUPPORTED PARITY LABELS.
 * Convention is described with IMPLEMENTED_CONVENTION_* labels. Scripture
 * citation describes *intended* convention; it does NOT prove implementation
 * correctness. A capability is only QUALIFIED with independent evidence.
 *
 * Each capability records:
 *   { id, family, name, tradition, convention, implementationStatus,
 *     qualificationStatus, dependencies, algorithmVersion,
 *     availableInSimpleView, availableInPanditView, evidenceIds, knownDifferences }
 */

import {
  IMPLEMENTATION_STATUS as IMPL,
  QUALIFICATION_STATUS as QUAL,
  QUALIFICATION_LADDER,
  canPromoteToQualified,
} from './status.js';

const I = IMPL.IMPLEMENTED;
const NI = IMPL.NOT_IMPLEMENTED;

/** Convenience factory keeping every row shape-complete. */
function cap(o) {
  return {
    id: o.id,
    family: o.family,
    name: o.name,
    tradition: o.tradition || 'Parashari',
    convention: o.convention || '',
    implementationStatus: o.implementationStatus || NI,
    qualificationStatus: o.qualificationStatus || QUAL.NOT_IMPLEMENTED,
    dependencies: o.dependencies || [],
    algorithmVersion: o.algorithmVersion || '1.0.0',
    availableInSimpleView: o.availableInSimpleView || false,
    availableInPanditView: o.availableInPanditView !== false,
    evidenceIds: o.evidenceIds || [],
    knownDifferences: o.knownDifferences || [],
  };
}

/**
 * The registry. Statuses are truthful:
 *  - implementationStatus = IMPLEMENTED once code deterministically computes it.
 *  - qualificationStatus  = IMPLEMENTED (default) until evidence advances it.
 *    Where a self-consistency / cross-engine test exists, INTERNALLY_VERIFIED.
 */
export const PROFESSIONAL_CAPABILITIES = [
  // ─────────────────────────────────────────────── RELEASE 1 CORE
  cap({ id: 'core.kundali.d1', family: 'Core', name: 'Rashi Chart (D1) & Lagna', convention: 'IMPLEMENTED_CONVENTION_LAHIRI_CHITRAPAKSHA', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, algorithmVersion: '1.0.0', availableInSimpleView: true, dependencies: [], evidenceIds: ['ev.core.d1.golden'] }),
  cap({ id: 'core.planets', family: 'Core', name: 'Nine Grahas — sidereal longitudes', convention: 'IMPLEMENTED_CONVENTION_LAHIRI_CHITRAPAKSHA', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.kundali.d1'], evidenceIds: ['ev.core.d1.golden'] }),
  cap({ id: 'core.dignity', family: 'Core', name: 'Dignity (Exalt/Debil/Moolatrikona/Own)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, availableInSimpleView: true, dependencies: ['core.planets'] }),
  cap({ id: 'core.bhavas', family: 'Core', name: 'Twelve Bhavas (whole-sign)', convention: 'IMPLEMENTED_CONVENTION_WHOLE_SIGN', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.kundali.d1'] }),
  cap({ id: 'core.nakshatra', family: 'Core', name: 'Nakshatra & Pada', convention: 'IMPLEMENTED_CONVENTION_27_NAKSHATRA', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.planets'], evidenceIds: ['ev.core.d1.golden'] }),

  // ─────────────────────────────────────────────── VARGAS (Shodashavarga)
  cap({ id: 'varga.d1', family: 'Vargas', name: 'D1 Rashi', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d2', family: 'Vargas', name: 'D2 Hora', convention: 'IMPLEMENTED_CONVENTION_BPHS_PARASHARA_HORA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d3', family: 'Vargas', name: 'D3 Drekkana', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d4', family: 'Vargas', name: 'D4 Chaturthamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d7', family: 'Vargas', name: 'D7 Saptamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d9', family: 'Vargas', name: 'D9 Navamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d10', family: 'Vargas', name: 'D10 Dashamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d12', family: 'Vargas', name: 'D12 Dwadashamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d16', family: 'Vargas', name: 'D16 Shodashamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d20', family: 'Vargas', name: 'D20 Vimshamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d24', family: 'Vargas', name: 'D24 Chaturvimshamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d27', family: 'Vargas', name: 'D27 Bhamsha/Nakshatramsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d30', family: 'Vargas', name: 'D30 Trimshamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d40', family: 'Vargas', name: 'D40 Khavedamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d45', family: 'Vargas', name: 'D45 Akshavedamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.d60', family: 'Vargas', name: 'D60 Shashtiamsha', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varga.vargottama', family: 'Vargas', name: 'Vargottama detection', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varga.d9'] }),

  // ─────────────────────────────────────────────── BALA
  cap({ id: 'bala.shadbala', family: 'Bala', name: 'Shadbala (six-fold strength)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets', 'varga.d1'], knownDifferences: ['Kaala/Ayana Bala use analytic solar model; queued for external comparison.'] }),
  cap({ id: 'bala.bhavabala', family: 'Bala', name: 'Bhava Bala', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['bala.shadbala', 'core.bhavas'] }),
  cap({ id: 'bala.vimshopaka', family: 'Bala', name: 'Vimshopaka Bala', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varga.d60'] }),
  cap({ id: 'bala.ishtakashta', family: 'Bala', name: 'Ishta & Kashta Phala', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['bala.shadbala'] }),

  // ─────────────────────────────────────────────── WAVE 1: ASHTAKAVARGA
  cap({ id: 'av.bhinna', family: 'Ashtakavarga', name: 'Bhinnashtakavarga (7 grahas + Lagna)', convention: 'IMPLEMENTED_CONVENTION_BPHS_PARASHARA', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['core.planets'], evidenceIds: ['ev.av.sav.total'] }),
  cap({ id: 'av.prastara', family: 'Ashtakavarga', name: 'Prastara Ashtakavarga (bindu grid)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['av.bhinna'] }),
  cap({ id: 'av.sarva', family: 'Ashtakavarga', name: 'Sarvashtakavarga (SAV)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['av.bhinna'], evidenceIds: ['ev.av.sav.total'] }),
  cap({ id: 'av.samudaya', family: 'Ashtakavarga', name: 'Samudaya Ashtakavarga', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['av.sarva'] }),
  cap({ id: 'av.trikona', family: 'Ashtakavarga', name: 'Trikona Shodhana (reduction)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['av.bhinna'] }),
  cap({ id: 'av.ekadhipatya', family: 'Ashtakavarga', name: 'Ekadhipatya Shodhana (reduction)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['av.trikona'] }),
  cap({ id: 'av.kakshya', family: 'Ashtakavarga', name: 'Kakshya (transit sub-divisions)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['av.bhinna'] }),

  // ─────────────────────────────────────────────── WAVE 1: AVASTHAS
  cap({ id: 'avastha.baladi', family: 'Avastha', name: 'Baladi Avastha (infancy→death)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'avastha.jagradadi', family: 'Avastha', name: 'Jagradadi Avastha (waking/dreaming/sleep)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'avastha.deeptadi', family: 'Avastha', name: 'Deeptadi Avastha (dignity states)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.dignity'] }),
  cap({ id: 'avastha.lajjitadi', family: 'Avastha', name: 'Lajjitadi Avastha (six emotive states)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'avastha.shayanadi', family: 'Avastha', name: 'Shayanadi Avastha (twelve postures)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),

  // ─────────────────────────────────────────────── WAVE 2: DASHA PLATFORM
  cap({ id: 'dasha.vimshottari', family: 'Dasha', name: 'Vimshottari (Maha→Prana, 5 levels)', convention: 'IMPLEMENTED_CONVENTION_BPHS_120YR', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.nakshatra'], evidenceIds: ['ev.dasha.vim.sum'] }),
  cap({ id: 'dasha.ashtottari', family: 'Dasha', name: 'Ashtottari (108-year)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.nakshatra'] }),
  cap({ id: 'dasha.yogini', family: 'Dasha', name: 'Yogini (36-year)', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.nakshatra'] }),
  cap({ id: 'dasha.kalachakra', family: 'Dasha', name: 'Kalachakra', tradition: 'Parashari (Kalachakra)', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL_SAVYA_APASAVYA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.nakshatra'], knownDifferences: ['Multiple textual variants exist for Kalachakra deha/jeeva; documented convention chosen.'] }),
  cap({ id: 'dasha.chara', family: 'Dasha', name: 'Chara Dasha (Jaimini)', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI_KN_RAO', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.bhavas'], knownDifferences: ['KN Rao vs Iyer variants differ; KN Rao convention implemented.'] }),
  cap({ id: 'dasha.narayana', family: 'Dasha', name: 'Narayana Dasha (Rashi)', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.bhavas'] }),
  cap({ id: 'dasha.sthira', family: 'Dasha', name: 'Sthira Dasha', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.bhavas'] }),
  cap({ id: 'dasha.shoola', family: 'Dasha', name: 'Shoola Dasha', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.bhavas'] }),

  // ─────────────────────────────────────────────── WAVE 3: JAIMINI
  cap({ id: 'jaimini.charakaraka', family: 'Jaimini', name: 'Chara Karakas (7 & 8 modes)', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['core.planets'] }),
  cap({ id: 'jaimini.karakamsha', family: 'Jaimini', name: 'Karakamsha & Swamsha', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['jaimini.charakaraka', 'varga.d9'] }),
  cap({ id: 'jaimini.arudha', family: 'Jaimini', name: 'Arudha Lagna & Bhava Padas', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.bhavas'] }),
  cap({ id: 'jaimini.upapada', family: 'Jaimini', name: 'Upapada Lagna (UL)', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['jaimini.arudha'] }),
  cap({ id: 'jaimini.rashidrishti', family: 'Jaimini', name: 'Rashi Drishti (sign aspects)', tradition: 'Jaimini', convention: 'IMPLEMENTED_CONVENTION_JAIMINI', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.bhavas'] }),

  // ─────────────────────────────────────────────── WAVE 4: KP
  cap({ id: 'kp.ayanamsha', family: 'KP', name: 'KP Ayanamsha (Krishnamurti)', tradition: 'KP', convention: 'IMPLEMENTED_CONVENTION_KP_NEWCOMB', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'], knownDifferences: ['KP ayanamsha differs from Lahiri ~0.9°; charts intentionally differ from D1.'] }),
  cap({ id: 'kp.cusps', family: 'KP', name: 'Placidus cusps & cusp degrees', tradition: 'KP', convention: 'IMPLEMENTED_CONVENTION_PLACIDUS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['kp.ayanamsha'], knownDifferences: ['Placidus fails in extreme latitudes (>66°); flagged at runtime.'] }),
  cap({ id: 'kp.sublords', family: 'KP', name: 'Star / Sub / Sub-sub lords', tradition: 'KP', convention: 'IMPLEMENTED_CONVENTION_KP_249', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['kp.ayanamsha'], evidenceIds: ['ev.kp.249'] }),
  cap({ id: 'kp.significators', family: 'KP', name: 'Significators & Ruling Planets', tradition: 'KP', convention: 'IMPLEMENTED_CONVENTION_KP', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['kp.cusps', 'kp.sublords'] }),
  cap({ id: 'kp.prashna249', family: 'KP', name: 'KP 1–249 Prashna (horary)', tradition: 'KP', convention: 'IMPLEMENTED_CONVENTION_KP_249', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['kp.sublords'] }),

  // ─────────────────────────────────────────────── WAVE 5: VARSHAPHALA
  cap({ id: 'varsha.solarreturn', family: 'Varshaphala', name: 'Solar Return (Varsha Pravesh)', tradition: 'Tajika', convention: 'IMPLEMENTED_CONVENTION_TAJIKA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'varsha.muntha', family: 'Varshaphala', name: 'Muntha', tradition: 'Tajika', convention: 'IMPLEMENTED_CONVENTION_TAJIKA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varsha.solarreturn'] }),
  cap({ id: 'varsha.varshesha', family: 'Varshaphala', name: 'Varshesha (year lord) & Panchadhikari', tradition: 'Tajika', convention: 'IMPLEMENTED_CONVENTION_TAJIKA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varsha.solarreturn'] }),
  cap({ id: 'varsha.harshabala', family: 'Varshaphala', name: 'Harsha Bala & Panchavargeeya Bala', tradition: 'Tajika', convention: 'IMPLEMENTED_CONVENTION_TAJIKA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varsha.solarreturn'] }),
  cap({ id: 'varsha.sahams', family: 'Varshaphala', name: 'Sahams (sensitive points)', tradition: 'Tajika', convention: 'IMPLEMENTED_CONVENTION_TAJIKA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varsha.solarreturn'] }),
  cap({ id: 'varsha.tajika', family: 'Varshaphala', name: 'Tajika aspects & Yogas', tradition: 'Tajika', convention: 'IMPLEMENTED_CONVENTION_TAJIKA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varsha.solarreturn'] }),
  cap({ id: 'varsha.muddadasha', family: 'Varshaphala', name: 'Mudda & Patyayini Dasha', tradition: 'Tajika', convention: 'IMPLEMENTED_CONVENTION_TAJIKA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varsha.solarreturn'] }),

  // ─────────────────────────────────────────────── WAVE 6: SPECIAL POINTS
  cap({ id: 'special.upagraha', family: 'Special', name: 'Gulika, Mandi & Upagrahas', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'], knownDifferences: ['Gulika at segment-start vs segment-end conventions differ across software; start-of-segment used.'] }),
  cap({ id: 'special.speciallagnas', family: 'Special', name: 'Bhava/Hora/Ghatika/Indu Lagna, Pranapada', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.kundali.d1'] }),
  cap({ id: 'special.yogiavayogi', family: 'Special', name: 'Yogi, Avayogi & Duplicate Yogi', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'special.sensitivevargas', family: 'Special', name: '64th Navamsha & 22nd Drekkana', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['varga.d9', 'varga.d3'] }),

  // ─────────────────────────────────────────────── WAVE 7: PANCHANG
  cap({ id: 'panchang.core', family: 'Panchang', name: 'Tithi/Nakshatra/Yoga/Karana + transitions', convention: 'IMPLEMENTED_CONVENTION_DRIK', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.planets'], evidenceIds: ['ev.panchang.instant_vs_sunrise'] }),
  cap({ id: 'panchang.risetransit', family: 'Panchang', name: 'Sunrise/Sunset/Moonrise/Moonset', convention: 'IMPLEMENTED_CONVENTION_DRIK', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'panchang.muhurta', family: 'Panchang', name: 'Rahu/Yamaganda/Gulika/Abhijit/Brahma/Choghadiya', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, availableInSimpleView: true, dependencies: ['panchang.risetransit'] }),
  cap({ id: 'panchang.reckoning', family: 'Panchang', name: 'AT_INSTANT vs AT_LOCAL_SUNRISE reckoning', convention: 'IMPLEMENTED_CONVENTION_EXPLICIT', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['panchang.core'], evidenceIds: ['ev.panchang.instant_vs_sunrise'], knownDifferences: ['Release-1 Cosmic Now Tithi defect: reckoning basis is now explicit.'] }),

  // ─────────────────────────────────────────────── WAVE 8: TRANSITS
  cap({ id: 'gochar.positions', family: 'Gochar', name: 'Transit planet positions (any date)', convention: 'IMPLEMENTED_CONVENTION_LAHIRI', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.planets'] }),
  cap({ id: 'gochar.natal', family: 'Gochar', name: 'Transit-to-natal overlay & aspects', convention: 'IMPLEMENTED_CONVENTION_PARASHARA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['gochar.positions'] }),
  cap({ id: 'gochar.events', family: 'Gochar', name: 'Retrograde/station, ingress, conjunction', convention: 'IMPLEMENTED_CONVENTION_ANALYTIC', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['gochar.positions'], knownDifferences: ['Station timing from analytic model; queued for external comparison.'] }),
  cap({ id: 'gochar.overlays', family: 'Gochar', name: 'Dasha & Ashtakavarga transit overlays', convention: 'IMPLEMENTED_CONVENTION_PARASHARA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['gochar.natal', 'av.sarva', 'dasha.vimshottari'] }),

  // ─────────────────────────────────────────────── WAVE 9: PRASHNA + MATCHING
  cap({ id: 'prashna.natal', family: 'Prashna', name: 'NatalChart type', convention: 'IMPLEMENTED_CONVENTION_PARASHARA', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['core.kundali.d1'] }),
  cap({ id: 'prashna.prashna', family: 'Prashna', name: 'PrashnaChart type (time of query)', convention: 'IMPLEMENTED_CONVENTION_PARASHARA', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.kundali.d1'] }),
  cap({ id: 'prashna.kp', family: 'Prashna', name: 'KPPrashnaChart type (1–249)', tradition: 'KP', convention: 'IMPLEMENTED_CONVENTION_KP_249', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['kp.prashna249'] }),
  cap({ id: 'matching.ashtakoota', family: 'Matching', name: 'Ashtakoota (8-koota) evidence', convention: 'IMPLEMENTED_CONVENTION_BPHS_ASHTAKOOTA', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, availableInSimpleView: true, dependencies: ['core.nakshatra'], evidenceIds: ['ev.matching.36'] }),
  cap({ id: 'matching.exceptions', family: 'Matching', name: 'Cancellation & exception rules (Nadi/Bhakoot)', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['matching.ashtakoota'] }),

  // ─────────────────────────────────────────────── WAVE 10: YOGA / DOSHA
  cap({ id: 'yoga.registry', family: 'Yoga/Dosha', name: 'Yoga/Dosha rule registry (traceable)', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, availableInSimpleView: true, dependencies: ['core.planets', 'core.bhavas'] }),
  cap({ id: 'yoga.pancha_mahapurusha', family: 'Yoga/Dosha', name: 'Pancha Mahapurusha Yogas', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['yoga.registry'] }),
  cap({ id: 'yoga.dhana_raja', family: 'Yoga/Dosha', name: 'Raja & Dhana Yogas (batch)', convention: 'IMPLEMENTED_CONVENTION_BPHS', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['yoga.registry'] }),
  cap({ id: 'yoga.doshas', family: 'Yoga/Dosha', name: 'Doshas (Mangal, Kaal Sarpa, Kemadruma, etc.)', convention: 'IMPLEMENTED_CONVENTION_CLASSICAL', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, availableInSimpleView: true, dependencies: ['yoga.registry'] }),

  // ─────────────────────────────────────────────── EXPERIENCE
  cap({ id: 'ux.workbench', family: 'Experience', name: 'Jyotish Workbench (multi-panel)', convention: 'PRODUCT', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.kundali.d1'] }),
  cap({ id: 'ux.reports', family: 'Experience', name: 'Composable report system', convention: 'PRODUCT', implementationStatus: I, qualificationStatus: QUAL.IMPLEMENTED, dependencies: ['core.kundali.d1'] }),
  cap({ id: 'ux.snapshot_cache', family: 'Experience', name: 'Canonical snapshot cache (instant varga switch)', convention: 'PRODUCT', implementationStatus: I, qualificationStatus: QUAL.INTERNALLY_VERIFIED, dependencies: ['core.kundali.d1'] }),
];

// Index for O(1) lookup.
const BY_ID = new Map(PROFESSIONAL_CAPABILITIES.map((c) => [c.id, c]));

export function getCapability(id) {
  return BY_ID.get(id) || null;
}

export function listCapabilities() {
  return PROFESSIONAL_CAPABILITIES.slice();
}

export function listFamilies() {
  return Array.from(new Set(PROFESSIONAL_CAPABILITIES.map((c) => c.family)));
}

export function capabilitiesByFamily(family) {
  return PROFESSIONAL_CAPABILITIES.filter((c) => c.family === family);
}

/**
 * Dashboard statistics — computed from the registry, never hardcoded.
 */
export function computeRegistryStats() {
  const total = PROFESSIONAL_CAPABILITIES.length;
  const count = (pred) => PROFESSIONAL_CAPABILITIES.filter(pred).length;
  const atLeast = (status) => {
    const idx = QUALIFICATION_LADDER.indexOf(status);
    return count((c) => {
      const cIdx = QUALIFICATION_LADDER.indexOf(c.qualificationStatus);
      return cIdx >= idx && cIdx !== -1;
    });
  };

  const implemented = count((c) => c.implementationStatus === IMPL.IMPLEMENTED);
  const internallyVerified = count((c) => c.qualificationStatus === QUAL.INTERNALLY_VERIFIED);
  const externallyCompared = count((c) => c.qualificationStatus === QUAL.EXTERNALLY_COMPARED);
  const panditReviewed = count((c) => c.qualificationStatus === QUAL.PANDIT_REVIEWED);
  const qualified = count((c) => c.qualificationStatus === QUAL.QUALIFIED);
  const conventionDifference = count((c) => c.qualificationStatus === QUAL.CONVENTION_DIFFERENCE);
  const missing = count((c) => c.implementationStatus === IMPL.NOT_IMPLEMENTED);

  const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 1000) / 10);

  return {
    total,
    implemented,
    // "at least" cumulative counts for the qualification ladder
    internallyVerifiedOrHigher: atLeast(QUAL.INTERNALLY_VERIFIED),
    externallyComparedOrHigher: atLeast(QUAL.EXTERNALLY_COMPARED),
    // exact-tier counts
    internallyVerified,
    externallyCompared,
    panditReviewed,
    qualified,
    conventionDifference,
    missing,
    percentages: {
      implemented: pct(implemented),
      internallyVerified: pct(atLeast(QUAL.INTERNALLY_VERIFIED)),
      externallyCompared: pct(atLeast(QUAL.EXTERNALLY_COMPARED)),
      panditReviewed: pct(atLeast(QUAL.PANDIT_REVIEWED)),
      qualified: pct(qualified),
      missing: pct(missing),
    },
    byFamily: listFamilies().map((family) => {
      const rows = capabilitiesByFamily(family);
      return {
        family,
        total: rows.length,
        implemented: rows.filter((c) => c.implementationStatus === IMPL.IMPLEMENTED).length,
        internallyVerified: rows.filter((c) => c.qualificationStatus === QUAL.INTERNALLY_VERIFIED).length,
        externallyCompared: rows.filter((c) => c.qualificationStatus === QUAL.EXTERNALLY_COMPARED).length,
        panditReviewed: rows.filter((c) => c.qualificationStatus === QUAL.PANDIT_REVIEWED).length,
        qualified: rows.filter((c) => c.qualificationStatus === QUAL.QUALIFIED).length,
        conventionDifference: rows.filter((c) => c.qualificationStatus === QUAL.CONVENTION_DIFFERENCE).length,
      };
    }),
  };
}

/** Enforce Rule 1: no false QUALIFIED promotion. Returns list of violations. */
export function auditQualificationIntegrity() {
  const violations = [];
  for (const c of PROFESSIONAL_CAPABILITIES) {
    if (c.qualificationStatus === QUAL.QUALIFIED && !canPromoteToQualified(c)) {
      violations.push({ id: c.id, reason: 'QUALIFIED without external comparison + evidence' });
    }
    // Convention labels must not masquerade as proven parity.
    if (/^PARITY_WITH_/.test(c.convention || '')) {
      violations.push({ id: c.id, reason: 'Unsupported PARITY_WITH_* label (Rule 2 violation)' });
    }
  }
  return violations;
}

export default {
  PROFESSIONAL_CAPABILITIES,
  getCapability,
  listCapabilities,
  listFamilies,
  capabilitiesByFamily,
  computeRegistryStats,
  auditQualificationIntegrity,
};

import {
  VARNA_BY_RASHI,
  VASHYA_BY_RASHI,
  VASHYA_MATRIX,
  YONI_BY_NAKSHATRA,
  YONI_MATRIX,
  GANA_BY_NAKSHATRA,
  GANA_MATRIX,
  NADI_BY_NAKSHATRA,
  GRAHA_RELATIONS,
  Planet,
  PlanetRelation,
  Varna,
  RASHI_ID_BY_NAME,
  nakshatraIndex,
  SOURCE_LABELS,
  RAJJU_BY_NAKSHATRA,
  VEDHA_PAIRS,
  MANGAL_HOUSES,
  RajjuGroup,
  rajjuOf,
} from './milanData';
import { RASHIS } from '../../../astrologyEngine';

export interface MilanPersonInput {
  rashiName: string;
  nakshatraName: string;
  pada?: number;
  rashiLord?: string;
}

export interface KootaResult {
  id: string;
  name: string;
  sanskrit?: string;
  maxPoints: number;
  points: number;
  verdict: 'Excellent' | 'Good' | 'Neutral' | 'Low' | 'Dosha';
  detail: string;
  detailHi: string;
}

export interface DoshaResult {
  id: string;
  name: string;
  nameHi: string;
  active: boolean;
  cancelled: boolean;
  weight: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  reasonHi: string;
}

export interface PredictionBlock {
  id: string;
  title: string;
  titleHi: string;
  traditionalClaim: string;
  traditionalClaimHi: string;
  explanation: string;
  explanationHi: string;
  motivation: string;
  motivationHi: string;
  caution: string;
  cautionHi: string;
  bestScenario: string;
  bestScenarioHi: string;
  askAstrologer: string;
  askAstrologerHi: string;
}

export interface MilanChartContext {
  /** Lagna / ascendant rashi name (for Mangal Dosha house positions). */
  lagnaRashiName?: string;
  lagnaRashiId?: number;
  /** Mars house from Lagna. */
  marsHouse?: number;
  /** Mars house from Moon (South-Indian Mangal Dosha). */
  marsFromMoonHouse?: number;
  /** Mars house from Venus (South-Indian Mangal Dosha). */
  marsFromVenusHouse?: number;
  /** Canonical snapshot's own Manglik verdict. */
  manglik?: {
    isManglik: boolean;
    severity?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
    isCancelled?: boolean;
    causeHouse?: number | null;
    description?: string;
  };
  /** Optional full planetsArray. Used for the Kala Sarpa axis check. For a
   * browser/client call that already has the snapshot, this is available. */
  planetsArray?: any[];
  /** Mars detail (for the Mangal Dosha cancellation matrix). */
  mars?: {
    name?: string;
    house?: number;
    rashiName?: string;
    rashiId?: number;
    dignity?: string;
    longitude?: number;
    isRetrograde?: boolean;
    navamshaRashiName?: string;
    navamshaRashiId?: number;
  };
  /** D9 Navamsha Moon rashi (from snapshot.vargas.d9Navamsha). */
  d9MoonRashiName?: string;
  d9MoonRashiId?: number;
  /** D1 seventh-house sign / lord. */
  seventhHouseName?: string;
  seventhHouseId?: number;
  seventhHouseLord?: string;
  /** Marriage karakas. */
  venus?: { name?: string; house?: number; dignity?: string; rashiName?: string };
  jupiter?: { name?: string; house?: number; dignity?: string; rashiName?: string };
}

export interface MilanSynthesis {
  navamsha: {
    status: 'ALIGNED' | 'PARTIAL' | 'UNKNOWN';
    brideD9: string;
    groomD9: string;
    note: string;
    noteHi: string;
  };
  seventhHouse: {
    status: 'STRONG' | 'CAUTION' | 'UNKNOWN';
    brideSign: string;
    groomSign: string;
    note: string;
    noteHi: string;
  };
  marriageKaraka: {
    status: 'ENCOURAGING' | 'MIXED' | 'UNKNOWN';
    brideVenus: string;
    groomVenus: string;
    brideJupiter: string;
    groomJupiter: string;
    note: string;
    noteHi: string;
  };
  kalaSarpa: {
    brideActive: boolean;
    groomActive: boolean;
    bothActive: boolean;
    note: string;
    noteHi: string;
  };
  summary: string;
  summaryHi: string;
}

export interface MilanCalculation {
  bride: MilanPersonInput;
  groom: MilanPersonInput;
  kootas: KootaResult[];
  total: number;
  maxTotal: number;
  doshas: DoshaResult[];
  supplementalDoshas: DoshaResult[];
  nadiCancelled: boolean;
  bhakootCancelled: boolean;
  nadiDoshaActive: boolean;
  bhakootDoshaActive: boolean;
  verdict: {
    totalBand: 'Excellent' | 'Good' | 'Acceptable' | 'Not Recommended' | 'Incomplete';
    title: string;
    titleHi: string;
    summary: string;
    summaryHi: string;
  };
  predictions: PredictionBlock[];
  synthesis: MilanSynthesis;
  sources: string[];
}

export interface MilanOptions {
  brideCtx?: MilanChartContext;
  groomCtx?: MilanChartContext;
}

export function normalizePerson(input: Partial<MilanPersonInput>): MilanPersonInput {
  // The canonical snapshot stores Sanskrit rashi names (Mesha, Vrishabha…),
  // while the Milan tables are keyed by English names (Aries, Taurus…).
  const rashi = RASHIS.find((r: any) => r.en === input.rashiName || r.name === input.rashiName);
  const rashiName = rashi?.en || input.rashiName || '';
  return {
    rashiName,
    nakshatraName: input.nakshatraName || '',
    pada: input.pada && input.pada >= 1 && input.pada <= 4 ? input.pada : 1,
    rashiLord: input.rashiLord || rashi?.lord || '',
  };
}

export function isValidMilanInput(input: Partial<MilanPersonInput>): boolean {
  const n = normalizePerson(input);
  return Boolean(
    n.rashiName && n.nakshatraName &&
    RASHI_ID_BY_NAME[n.rashiName] &&
    YONI_BY_NAKSHATRA[n.nakshatraName]
  );
}

export function rashiLordByName(rashiName: string): string {
  const rashi = RASHIS.find((r: any) => r.en.toLocaleLowerCase() === rashiName.toLocaleLowerCase() || r.name.toLocaleLowerCase() === rashiName.toLocaleLowerCase());
  return rashi?.lord || '';
}

/** Map a Sanskrit or English rashi name to the English form. */
function englishRashiName(name: string): string {
  if (!name) return '';
  const rashi = RASHIS.find((r: any) => r.en.toLocaleLowerCase() === name.toLocaleLowerCase() || r.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  return rashi?.en || name;
}

export function sourceLabel(key: keyof typeof SOURCE_LABELS): string {
  return SOURCE_LABELS[key];
}

export function nakshatraDistance(fromName: string, toName: string): number {
  const a = nakshatraIndex(fromName);
  const b = nakshatraIndex(toName);
  if (a <= 0 || b <= 0) return 0;
  return ((b - a + 27) % 27) + 1;
}

export function rashiDistance(fromRashiId: number, toRashiId: number): number {
  return ((toRashiId - fromRashiId + 12) % 12) + 1;
}

function taraCategory(distance: number): 'Benefic' | 'Malefic' | 'Neutral' {
  const rem = distance % 9;
  if (rem === 2 || rem === 4 || rem === 6 || rem === 8 || rem === 0) return 'Benefic';
  if (rem === 3 || rem === 5 || rem === 7) return 'Malefic';
  return 'Neutral';
}

function planetRelationFor(planet: Planet): PlanetRelation {
  return GRAHA_RELATIONS[planet];
}

/**
 * Calculate the eight kootas + supplementary dosha/synthesis layer
 * deterministically from two Moon placements (and optional chart contexts).
 */
export function calculateMilan(
  brideInput: Partial<MilanPersonInput>,
  groomInput: Partial<MilanPersonInput>,
  options: MilanOptions = {}
): MilanCalculation {
  const bride = normalizePerson(brideInput);
  const groom = normalizePerson(groomInput);
  const brideCtx = options.brideCtx ?? {};
  const groomCtx = options.groomCtx ?? {};

  const brideRashiId = RASHI_ID_BY_NAME[bride.rashiName] || 0;
  const groomRashiId = RASHI_ID_BY_NAME[groom.rashiName] || 0;

  const brideVarna = VARNA_BY_RASHI[bride.rashiName];
  const groomVarna = VARNA_BY_RASHI[groom.rashiName];
  const varnaPoints = brideVarna && groomVarna && varnaScore(brideVarna, groomVarna) === 1 ? 1 : 0;

  const brideVashya = VASHYA_BY_RASHI[bride.rashiName];
  const groomVashya = VASHYA_BY_RASHI[groom.rashiName];
  const vashyaPoints = brideVashya && groomVashya ? VASHYA_MATRIX[brideVashya][groomVashya] : 0;

  const taraA = taraCategory(nakshatraDistance(groom.nakshatraName, bride.nakshatraName));
  const taraB = taraCategory(nakshatraDistance(bride.nakshatraName, groom.nakshatraName));
  const taraPoints =
    taraA === 'Benefic' && taraB === 'Benefic' ? 3 :
    taraA === 'Benefic' || taraB === 'Benefic' ? 1.5 : 0;

  const brideYoni = YONI_BY_NAKSHATRA[bride.nakshatraName];
  const groomYoni = YONI_BY_NAKSHATRA[groom.nakshatraName];
  const yoniPoints = brideYoni && groomYoni ? YONI_MATRIX[brideYoni][groomYoni] : 0;

  const brideLord = bride.rashiLord || rashiLordByName(bride.rashiName);
  const groomLord = groom.rashiLord || rashiLordByName(groom.rashiName);
  const grahaMaitriPoints = scoreGrahaMaitri(brideLord, groomLord);

  const brideGana = GANA_BY_NAKSHATRA[bride.nakshatraName];
  const groomGana = GANA_BY_NAKSHATRA[groom.nakshatraName];
  const ganaPoints = brideGana && groomGana ? GANA_MATRIX[brideGana][groomGana] : 0;

  const distance = rashiDistance(brideRashiId, groomRashiId);
  const bhakootAuspicious = [1, 3, 4, 7, 10, 11].includes(distance);
  const bhakootPoints = bhakootAuspicious ? 7 : 0;

  const brideNadi = NADI_BY_NAKSHATRA[bride.nakshatraName];
  const groomNadi = NADI_BY_NAKSHATRA[groom.nakshatraName];
  const nadiSame = Boolean(brideNadi && groomNadi && brideNadi === groomNadi);
  const nadiCancelled = Boolean(nadiSame && (
    (brideRashiId === groomRashiId && bride.nakshatraName !== groom.nakshatraName) ||
    (bride.nakshatraName === groom.nakshatraName && (bride.pada || 1) !== (groom.pada || 1))
  ));
  const nadiPoints = nadiSame ? (nadiCancelled ? 8 : 0) : 8;
  const nadiDoshaActive = Boolean(nadiSame && !nadiCancelled);

  const bhakootDoshaActive = !bhakootAuspicious;
  const bhakootCancelled = Boolean(bhakootDoshaActive && (
    brideLord === groomLord ||
    (Boolean(brideLord) && Boolean(groomLord) && arePlanetsFriends(brideLord, groomLord))
  ));

  const doshas: DoshaResult[] = [
    {
      id: 'nadi',
      name: 'Nadi Dosha',
      nameHi: 'नाड़ी दोष',
      active: nadiDoshaActive,
      cancelled: nadiCancelled,
      weight: 'HIGH',
      reason: nadiDoshaActive
        ? `Both partners belong to the same Nadi group (${brideNadi}).`
        : nadiCancelled
          ? `Same Nadi, but the Dosha is cancelled by ${nadiCancellationReason(bride, groom)}.`
          : 'Nadi groups differ.',
      reasonHi: nadiDoshaActive
        ? `दोनों का जन्म नक्षत्र एक ही नाड़ी समूह (${brideNadi}) में है।`
        : nadiCancelled
          ? `एक ही नाड़ी, पर ${nadiCancellationReasonHi(bride, groom)} के कारण दोष निरस्त है।`
          : 'नाड़ी समूह अलग हैं।',
    },
    {
      id: 'bhakoot',
      name: 'Bhakoot Dosha',
      nameHi: 'भकूट दोष',
      active: bhakootDoshaActive,
      cancelled: bhakootCancelled,
      weight: 'HIGH',
      reason: bhakootDoshaActive
        ? `Moon signs are ${distance} apart (${bhakootDoshaLabel(distance)}), traditionally an inauspicious Bhakoot pair.`
        : 'Moon signs are in an auspicious Bhakoot combination.',
      reasonHi: bhakootDoshaActive
        ? `चन्द्र राशियों में ${distance} का अंतर है (${bhakootDoshaLabelHi(distance)}), पारंपरिक विचार में यह अशुभ भकूट है।`
        : 'चन्द्र राशियाँ शुभ भकूट संयोग में हैं।',
    },
  ];

  const total = round2(varnaPoints + vashyaPoints + taraPoints + yoniPoints + grahaMaitriPoints + ganaPoints + bhakootPoints + nadiPoints);

  const kootas: KootaResult[] = [
    {
      id: 'varna',
      name: 'Varna',
      sanskrit: 'वर्ण',
      maxPoints: 1,
      points: varnaPoints,
      verdict: varnaPoints === 1 ? 'Good' : 'Low',
      detail: `${bride.rashiName} (${brideVarna}) — ${groom.rashiName} (${groomVarna})`,
      detailHi: `${bride.rashiName} (${brideVarna}) — ${groom.rashiName} (${groomVarna})`,
    },
    {
      id: 'vashya',
      name: 'Vashya',
      sanskrit: 'वश्य',
      maxPoints: 2,
      points: vashyaPoints,
      verdict: vashyaPoints === 2 ? 'Good' : vashyaPoints === 1 ? 'Neutral' : 'Low',
      detail: `${bride.rashiName} (${brideVashya}) — ${groom.rashiName} (${groomVashya})`,
      detailHi: `${bride.rashiName} (${brideVashya}) — ${groom.rashiName} (${groomVashya})`,
    },
    {
      id: 'tara',
      name: 'Tara',
      sanskrit: 'तारा',
      maxPoints: 3,
      points: taraPoints,
      verdict: taraPoints === 3 ? 'Good' : taraPoints === 1.5 ? 'Neutral' : 'Low',
      detail: `${groom.nakshatraName} → ${bride.nakshatraName} (${taraA}), ${bride.nakshatraName} → ${groom.nakshatraName} (${taraB})`,
      detailHi: `${groom.nakshatraName} → ${bride.nakshatraName} (${taraA}), ${bride.nakshatraName} → ${groom.nakshatraName} (${taraB})`,
    },
    {
      id: 'yoni',
      name: 'Yoni',
      sanskrit: 'योनि',
      maxPoints: 4,
      points: yoniPoints,
      verdict: yoniPoints >= 3 ? 'Good' : yoniPoints === 2 ? 'Neutral' : yoniPoints === 1 ? 'Low' : 'Dosha',
      detail: `${bride.nakshatraName} (${brideYoni}) — ${groom.nakshatraName} (${groomYoni})`,
      detailHi: `${bride.nakshatraName} (${brideYoni}) — ${groom.nakshatraName} (${groomYoni})`,
    },
    {
      id: 'grahaMaitri',
      name: 'Graha Maitri',
      sanskrit: 'ग्रह मैत्री',
      maxPoints: 5,
      points: grahaMaitriPoints,
      verdict: grahaMaitriPoints >= 4 ? 'Good' : grahaMaitriPoints >= 2 ? 'Neutral' : 'Low',
      detail: `${brideLord} (${bride.rashiName}) — ${groomLord} (${groom.rashiName})`,
      detailHi: `${brideLord} (${bride.rashiName}) — ${groomLord} (${groom.rashiName})`,
    },
    {
      id: 'gana',
      name: 'Gana',
      sanskrit: 'गण',
      maxPoints: 6,
      points: ganaPoints,
      verdict: ganaPoints >= 5 ? 'Good' : ganaPoints === 1 ? 'Neutral' : 'Low',
      detail: `${bride.nakshatraName} (${brideGana}) — ${groom.nakshatraName} (${groomGana})`,
      detailHi: `${bride.nakshatraName} (${brideGana}) — ${groom.nakshatraName} (${groomGana})`,
    },
    {
      id: 'bhakoot',
      name: 'Bhakoot',
      sanskrit: 'भकूट',
      maxPoints: 7,
      points: bhakootPoints,
      verdict: bhakootPoints === 7 ? 'Good' : 'Dosha',
      detail: `${bride.rashiName} → ${groom.rashiName} (${distance}${bhakootDoshaActive ? ` — ${bhakootDoshaLabel(distance)}` : ''})`,
      detailHi: `${bride.rashiName} → ${groom.rashiName} (${distance}${bhakootDoshaActive ? ` — ${bhakootDoshaLabelHi(distance)}` : ''})`,
    },
    {
      id: 'nadi',
      name: 'Nadi',
      sanskrit: 'नाड़ी',
      maxPoints: 8,
      points: nadiPoints,
      verdict: nadiPoints === 8 ? 'Good' : nadiDoshaActive ? 'Dosha' : 'Neutral',
      detail: `${bride.nakshatraName} (${brideNadi}) — ${groom.nakshatraName} (${groomNadi})`,
      detailHi: `${bride.nakshatraName} (${brideNadi}) — ${groom.nakshatraName} (${groomNadi})`,
    },
  ];

  const supplementalDoshas = buildSupplementalDoshas(bride, groom, brideCtx, groomCtx);
  const synthesis = buildSynthesis(bride, groom, brideCtx, groomCtx);
  const band = totalBand(total, nadiDoshaActive, bhakootDoshaActive);

  return {
    bride,
    groom,
    kootas,
    total,
    maxTotal: 36,
    doshas,
    supplementalDoshas,
    nadiCancelled,
    bhakootCancelled,
    nadiDoshaActive,
    bhakootDoshaActive,
    verdict: {
      totalBand: band,
      title: verdictTitle(band),
      titleHi: verdictTitleHi(band),
      summary: verdictSummary(total, band, nadiDoshaActive, bhakootDoshaActive),
      summaryHi: verdictSummaryHi(total, band, nadiDoshaActive, bhakootDoshaActive),
    },
    predictions: buildPredictions(bride, groom, kootas, total, nadiDoshaActive, bhakootDoshaActive, supplementalDoshas, synthesis),
    synthesis,
    sources: keys(SOURCE_LABELS),
  };
}

function keys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj);
}

function varnaScore(bride: Varna, groom: Varna): number {
  const rank: Record<Varna, number> = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };
  return rank[groom] >= rank[bride] ? 1 : 0;
}

function arePlanetsFriends(a: string, b: string): boolean {
  const pa = GRAHA_RELATIONS[a as Planet];
  return pa?.friends.includes(b as Planet) || false;
}

function scoreGrahaMaitri(brideLord: string, groomLord: string): number {
  const a = brideLord as Planet;
  const b = groomLord as Planet;
  if (!GRAHA_RELATIONS[a] || !GRAHA_RELATIONS[b]) return 0;
  if (a === b) return 5;
  const relA = GRAHA_RELATIONS[a];
  if (relA.friends.includes(b)) {
    const relB = GRAHA_RELATIONS[b];
    return relB.friends.includes(a) ? 5 : 4;
  }
  if (relA.enemies.includes(b) && GRAHA_RELATIONS[b].enemies.includes(a)) return 0;
  if (relA.enemies.includes(b) || GRAHA_RELATIONS[b].enemies.includes(a)) return 0.5;
  if (relA.neutrals.includes(b) && GRAHA_RELATIONS[b].neutrals.includes(a)) return 3;
  if (relA.neutrals.includes(b) || GRAHA_RELATIONS[b].neutrals.includes(a)) return 2;
  return 1;
}

function bhakootDoshaLabel(distance: number): string {
  switch (distance) {
    case 2: return 'Dhan-Vyaya';
    case 5: return 'Rog-Karma';
    case 6: return 'Ari-Randhra';
    case 8: return 'Ari-Randhra';
    case 9: return 'Rog-Karma';
    case 12: return 'Dhan-Vyaya';
    default: return 'traditional inauspicious count';
  }
}
function bhakootDoshaLabelHi(distance: number): string {
  switch (distance) {
    case 2: return 'धन-व्यय';
    case 5: return 'रोग-कर्म';
    case 6: return 'अरि-रन्ध्र';
    case 8: return 'अरि-रन्ध्र';
    case 9: return 'रोग-कर्म';
    case 12: return 'धन-व्यय';
    default: return 'पारंपरिक अशुभ संख्या';
  }
}

function nadiCancellationReason(bride: MilanPersonInput, groom: MilanPersonInput): string {
  if (bride.rashiName === groom.rashiName && bride.nakshatraName !== groom.nakshatraName) return 'same sign, different nakshatra';
  if (bride.nakshatraName === groom.nakshatraName && (bride.pada || 1) !== (groom.pada || 1)) return 'same nakshatra, different pada';
  return 'the sanctioned cancellation rule';
}
function nadiCancellationReasonHi(bride: MilanPersonInput, groom: MilanPersonInput): string {
  if (bride.rashiName === groom.rashiName && bride.nakshatraName !== groom.nakshatraName) return 'एक ही राशि, अलग नक्षत्र';
  if (bride.nakshatraName === groom.nakshatraName && (bride.pada || 1) !== (groom.pada || 1)) return 'एक ही नक्षत्र, अलग चरण';
  return 'मान्य परिहार नियम';
}

export function totalBand(total: number, nadi?: boolean, bhakoot?: boolean): MilanCalculation['verdict']['totalBand'] {
  if (nadi || bhakoot) return 'Not Recommended';
  if (total >= 33) return 'Excellent';
  if (total >= 25) return 'Good';
  if (total >= 18) return 'Acceptable';
  if (total > 0) return 'Not Recommended';
  return 'Incomplete';
}

function verdictTitle(band: string): string {
  switch (band) {
    case 'Excellent': return 'Exceptional classical harmony';
    case 'Good': return 'Strong classical harmony';
    case 'Acceptable': return 'Traditionally acceptable match';
    case 'Not Recommended': return 'Please consult with our astrologer';
    default: return 'Incomplete data';
  }
}
function verdictTitleHi(band: string): string {
  switch (band) {
    case 'Excellent': return 'उत्कृष्ट शास्त्रीय मेल';
    case 'Good': return 'सशक्त शास्त्रीय मेल';
    case 'Acceptable': return 'पारंपरिक रूप से स्वीकार्य';
    case 'Not Recommended': return 'कृपया हमारे ज्योतिषी से परामर्श करें';
    default: return 'अपूर्ण आँकड़ा';
  }
}

function verdictSummary(total: number, band: string, nadi: boolean, bhakoot: boolean): string {
  if (nadi || bhakoot) return `The score is ${total}/36, but a high-weight Dosha is present. Traditional texts treat this as a point to seek expert interpretation rather than a simple thumbs-down or thumbs-up.`;
  if (band === 'Excellent') return `A rare ${total}/36. This is traditionally read as deep, natural resonance between the charts.`;
  if (band === 'Good') return `${total}/36 is a strong classical score. The Moon signs and nakshatras support each other well.`;
  if (band === 'Acceptable') return `${total}/36 is traditionally deemed workable, with a few areas that benefit from understanding and care.`;
  return `${total}/36 is below the traditional comfortable range. A Pandit can place this in the wider chart context.`;
}
function verdictSummaryHi(total: number, band: string, nadi: boolean, bhakoot: boolean): string {
  if (nadi || bhakoot) return `स्कोर ${total}/36 है, पर उच्च-महत्त्व का दोष उपस्थित है। शास्त्र इसे केवल उत्तीर्ण/अनुत्तीर्ण नहीं, बल्कि विशेषज्ञ व्याख्या का विषय मानते हैं।`;
  if (band === 'Excellent') return `दुर्लभ ${total}/36। यह पारंपरिक व्याख्या में दोनों कुंडलियों का गहरा स्वाभाविक सामंजस्य दर्शाता है।`;
  if (band === 'Good') return `${total}/36 एक सशक्त शास्त्रीय स्कोर है। चन्द्र राशियाँ और नक्षत्र एक-दूसरे का अच्छा समर्थन करते हैं।`;
  if (band === 'Acceptable') return `${total}/36 पारंपरिक रूप से कार्य योग्य माना जाता है, कुछ क्षेत्रों को समझ और सावधानी की आवश्यकता है।`;
  return `${total}/36 पारंपरिक सहज सीमा से कम है। पंडित इसे पूरी कुंडली के संदर्भ में रख सकते हैं।`;
}

/* ------------------------------------------------------------------ */
/* Supplementary dosha layer (Mangal / Rajju / Vedha / Kala Sarpa)     */
/* ------------------------------------------------------------------ */

function buildSupplementalDoshas(
  bride: MilanPersonInput,
  groom: MilanPersonInput,
  brideCtx: MilanChartContext,
  groomCtx: MilanChartContext
): DoshaResult[] {
  const out: DoshaResult[] = [];

  // Mangal Dosha (per-person; both charts can carry it, and mutual Manglik
  // is itself a cancellation rule).
  const bMang = mangalResultFor('bride', brideCtx, groomCtx);
  const gMang = mangalResultFor('groom', groomCtx, brideCtx);
  const anyReduced = Boolean((bMang && bMang.reduced) || (gMang && gMang.reduced));
  const mangalActive = Boolean(bMang?.active || gMang?.active);
  // Cancelled across the pair means there is no unresolved Mangal Dosha;
  // an active dosha in either chart is never reported as cancelled.
  const mangalCancelled = !mangalActive;
  const mangalWeight: DoshaResult['weight'] = mangalActive && anyReduced ? 'LOW' : mangalActive ? 'MEDIUM' : 'LOW';
  out.push({
    id: 'mangal',
    name: 'Mangal Dosha',
    nameHi: 'मंगल दोष',
    active: mangalActive,
    cancelled: mangalCancelled,
    weight: mangalWeight,
    reason: [
      bMang ? `Bride ${bMang.reason}` : '',
      gMang ? `Groom ${gMang.reason}` : '',
    ].filter(Boolean).join('; ') || 'Mars is well-placed in both charts.',
    reasonHi: [
      bMang ? `वधू ${bMang.reasonHi}` : '',
      gMang ? `वर ${gMang.reasonHi}` : '',
    ].filter(Boolean).join('; ') || 'दोनों कुंडलियों में मंगल सुदृढ़ है।',
  });

  // Rajju (South-Indian / Porutham). Same body zone = active unless cancelled.
  const bRaj = rajjuOf(bride.nakshatraName);
  const gRaj = rajjuOf(groom.nakshatraName);
  const sameRajju = Boolean(bRaj && gRaj && bRaj === gRaj);
  const rajjuCancelled = sameRajju && (
    (bride.rashiName === groom.rashiName && bride.nakshatraName !== groom.nakshatraName) ||
    (bride.rashiName === groom.rashiName && (bride.pada || 1) !== (groom.pada || 1))
  );
  out.push({
    id: 'rajju',
    name: 'Rajju Dosha',
    nameHi: 'रज्जु दोष',
    active: sameRajju && !rajjuCancelled,
    cancelled: rajjuCancelled,
    weight: sameRajju ? 'MEDIUM' : 'LOW',
    reason: sameRajju
      ? `Both partners belong to the ${bRaj} Rajju group (${rajjuCancelled ? 'cancelled by sign/pada rule' : 'traditional caution'}).`
      : `Rajju groups differ (${bRaj ?? '—'} vs ${gRaj ?? '—'}).`,
    reasonHi: sameRajju
      ? `दोनों ${bRaj} रज्जु समूह में हैं (${rajjuCancelled ? 'राशि/चरण नियम से निरस्त' : 'पारंपरिक सावधानी'})।`
      : `रज्जु समूह अलग हैं (${bRaj ?? '—'} बनाम ${gRaj ?? '—'})।`,
  });

  // Vedha (14 bidirectional pairs).
  const vedhaPair = VEDHA_PAIRS.find(
    ([a, b]) => (a === bride.nakshatraName && b === groom.nakshatraName) || (a === groom.nakshatraName && b === bride.nakshatraName)
  );
  out.push({
    id: 'vedha',
    name: 'Vedha Dosha',
    nameHi: 'वेध दोष',
    active: Boolean(vedhaPair),
    cancelled: false,
    weight: vedhaPair ? 'MEDIUM' : 'LOW',
    reason: vedhaPair
      ? `The nakshatras ${vedhaPair[0]} and ${vedhaPair[1]} form a classical Vedha pair.`
      : 'No classical Vedha pair is present.',
    reasonHi: vedhaPair
      ? `${vedhaPair[0]} और ${vedhaPair[1]} पारंपरिक वेध युग्म बनाते हैं।`
      : 'कोई पारंपरिक वेध युग्म नहीं है।',
  });

  // Kala Sarpa (from the chart contexts).
  const bKala = kalaSarpaFor(brideCtx);
  const gKala = kalaSarpaFor(groomCtx);
  out.push({
    id: 'kalsarpa',
    name: 'Kala Sarpa',
    nameHi: 'काल सर्प',
    active: Boolean(bKala || gKala),
    cancelled: false,
    weight: (bKala || gKala) ? 'MEDIUM' : 'LOW',
    reason: (bKala || gKala)
      ? [
          bKala ? `Bride's planets lie on one side of the Rahu-Ketu axis.` : '',
          gKala ? `Groom's planets lie on one side of the Rahu-Ketu axis.` : '',
        ].filter(Boolean).join(' ') || 'No Kala Sarpa pattern detected.'
      : 'No Kala Sarpa pattern detected in either chart.',
    reasonHi: (bKala || gKala)
      ? [
          bKala ? 'वधू के ग्रह राहु-केतु अक्ष के एक ओर हैं।' : '',
          gKala ? 'वर के ग्रह राहु-केतु अक्ष के एक ओर हैं।' : '',
        ].filter(Boolean).join(' ') || 'कोई काल सर्प रूप नहीं मिला।'
      : 'किसी भी कुंडली में काल सर्प रूप नहीं मिला।',
  });

  return out;
}

interface MangalResult {
  active: boolean;
  cancelled: boolean;
  reduced: boolean;
  reason: string;
  reasonHi: string;
  reasons: string[];
}

/** Classical Mangal Dosha Bhanga (cancellation / softening) conditions.
 *
 * Sources: Jataka Parijata (own/exaltation), Muhurta Chintamani (Jupiter
 * association), BPHS commentary and the standard sign-in-house lists. Where a
 * source is contested, the condition is reported as a rule with a caution,
 * never as an absolute promise.
 */
function mangalResultFor(
  label: 'bride' | 'groom',
  ctx: MilanChartContext,
  partnerCtx: MilanChartContext
): MangalResult {
  const reasons: string[] = [];
  let cancelled = false;
  let reduced = false;

  // 1. Canonical snapshot verdict (if available) is the leading signal.
  const mang = ctx.manglik;
  const houseFlags = [ctx.marsHouse, ctx.marsFromMoonHouse, ctx.marsFromVenusHouse].filter((h): h is number => typeof h === 'number');
  const flaggedHouses = houseFlags.filter((h) => MANGAL_HOUSES.includes(h));
  const canonicalActive = mang ? (mang.isManglik && !mang.isCancelled) : flaggedHouses.length > 0;
  if (!canonicalActive) {
    const reason = mang && mang.isManglik && mang.isCancelled
      ? 'the canonical snapshot already marks this Mangal Dosha as cancelled'
      : `${label}'s Mars is outside the traditional Mangal houses`;
    return {
      active: false,
      cancelled: true,
      reduced: false,
      reason: `${label}'s Mars is outside the traditional Mangal houses.`,
      reasonHi: `${label === 'bride' ? 'वधू' : 'वर'} का मंगल पारंपरिक मंगल भावों से बाहर है।`,
      reasons: [reason],
    };
  }

  const mars = ctx.mars;
  const marsId = mars?.rashiId ?? 0;
  const marsHouse = mars?.house ?? ctx.marsHouse ?? 0;
  const lagnaId = ctx.lagnaRashiId ?? 0;

  // Mars own / exalted / debilitated.
  if (marsId === 1 || marsId === 8) {
    reasons.push('Mars in own sign (Aries/Scorpio)'); cancelled = true;
  } else if (marsId === 10) {
    reasons.push('Mars exalted in Capricorn'); cancelled = true;
  } else if (marsId === 4) {
    reasons.push('Mars debilitated in Cancer'); cancelled = true;
  }

  // Yogakaraka Mars for Cancer/Leo lagna.
  if (lagnaId === 4 || lagnaId === 5) {
    reasons.push(`${englishRashiName(RASHIS[lagnaId - 1]?.en || '')} lagna makes Mars yogakaraka`); cancelled = true;
  }

  // Sign-and-house exceptions.
  if (marsHouse === 2 && (marsId === 3 || marsId === 6)) {
    reasons.push('Mars in 2nd house in a Mercury sign (Gemini/Virgo)'); cancelled = true;
  }
  if (marsHouse === 12 && (marsId === 2 || marsId === 7)) {
    reasons.push('Mars in 12th house in a Venus sign (Taurus/Libra)'); cancelled = true;
  }
  if (marsHouse === 7 && (marsId === 4 || marsId === 10)) {
    reasons.push('Mars in 7th house in Cancer/Capricorn'); cancelled = true;
  }
  if (marsHouse === 8 && (marsId === 2 || marsId === 9)) {
    reasons.push('Mars in 8th house in Sagittarius/Pisces'); cancelled = true;
  }

  // Jupiter conjunct or aspecting Mars.
  const jupiter = marsAspectFrom(ctx, 'Jupiter', marsId, [5, 7, 9]);
  if (jupiter) {
    reasons.push(jupiter); cancelled = true;
  }

  // Moon conjunct/softening.
  const moonNote = marsAspectFrom(ctx, 'Moon', marsId, [1]);
  if (moonNote) {
    reasons.push(moonNote); reduced = true;
  }

  // Mercury / Venus association softens the dosha in the composite reading.
  const mercuryNote = marsConjunctNote(ctx, 'Mercury', marsId);
  if (mercuryNote) {
    reasons.push(mercuryNote); reduced = true;
  }
  const venusNote = marsConjunctNote(ctx, 'Venus', marsId);
  if (venusNote) {
    reasons.push(venusNote); reduced = true;
  }

  // Mars in a movable (chara) sign and retrograde Mars are classical
  // softening factors rather than absolute cancellations.
  if ([1, 4, 7, 10].includes(marsId)) {
    reasons.push('Mars in a movable (chara) sign'); reduced = true;
  }
  if (mars?.isRetrograde) {
    reasons.push('Mars is retrograde — classic softening factor, needs a full-chart read'); reduced = true;
  }

  // Dispositor (sign lord of Mars' sign) in a kendra or trikona.
  const dispositorNote = dispositorInKendraTrikona(ctx, marsId, lagnaId);
  if (dispositorNote) {
    reasons.push(dispositorNote); cancelled = true;
  }

  // D9 navamsha own/exaltation softens.
  const d9 = mars?.navamshaRashiId ?? 0;
  if (d9 === 1 || d9 === 8 || d9 === 10) {
    reasons.push('Mars own/exalted in Navamsha (D9)'); reduced = true;
  }

  // Mutual Manglik: both partners active and uncancelled cancel together.
  const partnerActive = (() => {
    const p = partnerCtx?.manglik;
    const pHouses = [partnerCtx?.marsHouse, partnerCtx?.marsFromMoonHouse, partnerCtx?.marsFromVenusHouse].filter((h): h is number => typeof h === 'number');
    return p ? (p.isManglik && !p.isCancelled) : pHouses.some((h) => MANGAL_HOUSES.includes(h));
  })();
  if (!cancelled && partnerActive) {
    reasons.push('Both partners are Manglik — mutual cancellation'); cancelled = true;
  }

  const active = !cancelled;
  const reason = reasons.join('; ')
    ? `${label}'s Mangal Dosha — ${reasons.join('; ')}${cancelled ? ' (cancelled)' : reduced ? ' (significantly reduced)' : ' (active)'}.`
    : `${label}'s Mars is in a Mangal house (${flaggedHouses.join(', ')}) from Lagna/Moon/Venus.`;
  const reasonHi = reasons.join('; ')
    ? `${label === 'bride' ? 'वधू' : 'वर'} का मंगल दोष — ${reasons.join('; ')}${cancelled ? ' (निरस्त)' : reduced ? ' (काफी कम)' : ' (सक्रिय)'}.`
    : `${label === 'bride' ? 'वधू' : 'वर'} का मंगल मंगल भावों (${flaggedHouses.join(', ')}) में लग्न/चन्द्र/शुक्र से है।`;

  return { active, cancelled, reduced, reason, reasonHi, reasons };
}

/** True if `planets` sits in the classical aspect distance from Mars (or a
 * conjunction when distance 1) and returns a human note. */
function marsAspectFrom(ctx: MilanChartContext, planetName: 'Jupiter' | 'Moon', marsId: number, aspects: number[]): string | null {
  const planets = Array.isArray(ctx.planetsArray) ? ctx.planetsArray : [];
  const p = planets.find((x: any) => x.name === planetName);
  if (!p) return null;
  const pId = Number(p.rashiId);
  if (!pId || !marsId) return null;
  const dist = rashiDistance(pId, marsId);
  if (aspects.includes(dist) || aspects.includes(rashiDistance(marsId, pId))) {
    return `${planetName} ${dist === 1 ? 'conjunct' : 'aspects'} Mars ${planetName === 'Jupiter' ? '(major cancellation)' : '(softens)'}`;
  }
  return null;
}

/** Classical softening note when a benefic-by-proximity planet shares Mars' sign. */
function marsConjunctNote(ctx: MilanChartContext, planetName: 'Mercury' | 'Venus', marsId: number): string | null {
  const planets = Array.isArray(ctx.planetsArray) ? ctx.planetsArray : [];
  const p = planets.find((x: any) => x.name === planetName);
  if (!p) return null;
  if (Number(p.rashiId) !== marsId) return null;
  return `${planetName} conjunct Mars`;
}

/** Cancels a Mangal Dosha when the dispositor (lord of Mars' sign) is in a kendra or trikona. */
function dispositorInKendraTrikona(ctx: MilanChartContext, marsId: number, lagnaId: number): string | null {
  const marsRashi = RASHIS.find((r: any) => r.id === marsId);
  const lord = marsRashi?.lord ?? '';
  if (!lord) return null;
  const planets = Array.isArray(ctx.planetsArray) ? ctx.planetsArray : [];
  const p = planets.find((x: any) => x.name === lord);
  if (!p) return null;
  const dispositorId = Number(p.rashiId);
  if (!dispositorId || !lagnaId) return null;
  const house = rashiDistance(lagnaId, dispositorId);
  if ([1, 4, 5, 7, 9, 10].includes(house)) {
    return `Mars dispositor (${lord}) in kendra/trikona house ${house}`;
  }
  return null;
}

function kalaSarpaFor(ctx: MilanChartContext): boolean {
  const planets = ctx.planetsArray;
  if (!Array.isArray(planets) || planets.length < 9) return false;
  const rahu = planets.find((p: any) => p.name === 'Rahu');
  const ketu = planets.find((p: any) => p.name === 'Ketu');
  if (!rahu || !ketu || typeof rahu.longitude !== 'number' || typeof ketu.longitude !== 'number') return false;
  const nonNodes = planets.filter((p: any) => p.name !== 'Rahu' && p.name !== 'Ketu' && typeof p.longitude === 'number');
  if (nonNodes.length === 0) return false;

  const arc = (from: number, to: number): number => (to - from + 360) % 360;
  const a1 = arc(rahu.longitude, ketu.longitude);
  const a2 = arc(ketu.longitude, rahu.longitude);
  const inArc = (lon: number, start: number, length: number): boolean => {
    const d = arc(start, lon);
    return d <= length;
  };
  const allInRahuToKetu = nonNodes.every((p: any) => inArc(p.longitude, rahu.longitude, a1));
  const allInKetuToRahu = nonNodes.every((p: any) => inArc(p.longitude, ketu.longitude, a2));
  return (allInRahuToKetu && a1 < 180) || (allInKetuToRahu && a2 < 180);
}

function buildSynthesis(
  bride: MilanPersonInput,
  groom: MilanPersonInput,
  brideCtx: MilanChartContext,
  groomCtx: MilanChartContext
): MilanSynthesis {
  // D9 / Navamsha.
  const bD9 = brideCtx.d9MoonRashiName || '';
  const gD9 = groomCtx.d9MoonRashiName || '';
  const d9Status: MilanSynthesis['navamsha']['status'] = bD9 && gD9
    ? (bD9 === gD9 ? 'ALIGNED' : 'PARTIAL')
    : 'UNKNOWN';

  // Seventh house.
  const b7 = brideCtx.seventhHouseName || '';
  const g7 = groomCtx.seventhHouseName || '';
  const b7Lord = brideCtx.seventhHouseLord || '';
  const g7Lord = groomCtx.seventhHouseLord || '';
  const seventhStatus: MilanSynthesis['seventhHouse']['status'] = b7 && g7
    ? (b7 === g7 || arePlanetsFriends(b7Lord, g7Lord) ? 'STRONG' : 'CAUTION')
    : 'UNKNOWN';

  // Marriage karakas.
  const bVenus = brideCtx.venus?.dignity || brideCtx.venus?.rashiName || '';
  const gVenus = groomCtx.venus?.dignity || groomCtx.venus?.rashiName || '';
  const bJup = brideCtx.jupiter?.dignity || brideCtx.jupiter?.rashiName || '';
  const gJup = groomCtx.jupiter?.dignity || groomCtx.jupiter?.rashiName || '';
  const karakaStatus: MilanSynthesis['marriageKaraka']['status'] = (bVenus || gVenus || bJup || gJup) ? 'MIXED' : 'UNKNOWN';

  // Kala Sarpa.
  const bKala = kalaSarpaFor(brideCtx);
  const gKala = kalaSarpaFor(groomCtx);

  const note = [
    bD9 && gD9 ? `Navamsha Moon: ${bD9} & ${gD9}.` : '',
    b7 && g7 ? `7th house: ${b7}/${b7Lord || '—'} & ${g7}/${g7Lord || '—'}.` : '',
    (bVenus || gVenus) ? `Venus: ${bVenus || '—'} & ${gVenus || '—'}.` : '',
  ].filter(Boolean).join(' ');

  const noteHi = [
    bD9 && gD9 ? `नवांश चन्द्र: ${bD9} और ${gD9}।` : '',
    b7 && g7 ? `सप्तम भाव: ${b7}/${b7Lord || '—'} तथा ${g7}/${g7Lord || '—'}।` : '',
    (bVenus || gVenus) ? `शुक्र: ${bVenus || '—'} और ${gVenus || '—'}।` : '',
  ].filter(Boolean).join(' ');

  return {
    navamsha: {
      status: d9Status,
      brideD9: bD9,
      groomD9: gD9,
      note,
      noteHi,
    },
    seventhHouse: {
      status: seventhStatus,
      brideSign: b7,
      groomSign: g7,
      note,
      noteHi,
    },
    marriageKaraka: {
      status: karakaStatus,
      brideVenus: bVenus,
      groomVenus: gVenus,
      brideJupiter: bJup,
      groomJupiter: gJup,
      note,
      noteHi,
    },
    kalaSarpa: {
      brideActive: bKala,
      groomActive: gKala,
      bothActive: bKala && gKala,
      note,
      noteHi,
    },
    summary: d9Status === 'ALIGNED' && seventhStatus === 'STRONG'
      ? 'The D9 and seventh-house synthesis read as supporting a strong marital picture.'
      : d9Status === 'UNKNOWN'
        ? 'The D9 / seventh-house synthesis was not provided, so it is deliberately not asserted.'
        : 'The D9 and seventh-house synthesis gives a mixed signal; a Pandit should read it with the full charts.',
    summaryHi: d9Status === 'ALIGNED' && seventhStatus === 'STRONG'
      ? 'नवांश और सप्तम भाव का संश्लेषण दृढ़ वैवाहिक चित्र का समर्थन करता है।'
      : d9Status === 'UNKNOWN'
        ? 'नवांश / सप्तम भाव संश्लेषण उपलब्ध नहीं हुआ, इसलिए जानबूझकर नहीं कहा गया।'
        : 'नवांश और सप्तम भाव का संश्लेषण मिश्रित संकेत देता है; पंडित को पूरी कुंडलियों से पढ़ना चाहिए।',
  };
}

/* ------------------------------------------------------------------ */
/* Prediction layer                                                    */
/* ------------------------------------------------------------------ */

function buildPredictions(
  bride: MilanPersonInput,
  groom: MilanPersonInput,
  kootas: KootaResult[],
  total: number,
  nadi: boolean,
  bhakoot: boolean,
  supplementalDoshas: DoshaResult[],
  synthesis: MilanSynthesis
): PredictionBlock[] {
  const top = [...kootas].sort((a, b) => b.points / b.maxPoints - a.points / a.maxPoints)[0];
  const low = [...kootas].filter((k) => k.points / k.maxPoints <= 0.5);
  const lowNames = low.map((k) => k.name).join(', ');
  const activeDoshaNames = supplementalDoshas.filter((d) => d.active).map((d) => d.name).join(', ') || 'no supplemental Dosha';

  return [
    {
      id: 'resonance',
      title: 'The natural rhythm between you',
      titleHi: 'आप दोनों के बीच स्वाभाविक तालमेल',
      traditionalClaim: `In Ashtakoota, the ${top.name} Koota expresses the most natural, instinctive harmony in this pairing, while ${lowNames || 'the balance of the other kootas'} asks for conscious care.`,
      traditionalClaimHi: `अष्टकूट में ${top.name} कूट इस संयोग में सबसे स्वाभाविक, प्रवृत्तिगत सामंजस्य दर्शाता है, जबकि ${lowNames || 'शेष कूटों का संतुलन'} चेतन अभ्यास माँगता है।`,
      explanation: 'The Moon is the emotional home in Vedic astrology. When two Moon signs and nakshatras sit well together, traditional wording is that the couple feels "at home" with each other early and often.',
      explanationHi: 'वैदिक ज्योतिष में चंद्रमा भावनात्मक घर का प्रतीक है। जब दो चन्द्र राशियाँ और नक्षत्र एक-दूसरे के साथ अच्छा बैठते हैं, तो पारंपरिक भाषा कहती है कि जोड़ा जल्दी और बार-बार एक-दूसरे में "घर" जैसा अनुभव करता है।',
      motivation: 'You both have a real, examineable emotional base to build on. That is a strength — not a slot-machine verdict.',
      motivationHi: 'आप दोनों के पास एक वास्तविक, परखने योग्य भावनात्मक आधार है। यह एक शक्ति है — कोई जुआ नहीं।',
      caution: 'A 36-guna score reads the Moon and the conventional koota grids only. It does not replace love, communication, shared values, or a full chart consult. A low reading is not a prediction of failure.',
      cautionHi: '36-गुण स्कोर केवल चंद्र और पारंपरिक कूट-सारणियाँ पढ़ता है। यह प्रेम, संवाद, साझा मूल्यों या पूर्ण कुंडली परामर्श का स्थान नहीं लेता। कम स्कोर असफलता की भविष्यवाणी नहीं है।',
      bestScenario: 'Best case: you and your partner regularly see the best in each other, resolve differences as a team, and grow emotionally side by side.',
      bestScenarioHi: 'सर्वोत्तम स्थिति: आप दोनों एक-दूसरे में सर्वश्रेष्ठ देखते हैं, मतभेदों को साथ मिलकर सुलझाते हैं, और भावनात्मक रूप से साथ-साथ बढ़ते हैं।',
      askAstrologer: 'Our astrologer reads the full chart, the houses, the dashas and the doshas together — ask a detailed Milan question.',
      askAstrologerHi: 'हमारे ज्योतिषी पूरी कुंडली, भाव, दशा और दोष साथ पढ़ते हैं — विस्तृत मिलान प्रश्न पूछें।',
    },
    {
      id: 'phala',
      title: 'What the chart supports you toward (traditional reading)',
      titleHi: 'कुंडली जिस दिशा में समर्थन देती है (पारंपरिक पाठ)',
      traditionalClaim: `With a ${total}/36 Ashtakoota score${nadi || bhakoot ? ' and a Dosha present' : ''}, the traditional "phala" for the strong Kootas is emotional companionship, shared decision-making, and a supportive home; the caution areas are around patience and honest communication.`,
      traditionalClaimHi: `${total}/36 अष्टकूट स्कोर के साथ${nadi || bhakoot ? ' और एक दोष की उपस्थिति में' : ''}, सशक्त कूटों के पारंपरिक फल भावनात्मक साथ, साझा निर्णय और सहायक घर हैं; सावधानी के क्षेत्र धैर्य और ईमानदार संवाद हैं।`,
      explanation: 'Classical texts pair the Moon with the home, the mother, the inner security and the way a person gives emotional care. Matching the Moon nakshatra is therefore the classic "heart of the marriage" test.',
      explanationHi: 'शास्त्रीय ग्रंथ चंद्रमा को घर, माता, आंतरिक सुरक्षा और प्रेम-देखभाल देने की क्षमता से जोड़ते हैं। इसलिए चन्द्र नक्षत्र का मिलान विवाह के "हृदय" का परीक्षण माना जाता है।',
      motivation: 'This reading is designed to help you feel encouraged about the real work of a relationship, and curious about the deeper chart.',
      motivationHi: 'यह पाठ आपको रिश्ते के वास्तविक काम को लेकर उत्साहित और गहरी कुंडली के बारे में जिज्ञासु बनाने के लिए है।',
      caution: 'This is a traditional symbolic reading. It is not a diagnosis, not a guarantee of marital success or failure, and never a substitute for a professional relational or medical consultation.',
      cautionHi: 'यह पारंपरिक प्रतीकात्मक पाठ है। यह निदान नहीं, वैवाहिक सफलता या असफलता की गारंटी नहीं, और किसी व्यावसायिक संबंध या चिकित्सा परामर्श का विकल्प नहीं है।',
      bestScenario: 'You build a calm, affectionate home; you share responsibilities; you become each other\'s best support through the long seasons of life.',
      bestScenarioHi: 'आप शांत, स्नेही घर बनाते हैं; जिम्मेदारियाँ साझा करते हैं; और जीवन के लंबे मौसमों में एक-दूसरे का सर्वोत्तम सहारा बनते हैं।',
      askAstrologer: 'To see how the current dasha, the 7th house, Venus, Mars, and D9 Navamsha qualify this reading, ask our astrologer for the detailed Milan consultation.',
      askAstrologerHi: 'यह देखने के लिए कि वर्तमान दशा, सप्तम भाव, शुक्र, मंगल और D9 नवांश इस पाठ को कैसे परिष्कृत करते हैं, हमारे ज्योतिषी से विस्तृत मिलान परामर्श पूछें।',
    },
    {
      id: 'dosha',
      title: 'Dosha awareness — understand, do not fear',
      titleHi: 'दोष जागरूकता — समझें, भय नहीं',
      traditionalClaim: nadi || bhakoot
        ? 'A high-weight Dosha is present in the traditional koota set. Classical sources never say "do not marry" on a Dosha alone; they say "understand, neutralize where possible, and consult."'
        : `No high-weight Koota Dosha is present; the supplemental layer notes ${activeDoshaNames}.`,
      traditionalClaimHi: nadi || bhakoot
        ? 'पारंपरिक कूट समूह में उच्च-महत्त्व का दोष है। शास्त्रीय स्रोत अकेले दोष के आधार पर "विवाह न करें" नहीं कहते; वे कहते हैं "समझें, जहाँ संभव हो निराकरण करें, और परामर्श लें।"'
        : `कोई उच्च-महत्त्व का कूट दोष नहीं है; पूरक परत ${activeDoshaNames} नोट करती है।`,
      explanation: nadi || bhakoot
        ? 'The traditions give Dosha cancellation rules (same sign different nakshatra, same nakshatra different pada, friendly lords, good Navamsha) — and they counsel that a Dosha is one factor among nine grahas, twelve houses and many dashas.'
        : 'The absence of a high-weight Koota Dosha is a useful positive signal, but it does not guarantee anything — the supplemental Mangal/Rajju/Vedha/Kala Sarpa and the full chart still matter.',
      explanationHi: nadi || bhakoot
        ? 'शास्त्र परिहार नियम देते हैं (एक ही राशि अलग नक्षत्र, एक ही नक्षत्र अलग चरण, मित्र स्वामी, शुभ नवांश) — और कहते हैं कि दोष नौ ग्रहों, बारह भावों और अनेक दशाओं का केवल एक कारक है।'
        : 'उच्च-महत्त्व का कूट दोष न होना सकारात्मक संकेत है, पर गारंटी नहीं — पूरक मंगल/रज्जु/वेध/कालसर्प और पूरी कुंडली अब भी मायने रखते हैं।',
      motivation: nadi || bhakoot
        ? 'You are already ahead: you are seeing this clearly. Understanding a Dosha is the opposite of being controlled by it.'
        : 'Your charts already give you a clean emotional baseline, and the supplemental layer is showing you the next level of detail.',
      motivationHi: nadi || bhakoot
        ? 'आप पहले ही आगे हैं: आप इसे स्पष्ट देख रहे हैं। दोष को समझना उससे नियंत्रित होने के विपरीत है।'
        : 'आपकी कुंडलियाँ साफ भावनात्मक आधार देती हैं, और पूरक परत उसे अगले स्तर पर दिखाती है।',
      caution: 'Dosha does not equal doom. No classical authority of the sources we follow says a Dosha alone ends a marriage.',
      cautionHi: 'दोष का अर्थ विनाश नहीं। हम जिन स्रोतों का अनुसरण करते हैं, उनमें से कोई भी यह नहीं कहता कि अकेला दोष विवाह समाप्त करता है।',
      bestScenario: 'The two of you decide, with knowledge, to build a marriage that actively practices the very things the caution areas ask for.',
      bestScenarioHi: 'आप दोनों जानबूझकर वह विवाह बनाते हैं जो सावधानी के क्षेत्रों की माँग प्रतिदिन अभ्यास करता है।',
      askAstrologer: 'Our astrologer will check the Mangal Dosha, Rajju, Vedha, Kala Sarpa, the D9, and the 7th-house synthesis together — the complete Milan picture.',
      askAstrologerHi: 'हमारे ज्योतिषी मंगल दोष, रज्जु, वेध, काल सर्प, D9 और सप्तम भाव संश्लेषण साथ जाँचेंगे — पूरा मिलान चित्र।',
    },
    {
      id: 'synthesis',
      title: 'The deeper chart — D9, 7th house and marriage karakas',
      titleHi: 'गहरी कुंडली — D9, सप्तम भाव और विवाह कारक',
      traditionalClaim: synthesis.navamsha.status === 'UNKNOWN'
        ? 'The D9 and seventh-house synthesis is not asserted here because the required divisional data was not provided.'
        : 'The traditional synthesis reads the D9 navamsha, the seventh house and the marriage karakas (Venus / Jupiter) beside the 36-guna score.',
      traditionalClaimHi: synthesis.navamsha.status === 'UNKNOWN'
        ? 'D9 और सप्तम भाव का संश्लेषण यहाँ नहीं कहा गया क्योंकि आवश्यक विभाजन-डेटा नहीं मिला।'
        : 'पारंपरिक संश्लेषण 36-गुण स्कोर के साथ D9 नवांश, सप्तम भाव और विवाह कारकों (शुक्र/बृहस्पति) को पढ़ता है।',
      explanation: 'A full classical Milan is not a Moon-only test. The D9 is the principal varga for marriage, the seventh house shows partnership, and Venus / Jupiter stand for the gift and protection of marriage. This layer reports what the provided charts support.',
      explanationHi: 'पूर्ण शास्त्रीय मिलान केवल चन्द्र-परीक्षण नहीं है। D9 विवाह का प्रमुख वर्ग है, सप्तम भाव साझेदारी दिखाता है, और शुक्र/बृहस्पति विवाह के उपहार और संरक्षण का प्रतीक हैं। यह परत बताती है कि दी गई कुंडलियाँ किस दिशा में समर्थन देती हैं।',
      motivation: synthesis.seventhHouse.status === 'STRONG'
        ? 'The partnership houses are reading as supportive — a genuinely encouraging sign for the marriage question.'
        : synthesis.navamsha.status === 'ALIGNED'
          ? 'The navamsha alignment is a meaningful plus in the traditional method.'
          : 'Even where the deeper chart is mixed, you now have a clear, honest next step.',
      motivationHi: synthesis.seventhHouse.status === 'STRONG'
        ? 'साझेदारी के भाव समर्थन देते हुए पढ़े जा रहे हैं — विवाह प्रश्न के लिए सचमुच प्रोत्साहन।'
        : synthesis.navamsha.status === 'ALIGNED'
          ? 'नवांश संरेखण पारंपरिक विधि में सार्थक शुभ संकेत है।'
          : 'जहाँ गहरी कुंडली मिश्रित है, वहाँ भी आपके पास अब स्पष्ट, ईमानदार अगला कदम है।',
      caution: 'The deeper-chart layer uses the divisional and karaka data currently provided. It is not a full Navamsha/Ashtakavarga reading and never a substitute for an expert.',
      cautionHi: 'गहरी कुंडली परत वही विभाजन/कारक डेटा उपयोग करती है जो अभी दिया गया है। यह पूर्ण नवांश/अष्टकवर्ग पाठ नहीं और विशेषज्ञ का स्थान नहीं लेती।',
      bestScenario: 'You take the classical frame as a guide, then bring your values, communication, and honest effort — that is the best possible life scenario the chart can support.',
      bestScenarioHi: 'आप शास्त्रीय ढाँचे को मार्गदर्शक मानते हैं, फिर अपने मूल्य, संवाद और ईमानदार प्रयास जोड़ते हैं — यही सर्वोत्तम संभव जीवन है जिसे कुंडली समर्थन दे सकती है।',
      askAstrologer: 'Ask our astrologer to read the full D9, the 7th house, Venus/Jupiter, the dashas and the remedies together.',
      askAstrologerHi: 'हमारे ज्योतिषी से पूर्ण D9, सप्तम भाव, शुक्र/बृहस्पति, दशा और उपाय साथ पढ़ें।',
    },
  ];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Build a Milan chart context from a canonical snapshot (optional fields). */
export function milanContextFromSnapshot(snapshot: any): MilanChartContext {
  const ctx: MilanChartContext = {};
  const planets = Array.isArray(snapshot?.planetsArray) ? snapshot.planetsArray : [];
  const mars = planets.find((p: any) => p.name === 'Mars');
  const lagnaId = Number(snapshot?.lagna?.rashiId) || 1;
  const lagnaRashi = snapshot?.lagna?.rashiEn || snapshot?.lagna?.rasiName || snapshot?.lagna?.rashiName || '';

  if (mars) {
    if (typeof mars.house === 'number') ctx.marsHouse = mars.house;
    const marsId = Number(mars.rashiId) || 0;
    const moonId = Number(snapshot?.planets?.Moon?.rashiId) || (snapshot?.planetsArray?.find?.((p: any) => p.name === 'Moon')?.rashiId) || 0;
    if (moonId && marsId) ctx.marsFromMoonHouse = rashiDistance(moonId, marsId);
    const venus = planets.find((p: any) => p.name === 'Venus');
    if (venus && marsId) ctx.marsFromVenusHouse = rashiDistance(Number(venus.rashiId) || 1, marsId);
    const marsNav = snapshot?.vargas?.d9Navamsha?.find?.((v: any) => v.planet === 'Mars');
    ctx.mars = {
      name: mars.name,
      house: typeof mars.house === 'number' ? mars.house : undefined,
      rashiName: englishRashiName(mars.rashiEn || mars.rasiName || mars.rashiName || ''),
      rashiId: marsId || undefined,
      dignity: mars.dignity || mars.status || undefined,
      longitude: typeof mars.longitude === 'number' ? mars.longitude : undefined,
      isRetrograde: Boolean(mars.isRetrograde),
      navamshaRashiName: marsNav ? englishRashiName(marsNav.navamshaRashi) : undefined,
      navamshaRashiId: marsNav ? marsNav.navamshaRashiId : undefined,
    };
  }

  ctx.lagnaRashiId = lagnaId;
  ctx.lagnaRashiName = lagnaRashi;
  ctx.planetsArray = planets;

  const manglik = snapshot?.yogasAndDoshas?.manglik;
  if (manglik && typeof manglik.isManglik === 'boolean') {
    ctx.manglik = {
      isManglik: manglik.isManglik,
      severity: manglik.severity,
      isCancelled: Boolean(manglik.isCancelled),
      causeHouse: manglik.causeHouse ?? null,
      description: manglik.description,
    };
  }

  // D9 Moon.
  const d9 = snapshot?.vargas?.d9Navamsha?.find?.((v: any) => v.planet === 'Moon');
  if (d9) {
    ctx.d9MoonRashiName = englishRashiName(d9.navamshaRashi);
    ctx.d9MoonRashiId = d9.navamshaRashiId;
  }

  // Seventh house from the houses array.
  const houses = Array.isArray(snapshot?.houses) ? snapshot.houses : [];
  const seventh = houses.find((h: any) => Number(h.number) === 7 || Number(h.house) === 7);
  if (seventh) {
    const id = Number(seventh.rashiId ?? seventh.rasiId) || 0;
    ctx.seventhHouseId = id;
    ctx.seventhHouseName = seventh.rashiEn ?? seventh.rasiName ?? seventh.rashiName ?? '';
    const rashi = RASHIS.find((r: any) => r.id === id);
    ctx.seventhHouseLord = rashi?.lord || '';
  } else if (lagnaId) {
    const seventhId = ((lagnaId + 6) % 12) + 1;
    const rashi = RASHIS.find((r: any) => r.id === seventhId);
    ctx.seventhHouseId = seventhId;
    ctx.seventhHouseName = rashi?.en || '';
    ctx.seventhHouseLord = rashi?.lord || '';
  }

  ctx.venus = planets.find((p: any) => p.name === 'Venus');
  ctx.jupiter = planets.find((p: any) => p.name === 'Jupiter');
  return ctx;
}

/** Build a pair of inputs from a canonical snapshot (Moon fields). */
export function milanInputFromSnapshot(snapshot: any): MilanPersonInput {
  const moon = snapshot?.planets?.Moon || snapshot?.planets?.find?.((p: any) => p.name === 'Moon') || {};
  const panchangNak = snapshot?.birthPanchang?.nakshatra || {};
  // Prefer the ENGLISH rashi name (rashiEn / rasiName) because the Milan
  // tables are keyed by English sign names. The canonical snapshot's
  // `rashiName` field is Sanskrit (Mesha etc.).
  const rashiName = moon.rashiEn || moon.rasiName || moon.rashiName || '';
  const nakshatraName = moon.nakshatra?.name || panchangNak?.name || '';
  const pada = moon.nakshatra?.pada || moon.pada || panchangNak?.pada || 1;
  const rashiLord = moon.rashiLord || moon.lord || rashiLordByName(rashiName);
  return normalizePerson({ rashiName, nakshatraName, pada, rashiLord });
}

export default calculateMilan;

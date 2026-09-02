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
} from './milanData';
import { RASHIS } from '../../../astrologyEngine';

export interface MilanPersonInput {
  /** English rashi name, e.g. "Taurus". */
  rashiName: string;
  /** English nakshatra name, e.g. "Rohini". */
  nakshatraName: string;
  /** Nakshatra pada / charan, 1-4. Optional for dosha cancellation. */
  pada?: number;
  /** Moon rashi lord, e.g. "Venus". Used for Graha Maitri. */
  rashiLord?: string;
}

export interface KootaResult {
  id: string;
  name: string;
  /** Sanskrit / traditional name. */
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
  motivation: string;
  caution: string;
  bestScenario: string;
  askAstrologer: string;
}

export interface MilanCalculation {
  bride: MilanPersonInput;
  groom: MilanPersonInput;
  kootas: KootaResult[];
  total: number;
  maxTotal: number;
  doshas: DoshaResult[];
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
  sources: string[];
}

/** Normalize a person input. */
export function normalizePerson(input: Partial<MilanPersonInput>): MilanPersonInput {
  return {
    rashiName: input.rashiName || '',
    nakshatraName: input.nakshatraName || '',
    pada: input.pada && input.pada >= 1 && input.pada <= 4 ? input.pada : 1,
    rashiLord: input.rashiLord || '',
  };
}

/** True when the input resolves to a known rashi and nakshatra. */
export function isValidMilanInput(input: Partial<MilanPersonInput>): boolean {
  const n = normalizePerson(input);
  return Boolean(
    n.rashiName && n.nakshatraName &&
    RASHI_ID_BY_NAME[n.rashiName] &&
    YONI_BY_NAKSHATRA[n.nakshatraName]
  );
}

/** Lookup the lord for an English rashi name; empty when unknown. */
export function rashiLordByName(rashiName: string): string {
  const rashi = RASHIS.find((r: any) => r.en.toLocaleLowerCase() === rashiName.toLocaleLowerCase());
  return rashi?.lord || '';
}

/** Look up a source label. */
export function sourceLabel(key: keyof typeof SOURCE_LABELS): string {
  return SOURCE_LABELS[key];
}

/** Distance between two 1-based nakshatra indices, 1..27. */
export function nakshatraDistance(fromName: string, toName: string): number {
  const a = nakshatraIndex(fromName);
  const b = nakshatraIndex(toName);
  if (a <= 0 || b <= 0) return 0;
  return ((b - a + 27) % 27) + 1;
}

/** Distance between two 1-based rashi ids, 1..12 (1 = same sign). */
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
 * Calculate the eight kootas deterministically from two Moon placements.
 *
 * Inputs follow the canonical snapshot's Moon shape
 * (rashiName, nakshatraName, pada, rashiLord). The tables are the classical
 * Ashtakoota grids (see milanData.ts), so the same two charts always produce
 * the same 36-guna result.
 */
export function calculateMilan(
  brideInput: Partial<MilanPersonInput>,
  groomInput: Partial<MilanPersonInput>
): MilanCalculation {
  const bride = normalizePerson(brideInput);
  const groom = normalizePerson(groomInput);

  const brideRashiId = RASHI_ID_BY_NAME[bride.rashiName] || 0;
  const groomRashiId = RASHI_ID_BY_NAME[groom.rashiName] || 0;
  const brideNakIdx = nakshatraIndex(bride.nakshatraName);
  const groomNakIdx = nakshatraIndex(groom.nakshatraName);

  // — Varna (1) —
  const brideVarna = VARNA_BY_RASHI[bride.rashiName];
  const groomVarna = VARNA_BY_RASHI[groom.rashiName];
  const varnaPoints = brideVarna && groomVarna && varnaScore(brideVarna, groomVarna) === 1 ? 1 : 0;

  // — Vashya (2) —
  const brideVashya = VASHYA_BY_RASHI[bride.rashiName];
  const groomVashya = VASHYA_BY_RASHI[groom.rashiName];
  const vashyaPoints = brideVashya && groomVashya ? VASHYA_MATRIX[brideVashya][groomVashya] : 0;

  // — Tara (3) —
  const taraA = taraCategory(nakshatraDistance(groom.nakshatraName, bride.nakshatraName));
  const taraB = taraCategory(nakshatraDistance(bride.nakshatraName, groom.nakshatraName));
  const taraPoints =
    taraA === 'Benefic' && taraB === 'Benefic' ? 3 :
    taraA === 'Benefic' || taraB === 'Benefic' ? 1.5 : 0;

  // — Yoni (4) —
  const brideYoni = YONI_BY_NAKSHATRA[bride.nakshatraName];
  const groomYoni = YONI_BY_NAKSHATRA[groom.nakshatraName];
  const yoniPoints = brideYoni && groomYoni ? YONI_MATRIX[brideYoni][groomYoni] : 0;

  // — Graha Maitri (5) —
  const brideLord = bride.rashiLord || rashiLordByName(bride.rashiName);
  const groomLord = groom.rashiLord || rashiLordByName(groom.rashiName);
  const grahaMaitriPoints = scoreGrahaMaitri(brideLord, groomLord);

  // — Gana (6) —
  const brideGana = GANA_BY_NAKSHATRA[bride.nakshatraName];
  const groomGana = GANA_BY_NAKSHATRA[groom.nakshatraName];
  const ganaPoints = brideGana && groomGana ? GANA_MATRIX[brideGana][groomGana] : 0;

  // — Bhakoot (7) —
  const distance = rashiDistance(brideRashiId, groomRashiId);
  const bhakootAuspicious = [1, 3, 4, 7, 10, 11].includes(distance);
  const bhakootPoints = bhakootAuspicious ? 7 : 0;

  // — Nadi (8) —
  const brideNadi = NADI_BY_NAKSHATRA[bride.nakshatraName];
  const groomNadi = NADI_BY_NAKSHATRA[groom.nakshatraName];
  const nadiSame = Boolean(brideNadi && groomNadi && brideNadi === groomNadi);
  const nadiCancelled = Boolean(nadiSame && (
    (brideRashiId === groomRashiId && bride.nakshatraName !== groom.nakshatraName) ||
    (bride.nakshatraName === groom.nakshatraName && (bride.pada || 1) !== (groom.pada || 1))
  ));
  const nadiPoints = nadiSame ? (nadiCancelled ? 8 : 0) : 8;
  const nadiDoshaActive = Boolean(nadiSame && !nadiCancelled);

  // — Dosha computation —
  const bhakootDoshaActive = !bhakootAuspicious;
  const bhakootCancelled = Boolean(bhakootDoshaActive && (
    brideLord === groomLord ||
    (Boolean(brideLord) && Boolean(groomLord) && arePlanetsFriends(brideLord, groomLord))
  ));
  const navamshaFriendly = (bride.pada || 1) === (groom.pada || 1);
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

  if (nadiCancelled) doshas[0].cancelled = true;
  if (bhakootCancelled) doshas[1].cancelled = true;

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

  const band = totalBand(total, nadiDoshaActive, bhakootDoshaActive);

  return {
    bride,
    groom,
    kootas,
    total,
    maxTotal: 36,
    doshas,
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
    predictions: buildPredictions(bride, groom, kootas, total, nadiDoshaActive, bhakootDoshaActive),
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

function buildPredictions(
  bride: MilanPersonInput,
  groom: MilanPersonInput,
  kootas: KootaResult[],
  total: number,
  nadi: boolean,
  bhakoot: boolean
): PredictionBlock[] {
  const top = [...kootas].sort((a, b) => b.points / b.maxPoints - a.points / a.maxPoints)[0];
  const low = [...kootas].filter((k) => k.points / k.maxPoints <= 0.5);
  const lowNames = low.map((k) => k.name).join(', ');

  return [
    {
      id: 'resonance',
      title: 'The natural rhythm between you',
      titleHi: 'आप दोनों के बीच स्वाभाविक तालमेल',
      traditionalClaim: `In Ashtakoota, the ${top.name} Koota expresses the most natural, instinctive harmony in this pairing, while ${lowNames || 'the balance of the other kootas'} asks for conscious care.`,
      traditionalClaimHi: `अष्टकूट में ${top.name} कूट इस संयोग में सबसे स्वाभाविक, प्रवृत्तिगत सामंजस्य दर्शाता है, जबकि ${lowNames || 'शेष कूटों का संतुलन'} चेतन अभ्यास माँगता है।`,
      explanation: 'The Moon is the emotional home in Vedic astrology. When two Moon signs and nakshatras sit well together, traditional wording is that the couple feels "at home" with each other early and often.',
      motivation: 'You both have a real, examineable emotional base to build on. That is a strength — not a slot-machine verdict.',
      caution: `A 36-guna score reads the Moon and the conventional koota grids only. It does not replace love, communication, shared values, or a full chart consult. A low reading is not a prediction of failure.`,
      bestScenario: 'Best case: you and your partner regularly see the best in each other, resolve differences as a team, and grow emotionally side by side.',
      askAstrologer: 'Our astrologer reads the full chart, the houses, the dashas and the doshas together — ask a detailed Milan question.',
    },
    {
      id: 'mcdonald',
      title: 'What the chart supports you toward (traditional reading)',
      titleHi: 'कुंडली जिस दिशा में समर्थन देती है (पारंपरिक पाठ)',
      traditionalClaim: `With a ${total}/36 Ashtakoota score${nadi || bhakoot ? ' and a Dosha present' : ''}, the traditional "phala" for the strong Kootas is emotional companionship, shared decision-making, and a supportive home; the caution areas are around patience and honest communication.`,
      traditionalClaimHi: `${total}/36 अष्टकूट स्कोर के साथ${nadi || bhakoot ? ' और एक दोष की उपस्थिति में' : ''}, सशक्त कूटों के पारंपरिक फल भावनात्मक साथ, साझा निर्णय और सहायक घर हैं; सावधानी के क्षेत्र धैर्य और ईमानदार संवाद हैं।`,
      explanation: 'Classical texts pair the Moon with the home, the mother, the inner security and the way a person gives emotional care. Matching the Moon nakshatra is therefore the classic "heart of the marriage" test.',
      motivation: 'This reading is designed to help you feel encouraged about the real work of a relationship, and curious about the deeper chart.',
      caution: 'This is a traditional symbolic reading. It is not a diagnosis, not a guarantee of marital success or failure, and never a substitute for a professional relational or medical consultation.',
      bestScenario: 'You build a calm, affectionate home; you share responsibilities; you become each other\'s best support through the long seasons of life.',
      askAstrologer: 'To see how the current dasha, the 7th house, Venus, Mars, and D9 Navamsha qualify this reading, ask our astrologer for the detailed Milan consultation.',
    },
    {
      id: 'dosha',
      title: 'Dosha awareness — understand, do not fear',
      titleHi: 'दोष जागरूकता — समझें, भय नहीं',
      traditionalClaim: nadi || bhakoot
        ? 'A high-weight Dosha is present in the traditional koota set. Classical sources never say "do not marry" on a Dosha alone; they say "understand, neutralize where possible, and consult."'
        : 'No high-weight Dosha is present in the Koota test, which is a comfort traditional text would note.',
      traditionalClaimHi: nadi || bhakoot
        ? 'पारंपरिक कूट समूह में उच्च-महत्त्व का दोष है। शास्त्रीय स्रोत अकेले दोष के आधार पर "विवाह न करें" नहीं कहते; वे कहते हैं "समझें, जहाँ संभव हो निराकरण करें, और परामर्श लें।"'
        : 'कूट परीक्षण में कोई उच्च-महत्त्व का दोष नहीं है, जो पारंपरिक पाठ ध्यान देने योग्य राहत मानता है।',
      explanation: nadi || bhakoot
        ? `The traditions give dosage cancellation rules (same sign different nakshatra, same nakshatra different pada, friendly lords, good Navamsha) — and they counsel that a dosha is one factor among nine grahas, twelve houses and many dashas.`
        : 'The absence of a high-weight dosha in the Koota test is a useful positive signal, but it does not guarantee anything — the full chart still matters.',
      motivation: nadi || bhakoot
        ? `You are already ahead: you are seeing this clearly. Understanding a Dosha is the opposite of being controlled by it.`
        : 'Your charts already give you a clean emotional baseline to build from.',
      caution: 'Dosha does not equal doom. No classical authority of the sources we follow says a Dosha alone ends a marriage.',
      bestScenario: 'The two of you decide, with knowledge, to build a marriage that actively practices the very things the caution areas ask for.',
      askAstrologer: 'Our astrologer will check the Mangal Dosha, Rajju, Vedha, Kala Sarpa, the D9, and the 7th-house synthesis together — the complete Milan picture.',
    },
  ];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface MilanInputResult {
  ok: boolean;
  person: MilanPersonInput;
  source: string;
}

/** Build a pair of inputs from a canonical snapshot (Moon fields). */
export function milanInputFromSnapshot(snapshot: any): MilanPersonInput {
  const moon = snapshot?.planets?.Moon || snapshot?.planets?.find?.((p: any) => p.name === 'Moon') || {};
  const panchangNak = snapshot?.birthPanchang?.nakshatra || {};
  const rashiName = moon.rashiName || moon.rasiName || '';
  const nakshatraName = moon.nakshatra?.name || panchangNak?.name || '';
  const pada = moon.nakshatra?.pada || moon.pada || panchangNak?.pada || 1;
  const rashiLord = moon.rashiLord || moon.lord || rashiLordByName(rashiName);
  return normalizePerson({ rashiName, nakshatraName, pada, rashiLord });
}

export default calculateMilan;

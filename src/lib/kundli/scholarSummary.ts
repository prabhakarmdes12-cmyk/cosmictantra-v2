/**
 * SCHOLAR SUMMARY
 *
 * Two pages, placed immediately after the birth-data passport:
 *
 *   Page 1 — "Your chart at a glance": what was calculated, in one place,
 *            with an evidence id beside every value and an explicit count of
 *            what this report does NOT calculate.
 *   Page 2 — "What deserves attention": three levels, kept physically apart.
 *            1. Calculated fact        — what the engine computed.
 *            2. Traditional interpretation — what the tradition says about
 *               that fact, each carrying the fact path, the detailed section,
 *               the source-registry entry and its stated limitation.
 *            3. Practical reflection   — human guidance, never a prediction.
 *
 * Nothing here promises an event. The three levels exist so a reader can
 * always tell which of the three they are reading.
 */

import type { KundliCanonicalModel, YogaResult } from './types';
import type { HeadingBlock, KeyValueBlock, ParagraphBlock, ReportBlock, ReportSection } from './types';
import { placementEvidenceId } from './chartModel';
import { PLANET_ABBREVIATIONS, SIGN_NAMES_HI } from './chartModel';

export const SCHOLAR_SUMMARY_VERSION = 'scholar-summary-v1';

/* ------------------------------------------------------------------ */
/* Bilingual labels                                                    */
/* ------------------------------------------------------------------ */

type Loc = 'en' | 'hi';

const LABELS: Record<string, { en: string; hi: string }> = {
  lagna: { en: 'Lagna (ascendant)', hi: 'लग्न (जन्म राशि)' },
  moonSign: { en: 'Moon sign', hi: 'चन्द्र राशि' },
  nakshatra: { en: 'Janma nakshatra', hi: 'जन्म नक्षत्र' },
  sunSign: { en: 'Sun sign', hi: 'सूर्य राशि' },
  currentMaha: { en: 'Current mahadasha', hi: 'वर्तमान महादशा' },
  currentAntar: { en: 'Current antardasha', hi: 'वर्तमान अन्तर्दशा' },
  nextTransition: { en: 'Next period change', hi: 'अगला परिवर्तन' },
  d1Lagna: { en: 'D1 lagna sign', hi: 'D1 लग्न राशि' },
  d9Lagna: { en: 'D9 lagna sign', hi: 'D9 लग्न राशि' },
  dignity: { en: 'Sign placements of note', hi: 'विशेष राशि स्थितियाँ' },
  yogas: { en: 'Yogas found present', hi: 'विद्यमान योग' },
  doshas: { en: 'Doshas calculated', hi: 'गणित दोष' },
  notCalculated: { en: 'Not calculated here', hi: 'यहाँ गणित नहीं' },
  level1: { en: 'Level 1 — Calculated fact', hi: 'स्तर 1 — गणित तथ्य' },
  level2: { en: 'Level 2 — Traditional interpretation', hi: 'स्तर 2 — पारम्परिक व्याख्या' },
  level3: { en: 'Level 3 — Practical reflection', hi: 'स्तर 3 — व्यावहारिक विचार' },
  basedOn: { en: 'Calculated from', hi: 'आधार' },
  detailIn: { en: 'Full detail in section', hi: 'विस्तार अनुभाग में' },
  source: { en: 'Source', hi: 'स्रोत' },
  limitation: { en: 'Limitation', hi: 'सीमा' },
  evidence: { en: 'Evidence', hi: 'प्रमाण' },
};

/** Canonical sign name to index, for joining the summary to its detail tables. */
const SIGN_INDEX_BY_NAME: Record<string, number> = {
  Mesha: 1, Vrishabha: 2, Mithuna: 3, Karka: 4, Simha: 5, Kanya: 6,
  Tula: 7, Vrishchika: 8, Dhanu: 9, Makara: 10, Kumbha: 11, Meena: 12,
};

/** Hindi names for the twelve signs, used for values as well as labels. */
const l = (key: string, loc: Loc) => LABELS[key]?.[loc] ?? key;
const signName = (signIdx1to12: number, loc: Loc, englishName: string) =>
  loc === 'hi' ? (SIGN_NAMES_HI[signIdx1to12 - 1] ?? englishName) : englishName;

const planetName = (id: string, loc: Loc, fallback: string) => {
  const entry = (PLANET_ABBREVIATIONS as Record<string, { full: { en: string; hi: string } }>)[id];
  if (!entry) return fallback;
  return loc === 'hi' ? entry.full.hi : entry.full.en;
};

/* ------------------------------------------------------------------ */
/* Language guard                                                      */
/* ------------------------------------------------------------------ */

/**
 * Phrases that turn a reading into a promise. None of these may appear in a
 * summary. The list is checked against the generated text, not trusted to
 * the author's care.
 */
export const BANNED_PHRASES = [
  'definitely',
  'guaranteed',
  'will happen',
  'is certain',
  'you will get married',
  'you will die',
  'you will suffer',
  'you will become',
  'fatal',
  'death is indicated',
  'doomed',
  'you must fear',
  'bad omen',
  'you will win the case',
  'you will lose the case',
  'you will become rich',
  'you will go bankrupt',
  'incurable',
  'guaranteed success',
  'guaranteed results',
];

export interface LanguageFinding {
  phrase: string;
  /** Where the phrase was found — the evidence or section id. */
  where: string;
  excerpt: string;
}

export function scanBannedLanguage(
  parts: { where: string; text: string }[],
): LanguageFinding[] {
  const findings: LanguageFinding[] = [];
  for (const { where, text } of parts) {
    const haystack = text.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      const at = haystack.indexOf(phrase);
      if (at >= 0) {
        findings.push({
          phrase,
          where,
          excerpt: text.slice(Math.max(0, at - 40), at + phrase.length + 40),
        });
      }
    }
  }
  return findings;
}

/* ------------------------------------------------------------------ */
/* What this report deliberately does not calculate                    */
/* ------------------------------------------------------------------ */

/**
 * Capabilities a reader might reasonably expect that this engine does not
 * calculate. Declared in one place and counted, so the summary can state an
 * honest number instead of a rounded one, and so the number cannot drift
 * away from the code that produces it.
 */
export const NOT_CALCULATED_CAPABILITIES: { id: string; label: string; reason: string }[] = [
  { id: 'VARGA_D2', label: 'D2 Hora', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D3', label: 'D3 Drekkana', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D4', label: 'D4 Chaturthamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D7', label: 'D7 Saptamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D10', label: 'D10 Dashamsha', reason: 'awaits independent boundary fixtures' },
  { id: 'VARGA_D12', label: 'D12 Dwadashamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D16', label: 'D16 Shodashamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D20', label: 'D20 Vimshamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D24', label: 'D24 Chaturvimshamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D27', label: 'D27 Saptavimshamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D30', label: 'D30 Trimsamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D40', label: 'D40 Khavedamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D45', label: 'D45 Akshavedamsha', reason: 'not independently verified for this tier' },
  { id: 'VARGA_D60', label: 'D60 Shashtyamsha', reason: 'not independently verified for this tier' },
  { id: 'SHADBALA', label: 'Shadbala (six-fold strength)', reason: 'not implemented; not claimed' },
  { id: 'ASHTAKAVARGA', label: 'Ashtakavarga', reason: 'not implemented; not claimed' },
  { id: 'JAIMINI', label: 'Jaimini system', reason: 'not implemented; not claimed' },
  { id: 'KP', label: 'KP system', reason: 'not implemented; not claimed' },
  { id: 'PRASHNA', label: 'Prashna (horary)', reason: 'not implemented; not claimed' },
  { id: 'MUHURTA', label: 'Muhurta (electional timing)', reason: 'not implemented; not claimed' },
];

/* ------------------------------------------------------------------ */
/* Summary model                                                       */
/* ------------------------------------------------------------------ */

export interface SummaryFact {
  id: string;                 // FACT-* / CHART-D1-* / CHART-D9-* / DASHA-*
  label: string;
  value: string;
  canonicalPath: string;
  /** Detailed section that must already state this value. */
  sectionId: string;
  /** The token that must appear in that section — the value, in the form
   *  the detailed section writes it. Not the whole sentence: a summary
   *  rewords, and matching on the wording would prove nothing. */
  valueToken: string;
  status: 'CALCULATED' | 'NOT_CALCULATED';
}

export interface SummaryInterpretation {
  id: string;                 // YOGA-* / DOSHA-* / DASHA-*
  statement: string;
  /** One compact line naming the calculated fact this rests on. */
  factSummary: string;
  factPath: string;
  factEvidence: string;
  sectionId: string;
  sourceEvidence: string;     // SOURCE-*
  sourceText: string;
  locatorStatus: 'VERIFIED' | 'UNVERIFIED';
  limitation: string;
  /** First sentence, so the summary stays inside two pages. Full text lives
   *  in the detailed section named by sectionId. */
  limitationShort: string;
}

/** Caps prose that the summary quotes. The full text stays in the detailed
 *  section named alongside it, so shortening here loses nothing. */
const shorten = (text: string, max = 150): string =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

const firstSentence = (text: string, max = 150): string => {
  const cut = text.search(/[.;]\s/);
  const head = cut > 0 ? text.slice(0, cut) : text;
  return head.length > max ? `${head.slice(0, max - 1).trimEnd()}…` : head;
};

export interface ScholarSummary {
  version: string;
  facts: SummaryFact[];
  presentYogas: YogaResult[];
  materialDoshas: { id: string; label: string; detail: string }[];
  notCalculated: {
    total: number;
    declared: { id: string; label: string; reason: string }[];
    yogaCount: number;
    doshaIds: string[];
  };
  interpretations: SummaryInterpretation[];
  reflections: { id: string; text: string }[];
  /** Every summary sentence, for the language scan and the gate. */
  textParts: { where: string; text: string }[];
}

const deg = (n: number) => `${n.toFixed(2)}°`;

/**
 * Builds the summary from the canonical model only. Anything the model does
 * not know is reported as not calculated; it is never inferred, and never
 * filled in with a plausible sentence.
 */
export function buildScholarSummary(
  m: KundliCanonicalModel,
  locale: Loc = 'en',
): ScholarSummary {
  const facts: SummaryFact[] = [];
  const textParts: { where: string; text: string }[] = [];

  const addFact = (
    id: string, label: string, value: string, canonicalPath: string, sectionId: string,
    valueToken: string, status: 'CALCULATED' | 'NOT_CALCULATED' = 'CALCULATED',
  ) => {
    facts.push({ id, label, value, canonicalPath, sectionId, valueToken, status });
    textParts.push({ where: id, text: `${label}: ${value}` });
  };

  /* --- Lagna, Moon, nakshatra, Sun ------------------------------- */
  addFact(
    'FACT-LAGNA',
    l('lagna', locale),
    `${signName(m.ascendant.sign.id, locale, m.ascendant.sign.name)} ${deg(m.ascendant.degreeInSign)}`,
    'canonical.ascendant.sign', 'house-positions', m.ascendant.sign.name,
  );
  const moon = m.planets.find((p) => p.id === 'Moon')!;
  const sun = m.planets.find((p) => p.id === 'Sun')!;
  addFact(
    'FACT-MOON-SIGN',
    l('moonSign', locale),
    `${signName(moon.sign.id, locale, moon.sign.name)} ${deg(moon.degreeInSign)} (house ${moon.house})`,
    'canonical.planets[Moon].sign', 'planetary-positions', moon.sign.name,
  );
  addFact(
    'FACT-NAKSHATRA',
    l('nakshatra', locale),
    `${moon.nakshatra.name} — pada ${moon.nakshatra.pada}`,
    'canonical.planets[Moon].nakshatra', 'panchanga', moon.nakshatra.name,
  );
  addFact(
    'FACT-SUN-SIGN',
    l('sunSign', locale),
    `${signName(sun.sign.id, locale, sun.sign.name)} ${deg(sun.degreeInSign)} (house ${sun.house})`,
    'canonical.planets[Sun].sign', 'planetary-positions', sun.sign.name,
  );

  /* --- Dasha: current mahadasha, antardasha only if dated --------- */
  const d = m.dashas;
  const generatedOn = (m.calculationMetadata.generatedAt ?? '').slice(0, 10);
  addFact(
    'DASHA-MAHA-CURRENT',
    l('currentMaha', locale),
    `${planetName(d.current.mahadasha, locale, d.current.mahadasha)} (${d.current.startDate} to ${d.current.endDate})`,
    'canonical.dashas.current.mahadasha', 'vimshottari-dasha', d.current.startDate,
  );

  const currentMd = d.mahadashas.find((p) => p.planet === d.current.mahadasha);
  const currentAd = currentMd?.antardashas?.find((a) => a.planet === d.current.antardasha);
  if (currentAd && currentAd.startDate && currentAd.endDate) {
    addFact(
      'DASHA-ANTAR-CURRENT',
      l('currentAntar', locale),
      `${planetName(currentAd.planet, locale, currentAd.planet)} (${currentAd.startDate} to ${currentAd.endDate})`,
      'canonical.dashas.mahadashas[].antardashas[]', 'current-dasha', currentAd.startDate,
    );
  } else {
    // Gate: shown as not calculated rather than guessed.
    addFact(
      'DASHA-ANTAR-CURRENT',
      l('currentAntar', locale),
      'not calculated — the antardasha dates are not available for this chart',
      'canonical.dashas.current.antardasha', 'current-dasha', 'not calculated',
      'NOT_CALCULATED',
    );
  }

  const nextBoundary = (() => {
    const candidates: { date: string; label: string }[] = [];
    for (const a of currentMd?.antardashas ?? []) {
      if (a.startDate > generatedOn) {
        candidates.push({ date: a.startDate, label: `antardasha of ${planetName(a.planet, locale, a.planet)}` });
      }
    }
    for (const md of d.mahadashas) {
      if (md.startDate > generatedOn) {
        candidates.push({ date: md.startDate, label: `mahadasha of ${planetName(md.planet, locale, md.planet)}` });
      }
    }
    candidates.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    return candidates[0];
  })();
  addFact(
    'DASHA-NEXT-TRANSITION',
    l('nextTransition', locale),
    nextBoundary ? `${nextBoundary.label} begins ${nextBoundary.date}` : 'not calculated',
    'canonical.dashas.mahadashas[]', 'current-dasha', nextBoundary ? nextBoundary.date : 'not calculated',
    nextBoundary ? 'CALCULATED' : 'NOT_CALCULATED',
  );

  /* --- D1 / D9 highlights, all calculated ------------------------ */
  const d1 = m.divisionalCharts.find((c) => c.division === 1);
  const d9 = m.divisionalCharts.find((c) => c.division === 9);
  addFact(
    'CHART-D1-LAGNA',
    l('d1Lagna', locale),
    String(m.ascendant.sign.id),
    'canonical.divisionalCharts[1].lagnaSign', 'd1-placement-table', `1 ${m.ascendant.sign.id} `,
    d1 ? 'CALCULATED' : 'NOT_CALCULATED',
  );
  const d9LagnaIndex = d9 ? SIGN_INDEX_BY_NAME[d9.lagnaSign] : null;
  addFact(
    'CHART-D9-LAGNA',
    l('d9Lagna', locale),
    d9 ? d9.lagnaSign : 'not calculated',
    'canonical.divisionalCharts[9].lagnaSign', 'd9-placement-table',
    d9LagnaIndex ? `1 ${d9LagnaIndex} ` : 'not calculated',
    d9 ? 'CALCULATED' : 'NOT_CALCULATED',
  );

  const notable = m.planets
    .filter((p) => p.dignity === 'EXALTED' || p.dignity === 'DEBILITATED' || p.dignity === 'OWN_SIGN' || p.dignity === 'MOOLATRIKONA');
  // The value token is taken from the canonical model, not from the localised
  // display: the detailed sections are English in both languages, so a Hindi
  // token would never match them and the gate would report a contradiction
  // that is only a difference of script.
  const notableText = notable
    .map((p) => `${planetName(p.id, locale, p.name)}: ${p.dignity.toLowerCase().replace('_', ' ')} in ${signName(p.sign.id, locale, p.sign.name)}`);
  addFact(
    'FACT-DIGNITY',
    l('dignity', locale),
    notableText.length ? notableText.join('; ') : 'none of the nine grahas is exalted, debilitated, in moolatrikona or in its own sign',
    'canonical.planets[].dignity', 'planetary-positions', notable.length ? notable[0].name : 'Dignity',
  );

  /* --- Yogas present, and doshas that are material ---------------- */
  const presentYogas = m.yogas.filter((y) => y.status === 'PRESENT');
  addFact(
    'YOGA-PRESENT-COUNT',
    l('yogas', locale),
    presentYogas.length === 0
      ? 'none — no evaluated rule is present in this chart'
      : presentYogas.map((y) => y.name).join(', '),
    'canonical.yogas[].status', 'major-yogas', presentYogas.length ? presentYogas[0].name : 'Yoga',
  );

  const materialDoshas: { id: string; label: string; detail: string }[] = [];
  for (const dosha of m.doshas) {
    if (dosha.status !== 'CALCULATED') continue;
    const r = dosha.result as unknown as Record<string, unknown>;
    const isActive = r.present === true || r.active === true;
    if (!isActive) continue;
    const detail =
      dosha.id === 'manglik'
        ? `present${r.severity ? ` (severity ${String(r.severity).toLowerCase()})` : ''}${r.cancellation && (r.cancellation as { cancelled: boolean }).cancelled ? ', with cancellation factors evaluated' : ''}`
        : dosha.id === 'sadeSati'
          ? `active${r.phase ? `, phase ${String(r.phase)}` : ''}`
          : 'present';
    materialDoshas.push({ id: `DOSHA-${dosha.id.toUpperCase()}`, label: dosha.id, detail });
    textParts.push({ where: `DOSHA-${dosha.id.toUpperCase()}`, text: `${dosha.id}: ${detail}` });
  }
  addFact(
    'DOSHA-MATERIAL',
    l('doshas', locale),
    materialDoshas.length === 0
      ? 'none of the calculated doshas is active in this chart'
      : materialDoshas.map((x) => `${x.label} — ${x.detail}`).join('; '),
    'canonical.doshas[]', 'dosha-analysis', materialDoshas.length ? materialDoshas[0].label : 'Dosha',
  );

  /* --- What is not calculated, counted honestly ------------------- */
  const notCalcYogas = m.yogas.filter((y) => y.status === 'NOT_CALCULATED');
  const notCalcDoshas = m.doshas.filter((x) => x.status === 'NOT_CALCULATED').map((x) => x.id);
  const declared = NOT_CALCULATED_CAPABILITIES.filter(
    (c) => !notCalcDoshas.some((id) => c.id === id.toUpperCase()),
  );
  const notCalculated = {
    total: declared.length + notCalcYogas.length + notCalcDoshas.length,
    declared,
    yogaCount: notCalcYogas.length,
    doshaIds: notCalcDoshas,
  };
  addFact(
    'FACT-NOT-CALCULATED',
    l('notCalculated', locale),
    `${notCalculated.total} items — see the limitations section for the full list`,
    'scholarSummary.notCalculated', 'calculation-certificate', 'not calculated',
    'NOT_CALCULATED',
  );

  /* --- Level 2: interpretations, each fully attributed ------------ */
  const interpretations: SummaryInterpretation[] = [];
  // Two yogas at most: the summary has two pages, and a third yoga would
  // push the reflections onto a page of their own. All present yogas remain
  // listed on page 1 and in the detailed section.
  for (const yoga of presentYogas.slice(0, 2)) {
    const id = `YOGA-${yoga.id.toUpperCase()}`;
    const limitation = yoga.source.limitations?.[0]
      ?? 'no limitation is recorded for this rule in the source registry';
    const statement = yoga.source.adoptedInterpretation
      || 'the source registry records no adopted interpretation for this rule';
    interpretations.push({
      id,
      statement,
      factSummary: `${yoga.name} — every condition evaluated true (${yoga.conditions.length} condition${yoga.conditions.length === 1 ? '' : 's'})`,
      factPath: `canonical.yogas[${yoga.id}].conditions`,
      factEvidence: id,
      sectionId: 'major-yogas',
      sourceEvidence: `SOURCE-${yoga.source.ruleId.toUpperCase()}`,
      sourceText: `${yoga.source.sourceWork} — ${yoga.source.locator}`,
      locatorStatus: yoga.source.locatorVerified ? 'VERIFIED' : 'UNVERIFIED',
      limitation,
      limitationShort: firstSentence(limitation),
    });
    textParts.push({ where: id, text: `${statement} ${limitation}` });
  }

  for (const dosha of materialDoshas.slice(0, 2)) {
    const statement =
      'The tradition reads this configuration as one that warrants attention in the areas the dosha concerns.';
    const limitation =
      'a dosha is a traditional classification, not a prediction; this report does not claim any outcome';
    interpretations.push({
      id: dosha.id,
      statement,
      factSummary: `${dosha.label} — calculated as ${dosha.detail}`,
      factPath: `canonical.doshas[${dosha.label}]`,
      factEvidence: dosha.id,
      sectionId: 'dosha-analysis',
      sourceEvidence: 'SOURCE-DOSHA-CLASSIFICATION',
      sourceText: 'Traditional dosha classification',
      locatorStatus: 'UNVERIFIED',
      limitation,
      limitationShort: firstSentence(limitation),
    });
    textParts.push({ where: dosha.id, text: `${statement} ${limitation}` });
  }

  // The current dasha is given an interpretation only at the level of
  // traditional association, and never as an event.
  const dashaStatement =
    `The Vimshottari tradition associates the mahadasha of ${planetName(d.current.mahadasha, locale, d.current.mahadasha)} with the themes of the houses that graha rules and occupies in this chart. It is a period emphasis, not a forecast.`;
  const dashaLimitation =
    'period emphasis describes traditional thematic association only; no event, timing of an event, or outcome is claimed';
  interpretations.push({
    id: 'DASHA-INTERPRETATION-CURRENT',
    statement: dashaStatement,
    factSummary: `Mahadasha of ${planetName(d.current.mahadasha, locale, d.current.mahadasha)}, ${d.current.startDate} to ${d.current.endDate}`,
    factPath: 'canonical.dashas.current',
    factEvidence: 'DASHA-MAHA-CURRENT',
    sectionId: 'current-dasha',
    sourceEvidence: 'SOURCE-VIMSHOTTARI',
    sourceText: 'Vimshottari dasha system',
    locatorStatus: 'UNVERIFIED',
    limitation: dashaLimitation,
    limitationShort: firstSentence(dashaLimitation),
  });
  textParts.push({ where: 'DASHA-INTERPRETATION-CURRENT', text: `${dashaStatement} ${dashaLimitation}` });

  /* --- Level 3: reflections --------------------------------------- */
  const reflections: { id: string; text: string }[] = [
    {
      id: 'REFLECTION-1',
      text:
        'Check the calculated facts against your own records.',
    },
    {
      id: 'REFLECTION-2',
      text:
        'Which of these themes already match your experience? "Not calculated" means the engine did not compute it.',
    },
  ];
  for (const r of reflections) textParts.push({ where: r.id, text: r.text });

  return {
    version: SCHOLAR_SUMMARY_VERSION,
    facts,
    presentYogas,
    materialDoshas,
    notCalculated,
    interpretations,
    reflections,
    textParts,
  };
}

/* ------------------------------------------------------------------ */
/* Report sections                                                     */
/* ------------------------------------------------------------------ */

// Typed builders. No casts: if a block shape is wrong, the compiler says so,
// rather than the PDF renderer failing at draw time.
const kvBlock = (label: string, value: string): KeyValueBlock =>
  ({ kind: 'keyValue', label, value });
const headingBlock = (level: 1 | 2 | 3, text: string): HeadingBlock =>
  ({ kind: 'heading', level, text });
const paraBlock = (text: string): ParagraphBlock => ({ kind: 'paragraph', text });

export function buildScholarSummarySections(
  m: KundliCanonicalModel,
  locale: Loc = 'en',
): ReportSection[] {
  const s = buildScholarSummary(m, locale);

  const page1: ReportSection = {
    id: 'scholar-summary-1',
    title: 'Your chart at a glance',
    status: 'READY',
    blocks: [
      headingBlock(2, 'Your chart at a glance'),
      paraBlock(
        'Calculated from the birth data on the passport page. Every line carries an evidence id you can look up in the detailed sections.',
      ),
      ...s.facts.map((f) => kvBlock(`${f.label}  [${f.id}]`, f.value)),
      kvBlock('Not calculated in this report', String(s.notCalculated.total)),
    ],
  };

  // Level 1 states the calculated facts the interpretations below rest on.
  // It deliberately does not repeat page 1: that would double the length of
  // the summary and push the reflections onto a third page.
  const level1: ReportBlock[] = [
    headingBlock(3, l('level1', locale)),
    ...s.interpretations.map((i) => kvBlock(`${i.factEvidence}`, i.factSummary)),
  ];

  const level2: ReportBlock[] = [
    headingBlock(3, l('level2', locale)),
          paraBlock('A traditional reading of a calculated fact, never a prediction.'),
    ...s.interpretations.flatMap((i): (HeadingBlock | ParagraphBlock | KeyValueBlock)[] => [
      kvBlock(`${i.id}`, shorten(i.statement)),
      kvBlock(
        `${l('source', locale)} ${i.sourceEvidence} · ${l('basedOn', locale)}`,
        `${i.sourceText} (locator ${i.locatorStatus}); ${i.factPath}; detail: ${i.sectionId}`,
      ),
      kvBlock(l('limitation', locale), i.limitationShort),
    ]),
  ];

  const level3: ReportBlock[] = [
    headingBlock(3, l('level3', locale)),
    paraBlock(
      'These are prompts for your own judgement. They are guidance from the report, not a forecast, and not a substitute for professional advice on health, legal or financial matters.',
    ),
    ...s.reflections.map((r) => paraBlock(r.text)),
  ];

  const page2: ReportSection = {
    id: 'scholar-summary-2',
    title: 'What deserves attention',
    status: 'READY',
    blocks: [
      headingBlock(2, 'What deserves attention'),
      paraBlock(
        'Three levels, kept apart on purpose: what was calculated, what the tradition says about it, and what you might do with it.',
      ),
      ...level1,
      ...level2,
      ...level3,
    ],
  };

  return [page1, page2];
}

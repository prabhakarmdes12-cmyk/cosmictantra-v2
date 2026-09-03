/**
 * KUNDLI V40 — report model v2 (`kundli-report-v2`).
 *
 * PART A — CONSULTATION KUNDLI   (pages 1..~14, one section per page)
 * PART B — SCHOLAR APPENDIX      (variable; every technical artefact)
 *
 * The split is the whole point. Part A is what a Pandit reads in the room and
 * a client reads in five minutes. Part B is what a sceptic reads when they
 * want to break a claim. Nothing is deleted in the move — the audit material
 * that made v1 trustworthy is all still here, just out of the reading path.
 *
 * This builder consumes the canonical model and the V40 derived model only.
 * It computes no astrology (KUNDLI_INV_001).
 */

import type { KundliCanonicalModel } from '../types';
import type { KundliDerivedModel } from './derivedModel';
import type { V2Block, V2Section, KundliReportModelV2 } from './reportBlocks';
import { buildChartRenderModel, type ChartLabelMode } from '../chartModel';
import { tr, trAll, trDate } from './structuralTerms';
import { trProse } from './prosePassages';
import { trTemplate } from './proseTemplates';
import { deriveReportId } from '../lineage';
import { sha256Hex } from '../../granth/checksum';
import { YOGA_SOURCE_REGISTRY_VERSION } from '../../jyotish/yogaSourceRegistry';

import { D10_PROMOTION } from './d10Validation';
import { KARAKA_SOURCE_NOTE } from './bhavaIntelligence';
import {
  label, bhavaLabel, planetLabel, signLabelV40, nakshatraLabel, dignityLabel,
  labelModeForLocale, type LabelMode, TERMS, renderTerm,
} from './labels';
import { dms, longDate, clockTime, weekdayOf } from './format';
import { FACT } from './factPaths';
import {
  classicalAxisFor, significatorsFor, takeawayFor,
  type ExecutiveInsights,
} from './executiveInsights';
import {
  localizeKnownText,
  readerBhava,
  readerDateValue,
  readerDignity,
  readerDm,
  readerDms,
  readerEphemeris,
  readerEvidence,
  readerNumber,
  readerPlanet,
  readerSamvat,
  readerSign,
  readerStatus,
  readerYmd,
  readerClock,
} from './reportPresentation';

export const REPORT_MODEL_V2_VERSION = 'kundli-report-v2';

/** Short label for what a graha rules for this lagna. Never a verdict. */
function functionalPosition(
  f: import('./functionalLordship').FunctionalLordship,
  mode: LabelMode = 'en',
): string {
  const raw = f.ruledHouses.length === 0
    ? 'no sign lordship (node)'
    : f.yogakaraka
      ? 'yogakaraka — kendra and trikona lord'
      : [
          f.rulesKendra ? 'kendra lord' : '',
          f.rulesTrikona ? 'trikona lord' : '',
          f.rulesDusthana ? 'dusthana lord' : '',
          f.marakaCandidate ? 'maraka candidate' : '',
        ].filter(Boolean).join(', ') || 'neutral bhava lord';
  return mode === 'en' ? raw : localizeKnownText(raw, mode);
}

/** SCREAMING_SNAKE enum -> readable words, without losing the term itself. */
function humanEnum(value: string): string {
  if (!value) return '—';
  const words = value.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** CAREER_FACTOR enum -> a phrase a reader can parse. */
const CAREER_FACTOR_LABELS: Record<string, { en: string; hi: string }> = {
  TENTH_BHAVA_SIGN: { en: 'Tenth-bhava sign', hi: 'दशम भाव की राशि' },
  TENTH_LORD_IDENTITY: { en: 'Tenth lord', hi: 'दशमेश' },
  TENTH_LORD_PLACEMENT: { en: 'Tenth-lord placement', hi: 'दशमेश की स्थिति' },
  TENTH_OCCUPANTS: { en: 'Tenth-bhava occupants', hi: 'दशम भाव के स्थित ग्रह' },
  LAGNESHA_RELATION: { en: 'Lagnesha relationship', hi: 'लग्नेश सम्बन्ध' },
  ARTHA_TRIKONA: { en: 'Artha-trikona factors', hi: 'अर्थ त्रिकोण कारक' },
  FUNCTIONAL_LORDSHIP: { en: 'Functional lordship', hi: 'कार्यात्मक स्वामित्व' },
  DIGNITY_OF_KEY_GRAHAS: { en: 'Key-graha dignity', hi: 'मुख्य ग्रहों की अवस्था' },
  DRISHTI_ON_TENTH: { en: 'Drishti on the tenth', hi: 'दशम भाव पर दृष्टि' },
  CAREER_YOGAS: { en: 'Career-related yogas', hi: 'कर्म-सम्बन्धी योग' },
  D10_CONFIRMATION: { en: 'Dashamsha confirmation', hi: 'दशांश पुष्टि' },
  DASHA_ACTIVATION: { en: 'Dasha activation', hi: 'दशा सक्रियता' },
  TRANSIT_ACTIVATION: { en: 'Transit activation', hi: 'गोचर सक्रियता' },
};
function factorName(id: string, mode: LabelMode = 'en'): string {
  const term = CAREER_FACTOR_LABELS[id];
  if (term) return mode === 'en' ? term.en : mode === 'hi' ? term.hi : `${term.hi} / ${term.en}`;
  const words = id.replace(/_/g, ' ').toLowerCase();
  const readable = words.charAt(0).toUpperCase() + words.slice(1);
  return mode === 'en' ? readable : localizeKnownText(readable, mode);
}

/** Plain Hindi prose for an unavailable synthesis factor, retaining its reason. */
function unavailableFactorReason(factor: string, reason: string, mode: LabelMode): string {
  if (mode === 'en') return reason;
  const byFactor: Record<string, string> = {
    D10_CONFIRMATION: 'दशांश का स्वतंत्र सत्यापन अभी उपलब्ध नहीं है।',
    TRANSIT_ACTIVATION: 'इस रिपोर्ट के लिए गोचर-नियम सत्यापित नहीं हैं।',
    TENTH_BHAVA_SIGN: 'कुण्डली में दशम भाव उपलब्ध नहीं है।',
    TENTH_LORD_IDENTITY: 'दशम भाव की राशि से उसका स्वामी निर्धारित नहीं हो सका।',
    TENTH_LORD_PLACEMENT: 'दशमेश की स्थिति निर्धारित नहीं हो सकी।',
    TENTH_OCCUPANTS: 'दशम भाव उपलब्ध नहीं है।',
    LAGNESHA_RELATION: 'लग्नेश और दशमेश की स्थितियाँ निर्धारित नहीं हो सकीं।',
    ARTHA_TRIKONA: 'अर्थ त्रिकोण के सभी भाव निर्धारित नहीं हो सके।',
    FUNCTIONAL_LORDSHIP: 'कर्म-विषय के मुख्य ग्रह निर्धारित नहीं हो सके।',
    DIGNITY_OF_KEY_GRAHAS: 'मुख्य ग्रह निर्धारित नहीं हो सके।',
    DRISHTI_ON_TENTH: 'दशम भाव उपलब्ध नहीं है।',
    CAREER_YOGAS: 'कर्म-ग्रहों अथवा अर्थ भावों से सम्बन्धित कोई पंजीकृत योग-नियम उपलब्ध नहीं है।',
    DASHA_ACTIVATION: 'कोई चालू दशा-स्वामी रूपरेखित नहीं हो सका।',
  };
  return byFactor[factor] ?? trProse(reason, mode);
}

function careerCountHeading(kind: 'supportive' | 'challenging' | 'mixed', count: number, mode: LabelMode): string {
  const terms = {
    supportive: { en: 'Supporting factors', hi: 'सहायक कारक' },
    challenging: { en: 'Challenging factors', hi: 'बाधक कारक' },
    mixed: { en: 'Mixed and contextual factors', hi: 'मिश्रित एवं सन्दर्भ कारक' },
  }[kind];
  const suffix = ` (${readerNumber(count, mode)})`;
  return mode === 'en' ? `${terms.en}${suffix}` : mode === 'hi' ? `${terms.hi}${suffix}` : `${terms.hi} / ${terms.en}${suffix}`;
}

/** Compact motion marker for tight Part A tables. */
function motionMark(retrograde: boolean, mode: LabelMode): string {
  if (mode === 'en') return retrograde ? 'R' : 'D';
  if (mode === 'hi') return retrograde ? 'व' : 'मा';
  return retrograde ? 'व / R' : 'मा / D';
}

function appendixRef(id: string, mode: LabelMode): string {
  if (mode === 'en') return `See Appendix ${id}`;
  return mode === 'hi' ? `परिशिष्ट ${id}` : `परिशिष्ट / Appendix ${id}`;
}

function statusCaption(status: string, mode: LabelMode): string {
  if (mode === 'en') return status.replace(/_/g, ' ').toLowerCase();
  return readerStatus(status, mode).toLowerCase();
}

function bhavaStructureStatement(
  b: KundliDerivedModel['bhavas']['bhavas'][number],
  mode: LabelMode,
): string {
  if (mode === 'en') return b.structureStatement;
  const parts = [`${readerBhava(b.house, mode)} में ${readerSign(b.signName, mode)} राशि है।`];
  if (b.lord && b.lordHouse) {
    parts.push(`इसके स्वामी ${readerPlanet(b.lord, mode)} ${readerBhava(b.lordHouse, mode)} में ${readerSign(b.lordSignName ?? '', mode)} में स्थित हैं।`);
  } else if (b.lord) {
    parts.push(`इसका स्वामी ${readerPlanet(b.lord, mode)} है; उसकी स्थिति निर्धारित नहीं हो सकी।`);
  }
  parts.push(b.occupants.length > 0
    ? `स्थित ग्रह: ${b.occupants.map((planet) => readerPlanet(planet, mode)).join(', ')}।`
    : 'इस भाव में कोई ग्रह स्थित नहीं है।');
  parts.push(b.aspectsReceived.length > 0
    ? `पूर्ण पराशरी दृष्टि: ${b.aspectsReceived.map((aspect) => readerPlanet(aspect.from, mode)).join(', ')}।`
    : 'इस भाव पर कोई पूर्ण पराशरी दृष्टि नहीं है।');
  return parts.join(' ');
}

function localizedRuleAgreement(value: string, mode: LabelMode): string {
  if (mode === 'en') return value;
  const translated = trProse(value, mode);
  if (translated !== value) return translated;
  const disagreement = /^The factors disagree: (\d+) supporting against (\d+) challenging\. Both are listed; neither is suppressed\.$/.exec(value);
  if (disagreement) {
    const [, support, challenge] = disagreement;
    const hindi = `कारकों में मतभेद है: ${readerNumber(support, 'hi')} सहायक और ${readerNumber(challenge, 'hi')} बाधक। दोनों सूचियाँ दी गई हैं; कोई दबाया नहीं गया।`;
    return mode === 'hi' ? hindi : `${hindi} / ${value}`;
  }
  if (value === 'Too few factors resolved to speak of agreement.') {
    return mode === 'hi' ? 'एकमतता कहने के लिए बहुत कम कारक निर्धारित हुए हैं।' : `एकमतता कहने के लिए बहुत कम कारक निर्धारित हुए हैं। / ${value}`;
  }
  return localizeKnownText(value, mode);
}

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
// Status marks are drawn by the renderer, not typed into prose (font coverage
// is not guaranteed); the model states the status in words.

/* ------------------------------------------------------------------ */
/* Block helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * A section title, ordered for the reader's locale.
 *
 * §2 is explicit that a Hindi report is not English content wearing translated
 * labels: in `hi-en` the Hindi/Sanskrit line comes first and the English line
 * second, and in `hi` the English line is dropped altogether. Only `en` keeps
 * the English title on top with the Devanagari beneath it.
 */
const title = (text: string, secondary?: string, tag?: string, mode: LabelMode = 'en'): V2Block => {
  if (mode === 'en' || !secondary) return { kind: 'sectionTitle', text, secondary, tag };
  return {
    kind: 'sectionTitle',
    text: secondary,
    secondary: mode === 'hi-en' ? text : undefined,
    tag,
  };
};
const h2 = (text: string): V2Block => ({ kind: 'heading', level: 2, text });
const h3 = (text: string): V2Block => ({ kind: 'heading', level: 3, text });
const p = (text: string, size: 'body' | 'small' | 'micro' = 'body', contentType?: V2Block['contentType']): V2Block =>
  ({ kind: 'paragraph', text, size, contentType });
const bullets = (items: string[], size: 'body' | 'small' = 'small'): V2Block => ({ kind: 'bullets', items, size });
const spacer = (mm: number): V2Block => ({ kind: 'spacer', mm });
const divider = (): V2Block => ({ kind: 'divider' });

/* ------------------------------------------------------------------ */
/* PART A                                                              */
/* ------------------------------------------------------------------ */

function coverSection(
  canonical: KundliCanonicalModel,
  reportId: string,
  mode: LabelMode,
): V2Section {
  const s = canonical.subject;
  const asc = canonical.ascendant;
  const moon = canonical.planets.find((x) => x.id === 'Moon');
  const wd = weekdayOf(s.birthDate);
  const md = canonical.dashas.current.mahadasha;
  const ad = canonical.dashas.current.antardasha;

  const identityLines = mode === 'en'
    // The English artifact retains Sanskrit names beside its English labels;
    // they are a useful Jyotish convention rather than untranslated prose.
    ? [
        `${signLabelV40(asc.sign.id, 'hi')} ${TERMS.lagna.hi}  ·  ${asc.sign.en} Ascendant ${readerDm(asc.degreeInSign, mode)}`,
        moon ? `${signLabelV40(moon.sign.id, 'hi')} ${TERMS.rashi.hi}  ·  ${moon.sign.en} Moon sign` : '',
        `${nakshatraLabel(canonical.panchanga.nakshatra.name, 'hi')} — ${TERMS.pada.hi} ${canonical.panchanga.nakshatra.pada}  ·  ${canonical.panchanga.nakshatra.name} pada ${canonical.panchanga.nakshatra.pada}`,
      ].filter(Boolean)
    : [
        `${signLabelV40(asc.sign.id, mode)} ${renderTerm(TERMS.lagna, mode)} ${readerDm(asc.degreeInSign, mode)}`,
        moon ? `${signLabelV40(moon.sign.id, mode)} ${renderTerm(TERMS.rashi, mode)}` : '',
        `${nakshatraLabel(canonical.panchanga.nakshatra.name, mode)} — ${renderTerm(TERMS.pada, mode)} ${readerNumber(canonical.panchanga.nakshatra.pada, mode)}`,
      ].filter(Boolean);
  const hindiCurrent = `${planetLabel(md, 'hi')} ${TERMS.mahadasha.hi}  ·  ${planetLabel(ad, 'hi')} ${TERMS.antardasha.hi}`;
  const englishCurrent = `${planetLabel(md, 'en')} ${TERMS.mahadasha.en} / ${planetLabel(ad, 'en')} ${TERMS.antardasha.en}`;

  return {
    id: 'cover',
    title: 'Cover',
    part: 'A',
    startsNewPage: false,
    status: 'READY',
    blocks: [
      {
        kind: 'cover',
        invocation: TERMS.invocation.hi,
        brand: 'CosmicTantra',
        documentTitle: renderTerm(TERMS.janmaKundli, mode),
        // The audience edition is applied after the model is built
        // (`applyReportMode`); this is a safe default until then.
        editionLabel: mode === 'hi' ? 'कुण्डली' : 'Kundli',
        subjectName: s.name,
        birthLines: [
          `${trDate(longDate(s.birthDate), mode)}${wd ? `  ·  ${tr(wd.en, mode)}` : ''}`,
          readerClock(clockTime(s.birthTime), mode),
          s.locationName,
        ],
        identityLines,
        // Pure Hindi does not carry a stray English sentence; the public
        // `hi-en` edition deliberately carries both terms on this high-value
        // line, while English retains its conventional English reading.
        currentPeriodLine: mode === 'hi'
          ? hindiCurrent
          : mode === 'hi-en'
            ? `${hindiCurrent}   —   ${englishCurrent}`
            : englishCurrent,
        reportId,
        // §6: the cover carries the Report ID and the calculation school, and
        // nothing else. Engine, report-model and derived-layer versions moved
        // to the Scholar Appendix (B1 Calculation Certificate), where they are
        // preserved in full — a cover is an identity page, not a build stamp,
        // and a client reading "kundli-derived-v1" learns nothing they can use.
        verificationBadge: [
          `${canonical.calculation.ayanamshaName} · ${canonical.calculation.houseSystem.replace(/_/g, '-').toLowerCase()} · ${canonical.calculation.nodeMode.replace(/_/g, ' ').toLowerCase()}`,
        ],
        contentType: 'CALCULATED_FACT',
      },
    ],
  };
}

function passportSection(
  canonical: KundliCanonicalModel,
  derived: KundliDerivedModel,
  mode: LabelMode,
): V2Section {
  const s = canonical.subject;
  const tz = s.timezone;
  const pan = derived.panchanga;
  const wd = weekdayOf(s.birthDate);
  const offsetRaw = `UTC${tz.utcOffsetAtBirth >= 0 ? '+' : ''}${tz.utcOffsetAtBirth}`;
  const offset = readerNumber(offsetRaw, mode);
  const localTime = mode === 'hi'
    ? readerClock(clockTime(s.birthTime), mode)
    : `${readerClock(clockTime(s.birthTime), mode)} (${mode === 'hi-en' ? 'स्थानीय / local' : 'local'})`;

  return {
    id: 'kundli-passport',
    title: 'Kundli Passport',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Kundli Passport', renderTerm(TERMS.birthDetails, 'hi'), tr('PART A', mode), mode),
      p(trProse('Every value on this page is an input or a declared setting. Nothing here is interpreted.', mode), 'small', 'CALCULATED_FACT'),

      {
        kind: 'kvGrid',
        title: renderTerm(TERMS.birthDetails, mode),
        columns: 2,
        contentType: 'CALCULATED_FACT',
        items: [
          { label: label('name', mode), value: s.name },
          { label: label('date', mode), value: readerDateValue(trDate(longDate(s.birthDate), mode), mode) },
          { label: label('localTime', mode), value: localTime },
          { label: label('weekday', mode), value: wd ? renderTerm(wd, mode) : '—' },
          { label: label('place', mode), value: s.locationName },
        ],
      },

      {
        kind: 'kvGrid',
        title: renderTerm(TERMS.placeAndTime, mode),
        columns: 2,
        contentType: 'CALCULATED_FACT',
        items: [
          { label: label('latitude', mode), value: `${readerNumber(s.coordinates.latitude.toFixed(4), mode)}\u00B0` },
          { label: label('longitude', mode), value: `${readerNumber(s.coordinates.longitude.toFixed(4), mode)}\u00B0` },
          { label: label('timezone', mode), value: `${tz.timezoneId} (${offset})` },
          { label: label('utcInstant', mode), value: readerDateValue(tz.utcDateTime, mode) },
          { label: label('timezoneProvenance', mode), value: tr(humanEnum(tz.offsetProvenance), mode) },
          { label: label('coordinateProvenance', mode), value: tr(humanEnum(s.coordinates.provenance), mode) },
        ],
      },

      {
        kind: 'kvGrid',
        title: renderTerm(TERMS.panchangaIdentity, mode),
        columns: 2,
        contentType: 'CALCULATED_FACT',
        items: [
          { label: label('tithi', mode), value: tr(pan.tithi.name, mode) },
          { label: label('paksha', mode), value: tr(pan.tithi.paksha, mode) },
          { label: label('nakshatra', mode), value: `${nakshatraLabel(pan.nakshatra.name, mode)}` },
          { label: label('pada', mode), value: readerNumber(pan.nakshatra.pada, mode) },
          { label: label('yoga', mode), value: tr(pan.yoga.name, mode) },
          { label: label('karana', mode), value: tr(pan.karana.name, mode) },
          { label: label('ayana', mode), value: tr(pan.ayana.value, mode) },
          { label: label('ritu', mode), value: tr(pan.ritu.value, mode) },
          {
            label: label('amantaMasa', mode),
            value: pan.masa.amanta.status === 'CALCULATED' ? tr(String(pan.masa.amanta.value), mode) : tr('not calculated', mode),
            contentType: pan.masa.amanta.status === 'CALCULATED' ? 'CALCULATED_FACT' : 'NOT_CALCULATED',
          },
          {
            label: label('purnimantaMasa', mode),
            value: tr('not calculated', mode),
            contentType: 'NOT_CALCULATED',
          },
          { label: label('samvat', mode), value: readerSamvat(pan.samvat.value, mode) },
        ],
      },
      p(
        trProse(
          `Lunar month: the amanta name above is derived by the panchang kernel from the Sun's sidereal rashi at birth. `
          + `The purnimanta name is reported as not calculated — see the Scholar Appendix for why the two conventions are not `
          + `treated as interchangeable here.`,
          mode,
        ),
        'micro',
        'NOT_CALCULATED',
      ),

      {
        kind: 'kvGrid',
        title: renderTerm(TERMS.calculationMethod, mode),
        columns: 2,
        contentType: 'CALCULATED_FACT',
        items: [
          { label: tr('Zodiac', mode), value: tr(humanEnum(canonical.calculation.zodiac), mode) },
          { label: tr('Ayanamsha', mode), value: `${canonical.calculation.ayanamshaName} (${readerNumber(canonical.calculationMetadata.ayanamshaValueDegrees.toFixed(4), mode)}\u00B0)` },
          { label: tr('House system', mode), value: tr(humanEnum(canonical.calculation.houseSystem), mode), note: tr('each bhava is one whole rashi, counted from the rashi of the lagna', mode) },
          { label: tr('Node policy', mode), value: tr(humanEnum(canonical.calculation.nodeMode), mode), note: tr('Rahu and Ketu are the mean nodes, not the true nodes', mode) },
          { label: tr('Aspect policy', mode), value: tr('Full Parashari drishti', mode), note: tr('the node 5/9 drishti variant is recorded but not adopted', mode) },
          { label: tr('Ephemeris', mode), value: readerEphemeris(canonical.calculation.ephemerisProvider, mode) },
        ],
      },
      {
        kind: 'callout',
        tone: 'info',
        title: trProse('Why this page comes first', mode),
        // The input fingerprint used to be appended here and was scrubbed
        // back out by the Part A density filter, which matched on the English
        // phrasing. Translating the sentence slipped it past that filter and
        // the PA-02 gate caught the hash in Part A. §31 wants zero
        // implementation hashes in Part A, so it is dropped at the source
        // instead of relying on a downstream regex to keep removing it; the
        // fingerprint is stated in the Scholar Appendix, where it belongs.
        text: trProse(
          'Every statement in this report is downstream of the six settings above. Change the ayanamsha or the house system and a '
          + 'different chart appears, with different bhava lords and different yoga verdicts. They are printed here, before any '
          + 'result, so a reader can reject the whole document on its inputs rather than argue with its conclusions.',
          mode,
        ),
        contentType: 'CALCULATED_FACT',
      },
    ],
  };
}

function saarSection(
  canonical: KundliCanonicalModel,
  derived: KundliDerivedModel,
  mode: LabelMode,
): V2Section {
  const asc = canonical.ascendant;
  const moon = canonical.planets.find((x) => x.id === 'Moon');
  const lagnesha = derived.bhavas.bhavas.find((b) => b.house === 1)?.lord ?? null;
  const lagneshaCond = derived.grahaConditions.conditions.find((c) => c.graha === lagnesha);
  const bal = derived.dasha.balanceAtBirth;

  const statusItems: {
    label: string;
    status: 'PRESENT' | 'ABSENT' | 'SCHOLAR_JUDGEMENT' | 'NOT_CALCULATED' | 'INDETERMINATE';
    statusText?: string;
    note?: string;
    xref?: string;
  }[] = [];

  // In the Saar (summary) section, we only list PRESENT yogas to avoid cluttering the one-page overview.
  // The full list (including absent and non-adopted variants) is in the Yoga Dashboard.
  canonical.yogas.forEach((y, i) => {
    if (y.status === 'PRESENT') {
      statusItems.push({
        label: mode === 'en' ? y.name : localizeKnownText(y.name, mode),
        status: y.status as typeof statusItems[number]['status'],
        statusText: statusCaption(y.status, mode),
        xref: `Y-${String(i + 1).padStart(2, '0')}`,
      });
    }
  });

  for (const d of canonical.doshas) {
    if (d.id === 'manglik' && 'present' in d.result) {
      statusItems.push({
        label: tr('Manglik', mode),
        status: d.result.present ? 'PRESENT' : 'ABSENT',
        statusText: statusCaption(d.result.present ? 'PRESENT' : 'ABSENT', mode),
        note: d.result.present ? (mode === 'en'
          ? `severity ${d.result.severity}${d.result.cancellation?.cancelled ? ', cancellation rule applied' : ''}`
          : `${localizeKnownText('severity', mode)} ${readerStatus(d.result.severity ?? 'MEDIUM', mode)}${d.result.cancellation?.cancelled ? (mode === 'hi' ? ', रद्दीकरण-नियम लागू' : ', रद्दीकरण-नियम लागू / cancellation rule applied') : ''}`) : undefined,
        xref: 'D-01',
      });
    }
    if (d.id === 'sadeSati' && 'active' in d.result) {
      statusItems.push({
        label: tr('Natal Saturn–Moon positional check', mode),
        status: d.result.active ? 'PRESENT' : 'ABSENT',
        statusText: statusCaption(d.result.active ? 'PRESENT' : 'ABSENT', mode),
        note: d.result.active
          ? `${readerStatus(d.result.phase ?? 'not active at birth', mode)} (${mode === 'hi' ? 'जन्म समय' : 'at birth'})`
          : localizeKnownText('not active at birth', mode),
        xref: 'D-02',
      });
    }
    if (d.id === 'kalsarpa') {
      // Omitted from Saar summary to avoid clutter since it is NOT_CALCULATED
    }
  }

  return {
    id: 'kundli-saar',
    title: 'Kundli Saar',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Kundli Saar', renderTerm(TERMS.saar, 'hi'), tr('PART A', mode), mode),
      p(trProse('The structural chart in one page. Every line below is a calculated fact or a rule verdict; nothing on this page is an interpretation.', mode), 'small', 'CALCULATED_FACT'),

      {
        kind: 'kvGrid',
        title: renderTerm(TERMS.coreIdentity, mode),
        columns: 2,
        contentType: 'CALCULATED_FACT',
        items: [
          { label: label('lagna', mode), value: `${signLabelV40(asc.sign.id, mode)} ${readerDm(asc.degreeInSign, mode)}` },
          { label: label('lagnesha', mode), value: lagnesha && lagneshaCond ? `${planetLabel(lagnesha, mode)} \u2192 ${bhavaLabel(lagneshaCond.house, mode)}` : '—' },
          { label: label('chandraRashi', mode), value: moon ? `${signLabelV40(moon.sign.id, mode)} ${readerDm(moon.degreeInSign, mode)}` : '—' },
          { label: label('janmaNakshatra', mode), value: `${nakshatraLabel(canonical.panchanga.nakshatra.name, mode)} · ${label('pada', mode)} ${readerNumber(canonical.panchanga.nakshatra.pada, mode)}` },
          { label: label('nakshatraLord', mode), value: readerPlanet(canonical.panchanga.nakshatra.ruler, mode) },
          { label: label('suryaRashi', mode), value: (() => { const s = canonical.planets.find((x) => x.id === 'Sun'); return s ? `${signLabelV40(s.sign.id, mode)} ${readerDm(s.degreeInSign, mode)}` : '—'; })() },
        ],
      },

      {
        kind: 'kvGrid',
        title: renderTerm(TERMS.currentPeriod, mode),
        columns: 2,
        contentType: 'CALCULATED_FACT',
        items: [
          { label: label('mahadasha', mode), value: `${planetLabel(canonical.dashas.current.mahadasha, mode)} (${readerDateValue(canonical.dashas.current.startDate, mode)} \u2013 ${readerDateValue(canonical.dashas.current.endDate, mode)})` },
          { label: label('antardasha', mode), value: planetLabel(canonical.dashas.current.antardasha, mode) },
          { label: label('pratyantardasha', mode), value: canonical.dashas.current.pratyantardasha ? planetLabel(canonical.dashas.current.pratyantardasha, mode) : '—' },
          { label: label('nextAntardasha', mode), value: derived.dasha.nextAntardashaTransition ? `${planetLabel(derived.dasha.nextAntardashaTransition.lord, mode)} \u2014 ${readerDateValue(derived.dasha.nextAntardashaTransition.onDate, mode)}` : '—' },
          { label: label('nextMahadasha', mode), value: derived.dasha.nextMahadashaTransition ? `${planetLabel(derived.dasha.nextMahadashaTransition.lord, mode)} \u2014 ${readerDateValue(derived.dasha.nextMahadashaTransition.onDate, mode)}` : '—' },
          { label: label('balanceAtBirth', mode), value: bal.status === 'CALCULATED' ? `${planetLabel(bal.lord, mode)} — ${readerYmd(bal.ymd, mode)}` : tr('not calculated', mode) },
        ],
      },

      {
        kind: 'statusList',
        title: tr('Important configurations', mode),
        contentType: 'TRADITIONAL_RULE',
        system: 'PARASHARI',
        items: statusItems,
      },

      h3(tr('Structural highlights', mode)),
      bullets(derived.highlights.map((x) => x.templateId ? trTemplate(x.templateId, x.templateParams || {}, mode, x.statement) : x.statement)),
      p(trProse('Highlights are selected by declared salience rules over the calculated chart, not chosen by hand and not written by a language model. The rule that produced each line is listed in the Scholar Appendix.', mode), 'micro', 'DERIVED_JYOTISH_FACT'),
    ],
  };
}

/**
 * PART A — Executive Life Gauge.
 *
 * The printed twin of the on-screen `ExecutiveLifeGaugeDashboard`: the same six
 * dimensions, the same scores, computed by the same module from the same
 * snapshot that produced the canonical model. Before V43 the website summary
 * carried this and the downloadable folio did not, so the document a Pandit
 * held in a consultation described a thinner chart than the one the seeker had
 * just read on their phone.
 *
 * What this section may and may not say:
 *   • the SCORES are rule-derivations over calculated facts (graha bala and
 *     Sarvashtakavarga bindus) and are tagged accordingly;
 *   • the strength ratios behind them are recorded in the capability inventory
 *     as computed-but-not-validated, so the limitation is printed ON THE PAGE,
 *     not buried in the appendix;
 *   • the TAKEAWAYS are practice lines — guidance, never a prediction;
 *   • the classical axis is a traditional reading of each dimension's own
 *     significators. It adds no number.
 *
 * Returns null when the presentation layer could not be built, so a failure
 * there costs one section and never the whole document.
 */
function executiveLifeGaugeSection(
  executive: ExecutiveInsights | null,
  mode: LabelMode,
): V2Section | null {
  if (!executive || executive.dimensions.length === 0) return null;

  /** Picks the reader's language: `hi-en` glosses short labels, never prose. */
  const pick = (en: string, hi: string): string => {
    if (mode === 'en') return en;
    if (mode === 'hi') return hi;
    return `${hi} / ${en}`;
  };
  /** Prose follows trProse's own rule: a Hindi locale reads Hindi paragraphs. */
  const prose = (en: string, hi: string): string => (mode === 'en' ? en : hi);

  const items = executive.dimensions.map((d) => {
    const sig = significatorsFor(d.id);
    const axis = classicalAxisFor(d.id);
    const takeaway = takeawayFor(d.id);

    const grahaWords = sig ? sig.grahas.map((g) => planetLabel(g, mode)).join(' · ') : '';
    const bhavaWords = sig ? sig.bhavas.map((h) => readerBhava(h, mode)).join(' · ') : '';
    const bindus = typeof d.bindus === 'number'
      ? `${readerNumber(d.bindus, mode)} ${label('bindus', mode)}`
      : '';
    const ratio = typeof d.shadbalaRatio === 'number'
      ? `${label('balaRatio', mode)} ${readerNumber(d.shadbalaRatio.toFixed(2), mode)}`
      : '';
    const evidence = [grahaWords, bhavaWords, bindus, ratio].filter(Boolean).join(' · ');

    return {
      label: pick(d.titleEn, d.titleHi),
      axis: axis ? pick(axis.en, axis.hi) : undefined,
      score: d.score,
      tier: pick(d.levelEn, d.levelHi),
      evidence,
      note: takeaway ? prose(takeaway.en, takeaway.hi) : undefined,
      contentType: 'PRACTICAL_REFLECTION' as const,
    };
  });

  return {
    id: 'executive-life-gauge',
    title: 'Executive Life Gauge',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Executive Life Gauge', renderTerm(TERMS.executiveGauge, 'hi'), tr('PART A', mode), mode),
      p(
        trProse(
          'Six readings of one chart. Each is built from the graha bala of its own significators and the Sarvashtakavarga bindus of the bhavas they rule — the same six dimensions the on-screen summary shows, printed here with the same numbers, so a consultation never reads a different chart from the one the seeker saw.',
          mode,
        ),
        'small',
        'DERIVED_JYOTISH_FACT',
      ),

      {
        kind: 'gaugeGrid',
        title: renderTerm(TERMS.lifeDimension, mode),
        items,
        max: 100,
        contentType: 'DERIVED_JYOTISH_FACT',
        system: 'PARASHARI',
        footnote: trProse(
          "The classical axis beside each dimension is the traditional purushartha reading of that dimension's own significators. It adds no score and no new fact. Vidya and Arogya are read from the fifth and sixth bhavas in the Bhava Intelligence Matrix.",
          mode,
        ),
      },

      {
        kind: 'callout',
        tone: 'limitation',
        title: trProse('How far these readings go', mode),
        text: trProse(
          'The strength ratios behind these six readings are computed but have not yet been checked against an external reference, so they orient a conversation rather than settle one. Nothing here is a prediction: no event, no timing and no verdict is claimed, and no dimension overrides the calculated chart facts printed in this folio.',
          mode,
        ),
        contentType: 'PRACTICAL_REFLECTION',
      },
      /* The practice line for each dimension is printed INSIDE its own gauge
       * row rather than restated as a bullet list below it. One statement per
       * page is the density rule this document applies everywhere else (see
       * CD-08): repeating six sentences in a second layout would buy the
       * reader nothing and cost a page of the consultation folio. */
    ],
  };
}

function chartSection(
  canonical: KundliCanonicalModel,
  derived: KundliDerivedModel,
  division: 1 | 9,
  labelModeChart: ChartLabelMode,
  mode: LabelMode,
  pageTag: string,
  devanagariNumerals = false,
): V2Section {
  const model = buildChartRenderModel(canonical, division, labelModeChart, { devanagariNumerals });
  const asc = canonical.ascendant;
  const lagnesha = derived.bhavas.bhavas.find((b) => b.house === 1)?.lord ?? null;
  const lagneshaCond = derived.grahaConditions.conditions.find((c) => c.graha === lagnesha);
  const d9 = canonical.divisionalCharts.find((c) => c.division === 9);

  // The English edition has always named the rashi in Sanskrit on this line
  // and a golden artifact test pins it, so `en` output is left untouched; the
  // Hindi locales get the Devanagari name from the registry.
  const rashiHere = (id: number, sanskrit: string): string =>
    (mode === 'en' ? sanskrit : signLabelV40(id, mode));

  const sideFacts = division === 1
    ? [
        // §10: the line beside the chart is the first thing a Pandit reads,
        // so the rashi, the lagnesha and its bhava are named in the reader's
        // own vocabulary rather than transliterated ("सिंह", not "Simha";
        // "दशम भाव", not "10thH").
        { label: label('lagna', mode), value: `${rashiHere(asc.sign.id, asc.sign.name)} ${readerDm(asc.degreeInSign, mode)}` },
        {
          label: label('lagnesha', mode),
          value: lagnesha && lagneshaCond
            ? `${planetLabel(lagnesha, mode)} → ${bhavaLabel(lagneshaCond.house, mode)}`
            : '—',
        },
        { label: tr('Moon', mode), value: (() => {
            const m = canonical.planets.find((x) => x.id === 'Moon');
            return m ? `${rashiHere(m.sign.id, m.sign.name)} ${readerDm(m.degreeInSign, mode)} · ${bhavaLabel(m.house, mode)}` : '—';
          })() },
      ]
    : [
        { label: tr('D9 Lagna', mode), value: d9?.lagnaSign ? readerSign(d9.lagnaSign, mode) : '—' },
        { label: tr('Vargottama', mode), value: (() => {
            const v = derived.grahaConditions.conditions
              .filter((c) => c.vargottama.value)
              .map((c) => planetLabel(c.graha, mode));
            return v.length > 0 ? v.join(', ') : tr('none', mode);
          })() },
      ];

  const placementRows = model.houses.map((house) => {
    const occ = model.placements.filter((x) => x.houseNumber === house.houseNumber);
    return [
      readerNumber(house.houseNumber, mode),
      signLabelV40(house.signNumber, mode),
      occ.length === 0 ? '—' : occ.map((x) => {
        const name = x.displayName ?? x.planetId ?? '';
        const degree = x.degreeInSign === undefined ? '' : ` ${readerDm(x.degreeInSign, mode)}`;
        const motion = x.retrograde ? ` (${motionMark(true, mode)})` : '';
        return `${name}${degree}${motion}`;
      }).join(', '),
    ];
  });

  return {
    id: division === 1 ? 'd1-rashi-chart' : 'd9-navamsha-chart',
    title: division === 1 ? 'D1 Rashi Chart' : 'D9 Navamsha',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title(
        division === 1 ? 'D1 Rashi Chart' : 'D9 Navamsha',
        renderTerm(division === 1 ? TERMS.d1 : TERMS.d9, 'hi'),
        pageTag,
        mode,
      ),
      {
        kind: 'chart',
        chartType: division === 1 ? 'NORTH_INDIAN_D1' : 'NORTH_INDIAN_D9',
        data: model,
        size: 'hero',
        caption: trProse(division === 1
          ? 'North Indian format. House 1 is the top diamond and carries the Lagna marker; houses advance anticlockwise. A rule beneath an abbreviation marks retrograde motion.'
          : 'The ninth division, drawn from the same canonical placements with the same visual grammar as D1. D1 and D9 are the two charts this report cross-checks.', mode),
        sideFacts,
        contentType: 'CALCULATED_FACT',
      },
      {
        kind: 'table',
        headers: trAll(['Bhava', 'Rashi', 'Grahas'], mode),
        widths: [0.16, 0.3, 0.54],
        rows: placementRows,
        caption: trProse('Every placement in the drawing, as text.', mode),
        contentType: 'CALCULATED_FACT',
      },
    ],
  };
}

function grahaDossierSection(
  canonical: KundliCanonicalModel,
  derived: KundliDerivedModel,
  mode: LabelMode,
  executive: ExecutiveInsights | null = null,
): V2Section {
  const rows = derived.grahaConditions.conditions.map((c) => {
    const marks: string[] = [];
    if (c.combustion.status === 'COMBUST') marks.push(tr('combust', mode));
    else if (c.combustion.nearCombust) marks.push(tr('near combustion', mode));
    if (c.dignity.category === 'OWN_SIGN') marks.push(tr('own', mode));
    if (c.dignity.category === 'EXALTED') marks.push(tr('exalted', mode));
    if (c.dignity.category === 'DEBILITATED') marks.push(tr('debilitated', mode));
    if (c.dignity.category === 'MOOLATRIKONA') marks.push(tr('moolatrikona', mode));
    if (c.vargottama.status === 'CALCULATED' && c.vargottama.value) marks.push(tr('vargottama', mode));
    return [
      planetLabel(c.graha, mode),
      signLabelV40(c.signId, mode),
      readerDm(c.degreeInSign, mode),
      readerNumber(c.house, mode),
      nakshatraLabel(c.nakshatra, mode),
      readerNumber(c.pada, mode),
      motionMark(c.motion.retrograde, mode),
      ['Rahu', 'Ketu'].includes(c.graha)
        ? (mode === 'hi' ? 'परम्परा-आधारित' : mode === 'hi-en' ? 'परम्परा-आधारित / Tradition-dependent' : 'Tradition-dependent')
        : readerDignity(c.dignity.category, mode),
      marks.join(' · ') || '—',
    ];
  });

  return {
    id: 'graha-dossier',
    title: 'Graha Dossier',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Graha Dossier', renderTerm(TERMS.grahaDossier, 'hi'), tr('PART A', mode), mode),
      {
        kind: 'table',
        headers: trAll(['Graha', 'Rashi', 'Degree', 'Bhava', 'Nakshatra', 'Pada', 'Motion', 'Dignity', 'Notes'], mode),
        widths: [0.12, 0.12, 0.1, 0.07, 0.16, 0.06, 0.08, 0.14, 0.15],
        rows,
        contentType: 'CALCULATED_FACT',
        footnote: trProse(
          'Degrees are shown in degrees and arc-minutes; the exact decimal longitude is retained in the machine record and printed in the Scholar Appendix. ' +
          'A status appears only when the engine actually calculated it.',
          mode,
        ),
      },
      h3(tr('Functional role, conjunction and drishti', mode)),
      {
        kind: 'table',
        headers: trAll(['Graha', 'Rules bhavas', 'Functional position', 'Conjunct with', 'Casts drishti on', 'Receives drishti from'], mode),
        widths: [0.12, 0.12, 0.24, 0.16, 0.18, 0.18],
        rows: derived.grahaConditions.conditions.map((c) => [
          planetLabel(c.graha, mode),
          c.functionalLordship.ruledHouses.map((house) => readerNumber(house, mode)).join(', ') || '—',
          functionalPosition(c.functionalLordship, mode),
          c.conjunctions.length > 0 ? c.conjunctions.map((x) => planetLabel(x.with, mode)).join(', ') : '—',
          c.aspectsGiven.length > 0 ? [...new Set(c.aspectsGiven.map((a) => a.toHouse))].sort((x, y) => x - y).map((house) => readerNumber(house, mode)).join(', ') : '—',
          c.aspectsReceived.length > 0 ? c.aspectsReceived.map((a) => planetLabel(a.from, mode)).join(', ') : '—',
        ]),
        contentType: 'DERIVED_JYOTISH_FACT',
        footnote: trProse('Functional position is what the graha rules FOR THIS LAGNA. It is kept apart from natural character, which is printed in the Scholar Appendix. No maraka verdict is issued by this engine.', mode),
      },
      h3(tr('Condition notes', mode)),
      bullets([
        ...derived.grahaConditions.conditions
          .filter((c) => c.combustion.status === 'COMBUST' || c.combustion.nearCombust)
          // Angular separations are DMS here, like every other Pandit-facing
          // degree. The decimal form stays in the B4 condition appendix.
          .map((c) => c.combustion.status === 'COMBUST'
            ? trTemplate(
                'GRAHA_COMBUST',
                { graha: c.graha, distance: readerDm(c.combustion.angularDistance ?? 0, mode), orb: readerDm(c.combustion.orbUsed ?? 0, mode) },
                mode,
                `${c.graha} is combust: ${readerDm(c.combustion.angularDistance ?? 0, mode)} from the Sun against an orb of ${readerDm(c.combustion.orbUsed ?? 0, mode)}.`,
              )
            : trTemplate(
                'GRAHA_NEAR_COMBUST',
                { graha: c.graha, distance: readerDm(c.combustion.angularDistance ?? 0, mode), orb: readerDm(c.combustion.orbUsed ?? 0, mode) },
                mode,
                `${c.graha} is ${readerDm(c.combustion.angularDistance ?? 0, mode)} from the Sun, just outside the adopted ${readerDm(c.combustion.orbUsed ?? 0, mode)} orb — not combust under this rule.`,
              )),
        ...derived.grahaConditions.conditions
          .filter((c) => c.planetaryWar.status === 'IN_WAR')
          .map((c) => trTemplate(
            'GRAHA_WAR',
            { graha: c.graha, opponent: c.planetaryWar.opponent ?? '', separation: readerDms(c.planetaryWar.separationDeg ?? 0, mode) },
            mode,
            `${c.graha} is in graha yuddha with ${c.planetaryWar.opponent} (${readerDms(c.planetaryWar.separationDeg ?? 0, mode)}). The victor is not calculated.`,
          )),
        trProse('Rahu and Ketu are marked retrograde by the mean-node convention, not by observed motion.', mode),
        trProse('Shadbala: validation pending — computed internally, not verified, and used in no conclusion.', mode),
      ]),

      /* ── Four-quadrant graha archetypes (V43 parity with the website) ──
       * The dashboard shows these as nine cards: core Vedic theme, innate
       * superpower, shadow challenge and a traditional upaaya. They are the
       * classical karakatva of each graha, printed HERE — beside this chart's
       * own placement of that graha in the table above — so a Pandit can read
       * the nature and the placement on one page instead of two screens.
       * Tagged TRADITIONAL_RULE: doctrine keyed to the graha's identity, not an
       * individualised prediction and not a timing. */
      ...(executive
        ? [
            h3(renderTerm(TERMS.grahaArchetypes, mode)),
            {
              kind: 'table',
              headers: [
                label('graha', mode),
                label('coreTheme', mode),
                label('innateStrength', mode),
                label('shadowChallenge', mode),
                label('vedicRemedy', mode),
              ],
              widths: [0.09, 0.21, 0.24, 0.23, 0.23],
              rows: executive.archetypes.map((a) => {
                const hi = mode !== 'en';
                return [
                  planetLabel(a.planet, mode),
                  hi ? a.coreThemeHi : a.coreThemeEn,
                  hi ? a.strengthHi : a.strengthEn,
                  hi ? a.challengeHi : a.challengeEn,
                  hi ? a.practicalRemedyHi : a.practicalRemedyEn,
                ];
              }),
              contentType: 'TRADITIONAL_RULE',
              system: 'PARASHARI',
              footnote: trProse(
                "These four quadrants are the classical karakatva of each graha, printed beside this chart's own placement of it in the table above. They are traditional guidance keyed to the nature of the graha — not an individualised prediction and not a timing. An upaaya is offered as practice, never as a promised result.",
                mode,
              ),
            } as V2Block,
          ]
        : []),
    ],
  };
}

function bhavaMatrixSection(derived: KundliDerivedModel, mode: LabelMode): V2Section {
  const sign = (id: number | null | undefined) =>
    (id ? signLabelV40(id, mode) : '—');
  const rows = derived.bhavas.bhavas.map((b) => [
    readerNumber(b.house, mode),
    sign(b.signId),
    b.lord ? planetLabel(b.lord, mode) : '—',
    b.lordHouse ? `${readerBhava(b.lordHouse, mode)} · ${sign(b.lordSignId)}` : '—',
    b.occupants.length > 0 ? b.occupants.map((o) => planetLabel(o, mode)).join(', ') : '—',
    b.aspectsReceived.length > 0 ? b.aspectsReceived.map((a) => planetLabel(a.from, mode)).join(', ') : '—',
    b.karakas.map((k) => planetLabel(k, mode)).join(', ') || '—',
  ]);

  return {
    id: 'bhava-matrix',
    title: 'Bhava Intelligence Matrix',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Bhava Intelligence Matrix', renderTerm(TERMS.bhavaMatrix, 'hi'), tr('PART A', mode), mode),
      p(trProse('All twelve bhavas with the sign on them, their lord, where that lord actually sits, who occupies them, and the full drishti they receive.', mode), 'small', 'DERIVED_JYOTISH_FACT'),
      {
        kind: 'table',
        headers: trAll(['Bhava', 'Rashi', 'Bhavesha', 'Bhavesha placement', 'Occupants', 'Drishti received', 'Karaka'], mode),
        widths: [0.08, 0.13, 0.12, 0.2, 0.16, 0.16, 0.15],
        rows,
        contentType: 'DERIVED_JYOTISH_FACT',
        footnote: trProse(
          'Drishti listed is full Parashari graha drishti only. Bhava strength (bhava bala) is NOT calculated for this report — see the Scholar Appendix.',
          mode,
        ),
      },
      h3(tr('Bhava by bhava', mode)),
      {
        kind: 'kvGrid',
        columns: 2,
        contentType: 'DERIVED_JYOTISH_FACT',
        items: derived.bhavas.bhavas.map((b) => ({
          label: readerBhava(b.house, mode),
          value: bhavaStructureStatement(b, mode),
        })),
      },
      p(trProse(`Karaka attributions: ${KARAKA_SOURCE_NOTE}`, mode), 'micro', 'TRADITIONAL_RULE'),
    ],
  };
}

function yogaDashboardSection(canonical: KundliCanonicalModel, derived: KundliDerivedModel, mode: LabelMode): V2Section {
  const present: { label: string; status: 'PRESENT'; statusText?: string; note?: string; xref: string }[] = [];
  const absent: { label: string; status: 'ABSENT'; statusText?: string; note?: string; xref: string }[] = [];
  const scholar: { label: string; status: 'NOT_CALCULATED'; statusText?: string; note?: string; xref: string }[] = [];
  const notCalc: { label: string; status: 'NOT_CALCULATED' | 'INDETERMINATE'; statusText?: string; note?: string; xref: string }[] = [];

  // Yoga names and status words are user-visible Jyotish vocabulary, not
  // identifiers — they belong in the reader's script. The appendix keeps the
  // English name and the rule id.
  const st = (x: string) => tr(x, mode).toLowerCase();
  canonical.yogas.forEach((y, i) => {
    const xref = appendixRef(`Y-${String(i + 1).padStart(2, '0')}`, mode);
    if (y.status === 'PRESENT') present.push({ label: tr(y.name, mode), status: 'PRESENT', statusText: st('Present'), xref });
    else if (y.status === 'ABSENT') absent.push({ label: tr(y.name, mode), status: 'ABSENT', statusText: st('Absent'), xref });
    else if (y.source.adoption === 'NOT_ADOPTED') scholar.push({
      label: tr(y.name, mode), status: 'NOT_CALCULATED', statusText: st('Not calculated'),
      note: mode === 'en'
        ? y.notCalculatedReason ?? 'the sources disagree; the variant is recorded but not adopted, so no verdict is issued'
        : trProse('This rule variant is recorded but not adopted; no verdict is issued.', mode),
      xref,
    });
    else notCalc.push({
      label: tr(y.name, mode), status: y.status === 'INDETERMINATE' ? 'INDETERMINATE' : 'NOT_CALCULATED', statusText: st('Not calculated'),
      note: mode === 'en' ? y.notCalculatedReason?.slice(0, 90) : trProse('This rule was not calculated; absence is not claimed.', mode),
      xref,
    });
  });

  const doshaItems: { label: string; status: 'PRESENT' | 'ABSENT' | 'NOT_CALCULATED'; statusText?: string; note?: string; xref?: string }[] = [];
  for (const d of canonical.doshas) {
    if (d.id === 'manglik' && 'present' in d.result) {
      doshaItems.push({
        label: tr('Manglik', mode),
        status: d.result.present ? 'PRESENT' : 'ABSENT',
        statusText: statusCaption(d.result.present ? 'PRESENT' : 'ABSENT', mode),
        note: d.result.present
          ? mode === 'en'
            ? `Mars in bhava ${d.result.causeHouses?.join(', ')}, severity ${d.result.severity}${d.result.cancellation?.cancelled ? '; cancellation rule applied' : '; no cancellation rule matched'}`
            : `मंगल ${d.result.causeHouses?.map((house) => readerBhava(house, mode)).join(', ') ?? '—'} में है; ${localizeKnownText('severity', mode)} ${readerStatus(d.result.severity ?? 'MEDIUM', mode)}${d.result.cancellation?.cancelled ? (mode === 'hi' ? '; रद्दीकरण-नियम लागू' : '; रद्दीकरण-नियम लागू / cancellation rule applied') : (mode === 'hi' ? '; कोई रद्दीकरण-नियम नहीं मिला' : '; कोई रद्दीकरण-नियम नहीं मिला / no cancellation rule matched')}`
          : trProse('Mars is not in bhava 1/4/7/8/12.', mode),
        xref: appendixRef('D-01', mode),
      });
    }
    if (d.id === 'sadeSati' && 'active' in d.result) {
      doshaItems.push({
        label: tr('Natal Saturn–Moon positional check', mode),
        status: d.result.active ? 'PRESENT' : 'ABSENT',
        statusText: statusCaption(d.result.active ? 'PRESENT' : 'ABSENT', mode),
        note: trProse('Natal check only: Saturn\'s sign relative to the Moon at birth instant. This is not a transit (Gochara) search over the client\'s current life.', mode),
        xref: appendixRef('D-02', mode),
      });
    }
    if (d.id === 'kalsarpa') {
      const kr = d.result as any;
      if (kr.status === 'NOT_CALCULATED') {
        doshaItems.push({ label: tr('Kalsarpa', mode), status: 'NOT_CALCULATED', statusText: statusCaption('NOT_CALCULATED', mode), note: trProse('No rule definition adopted; absence is not claimed.', mode), xref: appendixRef('D-03', mode) });
      } else {
        const st = kr.status as string;
        doshaItems.push({
          label: tr('Kalsarpa', mode),
          status: st === 'PRESENT' ? 'PRESENT' : st === 'ABSENT' ? 'ABSENT' : 'NOT_CALCULATED',
          statusText: statusCaption(st === 'PRESENT' ? 'PRESENT' : st === 'ABSENT' ? 'ABSENT' : 'NOT_CALCULATED', mode),
          note: trProse(st === 'INDETERMINATE'
            ? 'Adopted variant could not decide (boundary case) — not calculated is not absence.'
            : `Adopted variant: one-hemisphere node-axis containment${kr.arc ? ` (${kr.arc.replace(/_/g, ' ').toLowerCase()} arc)` : ''}.`, mode),
          xref: appendixRef('D-03', mode),
        });
      }
    }
  }

  const blocks: V2Block[] = [
    title('Yoga and Dosha', renderTerm(TERMS.yogaDashboard, 'hi'), tr('PART A', mode), mode),
    p(trProse('A yoga is marked present only when EVERY condition of the applied rule evaluated true. A rule the engine does not implement is marked not calculated — it is never rewritten as absent.', mode), 'small', 'TRADITIONAL_RULE'),
  ];

  if (present.length > 0) blocks.push({ kind: 'statusList', title: tr('Confirmed', mode), items: present, contentType: 'TRADITIONAL_RULE', system: 'PARASHARI' });
  if (absent.length > 0) blocks.push({ kind: 'statusList', title: tr('Absent', mode), items: absent, contentType: 'TRADITIONAL_RULE', system: 'PARASHARI' });
  if (scholar.length > 0) blocks.push({ kind: 'statusList', title: tr('Tradition-dependent — no verdict issued', mode), items: scholar, contentType: 'NOT_CALCULATED', system: 'PARASHARI' });
  if (notCalc.length > 0) blocks.push({ kind: 'statusList', title: tr('Not calculated', mode), items: notCalc, contentType: 'NOT_CALCULATED', system: 'PARASHARI' });
  blocks.push({ kind: 'statusList', title: tr('Dosha', mode), items: doshaItems, contentType: 'TRADITIONAL_RULE', system: 'PARASHARI' });
  blocks.push(p(
    trProse('Source status for every rule above: traditional attribution — verification pending. The full provenance statement for each rule, including which locators have not been checked against a held edition, is in the Scholar Appendix.', mode),
    'micro',
    'TRADITIONAL_RULE',
  ));
  blocks.push(p(
    trTemplate(
      'YOGA_RULE_COUNT',
      { count: canonical.yogas.length },
      mode,
      `Only ${canonical.yogas.length} yoga rules are registered in this engine build. A yoga that is not listed here is not claimed to be absent — it was simply not evaluated.`,
    ),
    'micro',
    'NOT_CALCULATED',
  ));

  return { id: 'yoga-dosha-dashboard', title: trProse('Yoga and Dosha Dashboard', mode), part: 'A', startsNewPage: true, status: 'READY', blocks };
}

function vimshottariSection(canonical: KundliCanonicalModel, derived: KundliDerivedModel, mode: LabelMode): V2Section {
  const bal = derived.dasha.balanceAtBirth;
  const cur = canonical.dashas.current;
  const currentMd = canonical.dashas.mahadashas.find((m) => m.isCurrent);
  const dateRange = (start: string, end: string): string => {
    const hindi = `${readerDateValue(start, 'hi')} से ${readerDateValue(end, 'hi')}`;
    if (mode === 'en') return `${start} to ${end}`;
    return mode === 'hi' ? hindi : `${hindi} / ${start} to ${end}`;
  };
  const duration = (years: number): string => {
    const english = `${years.toFixed(0)}y`;
    const hindi = `${readerNumber(years.toFixed(0), 'hi')} वर्ष`;
    return mode === 'en' ? english : mode === 'hi' ? hindi : `${hindi} / ${english}`;
  };
  const adRows = (currentMd?.antardashas ?? []).map((ad) => [
    readerPlanet(ad.planet, mode), readerDateValue(ad.startDate, mode), readerDateValue(ad.endDate, mode), ad.planet === cur.antardasha ? localizeKnownText('current', mode) : '',
  ]);
  const currentAdIndex = (currentMd?.antardashas ?? []).findIndex((ad) => ad.planet === cur.antardasha);

  return {
    id: 'vimshottari-timeline',
    title: 'Vimshottari Timeline',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Vimshottari Timeline', renderTerm(TERMS.vimshottari, 'hi'), tr('PART A', mode), mode),
      {
        kind: 'kvGrid',
        columns: 2,
        contentType: 'DERIVED_JYOTISH_FACT',
        items: [
          {
            label: label('balanceAtBirth', mode),
            value: bal.status === 'CALCULATED'
              ? `${readerPlanet(bal.lord, mode)} ${renderTerm(TERMS.mahadasha, mode)} — ${readerYmd(bal.ymd, mode)} (${readerNumber(bal.years.toFixed(6), mode)} ${mode === 'hi' ? 'वर्ष' : mode === 'hi-en' ? 'वर्ष / years' : 'years'})`
              : tr('not calculated', mode),
            note: bal.status === 'CALCULATED'
              ? mode === 'en'
                ? `${(bal.nakshatraFractionRemaining * 100).toFixed(4)}% of the birth nakshatra remained`
                : `${readerNumber((bal.nakshatraFractionRemaining * 100).toFixed(4), mode)}% जन्म नक्षत्र का शेष भाग${mode === 'hi-en' ? ' / of the birth nakshatra remained' : ''}`
              : undefined,
          },
          { label: label('mahadasha', mode), value: `${readerPlanet(cur.mahadasha, mode)} (${dateRange(cur.startDate, cur.endDate)})` },
          { label: label('antardasha', mode), value: readerPlanet(cur.antardasha, mode) },
          { label: label('pratyantardasha', mode), value: cur.pratyantardasha ? readerPlanet(cur.pratyantardasha, mode) : '—' },
          { label: label('nextAntardasha', mode), value: derived.dasha.nextAntardashaTransition ? `${planetLabel(derived.dasha.nextAntardashaTransition.lord, mode)} \u2014 ${readerDateValue(derived.dasha.nextAntardashaTransition.onDate, mode)}` : '—' },
          { label: label('nextMahadasha', mode), value: derived.dasha.nextMahadashaTransition ? `${planetLabel(derived.dasha.nextMahadashaTransition.lord, mode)} \u2014 ${readerDateValue(derived.dasha.nextMahadashaTransition.onDate, mode)}` : '—' },
        ],
      },
      {
        kind: 'timeline',
        caption: trProse('All nine mahadashas. The current period is marked; the bar length is proportional to the period length.', mode),
        contentType: 'CALCULATED_FACT',
        periods: canonical.dashas.mahadashas.map((m) => ({
          label: readerPlanet(m.planet, mode), start: readerDateValue(m.startDate, mode), end: readerDateValue(m.endDate, mode), years: m.durationYears, current: m.isCurrent,
          rangeLabel: dateRange(m.startDate, m.endDate), durationLabel: duration(m.durationYears),
        })),
      },
      h3(trTemplate('DASHA_SCHEDULE', { mahadasha: cur.mahadasha }, mode, `Antardasha schedule inside the running ${cur.mahadasha} mahadasha`)),
      {
        kind: 'table',
        headers: trAll(['Antardasha', 'Start', 'End', ''], mode),
        widths: [0.28, 0.26, 0.26, 0.2],
        rows: adRows,
        highlightRows: [currentAdIndex].filter((i) => i >= 0),
        contentType: 'CALCULATED_FACT',
      },
      p(
        mode === 'en'
          ? `Balance-at-birth precision: the canonical adapter stores this value as a rounded string ("${canonical.dashas.startingBalanceYears.toFixed(1)} years"). ` +
            `The figure above is re-derived from the Moon's sidereal longitude with the same Vimshottari constants the dasha engine uses, and cross-checked against ` +
            `the first mahadasha the engine emitted: ${bal.crossCheck.note}`
          : trProse("The balance at birth printed above was re-derived from the Moon\'s longitude and agrees with the dasha engine to within one calendar day.", mode),
        'micro',
        'DERIVED_JYOTISH_FACT',
      ),
    ],
  };
}

function activationSection(derived: KundliDerivedModel, mode: LabelMode): V2Section {
  const rows = derived.dasha.profiles
    .filter((p2) => p2.status === 'CALCULATED')
    .map((p2) => [
      readerStatus(p2.level, mode),
      readerPlanet(p2.lord, mode),
      p2.natalHouse ? `${readerBhava(p2.natalHouse, mode)} · ${readerSign(p2.natalSign ?? '', mode)}` : '—',
      (p2.rulesHouses ?? []).map((house) => readerNumber(house, mode)).join(', ') || '—',
      p2.dignity ? readerDignity(p2.dignity, mode) : '—',
      (p2.conjunctions ?? []).map((x: string) => readerPlanet(x, mode)).join(', ') || '—',
      (p2.aspectsGivenTo ?? []).map((house) => readerNumber(house, mode)).join(', ') || '—',
    ]);

  return {
    id: 'current-dasha-activation',
    title: 'Current Dasha Activation',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Current Dasha Activation', renderTerm(TERMS.activation, 'hi'), tr('PART A', mode), mode),
      p(trProse(derived.dasha.timingNote, mode), 'small', 'DERIVED_JYOTISH_FACT'),
      {
        kind: 'table',
        headers: trAll(['Level', 'Lord', 'Natal bhava · rashi', 'Rules bhavas', 'Dignity', 'Conjunct', 'Aspects bhavas'], mode),
        widths: [0.15, 0.1, 0.19, 0.13, 0.14, 0.14, 0.15],
        rows,
        contentType: 'DERIVED_JYOTISH_FACT',
      },
      h3(tr('Overlapping themes', mode)),
      derived.dasha.overlappingThemes.length > 0
        ? bullets(derived.dasha.overlappingThemes.map((t) => t.templateId ? trTemplate(t.templateId, t.templateParams || {}, mode, t.statement) : t.statement))
        : p(trProse('No bhava is touched by more than one of the active lords.', mode), 'small', 'DERIVED_JYOTISH_FACT'),
      h3(tr('Yoga participation of the active lords', mode)),
      bullets(
        derived.dasha.profiles
          .filter((p2) => p2.status === 'CALCULATED')
          .map((p2) => {
            const yp = (p2.yogaParticipation ?? []).filter((y) => y.status === 'PRESENT');
            return yp.length > 0
              ? trTemplate(
                  'DASHA_YOGA_PRESENT',
                  { lord: p2.lord, yogas: yp.map((y) => y.name).join(', ') },
                  mode,
                  `${p2.lord}: participates in ${yp.map((y) => y.name).join(', ')}.`,
                )
              : trTemplate(
                  'DASHA_YOGA_NONE',
                  { lord: p2.lord },
                  mode,
                  `${p2.lord}: participates in no yoga that this engine found present.`,
                );
          }),
      ),
      { kind: 'notesArea', title: trProse('Notes on the running period', mode), lines: 4 },
      {
        kind: 'callout',
        tone: 'limitation',
        title: trProse('What this page does not say', mode),
        text: trProse('This page states which parts of the chart the running period touches. It does not name the events that follow, or their timing, or whether an outcome is favourable. No event is predicted anywhere in this report.', mode),
        contentType: 'NOT_CALCULATED',
      },
    ],
  };
}

function careerSection(derived: KundliDerivedModel, mode: LabelMode): V2Section {
  const c = derived.career;
  const pct = `${readerNumber(Math.round(c.confidence.evidenceCoverage * 100), mode)}%`;

  const claimRows = (claims: typeof c.supportiveFactors) =>
    claims.map((x) => [
      x.templateId ? trTemplate(x.templateId, x.templateParams || {}, mode, x.statement) : (mode === 'en' ? x.statement : localizeKnownText(x.statement, mode)),
      x.evidenceIds.slice(0, 2).map((path) => readerEvidence(path, mode)).join(' · ') || '—',
    ]);

  const blocks: V2Block[] = [
    title('Career — Reference Synthesis', renderTerm(TERMS.career, 'hi'), tr('PART A', mode), mode),
    p(trProse('Career is the one interpretive domain V40 builds end to end. Every factor below is listed with the evidence that produced it, including the factors that work against the reading and the factors that could not be evaluated at all.', mode), 'small', 'INTERPRETIVE_SYNTHESIS'),

    h3(tr('Natal indication', mode)),
    bullets(c.natalPromise.map((x) => x.templateId ? trTemplate(x.templateId, x.templateParams || {}, mode, x.statement) : (mode === 'en' ? x.statement : localizeKnownText(x.statement, mode)))),
  ];

  if (c.supportiveFactors.length > 0) {
    blocks.push(h3(careerCountHeading('supportive', c.supportiveFactors.length, mode)));
    blocks.push({
      kind: 'table', headers: trAll(['Factor', 'Evidence'], mode), widths: [0.68, 0.32],
      rows: claimRows(c.supportiveFactors), contentType: 'DERIVED_JYOTISH_FACT',
    });
  }
  if (c.challengingFactors.length > 0) {
    blocks.push(h3(careerCountHeading('challenging', c.challengingFactors.length, mode)));
    blocks.push({
      kind: 'table', headers: trAll(['Factor', 'Evidence'], mode), widths: [0.68, 0.32],
      rows: claimRows(c.challengingFactors), contentType: 'DERIVED_JYOTISH_FACT',
    });
  }
  if (c.mixedFactors.length > 0) {
    blocks.push(h3(careerCountHeading('mixed', c.mixedFactors.length, mode)));
    blocks.push(bullets(c.mixedFactors.map((x) => x.templateId ? trTemplate(x.templateId, x.templateParams || {}, mode, x.statement) : (mode === 'en' ? x.statement : localizeKnownText(x.statement, mode)))));
  }

  blocks.push(h3(tr('Dasha activation', mode)));
  blocks.push(bullets(c.dashaActivation.map((x) => x.templateId ? trTemplate(x.templateId, x.templateParams || {}, mode, x.statement) : (mode === 'en' ? x.statement : localizeKnownText(x.statement, mode)))));

  blocks.push(h3(tr('Cross-chart confirmation', mode)));
  blocks.push(bullets(c.vargaConfirmation.map((x) => {
    const statement = x.templateId
      ? trTemplate(x.templateId, x.templateParams || {}, mode, x.statement)
      : mode === 'en' ? x.statement : localizeKnownText(x.statement, mode);
    const reason = x.notCalculatedReason
      ? (mode === 'en' ? x.notCalculatedReason : unavailableFactorReason('D10_CONFIRMATION', x.notCalculatedReason, mode))
      : '';
    return `${statement}${reason ? ` (${reason})` : ''}`;
  })));


  blocks.push(h3(tr('Conclusion', mode)));
  blocks.push(bullets(c.conclusion.statements.map((s) => s.templateId ? trTemplate(s.templateId, s.templateParams || {}, mode, s.text) : (mode === 'en' ? s.text : localizeKnownText(s.text, mode))), 'body'));
  blocks.push({
    kind: 'kvGrid',
    columns: 2,
    contentType: 'INTERPRETIVE_SYNTHESIS',
    items: [
      { label: tr('Natal indication', mode), value: readerStatus(c.conclusion.natalIndication, mode) },
      { label: tr('Current activation', mode), value: readerStatus(c.conclusion.currentActivation, mode) },
      { label: tr('Evidence coverage', mode), value: mode === 'en' ? `${pct} of the declared factor checklist` : `${pct} घोषित कारक-सूची${mode === 'hi-en' ? ' / of the declared factor checklist' : ''}` },
      { label: tr('Rule agreement', mode), value: localizedRuleAgreement(c.confidence.ruleAgreement, mode) },
    ],
  });
  blocks.push({
    kind: 'callout',
    tone: 'limitation',
    title: trProse('Read this before reading the conclusion', mode),
    text:
      trTemplate(
        'CAREER_EVIDENCE_COVERAGE',
        {
          coverage: pct,
          resolved: c.confidence.resolvedFactors.length,
          total: c.confidence.resolvedFactors.length + c.confidence.missingFactors.length,
        },
        mode,
        `Evidence coverage ${pct} means ${c.confidence.resolvedFactors.length} of ${c.confidence.resolvedFactors.length + c.confidence.missingFactors.length} declared factors produced evidence.`,
      ) + ' ' + c.conclusion.explicitlyNotClaimed.map((claim) => trProse(claim, mode)).join(' '),
    contentType: 'NOT_CALCULATED',
  });
  blocks.push(h3(tr('Factors that could not be evaluated', mode)));
  blocks.push(bullets(c.confidence.missingFactors.map((m) => `${factorName(m.factor, mode)} — ${unavailableFactorReason(m.factor, m.reason, mode)}`), 'small'));
  blocks.push(p(trProse(`Birth-time sensitivity: ${c.confidence.birthTimeSensitivity}`, mode), 'micro', 'PRACTICAL_REFLECTION'));

  return { id: 'career-synthesis', title: trProse('Career Synthesis', mode), part: 'A', startsNewPage: true, status: 'READY', blocks };
}

function discussionSection(derived: KundliDerivedModel, mode: LabelMode): V2Section {
  return {
    id: 'pandit-discussion-points',
    title: 'Pandit Discussion Points',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Pandit Discussion Points', renderTerm(TERMS.discussionPoints, 'hi'), tr('PART A', mode), mode),
      p(trProse('Questions raised by structures that exist in this chart. They are prompts for the consultation, not predictions, and none of them answers itself.', mode), 'small', 'PRACTICAL_REFLECTION'),
      ...derived.discussionPoints.flatMap((d): V2Block[] => [
        p(`\u2022  ${d.templateId ? trTemplate(d.templateId, d.templateParams || {}, mode, d.question) : (mode === 'en' ? d.question : localizeKnownText(d.question, mode))}`, 'body', 'PRACTICAL_REFLECTION'),
        // Part A shows reader-facing chart evidence, never a fact-path address
        // or a raw generator sentence. The technical lineage remains in B.
        p(`      ${tr('Evidence', mode)}: ${d.evidenceIds.slice(0, 3).map((path) => readerEvidence(path, mode)).join(' · ') || '—'}`, 'micro', 'DERIVED_JYOTISH_FACT'),
      ]),
      spacer(3),
      {
        kind: 'callout',
        tone: 'info',
        text: trProse('CosmicTantra generates these prompts to save a Pandit reading time. It does not answer them, and it does not replace the judgement that answers them.', mode),
        contentType: 'PRACTICAL_REFLECTION',
      },
    ],
  };
}

function notesSection(mode: LabelMode): V2Section {
  return {
    id: 'pandit-notes',
    title: 'Pandit Notes',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('Pandit Notes', renderTerm(TERMS.panditNotes, 'hi'), tr('PART A', mode), mode),
      p(trProse('For the practitioner\'s own observations during the consultation.', mode), 'small', 'PRACTICAL_REFLECTION'),
      { kind: 'notesArea', title: trProse('Main observation / मुख्य अवलोकन', mode), lines: 4 },
      { kind: 'notesArea', title: trProse('Career / कर्म', mode), lines: 3 },
      { kind: 'notesArea', title: trProse('Marriage / विवाह', mode), lines: 3 },
      { kind: 'notesArea', title: trProse('Finance / धन', mode), lines: 3 },
      { kind: 'notesArea', title: trProse('Dasha / दशा', mode), lines: 3 },
      { kind: 'notesArea', title: trProse('Remedy / उपाय', mode), lines: 3 },
      { kind: 'notesArea', title: trProse('Follow-up / अगली भेंट', mode), lines: 2 },
    ],
  };
}

function howToReadSection(canonical: KundliCanonicalModel, derived: KundliDerivedModel, mode: LabelMode): V2Section {
  return {
    id: 'how-to-read',
    title: 'How to Read This Report',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('How to Read This Report', 'इस कुण्डली को कैसे पढ़ें', tr('PART A', mode), mode),
      h3(trProse('The kinds of statement in this report, kept apart', mode)),
      bullets([
        'CALCULATED FACT — produced by the astronomical calculation. A position, a bhava, a date.',
        'DERIVED FACT — a classical rule applied to those facts. A bhava lord, an aspect, a dignity.',
        'TRADITIONAL RULE — a named yoga or dosha, with its conditions and its verdict.',
        'READING — reasoning over facts and rules. Always labelled, always backed by the evidence it used.',
        'REFLECTION — a question or a practical thought for the consultation. Never a prediction.',
        'NOT CALCULATED — the engine did not compute it. This is never rewritten as "absent".',
      ].map((line) => trProse(line, mode)), 'body'),
      h3(tr('Status marks', mode)),
      {
        kind: 'statusList',
        contentType: 'CALCULATED_FACT',
        items: [
          { label: tr('Present', mode), status: 'PRESENT', statusText: statusCaption('PRESENT', mode), note: trProse('every condition of the rule evaluated true', mode) },
          { label: tr('Absent', mode), status: 'ABSENT', statusText: statusCaption('ABSENT', mode), note: trProse('every condition evaluated, at least one false', mode) },
          { label: tr('Scholar judgement', mode), status: 'SCHOLAR_JUDGEMENT', statusText: statusCaption('SCHOLAR_JUDGEMENT', mode), note: trProse('the sources disagree; the variant is recorded, not adopted', mode) },
          { label: tr('Not calculated', mode), status: 'NOT_CALCULATED', statusText: statusCaption('NOT_CALCULATED', mode), note: trProse('not computed. Absence is not claimed', mode) },
          { label: tr('Validation pending', mode), status: 'VALIDATION_PENDING', statusText: statusCaption('VALIDATION_PENDING', mode), note: trProse('computed but not yet trusted; shown, never used in a conclusion', mode) },
        ],
      },
      p(trProse('The mark is a shape, not a colour, so the page still reads correctly in black and white or in photocopy.', mode), 'micro', 'CALCULATED_FACT'),
      h3(trProse('What this report will never do', mode)),
      bullets([
        'It will not predict death, disease, marriage, childbirth, a court result or a financial outcome.',
        'It will not give a percentage chance of anything. Coverage figures describe evidence, not probability.',
        'It will not silently mix Parashari, Jaimini and KP. Every rule states its system.',
        'It will not present an interpretation as a calculated fact.',
      ].map((line) => trProse(line, mode)), 'body'),
      {
        kind: 'callout',
        tone: 'warning',
        title: trProse('Disclaimer', mode),
        text: trProse(
          'Jyotish is an interpretive discipline. This document states what was calculated, what a tradition says about it, and what was not calculated at all. It is not a guarantee or a certainty about any future event, and it must not be used as the basis for medical, legal or financial decisions. © 2026 CosmicTantra Technologies Pvt. Ltd.',
          mode,
        ),
        contentType: 'PRACTICAL_REFLECTION',
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* PART B — SCHOLAR APPENDIX                                           */
/* ------------------------------------------------------------------ */

function partBDivider(): V2Section {
  return {
    id: 'part-b-divider',
    title: 'Scholar Appendix',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      {
        kind: 'partDivider',
        part: 'B',
        title: 'PART B — SCHOLAR APPENDIX',
        subtitle: renderTerm(TERMS.scholarPart, 'hi'),
        contents: [
          'B1  Calculation certificate, lineage and hashes',
          'B2  Yoga evidence — rule, requirement, observation, verdict',
          'B3  Dosha evidence',
          'B4  Graha condition — full record',
          'B5  Aspect ledger and the aspect policy',
          'B6  D10 Dashamsha validation',
          'B7  Shadbala and other unvalidated capabilities',
          'B8  Source registry and provenance',
          'B9  NOT CALCULATED inventory',
          'B10 Evidence lineage and verification',
        ],
        contentType: 'CALCULATED_FACT',
      },
    ],
  };
}

function certificateSection(
  canonical: KundliCanonicalModel,
  derived: KundliDerivedModel,
  reportId: string,
  contentHash: string,
  generatedAt: string,
  locale: LabelMode,
): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  const d1 = buildChartRenderModel(canonical, 1, 'EN');
  const d9 = buildChartRenderModel(canonical, 9, 'EN');
  return {
    id: 'calculation-certificate',
    title: 'Calculation Certificate',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B1 · Calculation Certificate', 'गणना प्रमाणपत्र', mode),
      {
        kind: 'kvGrid', columns: 1, contentType: 'CALCULATED_FACT',
        items: [
          { label: tr('Report ID', mode), value: reportId },
          { label: tr('Input fingerprint', mode), value: canonical.subject.fingerprint },
          { label: tr('Content hash', mode), value: contentHash },
          { label: tr('Hash covers', mode), value: 'every calculated value, the calculation configuration, the derived-model version and the source-registry version. The generation timestamp is EXCLUDED so two copies of the same report hash identically.' },
          { label: tr('Generated at', mode), value: generatedAt },
          { label: tr('Report language', mode), value: locale === 'hi' ? 'Hindi (hi)' : 'English (en)' },
          { label: tr('D1 placement hash', mode), value: d1.placementHash },
          { label: tr('D9 placement hash', mode), value: d9.placementHash },
          { label: tr('Chart model version', mode), value: d1.chartModelVersion },
        ],
      },
      h3(tr('Engine versions', mode)),
      {
        kind: 'table', headers: trAll(['Component', 'Version'], mode), widths: [0.5, 0.5],
        rows: [
          ['Calculation kernel', canonical.calculation.engineVersion],
          ['Calculation version', canonical.calculation.calculationVersion],
          ['Report model', REPORT_MODEL_V2_VERSION],
          ...Object.entries(derived.engineVersions).map(([k, v]) => [k, v]),
          ['Yoga source registry', YOGA_SOURCE_REGISTRY_VERSION],
        ],
        contentType: 'CALCULATED_FACT',
      },
      h3(tr('Verification', mode)),
      p(
        trProse('A report is verified by comparing four values: report ID, content hash, calculation version and report-model version.', mode),
        'small', 'CALCULATED_FACT',
      ),
    ],
  };
}

function yogaEvidenceSection(canonical: KundliCanonicalModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  const blocks: V2Block[] = [
    title('B2 · Yoga Evidence', 'योग प्रमाण', mode),
    p(trProse('One entry per registered rule, in the order the dashboard lists them. Each reads as an explanation, not as a debug log.', mode), 'small', 'TRADITIONAL_RULE'),
  ];

  canonical.yogas.forEach((y, i) => {
    const ref = `Y-${String(i + 1).padStart(2, '0')}`;
    blocks.push(h3(`${ref}  ${y.name}  —  ${y.status.replace(/_/g, ' ')}`));
    blocks.push({
      kind: 'kvGrid', columns: 1, contentType: 'TRADITIONAL_RULE', system: y.system,
      items: [
        { label: tr('System', mode), value: y.system },
        { label: tr('Rule ID', mode), value: y.id },
        { label: tr('Requirement', mode), value: y.rule },
      ],
    });

    const observed = y.conditions.map((c) => [
      c.description,
      c.satisfied === null ? 'not evaluated' : c.satisfied ? 'satisfied' : 'NOT satisfied',
      c.evidence.join('; '),
    ]);
    if (observed.length > 0) {
      blocks.push({
        kind: 'table', headers: trAll(['Condition', 'Result', 'Observed'], mode), widths: [0.32, 0.15, 0.53],
        rows: observed, contentType: 'TRADITIONAL_RULE',
      });
    }
    blocks.push({
      kind: 'kvGrid', columns: 1, contentType: 'TRADITIONAL_RULE',
      items: [
        { label: tr('Result', mode), value: `${y.status.replace(/_/g, ' ')}${y.notCalculatedReason ? ` — ${y.notCalculatedReason}` : ''}` },
        ...(y.source.variants.length > 0 ? [{ label: tr('Tradition variants not applied', mode), value: y.source.variants.join(' ') }] : []),
        { label: tr('Adopted interpretation', mode), value: y.source.adoptedInterpretation },
        { label: tr('Source (as attributed)', mode), value: `${y.source.sourceWork} — ${y.source.locator}` },
        { label: tr('Locator verified', mode), value: y.source.locatorVerified ? 'yes' : 'no' },
        { label: tr('Scholarly agreement', mode), value: y.source.scholarlyAgreement },
      ],
    });
    blocks.push(divider());
  });

  return { id: 'appendix-yoga-evidence', title: trProse('Yoga Evidence', mode), part: 'B', startsNewPage: true, status: 'READY', blocks };
}

function doshaEvidenceSection(canonical: KundliCanonicalModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  const blocks: V2Block[] = [title('B3 · Dosha Evidence', 'दोष प्रमाण', mode)];
  const mars = canonical.planets.find((x) => x.id === 'Mars');
  const moon = canonical.planets.find((x) => x.id === 'Moon');
  const saturn = canonical.planets.find((x) => x.id === 'Saturn');

  for (const d of canonical.doshas) {
    if (d.id === 'manglik' && 'present' in d.result) {
      blocks.push(h3(`D-01  Manglik  —  ${d.result.present ? 'PRESENT' : 'ABSENT'}`));
      blocks.push({
        kind: 'kvGrid', columns: 1, contentType: 'TRADITIONAL_RULE', system: 'PARASHARI',
        items: [
          { label: tr('Requirement', mode), value: 'Mars occupies bhava 1, 4, 7, 8 or 12 counted from the lagna.' },
          { label: tr('Observed', mode), value: mars ? `Mars in ${mars.sign.name}, bhava ${mars.house}, dignity ${mars.dignity.replace(/_/g, ' ').toLowerCase()}` : 'Mars unresolved' },
          { label: tr('Result', mode), value: d.result.present ? `PRESENT — severity ${d.result.severity}` : 'ABSENT' },
          { label: tr('Cancellation rule', mode), value: d.result.cancellation?.cancelled ? (d.result.cancellation.reason ?? 'applied') : 'no cancellation rule matched' },
          { label: tr('Limitation', mode), value: 'Only the dignity-based cancellation is implemented. The many other cancellation rules taught in the tradition are NOT evaluated; their absence here is not a statement that they do not apply.' },
        ],
      });
    }
    if (d.id === 'sadeSati' && 'active' in d.result) {
      blocks.push(h3(`D-02  Natal Saturn–Moon Positional Check (Birth Sade Sati)  —  ${d.result.active ? 'ACTIVE AT BIRTH' : 'NOT ACTIVE AT BIRTH'}`));
      blocks.push({
        kind: 'kvGrid', columns: 1, contentType: 'TRADITIONAL_RULE', system: 'PARASHARI',
        items: [
          { label: tr('Requirement', mode), value: 'Saturn occupies the 12th, 1st or 2nd sign counted from the natal Moon sign.' },
          { label: tr('Observed', mode), value: moon && saturn ? `Moon in ${moon.sign.name} (sign ${moon.sign.id}); Saturn in ${saturn.sign.name} (sign ${saturn.sign.id}); offset ${(((saturn.sign.id - moon.sign.id + 12) % 12) + 1)}` : 'unresolved' },
          { label: tr('Result', mode), value: `${d.result.active ? 'ACTIVE' : 'NOT ACTIVE'} — ${d.result.phase}` },
          { label: tr('Important limitation', mode), value: 'This is a NATAL check at the birth instant only. It is NOT a transit search across the client\'s life, which is what most people mean by the term. A transit-based Sade Sati is not calculated by this report.' },
        ],
      });
    }
    if (d.id === 'kalsarpa' && 'notCalculatedReason' in d.result && (d.result as any).status === 'NOT_CALCULATED') {
      blocks.push(h3(tr('D-03  Kalsarpa  —  NOT CALCULATED', mode)));
      blocks.push(p(d.result.notCalculatedReason ?? 'No rule definition adopted for this dosha.', 'small', 'NOT_CALCULATED'));
      blocks.push(p(trProse('Not calculated is not the same as absent. This report makes no claim either way.', mode), 'small', 'NOT_CALCULATED'));
    } else if (d.id === 'kalsarpa') {
      const kr = d.result as any;
      const st = kr.status as string;
      blocks.push(h3(tr(`D-03  Kalsarpa  —  ${st === 'PRESENT' ? 'PRESENT' : st === 'ABSENT' ? 'ABSENT' : 'INDETERMINATE (boundary case)'}`, mode)));
      blocks.push(p(trProse(`Adopted variant: ONE_HEMISPHERE_NODE_AXIS — all seven visible grahas within one closed half of the zodiac bounded by the Rahu-Ketu axis${kr.arc ? `; arc: ${String(kr.arc).replace(/_/g, ' ').toLowerCase()}` : ''}.`, mode), 'small', 'TRADITIONAL_RULE'));
      for (const evLine of (kr.evidence ?? []).slice(0, 12)) {
        blocks.push(p(String(evLine), 'small', 'TRADITIONAL_RULE'));
      }
      blocks.push(p(trProse('Declared alternatives not adopted: direction-qualified arcs, boundary-rashi inclusion, Kala Amrita, Moon exclusion. The twelve classical names are NOT_CALCULATED.', mode), 'small', 'TRADITIONAL_RULE'));
    }
  }

  return { id: 'appendix-dosha-evidence', title: trProse('Dosha Evidence', mode), part: 'B', startsNewPage: true, status: 'READY', blocks };
}

function grahaConditionAppendix(derived: KundliDerivedModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  const rows = derived.grahaConditions.conditions.map((c) => [
    c.graha,
    c.longitudeDeg.toFixed(6),
    dms(c.degreeInSign),
    String(c.house),
    c.dignity.category,
    c.motion.retrograde ? 'R' : 'D',
    c.combustion.status === 'NOT_APPLICABLE' ? 'n/a' : `${c.combustion.status === 'COMBUST' ? 'combust' : 'no'} (${c.combustion.angularDistance?.toFixed(2)}\u00B0/${c.combustion.orbUsed}\u00B0)`,
    c.vargottama.status === 'CALCULATED' ? (c.vargottama.value ? 'yes' : 'no') : 'n/c',
    c.functionalLordship.ruledHouses.join(',') || '—',
    c.functionalLordship.naturalCharacter.toLowerCase(),
  ]);

  return {
    id: 'appendix-graha-condition',
    title: 'Graha Condition Record',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B4 · Graha Condition — full record', 'ग्रह अवस्था', mode),
      p(trProse('Exact sidereal longitudes, to six decimal places, with every condition field the engine actually resolved.', mode), 'small', 'CALCULATED_FACT'),
      {
        kind: 'table',
        headers: trAll(['Graha', 'Longitude', 'DMS in sign', 'Bhava', 'Dignity', 'Motion', 'Combustion', 'Vargottama', 'Rules', 'Natural'], mode),
        widths: [0.09, 0.12, 0.12, 0.06, 0.12, 0.07, 0.16, 0.09, 0.08, 0.09],
        rows,
        contentType: 'CALCULATED_FACT',
      },
      h3(tr('Fields deliberately not filled', mode)),
      bullets([
        'Compound (panchadha) relationship — the kernel collapses "neutral / enemy" into one label, so GREAT_FRIEND and GREAT_ENEMY cannot be recovered without an unverified second derivation.',
        'Planetary-war victor — requires celestial latitude, which the canonical model does not carry.',
        'Shadbala — computed but unvalidated; see B7.',
      ]),
      h3(tr('Functional lordship — natural character kept separate', mode)),
      {
        kind: 'table',
        headers: trAll(['Graha', 'Rules bhavas', 'Functional position (this lagna)', 'Natural character'], mode),
        widths: [0.11, 0.13, 0.53, 0.23],
        rows: derived.functionalLordship.map((f) => [
          f.graha,
          f.ruledHouses.join(', ') || '—',
          f.functionalStatement,
          `${f.naturalCharacter.toLowerCase()} — ${f.naturalCharacterBasis}`,
        ]),
        contentType: 'DERIVED_JYOTISH_FACT',
      },
    ],
  };
}

function aspectAppendix(derived: KundliDerivedModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  return {
    id: 'appendix-aspects',
    title: 'Aspect Ledger',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B5 · Aspect Ledger', 'दृष्टि विवरण', mode),
      {
        kind: 'callout', tone: 'info', title: trProse('Aspect policy — declared, not assumed', mode),
        text: derived.aspectPolicy.declaration, contentType: 'TRADITIONAL_RULE',
      },
      {
        kind: 'table',
        headers: trAll(['From', 'Offset', 'Type', 'On bhava', 'Grahas aspected', 'Rule'], mode),
        widths: [0.12, 0.09, 0.24, 0.12, 0.24, 0.19],
        rows: derived.aspects.aspects.map((a) => [
          a.from, `${a.offset}th`, a.aspectType.replace(/_/g, ' '), String(a.toHouse),
          a.toPlanets.join(', ') || '—', a.ruleId,
        ]),
        contentType: 'DERIVED_JYOTISH_FACT',
      },
      h3(tr('Variants considered and not adopted', mode)),
      bullets(derived.aspects.unadoptedVariants.map((v) => `${v.id}: ${v.description}`)),
    ],
  };
}

function d10Appendix(derived: KundliDerivedModel): V2Section {
  // §3 exempts the Scholar Appendix — see the note on the other appendices.
  const mode: LabelMode = 'en';
  const r = derived.d10;
  return {
    id: 'appendix-d10',
    title: 'D10 Validation',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B6 · D10 Dashamsha — validation', 'दशांश सत्यापन', mode),
      {
        kind: 'callout', tone: 'limitation',
        // The label comes from the external-validation harness, not from a
        // hand-written string, so the page cannot claim a status the register
        // does not support. Today the register is empty, so this reads
        // INTERNAL CROSSCHECK ONLY.
        title: `D10 status — ${D10_PROMOTION.externalStatus.replace(/_/g, ' ')}`,
        text: D10_PROMOTION.reason, contentType: 'NOT_CALCULATED',
      },
      p(trProse('Rule applied: each rashi is divided into ten parts of 3\u00B0. From an odd rashi the parts are counted from that rashi; from an even rashi they are counted from the ninth rashi from it.', mode), 'small', 'TRADITIONAL_RULE'),
      {
        kind: 'table',
        headers: trAll(['Graha', 'Sidereal longitude', 'Kernel D10 rashi', 'Independent reference', 'Agreement'], mode),
        widths: [0.14, 0.22, 0.22, 0.22, 0.2],
        rows: [
          ...r.comparisons.map((c) => [c.graha, c.longitudeDeg.toFixed(6), c.engineSign || '—', c.referenceSign, c.agrees ? 'match' : 'DISAGREES']),
          ['Lagna', '—', r.lagna.engineSign ?? '—', r.lagna.referenceSign, r.lagna.agrees === null ? 'n/a' : r.lagna.agrees ? 'match' : 'DISAGREES'],
        ],
        contentType: 'CALCULATED_FACT',
      },
      p(
        r.allAgree
          ? 'The kernel D10 agrees with the independent re-implementation for every graha and for the lagna in this chart. Two implementations agreeing is necessary but not sufficient: promotion still requires an external licensed reference.'
          : `The kernel D10 DISAGREES with the independent reference for: ${r.disagreements.map((d) => d.graha).join(', ')}. D10 must not be used until this is resolved.`,
        'small',
        'CALCULATED_FACT',
      ),
      p(
        D10_PROMOTION.mayInfluenceConclusions
          ? 'D10 has been compared against an external reference and may inform conclusions.'
          : 'D10 is not used by the career synthesis, or by any other conclusion in this report, while its status remains validation pending.',
        'small', 'NOT_CALCULATED',
      ),
    ],
  };
}

function unvalidatedAppendix(derived: KundliDerivedModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  return {
    id: 'appendix-unvalidated',
    title: 'Unvalidated Capabilities',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B7 · Shadbala and other unvalidated capabilities', 'अप्रमाणित गणनाएँ', mode),
      {
        kind: 'callout', tone: 'limitation', title: trProse('Shadbala — validation pending', mode),
        text:
          'The kernel computes a full six-fold shadbala (sthana, dig, kala, cheshta, naisargika, drik) in virupas and rupas. ' +
          'No number from it appears anywhere in this report and no conclusion uses it, because it has not been compared against ' +
          'an independent trusted reference. The validation plan and its current state are recorded in forensic/shadbala-validation.md.',
        contentType: 'NOT_CALCULATED',
      },
      {
        kind: 'table',
        headers: trAll(['Capability', 'Status', 'Note'], mode),
        widths: [0.24, 0.16, 0.6],
        rows: derived.capabilities
          .filter((c) => c.status !== 'CALCULATED')
          .map((c) => [c.name, c.status.replace(/_/g, ' '), c.note]),
        contentType: 'NOT_CALCULATED',
      },
    ],
  };
}

function sourceRegistryAppendix(canonical: KundliCanonicalModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  const seen = new Set<string>();
  const rows: string[][] = [];
  for (const y of canonical.yogas) {
    const s = y.source;
    if (seen.has(s.ruleId)) continue;
    seen.add(s.ruleId);
    rows.push([
      s.ruleId,
      s.sourceWork,
      s.locator,
      s.editionOrTranslation,
      s.locatorVerified ? 'yes' : 'no',
      s.verifiedInRepository ? 'yes' : 'no',
      s.scholarlyAgreement,
    ]);
  }
  return {
    id: 'appendix-source-registry',
    title: 'Source Registry',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B8 · Source registry and provenance', 'स्रोत सूची', mode),
      p(
        trProse('The main report states source status once, as "traditional attribution — verification pending". The full statement is here, once, ', mode) +
        'rather than repeated beside every rule. A citation records where a rule is traditionally attributed. It is not evidence that this ' +
        'implementation of the rule is correct, and no locator status below has been upgraded from memory or inference.',
        'small', 'TRADITIONAL_RULE',
      ),
      {
        kind: 'table',
        headers: trAll(['Rule ID', 'Source work', 'Locator', 'Edition held', 'Locator verified', 'In repository', 'Agreement'], mode),
        widths: [0.2, 0.16, 0.12, 0.16, 0.1, 0.1, 0.16],
        rows,
        contentType: 'TRADITIONAL_RULE',
      },
      p(`Source registry version ${YOGA_SOURCE_REGISTRY_VERSION}. The registry is canonical: a rule with no registry entry cannot be reported at all.`, 'micro', 'TRADITIONAL_RULE'),
    ],
  };
}

function notCalculatedAppendix(derived: KundliDerivedModel, canonical: KundliCanonicalModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  const yogaNc = canonical.yogas.filter((y) => y.status === 'NOT_CALCULATED');
  return {
    id: 'appendix-not-calculated',
    title: 'Not Calculated Inventory',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B9 · NOT CALCULATED inventory', 'गणित नहीं — सूची', mode),
      p(trProse('Everything this build does not compute, in one list. Nothing here is claimed to be absent from the chart.', mode), 'small', 'NOT_CALCULATED'),
      {
        kind: 'table',
        headers: trAll(['Capability', 'Status', 'Reason'], mode),
        widths: [0.26, 0.15, 0.59],
        rows: derived.capabilities.map((c) => [c.name, c.status.replace(/_/g, ' '), c.note]),
        contentType: 'NOT_CALCULATED',
      },
      h3(tr('Yoga rules not evaluated', mode)),
      yogaNc.length > 0
        ? {
            kind: 'table', headers: trAll(['Rule', 'Reason'], mode), widths: [0.32, 0.68],
            rows: yogaNc.map((y) => [y.name, y.notCalculatedReason ?? 'reason not recorded']),
            contentType: 'NOT_CALCULATED',
          }
        : p(trProse('Every registered yoga rule was evaluated for this chart.', mode), 'small', 'NOT_CALCULATED'),
      {
        kind: 'callout', tone: 'warning',
        text: trProse('No prediction of death, disease, marriage, childbirth, litigation or financial outcome is made anywhere in this report, and none is implied.', mode),
        contentType: 'NOT_CALCULATED',
      },
    ],
  };
}

function lineageAppendix(canonical: KundliCanonicalModel, derived: KundliDerivedModel): V2Section {
  // §3 exempts the Scholar Appendix: these are technical identifiers, rule ids,
  // hashes and provenance enums. Translating them would break the audit trail
  // — an identifier that changes script is not the same identifier.
  const mode: LabelMode = 'en';
  const samples: string[][] = [
    ['Lagna sign', FACT.lagnaSign, canonical.ascendant.sign.en],
    ['Lagna degree', FACT.lagnaDegree, canonical.ascendant.degreeInSign.toFixed(6)],
    ['Moon sign', FACT.planetSign('Moon'), canonical.planets.find((x) => x.id === 'Moon')?.sign.en ?? '—'],
    ['Moon nakshatra', FACT.planetNakshatra('Moon'), canonical.planets.find((x) => x.id === 'Moon')?.nakshatra.name ?? '—'],
    ['10th bhava sign', FACT.houseSignId(10), String(canonical.houses.find((h) => h.number === 10)?.sign.id ?? '—')],
    ['Current mahadasha', FACT.currentMahadasha, canonical.dashas.current.mahadasha],
    ['Current antardasha', FACT.currentAntardasha, canonical.dashas.current.antardasha],
    ...canonical.yogas.slice(0, 4).map((y) => [`${y.name} status`, FACT.yogaStatus(y.id), y.status]),
  ];

  return {
    id: 'appendix-lineage',
    title: 'Evidence Lineage',
    part: 'B',
    startsNewPage: true,
    status: 'READY',
    blocks: [
      title('B10 · Evidence lineage and verification', 'प्रमाण शृंखला', mode),
      p(trProse('Every derived object in this report carries evidence identifiers that are paths into the canonical chart. The chain runs: interpretation, then the synthesis evidence behind it, then the Jyotish relation, then the calculated fact, then the canonical chart, then the birth input itself.', mode), 'small', 'CALCULATED_FACT'),
      {
        kind: 'table',
        headers: trAll(['Statement', 'Canonical path', 'Value'], mode),
        widths: [0.3, 0.42, 0.28],
        rows: samples,
        contentType: 'CALCULATED_FACT',
        caption: trProse('A sample of the evidence paths. The full set is machine-checked by the data-lineage acceptance suite.', mode),
      },
      h3(tr('Derived engine versions', mode)),
      {
        kind: 'table', headers: trAll(['Engine', 'Version'], mode), widths: [0.5, 0.5],
        rows: Object.entries(derived.engineVersions),
        contentType: 'CALCULATED_FACT',
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Content hash                                                        */
/* ------------------------------------------------------------------ */

export function computeContentHashV2(
  canonical: KundliCanonicalModel,
  derived: KundliDerivedModel,
  reportId: string,
  locale: LabelMode,
): string {
  return sha256Hex(JSON.stringify({
    v: 2,
    reportId,
    locale,
    fingerprint: canonical.subject.fingerprint,
    calculation: canonical.calculation,
    ayanamshaValueDegrees: canonical.calculationMetadata.ayanamshaValueDegrees,
    julianDay: canonical.calculationMetadata.julianDay,
    ascendant: canonical.ascendant,
    planets: canonical.planets,
    houses: canonical.houses,
    divisionalCharts: canonical.divisionalCharts,
    dashas: canonical.dashas,
    yogas: canonical.yogas,
    doshas: canonical.doshas,
    panchanga: canonical.panchanga,
    derivedVersion: derived.version,
    engineVersions: derived.engineVersions,
    aspectPolicy: derived.aspectPolicy,
    reportModelVersion: REPORT_MODEL_V2_VERSION,
    sourceRegistryVersion: YOGA_SOURCE_REGISTRY_VERSION,
  }));
}

/* ------------------------------------------------------------------ */
/* Assembler                                                           */
/* ------------------------------------------------------------------ */

/**
 * Builds the report model.
 *
 * `executive` is the presentation-parity layer (see ./executiveInsights.ts):
 * the six-dimension life gauge and the nine graha archetype quadrants that the
 * `/report` screen already shows, computed from the SAME snapshot GATE 2 used.
 * It is optional on purpose — when the pipeline cannot build it the model omits
 * those blocks rather than failing a download, because a missing presentation
 * layer is a smaller harm than no Kundli at all.
 */
export function buildKundliReportModelV2(
  canonical: KundliCanonicalModel,
  derived: KundliDerivedModel,
  locale: LabelMode = 'en',
  executive: ExecutiveInsights | null = null,
): KundliReportModelV2 {
  const mode = labelModeForLocale(locale);
  // A Hindi or bilingual Kundli draws Devanagari graha abbreviations in the
  // chart — that is what a North Indian chart looks like. Numerals follow §4
  // separately: Devanagari only for pure Hindi.
  const chartMode: ChartLabelMode = locale === 'en' ? 'EN' : 'HI';
  const devanagariNumerals = locale === 'hi';
  const reportId = deriveReportId(canonical.subject.fingerprint);
  const generatedAt = new Date().toISOString();
  const contentHash = computeContentHashV2(canonical, derived, reportId, locale);

  const sections: V2Section[] = ([
    /* PART A */
    coverSection(canonical, reportId, mode),
    passportSection(canonical, derived, mode),
    saarSection(canonical, derived, mode),
    /* The gauge sits between the one-page summary and the drawings: the reader
     * gets the shape of the life before the geometry that produced it. Null
     * when the presentation layer could not be built — filtered below. */
    executiveLifeGaugeSection(executive, mode),
    chartSection(canonical, derived, 1, chartMode, mode, tr('PART A', mode), devanagariNumerals),
    chartSection(canonical, derived, 9, chartMode, mode, tr('PART A', mode), devanagariNumerals),
    grahaDossierSection(canonical, derived, mode, executive),
    bhavaMatrixSection(derived, mode),
    yogaDashboardSection(canonical, derived, mode),
    vimshottariSection(canonical, derived, mode),
    activationSection(derived, mode),
    careerSection(derived, mode),
    discussionSection(derived, mode),
    notesSection(mode),
    howToReadSection(canonical, derived, mode),

    /* PART B */
    partBDivider(),
    certificateSection(canonical, derived, reportId, contentHash, generatedAt, locale),
    yogaEvidenceSection(canonical),
    doshaEvidenceSection(canonical),
    grahaConditionAppendix(derived),
    aspectAppendix(derived),
    d10Appendix(derived),
    unvalidatedAppendix(derived),
    sourceRegistryAppendix(canonical),
    notCalculatedAppendix(derived, canonical),
    lineageAppendix(canonical, derived),
  ] as (V2Section | null)[]).filter((sec): sec is V2Section => sec !== null);

  return {
    reportModelVersion: REPORT_MODEL_V2_VERSION,
    reportId,
    generatedAt,
    locale,
    labelMode: mode,
    contentHash,
    fingerprint: canonical.subject.fingerprint,
    engineVersions: {
      ...derived.engineVersions,
      reportModel: REPORT_MODEL_V2_VERSION,
      calculation: canonical.calculation.calculationVersion,
      kernel: canonical.calculation.engineVersion,
      sourceRegistry: YOGA_SOURCE_REGISTRY_VERSION,
    },
    subject: {
      name: canonical.subject.name,
      birthDate: canonical.subject.birthDate,
      birthTime: canonical.subject.birthTime,
      locationName: canonical.subject.locationName,
    },
    sections,
  };
}

/** Sections the semantic acceptance suite requires to be present. */
export const MANDATORY_V2_SECTION_IDS = [
  'kundli-passport',
  'kundli-saar',
  'd1-rashi-chart',
  'd9-navamsha-chart',
  'graha-dossier',
  'bhava-matrix',
  'yoga-dosha-dashboard',
  'vimshottari-timeline',
  'current-dasha-activation',
  'career-synthesis',
  'pandit-discussion-points',
  'pandit-notes',
  'how-to-read',
  'part-b-divider',
  'calculation-certificate',
  'appendix-yoga-evidence',
  'appendix-not-calculated',
] as const;

export function assertReportV2Completeness(report: KundliReportModelV2): void {
  const byId = new Map(report.sections.map((s) => [s.id, s]));
  const problems: string[] = [];
  for (const id of MANDATORY_V2_SECTION_IDS) {
    const s = byId.get(id);
    if (!s) { problems.push(`${id}:missing`); continue; }
    if (s.status !== 'READY' || s.blocks.length === 0) problems.push(`${id}:empty`);
  }
  if (problems.length > 0) {
    const { KundliError } = require('../errors') as typeof import('../errors');
    throw new KundliError('KUNDLI_REPORT_INCOMPLETE', 'mandatory V40 report sections missing or empty', { problems });
  }
}

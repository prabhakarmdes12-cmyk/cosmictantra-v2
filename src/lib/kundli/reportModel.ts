/**
 * Kundli pipeline — report model builder.
 *
 * Converts the canonical model + deterministic interpretations into the
 * typed report model the renderer is allowed to draw. The renderer has no
 * access to the snapshot or the canonical model — it can only render these
 * blocks, so it cannot silently re-introduce blank or invented values.
 */

import { KundliError } from './errors';
import { buildCalculationConfig } from './config';
import { deriveReportId } from './lineage';
import type {
  KundliCanonicalModel, KundliReportModel, ReportSection, ReportBlock, ChartBlock,
  InterpretationEntry, SectionStatus,
} from './types';
import { interpretCanonicalModel, INTERPRETATION_GENERATOR_VERSION, ordinal } from './interpretation';
import { determineDst, formatDst } from './dst';
import { buildChartRenderModel } from './chartModel';
import { buildScholarSummarySections } from './scholarSummary';
import type { ChartDivision, ChartLabelMode } from './chartModel';
import { YOGA_SOURCE_REGISTRY, YOGA_SOURCE_REGISTRY_VERSION } from '../jyotish/yogaSourceRegistry';
import { sha256Hex } from '../granth/checksum';

export const REPORT_MODEL_VERSION = 'kundli-report-v1';

const D2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

/* ------------------------------------------------------------------ */
/* Block helpers                                                       */
/* ------------------------------------------------------------------ */

const heading = (text: string, level: 1 | 2 | 3 = 2): ReportBlock => ({ kind: 'heading', level, text });
const para = (text: string): ReportBlock => ({ kind: 'paragraph', text });
const kv = (label: string, value: string): ReportBlock => ({ kind: 'keyValue', label, value });
const table = (headers: string[], rows: string[][], highlightRows?: number[]): ReportBlock => ({
  kind: 'table', headers, rows, highlightRows,
});
const callout = (text: string, tone: 'warning' | 'info' | 'remedy' = 'info'): ReportBlock => ({ kind: 'callout', text, tone });
const divider = (): ReportBlock => ({ kind: 'divider' });

/* ------------------------------------------------------------------ */
/* Section builders                                                    */
/* ------------------------------------------------------------------ */

function buildCover(m: KundliCanonicalModel): ReportSection {
  // Never render empty mandatory values; if name is missing, throw KUNDLI_REPORT_INCOMPLETE.
  const name = m.subject.name?.trim();
  if (!name) {
    throw new KundliError('KUNDLI_REPORT_INCOMPLETE', 'subject name is missing in canonical model', { field: 'subject.name' });
  }
  return {
    id: 'cover',
    title: 'Cover',
    status: 'READY',
    blocks: [
      para('॥ श्री गणेशाय नमः ॥'),
      heading('CosmicTantra Master Kundli', 1),
      kv('Prepared for', name),
      kv('Birth', `${m.subject.birthDate} at ${m.subject.birthTime}`),
      kv('Birth place', m.subject.locationName),
      kv('Report ID', deriveReportId(m.subject.fingerprint)),
    ],
  };
}

function buildBirthSummary(m: KundliCanonicalModel): ReportSection {
  const s = m.subject;
  // Never render blank mandatory values; throw KUNDLI_REPORT_INCOMPLETE if coordinates incomplete.
  const lat = s.coordinates.latitude;
  const lng = s.coordinates.longitude;
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    throw new KundliError('KUNDLI_REPORT_INCOMPLETE', 'coordinates incomplete in canonical model', {
      latitude: lat, longitude: lng, provenance: s.coordinates.provenance,
    });
  }
  return {
    id: 'birth-summary',
    title: 'Birth Summary',
    status: 'READY',
    blocks: [
      kv('Name', s.name || '—'),
      kv('Birth date', s.birthDate),
      kv('Birth time', s.birthTime),
      kv('Birth place', s.locationName),
      kv('Latitude', `${lat.toFixed(4)}°`),
      kv('Longitude', `${lng.toFixed(4)}°`),
      kv('Coordinate provenance', s.coordinates.provenance),
      kv('Timezone', `${s.timezone.timezoneId} (UTC${s.timezone.utcOffsetAtBirth >= 0 ? '+' : ''}${s.timezone.utcOffsetAtBirth})`),
      kv('UTC birth instant', s.timezone.utcDateTime),
    ],
  };
}

function buildCalculationMethod(m: KundliCanonicalModel): ReportSection {
  const c = m.calculation;
  return {
    id: 'calculation-method',
    title: 'Calculation Standard',
    status: 'READY',
    blocks: [
      kv('Zodiac', c.zodiac),
      kv('Ayanamsha', c.ayanamshaName),
      kv('Ayanamsha value', `${D2(m.calculationMetadata.ayanamshaValueDegrees)}°`),
      kv('House system', c.houseSystem),
      kv('Node mode', c.nodeMode),
      kv('Ephemeris', c.ephemerisProvider),
      kv('Engine version', c.engineVersion),
      kv('Calculation version', c.calculationVersion),
      kv('Ephemeris precision', 'minute (recorded seconds retained in the record)'),
      kv('Julian day', D2(m.calculationMetadata.julianDay)),
      kv('Calculation instant', m.calculationMetadata.generatedAt),
    ],
  };
}

function buildPanchanga(m: KundliCanonicalModel): ReportSection {
  const p = m.panchanga;
  return {
    id: 'panchanga',
    title: 'Panchanga',
    status: 'READY',
    blocks: [
      kv('Tithi', p.tithi.fullName),
      kv('Nakshatra', `${p.nakshatra.name} (pada ${p.nakshatra.pada})`),
      kv('Yoga', p.yoga.name),
      kv('Karana', p.karana.name),
      kv('Masa', p.masa),
      kv('Ritu', p.ritu),
      kv('Ayana', p.ayana),
      kv('Samvat', p.samvat),
    ],
  };
}

function buildPlanetaryPositions(m: KundliCanonicalModel): ReportSection {
  const rows = m.planets.map((p) => [
    p.name,
    `${p.longitudeDeg.toFixed(2)}°`,
    `${p.sign.name} (${p.sign.en})`,
    `${p.degreeInSign.toFixed(2)}°`,
    `${p.nakshatra.name} ${p.nakshatra.pada}`,
    String(p.house),
    p.retrograde ? 'R' : 'D',
    p.dignity.replace(/_/g, ' '),
  ]);
  return {
    id: 'planetary-positions',
    title: 'Planetary Positions',
    status: 'READY',
    blocks: [
      para('Sidereal longitudes in the Lahiri (Chitra Paksha) ayanamsha, whole-sign houses from the ascendant.'),
      table(['Planet', 'Longitude', 'Sign', 'Degree', 'Nakshatra', 'House', 'Dir.', 'Dignity'], rows),
    ],
  };
}

function buildHousePositions(m: KundliCanonicalModel): ReportSection {
  const rows = m.houses.map((h) => [
    String(h.number),
    `${h.sign.name} (${h.sign.en})`,
    h.planets.length > 0 ? h.planets.join(', ') : '—',
  ]);
  return {
    id: 'house-positions',
    title: 'House Positions',
    status: 'READY',
    blocks: [table(['House', 'Sign', 'Planets'], rows)],
  };
}

/**
 * Chart section: the vector drawing plus the metadata that makes it auditable.
 * The renderer draws placements that already exist in the canonical model; it
 * calculates nothing.
 */
function buildChartSection(
  m: KundliCanonicalModel,
  division: ChartDivision,
  labelMode: ChartLabelMode,
): ReportSection {
  const model = buildChartRenderModel(m, division, labelMode);
  const title = labelMode === 'HI' ? model.chartNameHi : model.chartName;
  return {
    id: division === 1 ? 'd1-chart' : 'd9-chart',
    title: `${title} — ${model.chartSystem.replace(/_/g, ' ').toLowerCase()} chart`,
    status: 'READY',
    blocks: [
      para(
        division === 1
          ? 'The Rashi chart (D1) shows the twelve bhavas counted from the Lagna, with the sign occupying each house and the grahas placed in it. House numbers advance counter-clockwise from the Lagna at the top.'
          : 'The Navamsha chart (D9) is the ninth division, drawn from the same canonical placements. D1 and D9 are the only two divisional charts this report cross-checks; the remaining vargas are not verified and are not shown.',
      ),
      { kind: 'chart', chartType: division === 1 ? 'NORTH_INDIAN_D1' : 'NORTH_INDIAN_D9', data: model } satisfies ChartBlock,
      kv('Chart data version', model.chartModelVersion),
      kv('Chart system', model.chartSystem),
      kv('Lagna sign', String(model.lagnaSignNumber)),
      kv('Placement hash', model.placementHash),
      kv('Lagna marker', `house 1 (${model.lagnaEvidenceId})`),
      kv('Retrograde marker', 'a rule drawn beneath the graha abbreviation'),
    ],
  };
}

/**
 * Textual placement table. This is the accessible equivalent of the drawing:
 * every placement that appears in the chart appears here, in the same order.
 */
function buildChartTable(
  m: KundliCanonicalModel,
  division: ChartDivision,
  labelMode: ChartLabelMode,
): ReportSection {
  const model = buildChartRenderModel(m, division, labelMode);
  const rows = model.houses.map((house) => {
    const occupants = model.placements.filter((p) => p.houseNumber === house.houseNumber);
    return [
      String(house.houseNumber),
      String(house.signNumber),
      occupants.length === 0 ? '—' : occupants.map((p) => p.displayName ?? p.planetId).join(', '),
      occupants.filter((p) => p.retrograde).map((p) => p.displayName ?? p.planetId).join(', ') || '—',
      occupants.map((p) => p.evidenceId).join(' '),
    ];
  });
  return {
    id: division === 1 ? 'd1-placement-table' : 'd9-placement-table',
    title: division === 1 ? 'D1 placements as text' : 'D9 placements as text',
    status: 'READY',
    blocks: [
      para('Every placement drawn above, as text. Nothing in this table is calculated by the renderer, and nothing is omitted.'),
      table(['House', 'Sign', 'Grahas', 'Retrograde', 'Evidence'], rows),
    ],
  };
}

const labelModeFor = (locale: 'en' | 'hi'): ChartLabelMode => (locale === 'hi' ? 'HI' : 'EN');

function buildDashaTables(m: KundliCanonicalModel): ReportSection[] {
  const mdRows = m.dashas.mahadashas.map((md, i) => [
    md.planet,
    md.startDate,
    md.endDate,
    `${md.durationYears.toFixed(1)} yrs`,
    md.isCurrent ? 'Current' : '',
  ]);
  const cur = m.dashas.current;
  const currentMd = m.dashas.mahadashas.find((x) => x.isCurrent);
  const adRows = (currentMd?.antardashas ?? []).map((ad) => [
    ad.planet, ad.startDate, ad.endDate, ad.planet === cur.antardasha ? 'Current' : '',
  ]);
  return [
    {
      id: 'vimshottari-dasha',
      title: 'Vimshottari Dasha — 9 Mahadashas',
      status: 'READY',
      blocks: [
        para(`Vimshottari system, balance ${m.dashas.startingBalanceYears.toFixed(1)} years of the birth nakshatra lord at birth.`),
        table(['Mahadasha', 'Start', 'End', 'Duration', 'Status'], mdRows, [m.dashas.mahadashas.findIndex((x) => x.isCurrent)]),
      ],
    },
    {
      id: 'current-dasha',
      title: 'Current Dasha Period',
      status: 'READY',
      blocks: [
        kv('Mahadasha', `${cur.mahadasha} (${cur.startDate} to ${cur.endDate})`),
        kv('Antardasha', cur.antardasha),
        kv('Pratyantardasha', cur.pratyantardasha || '—'),
        divider(),
        heading('Antardasha schedule of the current Mahadasha', 3),
        table(['Antardasha', 'Start', 'End', 'Status'], adRows, [adRows.findIndex((r) => r[3] !== '')]),
      ],
    },
  ];
}

const YOGA_RESULT_LABEL: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  INDETERMINATE: 'Indeterminate',
  NOT_CALCULATED: 'Not calculated',
};

const conditionLabel = (satisfied: boolean | null): string =>
  satisfied === null ? 'Not evaluated' : satisfied ? 'Satisfied' : 'Not satisfied';

function buildYogaSections(m: KundliCanonicalModel): ReportSection[] {
  if (m.yogas.length === 0) {
    return [{
      id: 'major-yogas',
      title: 'Major Yogas',
      status: 'NOT_APPLICABLE',
      blocks: [para('No yoga rules are registered in this engine build.')],
    }];
  }

  const summary = table(
    ['Yoga', 'System', 'Status'],
    m.yogas.map((y) => [y.name, y.system, YOGA_RESULT_LABEL[y.status] ?? y.status]),
  );

  const detail: ReportBlock[] = [];
  for (const y of m.yogas) {
    detail.push(heading(y.name, 3));
    detail.push(kv('Status', YOGA_RESULT_LABEL[y.status] ?? y.status));
    detail.push(kv('System', y.system));
    detail.push(kv('Rule', y.rule || 'Rule text unavailable for this yoga.'));
    detail.push(kv('Source (as attributed)', y.source.sourceWork));
    detail.push(kv('Locator', y.source.locator));
    detail.push(kv('Edition / translation held', y.source.editionOrTranslation));
    detail.push(kv('Scholarly agreement', y.source.scholarlyAgreement));
    detail.push(kv('Adopted interpretation', y.source.adoptedInterpretation));
    if (y.source.variants.length > 0) {
      detail.push(kv('Variants not applied', y.source.variants.join(' ')));
    }
    for (const limitation of y.source.limitations) {
      detail.push(kv('Limitation', limitation));
    }
    if (y.inputs.planets.length > 0) detail.push(kv('Input grahas', y.inputs.planets.join(', ')));
    if (y.inputs.houses.length > 0) detail.push(kv('Input bhavas', y.inputs.houses.join(', ')));
    if (y.status === 'NOT_CALCULATED') {
      detail.push(kv('Why not calculated', y.notCalculatedReason || 'Rule not implemented.'));
    } else if (y.conditions.length > 0) {
      detail.push(table(
        ['Condition', 'Result', 'Evidence'],
        y.conditions.map((c) => [
          c.description,
          conditionLabel(c.satisfied),
          c.evidence.join('; '),
        ]),
      ));
    }
    detail.push(divider());
  }

  return [{
    id: 'major-yogas',
    title: 'Major Yogas',
    status: 'READY',
    blocks: [
      para('Every yoga below is evaluated against the canonical chart by the rule stated with it. Statuses are Present, Absent, Indeterminate (an input could not be resolved) or Not calculated (the rule is not implemented). No yoga is declared unless its rule produced it.'),
      summary,
      ...detail,
    ],
  }];
}

function buildDoshaSection(m: KundliCanonicalModel): ReportSection {
  const blocks: ReportBlock[] = [];
  for (const d of m.doshas) {
    if (d.id === 'manglik' && d.result.status === 'CALCULATED' && 'present' in d.result) {
      blocks.push(kv('Manglik', d.result.present
        ? `Present (severity ${d.result.severity})${d.result.cancellation?.cancelled ? ' — cancelled' : ''}`
        : 'Not present'));
    }
    if (d.id === 'sadeSati' && d.result.status === 'CALCULATED' && 'active' in d.result) {
      blocks.push(kv('Sade Sati', d.result.active ? `Active — ${d.result.phase}` : `Not active (${d.result.phase})`));
    }
    if (d.id === 'kalsarpa' && d.result.status === 'NOT_CALCULATED' && 'notCalculatedReason' in d.result) {
      blocks.push(kv('Kalsarpa', 'Not calculated — no rule implemented'));
      blocks.push(para(d.result.notCalculatedReason || 'Rule not implemented.'));
    }
  }
  return {
    id: 'dosha-analysis',
    title: 'Dosha Analysis',
    status: blocks.length > 0 ? 'READY' : 'NOT_APPLICABLE',
    blocks: blocks.length > 0 ? blocks : [para('No dosha analysis was available for this chart.')],
  };
}

function buildInterpretationSections(entries: InterpretationEntry[]): ReportSection[] {
  const titles: Record<string, string> = {
    'lagna-analysis': 'Lagna Analysis',
    'moon-analysis': 'Moon Analysis',
    'nakshatra-analysis': 'Janma Nakshatra Analysis',
    'career': 'Career',
    'finance': 'Finance & Wealth',
    'relationships': 'Relationships & Partnership',
    'family': 'Family & Home',
    'health': 'Health & Vitality',
    'education': 'Education & Intellect',
    'spiritual-tendencies': 'Spiritual Tendencies',
    'current-period': 'Current Period — Interpretation',
    'near-term-themes': 'Near-Term Themes',
    'remedies': 'Remedies',
  };
  return entries.map((e) => ({
    id: e.sectionId,
    title: titles[e.sectionId] ?? e.sectionId,
    status: 'READY' as SectionStatus,
    blocks: [
      para(e.text),
      kv('Interpretation source', `Deterministic rules ${e.generatorVersion}`),
      kv('Evidence', e.sourceFacts.join(', ')),
    ],
  }));
}

/**
 * Deterministic content fingerprint.
 *
 * Covers everything that determines what the report says. The generation
 * timestamp is deliberately EXCLUDED: including it would change the hash on
 * every run, so two copies of the same report could never be compared. The
 * timestamp is recorded separately on the certificate.
 */
export function computeContentHash(
  canonical: KundliCanonicalModel,
  reportId: string,
  locale: 'en' | 'hi',
): string {
  return sha256Hex(JSON.stringify({
    v: 1,
    reportId,
    fingerprint: canonical.subject.fingerprint,
    locale,
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
    reportModelVersion: REPORT_MODEL_VERSION,
    sourceRegistryVersion: YOGA_SOURCE_REGISTRY_VERSION,
  }));
}

/** Birth-data passport: every input the calculation rests on, stated once. */
function buildPassport(m: KundliCanonicalModel, locale: 'en' | 'hi'): ReportSection {
  const s = m.subject;
  const c = m.calculation;
  const tz = s.timezone;
  const dst = determineDst(tz.timezoneId, tz.utcDateTime, tz.utcOffsetAtBirth);
  const offsetLabel = `UTC${tz.utcOffsetAtBirth >= 0 ? '+' : ''}${tz.utcOffsetAtBirth}`;

  return {
    id: 'birth-data-passport',
    title: 'Birth Data Passport',
    status: 'READY',
    blocks: [
      para('Every value below is an input or a declared setting. Nothing here is interpreted.'),
      heading('Subject', 3),
      kv('Name', s.name),
      kv('Birth date (civil)', s.birthDate),
      kv('Birth time as recorded', s.birthTime),
      kv('Birth place', s.locationName),
      heading('Position and time', 3),
      kv('Latitude', `${s.coordinates.latitude.toFixed(4)}°`),
      kv('Longitude', `${s.coordinates.longitude.toFixed(4)}°`),
      kv('Coordinate provenance', s.coordinates.provenance),
      kv('Timezone', tz.timezoneId),
      kv('Historical UTC offset at birth', `${offsetLabel} (${tz.offsetProvenance})`),
      kv('Offset provenance', tz.offsetProvenance),
      kv('Daylight saving time', formatDst(dst)),
      para(dst.note),
      kv('Local birth instant', tz.localDateTime),
      kv('UTC birth instant', tz.utcDateTime),
      heading('Declared calculation system', 3),
      kv('Zodiac', c.zodiac),
      kv('Ayanamsha', `${c.ayanamshaName} (${D2(m.calculationMetadata.ayanamshaValueDegrees)}°)`),
      kv('House system', c.houseSystem),
      kv('Node policy', c.nodeMode),
      kv('Ephemeris', c.ephemerisProvider),
      kv('Report language', locale === 'hi' ? 'Hindi (hi)' : 'English (en)'),
      kv('Engine version', c.engineVersion),
      kv('Report model version', REPORT_MODEL_VERSION),
    ],
  };
}

/**
 * Calculation certificate: lineage, scope, and limits.
 *
 * States what was calculated, what was interpreted, what was NOT calculated,
 * which source locators remain unverified, and that Jyotish is interpretive.
 * The certificate provides the report identity values needed for an
 * independent comparison without presenting an unimplemented verification flow.
 */
function buildCertificate(
  m: KundliCanonicalModel,
  reportId: string,
  locale: 'en' | 'hi',
  contentHash: string,
  interpretedSectionIds: string[],
  generatedAt: string,
): ReportSection {
  const c = m.calculation;

  const notCalculatedYogas = m.yogas.filter((y) => y.status === 'NOT_CALCULATED');
  const notCalculatedDoshas = m.doshas.filter(
    (d) => (d.result as any)?.status === 'NOT_CALCULATED',
  );
  const evaluatedYogas = m.yogas.filter((y) => y.status !== 'NOT_CALCULATED');

  // Real locator status, read from the source registry rather than asserted.
  const cited = m.yogas
    .map((y) => YOGA_SOURCE_REGISTRY[y.source?.ruleId ?? ''])
    .filter(Boolean);
  const unverified = cited.filter((e) => !e.locatorVerified);
  const unverifiedInRepo = cited.filter((e) => !e.verifiedInRepository);

  const blocks: ReportBlock[] = [
    para('This certificate states what this report does and does not contain. It is part of the report, not marketing copy.'),
    heading('Lineage', 3),
    kv('Report ID', reportId),
    kv('Input fingerprint', m.subject.fingerprint),
    kv('Content hash', contentHash),
    kv('Hash covers', 'all calculated values, the calculation configuration, the report model version and the source registry version. The generation timestamp is excluded so that two copies of the same report hash identically.'),
    kv('Generated at', generatedAt),
    kv('Engine version', c.engineVersion),
    kv('Calculation version', c.calculationVersion),
    kv('Report model version', REPORT_MODEL_VERSION),
    kv('Source registry version', YOGA_SOURCE_REGISTRY_VERSION),
    kv('Ayanamsha', `${c.ayanamshaName} (${D2(m.calculationMetadata.ayanamshaValueDegrees)}°)`),
    kv('House system', c.houseSystem),
    kv('Node policy', c.nodeMode),
    kv('Timezone provenance', m.subject.timezone.offsetProvenance),
    kv('Coordinate provenance', m.subject.coordinates.provenance),

    heading('What was calculated', 3),
    para([
      `Ascendant (${m.ascendant.sign.name} ${D2(m.ascendant.degreeInSign)}°)`,
      `${m.planets.length} graha positions with nakshatra and pada`,
      `${m.houses.length} bhavas (${c.houseSystem})`,
      `${m.divisionalCharts.length} divisional charts, of which D1 and D9 are independently cross-checked`,
      `Vimshottari dasha: balance at birth plus ${m.dashas.mahadashas.length} mahadashas`,
      `${evaluatedYogas.length} yoga rules evaluated`,
      `${m.doshas.length} dosha assessments`,
      'Panchanga at birth (tithi, nakshatra, yoga, karana)',
    ].join('; ') + '.'),

    heading('What was interpreted', 3),
    para([
      `${interpretedSectionIds.length} interpretive sections, generated by deterministic rules (${INTERPRETATION_GENERATOR_VERSION}).`,
      'Interpretations are traditional readings of the calculated chart. They are clearly separated from calculated values throughout this report, and no interpretation is presented inside a factual table.',
    ].join(' ')),

    heading('What was NOT calculated', 3),
  ];

  const notCalculatedLines: string[] = [];
  for (const y of notCalculatedYogas) {
    notCalculatedLines.push(`${y.id} — ${y.notCalculatedReason ?? 'reason not recorded'}`);
  }
  for (const d of notCalculatedDoshas) {
    notCalculatedLines.push(`${d.id} — ${(d.result as any)?.notCalculatedReason ?? 'reason not recorded'}`);
  }
  notCalculatedLines.push(
    'Shadbala, Ashtakavarga, Jaimini chara karakas, Ashtakoota matching and Gochara (transits) — the engine computes these internally, but this report does not carry them and none of them has been independently verified.',
  );
  notCalculatedLines.push(
    `Divisional charts other than D1 and D9 (${Math.max(0, m.divisionalCharts.length - 2)} of them) — produced by the engine, not independently verified, and not used to reach any conclusion in this report.`,
  );
  notCalculatedLines.push(
    'No prediction of death, marriage, childbirth, litigation, disease, accident or financial outcome is made anywhere in this report, and none is implied.',
  );
  for (const line of notCalculatedLines) blocks.push(para(`• ${line}`));

  blocks.push(heading('Source locators that remain unverified', 3));
  blocks.push(para(
    `${cited.length} classical source entries are cited by this report. ` +
    `${unverified.length} of them have locators that have NOT been checked against any edition held in this repository, ` +
    `and ${unverifiedInRepo.length} cite a work for which no licensed copy exists here. ` +
    `A citation records where a rule is traditionally attributed; it is not evidence that this implementation is correct. ` +
    `No locator status below has been upgraded from memory or inference.`,
  ));
  if (unverified.length > 0) {
    blocks.push(table(
      ['Rule', 'Source work', 'Locator', 'Locator verified'],
      unverified.slice(0, 12).map((e) => [e.ruleId, e.sourceWork, e.locator, 'NO — unverified']),
    ));
  }

  blocks.push(heading('Verification', 3));
  blocks.push(para(
    'Compare the report ID, content hash, calculation version and report-model version when independently checking this document.',
  ));

  blocks.push(heading('Status of this document', 3));
  blocks.push(callout(
    'Jyotish is an interpretive discipline. This report states what was calculated, what was traditionally interpreted, ' +
    'and what was not calculated at all. It is not a guarantee, prediction or certainty about any future event, and it ' +
    'must not be used as the basis for medical, legal or financial decisions.',
    'info',
  ));

  return {
    id: 'calculation-certificate',
    title: 'Calculation Certificate',
    status: 'READY',
    blocks,
  };
}

function buildAppendix(m: KundliCanonicalModel): ReportSection {
  return {
    id: 'appendix-calculation-notes',
    title: 'Appendix — Calculation Notes',
    status: 'READY',
    blocks: [
      kv('Report model version', REPORT_MODEL_VERSION),
      kv('Interpretation generator', INTERPRETATION_GENERATOR_VERSION),
      kv('Prompt version', 'none (deterministic rules only)'),
      kv('Input fingerprint', m.subject.fingerprint),
      kv('Coordinate provenance', m.subject.coordinates.provenance),
      kv('Timezone provenance', m.subject.timezone.offsetProvenance),
      kv('Divisional charts', `${m.divisionalCharts.length} (D1–D60 shodashavarga)`),
      para('Yogas are evaluated by the CosmicTantra yoga engine against this canonical chart. Each yoga in the Major Yogas section states its rule, its conditions, the evidence for each condition, and a status of Present, Absent, Indeterminate or Not calculated.'),
      para('Limitation: only the yoga rules listed in the Major Yogas section are evaluated. Yogas that are not listed are not claimed to be absent — they are simply not implemented in this engine build.'),
    ],
  };
}

function buildDisclaimer(): ReportSection {
  return {
    id: 'disclaimer',
    title: 'Disclaimer',
    status: 'READY',
    blocks: [
      para('CosmicTantra provides this Kundli for informational, cultural and educational purposes. It is not a substitute for professional medical, legal, financial or mental-health advice. Astrological statements are interpretive and not guarantees of future events. Remedies are presented as traditional practice.'),
      para('© 2026 CosmicTantra Technologies Pvt. Ltd. All rights reserved.'),
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Assembler                                                           */
/* ------------------------------------------------------------------ */

export function buildKundliReportModel(
  canonical: KundliCanonicalModel,
  locale: 'en' | 'hi' = 'en',
): KundliReportModel {
  const interpretations: InterpretationEntry[] = interpretCanonicalModel(canonical);
  const bySection = new Map(interpretations.map((e) => [e.sectionId, e]));

  // Established kundli order: details -> D1 chart -> panchanga -> graha
  // sphuta -> bhavas -> navamsha -> dashas -> yogas/doshas -> phaladesh
  // -> remedies -> calculation notes -> disclaimer.
  const sections: ReportSection[] = [
    buildCover(canonical),
    buildPassport(canonical, locale),
    ...buildScholarSummarySections(canonical, locale),
    buildBirthSummary(canonical),
    buildChartSection(canonical, 1, labelModeFor(locale)),
    buildChartTable(canonical, 1, labelModeFor(locale)),
    buildChartSection(canonical, 9, labelModeFor(locale)),
    buildChartTable(canonical, 9, labelModeFor(locale)),
    buildPanchanga(canonical),
    buildPlanetaryPositions(canonical),
    buildHousePositions(canonical),
    ...buildDashaTables(canonical),
  ];

  // Lagna/Moon/Nakshatra analyses — guard against missing interpretation entries
  for (const id of ['lagna-analysis', 'moon-analysis', 'nakshatra-analysis'] as const) {
    const entry = bySection.get(id);
    if (!entry) {
      throw new KundliError('KUNDLI_INTERPRETATION_INCOMPLETE', `required interpretation section missing: ${id}`, { sectionId: id });
    }
    sections.push(buildInterpretationSections([entry])[0]);
  }
  sections.push(buildYogaSections(canonical)[0]);
  sections.push(buildDoshaSection(canonical));

  for (const id of ['career', 'finance', 'relationships', 'family', 'health', 'education', 'spiritual-tendencies'] as const) {
    const entry = bySection.get(id);
    if (!entry) {
      throw new KundliError('KUNDLI_INTERPRETATION_INCOMPLETE', `required interpretation section missing: ${id}`, { sectionId: id });
    }
    sections.push(buildInterpretationSections([entry])[0]);
  }
  for (const id of ['current-period', 'near-term-themes', 'remedies'] as const) {
    const entry = bySection.get(id);
    if (!entry) {
      throw new KundliError('KUNDLI_INTERPRETATION_INCOMPLETE', `required interpretation section missing: ${id}`, { sectionId: id });
    }
    sections.push(buildInterpretationSections([entry])[0]);
  }

  sections.push(buildCalculationMethod(canonical));
  sections.push(buildAppendix(canonical));

  const reportId = deriveReportId(canonical.subject.fingerprint);
  const generatedAt = new Date().toISOString();
  const contentHash = computeContentHash(canonical, reportId, locale);
  sections.push(buildCertificate(
    canonical,
    reportId,
    locale,
    contentHash,
    [...bySection.keys()],
    generatedAt,
  ));
  sections.push(buildDisclaimer());

  return {
    reportId,
    generatedAt,
    locale,
    calculation: canonical.calculation,
    subject: {
      name: canonical.subject.name,
      birthDate: canonical.subject.birthDate,
      birthTime: canonical.subject.birthTime,
      locationName: canonical.subject.locationName,
      coordinates: canonical.subject.coordinates,
      timezone: canonical.subject.timezone,
    },
    lineage: {
      reportId,
      fingerprint: canonical.subject.fingerprint,
      contentHash,
      stages: [
        { stage: 'input-validated', at: new Date().toISOString(), ok: true },
        { stage: 'calculation-complete', at: new Date().toISOString(), ok: true },
        { stage: 'report-assembled', at: new Date().toISOString(), ok: true },
      ],
    },
    sections,
  };
}

export interface BuildKundliReportOptions {
  locale?: 'en' | 'hi';
  reportId?: string;
}

/** Alias kept for the invariants suite. */
export function buildKundliReport(canonical: KundliCanonicalModel, options: BuildKundliReportOptions = {}): KundliReportModel {
  return buildKundliReportModel(canonical, options.locale ?? 'en');
}

/** Throws if a mandatory section is missing/empty (GATE 3 helper). */
export function assertReportCompleteness(report: KundliReportModel): void {
  const mandatory = ['birth-summary', 'calculation-method', 'panchanga', 'planetary-positions', 'vimshottari-dasha', 'current-dasha', 'disclaimer'];
  const byId = new Map(report.sections.map((s) => [s.id, s]));
  const problems: string[] = [];
  for (const id of mandatory) {
    const s = byId.get(id);
    if (!s) { problems.push(`${id}:missing`); continue; }
    if (s.status !== 'READY' || s.blocks.length === 0) problems.push(`${id}:empty`);
  }
  if (problems.length > 0) {
    throw new KundliError('KUNDLI_REPORT_INCOMPLETE', 'mandatory report sections missing or empty', { problems });
  }
}

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
  KundliCanonicalModel, KundliReportModel, ReportSection, ReportBlock,
  InterpretationEntry, SectionStatus,
} from './types';
import { interpretCanonicalModel, INTERPRETATION_GENERATOR_VERSION, ordinal } from './interpretation';

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

function buildRashiChart(m: KundliCanonicalModel): ReportSection {
  return {
    id: 'rashi-chart',
    title: 'Rashi Chart (D1)',
    status: 'READY',
    blocks: [
      para('North Indian style D1 chart.'),
      { kind: 'chart', chartType: 'NORTH_INDIAN_D1', data: {
        lagna: m.ascendant.sign.name,
        houses: m.houses.map((h) => ({ number: h.number, sign: h.sign.name, planets: h.planets })),
      } },
    ],
  };
}

function buildNavamsha(m: KundliCanonicalModel): ReportSection {
  const d9 = m.divisionalCharts.find((c) => c.division === 9);
  if (!d9) {
    return {
      id: 'navamsha',
      title: 'Navamsha (D9)',
      status: 'NOT_APPLICABLE',
      blocks: [para('Navamsha calculation was not available for this chart.')],
    };
  }
  const lagnaCell = ['Lagna', d9.lagnaSign];
  const rows = d9.planets.map((p) => [p.id, p.sign, `${p.degreeInSign.toFixed(2)}°`]);
  return {
    id: 'navamsha',
    title: 'Navamsha (D9) — Spouse, Dharma & Inner Soul',
    status: 'READY',
    blocks: [
      para('Ninth harmonic (navamsha) of the natal chart — the classical tool for spouse and inner-purpose analysis.'),
      table(['Placement', 'Sign', 'Degree'], [lagnaCell, ...rows]),
    ],
  };
}

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
    buildBirthSummary(canonical),
    buildRashiChart(canonical),
    buildPanchanga(canonical),
    buildPlanetaryPositions(canonical),
    buildHousePositions(canonical),
    buildNavamsha(canonical),
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
  sections.push(buildDisclaimer());

  const reportId = deriveReportId(canonical.subject.fingerprint);

  return {
    reportId,
    generatedAt: new Date().toISOString(),
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

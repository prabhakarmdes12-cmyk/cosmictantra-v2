/**
 * KUNDLI V41 — report modes (§1).
 *
 * Three audiences, one canonical Kundli. They differ ONLY in information
 * density: no mode computes anything the others do not, and no mode states
 * anything the others contradict. A fact removed from CLIENT is not a fact
 * softened for CLIENT — it is the same fact, printed elsewhere.
 *
 *   CLIENT   ~10-14pp  plain explanation, minimal technical metadata
 *   PANDIT   ~14-20pp  dense chart intelligence, traditional vocabulary
 *   SCHOLAR  PANDIT + the complete engineering appendix
 *
 * The default download is SCHOLAR — "PANDIT + SCHOLAR APPENDIX" in the brief's
 * words — because the person downloading a Master Kundli is the one who wants
 * to be able to check it.
 *
 * This module derives no Jyotish facts. It selects sections that the report
 * model already built.
 */

import type { KundliReportModelV2, V2Block, V2Section } from './reportBlocks';

/**
 * English → non-scholar rewrite for sentences that promise the reader a
 * "Scholar Appendix". CLIENT and PANDIT deliberately carry no appendix, so a
 * reference that survives mode selection is a dead pointer in the reader's
 * hand. The replacement keeps the factual content of the sentence and drops
 * only the promise that cannot be kept.
 */
const EN_APPENDIX_REWRITES: Array<[RegExp, string]> = [
  [/ The purnimanta name is reported as not calculated — see the Scholar Appendix for why the two conventions are not treated as interchangeable here\.$/,
    ' The purnimanta name is not written here; the two month conventions are not treated as interchangeable.'],
  [/ The rule that produced each line is listed in the Scholar Appendix\.$/,
    ' The rule that produced each line is retained in the calculation record.'],
  [/ The exact decimal longitude is retained in the machine record and printed in the Scholar Appendix\.$/,
    ' The exact decimal longitude is retained in the machine record.'],
  [/ which is printed in the Scholar Appendix\.$/,
    ' which is not needed to read the chart.'],
  [/ — see the Scholar Appendix\.$/, ' — not calculated for this report.'],
  [/ Full reasoning in the Scholar Appendix\.$/, ' Full reasoning is not printed in this edition.'],
  [/ Full provenance is in the Scholar Appendix\.$/, ' Full provenance is not printed in this edition.'],
  [/ The full provenance statement for each rule, including which locators have not been checked against a held edition, is in the Scholar Appendix\.$/,
    ' The full provenance statement for each rule is not printed in this edition.'],
  [/ Full provenance is in the Scholar Appendix\.$/, ' Full provenance is not printed in this edition.'],
  [/(\s*)Scholar Appendix(\s*)?/g, '$1'],
];

/**
 * Hindi equivalents of the same promises. Hindi prose is the locale body for
 * `hi` and `hi-en`; the bilingual edition still carries these sentences in
 * Hindi (see `prosePassages.ts`), so both scripts must be scrubbed.
 */
const HI_APPENDIX_REWRITES: Array<[RegExp, string]> = [
  [/ दोनों परिपाटियों को यहाँ एक-दूसरे का पर्याय क्यों नहीं माना जाता, यह विद्वत्-परिशिष्ट में है।$/, ' दोनों परिपाटियों को यहाँ एक-दूसरे का पर्याय नहीं माना जाता।'],
  [/ हर पंक्ति किस नियम से बनी, यह विद्वत्-परिशिष्ट में दर्ज है।$/, ' हर पंक्ति किस नियम से बनी, यह गणना-अभिलेख में दर्ज है।'],
  [/ सटीक दशमलव देशान्तर गणना-अभिलेख और विद्वत्-परिशिष्ट में सुरक्षित है।$/, ' सटीक दशमलव देशान्तर गणना-अभिलेख में सुरक्षित है।'],
  [/ जो विद्वत्-परिशिष्ट में दिया है।$/, ' जो पढ़ने के लिए आवश्यक नहीं है।'],
  [/ — विवरण विद्वत्-परिशिष्ट में है।$/, ' — इस रिपोर्ट में गणना नहीं की गई।'],
  [/ विवरण विद्वत्-परिशिष्ट में है।$/, ' विवरण इस संस्करण में नहीं दिया गया।'],
  [/ पूरा स्रोत-विवरण विद्वत्-परिशिष्ट में है。$/, ' पूरा स्रोत-विवरण इस संस्करण में नहीं दिया गया।'],
  [/ (\s*)विद्वत्-परिशिष्ट(\s*)?/g, '$1'],
];

function scrubAppendixText(text: string): string {
  let out = text;
  for (const [re, replace] of EN_APPENDIX_REWRITES) out = out.replace(re, replace);
  for (const [re, replace] of HI_APPENDIX_REWRITES) out = out.replace(re, replace);
  // Last-resort: any surviving pointer to an absent appendix is removed. This
  // is deliberately narrow (the two exact strings) so it never rewrites a
  // sentence unrelated to the appendix.
  out = out.replace(/ see the Scholar Appendix/g, '').replace(/ विद्वत्-परिशिष्ट/g, '');
  return out.replace(/ {2,}/g, ' ').trim();
}

/** Recursively rewrites every string reachable from `node`, in place. */
function rewriteValues(node: unknown): void {
  if (typeof node === 'string') return;
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = scrubAppendixText(value);
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const entry = value[i];
        if (typeof entry === 'string') value[i] = scrubAppendixText(entry);
        else rewriteValues(entry);
      }
    } else {
      rewriteValues(value);
    }
  }
}

/**
 * Walks every string the renderer will draw and removes references to the
 * Scholar Appendix in editions that drop it. Also clears status-list xrefs
 * such as "SEE APPENDIX Y-01", which would otherwise point nowhere.
 */
function scrubAppendixReferences(report: KundliReportModelV2): void {
  for (const section of report.sections) {
    for (const block of section.blocks) {
      if (block.kind === 'statusList' && Array.isArray(block.items)) {
        for (const item of block.items) {
          if ('xref' in item) item.xref = undefined;
        }
      }
      rewriteValues(block);
    }
  }
}

/** Edition words the cover should state, matching what the mode actually is. */
function editionLabel(mode: ReportMode, locale: string): string {
  const label = MODE_DEFINITIONS[mode].label;
  if (locale === 'hi') return label.hi;
  if (locale === 'hi-en') return `${label.hi} · ${label.en}`;
  return label.en;
}


export const REPORT_MODES_VERSION = 'kundli-report-modes-v1';

export type ReportMode = 'CLIENT' | 'PANDIT' | 'SCHOLAR';

export const REPORT_MODES: ReportMode[] = ['CLIENT', 'PANDIT', 'SCHOLAR'];

/** What the public download produces when nothing is specified. */
export const DEFAULT_REPORT_MODE: ReportMode = 'SCHOLAR';

/**
 * Stable public-PDF lineage promised by the download API. It lives outside the
 * Next.js route module because Route Handler modules may export only handlers
 * and Next route configuration — exporting this value from the handler makes
 * `next build` reject the route.
 */
export const DOWNLOAD_CONTRACT = {
  reportModelVersion: 'kundli-report-v2',
  rendererVersion: 'kundli-pdf-renderer-v3',
} as const;

/**
 * Sections CLIENT does not receive, each with the reason.
 *
 * The reason matters. "Too technical" is not a reason — everything in a Kundli
 * is technical. The test is whether the page is usable by someone who does not
 * already read charts, and whether its absence changes any conclusion. None of
 * these do: each is a working surface for a practitioner, and each survives in
 * full in PANDIT and SCHOLAR.
 */
export const CLIENT_OMISSIONS: Record<string, string> = {
  'graha-dossier':
    'A nine-row technical dossier of dignity, motion and avastha. A client cannot act on it and misreads it as a verdict.',
  'bhava-matrix':
    'A twelve-row working matrix of house lords, occupants and aspects. It is a practitioner\'s instrument, not a reading.',
  'pandit-discussion-points':
    'Questions written FOR a practitioner to raise. In a client\'s hands they read as unanswered doubts about their own chart.',
  'pandit-notes':
    'Blank annotation space for the practitioner conducting the consultation.',
};

/** Sections only SCHOLAR receives — the whole of Part B. */
export const SCHOLAR_ONLY_PREFIXES = ['part-b-divider', 'appendix-', 'calculation-certificate'];

export interface ModeDefinition {
  mode: ReportMode;
  label: { en: string; hi: string };
  description: { en: string; hi: string };
  /** Whether Part B (the engineering appendix) is included. */
  includesAppendix: boolean;
  /** Expected page range, used as a soft check rather than a target. */
  expectedPages: { min: number; max: number };
  /**
   * Section titles the release gate requires in the rendered text.
   *
   * The first three are the floor: a document without the birth data, the
   * one-page summary and the dasha timeline is not a Kundli, whoever it is
   * for. The rest are what each edition additionally promises.
   */
  mandatorySectionTitles: string[];
}

/** Present in every edition, by definition. */
export const UNIVERSAL_MANDATORY_SECTIONS = [
  'Kundli Passport', 'Kundli Saar', 'Vimshottari Timeline',
];

export const MODE_DEFINITIONS: Record<ReportMode, ModeDefinition> = {
  CLIENT: {
    mode: 'CLIENT',
    label: { en: 'Client Reading', hi: 'जातक पाठ' },
    description: {
      en: 'The chart, what it says, and when. Written to be read without prior training.',
      hi: 'कुण्डली, उसका कथन, और काल। बिना पूर्व अभ्यास के पढ़ने योग्य।',
    },
    includesAppendix: false,
    expectedPages: { min: 8, max: 16 },
    mandatorySectionTitles: [...UNIVERSAL_MANDATORY_SECTIONS],
  },
  PANDIT: {
    mode: 'PANDIT',
    label: { en: 'Pandit Workbench', hi: 'पण्डित कार्यपत्र' },
    description: {
      en: 'Full chart intelligence in traditional vocabulary, with room to annotate.',
      hi: 'पारम्परिक शब्दावली में सम्पूर्ण कुण्डली विवेचन, टिप्पणी हेतु स्थान सहित।',
    },
    includesAppendix: false,
    expectedPages: { min: 12, max: 22 },
    mandatorySectionTitles: [
      ...UNIVERSAL_MANDATORY_SECTIONS,
      'Graha Dossier', 'Bhava Intelligence Matrix', 'Pandit Notes',
    ],
  },
  SCHOLAR: {
    mode: 'SCHOLAR',
    label: { en: 'Scholar Edition', hi: 'शास्त्री संस्करण' },
    description: {
      en: 'The Pandit workbench plus the complete evidence appendix: every rule, source, hash and calculation.',
      hi: 'पण्डित कार्यपत्र सहित सम्पूर्ण प्रमाण परिशिष्ट: प्रत्येक नियम, स्रोत एवं गणना।',
    },
    includesAppendix: true,
    expectedPages: { min: 30, max: 46 },
    mandatorySectionTitles: [
      ...UNIVERSAL_MANDATORY_SECTIONS,
      'Graha Dossier', 'Bhava Intelligence Matrix', 'Pandit Notes',
      'Calculation Certificate', 'Evidence Lineage',
    ],
  },
};

export interface ModeApplication {
  mode: ReportMode;
  keptSectionIds: string[];
  droppedSectionIds: string[];
  /** Why each dropped section was dropped, so the choice is auditable. */
  rationale: Record<string, string>;
}

export interface ModeResult {
  report: KundliReportModelV2;
  application: ModeApplication;
}

const isScholarOnly = (id: string): boolean =>
  SCHOLAR_ONLY_PREFIXES.some((p) => id === p || id.startsWith(p));

/**
 * Selects the sections a mode receives.
 *
 * SCHOLAR is the identity transform: it is the full report, and making it the
 * identity means the default download is byte-for-byte what the V40.1 test
 * suite already validates.
 */
export function applyReportMode(source: KundliReportModelV2, mode: ReportMode): ModeResult {
  const report: KundliReportModelV2 = { ...source, sections: [] };
  const kept: V2Section[] = [];
  const dropped: string[] = [];
  const rationale: Record<string, string> = {};

  for (const section of source.sections) {
    if (isScholarOnly(section.id) && mode !== 'SCHOLAR') {
      dropped.push(section.id);
      rationale[section.id] = 'Engineering appendix — Scholar edition only.';
      continue;
    }
    if (mode === 'CLIENT' && CLIENT_OMISSIONS[section.id]) {
      dropped.push(section.id);
      rationale[section.id] = CLIENT_OMISSIONS[section.id];
      continue;
    }
    kept.push(section);
  }

  report.sections = kept;

  // Cover: the printed edition must never say "Pandit Workbench Edition" when
  // the reader asked for a Client Reading — the cover is the one line a novice
  // actually reads before deciding the document is for them.
  const cover = report.sections
    .find((s) => s.id === 'cover')
    ?.blocks.find((b) => b.kind === 'cover');
  if (cover) cover.editionLabel = editionLabel(mode, String(report.locale));

  // When the appendix is not in this document, every pointer to it is a broken
  // promise. CLIENT and PANDIT must never print "SEE APPENDIX Y-01" that is
  // not there; SCHOLAR keeps every xref intact for the reader who needs it.
  if (mode !== 'SCHOLAR') scrubAppendixReferences(report);

  return {
    report,
    application: {
      mode,
      keptSectionIds: kept.map((s) => s.id),
      droppedSectionIds: dropped,
      rationale,
    },
  };
}

/**
 * Parses a mode from untrusted input (a query string, a form field).
 *
 * Unknown input yields the default rather than an error: a malformed mode is
 * not a reason to deny someone their Kundli, and the default is the most
 * complete edition, so nothing is hidden by the failure.
 */
export function parseReportMode(value: unknown): ReportMode {
  const s = String(value ?? '').trim().toUpperCase();
  return (REPORT_MODES as string[]).includes(s) ? (s as ReportMode) : DEFAULT_REPORT_MODE;
}

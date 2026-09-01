/**
 * KUNDLI V40.1 — Pandit review pack (§12).
 *
 * A validation artifact, not a product feature. Its only purpose is to be put
 * in front of a practising Pandit so they can tell us where the report is
 * wrong, where it is useless, and where it is missing something. Everything
 * about it is shaped by that: Part A only, numbered sections a reviewer can
 * cite, wide annotation space, and a structured review form at the back.
 *
 * It is produced by TRANSFORMING the report model, not by a second renderer
 * and not by a second content path. A review pack assembled from different
 * words than the real report would tell us about the review pack.
 *
 * It derives no Jyotish facts. It selects sections, adds numbering to their
 * titles, inserts blank ruled space, and appends a form.
 */

import type { KundliReportModelV2, V2Block, V2Section } from './reportBlocks';

export const PANDIT_REVIEW_PACK_VERSION = 'pandit-review-pack-v1';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Sections that carry annotation space, and how many ruled lines each gets. */
const ANNOTATION_SPACE: Record<string, number> = {
  'kundli-passport': 3,
  'kundli-saar': 4,
  'd1-rashi-chart': 4,
  'd9-navamsha-chart': 4,
  'graha-dossier': 4,
  'bhava-matrix': 4,
  'yoga-dosha-dashboard': 5,
  'vimshottari-timeline': 4,
  'current-dasha-activation': 3,
  'career-synthesis': 5,
  'pandit-discussion-points': 5,
};

export interface ReviewPackResult {
  report: KundliReportModelV2;
  /** Section number -> section id, so a reviewer's "§4" is unambiguous. */
  numbering: { number: number; id: string; title: string }[];
}

/* ------------------------------------------------------------------ */
/* The review form                                                     */
/* ------------------------------------------------------------------ */

export const REVIEW_RATING_TARGETS = [
  'D1 Rashi chart',
  'D9 Navamsha chart',
  'Graha Dossier table',
  'Yoga and Dosha dashboard',
  'Vimshottari Timeline',
] as const;

function ratingRow(target: string): string[] {
  return [target, '1', '2', '3', '4', '5'];
}

function reviewFormSection(numbering: { number: number; id: string; title: string }[]): V2Section {
  const blocks: V2Block[] = [
    {
      kind: 'sectionTitle',
      text: 'Review Form',
      secondary: 'समीक्षा प्रपत्र',
      tag: 'FOR THE REVIEWER',
    },
    {
      kind: 'paragraph',
      text: 'This document is being checked before it is shown to anyone. Please mark it up freely — a page you disagree with is more useful to us than a page you approve of. Section numbers below refer to the numbered sections of this pack.',
    },

    { kind: 'heading', level: 2, text: '1. Is the calculation correct?' },
    {
      kind: 'paragraph', size: 'small',
      text: 'For each section, mark CORRECT if the values match what you would compute, or QUESTIONABLE if they do not. If questionable, say which value and what you expected.',
    },
    {
      kind: 'table',
      headers: ['§', 'Section', 'Correct', 'Questionable', 'If questionable — which value, and what did you expect?'],
      widths: [0.05, 0.24, 0.08, 0.1, 0.53],
      align: ['right', 'left', 'center', 'center', 'left'],
      rows: numbering.map((n) => [String(n.number), n.title, '', '', '']),
    },

    { kind: 'heading', level: 2, text: '2. How useful is each part in a consultation?' },
    {
      kind: 'paragraph', size: 'small',
      text: '1 = I would not use it.  2 = rarely.  3 = sometimes.  4 = usually.  5 = I would use it in every consultation. Circle one.',
    },
    {
      kind: 'table',
      headers: ['Part of the report', 'Not useful', '2', '3', '4', 'Essential'],
      widths: [0.4, 0.12, 0.12, 0.12, 0.12, 0.12],
      align: ['left', 'center', 'center', 'center', 'center', 'center'],
      rows: REVIEW_RATING_TARGETS.map((t) => ratingRow(t)),
    },

    { kind: 'heading', level: 2, text: '3. What is missing?' },
    {
      kind: 'paragraph', size: 'small',
      text: 'What would you expect to find in a Kundli of this kind that is not here at all?',
    },
    { kind: 'notesArea', title: 'Missing information', lines: 6 },

    { kind: 'heading', level: 2, text: '4. What is unnecessary?' },
    {
      kind: 'paragraph', size: 'small',
      text: 'What is on these pages that you would never look at, or that gets in the way during a consultation?',
    },
    { kind: 'notesArea', title: 'Unnecessary information', lines: 6 },

    { kind: 'heading', level: 2, text: '5. Where do you disagree, and why?' },
    {
      kind: 'paragraph', size: 'small',
      text: 'Interpretive disagreements are expected and welcome. Please note the section, the statement, and the tradition or reasoning you would apply instead. We would rather record a disagreement than silently pick a side.',
    },
    { kind: 'notesArea', title: 'Disagreement 1 — section, statement, and your reasoning', lines: 5 },
    { kind: 'notesArea', title: 'Disagreement 2', lines: 5 },
    { kind: 'notesArea', title: 'Disagreement 3', lines: 5 },

    { kind: 'heading', level: 2, text: '6. Would you use this in a consultation?' },
    {
      kind: 'table',
      headers: ['', 'Yes, as it is', 'Yes, with changes', 'No'],
      widths: [0.4, 0.2, 0.2, 0.2],
      align: ['left', 'center', 'center', 'center'],
      rows: [
        ['Would you put this in front of a client?', '', '', ''],
        ['Would you use it as your own working sheet?', '', '', ''],
        ['Would you trust its calculations without re-checking?', '', '', ''],
      ],
    },
    { kind: 'notesArea', title: 'If "with changes" — what changes?', lines: 5 },

    { kind: 'heading', level: 2, text: '7. About you' },
    {
      kind: 'paragraph', size: 'small',
      text: 'Recorded so we can weigh the review, not to identify you. Leave anything blank.',
    },
    {
      kind: 'kvGrid', columns: 2,
      items: [
        { label: 'Tradition / paramparā', value: '' },
        { label: 'Years of practice', value: '' },
        { label: 'Primary language of consultation', value: '' },
        { label: 'Date of this review', value: '' },
      ],
    },
    {
      kind: 'callout', tone: 'info', title: 'What happens to this review',
      text: 'Every disagreement recorded here is entered into the source registry as an unresolved variant rather than silently resolved in one direction. Where a reviewer says a value is wrong, it becomes an external validation case with a named reference. Nothing is marked correct because a reviewer approved of it in general.',
    },
  ];

  return {
    id: 'pandit-review-form',
    title: 'Review Form',
    part: 'A',
    startsNewPage: true,
    status: 'READY',
    blocks,
  };
}

/* ------------------------------------------------------------------ */

/**
 * Builds the review pack from a rendered report model.
 *
 * Part B is dropped in full. The brief is explicit: a reviewer should see the
 * consultation document, not the engineering appendix, because the question
 * being asked is "is this usable and correct", not "is the implementation
 * defensible". Where a Part A statement points at the appendix, the pointer is
 * left in place — a reviewer who wants the evidence should be able to ask for
 * it by name.
 */
export function buildPanditReviewPack(source: KundliReportModelV2): ReviewPackResult {
  const report = clone(source);
  const partA = report.sections.filter((s) => s.part === 'A' && s.status === 'READY');

  const numbering: { number: number; id: string; title: string }[] = [];
  let n = 0;

  const sections: V2Section[] = partA.map((sec) => {
    if (sec.id === 'cover') {
      // The cover keeps its identity but announces what the document is for.
      const cover = sec.blocks.find((b) => b.kind === 'cover');
      if (cover && cover.kind === 'cover') {
        cover.verificationBadge = [
          'PANDIT REVIEW PACK — NOT FOR A CLIENT',
          `source report ${source.reportId}`,
          'Consultation pages only. Statements below point at the Scholar',
          'Appendix for their evidence; that appendix is available on request.',
        ];
      }
      return sec;
    }

    n += 1;
    numbering.push({ number: n, id: sec.id, title: sec.title });

    const title = sec.blocks.find((b) => b.kind === 'sectionTitle');
    if (title && title.kind === 'sectionTitle') {
      title.text = `${n}. ${title.text}`;
      title.tag = `SECTION ${n}`;
    }

    const lines = ANNOTATION_SPACE[sec.id];
    if (lines) {
      sec.blocks.push({ kind: 'spacer', mm: 3 });
      sec.blocks.push({
        kind: 'notesArea',
        title: `§${n} — reviewer notes`,
        lines,
      });
    }
    return sec;
  });

  sections.push(reviewFormSection(numbering));

  report.sections = sections;
  report.reportModelVersion = PANDIT_REVIEW_PACK_VERSION;
  report.reportId = `${source.reportId}-REVIEW`;
  return { report, numbering };
}

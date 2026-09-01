/**
 * KUNDLI V40.1 — a model of what a correct Indic shaper does to text order.
 *
 * ============================================================================
 * READ THIS BEFORE ASSUMING THIS FILE VIOLATES THE "NO MANUAL REORDERING" RULE.
 * ============================================================================
 * The V40.1 brief forbids reordering Unicode to fake correct rendering. This
 * module does the opposite, and is never called by the renderer.
 *
 * A PDF stores glyphs in the order they are painted, left to right. When a
 * shaper does its job, `सिंह` is painted as [ि][स][ं][ह] — the pre-base matra
 * FIRST — and each glyph's ToUnicode entry maps back to its own codepoint.
 * Any extractor that concatenates those entries therefore reports `िसंह`.
 * That is not corruption: no codepoint was lost, substituted or invented. It
 * is the visual order, and Chromium's printToPDF produces exactly the same
 * thing for exactly the same reason.
 *
 * So a semantic QA gate has a choice: compare against the logical string and
 * always fail, or model the reordering and compare against what a CORRECTLY
 * SHAPED document must contain. This module does the second. It applies the
 * two standard Devanagari reorderings — pre-base matra movement and reph
 * movement — to the EXPECTED string, and the gate then demands an exact match
 * with what the PDF actually contains.
 *
 * That makes the gate strictly stronger than a naive comparison: it fails if
 * shaping did not happen (v2's output), it fails if shaping happened wrongly,
 * and it fails if any codepoint was lost. Renderer v2's PDF fails it; renderer
 * v3's passes.
 *
 * The two rules, from Unicode Standard Annex #9 / the Devanagari shaping model:
 *
 *   1. PRE-BASE MATRA. The vowel sign I (U+093F, ि) is stored after its
 *      consonant cluster but drawn before it.
 *   2. REPH. A cluster-initial र + virama, when followed by another
 *      consonant, is drawn as a mark above the END of the cluster.
 */

/* Devanagari character classes. */
const CONSONANT = '[\\u0915-\\u0939\\u0958-\\u095F\\u0978-\\u097F]';
const INDEPENDENT_VOWEL = '[\\u0904-\\u0914\\u0960\\u0961\\u0972-\\u0977]';
const NUKTA = '\\u093C';
const VIRAMA = '\\u094D';
/** Dependent vowel signs, anusvara, visarga, candrabindu, accents. */
const MARK = '[\\u0900-\\u0903\\u093A\\u093B\\u093E-\\u094C\\u094E\\u094F\\u0951-\\u0957\\u0962\\u0963]';
const ZW = '[\\u200C\\u200D]';

/** One orthographic syllable: (C + virama)* C + nukta? + marks*, or a vowel. */
const CLUSTER = new RegExp(
  `(?:(?:${CONSONANT}${NUKTA}?${VIRAMA}${ZW}?)*${CONSONANT}${NUKTA}?|${INDEPENDENT_VOWEL})(?:${MARK})*`,
  'y',
);

const PRE_BASE_MATRA = '\u093F';
const RA = '\u0930';

const isDevanagari = (ch: string): boolean => {
  const cp = ch.codePointAt(0) ?? 0;
  return cp >= 0x0900 && cp <= 0x097f;
};

/**
 * Rewrites one cluster from logical (storage) order into visual (paint) order.
 */
function reorderCluster(cluster: string): string {
  let out = cluster;

  // Rule 2 — reph. A cluster-initial "र" + virama, when a consonant follows,
  // is rendered at the end of the cluster.
  const rephMatch = new RegExp(`^${RA}${VIRAMA}(?=${CONSONANT})`).exec(out);
  let reph = '';
  if (rephMatch) {
    reph = out.slice(0, rephMatch[0].length);
    out = out.slice(rephMatch[0].length);
  }

  // Rule 1 — pre-base matra. Extract it, then place it in front.
  let pre = '';
  if (out.includes(PRE_BASE_MATRA)) {
    pre = PRE_BASE_MATRA;
    out = out.replace(PRE_BASE_MATRA, '');
  }

  return pre + out + reph;
}

/**
 * Applies the standard Devanagari reorderings to a string, producing the glyph
 * order a correct shaper must emit. Non-Devanagari runs pass through untouched.
 */
export function toVisualOrder(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (!isDevanagari(text[i])) { out += text[i]; i += 1; continue; }
    CLUSTER.lastIndex = i;
    const m = CLUSTER.exec(text);
    if (!m || m[0].length === 0) { out += text[i]; i += 1; continue; }
    out += reorderCluster(m[0]);
    i += m[0].length;
  }
  return out;
}

/** True when the string is unaffected by shaping (no reordering expected). */
export function isOrderStable(text: string): boolean {
  return toVisualOrder(text) === text;
}

/**
 * The multiset of codepoints, as a sorted string.
 *
 * Reordering changes the sequence but can never change this. Comparing it
 * catches the failures that matter regardless of order: a dropped matra, a
 * substituted character, a .notdef that extracted as U+FFFD.
 */
export function codePointFingerprint(text: string): string {
  return [...text]
    .filter((c) => !/\s/.test(c))
    .map((c) => (c.codePointAt(0) ?? 0).toString(16).padStart(4, '0'))
    .sort()
    .join(' ');
}

/** Whitespace-insensitive comparison helper used by the extraction gate. */
export function squash(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export interface ExtractionVerdict {
  ok: boolean;
  /** The expected string, reordered as a correct shaper would paint it. */
  expectedVisual: string;
  /** True when every codepoint survived, regardless of order. */
  codePointsPreserved: boolean;
  /** True when the exact shaped sequence was found. */
  shapedSequenceFound: boolean;
  /** Present when a replacement character or notdef marker was extracted. */
  corruption: string[];
}

const CORRUPTION_MARKERS = /[\uFFFD\u0000]/g;

/**
 * The semantic-QA verdict for one expected string against extracted page text.
 *
 * Three independent questions, reported separately so a failure says WHICH
 * property broke:
 *   - was the correctly shaped sequence painted?
 *   - did every codepoint survive?
 *   - did anything extract as a replacement character?
 */
export function verifyExtraction(expected: string, extractedPageText: string): ExtractionVerdict {
  const expectedVisual = toVisualOrder(expected);
  const haystack = squash(extractedPageText);
  const shapedSequenceFound = haystack.includes(squash(expectedVisual));
  const corruption = [...(extractedPageText.match(CORRUPTION_MARKERS) ?? [])];

  // Codepoint preservation is asked of the located fragment, not of the page.
  const idx = haystack.indexOf(squash(expectedVisual));
  const fragment = idx >= 0 ? haystack.slice(idx, idx + squash(expectedVisual).length) : '';
  const codePointsPreserved = idx >= 0
    && codePointFingerprint(fragment) === codePointFingerprint(expected);

  return {
    ok: shapedSequenceFound && codePointsPreserved && corruption.length === 0,
    expectedVisual,
    codePointsPreserved,
    shapedSequenceFound,
    corruption,
  };
}

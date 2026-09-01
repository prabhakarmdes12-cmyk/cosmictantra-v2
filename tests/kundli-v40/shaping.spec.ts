/**
 * V40.1 GATE 1 — complex script shaping.
 *
 * The V40 blocker, and the reason renderer v3 exists. These tests fail if the
 * Devanagari shaper stops running, if a font is downgraded to a build with
 * broken GPOS anchors, or if anyone reintroduces manual reordering.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { FontStack, FONT_FILES, FONT_ROLES, V3_FONT_DIR } from '../../src/lib/kundli/v40/pdf/fontStack';
import { toVisualOrder, verifyExtraction, codePointFingerprint } from '../../src/lib/kundli/v40/pdf/shapedText';
import {
  REQUIRED_DEVANAGARI_WORDS, REQUIRED_MIXED_STRINGS, REQUIRED_SYMBOL_STRINGS,
} from '../../src/lib/kundli/v40/fixtures/typographyFixture';

const fonts = FontStack.fromDisk();
const SERIF = { family: 'serif' as const };
const SANS = { family: 'sans' as const };

test.describe('KUNDLI_INV_SHAPE_001 — the font, not the code, reorders the script', () => {
  test('the pre-base matra of सिंह is painted FIRST', () => {
    // This single assertion is the V40 defect, expressed as a test.
    // In logical order सिंह is स ि ं ह. Correctly shaped, the ि is painted
    // before the स. jsPDF could not do this; fontkit does.
    const [run] = fonts.shape('सिंह', SERIF);
    expect(run.role).toBe('devaSerif');
    expect(run.codePoints[0]).toEqual([0x093f]);
    expect(run.codePoints[1]).toEqual([0x0938]);
    expect(run.glyphIds).not.toContain(0);
  });

  test('every §4 word shapes without a .notdef', () => {
    for (const word of REQUIRED_DEVANAGARI_WORDS) {
      for (const style of [SERIF, SANS]) {
        const runs = fonts.shape(word, style);
        expect(runs.length, `${word} split unexpectedly`).toBe(1);
        expect(runs[0].glyphIds, `${word} produced a .notdef`).not.toContain(0);
        expect(runs[0].glyphIds.length).toBeGreaterThan(0);
      }
    }
  });

  test('conjuncts collapse into ligature glyphs rather than staying separate', () => {
    // नक्षत्र carries क्ष and त्र. Unshaped it would be seven glyphs; shaped it
    // is fewer, because GSUB has combined them.
    const [shaped] = fonts.shape('नक्षत्र', SERIF);
    expect([...'नक्षत्र'].length).toBe(7);
    expect(shaped.glyphIds.length).toBeLessThan(7);
  });

  test('reph is reordered to the end of its cluster', () => {
    // अन्तर्दशा: the र् of the third cluster is drawn above the द.
    expect(toVisualOrder('अन्तर्दशा')).toBe('अन्तदर्शा');
    expect(toVisualOrder('कर्क')).toBe('ककर्');
  });

  test('above-base matras are NOT reordered', () => {
    // A normaliser that reorders too eagerly would mask a real shaping bug.
    for (const stable of ['महादशा', 'कुण्डली', 'नक्षत्र', 'उत्तराषाढ़ा', 'शुक्र', 'प्रथम भाव']) {
      expect(toVisualOrder(stable), stable).toBe(stable);
    }
  });

  test('reordering never loses, adds or substitutes a codepoint', () => {
    for (const word of [...REQUIRED_DEVANAGARI_WORDS, ...REQUIRED_MIXED_STRINGS]) {
      expect(codePointFingerprint(toVisualOrder(word)), word).toBe(codePointFingerprint(word));
    }
  });
});

test.describe('KUNDLI_INV_RENDER_002 — no codepoint is ever drawn as a box', () => {
  test('every face declared in the stack is present on disk and parses', () => {
    for (const role of FONT_ROLES) {
      const file = path.join(process.cwd(), ...V3_FONT_DIR, FONT_FILES[role]);
      expect(fs.existsSync(file), `${role}: ${FONT_FILES[role]} missing`).toBe(true);
      expect(fonts.face(role).unitsPerEm, `${role} has no unitsPerEm`).toBeGreaterThan(0);
      expect(fonts.postscriptName(role).length).toBeGreaterThan(0);
    }
  });

  test('the Devanagari faces are new enough to shape है', () => {
    // Noto Devanagari 2.002 carries NULL GPOS anchors. fontkit dereferences
    // them and throws on है — one of the commonest words in Hindi. This test
    // is the guard against someone restoring the older file.
    for (const style of [SERIF, SANS]) {
      expect(() => fonts.shape('है', style)).not.toThrow();
      expect(() => fonts.shape('हैं यहाँ कहाँ नहीं', style)).not.toThrow();
    }
  });

  test('symbols the text faces lack are routed to the fallback face', () => {
    const runs = fonts.runsFor('Rahu → Jupiter ≥ 12° ✓', SERIF);
    const roles = new Set(runs.map((r) => r.role));
    expect(roles.has('symbol')).toBe(true);
    for (const run of runs) {
      const shaped = fonts.face(run.role).layout(run.text);
      expect(shaped.glyphs.map((g) => g.id), run.text).not.toContain(0);
    }
  });

  test('a mixed Latin/Devanagari string splits into per-script runs', () => {
    const runs = fonts.runsFor('सिंह लग्न — Leo Ascendant 12°06′', SERIF);
    expect(runs.length).toBeGreaterThan(1);
    // Devanagari must never be handed to a Latin face: it has no glyphs for it
    // and would silently emit .notdef.
    for (const run of runs) {
      const isDev = /[\u0900-\u097F]/.test(run.text);
      if (isDev) expect(run.role.startsWith('deva'), run.text).toBe(true);
      else expect(run.role.startsWith('deva'), run.text).toBe(false);
    }
  });

  test('every §4 string is fully covered by the embedded faces', () => {
    for (const s of [...REQUIRED_DEVANAGARI_WORDS, ...REQUIRED_MIXED_STRINGS, ...REQUIRED_SYMBOL_STRINGS]) {
      expect(fonts.missingCodePoints(s, SERIF), s).toEqual([]);
      expect(fonts.missingCodePoints(s, SANS), s).toEqual([]);
    }
  });

  test('an uncoverable codepoint raises instead of drawing a box', () => {
    // U+4E2D (中) is in no embedded face. Failing loudly is the contract:
    // a silent .notdef box in a Pandit's chart is worse than a failed build.
    expect(() => fonts.runsFor('\u4E2D', SERIF)).toThrow(/KUNDLI_FONT_COVERAGE_MISSING/);
    expect(fonts.missingCodePoints('name \u4E2D here', SERIF)).toEqual(['U+4E2D']);
  });
});

test.describe('the extraction verdict distinguishes shaped from unshaped output', () => {
  test('correctly shaped output passes', () => {
    const shapedPage = `${toVisualOrder('सिंह लग्न')} — Leo Ascendant`;
    const v = verifyExtraction('सिंह लग्न', shapedPage);
    expect(v.ok).toBe(true);
    expect(v.shapedSequenceFound).toBe(true);
    expect(v.codePointsPreserved).toBe(true);
  });

  test('UNSHAPED output fails — this is what renderer v2 produced', () => {
    // Logical order on the page means no shaper ran. The gate must reject it.
    const unshapedPage = 'सिंह लग्न — Leo Ascendant';
    expect(verifyExtraction('सिंह लग्न', unshapedPage).ok).toBe(false);
  });

  test('a dropped matra fails even though the order is right', () => {
    expect(verifyExtraction('सिंह', 'सह').ok).toBe(false);
  });

  test('a replacement character fails', () => {
    expect(verifyExtraction('सिंह', `${toVisualOrder('सिंह')} \uFFFD`).ok).toBe(false);
  });
});

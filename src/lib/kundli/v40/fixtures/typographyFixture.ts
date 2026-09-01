/**
 * KUNDLI V40.1 — typography validation fixture (§4).
 *
 * The V40 shaping defect was invisible to every automated check we had: the
 * text layer said `सिंह`, the page said `िसंह`, and only a human eye caught it.
 * This fixture exists so that never happens again. It is a small document
 * containing every typographic case the real report contains, rendered by the
 * real renderer, through the real pipeline of tokens and fonts.
 *
 * It is read three ways, and all three must agree:
 *   1. a human looks at the rasterised pages (do the matras sit correctly?);
 *   2. the semantic gate extracts the text and checks it against the shaping
 *      model in pdf/shapedText.ts;
 *   3. the structural gate checks nothing clipped, overlapped or substituted.
 *
 * The word list is fixed by the brief. Do not "clean it up" — every entry is
 * there because it exercises a specific failure: a pre-base matra, a reph, a
 * nukta, a three-consonant conjunct, a script transition mid-line.
 */

import type { KundliReportModelV2, V2Block, V2Section } from '../reportBlocks';

export const TYPOGRAPHY_FIXTURE_VERSION = 'typography-fixture-v1';

/** §4 word list. Every one of these must be legible and correctly shaped. */
export const REQUIRED_DEVANAGARI_WORDS = [
  'सिंह',
  'कुण्डली',
  'राशि',
  'नक्षत्र',
  'महादशा',
  'अन्तर्दशा',
  'प्रथम भाव',
  'शुक्र',
  'बृहस्पति',
  'उत्तराषाढ़ा',
] as const;

/** Why each word is in the list — printed in the fixture, next to the word. */
export const WORD_RATIONALE: Record<string, string> = {
  'सिंह': 'pre-base matra + anusvara: the V40 defect, reproduced exactly',
  'कुण्डली': 'ण् + ड conjunct with a below-base vowel sign',
  'राशि': 'pre-base matra at the end of a word',
  'नक्षत्र': 'क्ष and त्र, two ligature conjuncts in one word',
  'महादशा': 'plain above-base matras; must NOT reorder',
  'अन्तर्दशा': 'reph: र + virama drawn above the end of its cluster',
  'प्रथम भाव': 'pre-base र-phala conjunct plus a word break',
  'शुक्र': 'below-base u-matra under a conjunct',
  'बृहस्पति': 'vocalic ri, स्प conjunct, pre-base matra',
  'उत्तराषाढ़ा': 'independent vowel, त्त conjunct, nukta + matra',
};

export const REQUIRED_MIXED_STRINGS = [
  'जन्म कुण्डली (D1)',
  'सिंह लग्न — Leo Ascendant',
  'Leo Ascendant — सिंह लग्न',
  'नक्षत्र: Uttara Ashadha, पद 1',
  'D9 नवांश · Navamsha',
] as const;

export const REQUIRED_SYMBOL_STRINGS = [
  '11°43′',
  '11°43′12″',
  '0°00′ — 29°59′',
  '1995-06-15 · 10:30 AM',
  'Rahu → Jupiter → Saturn',
  '25.5941° N, 85.1376° E',
  '± 0.5° · ≥ 12° · ≤ 10°',
  '5y 0m 4d (83.54%)',
] as const;

export const REQUIRED_STATUS_LABELS = [
  'PRESENT', 'ABSENT', 'SCHOLAR_JUDGEMENT', 'VALIDATION_PENDING', 'NOT_CALCULATED',
] as const;

/** Everything the semantic gate must find in the rendered fixture. */
export function typographyExpectations(): string[] {
  return [
    ...REQUIRED_DEVANAGARI_WORDS,
    ...REQUIRED_MIXED_STRINGS,
    ...REQUIRED_SYMBOL_STRINGS,
  ];
}

function section(id: string, title: string, blocks: V2Block[]): V2Section {
  return { id, title, part: 'A', startsNewPage: true, status: 'READY', blocks };
}

/**
 * Builds the fixture as a report model, so it travels through exactly the same
 * renderer path as a real Kundli. A fixture drawn by a bespoke code path would
 * validate the bespoke code path.
 */
export function buildTypographyFixture(): KundliReportModelV2 {
  const devRows = REQUIRED_DEVANAGARI_WORDS.map((w) => [w, WORD_RATIONALE[w] ?? '']);

  return {
    reportModelVersion: TYPOGRAPHY_FIXTURE_VERSION,
    reportId: 'CT-TYPOGRAPHY-FIXTURE',
    generatedAt: '1970-01-01T00:00:00.000Z',
    locale: 'en',
    labelMode: 'hi-en',
    contentHash: 'typography-fixture',
    fingerprint: 'typography-fixture',
    engineVersions: { renderer: 'kundli-pdf-renderer-v3' },
    subject: {
      name: 'Typography Validation',
      birthDate: '1970-01-01',
      birthTime: '00:00',
      locationName: '—',
    },
    sections: [
      section('typo-cover', 'Typography Validation', [
        {
          kind: 'cover',
          invocation: '॥ श्री गणेशाय नमः ॥',
          brand: 'CosmicTantra',
          documentTitle: 'जन्म कुण्डली',
          subjectName: 'Typography Validation Fixture',
          birthLines: ['सिंह लग्न — Leo Ascendant', '11°43′12″ · 1995-06-15'],
          identityLines: [
            'सिंह लग्न  ·  Leo Ascendant 12°06′',
            'उत्तराषाढ़ा — पद 1  ·  Uttara Ashadha pada 1',
            'अन्तर्दशा · बृहस्पति · Antardasha',
          ],
          currentPeriodLine: 'महादशा Rahu → अन्तर्दशा Mercury',
          reportId: 'CT-TYPOGRAPHY-FIXTURE',
          verificationBadge: ['kundli-pdf-renderer-v3', 'shaping: fontkit Indic'],
        },
      ]),

      section('typo-devanagari', 'Devanagari only', [
        { kind: 'sectionTitle', text: 'Devanagari only', secondary: 'केवल देवनागरी', tag: 'FIXTURE 1' },
        {
          kind: 'paragraph', size: 'small',
          text: 'Each word below exercises one specific shaping behaviour. If any of them renders in logical order — matra after its consonant, reph at the start — the renderer is not shaping and the document must not ship.',
        },
        {
          kind: 'table',
          headers: ['Word', 'What it tests'],
          widths: [0.3, 0.7],
          rows: devRows,
        },
        { kind: 'heading', level: 3, text: 'The same words at report sizes' },
        {
          kind: 'table',
          headers: ['Context', 'Rendered'],
          widths: [0.3, 0.7],
          rows: [
            ['Section title size', REQUIRED_DEVANAGARI_WORDS.join('  ')],
            ['Body size', REQUIRED_DEVANAGARI_WORDS.join(' · ')],
            ['Table size', REQUIRED_DEVANAGARI_WORDS.join(', ')],
          ],
        },
        {
          kind: 'paragraph',
          text: 'सिंह लग्न में मंगल स्थित है। कुण्डली के प्रथम भाव में मंगल, दशम भाव में सूर्य, बुध और शुक्र हैं। जन्म नक्षत्र उत्तराषाढ़ा है और महादशा राहु की चल रही है। बृहस्पति वक्री है।',
        },
      ]),

      section('typo-latin', 'Latin only', [
        { kind: 'sectionTitle', text: 'Latin only', tag: 'FIXTURE 2' },
        {
          kind: 'paragraph',
          text: 'The Latin face is EB Garamond for running text and Noto Sans for tabular and label work. This paragraph checks that a book face at 9.7pt still sets an even colour across a 174mm measure, with correct quotation marks, an em dash — like this — and ligatures in "difficult", "affluent" and "flight".',
        },
        {
          kind: 'table',
          headers: ['Graha', 'Rashi', 'Degree', 'Bhava', 'Nakshatra'],
          widths: [0.2, 0.2, 0.2, 0.15, 0.25],
          rows: [
            ['Sun', 'Taurus', '29°52′', '10', 'Mrigashira'],
            ['Jupiter', 'Scorpio', '15°01′', '4', 'Anuradha'],
            ['Venus', 'Taurus', '11°43′', '10', 'Rohini'],
          ],
        },
      ]),

      section('typo-mixed', 'Mixed scripts', [
        { kind: 'sectionTitle', text: 'Mixed scripts', secondary: 'मिश्रित लिपि', tag: 'FIXTURE 3' },
        {
          kind: 'paragraph', size: 'small',
          text: 'Hindi to English and English to Hindi within one line, one paragraph and one table cell. In V40 a Latin letter after Devanagari silently truncated the rest of the string; that failure would be visible here immediately.',
        },
        {
          kind: 'table',
          headers: ['Direction', 'String'],
          widths: [0.3, 0.7],
          rows: [
            ['Hindi → English', 'सिंह लग्न — Leo Ascendant'],
            ['English → Hindi', 'Leo Ascendant — सिंह लग्न'],
            ['Parenthesised', 'जन्म कुण्डली (D1)'],
            ['Interleaved', 'नक्षत्र: Uttara Ashadha, पद 1'],
            ['Abbreviated', 'D9 नवांश · Navamsha'],
          ],
        },
        {
          kind: 'paragraph',
          text: 'The lagna is सिंह (Leo) at 12°06′, and the Moon stands in धनु (Sagittarius) at 28°52′ in नक्षत्र Uttara Ashadha, पद 1. The running महादशा is Rahu, with अन्तर्दशा Mercury; the next transition is बृहस्पति (Jupiter) from 2035-06-19.',
        },
      ]),

      section('typo-symbols', 'Numerals, symbols and marks', [
        { kind: 'sectionTitle', text: 'Numerals, symbols and marks', tag: 'FIXTURE 4' },
        {
          kind: 'table',
          headers: ['Case', 'Rendered'],
          widths: [0.35, 0.65],
          rows: REQUIRED_SYMBOL_STRINGS.map((s2) => [
            s2.includes('°') && s2.includes('″') ? 'DMS with seconds'
              : s2.includes('→') ? 'Arrows'
                : s2.includes('≥') ? 'Mathematical relations'
                  : s2.includes('N,') ? 'Coordinates'
                    : s2.includes('%') ? 'Duration and percentage'
                      : s2.includes('AM') ? 'Date and clock'
                        : s2.includes('—') ? 'Range with an em dash'
                          : 'DMS',
            s2,
          ]),
        },
        {
          kind: 'statusList',
          title: 'Status marks — drawn, not typed',
          items: [
            { label: 'Present', status: 'PRESENT', note: 'a drawn tick; survives a photocopy' },
            { label: 'Absent', status: 'ABSENT', note: 'a drawn cross' },
            { label: 'Scholar judgement', status: 'SCHOLAR_JUDGEMENT', note: 'a drawn lozenge' },
            { label: 'Validation pending', status: 'VALIDATION_PENDING', note: 'a drawn circle' },
            { label: 'Not calculated', status: 'NOT_CALCULATED', note: 'a drawn rule' },
          ],
        },
        {
          kind: 'callout', tone: 'info', title: 'Why status is a shape',
          text: 'A tick taken from a text font depends on that font\'s coverage and disappears silently when a face is substituted. A drawn mark cannot be substituted, and it still reads when the page is photocopied in black and white — which is how a consultation document is actually reproduced.',
        },
      ]),

      section('typo-stress', 'Wrapping and edge cases', [
        { kind: 'sectionTitle', text: 'Wrapping and edge cases', tag: 'FIXTURE 5' },
        {
          kind: 'kvGrid', columns: 2,
          items: [
            { label: 'Very long label that must not collide with its value', value: 'सिंह लग्न — Leo Ascendant 12°06′' },
            { label: 'Short', value: 'उत्तराषाढ़ा' },
            { label: 'Unbroken token', value: 'Thiruvananthapuram-Kanyakumari-Nagercoil' },
            { label: 'Unbroken Devanagari', value: 'तिरुवनन्तपुरम्कन्याकुमारीनागरकोइल' },
            { label: 'Numeric', value: '25.5941° N · 85.1376° E · UTC+5.5' },
            { label: 'Retrograde markers', value: 'Mercury (R) · Jupiter (R) · Rahu (R) · Ketu (R)' },
          ],
        },
        {
          kind: 'bullets',
          items: [
            'A bullet whose text is long enough to wrap onto a second line, containing सिंह, कुण्डली and 11°43′ so the wrap point falls between scripts.',
            'अन्तर्दशा और महादशा दोनों एक ही पंक्ति में, with an English clause following them, and a numeral 2035-06-19 at the end.',
            'Short one.',
          ],
        },
      ]),
    ],
  };
}

#!/usr/bin/env node
/**
 * Build the Bhagavad Gita edition manifest from the repository's bundled
 * source snapshot in `gita_raw/`.
 *
 * WHAT THIS IS
 *   A reproducible, content-addressed statement of the units an edition is
 *   expected to contain (adhyāya, śloka numbers, speaker labels, grouping
 *   rules) together with the exact provenance of the snapshot it was built
 *   from.
 *
 * WHAT THIS IS NOT
 *   It is NOT an independent collation against a printed or publisher
 *   edition. `gita_raw/` carries no publisher, editor or edition statement,
 *   so `provenance.independentCollation` stays false and the coverage report
 *   must say so. Do not upgrade these fields without a real edition record.
 *
 * Run: node scripts/build-gita-edition-manifest.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.resolve(ROOT, 'gita_raw');
const OUT = path.resolve(ROOT, 'src/lib/granth/data/editions/bhagavad-gita.ts');

const SPEAKER_RE = /^(श्रीभगवानुवाच|श्रीभगवान् उवाच|धृतराष्ट्र उवाच|सञ्जय उवाच|अर्जुन उवाच)\s*।\s*$/;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function fileRecord(relPath, role) {
  const abs = path.resolve(ROOT, relPath);
  const buf = fs.readFileSync(abs);
  return { path: relPath, role, bytes: buf.byteLength, sha256: sha256(buf) };
}

function loadHindi(chapter) {
  const rel = `gita_raw/hi/${String(chapter).padStart(2, '0')}.txt`;
  const raw = fs.readFileSync(path.resolve(ROOT, rel), 'utf8');
  const verses = new Map();
  let speakers = 0;
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('SP|')) {
      speakers += 1;
      continue;
    }
    const m = /^(\d+)\|(.*)$/.exec(t);
    if (m) verses.set(Number(m[1]), m[2].trim());
  }
  return { rel, verses, speakers };
}

function main() {
  const data = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'gita.json'), 'utf8'));
  const chapterNumbers = Object.keys(data).map(Number).sort((a, b) => a - b);
  const sourceFiles = [fileRecord('gita_raw/gita.json', 'SANSKRIT_MULA_AND_SPEAKER_STRUCTURE')];

  const chapters = [];
  for (const ch of chapterNumbers) {
    const info = data[String(ch)];
    const items = info.items || [];
    const speakers = [];
    const verses = [];
    const groups = [];

    for (const it of items) {
      if (it.type === 'speaker') {
        speakers.push({ label: it.label.replace(/\s*।\s*$/, '') });
        continue;
      }
      if (it.type !== 'verse') continue;
      const lines = String(it.text).split('\n');
      if (lines.length && SPEAKER_RE.test(lines[0].trim())) {
        // Grouping rule: an embedded speaker line is emitted as its own row
        // immediately BEFORE the verse it introduces.
        groups.push({
          kind: 'EMBEDDED_SPEAKER',
          label: lines[0].trim().replace(/\s*।\s*$/, ''),
          beforeVerse: it.n,
        });
      }
      verses.push({ verse: it.n, sanskrit: it.text });
    }

    const numbers = verses.map((v) => v.verse);
    const expectedNumbers = [];
    for (let n = 1; n <= numbers.length; n += 1) expectedNumbers.push(n);
    const duplicates = numbers.filter((n, i) => numbers.indexOf(n) !== i);
    const gaps = expectedNumbers.filter((n) => !numbers.includes(n));

    const hindi = loadHindi(ch);
    sourceFiles.push(fileRecord(hindi.rel, `HINDI_ANUVADA_CHAPTER_${ch}`));

    const missingHindi = expectedNumbers.filter((n) => !hindi.verses.has(n));

    chapters.push({
      chapter: ch,
      sectionId: `gita-ch-${ch}`,
      sanskritName: info.name,
      englishName: info.en,
      expectedVerseNumbers: expectedNumbers,
      duplicateVerseNumbers: duplicates,
      missingVerseNumbers: gaps,
      expectedSpeakerRows: speakers.length + groups.length,
      speakerLabels: speakers.map((s) => s.label),
      embeddedSpeakerRows: groups,
      hindi: {
        source: hindi.rel,
        versesPresent: hindi.verses.size,
        speakerLines: hindi.speakers,
        missingVerseNumbers: missingHindi,
      },
      expectedRows: expectedNumbers.length + speakers.length + groups.length,
    });
  }

  const manifest = {
    schemaVersion: 1,
    bookId: 'bhagavad-gita',
    editionId: 'ct-gita-bundled-devanagari-hi-2026-08-31',
    displayName: 'श्रीमद्भगवद्गीता — bundled Devanagari mūla + Hindi anuvāda snapshot (gita_raw/)',
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/build-gita-edition-manifest.cjs',
    provenance: {
      kind: 'REPOSITORY_BUNDLED_SNAPSHOT',
      sourceFiles,
      publisher: null,
      printedEdition: null,
      editorOrTranslator: null,
      independentCollation: false,
      rightsStatus: 'UNKNOWN',
      notes: [
        'gita_raw/ contains no publisher, editor, edition-year or licence statement.',
        'Coverage against this manifest proves the stored corpus matches the bundled snapshot, not a printed edition.',
        'A printed/critical edition with clear display and audio rights is still required before claiming edition completeness.',
      ],
    },
    numbering: {
      convention: 'adhyāya + śloka number as numbered inside the bundled snapshot',
      chapters: chapters.length,
      numberedVerses: chapters.reduce((n, c) => n + c.expectedVerseNumbers.length, 0),
      recensionNote:
        'This snapshot numbers 701 ślokas (chapter 13 = 35, chapter 18 = 78). Recensions differ (commonly cited totals: 700). Do not force a universal count.',
      dhyanamNote:
        'The 9-row Gita Dhyanam in the library UI is paratext/invocation material and is NOT part of this snapshot; it is reported separately and remains unverified.',
    },
    groupingRules: [
      'A speaker label (… उवाच) is stored as its own row, not as a numbered śloka.',
      'When a snapshot verse begins with a speaker line, the generator emits the speaker row immediately before that verse row.',
      'Invocation/dhyanam rows are counted as invocation units, never as ślokas.',
    ],
    expected: {
      invocations: [
        {
          sectionId: 'gita-dhyanam',
          expectedRows: 9,
          inReferenceSnapshot: false,
          verificationStatus: 'PRESENT_NOT_IN_REFERENCE',
        },
      ],
      chapters,
    },
  };

  const body = JSON.stringify(manifest, null, 2);
  const text = `// GENERATED FILE — do not edit by hand.\n`
    + `// Source: gita_raw/gita.json + gita_raw/hi/*.txt (repository bundled snapshot).\n`
    + `// Regenerate with: node scripts/build-gita-edition-manifest.cjs\n`
    + `import type { EditionManifest } from '../../types';\n\n`
    + `const manifest: EditionManifest = ${body};\n\n`
    + `export default manifest;\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, text, 'utf8');

  const totalVerses = chapters.reduce((n, c) => n + c.expectedVerseNumbers.length, 0);
  const totalRows = chapters.reduce((n, c) => n + c.expectedRows, 0);
  console.log(
    JSON.stringify(
      {
        written: path.relative(ROOT, OUT).split(path.sep).join('/'),
        editionId: manifest.editionId,
        chapters: chapters.length,
        numberedVerses: totalVerses,
        expectedRowsExcludingDhyanam: totalRows,
        gaps: chapters.filter((c) => c.missingVerseNumbers.length).map((c) => c.chapter),
        duplicates: chapters.filter((c) => c.duplicateVerseNumbers.length).map((c) => c.chapter),
        missingHindi: chapters.filter((c) => c.hindi.missingVerseNumbers.length).map((c) => c.chapter),
      },
      null,
      2,
    ),
  );
}

main();

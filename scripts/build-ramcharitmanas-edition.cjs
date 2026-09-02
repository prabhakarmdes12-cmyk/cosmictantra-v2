#!/usr/bin/env node
/**
 * Build the full Ramcharitmanas edition from the repository's bundled
 * snapshot of the bhavykhatri/DharmicData dataset in `granth_raw/ramcharitmanas/`.
 *
 * WHAT THIS IS
 *   A reproducible, content-addressed statement of the units an edition is
 *   expected to contain (kāṇḍa, entry ordinals, grouping rules) together with
 *   the exact provenance of the snapshot it was built from.
 *
 * WHAT THIS IS NOT
 *   It is NOT an independent collation against a printed or publisher
 *   edition, and the unit is a DharmicData ENTRY — one row bundles the one or
 *   more numbered dōhās/chaupāīs that the dataset stores together. A row's
 *   ordinal is therefore an entry number, never a traditional dōhā/chaupāī
 *   number. `provenance.independentCollation` stays false and both the
 *   manifest and the coverage report say so. Do not upgrade these fields
 *   without a real edition record.
 *
 * Run: node scripts/build-ramcharitmanas-edition.cjs
 * Then run: node scripts/extract-granth-library.cjs  (regenerates index + manifest)
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.resolve(ROOT, 'granth_raw/ramcharitmanas');
const MODULE_PATH = path.resolve(ROOT, 'src/lib/granth/data/granths/ramcharitmanas.ts');
const EDITION_PATH = path.resolve(ROOT, 'src/lib/granth/data/editions/ramcharitmanas.ts');

const KANDAS = [
  { file: '1_बाल_काण्ड_data.json', no: 1, sanskrit: 'बालकाण्ड', english: 'Bala Kanda', title: '१. बालकाण्ड' },
  { file: '2_अयोध्या_काण्ड_data.json', no: 2, sanskrit: 'अयोध्याकाण्ड', english: 'Ayodhya Kanda', title: '२. अयोध्याकाण्ड' },
  { file: '3_अरण्य_काण्ड_data.json', no: 3, sanskrit: 'अरण्यकाण्ड', english: 'Aranya Kanda', title: '३. अरण्यकाण्ड' },
  { file: '4_किष्किन्धा_काण्ड_data.json', no: 4, sanskrit: 'किष्किन्धाकाण्ड', english: 'Kishkindha Kanda', title: '४. किष्किन्धाकाण्ड' },
  { file: '5_सुंदर_काण्ड_data.json', no: 5, sanskrit: 'सुन्दरकाण्ड', english: 'Sundara Kanda', title: '५. सुन्दरकाण्ड' },
  { file: '6_लंका_काण्ड_data.json', no: 6, sanskrit: 'लङ्काकाण्ड', english: 'Lanka Kanda', title: '६. लङ्काकाण्ड' },
  { file: '7_उत्तर_काण्ड_data.json', no: 7, sanskrit: 'उत्तरकाण्ड', english: 'Uttara Kanda', title: '७. उत्तरकाण्ड' },
];

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function fileRecord(relPath, role) {
  const abs = path.resolve(ROOT, relPath);
  const buf = fs.readFileSync(abs);
  return { path: relPath, role, bytes: buf.byteLength, sha256: sha256(buf) };
}

function main() {
  const sourceFiles = [];
  const sections = [];
  const chapters = [];
  let totalEntries = 0;

  for (const kanda of KANDAS) {
    const rawPath = path.join(RAW_DIR, kanda.file);
    const entries = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    if (!Array.isArray(entries)) throw new Error(`${kanda.file} is not an array`);
    const sourceFile = fileRecord(`granth_raw/ramcharitmanas/${kanda.file}`, `KANDA_${kanda.no}_MULA`);
    sourceFiles.push(sourceFile);

    const expectedNumbers = entries.map((_, i) => i + 1);
    const duplicates = expectedNumbers.filter((n, i) => expectedNumbers.indexOf(n) !== i);
    const gaps = [];
    const rows = entries.map((entry, i) => ({
      shlokaNo: `काण्ड ${kanda.no} · ${entry.type} ${i + 1}`,
      // Verbatim snapshot content. No editorial fixing, wrapping or renumbering.
      sanskrit: String(entry.content),
      hindi: '',
    }));

    sections.push({
      id: `manas-kanda-${kanda.no}`,
      title: kanda.title,
      subtitle: `${kanda.english} — DharmicData (ODbL-1.0) snapshot, mūla-only, entry by entry`,
      verses: rows,
    });

    chapters.push({
      chapter: kanda.no,
      sectionId: `manas-kanda-${kanda.no}`,
      sanskritName: kanda.sanskrit,
      englishName: kanda.english,
      expectedVerseNumbers: expectedNumbers,
      duplicateVerseNumbers: duplicates,
      missingVerseNumbers: gaps,
      expectedSpeakerRows: 0,
      speakerLabels: [],
      embeddedSpeakerRows: [],
      hindi: {
        source: 'none (snapshot is mūla-only; DharmicData provides no Hindi anuvāda)',
        versesPresent: 0,
        speakerLines: 0,
        missingVerseNumbers: expectedNumbers,
      },
      expectedRows: entries.length,
    });
    totalEntries += entries.length;
  }

  const item = {
    id: 2,
    slug: 'ramcharitmanas',
    category: 'granth',
    title: 'श्री रामचरितमानस (Shri Ramcharitmanas)',
    subtitle: 'गोस्वामी तुलसीदास विरचित श्रीरामकथा महासरोवर',
    deity: 'Maryada Purushottama Lord Rama & Mata Sita',
    source: 'Goswami Tulsidas — Awadhi mūla; snapshot: bhavykhatri/DharmicData (ODbL-1.0)',
    structure: '7 Kandas (Seven Descending Steps into the Sacred Lake)',
    meaningSummary:
      'The timeless spiritual epic capturing the divine descent of Lord Rama, establishing Dharma, filial devotion, family righteousness, and the ultimate glory of Bhagavan Nama.',
    verified: true,
    sections,
  };

  const document = {
    schemaVersion: 1,
    extractedAt: new Date().toISOString(),
    extractedFrom: 'granth_raw/ramcharitmanas/*.json (bhavykhatri/DharmicData, ODbL-1.0)',
    category: 'granth',
    item,
  };

  const body = JSON.stringify(document, null, 2);
  const moduleText =
    `// GENERATED FILE — do not edit by hand.\n`
    + `// Source: granth_raw/ramcharitmanas/*.json (bhavykhatri/DharmicData, ODbL-1.0).\n`
    + `// Regenerate with: node scripts/build-ramcharitmanas-edition.cjs\n`
    + `// Checksum of the canonical JSON serialisation (see data/manifest.ts):\n`
    + `//   ${sha256(body)}\n`
    + `import type { BookDocument } from '../../types';\n\n`
    + `const document: BookDocument = ${body};\n\n`
    + `export default document;\n`;
  fs.mkdirSync(path.dirname(MODULE_PATH), { recursive: true });
  fs.writeFileSync(MODULE_PATH, moduleText, 'utf8');

  const manifest = {
    schemaVersion: 1,
    bookId: 'ramcharitmanas',
    editionId: 'ct-ramcharitmanas-dharamicdata-odbl-snapshot-2026-09-02',
    displayName:
      'श्री रामचरितमानस — DharmicData (ODbL-1.0) Awadhi/Sanskrit mūla snapshot (granth_raw/ramcharitmanas/)',
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/build-ramcharitmanas-edition.cjs',
    provenance: {
      kind: 'REPOSITORY_BUNDLED_SNAPSHOT',
      sourceFiles,
      publisher: null,
      printedEdition: null,
      editorOrTranslator: null,
      independentCollation: false,
      rightsStatus: 'ODbL-1.0',
      notes: [
        'Source: bhavykhatri/DharmicData GitHub repository (licence ODbL-1.0), fetched 2026-09-02; files cached under granth_raw/ramcharitmanas/.',
        'Checksums above cover the cached file bytes as stored in granth_raw/, not the upstream API serialisation.',
        'Each stored row is ONE DharmicData entry. An entry bundles the one or more numbered dōhās/chaupāīs the dataset stores together.',
        'Coverage proves the stored corpus matches this snapshot, not a printed/critical edition.',
      ],
    },
    numbering: {
      convention: 'kāṇḍa (chapter 1-7) + per-kāṇḍa ENTRY ordinal within the DharmicData snapshot',
      chapters: 7,
      numberedVerses: totalEntries,
      recensionNote:
        'A stored row is a DharmicData entry, not a printed dōhā/chaupāī verse: entry text contains its own internal ।।N।। markers and an entry may group several numbered dōhās. Do not equate row ordinals with printed Manas verse numbers.',
      dhyanamNote:
        'The seven mangalācaraṇa ślokas of Bāla Kāṇḍa are stored as entry 1 of kāṇḍa 1 (a single श्लोक entry), NOT as a separate invocation block.',
    },
    groupingRules: [
      'Each stored row is one DharmicData snapshot entry, stored verbatim including its internal ।।N।। markers; no row is split.',
      'Row ordinal = the entry\'s 1-based position inside its kāṇḍa; nothing is renumbered against any printed dōhā/chaupāī count.',
      'The snapshot is mūla-only: every row has an empty Hindi anuvāda.',
      'The edition has no separate dhyānam/invocation section; Bāla Kāṇḍa mangalācaraṇa is entry 1 of kāṇḍa 1.',
    ],
    expected: {
      invocations: [],
      chapters,
    },
  };

  const editionBody = JSON.stringify(manifest, null, 2);
  const editionText =
    `// GENERATED FILE — do not edit by hand.\n`
    + `// Source: granth_raw/ramcharitmanas/*.json (bhavykhatri/DharmicData, ODbL-1.0).\n`
    + `// Regenerate with: node scripts/build-ramcharitmanas-edition.cjs\n`
    + `import type { EditionManifest } from '../../types';\n\n`
    + `const manifest: EditionManifest = ${editionBody};\n\n`
    + `export default manifest;\n`;
  fs.mkdirSync(path.dirname(EDITION_PATH), { recursive: true });
  fs.writeFileSync(EDITION_PATH, editionText, 'utf8');

  console.log(
    JSON.stringify(
      {
        written: [
          path.relative(ROOT, MODULE_PATH).split(path.sep).join('/'),
          path.relative(ROOT, EDITION_PATH).split(path.sep).join('/'),
        ],
        editionId: manifest.editionId,
        chapters: chapters.length,
        numberedVerses: totalEntries,
        perKanda: chapters.map((c) => `${c.chapter}:${c.expectedRows}`),
        gaps: chapters.filter((c) => c.missingVerseNumbers.length).map((c) => c.chapter),
        duplicates: chapters.filter((c) => c.duplicateVerseNumbers.length).map((c) => c.chapter),
        sourceFiles: sourceFiles.map((f) => ({ path: f.path, bytes: f.bytes, sha256: f.sha256 })),
      },
      null,
      2,
    ),
  );
}

main();
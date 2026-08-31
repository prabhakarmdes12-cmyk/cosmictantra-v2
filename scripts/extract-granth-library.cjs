#!/usr/bin/env node
/**
 * Extract the four scripture collections that live as TypeScript literals in
 * `src/app/aarti-stotra/page.tsx` into standalone, versioned TypeScript data
 * modules under `src/lib/granth/data/`.
 *
 * Emitted as .ts (not .json) on purpose: Node's ESM loader rejects JSON
 * without import attributes, and the Playwright suites load these modules
 * through ESM. Webpack/Next still code-split them per book.
 *
 * This is a STRUCTURAL EXTRACTION, not an edition upgrade:
 *   - No string value is edited, transliterated, re-wrapped or deduplicated.
 *   - Object key order is preserved (stable, reviewable diffs).
 *   - A SHA-256 checksum is recorded per emitted file plus a manifest at
 *     `src/lib/granth/data/manifest.json` so later edits are detectable.
 *
 * Run: node scripts/extract-granth-library.cjs
 * Verify: node scripts/audit-granth-inventory.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
// Default source is the library page. When the page has already been migrated
// to import the extracted modules, pass the pre-migration file (e.g. from
// `git show HEAD:src/app/aarti-stotra/page.tsx`) via GRANTH_PAGE_SOURCE.
const PAGE = process.env.GRANTH_PAGE_SOURCE
  ? path.resolve(process.env.GRANTH_PAGE_SOURCE)
  : path.resolve(ROOT, 'src/app/aarti-stotra/page.tsx');
const OUT_DIR = path.resolve(ROOT, 'src/lib/granth/data');
const GRANTH_DIR = path.join(OUT_DIR, 'granths');
const COLLECTION_DIR = path.join(OUT_DIR, 'collections');

const NOW = new Date().toISOString();
let MODULE_SOURCE = 'src/app/aarti-stotra/page.tsx';

/** TypeScript -> plain JS literal. Throws if a value is not a literal. */
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const p of node.properties) {
      if (!ts.isPropertyAssignment(p)) throw new Error('Non-literal scripture data in page.tsx');
      out[p.name.text] = literal(p.initializer);
    }
    return out;
  }
  throw new Error('Unsupported scripture initializer; audit manually');
}

function parseLiteralFile(file) {
  const source = fs.readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const d of statement.declarationList.declarations) {
      if (d.initializer && ts.isObjectLiteralExpression(d.initializer)) {
        return literal(d.initializer);
      }
    }
  }
  throw new Error(`No object literal found in ${file}`);
}

/**
 * Source of truth after extraction: the emitted data modules. Before the first
 * extraction: the TypeScript literals inside the library page.
 */
function readCollections() {
  const granthDir = path.join(OUT_DIR, 'granths');
  const collectionDir = path.join(OUT_DIR, 'collections');
  const moduleData = {};
  if (fs.existsSync(granthDir) && fs.existsSync(collectionDir)) {
    const granthFiles = fs.readdirSync(granthDir).filter((f) => f.endsWith('.ts'));
    const collectionFiles = fs.readdirSync(collectionDir).filter((f) => f.endsWith('.ts'));
    if (granthFiles.length && collectionFiles.length === 3) {
      moduleData.granthsData = granthFiles
        .sort((a, b) => {
          const ai = parseLiteralFile(path.join(granthDir, a)).item.id;
          const bi = parseLiteralFile(path.join(granthDir, b)).item.id;
          return ai - bi;
        })
        .map((f) => parseLiteralFile(path.join(granthDir, f)).item);
      for (const [name, file] of [
        ['stotrasData', 'stotras.ts'],
        ['aartisData', 'aartis.ts'],
        ['siddhaStutiData', 'siddha-stuti.ts'],
      ]) {
        moduleData[name] = parseLiteralFile(path.join(collectionDir, file)).items;
      }
      MODULE_SOURCE = 'src/lib/granth/data/*.ts (self-extraction)';
      return moduleData;
    }
  }

  const source = fs.readFileSync(PAGE, 'utf8');
  const tree = ts.createSourceFile(PAGE, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const wanted = ['granthsData', 'stotrasData', 'aartisData', 'siddhaStutiData'];
  const found = {};
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const d of statement.declarationList.declarations) {
      const name = d.name.getText(tree);
      if (!wanted.includes(name)) continue;
      if (!d.initializer) throw new Error(`${name} has no initializer`);
      found[name] = literal(d.initializer);
    }
  }
  const missing = wanted.filter((n) => !found[n]);
  if (missing.length) {
    throw new Error(
      `Collections not located (${missing.join(', ')}): neither the library page nor src/lib/granth/data has them.`,
    );
  }
  MODULE_SOURCE = 'src/app/aarti-stotra/page.tsx';
  return found;
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function writeDataModule(file, value, typeName, importPath) {
  const body = JSON.stringify(value, null, 2);
  const tsFile = `${file.replace(/\.json$/, '')}.ts`;
  const text = `// GENERATED FILE — do not edit by hand.\n`
    + `// Source: ${value.extractedFrom || value.generatedBy || 'src/app/aarti-stotra/page.tsx'}\n`
    + `// Regenerate with: node scripts/extract-granth-library.cjs\n`
    + `// Checksum of the canonical JSON serialisation (see data/manifest.ts):\n`
    + `//   ${sha256(body)}\n`
    + `import type { ${typeName} } from '${importPath}';\n\n`
    + `const document: ${typeName} = ${body};\n\n`
    + `export default document;\n`;
  fs.mkdirSync(path.dirname(tsFile), { recursive: true });
  fs.writeFileSync(tsFile, text, 'utf8');
  return {
    file: path.relative(ROOT, tsFile).split(path.sep).join('/'),
    sha256: sha256(body),
    bytes: Buffer.byteLength(body, 'utf8'),
  };
}

function summariseItem(item) {
  return {
    id: item.id,
    slug: item.slug,
    category: item.category,
    title: item.title,
    source: item.source,
    verified: item.verified === true,
    sections: (item.sections || []).map((s) => ({ id: s.id, rows: (s.verses || []).length })),
    rows: (item.sections || []).reduce((n, s) => n + (s.verses || []).length, 0),
  };
}

function main() {
  const data = readCollections();
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  const files = [];
  const granthFiles = {};

  for (const item of data.granthsData) {
    if (item.category !== 'granth') throw new Error(`Expected granth category, got ${item.category} for ${item.slug}`);
    const file = path.join(GRANTH_DIR, `${item.slug}.json`);
    const record = writeDataModule(file, {
      schemaVersion: 1,
      extractedAt: NOW,
      extractedFrom: MODULE_SOURCE,
      category: 'granth',
      item,
    }, 'BookDocument', '../../types');
    files.push(record);
    granthFiles[item.slug] = record;
  }

  for (const [name, items] of [
    ['stotras', data.stotrasData],
    ['aartis', data.aartisData],
    ['siddha-stuti', data.siddhaStutiData],
  ]) {
    const file = path.join(COLLECTION_DIR, `${name}.json`);
    const record = writeDataModule(file, {
      schemaVersion: 1,
      extractedAt: NOW,
      extractedFrom: MODULE_SOURCE,
      category: name,
      items,
    }, 'CollectionDocument', '../../types');
    files.push(record);
  }

  // Metadata-only index: lets the reader resolve a book/section without
  // loading passage text (kept small on purpose).
  const index = {
    schemaVersion: 1,
    generatedAt: NOW,
    generatedBy: 'scripts/extract-granth-library.cjs',
    sourceOfTruth: MODULE_SOURCE,
    granths: data.granthsData.map((item) => ({ ...summariseItem(item), dataFile: `granths/${item.slug}.json` })),
    collections: {
      stotras: { dataFile: 'collections/stotras.json', items: data.stotrasData.map(summariseItem) },
      aartis: { dataFile: 'collections/aartis.json', items: data.aartisData.map(summariseItem) },
      'siddha-stuti': { dataFile: 'collections/siddha-stuti.json', items: data.siddhaStutiData.map(summariseItem) },
    },
  };
  const indexRecord = writeDataModule(path.join(OUT_DIR, 'index.json'), index, 'DataIndex', '../types');

  const manifestRecord = writeDataModule(path.join(OUT_DIR, 'manifest.json'), {
    schemaVersion: 1,
    generatedAt: NOW,
    note: 'Extraction manifest. Checksums cover the emitted JSON, not an external edition.',
    files,
    index: indexRecord,
  }, 'ExtractionManifest', '../types');

  console.log(
    JSON.stringify(
      {
        note: 'Structural extraction from the library page; no text was edited.',
        granths: index.granths.map((g) => `${g.slug}: ${g.sections.length} sections / ${g.rows} rows`),
        collections: Object.fromEntries(
          Object.entries(index.collections).map(([k, v]) => [k, `${v.items.length} items / ${v.items.reduce((n, i) => n + i.rows, 0)} rows`]),
        ),
        manifest: manifestRecord.file,
      },
      null,
      2,
    ),
  );
}

main();

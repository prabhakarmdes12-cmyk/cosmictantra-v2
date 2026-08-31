/**
 * Structural inventory of the scripture collections.
 *
 * Historical note: this used to parse the TypeScript literals inside
 * `src/app/aarti-stotra/page.tsx`. Those literals have been extracted into
 * generated data modules under `src/lib/granth/data/`, so the inventory now
 * reads the generated metadata index (`data/index.ts`) and cross-checks it
 * against the extraction manifest checksums.
 *
 * It is a STRUCTURAL count of storage rows (verses, speaker labels,
 * invocation/paratext and grouped material). Row counts are NOT verse counts
 * and are NOT evidence of edition completeness — see
 * `docs/granth/COVERAGE-REPORT.md` for per-edition coverage.
 *
 * Run: node scripts/audit-granth-inventory.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.resolve(__dirname, '..');
const INDEX_FILE = path.resolve(ROOT, 'src/lib/granth/data/index.ts');
const MANIFEST_FILE = path.resolve(ROOT, 'src/lib/granth/data/manifest.ts');

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
      if (!ts.isPropertyAssignment(p)) throw new Error('Non-literal data in generated index');
      out[p.name.text] = literal(p.initializer);
    }
    return out;
  }
  throw new Error('Unsupported initializer in generated data; audit manually');
}

function parseLiteralModule(file) {
  const source = fs.readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const d of statement.declarationList.declarations) {
      if (d.initializer && ts.isObjectLiteralExpression(d.initializer)) return literal(d.initializer);
    }
  }
  throw new Error(`No object literal found in ${file}`);
}

const index = parseLiteralModule(INDEX_FILE);
const manifest = parseLiteralModule(MANIFEST_FILE);

const collections = [
  {
    name: 'granthsData',
    count: index.granths.length,
    items: index.granths.map((item) => ({
      slug: item.slug,
      sourceLabel: item.source,
      sections: item.sections.map((section) => ({ id: section.id, rows: section.rows })),
      rows: item.rows,
    })),
  },
  {
    name: 'stotrasData',
    count: index.collections.stotras.items.length,
    items: index.collections.stotras.items.map((item) => ({
      slug: item.slug,
      sourceLabel: item.source,
      sections: item.sections.map((section) => ({ id: section.id, rows: section.rows })),
      rows: item.rows,
    })),
  },
  {
    name: 'aartisData',
    count: index.collections.aartis.items.length,
    items: index.collections.aartis.items.map((item) => ({
      slug: item.slug,
      sourceLabel: item.source,
      sections: item.sections.map((section) => ({ id: section.id, rows: section.rows })),
      rows: item.rows,
    })),
  },
  {
    name: 'siddhaStutiData',
    count: index.collections['siddha-stuti'].items.length,
    items: index.collections['siddha-stuti'].items.map((item) => ({
      slug: item.slug,
      sourceLabel: item.source,
      sections: item.sections.map((section) => ({ id: section.id, rows: section.rows })),
      rows: item.rows,
    })),
  },
];

console.log(
  JSON.stringify(
    {
      note: 'Structural inventory, not edition/verse verification. Row counts include speaker/invocation/grouped rows.',
      source: {
        index: path.relative(ROOT, INDEX_FILE).split(path.sep).join('/'),
        generatedAt: index.generatedAt,
        generatedBy: index.generatedBy,
        sourceOfTruth: index.sourceOfTruth,
      },
      integrity: {
        manifestGeneratedAt: manifest.generatedAt,
        dataFiles: manifest.files.length,
        checksums: manifest.files.map((f) => `${f.file} ${f.sha256.slice(0, 12)}`),
      },
      collections,
    },
    null,
    2,
  ),
);

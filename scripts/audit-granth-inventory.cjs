// Structural inventory only; row counts do not establish edition completeness.
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
const file = path.resolve(__dirname, '../src/app/aarti-stotra/page.tsx');
const tree = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function literal(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(p => {
    if (!ts.isPropertyAssignment(p)) throw new Error('Non-literal scripture data');
    return [p.name.text, literal(p.initializer)];
  }));
  throw new Error('Unsupported scripture initializer; audit manually');
}
const names = ['granthsData', 'stotrasData', 'aartisData', 'siddhaStutiData'];
const collections = [];
for (const statement of tree.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const d of statement.declarationList.declarations) {
    if (!names.includes(d.name.getText(tree))) continue;
    const data = literal(d.initializer);
    collections.push({ name: d.name.getText(tree), count: data.length, items: data.map(item => ({
      slug: item.slug, sourceLabel: item.source,
      sections: item.sections.map(section => ({ id: section.id, rows: section.verses.length })),
      rows: item.sections.reduce((n, section) => n + section.verses.length, 0),
    })) });
  }
}
if (collections.length !== names.length) throw new Error('A collection was not located');
console.log(JSON.stringify({ note: 'Structural inventory, not edition/verse verification', collections }, null, 2));

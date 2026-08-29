#!/usr/bin/env node
/**
 * QUALIFICATION RUNNER (PROGRAM 1 / TRUST-01)
 * ===========================================
 * Load an external-reference dataset, run it through the Jyotish Qualification
 * Lab, and print an honest report + write a JSON artifact.
 *
 *   node scripts/qualify.mjs data/qualification/references.json
 *
 * If the dataset has zero external reference values, the runner says so plainly
 * — it never manufactures a passing result. Exit code is non-zero when the lab
 * finds a COSMICTANTRA_DEFECT or an unresolved mismatch, so this can gate CI once
 * real references exist.
 */

import fs from 'node:fs';
import path from 'node:path';
import { runCorpus, CLASSIFICATION } from '../src/lib/pro/qualificationLab.js';
import { validateReferenceDataset, datasetToCases, externalReferenceCount } from '../src/lib/pro/referenceLoader.js';

const file = process.argv[2] || 'data/qualification/references.json';
const abs = path.resolve(process.cwd(), file);

if (!fs.existsSync(abs)) {
  console.error(`No dataset at ${file}.`);
  console.error('Create one from data/qualification/references.template.json, then re-run.');
  process.exit(2);
}

let dataset;
try {
  dataset = JSON.parse(fs.readFileSync(abs, 'utf8'));
} catch (e) {
  console.error(`Could not parse ${file}: ${e.message}`);
  process.exit(2);
}

const { valid, errors, warnings } = validateReferenceDataset(dataset);
console.log(`\n=== Jyotish Qualification Run: ${dataset.datasetName || file} ===`);
if (warnings.length) { console.log('\nWarnings:'); warnings.forEach((w) => console.log('  • ' + w)); }
if (!valid) {
  console.error('\nDataset is INVALID:');
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(2);
}

const extRefs = externalReferenceCount(dataset);
const cases = datasetToCases(dataset);
const summary = runCorpus(cases);

console.log(`\nSubjects: ${dataset.subjects.length}`);
console.log(`External reference values supplied: ${extRefs}`);
console.log(`Cases run: ${summary.total}`);
console.log('\nClassification breakdown:');
for (const [k, v] of Object.entries(summary.byClassification)) {
  if (v > 0) console.log(`  ${k.padEnd(28)} ${v}`);
}

if (extRefs === 0) {
  console.log('\nHONEST STATUS: no external reference values supplied yet.');
  console.log('Nothing is scored as MATCH — capabilities remain IMPLEMENTED, not externally QUALIFIED.');
}

// Write artifact
const outDir = path.resolve(process.cwd(), 'data/qualification');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'last-run.json');
fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), dataset: dataset.datasetName || file, externalReferenceValues: extRefs, summary }, null, 2));
console.log(`\nArtifact written: ${path.relative(process.cwd(), outFile)}`);

// Gate: fail on genuine defects / unresolved mismatches (only possible once refs exist)
const defects = summary.byClassification[CLASSIFICATION.COSMICTANTRA_DEFECT] || 0;
const unresolved = summary.byClassification[CLASSIFICATION.UNRESOLVED] || 0;
if (defects > 0) {
  console.error(`\nFAIL: ${defects} COSMICTANTRA_DEFECT case(s) — engine disagrees with an external reference.`);
  process.exit(1);
}
if (unresolved > 0) {
  console.error(`\nATTENTION: ${unresolved} UNRESOLVED case(s) need human review (see ${path.relative(process.cwd(), outFile)}).`);
  process.exit(1);
}
console.log('\nOK.');
process.exit(0);

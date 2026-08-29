import { test, expect } from '@playwright/test';
import { runQualificationLab, QualificationSubject } from '../src/lib/jyotish/qualificationLab';
import fs from 'fs';
import path from 'path';

test.describe('TRUST-01: Independent Jyotish Qualification Lab (100-Subject Golden Corpus)', () => {

  test('Execute 100-Subject Automated Differential Qualification Lab', () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'golden-corpus-100.json');
    expect(fs.existsSync(fixturePath)).toBe(true);

    const subjects: QualificationSubject[] = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    expect(subjects.length).toBe(100);

    const report = runQualificationLab(subjects);

    console.log('\n=== JYOTISH QUALIFICATION LAB SUMMARY ===');
    console.log(`Total Subjects Evaluated: ${report.summary.totalSubjects}`);
    console.log(`Total Discrete Evaluations: ${report.summary.totalEvaluations}`);
    console.log(`Matched Assertions: ${report.summary.matchedCount}`);
    console.log(`Within Tolerance: ${report.summary.withinToleranceCount}`);
    console.log(`Defects: ${report.summary.defectCount}`);
    console.log(`Pass Rate: ${report.summary.passRatePercent}%`);
    console.log('==========================================\n');

    const defects = report.details.filter(d => d.classification === 'COSMICTANTRA_DEFECT');
    if (defects.length > 0) {
      console.log('--- DEFECTS ENCOUNTERED ---');
      defects.forEach(d => {
        console.log(`[${d.testId}] ${d.explanation} | Expected: ${JSON.stringify(d.expected)} | Actual: ${JSON.stringify(d.actual)}`);
      });
    }

    expect(report.summary.defectCount).toBe(0);
  });
});

import { test, expect } from '@playwright/test';
import { validateReferenceDataset, datasetToCases, externalReferenceCount } from '../src/lib/pro/referenceLoader.js';
import { runCorpus, CLASSIFICATION } from '../src/lib/pro/qualificationLab.js';

const BIRTH = { birthDate: '1995-06-15', birthTime: '10:30', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, place: 'Patna' };

function dataset(references: any[]) {
  return { datasetName: 't', recordedBy: 't', subjects: [{ subjectId: 'S1', birthInput: BIRTH, references }] };
}

test.describe('TRUST-01 intake — external reference loader (honest)', () => {
  test('validates required birth fields and known capability ids', () => {
    const bad = { subjects: [{ subjectId: 'X', birthInput: { birthDate: '1995-06-15' }, references: [{ capabilityId: 'not.a.capability', expected: 'Leo' }] }] };
    const res = validateReferenceDataset(bad as any);
    expect(res.valid).toBe(false);
    expect(res.errors.join(' ')).toContain('latitude');
    expect(res.errors.join(' ')).toContain('unknown capabilityId');
  });

  test('empty expected values are warned and kept PENDING, never scored', () => {
    const ds = dataset([{ capabilityId: 'lagna.sign', product: 'AstroSage', expected: '' }]);
    const res = validateReferenceDataset(ds);
    expect(res.valid).toBe(true);
    expect(res.warnings.join(' ')).toContain('empty expected');
    expect(externalReferenceCount(ds)).toBe(0);
    const summary: any = runCorpus(datasetToCases(ds));
    expect(summary.byClassification[CLASSIFICATION.PENDING_EXTERNAL_REFERENCE]).toBe(summary.total);
    expect(summary.byClassification[CLASSIFICATION.MATCH]).toBe(0);
  });

  test('a correct external value scores MATCH; a wrong one scores UNRESOLVED', () => {
    const ok = dataset([{ capabilityId: 'lagna.sign', product: 'Manual', settings: { ayanamsha: 'LAHIRI' }, expected: 'Leo', recordedBy: 't' }]);
    const okSummary: any = runCorpus(datasetToCases(ok));
    expect(okSummary.byClassification[CLASSIFICATION.MATCH]).toBe(1);

    const wrong = dataset([{ capabilityId: 'lagna.sign', product: 'Manual', settings: { ayanamsha: 'LAHIRI' }, expected: 'Aries', recordedBy: 't' }]);
    const wrongSummary: any = runCorpus(datasetToCases(wrong));
    expect(wrongSummary.byClassification[CLASSIFICATION.UNRESOLVED]).toBe(1);
    expect(wrongSummary.byClassification[CLASSIFICATION.MATCH]).toBe(0);
  });

  test('externalReferenceCount only counts genuine (non-empty) references', () => {
    const mixed = dataset([
      { capabilityId: 'lagna.sign', product: 'Manual', expected: 'Leo' },
      { capabilityId: 'moon.sign', product: 'Manual', expected: '' },
    ]);
    expect(externalReferenceCount(mixed)).toBe(1);
  });
});

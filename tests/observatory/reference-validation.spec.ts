import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const fixturePath = 'tests/observatory/fixtures/horizons-reference.json';
/** A fixture is deliberately generated outside test execution: Horizons is a reference, never an app runtime dependency. */
test('JPL Horizons reference fixture has provenance and immutable raw responses', () => {
  test.skip(!existsSync(fixturePath), 'Reference fixture must be generated in a networked release environment. This is a release gate, not a fallback to self-validation.');
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  expect(fixture.schemaVersion).toBe(1); expect(fixture.source.provider).toContain('JPL Horizons'); expect(fixture.cases.length).toBeGreaterThan(0);
  for (const referenceCase of fixture.cases) { expect(referenceCase.utcInstant).toMatch(/Z$/); expect(referenceCase.rawResult).toContain('$$SOE'); expect(referenceCase.rawResult).toContain('$$EOE'); }
});

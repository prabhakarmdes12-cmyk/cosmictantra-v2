import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { searchCities, findCityById, CITIES, DEFAULT_CITY } from '../src/lib/cities';
import {
  verifySingleCityResolverSource,
  CT_LOCATION_INV_001,
  CANONICAL_CITIES_MODULE_PATH,
  FORBIDDEN_DUPLICATE_CITIES_PATHS,
} from '../src/lib/invariants/locationResolver';

const ROOT = path.resolve(__dirname, '..');

test.describe('CT_LOCATION_INV_001 — Single Source Location Resolver & Ranking Regression', () => {

  test('invariant: canonical module exists and no duplicate cities module exists', () => {
    const result = verifySingleCityResolverSource(ROOT);
    expect(result.ok, `CT_LOCATION_INV_001 violations: ${result.violations.join('; ')}`).toBe(true);
    expect(result.violations).toHaveLength(0);

    // Explicit check: src/lib/cities.js must NOT exist
    const jsPath = path.join(ROOT, 'src/lib/cities.js');
    expect(fs.existsSync(jsPath), 'src/lib/cities.js must NOT exist in the repository').toBe(false);

    // Explicit check: src/lib/cities.ts must exist
    const tsPath = path.join(ROOT, CANONICAL_CITIES_MODULE_PATH);
    expect(fs.existsSync(tsPath), 'src/lib/cities.ts must exist as canonical source').toBe(true);
  });

  test('no source file imports from cities.js', () => {
    // Scan src directory for any stale import containing 'cities.js'
    const scanDir = (dir: string): string[] => {
      let badFiles: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
          badFiles = badFiles.concat(scanDir(full));
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          const content = fs.readFileSync(full, 'utf8');
          if (/(import\s+.*from\s+['"][^'"]*cities\.js['"]|require\s*\(\s*['"][^'"]*cities\.js['"]\))/m.test(content)) {
            badFiles.push(path.relative(ROOT, full));
          }
        }
      }
      return badFiles;
    };

    const staleImports = scanDir(path.join(ROOT, 'src'));
    expect(staleImports, `Found files importing cities.js: ${staleImports.join(', ')}`).toHaveLength(0);
  });

  test('exact match > substring match: Patna must rank above Machilipatnam and Visakhapatnam', () => {
    const results = searchCities('Patna');
    expect(results.length).toBeGreaterThanOrEqual(3);
    
    // First result must be exactly Patna
    expect(results[0].name).toBe('Patna');
    expect(results[0].id).toBe('patna');
    expect(results[0].state).toBe('Bihar');
    expect(results[0].lat).toBeCloseTo(25.5941, 3);
    expect(results[0].lng).toBeCloseTo(85.1376, 3);

    // Substring matches must appear AFTER exact match
    const names = results.map((c) => c.name);
    const patnaIdx = names.indexOf('Patna');
    const machiliIdx = names.indexOf('Machilipatnam');
    const visakhaIdx = names.indexOf('Visakhapatnam');

    expect(patnaIdx).toBe(0);
    expect(machiliIdx).toBeGreaterThan(patnaIdx);
    expect(visakhaIdx).toBeGreaterThan(patnaIdx);
  });

  test('exact match > substring match: Delhi must rank above New Delhi on exact query "Delhi"', () => {
    const results = searchCities('Delhi');
    expect(results.length).toBeGreaterThanOrEqual(2);

    expect(results[0].name).toBe('Delhi');
    const names = results.map((c) => c.name);
    const delhiIdx = names.indexOf('Delhi');
    const newDelhiIdx = names.indexOf('New Delhi');

    expect(delhiIdx).toBe(0);
    expect(newDelhiIdx).toBeGreaterThan(delhiIdx);
  });

  test('exact match: New Delhi must rank first on exact query "New Delhi"', () => {
    const results = searchCities('New Delhi');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toBe('New Delhi');
    expect(results[0].state).toBe('Delhi');
  });

  test('exact match: Varanasi must rank first on query "Varanasi"', () => {
    const results = searchCities('Varanasi');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toBe('Varanasi');
    expect(results[0].state).toBe('Uttar Pradesh');
    expect(results[0].lat).toBeCloseTo(25.3176, 3);
    expect(results[0].lng).toBeCloseTo(82.9739, 3);
  });

  test('prefix match > substring match: prefix queries rank before non-prefix substring matches', () => {
    // "Pat" as prefix: Patna, Pathankot should rank before Machilipatnam
    const results = searchCities('Pat');
    const names = results.map((c) => c.name);
    
    const patnaIdx = names.indexOf('Patna');
    const machiliIdx = names.indexOf('Machilipatnam');

    expect(patnaIdx).toBeGreaterThanOrEqual(0);
    if (machiliIdx !== -1) {
      expect(patnaIdx).toBeLessThan(machiliIdx);
    }
  });

  test('partial queries remain strictly deterministic across multiple runs', () => {
    const query = 'ban';
    const run1 = searchCities(query).map((c) => c.id);
    const run2 = searchCities(query).map((c) => c.id);
    const run3 = searchCities(query).map((c) => c.id);

    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
    expect(run1.length).toBeGreaterThan(0);
  });

  test('normalization: casing and whitespace produce deterministic ranking', () => {
    const r1 = searchCities('Patna');
    const r2 = searchCities('patna');
    const r3 = searchCities('  PATNA  ');

    expect(r1.map((c) => c.id)).toEqual(r2.map((c) => c.id));
    expect(r2.map((c) => c.id)).toEqual(r3.map((c) => c.id));
    expect(r1[0].name).toBe('Patna');
  });

  test('empty and whitespace queries return deterministic top slice without throwing', () => {
    const empty = searchCities('');
    const whitespace = searchCities('   ');

    expect(empty.length).toBe(30);
    expect(whitespace.length).toBe(30);
    expect(empty.map((c) => c.id)).toEqual(whitespace.map((c) => c.id));
  });

  test('findCityById returns exact city or fallback to DEFAULT_CITY', () => {
    const patna = findCityById('patna');
    expect(patna.name).toBe('Patna');

    const unknown = findCityById('non-existent-city-id-999');
    expect(unknown).toEqual(DEFAULT_CITY);
  });

  test('browser journey: searching "Patna" in Kundli intake ranks Patna as the first UI option', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    // Step through the hero intake flow
    await page.locator('#kundli-name').fill('Patna Verification Tester');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-dob').fill('1995-05-15');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.locator('#kundli-tob').fill('14:30');
    await page.getByRole('radio', { name: 'Exact' }).check({ force: true });
    await page.getByRole('button', { name: 'Next', exact: true }).click();

    // Type "Patna" into place input
    await page.locator('#kundli-place').fill('Patna');

    // Assert that the first recommendation is Patna, not Machilipatnam or Visakhapatnam
    const firstBtn = page.locator('#kundli-city-list button').first();
    await expect(firstBtn).toBeVisible({ timeout: 5000 });
    const text = await firstBtn.innerText();
    expect(text).toContain('Patna');
    expect(text).not.toContain('Machilipatnam');
    expect(text).not.toContain('Visakhapatnam');

    // Selecting it populates the input correctly
    await firstBtn.click();
    expect(await page.locator('#kundli-place').inputValue()).toContain('Patna');
  });
});


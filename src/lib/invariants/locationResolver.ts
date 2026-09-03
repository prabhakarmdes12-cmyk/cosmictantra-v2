/**
 * REPOSITORY INVARIANT: CT_LOCATION_INV_001 — SINGLE SOURCE LOCATION RESOLVER
 *
 * Invariant: Exactly ONE canonical implementation of the city database and resolver
 * exists in the repository (src/lib/cities.ts). Duplicate implementations or twins
 * (such as src/lib/cities.js) are strictly forbidden to prevent runtime divergence,
 * bundle confusion, and search ranking regression bugs (e.g., the Patna bug).
 */

import fs from 'fs';
import path from 'path';

export const CT_LOCATION_INV_001 = 'CT_LOCATION_INV_001';

export const CANONICAL_CITIES_MODULE_PATH = 'src/lib/cities.ts';
export const FORBIDDEN_DUPLICATE_CITIES_PATHS = [
  'src/lib/cities.js',
  'src/engines/cities.js',
  'src/engines/cities.ts',
] as const;

/**
 * Validates that the repository complies with CT_LOCATION_INV_001.
 * Throws or returns validation status.
 */
export function verifySingleCityResolverSource(rootDir?: string): { ok: boolean; violations: string[] } {
  const base = rootDir || process.cwd();
  const violations: string[] = [];

  const canonicalPath = path.join(base, CANONICAL_CITIES_MODULE_PATH);
  if (!fs.existsSync(canonicalPath)) {
    violations.push(`Canonical cities module missing: ${CANONICAL_CITIES_MODULE_PATH}`);
  }

  for (const forbidden of FORBIDDEN_DUPLICATE_CITIES_PATHS) {
    const fullPath = path.join(base, forbidden);
    if (fs.existsSync(fullPath)) {
      violations.push(`Forbidden duplicate cities module found: ${forbidden}. Delete this file.`);
    }
  }

  return {
    ok: violations.length === 0,
    violations,
  };
}

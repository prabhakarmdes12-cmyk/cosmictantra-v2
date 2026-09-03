/**
 * NAVIGATION INVARIANT VALIDATOR — CT_UX_INV_001 / CT_UX_INV_002.
 *
 * Run: `npx tsx scripts/validate-navigation.ts` (also invoked by the
 * navigation-hardening Playwright suite via a Node child process).
 *
 * CT_UX_INV_001 — NO PRIMARY OR SECONDARY NAVIGATION ITEM MAY LINK TO A ROUTE
 * THAT DOES NOT RESOLVE.
 *   - Every href in `navigationModel.ts` must match a real filesystem route
 *     under `src/app`.
 *   - Every literal `href="..."` in the layout layer (`src/components/layout/`,
 *     plus GlobalHeader/GlobalFooter) must resolve.
 *   - The four removed dead routes may appear ONLY in navigationMetadata.ts
 *     (documentation) and in this validator — never as a link.
 *
 * CT_UX_INV_002 — PRESENTATION COMPONENTS MAY NOT MANUFACTURE ASTROLOGICAL
 * FACTS.
 *   - EvidenceBackedPattern.tsx must not import any engine module, must not
 *     export evidence/template constants, and must not contain astrology
 *     literals (degrees, bhava, dasha, shadbala, ashtakavarga, planet rules).
 */

import * as fs from 'fs';
import * as path from 'path';
import { getAllNavigationHrefs, REMOVED_DEAD_ROUTES } from '../src/lib/navigation/navigationModel';
import { FUTURE_TECHNICAL_CAPABILITIES } from '../src/lib/navigation/navigationMetadata';

const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'src', 'app');
const LAYOUT_DIR = path.join(ROOT, 'src', 'components', 'layout');
const PRESENTATION_FILE = path.join(ROOT, 'src', 'components', 'kundli', 'EvidenceBackedPattern.tsx');
const METADATA_FILE = path.join(ROOT, 'src', 'lib', 'navigation', 'navigationMetadata.ts');

interface RoutePattern {
  url: string;
  segments: string[];
  dynamic: boolean;
}

interface Failure {
  rule: string;
  message: string;
}

const failures: Failure[] = [];
const pass = (rule: string, message: string) => console.log(`  ✓ [${rule}] ${message}`);
const fail = (rule: string, message: string) => {
  failures.push({ rule, message });
  console.error(`  ✗ [${rule}] ${message}`);
};

/* ------------------------------------------------------------------ */
/* 1. Filesystem route inventory (src/app page.tsx)                    */
/* ------------------------------------------------------------------ */

function collectRoutes(dir: string, prefix: string[]): RoutePattern[] {
  const out: RoutePattern[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'api') continue;
      out.push(...collectRoutes(full, [...prefix, entry.name]));
    } else if (entry.name === 'page.tsx') {
      // route groups ((...)) never appear in URLs
      const urlSegments = prefix.filter((s) => !s.startsWith('('));
      const dynamic = urlSegments.some((s) => s.startsWith('['));
      const url = '/' + urlSegments.map((s) => (s.startsWith('[') ? ':' + s.replace(/[\[\]]/g, '') : s)).join('/');
      out.push({ url, segments: urlSegments, dynamic });
    }
  }
  return out;
}

function inventory(): RoutePattern[] {
  return collectRoutes(APP_DIR, []);
}

function matches(pattern: RoutePattern, hrefSegments: string[]): boolean {
  const pSegs = pattern.segments;
  if (pattern.dynamic) {
    if (hrefSegments.length !== pSegs.length) return false;
    return pSegs.every((s, i) => s.startsWith('[') || s === hrefSegments[i]);
  }
  return pSegs.join('/') === hrefSegments.join('/');
}

function resolves(href: string, patterns: RoutePattern[]): boolean {
  const clean = href.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const segs = clean === '/' ? [] : clean.split('/').filter(Boolean);
  const candidates = patterns.filter(
    (p) => p.segments.length === segs.length || p.segments.length > segs.length,
  );
  return candidates.some((p) => matches(p, segs));
}

/* ------------------------------------------------------------------ */
/* 2. Model hrefs (CT_UX_INV_001)                                      */
/* ------------------------------------------------------------------ */

const routes = inventory();
console.log(`Route inventory: ${routes.length} page routes under src/app`);
if (routes.length === 0) fail('CT_UX_INV_001', 'No routes discovered — filesystem scan broken.');

for (const link of getAllNavigationHrefs()) {
  const ok = resolves(link.href, routes);
  if (ok) pass('CT_UX_INV_001', `${link.source} → ${link.href}`);
  else fail('CT_UX_INV_001', `${link.source} → ${link.href} does not resolve to any page under src/app.`);
}

/* ------------------------------------------------------------------ */
/* 3. Literal hrefs in the layout layer                                */
/* ------------------------------------------------------------------ */

const HREF_RE = /href\s*=\s*["'`]\/([^"'`\s]+)["'`]/g;
const WINDOW_LOC_RE = /window\.location\.href\s*=\s*["'`]\/([^"'`\s]+)["'`]/g;
const layoutFiles: string[] = [];
function walk(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|jsx)$/.test(entry.name)) layoutFiles.push(full);
  }
}
walk(LAYOUT_DIR);

for (const file of layoutFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const hrefs = [...source.matchAll(HREF_RE)].map((m) => '/' + m[1]);
  const windowHrefs = [...source.matchAll(WINDOW_LOC_RE)].map((m) => '/' + m[1]);
  for (const href of [...hrefs, ...windowHrefs]) {
    if (REMOVED_DEAD_ROUTES.includes(href as never)) {
      fail('CT_UX_INV_001', `${path.relative(ROOT, file)} links to removed dead route ${href}.`);
      continue;
    }
    if (!resolves(href, routes)) {
      fail('CT_UX_INV_001', `${path.relative(ROOT, file)} links to unverified route ${href}.`);
    } else {
      pass('CT_UX_INV_001', `${path.relative(ROOT, file)} → ${href}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 4. Dead-route placement (future capabilities are METADATA only)     */
/* ------------------------------------------------------------------ */

const deadRouteUses = new Set<string>();
for (const r of REMOVED_DEAD_ROUTES) {
  const files = walkSrcFor(r);
  for (const f of files) deadRouteUses.add(f);
  const allowed = [METADATA_FILE];
  const offenders = files.filter((f) => !allowed.some((a) => path.resolve(f) === path.resolve(a)));
  if (offenders.length === 0) pass('CT_UX_INV_001', `Dead route ${r} appears only in documented metadata.`);
  else fail('CT_UX_INV_001', `Dead route ${r} appears in: ${offenders.map((f) => path.relative(ROOT, f)).join(', ')}`);
}

function walkSrcFor(needle: string): string[] {
  const hits: string[] = [];
  const walkDir = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(full);
      else if (/(tsx?|jsx?)$/.test(entry.name)) {
        // navigationMetadata + the model's dead-route registry + this validator
        // are the only allowed documents (strings appear as registry entries,
        // never as hrefs — section 3 checks hrefs separately).
        const rel = path.relative(ROOT, full);
        if (
          rel.endsWith('navigationMetadata.ts') ||
          rel.endsWith('navigationModel.ts') ||
          rel.endsWith('validate-navigation.ts')
        ) continue;
        if (fs.readFileSync(full, 'utf8').includes(needle)) hits.push(full);
      }
    }
  };
  walkDir(path.join(ROOT, 'src'));
  return hits;
}

/* ------------------------------------------------------------------ */
/* 5. Future capability metadata must be non-clickable                 */
/* ------------------------------------------------------------------ */

for (const cap of FUTURE_TECHNICAL_CAPABILITIES) {
  if (cap.clickable !== false) {
    fail('CT_UX_INV_001', `Future capability ${cap.id} must be non-clickable metadata.`);
  } else {
    pass('CT_UX_INV_001', `Future capability ${cap.id} documented as non-clickable (${cap.routeHint}).`);
  }
}

/* ------------------------------------------------------------------ */
/* 6. CT_UX_INV_002 — presentation component purity                    */
/* ------------------------------------------------------------------ */

if (fs.existsSync(PRESENTATION_FILE)) {
  const src = fs.readFileSync(PRESENTATION_FILE, 'utf8');
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  const engineImports = stripped.match(/from\s+['"][^'"]*(jyotish|astrologyEngine|dashaEngine|panchang|astronomy|balaEngine|ashtakavargaEngine)[^'"]*['"]/gi);
  if (engineImports) fail('CT_UX_INV_002', `Presentation component imports engine modules: ${engineImports.join(', ')}`);
  else pass('CT_UX_INV_002', 'EvidenceBackedPattern has no engine imports.');

  const FORBIDDEN_LITERALS = /['"`][^'"`]*(Bhava|bhava|Shadbala|shadbala|Ashtakavarga|ashtakavarga|Digbala|digbala|°|Dasha|Yoga)[^'"`]*['"`]/g;
  const lit = stripped.match(FORBIDDEN_LITERALS);
  if (lit) {
    // Allow only the i18n keys / type labels (e.g. 'DASHA', 'structure', 'career') — report the rest
    const unsafe = lit.filter((l) => !/['"`](DASHA|CAREER|STRUCTURE|structured|unresolved|unavailable|pattern|context)['"`]/.test(l));
    if (unsafe.length > 0) fail('CT_UX_INV_002', `Presentation component contains astrology literals: ${unsafe.slice(0, 5).join(', ')}`);
    else pass('CT_UX_INV_002', 'Presentation component literals limited to declared type vocabulary.');
  } else {
    pass('CT_UX_INV_002', 'Presentation component contains no astrology literals.');
  }

  const templateExports = stripped.match(/export\s+(const|let|var)\s+(EVIDENCE|TEMPLATE|PATTERN_[A-Z]+)/g);
  if (templateExports) fail('CT_UX_INV_002', `Presentation component exports template data: ${templateExports.join(', ')}`);
  else pass('CT_UX_INV_002', 'Presentation component exports no evidence/template constants.');
} else {
  fail('CT_UX_INV_002', 'EvidenceBackedPattern.tsx missing.');
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

console.log(`\nNavigation validation: ${failures.length === 0 ? 'PASS' : 'FAIL'} (${failures.length} failure(s))`);
if (failures.length > 0) {
  process.exit(1);
}

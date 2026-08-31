/**
 * Render-time static assets (Devanagari font + Ganesh Vandana emblem).
 *
 * Browser path: the renderer fetches /fonts/*.ttf and /images/*.png through
 * the dev-server/browser network (works in the client-side pipeline).
 *
 * Node path: there is no server to fetch from (API routes run server-side,
 * tests run headless), so callers inject base64 assets read from disk.
 *
 * This module must stay importable from CLIENT bundles (the report page runs
 * the pipeline in the browser), so it performs NO top-level node: imports —
 * node builtins are obtained lazily via process.getBuiltinModule (Node >= 22),
 * which webpack cannot statically resolve and therefore never bundles.
 */

export interface KundliRenderAssets {
  /** Base64 of public/fonts/NotoSansDevanagari-Regular.ttf */
  devanagariRegularBase64?: string;
  /** Base64 of public/images/ganesh_vandana_256.png */
  ganesh256Base64?: string;
  /** Base64 of public/images/cosmictantra_symbol_256.png (symbol-only emblem) */
  cosmictantraSymbolBase64?: string;
}

function nodeModules() {
  if (typeof window !== 'undefined') return null;
  const proc = (globalThis as { process?: any }).process;
  if (!proc || typeof proc.getBuiltinModule !== 'function') return null;
  try {
    const fs = proc.getBuiltinModule('node:fs');
    const path = proc.getBuiltinModule('node:path');
    return { fs, path };
  } catch {
    return null;
  }
}

/**
 * Reads the Kundli render assets from the repository's public/ directory.
 * Returns {} when not running in Node (browser) or when files are absent —
 * the renderer then falls back to fetch (browser) or to text-only output.
 */
export function loadKundliRenderAssets(
  publicDir?: string,
): KundliRenderAssets {
  const m = nodeModules();
  if (!m) return {};
  const { fs, path } = m;
  const dir = publicDir ?? path.join(process.cwd(), 'public');

  const assets: KundliRenderAssets = {};

  const fontPath = path.join(dir, 'fonts', 'NotoSansDevanagari-Regular.ttf');
  if (fs.existsSync(fontPath)) {
    assets.devanagariRegularBase64 = fs.readFileSync(fontPath).toString('base64');
  }

  const ganeshPath = path.join(dir, 'images', 'ganesh_vandana_256.png');
  if (fs.existsSync(ganeshPath)) {
    assets.ganesh256Base64 = fs.readFileSync(ganeshPath).toString('base64');
  }

  const symbolPath = path.join(dir, 'images', 'cosmictantra_symbol_256.png');
  if (fs.existsSync(symbolPath)) {
    assets.cosmictantraSymbolBase64 = fs.readFileSync(symbolPath).toString('base64');
  }

  return assets;
}

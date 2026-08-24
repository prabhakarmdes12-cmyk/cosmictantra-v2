/**
 * CosmicTantra V34 — Re-export from Unified Canonical Astrology Engine
 * All calculations now delegate to src/lib/astrologyEngine.js to guarantee
 * 100% mathematical consistency across landing page and paid reports.
 */

export * from '../lib/astrologyEngine.js';
import engine from '../lib/astrologyEngine.js';
export default engine;

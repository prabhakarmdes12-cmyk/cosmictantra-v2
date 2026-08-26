/**
 * Deterministic faint-star texture for the local sky instrument.
 *
 * These points are a display layer only. They are deliberately not exposed as
 * selectable catalogue objects or used in any coordinate calculation. The
 * Observatory uses them to give a zoomed field the visual density of a real
 * sky while keeping the reviewed 70-star anchor catalogue and its provenance
 * boundary intact.
 */

export interface ContextStarRecord {
  id: string;
  /** Equatorial right ascension, decimal hours. */
  raHours: number;
  /** Equatorial declination, decimal degrees. */
  decDeg: number;
  /** Display-only teaching magnitude, not a photometric measurement. */
  magnitude: number;
  /** Display-only colour proxy. */
  bv: number;
}

const CONTEXT_STAR_COUNT = 900;
const UINT32_RANGE = 0x100000000;
const DEG = Math.PI / 180;

function makeContextStars(): readonly ContextStarRecord[] {
  let state = 0x6d2b79f5;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / UINT32_RANGE;
  };

  return Array.from({ length: CONTEXT_STAR_COUNT }, (_, index) => {
    const galacticLongitude = next() * 360 * DEG;
    const inGalacticPlane = next() < 0.68;
    const galacticLatitude = inGalacticPlane
      ? (next() * 2 - 1) * 8 * DEG
      : Math.asin(next() * 2 - 1);
    const cosLatitude = Math.cos(galacticLatitude);
    const galacticVector = {
      x: cosLatitude * Math.cos(galacticLongitude),
      y: cosLatitude * Math.sin(galacticLongitude),
      z: Math.sin(galacticLatitude),
    };
    // IAU J2000 galactic-to-equatorial rotation. This only gives the texture
    // a believable Milky Way orientation; it is not a catalogue lookup.
    const equatorialVector = {
      x: -0.0548755604 * galacticVector.x + 0.4941094279 * galacticVector.y - 0.8676661490 * galacticVector.z,
      y: -0.8734370902 * galacticVector.x - 0.4448296300 * galacticVector.y + 0.1980763734 * galacticVector.z,
      z: -0.4838350155 * galacticVector.x + 0.7469822445 * galacticVector.y - 0.4559837762 * galacticVector.z,
    };
    const raHours = (Math.atan2(equatorialVector.y, equatorialVector.x) / DEG + 360) % 360 / 15;
    const decDeg = Math.asin(Math.max(-1, Math.min(1, equatorialVector.z))) / DEG;
    const magnitude = 3.35 + next() * 2.65;
    const bv = -0.18 + next() * 1.9;
    return { id: `context-${index + 1}`, raHours, decDeg, magnitude, bv };
  });
}

export const CONTEXT_STARS = makeContextStars();

/**
 * Return progressively denser detail as the display camera moves in. The
 * thresholds are intentionally simple and stable so redraws never shimmer.
 */
export function contextStarsForZoom(scale: number): readonly ContextStarRecord[] {
  if (scale < 1.2) return [];
  if (scale < 1.7) return CONTEXT_STARS.slice(0, 220);
  if (scale < 2.5) return CONTEXT_STARS.slice(0, 560);
  return CONTEXT_STARS;
}

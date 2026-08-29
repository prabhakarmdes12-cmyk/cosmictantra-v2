/**
 * ACCESSIBILITY HELPERS (PROGRAM 15 / TRUST-09)
 * =============================================
 * Charts are visual; a screen-reader user needs an equivalent. chartAltTable()
 * turns any varga chart into a structured alt-table (planet → sign/house) plus a
 * concise text summary for aria-label / a visually-hidden fallback.
 */

/** Build an accessible alt-table for a varga/chart. */
export function chartAltTable(chart, title = 'Chart') {
  const planets = Array.isArray(chart.planets) ? chart.planets : Object.values(chart.planets || {});
  const rows = planets.map((p) => ({
    planet: p.name,
    sign: p.rashiEn || p.signName || p.rasiName || '—',
    house: p.house ?? '—',
    retro: p.isRetrograde ? 'retrograde' : 'direct',
  }));
  const summary = `${title}: ` + rows.map((r) => `${r.planet} in ${r.sign}, house ${r.house}`).join('; ') + '.';
  return {
    title,
    columns: ['Planet', 'Sign', 'House', 'Motion'],
    rows: rows.map((r) => [r.planet, r.sign, String(r.house), r.retro]),
    summary,
  };
}

/** Reduced-motion preference (safe on server). */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default { chartAltTable, prefersReducedMotion };

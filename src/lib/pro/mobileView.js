/**
 * MOBILE VIEW MODEL (PROGRAM 7 / TRUST-07)
 * ========================================
 * Purpose-built mobile experiences — NOT a shrunk desktop.
 *
 *   - Consumer mode: a small stack of digestible CARDS (identity, today,
 *     highlights, timeline glance, one thing to know) + drill-down targets.
 *   - Pandit companion mode: dense, scannable technical cards for quick
 *     reference at a consultation.
 *
 * Renderer-independent (same discipline as bookModel): this builds the data;
 * React lays it out with mobile-first components. Every value is a calculated
 * fact with a source — no generic filler.
 */

export const MOBILE_MODE = { CONSUMER: 'CONSUMER', PANDIT: 'PANDIT' };

function fact(label, value, source, drillTo) {
  return { label, value, source, drillTo: drillTo || null };
}

/** Consumer cards — friendly, few, drill-downable. */
function consumerCards(pro, nowISO) {
  const k = pro.kundali;
  const active = safe(() => pro.timelineActiveOn(nowISO)) || {};
  const cards = [];

  cards.push({
    id: 'identity', title: 'Your chart', kind: 'identity',
    items: [
      fact('Ascendant', `${k.lagna.rashiEn}`, 'D1 ascendant', 'Charts'),
      fact('Moon sign', k.moon.rashiEn, 'Moon longitude', 'Planets'),
      fact('Nakshatra', `${k.moon.nakshatra?.name} (pada ${k.moon.pada})`, 'Moon nakshatra', 'Nakshatra'),
    ],
  });

  cards.push({
    id: 'today', title: 'Right now', kind: 'today',
    items: [
      fact('Mahadasha', active.mahadasha?.lord || '—', 'Vimshottari', 'Timeline'),
      fact('Antardasha', active.antardasha?.lord || '—', 'Vimshottari', 'Timeline'),
      fact('Sade Sati', active.sadeSati ? active.sadeSati.phase : 'Not active', 'Saturn transit', 'Timeline'),
    ],
  });

  const yogas = safe(() => (pro.yogas?.detected || []).slice(0, 3)) || [];
  cards.push({
    id: 'highlights', title: 'Notable combinations', kind: 'list',
    items: yogas.length
      ? yogas.map((y) => fact(y.name, y.family, `${y.source}`, 'Yoga & Dosha'))
      : [fact('No major yogas detected', '', 'Yoga registry', 'Yoga & Dosha')],
  });

  return cards;
}

/** Pandit companion cards — dense technical reference. */
function panditCards(pro) {
  const k = pro.kundali;
  const cards = [];

  cards.push({
    id: 'grahas', title: 'Grahas', kind: 'table',
    columns: ['Planet', 'Sign', 'House', 'Nak', 'Dignity'],
    rows: k.planets.map((p) => [p.name, p.rashiEn, String(p.house), p.nakshatra?.name || '—', p.dignity || '—']),
  });

  cards.push({
    id: 'bhavas', title: 'Bhavas', kind: 'table',
    columns: ['H', 'Sign', 'Lord', 'Occupants'],
    rows: k.houses.map((h) => [String(h.number), h.rashiEn, h.lord, (h.planets || []).join(',') || '—']),
  });

  const active = safe(() => pro.timelineActiveOn(new Date().toISOString().slice(0, 10))) || {};
  cards.push({
    id: 'dasha', title: 'Running dasha', kind: 'kv',
    items: [
      fact('Maha', active.mahadasha?.lord || '—', 'Vimshottari'),
      fact('Antar', active.antardasha?.lord || '—', 'Vimshottari'),
      fact('Pratyantar', active.pratyantardasha?.lord || '—', 'Vimshottari'),
    ],
  });

  return cards;
}

export function buildMobileView(pro, mode = MOBILE_MODE.CONSUMER, opts = {}) {
  const nowISO = opts.now || new Date().toISOString().slice(0, 10);
  const cards = mode === MOBILE_MODE.PANDIT ? panditCards(pro) : consumerCards(pro, nowISO);
  return {
    mode,
    cards,
    // Drill-down targets map to Living Kundli sections.
    drillTargets: [...new Set(cards.flatMap((c) => (c.items || []).map((i) => i.drillTo).filter(Boolean)))],
    provenance: { deterministic: true, versions: pro.versions },
  };
}

function safe(fn) { try { return fn(); } catch { return null; } }

export default { MOBILE_MODE, buildMobileView };

/**
 * Ecliptic Instrument — planisphere view of the zodiac circle.
 * Route: /observatory/ecliptic
 *
 * Top-down view of the ecliptic plane from above the North Ecliptic Pole.
 * Aries (0° tropical) at top, degrees increasing clockwise.
 *
 * Astronomy: astronomy-engine tropical ecliptic longitude (Ecliptic()).
 * Jyotish: canonical engine sidereal (Lahiri), shown as labeled ring + inspector.
 *
 * Renderer never generates Jyotish truth. Each output is independently labeled.
 */
import type { Metadata } from 'next';
import EclipticInstrument from '@/components/observatory/EclipticInstrument';

export const metadata: Metadata = {
  title: 'Ecliptic Instrument · काशी आकाश वेधशाला · CosmicTantra Observatory',
  description: 'Planisphere view of the ecliptic zodiac — all planets plotted by tropical longitude. Astronomy + Jyotish layers, separately labeled.',
};

export default function EclipticPage() {
  return <EclipticInstrument />;
}

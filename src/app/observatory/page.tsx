/**
 * Observatory page — /observatory
 *
 * Accepts optional URL parameters for deep-linking:
 *   ?time=2026-08-26T02:41:32.000Z
 *   &city=dhanbad
 *   &planet=moon
 *
 * If not provided, defaults to NOW at Dhanbad.
 */
import type { Metadata } from 'next';
import ObservatoryExperience from '@/components/observatory/ObservatoryExperience';

export const metadata: Metadata = {
  title: 'CosmicTantra Observatory · काशी आकाश वेधशाला',
  description: 'Inspectable astronomical and Lahiri sidereal instrument. Real sky projection, ecliptic planisphere, birth-to-now time machine, and gochara transit report.',
};

export default function ObservatoryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Extract deep-link params from URL
  const timeParam = typeof searchParams.time === 'string' ? searchParams.time : undefined;
  const cityParam = typeof searchParams.city === 'string' ? searchParams.city : undefined;
  const planetParam = typeof searchParams.planet === 'string' ? searchParams.planet : undefined;

  return (
    <ObservatoryExperience
      deepLinkTime={timeParam}
      deepLinkCity={cityParam}
      deepLinkPlanet={planetParam}
    />
  );
}

/**
 * Time Machine — /observatory/timemachine
 *
 * Birth-to-now sky slider. Reconstructs the sky at any past moment.
 * Planetary transit table shows which rashis each planet occupied
 * at birth vs now.
 *
 * Astronomy: astronomy-engine (MIT). Jyotish: canonical engine.
 * No LLM generates coordinates. No birth data leaves the client.
 *
 * Precision policy: display resolution ≠ accuracy claim.
 */
import type { Metadata } from 'next';
import TimeMachine from '@/components/observatory/TimeMachine';

export const metadata: Metadata = {
  title: 'Time Machine · काल यन्त्र · CosmicTantra Observatory',
  description: 'Birth-to-now sky slider. Reconstructs the sky at any past moment. Tracks planetary rashis from birth to present.',
};

export default function TimeMachinePage() {
  return <TimeMachine />;
}

/**
 * Gochara — Planetary Transit Report. Route: /observatory/gochara
 *
 * Shows birth chart vs current transit rashi wheels side-by-side.
 * Highlights which rashis each planet has transited since birth.
 * Includes Rahu and Ketu (derived from Moon's sidereal longitude).
 *
 * Astronomy: astronomy-engine (MIT). Jyotish: canonical engine.
 * No LLM generates positions. No birth data leaves the client.
 *
 * Precision policy: display resolution ≠ accuracy claim.
 */
import type { Metadata } from 'next';
import Gochara from '@/components/observatory/Gochara';

export const metadata: Metadata = {
  title: 'Gochara · गोचर · CosmicTantra Observatory',
  description: 'Planetary transit report: birth chart vs current rashi positions. Tracks which rashis each planet has transited since birth.',
};

export default function GocharaPage() {
  return <Gochara />;
}

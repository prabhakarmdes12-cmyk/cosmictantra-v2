import type { Metadata } from 'next';
import TimeMachine from '@/components/observatory/TimeMachine';
import { parseCelestialSelection } from '@/lib/astronomy/celestialCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sky Time Machine — Birth to Now Transit Trace',
  description: 'Scrub a deterministic local sky from a birth date and time to today, with sidereal rashi change detection for every graha.',
  alternates: { canonical: '/observatory/timemachine' },
};

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function validIso(value?: string): string { const date = value ? new Date(value) : new Date(); return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString(); }

export default function TimeMachinePage({ searchParams }: { searchParams: SearchParams }) {
  const initialSelection = parseCelestialSelection(first(searchParams?.object), first(searchParams?.objectKind));
  return <TimeMachine initialCity={first(searchParams?.city)} initialTime={validIso(first(searchParams?.time))} initialPlanet={first(searchParams?.planet)} initialSelection={initialSelection} />;
}

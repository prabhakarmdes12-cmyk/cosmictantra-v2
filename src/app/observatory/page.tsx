import type { Metadata } from 'next';
import ObservatoryExperience from '@/components/observatory/ObservatoryExperience';
import { parseCelestialSelection } from '@/lib/astronomy/celestialCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Observatory — Local Sidereal Sky & Vedic Grahas',
  description: 'Explore a transparent stereographic night-sky projection with bright stars, constellation lines, seven visible grahas, the ecliptic and a 27-Nakshatra mandala.',
  alternates: { canonical: '/observatory' },
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function validIso(value?: string): string {
  const date = value ? new Date(value) : new Date();
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

export default function ObservatoryPage({ searchParams }: { searchParams: SearchParams }) {
  const initialSelection = parseCelestialSelection(first(searchParams?.object), first(searchParams?.objectKind));
  return <ObservatoryExperience initialCity={first(searchParams?.city)} initialTime={validIso(first(searchParams?.time))} initialPlanet={first(searchParams?.planet)} initialSelection={initialSelection} />;
}

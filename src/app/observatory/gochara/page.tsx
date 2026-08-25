import type { Metadata } from 'next';
import Gochara from '@/components/observatory/Gochara';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Gochara — Natal & Current Rashi Transit Wheels',
  description: 'Compare birth and current sidereal rashi wheels for all nine grahas, including Rahu and Ketu, with change indicators and a Moon-reference transit panel.',
  alternates: { canonical: '/observatory/gochara' },
};

type SearchParams = Record<string, string | string[] | undefined>;
function first(value: string | string[] | undefined): string | undefined { return Array.isArray(value) ? value[0] : value; }
function validIso(value?: string): string { const date = value ? new Date(value) : new Date(); return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString(); }

export default function GocharaPage({ searchParams }: { searchParams: SearchParams }) {
  return <Gochara initialCity={first(searchParams?.city)} initialTime={validIso(first(searchParams?.time))} initialPlanet={first(searchParams?.planet)} />;
}

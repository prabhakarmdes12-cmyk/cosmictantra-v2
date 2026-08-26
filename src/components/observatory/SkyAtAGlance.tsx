'use client';

import { Compass, Copy, Eye, Sunrise } from 'lucide-react';
import { useMemo, useState } from 'react';
import { calculateCanonicalBodies, type CanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import { getRashiForLongitude } from '@/lib/astronomy/eclipticProjection';
import { equatorialToHorizontal, type ObserverLocation } from '@/lib/astronomy/projection';
import { altitudeBand } from '@/lib/astronomy/observation';
import type { CelestialSelection } from '@/lib/astronomy/celestialCatalog';

const OBSERVABLE_BODIES: CanonicalBodyName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
const SYMBOLS: Record<CanonicalBodyName, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
};
const BODY_COLORS: Record<CanonicalBodyName, string> = {
  Sun: '#F2B84B', Moon: '#E6EEF8', Mars: '#E2745A', Mercury: '#86C7B8', Jupiter: '#D8A16B', Venus: '#F5B7D2', Saturn: '#AFA6D9', Rahu: '#B38BEA', Ketu: '#E19A72',
};
const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

interface SkyRow {
  body: CanonicalBody;
  altitudeDeg: number;
  azimuthDeg: number;
  direction: string;
  visible: boolean;
  twilight: boolean;
  altitudeBand: ReturnType<typeof altitudeBand>;
  rashi: ReturnType<typeof getRashiForLongitude>;
}

export interface SkyAtAGlanceProps {
  date: Date | string;
  observer: ObserverLocation;
  selectedPlanet?: string | null;
  onSelectObject?: (selection: CelestialSelection) => void;
}

function parseDate(value: Date | string): Date {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function directionForAzimuth(azimuthDeg: number): string {
  return COMPASS_POINTS[Math.round(azimuthDeg / 22.5) % COMPASS_POINTS.length];
}

function altitudeLabel(altitudeDeg: number): string {
  return `${altitudeDeg >= 0 ? '+' : ''}${altitudeDeg.toFixed(1)}°`;
}

function statusFor(row: SkyRow): string {
  if (row.visible) return 'above horizon';
  if (row.twilight) return 'near horizon';
  return 'below horizon';
}

function statusColor(row: SkyRow): string {
  if (row.visible) return 'text-[#91C7A5]';
  if (row.twilight) return 'text-[#F2C65D]';
  return 'text-[#7F89A7]';
}

export default function SkyAtAGlance({ date, observer, selectedPlanet, onSelectObject }: SkyAtAGlanceProps) {
  const dateValue = date instanceof Date ? date.toISOString() : date;
  const rows = useMemo<SkyRow[]>(() => {
    const instant = parseDate(dateValue);
    const bodies = calculateCanonicalBodies(instant);
    return OBSERVABLE_BODIES
      .map(name => bodies.find(body => body.body === name))
      .filter((body): body is CanonicalBody => Boolean(body))
      .map(body => {
        const horizontal = equatorialToHorizontal(
          { raHours: body.rightAscensionHours, decDeg: body.declinationDeg },
          instant,
          observer,
        );
        return {
          body,
          altitudeDeg: horizontal.altitudeDeg,
          azimuthDeg: horizontal.azimuthDeg,
          direction: directionForAzimuth(horizontal.azimuthDeg),
          visible: horizontal.altitudeDeg >= 0,
          twilight: horizontal.altitudeDeg >= -6,
          altitudeBand: altitudeBand(horizontal.altitudeDeg),
          rashi: getRashiForLongitude(body.siderealLongitude),
        };
      })
      .sort((left, right) => Number(right.visible) - Number(left.visible) || right.altitudeDeg - left.altitudeDeg);
  }, [dateValue, observer.latitude, observer.longitude]);

  const visibleRows = rows.filter(row => row.visible);
  const bestPlaced = visibleRows[0];
  const [copied, setCopied] = useState(false);

  const copyReadout = async () => {
    if (!navigator.clipboard) return;
    const instant = parseDate(dateValue);
    const lines = [
      `CosmicTantra sky readout · ${instant.toISOString()}`,
      `Observer: ${observer.latitude.toFixed(4)}°, ${observer.longitude.toFixed(4)}°`,
      ...rows.map(row => `${row.body.body}: ${statusFor(row)}, altitude ${altitudeLabel(row.altitudeDeg)}, azimuth ${row.azimuthDeg.toFixed(1)}° (${row.direction}), ${row.rashi.name}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard access can be unavailable in embedded or insecure contexts.
    }
  };

  return (
    <section aria-labelledby="sky-at-a-glance-title" className="rounded-2xl border border-[#D4AF37]/25 bg-[#0A0F1E] p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]"><Eye className="h-3.5 w-3.5" /> Practical sky readout</div>
          <h2 id="sky-at-a-glance-title" className="mt-1 font-editorial text-2xl font-bold text-[#F5F0E5]">Sky at a glance</h2>
          <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-[#8F99B5]">Seven physical grahas ranked by what an observer can use right now. Select a card to open its full field note.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div className="rounded-xl border border-white/[0.08] bg-[#070A14] px-3 py-2 text-right font-mono-data text-[10px]">
            <div className="text-[#F2C65D]">{visibleRows.length} / {rows.length} above horizon</div>
            <div className="mt-1 text-[#7F89A7]">true north · mathematical horizon</div>
          </div>
          <button type="button" onClick={copyReadout} aria-live="polite" className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 font-mono-data text-[10px] font-bold text-[#C9D0E5] transition-colors hover:border-[#D4AF37]/60 hover:text-[#F2C65D]"><Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy readout'}</button>
        </div>
      </div>

      {bestPlaced ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#91C7A5]/20 bg-[#102019] px-3 py-2 text-[10px] text-[#B8D7BF]">
          <Sunrise className="h-3.5 w-3.5 shrink-0 text-[#91C7A5]" />
          <span><strong className="text-[#D8F0DC]">Best placed now:</strong> {bestPlaced.body.body} at {altitudeLabel(bestPlaced.altitudeDeg)} altitude toward {bestPlaced.direction}.</span>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#070A14] px-3 py-2 text-[10px] text-[#929CB8]">
          <Compass className="h-3.5 w-3.5 shrink-0" /> No listed graha is above the mathematical horizon at this instant.
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(row => {
          const isSelected = row.body.body === selectedPlanet;
          return (
            <button
              type="button"
              key={row.body.body}
              onClick={() => onSelectObject?.({ kind: 'planet', id: row.body.body })}
              aria-label={`Open ${row.body.body} details; ${statusFor(row)}, altitude ${altitudeLabel(row.altitudeDeg)}, azimuth ${row.azimuthDeg.toFixed(1)} degrees`}
              className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2C65D] ${isSelected ? 'border-[#D4AF37]/75 bg-[#D4AF37]/10' : 'border-white/[0.08] bg-[#070A14] hover:border-[#D4AF37]/55'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-lg" style={{ color: BODY_COLORS[row.body.body] }}>{SYMBOLS[row.body.body]}</span><span className="font-mono-data text-[10px] font-bold text-[#E0E4F1]">{row.body.body}</span></span>
                <span className={`font-mono-data text-[9px] font-bold uppercase ${statusColor(row)}`}>{statusFor(row)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono-data text-[10px]">
                <span className="text-[#7F89A7]">Altitude</span><span className="text-right text-[#E0E4F1]">{altitudeLabel(row.altitudeDeg)}</span>
                <span className="text-[#7F89A7]">Direction</span><span className="text-right text-[#F2C65D]">{row.direction} · {row.azimuthDeg.toFixed(0)}°</span>
                <span className="text-[#7F89A7]">Sky band</span><span className="text-right capitalize text-[#C9D0E5]">{row.altitudeBand}</span>
                <span className="text-[#7F89A7]">Sidereal</span><span className="truncate text-right text-[#C9D0E5]">{row.rashi.glyph} {row.rashi.name}</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mt-4 flex items-start gap-1.5 font-mono-data text-[9px] leading-relaxed text-[#707A98]"><Compass className="mt-0.5 h-3 w-3 shrink-0" /> Altitude is measured from the mathematical horizon and azimuth clockwise from true north. Clouds, terrain, atmospheric refraction, and light pollution are not modeled.</p>
    </section>
  );
}

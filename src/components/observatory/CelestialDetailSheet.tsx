'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import CelestialArtwork from './CelestialArtwork';
import { calculateCanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import { getCelestialDetail, constellationDisplayName, type CelestialSelection } from '@/lib/astronomy/celestialCatalog';
import { getNakshatraForLongitude, getRashiForLongitude } from '@/lib/astronomy/eclipticProjection';
import { equatorialToHorizontal, projectStar, type ObserverLocation } from '@/lib/astronomy/projection';
import { STARS } from '@/lib/astronomy/stars';

export interface CelestialDetailSheetProps {
  selection: CelestialSelection;
  date: string | Date;
  observer: ObserverLocation;
  cityId?: string;
  onClose: () => void;
}

const SYMBOLS: Record<string, string> = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };

function validDate(value: string | Date): Date {
  const result = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(result.getTime()) ? result : new Date();
}

function longitude(value: number): string {
  const degrees = Math.floor(value);
  const minutes = Math.floor((value - degrees) * 60);
  return `${String(degrees).padStart(3, '0')}° ${String(minutes).padStart(2, '0')}′`;
}

export default function CelestialDetailSheet({ selection, date, observer, cityId = 'varanasi', onClose }: CelestialDetailSheetProps) {
  const detail = getCelestialDetail(selection);
  const dateValue = validDate(date);
  const body = selection.kind === 'planet' ? calculateCanonicalBody(selection.id as CanonicalBodyName, dateValue) : null;
  const visibleStars = selection.kind === 'constellation' ? STARS.filter(star => star.constellation === selection.id).map(star => ({ star, point: projectStar(star, dateValue, observer, 600, 600) })).filter(item => item.point.visible) : [];
  const highestStar = visibleStars.reduce((highest, item) => !highest || item.point.altitudeDeg > highest.point.altitudeDeg ? item : highest, null as (typeof visibleStars[number] | null));
  const skyPosition = body ? equatorialToHorizontal({ raHours: body.rightAscensionHours, decDeg: body.declinationDeg }, dateValue, observer) : null;
  const query = `city=${encodeURIComponent(cityId)}&time=${encodeURIComponent(dateValue.toISOString())}${selection.kind === 'planet' ? `&planet=${encodeURIComponent(selection.id)}` : ''}`;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#010208]/75 p-0 backdrop-blur-sm sm:items-stretch sm:justify-end" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="celestial-detail-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#080B16] text-[#ECEAF1] shadow-2xl sm:h-full sm:max-h-none sm:rounded-none sm:rounded-l-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#080B16]/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Celestial field notes</div>
          <button type="button" onClick={onClose} aria-label="Close celestial detail" className="rounded-full border border-white/10 px-3 py-1.5 font-mono-data text-[10px] font-bold uppercase tracking-wider text-[#CBD1E3] hover:border-[#D4AF37] hover:text-[#F2C65D]">Close ×</button>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          <CelestialArtwork selection={selection} />
          <header>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-2xl text-[#F2C65D]">{body ? SYMBOLS[body.body] : '✦'}</span>
              <div><div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: detail.accent }}>{detail.eyebrow}</div><h2 id="celestial-detail-title" className="mt-1 font-editorial text-3xl font-bold text-[#F8F3E7]">{detail.displayName}</h2>{detail.sanskritName && <div className="mt-1 font-mono-data text-xs text-[#AEB6D0]">{detail.sanskritName} · {detail.symbol}</div>}</div>
            </div>
          </header>

          {body ? (
            <>
              <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Tropical</div><div className="mt-1 font-mono-data text-sm font-bold text-[#E3E7F5]">{longitude(body.tropicalLongitude)}</div></div>
                <div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Sidereal</div><div className="mt-1 font-mono-data text-sm font-bold text-[#F2C65D]">{longitude(body.siderealLongitude)}</div></div>
                <div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Altitude</div><div className="mt-1 font-mono-data text-sm font-bold text-[#E3E7F5]">{skyPosition ? `${skyPosition.altitudeDeg.toFixed(1)}°` : '—'}</div></div>
                <div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Azimuth</div><div className="mt-1 font-mono-data text-sm font-bold text-[#E3E7F5]">{skyPosition ? `${skyPosition.azimuthDeg.toFixed(1)}°` : '—'}</div></div>
              </section>
              <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#0D1222] p-4"><div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">Coordinate reading</div><dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3 text-xs"><div><dt className="text-[#8993B0]">Rashi</dt><dd className="mt-1 font-bold text-[#E4E8F5]">{getRashiForLongitude(body.siderealLongitude).glyph} {getRashiForLongitude(body.siderealLongitude).name}</dd></div><div><dt className="text-[#8993B0]">Nakshatra</dt><dd className="mt-1 font-bold text-[#E4E8F5]">{getNakshatraForLongitude(body.siderealLongitude).name} · Pada {getNakshatraForLongitude(body.siderealLongitude).pada}</dd></div><div><dt className="text-[#8993B0]">Right ascension</dt><dd className="mt-1 font-mono-data text-[#C9D0E5]">{body.rightAscensionHours.toFixed(3)}h</dd></div><div><dt className="text-[#8993B0]">Declination</dt><dd className="mt-1 font-mono-data text-[#C9D0E5]">{body.declinationDeg.toFixed(2)}°</dd></div><div><dt className="text-[#8993B0]">Motion</dt><dd className="mt-1 font-bold text-[#C9D0E5]">{body.isRetrograde ? 'Retrograde' : 'Direct'}</dd></div><div><dt className="text-[#8993B0]">Model</dt><dd className="mt-1 font-mono-data text-[10px] text-[#C9D0E5]">{body.source}</dd></div></dl></section>
            </>
          ) : (
            <section className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Visible anchors</div><div className="mt-1 font-mono-data text-lg font-bold text-[#F2C65D]">{visibleStars.length}</div></div><div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Peak altitude</div><div className="mt-1 font-mono-data text-lg font-bold text-[#E3E7F5]">{highestStar ? `${highestStar.point.altitudeDeg.toFixed(1)}°` : 'Below horizon'}</div></div><div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Anchor latitude</div><div className="mt-1 font-mono-data text-lg font-bold text-[#E3E7F5]">{observer.latitude.toFixed(1)}°</div></div><div className="rounded-xl border border-white/[0.08] bg-[#0D1222] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#8993B0]">Pattern</div><div className="mt-1 font-mono-data text-sm font-bold text-[#E3E7F5]">{selection.id}</div></div></section>
          )}

          <section className="space-y-4"><div><h3 className="font-editorial text-xl font-bold text-[#F4F0E6]">Astronomy</h3><p className="mt-2 text-sm leading-relaxed text-[#B0B7CD]">{detail.astronomy}</p></div>{detail.story && <div><h3 className="font-editorial text-xl font-bold text-[#F4F0E6]">The pattern</h3><p className="mt-2 text-sm leading-relaxed text-[#B0B7CD]">{detail.story}</p></div>}{detail.vedicLens && <div className="rounded-2xl border border-[#8B8BF5]/25 bg-[#111735] p-4"><h3 className="font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8B9FF]">Vedic lens</h3><p className="mt-2 text-sm leading-relaxed text-[#D0D4EA]">{detail.vedicLens}</p></div>}</section>

          {detail.featuredStars && detail.featuredStars.length > 0 && <section><h3 className="font-editorial text-xl font-bold text-[#F4F0E6]">Featured anchors</h3><div className="mt-3 flex flex-wrap gap-2">{detail.featuredStars.map(star => <span key={star} className="rounded-full border border-white/10 bg-[#0D1222] px-3 py-1.5 font-mono-data text-[10px] text-[#C8CFE3]">✦ {star}</span>)}</div></section>}

          <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-5">{body && <><Link href={`/observatory/ecliptic?${query}`} onClick={onClose} className="rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-2.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.12em] text-[#F2C65D] hover:bg-[#D4AF37]/20">Open in Ecliptic ↗</Link><Link href={`/observatory/gochara?${query}`} onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.12em] text-[#C6CDE0] hover:border-[#D4AF37]/60">Compare Gochara</Link></> }<button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.12em] text-[#C6CDE0] hover:border-[#D4AF37]/60">Return to sky</button></div>
          <p className="font-mono-data text-[9px] leading-relaxed text-[#707A98]">Image: {detail.imageCredit}. The current coordinates are calculated for the selected instant and observer; the artwork is an interpretive, not-to-scale portrait.</p>
        </div>
      </section>
    </div>
  );
}

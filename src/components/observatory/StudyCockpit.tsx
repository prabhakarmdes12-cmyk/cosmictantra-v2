'use client';

import { BadgeCheck, BookOpenCheck, CalendarClock, Database, ExternalLink, MapPin, Radio, ShieldCheck } from 'lucide-react';
import type { LiveObservationResponse, LiveTarget } from '@/lib/observatory/live';
import type { LocalStudyContext } from '@/lib/observatory/studyContext';

interface StudyCockpitProps {
  target: LiveTarget;
  date: Date;
  cityName: string;
  observer: { latitude: number; longitude: number };
  localCalculation: LocalStudyContext;
  liveResponse: LiveObservationResponse | null;
}

function timeLabel(value: string | null): string {
  if (!value) return 'not supplied';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : 'not supplied';
}

function coordinateLabel(value: number | null, suffix = '°'): string {
  return value === null ? 'not applicable' : `${value.toFixed(2)}${suffix}`;
}

function providerStatus(response: LiveObservationResponse | null): { label: string; detail: string; tone: string } {
  if (!response) return { label: 'Not queried', detail: 'Provider check begins at 2.15× local display zoom.', tone: 'text-[#F2C65D]' };
  if (response.frame) return { label: 'Frame resolved', detail: `${response.frame.providerLabel} · ${response.frame.freshness}`, tone: 'text-[#91C7A5]' };
  return { label: 'No frame available', detail: 'The local calculation remains the only active observation product for this target.', tone: 'text-[#F2C65D]' };
}

export default function StudyCockpit({ target, date, cityName, observer, localCalculation, liveResponse }: StudyCockpitProps) {
  const reality = providerStatus(liveResponse);
  const coordinates = localCalculation.coordinates;
  const frame = liveResponse?.frame;

  return (
    <section aria-labelledby="study-cockpit-title" className="rounded-2xl border border-[#C4C5FF]/30 bg-[#0B1020] p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#C4C5FF]"><BookOpenCheck className="h-3.5 w-3.5" /> Synchronized study cockpit</div>
          <h2 id="study-cockpit-title" className="mt-1 font-editorial text-3xl font-bold text-[#F4F0E6]">One target, three honest layers.</h2>
          <p className="mt-2 max-w-3xl text-[10px] leading-relaxed text-[#AAB3D0]">Use the same target, city and fixed instant to compare the calculated sky, any provider-backed frame, and the evidence status. The panels are related by provenance, not silently aligned as one image.</p>
        </div>
        <div className="flex flex-wrap gap-2 font-mono-data text-[9px] text-[#9EA8C2]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#070A13] px-2.5 py-1.5"><MapPin className="h-3 w-3 text-[#F2C65D]" /> {cityName}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#070A13] px-2.5 py-1.5"><CalendarClock className="h-3 w-3 text-[#F2C65D]" /> {date.toISOString()}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <article className="rounded-xl border border-[#91C7A5]/25 bg-[#0C1717] p-4" aria-label="Local calculated sky summary">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#91C7A5]"><Database className="h-3.5 w-3.5" /> Calculated local sky</div><span className="rounded-full border border-[#91C7A5]/25 px-2 py-1 font-mono-data text-[8px] uppercase text-[#91C7A5]">active</span></div>
          <h3 className="mt-3 text-lg font-bold text-[#E7F2EA]">{target.label}</h3>
          <p className="mt-1 font-mono-data text-[9px] uppercase tracking-[0.1em] text-[#7F9C88]">{target.kind} · {localCalculation.quality}</p>
          <dl className="mt-4 space-y-2 font-mono-data text-[9px]">
            <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#718F7B]">Altitude / azimuth</dt><dd className="text-right text-[#D8EBDD]">{coordinateLabel(coordinates.altitudeDeg)} / {coordinateLabel(coordinates.azimuthDeg)}</dd></div>
            <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#718F7B]">Direction / band</dt><dd className="text-right text-[#D8EBDD]">{coordinates.direction || 'not applicable'} · {coordinates.altitudeBand || 'not applicable'}</dd></div>
            <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#718F7B]">Tropical / sidereal</dt><dd className="text-right text-[#D8EBDD]">{coordinateLabel(coordinates.tropicalLongitudeDeg)} / {coordinateLabel(coordinates.siderealLongitudeDeg)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-[#718F7B]">Rashi / Nakshatra</dt><dd className="text-right text-[#F2C65D]">{coordinates.rashi || 'not applicable'}{coordinates.nakshatra ? ` · ${coordinates.nakshatra} pada ${coordinates.pada}` : ''}</dd></div>
          </dl>
          <p className="mt-3 text-[9px] leading-relaxed text-[#9EB6A7]">{localCalculation.note}</p>
          <p className="mt-3 font-mono-data text-[8px] leading-relaxed text-[#718F7B]">{localCalculation.sourcePath} · {localCalculation.model}</p>
        </article>

        <article className="rounded-xl border border-[#8B8BF5]/30 bg-[#101735] p-4" aria-label="Provider-backed reality summary">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#C4C5FF]"><Radio className="h-3.5 w-3.5" /> Reality / provider</div><span className={`rounded-full border border-white/10 px-2 py-1 font-mono-data text-[8px] uppercase ${reality.tone}`}>{reality.label}</span></div>
          {frame ? (
            <>
              <h3 className="mt-3 text-lg font-bold text-[#E6E6FF]">{frame.providerLabel}</h3>
              <p className="mt-1 font-mono-data text-[9px] uppercase tracking-[0.1em] text-[#9497CE]">{frame.mode} · {frame.quality} · {frame.frameId}</p>
              <dl className="mt-4 space-y-2 font-mono-data text-[9px]">
                <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#777BB0]">Requested</dt><dd className="text-right text-[#D7D8F3]">{timeLabel(frame.requestedAtUtc)}</dd></div>
                <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#777BB0]">Captured</dt><dd className="text-right text-[#D7D8F3]">{timeLabel(frame.capturedAtUtc)}</dd></div>
                <div className="flex justify-between gap-3 border-b border-white/[0.07] pb-2"><dt className="text-[#777BB0]">Received</dt><dd className="text-right text-[#D7D8F3]">{timeLabel(frame.receivedAtUtc)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#777BB0]">Wavelength / filter</dt><dd className="text-right text-[#F2C65D]">{frame.wavelengthLabel || 'not supplied'} · {frame.filter || 'not supplied'}</dd></div>
              </dl>
              {frame.sourceUrl && <a href={frame.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-mono-data text-[9px] font-bold text-[#F2C65D] hover:underline">Open provider metadata <ExternalLink className="h-3 w-3" /></a>}
            </>
          ) : (
            <>
              <h3 className="mt-3 text-lg font-bold text-[#E6E6FF]">{reality.label}</h3>
              <p className="mt-2 text-[10px] leading-relaxed text-[#A5ABD0]">{reality.detail}</p>
              {liveResponse?.notices.map(notice => <p key={notice} className="mt-2 rounded-lg border border-[#F2C65D]/15 bg-[#1C1A19] px-2.5 py-2 text-[9px] leading-relaxed text-[#D7C18A]">{notice}</p>)}
              <div className="mt-4 flex flex-wrap gap-1.5">{(liveResponse?.providers || []).slice(0, 4).map(provider => <span key={provider.id} className="rounded-full border border-white/10 px-2 py-1 font-mono-data text-[8px] text-[#A9B0D6]">{provider.id} · {provider.configured ? 'configured' : provider.availability}</span>)}</div>
            </>
          )}
        </article>

        <article className="rounded-xl border border-[#D4AF37]/25 bg-[#14120B] p-4" aria-label="Qualification and snapshot summary">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.14em] text-[#F2C65D]"><ShieldCheck className="h-3.5 w-3.5" /> Evidence status</div><span className="rounded-full border border-[#D4AF37]/30 px-2 py-1 font-mono-data text-[8px] uppercase text-[#F2C65D]">conditional pass</span></div>
          <h3 className="mt-3 text-lg font-bold text-[#F1E8CC]">Snapshot-ready context</h3>
          <p className="mt-2 text-[10px] leading-relaxed text-[#BDB28F]">The notebook below saves the exact city, instant, local model, provider check, frame provenance, and current qualification blockers together.</p>
          <div className="mt-4 space-y-2 font-mono-data text-[9px]">
            <div className="flex items-center gap-2 text-[#E7D9A9]"><BadgeCheck className="h-3.5 w-3.5 text-[#D4AF37]" /> BLOCKER-1 · Moon discrepancy 1.135216°</div>
            <div className="flex items-center gap-2 text-[#E7D9A9]"><BadgeCheck className="h-3.5 w-3.5 text-[#D4AF37]" /> BLOCKER-2 · JPL fixture still requires review</div>
          </div>
          <p className="mt-4 font-mono-data text-[8px] leading-relaxed text-[#968B6B]">Local calculations are low-precision teaching values. A provider frame is never evidence that the local canvas has become a telescope image.</p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 font-mono-data text-[8px] uppercase tracking-[0.1em] text-[#71809F]
      ">
        <span>Target {target.label} · {target.kind} · observer {observer.latitude.toFixed(4)}° / {observer.longitude.toFixed(4)}°</span>
        <span>{liveResponse ? 'Provider check recorded' : 'Local-only until deep zoom'}</span>
      </div>
    </section>
  );
}

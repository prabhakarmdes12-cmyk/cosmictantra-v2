'use client';

import Link from 'next/link';
import { BookOpen, ExternalLink, Globe2, Library, Moon, Orbit, ShieldCheck, SunMedium } from 'lucide-react';
import { useMemo } from 'react';
import { calculateCanonicalBody, type CanonicalBodyName } from '@/lib/astronomy/canonicalBodies';
import { getNakshatraForLongitude, getRashiForLongitude } from '@/lib/astronomy/eclipticProjection';
import {
  calculateMoonPhase,
  altitudeBand,
  calculateSolarDayEvents,
  compassDirection,
  formatEventDateTime,
  formatEventTime,
  formatPercent,
  planObservation,
  skyLightState,
} from '@/lib/astronomy/observation';
import { equatorialToHorizontal, type ObserverLocation } from '@/lib/astronomy/projection';
import ObservationLog from './ObservationLog';
import StudyCockpit from './StudyCockpit';
import type { LiveObservationResponse, LiveTarget } from '@/lib/observatory/live';
import { createLocalStudyContext } from '@/lib/observatory/studyContext';

interface ObservatoryStudentDeskProps {
  date: Date;
  observer: ObserverLocation;
  cityId: string;
  cityName: string;
  timezoneOffsetHours: number;
  selectedPlanet: CanonicalBodyName;
  studyTarget: LiveTarget;
  liveResponse: LiveObservationResponse | null;
}

const STUDY_SOURCES = [
  { label: 'NASA image & video library', description: 'Searchable mission media, metadata, captions, and asset records.', href: 'https://images.nasa.gov/' },
  { label: 'NASA Solar System Treks', description: 'Planetary maps, layers, surface tools, and 3D exploration.', href: 'https://trek.nasa.gov/' },
  { label: 'ISRO mission gallery', description: 'Aditya-L1, Chandrayaan, launch, payload, and mission context.', href: 'https://www.isro.gov.in/' },
  { label: 'JPL Horizons', description: 'Reference ephemerides, observer coordinates, and rise/set queries.', href: 'https://ssd.jpl.nasa.gov/horizons/' },
  { label: 'NAIF SPICE', description: 'Mission geometry, spacecraft states, frames, and planetary constants.', href: 'https://naif.jpl.nasa.gov/naif/' },
  { label: 'ESA/Hubble', description: 'Deep-sky imagery released with clear CC BY 4.0 terms.', href: 'https://esahubble.org/images/' },
];

function formatLongitude(value: number): string {
  const degrees = Math.floor(value);
  const minutes = Math.floor((value - degrees) * 60);
  return `${String(degrees).padStart(3, '0')}° ${String(minutes).padStart(2, '0')}′`;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatLocalClock(value: Date, timezoneOffsetHours: number): string {
  const local = new Date(value.getTime() + timezoneOffsetHours * 60 * 60 * 1000);
  return local.toISOString().slice(11, 16);
}

export default function ObservatoryStudentDesk({
  date,
  observer,
  cityId,
  cityName,
  timezoneOffsetHours,
  selectedPlanet,
  studyTarget,
  liveResponse,
}: ObservatoryStudentDeskProps) {
  const localStudyContext = useMemo(() => createLocalStudyContext(studyTarget, date, observer), [date, observer.latitude, observer.longitude, studyTarget]);
  const brief = useMemo(() => {
    const sun = calculateCanonicalBody('Sun', date);
    const moon = calculateCanonicalBody('Moon', date);
    const selected = calculateCanonicalBody(selectedPlanet, date);
    const phase = calculateMoonPhase(date);
    const events = calculateSolarDayEvents(date, observer, timezoneOffsetHours);
    const sunHorizontal = equatorialToHorizontal(
      { raHours: sun.rightAscensionHours, decDeg: sun.declinationDeg },
      date,
      observer,
    );
    const selectedPlan = planObservation(date, observer, selectedPlanet);
    return {
      sun,
      moon,
      selected,
      phase,
      events,
      lightState: skyLightState(sunHorizontal.altitudeDeg),
      selectedPlan,
    };
  }, [date, observer.latitude, observer.longitude, selectedPlanet, timezoneOffsetHours]);

  const selectedRashi = getRashiForLongitude(brief.selected.siderealLongitude);
  const selectedNakshatra = getNakshatraForLongitude(brief.selected.siderealLongitude);
  const selectedHorizontal = brief.selectedPlan.horizontal;
  const localTime = formatLocalClock(date, timezoneOffsetHours);

  return (
    <section className="space-y-5" aria-labelledby="student-desk-title">
      <div className="flex flex-col gap-3 border-b border-white/[0.09] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]"><Library className="h-3.5 w-3.5" /> One observatory study desk</div>
          <h2 id="student-desk-title" className="mt-1 font-editorial text-3xl font-bold text-[#F5F0E5]">Read the sky, then study its layers.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#9EA8C2]">A compact briefing for astronomy learners and Jyotish students. Every card keeps the calculated observation, the traditional coordinate lens, and the source boundary visible.</p>
        </div>
        <Link href={`/observatory/ecliptic?city=${encodeURIComponent(cityId)}&time=${encodeURIComponent(date.toISOString())}&planet=${encodeURIComponent(selectedPlanet)}`} className="inline-flex items-center gap-1.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.13em] text-[#F2C65D] hover:underline">Open coordinate lab <ExternalLink className="h-3 w-3" /></Link>
      </div>

      <StudyCockpit
        target={studyTarget}
        date={date}
        cityName={cityName}
        observer={observer}
        localCalculation={localStudyContext}
        liveResponse={liveResponse}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <article className="rounded-2xl border border-[#D4AF37]/30 bg-[#0B1020] p-5">
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#F2C65D]"><SunMedium className="h-3.5 w-3.5" /> Field briefing</div>
          <h3 className="mt-2 font-editorial text-2xl font-bold">{brief.lightState}</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-[#9AA5C0]">{cityName} · local civil time {localTime} · observation instant {date.toISOString()}</p>
          <dl className="mt-5 grid grid-cols-2 gap-3 font-mono-data text-[10px]">
            <div className="rounded-xl border border-white/[0.08] bg-[#070A13] p-3"><dt className="text-[#7F89A7]">Sunrise</dt><dd className="mt-1 text-base font-bold text-[#E9EDF8]">{formatEventTime(brief.events.sunrise, timezoneOffsetHours)}</dd></div>
            <div className="rounded-xl border border-white/[0.08] bg-[#070A13] p-3"><dt className="text-[#7F89A7]">Sunset</dt><dd className="mt-1 text-base font-bold text-[#E9EDF8]">{formatEventTime(brief.events.sunset, timezoneOffsetHours)}</dd></div>
            <div className="rounded-xl border border-white/[0.08] bg-[#070A13] p-3"><dt className="text-[#7F89A7]">Civil twilight</dt><dd className="mt-1 text-sm font-bold text-[#F2C65D]">{formatEventTime(brief.events.civilDawn, timezoneOffsetHours)} → {formatEventTime(brief.events.civilDusk, timezoneOffsetHours)}</dd></div>
            <div className="rounded-xl border border-white/[0.08] bg-[#070A13] p-3"><dt className="text-[#7F89A7]">Dark window</dt><dd className="mt-1 text-sm font-bold text-[#91C7A5]">{formatEventTime(brief.events.astronomicalDusk, timezoneOffsetHours)} → {formatEventTime(brief.events.astronomicalDawn, timezoneOffsetHours)}</dd></div>
          </dl>
          <p className="mt-4 font-mono-data text-[9px] leading-relaxed text-[#707A98]">Solar events are approximate local-model crossings. Refraction, terrain and horizon obstruction are not included.</p>
        </article>

        <article className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-5">
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#B8B9FF]"><Moon className="h-3.5 w-3.5" /> Moon study</div>
          <div className="mt-4 flex items-center gap-3"><span className="text-5xl text-[#E6EEF8]">{brief.phase.symbol}</span><div><h3 className="font-editorial text-xl font-bold text-[#F4F0E6]">{brief.phase.name}</h3><p className="font-mono-data text-[10px] text-[#A3ACCA]">{formatPercent(brief.phase.illumination)} illuminated · {brief.phase.angleDeg.toFixed(1)}° elongation</p></div></div>
          <dl className="mt-5 space-y-3 font-mono-data text-[10px]"><div className="flex justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#7F89A7]">Tropical longitude</dt><dd>{formatLongitude(brief.moon.tropicalLongitude)}</dd></div><div className="flex justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#7F89A7]">Sidereal longitude</dt><dd className="text-[#F2C65D]">{formatLongitude(brief.moon.siderealLongitude)}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#7F89A7]">Source path</dt><dd className="text-right text-[#C3C8DC]">{brief.moon.source}</dd></div></dl>
          <p className="mt-4 text-[10px] leading-relaxed text-[#8993B0]">Phase is derived from the current Sun–Moon longitude difference. It is a teaching signal, not an almanac-grade prediction.</p>
        </article>

        <article className="rounded-2xl border border-[#8B8BF5]/30 bg-[#101735] p-5">
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#C4C5FF]"><Orbit className="h-3.5 w-3.5" /> Selected graha lab</div>
          <h3 className="mt-3 font-editorial text-2xl font-bold text-[#F4F0E6]">{brief.selected.body} · {selectedRashi.name}</h3>
          <p className="mt-1 font-mono-data text-[10px] text-[#AEB6D5]">{selectedRashi.glyph} {selectedRashi.englishName} · {selectedNakshatra.name} · pada {selectedNakshatra.pada}</p>
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#0A1027] px-3 py-2.5 text-[10px] leading-relaxed text-[#C7CBE2]">
            <strong className="text-[#F2C65D]">Field cue:</strong>{' '}
            {selectedHorizontal
              ? `${brief.selected.body} is ${selectedHorizontal.altitudeDeg >= 0 ? 'above' : 'below'} the mathematical horizon at ${selectedHorizontal.altitudeDeg.toFixed(1)}° toward ${compassDirection(selectedHorizontal.azimuthDeg)} (${altitudeBand(selectedHorizontal.altitudeDeg)}).`
              : `${brief.selected.body} is a mathematical node. Use its longitude and sidereal descriptors for study; it is not a physical object to locate in the sky.`}
          </div>
          <dl className="mt-5 space-y-3 font-mono-data text-[10px]"><div className="flex justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#8691B4]">Tropical</dt><dd>{formatLongitude(brief.selected.tropicalLongitude)}</dd></div><div className="flex justify-between gap-3 border-b border-white/[0.08] pb-2"><dt className="text-[#8691B4]">Sidereal</dt><dd className="text-[#F2C65D]">{formatLongitude(brief.selected.siderealLongitude)}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#8691B4]">Motion</dt><dd className="text-[#D8DCEF]">{brief.selected.isRetrograde ? 'Retrograde' : 'Direct'}</dd></div></dl>
          <Link href={`/observatory/gochara?city=${encodeURIComponent(cityId)}&time=${encodeURIComponent(date.toISOString())}&planet=${encodeURIComponent(selectedPlanet)}`} className="mt-5 inline-flex items-center gap-1.5 font-mono-data text-[10px] font-bold uppercase tracking-[0.12em] text-[#C4C5FF] hover:underline">Compare in Gochara <ExternalLink className="h-3 w-3" /></Link>
        </article>
      </div>

      <article className="rounded-2xl border border-[#91C7A5]/25 bg-[#0C1717] p-5" aria-labelledby="observation-planner-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#91C7A5]">Approximate observation planner</div>
            <h3 id="observation-planner-title" className="mt-1 font-editorial text-2xl font-bold text-[#F4F0E6]">When can I use this target?</h3>
            <p className="mt-1 text-[10px] leading-relaxed text-[#9EB6A7]">A short-horizon field cue for the selected graha. It uses the same local model as the sky, with mathematical-horizon crossings sampled every ten minutes.</p>
          </div>
          <span className="rounded-full border border-[#91C7A5]/25 bg-[#102019] px-3 py-1.5 font-mono-data text-[9px] font-bold uppercase tracking-[0.12em] text-[#91C7A5]">No refraction · no terrain</span>
        </div>
        {!selectedHorizontal ? (
          <div className="mt-4 rounded-xl border border-[#E19A72]/25 bg-[#24171A] px-3 py-3 text-[10px] leading-relaxed text-[#E5B9A7]">Rahu and Ketu do not receive a rise/set window. They are mathematical lunar nodes: use the ecliptic longitude, sidereal rashi and Nakshatra context instead of attempting a physical sky search.</div>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#07100F] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#718F7B]">Now</div><div className="mt-1 font-mono-data text-sm font-bold text-[#DCECDF]">{brief.selectedPlan.visible ? 'Above horizon' : 'Below horizon'}</div><div className="mt-1 font-mono-data text-[10px] text-[#A2BBA9]">{selectedHorizontal.altitudeDeg.toFixed(1)}° · {compassDirection(selectedHorizontal.azimuthDeg)} · {altitudeBand(selectedHorizontal.altitudeDeg)}</div></div>
            <div className="rounded-xl border border-white/[0.08] bg-[#07100F] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#718F7B]">Next horizon crossing</div><div className="mt-1 font-mono-data text-sm font-bold capitalize text-[#F2C65D]">{brief.selectedPlan.nextHorizonEvent?.kind || 'none found'}</div><div className="mt-1 font-mono-data text-[10px] text-[#A2BBA9]">{brief.selectedPlan.nextHorizonEvent ? formatEventDateTime(brief.selectedPlan.nextHorizonEvent.time, timezoneOffsetHours) : 'within 30 hours'}</div></div>
            <div className="rounded-xl border border-white/[0.08] bg-[#07100F] p-3"><div className="font-mono-data text-[9px] uppercase tracking-wider text-[#718F7B]">Moon separation</div><div className="mt-1 font-mono-data text-sm font-bold text-[#DCECDF]">{brief.selectedPlan.lunarSeparationDeg === null ? '—' : `${brief.selectedPlan.lunarSeparationDeg.toFixed(1)}°`}</div><div className="mt-1 text-[10px] text-[#A2BBA9]">Larger separation can make a target easier to study under moonlight; brightness and sky conditions are not modeled.</div></div>
          </div>
        )}
      </article>

      <ObservationLog
        date={date}
        observer={observer}
        cityId={cityId}
        cityName={cityName}
        timezoneOffsetHours={timezoneOffsetHours}
        selectedPlan={brief.selectedPlan}
        target={studyTarget}
        liveResponse={liveResponse}
        localStudyContext={localStudyContext}
        rashiName={selectedRashi.name}
        nakshatraName={selectedNakshatra.name}
        pada={selectedNakshatra.pada}
        moonPhaseName={brief.phase.name}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <article className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-5">
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]"><BookOpen className="h-3.5 w-3.5" /> How to read this instrument</div>
          <ol className="mt-4 space-y-3 text-xs leading-relaxed text-[#B2B9CE]">
            <li><strong className="text-[#F2C65D]">1 · Orient.</strong> Zenith is at the centre; the mathematical horizon is the outer circle; azimuth starts at true north.</li>
            <li><strong className="text-[#F2C65D]">2 · Inspect.</strong> Zoom the same calculated scene; labels and target hit areas remain tied to the same coordinates.</li>
            <li><strong className="text-[#C4C5FF]">3 · Translate.</strong> Tropical longitude is the astronomy ring. Sidereal longitude, rashi, Nakshatra and pada are the separately labelled Vedic lens.</li>
            <li><strong className="text-[#91C7A5]">4 · Verify.</strong> Open a detail sheet for the model/source note. When the reference fixture is unavailable, the result stays labelled local approximation.</li>
          </ol>
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#91C7A5]/20 bg-[#102019] p-3 text-[10px] leading-relaxed text-[#B9D8C0]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#91C7A5]" /> Student rule: a beautiful diagram is an explanation, not evidence by itself. Keep frame, epoch, source and uncertainty beside the number.</div>
        </article>

        <article className="rounded-2xl border border-white/[0.09] bg-[#090D1A] p-5">
          <div className="flex items-center gap-2 font-mono-data text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]"><Globe2 className="h-3.5 w-3.5" /> Curated external study shelf</div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#8993B0]">Official learning and data sources are gathered here as optional research links. They are not loaded into the sky renderer and do not control the Observatory’s calculations.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {STUDY_SOURCES.map(source => <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="group rounded-xl border border-white/[0.08] bg-[#070A13] p-3 transition-colors hover:border-[#D4AF37]/55"><div className="flex items-start justify-between gap-2"><span className="text-xs font-bold text-[#DCE1F0] group-hover:text-[#F2C65D]">{source.label}</span><ExternalLink className="h-3 w-3 shrink-0 text-[#7783A4]" /></div><p className="mt-1 text-[10px] leading-relaxed text-[#7F89A7]">{source.description}</p></a>)}
          </div>
          <p className="mt-4 font-mono-data text-[9px] leading-relaxed text-[#707A98]">External sources have their own attribution, license and availability rules. CosmicTantra does not imply agency endorsement.</p>
        </article>
      </div>

      <p className="font-mono-data text-[9px] leading-relaxed text-[#69738F]">Brief generated for {formatDate(date)} UTC · observer {observer.latitude.toFixed(4)}° / {observer.longitude.toFixed(4)}° · model status: deterministic local approximation · no JPL-grade or sub-degree lunar claim.</p>
    </section>
  );
}

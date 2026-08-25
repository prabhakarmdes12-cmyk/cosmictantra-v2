'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Compass, Crosshair, Info, MapPin, Moon, Play, RotateCcw, Settings2, Sparkles } from 'lucide-react';
import { CITIES, DEFAULT_CITY } from '@/lib/cities';
import { createObservatoryTime } from '@/lib/astronomy/time';
import { calculateCanonicalBody } from '@/lib/astronomy/ephemeris';
import { ObservatoryWorkerClient } from '@/lib/astronomy/workerClient';
import type { RiseTransitSet } from '@/lib/astronomy/events';
import type { ObserverLocation } from '@/lib/astronomy/types';

const stars = [[8,13],[17,28],[28,11],[40,21],[53,8],[66,27],[78,15],[89,35],[13,57],[25,43],[37,66],[50,49],[62,68],[76,52],[93,73],[5,79],[20,88],[46,83],[70,91],[84,86]];
const nakshatras = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
function dms(deg: number) { const d = Math.floor(deg); const m = Math.floor((deg - d) * 60); const s = Math.round((((deg - d) * 60) - m) * 60); return `${d}° ${String(m).padStart(2,'0')}′ ${String(s).padStart(2,'0')}″`; }
function cityObserver(city: typeof DEFAULT_CITY): ObserverLocation { return { name: `${city.name}, ${city.state}`, latitude: city.lat, longitude: city.lng, timezone: city.id === 'london' ? 'Europe/London' : city.id === 'newyork' ? 'America/New_York' : city.id === 'dubai' ? 'Asia/Dubai' : city.id === 'singapore' ? 'Asia/Singapore' : 'Asia/Kolkata', source: 'catalogue' }; }
export default function ObservatoryExperience() {
 const [events, setEvents] = useState<RiseTransitSet | null>(null); const [city, setCity] = useState(DEFAULT_CITY); const [instant, setInstant] = useState(() => new Date()); const [live, setLive] = useState(true); const [showNakshatras, setShowNakshatras] = useState(true); const [details, setDetails] = useState(false);
 useEffect(() => { if (!live) return; const id = window.setInterval(() => setInstant(new Date()), 1000); return () => clearInterval(id); }, [live]);
 const observer = useMemo(() => cityObserver(city), [city]); const time = useMemo(() => createObservatoryTime(instant, observer), [instant, observer]); const moon = useMemo(() => calculateCanonicalBody('Moon', time), [time]);
 useEffect(() => { const worker = new ObservatoryWorkerClient(); let active = true; worker.events('Moon', instant, observer).then(result => { if (active) setEvents(result); }).catch(() => { if (active) setEvents(null); }); return () => { active = false; worker.destroy(); }; }, [observer, Math.floor(instant.getTime() / 60000)]);
 const eventTime = (value: string | null) => value ? new Intl.DateTimeFormat('en-IN', { timeZone: observer.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '—';
 const offsetLabel = `${time.timezoneOffsetMinutes >= 0 ? '+' : '−'}${String(Math.floor(Math.abs(time.timezoneOffsetMinutes)/60)).padStart(2,'0')}:${String(Math.abs(time.timezoneOffsetMinutes)%60).padStart(2,'0')}`;
 const timeLabel = new Intl.DateTimeFormat('en-IN',{timeZone: observer.timezone, day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(instant);
 const changeTime = (days: number) => { setLive(false); setInstant(d => new Date(d.getTime() + days*86400000)); };
 return <main className="obs-page">
  <header className="obs-header"><Link href="/" className="obs-brand"><span className="obs-orb">✦</span><span>COSMICTANTRA</span></Link><div className="obs-title">OBSERVATORY <em>काशी आकाश वेधशाला</em></div><button className="obs-detail-btn" onClick={()=>setDetails(!details)}><Info size={15}/> DETAILS</button></header>
  <section className="obs-sky" aria-label={`Computed ecliptic sky above ${observer.name}`}>
    <div className="obs-noise" /> <div className="obs-vignette" />
    {stars.map(([x,y],i)=><i aria-hidden="true" key={i} className="obs-star" style={{left:`${x}%`,top:`${y}%`,opacity: .35+(i%4)*.15}}/>)}
    <div className="obs-ecliptic" aria-hidden="true" />
    {showNakshatras && <div className="obs-mandala" aria-label="27 Lahiri sidereal nakshatra sectors">{nakshatras.map((n,i)=><span key={n} style={{transform:`rotate(${i*13.3333}deg)`}} title={`${n}: ${dms(i*13.3333)}–${dms((i+1)*13.3333)}`} />)}</div>}
    <button className="obs-moon" style={{ left: `${16 + moon.tropicalLongitude.value/360*68}%`, top: `${43 + Math.sin(moon.siderealLongitude.value*Math.PI/180)*10}%`}} aria-label="Moon selected"><Moon fill="currentColor" size={30}/><b>☾</b></button>
    <div className="obs-cardinal north">N<br/><small>ZENITH</small></div><div className="obs-cardinal east">E</div><div className="obs-cardinal west">W</div>
    <div className="obs-sky-copy"><p>THE SKY ABOVE {city.name.toUpperCase()}</p><h1>{timeLabel} <span>• UTC {offsetLabel}</span></h1>{!live && <strong>SIMULATION MODE</strong>}</div>
    <div className="obs-render-status"><Sparkles size={13}/> 2D ECLIPTIC INSTRUMENT <span>Renderer: internal</span></div>
  </section>
  <section className="obs-instrument">
   <div className="obs-rail"><button onClick={()=>{setLive(true);setInstant(new Date())}}><Crosshair size={16}/> NOW</button><button onClick={()=>changeTime(-1)}><ChevronLeft size={16}/> −1D</button><button onClick={()=>changeTime(1)}>+1D <ChevronRight size={16}/></button><button onClick={()=>setShowNakshatras(!showNakshatras)} className={showNakshatras?'active':''}>NAKSHATRA</button><label><MapPin size={15}/><select value={city.id} onChange={e=>{ const c=CITIES.find(x=>x.id===e.target.value); if(c) setCity(c); }}>{CITIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button onClick={()=>setLive(false)}><Play size={14}/> TIME</button></div>
   <article className="obs-inspector"><div className="obs-object"><span className="obs-object-glyph">☾</span><div><p>CHANDRA <em>चन्द्र</em></p><h2>{moon.nakshatra.name} <small>• Pada {moon.nakshatra.pada}</small></h2></div></div><div className="obs-reading"><div><label>SIDEREAL — LAHIRI</label><b>{dms(moon.siderealLongitude.value)}</b><span>{moon.rashi} · {dms(moon.degreeInRashi)}</span></div><div><label>ASTRONOMICAL / TROPICAL</label><b>{dms(moon.tropicalLongitude.value)}</b><span>of-date · Astronomy Engine</span></div><div><label>AYANAMSHA</label><b>{dms(moon.ayanamsha.value)}</b><span>Canonical Lahiri adapter</span></div></div>{moon.scientific && <div className="obs-science">ALT {moon.scientific.altitude.toFixed(2)}° · AZ {moon.scientific.azimuth.toFixed(2)}° · RA {moon.scientific.rightAscensionHours.toFixed(4)}h · DEC {moon.scientific.declination.toFixed(2)}°</div>}{events && <div className="obs-events"><span>MOON RISE <b>{eventTime(events.rise)}</b></span><span>TRANSIT <b>{eventTime(events.transit)}</b></span><span>SET <b>{eventTime(events.set)}</b></span><small>observer-dependent · {events.source}</small></div>}{!moon.crossEngine.agreement && <div className="obs-discrepancy">DEVELOPMENT: astronomical Lahiri comparison Δ {moon.crossEngine.differenceDegrees.toFixed(3)}°. Canonical Jyotish output remains shown.</div>}<div className="obs-actions"><Link href={`/panchang/dhanbad?observatory=moon&time=${encodeURIComponent(time.utcInstant)}`}>VIEW IN PANCHANG</Link><Link href="/?open=kundali-section">VIEW IN KUNDALI</Link></div></article>
  </section>
  {details && <aside className="obs-provenance" aria-live="polite"><button onClick={()=>setDetails(false)}>×</button><p>CALCULATION DETAILS</p><dl><dt>Observer</dt><dd>{observer.name} · {observer.latitude.toFixed(4)}°, {observer.longitude.toFixed(4)}°</dd><dt>Timezone / UTC</dt><dd>{observer.timezone} · {time.utcInstant}</dd><dt>Julian date</dt><dd>{time.julianDate.toFixed(6)}</dd><dt>Frame chain</dt><dd>ecliptic-tropical → ecliptic-sidereal-lahiri</dd><dt>Astronomical source</dt><dd>{moon.tropicalLongitude.source} · {moon.tropicalLongitude.algorithmVersion}</dd><dt>Jyotish source</dt><dd>{moon.siderealLongitude.source}</dd><dt>Cross-engine Δ</dt><dd>{moon.crossEngine.differenceDegrees.toFixed(6)}° (development validation)</dd><dt>Precision policy</dt><dd>Display resolution is not an accuracy claim. See documentation.</dd></dl></aside>}
 </main>;
}

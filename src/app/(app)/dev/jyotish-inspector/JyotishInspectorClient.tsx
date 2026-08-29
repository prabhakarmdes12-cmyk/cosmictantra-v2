'use client';

import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Layers,
  Sun,
  Moon,
  ShieldCheck,
  Sliders,
  MessageSquare,
  FileText,
  Copy,
  ChevronRight,
  ArrowRightLeft,
  Download,
  Upload,
  Check,
  X
} from 'lucide-react';
import { getCanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';

// Helper to format decimal degrees to D°M'S"
function formatDMS(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  const d = Math.floor(norm);
  const mDec = (norm - d) * 60;
  const m = Math.floor(mDec);
  const s = Math.round((mDec - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
}

// Compute delta in arcseconds and return formatted string
function calculateDMSDelta(calcDeg: number, refDeg: number): { deltaStr: string; deltaArcsec: number; isAcceptable: boolean } {
  let diff = Math.abs(calcDeg - refDeg);
  if (diff > 180) diff = 360 - diff;
  const totalArcsec = Math.round(diff * 3600);
  const d = Math.floor(diff);
  const mDec = (diff - d) * 60;
  const m = Math.floor(mDec);
  const s = Math.round((mDec - m) * 60);
  return {
    deltaStr: `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`,
    deltaArcsec: totalArcsec,
    isAcceptable: totalArcsec <= 300 // within 5 arcminutes
  };
}

const PRESET_LOCATIONS = [
  { name: 'Varanasi, UP', lat: 25.3176, lng: 82.9739, tz: 5.5 },
  { name: 'Patna, Bihar', lat: 25.5941, lng: 85.1376, tz: 5.5 },
  { name: 'Dhanbad, Jharkhand', lat: 23.7957, lng: 86.4304, tz: 5.5 },
  { name: 'New Delhi, NCR', lat: 28.6139, lng: 77.2090, tz: 5.5 },
  { name: 'Ujjain (Mahakal), MP', lat: 23.1765, lng: 75.7885, tz: 5.5 },
  { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946, tz: 5.5 },
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777, tz: 5.5 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278, tz: 1.0 },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, tz: 9.0 }
];

export interface ExternalReferenceChart {
  referenceSoftware: string;
  referenceVersion: string;
  calculationSettings: string;
  ayanamsha: string;
  nodeMode: 'MEAN' | 'TRUE';
  timezone: number;
  reviewer: string;
  verificationDate: string;
  notes?: string;
  lagna: {
    degrees: number;
    rashi: string;
    nakshatra: string;
    pada: number;
  };
  planets: Record<string, {
    degrees: number;
    rashi: string;
    nakshatra: string;
    pada: number;
    dignity?: string;
  }>;
  dasha?: {
    currentMahadasha: string;
    currentAntardasha: string;
    currentPratyantardasha?: string;
    balanceAtBirth?: string;
  };
  panchang?: {
    udayaTithi: string;
    instantaneousTithi: string;
    nakshatra: string;
    sunrise: string;
    sunset: string;
  };
}

export default function JyotishInspectorClient() {
  const [birthDate, setBirthDate] = useState('1995-06-15');
  const [birthTime, setBirthTime] = useState('10:30');
  const [latitude, setLatitude] = useState(25.5941);
  const [longitude, setLongitude] = useState(85.1376);
  const [timezone, setTimezone] = useState(5.5);
  const [locationName, setLocationName] = useState('Patna, Bihar');
  const [activeTab, setActiveTab] = useState<'comparison' | 'snapshot' | 'planets' | 'panchang' | 'dasha' | 'vargas' | 'pandit-import'>('comparison');

  // External Reference Import State
  const [refMetadata, setRefMetadata] = useState({
    referenceSoftware: "Parashara's Light",
    referenceVersion: '9.0',
    calculationSettings: 'Geocentric, Sidereal, Chitra Paksha Lahiri',
    ayanamsha: 'Lahiri (23°47\\\'32\\" at epoch)',
    nodeMode: 'MEAN' as 'MEAN' | 'TRUE',
    reviewer: 'Pandit Ji',
    verificationDate: new Date().toISOString().slice(0, 10)
  });

  // Reference Inputs for Comparison
  const [refLagna, setRefLagna] = useState({ degrees: 128.45, rashi: 'Simha', nakshatra: 'Magha', pada: 3 });
  const [refSun, setRefSun] = useState({ degrees: 60.25, rashi: 'Mithuna', nakshatra: 'Mrigashira', pada: 3 });
  const [refMoon, setRefMoon] = useState({ degrees: 267.85, rashi: 'Dhanu', nakshatra: 'Uttara Ashadha', pada: 1 });
  const [refMars, setRefMars] = useState({ degrees: 135.20, rashi: 'Simha', nakshatra: 'Purva Phalguni', pada: 1 });
  const [refMercury, setRefMercury] = useState({ degrees: 55.40, rashi: 'Vrishabha', nakshatra: 'Rohini', pada: 4 });
  const [refJupiter, setRefJupiter] = useState({ degrees: 226.15, rashi: 'Vrishchika', nakshatra: 'Jyeshtha', pada: 3 });
  const [refVenus, setRefVenus] = useState({ degrees: 35.80, rashi: 'Vrishabha', nakshatra: 'Krittika', pada: 3 });
  const [refSaturn, setRefSaturn] = useState({ degrees: 329.50, rashi: 'Meena', nakshatra: 'Purva Bhadrapada', pada: 4 });
  const [refRahu, setRefRahu] = useState({ degrees: 190.10, rashi: 'Tula', nakshatra: 'Swati', pada: 2 });
  const [refKetu, setRefKetu] = useState({ degrees: 10.10, rashi: 'Mesha', nakshatra: 'Ashwini', pada: 4 });

  const [panditVerdict, setPanditVerdict] = useState<'MATCH' | 'ACCEPTABLE_DIFFERENCE' | 'WRONG' | 'CONVENTION_DIFFERENCE' | 'NEEDS_INVESTIGATION'>('ACCEPTABLE_DIFFERENCE');
  const [panditNotes, setPanditNotes] = useState('');
  const [savedQualifications, setSavedQualifications] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const snapshot = useMemo(() => {
    try {
      return getCanonicalJyotishSnapshot({
        birthDate,
        birthTime,
        latitude: Number(latitude),
        longitude: Number(longitude),
        timezone: Number(timezone),
        locationName
      });
    } catch (e: any) {
      console.error('Calculation Error:', e);
      return null;
    }
  }, [birthDate, birthTime, latitude, longitude, timezone, locationName]);

  const handleSelectPreset = (loc: typeof PRESET_LOCATIONS[0]) => {
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    setTimezone(loc.tz);
    setLocationName(loc.name);
  };

  const handleSaveQualification = () => {
    const entry = {
      id: `QUAL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      chartContext: { birthDate, birthTime, locationName, latitude, longitude, timezone },
      referenceSoftware: refMetadata.referenceSoftware,
      referenceVersion: refMetadata.referenceVersion,
      calculationSettings: refMetadata.calculationSettings,
      reviewer: refMetadata.reviewer,
      overallVerdict: panditVerdict,
      notes: panditNotes,
      comparisons: {
        lagna: {
          calculated: snapshot?.lagna?.longitude,
          reference: refLagna.degrees,
          delta: snapshot ? calculateDMSDelta(snapshot.lagna.longitude, refLagna.degrees) : null
        },
        moon: {
          calculated: snapshot?.planets?.Moon?.longitude,
          reference: refMoon.degrees,
          delta: snapshot ? calculateDMSDelta(snapshot.planets.Moon.longitude, refMoon.degrees) : null
        },
        sun: {
          calculated: snapshot?.planets?.Sun?.longitude,
          reference: refSun.degrees,
          delta: snapshot ? calculateDMSDelta(snapshot.planets.Sun.longitude, refSun.degrees) : null
        }
      }
    };
    setSavedQualifications([entry, ...savedQualifications]);
    setPanditNotes('');
  };

  const handleCopyJson = () => {
    if (!snapshot) return;
    navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const comparisonRows = [
    { label: 'Lagna (Ascendant)', calc: snapshot?.lagna?.longitude, ref: refLagna.degrees, calcSign: snapshot?.lagna?.rashiName, refSign: refLagna.rashi },
    { label: 'Sun (Surya)', calc: snapshot?.planets?.Sun?.longitude, ref: refSun.degrees, calcSign: snapshot?.planets?.Sun?.rashiName, refSign: refSun.rashi },
    { label: 'Moon (Chandra)', calc: snapshot?.planets?.Moon?.longitude, ref: refMoon.degrees, calcSign: snapshot?.planets?.Moon?.rashiName, refSign: refMoon.rashi },
    { label: 'Mars (Mangal)', calc: snapshot?.planets?.Mars?.longitude, ref: refMars.degrees, calcSign: snapshot?.planets?.Mars?.rashiName, refSign: refMars.rashi },
    { label: 'Mercury (Budha)', calc: snapshot?.planets?.Mercury?.longitude, ref: refMercury.degrees, calcSign: snapshot?.planets?.Mercury?.rashiName, refSign: refMercury.rashi },
    { label: 'Jupiter (Guru)', calc: snapshot?.planets?.Jupiter?.longitude, ref: refJupiter.degrees, calcSign: snapshot?.planets?.Jupiter?.rashiName, refSign: refJupiter.rashi },
    { label: 'Venus (Shukra)', calc: snapshot?.planets?.Venus?.longitude, ref: refVenus.degrees, calcSign: snapshot?.planets?.Venus?.rashiName, refSign: refVenus.rashi },
    { label: 'Saturn (Shani)', calc: snapshot?.planets?.Saturn?.longitude, ref: refSaturn.degrees, calcSign: snapshot?.planets?.Saturn?.rashiName, refSign: refSaturn.rashi },
    { label: 'Rahu (North Node)', calc: snapshot?.planets?.Rahu?.longitude, ref: refRahu.degrees, calcSign: snapshot?.planets?.Rahu?.rashiName, refSign: refRahu.rashi },
    { label: 'Ketu (South Node)', calc: snapshot?.planets?.Ketu?.longitude, ref: refKetu.degrees, calcSign: snapshot?.planets?.Ketu?.rashiName, refSign: refKetu.rashi }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-black to-amber-950/40 border border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-editorial text-white">
                Jyotish External Truth Qualification Console
              </h1>
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                ENGINE_CONSOLIDATED — EXTERNAL QUALIFICATION PENDING
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Side-by-Side Numerical Verification: CosmicTantra vs Professional Ephemerides
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied!' : 'Copy Snapshot JSON'}</span>
          </button>
        </div>
      </div>

      {/* Input Control Console */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> 1. Input Coordinates & Natal Datetime
          </span>
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono text-zinc-400">
            <span>Presets:</span>
            {PRESET_LOCATIONS.slice(0, 6).map((loc, i) => (
              <button
                key={i}
                onClick={() => handleSelectPreset(loc)}
                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-white text-[10px] cursor-pointer"
              >
                {loc.name.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Birth Date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Birth Time (24h)</label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">City / Location</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Latitude (°N)</label>
            <input
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => setLatitude(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Longitude (°E)</label>
            <input
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => setLongitude(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-400 block mb-1">Timezone Offset</label>
            <input
              type="number"
              step="0.5"
              value={timezone}
              onChange={(e) => setTimezone(Number(e.target.value))}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Domain Navigation Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto gap-2">
        {[
          { id: 'comparison', label: '⚔️ Side-by-Side Pandit Comparison' },
          { id: 'pandit-import', label: '📥 Reference Data Entry & Metadata' },
          { id: 'snapshot', label: 'Canonical Summary' },
          { id: 'planets', label: '9 Grahas Matrix' },
          { id: 'panchang', label: 'Panchang & Udaya Tithi' },
          { id: 'dasha', label: '3-Tier Vimshottari' },
          { id: 'vargas', label: 'D9 Navamsha' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-mono font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SIDE-BY-SIDE PANDIT COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-6 font-mono text-xs">
          {/* Metadata Banner */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-zinc-400 text-[10px]">Reference Source:</span>
              <div className="font-bold text-amber-300 text-sm">
                {refMetadata.referenceSoftware} (v{refMetadata.referenceVersion})
              </div>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px]">Ayanamsha & Settings:</span>
              <div className="text-white font-bold">{refMetadata.calculationSettings}</div>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px]">Node Mode:</span>
              <div className="text-purple-300 font-bold">{refMetadata.nodeMode} Rahu</div>
            </div>
            <div>
              <span className="text-zinc-400 text-[10px]">Reviewer:</span>
              <div className="text-emerald-300 font-bold">{refMetadata.reviewer} ({refMetadata.verificationDate})</div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                  <th className="pb-3">Parameter / Graha</th>
                  <th className="pb-3 text-amber-400">CosmicTantra Calculated</th>
                  <th className="pb-3 text-purple-400">{refMetadata.referenceSoftware} Reference</th>
                  <th className="pb-3 text-cyan-400">Explicit Difference (Δ)</th>
                  <th className="pb-3">Tolerance & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {comparisonRows.map((row, idx) => {
                  const hasCalc = typeof row.calc === 'number';
                  const hasRef = typeof row.ref === 'number';
                  const delta = (hasCalc && hasRef) ? calculateDMSDelta(row.calc!, row.ref!) : null;

                  return (
                    <tr key={idx} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 font-bold text-white">{row.label}</td>
                      <td className="py-3 text-amber-200">
                        {hasCalc ? (
                          <div>
                            <span className="font-bold">{formatDMS(row.calc!)}</span>
                            <span className="text-zinc-400 ml-2 text-[10px]">({row.calcSign})</span>
                          </div>
                        ) : 'Calculating...'}
                      </td>
                      <td className="py-3 text-purple-200">
                        {hasRef ? (
                          <div>
                            <span className="font-bold">{formatDMS(row.ref!)}</span>
                            <span className="text-zinc-400 ml-2 text-[10px]">({row.refSign})</span>
                          </div>
                        ) : 'No ref entered'}
                      </td>
                      <td className="py-3 font-mono font-bold">
                        {delta ? (
                          <span className={delta.deltaArcsec === 0 ? 'text-emerald-400' : delta.deltaArcsec < 300 ? 'text-amber-400' : 'text-red-400'}>
                            Δ {delta.deltaStr} ({delta.deltaArcsec}")
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3">
                        {delta ? (
                          delta.deltaArcsec === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                              EXACT MATCH
                            </span>
                          ) : delta.deltaArcsec <= 300 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              ACCEPTABLE (±5')
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                              DISCREPANCY
                            </span>
                          )
                        ) : (
                          <span className="text-zinc-500">Pending Ref</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pandit Verdict & Feedback Capture Card */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold font-editorial text-amber-400">
                  Pandit Qualification Verdict & Sign-Off
                </h3>
                <p className="text-xs text-zinc-400">
                  Review the explicit differences above and record your formal qualification status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Qualification Verdict</label>
                <select
                  value={panditVerdict}
                  onChange={(e) => setPanditVerdict(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="MATCH">MATCH (100% Alignment)</option>
                  <option value="ACCEPTABLE_DIFFERENCE">ACCEPTABLE DIFFERENCE (&lt;5 Arcmin)</option>
                  <option value="CONVENTION_DIFFERENCE">CONVENTION DIFFERENCE (Ayanamsha / Node)</option>
                  <option value="NEEDS_INVESTIGATION">NEEDS INVESTIGATION</option>
                  <option value="WRONG">WRONG (Requires Algorithm Fix)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] text-zinc-400 block mb-1">Pandit ji Notes & Reference Observation</label>
                <input
                  type="text"
                  value={panditNotes}
                  onChange={(e) => setPanditNotes(e.target.value)}
                  placeholder="e.g. Moon within 12 arcseconds; Tithi transition matches Jagannatha Hora..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Action</label>
                <button
                  onClick={handleSaveQualification}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                >
                  + Record Qualification
                </button>
              </div>
            </div>

            {savedQualifications.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <div className="text-xs font-bold text-zinc-400">Recorded Qualification History:</div>
                {savedQualifications.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{item.chartContext.locationName}</span> ({item.chartContext.birthDate} {item.chartContext.birthTime}) • <span className="text-amber-300">{item.referenceSoftware}</span>
                      <div className="text-zinc-400 text-[11px]">{item.notes || 'No comments'}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {item.overallVerdict}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REFERENCE DATA ENTRY & METADATA */}
      {activeTab === 'pandit-import' && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6 font-mono text-xs">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-base font-bold font-editorial text-amber-400">
              Reference Ephemeris Data Entry
            </h3>
            <p className="text-xs text-zinc-400">
              Enter or paste planetary values from your professional Kundli software. These values are never overwritten.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Software Name</label>
              <input
                type="text"
                value={refMetadata.referenceSoftware}
                onChange={(e) => setRefMetadata({ ...refMetadata, referenceSoftware: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Software Version</label>
              <input
                type="text"
                value={refMetadata.referenceVersion}
                onChange={(e) => setRefMetadata({ ...refMetadata, referenceVersion: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Ayanamsha Standard</label>
              <input
                type="text"
                value={refMetadata.ayanamsha}
                onChange={(e) => setRefMetadata({ ...refMetadata, ayanamsha: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Rahu/Ketu Calculation Mode</label>
              <select
                value={refMetadata.nodeMode}
                onChange={(e) => setRefMetadata({ ...refMetadata, nodeMode: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
              >
                <option value="MEAN">Mean Node (पारम्परिक माध्य राहु)</option>
                <option value="TRUE">True Node (स्पष्ट राहु)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h4 className="text-xs font-bold text-amber-400 mb-3">Reference Planetary Ecliptic Longitudes (0° to 360°):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Lagna (Ascendant) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refLagna.degrees}
                  onChange={(e) => setRefLagna({ ...refLagna, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Sun (Surya) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refSun.degrees}
                  onChange={(e) => setRefSun({ ...refSun, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Moon (Chandra) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refMoon.degrees}
                  onChange={(e) => setRefMoon({ ...refMoon, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Mars (Mangal) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refMars.degrees}
                  onChange={(e) => setRefMars({ ...refMars, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Mercury (Budha) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refMercury.degrees}
                  onChange={(e) => setRefMercury({ ...refMercury, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Jupiter (Guru) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refJupiter.degrees}
                  onChange={(e) => setRefJupiter({ ...refJupiter, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Venus (Shukra) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refVenus.degrees}
                  onChange={(e) => setRefVenus({ ...refVenus, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Saturn (Shani) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refSaturn.degrees}
                  onChange={(e) => setRefSaturn({ ...refSaturn, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Rahu (North Node) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refRahu.degrees}
                  onChange={(e) => setRefRahu({ ...refRahu, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Ketu (South Node) (°)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={refKetu.degrees}
                  onChange={(e) => setRefKetu({ ...refKetu, degrees: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTHER TABS: SNAPSHOT, PLANETS, PANCHANG, DASHA, VARGAS */}
      {snapshot && activeTab === 'snapshot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase">Ascendant / Lagna</span>
            <div className="text-xl font-bold font-editorial text-amber-400">
              {snapshot.lagna.rashiName} ({snapshot.lagna.rashiEn})
            </div>
            <div className="text-zinc-300">Degree: {snapshot.lagna.degreeStr}</div>
            <div className="text-zinc-400">Nakshatra: {snapshot.lagna.nakshatra?.name} (Pada {snapshot.lagna.pada})</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase">Moon Sign (Janma Rashi)</span>
            <div className="text-xl font-bold font-editorial text-amber-400">
              {snapshot.planets.Moon.rashiName} ({snapshot.planets.Moon.rashiEn})
            </div>
            <div className="text-zinc-300">Degree: {snapshot.planets.Moon.degreeStr}</div>
            <div className="text-zinc-400">Nakshatra: {snapshot.planets.Moon.nakshatra?.name} (Pada {snapshot.planets.Moon.pada})</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase">Sun Sign (Surya)</span>
            <div className="text-xl font-bold font-editorial text-amber-400">
              {snapshot.planets.Sun.rashiName} ({snapshot.planets.Sun.rashiEn})
            </div>
            <div className="text-zinc-300">Degree: {snapshot.planets.Sun.degreeStr}</div>
            <div className="text-zinc-400">Nakshatra: {snapshot.planets.Sun.nakshatra?.name}</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase">Active Vimshottari Period</span>
            <div className="text-xl font-bold font-editorial text-amber-400">
              {snapshot.dasha.currentPeriodString}
            </div>
            <div className="text-zinc-300">Balance: {snapshot.dasha.startingBalance}</div>
          </div>
        </div>
      )}

      {snapshot && activeTab === 'planets' && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-x-auto font-mono text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                <th className="pb-2">Graha</th>
                <th className="pb-2">Sanskrit</th>
                <th className="pb-2">Sidereal Longitude</th>
                <th className="pb-2">Rashi (Sign)</th>
                <th className="pb-2">Degree</th>
                <th className="pb-2">Bhava</th>
                <th className="pb-2">Nakshatra & Pada</th>
                <th className="pb-2">Dignity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {snapshot.planetsArray.map((p: any, idx: number) => (
                <tr key={idx} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-2.5 font-bold text-white">{p.symbol} {p.name}</td>
                  <td className="py-2.5 text-zinc-400">{p.sanskrit}</td>
                  <td className="py-2.5">{p.longitude.toFixed(4)}°</td>
                  <td className="py-2.5 text-amber-200">{p.rashiName} ({p.rashiEn})</td>
                  <td className="py-2.5">{p.degreeStr}</td>
                  <td className="py-2.5">{p.house}th House</td>
                  <td className="py-2.5">{p.nakshatra?.name} (P{p.pada})</td>
                  <td className="py-2.5">{p.dignity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {snapshot && activeTab === 'panchang' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-amber-400 font-bold">Udaya Tithi (Day Tithi):</span>
            <div className="text-base font-bold text-white">{snapshot.birthPanchang.udayaTithi.fullName}</div>
            <div className="text-zinc-400">Instantaneous: {snapshot.birthPanchang.instantaneousTithi.name} ({snapshot.birthPanchang.instantaneousTithi.progressPercent}%)</div>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-amber-400 font-bold">Sun & Diurnal Timings:</span>
            <div>Sunrise: {snapshot.birthPanchang.sun.sunrise} | Sunset: {snapshot.birthPanchang.sun.sunset}</div>
            <div className="text-red-400">Rahu Kaal: {snapshot.birthPanchang.timings.rahuKalam}</div>
          </div>
        </div>
      )}

      {snapshot && activeTab === 'dasha' && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono text-xs">
          <div className="text-amber-400 font-bold">120-Year Vimshottari Dasha Schedule (3-Tier)</div>
          <div className="space-y-2">
            {snapshot.dasha.mahadashas.map((md: any, idx: number) => (
              <div key={idx} className={`p-3 rounded-lg border ${md.isCurrent ? 'bg-amber-500/10 border-amber-500/40' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex justify-between font-bold text-white">
                  <span>{md.lord} Mahadasha ({md.actualDurationYears} yrs)</span>
                  <span>{md.startFormatted} – {md.endFormatted}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {snapshot && activeTab === 'vargas' && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs">
          <div className="text-amber-400 font-bold mb-3">D9 Navamsha Placements</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {snapshot.vargas.d9Navamsha.map((item: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <div className="font-bold text-white">{item.planet} {item.isVargottama && '🌟'}</div>
                <div className="text-zinc-400">D1: {item.natalRashi} ➔ D9: <strong className="text-amber-300">{item.navamshaRashi}</strong> (P{item.pada})</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

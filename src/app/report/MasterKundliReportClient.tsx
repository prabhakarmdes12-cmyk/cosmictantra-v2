'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Download, 
  Printer, 
  Shield, 
  Compass, 
  BookOpen, 
  Layers, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  Calendar, 
  FileText, 
  Info, 
  Grid, 
  Clock, 
  MapPin, 
  User, 
  Edit3, 
  ArrowLeft,
  X,
  Share2,
  Search,
  Navigation,
  LayoutDashboard,
  ChevronDown,
  Telescope
} from 'lucide-react';
import { getCanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';
import { generateKundliBookModel, BookVolume } from '@/lib/jyotish/kundliBookModel';
import NorthIndianChart from '@/components/NorthIndianChart';
import GlobalHeader from '@/components/layout/GlobalHeader';
import LanguageSelectorModal from '@/components/layout/LanguageSelectorModal';
import { CosmicTantraEmblem } from '@/components/visual/CosmicTantraLogo';
import { chitiSensory } from '@/lib/chitiAudio';
import { generateKundliV40Pdf } from '@/lib/kundli/v40/pipelineV2';
import { getActiveProfile } from '@/lib/profileStore';
import { KUNDLI_SAFE_MESSAGES } from '@/lib/kundli/errors';
import { searchCities } from '@/lib/cities';
import type { PipelineState, RawBirthInput } from '@/lib/kundli/types';
import ExecutiveLifeGaugeDashboard from '@/components/kundli/ExecutiveLifeGaugeDashboard';
import { computeExecutiveLifeDimensions, computeGrahaArchetypeCards } from '@/lib/jyotish/executiveLifeGauge';

/**
 * Kundli UI chrome localization — the selected language drives the report
 * surface (header, toolbar, section headings, progress strip). The astral
 * content itself stays in its canonical English/Sanskrit form; the PDF
 * pipeline additionally receives the locale for its own rendering.
 */
const KUNDLI_UI: Record<string, { en: string; hi: string }> = {
  title: { en: 'COSMICTANTRA MASTER KUNDLI', hi: 'कॉस्मिकटंत्र मास्टर कुण्डली' },
  sample: { en: 'Sample data — edit to yours', hi: 'नमूना डेटा — अपना विवरण दर्ज करें' },
  overview: { en: 'Overview', hi: 'अवलोकन' },
  book17: { en: '17-Volume Book', hi: '१७-खण्ड पुस्तक' },
  book: { en: 'Book', hi: 'पुस्तक' },
  workbench: { en: 'Workbench', hi: 'कार्यक्षेत्र' },
  charts: { en: 'Charts', hi: 'चार्ट' },
  simple: { en: 'Simple', hi: 'सरल' },
  detailed: { en: 'Detailed', hi: 'विस्तृत' },
  scholarly: { en: 'Scholarly', hi: 'विद्वत्' },
  edition: { en: 'Edition', hi: 'संस्करण' },
  client: { en: 'Client', hi: 'जातक' },
  pandit: { en: 'Pandit', hi: 'पण्डित' },
  scholar: { en: 'Scholar', hi: 'शास्त्री' },
  clientEdition: { en: 'Client Reading — plain, for the chart owner', hi: 'जातक पाठ — सरल, मालिक के लिए' },
  panditEdition: { en: 'Pandit Workbench — full chart intelligence', hi: 'पण्डित कार्यपत्र — सम्पूर्ण कुण्डली विवेचन' },
  scholarEdition: { en: 'Scholar Edition — workbook + evidence appendix', hi: 'शास्त्री संस्करण — कार्यपत्र + प्रमाण परिशिष्ट' },
  editDetails: { en: 'Edit Details', hi: 'विवरण बदलें' },
  editTitle: { en: 'Edit Birth Details', hi: 'जन्म विवरण बदलें' },
  print: { en: 'PRINT / SAVE PDF', hi: 'प्रिंट / पीडीएफ़ सेव करें' },
  download: { en: 'DOWNLOAD PDF', hi: 'पीडीएफ़ डाउनलोड' },
  validating: { en: 'VALIDATING…', hi: 'जाँच हो रही है…' },
  gen: { en: 'Kundli generation', hi: 'कुण्डली निर्माण' },
  stInput: { en: 'Birth details validated', hi: 'जन्म विवरण सत्यापित' },
  stCalc: { en: 'Chart calculated', hi: 'चार्ट गणना पूर्ण' },
  stReport: { en: 'Report assembled', hi: 'रिपोर्ट तैयार' },
  stRendered: { en: 'PDF rendered', hi: 'पीडीएफ़ निर्मित' },
  stValidated: { en: 'Quality checked', hi: 'गुणवत्ता जाँच' },
  glance: { en: 'Kundli at a Glance', hi: 'कुण्डली एक दृष्टि में' },
  graha: { en: 'Graha Positions:', hi: 'ग्रह स्थितियाँ:' },
  dasha: { en: 'Vimshottari Dasha — 120-year cycle', hi: 'विंशोत्तरी दशा — १२० वर्षीय चक्र' },
  volumes: { en: 'The 17-Volume Kundli — tap a volume to open or close it', hi: '१७-खण्ड कुण्डली ग्रन्थ — खोलने हेतु किसी खण्ड पर टैप करें' },
  ganeshSub: { en: 'Shri Ganeshaya Namah — may this Kundli be auspicious', hi: 'श्री गणेशाय नमः — यह कुण्डली शुभ हो' },
  backHome: { en: 'Back to Home', hi: 'होम पर वापस' },
  lagna: { en: 'Lagna', hi: 'लग्न' },
  moonRashi: { en: 'Moon Rashi', hi: 'चन्द्र राशि' },
  janmaNakshatra: { en: 'Janma Nakshatra', hi: 'जन्म नक्षत्र' },
  tithi: { en: 'Tithi', hi: 'तिथि' },
  manglik: { en: 'Manglik', hi: 'मांगलिक' },
  udayaTithi: { en: 'Udaya Tithi', hi: 'उदया तिथि' },
  pada: { en: 'pada', hi: 'चरण' },
  notPresent: { en: 'Not present', hi: 'नहीं है' },
  cancelled: { en: 'Cancelled', hi: 'रद्द' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  recalc: { en: 'Recalculate Chart', hi: 'चार्ट पुनः गणना करें' },
  latitude: { en: 'Latitude', hi: 'अक्षांश' },
  longitude: { en: 'Longitude', hi: 'देशांतर' },
  utcOffset: { en: 'UTC Offset', hi: 'यूटीसी अंतर' },
  editBirthDetails: { en: 'Edit Birth Details', hi: 'जन्म विवरण संपादित करें' },
  enterBoth: { en: 'Enter both latitude and longitude — they are required together.', hi: 'अक्षांश और देशांतर दोनों दर्ज करें — दोनों आवश्यक हैं।' },
};

/**
 * Vimshottari 120-year timeline: one segment per Mahadasha, a "now" marker,
 * and antardasha chips for the selected period (default: current).
 */
function DashaTimeline({ mahadashas, currentAD, selectedIndex, onSelect }: {
  mahadashas: any[];
  currentAD: string;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const [nowPct, setNowPct] = useState(0);
  // The NOW marker position derives from Date.now() — computing it during
  // render makes server and client HTML differ by milliseconds (React
  // hydration mismatch warning). Compute it only after mount.
  useEffect(() => {
    if (!Array.isArray(mahadashas) || mahadashas.length === 0) return;
    const start = new Date(mahadashas[0].startDate).getTime();
    const end = new Date(mahadashas[mahadashas.length - 1].endDate).getTime();
    const span = Math.max(end - start, 1);
    setNowPct(Math.min(100, Math.max(0, ((Date.now() - start) / span) * 100)));
  }, [mahadashas]);
  if (!Array.isArray(mahadashas) || mahadashas.length === 0) return null;
  const start = new Date(mahadashas[0].startDate).getTime();
  const end = new Date(mahadashas[mahadashas.length - 1].endDate).getTime();
  const span = Math.max(end - start, 1);
  const colors = ['#C2410C', '#0284C7', '#DC2626', '#16A34A', '#D97706', '#DB2777', '#4F46E5', '#7C3AED', '#0D9488'];
  const currentIdx = mahadashas.findIndex((m) => m.isCurrent);
  const active = selectedIndex >= 0 ? selectedIndex : (currentIdx >= 0 ? currentIdx : 0);
  const sel = mahadashas[active] ?? mahadashas[0];
  return (
    <div className="space-y-3">
      <div>
        <div className="relative h-14">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 rounded-full bg-[#F5EFE6] dark:bg-[#1C1E27] border border-[#E5D7BC] dark:border-white/10 overflow-hidden">
            {mahadashas.map((m: any, i: number) => {
              const ms = new Date(m.startDate).getTime();
              const me = new Date(m.endDate).getTime();
              const w = Math.max(((me - ms) / span) * 100, 1.5);
              const left = ((ms - start) / span) * 100;
              // Fit the lord name to the segment: full name on wide segments,
              // abbreviation on narrow ones — never clipped text.
              const label =
                w >= 7 ? m.lord
                  : w >= 4.5 ? m.lord.slice(0, 4)
                    : (m.lord === 'Mercury' ? 'Mer' : m.lord.slice(0, 3));
              return (
                <button
                  key={m.lord}
                  onClick={() => onSelect(i)}
                  title={`${m.lord}: ${String(m.startDate).slice(0, 10)} – ${String(m.endDate).slice(0, 10)}`}
                  className={`absolute top-0 bottom-0 text-[8px] font-bold text-white flex items-center justify-center overflow-hidden transition-all border-r border-white/50 ${m.isCurrent ? 'ring-2 ring-[#8E6F1D] z-10' : 'hover:brightness-110'}`}
                  style={{ left: `${left}%`, width: `${w}%`, background: colors[i % colors.length], opacity: m.isCurrent ? 1 : 0.78 }}
                >
                  <span className="px-0.5">{label}</span>
                </button>
              );
            })}
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-[#1C1917] dark:bg-[#EFECE6] rounded" style={{ left: `${nowPct}%` }}>
            <span className="absolute -top-0.5 -translate-x-1/2 text-[8px] font-bold text-[#1C1917] dark:text-[#EFECE6] whitespace-nowrap bg-[#F5EFE6] dark:bg-[#1C1E27] px-1 rounded-full leading-none">● NOW</span>
          </div>
        </div>
        <div className="flex justify-between text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-1">
          <span>{String(mahadashas[0].startDate).slice(0, 4)}</span>
          <span>{String(mahadashas[mahadashas.length - 1].endDate).slice(0, 4)}</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] mb-1.5">
          {sel?.lord} Mahadasha — Antardashas
          {selectedIndex >= 0 && (
            <button onClick={() => onSelect(-1)} className="ml-2 text-[9px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] underline underline-offset-2">
              back to current
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(sel?.antardashas ?? []).map((ad: any) => {
            const isCur = ad.lord === currentAD && !!sel?.isCurrent;
            return (
              <span
                key={ad.lord}
                title={`${ad.lord}: ${String(ad.startDate).slice(0, 10)} – ${String(ad.endDate).slice(0, 10)}`}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${isCur ? 'bg-[#8E6F1D] text-white border-[#8E6F1D]' : 'bg-white dark:bg-[#121422] text-[#44403C] dark:text-[#D1C9BF] border-[#E5D7BC] dark:border-white/10'}`}
              >
                {ad.lord}
                <span className={`font-mono-data ${isCur ? 'text-amber-100' : 'text-[#78716C] dark:text-[#A8A29E]'}`}> · {String(ad.startDate).slice(0, 10)}</span>
                {isCur && <span className="ml-1 text-[8px] font-bold uppercase">◀ current</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function resolveCoherentCoordinates(locName: string, curLat: number, curLng: number, curTz: number) {
  if (!locName || !locName.trim()) return { lat: curLat, lng: curLng, tz: curTz, resolvedLoc: locName };
  const candidates = searchCities(locName);
  const queryTokens = locName.toLowerCase().split(/[\s,]+/);
  const matched = candidates.find(c => {
    const cName = c.name.toLowerCase();
    return queryTokens.some(tok => tok.length >= 3 && (cName.includes(tok) || tok.includes(cName)));
  });
  if (matched) {
    const delta = (!Number.isFinite(curLat) || !Number.isFinite(curLng)) ? 999 : Math.hypot(matched.lat - curLat, matched.lng - curLng);
    if (delta > 1.5) {
      return { lat: matched.lat, lng: matched.lng, tz: matched.tz ?? 5.5, resolvedLoc: `${matched.name}, ${matched.state}` };
    }
  }
  return { lat: curLat, lng: curLng, tz: curTz, resolvedLoc: locName };
}

export default function MasterKundliReportClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active view mode: Overview (default, progressive disclosure) vs
  // 17-Volume Encyclopedic Folio vs Interactive Visual Workbench
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FOLIO' | 'WORKBENCH'>('OVERVIEW');
  const [selectedMdIndex, setSelectedMdIndex] = useState<number>(-1); // -1 => current mahadasha
  const [chartPlanet, setChartPlanet] = useState<{ name: string; house: number } | null>(null);
  const [readingDepth, setReadingDepth] = useState<'SIMPLE' | 'DETAILED' | 'PANDIT'>('DETAILED');
  const [activeGraha, setActiveGraha] = useState<string | null>('Saturn');
  // Accordion-style volume browsing: first volume open, the rest collapsed.
  const [openVolumes, setOpenVolumes] = useState<Set<number>>(() => new Set([0]));
  const [activeDivision, setActiveDivision] = useState<number>(1); // 1 = D1, 9 = D9, 10 = D10, 60 = D60
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lang, setLang] = useState('en');
  // PDF language is intentionally narrower than the site-wide chrome locale:
  // the qualified V3 report currently supports these three authored editions.
  const [pdfLocale, setPdfLocale] = useState<'en' | 'hi' | 'hi-en'>('en');
  // Audience edition for the qualified PDF. Default remains SCHOLAR so that a
  // first-time reader gets the full, verifiable document, but a novice can now
  // choose the 11-page Client Reading instead of never seeing it.
  const [pdfMode, setPdfMode] = useState<'CLIENT' | 'PANDIT' | 'SCHOLAR'>('SCHOLAR');
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Theme hydration: mirror the site-wide contract — read the persisted
  // theme once on mount and mirror it onto <html> so Tailwind dark: variants
  // (and the GlobalHeader Sun/Moon toggle) behave exactly like every other
  // page. Persisting happens ONLY on explicit toggle, never on mount.
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cosmictantra_theme') as 'light' | 'dark' | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    } catch {}
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    try { localStorage.setItem('cosmictantra_theme', nextTheme); } catch {}
    if (nextTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  // Selected-language surface: mirrors the home page contract — keep <html
  // lang> in sync and persist the choice. Persisting happens ONLY on explicit
  // user selection (never on mount) so a saved language is never clobbered
  // by the initial 'en' state — even under StrictMode's double effect pass.
  const t = (key: keyof typeof KUNDLI_UI) => KUNDLI_UI[key][lang === 'hi' ? 'hi' : 'en'];
  const handleSelectLang = (code: string) => {
    setLang(code);
    // A global Hindi/English choice should be reflected in the next generated
    // PDF, while an explicit bilingual PDF choice remains intact.
    if (code === 'hi' || code === 'en') setPdfLocale(code);
    document.documentElement.lang = code;
    try { localStorage.setItem('cosmictantra_lang', code); } catch {}
  };

  // P0 UX: demo chip, city autocomplete, live validation, geolocation
  const [isDemoProfile, setIsDemoProfile] = useState(true);
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<ReturnType<typeof searchCities>>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Dynamic Birth Input State (URL params > localStorage > Default Bilaspur 1989)
  const [birthState, setBirthState] = useState({
    name: 'Prabhakar Sharma',
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    locationName: 'Bilaspur, Chhattisgarh, India'
  });

  // Pipeline state (KUNDLI_INV_015 / fail-safe UX)
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [failSafe, setFailSafe] = useState<{ message: string; code: string } | null>(null);
  const [lastPdfMeta, setLastPdfMeta] = useState<{ pageCount: number; fileSizeKB: number } | null>(null);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  // RAW input that faithfully reflects what the caller actually supplied.
  // NO silent default substitution happens here — the pipeline validates it.
  const rawInputRef = useRef<RawBirthInput | null>(null);

  // The demo profile is a complete, explicit PROFILE (never a fallback).
  const DEMO_PROFILE = {
    name: 'Prabhakar Sharma',
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    locationName: 'Bilaspur, Chhattisgarh, India'
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('cosmictantra_lang');
    if (savedLanguage) {
      setLang(savedLanguage);
      if (savedLanguage === 'hi' || savedLanguage === 'en') setPdfLocale(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }

    // 1. Check URL parameters — record EXACTLY what was provided.
    const paramName = searchParams.get('name');
    const paramDob = searchParams.get('dob');
    const paramTob = searchParams.get('tob');
    const paramCity = searchParams.get('city');
    const paramLat = searchParams.get('lat');
    const paramLng = searchParams.get('lng') || searchParams.get('lon');
    const paramTz = searchParams.get('tz');
    const paramTzId = searchParams.get('tzid');

    const urlProvided = paramDob || paramLat || paramCity || paramName;

    if (urlProvided) {
      // Display state keeps the legacy look, but the RAW input preserves
      // the caller's true values — including what is MISSING.
      let initialLat = paramLat ? parseFloat(paramLat) : Number.NaN;
      let initialLng = paramLng ? parseFloat(paramLng) : Number.NaN;
      let initialTz = paramTz ? parseFloat(paramTz) : Number.NaN;
      let initialCity = paramCity || '';

      const coherent = resolveCoherentCoordinates(initialCity, initialLat, initialLng, initialTz);
      initialLat = coherent.lat;
      initialLng = coherent.lng;
      initialTz = coherent.tz;
      initialCity = coherent.resolvedLoc;

      rawInputRef.current = {
        ...(paramName ? { name: paramName } : {}),
        ...(paramDob ? { birthDate: paramDob } : {}),
        ...(paramTob ? { birthTime: paramTob } : {}),
        ...(initialCity ? { locationName: initialCity } : {}),
        ...(Number.isFinite(initialLat) ? { latitude: initialLat } : {}),
        ...(Number.isFinite(initialLng) ? { longitude: initialLng } : {}),
        ...(Number.isFinite(initialTz) ? { utcOffsetHours: initialTz } : {}),
        ...(paramTzId ? { timezoneId: paramTzId } : {}),
        coordinateProvenance: (Number.isFinite(initialLat) && Number.isFinite(initialLng)) ? 'MANUAL' : undefined
      };
      setBirthState({
        name: paramName || '',
        birthDate: paramDob || '',
        birthTime: paramTob || '',
        latitude: initialLat,
        longitude: initialLng,
        timezone: initialTz,
        locationName: initialCity
      });
      setIsDemoProfile(false);
      return;
    }

    // 2. Check localStorage (complete profile or nothing — no partial merging)
    try {
      const saved = localStorage.getItem('cosmictantra_active_kundli');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasComplete = parsed.birthDate && parsed.birthTime && (parsed.latitude !== undefined || parsed.birthLat !== undefined) && (parsed.longitude !== undefined || parsed.birthLon !== undefined || parsed.lng !== undefined);
        if (hasComplete) {
          let lat = Number(parsed.latitude ?? parsed.birthLat);
          let lng = Number(parsed.longitude ?? parsed.birthLon ?? parsed.lng);
          let tz = Number(parsed.timezone) || 5.5;
          let loc = parsed.city || parsed.locationName || 'India';
          const coherent = resolveCoherentCoordinates(loc, lat, lng, tz);
          lat = coherent.lat;
          lng = coherent.lng;
          tz = coherent.tz;
          loc = coherent.resolvedLoc;

          rawInputRef.current = {
            name: parsed.name || 'Seeker',
            birthDate: parsed.birthDate,
            birthTime: parsed.birthTime,
            locationName: loc,
            latitude: lat,
            longitude: lng,
            utcOffsetHours: tz,
            coordinateProvenance: 'PROFILE'
          };
          setBirthState({
            name: parsed.name || 'Seeker',
            birthDate: parsed.birthDate,
            birthTime: parsed.birthTime,
            latitude: lat,
            longitude: lng,
            timezone: tz,
            locationName: loc
          });
          setIsDemoProfile(false);
          return;
        }
      }
    } catch {}

    // 2b. Check Unified Profile Store (getActiveProfile)
    try {
      const active = getActiveProfile();
      if (active && active.birthDate && active.birthTime && (active.lat !== undefined || active.latitude !== undefined) && (active.lng !== undefined || active.longitude !== undefined)) {
        let lat = Number(active.lat ?? active.latitude);
        let lng = Number(active.lng ?? active.longitude);
        let tz = Number(active.tz ?? active.timezone) || 5.5;
        let loc = active.birthCity || active.city || active.locationName || 'India';
        const coherent = resolveCoherentCoordinates(loc, lat, lng, tz);
        lat = coherent.lat;
        lng = coherent.lng;
        tz = coherent.tz;
        loc = coherent.resolvedLoc;

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const profilePayload = {
            name: active.name || 'Seeker',
            birthDate: active.birthDate,
            birthTime: active.birthTime,
            latitude: lat,
            longitude: lng,
            timezone: tz,
            locationName: loc
          };
          rawInputRef.current = {
            ...profilePayload,
            utcOffsetHours: profilePayload.timezone,
            coordinateProvenance: 'PROFILE'
          };
          setBirthState(profilePayload);
          setIsDemoProfile(false);
          try {
            localStorage.setItem('cosmictantra_active_kundli', JSON.stringify(profilePayload));
          } catch {}
          return;
        }
      }
    } catch {}

    // 3. Complete demo profile (explicit PROFILE provenance) — clearly
    // labelled as sample data so nobody mistakes it for their own chart.
    rawInputRef.current = { ...DEMO_PROFILE, coordinateProvenance: 'PROFILE' };
    setIsDemoProfile(true);
  }, [searchParams]);

  // Whether the display input is complete enough to run the chart workspace.
  // (The qualified PDF pipeline performs its own strict validation; this flag
  // only protects the interactive preview from NaN coordinates.)
  const inputComplete = Number.isFinite(birthState.latitude) &&
    Number.isFinite(birthState.longitude) &&
    Boolean(birthState.birthDate) && Boolean(birthState.birthTime) && Boolean(birthState.name);

  // Live validation mirror of pipeline GATE 1 — surfaces problems while the
  // user types, before any generation attempt.
  const validateLive = (b: typeof birthState): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!b.name.trim()) e.name = 'Name is required.';
    if (!b.birthDate) e.birthDate = 'Birth date is required.';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(b.birthDate)) e.birthDate = 'Use YYYY-MM-DD.';
    else {
      const [y, m, d] = b.birthDate.split('-').map(Number);
      if (m < 1 || m > 12 || d < 1 || d > 31) e.birthDate = 'Date is out of range.';
    }
    if (!b.birthTime) e.birthTime = 'Birth time is required.';
    else if (!/^\d{1,2}:\d{2}/.test(b.birthTime)) e.birthTime = 'Use HH:MM (24h).';
    if (!Number.isFinite(b.latitude) || !Number.isFinite(b.longitude)) {
      e.lat = 'Latitude and longitude are required together.';
    } else {
      if (b.latitude < -90 || b.latitude > 90) e.lat = 'Latitude must be -90…90.';
      if (b.longitude < -180 || b.longitude > 180) e.lng = 'Longitude must be -180…180.';
      if (b.locationName) {
        const candidates = searchCities(b.locationName);
        const queryTokens = b.locationName.toLowerCase().split(/[\s,]+/);
        const matched = candidates.filter(c => {
          const cName = c.name.toLowerCase();
          return queryTokens.some(tok => tok.length >= 3 && (cName.includes(tok) || tok.includes(cName)));
        });
        if (matched.length > 0) {
          const minDelta = Math.min(...matched.map(c => Math.hypot(c.lat - b.latitude, c.lng - b.longitude)));
          if (minDelta > 1.5) {
            e.lat = `Coordinates do not match "${b.locationName}". Select from suggestions to update.`;
          }
        }
      }
    }
    return e;
  };

  const cityAutocomplete = (q: string) => {
    setCityQuery(q);
    if (!q.trim()) { setCitySuggestions([]); setShowCitySuggestions(false); return; }
    const hits = searchCities(q).slice(0, 6);
    setCitySuggestions(hits);
    setShowCitySuggestions(hits.length > 0);
  };

  const pickCity = (c: { name: string; state: string; lat: number; lng: number; tz: number }) => {
    setBirthState((prev) => ({
      ...prev,
      locationName: `${c.name}, ${c.state}`,
      latitude: c.lat,
      longitude: c.lng,
      timezone: c.tz
    }));
    setCityQuery('');
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    setFieldErrors((prev) => ({ ...prev, lat: '', lng: '' }));
  };

  const useMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setFieldErrors((prev) => ({ ...prev, lat: 'Location access is not available on this device.' }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBirthState((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          locationName: prev.locationName || 'My location'
        }));
        setFieldErrors((prev) => ({ ...prev, lat: '', lng: '' }));
        setLocating(false);
      },
      () => {
        setFieldErrors((prev) => ({ ...prev, lat: 'Could not read your location. Please type the city or coordinates.' }));
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // Surface the fail-safe immediately when the caller's input was incomplete.
  useEffect(() => {
    if (!inputComplete && rawInputRef.current && !isGeneratingPdf) {
      setFailSafe({
        message: 'We could not complete this Kundli correctly. Your report has not been issued. Please verify the birth details (name, date, time and both coordinates) or contact CosmicTantra support.',
        code: 'KUNDLI_INPUT_INVALID'
      });
    }
  }, [inputComplete, isGeneratingPdf]);

  // Compute Canonical Astronomical Snapshot & 17-Volume Book Model
  // (preview only — the PDF path never uses this fallback data)
  const displayProfile = inputComplete ? birthState : DEMO_PROFILE;
  const snapshot = useMemo(() => {
    return getCanonicalJyotishSnapshot({
      birthDate: displayProfile.birthDate,
      birthTime: displayProfile.birthTime,
      latitude: displayProfile.latitude,
      longitude: displayProfile.longitude,
      timezone: Number.isFinite(displayProfile.timezone) ? displayProfile.timezone : 5.5,
      locationName: displayProfile.locationName
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayProfile.birthDate, displayProfile.birthTime, displayProfile.latitude, displayProfile.longitude, displayProfile.timezone, displayProfile.locationName]);

  const book = useMemo(() => {
    return generateKundliBookModel(birthState.name, snapshot, 'COMPLETE_VEDIC_KUNDLI');
  }, [birthState.name, snapshot]);

  const chartD1Obj = useMemo(() => ({
    lagna: snapshot.lagna,
    houses: snapshot.houses,
    planets: snapshot.planets
  }), [snapshot]);

  const executiveLifeDimensions = useMemo(() => {
    return computeExecutiveLifeDimensions(snapshot);
  }, [snapshot]);

  const grahaArchetypeCards = useMemo(() => {
    return computeGrahaArchetypeCards(snapshot);
  }, [snapshot]);

  const chartD9Obj = useMemo(() => {
    const v9 = snapshot.vargas?.shodashavarga?.[9];
    if (!v9) return chartD1Obj;
    return {
      lagna: {
        rashiId: v9.lagna.vargaRashiId,
        rashiName: v9.lagna.vargaRashiName
      },
      houses: v9.houses.map(h => ({
        number: h.houseNumber,
        rasiId: h.rashiId,
        rasiName: h.rashiName,
        planets: h.planetsInHouse.map(pName => {
          const pObj = v9.planets[pName];
          return {
            name: pName,
            degrees: pObj?.divisionDegree || 0,
            degreeStr: `${Math.floor((pObj?.divisionDegree || 0) % 30)}°`
          };
        })
      })),
      planets: v9.planets
    };
  }, [snapshot, chartD1Obj]);

  const activeChartData = useMemo(() => {
    if (activeDivision === 1) return chartD1Obj;
    const v = snapshot.vargas?.shodashavarga?.[activeDivision];
    if (!v) return chartD1Obj;
    return {
      lagna: {
        rashiId: v.lagna.vargaRashiId,
        rashiName: v.lagna.vargaRashiName
      },
      houses: v.houses.map(h => ({
        number: h.houseNumber,
        rasiId: h.rashiId,
        rasiName: h.rashiName,
        planets: h.planetsInHouse.map(pName => {
          const pObj = v.planets[pName];
          return {
            name: pName,
            degrees: pObj?.divisionDegree || 0,
            degreeStr: `${Math.floor((pObj?.divisionDegree || 0) % 30)}°`
          };
        })
      })),
      planets: v.planets
    };
  }, [activeDivision, snapshot, chartD1Obj]);

  const grahas = snapshot.planetsArray;

  const selectedPlanetInfo = useMemo(() => {
    if (!chartPlanet) return null;
    const g = (Array.isArray(grahas) ? grahas : []).find((p: any) => p.name === chartPlanet.name);
    if (!g) return null;
    return {
      name: g.name,
      sanskrit: g.sanskrit || '',
      rashiName: g.rashiName || '',
      rashiEn: g.rashiEn || '',
      degreeStr: g.degreeStr || '',
      nakshatra: g.nakshatra?.name ?? '',
      pada: g.pada ?? g.nakshatra?.pada ?? '',
      house: chartPlanet.house || g.house,
      isRetrograde: !!g.isRetrograde,
      dignity: g.dignity || g.status || 'NEUTRAL',
      karaka: g.karaka || '',
      nature: g.nature || '',
      longitude: g.longitude ?? null
    };
  }, [chartPlanet, grahas]);

  const toggleVolume = (idx: number) => {
    chitiSensory.playTick();
    setOpenVolumes((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  type PdfAction = 'download' | 'print';

  /** Start a browser download from the one qualified V3 response. */
  const savePdfBlob = (blob: Blob, objectUrl: string, name: string) => {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Keep the blob alive long enough for the browser download hand-off, then
    // release it even if the user navigates away.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 15_000);
  };

  /**
   * The sole client path for a qualified report artifact.
   *
   * Download and Print deliberately POST the identical birth/mode/locale
   * payload to `/api/kundli/pdf`. Print never prints the interactive HTML: it
   * opens the returned V3 PDF in the browser's native PDF viewer, whose Print
   * command is the same file the Download action saves.
   */
  const requestQualifiedPdf = async (
    action: PdfAction,
    printWindow?: Window | null,
  ) => {
    let printDelivered = false;
    setIsGeneratingPdf(true);
    setFailSafe(null);
    setPdfNotice(null);
    setLastPdfMeta(null);
    setPipelineState('INPUT_VALIDATED');
    try {
      const raw = (rawInputRef.current ?? {}) as RawBirthInput;
      setPipelineState('CALCULATION_COMPLETE');

      const response = await fetch('/api/kundli/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth: raw,
          mode: pdfMode,
          locale: pdfLocale,
        }),
      });

      if (response.status === 429) {
        setFailSafe({
          message: 'Too many Kundli downloads in a short time. Please wait a minute and try again.',
          code: 'KUNDLI_RATE_LIMITED',
        });
        return;
      }

      if (!response.ok) {
        let code = 'KUNDLI_PDF_RENDER_FAILED';
        try {
          const detail = await response.json();
          if (typeof detail?.errorCode === 'string') code = detail.errorCode;
        } catch { /* non-JSON error body — keep the generic code */ }
        setFailSafe({
          message:
            KUNDLI_SAFE_MESSAGES[code as keyof typeof KUNDLI_SAFE_MESSAGES] ??
            KUNDLI_SAFE_MESSAGES.KUNDLI_PDF_RENDER_FAILED,
          code,
        });
        return;
      }

      setPipelineState('PDF_VALIDATED');
      const blob = await response.blob();
      const pages = Number(response.headers.get('X-Kundli-Pages') ?? '0');
      const disposition = response.headers.get('Content-Disposition') ?? '';
      const match = /filename="([^"]+)"/.exec(disposition);
      const safeName = (raw.name || 'Seeker').replace(/[^a-z0-9]+/gi, '_');
      const dob = raw.birthDate || 'birthdate';
      const name = match?.[1] ?? `Kundli_${safeName}_${dob}.pdf`;
      const objectUrl = URL.createObjectURL(blob);

      if (action === 'print' && printWindow && !printWindow.closed) {
        // The tab was opened synchronously in the click handler. That preserves
        // popup permission while the server renders; navigating it to a Blob
        // keeps the browser's PDF print controls bound to this exact response.
        printWindow.location.replace(objectUrl);
        printDelivered = true;
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60_000);

        // A browser with its PDF viewer disabled can turn a Blob navigation
        // into a download and leave the preparatory popup at about:blank. Do
        // not leave a misleading empty tab behind: the already-issued file is
        // still the same qualified Blob, and the visitor is told to print it
        // from their download viewer. A native PDF viewer navigates away from
        // about:blank (or becomes cross-origin), so it is never interrupted.
        window.setTimeout(() => {
          try {
            if (!printWindow.closed && printWindow.location.href === 'about:blank') {
              printWindow.close();
              setPdfNotice('Your browser downloaded the qualified PDF instead of opening a print viewer. Open the downloaded PDF and choose Print.');
            }
          } catch {
            // A native PDF viewer may use its own origin. That is a successful
            // hand-off, so there is deliberately nothing to do.
          }
        }, 4_000);
      } else {
        // Popup blockers must never downgrade the report. Save the same Blob
        // and let the visitor print it from their PDF viewer instead.
        savePdfBlob(blob, objectUrl, name);
        if (action === 'print') {
          setPdfNotice('Your browser blocked the PDF print tab. The qualified PDF was downloaded; open it and choose Print.');
        }
      }

      setPipelineState('READY_FOR_DELIVERY');
      setLastPdfMeta({
        pageCount: pages,
        fileSizeKB: Math.round(blob.size / 1024),
      });
    } catch (err) {
      console.error('[Kundli PDF] generation failed', err);
      setFailSafe({
        message: KUNDLI_SAFE_MESSAGES.KUNDLI_PDF_RENDER_FAILED,
        code: 'KUNDLI_PDF_RENDER_FAILED',
      });
    } finally {
      if (printWindow && !printWindow.closed && action === 'print' && !printDelivered) {
        // Error responses should not leave a misleading blank preparation tab.
        printWindow.close();
      }
      setIsGeneratingPdf(false);
      window.setTimeout(() => setPipelineState(null), 1200);
    }
  };

  const handleDownloadPDF = () => {
    chitiSensory.playTick();
    void requestQualifiedPdf('download');
  };

  const handlePrint = () => {
    chitiSensory.playTick();
    // Opening before the first await makes this robust against popup blockers.
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      try {
        printWindow.opener = null;
        printWindow.document.title = 'Preparing Kundli PDF';
        printWindow.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Preparing your qualified Kundli PDF…</p>';
      } catch { /* A restrictive browser can still navigate the tab below. */ }
    }
    void requestQualifiedPdf('print', printWindow);
  };

  return (
    <div className="min-h-screen kundli-paper bg-[#FDFBF7] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] font-sans antialiased pb-24 selection:bg-[#E5D7BC] dark:selection:bg-[#D4AF37]/40">

      {/* 0. Global site header (logo, navigation, language, day/night) */}
      <GlobalHeader
        lang={lang}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onLangToggle={() => setIsLangModalOpen(true)}
      />
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        currentLang={lang}
        onClose={() => setIsLangModalOpen(false)}
        onSelectLang={handleSelectLang}
      />

      {/* 1. Header Toolbar */}
      <header className="sticky top-16 sm:top-20 z-40 bg-[#FDFBF7]/95 dark:bg-[#07080C]/95 backdrop-blur-md border-b border-[#E5D7BC] dark:border-white/10 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 print:hidden">
        
        {/* Left: Branding & Subject Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-full bg-[#8E6F1D]/10 border border-[#8E6F1D]/30 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#8E6F1D] dark:hover:bg-[#D4AF37]/20 transition-all font-serif font-bold text-sm"
            title={t('backHome')}
          >
            ॐ
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base lg:text-lg tracking-tight text-[#1C1917] dark:text-[#EFECE6]">{t('title')}</span>
            </div>
            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] font-mono-data flex flex-wrap items-center gap-1.5">
              <strong>{birthState.name}</strong> • {birthState.birthDate}, {birthState.birthTime} • {birthState.locationName}
              {isDemoProfile && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-[#D4AF37]/15 text-amber-800 dark:text-amber-300 border border-amber-300 uppercase tracking-wide">
                  <Sparkles className="w-2.5 h-2.5" /> {t('sample')}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher (Overview / Folio / Workbench) */}
        <div className="flex items-center gap-1 bg-[#F5EFE6] dark:bg-[#1C1E27] p-1 rounded-xl border border-[#E5D7BC] dark:border-white/10">
          <button
            onClick={() => {
              chitiSensory.playTick();
              setActiveTab('OVERVIEW');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'OVERVIEW' ? 'bg-[#1C1917] dark:bg-[#D4AF37] text-[#FDFBF7] dark:text-[#060709] shadow-sm' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{t('overview')}</span>
          </button>
          <button
            onClick={() => {
              chitiSensory.playTick();
              setActiveTab('FOLIO');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'FOLIO' ? 'bg-[#1C1917] dark:bg-[#D4AF37] text-[#FDFBF7] dark:text-[#060709] shadow-sm' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('book17')}</span>
            <span className="sm:hidden">{t('book')}</span>
          </button>
          <button
            onClick={() => {
              chitiSensory.playTick();
              setActiveTab('WORKBENCH');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'WORKBENCH' ? 'bg-[#1C1917] dark:bg-[#D4AF37] text-[#FDFBF7] dark:text-[#060709] shadow-sm' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('workbench')}</span>
            <span className="sm:hidden">{t('charts')}</span>
          </button>
        </div>

        {/* Right: Actions (Depth, Print, Download, Edit) */}
        <div className="flex items-center gap-2">
          {activeTab === 'FOLIO' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#F5EFE6] dark:bg-[#1C1E27] p-1 rounded-lg border border-[#E5D7BC] dark:border-white/10 text-xs">
              {(['SIMPLE', 'DETAILED', 'PANDIT'] as const).map((depth) => (
                <button
                  key={depth}
                  onClick={() => setReadingDepth(depth)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${readingDepth === depth ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
                >
                  {depth === 'SIMPLE' ? t('simple') : depth === 'DETAILED' ? t('detailed') : t('scholarly')}
                </button>
              ))}
            </div>
          )}

          {/* Audience edition for the qualified server PDF. This is the gate
              that decides whether a novice receives the 11-page Client Reading
              or a 38-page Scholar workbook, so it must stay reachable on
              mobile exactly as the language selector does. */}
          <div
            className="flex shrink-0 items-center rounded-lg border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] p-0.5"
            role="group"
            aria-label="Qualified PDF edition"
          >
            {([
              ['CLIENT', t('client'), t('clientEdition')],
              ['PANDIT', t('pandit'), t('panditEdition')],
              ['SCHOLAR', t('scholar'), t('scholarEdition')],
            ] as const).map(([mode, label, accessibleLabel]) => (
              <button
                key={mode}
                type="button"
                onClick={() => { chitiSensory.playTick(); setPdfMode(mode); }}
                aria-label={accessibleLabel}
                aria-pressed={pdfMode === mode}
                title={accessibleLabel}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E6F1D] focus-visible:ring-offset-1 ${pdfMode === mode ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 
            Keep this selector in the mobile toolbar as well as on desktop.
            `hi-en` changes the qualified server-PDF payload; it is not a
            display-only translation toggle, so hiding it below `md` made the
            public bilingual report inaccessible to phone users.
          */}
          <div
            className="flex shrink-0 items-center rounded-lg border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] p-0.5"
            role="group"
            aria-label="Qualified PDF language"
          >
            {([
              ['en', 'EN', 'English PDF'],
              ['hi', 'हिन्दी', 'Hindi PDF'],
              ['hi-en', 'हि + EN', 'Hindi-English bilingual PDF'],
            ] as const).map(([locale, label, accessibleLabel]) => (
              <button
                key={locale}
                type="button"
                onClick={() => setPdfLocale(locale)}
                aria-label={accessibleLabel}
                aria-pressed={pdfLocale === locale}
                title={accessibleLabel}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E6F1D] focus-visible:ring-offset-1 ${pdfLocale === locale ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] hover:bg-[#F5EFE6] dark:bg-[#1C1E27] dark:hover:bg-[#1C1E27] transition-colors"
            title={t('editTitle')}
          >
            <Edit3 className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#F0C968]" />
            <span className="hidden sm:inline">{t('editDetails')}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 bg-white dark:bg-[#121422] hover:bg-[#F5EFE6] dark:bg-[#1C1E27] dark:hover:bg-[#1C1E27] text-[#8E6F1D] dark:text-[#F0C968] transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('print')}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#8E6F1D] hover:bg-[#785E18] text-white transition-colors shadow-sm disabled:opacity-60 disabled:cursor-wait"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isGeneratingPdf ? t('validating') : t('download')}</span>
            <span className="sr-only">{t('download')}</span>
          </button>
        </div>

      </header>

      {/* Generation progress / fail-safe strip (real backend states only) */}
      {(isGeneratingPdf || pipelineState || failSafe || pdfNotice) && (
        <div className="border-b border-[#E5D7BC] dark:border-white/10 bg-[#FAF6EF] dark:bg-[#161828] px-4 lg:px-8 py-3 print:hidden">
          {isGeneratingPdf ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-[11px] font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider">{t('gen')}</span>
              {[
                ['INPUT_VALIDATED', t('stInput')],
                ['CALCULATION_COMPLETE', t('stCalc')],
                ['REPORT_READY', t('stReport')],
                ['PDF_RENDERED', t('stRendered')],
                ['PDF_VALIDATED', t('stValidated')]
              ].map(([state, label]) => {
                const idx = ['INPUT_VALIDATED', 'CALCULATION_COMPLETE', 'REPORT_READY', 'PDF_RENDERED', 'PDF_VALIDATED', 'READY_FOR_DELIVERY'].indexOf(state);
                const cur = ['INPUT_VALIDATED', 'CALCULATION_COMPLETE', 'REPORT_READY', 'PDF_RENDERED', 'PDF_VALIDATED', 'READY_FOR_DELIVERY'].indexOf(pipelineState ?? '');
                const done = cur >= 0 && idx < cur;
                const active = pipelineState === state || (state === 'PDF_VALIDATED' && pipelineState === 'READY_FOR_DELIVERY');
                return (
                  <span key={state} className={`flex items-center gap-1.5 text-[11px] ${done || active ? 'text-[#1C1917] dark:text-[#EFECE6] font-semibold' : 'text-[#78716C] dark:text-[#A8A29E]'}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${done || active ? 'text-[#8E6F1D] dark:text-[#F0C968]' : ''}`} />
                    {label}
                  </span>
                );
              })}
              {lastPdfMeta && (
                <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                  ✓ {lastPdfMeta.pageCount} pages · {lastPdfMeta.fileSizeKB} KB · quality PASS
                </span>
              )}
            </div>
          ) : failSafe ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 max-w-3xl">
                <Shield className="w-4 h-4 text-[#B45309] dark:text-amber-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1C1917] dark:text-[#EFECE6]">
                    {lang === 'hi'
                      ? (failSafe.code === 'KUNDLI_INPUT_INVALID'
                          ? 'हम यह कुण्डली सही रूप से पूर्ण नहीं कर सके; रिपोर्ट जारी नहीं की गई। कृपया जन्म विवरण (नाम, तिथि, समय तथा दोनों निर्देशांक) जाँच कर पुनः प्रयास करें।'
                          : failSafe.code === 'KUNDLI_PDF_RENDER_FAILED' || failSafe.code === 'KUNDLI_PDF_QUALITY_FAILED'
                            ? 'पीडीएफ़ दस्तावेज़ तैयार नहीं हो सका। कृपया पुनः प्रयास करें।'
                            : failSafe.message)
                      : failSafe.message}
                  </p>
                  <p className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                    {lang === 'hi'
                      ? `तकनीकी कारण: ${failSafe.code} · कोई पीडीएफ़ जारी नहीं हुई।`
                      : `Engineering reason: ${failSafe.code} · No PDF was issued.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 bg-white dark:bg-[#121422] text-[#8E6F1D] dark:text-[#F0C968] hover:bg-[#F5EFE6] dark:bg-[#1C1E27] dark:hover:bg-[#1C1E27] transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" /> {lang === 'hi' ? 'जन्म विवरण जाँचें' : 'Verify birth details'}
              </button>
            </div>
          ) : pdfNotice ? (
            <div className="flex items-start gap-2.5 max-w-3xl">
              <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-xs font-semibold text-[#1C1917] dark:text-[#EFECE6]">{pdfNotice}</p>
            </div>
          ) : null}
        </div>
      )}

      {/* 1b. Ganesh Vandana — the traditional opening of a Kundli.
          Layout: Ganesh emblem left, invocation centred, CosmicTantra symbol
          right — mirrored exactly on the PDF cover. */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 print:hidden">
        <div className="flex items-center justify-between gap-3 py-3 px-4 sm:px-8 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-[#241D10] dark:via-[#161828] dark:to-[#241D10] border border-[#E5D7BC] dark:border-white/10">
          <img
            src="/images/ganesh_vandana_256.png"
            alt="Shri Ganesh"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full ring-1 ring-amber-200 object-cover shrink-0"
          />
          <div className="text-center min-w-0">
            <p className="text-base lg:text-lg font-serif font-bold text-[#8E6F1D] dark:text-[#F0C968]">॥ श्री गणेशाय नमः ॥</p>
            <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-mono-data">
              {t('ganeshSub')}
            </p>
          </div>
          <CosmicTantraEmblem className="w-12 h-12 sm:w-14 sm:h-14 shrink-0" />
        </div>
      </div>

      {/* 2. Graha Matrix Quick Bar */}
      <div className="bg-[#FAF6EF] dark:bg-[#161828] border-b border-[#E5D7BC] dark:border-white/10 px-4 lg:px-8 py-2 overflow-x-auto scrollbar-thin print:hidden">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Activity className="w-3.5 h-3.5" /> {t('graha')}
          </span>
          {grahas.map((g) => {
            const isSelected = activeGraha === g.name;
            return (
              <button
                key={g.name}
                onClick={() => {
                  chitiSensory.playTick();
                  setActiveGraha(g.name);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected ? 'bg-[#8E6F1D] text-white border-[#8E6F1D] shadow-xs' : 'bg-white dark:bg-[#121422] text-[#44403C] dark:text-[#D1C9BF] border-[#E5D7BC] dark:border-white/10 hover:border-[#8E6F1D]/50'}`}
              >
                <span>{g.name}</span>
                <span className={`text-[10px] font-mono-data ${isSelected ? 'text-amber-200' : 'text-[#78716C] dark:text-[#A8A29E]'}`}>
                  {String(g.rashiName || g.rashiEn || '').slice(0, 3)} {Math.floor(g.degrees % 30)}°{Math.floor((g.degrees * 60) % 60)}'
                </span>
                {g.isRetrograde && <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-100' : 'text-rose-500 dark:text-rose-300'}`}>(R)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2b. Kundli at a Glance — the Era-2/3 convention: summary before depth */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 print:hidden">
        <div className="rounded-2xl border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#F0E6D2] dark:border-white/5 bg-[#FAF6EF] dark:bg-[#161828]">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> {t('glance')}
            </h2>
            <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">{snapshot.meta.engineVersion}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-[#F0E6D2] dark:divide-white/5">
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">{t('lagna')}</div>
              <div className="text-sm font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">{snapshot.lagna.rashiName}</div>
              <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{snapshot.lagna.rashiEn} · {snapshot.lagna.degreeStr}</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">{t('moonRashi')}</div>
              <div className="text-sm font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">{(snapshot.planets as any)?.Moon?.rashiName ?? '—'}</div>
              <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{(snapshot.planets as any)?.Moon?.rashiEn ?? ''}</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">{t('janmaNakshatra')}</div>
              <div className="text-sm font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">{snapshot.birthPanchang.nakshatra?.name ?? '—'}</div>
              <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]"> {t('pada')} {(snapshot.birthPanchang.nakshatra as any)?.pada ?? '—'}</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">{t('tithi')}</div>
              <div className="text-sm font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">{snapshot.birthPanchang.udayaTithi?.fullName ?? '—'}</div>
              <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{t('udayaTithi')}</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">{t('manglik')}</div>
              <div className="text-sm font-bold mt-0.5">
                {snapshot.yogasAndDoshas.manglik.isManglik
                  ? <span className="text-[#B45309] dark:text-amber-300">{snapshot.yogasAndDoshas.manglik.isCancelled ? t('cancelled') : `Yes · ${snapshot.yogasAndDoshas.manglik.severity}`}</span>
                  : <span className="text-[#15803D] dark:text-emerald-400">{t('notPresent')}</span>}
              </div>
              <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">as per engine rules</div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">Current Dasha</div>
              <div className="text-sm font-bold text-[#1C1917] dark:text-[#EFECE6] mt-0.5">{snapshot.dasha.currentMahadasha}</div>
              <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{snapshot.dasha.currentAntardasha} AD · {snapshot.dasha.currentDateRange}</div>
              <div className="text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-0.5">Dasha balance at birth: {snapshot.dasha.startingBalance}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Workspace Body */}
      {activeTab === 'OVERVIEW' ? (
        /* ================================================================ */
        /* MODE O: OVERVIEW — chart-first, progressive disclosure           */
        /* ================================================================ */
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          {/* Executive 6-Dimension Life Gauge & 4-Quadrant Graha Archetype Dashboard */}
          <ExecutiveLifeGaugeDashboard
            dimensions={executiveLifeDimensions}
            archetypeCards={grahaArchetypeCards}
            lang={lang}
          />

          {/* Row 1: D1 chart + current period */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#121422] rounded-2xl p-5 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Rashi Chart (D1)
                </h3>
                <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">Lagna {snapshot.lagna.rashiName}</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <NorthIndianChart
                  kundali={chartD1Obj}
                  theme={theme}
                  onPlanetClick={(name: string, house: number) => setChartPlanet({ name, house })}
                  selectedPlanet={chartPlanet?.name ?? undefined}
                />
                <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-mono-data -mt-1">Tap a planet for its details</p>
              </div>
              {selectedPlanetInfo && (
                <div className="rounded-xl border border-[#8E6F1D]/30 bg-amber-50/60 dark:bg-[#D4AF37]/10 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1917] dark:text-[#EFECE6]">
                      {selectedPlanetInfo.name}
                      {selectedPlanetInfo.sanskrit ? ` · ${selectedPlanetInfo.sanskrit}` : ''}
                    </span>
                    <button
                      onClick={() => setChartPlanet(null)}
                      className="text-[9px] font-bold uppercase text-[#8E6F1D] dark:text-[#F0C968] hover:underline"
                    >
                      ✕ close
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <span className="text-[#78716C] dark:text-[#A8A29E]">Rashi</span>
                    <span className="font-semibold text-[#1C1917] dark:text-[#EFECE6] text-right">{selectedPlanetInfo.rashiName} ({selectedPlanetInfo.rashiEn})</span>
                    <span className="text-[#78716C] dark:text-[#A8A29E]">Degree</span>
                    <span className="font-semibold text-[#1C1917] dark:text-[#EFECE6] text-right">{selectedPlanetInfo.degreeStr}</span>
                    <span className="text-[#78716C] dark:text-[#A8A29E]">Nakshatra</span>
                    <span className="font-semibold text-[#1C1917] dark:text-[#EFECE6] text-right">{selectedPlanetInfo.nakshatra} pada {selectedPlanetInfo.pada}</span>
                    <span className="text-[#78716C] dark:text-[#A8A29E]">House</span>
                    <span className="font-semibold text-[#1C1917] dark:text-[#EFECE6] text-right">{selectedPlanetInfo.house}</span>
                    <span className="text-[#78716C] dark:text-[#A8A29E]">Dignity</span>
                    <span className="font-semibold text-[#1C1917] dark:text-[#EFECE6] text-right">
                      {selectedPlanetInfo.isRetrograde ? 'Retrograde · ' : ''}{selectedPlanetInfo.dignity}
                    </span>
                    {selectedPlanetInfo.karaka && (
                      <>
                        <span className="text-[#78716C] dark:text-[#A8A29E]">Karaka</span>
                        <span className="font-semibold text-[#1C1917] dark:text-[#EFECE6] text-right">{selectedPlanetInfo.karaka}</span>
                      </>
                    )}
                    {selectedPlanetInfo.longitude !== null && (
                      <>
                        <span className="text-[#78716C] dark:text-[#A8A29E]">Sidereal longitude</span>
                        <span className="font-mono-data text-[#1C1917] dark:text-[#EFECE6] text-right">{selectedPlanetInfo.longitude.toFixed(4)}°</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#121422] rounded-2xl p-5 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Current Dasha Period
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF6EF] dark:bg-[#161828] border border-[#E5D7BC]/70 dark:border-white/10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">Mahadasha</div>
                  <div className="text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">{snapshot.dasha.currentMahadasha}</div>
                  <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">{snapshot.dasha.currentDateRange}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF6EF] dark:bg-[#161828] border border-[#E5D7BC]/70 dark:border-white/10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">Antardasha</div>
                  <div className="text-base font-bold text-[#1C1917] dark:text-[#EFECE6]">{snapshot.dasha.currentAntardasha}</div>
                  <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">Pratyantardasha {snapshot.dasha.currentPratyantardasha || '—'}</div>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-[#44403C] dark:text-[#D1C9BF]">
                {snapshot.dasha.currentPeriodString}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(snapshot.yogasAndDoshas.rajYogas ?? []).slice(0, 3).map((y: string) => (
                  <span key={y} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-amber-50 dark:bg-[#D4AF37]/10 text-[#8E6F1D] dark:text-[#F0C968] border border-amber-200">{y}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Vimshottari timeline (tap a period for antardashas) */}
          <div className="bg-white dark:bg-[#121422] rounded-2xl p-5 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> {t('dasha')}
              </h3>
              <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">Dasha balance at birth: {snapshot.dasha.startingBalance}</span>
            </div>
            <DashaTimeline
              mahadashas={snapshot.dasha.mahadashas}
              currentAD={snapshot.dasha.currentAntardasha}
              selectedIndex={selectedMdIndex}
              onSelect={setSelectedMdIndex}
            />
          </div>

          {/* Row 3: Interpretation highlights (progressive disclosure) */}
          <div className="bg-white dark:bg-[#121422] rounded-2xl p-5 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Interpretation Highlights
            </h3>
            <div className="space-y-2">
              {(() => {
                const interpSection = book.volumes[16]?.sections.find((sec) => sec.id === 'interpretation_synthesis');
                const data = (interpSection?.data ?? {}) as Record<string, string>;
                const evidence = (interpSection?.evidenceIds ?? []) as string[];
                const items: [string, string][] = [
                  ['personality', 'Lagna & Personality'],
                  ['career', 'Career'],
                  ['wealth', 'Finance & Wealth'],
                  ['relationships', 'Relationships'],
                  ['spirituality', 'Spiritual Tendencies'],
                  ['currentPeriod', 'Current Period']
                ];
                return items.map(([key, title]) => (
                  <details key={key} className="group rounded-xl border border-[#E5D7BC]/80 dark:border-white/10 bg-[#FAF6EF]/60 dark:bg-[#161828]/60 open:bg-white dark:open:bg-[#121422]">
                    <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none text-xs font-bold text-[#1C1917] dark:text-[#EFECE6]">
                      <span className="flex items-center gap-2">
                        <ChevronDown className="w-3.5 h-3.5 text-[#8E6F1D] dark:text-[#F0C968] transition-transform group-open:rotate-180" />
                        {title}
                      </span>
                      <span className="text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E] uppercase">tap to read</span>
                    </summary>
                    <div className="px-4 pb-3 pt-1">
                      <p className="text-xs leading-relaxed text-[#44403C] dark:text-[#D1C9BF]">{data[key] ?? 'Not available.'}</p>
                      {evidence.length > 0 && (
                        <p className="text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E] mt-2">Evidence: {evidence.join(', ')}</p>
                      )}
                    </div>
                  </details>
                ));
              })()}
            </div>
          </div>

          {/* Row 4: Calculation standard (method transparency on screen) */}
          <details className="bg-white dark:bg-[#121422] rounded-2xl p-5 border border-[#E5D7BC] dark:border-white/10 shadow-sm group">
            <summary className="flex items-center justify-between cursor-pointer select-none">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                <Telescope className="w-3.5 h-3.5" /> How this Kundli was calculated
              </h3>
              <ChevronDown className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968] transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Zodiac', 'Sidereal'],
                ['Ayanamsha', snapshot.meta.ayanamshaName],
                ['Ayanamsha value', `${snapshot.meta.ayanamshaValue.toFixed(4)}°`],
                ['House system', 'Equal (whole-sign)'],
                ['Node mode', 'Mean node'],
                ['Ephemeris', 'VSOP87 / ELP2000-82'],
                ['Engine', snapshot.meta.engineVersion],
                ['Julian day', snapshot.meta.julianDay.toFixed(4)]
              ].map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-xl bg-[#FAF6EF] dark:bg-[#161828] border border-[#E5D7BC]/70 dark:border-white/10">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E]">{k}</div>
                  <div className="text-[11px] font-semibold text-[#1C1917] dark:text-[#EFECE6] break-words">{v}</div>
                </div>
              ))}
            </div>
          </details>

          {/* Row 5: PDF actions */}
          <div className="bg-white dark:bg-[#121422] rounded-2xl p-5 border border-[#E5D7BC] dark:border-white/10 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">Your Kundli PDF</h3>
              <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">
                Qualified V3 PDF. Choose a {t('edition').toLowerCase()} ({t('client')} / {t('pandit')} / {t('scholar')}) and a language.
                {lastPdfMeta && <span className="text-[#15803D] dark:text-emerald-400 font-semibold"> Last: {lastPdfMeta.pageCount} pages · {lastPdfMeta.fileSizeKB} KB · PASS</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 bg-white dark:bg-[#121422] hover:bg-[#F5EFE6] dark:bg-[#1C1E27] dark:hover:bg-[#1C1E27] text-[#8E6F1D] dark:text-[#F0C968] transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={() => setActiveTab('FOLIO')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] hover:bg-[#F5EFE6] dark:bg-[#1C1E27] dark:hover:bg-[#1C1E27] text-[#1C1917] dark:text-[#EFECE6] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> Explore 17-Volume Book
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#8E6F1D] hover:bg-[#785E18] text-white transition-colors shadow-sm disabled:opacity-60 disabled:cursor-wait"
              >
                <Download className="w-3.5 h-3.5" />
                {isGeneratingPdf ? t('validating') : t('download')}
              </button>
            </div>
          </div>
        </main>
      ) : activeTab === 'FOLIO' ? (
        /* ================================================================ */
        /* MODE A: 17-VOLUME ENCYCLOPEDIC FOLIO                             */
        /* ================================================================ */
                <main className="max-w-5xl mx-auto px-4 lg:px-8 py-8 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] px-1 pb-1">
            {t('volumes')}
          </div>

          {book.volumes.map((vol, idx) => {
            const isOpen = openVolumes.has(idx);
            const hasCharts = idx === 0 || idx === 1 || idx === 3;
            return (
              <section
                key={vol.volumeNumber}
                className={`bg-white dark:bg-[#121422] rounded-2xl border shadow-sm overflow-hidden transition-colors ${isOpen ? 'border-[#8E6F1D]/40' : 'border-[#E5D7BC] dark:border-white/10'}`}
              >
                {/* Accordion header — first volume open by default, rest collapsed */}
                <button
                  onClick={() => toggleVolume(idx)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left bg-gradient-to-r from-[#FAF6EF] via-white to-white dark:from-[#161828] dark:via-[#121422] dark:to-[#121422] hover:from-[#F5EFE6] dark:hover:from-[#1C1E27] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-serif font-bold text-xs sm:text-sm shrink-0 border ${isOpen ? 'bg-[#8E6F1D] text-white border-[#8E6F1D]' : 'bg-[#F5EFE6] dark:bg-[#1C1E27] text-[#8E6F1D] dark:text-[#F0C968] border-[#E5D7BC] dark:border-white/10'}`}>
                      {vol.volumeNumber}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm sm:text-base font-serif font-bold text-[#1C1917] dark:text-[#EFECE6] truncate">{vol.title}</div>
                      <div className="text-[11px] font-serif italic text-[#8E6F1D] dark:text-[#F0C968] truncate">{vol.sanskritTitle}</div>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Collapsible body */}
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-6 pt-1 space-y-6 border-t border-[#F0E6D2] dark:border-white/5">
                    <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#D1C9BF] pt-3 leading-relaxed">{vol.description}</p>

                    {hasCharts && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-[#121422] p-4 rounded-2xl border border-[#E5D7BC] dark:border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold font-serif text-[#1C1917] dark:text-[#EFECE6]">D1 Lagna Rashi Chart</h3>
                            <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">Lagna: {snapshot.lagna.rashiName}</span>
                          </div>
                          <div className="max-w-[340px] mx-auto aspect-square">
                            <NorthIndianChart
                              kundali={chartD1Obj}
                              onPlanetClick={(name: string, house: number) => setChartPlanet({ name, house })}
                              selectedPlanet={chartPlanet?.name ?? undefined}
                            />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#121422] p-4 rounded-2xl border border-[#E5D7BC] dark:border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold font-serif text-[#1C1917] dark:text-[#EFECE6]">D9 Navamsha Chart</h3>
                            <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">Dharmamsha</span>
                          </div>
                          <div className="max-w-[340px] mx-auto aspect-square">
                            <NorthIndianChart kundali={chartD9Obj} theme={theme} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Volume Content Sections */}
                    <div className="space-y-5">
                      {vol.sections.map((sec, sIdx) => (
                        <div key={sIdx} className="rounded-2xl p-5 sm:p-6 border border-[#E5D7BC] dark:border-white/10 bg-[#FDFBF7]/60 dark:bg-[#121422]/60 space-y-4">
                          <div className="border-b border-[#F0E6D2] dark:border-white/5 pb-3 flex items-center justify-between gap-2">
                            <h2 className="text-base font-serif font-bold text-[#1C1917] dark:text-[#EFECE6]">{sec.title}</h2>
                            {sec.category && (
                              <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] font-bold bg-[#8E6F1D]/10 px-2 py-0.5 rounded shrink-0">
                                {sec.category}
                              </span>
                            )}
                          </div>

                          {/* Section Data Grid — full values, never clipped */}
                          {sec.data && typeof sec.data === 'object' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {Object.entries(sec.data).map(([key, val]) => {
                                if (val === null || val === undefined) return null;
                                const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
                                if (Array.isArray(val)) {
                                  const items = val as any[];
                                  if (items.length === 0) return null;
                                  const text = items.map((it) => {
                                    if (typeof it === 'object') {
                                      const lord = it.lord ?? it.planet ?? it.name ?? '';
                                      const start = it.startDate ? String(it.startDate).slice(0, 10) : '';
                                      const end = it.endDate ? String(it.endDate).slice(0, 10) : '';
                                      if (lord && start) return `${lord} · ${start}${end ? ` – ${end}` : ''}`;
                                      return Object.values(it).filter((v) => typeof v === 'string' || typeof v === 'number').slice(0, 3).join(' · ');
                                    }
                                    return String(it);
                                  });
                                  const shown = text.slice(0, 12);
                                  const more = text.length - shown.length;
                                  return (
                                    <div key={key} className="col-span-full p-3.5 rounded-xl bg-[#FAF6EF] dark:bg-[#161828] border border-[#E5D7BC]/70 dark:border-white/10 space-y-1">
                                      <div className="text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase font-mono-data">{label}</div>
                                      <div className="text-xs text-[#1C1917] dark:text-[#EFECE6] font-mono-data leading-relaxed break-words">
                                        {shown.join('  ·  ')}
                                        {more > 0 && <span className="text-[#78716C] dark:text-[#A8A29E]"> … +{more} more</span>}
                                      </div>
                                    </div>
                                  );
                                }
                                if (typeof val === 'object') {
                                  return (
                                    <div key={key} className="col-span-full p-3.5 rounded-xl bg-[#FAF6EF] dark:bg-[#161828] border border-[#E5D7BC]/70 dark:border-white/10 space-y-1">
                                      <div className="text-[10px] font-bold text-[#8E6F1D] dark:text-[#F0C968] uppercase font-mono-data">{label}</div>
                                      <div className="text-xs text-[#1C1917] dark:text-[#EFECE6] font-mono-data flex flex-wrap gap-x-4 gap-y-1">
                                        {Object.entries(val as Record<string, unknown>).map(([subK, subV]) => (
                                          <span key={subK}>
                                            <strong className="text-[#78716C] dark:text-[#A8A29E]">{subK.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:</strong> {String(subV)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={key} className="p-3 rounded-xl bg-[#FAF6EF] dark:bg-[#161828] border border-[#E5D7BC]/70 dark:border-white/10 space-y-0.5">
                                    <div className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] uppercase">{label}</div>
                                    <div className="text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#EFECE6] font-mono-data break-words whitespace-normal">
                                      {String(val)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </main>
      ) : (
        /* ================================================================ */
        /* MODE B: INTERACTIVE VISUAL WORKBENCH                             */
        /* ================================================================ */
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          
          {/* Top Workbench Row: Divisional Chart Matrix & Live Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Chart Selection & SVG North Indian Chart */}
            <div className="lg:col-span-7 bg-white dark:bg-[#121422] rounded-2xl p-6 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0E6D2] dark:border-white/5">
                <div>
                  <h2 className="text-base font-serif font-bold text-[#1C1917] dark:text-[#EFECE6]">Divisional Shodashavarga Chart</h2>
                  <p className="text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">Lagna: {snapshot.lagna.rashiName} ({snapshot.lagna.degreeStr})</p>
                </div>

                <div className="flex items-center gap-1 bg-[#F5EFE6] dark:bg-[#1C1E27] p-1 rounded-xl border border-[#E5D7BC] dark:border-white/10">
                  {[
                    { id: 1, label: 'D1 Rashi' },
                    { id: 9, label: 'D9 Navamsha' },
                    { id: 10, label: 'D10 Career' },
                    { id: 60, label: 'D60 Karma' }
                  ].map((div) => (
                    <button
                      key={div.id}
                      onClick={() => {
                        chitiSensory.playTick();
                        setActiveDivision(div.id);
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${activeDivision === div.id ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
                    >
                      {div.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-[420px] mx-auto aspect-square py-2">
                <NorthIndianChart
                  kundali={activeChartData}
                  theme={theme}
                  onPlanetClick={(name: string, house: number) => setChartPlanet({ name, house })}
                  selectedPlanet={chartPlanet?.name ?? undefined}
                />
              </div>

              <div className="text-center text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E] pt-2 border-t border-[#F0E6D2] dark:border-white/5">
                North Indian style — D{activeDivision} · tap a planet for its details
              </div>

            </div>

            {/* Right: Connected Graha Inspector */}
            <div className="lg:col-span-5 bg-white dark:bg-[#121422] rounded-2xl p-6 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D2] dark:border-white/5">
                <h2 className="text-base font-serif font-bold text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" />
                  <span>Graha Balas & Dignities</span>
                </h2>
                <span className="text-[10px] font-mono-data bg-[#8E6F1D]/10 text-[#8E6F1D] dark:text-[#F0C968] px-2 py-0.5 rounded font-bold">
                  9 GRAHAS
                </span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                {grahas.map((p) => {
                  const isSelected = activeGraha === p.name;
                  const shadbala = snapshot.balas?.shadbala[p.name]?.totalRupas;
                  return (
                    <div
                      key={p.name}
                      onClick={() => {
                        chitiSensory.playTick();
                        setActiveGraha(p.name);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-[#FAF6EF] dark:bg-[#161828] border-[#8E6F1D] shadow-xs' : 'bg-[#FDFBF7] dark:bg-[#121422] border-[#E5D7BC] dark:border-white/10 hover:border-[#8E6F1D]/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.isRetrograde && <span className="text-[10px] text-rose-500 dark:text-rose-300 font-bold">(R)</span>}
                        </div>
                        <span className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold">House {p.house}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">
                        <div>
                          <span className="text-[#1C1917] dark:text-[#EFECE6] font-semibold">{p.rashiName}</span> ({p.degreeStr})
                        </div>
                        <div>
                          Dignity: <strong className="text-[#1C1917] dark:text-[#EFECE6]">{p.dignity || p.status}</strong>
                        </div>
                        <div>
                          Shadbala: <strong className="text-[#8E6F1D] dark:text-[#F0C968]">{shadbala ? `${shadbala.toFixed(2)} R` : 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Bottom Workbench Row: Vimshottari Dasha Hierarchy & Ashtakavarga */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Dasha Card */}
            <div className="bg-white dark:bg-[#121422] rounded-2xl p-6 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D2] dark:border-white/5">
                <h3 className="text-sm font-serif font-bold text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" />
                  <span>Vimshottari Dasha Timeline</span>
                </h3>
                <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">
                  {snapshot.dasha.currentPeriodString}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF6EF] dark:bg-[#161828] border border-[#E5D7BC] dark:border-white/10 space-y-1.5 font-mono-data text-xs">
                <div className="text-[10px] uppercase text-[#78716C] dark:text-[#A8A29E]">Active Mahadasha Window</div>
                <div className="text-sm font-bold text-[#1C1917] dark:text-[#EFECE6]">{snapshot.dasha.currentPeriodString}</div>
                <div className="text-[11px] text-[#78716C] dark:text-[#A8A29E]">{snapshot.dasha.currentDateRange}</div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#78716C] dark:text-[#A8A29E] uppercase font-mono-data">All 9 Mahadasha Cycles:</div>
                <div className="space-y-1.5 font-mono-data text-xs max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {snapshot.dasha.mahadashas?.map((md: any, idx: number) => {
                    const sStr = md.startDate ? (md.startDate instanceof Date ? md.startDate.toISOString().slice(0, 10) : String(md.startDate).slice(0, 10)) : '';
                    const eStr = md.endDate ? (md.endDate instanceof Date ? md.endDate.toISOString().slice(0, 10) : String(md.endDate).slice(0, 10)) : '';
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#FDFBF7] dark:bg-[#121422] border border-[#E5D7BC]/70 dark:border-white/10 text-[11px]">
                        <span className="font-bold text-[#1C1917] dark:text-[#EFECE6]">{md.planet} Mahadasha ({typeof md.durationYears === 'number' ? md.durationYears.toFixed(1) : md.durationYears}y)</span>
                        <span className="text-[#78716C] dark:text-[#A8A29E]">{sStr} → {eStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ashtakavarga Card */}
            <div className="bg-white dark:bg-[#121422] rounded-2xl p-6 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D2] dark:border-white/5">
                <h3 className="text-sm font-serif font-bold text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" />
                  <span>Sarvashtakavarga (SAV) Matrix</span>
                </h3>
                <span className="text-[10px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">
                  337 TOTAL BINDUS
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-mono-data text-xs">
                {snapshot.ashtakavarga?.sav?.map((bindus: number, rIdx: number) => {
                  const rashiNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
                  const isHigh = bindus >= 30;
                  return (
                    <div key={rIdx} className={`p-3 rounded-xl border ${isHigh ? 'bg-[#8E6F1D]/10 border-[#8E6F1D]/30 text-[#8E6F1D] dark:text-[#F0C968]' : 'bg-[#FAF6EF] dark:bg-[#161828] border-[#E5D7BC] dark:border-white/10 text-[#1C1917] dark:text-[#EFECE6]'}`}>
                      <div className="text-[10px] text-[#78716C] dark:text-[#A8A29E]">{rashiNames[rIdx]}</div>
                      <div className="text-base font-bold mt-1">{bindus}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </main>
      )}

      {/* 4. Quick Edit Modal — city autocomplete, use-my-location, live validation */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 p-6 max-w-md w-full shadow-2xl space-y-4 font-mono-data max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0E6D2] dark:border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1C1917] dark:text-[#EFECE6] flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" />
                <span>{t('editBirthDetails')}</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-bold uppercase">Name</label>
                <input
                  type="text"
                  value={birthState.name}
                  onChange={(e) => {
                    const next = { ...birthState, name: e.target.value };
                    setBirthState(next);
                    setFieldErrors(validateLive(next));
                  }}
                  className={`w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0E101D] border text-xs font-semibold focus:outline-none focus:border-[#8E6F1D] ${fieldErrors.name ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10' : 'border-[#E5D7BC] dark:border-white/10'}`}
                />
                {fieldErrors.name && <p className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">{fieldErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-bold uppercase">Birth Date</label>
                  <input
                    type="date"
                    value={birthState.birthDate}
                    onChange={(e) => {
                      const next = { ...birthState, birthDate: e.target.value };
                      setBirthState(next);
                      setFieldErrors(validateLive(next));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0E101D] border text-xs font-semibold focus:outline-none focus:border-[#8E6F1D] ${fieldErrors.birthDate ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10' : 'border-[#E5D7BC] dark:border-white/10'}`}
                  />
                  {fieldErrors.birthDate && <p className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">{fieldErrors.birthDate}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-bold uppercase">Birth Time</label>
                  <input
                    type="time"
                    value={birthState.birthTime}
                    onChange={(e) => {
                      const next = { ...birthState, birthTime: e.target.value };
                      setBirthState(next);
                      setFieldErrors(validateLive(next));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0E101D] border text-xs font-semibold focus:outline-none focus:border-[#8E6F1D] ${fieldErrors.birthTime ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10' : 'border-[#E5D7BC] dark:border-white/10'}`}
                  />
                  {fieldErrors.birthTime && <p className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">{fieldErrors.birthTime}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-bold uppercase">Birth Place (start typing a city)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cityQuery}
                    onChange={(e) => cityAutocomplete(e.target.value)}
                    onBlur={() => {
                      if (cityQuery.trim()) {
                        const hits = searchCities(cityQuery.trim());
                        if (hits.length > 0) {
                          pickCity(hits[0]);
                        }
                      }
                    }}
                    onFocus={() => cityQuery.trim() && setShowCitySuggestions(true)}
                    placeholder={birthState.locationName || 'e.g. Patna, Varanasi, Mumbai…'}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0E101D] border border-[#E5D7BC] dark:border-white/10 text-xs font-semibold focus:outline-none focus:border-[#8E6F1D]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E] absolute right-3 top-2.5" />
                  {showCitySuggestions && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#121422] border border-[#E5D7BC] dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {citySuggestions.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickCity(c)}
                          className="w-full text-left px-3 py-2 hover:bg-[#FAF6EF] dark:bg-[#161828] flex items-center justify-between gap-2"
                        >
                          <span className="text-xs font-semibold text-[#1C1917] dark:text-[#EFECE6]">{c.name}, {c.state}</span>
                          <span className="text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">{c.lat.toFixed(2)}°, {c.lng.toFixed(2)}° · UTC{c.tz >= 0 ? '+' : ''}{c.tz}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                    Coordinates are irrevocably bound to the birth place for astrological precision.
                  </p>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#8E6F1D]/30 bg-white dark:bg-[#121422] text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-bold hover:bg-[#F5EFE6] dark:bg-[#1C1E27] dark:hover:bg-[#1C1E27] disabled:opacity-60 shrink-0"
                  >
                    <Navigation className="w-3 h-3" />
                    {locating ? 'Locating…' : 'Use my location'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-bold uppercase">{t('latitude')}</label>
                  <input
                    type="number"
                    step="any"
                    min={-90}
                    max={90}
                    value={Number.isFinite(birthState.latitude) ? birthState.latitude : ''}
                    onChange={(e) => {
                      const next = { ...birthState, latitude: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) };
                      setBirthState(next);
                      setFieldErrors(validateLive(next));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0E101D] border text-xs font-semibold focus:outline-none focus:border-[#8E6F1D] ${fieldErrors.lat ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10' : 'border-[#E5D7BC] dark:border-white/10'}`}
                  />
                  {fieldErrors.lat && <p className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">{fieldErrors.lat}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-bold uppercase">{t('longitude')}</label>
                  <input
                    type="number"
                    step="any"
                    min={-180}
                    max={180}
                    value={Number.isFinite(birthState.longitude) ? birthState.longitude : ''}
                    onChange={(e) => {
                      const next = { ...birthState, longitude: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) };
                      setBirthState(next);
                      setFieldErrors(validateLive(next));
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0E101D] border text-xs font-semibold focus:outline-none focus:border-[#8E6F1D] ${fieldErrors.lng ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10' : 'border-[#E5D7BC] dark:border-white/10'}`}
                  />
                  {fieldErrors.lng && <p className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold">{fieldErrors.lng}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-bold uppercase">{t('utcOffset')}</label>
                  <input
                    type="number"
                    step="0.5"
                    min={-14}
                    max={14}
                    value={Number.isFinite(birthState.timezone) ? birthState.timezone : ''}
                    onChange={(e) => setBirthState({ ...birthState, timezone: e.target.value === '' ? Number.NaN : parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0E101D] border border-[#E5D7BC] dark:border-white/10 text-xs font-semibold focus:outline-none focus:border-[#8E6F1D]"
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] leading-relaxed">
                {Number.isFinite(birthState.latitude) && Number.isFinite(birthState.longitude) ? (
                  <span className="text-[#15803D] dark:text-emerald-400 font-semibold">
                    ✓ {birthState.locationName || 'Coordinates'} · {Math.abs(birthState.latitude).toFixed(4)}°{birthState.latitude >= 0 ? 'N' : 'S'}, {Math.abs(birthState.longitude).toFixed(4)}°{birthState.longitude >= 0 ? 'E' : 'W'} · UTC{Number.isFinite(birthState.timezone) && birthState.timezone >= 0 ? '+' : ''}{Number.isFinite(birthState.timezone) ? birthState.timezone : '—'}
                  </span>
                ) : (
                  t('enterBoth')
                )}
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5D7BC] dark:border-white/10 hover:bg-[#FAF7F2] dark:bg-[#0E101D]"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={Object.keys(fieldErrors).length > 0}
                onClick={() => {
                  let stateToUse = { ...birthState };
                  if (cityQuery.trim()) {
                    const hits = searchCities(cityQuery.trim());
                    if (hits.length > 0) {
                      const c = hits[0];
                      stateToUse = {
                        ...stateToUse,
                        locationName: `${c.name}, ${c.state}`,
                        latitude: c.lat,
                        longitude: c.lng,
                        timezone: c.tz
                      };
                      setBirthState(stateToUse);
                      setCityQuery('');
                    }
                  } else if (stateToUse.locationName) {
                    const coherent = resolveCoherentCoordinates(stateToUse.locationName, stateToUse.latitude, stateToUse.longitude, stateToUse.timezone);
                    if (coherent.lat !== stateToUse.latitude || coherent.lng !== stateToUse.longitude) {
                      stateToUse = {
                        ...stateToUse,
                        locationName: coherent.resolvedLoc,
                        latitude: coherent.lat,
                        longitude: coherent.lng,
                        timezone: coherent.tz
                      };
                      setBirthState(stateToUse);
                    }
                  }

                  const errs = validateLive(stateToUse);
                  setFieldErrors(errs);
                  if (Object.keys(errs).length > 0) return;
                  chitiSensory.playTick();
                  try {
                    localStorage.setItem('cosmictantra_active_kundli', JSON.stringify(stateToUse));
                  } catch {}
                  // Rebuild RAW input from the modal's edited values and
                  // dry-run the pipeline so validation failures surface NOW.
                  const editedRaw: RawBirthInput = {
                    name: stateToUse.name.trim() || undefined,
                    birthDate: stateToUse.birthDate || undefined,
                    birthTime: stateToUse.birthTime || undefined,
                    locationName: stateToUse.locationName.trim() || undefined,
                    latitude: Number.isFinite(stateToUse.latitude) ? stateToUse.latitude : undefined,
                    longitude: Number.isFinite(stateToUse.longitude) ? stateToUse.longitude : undefined,
                    utcOffsetHours: Number.isFinite(stateToUse.timezone) ? stateToUse.timezone : undefined,
                    coordinateProvenance: 'MANUAL'
                  };
                  rawInputRef.current = editedRaw;
                  setIsDemoProfile(false);
                  setIsEditModalOpen(false);
                  setFailSafe(null);
                  setLastPdfMeta(null);
                  void (async () => {
                    setIsGeneratingPdf(true);
                    setPipelineState(null);
                    try {
                      const result = await generateKundliV40Pdf(editedRaw, {
                        locale: lang === 'hi' ? 'hi' : 'en',
                        skipPdf: true
                      });
                      if (!result.ok) {
                        const code = result.errorCode ?? 'KUNDLI_INPUT_INVALID';
                        setFailSafe({
                          message: KUNDLI_SAFE_MESSAGES[code as keyof typeof KUNDLI_SAFE_MESSAGES] ?? KUNDLI_SAFE_MESSAGES.KUNDLI_INPUT_INVALID,
                          code
                        });
                      }
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  })();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8E6F1D] text-white hover:bg-[#785E18] shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('recalc')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

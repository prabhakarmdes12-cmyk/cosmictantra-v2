'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Printer, Shield, Sparkles, CheckCircle2, ArrowRight,
  Edit3, AlertTriangle, Heart, BookOpen, FileText, Phone, Star,
  LayoutDashboard, Layers, Workflow, MessageSquare, Calendar,
  Search, Navigation,
} from 'lucide-react';
import { searchCities } from '@/lib/cities';
import { getCanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';
import { calculateMilan, milanInputFromSnapshot, milanContextFromSnapshot, MilanCalculation, MilanPersonInput } from '@/lib/kundli/v42/milan/milanEngine';
import GlobalHeader from '@/components/layout/GlobalHeader';
import LanguageSelectorModal from '@/components/layout/LanguageSelectorModal';
import NorthIndianChart from '@/components/NorthIndianChart';
import { chitiSensory } from '@/lib/chitiAudio';

type PdfMode = 'CLIENT' | 'PANDIT' | 'SCHOLAR';
type PdfLocale = 'en' | 'hi' | 'hi-en';

const EMPTY_PROFILE = {
  name: '',
  birthDate: '',
  birthTime: '12:00',
  latitude: 25.5941,
  longitude: 85.1376,
  timezone: 5.5,
  locationName: 'Patna, Bihar, India',
};

const DEMO_A = { name: 'Prabhakar Sharma', birthDate: '1989-05-26', birthTime: '02:20:30', latitude: 22.0797, longitude: 82.1391, timezone: 5.5, locationName: 'Bilaspur, Chhattisgarh, India' };
const DEMO_B = { name: 'Ananya Sharma', birthDate: '1992-11-08', birthTime: '14:45:00', latitude: 25.5941, longitude: 85.1376, timezone: 5.5, locationName: 'Patna, Bihar, India' };

export default function MilanReportClient() {
  const router = useRouter();
  const [lang, setLang] = useState('en');
  const [pdfLocale, setPdfLocale] = useState<PdfLocale>('en');
  const [pdfMode, setPdfMode] = useState<PdfMode>('SCHOLAR');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  const [bride, setBride] = useState({ ...DEMO_B });
  const [groom, setGroom] = useState({ ...DEMO_A });
  const [usingDemo, setUsingDemo] = useState(true);
  const [error, setError] = useState('');
  const [calc, setCalc] = useState<MilanCalculation | null>(null);
  const [computing, setComputing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);
  const [failSafe, setFailSafe] = useState<{ message: string; code: string } | null>(null);
  const [lastPdfMeta, setLastPdfMeta] = useState<{ pages: number; kb: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FOLIO' | 'WORKBENCH'>('OVERVIEW');
  const [selectedKootaId, setSelectedKootaId] = useState<string>('varna');
  const [chartData, setChartData] = useState<{ bride: any; groom: any } | null>(null);
  const [readingDepth, setReadingDepth] = useState<'SIMPLE' | 'DETAILED' | 'PANDIT'>('DETAILED');
  const [cityQuery, setCityQuery] = useState<{ bride: string; groom: string }>({ bride: '', groom: '' });
  const [citySuggestions, setCitySuggestions] = useState<{ bride: any[]; groom: any[] }>({ bride: [], groom: [] });
  const [locating, setLocating] = useState<'' | 'bride' | 'groom'>('');

  const hi = lang === 'hi';

  const chartFor = (snap: any) => (snap ? { lagna: snap.lagna, houses: snap.houses, planets: snap.planets } : null);

  const visiblePredictions = calc
    ? readingDepth === 'SIMPLE'
      ? calc.predictions.filter((p) => p.id === 'resonance' || p.id === 'dosha')
      : calc.predictions
    : [];

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('cosmictantra_theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      }
    } catch {}
    try {
      const savedLang = localStorage.getItem('cosmictantra_lang');
      if (savedLang) {
        setLang(savedLang);
        document.documentElement.lang = savedLang;
      }
      const savedProfile = localStorage.getItem('cosmictantra_active_kundli');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed && parsed.name && parsed.birthDate) {
          setGroom({
            name: parsed.name,
            birthDate: parsed.birthDate,
            birthTime: parsed.birthTime || '12:00',
            latitude: Number(parsed.latitude ?? parsed.lat) || 25.5941,
            longitude: Number(parsed.longitude ?? parsed.lng) || 85.1376,
            timezone: Number(parsed.timezone) || 5.5,
            locationName: parsed.city || parsed.locationName || 'India'
          });
          setUsingDemo(false);
        }
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try { localStorage.setItem('cosmictantra_theme', next); } catch {}
    if (next === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };
  const selectLang = (code: string) => {
    setLang(code);
    if (code === 'en' || code === 'hi') setPdfLocale(code);
    document.documentElement.lang = code;
    try { localStorage.setItem('cosmictantra_lang', code); } catch {}
  };

  const cityAutocomplete = (key: 'bride' | 'groom', q: string) => {
    setCityQuery((prev) => ({ ...prev, [key]: q }));
    if (!q.trim()) {
      setCitySuggestions((prev) => ({ ...prev, [key]: [] }));
      return;
    }
    const hits = searchCities(q).slice(0, 6);
    setCitySuggestions((prev) => ({ ...prev, [key]: hits }));
  };

  const pickCity = (key: 'bride' | 'groom', c: { name: string; state: string; lat: number; lng: number; tz: number }) => {
    const setForm = key === 'bride' ? setBride : setGroom;
    setForm((prev) => ({
      ...prev,
      locationName: `${c.name}, ${c.state}`,
      latitude: c.lat,
      longitude: c.lng,
      timezone: c.tz,
    }));
    setCityQuery((prev) => ({ ...prev, [key]: '' }));
    setCitySuggestions((prev) => ({ ...prev, [key]: [] }));
  };

  const useMyLocation = (key: 'bride' | 'groom') => {
    setError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError(hi ? 'इस डिवाइस पर स्थान उपलब्ध नहीं है।' : 'Location access is not available on this device.');
      return;
    }
    setLocating(key);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const setForm = key === 'bride' ? setBride : setGroom;
        setForm((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        }));
        setLocating('');
      },
      () => {
        setError(hi ? 'स्थान पढ़ा नहीं जा सका। कृपया शहर लिखें।' : 'Could not read your location. Please type the city.');
        setLocating('');
      },
      { timeout: 8000 },
    );
  };

  const runCalculation = (gData = groom, bData = bride, isDemo = false) => {
    setError('');
    setComputing(true);
    try {
      const snapA = getCanonicalJyotishSnapshot({
        birthDate: gData.birthDate,
        birthTime: gData.birthTime,
        latitude: Number(gData.latitude),
        longitude: Number(gData.longitude),
        timezone: Number(gData.timezone),
        locationName: gData.locationName || gData.name,
      });
      const snapB = getCanonicalJyotishSnapshot({
        birthDate: bData.birthDate,
        birthTime: bData.birthTime,
        latitude: Number(bData.latitude),
        longitude: Number(bData.longitude),
        timezone: Number(bData.timezone),
        locationName: bData.locationName || bData.name,
      });
      const result = calculateMilan(
        milanInputFromSnapshot(snapB),
        milanInputFromSnapshot(snapA),
        { brideCtx: milanContextFromSnapshot(snapB), groomCtx: milanContextFromSnapshot(snapA) }
      );
      setChartData({ bride: snapB, groom: snapA });
      setSelectedKootaId(result.kootas[0]?.id || 'varna');
      setCalc(result);
      setUsingDemo(isDemo);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setComputing(false);
    }
  };

  // Auto-compute on mount so the user immediately sees the 36-point report and PDF options
  useEffect(() => {
    runCalculation(DEMO_A, DEMO_B, true);
  }, []);

  const compute = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    chitiSensory.playTick();
    runCalculation(groom, bride, false);
  };

  const fillDemo = () => {
    chitiSensory.playTick();
    setGroom({ ...DEMO_A });
    setBride({ ...DEMO_B });
    runCalculation(DEMO_A, DEMO_B, true);
  };


  type Action = 'download' | 'print';
  const requestPdf = async (action: Action, printWindow?: Window | null) => {
    if (!calc) return;
    let delivered = false;
    setIsGeneratingPdf(true);
    setFailSafe(null);
    setPdfNotice(null);
    setLastPdfMeta(null);
    try {
      const res = await fetch('/api/kundli/milan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bride: calc.bride,
          groom: calc.groom,
          mode: pdfMode,
          locale: pdfLocale,
        }),
      });
      if (!res.ok) {
        let code = 'MILAN_PDF_RENDER_FAILED';
        try {
          const j = await res.json();
          if (j?.errorCode) code = j.errorCode;
        } catch {}
        setFailSafe({
          message: code === 'MILAN_INPUT_INVALID' ? 'Please provide complete birth details for both partners.' : 'The Milan PDF could not be generated. Please try again.',
          code,
        });
        return;
      }
      const blob = await res.blob();
      const headers = res.headers;
      const pages = Number(headers.get('X-Milan-Pages') ?? '0');
      const disposition = headers.get('Content-Disposition') ?? '';
      const match = /filename="([^"]+)"/.exec(disposition);
      const name = match?.[1] ?? `Kundli_Milan_${pdfMode}.pdf`;
      const url = URL.createObjectURL(blob);
      if (action === 'print' && printWindow && !printWindow.closed) {
        printWindow.location.replace(url);
        delivered = true;
        window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
      } else {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
        if (action === 'print') setPdfNotice('Your browser blocked the print tab; the qualified PDF was downloaded. Open it and choose Print.');
      }
      setLastPdfMeta({ pages, kb: Math.round(blob.size / 1024) });
    } catch (err) {
      console.error('[milan pdf]', err);
      setFailSafe({ message: 'The Milan PDF could not be generated. Please try again.', code: 'MILAN_PDF_RENDER_FAILED' });
    } finally {
      if (printWindow && !printWindow.closed && action === 'print' && !delivered) printWindow.close();
      setIsGeneratingPdf(false);
    }
  };

  const download = () => void requestPdf('download');
  const print = () => {
    const w = window.open('', '_blank');
    if (w) {
      try { w.document.title = 'Preparing Milan PDF'; } catch {}
    }
    void requestPdf('print', w);
  };

  const inputCls = 'w-full rounded-lg bg-white dark:bg-[#0E101D] border border-[#E5D7BC] dark:border-white/10 px-3 py-2 text-xs font-semibold text-[#1C1917] dark:text-[#EFECE6] focus:outline-none focus:border-[#8E6F1D]';

  const topKoota = calc ? [...calc.kootas].sort((a, b) => b.points / b.maxPoints - a.points / a.maxPoints)[0] : null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#07080C] text-[#1C1917] dark:text-[#EFECE6] font-sans antialiased pb-28">
      <GlobalHeader lang={lang} theme={theme} onThemeToggle={toggleTheme} onLangToggle={() => setIsLangModalOpen(true)} />
      <LanguageSelectorModal isOpen={isLangModalOpen} currentLang={lang} onClose={() => setIsLangModalOpen(false)} onSelectLang={selectLang} />

      {/* Toolbar */}
      <header className="sticky top-16 sm:top-20 z-40 bg-[#FDFBF7]/95 dark:bg-[#07080C]/95 backdrop-blur-md border-b border-[#E5D7BC] dark:border-white/10 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="w-8 h-8 rounded-full bg-[#8E6F1D]/10 border border-[#8E6F1D]/30 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968] font-serif font-bold text-sm">
            ॐ
          </button>
          <div>
            <div className="font-serif font-bold text-base lg:text-lg">{hi ? 'कुंडली मिलान' : 'KUNDLI MILAN'}</div>
            <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] font-mono-data">
              {groom.name} & {bride.name}
              {usingDemo && <span className="ml-1.5 inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 uppercase"><Sparkles className="w-2.5 h-2.5" /> {hi ? 'नमूना' : 'Sample'}</span>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 items-center rounded-lg border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] p-0.5" role="group" aria-label="Qualified PDF edition">
            {(['CLIENT', 'PANDIT', 'SCHOLAR'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { chitiSensory.playTick(); setPdfMode(m); }} aria-pressed={pdfMode === m}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${pdfMode === m ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]' : 'text-[#78716C] dark:text-[#A8A29E]'}`}>
                {m === 'CLIENT' ? (hi ? 'जातक' : 'Client') : m === 'PANDIT' ? (hi ? 'पण्डित' : 'Pandit') : (hi ? 'शास्त्री' : 'Scholar')}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center rounded-lg border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] p-0.5" role="group" aria-label="Qualified PDF language">
            {([['en', 'EN'], ['hi', 'हिन्दी'], ['hi-en', 'हि + EN']] as const).map(([l, label]) => (
              <button key={l} type="button" onClick={() => setPdfLocale(l)} aria-pressed={pdfLocale === l}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${pdfLocale === l ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]' : 'text-[#78716C] dark:text-[#A8A29E]'}`}>
                {label}
              </button>
            ))}
          </div>
          {calc && (
            <button onClick={() => router.push('/ask?focus=milan&mode=detailed')} className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#D4AF37] text-[#060709] hover:bg-[#F0C968] transition-colors">
              <MessageSquare className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{hi ? 'पंडित से पूछें' : 'Ask a Pandit'}</span>
            </button>
          )}
          <button onClick={print} disabled={isGeneratingPdf} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 text-[#8E6F1D] dark:text-[#F0C968] bg-white dark:bg-[#121422]">
            <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{hi ? 'प्रिंट / पीडीएफ़' : 'Print / PDF'}</span>
          </button>
          <button onClick={download} disabled={isGeneratingPdf || !calc} className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#8E6F1D] text-white hover:bg-[#785E18] disabled:opacity-60 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{isGeneratingPdf ? (hi ? 'जाँच…' : 'Validating…') : (hi ? 'पीडीएफ़' : 'Download PDF')}</span>
          </button>
        </div>
      </header>

      {(isGeneratingPdf || failSafe || pdfNotice) && (
        <div className="border-b border-[#E5D7BC] dark:border-white/10 bg-[#FAF6EF] dark:bg-[#161828] px-4 lg:px-8 py-3 print:hidden">
          {failSafe ? (
            <div className="flex items-center gap-2.5 max-w-3xl">
              <Shield className="w-4 h-4 text-[#B45309] shrink-0" />
              <p className="text-xs font-semibold">{failSafe.message} <span className="text-[10px] font-mono-data text-[#78716C]">· {failSafe.code}</span></p>
            </div>
          ) : pdfNotice ? (
            <div className="flex items-center gap-2.5 max-w-3xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-semibold">{pdfNotice}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#8E6F1D] dark:text-[#F0C968]">
              <FileText className="w-4 h-4" /> {hi ? 'पीडीएफ़ बन रहा है…' : 'Preparing qualified Milan PDF…'}
              {lastPdfMeta && <span className="text-[10px] font-mono-data text-[#78716C]">✓ {lastPdfMeta.pages} pages · {lastPdfMeta.kb} KB · quality PASS</span>}
            </div>
          )}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Ganesh + intro */}
        <section className="rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-[#241D10] dark:via-[#161828] dark:to-[#241D10] border border-[#E5D7BC] dark:border-white/10 p-5 sm:p-8 text-center">
          <p className="font-serif font-bold text-[#8E6F1D] dark:text-[#F0C968] text-base lg:text-xl">॥ श्री गणेशाय नमः ॥</p>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold mt-2 tracking-tight">{hi ? 'अष्टकूट मिलान' : 'Ashtakoota Milan'}</h1>
          <p className="text-xs sm:text-sm text-[#57534E] dark:text-[#D1C9BF] mt-3 max-w-2xl mx-auto leading-relaxed">
            {hi
              ? 'वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट और नाड़ी — आठ कूटों का पारंपरिक 36 गुण परीक्षण। इसे समझें, अपने पंडित से परामर्श करें।'
              : 'The traditional eight-koota test — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi — scored out of 36. Read it as an explanation, then discuss it in detail with our astrologer.'}
          </p>
          <div className="mt-3 text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] flex items-center justify-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> BPHS · Phaladeepika · Muhurta Chintamani
          </div>
        </section>

        {/* Input form */}
        <section className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
              <Heart className="w-4 h-4" /> {hi ? 'दोनों जन्म विवरण' : 'Both birth details'}
            </h2>
            <button onClick={fillDemo} className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#8E6F1D]/30 text-[#8E6F1D] dark:text-[#F0C968]">
              {hi ? 'नमूना भरें' : 'Fill sample'}
            </button>
          </div>
          <form onSubmit={compute} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { key: 'bride' as const, label: 'Bride (वधू)', form: bride, setForm: setBride },
              { key: 'groom' as const, label: 'Groom (वर)', form: groom, setForm: setGroom },
            ].map(({ key, label, form, setForm }) => (
              <div key={label} className="p-4 rounded-xl border border-[#E5D7BC] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#0E101D] space-y-2.5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">{label}</div>
                <input className={inputCls} placeholder={hi ? 'नाम' : 'Name'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className={inputCls} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} aria-label="Birth date" />
                  <input type="time" className={inputCls} value={form.birthTime} onChange={(e) => setForm({ ...form, birthTime: e.target.value })} aria-label="Birth time" />
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#78716C] dark:text-[#A8A29E] absolute right-3 top-2.5" />
                  <input
                    className={inputCls}
                    placeholder={form.locationName || (hi ? 'जन्म स्थान (शहर लिखें)' : 'Birth place (type a city)')}
                    value={cityQuery[key]}
                    onChange={(e) => cityAutocomplete(key, e.target.value)}
                    onFocus={() => cityQuery[key].trim() && citySuggestions[key].length === 0 && cityAutocomplete(key, cityQuery[key])}
                    aria-label={`${label} birth place`}
                  />
                  {citySuggestions[key].length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-[#121422] border border-[#E5D7BC] dark:border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                      {citySuggestions[key].map((c: any) => (
                        <button key={c.id} type="button" onClick={() => pickCity(key, c)}
                          className="w-full text-left px-3 py-2 hover:bg-[#FAF6EF] dark:hover:bg-[#161828] flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">{c.name}, {c.state}</span>
                          <span className="text-[9px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">{c.lat.toFixed(2)}°, {c.lng.toFixed(2)}°</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] text-[#78716C] dark:text-[#A8A29E] leading-relaxed">{hi ? 'शहर चुनने पर निर्देशांक अपने आप भर जाते हैं।' : 'Pick a city and the coordinates fill in for you.'}</p>
                  <button type="button" onClick={() => useMyLocation(key)} disabled={locating === key} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#8E6F1D]/30 bg-white dark:bg-[#121422] text-[#8E6F1D] dark:text-[#F0C968] text-[10px] font-bold hover:bg-[#F5EFE6] disabled:opacity-60 shrink-0">
                    <Navigation className="w-3 h-3" /> {locating === key ? (hi ? 'खोज…' : 'Locating…') : (hi ? 'मेरा स्थान' : 'Use my location')}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" step="any" className={inputCls} placeholder="Lat" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} aria-label="Latitude" />
                  <input type="number" step="any" className={inputCls} placeholder="Lng" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} aria-label="Longitude" />
                  <input type="number" step="0.5" className={inputCls} placeholder="UTC" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: parseFloat(e.target.value) || 5.5 })} aria-label="UTC offset" />
                </div>
              </div>
            ))}
            <div className="lg:col-span-2 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={computing} className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#8E6F1D] text-white hover:bg-[#785E18] disabled:opacity-60">
                <Sparkles className="w-4 h-4" /> {computing ? (hi ? 'गणना...' : 'Calculating…') : (hi ? 'मिलान गणना करें' : 'Calculate Milan')}
              </button>
              {error && <span className="text-xs text-rose-600 font-semibold">{error}</span>}
            </div>
          </form>
        </section>

        {calc && (
          <>
            {/* Novice orientation */}
            <section className="rounded-2xl border border-[#8E6F1D]/25 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-[#241D10] dark:via-[#161828] dark:to-[#241D10] p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8E6F1D]/10 border border-[#8E6F1D]/30 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-[220px]">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">{hi ? 'आसान भाषा में' : 'In plain words'}</h2>
                  <p className="text-[11px] sm:text-xs text-[#57534E] dark:text-[#D1C9BF] mt-1 leading-relaxed">
                    {hi
                      ? 'यह आपके दोनों चन्द्र-चार्ट का पारंपरिक मिलान है — 36 में से एक अंक। अच्छा अंक प्रोत्साहन है; कम अंक या दोष कोई फैसला नहीं, बल्कि पूछने का न्योता है।'
                      : 'This is a traditional match test between your two Moon charts, scored out of 36. A high score is encouraging; a lower score or a dosha is not a verdict — it is an invitation to ask.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    hi ? '36-गुण स्कोर' : '36-guna score',
                    hi ? '8 कूट' : '8 kootas',
                    hi ? '4 दोष' : '4 doshas',
                    hi ? 'D9 + सप्तम भाव' : 'D9 + 7th house',
                  ].map((chip) => (
                    <span key={chip} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-[#121422] border border-[#E5D7BC] dark:border-white/10 text-[#78716C] dark:text-[#A8A29E]">{chip}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* Dedicated Milan PDF Granth Download Banner */}
            <section className="rounded-2xl border-2 border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 bg-gradient-to-br from-[#FFFDF9] via-[#FAF5EA] to-[#F3EAD3] dark:from-[#151726] dark:via-[#1A1E33] dark:to-[#0F111C] p-5 sm:p-6 shadow-xl print:hidden space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-data font-bold bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709] tracking-wider uppercase">
                      {hi ? '६-पृष्ठीय प्रामाणिक ग्रंथ' : '6-Page Qualified Folio'}
                    </span>
                    <span className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                      {hi ? 'शुद्ध देवनागरी फ़ॉन्टकिट' : 'Fontkit Devanagari Shaped'}
                    </span>
                  </div>
                  <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#1C1917] dark:text-white">
                    {hi ? 'विस्तृत ३६-गुण कुण्डली मिलान ग्रन्थ (PDF)' : 'Complete Ashtakoota Milan Granth (PDF)'}
                  </h2>
                  <p className="text-xs text-[#57534E] dark:text-[#D1C9BF] leading-relaxed">
                    {hi
                      ? 'अष्टकूट ३६ गुण विवरण, नाड़ी दोष व परिहार, भकूट शुद्धि, मंगली विचार, नवांश D9 एवं सप्तम भाव का सूक्ष्म विश्लेषण सहित संपूर्ण ६-पृष्ठीय प्रिंट-योग्य पीडीएफ़ प्राप्त करें।'
                      : 'Download the comprehensive 6-page classical folio with complete 36-point breakdown, Nadi Dosha Bhanga, Bhakoot cancellation, Mangal Dosha alignment & D9 Navamsha synthesis.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    onClick={download}
                    disabled={isGeneratingPdf || !calc}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#8E6F1D] via-[#A88424] to-[#8E6F1D] dark:from-[#D4AF37] dark:via-[#F0C968] dark:to-[#D4AF37] text-white dark:text-[#060709] font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#8E6F1D]/25 dark:shadow-[#D4AF37]/30 hover:scale-102 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isGeneratingPdf ? (hi ? 'पीडीएफ़ तैयार हो रहा है...' : 'Generating Folio...') : (hi ? 'डाउनलोड मिलान PDF (६ पृष्ठ)' : 'Download Milan PDF (6 Pages)')}</span>
                  </button>
                  <button
                    onClick={print}
                    disabled={isGeneratingPdf}
                    className="px-4 py-3 rounded-xl bg-white dark:bg-[#121422] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 text-[#8E6F1D] dark:text-[#F0C968] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#FAF7F2] dark:hover:bg-[#1C2035] transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{hi ? 'प्रिंट करें' : 'Print PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Mode and Language Bar inside Banner */}
              <div className="pt-3 border-t border-[#E5D7BC]/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E] font-bold">
                    {hi ? 'संस्करण:' : 'Edition:'}
                  </span>
                  <div className="flex rounded-lg border border-[#8E6F1D]/30 dark:border-white/10 p-0.5 bg-white/70 dark:bg-[#0E101D]">
                    {(['CLIENT', 'PANDIT', 'SCHOLAR'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { chitiSensory.playTick(); setPdfMode(m); }}
                        className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-colors ${pdfMode === m ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]' : 'text-[#78716C] dark:text-[#A8A29E]'}`}
                      >
                        {m === 'CLIENT' ? (hi ? 'जातक' : 'Client') : m === 'PANDIT' ? (hi ? 'पण्डित' : 'Pandit') : (hi ? 'शास्त्री' : 'Scholar')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono-data text-[#78716C] dark:text-[#A8A29E] font-bold">
                    {hi ? 'भाषा:' : 'Language:'}
                  </span>
                  <div className="flex rounded-lg border border-[#8E6F1D]/30 dark:border-white/10 p-0.5 bg-white/70 dark:bg-[#0E101D]">
                    {([['en', 'English'], ['hi', 'हिन्दी'], ['hi-en', 'हि + EN']] as const).map(([l, label]) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setPdfLocale(l as any)}
                        className={`px-2.5 py-1 text-[10.5px] font-bold rounded-md transition-colors ${pdfLocale === l ? 'bg-[#8E6F1D] text-white dark:bg-[#D4AF37] dark:text-[#060709]' : 'text-[#78716C] dark:text-[#A8A29E]'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section tabs (parity with Master Kundli report's O / FOLIO / WORKBENCH) */}
            <section className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-3 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Milan report section">
                  {([
                    ['OVERVIEW', 'Overview', LayoutDashboard, hi ? 'अवलोकन' : ''],
                    ['FOLIO', 'Full reading', Layers, hi ? 'पूरा पाठ' : ''],
                    ['WORKBENCH', 'Explore deeper', Workflow, hi ? 'गहरे में देखें' : ''],
                  ] as const).map(([id, label, Icon, labelHi]) => (
                    <button
                      key={id} type="button" role="tab" aria-selected={activeTab === id}
                      onClick={() => { chitiSensory.playTick(); setActiveTab(id); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === id ? 'bg-[#1C1917] dark:bg-[#D4AF37] text-[#FDFBF7] dark:text-[#060709] shadow-sm' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {hi && labelHi ? labelHi : label}
                    </button>
                  ))}
                </div>
                {activeTab === 'FOLIO' && (
                  <div className="flex items-center gap-1" role="group" aria-label="Reading depth">
                    {(['SIMPLE', 'DETAILED', 'PANDIT'] as const).map((depth) => (
                      <button key={depth} type="button" aria-pressed={readingDepth === depth} onClick={() => { chitiSensory.playTick(); setReadingDepth(depth); }}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${readingDepth === depth ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#EFECE6]'}`}>
                        {depth === 'SIMPLE' ? (hi ? 'सरल' : 'Simple') : depth === 'DETAILED' ? (hi ? 'विस्तृत' : 'Detailed') : (hi ? 'पण्डित' : 'Pandit')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {activeTab === 'OVERVIEW' && (
              <section className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {[
                    { id: 'groom', title: hi ? 'वर (D1)' : 'Groom (D1)', who: groom.name || (hi ? 'वर' : 'Groom') },
                    { id: 'bride', title: hi ? 'वधू (D1)' : 'Bride (D1)', who: bride.name || (hi ? 'वधू' : 'Bride') },
                  ].map((c) => {
                    const snap = c.id === 'bride' ? chartData?.bride : chartData?.groom;
                    const lagna = snap?.lagna?.rashiName || snap?.lagna?.rasiName || '';
                    return (
                      <div key={c.id} className="bg-white dark:bg-[#121422] rounded-2xl p-5 border border-[#E5D7BC] dark:border-white/10 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> {c.title}
                          </h3>
                          <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">{lagna ? `Lagna ${lagna}` : '—'}</span>
                        </div>
                        {snap ? (
                          <div className="flex flex-col items-center gap-2">
                            <NorthIndianChart kundali={chartFor(snap)} theme={theme} size={300} />
                            <p className="text-[10px] text-[#78716C] dark:text-[#A8A29E] font-mono-data -mt-1">{c.who}</p>
                          </div>
                        ) : (
                          <div className="h-72 flex items-center justify-center text-xs text-[#78716C]">{hi ? 'चार्ट उपलब्ध नहीं' : 'Chart unavailable'}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="text-center md:border-r md:border-[#F0E6D2] dark:border-white/5">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#78716C] dark:text-[#A8A29E] font-bold">{hi ? 'शास्त्रीय योग' : 'Classical score'}</div>
                      <div className="font-serif font-bold text-5xl text-[#8E6F1D] dark:text-[#F0C968] mt-1">{calc.total}<span className="text-xl text-[#78716C]">/{calc.maxTotal}</span></div>
                    </div>
                    <div className="md:col-span-2">
                      <h2 className="text-lg font-serif font-bold">{calc.verdict.titleHi && hi ? calc.verdict.titleHi : calc.verdict.title}</h2>
                      <p className="text-xs text-[#57534E] dark:text-[#D1C9BF] leading-relaxed mt-1">{calc.verdict.summaryHi && hi ? calc.verdict.summaryHi : calc.verdict.summary}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {calc.doshas.map((d) => (
                          <span key={d.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${d.cancelled ? 'bg-amber-50 text-amber-800 border-amber-300' : d.active ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                            {d.name}: {d.cancelled ? (hi ? 'निरस्त' : 'Cancelled') : d.active ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'शुद्ध' : 'Clear')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={download}
                      disabled={isGeneratingPdf || !calc}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#8E6F1D] to-[#A88424] dark:from-[#D4AF37] dark:to-[#F0C968] text-white dark:text-[#060709] shadow-sm hover:scale-102 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isGeneratingPdf ? (hi ? 'पीडीएफ़ बन रहा है...' : 'Preparing PDF...') : (hi ? '६-पृष्ठीय ग्रन्थ (PDF) डाउनलोड' : 'Download 6-Page PDF')}</span>
                    </button>
                    <button onClick={() => { chitiSensory.playTick(); setActiveTab('FOLIO'); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 text-[#8E6F1D] dark:text-[#F0C968]">
                      <BookOpen className="w-3.5 h-3.5" /> {hi ? 'पूरा पाठ देखें' : 'Open full reading'}
                    </button>
                    <button onClick={() => router.push('/ask?focus=milan&mode=detailed')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#8E6F1D] text-white">
                      <Phone className="w-3.5 h-3.5" /> {hi ? 'परामर्श बुक करें' : 'Book consultation'}
                    </button>
                  </div>
                </div>

                {/* Complete classical Milan dosha layer — visible first in Overview */}
                <section className="rounded-2xl border border-[#E5D7BC] dark:border-white/10 bg-white dark:bg-[#121422] shadow-sm p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> {hi ? 'पूर्ण शास्त्रीय दोष परत' : 'Complete classical Milan dosha layer'}
                    </h2>
                    <span className="text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E]">Mangal · Rajju · Vedha · Kala Sarpa + D9 / 7th house</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {calc.supplementalDoshas.map((d) => (
                        <div key={d.id} className="rounded-xl border border-[#F0E6D2] dark:border-white/10 p-3 bg-[#FAF7F2] dark:bg-[#0E101D]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold">{d.name}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${d.cancelled ? 'bg-amber-50 text-amber-800 border-amber-300' : d.active ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                              {d.cancelled ? (hi ? 'निरस्त' : 'Cancelled') : d.active ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'शुद्ध' : 'Clear')}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#57534E] dark:text-[#D1C9BF] mt-1">{hi && d.reasonHi ? d.reasonHi : d.reason}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-xl border border-[#F0E6D2] dark:border-white/10 p-4 bg-[#FAF7F2] dark:bg-[#0E101D] space-y-2.5">
                      <p className="text-xs leading-relaxed text-[#44403C] dark:text-[#D1C9BF]">{hi && calc.synthesis.summaryHi ? calc.synthesis.summaryHi : calc.synthesis.summary}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg bg-white dark:bg-[#121422] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">D9 Moon</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.navamsha.brideD9 || '—'} & {calc.synthesis.navamsha.groomD9 || '—'}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.navamsha.status}</div>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-[#121422] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">7th house</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.seventhHouse.brideSign || '—'} & {calc.synthesis.seventhHouse.groomSign || '—'}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.seventhHouse.status}</div>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-[#121422] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">Marriage karaka</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.marriageKaraka.brideVenus || '—'} & {calc.synthesis.marriageKaraka.groomVenus || '—'}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.marriageKaraka.status}</div>
                        </div>
                        <div className="rounded-lg bg-white dark:bg-[#121422] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">Kala Sarpa</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.kalaSarpa.brideActive || calc.synthesis.kalaSarpa.groomActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'शुद्ध' : 'Clear')}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.kalaSarpa.bothActive ? (hi ? 'दोनों में' : 'Both') : calc.synthesis.kalaSarpa.brideActive ? (hi ? 'वधू में' : 'Bride') : calc.synthesis.kalaSarpa.groomActive ? (hi ? 'वर में' : 'Groom') : '—'}</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] border-t border-[#F0E6D2] dark:border-white/5 pt-2.5">
                        {hi
                          ? 'दोष का अर्थ विनाश नहीं। शास्त्र कहते हैं — समझें, सावधानी रखें, और पूरी कुंडली के साथ ज्योतिषी से पूछें।'
                          : 'A dosha does not equal doom. The classical texts say: understand it, respect it, and ask a qualified astrologer to read it with the full chart.'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button onClick={() => { chitiSensory.playTick(); setActiveTab('WORKBENCH'); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 text-[#8E6F1D] dark:text-[#F0C968]">
                          <Workflow className="w-3.5 h-3.5" /> {hi ? 'गहरे में देखें' : 'Explore deeper'}
                        </button>
                        <button onClick={() => router.push('/ask?focus=milan&mode=detailed')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#8E6F1D] text-white">
                          <Phone className="w-3.5 h-3.5" /> {hi ? 'परामर्श बुक करें' : 'Book consultation'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Novice curiosity: what the Pandit call actually adds */}
                <section className="rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#241D10] to-[#3A2C14] dark:from-[#131510] dark:to-[#1C2312] p-5 sm:p-6 text-amber-50">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="max-w-xl">
                      <h2 className="font-serif font-bold text-lg text-amber-100">{hi ? 'अब क्या? पंडित कॉल में क्या मिलेगा' : 'Still curious? What a Pandit call adds'}</h2>
                      <p className="text-[11px] text-amber-200/80 mt-1.5 leading-relaxed">
                        {hi
                          ? 'यह स्कोर केवल चन्द्र और कूट पढ़ता है। पंडित पूरी कुंडली, दशा, D9, सप्तम भाव और उपाय एक साथ देखते हैं।'
                          : 'This score reads the Moon and the eight kootas. A Pandit reads the whole chart — the dashas, D9, seventh house, dosha remedies and family context together.'}
                      </p>
                    </div>
                    <button onClick={() => router.push('/ask?focus=milan&mode=detailed')} className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#060709] hover:bg-[#F0C968] transition-colors">
                      <Phone className="w-4 h-4" /> {hi ? 'पंडित से बात करें' : 'Talk to a Pandit'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                    {[
                      { icon: Calendar, en: 'Marriage timing from dashas', hi: 'दशा से विवाह समय' },
                      { icon: BookOpen, en: 'D9, 7th house & karakas', hi: 'D9, सप्तम भाव और कारक' },
                      { icon: Shield, en: 'Dosha remedies if needed', hi: 'दोष के उपाय (यदि आवश्यक)' },
                      { icon: MessageSquare, en: 'Your personal questions', hi: 'आपके निजी प्रश्न' },
                    ].map((b) => (
                      <div key={b.en} className="rounded-xl border border-amber-200/20 bg-black/10 p-3">
                        <b.icon className="w-4 h-4 text-[#F0C968] mb-1.5" />
                        <div className="font-semibold text-amber-100">{hi ? b.hi : b.en}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </section>
            )}

            {activeTab === 'WORKBENCH' && (
              <section className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-[#F0E6D2] dark:border-white/5 bg-[#FAF6EF] dark:bg-[#161828]">
                      <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">{hi ? 'कूट कार्यक्षेत्र' : 'Koota workbench'}</h2>
                    </div>
                    <div className="divide-y divide-[#F0E6D2] dark:divide-white/5">
                      {calc.kootas.map((k) => (
                        <button key={k.id} type="button" onClick={() => { chitiSensory.playTick(); setSelectedKootaId(k.id); }}
                          className={`w-full flex items-center gap-2 px-5 py-3 text-xs text-left transition-colors ${selectedKootaId === k.id ? 'bg-amber-50/70 dark:bg-[#D4AF37]/10' : 'hover:bg-[#FAF6EF] dark:hover:bg-[#161828]'}`}>
                          <div className="w-28 font-bold">{k.sanskrit || k.name}</div>
                          <div className="flex-1 text-[#57534E] dark:text-[#D1C9BF] truncate">{k.detail}</div>
                          <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">{k.points}/{k.maxPoints}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-5">
                    {(() => {
                      const k = calc.kootas.find((x) => x.id === selectedKootaId) || calc.kootas[0];
                      if (!k) return null;
                      return (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#78716C] dark:text-[#A8A29E] font-bold">{hi ? 'चयनित कूट' : 'Selected koota'}</span>
                            <h3 className="text-base font-serif font-bold">{k.sanskrit || k.name} <span className="text-xs text-[#78716C] font-normal">· {k.name}</span></h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-serif font-bold text-3xl text-[#8E6F1D] dark:text-[#F0C968]">{k.points}<span className="text-base text-[#78716C]">/{k.maxPoints}</span></span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${k.verdict === 'Dosha' ? 'bg-rose-50 text-rose-700' : k.verdict === 'Low' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{k.verdict}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-[#44403C] dark:text-[#D1C9BF]">{k.detail}</p>
                          <p className="text-xs leading-relaxed text-[#57534E] dark:text-[#A8A29E]">{k.detailHi}</p>
                        </div>
                      );
                    })()}
                    <div className="mt-5 pt-4 border-t border-[#F0E6D2] dark:border-white/5">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] mb-2">{hi ? 'पूरक दोष' : 'Supplemental doshas'}</h3>
                      <div className="space-y-2">
                        {calc.supplementalDoshas.map((d) => (
                          <button key={d.id} type="button" className="w-full text-left rounded-xl border border-[#F0E6D2] dark:border-white/10 p-3 bg-[#FAF7F2] dark:bg-[#0E101D]">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold">{d.name}</span>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${d.cancelled ? 'bg-amber-50 text-amber-800 border-amber-300' : d.active ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                                {d.cancelled ? (hi ? 'निरस्त' : 'Cancelled') : d.active ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'शुद्ध' : 'Clear')}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#57534E] dark:text-[#D1C9BF] mt-1">{hi && d.reasonHi ? d.reasonHi : d.reason}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-[#F0E6D2] dark:border-white/5">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] mb-2">{hi ? 'गहरी कुंडली संश्लेषण' : 'Deeper-chart synthesis'}</h3>
                      <p className="text-xs leading-relaxed text-[#44403C] dark:text-[#D1C9BF]">{hi && calc.synthesis.summaryHi ? calc.synthesis.summaryHi : calc.synthesis.summary}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div className="rounded-lg bg-[#FAF7F2] dark:bg-[#0E101D] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">D9 Moon</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.navamsha.brideD9 || '—'} & {calc.synthesis.navamsha.groomD9 || '—'}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.navamsha.status}</div>
                        </div>
                        <div className="rounded-lg bg-[#FAF7F2] dark:bg-[#0E101D] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">7th house</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.seventhHouse.brideSign || '—'} & {calc.synthesis.seventhHouse.groomSign || '—'}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.seventhHouse.status}</div>
                        </div>
                        <div className="rounded-lg bg-[#FAF7F2] dark:bg-[#0E101D] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">Marriage karaka</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.marriageKaraka.brideVenus || '—'} & {calc.synthesis.marriageKaraka.groomVenus || '—'}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.marriageKaraka.status}</div>
                        </div>
                        <div className="rounded-lg bg-[#FAF7F2] dark:bg-[#0E101D] border border-[#F0E6D2] dark:border-white/10 p-2">
                          <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">Kala Sarpa</div>
                          <div className="font-bold mt-0.5">{calc.synthesis.kalaSarpa.brideActive || calc.synthesis.kalaSarpa.groomActive ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'शुद्ध' : 'Clear')}</div>
                          <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.kalaSarpa.bothActive ? (hi ? 'दोनों में' : 'Both') : calc.synthesis.kalaSarpa.brideActive ? (hi ? 'वधू में' : 'Bride') : calc.synthesis.kalaSarpa.groomActive ? (hi ? 'वर में' : 'Groom') : '—'}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#F0E6D2] dark:border-white/5 pt-3">
                        <span className="text-[11px] font-semibold text-[#8E6F1D] dark:text-[#F0C968]">
                          {hi ? 'ज्योतिषी से पूरी D9, सप्तम भाव और कारक एक साथ पढ़ें।' : 'Ask our astrologer to read the D9, 7th house and karakas together.'}
                        </span>
                        <button onClick={() => router.push('/ask?focus=milan&mode=detailed')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#8E6F1D] text-white">
                          <Phone className="w-3.5 h-3.5" /> {hi ? 'परामर्श' : 'Consult'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'FOLIO' && (
              <>
            <section className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="text-center md:border-r md:border-[#F0E6D2] dark:border-white/5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#78716C] dark:text-[#A8A29E] font-bold">{hi ? 'शास्त्रीय योग' : 'Classical score'}</div>
                  <div className="font-serif font-bold text-5xl text-[#8E6F1D] dark:text-[#F0C968] mt-1">{calc.total}<span className="text-xl text-[#78716C]">/{calc.maxTotal}</span></div>
                </div>
                <div className="md:col-span-2">
                  <h2 className="text-lg font-serif font-bold">{calc.verdict.titleHi && hi ? calc.verdict.titleHi : calc.verdict.title}</h2>
                  <p className="text-xs text-[#57534E] dark:text-[#D1C9BF] leading-relaxed mt-1">{calc.verdict.summaryHi && hi ? calc.verdict.summaryHi : calc.verdict.summary}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {calc.doshas.map((d) => (
                      <span key={d.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${d.cancelled ? 'bg-amber-50 text-amber-800 border-amber-300' : d.active ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                        {d.name}: {d.cancelled ? (hi ? 'निरस्त' : 'Cancelled') : d.active ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'शुद्ध' : 'Clear')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Koota breakdown */}
            <section className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0E6D2] dark:border-white/5 bg-[#FAF6EF] dark:bg-[#161828]">
                <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">{hi ? 'कूट विवरण' : 'Koota breakdown'}</h2>
              </div>
              <div className="divide-y divide-[#F0E6D2] dark:divide-white/5">
                {calc.kootas.map((k) => (
                  <div key={k.id} className="flex flex-wrap items-center gap-2 px-5 py-3 text-xs">
                    <div className="w-24 font-bold">{k.sanskrit || k.name}</div>
                    <div className="flex-1 text-[#57534E] dark:text-[#D1C9BF]">{k.detail}</div>
                    <div className="w-24 text-right font-bold text-[#8E6F1D] dark:text-[#F0C968]">{k.points}/{k.maxPoints}</div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${k.verdict === 'Dosha' ? 'bg-rose-50 text-rose-700' : k.verdict === 'Low' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{k.verdict}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 text-[10px] font-mono-data text-[#78716C] dark:text-[#A8A29E] border-t border-[#F0E6D2] dark:border-white/5">
                {calc.sources.join(' · ')}
              </div>
            </section>

            {/* Supplemental dosha layer */}
            <section className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-5 sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> {hi ? 'पूरक दोष परत' : 'Supplemental Dosha layer'} <span className="text-[9px] text-[#78716C] font-normal normal-case">(Mangal · Rajju · Vedha · Kala Sarpa)</span>
              </h2>
              <div className="mt-3 space-y-2.5">
                {calc.supplementalDoshas.map((d) => (
                  <div key={d.id} className="rounded-xl border border-[#F0E6D2] dark:border-white/10 p-3 bg-[#FAF7F2] dark:bg-[#0E101D]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{d.name}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${d.cancelled ? 'bg-amber-50 text-amber-800 border-amber-300' : d.active ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                        {d.cancelled ? (hi ? 'निरस्त' : 'Cancelled') : d.active ? (hi ? 'सक्रिय' : 'Active') : (hi ? 'शुद्ध' : 'Clear')}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#57534E] dark:text-[#D1C9BF] mt-1">{hi && d.reasonHi ? d.reasonHi : d.reason}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Deeper-chart synthesis */}
            <section className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-5 sm:p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> {hi ? 'गहरी कुंडली संश्लेषण' : 'Deeper-chart synthesis'} <span className="text-[9px] text-[#78716C] font-normal normal-case">D9 · 7th house · Venus / Jupiter</span>
              </h2>
              <p className="text-xs leading-relaxed text-[#44403C] dark:text-[#D1C9BF] mt-3">{hi && calc.synthesis.summaryHi ? calc.synthesis.summaryHi : calc.synthesis.summary}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="rounded-xl border border-[#F0E6D2] dark:border-white/10 p-3">
                  <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">D9 Navamsha Moon</div>
                  <div className="font-bold mt-0.5">{calc.synthesis.navamsha.brideD9 || '—'} & {calc.synthesis.navamsha.groomD9 || '—'}</div>
                  <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.navamsha.status}</div>
                </div>
                <div className="rounded-xl border border-[#F0E6D2] dark:border-white/10 p-3">
                  <div className="text-[9px] uppercase tracking-wider text-[#78716C] font-bold">7th house</div>
                  <div className="font-bold mt-0.5">{calc.synthesis.seventhHouse.brideSign || '—'} & {calc.synthesis.seventhHouse.groomSign || '—'}</div>
                  <div className="text-[10px] text-[#8E6F1D] dark:text-[#F0C968]">{calc.synthesis.seventhHouse.status}</div>
                </div>
              </div>
            </section>

            {/* Prediction layer */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#8E6F1D] dark:text-[#F0C968]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">{hi ? 'पारंपरिक पाठ — समझें, प्रेरित हों, पूछें' : 'Traditional reading — explanation, motivation, then ask'}</h2>
              </div>
              {topKoota && (
                <div className="rounded-2xl border border-[#8E6F1D]/30 bg-amber-50/60 dark:bg-[#D4AF37]/10 p-4 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">{hi ? `सबसे सशक्त कूट` : 'Strongest koota'}</p>
                  <p className="font-semibold mt-1">{topKoota.sanskrit || topKoota.name} — {topKoota.points}/{topKoota.maxPoints} · {topKoota.detail}</p>
                </div>
              )}
              {visiblePredictions.map((p) => (
                <div key={p.id} className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-5">
                  <h3 className="text-base font-serif font-bold">{hi && p.titleHi ? p.titleHi : p.title}</h3>
                  <div className="mt-3 space-y-3 text-xs leading-relaxed text-[#44403C] dark:text-[#D1C9BF]">
                    <p className="border-l-2 border-[#8E6F1D] pl-3 font-medium">{hi ? p.traditionalClaimHi : p.traditionalClaim}</p>
                    <p><strong className="text-[#8E6F1D] dark:text-[#F0C968]">{hi ? 'क्यों' : 'Why this matters'}: </strong>{hi ? p.explanationHi : p.explanation}</p>
                    <p><strong className="text-emerald-700 dark:text-emerald-400">{hi ? 'प्रेरणा' : 'Motivation'}: </strong>{hi ? p.motivationHi : p.motivation}</p>
                    <p><strong className="text-amber-700 dark:text-amber-300">{hi ? 'सावधानी' : 'Caution'}: </strong>{hi ? p.cautionHi : p.caution}</p>
                    <p><strong className="text-[#8E6F1D] dark:text-[#F0C968]">{hi ? 'सर्वोत्तम संभव स्थिति' : 'Best possible scenario'}: </strong>{hi ? p.bestScenarioHi : p.bestScenario}</p>
                    <div className="flex flex-wrap items-center gap-3 border-t border-[#F0E6D2] dark:border-white/5 pt-3">
                      <span className="font-semibold text-[#8E6F1D] dark:text-[#F0C968]"><AlertTriangle className="w-3.5 h-3.5 inline" /> {hi ? p.askAstrologerHi : p.askAstrologer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Paid consultation CTA */}
            <section className="rounded-2xl bg-gradient-to-r from-[#241D10] to-[#3A2C14] dark:from-[#131510] dark:to-[#1C2312] p-6 text-center border border-[#D4AF37]/30">
              <p className="font-serif font-bold text-xl text-amber-100">{hi ? 'इसे पूरे विवरण के साथ समझें' : 'Understand this in full detail'}</p>
              <p className="text-xs text-amber-200/80 mt-2 max-w-2xl mx-auto leading-relaxed">
                {hi
                  ? 'आपने अभी केवल पहला पन्ना देखा है। हमारे ज्योतिषी D9 नवांश, सातवें भाव, मंगल दोष, राज्जु-वेध और कालसर्प को दशा और उपाय के साथ पढ़ते हैं।'
                  : 'You have only seen the first page. Our astrologer reads the D9 Navamsha, the seventh house, Mangal Dosha, Rajju, Vedha and Kala Sarpa together with the dashas and remedies.'}
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl mx-auto text-[11px] text-left">
                {[
                  { icon: BookOpen, en: 'The full chart, not just 36 points', hi: 'पूरी कुंडली, केवल 36 अंक नहीं' },
                  { icon: Calendar, en: 'When marriage is supported by the dashas', hi: 'दशाओं से शुभ विवाह-समय' },
                  { icon: Shield, en: 'What a dosha needs (and what it does not)', hi: 'दोष का उपाय और उसकी सीमा' },
                ].map((b) => (
                  <div key={b.en} className="flex items-start gap-2 rounded-xl border border-amber-200/20 bg-black/10 p-3">
                    <b.icon className="w-4 h-4 text-[#F0C968] shrink-0 mt-0.5" />
                    <span className="text-amber-100">{hi ? b.hi : b.en}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push('/ask?focus=milan&mode=detailed')}
                className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#060709] hover:bg-[#F0C968] transition-colors"
              >
                <Phone className="w-4 h-4" /> {hi ? 'पंडित परामर्श बुक करें' : 'Book a Pandit consultation'} <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-2 text-[9px] font-mono-data text-amber-200/60">{hi ? 'विशेषज्ञ मार्गदर्शन · पारंपरिक पाठ, वादा नहीं' : 'Expert guidance · a traditional reading, not a promise'}</p>
            </section>

            {/* PDF action band */}
            <section className="bg-white dark:bg-[#121422] rounded-2xl border border-[#E5D7BC] dark:border-white/10 shadow-sm p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8E6F1D] dark:text-[#F0C968]">{hi ? 'आपकी मिलान पीडीएफ़' : 'Your Milan PDF'}</h3>
                <p className="text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5">Choose {hi ? 'संस्करण' : 'edition'} ({['CLIENT', 'PANDIT', 'SCHOLAR'].map((m) => m).join(' / ')}). {lastPdfMeta && <span className="text-emerald-600 font-semibold">Last: {lastPdfMeta.pages} pages · {lastPdfMeta.kb} KB · PASS</span>}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={print} disabled={isGeneratingPdf} className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 bg-white dark:bg-[#121422] text-[#8E6F1D] dark:text-[#F0C968]">
                  <Printer className="w-3.5 h-3.5 inline mr-1" /> {hi ? 'प्रिंट' : 'Print'}
                </button>
                <button onClick={download} disabled={isGeneratingPdf} className="px-4 py-2 text-xs font-bold rounded-lg bg-[#8E6F1D] text-white hover:bg-[#785E18]">
                  <Download className="w-3.5 h-3.5 inline mr-1" /> {isGeneratingPdf ? (hi ? 'जाँच…' : 'Validating…') : (hi ? 'डाउनलोड' : 'Download PDF')}
                </button>
              </div>
            </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

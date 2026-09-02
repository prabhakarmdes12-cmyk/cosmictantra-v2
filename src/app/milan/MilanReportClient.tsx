'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download, Printer, Shield, Sparkles, CheckCircle2, ArrowRight,
  Edit3, AlertTriangle, Heart, BookOpen, FileText, Phone, Star,
} from 'lucide-react';
import { getCanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';
import { calculateMilan, milanInputFromSnapshot, milanContextFromSnapshot, MilanCalculation, MilanPersonInput } from '@/lib/kundli/v42/milan/milanEngine';
import GlobalHeader from '@/components/layout/GlobalHeader';
import LanguageSelectorModal from '@/components/layout/LanguageSelectorModal';
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

  const hi = lang === 'hi';

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

  const compute = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    chitiSensory.playTick();
    setComputing(true);
    setCalc(null);
    try {
      const snapA = getCanonicalJyotishSnapshot({
        birthDate: groom.birthDate,
        birthTime: groom.birthTime,
        latitude: Number(groom.latitude),
        longitude: Number(groom.longitude),
        timezone: Number(groom.timezone),
        locationName: groom.locationName || groom.name,
      });
      const snapB = getCanonicalJyotishSnapshot({
        birthDate: bride.birthDate,
        birthTime: bride.birthTime,
        latitude: Number(bride.latitude),
        longitude: Number(bride.longitude),
        timezone: Number(bride.timezone),
        locationName: bride.locationName || bride.name,
      });
      const result = calculateMilan(
        milanInputFromSnapshot(snapB),
        milanInputFromSnapshot(snapA),
        { brideCtx: milanContextFromSnapshot(snapB), groomCtx: milanContextFromSnapshot(snapA) }
      );
      setCalc(result);
      setUsingDemo(false);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setComputing(false);
    }
  };

  const fillDemo = () => {
    chitiSensory.playTick();
    setGroom({ ...DEMO_A });
    setBride({ ...DEMO_B });
    setUsingDemo(true);
    setCalc(null);
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
              { label: 'Bride (वधू)', form: bride, setForm: setBride },
              { label: 'Groom (वर)', form: groom, setForm: setGroom },
            ].map(({ label, form, setForm }) => (
              <div key={label} className="p-4 rounded-xl border border-[#E5D7BC] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#0E101D] space-y-2.5">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#8E6F1D] dark:text-[#D4AF37] font-bold">{label}</div>
                <input className={inputCls} placeholder={hi ? 'नाम' : 'Name'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className={inputCls} value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} aria-label="Birth date" />
                  <input type="time" className={inputCls} value={form.birthTime} onChange={(e) => setForm({ ...form, birthTime: e.target.value })} aria-label="Birth time" />
                </div>
                <input className={inputCls} placeholder={hi ? 'जन्म स्थान' : 'Birth place'} value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} />
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
            {/* Verdict */}
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
              {calc.predictions.map((p) => (
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
                  ? 'हमारे ज्योतिषी D9 नवांश, सातवें भाव, मंगल दोष, राज्जु-वेध और कालसर्प को साथ देखते हैं। आज ही एक विस्तृत मिलान परामर्श बुक करें।'
                  : 'Our astrologer reads the D9 Navamsha, the seventh house, Mangal Dosha, Rajju, Vedha and Kala Sarpa together with the eight kootas. Book a detailed Milan consultation to understand this reading in the full chart context.'}
              </p>
              <button
                onClick={() => router.push('/ask?focus=milan&mode=detailed')}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#D4AF37] text-[#060709] hover:bg-[#F0C968] transition-colors"
              >
                <Phone className="w-4 h-4" /> {hi ? 'परामर्श बुक करें' : 'Book consultation'} <ArrowRight className="w-4 h-4" />
              </button>
              <p className="mt-2 text-[9px] font-mono-data text-amber-200/60">{hi ? 'विशेषज्ञ परामर्श · मार्गदर्शन, भविष्यवाणी नहीं' : 'Expert guidance · a traditional reading, not a promise'}</p>
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
      </main>
    </div>
  );
}

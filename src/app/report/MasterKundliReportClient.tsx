'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Share2
} from 'lucide-react';
import jsPDF from 'jspdf';
import { getCanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';
import { generateKundliBookModel, BookVolume } from '@/lib/jyotish/kundliBookModel';
import NorthIndianChart from '@/components/NorthIndianChart';
import { chitiSensory } from '@/lib/chitiAudio';
import { getPdfFontFamily, registerDevanagariFont } from '@/lib/pdfFonts';

export default function MasterKundliReportClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active view mode: 17-Volume Encyclopedic Folio vs Interactive Visual Workbench
  const [activeTab, setActiveTab] = useState<'FOLIO' | 'WORKBENCH'>('FOLIO');
  const [readingDepth, setReadingDepth] = useState<'SIMPLE' | 'DETAILED' | 'PANDIT'>('DETAILED');
  const [activeGraha, setActiveGraha] = useState<string | null>('Saturn');
  const [activeVolumeIndex, setActiveVolumeIndex] = useState<number>(0);
  const [activeDivision, setActiveDivision] = useState<number>(1); // 1 = D1, 9 = D9, 10 = D10, 60 = D60
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lang, setLang] = useState('en');

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

  useEffect(() => {
    const savedLanguage = localStorage.getItem('cosmictantra_lang');
    if (savedLanguage) {
      setLang(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }

    // 1. Check URL parameters
    const paramName = searchParams.get('name');
    const paramDob = searchParams.get('dob');
    const paramTob = searchParams.get('tob');
    const paramCity = searchParams.get('city');
    const paramLat = searchParams.get('lat');
    const paramLng = searchParams.get('lng') || searchParams.get('lon');
    const paramTz = searchParams.get('tz');

    if (paramDob) {
      setBirthState({
        name: paramName || 'Seeker',
        birthDate: paramDob,
        birthTime: paramTob || '10:30:00',
        latitude: paramLat ? parseFloat(paramLat) : 22.0797,
        longitude: paramLng ? parseFloat(paramLng) : 82.1391,
        timezone: paramTz ? parseFloat(paramTz) : 5.5,
        locationName: paramCity || 'Bilaspur, India'
      });
      return;
    }

    // 2. Check localStorage
    try {
      const saved = localStorage.getItem('cosmictantra_active_kundli');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.birthDate) {
          setBirthState({
            name: parsed.name || 'Seeker',
            birthDate: parsed.birthDate,
            birthTime: parsed.birthTime || '10:30:00',
            latitude: parsed.latitude || 22.0797,
            longitude: parsed.longitude || 82.1391,
            timezone: parsed.timezone || 5.5,
            locationName: parsed.city || parsed.locationName || 'Bilaspur, India'
          });
        }
      }
    } catch {}
  }, [searchParams]);

  // Compute Canonical Astronomical Snapshot & 17-Volume Book Model
  const snapshot = useMemo(() => {
    return getCanonicalJyotishSnapshot({
      birthDate: birthState.birthDate,
      birthTime: birthState.birthTime,
      latitude: birthState.latitude,
      longitude: birthState.longitude,
      timezone: birthState.timezone,
      locationName: birthState.locationName
    });
  }, [birthState]);

  const book = useMemo(() => {
    return generateKundliBookModel(birthState.name, snapshot, 'COMPLETE_VEDIC_KUNDLI');
  }, [birthState.name, snapshot]);

  const chartD1Obj = useMemo(() => ({
    lagna: snapshot.lagna,
    houses: snapshot.houses,
    planets: snapshot.planets
  }), [snapshot]);

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
  const activeVolume = book.volumes[activeVolumeIndex] || book.volumes[0];

  const handlePrint = () => {
    chitiSensory.playTick();
    window.print();
  };

  const handleDownloadPDF = async () => {
    chitiSensory.playTick();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const isHindi = lang === 'hi';
    const devanagariReady = isHindi ? await registerDevanagariFont(doc) : false;
    const pdfFont = getPdfFontFamily(lang, devanagariReady);
    if (isHindi && !devanagariReady) {
      const warning = 'हिंदी PDF फ़ॉन्ट लोड नहीं हो सका। PDF एक वैकल्पिक फ़ॉन्ट के साथ बनाई जाएगी और कुछ हिंदी अक्षर सही न दिखें।';
      console.warn(`[Kundli PDF] ${warning}`);
      window.alert(warning);
    }
    const text = (en: string, hi: string) => isHindi ? hi : en;
    const gold = '#8E6F1D';
    const ink = '#1C1917';
    const margin = 18;
    let y = 20;
    let page = 1;

    const header = () => {
      doc.setFont(pdfFont, 'normal');
      doc.setFontSize(8); doc.setTextColor('#78716C');
      doc.text(`CosmicTantra • ${birthState.name}`, margin, 10);
      doc.text(`${page}`, 192, 10, { align: 'right' });
      doc.setDrawColor('#E5D7BC'); doc.line(margin, 13, 192, 13);
    };
    const newPage = () => { doc.addPage(); page += 1; y = 22; header(); };
    const ensure = (h = 8) => { if (y + h > 278) newPage(); };
    const line = (value: string, size = 9, bold = false) => {
      const clean = String(value).replace(/[\u0000-\u001f]/g, '');
      doc.setFont(pdfFont, bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(clean, 174);
      ensure(lines.length * (size * .48) + 3);
      doc.setTextColor(ink);
      doc.text(lines, margin, y); y += lines.length * (size * .48) + 3;
    };
    const title = (value: string) => { ensure(13); doc.setFont(pdfFont,'bold'); doc.setFontSize(13); doc.setTextColor(gold); doc.text(value, margin, y); y += 8; doc.setDrawColor('#D8C89F'); doc.line(margin,y,192,y); y += 5; };
    const section = (value: string) => { ensure(12); doc.setFont(pdfFont,'bold'); doc.setFontSize(10); doc.setTextColor(gold); doc.text(value, margin, y); y += 6; };
    const valueLabel = (label: string, value: unknown) => line(`${label}: ${value ?? '—'}`);

    header();
    doc.setFont(pdfFont,'bold'); doc.setFontSize(20); doc.setTextColor(gold);
    doc.text(text('COSMICTANTRA MASTER KUNDLI', 'COSMICTANTRA जन्म कुण्डली'), 105, 34, { align: 'center' });
    doc.setFontSize(11); doc.setTextColor(ink); doc.text(text('Detailed Vedic astrology report', 'विस्तृत वैदिक ज्योतिष रिपोर्ट'), 105, 42, { align: 'center' });
    y = 58;
    section(text('Birth details', 'जन्म विवरण'));
    valueLabel(text('Name', 'नाम'), birthState.name); valueLabel(text('Date and time', 'दिनांक और समय'), `${birthState.birthDate} ${birthState.birthTime}`); valueLabel(text('Birth place', 'जन्म स्थान'), birthState.locationName);
    valueLabel(text('Coordinates', 'निर्देशांक'), `${birthState.latitude.toFixed(4)}°, ${birthState.longitude.toFixed(4)}°`); valueLabel('UTC', `+${birthState.timezone}`);
    section(text('Calculation standard', 'गणना मानक'));
    valueLabel('Ayanamsha', `Lahiri / Chitra Paksha (${snapshot.meta.ayanamshaValue.toFixed(4)}°)`); valueLabel('Engine', snapshot.meta.engineVersion); valueLabel('Julian Day', snapshot.meta.julianDay.toFixed(5));

    newPage(); title(text('I. Janma Panchang and essentials', 'I. जन्म पंचांग और मूल विवरण'));
    valueLabel(text('Ascendant', 'लग्न'), `${snapshot.lagna.rashiName} (${snapshot.lagna.degreeStr})`);
    valueLabel(text('Birth Nakshatra', 'जन्म नक्षत्र'), `${snapshot.birthPanchang.nakshatra.name} • Pada ${snapshot.birthPanchang.nakshatra.pada}`);
    valueLabel(text('Tithi', 'तिथि'), snapshot.birthPanchang.udayaTithi.fullName); valueLabel('Masa', snapshot.birthPanchang.masa?.name || 'Vedic'); valueLabel('Yoga', snapshot.birthPanchang.yoga.name); valueLabel('Karana', snapshot.birthPanchang.karana.name);
    section(text('Rashi chart placements', 'राशि कुण्डली ग्रह स्थिति'));
    snapshot.planetsArray.forEach((p: any) => valueLabel(`${p.name}${p.isRetrograde ? ' (R)' : ''}`, `${p.rashiName} • ${p.degreeStr} • House ${p.house} • ${p.dignity || ''}`));

    newPage(); title(text('II. Vimshottari dasha timeline', 'II. विंशोत्तरी दशा क्रम'));
    valueLabel(text('Current period', 'वर्तमान दशा'), snapshot.dasha.currentPeriodString); valueLabel(text('Date range', 'अवधि'), snapshot.dasha.currentDateRange);
    const dasha = snapshot.dasha as any;
    Object.entries(dasha).forEach(([key, val]) => { if (typeof val === 'string' || typeof val === 'number') valueLabel(key.replace(/([A-Z])/g,' $1'), val); });
    section(text('Interpretive book volumes', 'व्याख्यात्मक खंड'));
    book.volumes.forEach((vol: any) => { ensure(10); line(`${vol.volumeNumber}. ${vol.title} — ${vol.sanskritTitle}`, 9, true); line(vol.description || ''); });

    newPage(); title(text('III. Divisional charts and strengths', 'III. वर्ग कुण्डलियाँ और बल'));
    ['shodashavarga','balas','ashtakavarga','yogas','doshas'].forEach((key) => {
      const data = (snapshot as any)[key]; if (!data) return; section(key.replace(/([A-Z])/g,' $1').toUpperCase());
      const dump = (obj: any, prefix = '') => { if (obj === null || obj === undefined) return; if (typeof obj !== 'object') { line(`${prefix}: ${obj}`); return; } Object.entries(obj).slice(0, 80).forEach(([k,v]) => dump(v, prefix ? `${prefix}.${k}` : k)); };
      dump(data);
    });

    newPage(); title(text('IV. Complete technical appendix', 'IV. सम्पूर्ण तकनीकी परिशिष्ट'));
    const dump = (obj: any, prefix = '') => { if (obj === null || obj === undefined) return; if (typeof obj !== 'object') { line(`${prefix}: ${obj}`); return; } Object.entries(obj).forEach(([k,v]) => dump(v, prefix ? `${prefix}.${k}` : k)); };
    dump(snapshot);
    section(text('Important note', 'महत्वपूर्ण सूचना'));
    line(text('This report presents calculated sidereal positions and traditional interpretive material. It is not a substitute for professional medical, legal, financial, or mental-health advice.', 'यह रिपोर्ट साइडीरियल गणनाओं और पारंपरिक व्याख्या पर आधारित है। यह चिकित्सकीय, कानूनी, वित्तीय या मानसिक स्वास्थ्य सलाह का विकल्प नहीं है।'));
    doc.save(`CosmicTantra_Master_Kundli_${birthState.name.replace(/[^a-z0-9]+/gi, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1917] font-sans antialiased pb-24 selection:bg-[#E5D7BC]">
      
      {/* 1. Header Toolbar */}
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E5D7BC] px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 print:hidden">
        
        {/* Left: Branding & Subject Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 rounded-full bg-[#8E6F1D]/10 border border-[#8E6F1D]/30 flex items-center justify-center text-[#8E6F1D] hover:bg-[#8E6F1D]/20 transition-all font-serif font-bold text-sm"
            title="Back to Home"
          >
            ॐ
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base lg:text-lg tracking-tight text-[#1C1917]">COSMICTANTRA MASTER KUNDLI</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#8E6F1D]/15 text-[#8E6F1D] border border-[#8E6F1D]/20 uppercase tracking-wider">
                V1 FOLIO
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] font-mono-data">
              <strong>{birthState.name}</strong> • {birthState.birthDate}, {birthState.birthTime} • {birthState.locationName}
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher (Folio vs Workbench) */}
        <div className="flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-xl border border-[#E5D7BC]">
          <button
            onClick={() => {
              chitiSensory.playTick();
              setActiveTab('FOLIO');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'FOLIO' ? 'bg-[#1C1917] text-[#FDFBF7] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>17-Volume Book</span>
          </button>

          <button
            onClick={() => {
              chitiSensory.playTick();
              setActiveTab('WORKBENCH');
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'WORKBENCH' ? 'bg-[#1C1917] text-[#FDFBF7] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'}`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Interactive Workbench</span>
          </button>
        </div>

        {/* Right: Actions (Depth, Print, Download, Edit) */}
        <div className="flex items-center gap-2">
          {activeTab === 'FOLIO' && (
            <div className="hidden sm:flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-lg border border-[#E5D7BC] text-xs">
              {(['SIMPLE', 'DETAILED', 'PANDIT'] as const).map((depth) => (
                <button
                  key={depth}
                  onClick={() => setReadingDepth(depth)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${readingDepth === depth ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'}`}
                >
                  {depth === 'SIMPLE' ? 'Simple' : depth === 'DETAILED' ? 'Detailed' : 'Scholarly'}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5D7BC] bg-white hover:bg-[#F5EFE6] transition-colors"
            title="Edit Birth Details"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#8E6F1D]" />
            <span className="hidden sm:inline">Edit Details</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#8E6F1D]/30 bg-white hover:bg-[#F5EFE6] text-[#8E6F1D] transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / SAVE PDF</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#8E6F1D] hover:bg-[#785E18] text-white transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DOWNLOAD PDF</span>
          </button>
        </div>

      </header>

      {/* 2. Graha Matrix Quick Bar */}
      <div className="bg-[#FAF6EF] border-b border-[#E5D7BC] px-4 lg:px-8 py-2 overflow-x-auto scrollbar-thin print:hidden">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-bold text-[#8E6F1D] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Activity className="w-3.5 h-3.5" /> Planetary Sphuta:
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
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected ? 'bg-[#8E6F1D] text-white border-[#8E6F1D] shadow-xs' : 'bg-white text-[#44403C] border-[#E5D7BC] hover:border-[#8E6F1D]/50'}`}
              >
                <span>{g.name}</span>
                <span className={`text-[10px] font-mono-data ${isSelected ? 'text-amber-200' : 'text-[#78716C]'}`}>
                  {String(g.rashiName || g.rashiEn || '').slice(0, 3)} {Math.floor(g.degrees % 30)}°{Math.floor((g.degrees * 60) % 60)}'
                </span>
                {g.isRetrograde && <span className="text-[10px] font-bold text-rose-500">(R)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Workspace Body */}
      {activeTab === 'FOLIO' ? (
        /* ================================================================ */
        /* MODE A: 17-VOLUME ENCYCLOPEDIC FOLIO                             */
        /* ================================================================ */
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: 17 Volumes Navigation */}
          <aside className="lg:col-span-3 space-y-1 print:hidden">
            <div className="text-xs font-bold uppercase tracking-wider text-[#78716C] px-3 pb-2 flex items-center justify-between">
              <span>17 Book Volumes</span>
              <span className="text-[10px] bg-[#E5D7BC] px-1.5 py-0.5 rounded text-[#1C1917] font-mono-data">17 / 17</span>
            </div>
            <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 scrollbar-thin">
              {book.volumes.map((vol, idx) => {
                const isCurrent = activeVolumeIndex === idx;
                return (
                  <button
                    key={vol.volumeNumber}
                    onClick={() => {
                      chitiSensory.playTick();
                      setActiveVolumeIndex(idx);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-start justify-between gap-2 border ${isCurrent ? 'bg-[#8E6F1D]/10 text-[#8E6F1D] font-semibold border-[#8E6F1D]/30 shadow-xs' : 'text-[#57534E] hover:bg-[#F5EFE6] border-transparent'}`}
                  >
                    <div className="truncate">
                      <div className="font-mono-data text-[10px] text-[#8E6F1D] font-bold">PART {vol.volumeNumber}</div>
                      <div className="truncate font-medium">{vol.title.split(':')[0]}</div>
                      <div className="text-[10px] text-[#78716C] truncate font-serif">{vol.sanskritTitle}</div>
                    </div>
                    {isCurrent && <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-1 text-[#8E6F1D]" />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Center/Right: Active Volume Viewer */}
          <div className="lg:col-span-9 space-y-8">
            
            {/* Volume Title Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5D7BC] shadow-sm relative overflow-hidden">
              <div className="absolute right-4 top-4 text-7xl font-serif text-[#F5EFE6] font-bold select-none pointer-events-none">
                {activeVolume.volumeNumber}
              </div>
              <div className="relative z-10 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#8E6F1D]/10 text-[#8E6F1D] font-mono-data">
                  VOLUME {activeVolume.volumeNumber} OF XVII
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1917] tracking-tight">
                  {activeVolume.title}
                </h1>
                <p className="text-sm font-serif text-[#8E6F1D] italic font-semibold">
                  {activeVolume.sanskritTitle}
                </p>
                <p className="text-xs sm:text-sm text-[#57534E] max-w-2xl pt-1 leading-relaxed">
                  {activeVolume.description}
                </p>
              </div>
            </div>

            {/* Selected Planet Micro-Banner */}
            {activeGraha && (
              <div className="bg-[#FAF6EF] rounded-xl p-4 border border-[#E5D7BC] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-data">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#8E6F1D] uppercase">Selected Graha:</span>
                  <span className="font-bold text-sm text-[#1C1917]">{activeGraha}</span>
                  <span className="text-[#78716C]">
                    ({snapshot.planets[activeGraha]?.rashiName} {snapshot.planets[activeGraha]?.degreeStr}, House {snapshot.planets[activeGraha]?.house})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#57534E]">
                  <span>Shadbala: <strong>{snapshot.balas?.shadbala[activeGraha]?.totalRupas.toFixed(2)} Rupas</strong></span>
                  <span>•</span>
                  <span>BAV: <strong>{snapshot.ashtakavarga?.bav[activeGraha]?.[(snapshot.planets[activeGraha]?.rashiId || 1) - 1]} Bindus</strong></span>
                  <span>•</span>
                  <span>Status: <strong>{snapshot.planets[activeGraha]?.isRetrograde ? 'Vakra (Retrograde)' : 'Direct'}</strong></span>
                </div>
              </div>
            )}

            {/* Charts Grid in Relevant Volumes */}
            {(activeVolumeIndex === 0 || activeVolumeIndex === 1 || activeVolumeIndex === 3) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-[#E5D7BC] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold font-serif text-[#1C1917]">D1 Lagna Rashi Chart</h3>
                    <span className="text-[10px] font-mono-data text-[#8E6F1D] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">Lagna: {snapshot.lagna.rashiName}</span>
                  </div>
                  <div className="max-w-[340px] mx-auto aspect-square">
                    <NorthIndianChart kundali={chartD1Obj} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E5D7BC] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold font-serif text-[#1C1917]">D9 Navamsha Chart</h3>
                    <span className="text-[10px] font-mono-data text-[#8E6F1D] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">Dharmamsha</span>
                  </div>
                  <div className="max-w-[340px] mx-auto aspect-square">
                    <NorthIndianChart kundali={chartD9Obj} />
                  </div>
                </div>
              </div>
            )}

            {/* Volume Content Sections */}
            <div className="space-y-6">
              {activeVolume.sections.map((sec, sIdx) => (
                <div key={sIdx} className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E5D7BC] shadow-sm space-y-4">
                  <div className="border-b border-[#F0E6D2] pb-3 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-serif font-bold text-[#1C1917]">{sec.title}</h2>
                    <span className="text-[10px] font-mono-data uppercase tracking-wider text-[#8E6F1D] font-bold bg-[#8E6F1D]/10 px-2 py-0.5 rounded">
                      {sec.category || `SEC ${sIdx + 1}`}
                    </span>
                  </div>

                  {/* Section Data Grid */}
                  {sec.data && typeof sec.data === 'object' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(sec.data).map(([key, val]) => {
                        if (val === null || val === undefined) return null;
                        if (typeof val === 'object' && !Array.isArray(val)) {
                          return (
                            <div key={key} className="col-span-full p-3.5 rounded-xl bg-[#FAF6EF] border border-[#E5D7BC]/70 space-y-1">
                              <div className="text-[10px] font-bold text-[#8E6F1D] uppercase font-mono-data">
                                {key.replace(/([A-Z])/g, ' $1')}
                              </div>
                              <div className="text-xs text-[#1C1917] font-mono-data flex flex-wrap gap-x-4 gap-y-1">
                                {Object.entries(val).map(([subK, subV]) => (
                                  <span key={subK}>
                                    <strong className="text-[#78716C]">{subK}:</strong> {String(subV)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={key} className="p-3 rounded-xl bg-[#FAF6EF] border border-[#E5D7BC]/70 space-y-0.5">
                            <div className="text-[10px] font-mono-data text-[#78716C] uppercase">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-[#1C1917] font-mono-data truncate">
                              {Array.isArray(val) ? `${val.length} items` : String(val)}
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
        </main>
      ) : (
        /* ================================================================ */
        /* MODE B: INTERACTIVE VISUAL WORKBENCH                             */
        /* ================================================================ */
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
          
          {/* Top Workbench Row: Divisional Chart Matrix & Live Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Chart Selection & SVG North Indian Chart */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#E5D7BC] shadow-sm space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F0E6D2]">
                <div>
                  <h2 className="text-base font-serif font-bold text-[#1C1917]">Divisional Shodashavarga Chart</h2>
                  <p className="text-[11px] font-mono-data text-[#78716C]">Lagna: {snapshot.lagna.rashiName} ({snapshot.lagna.degreeStr})</p>
                </div>

                <div className="flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-xl border border-[#E5D7BC]">
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
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${activeDivision === div.id ? 'bg-[#8E6F1D] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'}`}
                    >
                      {div.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-w-[420px] mx-auto aspect-square py-2">
                <NorthIndianChart kundali={activeChartData} />
              </div>

              <div className="text-center text-[11px] font-mono-data text-[#78716C] pt-2 border-t border-[#F0E6D2]">
                Division Active: <strong>D{activeDivision}</strong> • Precision Lahiri Chitra Paksha • JPL Ephemeris Synchronized
              </div>

            </div>

            {/* Right: Connected Graha Inspector */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E5D7BC] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D2]">
                <h2 className="text-base font-serif font-bold text-[#1C1917] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#8E6F1D]" />
                  <span>Graha Balas & Dignities</span>
                </h2>
                <span className="text-[10px] font-mono-data bg-[#8E6F1D]/10 text-[#8E6F1D] px-2 py-0.5 rounded font-bold">
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
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-[#FAF6EF] border-[#8E6F1D] shadow-xs' : 'bg-[#FDFBF7] border-[#E5D7BC] hover:border-[#8E6F1D]/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.isRetrograde && <span className="text-[10px] text-rose-500 font-bold">(R)</span>}
                        </div>
                        <span className="text-[11px] font-mono-data text-[#8E6F1D] font-bold">House {p.house}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] font-mono-data text-[#78716C]">
                        <div>
                          <span className="text-[#1C1917] font-semibold">{p.rashiName}</span> ({p.degreeStr})
                        </div>
                        <div>
                          Dignity: <strong className="text-[#1C1917]">{p.dignity || p.status}</strong>
                        </div>
                        <div>
                          Shadbala: <strong className="text-[#8E6F1D]">{shadbala ? `${shadbala.toFixed(2)} R` : 'N/A'}</strong>
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
            <div className="bg-white rounded-2xl p-6 border border-[#E5D7BC] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D2]">
                <h3 className="text-sm font-serif font-bold text-[#1C1917] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#8E6F1D]" />
                  <span>Vimshottari Dasha Timeline</span>
                </h3>
                <span className="text-[10px] font-mono-data text-[#8E6F1D] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">
                  {snapshot.dasha.currentPeriodString}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E5D7BC] space-y-1.5 font-mono-data text-xs">
                <div className="text-[10px] uppercase text-[#78716C]">Active Mahadasha Window</div>
                <div className="text-sm font-bold text-[#1C1917]">{snapshot.dasha.currentPeriodString}</div>
                <div className="text-[11px] text-[#78716C]">{snapshot.dasha.currentDateRange}</div>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold text-[#78716C] uppercase font-mono-data">All 9 Mahadasha Cycles:</div>
                <div className="space-y-1.5 font-mono-data text-xs max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {snapshot.dasha.mahadashas?.map((md: any, idx: number) => {
                    const sStr = md.startDate ? (md.startDate instanceof Date ? md.startDate.toISOString().slice(0, 10) : String(md.startDate).slice(0, 10)) : '';
                    const eStr = md.endDate ? (md.endDate instanceof Date ? md.endDate.toISOString().slice(0, 10) : String(md.endDate).slice(0, 10)) : '';
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-[#FDFBF7] border border-[#E5D7BC]/70 text-[11px]">
                        <span className="font-bold text-[#1C1917]">{md.planet} Mahadasha ({typeof md.durationYears === 'number' ? md.durationYears.toFixed(1) : md.durationYears}y)</span>
                        <span className="text-[#78716C]">{sStr} → {eStr}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ashtakavarga Card */}
            <div className="bg-white rounded-2xl p-6 border border-[#E5D7BC] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E6D2]">
                <h3 className="text-sm font-serif font-bold text-[#1C1917] flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-[#8E6F1D]" />
                  <span>Sarvashtakavarga (SAV) Matrix</span>
                </h3>
                <span className="text-[10px] font-mono-data text-[#8E6F1D] bg-[#8E6F1D]/10 px-2 py-0.5 rounded font-bold">
                  337 TOTAL BINDUS
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center font-mono-data text-xs">
                {snapshot.ashtakavarga?.sav?.map((bindus: number, rIdx: number) => {
                  const rashiNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
                  const isHigh = bindus >= 30;
                  return (
                    <div key={rIdx} className={`p-3 rounded-xl border ${isHigh ? 'bg-[#8E6F1D]/10 border-[#8E6F1D]/30 text-[#8E6F1D]' : 'bg-[#FAF6EF] border-[#E5D7BC] text-[#1C1917]'}`}>
                      <div className="text-[10px] text-[#78716C]">{rashiNames[rIdx]}</div>
                      <div className="text-base font-bold mt-1">{bindus}</div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </main>
      )}

      {/* 4. Quick Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#E5D7BC] p-6 max-w-md w-full shadow-2xl space-y-4 font-mono-data">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0E6D2]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-[#8E6F1D]" />
                <span>Edit Birth Coordinates</span>
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[#78716C] font-bold uppercase">Name</label>
                <input
                  type="text"
                  value={birthState.name}
                  onChange={(e) => setBirthState({ ...birthState, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E5D7BC] text-xs font-semibold focus:outline-none focus:border-[#8E6F1D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#78716C] font-bold uppercase">Birth Date</label>
                  <input
                    type="date"
                    value={birthState.birthDate}
                    onChange={(e) => setBirthState({ ...birthState, birthDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E5D7BC] text-xs font-semibold focus:outline-none focus:border-[#8E6F1D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#78716C] font-bold uppercase">Birth Time</label>
                  <input
                    type="time"
                    value={birthState.birthTime}
                    onChange={(e) => setBirthState({ ...birthState, birthTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E5D7BC] text-xs font-semibold focus:outline-none focus:border-[#8E6F1D]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#78716C] font-bold uppercase">Location / City Name</label>
                <input
                  type="text"
                  value={birthState.locationName}
                  onChange={(e) => setBirthState({ ...birthState, locationName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E5D7BC] text-xs font-semibold focus:outline-none focus:border-[#8E6F1D]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E5D7BC] hover:bg-[#FAF7F2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  chitiSensory.playTick();
                  try {
                    localStorage.setItem('cosmictantra_active_kundli', JSON.stringify(birthState));
                  } catch {}
                  setIsEditModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8E6F1D] text-white hover:bg-[#785E18] shadow-xs"
              >
                Recalculate Chart
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

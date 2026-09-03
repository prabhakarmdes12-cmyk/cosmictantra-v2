'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  Eye,
  Shield,
  Layers,
  Activity,
  Award,
  Grid,
  FileText,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Download,
  Share2,
  RefreshCw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { getKundliById, StoredKundliRecord, listAllKundlis } from '../../../lib/jyotish/kundliStore';
import NorthIndianChart from '../../../components/NorthIndianChart';
import KundliFirstInsight from '../../../components/kundli/KundliFirstInsight';

export default function KundliWorkspaceClient({ id }: { id: string }) {
  const [kundli, setKundli] = useState<StoredKundliRecord | null>(null);
  const [recordStatus, setRecordStatus] = useState<'loading' | 'found' | 'missing'>('loading');
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState<number>(1); // 1 = D1, 9 = D9, 10 = D10, etc.
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [allCharts, setAllCharts] = useState<StoredKundliRecord[]>([]);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const record = getKundliById(id);
    if (record) {
      setKundli(record);
      setRecordStatus('found');
    } else {
      setRecordStatus('missing');
    }
    setAllCharts(listAllKundlis());
    try {
      const savedLang = window.localStorage.getItem('cosmictantra_lang');
      if (savedLang) setLang(savedLang);
    } catch {}
  }, [id]);

  if (recordStatus !== 'found' || !kundli) {
    return (
      <>
        {/* Sprint C §31 — coherent FAILED state, never a half-rendered chart. */}
        <section className="min-h-[70vh] bg-[#FAF7F2] text-[#1C1917] flex items-center justify-center p-6">
          <div className="text-center max-w-md bg-white border border-[#E5D7BC] rounded-3xl p-8 shadow-sm">
            <Compass className="w-12 h-12 text-[#8E6F1D] mx-auto mb-4" />
            <h2 className="font-editorial text-xl font-bold">
              {recordStatus === 'loading' ? 'Loading your Kundli…' : 'This chart could not be opened'}
            </h2>
            <p className="mt-2 text-xs text-[#696256] leading-6">
              {recordStatus === 'loading'
                ? 'Reading the stored engine snapshot.'
                : 'No stored chart exists for this reference. Create a new Kundli with your birth details — nothing partial is shown.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href="/"
                className="inline-flex min-h-11 items-center px-5 py-2 rounded-xl bg-[#8E6F1D] text-white text-xs font-mono-data font-bold"
              >
                Create my Kundli →
              </a>
              <a
                href="/dashboard"
                className="inline-flex min-h-11 items-center px-5 py-2 rounded-xl border border-[#8E6F1D]/40 text-[#8E6F1D] text-xs font-mono-data font-bold"
              >
                My Kundli
              </a>
            </div>
          </div>
        </section>
      </>
    );
  }

  const { snapshot, birthContext, personName, timeConfidence, engineVersion, ayanamshaName } = kundli;
  const { lagna, planets, houses, birthPanchang, dasha, vargas, balas, yogasAndDoshas } = snapshot;

  const currentMD = dasha.currentMahadasha;
  const currentAD = dasha.currentAntardasha;
  const currentPD = dasha.currentPratyantardasha;

  // The Master Kundli report reads birth details from URL params before any
  // localStorage fallback. Carry the workspace's actual chart through so the
  // report preview and the PRINT / DOWNLOAD PDF actions operate on the profile
  // the user is currently viewing, never on the demo profile by accident.
  const reportHref = `/report?name=${encodeURIComponent(personName)}` +
    `&dob=${encodeURIComponent(birthContext.birthDate)}` +
    `&tob=${encodeURIComponent(birthContext.birthTime)}` +
    `&city=${encodeURIComponent(birthContext.locationName ?? '')}` +
    `&lat=${birthContext.latitude}` +
    `&lng=${birthContext.longitude}` +
    `&tz=${birthContext.timezone}`;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'birth', label: 'Birth Details', icon: Calendar },
    { id: 'charts', label: 'Charts & Vargas', icon: Layers },
    { id: 'planets', label: 'Planetary State', icon: Activity },
    { id: 'dasha', label: 'Vimshottari Dasha', icon: TrendingUp },
    { id: 'bala', label: 'Shadbala & Strengths', icon: Award },
    { id: 'yogas', label: 'Yogas & Doshas', icon: Sparkles },
    { id: 'panchang', label: 'Birth Panchang', icon: Compass },
    { id: 'report', label: 'Kundli Book', icon: FileText },
    { id: 'kashi', label: 'Ask Kashi', icon: MessageSquare }
  ];

  return (
    <div className="text-[#1C1917] font-sans selection:bg-[#d4af37]/30 selection:text-[#fff]">
      {/*
        SPRINT C §9/§15 — first viewport is the consumer FIRST INSIGHT
        (light, promise-first). All deeper deterministic content remains
        accessible below, unchanged.
      */}
      <KundliFirstInsight record={kundli} lang={lang} />

      {/* Deep Explorer/Scholar workspace — dark technical styling (§27) */}
      <div id="kundli-explore" className="bg-[#0a0c10] text-[#e6edf3] min-h-screen">
        <div className="bg-[#12161f] border-y border-[#21262d] px-6 py-3 text-center">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8b949e]">
            EXPLORE MY CHART — DETERMINISTIC SNAPSHOT · {ayanamshaName} · {engineVersion}
          </span>
        </div>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#12161f]/95 backdrop-blur-md border-b border-[#21262d] px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8a6b1e] to-[#d4af37] flex items-center justify-center shadow-lg shadow-[#d4af37]/10">
              <Compass className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-serif font-semibold text-[#f0e6d2] tracking-wide">{personName}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/40 font-mono">
                  {timeConfidence} TIME
                </span>
                {kundli.tags?.some((tag) => /benchmark|reference specimen|master reference/i.test(tag)) && (
                  <span
                    data-testid="preset-reference"
                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 font-mono font-bold uppercase tracking-wider"
                  >
                    Reference Specimen — not your chart
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8b949e] flex items-center space-x-2">
                <span>{birthContext.birthDate} • {birthContext.birthTime}</span>
                <span>•</span>
                <span>{birthContext.locationName}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Meta */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e]">
              <Shield className="w-3.5 h-3.5 text-[#2ea043]" />
              <span>{ayanamshaName}</span>
            </div>
            <a
              href={reportHref}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#d4af37] text-black font-semibold text-xs shadow-md shadow-[#d4af37]/20 hover:bg-[#e5c04b] transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Book</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <nav className="bg-[#12161f] border border-[#21262d] rounded-2xl p-2 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#1f242c] text-[#f0e6d2] border border-[#d4af37]/30 shadow-sm'
                      : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#d4af37]' : 'text-[#8b949e]'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />}
                </button>
              );
            })}
          </nav>

          {/* Quick Kundli Switcher */}
          <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3">Saved Kundlis</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {allCharts.map(c => (
                <a
                  key={c.id}
                  href={`/kundli/${c.id}`}
                  className={`block p-2 rounded-lg text-xs transition ${
                    c.id === id ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 font-medium' : 'text-[#c9d1d9] hover:bg-[#161b22]'
                  }`}
                >
                  <div className="font-serif">{c.personName}</div>
                  <div className="text-[10px] text-[#8b949e]">{c.birthContext.birthDate} • {c.birthContext.locationName.split(',')[0]}</div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Center Canvas */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: OVERVIEW (FIRST 60 SECONDS TRUST EXPERIENCE) */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Trust Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">Ascendant (Lagna)</div>
                  <div className="text-lg font-serif font-bold text-[#f0e6d2] mt-1">{lagna.rashiName}</div>
                  <div className="text-xs text-[#d4af37] font-mono">{lagna.degreeStr}</div>
                </div>

                <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">Moon Sign (Rashi)</div>
                  <div className="text-lg font-serif font-bold text-[#f0e6d2] mt-1">{(planets as any[]).find(p => p.name === 'Moon')?.rashiName}</div>
                  <div className="text-xs text-[#58a6ff] font-mono">{(planets as any[]).find(p => p.name === 'Moon')?.degreeStr}</div>
                </div>

                <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">Birth Nakshatra</div>
                  <div className="text-lg font-serif font-bold text-[#f0e6d2] mt-1">{birthPanchang.nakshatra.name}</div>
                  <div className="text-xs text-[#7ee787]">Pada {birthPanchang.nakshatra.pada || 1} • Lord {birthPanchang.nakshatra.lord || 'Moon'}</div>
                </div>

                <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-4">
                  <div className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">Active Dasha</div>
                  <div className="text-lg font-serif font-bold text-[#f0e6d2] mt-1">{currentMD} / {currentAD}</div>
                  <div className="text-xs text-[#bc8cff]">Pratyantar: {currentPD || 'Active'}</div>
                </div>
              </div>

              {/* D1 Natal Chart & Core Placements */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6 bg-[#12161f] border border-[#21262d] rounded-2xl p-4 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#f0e6d2] font-serif">D1 • Rashi Kundli</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-[#8b949e]">North Indian</span>
                  </div>
                  <div className="w-full max-w-sm aspect-square">
                    <NorthIndianChart kundali={snapshot} />
                  </div>
                </div>

                {/* Planets Quick List */}
                <div className="md:col-span-6 bg-[#12161f] border border-[#21262d] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#f0e6d2] font-serif">Planetary State Overview</span>
                    <span className="text-[10px] text-[#8b949e]">9 Classical Grahas</span>
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
                    {(planets as any[]).map((p: any) => (
                      <div
                        key={p.name}
                        onClick={() => setSelectedPlanet(p.name)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#161b22] border border-[#30363d]/60 hover:border-[#d4af37]/40 cursor-pointer transition text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="font-serif font-semibold text-[#f0e6d2] w-16">{p.name}</span>
                          <span className="text-[#8b949e]">{p.rashiName}</span>
                          {p.isRetrograde && (
                            <span className="px-1.5 py-0.2 rounded bg-[#f85149]/20 text-[#ff7b72] text-[10px]">R</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-[#8b949e]">
                          <span>{p.degreeStr}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#c9d1d9]">{p.dignity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Birthplace Coordinates & Engine Footprint — resolved via canonical resolver, no overclaim */}
              <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-[#8b949e]">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-[#2ea043]" />
                  <span>Birthplace Coordinates (canonical resolver): <strong className="text-[#c9d1d9]">{birthContext.latitude.toFixed(4)}° N, {birthContext.longitude.toFixed(4)}° E</strong> (UTC +{birthContext.timezone})</span>
                </div>
                <div className="font-mono text-[11px] text-[#8b949e]">
                  Engine: {engineVersion}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHARTS & VARGAS (D1 TO D60) */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-serif font-semibold text-[#f0e6d2]">Shodashavarga Divisional Charts</h2>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60].map(div => (
                    <button
                      key={div}
                      onClick={() => setChartType(div)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition ${
                        chartType === div
                          ? 'bg-[#d4af37] text-black font-bold'
                          : 'bg-[#161b22] text-[#8b949e] hover:text-[#c9d1d9] border border-[#30363d]'
                      }`}
                    >
                      D{div}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-7 bg-[#12161f] border border-[#21262d] rounded-2xl p-6 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-4">
                    <span className="text-sm font-serif font-semibold text-[#d4af37]">
                      D{chartType} • {vargas.shodashavarga?.[chartType]?.name || 'Divisional Chart'}
                    </span>
                    <span className="text-xs text-[#8b949e]">{vargas.shodashavarga?.[chartType]?.significance || 'Harmonic Analysis'}</span>
                  </div>
                  <div className="w-full max-w-md aspect-square">
                    <NorthIndianChart kundali={snapshot} />
                  </div>
                </div>

                <div className="md:col-span-5 bg-[#12161f] border border-[#21262d] rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-[#f0e6d2] font-serif mb-3">D{chartType} Placements</h3>
                  <div className="space-y-2 overflow-y-auto max-h-96">
                    {vargas.shodashavarga?.[chartType] ? (
                      Object.entries(vargas.shodashavarga[chartType].planets).map(([pName, pData]: [string, any]) => (
                        <div key={pName} className="flex items-center justify-between p-2.5 rounded-xl bg-[#161b22] border border-[#30363d]/50 text-xs">
                          <span className="font-serif font-semibold text-[#f0e6d2]">{pName}</span>
                          <span className="text-[#8b949e]">{pData.vargaRashiName} (Lord: {pData.vargaRashiLord})</span>
                          <span className="font-mono text-[#d4af37]">{pData.divisionDegree?.toFixed(2)}°</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#8b949e]">Select a varga chart above.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHADBALA & STRENGTHS */}
          {activeTab === 'bala' && (
            <div className="space-y-6">
              <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-5 overflow-x-auto">
                <h2 className="text-sm font-serif font-semibold text-[#f0e6d2] mb-4">6-Fold Shadbala Strength Matrix (Virupas & Rupas)</h2>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#21262d] text-[#8b949e]">
                      <th className="py-2.5 pr-4">Planet</th>
                      <th className="py-2.5 px-3">Sthana (Positional)</th>
                      <th className="py-2.5 px-3">Dig (Directional)</th>
                      <th className="py-2.5 px-3">Kala (Temporal)</th>
                      <th className="py-2.5 px-3">Cheshta (Motional)</th>
                      <th className="py-2.5 px-3">Naisargika (Natural)</th>
                      <th className="py-2.5 px-3">Drik (Aspect)</th>
                      <th className="py-2.5 px-3 font-semibold text-[#f0e6d2]">Total (Rupas)</th>
                      <th className="py-2.5 pl-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balas?.shadbala && Object.values(balas.shadbala).map((sb: any) => (
                      <tr key={sb.planet} className="border-b border-[#21262d]/50 hover:bg-[#161b22]/50 font-mono">
                        <td className="py-3 pr-4 font-serif font-semibold text-[#f0e6d2]">{sb.planet}</td>
                        <td className="py-3 px-3 text-[#c9d1d9]">{sb.sthana.totalVirupas.toFixed(1)}</td>
                        <td className="py-3 px-3 text-[#c9d1d9]">{sb.dig.totalVirupas.toFixed(1)}</td>
                        <td className="py-3 px-3 text-[#c9d1d9]">{sb.kala.totalVirupas.toFixed(1)}</td>
                        <td className="py-3 px-3 text-[#c9d1d9]">{sb.cheshta.totalVirupas.toFixed(1)}</td>
                        <td className="py-3 px-3 text-[#c9d1d9]">{sb.naisargika.totalVirupas.toFixed(1)}</td>
                        <td className="py-3 px-3 text-[#c9d1d9]">{sb.drik.totalVirupas.toFixed(1)}</td>
                        <td className="py-3 px-3 font-bold text-[#d4af37]">{sb.totalRupas.toFixed(2)}</td>
                        <td className="py-3 pl-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            sb.isAboveRequiredStrength ? 'bg-[#2ea043]/20 text-[#3fb950]' : 'bg-[#f85149]/20 text-[#ff7b72]'
                          }`}>
                            {sb.isAboveRequiredStrength ? 'STRONG' : 'DEFICIENT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bhava Bala Grid */}
              <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-5">
                <h3 className="text-sm font-serif font-semibold text-[#f0e6d2] mb-3">12 Bhavas (House Strengths)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {balas?.bhavaBala.map((h: any) => (
                    <div key={h.houseNumber} className="bg-[#161b22] border border-[#30363d]/60 rounded-xl p-3 text-center">
                      <div className="text-[10px] text-[#8b949e] uppercase tracking-wider">House {h.houseNumber}</div>
                      <div className="text-xs font-serif font-semibold text-[#f0e6d2] mt-0.5">{h.rashiName}</div>
                      <div className="text-sm font-bold text-[#d4af37] font-mono mt-1">{h.totalRupas.toFixed(2)} <span className="text-[10px] font-normal text-[#8b949e]">R</span></div>
                      <div className="text-[10px] text-[#8b949e] mt-0.5">Rank #{h.relativeRank}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DASHA EXPLORER */}
          {activeTab === 'dasha' && (
            <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-serif font-semibold text-[#f0e6d2]">3-Tier Vimshottari Dasha Sequence</h2>
              <p className="text-xs text-[#8b949e]">Starting Balance at Birth: <strong className="text-[#c9d1d9]">{dasha.startingBalance}</strong></p>
              
              <div className="space-y-3 mt-4">
                {dasha.mahadashas?.map((m: any) => (
                  <div key={m.lord} className={`p-4 rounded-xl border transition ${
                    m.isCurrent ? 'bg-[#161b22] border-[#d4af37]/50 shadow-md' : 'bg-[#161b22]/40 border-[#21262d]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-serif font-bold text-sm text-[#f0e6d2]">{m.lord} Mahadasha</span>
                        {m.isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-semibold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-[#8b949e]">{m.startDate} — {m.endDate}</span>
                    </div>

                    {m.isCurrent && m.antardashas && (
                      <div className="mt-3 pt-3 border-t border-[#21262d] grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {m.antardashas.map((a: any) => (
                          <div key={a.lord} className={`p-2 rounded-lg text-xs ${
                            a.isCurrent ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30' : 'bg-[#12161f] text-[#8b949e]'
                          }`}>
                            <div className="font-semibold">{m.lord}-{a.lord}</div>
                            <div className="text-[10px]">{a.endDate}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OTHER TABS FALLBACK */}
          {['birth', 'planets', 'yogas', 'panchang', 'report', 'kashi'].includes(activeTab) && (
            <div className="bg-[#12161f] border border-[#21262d] rounded-2xl p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#d4af37] mx-auto" />
              <h2 className="text-base font-serif font-semibold text-[#f0e6d2]">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-xs text-[#8b949e] max-w-md mx-auto">
                Comprehensive deterministic subsystem integrated into the Master Snapshot. Full interactive views active in Workbench 2.0.
              </p>
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  );
}

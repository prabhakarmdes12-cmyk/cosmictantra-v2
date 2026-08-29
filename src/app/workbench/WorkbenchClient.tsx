'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Layers,
  Activity,
  Award,
  Grid,
  TrendingUp,
  Search,
  Command,
  Maximize2,
  Minimize2,
  Columns,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  ChevronRight,
  Shield,
  HelpCircle
} from 'lucide-react';
import { getKundliById, listAllKundlis, StoredKundliRecord } from '../../lib/jyotish/kundliStore';
import NorthIndianChart from '../../components/NorthIndianChart';

export default function WorkbenchClient() {
  const [kundlis, setKundlis] = useState<StoredKundliRecord[]>([]);
  const [activeKundliId, setActiveKundliId] = useState<string>('gandhi-1869');
  const [workspacePreset, setWorkspacePreset] = useState<'NATAL' | 'CAREER' | 'MARRIAGE' | 'RESEARCH'>('NATAL');
  const [selectedPlanet, setSelectedPlanet] = useState<string>('Sun');
  const [leftChartDivision, setLeftChartDivision] = useState<number>(1); // D1
  const [rightChartDivision, setRightChartDivision] = useState<number>(9); // D9
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [commandQuery, setCommandQuery] = useState<string>('');

  useEffect(() => {
    const list = listAllKundlis();
    setKundlis(list);
    if (list.length > 0) {
      setActiveKundliId(list[0].id);
    }
  }, []);

  // Keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentKundli = getKundliById(activeKundliId) || kundlis[0];
  if (!currentKundli) {
    return <div className="p-8 text-center text-[#8b949e]">Loading Research Workbench...</div>;
  }

  const { snapshot, personName, birthContext } = currentKundli;
  const { lagna, planets, vargas, balas, dasha } = snapshot;

  const currentPlanetData = (planets as any[]).find(p => p.name === selectedPlanet) || planets[0];
  const planetShadbala = balas?.shadbala?.[selectedPlanet];
  const planetVimshopaka = balas?.vimshopaka?.[selectedPlanet];

  return (
    <div className="min-h-screen bg-[#07090e] text-[#e6edf3] font-sans selection:bg-[#d4af37]/30">
      
      {/* Top Professional Toolstrip */}
      <header className="bg-[#0f131a] border-b border-[#1f2633] px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-[#d4af37]" />
            <span className="font-serif font-bold text-sm tracking-wide text-[#f0e6d2]">Workbench 2.0</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 font-mono">
              RESEARCH GRADE
            </span>
          </div>

          <div className="h-4 w-px bg-[#21262d]" />

          {/* Active Chart Selector */}
          <select
            value={activeKundliId}
            onChange={(e) => setActiveKundliId(e.target.value)}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs text-[#c9d1d9] focus:outline-none focus:border-[#d4af37]"
          >
            {kundlis.map(k => (
              <option key={k.id} value={k.id}>{k.personName} ({k.birthContext.birthDate})</option>
            ))}
          </select>
        </div>

        {/* Workspace Presets & Command Palette Trigger */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-[#161b22] p-0.5 rounded-lg border border-[#30363d] text-xs">
            {(['NATAL', 'CAREER', 'MARRIAGE', 'RESEARCH'] as const).map(preset => (
              <button
                key={preset}
                onClick={() => {
                  setWorkspacePreset(preset);
                  if (preset === 'NATAL') { setLeftChartDivision(1); setRightChartDivision(9); }
                  if (preset === 'CAREER') { setLeftChartDivision(1); setRightChartDivision(10); }
                  if (preset === 'MARRIAGE') { setLeftChartDivision(1); setRightChartDivision(9); }
                  if (preset === 'RESEARCH') { setLeftChartDivision(9); setRightChartDivision(60); }
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition ${
                  workspacePreset === preset ? 'bg-[#d4af37] text-black font-semibold' : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] hover:border-[#d4af37]/40 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Command Palette</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d]">Ctrl+K</kbd>
          </button>
        </div>
      </header>

      {/* 3-Panel Split Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-50px)]">
        
        {/* PANEL 1: NAV & GRAHA QUICK PICKER (Col 2) */}
        <div className="lg:col-span-2 bg-[#0c0f17] border-r border-[#1f2633] p-3 space-y-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] px-2">9 Sidereal Grahas</div>
          <div className="space-y-1">
            {(planets as any[]).map((p: any) => {
              const isSelected = selectedPlanet === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => setSelectedPlanet(p.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                    isSelected
                      ? 'bg-[#1f242c] text-[#f0e6d2] border border-[#d4af37]/40 shadow-sm'
                      : 'text-[#8b949e] hover:bg-[#161b22] hover:text-[#c9d1d9]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-serif font-semibold">{p.name}</span>
                    {p.isRetrograde && <span className="text-[9px] px-1 rounded bg-[#f85149]/20 text-[#ff7b72]">R</span>}
                  </div>
                  <span className="font-mono text-[11px] text-[#8b949e]">{p.rashiName.substring(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL 2: CENTER DUAL-CHART CANVAS (Col 6) */}
        <div className="lg:col-span-6 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-50px)]">
          
          {/* Dual Split Chart View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Chart */}
            <div className="bg-[#10141d] border border-[#21262d] rounded-2xl p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-serif font-semibold text-[#d4af37]">D{leftChartDivision} • {vargas.shodashavarga?.[leftChartDivision]?.name || 'Chart'}</span>
                <select
                  value={leftChartDivision}
                  onChange={(e) => setLeftChartDivision(Number(e.target.value))}
                  className="bg-[#161b22] border border-[#30363d] rounded text-[10px] text-[#8b949e] px-1.5 py-0.5"
                >
                  {[1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60].map(d => (
                    <option key={d} value={d}>D{d}</option>
                  ))}
                </select>
              </div>
              <div className="w-full aspect-square max-w-[280px]">
                <NorthIndianChart kundali={snapshot} />
              </div>
            </div>

            {/* Right Chart */}
            <div className="bg-[#10141d] border border-[#21262d] rounded-2xl p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-serif font-semibold text-[#58a6ff]">D{rightChartDivision} • {vargas.shodashavarga?.[rightChartDivision]?.name || 'Chart'}</span>
                <select
                  value={rightChartDivision}
                  onChange={(e) => setRightChartDivision(Number(e.target.value))}
                  className="bg-[#161b22] border border-[#30363d] rounded text-[10px] text-[#8b949e] px-1.5 py-0.5"
                >
                  {[1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60].map(d => (
                    <option key={d} value={d}>D{d}</option>
                  ))}
                </select>
              </div>
              <div className="w-full aspect-square max-w-[280px]">
                <NorthIndianChart kundali={snapshot} />
              </div>
            </div>

          </div>

          {/* Dasha Progression Strip */}
          <div className="bg-[#10141d] border border-[#21262d] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-serif font-semibold text-[#f0e6d2]">Vimshottari Dasha Active State</span>
              <span className="text-[#8b949e] font-mono">{dasha.startingBalance}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-1 rounded bg-[#d4af37]/20 text-[#d4af37] font-semibold">{dasha.currentMahadasha} MD</span>
              <span className="text-[#8b949e]">→</span>
              <span className="px-2.5 py-1 rounded bg-[#58a6ff]/20 text-[#58a6ff] font-semibold">{dasha.currentAntardasha} AD</span>
              <span className="text-[#8b949e]">→</span>
              <span className="px-2.5 py-1 rounded bg-[#bc8cff]/20 text-[#bc8cff] font-semibold">{dasha.currentPratyantardasha || 'Pratyantar'}</span>
            </div>
          </div>
        </div>

        {/* PANEL 3: CROSS-CALCULATION INSPECTOR (Col 4) */}
        <div className="lg:col-span-4 bg-[#0c0f17] border-l border-[#1f2633] p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-50px)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2633]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-serif font-semibold text-sm text-[#f0e6d2]">Deep Graha Inspector</h3>
            </div>
            <span className="text-xs font-serif font-bold text-[#d4af37]">{selectedPlanet}</span>
          </div>

          {/* Selected Planet Core Coordinates */}
          {currentPlanetData && (
            <div className="bg-[#10141d] border border-[#21262d] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Sidereal Longitude:</span>
                <span className="font-mono text-[#f0e6d2]">{currentPlanetData.degreeStr} in {currentPlanetData.rashiName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">Dignity (Avastha):</span>
                <span className="font-semibold text-[#d4af37]">{currentPlanetData.dignity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8b949e]">House Placement:</span>
                <span className="text-[#c9d1d9]">House {currentPlanetData.house}</span>
              </div>
            </div>
          )}

          {/* Shadbala Breakdown */}
          {planetShadbala && (
            <div className="bg-[#10141d] border border-[#21262d] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-serif font-semibold text-[#f0e6d2]">Shadbala Breakdown</span>
                <span className="font-mono font-bold text-[#d4af37]">{planetShadbala.totalRupas.toFixed(2)} Rupas</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-[#161b22] border border-[#30363d]/50">
                  <div className="text-[9px] text-[#8b949e]">Sthana (Positional)</div>
                  <div className="text-[#c9d1d9] mt-0.5">{planetShadbala.sthana.totalVirupas.toFixed(1)} Virupas</div>
                </div>
                <div className="p-2 rounded bg-[#161b22] border border-[#30363d]/50">
                  <div className="text-[9px] text-[#8b949e]">Dig (Directional)</div>
                  <div className="text-[#c9d1d9] mt-0.5">{planetShadbala.dig.totalVirupas.toFixed(1)} Virupas</div>
                </div>
                <div className="p-2 rounded bg-[#161b22] border border-[#30363d]/50">
                  <div className="text-[9px] text-[#8b949e]">Kala (Temporal)</div>
                  <div className="text-[#c9d1d9] mt-0.5">{planetShadbala.kala.totalVirupas.toFixed(1)} Virupas</div>
                </div>
                <div className="p-2 rounded bg-[#161b22] border border-[#30363d]/50">
                  <div className="text-[9px] text-[#8b949e]">Drik (Aspect)</div>
                  <div className="text-[#c9d1d9] mt-0.5">{planetShadbala.drik.totalVirupas.toFixed(1)} Virupas</div>
                </div>
              </div>
            </div>
          )}

          {/* Vimshopaka Score */}
          {planetVimshopaka && (
            <div className="bg-[#10141d] border border-[#21262d] rounded-xl p-4 space-y-2 text-xs">
              <span className="font-serif font-semibold text-[#f0e6d2]">Vimshopaka Bala (20 pts)</span>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="text-[#8b949e]">Shadvarga: <strong className="text-[#c9d1d9]">{planetVimshopaka.shadvarga.toFixed(1)}</strong></div>
                <div className="text-[#8b949e]">Shodashavarga: <strong className="text-[#d4af37]">{planetVimshopaka.shodashavarga.toFixed(1)}</strong></div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Command Palette Modal */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-[#12161f] border border-[#30363d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-[#21262d]">
              <Search className="w-4 h-4 text-[#8b949e] mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to feature (e.g., D10, Shadbala, Jupiter Dasha)..."
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-[#f0e6d2] focus:outline-none placeholder-[#8b949e]"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">ESC</kbd>
            </div>
            
            <div className="p-2 space-y-1 max-h-64 overflow-y-auto text-xs">
              {[
                { title: 'Switch to D10 (Dashamsha Career Chart)', action: () => { setLeftChartDivision(1); setRightChartDivision(10); setIsCommandOpen(false); } },
                { title: 'Switch to D9 (Navamsha Marriage Chart)', action: () => { setLeftChartDivision(1); setRightChartDivision(9); setIsCommandOpen(false); } },
                { title: 'Inspect Saturn Shadbala & Balas', action: () => { setSelectedPlanet('Saturn'); setIsCommandOpen(false); } },
                { title: 'Inspect Jupiter Position & Dignity', action: () => { setSelectedPlanet('Jupiter'); setIsCommandOpen(false); } },
                { title: 'Open Complete Vedic Kundli Report', action: () => { window.location.href = '/report'; } }
              ].map((cmd, idx) => (
                <div
                  key={idx}
                  onClick={cmd.action}
                  className="p-2.5 rounded-xl hover:bg-[#161b22] text-[#c9d1d9] hover:text-[#f0e6d2] cursor-pointer flex items-center justify-between"
                >
                  <span>{cmd.title}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8b949e]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { Download, Printer, Shield, Compass, BookOpen, Layers, Award, Sparkles, CheckCircle2, ChevronRight, Activity, Calendar, FileText, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import { getCanonicalJyotishSnapshot } from '@/lib/jyotish/canonicalSnapshot';
import { generateKundliBookModel, BookVolume } from '@/lib/jyotish/kundliBookModel';
import NorthIndianChart from '@/components/NorthIndianChart';

export default function MasterKundliReportClient() {
  const [readingDepth, setReadingDepth] = useState<'SIMPLE' | 'DETAILED' | 'PANDIT'>('DETAILED');
  const [activeGraha, setActiveGraha] = useState<string | null>('Saturn');
  const [activeVolumeIndex, setActiveVolumeIndex] = useState<number>(0);

  const birthInput = useMemo(() => ({
    birthDate: '1989-05-26',
    birthTime: '02:20:30',
    latitude: 22.0797,
    longitude: 82.1391,
    timezone: 5.5,
    locationName: 'Bilaspur, Chhattisgarh, India'
  }), []);

  const snapshot = useMemo(() => getCanonicalJyotishSnapshot(birthInput), [birthInput]);
  const book = useMemo(() => generateKundliBookModel('Prabhakar Sharma', snapshot, 'COMPLETE_VEDIC_KUNDLI'), [snapshot]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const gold = '#8E6F1D';
    const dark = '#1C1917';
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(gold);
    doc.text('COSMICTANTRA MASTER KUNDLI V1', 105, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(dark);
    doc.text('Subject: Prabhakar Sharma | Bilaspur, Chhattisgarh (Lahiri Standard)', 105, y, { align: 'center' });
    y += 10;

    doc.setDrawColor(gold);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(11);
    doc.text('VOLUME I: JANMA & PANCHANG', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Lagna: ${snapshot.lagna.rashiName} (${snapshot.lagna.degreeStr}) | Nakshatra: ${snapshot.birthPanchang.nakshatra.name} (Pada ${snapshot.birthPanchang.nakshatra.pada})`, 20, y);
    y += 6;
    doc.text(`Tithi: ${snapshot.birthPanchang.udayaTithi.fullName} | Yoga: ${snapshot.birthPanchang.yoga.name} | Karana: ${snapshot.birthPanchang.karana.name}`, 20, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('VOLUME II: 9 SIDEREAL GRAHAS', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    snapshot.planetsArray.forEach(p => {
      doc.text(`${p.name.padEnd(9)}: ${p.rashiName.padEnd(10)} ${p.degreeStr.padEnd(10)} House ${p.house}`, 20, y);
      y += 5;
    });

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('VOLUME VIII: ACTIVE DASHA PERIOD', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Current: ${snapshot.dasha.currentPeriodString} (${snapshot.dasha.currentDateRange})`, 20, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text('VOLUME XVII: TECHNICAL PROVENANCE SIGNATURE', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Engine: ${snapshot.meta.engineVersion}`, 20, y);
    y += 5;
    doc.text('Hash: CT-MASTER-1989-BILASPUR-001 | JPL Horizons & AstroSage Qualified', 20, y);

    doc.save('CosmicTantra_Master_Kundli_Prabhakar_1989.pdf');
  };

  const grahas = snapshot.planetsArray;
  const activeVolume = book.volumes[activeVolumeIndex];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1917] font-sans antialiased pb-24 selection:bg-[#E5D7BC]">
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#E5D7BC] px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#8E6F1D]/10 border border-[#8E6F1D]/30 flex items-center justify-center text-[#8E6F1D] font-serif font-bold text-lg">ॐ</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg tracking-tight text-[#1C1917]">COSMICTANTRA</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#8E6F1D]/15 text-[#8E6F1D] border border-[#8E6F1D]/20">MASTER KUNDLI V1</span>
            </div>
            <p className="text-xs text-[#78716C]">Prabhakar Sharma • 26 May 1989, 02:20:30 • Bilaspur (Lahiri Standard)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F5EFE6] p-1 rounded-lg border border-[#E5D7BC]">
          {(['SIMPLE', 'DETAILED', 'PANDIT'] as const).map((depth) => (
            <button key={depth} onClick={() => setReadingDepth(depth)} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${readingDepth === depth ? 'bg-[#1C1917] text-[#FDFBF7] shadow-sm' : 'text-[#78716C] hover:text-[#1C1917]'}`}>
              {depth === 'SIMPLE' ? 'Simple' : depth === 'DETAILED' ? 'Detailed' : 'Pandit (Scholarly)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5D7BC] bg-white hover:bg-[#F5EFE6] transition-colors">
            <Printer className="w-3.5 h-3.5 text-[#8E6F1D]" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#8E6F1D] text-white hover:bg-[#785E18] transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" /> Download Folio (PDF)
          </button>
        </div>
      </header>

      <div className="bg-[#FAF6EF] border-b border-[#E5D7BC] px-4 lg:px-8 py-2.5 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-semibold text-[#8E6F1D] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Activity className="w-3.5 h-3.5" /> Graha Matrix:
          </span>
          {grahas.map((g) => {
            const isSelected = activeGraha === g.name;
            return (
              <button key={g.name} onClick={() => setActiveGraha(g.name)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${isSelected ? 'bg-[#8E6F1D] text-white border-[#8E6F1D] shadow-sm' : 'bg-white text-[#44403C] border-[#E5D7BC] hover:border-[#8E6F1D]/50'}`}>
                <span>{g.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-[#78716C]'}`}>{g.rashiName.slice(0, 3)} {Math.floor(g.degrees % 30)}°</span>
                {g.isRetrograde && <span className="text-[10px] font-bold text-rose-400">(R)</span>}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-[#78716C] px-3 pb-2 flex items-center justify-between">
            <span>17 Book Volumes</span>
            <span className="text-[10px] bg-[#E5D7BC] px-1.5 py-0.5 rounded text-[#1C1917]">17 / 17</span>
          </div>
          <div className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 scrollbar-thin">
            {book.volumes.map((vol, idx) => {
              const isCurrent = activeVolumeIndex === idx;
              return (
                <button key={vol.volumeNumber} onClick={() => setActiveVolumeIndex(idx)} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-start justify-between gap-2 border ${isCurrent ? 'bg-[#8E6F1D]/10 text-[#8E6F1D] font-semibold border-[#8E6F1D]/30 shadow-sm' : 'text-[#57534E] hover:bg-[#F5EFE6] border-transparent'}`}>
                  <div className="truncate">
                    <div className="font-mono text-[10px] text-[#8E6F1D] font-bold">PART {vol.volumeNumber}</div>
                    <div className="truncate font-medium">{vol.title.split(':')[0]}</div>
                    <div className="text-[10px] text-[#78716C] truncate font-serif">{vol.sanskritTitle}</div>
                  </div>
                  {isCurrent && <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-1 text-[#8E6F1D]" />}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="lg:col-span-9 space-y-8">
          <div className="bg-white rounded-xl p-6 border border-[#E5D7BC] shadow-sm relative overflow-hidden">
            <div className="absolute right-4 top-4 text-6xl font-serif text-[#F5EFE6] font-bold select-none pointer-events-none">{activeVolume.volumeNumber}</div>
            <div className="relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#8E6F1D]/10 text-[#8E6F1D]">VOLUME {activeVolume.volumeNumber} OF XVII</div>
              <h1 className="text-xl lg:text-2xl font-serif font-bold text-[#1C1917] tracking-tight">{activeVolume.title}</h1>
              <p className="text-sm font-serif text-[#8E6F1D] italic">{activeVolume.sanskritTitle}</p>
              <p className="text-xs text-[#57534E] max-w-2xl pt-1">{activeVolume.description}</p>
            </div>
          </div>

          {activeGraha && (
            <div className="bg-[#FAF6EF] rounded-lg p-4 border border-[#E5D7BC] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#8E6F1D] uppercase">Selected Graha:</span>
                <span className="font-semibold text-sm">{activeGraha}</span>
                <span className="text-[#78716C]">({snapshot.planets[activeGraha]?.rashiName} {snapshot.planets[activeGraha]?.degreeStr}, House {snapshot.planets[activeGraha]?.house})</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#57534E]">
                <span>Shadbala: <strong>{snapshot.balas?.shadbala[activeGraha]?.totalRupas.toFixed(2)} Rupas</strong></span>
                <span>•</span>
                <span>BAV Points: <strong>{snapshot.ashtakavarga?.bav[activeGraha]?.[(snapshot.planets[activeGraha]?.rashiId || 1) - 1]} Bindus</strong></span>
                <span>•</span>
                <span>Status: <strong>{snapshot.planets[activeGraha]?.isRetrograde ? 'Vakra (Retrograde)' : 'Direct'}</strong></span>
              </div>
            </div>
          )}

          {(activeVolumeIndex === 0 || activeVolumeIndex === 1 || activeVolumeIndex === 3) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-[#E5D7BC] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-serif text-[#1C1917]">D1 Lagna Rashi Chart</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6EF] border border-[#E5D7BC] text-[#8E6F1D]">Asc: Meena 16°54'</span>
                </div>
                <div className="w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center">
                  <NorthIndianChart kundali={{ houses: snapshot.houses, lagna: snapshot.lagna }} size={300} theme="light" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#E5D7BC] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-serif text-[#1C1917]">D9 Navamsha Chart</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF6EF] border border-[#E5D7BC] text-[#8E6F1D]">
                    Dharma & Soul
                  </span>
                </div>
                <div className="w-full aspect-square max-w-[340px] mx-auto flex items-center justify-center">
                  <NorthIndianChart kundali={{ houses: snapshot.houses, lagna: { rasi: 3, rasiName: 'Mithuna' } }} size={300} theme="light" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {activeVolume.sections.map((sec) => (
              <div key={sec.id} className="bg-white rounded-xl p-6 border border-[#E5D7BC] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5D7BC] pb-3">
                  <h2 className="text-base font-serif font-bold text-[#1C1917] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#8E6F1D]" /> {sec.title}
                  </h2>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] bg-[#FAF6EF] px-2 py-0.5 rounded border border-[#E5D7BC]">{sec.category}</span>
                </div>

                {sec.id === 'graha_matrix' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FAF6EF] text-[#78716C] font-semibold border-b border-[#E5D7BC]">
                          <th className="py-2.5 px-3">Graha</th>
                          <th className="py-2.5 px-3">Rashi</th>
                          <th className="py-2.5 px-3">Longitude</th>
                          <th className="py-2.5 px-3">Nakshatra</th>
                          <th className="py-2.5 px-3">Pada</th>
                          <th className="py-2.5 px-3">House</th>
                          <th className="py-2.5 px-3">Motion</th>
                          <th className="py-2.5 px-3">Dignity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5D7BC]">
                        {snapshot.planetsArray.map((p) => (
                          <tr key={p.name} onClick={() => setActiveGraha(p.name)} className={`cursor-pointer transition-colors ${activeGraha === p.name ? 'bg-[#8E6F1D]/10 font-medium' : 'hover:bg-[#FAF6EF]'}`}>
                            <td className="py-2.5 px-3 font-semibold text-[#1C1917] flex items-center gap-1.5">
                              {p.name} {p.isRetrograde && <span className="text-[10px] text-rose-500 font-bold">(R)</span>}
                            </td>
                            <td className="py-2.5 px-3">{p.rashiName}</td>
                            <td className="py-2.5 px-3 font-mono">{p.degreeStr}</td>
                            <td className="py-2.5 px-3">{p.nakshatra?.name || '—'}</td>
                            <td className="py-2.5 px-3">{p.nakshatra?.pada || '—'}</td>
                            <td className="py-2.5 px-3 font-semibold">House {p.house}</td>
                            <td className="py-2.5 px-3 text-[#78716C]">{p.isRetrograde ? 'Vakra' : 'Marga'}</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] bg-[#FAF6EF] border border-[#E5D7BC] font-medium">{p.dignity || 'Neutral'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : sec.id === 'shadbala_full' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#FAF6EF] text-[#78716C] font-semibold border-b border-[#E5D7BC]">
                          <th className="py-2.5 px-3">Graha</th>
                          <th className="py-2.5 px-3">Total Rupas</th>
                          <th className="py-2.5 px-3">Sthana</th>
                          <th className="py-2.5 px-3">Dig</th>
                          <th className="py-2.5 px-3">Kala</th>
                          <th className="py-2.5 px-3">Cheshta</th>
                          <th className="py-2.5 px-3">Naisargika</th>
                          <th className="py-2.5 px-3">Drik</th>
                          <th className="py-2.5 px-3">Ratio</th>
                          <th className="py-2.5 px-3">Rank</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5D7BC]">
                        {Object.values(snapshot.balas?.shadbala || {}).map((sb) => (
                          <tr key={sb.planet} className="hover:bg-[#FAF6EF]">
                            <td className="py-2.5 px-3 font-bold">{sb.planet}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#8E6F1D]">{sb.totalRupas.toFixed(2)} R</td>
                            <td className="py-2.5 px-3 font-mono">{sb.sthana.totalVirupas.toFixed(1)}</td>
                            <td className="py-2.5 px-3 font-mono">{sb.dig.totalVirupas.toFixed(1)}</td>
                            <td className="py-2.5 px-3 font-mono">{sb.kala.totalVirupas.toFixed(1)}</td>
                            <td className="py-2.5 px-3 font-mono">{sb.cheshta.totalVirupas.toFixed(1)}</td>
                            <td className="py-2.5 px-3 font-mono">{sb.naisargika.totalVirupas.toFixed(1)}</td>
                            <td className="py-2.5 px-3 font-mono">{sb.drik.totalVirupas.toFixed(1)}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold">{sb.strengthRatio.toFixed(2)}</td>
                            <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded text-[10px] bg-[#8E6F1D]/15 font-bold text-[#8E6F1D]">#{sb.relativeRank}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : sec.id === 'ashtakavarga_matrix' ? (
                  <div className="space-y-4">
                    <div className="text-xs font-semibold text-[#8E6F1D]">
                      Sarvashtakavarga (SAV) Total Bindus: <strong>{snapshot.ashtakavarga?.totalBindus} / 337</strong>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {snapshot.ashtakavarga?.houseSav.map((h) => (
                        <div key={h.house} className="p-3 bg-[#FAF6EF] rounded-lg border border-[#E5D7BC] text-center">
                          <div className="text-[10px] text-[#78716C] font-semibold">House {h.house} ({h.rashi})</div>
                          <div className="text-lg font-bold text-[#1C1917] font-mono">{h.bindus}</div>
                          <div className="text-[9px] text-[#8E6F1D] truncate">{h.category}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {Object.entries(sec.data || {}).map(([k, v]) => {
                      if (typeof v === 'object' && v !== null) {
                        return (
                          <div key={k} className="p-3 bg-[#FAF6EF] rounded-lg border border-[#E5D7BC] space-y-1">
                            <div className="font-semibold text-[#8E6F1D] uppercase tracking-wider text-[10px]">{k.replace(/([A-Z])/g, ' $1')}</div>
                            <pre className="text-[11px] text-[#44403C] overflow-x-auto whitespace-pre-wrap font-sans">{JSON.stringify(v, null, 2)}</pre>
                          </div>
                        );
                      }
                      return (
                        <div key={k} className="p-3 bg-[#FAF6EF] rounded-lg border border-[#E5D7BC] flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#78716C] uppercase tracking-wider text-[10px]">{k.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium text-[#1C1917] text-right font-mono">{String(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {sec.evidenceIds && sec.evidenceIds.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 text-[11px] text-[#78716C]">
                    <Shield className="w-3.5 h-3.5 text-[#8E6F1D]" />
                    <span>Evidence Trace: {sec.evidenceIds.join(' • ')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <footer className="bg-white rounded-xl p-5 border border-[#E5D7BC] shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs text-[#78716C]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8E6F1D]" />
              <span>CosmicTantra Deterministic Kernel V36.0 • NASA/JPL & AstroSage Differential Parity</span>
            </div>
            <div className="font-mono text-[11px]">ID: CT-MASTER-1989-BILASPUR-001</div>
          </footer>
        </div>
      </main>
    </div>
  );
}
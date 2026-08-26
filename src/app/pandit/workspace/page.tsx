'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  X,
  Phone,
  Video,
  MessageSquare,
  ShoppingBag,
  Plus,
  ExternalLink,
  Award
} from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';

interface Consultation {
  id: string;
  seekerName: string;
  question: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED';
  receivedAt: string;
  cosmicId: string;
  lagna: string;
  nakshatra: string;
  dasha: string;
  consultationMode: 'WRITTEN' | 'VOICE' | 'VIDEO' | 'PARIVAAR';
  amount: number;
  initialSynthesis: string;
  prescribedUpayas?: string[];
}

const initialConsultations: Consultation[] = [
  {
    id: 'CT-2026-0825-001',
    seekerName: 'Priya Sharma',
    question: 'Will changing my business direction in the next six months be favourable for my long-term financial growth?',
    status: 'PENDING',
    receivedAt: '25 Aug 2026, 09:14',
    cosmicId: 'CT-4821',
    lagna: 'Vrishabha (Taurus)',
    nakshatra: 'Rohini (Pada 2)',
    dasha: 'Moon Mahadasha • Jupiter Antardasha',
    consultationMode: 'VOICE',
    amount: 1100,
    initialSynthesis: 'Your current Moon Mahadasha supports creative ventures. The upcoming Jupiter Antardasha (starting November 2026) brings strong expansion in 10th and 11th houses. Auspicious window for strategic pivots with caution in Q4.',
    prescribedUpayas: ['Bhimseni Camphor Pure Arati', 'Pure A2 Cow Ghee Havan']
  },
  {
    id: 'CT-2026-0824-007',
    seekerName: 'Rahul Verma',
    question: 'When is a good time to initiate wedding talks in the next 8 months?',
    status: 'IN_REVIEW',
    receivedAt: '24 Aug 2026, 14:32',
    cosmicId: 'CT-3912',
    lagna: 'Karka (Cancer)',
    nakshatra: 'Pushya (Pada 1)',
    dasha: 'Jupiter Mahadasha • Venus Antardasha',
    consultationMode: 'WRITTEN',
    amount: 501,
    initialSynthesis: 'Venus transit in the 7th house during Margashirsha (Dec 2026) presents the most favorable Muhurat window for marital alliance agreements and engagement.',
    prescribedUpayas: ['Copper Shri Yantra Consecration']
  },
];

export default function PanditWorkspace() {
  const [consultations, setConsultations] = useState<Consultation[]>(initialConsultations);
  const [selectedCase, setSelectedCase] = useState<Consultation | null>(initialConsultations[0]);
  const [folioText, setFolioText] = useState(initialConsultations[0]?.initialSynthesis || '');
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [prescribedItems, setPrescribedItems] = useState<string[]>(initialConsultations[0]?.prescribedUpayas || []);

  const updateStatus = (id: string, newStatus: Consultation['status']) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  const handleSelectCase = (c: Consultation) => {
    chitiSensory.playTick();
    setSelectedCase(c);
    setFolioText(c.initialSynthesis);
    setPrescribedItems(c.prescribedUpayas || []);
    setApprovedSuccess(false);
  };

  const handleApprove = (id: string) => {
    chitiSensory.playBell();
    updateStatus(id, 'APPROVED');
    setApprovedSuccess(true);
  };

  const handleAddUpaya = (item: string) => {
    chitiSensory.playTick();
    if (!prescribedItems.includes(item)) {
      setPrescribedItems(prev => [...prev, item]);
    }
  };

  return (
    <CosmicTantraShell shellMode="scholar" footerMode="none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 font-mono-data">
        
        {/* Workspace Sub-Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="text-xs uppercase tracking-[3px] text-[#8E6F1D] dark:text-[#F0C968] font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>काशी विद्वत्-परिषद् • SCHOLAR BENCH</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-1 tracking-tight">
              Pandit Verification & Live Consultation Workbench
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pandit/onboard"
              className="px-3.5 py-2 rounded-2xl bg-white/70 dark:bg-white/5 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968] hover:border-[#8E6F1D] transition-colors"
            >
              + विद्वान् प्रोफाइल सेटिंग्स
            </Link>

            <div className="flex items-center gap-2 bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 px-3.5 py-2 rounded-2xl text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold text-[#1C1917] dark:text-white">Pt. Vidyanand Shastri</span>
                <span className="text-[#696256] dark:text-[#9E988D] ml-1.5">• Verified Scholar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="p-4 rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D]">
            <div className="text-xs font-bold text-[#8E6F1D] dark:text-[#F0C968]">PENDING CASES</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-1">2</div>
          </div>
          <div className="p-4 rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D]">
            <div className="text-xs font-bold text-[#A6461D] dark:text-[#E2825B]">IN REVIEW</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-1">1</div>
          </div>
          <div className="p-4 rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D]">
            <div className="text-xs font-bold text-[#065F46] dark:text-[#10B981]">DELIVERED TODAY</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#1C1917] dark:text-white mt-1">4</div>
          </div>
          <div className="p-4 rounded-2xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 bg-white dark:bg-[#0E101D]">
            <div className="text-xs font-bold text-[#696256] dark:text-[#9E988D]">EARNINGS (80% SPLIT)</div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹12,480</div>
          </div>
        </div>

        {/* 2-Column Split Workbench */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left Column: Cases Queue */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white">
                Assigned Consultations
              </h2>
              <span className="text-xs text-[#696256] dark:text-[#9E988D]">
                {consultations.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {consultations.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#8E6F1D] dark:border-[#D4AF37] bg-[#FAF7F2] dark:bg-[#151828] shadow-md'
                        : 'border-black/10 dark:border-white/10 bg-white dark:bg-[#0E101D] hover:border-[#8E6F1D]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#1C1917] dark:text-white text-sm">
                        {c.seekerName}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.consultationMode === 'VOICE'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : c.consultationMode === 'VIDEO'
                            ? 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300'
                            : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        }`}>
                          {c.consultationMode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'PENDING'
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                            : c.status === 'APPROVED'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-[#696256] dark:text-[#9E988D] mt-1">
                      {c.cosmicId} • {c.receivedAt} • <strong className="text-[#8E6F1D] dark:text-[#F0C968]">₹{c.amount}</strong>
                    </div>

                    <p className="mt-2.5 text-xs text-[#44403C] dark:text-[#D1C9BF] line-clamp-2 leading-relaxed">
                      "{c.question}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Case Review & Pre-Context Workbench */}
          <div className="lg:col-span-7">
            {selectedCase ? (
              <div className="bg-white dark:bg-[#0E101D] border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
                
                {/* Dossier Header */}
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                  <div>
                    <div className="text-xs text-[#8E6F1D] dark:text-[#F0C968] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI PRE-CONTEXT DOSSIER • {selectedCase.id}</span>
                    </div>
                    <div className="text-xl font-editorial font-bold text-[#1C1917] dark:text-white mt-0.5">
                      {selectedCase.seekerName}
                    </div>
                  </div>

                  <div className="text-right text-xs text-[#696256] dark:text-[#9E988D]">
                    <div>{selectedCase.cosmicId}</div>
                    <div className="font-bold text-[#8E6F1D] dark:text-[#F0C968]">दक्षिणा: ₹{selectedCase.amount}</div>
                  </div>
                </div>

                {/* 1-CLICK CALLME4 ENCRYPTED ACTIONS BAR */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#8E6F1D]/10 to-indigo-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>CallMe4 100% गोपनीय कॉलिंग सक्रिय (Number Masked)</span>
                    </span>
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">
                      जातक को आपका फोन नंबर कभी प्रदर्शित नहीं होगा।
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/consultation/room/${selectedCase.id}?mode=voice&role=pandit`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Start Voice Call</span>
                    </Link>

                    <Link
                      href={`/consultation/room/${selectedCase.id}?mode=video&role=pandit`}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Video Darshan</span>
                    </Link>

                    <Link
                      href={`/consultation/room/${selectedCase.id}?mode=chat&role=pandit`}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#1C1917] dark:text-white transition-colors"
                      title="Open Secure Chat"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                    </Link>
                  </div>
                </div>

                {/* Seeker Question */}
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5 space-y-1">
                  <div className="text-xs font-bold text-[#8E6F1D] dark:text-[#D4AF37]">
                    SEEKER'S LIFE QUESTION:
                  </div>
                  <div className="text-sm font-medium text-[#1C1917] dark:text-white italic">
                    "{selectedCase.question}"
                  </div>
                </div>

                {/* Deterministic Ephemeris Snapshot */}
                <div>
                  <div className="text-xs font-bold text-[#8E6F1D] dark:text-[#D4AF37] mb-2">
                    PLANETARY SNAPSHOT (DETERMINISTIC)
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
                      <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">Lagna / Ascendant</span>
                      <strong className="text-[#1C1917] dark:text-white">{selectedCase.lagna}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
                      <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">Nakshatra</span>
                      <strong className="text-[#1C1917] dark:text-white">{selectedCase.nakshatra}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5">
                      <span className="text-[10px] text-[#696256] dark:text-[#9E988D] block">Active Dasha</span>
                      <strong className="text-[#8E6F1D] dark:text-[#F0C968]">{selectedCase.dasha}</strong>
                    </div>
                  </div>
                </div>

                {/* Scholarly Synthesis & Folio Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#8E6F1D] dark:text-[#D4AF37] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>SCHOLARLY SYNTHESIS & COUNSEL (EDITABLE):</span>
                    </label>
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">
                      AI Pre-Context Draft Pre-loaded
                    </span>
                  </div>
                  <textarea
                    value={folioText}
                    onChange={(e) => setFolioText(e.target.value)}
                    rows={4}
                    className="w-full p-3.5 rounded-2xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/35 bg-[#FAF7F2] dark:bg-[#070912] text-xs sm:text-sm text-[#1C1917] dark:text-white focus:outline-none focus:border-[#8E6F1D] leading-relaxed"
                  />
                </div>

                {/* Prescribed Samagri / Upaya Recommender */}
                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#8E6F1D] dark:text-[#F0C968] flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                      <span>जातक हेतु अनुशंसित वैदिक सामग्री (Prescribed Samagri):</span>
                    </span>
                    <span className="text-[10px] text-[#696256] dark:text-[#9E988D]">
                      सीधे जातक के ऑर्डर में जुड़ती है
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['Bhimseni Camphor Arati', 'Pure A2 Cow Ghee', 'Copper Shri Yantra', 'Navgraha Havan Kit', 'Ashtagandha Tilak'].map(item => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => handleAddUpaya(item)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          prescribedItems.includes(item)
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-black/5 dark:bg-white/5 text-[#696256] dark:text-[#9E988D] hover:bg-black/10'
                        }`}
                      >
                        {prescribedItems.includes(item) ? '✓ ' : '+ '} {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedCase.id)}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-bold text-xs hover:bg-[#A35C15] dark:hover:bg-[#E5C378] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>APPROVE FOLIO & DISPATCH</span>
                  </button>

                  <Link
                    href="/report"
                    className="py-3.5 px-6 rounded-2xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/40 text-xs font-bold text-[#1C1917] dark:text-white hover:border-[#8E6F1D] transition-all flex items-center gap-1.5 bg-white/70 dark:bg-white/5"
                  >
                    <FileText className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />
                    <span>PREVIEW FOLIO</span>
                  </Link>
                </div>

                {approvedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>✓ Case approved and permanent written folio recorded for delivery!</span>
                    <Link href="/report" className="underline font-bold">View Delivered Folio →</Link>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border border-dashed border-[#8E6F1D]/30 dark:border-[#D4AF37]/30 rounded-3xl text-center text-xs text-[#696256] dark:text-[#9E988D]">
                Select a consultation case from the queue to open the Pandit review bench.
              </div>
            )}
          </div>

        </div>

      </div>
    </CosmicTantraShell>
  );
}

'use client';

import React, { useState } from 'react';
import { Clock, Users, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Consultation {
  id: string;
  seekerName: string;
  question: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED';
  receivedAt: string;
  cosmicId: string;
}

const initialConsultations: Consultation[] = [
  {
    id: 'CT-2026-0825-001',
    seekerName: 'Priya Sharma',
    question: 'Will changing my business direction in the next six months be favourable for my long-term financial growth?',
    status: 'PENDING',
    receivedAt: '25 Aug 2026, 09:14',
    cosmicId: 'CT-4821',
  },
  {
    id: 'CT-2026-0824-007',
    seekerName: 'Rahul Verma',
    question: 'When is a good time to get married in the next 8 months?',
    status: 'IN_REVIEW',
    receivedAt: '24 Aug 2026, 14:32',
    cosmicId: 'CT-3912',
  },
];

export default function PanditWorkspace() {
  const [consultations, setConsultations] = useState<Consultation[]>(initialConsultations);
  const [selectedCase, setSelectedCase] = useState<Consultation | null>(null);
  const [folioText, setFolioText] = useState('');

  const updateStatus = (id: string, newStatus: Consultation['status']) => {
    setConsultations(prev =>
      prev.map(c => (c.id === id ? { ...c, status: newStatus } : c))
    );
  };

  const handleApprove = (id: string) => {
    updateStatus(id, 'APPROVED');
    alert('Folio approved and marked for delivery.');
    setSelectedCase(null);
    setFolioText('');
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1C1917]">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-xs tracking-[3px] text-[#8E6F1D] font-mono">काशी विद्वत्-परिषद् • SCHOLAR WORKSPACE</div>
            <h1 className="font-editorial text-5xl font-bold tracking-tight mt-1">Pandit Workspace</h1>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold">Pt. Vidyadhar Shastri</div>
            <div className="text-[#857E74]">Sampurnanand Sanskrit University</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Stats */}
          <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl border border-[#8E6F1D]/20 bg-white">
              <div className="text-xs text-[#857E74]">PENDING REVIEW</div>
              <div className="text-4xl font-bold mt-1">7</div>
            </div>
            <div className="p-5 rounded-2xl border border-[#8E6F1D]/20 bg-white">
              <div className="text-xs text-[#857E74]">IN PROGRESS</div>
              <div className="text-4xl font-bold mt-1">3</div>
            </div>
            <div className="p-5 rounded-2xl border border-[#8E6F1D]/20 bg-white">
              <div className="text-xs text-[#857E74]">DELIVERED TODAY</div>
              <div className="text-4xl font-bold mt-1">4</div>
            </div>
            <div className="p-5 rounded-2xl border border-[#8E6F1D]/20 bg-white">
              <div className="text-xs text-[#857E74]">THIS MONTH</div>
              <div className="text-4xl font-bold mt-1">42</div>
            </div>
          </div>

          {/* Consultations List */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg">Incoming Consultations</div>
              <Link href="/pandit-ji" className="text-xs text-[#8E6F1D]">Back to Presentation</Link>
            </div>

            <div className="space-y-3">
              {consultations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="p-6 rounded-2xl border border-[#8E6F1D]/15 bg-white hover:border-[#8E6F1D]/40 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{c.seekerName}</div>
                      <div className="text-xs text-[#857E74] mt-0.5">{c.cosmicId} • {c.receivedAt}</div>
                    </div>
                    <div className={`px-3 py-1 text-xs rounded-full font-medium ${c.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {c.status}
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-[#44403C] line-clamp-2">{c.question}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Case Detail Panel */}
          <div className="lg:col-span-5">
            {selectedCase ? (
              <div className="sticky top-8 p-7 rounded-3xl border border-[#8E6F1D]/20 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-xl">{selectedCase.seekerName}</div>
                    <div className="text-xs text-[#857E74]">{selectedCase.cosmicId}</div>
                  </div>
                  <button onClick={() => setSelectedCase(null)} className="text-xs">Close</button>
                </div>

                <div className="mt-6 text-sm">
                  <div className="font-medium text-[#8E6F1D]">Question</div>
                  <div className="mt-2 text-[#44403C]">{selectedCase.question}</div>
                </div>

                <div className="mt-8">
                  <div className="font-medium text-[#8E6F1D] mb-2">Write Folio</div>
                  <textarea
                    value={folioText}
                    onChange={(e) => setFolioText(e.target.value)}
                    placeholder="Enter your scholarly synthesis here..."
                    className="w-full h-40 p-4 text-sm border border-[#8E6F1D]/20 rounded-2xl resize-y"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => updateStatus(selectedCase.id, 'IN_REVIEW')}
                    className="flex-1 py-3 rounded-2xl border border-[#8E6F1D]/30 text-sm font-medium"
                  >
                    Mark In Review
                  </button>
                  <button
                    onClick={() => handleApprove(selectedCase.id)}
                    className="flex-1 py-3 rounded-2xl bg-[#8E6F1D] text-white text-sm font-semibold"
                  >
                    Approve & Deliver
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-[#857E74] border border-dashed border-[#8E6F1D]/20 rounded-3xl p-8">
                Select a consultation to begin review
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

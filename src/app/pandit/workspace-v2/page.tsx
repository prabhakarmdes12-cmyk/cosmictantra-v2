'use client';

import React, { useState } from 'react';
import { Clock, MessageCircle, Check, X, User, FileText } from 'lucide-react';

interface Consultation {
  id: string;
  seekerName: string;
  cosmicId: string;
  question: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'DELIVERED';
  receivedAt: string;
  comments: string[];
}

const initialData: Consultation[] = [
  {
    id: 'CT-001',
    seekerName: 'Priya Sharma',
    cosmicId: 'CT-4821',
    question: 'Will changing my business direction in the next six months be favourable?',
    status: 'PENDING',
    receivedAt: '25 Aug 2026',
    comments: [],
  },
  {
    id: 'CT-002',
    seekerName: 'Rahul Verma',
    cosmicId: 'CT-3912',
    question: 'When is a good time to get married in the next 8 months?',
    status: 'IN_REVIEW',
    receivedAt: '24 Aug 2026',
    comments: ['Need more details on 7th lord.'],
  },
];

export default function PanditWorkspaceV2() {
  const [consultations, setConsultations] = useState<Consultation[]>(initialData);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [newComment, setNewComment] = useState('');
  const [folioText, setFolioText] = useState('');

  const updateStatus = (id: string, status: Consultation['status']) => {
    setConsultations(prev =>
      prev.map(c => c.id === id ? { ...c, status } : c)
    );
  };

  const addComment = () => {
    if (!selected || !newComment.trim()) return;

    setConsultations(prev =>
      prev.map(c =>
        c.id === selected.id
          ? { ...c, comments: [...c.comments, newComment] }
          : c
      )
    );
    setNewComment('');
  };

  const approveFolio = () => {
    if (!selected) return;
    updateStatus(selected.id, 'APPROVED');
    setSelected(null);
    setFolioText('');
    alert('Folio approved and sent for delivery.');
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="text-xs tracking-[3px] text-[#8E6F1D]">PANDIT WORKSPACE v2</div>
            <h1 className="font-editorial text-5xl font-bold">Scholar Workspace</h1>
          </div>
          <div className="text-sm text-[#857E74]">Pt. Vidyadhar Shastri • Sampurnanand University</div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* List */}
          <div className="lg:col-span-7">
            <div className="font-semibold mb-4">Active Consultations</div>
            <div className="space-y-4">
              {consultations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="p-6 bg-white rounded-2xl border border-[#8E6F1D]/15 hover:border-[#8E6F1D]/40 cursor-pointer"
                >
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{c.seekerName}</div>
                      <div className="text-xs text-[#857E74]">{c.cosmicId} • {c.receivedAt}</div>
                    </div>
                    <div className={`px-3 py-1 text-xs rounded-full ${c.status === 'PENDING' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                      {c.status}
                    </div>
                  </div>
                  <div className="mt-3 text-sm line-clamp-2">{c.question}</div>
                  {c.comments.length > 0 && (
                    <div className="mt-2 text-xs text-[#8E6F1D]">+ {c.comments.length} comment(s)</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-5">
            {selected ? (
              <div className="sticky top-8 bg-white p-7 rounded-3xl border border-[#8E6F1D]/20">
                <div className="flex justify-between">
                  <div>
                    <div className="font-bold text-xl">{selected.seekerName}</div>
                    <div className="text-xs text-[#857E74]">{selected.cosmicId}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs">Close</button>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-medium text-[#8E6F1D]">Question</div>
                  <div className="mt-2 text-sm">{selected.question}</div>
                </div>

                {/* Comments */}
                <div className="mt-8">
                  <div className="font-medium text-sm mb-3">Internal Comments</div>
                  {selected.comments.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {selected.comments.map((comment, i) => (
                        <div key={i} className="text-xs bg-[#FAF7F2] p-3 rounded-xl">{comment}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[#857E74] mb-4">No comments yet</div>
                  )}

                  <div className="flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add internal note..."
                      className="flex-1 text-sm border border-[#8E6F1D]/20 rounded-2xl px-4 py-2"
                    />
                    <button onClick={addComment} className="px-4 bg-[#8E6F1D] text-white rounded-2xl text-sm">Add</button>
                  </div>
                </div>

                {/* Folio Writing */}
                <div className="mt-8">
                  <div className="font-medium text-sm mb-2">Write Folio</div>
                  <textarea
                    value={folioText}
                    onChange={(e) => setFolioText(e.target.value)}
                    className="w-full h-32 border border-[#8E6F1D]/20 rounded-2xl p-4 text-sm"
                    placeholder="Enter your scholarly synthesis..."
                  />
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => updateStatus(selected.id, 'IN_REVIEW')} className="flex-1 py-3 border rounded-2xl text-sm">Mark In Review</button>
                    <button onClick={approveFolio} className="flex-1 py-3 bg-[#8E6F1D] text-white rounded-2xl text-sm">Approve & Deliver</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center border border-dashed border-[#8E6F1D]/20 rounded-3xl text-[#857E74]">
                Select a consultation
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

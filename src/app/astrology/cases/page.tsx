'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, User, PlusCircle, RefreshCw, CheckCircle, Clock, ShieldAlert, Eye } from 'lucide-react';

interface Practitioner {
  id: string;
  displayName: string;
  profilePhoto?: string;
}

interface Consultation {
  id: string;
  customerName: string;
  customerQuestion: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  isTestCase: boolean;
  status: string;
  aiDraft?: string;
  practitionerFinal?: string;
  createdAt: string;
  practitioner?: Practitioner;
}

export default function CasesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Consultation[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [stats, setStats] = useState({ total: 0, testCases: 0, pendingReview: 0, approved: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Consultation | null>(null);

  // Form State
  const [testForm, setTestForm] = useState({
    customerName: 'Rahul Sharma',
    customerPhone: '+919876543210',
    birthDate: '1990-01-15',
    birthTime: '10:30',
    birthCity: 'Patna',
    birthLat: 25.5941,
    birthLon: 85.1376,
    timezone: 5.5,
    customerQuestion: 'Will changing my business direction in the next six months be favourable?',
    practitionerId: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/astrology/consultations'),
        fetch('/api/astrology/practitioners'),
      ]);
      const cData = await cRes.json();
      const pData = await pRes.json();

      if (cData.success) {
        setCases(cData.consultations || []);
        setStats(cData.stats || { total: 0, testCases: 0, pendingReview: 0, approved: 0 });
      }
      if (pData.success && pData.consultants) {
        setPractitioners(pData.consultants);
        if (pData.consultants.length > 0 && !testForm.practitionerId) {
          setTestForm(f => ({ ...f, practitionerId: pData.consultants[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load cases data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/astrology/consultations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testForm),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to create test consultation');
      }
    } catch (err) {
      alert('Network error creating test consultation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] p-4 sm:p-8 font-body">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-500/20 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#A78BFA] uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" /> CosmicTantra Operations
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Consultation Lifecycle Workspace
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF]">
              Audit consultation calculations, AI drafts, practitioner edits, and delivery status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="chiti-btn-secondary text-xs">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={() => setShowModal(true)} className="chiti-btn-primary text-xs">
              <PlusCircle className="w-4 h-4" /> Create Test Consultation
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Total Cases</div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Test Cases</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#F59E0B]">{stats.testCases}</div>
          </div>
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Awaiting Pandit Review</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#7C3AED]">{stats.pendingReview}</div>
          </div>
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Approved / Delivered</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#10B981]">{stats.approved}</div>
          </div>
        </div>

        {/* Cases List */}
        <div className="chiti-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#7C3AED]" /> Consultation Cases Lifecycle
          </h2>

          {loading ? (
            <div className="py-12 text-center text-[#9CA3AF]">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white/5 border border-white/10 text-xs text-[#9CA3AF]">
              No consultation cases created yet. Click "Create Test Consultation" to trigger a dummy calculation & AI draft.
            </div>
          ) : (
            <div className="space-y-4">
              {cases.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-black/40 border border-purple-500/20 space-y-3">
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{item.customerName}</span>
                      {item.isTestCase && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-[#FBBF24]">
                          TEST CASE
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'APPROVED' || item.status === 'DELIVERED'
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-[#6EE7B7]'
                          : 'bg-purple-500/20 border border-purple-500/40 text-[#A78BFA]'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#6B7280]">
                      {new Date(item.createdAt).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-xs text-[#E2D9F3] bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-[#9CA3AF] font-semibold">Question:</span> "{item.customerQuestion}"
                  </div>

                  <div className="flex flex-wrap justify-between items-center text-xs text-[#9CA3AF] pt-2 border-t border-white/5 gap-2">
                    <div>
                      <span>Assigned Pandit: </span>
                      <strong className="text-white">{item.practitioner?.displayName || 'Unassigned'}</strong>
                    </div>
                    <div>
                      <span>Birth Details: </span>
                      <span className="text-white">{new Date(item.birthDate).toLocaleDateString('en-IN')} at {item.birthTime} ({item.birthCity})</span>
                    </div>
                    <button
                      onClick={() => setSelectedCase(item)}
                      className="chiti-btn-secondary text-[11px] py-1 px-3"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Case Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Test Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-lg w-full chiti-card p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#F59E0B]" /> Create Test Consultation
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Runs exact downstream calculation + AI draft generation. Marked explicitly as <strong>TEST CASE</strong>.
            </p>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Customer / Test Name</label>
                  <input
                    type="text"
                    required
                    className="chiti-input"
                    value={testForm.customerName}
                    onChange={e => setTestForm({ ...testForm, customerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Assigned Practitioner</label>
                  <select
                    className="chiti-input"
                    value={testForm.practitionerId}
                    onChange={e => setTestForm({ ...testForm, practitionerId: e.target.value })}
                  >
                    {practitioners.map(p => (
                      <option key={p.id} value={p.id} style={{ background: '#0D0A1E' }}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">DOB</label>
                  <input
                    type="date"
                    required
                    className="chiti-input"
                    value={testForm.birthDate}
                    onChange={e => setTestForm({ ...testForm, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Birth Time</label>
                  <input
                    type="time"
                    required
                    className="chiti-input"
                    value={testForm.birthTime}
                    onChange={e => setTestForm({ ...testForm, birthTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">City</label>
                  <input
                    type="text"
                    required
                    className="chiti-input"
                    value={testForm.birthCity}
                    onChange={e => setTestForm({ ...testForm, birthCity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Customer Question</label>
                <textarea
                  rows={3}
                  required
                  className="chiti-input"
                  value={testForm.customerQuestion}
                  onChange={e => setTestForm({ ...testForm, customerQuestion: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="chiti-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="chiti-btn-primary text-xs"
                >
                  {submitting ? 'Calculating Pipeline...' : 'Run Pipeline & Create Case ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-2xl w-full chiti-card p-6 relative max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Case #{selectedCase.id.slice(0, 8)}</h2>
              <button onClick={() => setSelectedCase(null)} className="text-xs text-[#9CA3AF] hover:text-white">Close</button>
            </div>

            <div className="p-3 bg-white/5 rounded-xl text-xs space-y-1">
              <div><strong className="text-white">Customer:</strong> {selectedCase.customerName}</div>
              <div><strong className="text-white">Question:</strong> "{selectedCase.customerQuestion}"</div>
              <div><strong className="text-white">Birth:</strong> {new Date(selectedCase.birthDate).toLocaleDateString('en-IN')} at {selectedCase.birthTime} ({selectedCase.birthCity})</div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#7C3AED] uppercase mb-2">AI-Prepared Working Draft:</h4>
              <div className="p-4 rounded-xl bg-black/60 border border-purple-500/30 font-mono text-xs text-[#E2D9F3] whitespace-pre-wrap leading-relaxed">
                {selectedCase.aiDraft || 'No draft generated'}
              </div>
            </div>

            {selectedCase.practitionerFinal && (
              <div>
                <h4 className="text-xs font-bold text-[#10B981] uppercase mb-2">Practitioner Final Approved Interpretation:</h4>
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-white whitespace-pre-wrap leading-relaxed">
                  {selectedCase.practitionerFinal}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, FileText, CheckCircle2, Clock, ChevronRight, User, ShieldCheck } from 'lucide-react';

interface CaseItem {
  id: string;
  customerName: string;
  customerQuestion: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  isTestCase: boolean;
  status: string;
  createdAt: string;
  practitioner?: {
    displayName: string;
  };
}

export default function PanditDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [practitionerName, setPractitionerName] = useState('Pandit Ramesh Sharma');

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch('/api/astrology/consultations');
        const data = await res.json();
        if (data.success) {
          setCases(data.consultations || []);
        }
      } catch (err) {
        console.error('Failed to load practitioner cases:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const pendingCases = cases.filter(c => c.status === 'PANDIT_REVIEW' || c.status === 'ASSIGNED');
  const approvedCases = cases.filter(c => c.status === 'APPROVED' || c.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] p-4 sm:p-6 font-body max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-purple-500/20">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F59E0B] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Pandit Workspace
          </div>
          <h1 className="text-xl font-bold font-display text-white mt-0.5">
            Namaste, {practitionerName}
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-xl border border-purple-400/40">
          🧙
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30">
          <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Awaiting Review</div>
          <div className="text-2xl font-bold text-[#F59E0B] mt-1">{pendingCases.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          <div className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Approved & Verified</div>
          <div className="text-2xl font-bold text-[#10B981] mt-1">{approvedCases.length}</div>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#7C3AED]" /> Assigned Consultations
        </h2>
        <span className="text-xs text-[#6B7280]">{cases.length} Total</span>
      </div>

      {/* Cases List */}
      {loading ? (
        <div className="py-12 text-center text-[#9CA3AF] text-xs">Loading assigned cases...</div>
      ) : cases.length === 0 ? (
        <div className="p-6 text-center rounded-xl bg-white/5 border border-white/10 text-xs text-[#9CA3AF]">
          No consultation cases assigned yet.
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map(item => (
            <Link
              key={item.id}
              href={`/pandit/cases/${item.id}`}
              className="block p-4 rounded-xl bg-white/5 border border-purple-500/20 hover:border-[#7C3AED] transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{item.customerName}</span>
                  {item.isTestCase && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 border border-amber-500/40 text-[#FBBF24]">
                      TEST CASE
                    </span>
                  )}
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  item.status === 'APPROVED' || item.status === 'DELIVERED'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-[#6EE7B7]'
                    : 'bg-purple-500/20 border border-purple-500/40 text-[#A78BFA]'
                }`}>
                  {item.status === 'APPROVED' ? '✓ APPROVED' : 'REVIEW'}
                </span>
              </div>

              <p className="text-xs text-[#E2D9F3] bg-black/40 p-2.5 rounded-lg border border-white/5 line-clamp-2 mb-3">
                "{item.customerQuestion}"
              </p>

              <div className="flex justify-between items-center text-[11px] text-[#9CA3AF] pt-2 border-t border-white/5">
                <span>Birth: {new Date(item.birthDate).toLocaleDateString('en-IN')} ({item.birthCity})</span>
                <span className="text-[#7C3AED] font-semibold flex items-center gap-0.5">
                  Review Case <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

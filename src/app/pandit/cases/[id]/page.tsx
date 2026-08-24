'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, ShieldCheck, CheckCircle2, Save, FileText, User, Calendar, MapPin, Compass, AlertCircle } from 'lucide-react';

interface ConsultationDetail {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerQuestion: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  birthLat: number;
  birthLon: number;
  timezone: number;
  isTestCase: boolean;
  status: string;
  calculationSnapshot?: any;
  aiDraft?: string;
  practitionerFinal?: string;
  practitionerNotes?: string;
  approvedAt?: string;
  practitioner?: {
    id: string;
    displayName: string;
  };
}

export default function PanditCaseReviewPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<ConsultationDetail | null>(null);
  const [editedText, setEditedText] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCase() {
      if (!caseId) return;
      try {
        const res = await fetch(`/api/astrology/consultations`);
        const data = await res.json();
        if (data.success && data.consultations) {
          const item = data.consultations.find((c: any) => c.id === caseId);
          if (item) {
            setCaseData(item);
            setEditedText(item.practitionerFinal || item.aiDraft || '');
            setNotes(item.practitionerNotes || '');
          }
        }
      } catch (err) {
        console.error('Failed to load case detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  const handleAction = async (action: 'SAVE' | 'APPROVE') => {
    if (!editedText.trim()) return;
    if (action === 'SAVE') setSaving(true);
    if (action === 'APPROVE') setApproving(true);

    try {
      const res = await fetch(`/api/astrology/cases/${caseId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practitionerId: caseData?.practitioner?.id,
          practitionerFinal: editedText,
          practitionerNotes: notes,
          action,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCaseData(prev => prev ? { ...prev, status: data.consultation.status, practitionerFinal: data.consultation.practitionerFinal } : null);
        setSuccessToast(action === 'APPROVE' ? '✅ Consultation Approved & Verified!' : '💾 Draft Saved Successfully');
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        alert(data.error || 'Failed to save review');
      }
    } catch (err) {
      alert('Network error submitting review');
    } finally {
      setSaving(false);
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030108] text-[#E2D9F3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#9CA3AF]">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-[#030108] text-[#E2D9F3] p-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-bold text-white mb-2">Case Not Found</h2>
        <button onClick={() => router.push('/pandit')} className="chiti-btn-secondary text-xs">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const snapshot = caseData.calculationSnapshot || {};
  const kundali = snapshot.kundali || {};
  const activeDasha = snapshot.currentDasha || {};
  const panchang = snapshot.panchang || {};

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] p-4 sm:p-6 font-body max-w-lg mx-auto pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-500/20">
        <button onClick={() => router.push('/pandit')} className="chiti-btn-secondary text-xs py-1.5 px-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            {caseData.isTestCase && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 border border-amber-500/40 text-[#FBBF24]">
                TEST CASE
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              caseData.status === 'APPROVED' ? 'bg-emerald-500/20 border border-emerald-500/40 text-[#6EE7B7]' : 'bg-purple-500/20 border border-purple-500/40 text-[#A78BFA]'
            }`}>
              {caseData.status}
            </span>
          </div>
          <div className="text-[10px] text-[#6B7280] mt-0.5">Case #{caseData.id.slice(0, 8)}</div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3.5 mb-4 rounded-xl bg-emerald-950/80 border border-[#10B981] text-[#6EE7B7] text-xs font-semibold text-center animate-fade-in shadow-lg">
          {successToast}
        </div>
      )}

      {/* SECTION 1: Customer Question (Visually Dominant) */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-black border-2 border-[#F59E0B]/40 mb-5 shadow-[0_4px_20px_rgba(245,158,11,0.15)]">
        <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" /> Customer Question
        </div>
        <h2 className="text-base sm:text-lg font-semibold text-white leading-snug">
          "{caseData.customerQuestion}"
        </h2>
        <div className="mt-3 pt-2 border-t border-amber-500/20 flex justify-between items-center text-xs text-[#9CA3AF]">
          <span>Client: <strong className="text-white">{caseData.customerName}</strong></span>
          <span>Assigned: {new Date(caseData.birthDate).toLocaleDateString('en-IN')}</span>
        </div>
      </div>

      {/* SECTION 2: Customer Birth Details */}
      <div className="chiti-card p-4 mb-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#7C3AED]" /> Birth Details & Location
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[#6B7280] block text-[10px]">Date of Birth</span>
            <span className="font-semibold text-white">{new Date(caseData.birthDate).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[#6B7280] block text-[10px]">Time of Birth</span>
            <span className="font-semibold text-white">{caseData.birthTime}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[#6B7280] block text-[10px]">City / Location</span>
            <span className="font-semibold text-white">{caseData.birthCity}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
            <span className="text-[#6B7280] block text-[10px]">Coordinates & TZ</span>
            <span className="font-semibold text-white">{caseData.birthLat.toFixed(2)}°N, {caseData.birthLon.toFixed(2)}°E (UTC+{caseData.timezone})</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: Calculated Astrological Primitives */}
      <div className="chiti-card p-4 mb-5 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#F59E0B]" /> Deterministic Astrology Calculations
        </h3>

        {kundali.lagna && (
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 flex justify-between items-center text-xs">
            <div>
              <span className="text-[#9CA3AF] block text-[10px] uppercase">Lagna (Ascendant)</span>
              <span className="text-base font-bold text-[#F59E0B]">{kundali.lagna.rasiName}</span>
            </div>
            <div className="text-right">
              <span className="text-[#9CA3AF] block text-[10px] uppercase">Nakshatra</span>
              <span className="font-semibold text-white">{kundali.lagna.nakshatra?.name}</span>
            </div>
          </div>
        )}

        {activeDasha.planet && (
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center text-xs">
            <div>
              <span className="text-[#9CA3AF] block text-[10px] uppercase">Active Dasha</span>
              <span className="font-bold text-[#A78BFA]">{activeDasha.planet} Mahadasha</span>
            </div>
            <span className="text-xs text-[#10B981] font-semibold">{activeDasha.percentDone}% Complete</span>
          </div>
        )}

        {/* 9 Planets Quick Table */}
        {kundali.planets && (
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            {Object.entries(kundali.planets).map(([pName, p]: [string, any]) => (
              <div key={pName} className="p-2 rounded-lg bg-black/30 border border-white/5 text-center">
                <span className="text-[#F59E0B] font-bold block">{pName}</span>
                <span className="text-white text-[10px]">{p.rasiName} (H{p.house})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: CosmicTantra AI Working Draft */}
      <div className="chiti-card p-4 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#7C3AED]" /> Working Analysis Draft
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[9px] bg-purple-500/20 border border-purple-500/40 text-[#A78BFA]">
            AI Draft Immutable
          </span>
        </div>

        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-[#A78BFA]">
          <strong>AI-prepared working draft — practitioner verification required</strong>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs text-[#D1D5DB] font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {caseData.aiDraft || 'No draft generated'}
        </div>
      </div>

      {/* SECTION 5: Practitioner Verification & Edit Workspace */}
      <div className="chiti-card p-5 space-y-4 border-2 border-[#7C3AED]/40 shadow-[0_0_30px_rgba(124,58,237,0.1)]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#10B981]" /> Your Final Verified Interpretation
          </h3>
          <span className="text-[10px] text-[#10B981] font-semibold">Human Review Required</span>
        </div>

        <p className="text-xs text-[#9CA3AF]">
          Review the calculated Kundali, edit the working draft, and provide your authoritative astrological judgment for client delivery.
        </p>

        <div>
          <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Final Client Interpretation (Editable)</label>
          <textarea
            rows={10}
            className="chiti-input font-body text-xs leading-relaxed"
            value={editedText}
            onChange={e => setEditedText(e.target.value)}
            placeholder="Write or edit your verified astrological interpretation..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Internal Practitioner Notes (Optional)</label>
          <input
            type="text"
            className="chiti-input text-xs"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Verified 10th lord aspect, recommended Blue Sapphire cautiously."
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={saving || approving}
            onClick={() => handleAction('SAVE')}
            className="chiti-btn-secondary text-xs py-3 justify-center"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            disabled={saving || approving || !editedText.trim()}
            onClick={() => handleAction('APPROVE')}
            className="chiti-btn-primary text-xs py-3 justify-center bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold"
          >
            <CheckCircle2 className="w-4 h-4" /> {approving ? 'Approving...' : 'Approve & Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}

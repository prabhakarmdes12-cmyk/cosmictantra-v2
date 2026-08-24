'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Users, Sparkles, Phone, Mail, Clock, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

interface Consultant {
  id: string;
  displayName: string;
  fullName: string;
  phone: string;
  email?: string;
  city: string;
  state: string;
  yearsExperience: number;
  expertise: string[];
  languages: string[];
  profilePhoto: string;
  onboardingStatus: string;
  isActive: boolean;
  onboardedAt: string;
}

interface PendingInvite {
  id: string;
  token: string;
  name: string;
  phone: string;
  email?: string;
  languages: string[];
  expiresAt: string;
  createdAt: string;
}

export default function PractitionersAdminPage() {
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, pendingOnboarding: 0, paused: 0 });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Invite Form
  const [inviteForm, setInviteForm] = useState({
    name: '',
    phone: '',
    email: '',
    languages: ['Hindi', 'English'],
    internalNote: '',
  });
  const [inviteResult, setInviteResult] = useState<{ url: string; token: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  const fetchPractitioners = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/astrology/practitioners');
      const data = await res.json();
      if (data.success) {
        setConsultants(data.consultants || []);
        setPendingInvites(data.pendingInvites || []);
        setStats(data.stats || { total: 0, active: 0, pendingOnboarding: 0, paused: 0 });
      }
    } catch (err) {
      console.error('Failed to load practitioners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPractitioners();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.phone) return;
    setInviting(true);

    try {
      const res = await fetch('/api/astrology/practitioners/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      if (data.success) {
        setInviteResult({ url: data.inviteUrl, token: data.token });
        fetchPractitioners();
      } else {
        alert(data.error || 'Failed to generate invite');
      }
    } catch (err) {
      alert('Network error generating invite');
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
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
              Practitioner Operations
            </h1>
            <p className="text-xs sm:text-sm text-[#9CA3AF]">
              Invite, onboard, and manage verified Vedic Jyotish practitioners.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPractitioners}
              className="chiti-btn-secondary text-xs"
              title="Refresh directory"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={() => {
                setInviteResult(null);
                setInviteForm({ name: '', phone: '', email: '', languages: ['Hindi', 'English'], internalNote: '' });
                setShowInviteModal(true);
              }}
              className="chiti-btn-primary text-xs"
            >
              <UserPlus className="w-4 h-4" /> Invite Practitioner
            </button>
          </div>
        </div>

        {/* Operational Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Active Practitioners</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#10B981]">{stats.active}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">Ready for case review</div>
          </div>
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Pending Onboarding</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#F59E0B]">{stats.pendingOnboarding}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">Invited via WhatsApp</div>
          </div>
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Total Onboarded</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#A78BFA]">{stats.total}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">Verified profile records</div>
          </div>
          <div className="chiti-card p-4">
            <div className="text-xs font-semibold text-[#9CA3AF] uppercase mb-1">Paused</div>
            <div className="text-2xl sm:text-3xl font-bold text-[#6B7280]">{stats.paused}</div>
            <div className="text-[11px] text-[#6B7280] mt-1">Temporarily inactive</div>
          </div>
        </div>

        {/* Directory Section */}
        <div className="chiti-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7C3AED]" /> Practitioner Directory
          </h2>

          {loading ? (
            <div className="py-12 text-center text-[#9CA3AF]">Loading practitioners...</div>
          ) : (
            <div className="space-y-6">
              {/* Active / Onboarded Practitioners */}
              <div>
                <h3 className="text-xs font-semibold text-[#A78BFA] uppercase tracking-wider mb-3">
                  Onboarded Practitioners ({consultants.length})
                </h3>
                {consultants.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-white/5 border border-white/10 text-xs text-[#9CA3AF]">
                    No active practitioners onboarded yet. Click "Invite Practitioner" to generate an onboarding link.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {consultants.map(c => (
                      <div key={c.id} className="p-4 rounded-xl bg-black/40 border border-purple-500/20 flex gap-4 items-start">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] flex items-center justify-center text-2xl border border-purple-400/40 shrink-0">
                          {c.profilePhoto || '🧙'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-white truncate">{c.displayName}</h4>
                              <p className="text-xs text-[#9CA3AF]">{c.city}, {c.state} · {c.yearsExperience} yrs exp</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 border border-[#10B981]/40 text-[#6EE7B7]">
                              ACTIVE
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {c.expertise.map(exp => (
                              <span key={exp} className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950/50 border border-purple-500/30 text-[#A78BFA]">
                                {exp}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[11px] text-[#6B7280]">
                            <span>Phone: {c.phone}</span>
                            <span>Onboarded: {new Date(c.onboardedAt).toLocaleDateString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider mb-3">
                    Pending Invites ({pendingInvites.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingInvites.map(inv => {
                      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
                      const link = `http://${host}/pandit/onboard/${inv.token}`;
                      return (
                        <div key={inv.id} className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{inv.name}</span>
                              <span className="text-xs text-[#9CA3AF]">({inv.phone})</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 border border-amber-500/40 text-[#FBBF24]">
                                PENDING ONBOARDING
                              </span>
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                              Expires: {new Date(inv.expiresAt).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(link, inv.token)}
                              className="chiti-btn-secondary text-xs py-1.5 px-3"
                            >
                              {copiedToken === inv.token ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-[#10B981]" /> Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Copy WhatsApp Link
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="max-w-md w-full chiti-card p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#7C3AED]" /> Invite Practitioner
            </h2>
            <p className="text-xs text-[#9CA3AF] mb-4">
              Generate a secure onboarding link to send to Pandit Ji via WhatsApp.
            </p>

            {!inviteResult ? (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Pandit's Full Name *</label>
                  <input
                    type="text"
                    required
                    className="chiti-input"
                    value={inviteForm.name}
                    onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">WhatsApp Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="chiti-input"
                    value={inviteForm.phone}
                    onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    className="chiti-input"
                    value={inviteForm.email}
                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="pandit@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Internal Admin Note</label>
                  <input
                    type="text"
                    className="chiti-input"
                    value={inviteForm.internalNote}
                    onChange={e => setInviteForm({ ...inviteForm, internalNote: e.target.value })}
                    placeholder="e.g. Recommended by Varanasi Astrological Society"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="chiti-btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="chiti-btn-primary text-xs"
                  >
                    {inviting ? 'Generating...' : 'Generate Onboarding Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-[#10B981]/20 border border-[#10B981] rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✅
                </div>
                <h3 className="text-base font-bold text-white">Onboarding Link Ready!</h3>
                <p className="text-xs text-[#9CA3AF]">
                  Send this secure invitation link directly to <strong>{inviteForm.name}</strong> on WhatsApp.
                </p>

                <div className="p-3 bg-black/60 border border-purple-500/30 rounded-xl text-left font-mono text-xs text-[#A78BFA] break-all">
                  {inviteResult.url}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(inviteResult.url, inviteResult.token)}
                    className="chiti-btn-primary w-full text-xs"
                  >
                    {copiedToken === inviteResult.token ? (
                      <>
                        <Check className="w-4 h-4 text-[#10B981]" /> Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy WhatsApp Link
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-xs text-[#9CA3AF] underline hover:text-white mt-2 block mx-auto"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

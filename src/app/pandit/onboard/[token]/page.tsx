'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Check, Sparkles, User, BookOpen, Clock, Award, ShieldCheck, Heart, ArrowRight, ArrowLeft } from 'lucide-react';

const EXPERTISE_OPTIONS = [
  'Kundali Analysis',
  'Career & Profession',
  'Business Timing',
  'Marriage & Compatibility',
  'Relationships & Love',
  'Wealth & Finance',
  'Education & Studies',
  'Muhurta Electional',
  'Vedic Jyotish',
  'Parashari System',
  'Remedies & Pujas',
];

const LANGUAGE_OPTIONS = ['Hindi', 'English', 'Sanskrit', 'Bengali', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam'];

const AVATARS = ['🧙', '🕉️', '🌟', '🌙', '🔮', '👩‍🔬', '🧘'];

export default function PractitionerOnboardingPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    displayName: '',
    phone: '',
    email: '',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    languages: ['Hindi', 'English'],
    expertise: ['Kundali Analysis', 'Career & Profession'],
    yearsExperience: 15,
    biography: '',
    tradition: 'Parashari Jyotish',
    qualifications: 'Jyotish Acharya',
    profilePhoto: '🧙',
    aiReviewConsent: true,
    videoContentInterest: false,
    agreementAccepted: false,
  });

  useEffect(() => {
    async function validateToken() {
      if (!token) return;
      try {
        const res = await fetch(`/api/astrology/practitioners/onboard?token=${token}`);
        const data = await res.json();

        if (data.valid && data.invite) {
          setTokenValid(true);
          setForm(f => ({
            ...f,
            fullName: data.invite.name || '',
            displayName: data.invite.name ? `Pandit ${data.invite.name}` : '',
            phone: data.invite.phone || '',
            email: data.invite.email || '',
            languages: data.invite.languages || ['Hindi', 'English'],
          }));
        } else {
          setTokenValid(false);
          setTokenError(data.error || 'Invalid or expired onboarding link.');
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError('Failed to validate onboarding link.');
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [token]);

  const toggleExpertise = (exp: string) => {
    setForm(f => {
      const exists = f.expertise.includes(exp);
      return {
        ...f,
        expertise: exists ? f.expertise.filter(e => e !== exp) : [...f.expertise, exp],
      };
    });
  };

  const toggleLanguage = (lang: string) => {
    setForm(f => {
      const exists = f.languages.includes(lang);
      return {
        ...f,
        languages: exists ? f.languages.filter(l => l !== lang) : [...f.languages, lang],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.agreementAccepted) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/astrology/practitioners/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      });

      const data = await res.json();
      if (data.success) {
        setCompleted(true);
      } else {
        alert(data.error || 'Failed to submit onboarding profile.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030108] text-[#E2D9F3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9CA3AF]">Validating invitation link...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-[#030108] text-[#E2D9F3] flex items-center justify-center p-4">
        <div className="max-w-md w-full chiti-card p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Onboarding Link</h2>
          <p className="text-[#9CA3AF] text-sm mb-6">{tokenError}</p>
          <p className="text-xs text-[#6B7280]">Please request a new invitation link from your Chiti Console Admin.</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-[#030108] text-[#E2D9F3] flex items-center justify-center p-4">
        <div className="max-w-md w-full chiti-card p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-[#10B981]/20 border-2 border-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            ✨
          </div>
          <h1 className="text-2xl font-bold text-[#F59E0B] mb-2 font-display">
            आपका CosmicTantra practitioner profile तैयार है।
          </h1>
          <p className="text-lg font-semibold text-white mb-4">
            Welcome aboard, {form.displayName}!
          </p>
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-left mb-6 text-sm text-[#D1D5DB] space-y-2">
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-[#9CA3AF]">Status:</span>
              <span className="text-[#10B981] font-bold">ACTIVE PRACTITIONER</span>
            </div>
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-[#9CA3AF]">Location:</span>
              <span>{form.city}, {form.state}</span>
            </div>
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-[#9CA3AF]">Experience:</span>
              <span>{form.yearsExperience} Years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">AI Verification Consent:</span>
              <span className="text-[#10B981]">✓ Agreed</span>
            </div>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            We'll now run a test consultation together so you can see exactly how the system works.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] py-8 px-4 flex flex-col items-center">
      {/* Header */}
      <div className="max-w-lg w-full mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A78BFA] text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> CosmicTantra Practitioner Portal
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-white mb-1">
          Welcome to CosmicTantra
        </h1>
        <p className="text-xs sm:text-sm text-[#9CA3AF]">
          Technology-assisted Jyotish. Guided and verified by experienced practitioners.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-lg w-full mb-6">
        <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-2 px-1">
          <span>Step {step} of 5</span>
          <span>{step === 1 ? 'Basic Details' : step === 2 ? 'Jyotish Background' : step === 3 ? 'Consultation Policy' : step === 4 ? 'Public Profile' : 'Agreement'}</span>
        </div>
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-[#7C3AED] to-[#F59E0B] h-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="max-w-lg w-full chiti-card p-6 sm:p-8">
        {/* STEP 1: Basic Details */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#7C3AED]" /> Basic Contact Details
            </h2>
            <p className="text-xs text-[#9CA3AF]">Your verified contact information for official communications.</p>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Full Name</label>
              <input
                type="text"
                className="chiti-input"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Ramesh Kumar Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Display / Professional Title</label>
              <input
                type="text"
                className="chiti-input"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. Pandit Ramesh Sharma"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Phone Number (WhatsApp)</label>
                <input
                  type="text"
                  className="chiti-input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  className="chiti-input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="pandit@gmail.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">City</label>
                <input
                  type="text"
                  className="chiti-input"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="Varanasi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">State</label>
                <input
                  type="text"
                  className="chiti-input"
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  placeholder="Uttar Pradesh"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-2">Languages Spoken & Written</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      form.languages.includes(lang)
                        ? 'bg-[#7C3AED]/30 border border-[#7C3AED] text-[#E2D9F3]'
                        : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
                    }`}
                  >
                    {form.languages.includes(lang) ? '✓ ' : ''}{lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Jyotish Background */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#F59E0B]" /> Jyotish Experience & Tradition
            </h2>
            <p className="text-xs text-[#9CA3AF]">Tell us about your astrological lineage and practice history.</p>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Years Practicing Jyotish</label>
              <input
                type="number"
                className="chiti-input"
                value={form.yearsExperience}
                onChange={e => setForm({ ...form, yearsExperience: parseInt(e.target.value) || 0 })}
                min={1}
                max={60}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-2">Areas of Expertise</label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map(exp => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => toggleExpertise(exp)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      form.expertise.includes(exp)
                        ? 'bg-[#F59E0B]/20 border border-[#F59E0B] text-[#FBBF24]'
                        : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
                    }`}
                  >
                    {form.expertise.includes(exp) ? '⭐ ' : ''}{exp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Guru Parampara / Tradition</label>
              <input
                type="text"
                className="chiti-input"
                value={form.tradition}
                onChange={e => setForm({ ...form, tradition: e.target.value })}
                placeholder="e.g. Parashari Jyotish, Kashi Vidwat Parishad"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Qualifications / Degrees (Optional)</label>
              <input
                type="text"
                className="chiti-input"
                value={form.qualifications}
                onChange={e => setForm({ ...form, qualifications: e.target.value })}
                placeholder="e.g. PhD in Vedic Astrology / Jyotish Acharya"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Consultation Preferences */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" /> Verification & Policy Agreement
            </h2>

            {/* AI Callout Box */}
            <div className="p-4 rounded-xl bg-purple-950/40 border border-[#7C3AED]/40 text-xs text-[#D1D5DB] space-y-2">
              <div className="flex items-center gap-2 text-[#A78BFA] font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-[#F59E0B]" /> Practitioner Authority Principle
              </div>
              <p className="leading-relaxed text-[#E2D9F3]">
                CosmicTantra performs calculations and prepares structured working material. The practitioner remains responsible for reviewing and approving the interpretation delivered under their name.
              </p>
            </div>

            {/* Consent Checkboxes */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-[#7C3AED]/40 transition-all">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-[#7C3AED]"
                checked={form.aiReviewConsent}
                onChange={e => setForm({ ...form, aiReviewConsent: e.target.checked })}
              />
              <span className="text-xs text-[#E2D9F3] leading-normal">
                <strong>AI Review Consent:</strong> I agree to review, edit, and verify AI-prepared astrological working drafts before final delivery to clients under my name.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-[#7C3AED]/40 transition-all">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-[#7C3AED]"
                checked={form.videoContentInterest}
                onChange={e => setForm({ ...form, videoContentInterest: e.target.checked })}
              />
              <span className="text-xs text-[#E2D9F3] leading-normal">
                <strong>Educational Videos:</strong> I am interested in recording short educational video content (60-sec Jyotish tips) for CosmicTantra's official channels.
              </span>
            </label>
          </div>
        )}

        {/* STEP 4: Public Profile */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-[#F59E0B]" /> Public Practitioner Profile
            </h2>
            <p className="text-xs text-[#9CA3AF]">This will be presented respectfully to consulting clients.</p>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-2">Select Avatar / Icon</label>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setForm({ ...form, profilePhoto: avatar })}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border transition-all ${
                      form.profilePhoto === avatar
                        ? 'bg-[#7C3AED]/30 border-[#7C3AED] scale-110 shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                        : 'bg-white/5 border-white/10 opacity-70'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Short Biography for Clients</label>
              <textarea
                rows={4}
                className="chiti-input"
                value={form.biography}
                onChange={e => setForm({ ...form, biography: e.target.value })}
                placeholder="Master in Parashari Jyotish and Prashna Kundali. Specialising in career direction, marriage timing, and authentic Vedic remedies."
              />
            </div>
          </div>
        )}

        {/* STEP 5: Platform Agreement */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#10B981]" /> Final Onboarding Agreement
            </h2>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-[#9CA3AF] space-y-2 leading-relaxed">
              <p className="text-white font-semibold mb-1">CosmicTantra Platform Operating Policy:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>I confirm that all credentials and experience details provided are authentic.</li>
                <li>I will strictly maintain client privacy and confidentiality.</li>
                <li>I commit to reviewing and approving every consultation assigned to me with full astrological diligence.</li>
                <li>I understand that CosmicTantra provides structured calculation tools, but final human verification is mandatory.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-purple-950/30 border border-[#7C3AED]/40 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-[#7C3AED]"
                checked={form.agreementAccepted}
                onChange={e => setForm({ ...form, agreementAccepted: e.target.checked })}
              />
              <span className="text-xs text-white font-medium leading-normal">
                I accept the platform terms and complete my practitioner onboarding profile.
              </span>
            </label>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="chiti-btn-secondary text-xs py-2 px-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="chiti-btn-primary text-xs py-2 px-5"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!form.agreementAccepted || submitting}
              onClick={handleSubmit}
              className="chiti-btn-primary text-xs py-2 px-6 bg-gradient-to-r from-[#10B981] to-[#059669] disabled:opacity-50"
            >
              {submitting ? 'Saving Profile...' : 'Complete Onboarding ✨'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

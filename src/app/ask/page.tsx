'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, Clock, CheckCircle2, MessageSquare, HelpCircle, ArrowRight, User } from 'lucide-react';
import { getActiveProfile } from '@/lib/profileStore';
import TrustBar from '@/components/visual/TrustBar';

// Loads the Razorpay Checkout script once (client-side only)
let rzpScriptPromise: Promise<any> | null = null;
function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const w = window as any;
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  if (!rzpScriptPromise) {
    rzpScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve((window as any).Razorpay);
      s.onerror = () => reject(new Error('Razorpay checkout failed to load'));
      document.body.appendChild(s);
    });
  }
  return rzpScriptPromise;
}

export default function AskQuestionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showOtpHint, setShowOtpHint] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    birthDate: '1995-06-15',
    birthTime: '10:30',
    birthCity: 'Patna',
    birthLat: 25.5941,
    birthLon: 85.1376,
    timezone: 5.5,
    customerQuestion: '',
  });

  // Prefill from the active family profile (Cosmic Profile)
  useEffect(() => {
    const p = getActiveProfile();
    if (!p) return;
    setForm(f => ({
      ...f,
      customerName: f.customerName || p.name || '',
      birthDate: f.birthDate || p.birthDate || f.birthDate,
      birthTime: f.birthTime || p.birthTime || f.birthTime,
      birthCity: f.birthCity || p.birthCity || f.birthCity,
      birthLat: f.birthLat || p.lat || f.birthLat,
      birthLon: f.birthLon || p.lng || f.birthLon,
      timezone: f.timezone || p.tz || f.timezone,
    }));
  }, []);

  const handlePhoneFocus = () => {
    if (form.customerPhone.length < 10) setShowOtpHint(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.customerQuestion) {
      alert('Please fill in your name, WhatsApp number, and question.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Create Order
      const res = await fetch('/api/astrology/consultations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to submit question');
        setSubmitting(false);
        return;
      }

      if (data.checkoutEnabled && data.razorpayOrderId && data.razorpayKeyId) {
        // Step 2: Real Razorpay Checkout
        const Razorpay = await loadRazorpayCheckout();
        const rzp = new Razorpay({
          key: data.razorpayKeyId,
          order_id: data.razorpayOrderId,
          name: 'CosmicTantra',
          description: 'Vedic Decision Synthesis — शुभ दक्षिणा ₹५०१',
          amount: 50100,
          currency: 'INR',
          prefill: {
            name: form.customerName,
            email: form.customerEmail || undefined,
            contact: form.customerPhone,
          },
          handler: async (response: any) => {
            // Step 3: verify signature server-side, then run the pipeline
            const verifyRes = await fetch('/api/astrology/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                consultationId: data.consultationId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              router.push(`/ask/success/${data.consultationId}`);
            } else {
              alert(verifyData.error || 'Payment verification failed — our team has been notified.');
            }
          },
          modal: { ondismiss: () => setSubmitting(false) },
          theme: { color: '#D4AF37' },
        });
        rzp.on('payment.failed', () => { setSubmitting(false); alert('Payment failed. No money was deducted.'); });
        rzp.open();
      } else {
        // Step 2b: Payment gateway not configured — be honest, never fake success
        setSubmitting(false);
        alert('Order created (ID: ' + data.consultationId + '). Payment gateway is not configured yet — our team will contact you on WhatsApp.');
        return;
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] py-8 px-4 flex flex-col items-center">
      <TrustBar />

      {/* Header */}
      <div className="max-w-lg w-full mb-8 text-center mt-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A78BFA] text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" /> CosmicTantra Jyotish Service
        </div>
        <h1 className="text-4xl font-bold font-editorial tracking-[-1.5px] text-white mb-3">
          Ask One Question
        </h1>
        <p className="text-sm text-[#9CA3AF]">
          Personalised Vedic Kundali analysis by CosmicTantra, verified &amp; approved by an experienced Jyotish practitioner.
        </p>
      </div>

      {/* 4 Value Proposition Cards */}
      <div className="max-w-lg w-full grid grid-cols-2 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="font-bold text-[#F59E0B] flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5" /> 1. What is this?
          </div>
          <p className="text-[11px] text-[#9CA3AF] leading-normal">
            Ask 1 important question about career, business, marriage, or life decisions.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="font-bold text-[#7C3AED] flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 2. What happens?
          </div>
          <p className="text-[11px] text-[#9CA3AF] leading-normal">
            Your Kundali is calculated deterministically and reviewed by a senior Pandit Ji.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="font-bold text-[#10B981] flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-3.5 h-3.5" /> 3. What do I get?
          </div>
          <p className="text-[11px] text-[#9CA3AF] leading-normal">
            A clear written astrological consultation delivered directly on your WhatsApp.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div className="font-bold text-white flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-[#F59E0B]" /> 4. How long?
          </div>
          <p className="text-[11px] text-[#9CA3AF] leading-normal">
            Standard 4 to 12-hour practitioner review & delivery window.
          </p>
        </div>
      </div>

      {/* Main Order Form */}
      <div className="max-w-lg w-full chiti-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Your Full Name *</label>
            <input
              type="text"
              required
              className="chiti-input"
              value={form.customerName}
              onChange={e => setForm({ ...form, customerName: e.target.value })}
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">WhatsApp Phone Number *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  className="chiti-input pr-10"
                  value={form.customerPhone}
                  onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                  onFocus={handlePhoneFocus}
                  placeholder="+91 98765 43210"
                />
                {showOtpHint && (
                  <a href="/profile" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:text-white">
                    <User className="w-4 h-4" />
                  </a>
                )}
              </div>
              <span className="text-[10px] text-[#6B7280]">Your consultation report will be delivered here. <span className="text-[#D4AF37]">Verify for faster delivery →</span></span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Email Address (Optional)</label>
              <input
                type="email"
                className="chiti-input"
                value={form.customerEmail}
                onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="rahul@gmail.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Birth Date *</label>
              <input
                type="date"
                required
                className="chiti-input text-xs"
                value={form.birthDate}
                onChange={e => setForm({ ...form, birthDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Time of Birth</label>
              <input
                type="time"
                required
                className="chiti-input text-xs"
                value={form.birthTime}
                onChange={e => setForm({ ...form, birthTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Birthplace</label>
              <input
                type="text"
                required
                className="chiti-input text-xs"
                value={form.birthCity}
                onChange={e => setForm({ ...form, birthCity: e.target.value })}
                placeholder="Patna"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9CA3AF] mb-1">Your Question for Pandit Ji *</label>
            <textarea
              rows={4}
              required
              className="chiti-input text-xs leading-relaxed"
              value={form.customerQuestion}
              onChange={e => setForm({ ...form, customerQuestion: e.target.value })}
              placeholder="e.g. Will changing my business direction in the next six months be favourable for my long-term financial growth?"
            />
          </div>

          {/* Price Bar & Submit */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#9CA3AF]">Consultation Fee:</div>
              <div className="text-2xl font-bold text-white font-display">₹501</div>
              <div className="text-[10px] text-[#10B981]">शुभ दक्षिणा • Includes full Kundali & Pandit Verification</div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="chiti-btn-primary w-full sm:w-auto text-xs py-3 px-6 bg-gradient-to-r from-[#7C3AED] to-[#5B21B6]"
            >
              {submitting ? 'Processing Payment...' : 'Offer शुभ दक्षिणा ₹५०१ & Submit Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

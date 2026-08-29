'use client';

import React, { useState } from 'react';
import { X, Smartphone, CheckCircle } from 'lucide-react';

interface OtpVerificationModalProps {
  phone: string;
  onVerified: (phone: string) => void;
  onClose: () => void;
  purpose?: string;
}

export default function OtpVerificationModal({ phone, onVerified, onClose, purpose = 'PROFILE_VERIFY' }: OtpVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const requestOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('verify');
        if (data.demoOtp) setDemoOtp(data.demoOtp);
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, purpose }),
      });
      const data = await res.json();
      if (data.success) {
        onVerified(phone);
        onClose();
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (e) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF7F2] dark:bg-[#0A0C12] border border-[#D4AF37]/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-[#1C1917]" />
            </div>
            <div>
              <div className="font-semibold text-lg">Verify WhatsApp Number</div>
              <div className="text-xs text-[#857E74]">{phone}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#857E74] hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 'request' && (
            <>
              <div className="text-center">
                <p className="text-sm text-[#57524A] dark:text-[#AAA49A]">
                  We’ll send a 6-digit OTP to your WhatsApp.<br />This verifies your number for Cosmic ID &amp; delivery.
                </p>
              </div>
              <button
                onClick={requestOtp}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : 'Send OTP via WhatsApp'}
              </button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div>
                <label className="block text-xs font-semibold tracking-widest text-[#8E6F1D] mb-1.5">ENTER 6-DIGIT OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-3xl tracking-[12px] font-mono py-4 rounded-2xl border border-[#D4AF37]/40 bg-white dark:bg-[#11131C] focus:outline-none focus:border-[#D4AF37]"
                  placeholder="000000"
                />
                {demoOtp && (
                  <div className="mt-2 text-center text-xs text-emerald-600 font-mono">Demo OTP: {demoOtp}</div>
                )}
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
                <CheckCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {error && <div className="text-center text-xs text-red-600">{error}</div>}

          <div className="text-[10px] text-center text-[#857E74]">
            DPDP compliant • OTP valid for 5 minutes
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const next = () => setStep(s => Math.min(s + 1, 4));

  return (
    <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-xs tracking-[3px] text-[#8E6F1D]">WELCOME TO COSMICTANTRA</div>
          <h1 className="font-editorial text-4xl font-bold mt-2">Let’s begin your Vedic journey</h1>
        </div>

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl border border-[#8E6F1D]/20">
            <div className="text-sm mb-6">Step 1 of 4 • Your Identity</div>
            <input
              type="text"
              placeholder="Your Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#8E6F1D]/20 rounded-2xl px-5 py-4 mb-4"
            />
            <button onClick={next} className="w-full py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl border border-[#8E6F1D]/20">
            <div className="text-sm mb-6">Step 2 of 4 • WhatsApp Verification</div>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[#8E6F1D]/20 rounded-2xl px-5 py-4 mb-4"
            />
            <button onClick={next} className="w-full py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold flex items-center justify-center gap-2">
              Send OTP <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-8 rounded-3xl border border-[#8E6F1D]/20 text-center">
            <div className="text-sm mb-6">Step 3 of 4 • Profile Created</div>
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="font-semibold text-xl">Welcome, {name}!</div>
            <p className="text-sm text-[#57524A] mt-2">Your Cosmic ID has been created.</p>
            <button onClick={next} className="mt-8 w-full py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold">Continue to Dashboard</button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="text-6xl mb-6">🪔</div>
            <h2 className="font-editorial text-3xl">You’re all set.</h2>
            <p className="mt-3 text-[#57524A]">Your Scholar’s Desk is ready.</p>
            <Link href="/dashboard" className="mt-8 inline-block px-8 py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold">Enter Scholar’s Desk</Link>
          </div>
        )}
      </div>
    </main>
  );
}

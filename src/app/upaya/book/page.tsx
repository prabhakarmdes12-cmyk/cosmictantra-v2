'use client';

import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function UpayaBookingFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gotra: '',
    date: '',
    notes: '',
    remedy: 'Blue Sapphire 4.25ct',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-lg mx-auto">
        <Link href="/upaya" className="flex items-center gap-2 text-sm text-[#8E6F1D] mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Upaya Partners
        </Link>

        {step === 1 && (
          <div>
            <div className="text-xs tracking-[3px] text-[#8E6F1D]">BOOKING • STEP 1 OF 3</div>
            <h1 className="font-editorial text-4xl font-bold mt-3">Book Your Remedy</h1>
            <p className="mt-2 text-[#57524A]">Please fill the details for your selected Upaya.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="text-xs text-[#857E74]">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full mt-1 border border-[#8E6F1D]/20 rounded-2xl px-5 py-3" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-[#857E74]">WhatsApp Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full mt-1 border border-[#8E6F1D]/20 rounded-2xl px-5 py-3" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-[#857E74]">Gotra (if known)</label>
                <input 
                  type="text" 
                  value={formData.gotra}
                  onChange={(e) => setFormData({...formData, gotra: e.target.value})}
                  className="w-full mt-1 border border-[#8E6F1D]/20 rounded-2xl px-5 py-3" 
                />
              </div>
              <div>
                <label className="text-xs text-[#857E74]">Preferred Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full mt-1 border border-[#8E6F1D]/20 rounded-2xl px-5 py-3" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-[#857E74]">Special Instructions</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full mt-1 border border-[#8E6F1D]/20 rounded-2xl px-5 py-3 h-24" 
                />
              </div>

              <button type="submit" className="w-full py-4 mt-6 bg-[#8E6F1D] text-white rounded-2xl font-semibold">
                Continue to Confirmation
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <div className="text-6xl mb-6">🙏</div>
            <h2 className="font-editorial text-3xl">Almost Done</h2>
            <p className="mt-3">Our team will contact you within 2 hours to confirm the booking.</p>
            <button onClick={() => setStep(3)} className="mt-8 px-8 py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold">Confirm Booking</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-12">
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="font-editorial text-4xl">Booking Confirmed</h2>
            <p className="mt-4 text-[#57524A]">Thank you. Our verified partner will contact you shortly.</p>
            <Link href="/dashboard" className="mt-8 inline-block px-8 py-4 border border-[#8E6F1D]/30 rounded-2xl">Back to Scholar’s Desk</Link>
          </div>
        )}
      </div>
    </main>
  );
}

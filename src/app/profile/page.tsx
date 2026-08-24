'use client';

import React, { useState } from 'react';
import OtpVerificationModal from '@/components/visual/OtpVerificationModal';
import WhatsAppDeliveryCard from '@/components/visual/WhatsAppDeliveryCard';

export default function ProfilePage() {
  const [phone, setPhone] = useState('+919876543210');
  const [showOtp, setShowOtp] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [deliveryDemo, setDeliveryDemo] = useState<any>(null);

  const verifyPhone = () => setShowOtp(true);

  const handleVerified = async (verified: string) => {
    setVerifiedPhone(verified);
    setShowOtp(false);

    // Create / fetch profile
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsappPhone: verified, consentGiven: true }),
    });
    const data = await res.json();
    setProfile(data.profile);
  };

  const simulateDelivery = () => {
    setDeliveryDemo({
      consultationId: 'demo-consult-' + Date.now(),
      customerName: profile?.fullName || 'Demo User',
      customerPhone: verifiedPhone,
      deliveryText: `🕉️ COSMICTANTRA VERIFIED CONSULTATION\n\nHello ${profile?.fullName || 'User'},\n\nYour Kundali Milan report is ready...`,
      whatsappLink: `https://wa.me/${verifiedPhone.replace('+', '')}?text=Demo%20delivery`,
      status: 'DELIVERED',
    });
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-1 rounded-full bg-[#D4AF37]/10 text-[#8E6F1D] text-xs tracking-[3px] font-mono mb-2">COSMIC ID</div>
          <h1 className="font-editorial text-5xl font-bold tracking-tight">Your Vedic Identity</h1>
          <p className="text-[#57524A] mt-2">One WhatsApp number. Infinite family profiles. DPDP compliant.</p>
        </div>

        {!verifiedPhone ? (
          <div className="rounded-3xl border border-[#D4AF37]/30 bg-white dark:bg-[#0A0C12] p-8 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="font-semibold text-2xl mb-3">Connect your WhatsApp</h3>
            <p className="text-sm text-[#57524A] mb-6">OTP verification unlocks your Cosmic ID, family profiles, and instant delivery.</p>

            <div className="max-w-xs mx-auto">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-center py-3.5 rounded-2xl border border-[#D4AF37]/40 text-xl font-mono tracking-widest mb-3"
              />
              <button
                onClick={verifyPhone}
                className="w-full py-4 bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold rounded-2xl text-sm tracking-widest"
              >
                VERIFY WITH OTP
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile card */}
            <div className="rounded-3xl border border-[#D4AF37]/30 bg-white dark:bg-[#0A0C12] p-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs uppercase tracking-[2px] text-[#8E6F1D]">VERIFIED COSMIC ID</div>
                  <div className="font-mono text-3xl tracking-[3px] mt-1 text-[#1C1917] dark:text-white">{verifiedPhone}</div>
                </div>
                <div className="px-4 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium">OTP VERIFIED</div>
              </div>

              {profile && (
                <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 grid grid-cols-2 gap-y-4 text-sm">
                  <div><span className="text-[#857E74]">Consent</span><br />{profile.consentGiven ? 'Given ✓' : 'Pending'}</div>
                  <div><span className="text-[#857E74]">Consent Version</span><br />{profile.consentVersion}</div>
                </div>
              )}
            </div>

            {/* WhatsApp Delivery Demo */}
            <div>
              <button
                onClick={simulateDelivery}
                className="mb-4 px-6 py-2.5 text-xs tracking-widest font-semibold border border-[#D4AF37]/50 rounded-2xl hover:bg-[#D4AF37]/10"
              >
                SIMULATE WHATSAPP DELIVERY
              </button>

              {deliveryDemo && (
                <WhatsAppDeliveryCard
                  {...deliveryDemo}
                  onCopy={() => console.log('Delivery message copied')}
                />
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-3">
              <a href="/family" className="flex-1 py-3 text-center rounded-2xl border border-[#D4AF37]/30 text-sm font-medium hover:bg-[#D4AF37]/5">Manage Family Profiles</a>
              <a href="/my-calendar" className="flex-1 py-3 text-center rounded-2xl border border-[#D4AF37]/30 text-sm font-medium hover:bg-[#D4AF37]/5">Personal Calendar</a>
              <a href="/daily" className="flex-1 py-3 text-center rounded-2xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all">
                🌟 View Daily Forecast
              </a>
            </div>
          </div>
        )}
      </div>

      {showOtp && (
        <OtpVerificationModal
          phone={phone}
          onVerified={handleVerified}
          onClose={() => setShowOtp(false)}
        />
      )}
    </main>
  );
}

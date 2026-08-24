'use client';

import React, { useState } from 'react';
import CosmicIdCard from '@/components/visual/CosmicIdCard';
import WhatsAppDeliveryCard from '@/components/visual/WhatsAppDeliveryCard';
import OtpVerificationModal from '@/components/visual/OtpVerificationModal';
import PaymentTestPanel from '@/components/visual/PaymentTestPanel';

export default function VisualShowcase() {
  const [showOtp, setShowOtp] = useState(false);
  const [demoProfile, setDemoProfile] = useState({
    whatsappPhone: '+919876543210',
    fullName: 'Priya Sharma',
    cosmicId: 'CT-4821',
    consentGiven: true,
    familyMembersCount: 4,
  });

  const [deliveryDemo] = useState({
    consultationId: 'demo-consult-20260825',
    customerName: 'Priya Sharma',
    customerPhone: '+919876543210',
    deliveryText: `🕉️ COSMICTANTRA VERIFIED JYOTISH CONSULTATION\n\nHello Priya,\n\nYour verified Kundali Milan report (36 points) is ready. Mangal Dosh: Mild. Strong Bhakoot & Gana compatibility.\n\nRecommended Muhurat: 14th Sept 2026 (Abhijit)...`,
    whatsappLink: 'https://wa.me/919876543210?text=Demo%20CosmicTantra%20Delivery',
    status: 'DELIVERED' as const,
  });

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Header */}
        <div className="text-center mb-14">
          <div className="inline px-5 py-1 text-xs tracking-[4px] rounded-full bg-[#D4AF37]/10 text-[#8E6F1D] font-mono">PHASE 1 + PHASE 2 • VISUAL SYSTEM</div>
          <h1 className="font-editorial text-7xl font-bold tracking-[-3px] mt-4">Vedic Design System</h1>
          <p className="max-w-md mx-auto mt-3 text-xl text-[#57524A]">Elegant, trustworthy, India-native interfaces for CosmicTantra</p>
          <div className="flex justify-center gap-3 mt-6">
            <a href="/profile" className="px-6 py-3 rounded-2xl bg-[#1C1917] text-white text-sm font-semibold">Open Profile Experience →</a>
            <a href="/payments/test" className="px-6 py-3 rounded-2xl border border-[#D4AF37]/40 text-sm font-semibold">Payments Test Suite</a>
          </div>
        </div>

        {/* Cosmic ID Card */}
        <div className="mb-16">
          <div className="mb-4 text-xs tracking-[2px] text-[#8E6F1D] font-mono">PREMIUM IDENTITY</div>
          <CosmicIdCard profile={demoProfile} onManageFamily={() => window.location.href = '/family'} />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* WhatsApp Delivery Card */}
          <div>
            <div className="mb-4 text-xs tracking-[2px] text-[#8E6F1D] font-mono">WHATSAPP DELIVERY (PHASE 1)</div>
            <WhatsAppDeliveryCard {...deliveryDemo} />
          </div>

          {/* OTP Modal Trigger */}
          <div className="rounded-3xl border border-[#D4AF37]/30 bg-white dark:bg-[#0A0C12] p-8 flex flex-col justify-center">
            <div className="mb-4 text-xs tracking-[2px] text-[#8E6F1D] font-mono">OTP VERIFICATION (PHASE 2)</div>
            <h3 className="font-semibold text-2xl mb-2">Secure Phone Verification</h3>
            <p className="text-sm text-[#57524A]">Elegant modal with 6-digit OTP, demo mode, DPDP consent, and instant profile creation.</p>
            <button 
              onClick={() => setShowOtp(true)} 
              className="mt-6 self-start px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#8E6F1D] to-[#D4AF37] text-[#060709] font-bold text-sm"
            >
              OPEN OTP VERIFICATION MODAL
            </button>
          </div>
        </div>

        {/* Payments Panel */}
        <div className="mb-16">
          <div className="mb-4 text-xs tracking-[2px] text-[#8E6F1D] font-mono">PAYMENT TEST SUITE (PHASE 1)</div>
          <PaymentTestPanel />
        </div>

        {/* Quick Links */}
        <div className="text-center text-xs text-[#857E74]">
          All components are fully responsive, accessible, and follow the CosmicTantra visual language.<br />
          Ready for production use.
        </div>
      </div>

      {showOtp && (
        <OtpVerificationModal
          phone={demoProfile.whatsappPhone}
          onVerified={(p) => {
            alert('OTP verified! Profile created.');
            setShowOtp(false);
          }}
          onClose={() => setShowOtp(false)}
        />
      )}
    </main>
  );
}

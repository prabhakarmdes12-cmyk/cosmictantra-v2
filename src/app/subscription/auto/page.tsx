'use client';

import React, { useState } from 'react';

export default function SubscriptionAutoDelivery() {
  const [enabled, setEnabled] = useState(true);

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-editorial text-5xl font-bold">Auto-Delivery Settings</h1>
          <p className="mt-3 text-[#57524A]">Your daily Vedic intelligence, automatically delivered.</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="font-semibold text-xl">Daily WhatsApp Digest</div>
              <div className="text-sm text-[#857E74]">Sent every morning at 7:00 AM</div>
            </div>
            <button 
              onClick={() => setEnabled(!enabled)}
              className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${enabled ? 'bg-[#8E6F1D]' : 'bg-gray-200'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${enabled ? 'ml-auto' : ''}`} />
            </button>
          </div>

          <div className="space-y-6 text-sm">
            <div className="flex justify-between">
              <span>Include Family Members</span>
              <span className="font-medium">All 4 profiles</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Time</span>
              <span className="font-medium">07:00 AM IST</span>
            </div>
            <div className="flex justify-between">
              <span>Content</span>
              <span className="font-medium">Panchang + Auspicious Score + Upaya</span>
            </div>
          </div>

          <button className="mt-10 w-full py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold">
            Save Preferences
          </button>
        </div>
      </div>
    </main>
  );
}

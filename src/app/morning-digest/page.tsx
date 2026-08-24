'use client';

import React from 'react';
import { Sun, Clock, Star } from 'lucide-react';

export default function MorningDigestSimulator() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline px-4 py-1 rounded-full bg-[#8E6F1D]/10 text-[#8E6F1D] text-xs tracking-widest">RETENTION FEATURE</div>
          <h1 className="font-editorial text-4xl font-bold mt-3">Daily WhatsApp Digest</h1>
          <p className="text-sm text-[#57524A] mt-2">Preview of what reaches the seeker every morning at 7:00 AM</p>
        </div>

        {/* WhatsApp Style Card */}
        <div className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-[#25D366] rounded-full flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-semibold">CosmicTantra • प्रातः संदेश</div>
              <div className="text-xs text-[#857E74]">Today • 07:00 AM</div>
            </div>
          </div>

          <div className="space-y-5 text-sm">
            <div>
              <div className="font-semibold text-[#8E6F1D]">नमस्ते Priya Sharma 🙏</div>
              <div className="mt-1">आज का आपका व्यक्तिगत पञ्चाङ्ग:</div>
            </div>

            <div className="pl-4 border-l-2 border-[#8E6F1D]/30">
              <div><strong>तिथि:</strong> शुक्ल एकादशी</div>
              <div><strong>नक्षत्र:</strong> रोहिणी</div>
              <div><strong>योग:</strong> विष्कम्भ</div>
              <div><strong>राहुकाल:</strong> 09:00–10:30 (वर्ज्य)</div>
              <div><strong>अभिजित:</strong> 11:45–12:30 (श्रेष्ठ)</div>
            </div>

            <div className="pt-3 border-t">
              <div className="font-semibold">आज का उपाय:</div>
              <div className="text-[#57524A]">श्री सूक्त का ११ बार जप सूर्योदय से पहले करें।</div>
            </div>

            <div className="text-xs text-[#857E74] pt-4 border-t">
              CosmicTantra • शुभ दक्षिणा ₹५०१
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#857E74] mt-8">This is a simulated preview. Real delivery coming via WhatsApp Business API.</p>
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';

const regionalData = {
  tamil: {
    name: 'தமிழ் (Tamil)',
    panchang: 'பஞ்சாங்கம்',
    tithi: 'திதி',
    nakshatra: 'நட்சத்திரம்',
    rahuKaal: 'ராகு காலம்',
    abhijit: 'அபிஜித் முகூர்த்தம்',
    note: 'Vakya vs Drik Panchangam • Traditional Tamil Nadu conventions',
  },
  gujarati: {
    name: 'ગુજરાતી (Gujarati)',
    panchang: 'પંચાંગ',
    tithi: 'તિથિ',
    nakshatra: 'નક્ષત્ર',
    rahuKaal: 'રાહુકાળ',
    abhijit: 'અભિજિત મુહૂર્ત',
    note: 'Choghadiya-primary daily decision rhythms',
  },
  bengali: {
    name: 'বাংলা (Bengali)',
    panchang: 'পঞ্জিকা',
    tithi: 'তিথি',
    nakshatra: 'নক্ষত্র',
    rahuKaal: 'রাহুকাল',
    abhijit: 'অভিজিৎ মুহূর্ত',
    note: 'Panjika conventions • Tithi sunrise rules',
  },
};

export default function RegionalLanguages() {
  const [active, setActive] = useState<'tamil' | 'gujarati' | 'bengali'>('tamil');
  const data = regionalData[active];

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs tracking-[3px] text-[#8E6F1D]">REGIONAL TRADITIONS</div>
          <h1 className="font-editorial text-5xl font-bold mt-2">Vedic Time Across Bharat</h1>
          <p className="mt-3 text-[#57524A]">Honoring diverse regional Jyotish traditions with authentic terminology.</p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          {Object.keys(regionalData).map((key) => (
            <button
              key={key}
              onClick={() => setActive(key as any)}
              className={`px-5 py-2 rounded-2xl text-sm font-medium border transition-all ${active === key ? 'bg-[#8E6F1D] text-white border-[#8E6F1D]' : 'border-[#8E6F1D]/20'}`}
            >
              {regionalData[key as keyof typeof regionalData].name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-[#8E6F1D]/25 bg-white p-10">
          <div className="text-2xl font-bold mb-2">{data.name}</div>
          <div className="text-sm text-[#857E74] mb-8">{data.note}</div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div><span className="text-[#857E74]">Panchang</span><br /><span className="font-semibold text-xl">{data.panchang}</span></div>
            <div><span className="text-[#857E74]">Tithi</span><br /><span className="font-semibold text-xl">{data.tithi}</span></div>
            <div><span className="text-[#857E74]">Nakshatra</span><br /><span className="font-semibold text-xl">{data.nakshatra}</span></div>
            <div><span className="text-[#857E74]">Rahu Kaal</span><br /><span className="font-semibold text-xl text-rose-700">{data.rahuKaal}</span></div>
            <div><span className="text-[#857E74]">Abhijit</span><br /><span className="font-semibold text-xl text-emerald-700">{data.abhijit}</span></div>
          </div>
        </div>

        <p className="text-center text-xs text-[#857E74] mt-8">CosmicTantra respects all regional Jyotish traditions equally.</p>
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';

export default function PersonalizedMuhurat() {
  const [birthDate, setBirthDate] = useState('1995-06-15');
  const [eventType, setEventType] = useState('Marriage');

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs tracking-[3px] text-[#8E6F1D]">MUHURAT SHASHTRA</div>
          <h1 className="font-editorial text-5xl font-bold mt-3">Personal Muhurat Finder</h1>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-[#8E6F1D]/20">
          <div className="space-y-6">
            <div>
              <label className="text-xs text-[#857E74]">Your Birth Date</label>
              <input 
                type="date" 
                value={birthDate} 
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full mt-1 border border-[#8E6F1D]/20 rounded-2xl px-5 py-3" 
              />
            </div>
            
            <div>
              <label className="text-xs text-[#857E74]">Event Type</label>
              <select 
                value={eventType} 
                onChange={(e) => setEventType(e.target.value)}
                className="w-full mt-1 border border-[#8E6F1D]/20 rounded-2xl px-5 py-3"
              >
                <option>Marriage</option>
                <option>Griha Pravesh</option>
                <option>Business Opening</option>
                <option>Naming Ceremony</option>
              </select>
            </div>
          </div>

          <button className="mt-8 w-full py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold">
            Find Best Muhurat
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-[#857E74]">
          Results will be personalized using your Janma Kundali
        </div>
      </div>
    </main>
  );
}

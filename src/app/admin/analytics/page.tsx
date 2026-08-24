'use client';

import React from 'react';
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-editorial text-4xl font-bold mb-8">Admin Analytics Dashboard</h1>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-[#8E6F1D]/20">
            <div className="flex items-center gap-3 text-[#8E6F1D]">
              <Users className="w-5 h-5" /> <span className="text-sm">Total Seekers</span>
            </div>
            <div className="text-5xl font-bold mt-4">1,284</div>
            <div className="text-xs text-emerald-600 mt-1">+18% from last month</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#8E6F1D]/20">
            <div className="flex items-center gap-3 text-[#8E6F1D]">
              <DollarSign className="w-5 h-5" /> <span className="text-sm">Revenue (This Month)</span>
            </div>
            <div className="text-5xl font-bold mt-4">₹4,82,000</div>
            <div className="text-xs text-emerald-600 mt-1">+24% from last month</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#8E6F1D]/20">
            <div className="flex items-center gap-3 text-[#8E6F1D]">
              <Award className="w-5 h-5" /> <span className="text-sm">Folios Delivered</span>
            </div>
            <div className="text-5xl font-bold mt-4">312</div>
            <div className="text-xs text-emerald-600 mt-1">+12% from last month</div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-[#8E6F1D]/20">
            <div className="flex items-center gap-3 text-[#8E6F1D]">
              <TrendingUp className="w-5 h-5" /> <span className="text-sm">Upaya Bookings</span>
            </div>
            <div className="text-5xl font-bold mt-4">89</div>
            <div className="text-xs text-emerald-600 mt-1">+31% from last month</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-8">
          <div className="font-semibold mb-6">Top Performing Upaya Categories</div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Gemstones</span>
              <span className="font-semibold">42%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Pooja & Anusthan</span>
              <span className="font-semibold">31%</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Rudraksha</span>
              <span className="font-semibold">27%</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

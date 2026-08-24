'use client';

import React from 'react';

export default function PartnerDashboard() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-editorial text-4xl font-bold mb-2">Partner Dashboard</h1>
        <div className="text-sm text-[#857E74] mb-10">Welcome, Kashi Ratna Bhandar</div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-[#8E6F1D]/20">
            <div className="font-semibold">Active Bookings</div>
            <div className="text-5xl font-bold mt-4">14</div>
            <div className="text-sm text-[#857E74] mt-1">This month</div>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-[#8E6F1D]/20">
            <div className="font-semibold">Pending Orders</div>
            <div className="text-5xl font-bold mt-4">3</div>
            <div className="text-sm text-[#857E74] mt-1">Awaiting confirmation</div>
          </div>
        </div>

        <div className="mt-10 bg-white p-8 rounded-3xl border border-[#8E6F1D]/20">
          <div className="font-semibold mb-6">Recent Orders</div>
          <div className="text-sm text-[#57524A]">No recent activity. New bookings will appear here.</div>
        </div>
      </div>
    </main>
  );
}

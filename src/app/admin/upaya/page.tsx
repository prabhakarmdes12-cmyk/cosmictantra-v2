'use client';

import React, { useState } from 'react';

interface PartnerRequest {
  id: number;
  name: string;
  category: string;
  location: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const initialRequests: PartnerRequest[] = [
  { id: 1, name: 'Banaras Gems', category: 'Gemstone', location: 'Varanasi', status: 'PENDING' },
  { id: 2, name: 'Nepal Rudraksha House', category: 'Rudraksha', location: 'Kathmandu', status: 'PENDING' },
];

export default function AdminUpayaApproval() {
  const [requests, setRequests] = useState<PartnerRequest[]>(initialRequests);

  const updateStatus = (id: number, status: PartnerRequest['status']) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-editorial text-4xl font-bold mb-8">Admin • Upaya Partner Approval</h1>

        <div className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-8">
          <div className="font-semibold mb-6">Pending Partner Requests</div>
          
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-5 border border-[#8E6F1D]/15 rounded-2xl">
                <div>
                  <div className="font-semibold">{req.name}</div>
                  <div className="text-xs text-[#857E74]">{req.category} • {req.location}</div>
                </div>
                <div className="flex gap-3">
                  {req.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateStatus(req.id, 'APPROVED')} className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-2xl">Approve</button>
                      <button onClick={() => updateStatus(req.id, 'REJECTED')} className="px-5 py-2 text-sm border border-red-200 text-red-600 rounded-2xl">Reject</button>
                    </>
                  )}
                  {req.status !== 'PENDING' && (
                    <div className={`px-4 py-1 text-xs rounded-full ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {req.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

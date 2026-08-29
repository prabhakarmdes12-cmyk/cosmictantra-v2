'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle, Clock } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: string;
  phone: string;
  razorpay?: boolean;
}

export default function PaymentTestPanel() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'dummy' | 'real'>('all');

  const loadPayments = async (type: 'all' | 'dummy' | 'real') => {
    setLoading(true);
    const res = await fetch(`/api/payments/test?type=${type}`);
    const data = await res.json();
    setPayments(data.payments || []);
    setFilter(type);
    setLoading(false);
  };

  return (
    <div className="rounded-3xl border border-[#D4AF37]/30 bg-white dark:bg-[#0A0C12] p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-semibold text-xl flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Phase 1 Payment Test Suite
          </div>
          <div className="text-xs text-[#857E74]">10 dummy + 5 real Razorpay test payments</div>
        </div>
        <div className="flex gap-2 text-xs">
          {(['all', 'dummy', 'real'] as const).map(t => (
            <button
              key={t}
              onClick={() => loadPayments(t)}
              className={`px-4 py-1.5 rounded-full border transition-all ${filter === t ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-[#D4AF37]/30 hover:bg-[#D4AF37]/10'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {payments.length > 0 && (
        <div className="space-y-2 text-sm">
          {payments.map((p, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border border-[#D4AF37]/10 px-4 py-3 bg-[#FAF7F2] dark:bg-[#11131C]">
              <div className="font-mono text-xs tracking-widest">{p.id}</div>
              <div className="flex items-center gap-4">
                <div>₹{p.amount}</div>
                <div className={`px-3 py-0.5 rounded-full text-xs ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : p.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  {p.status}
                </div>
                {p.razorpay && <div className="text-[#25D366] text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> REAL</div>}
                <div className="font-mono text-[#857E74] text-xs">{p.phone}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!payments.length && (
        <button onClick={() => loadPayments('all')} className="mt-4 w-full py-4 border border-dashed border-[#D4AF37]/40 rounded-2xl text-sm text-[#8E6F1D]">
          Load 15 Test Payments
        </button>
      )}
    </div>
  );
}

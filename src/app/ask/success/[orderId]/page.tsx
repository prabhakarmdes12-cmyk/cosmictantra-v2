'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, CheckCircle2, Clock, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        const res = await fetch('/api/astrology/consultations');
        const data = await res.json();
        if (data.success && data.consultations) {
          const found = data.consultations.find((c: any) => c.id === orderId);
          if (found) setOrder(found);
        }
      } catch (err) {
        console.error('Failed to fetch order confirmation:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030108] text-[#E2D9F3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#9CA3AF]">Verifying your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030108] text-[#E2D9F3] py-12 px-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full chiti-card p-8 text-center animate-fade-in space-y-6">
        <div className="w-20 h-20 bg-[#10B981]/20 border-2 border-[#10B981] rounded-full flex items-center justify-center mx-auto text-4xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          ✨
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 text-[#6EE7B7] text-xs font-semibold uppercase tracking-wider mb-2">
            Payment Verified · Order #{(orderId || '').slice(0, 8)}
          </div>
          <h1 className="text-2xl font-bold font-display text-white mb-1">
            Question Received!
          </h1>
          <p className="text-xs text-[#9CA3AF]">
            Your Vedic Kundali has been calculated and submitted to our practitioner workspace.
          </p>
        </div>

        {order && (
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-[#9CA3AF]">Customer:</span>
              <span className="font-semibold text-white">{order.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-[#9CA3AF]">WhatsApp Phone:</span>
              <span className="font-semibold text-white">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between border-b border-purple-500/10 pb-2">
              <span className="text-[#9CA3AF]">Status:</span>
              <span className="text-[#F59E0B] font-bold">PANDIT REVIEW IN PROGRESS</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9CA3AF]">Assigned Pandit:</span>
              <span className="font-semibold text-[#A78BFA]">{order.practitioner?.displayName || 'Pandit Ramesh Sharma'}</span>
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-[#9CA3AF] text-left space-y-2">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Clock className="w-4 h-4 text-[#F59E0B]" /> Delivery SLA & Next Steps:
          </div>
          <p className="text-[11px] text-[#D1D5DB] leading-relaxed">
            Your birth chart calculations and AI draft are currently undergoing thorough human verification by senior Pandit Ji. You will receive the complete verified written consultation report on WhatsApp within <strong>4 to 12 hours</strong>.
          </p>
        </div>

        <Link href="/ask" className="chiti-btn-secondary text-xs w-full justify-center">
          Ask Another Question
        </Link>
      </div>
    </div>
  );
}

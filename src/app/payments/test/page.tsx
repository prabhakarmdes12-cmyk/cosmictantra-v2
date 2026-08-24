'use client';

import React from 'react';
import PaymentTestPanel from '@/components/visual/PaymentTestPanel';
import WhatsAppDeliveryCard from '@/components/visual/WhatsAppDeliveryCard';

export default function PaymentsTestPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#07080C] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-xs tracking-[4px] font-mono text-[#8E6F1D]">PHASE 1 • DELIVERY + PAYMENTS</div>
          <h1 className="font-editorial text-6xl font-bold tracking-[-1.5px] mt-2">Test Payments &amp; WhatsApp Delivery</h1>
          <p className="mt-3 max-w-md mx-auto text-[#57524A]">10 dummy + 5 real Razorpay test payments • Instant WhatsApp MVP links</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <PaymentTestPanel />
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <WhatsAppDeliveryCard
                consultationId="demo-consult-2026-0825"
                customerName="Priya Sharma"
                customerPhone="+919876543210"
                deliveryText="🕉️ COSMICTANTRA VERIFIED JYOTISH CONSULTATION\n\nHello Priya,\n\nYour verified Kundali Milan report is ready..."
                whatsappLink="https://wa.me/919876543210?text=Demo%20CosmicTantra%20Delivery"
                status="DELIVERED"
              />
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-[#857E74]">
          All test payments are safe. Real Razorpay test mode supported via <code>pay_real_test_*</code> IDs.
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import { ShoppingBag, BellRing, Sparkles, ArrowRight, PhoneCall, Landmark, BookHeart } from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { chitiSensory } from '@/lib/chitiAudio';

/**
 * Vedic Pooja Store & Sacred Samagri — COMING SOON.
 *
 * The storefront (cart, checkout, COD/UPI) is intentionally not live until
 * supplier partnerships are finalised: a working checkout over a placeholder
 * catalogue would let devotees place orders we cannot yet fulfil. This page
 * keeps the promise, collects launch intent via WhatsApp, and points to the
 * live sacred experiences. The full storefront code is preserved in git
 * history (src/app/store/page.tsx) and will be restored when deals close.
 */
export default function StoreComingSoon() {
  const [notified, setNotified] = useState(false);

  const handleNotify = () => {
    chitiSensory.playTick();
    setNotified(true);
    const text =
      '🛍️ नमस्ते CosmicTantra — मुझे पूजा सामग्री प्रतिष्ठान (Vedic Pooja Store) के लॉन्च पर सूचित करें।\n\n🙏 मैं प्रमाणित, परखी हुई पूजा सामग्री की प्रतीक्षा कर रहा/रही हूँ।\n\n(Launch notification request — please add me to the waitlist.)';
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setTimeout(() => setNotified(false), 4000);
  };

  return (
    <CosmicTantraShell>
      <div className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 text-[#8E6F1D] dark:text-[#F0C968] text-[11px] font-mono-data font-bold uppercase tracking-[2px]">
          <BellRing className="w-3.5 h-3.5" />
          Coming Soon • शीघ्र आ रहा है
        </div>

        {/* Heading */}
        <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-white mt-5 tracking-tight">
          Vedic Pooja Store &amp; Sacred Samagri
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-mono-data text-[#57524A] dark:text-[#D1C9BF]">
          वैदिक पूजा सामग्री प्रतिष्ठान
        </p>

        {/* Promise */}
        <div className="mt-8 max-w-2xl mx-auto bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 sm:p-8 shadow-md text-left">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/15 flex items-center justify-center text-[#8E6F1D] dark:text-[#F0C968] shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-editorial font-bold text-lg sm:text-xl text-[#1C1917] dark:text-white">
                We are preparing the store with care — not with a placeholder catalogue.
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-6 text-[#57524A] dark:text-[#D1C9BF]">
                Every item we list must be authentic, quality-tested, and sourced through verified
                suppliers — from solid-brass Akhand Diyas and Bhimseni camphor to certified
                gemstones and A2 Bilona ghee. We are finalising those partnerships right now so
                that when the store opens, your order is sacred work we can truly honour.
              </p>
              <p className="mt-2 text-xs sm:text-sm leading-6 text-[#57524A] dark:text-[#D1C9BF]">
                जब प्रतिष्ठान खुलेगा तो हर वस्तु प्रमाणित, परखी हुई और श्रद्धा के साथ भेजी जाएगी —
                हम किसी भी ऑर्डर को अधूरा नहीं छोड़ेंगे।
              </p>
            </div>
          </div>

          {/* Notify CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center">
            <button
              onClick={handleNotify}
              className="w-full sm:w-auto px-6 py-3 text-xs font-mono-data font-bold rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <BellRing className="w-4 h-4" />
              {notified ? '✓ WhatsApp opened — thank you!' : 'Notify me on launch (WhatsApp)'}
            </button>
            <span className="text-[10px] font-mono-data text-[#A8A29E]">
              No spam — one message when we open.
            </span>
          </div>
        </div>

        {/* Live alternatives */}
        <div className="mt-10">
          <div className="text-[11px] font-mono-data uppercase tracking-[2px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
            इस बीच आप यह कर सकते हैं • While you wait
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-left">
            {[
              {
                href: '/darshan',
                icon: Landmark,
                title: 'Live Darshan & दीपदान',
                detail: 'Ring the bell, blow the shankh, light a diya at 12 Jyotirlingas & 52 Shakti Peeths — live now.',
              },
              {
                href: '/remedy-tracker',
                icon: BookHeart,
                title: 'Sankalpa & Japa Tracker',
                detail: 'Begin a 40-day Sankalpa, build your mantra streak, set a Sandhya reminder — live now.',
              },
              {
                href: '/ask',
                icon: PhoneCall,
                title: 'Ask a Jyotishi',
                detail: 'Written scholarly folio or private voice consult with Banaras scholars — live now.',
              },
            ].map(({ href, icon: Icon, title, detail }) => (
              <a
                key={href}
                href={href}
                onClick={() => chitiSensory.playTick()}
                className="group rounded-2xl border border-black/10 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] p-5 hover:-translate-y-0.5 hover:border-[#8E6F1D]/60 hover:shadow-lg transition-all"
              >
                <Icon className="mb-3 h-5 w-5 text-[#8E6F1D] dark:text-[#D4AF37]" />
                <h3 className="text-sm font-bold text-[#1C1917] dark:text-white">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#696256] dark:text-[#AAA397]">{detail}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">
                  Open <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
            ))}
          </div>
        </div>

        <p className="mt-12 text-[10px] font-mono-data text-[#A8A29E]">
          <Sparkles className="w-3 h-3 inline mr-1" />
          The full storefront (cart &amp; checkout) is preserved in our repository and returns the moment supplier partnerships are finalised.
        </p>
      </div>
    </CosmicTantraShell>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, ShieldCheck, Heart, Home, Briefcase, Car, Sparkles, Compass } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

const EVENTS = [
  { icon: '💒', title: 'Marriage (Vivah)', status: 'PRACTITIONER_ASSISTED', desc: 'Personalised auspicious lagna & rasi matching for wedding ceremony.' },
  { icon: '🏡', title: 'Griha Pravesh', status: 'PRACTITIONER_ASSISTED', desc: 'Housewarming timing based on lunar tithi & solar transit.' },
  { icon: '🚀', title: 'Business Launch', status: 'PRACTITIONER_ASSISTED', desc: 'Auspicious timing for shop, company, or digital product launch.' },
  { icon: '🔑', title: 'Property Purchase', status: 'PRACTITIONER_ASSISTED', desc: 'Signing land agreements & deed registration timing.' },
  { icon: '🚗', title: 'Vehicle Delivery', status: 'PRACTITIONER_ASSISTED', desc: 'Taking delivery of new car/vehicle during favorable hora.' },
  { icon: '👶', title: 'Naming Ceremony', status: 'PRACTITIONER_ASSISTED', desc: 'Namakaran muhurat calculated from birth nakshatra letter.' },
  { icon: '✈️', title: 'Long Distance Travel', status: 'PRACTITIONER_ASSISTED', desc: 'Avoiding Rahu Kalam & Disha Shoola for safe journeys.' },
  { icon: '🪔', title: 'Sacred Puja & Havan', status: 'PRACTITIONER_ASSISTED', desc: 'Setting auspicious altar & havan timing for spiritual grace.' },
];

export default function MuhuratDiscovery() {
  const handleCategoryClick = (category: string) => {
    trackEvent('MUHURAT_CATEGORY_SELECTED', { category });
  };

  return (
    <section id="muhurat" className="py-16 px-4 max-w-6xl mx-auto border-b border-purple-500/20 font-body">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <div className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest">
          AUSPICIOUS TIMING SELECTION
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold font-display text-white">
          Some moments deserve the right beginning.
        </h2>
        <p className="text-xs sm:text-sm text-[#9CA3AF]">
          Personalised Muhurat calculations require full chart alignment and are reviewed by experienced Jyotish practitioners.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {EVENTS.map((item, idx) => (
          <div key={idx} className="chiti-card p-5 space-y-3 flex flex-col justify-between bg-black/60">
            <div className="space-y-2">
              <div className="text-2xl">{item.icon}</div>
              <h3 className="text-base font-bold text-white font-display">{item.title}</h3>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">{item.desc}</p>
            </div>

            <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
              <span className="text-[10px] text-[#A78BFA] font-semibold uppercase tracking-wider bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20 w-fit">
                Practitioner-Assisted
              </span>
              <Link
                href="/ask"
                onClick={() => handleCategoryClick(item.title)}
                className="text-xs font-bold text-[#F59E0B] hover:text-white flex items-center gap-1 transition-colors"
              >
                Request Muhurat — ₹199 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

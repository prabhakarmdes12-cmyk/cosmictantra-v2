'use client';

import React, { useState } from 'react';
import { Gem, Award, Clock, MapPin, CheckCircle, ArrowRight, ShieldAlert, Sparkles, X } from 'lucide-react';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';

interface RemedyItem {
  id: number;
  category: 'Gemstone' | 'Rudraksha' | 'Pooja';
  name: string;
  title: string;
  indicativePrice: string;
  traditionalRegion: string;
  specStandard: string;
  description: string;
}

const remedyDirectory: RemedyItem[] = [
  {
    id: 1,
    category: 'Gemstone',
    name: 'Natural Blue Sapphire (Neelam)',
    title: 'Lab-Certified Unheated Blue Sapphire',
    indicativePrice: '₹12,500 – ₹28,000 (Market Standard)',
    traditionalRegion: 'Varanasi Gemological Hub',
    specStandard: 'GIA / IGI Optical Spectrum & Refraction Tested',
    description: 'Natural Jyotish-grade Neelam for Saturn (Shani) pacification and focus enhancement. Must be tested before wearing.',
  },
  {
    id: 2,
    category: 'Rudraksha',
    name: '14 Mukhi Deva Mani Rudraksha',
    title: 'Authentic Nepali 14 Mukhi Bead',
    indicativePrice: '₹3,800 – ₹7,500 (Authentic Grade)',
    traditionalRegion: 'Haridwar / Kashi Corridor',
    specStandard: 'High-Resolution X-Ray Compartment Verified',
    description: 'Rare 14 Mukhi Rudraksha symbolizing Lord Shiva and Hanuman. Known for awakening third-eye intuition and courage.',
  },
  {
    id: 3,
    category: 'Pooja',
    name: 'Shani Shanti Vedic Anusthan',
    title: 'Traditional Shani Shanti Japa & Yajna',
    indicativePrice: '₹5,500 – ₹12,000 (Samagri & Acharya Dakshina)',
    traditionalRegion: 'Kashi Vishwanath Corridor',
    specStandard: 'Conducted by Sampurnanand Vetted Acharyas',
    description: 'Classical 23,000 Shani Gayatri Japa with dashansh havan performed under strict scriptural vidhi for Sade Sati relief.',
  },
];

export default function UpayaPage() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Gemstone' | 'Rudraksha' | 'Pooja'>('All');
  const [selectedItem, setSelectedItem] = useState<RemedyItem | null>(null);
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  const filtered = selectedCategory === 'All' 
    ? remedyDirectory 
    : remedyDirectory.filter(p => p.category === selectedCategory);

  return (
    <CosmicTantraShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header with High-Contrast Typography */}
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-xs font-mono-data font-bold tracking-[2px]">
            PARTNER NETWORK — ONBOARDING UNDERWAY
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] tracking-tight mt-3">
            Authentic Remedies & Upaya Directory
          </h1>
          <p className="mt-3 text-sm sm:text-base font-mono-data text-[#57524A] dark:text-[#D1C9BF] max-w-2xl mx-auto">
            Traditional gems, authentic Rudraksha beads, and temple anushthans sourced with rigorous material certification and scriptural integrity.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {(['All', 'Gemstone', 'Rudraksha', 'Pooja'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-mono-data font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] shadow-md' 
                  : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[#44403C] dark:text-[#D1C9BF] hover:border-[#8E6F1D]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Remedy Directory Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(item => (
            <div 
              key={item.id} 
              onClick={() => { setSelectedItem(item); setInterestSubmitted(false); }}
              className="bg-white dark:bg-[#0E101D] rounded-3xl border border-[#8E6F1D]/25 dark:border-[#D4AF37]/30 p-6 hover:border-[#8E6F1D] cursor-pointer transition-all shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    {item.category === 'Gemstone' && <Gem className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />}
                    {item.category === 'Rudraksha' && <Award className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />}
                    {item.category === 'Pooja' && <Clock className="w-4 h-4 text-[#8E6F1D] dark:text-[#D4AF37]" />}
                    <span className="text-xs font-mono-data font-bold text-[#8E6F1D] dark:text-[#F0C968]">{item.category}</span>
                  </div>
                  <span className="text-[10px] font-mono-data px-2.5 py-0.5 bg-[#8E6F1D]/10 dark:bg-[#D4AF37]/15 text-[#8E6F1D] dark:text-[#F0C968] rounded-full font-bold">
                    Vetted Standard
                  </span>
                </div>

                <div className="mt-4">
                  <h2 className="font-editorial text-xl font-bold text-[#1C1917] dark:text-white group-hover:text-[#8E6F1D] transition-colors">
                    {item.name}
                  </h2>
                  <p className="text-xs font-mono-data text-[#57524A] dark:text-[#B3ADA3] mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between text-xs font-mono-data mb-4">
                  <div>
                    <span className="text-[#696256] dark:text-[#9E988D] block text-[10px]">Reference Cost:</span>
                    <strong className="text-[#8E6F1D] dark:text-[#F0C968]">{item.indicativePrice}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[#696256] dark:text-[#9E988D] block text-[10px]">Tradition Hub:</span>
                    <span className="text-[#1C1917] dark:text-white font-medium">{item.traditionalRegion}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedItem(item)}
                  className="w-full py-2.5 rounded-xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 text-xs font-mono-data font-bold text-[#1C1917] dark:text-white group-hover:bg-[#8E6F1D] group-hover:text-white dark:group-hover:bg-[#D4AF37] dark:group-hover:text-[#060709] transition-all bg-white/70 dark:bg-white/5"
                >
                  Register Interest / Details →
                </button>
              </div>
            </div>
          ))}

        </div>

        {/* Modal for Inquiries */}
        {selectedItem && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" 
            onClick={() => setSelectedItem(null)}
          >
            <div 
              className="bg-white dark:bg-[#0E101D] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 shadow-2xl relative" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-5 right-5 p-1 rounded-full text-[#696256] hover:text-[#1C1917] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-xs font-mono-data uppercase tracking-[2px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
                {selectedItem.category} SPECIFICATION
              </div>
              <h2 className="font-editorial text-2xl font-bold text-[#1C1917] dark:text-white mt-1">
                {selectedItem.name}
              </h2>

              <div className="mt-6 space-y-3 text-xs font-mono-data text-[#1C1917] dark:text-[#E7E5E4]">
                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5">
                  <span className="text-[#696256] dark:text-[#9E988D] block text-[10px]">Verification Standard:</span>
                  <strong>{selectedItem.specStandard}</strong>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#070912] border border-black/5 dark:border-white/5">
                  <div>
                    <span className="text-[#696256] dark:text-[#9E988D] block text-[10px]">Indicative Range:</span>
                    <strong>{selectedItem.indicativePrice}</strong>
                  </div>
                  <div>
                    <span className="text-[#696256] dark:text-[#9E988D] block text-[10px]">Sourcing Hub:</span>
                    <strong>{selectedItem.traditionalRegion}</strong>
                  </div>
                </div>
              </div>

              {!interestSubmitted ? (
                <button 
                  onClick={() => setInterestSubmitted(true)}
                  className="mt-6 w-full py-3.5 bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] rounded-2xl font-mono-data font-bold text-xs hover:bg-[#A35C15] dark:hover:bg-[#E5C378] transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Register Interest with Vetted Acharya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono-data text-[#065F46] dark:text-[#10B981] text-center font-bold">
                  ✓ Interest registered! You will be notified once partner sourcing opens.
                </div>
              )}

              <p className="text-center text-[11px] font-mono-data text-[#696256] dark:text-[#9E988D] mt-4">
                CosmicTantra enforces rigorous laboratory and scriptural verification prior to fulfillment.
              </p>
            </div>
          </div>
        )}
      </div>
    </CosmicTantraShell>
  );
}


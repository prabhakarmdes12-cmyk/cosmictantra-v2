'use client';

import React, { useState } from 'react';
import { Gem, Award, Clock, MapPin, Star, ArrowRight } from 'lucide-react';

interface Partner {
  id: number;
  category: 'Gemstone' | 'Rudraksha' | 'Pooja';
  name: string;
  title: string;
  priceRange: string;
  location: string;
  rating: number;
  verified: boolean;
  description: string;
  certification?: string;
}

const partners: Partner[] = [
  {
    id: 1,
    category: 'Gemstone',
    name: 'Kashi Ratna Bhandar',
    title: 'Certified Blue Sapphire (Neelam)',
    priceRange: '₹12,500 – ₹28,000',
    location: 'Varanasi',
    rating: 4.9,
    verified: true,
    description: 'Lab-certified natural Neelam with full authenticity report.',
    certification: 'GIA + IGI Certified',
  },
  {
    id: 2,
    category: 'Rudraksha',
    name: 'Shri Rudraksha Kendra',
    title: '14 Mukhi Rudraksha',
    priceRange: '₹3,800 – ₹7,500',
    location: 'Haridwar',
    rating: 4.8,
    verified: true,
    description: 'Premium Nepali 14 Mukhi with X-ray certificate.',
    certification: 'X-ray Verified',
  },
  {
    id: 3,
    category: 'Pooja',
    name: 'Kashi Vishwanath Seva Samiti',
    title: 'Shani Shanti Anusthan',
    priceRange: '₹5,500 – ₹12,000',
    location: 'Kashi Vishwanath Temple',
    rating: 4.95,
    verified: true,
    description: 'Traditional Shani Shanti performed by experienced temple Pandits.',
    certification: 'Temple Authorized',
  },
];

export default function UpayaPage() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Gemstone' | 'Rudraksha' | 'Pooja'>('All');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const filtered = selectedCategory === 'All' 
    ? partners 
    : partners.filter(p => p.category === selectedCategory);

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline px-5 py-1 rounded-full bg-[#8E6F1D]/10 text-[#8E6F1D] text-xs tracking-[3px]">VERIFIED UPAYA PARTNERS</div>
          <h1 className="font-editorial text-6xl font-bold tracking-tight mt-4">Authentic Remedies from Trusted Hands</h1>
          <p className="mt-4 text-xl text-[#57524A]">Genuine gemstones, Rudraksha, and temple rituals — verified by CosmicTantra.</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-3 mb-10">
          {(['All', 'Gemstone', 'Rudraksha', 'Pooja'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-2xl text-sm font-medium border transition-all ${selectedCategory === cat ? 'bg-[#8E6F1D] text-white border-[#8E6F1D]' : 'border-[#8E6F1D]/20'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Partners Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(partner => (
            <div 
              key={partner.id} 
              onClick={() => setSelectedPartner(partner)}
              className="bg-white rounded-3xl border border-[#8E6F1D]/20 p-7 hover:border-[#8E6F1D]/40 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {partner.category === 'Gemstone' && <Gem className="w-5 h-5 text-[#8E6F1D]" />}
                  {partner.category === 'Rudraksha' && <Award className="w-5 h-5 text-[#8E6F1D]" />}
                  {partner.category === 'Pooja' && <Clock className="w-5 h-5 text-[#8E6F1D]" />}
                  <div className="font-semibold">{partner.name}</div>
                </div>
                {partner.verified && <div className="text-[10px] px-3 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Verified</div>}
              </div>

              <div className="mt-6">
                <div className="font-semibold text-xl">{partner.title}</div>
                <div className="text-sm text-[#857E74] mt-1">{partner.description}</div>
              </div>

              <div className="mt-8 flex items-center justify-between text-sm">
                <div>
                  <div className="text-[#857E74]">Price Range</div>
                  <div className="font-semibold">{partner.priceRange}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[#8E6F1D]">
                    <Star className="w-4 h-4 fill-current" /> {partner.rating}
                  </div>
                  <div className="text-xs text-[#857E74]">{partner.location}</div>
                </div>
              </div>

              <button className="mt-6 w-full py-3 rounded-2xl border border-[#8E6F1D]/30 text-sm font-medium group-hover:bg-[#8E6F1D] group-hover:text-white transition-all">
                View Details & Book
              </button>
            </div>
          ))}
        </div>

        {/* Booking Modal */}
        {selectedPartner && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50" onClick={() => setSelectedPartner(null)}>
            <div className="bg-white rounded-3xl max-w-lg w-full p-8" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between">
                <div>
                  <div className="font-bold text-2xl">{selectedPartner.name}</div>
                  <div className="text-sm text-[#857E74]">{selectedPartner.title}</div>
                </div>
                <button onClick={() => setSelectedPartner(null)}>✕</button>
              </div>

              <div className="mt-8 space-y-4 text-sm">
                <div><strong>Price:</strong> {selectedPartner.priceRange}</div>
                <div><strong>Location:</strong> {selectedPartner.location}</div>
                {selectedPartner.certification && <div><strong>Certification:</strong> {selectedPartner.certification}</div>}
                <div className="pt-4 border-t">{selectedPartner.description}</div>
              </div>

              <button 
                onClick={() => {
                  alert(`Thank you! Our team will contact you shortly for ${selectedPartner.title}.`);
                  setSelectedPartner(null);
                }}
                className="mt-8 w-full py-4 bg-[#8E6F1D] text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                Book This Remedy <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-[#857E74] mt-4">CosmicTantra verifies every partner. 100% authentic.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

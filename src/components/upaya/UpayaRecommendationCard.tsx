'use client';

import React from 'react';
import { Gem, Award, Clock, ArrowRight } from 'lucide-react';

interface UpayaRecommendationProps {
  category: 'Gemstone' | 'Rudraksha' | 'Pooja';
  title: string;
  price: string;
  partner: string;
  onBook?: () => void;
}

export default function UpayaRecommendationCard({ 
  category, 
  title, 
  price, 
  partner, 
  onBook 
}: UpayaRecommendationProps) {
  const icon = category === 'Gemstone' ? <Gem className="w-4 h-4" /> : 
               category === 'Rudraksha' ? <Award className="w-4 h-4" /> : 
               <Clock className="w-4 h-4" />;

  return (
    <div className="border border-[#8E6F1D]/20 rounded-2xl p-5 bg-white">
      <div className="flex items-center gap-2 text-[#8E6F1D] text-xs font-medium">
        {icon} {category.toUpperCase()}
      </div>
      <div className="font-semibold mt-3">{title}</div>
      <div className="text-sm text-[#857E74] mt-1">{partner}</div>
      
      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-[#857E74]">Price</div>
          <div className="font-semibold">{price}</div>
        </div>
        <button 
          onClick={onBook}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-[#8E6F1D]/30 hover:bg-[#8E6F1D] hover:text-white transition-all"
        >
          Book <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

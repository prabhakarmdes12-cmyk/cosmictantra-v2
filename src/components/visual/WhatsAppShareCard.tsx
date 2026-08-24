'use client';

import React from 'react';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';

interface WhatsAppShareCardProps {
  title: string;
  tithi: string;
  nakshatra: string;
  rahuKaal: string;
  abhijit: string;
  date: string;
  onDownload?: () => void;
}

export default function WhatsAppShareCard({
  title,
  tithi,
  nakshatra,
  rahuKaal,
  abhijit,
  date,
  onDownload,
}: WhatsAppShareCardProps) {
  const handleDownload = async () => {
    const cardElement = document.getElementById('whatsapp-card');
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        backgroundColor: '#FAF7F2',
      });

      const link = document.createElement('a');
      link.download = `cosmictantra-${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      if (onDownload) onDownload();
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('Could not generate image. Please try again.');
    }
  };

  return (
    <div className="relative w-full max-w-[360px] mx-auto">
      <div 
        id="whatsapp-card"
        className="aspect-[9/16] bg-gradient-to-b from-[#FAF7F2] to-[#F5EEDC] border border-[#8E6F1D]/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-[#8E6F1D]/20">
          <div className="text-[#8E6F1D] text-xs tracking-[4px] font-mono mb-1">श्री काशी विश्वनाथो विजयते</div>
          <div className="font-editorial text-4xl font-bold text-[#1C1917]">CosmicTantra</div>
          <div className="text-xs text-[#857E74] mt-1">Lahiri Ephemeris • Varanasi</div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-8 space-y-8">
          <div>
            <div className="text-xs uppercase tracking-[2px] text-[#8E6F1D]">TODAY • {date}</div>
            <div className="font-editorial text-5xl font-bold tracking-tight text-[#1C1917] mt-1">{title}</div>
          </div>

          <div className="space-y-6 text-sm">
            <div className="flex justify-between border-b border-[#8E6F1D]/20 pb-4">
              <span className="text-[#857E74]">तिथि (Tithi)</span>
              <span className="font-semibold text-[#1C1917]">{tithi}</span>
            </div>
            <div className="flex justify-between border-b border-[#8E6F1D]/20 pb-4">
              <span className="text-[#857E74]">नक्षत्र (Nakshatra)</span>
              <span className="font-semibold text-[#1C1917]">{nakshatra}</span>
            </div>
            <div className="flex justify-between border-b border-[#8E6F1D]/20 pb-4">
              <span className="text-[#857E74]">राहुकाल</span>
              <span className="font-mono text-rose-700">{rahuKaal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#857E74]">अभिजित मुहूर्त</span>
              <span className="font-mono text-emerald-700">{abhijit}</span>
            </div>
          </div>
        </div>

        {/* Footer Seal */}
        <div className="px-8 py-6 border-t border-[#8E6F1D]/20 bg-white/70 flex items-center justify-between">
          <div className="text-[10px] text-[#8E6F1D] font-mono">Calculated by CosmicTantra • Verified</div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8E6F1D] hover:text-[#1C1917]"
          >
            <Download className="w-3.5 h-3.5" /> DOWNLOAD
          </button>
        </div>
      </div>
    </div>
  );
}

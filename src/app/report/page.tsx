'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import { getActiveProfile } from '@/lib/profileStore';

export default function WrittenFolioReport() {
  const profile = getActiveProfile();

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const gold = '#8E6F1D';
    const dark = '#1C1917';

    // === HEADER ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(gold);
    doc.text('श्री काशी विश्वनाथो विजयते', 105, 18, { align: 'center' });

    doc.setFontSize(26);
    doc.setTextColor(dark);
    doc.text('CosmicTantra', 105, 28, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor('#665E55');
    doc.text('Lahiri Ephemeris • Verified Scholarly Written Folio', 105, 34, { align: 'center' });

    doc.setDrawColor(gold);
    doc.setLineWidth(0.6);
    doc.line(20, 40, 190, 40);

    // === SEEKER INFO ===
    doc.setFontSize(10);
    doc.setTextColor(dark);
    doc.text(`Seeker: ${profile?.name || 'Priya Sharma'}`, 20, 48);
    doc.text(`Cosmic ID: ${profile?.cosmicId || 'CT-4821'}`, 190, 48, { align: 'right' });
    doc.text(`Folio ID: CT-2026-0825-001`, 20, 54);
    doc.text(`Date: 25 August 2026`, 190, 54, { align: 'right' });

    // === QUESTION ===
    doc.setFontSize(11);
    doc.text('Question:', 20, 65);
    doc.setFontSize(10);
    doc.text('Will changing my business direction in the next six months be favourable for my long-term financial growth?', 20, 72, { maxWidth: 170 });

    // === KUNDALI SUMMARY ===
    doc.setFontSize(12);
    doc.setTextColor(gold);
    doc.text('कुण्डली सारांश (Kundali Summary)', 20, 88);

    doc.setFontSize(10);
    doc.setTextColor(dark);
    doc.text(`Lagna: Vrishabha (Taurus)    |    Moon: Rohini Nakshatra    |    Current Dasha: Moon Mahadasha (42%)`, 20, 95);

    // === SYNTHESIS ===
    doc.setFillColor(250, 247, 242);
    doc.rect(20, 102, 170, 72, 'F');
    doc.setDrawColor(gold);
    doc.rect(20, 102, 170, 72);

    doc.setFontSize(12);
    doc.setTextColor(gold);
    doc.text('विद्वत्-विवेचना (Scholarly Synthesis)', 25, 110);

    doc.setFontSize(10);
    doc.setTextColor(dark);
    const synthesis = `Your current Moon Mahadasha supports nurturing and creative ventures. The upcoming Jupiter Antardasha (Nov 2026) brings strong expansion in the 10th and 11th houses. This is a highly auspicious window for strategic business pivots. The 7th and 11th house connections indicate positive outcomes in partnerships and gains.`;
    doc.text(synthesis, 25, 118, { maxWidth: 160 });

    // === DASHA TIMELINE ===
    doc.setFontSize(12);
    doc.setTextColor(gold);
    doc.text('विंशोत्तरी दशा (Current Vimshottari Dasha)', 20, 185);

    doc.setFontSize(10);
    doc.setTextColor(dark);
    doc.text(`Moon Mahadasha → Jupiter Antardasha (Nov 2026 – Mar 2028) → Strong growth phase`, 20, 192);

    // === SATVIK UPAYA ===
    doc.setFontSize(12);
    doc.setTextColor(gold);
    doc.text('सात्त्विक उपाय (Satvik Upaya)', 20, 205);

    doc.setFontSize(10);
    doc.setTextColor(dark);
    doc.text('• Daily recitation of Shri Sukta (11 times) before sunrise', 20, 212);
    doc.text('• Offer yellow flowers to Lord Vishnu on Thursdays', 20, 218);
    doc.text('• Perform small Lakshmi-Ganesh puja before initiating major changes', 20, 224);

    // === RECOMMENDATION ===
    doc.setFontSize(11);
    doc.setTextColor(gold);
    doc.text('Recommended Action:', 20, 235);
    doc.setFontSize(10);
    doc.setTextColor(dark);
    doc.text('This is an excellent window for strategic business direction change. Proceed with planning in October–November 2026.', 20, 242, { maxWidth: 170 });

    // === FOOTER ===
    doc.setFontSize(8);
    doc.setTextColor('#665E55');
    doc.text('Verified by Pt. Vidyadhar Shastri • Sampurnanand Sanskrit University, Varanasi', 105, 270, { align: 'center' });
    doc.text('© CosmicTantra 2026 • Chitra Paksha (Lahiri) Sidereal Mathematics • शुभ दक्षिणा ₹५०१', 105, 276, { align: 'center' });

    doc.save('CosmicTantra-Written-Folio.pdf');
  };

  return (
    <main className="min-h-screen bg-[#FAF7F2] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline px-4 py-1 rounded-full bg-[#8E6F1D]/10 text-[#8E6F1D] text-xs tracking-[3px]">WRITTEN FOLIO PREVIEW</div>
          <h1 className="font-editorial text-5xl font-bold mt-3 tracking-tight">Vedic Decision Synthesis</h1>
          <p className="text-[#57524A] mt-2">शुभ दक्षिणा ₹५०१ • Permanent Written Counsel</p>
        </div>

        {/* Preview Card */}
        <div className="rounded-3xl border border-[#8E6F1D]/30 bg-white p-10 shadow-xl">
          <div className="text-center border-b pb-8">
            <div className="text-xs tracking-[4px] text-[#8E6F1D]">श्री काशी विश्वनाथो विजयते</div>
            <div className="font-editorial text-4xl mt-2">CosmicTantra</div>
            <div className="text-xs text-[#857E74] mt-1">Lahiri Ephemeris • Verified Scholarly Written Folio</div>
          </div>

          <div className="mt-8 text-sm">
            <div className="flex justify-between text-xs text-[#857E74]">
              <div><strong>Seeker:</strong> Priya Sharma</div>
              <div><strong>Folio ID:</strong> CT-2026-0825-001</div>
            </div>
            <div className="mt-6 text-[#1C1917]">
              <strong>Question:</strong> Will changing my business direction in the next six months be favourable for my long-term financial growth?
            </div>
          </div>

          <div className="mt-10 p-8 border border-[#8E6F1D]/20 bg-[#FAF7F2] rounded-2xl">
            <div className="font-semibold text-[#8E6F1D]">विद्वत्-विवेचना (Scholarly Synthesis)</div>
            <p className="mt-4 text-[#44403C] leading-relaxed">
              Your current Moon Mahadasha (42% complete) supports nurturing and creative ventures. 
              The upcoming Jupiter Antardasha (starting November 2026) brings strong expansion energy 
              in the 10th and 11th houses. This is an auspicious window for strategic pivots...
            </p>
            <div className="mt-6 text-sm font-medium text-[#8E6F1D]">
              Recommended Action: Perform a small Lakshmi-Ganesh puja before initiating major changes.
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#8E6F1D] text-white font-semibold text-sm"
          >
            <Download className="w-4 h-4" /> DOWNLOAD PRINT-READY PDF
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-[#8E6F1D]/30 text-sm font-medium"
          >
            <Printer className="w-4 h-4" /> PRINT FOLIO
          </button>
        </div>

        <p className="text-center text-xs text-[#857E74] mt-6">This document carries the dignity of a traditional written counsel. Keep it safely.</p>
      </div>
    </main>
  );
}

'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';

export default function WrittenFolioReport() {
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Colors
    const gold = '#8E6F1D';
    const dark = '#1C1917';
    const parchment = '#FAF7F2';

    // Header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(gold);
    doc.text('श्री काशी विश्वनाथो विजयते', 105, 20, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(dark);
    doc.text('CosmicTantra', 105, 32, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor('#665E55');
    doc.text('Lahiri Ephemeris • Verified Scholarly Written Folio', 105, 39, { align: 'center' });

    // Divider
    doc.setDrawColor(gold);
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Seeker Info
    doc.setFontSize(11);
    doc.setTextColor(dark);
    doc.text('Seeker: Priya Sharma', 20, 55);
    doc.text('Folio ID: CT-2026-0825-001', 190, 55, { align: 'right' });

    // Question
    doc.setFontSize(12);
    doc.text('Question:', 20, 68);
    doc.setFontSize(11);
    doc.text('Will changing my business direction in the next six months be favourable for my long-term financial growth?', 20, 75, { maxWidth: 170 });

    // Synthesis Box
    doc.setFillColor(250, 247, 242);
    doc.rect(20, 90, 170, 85, 'F');
    doc.setDrawColor(gold);
    doc.rect(20, 90, 170, 85);

    doc.setFontSize(13);
    doc.setTextColor(gold);
    doc.text('विद्वत्-विवेचना (Scholarly Synthesis)', 25, 100);

    doc.setFontSize(11);
    doc.setTextColor(dark);
    const synthesisText = `Your current Moon Mahadasha (42% complete) supports nurturing and creative ventures. The upcoming Jupiter Antardasha (starting November 2026) brings strong expansion energy in the 10th and 11th houses. This is an auspicious window for strategic pivots.`;
    doc.text(synthesisText, 25, 110, { maxWidth: 160 });

    doc.setFontSize(11);
    doc.setTextColor(gold);
    doc.text('Recommended Action: Perform a small Lakshmi-Ganesh puja before initiating major changes.', 25, 155, { maxWidth: 160 });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor('#665E55');
    doc.text('Verified by Pt. Vidyadhar Shastri • Sampurnanand Sanskrit University', 105, 270, { align: 'center' });
    doc.text('© CosmicTantra 2026 • Chitra Paksha (Lahiri) Sidereal Mathematics', 105, 276, { align: 'center' });

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

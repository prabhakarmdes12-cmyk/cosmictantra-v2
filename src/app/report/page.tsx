'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';

export default function WrittenFolioReport() {
  const handleDownload = () => {
    // In real implementation: use jsPDF or html2canvas
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>CosmicTantra — Written Folio</title></head>
          <body style="font-family: 'Cinzel', serif; padding: 40px; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; border-bottom: 2px solid #8E6F1D; padding-bottom: 20px;">
              <div style="font-size: 14px; color: #8E6F1D; letter-spacing: 4px;">श्री काशी विश्वनाथो विजयते</div>
              <h1 style="font-size: 42px; margin: 10px 0;">CosmicTantra</h1>
              <div style="font-size: 13px; color: #665E55;">Lahiri Ephemeris • Verified Scholarly Written Folio</div>
            </div>
            
            <div style="margin-top: 40px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #665E55;">
                <div><strong>Seeker:</strong> Priya Sharma</div>
                <div><strong>Folio ID:</strong> CT-2026-0825-001</div>
              </div>
              <div style="margin-top: 30px; font-size: 15px; line-height: 1.7;">
                <strong>Question:</strong> Will changing my business direction in the next six months be favourable for my long-term financial growth?
              </div>
            </div>

            <div style="margin-top: 50px; padding: 30px; border: 1px solid #8E6F1D; background: #FAF7F2;">
              <h3 style="font-size: 18px; color: #8E6F1D;">विद्वत्-विवेचना (Scholarly Synthesis)</h3>
              <p style="margin-top: 15px; line-height: 1.75; color: #1C1917;">
                Your current Moon Mahadasha (42% complete) supports nurturing and creative ventures. 
                The upcoming Jupiter Antardasha (starting November 2026) brings strong expansion energy 
                in the 10th and 11th houses. This is an auspicious window for strategic pivots...
              </p>
              <div style="margin-top: 25px; font-size: 13px; color: #8E6F1D;">
                <strong>Recommended Action:</strong> Perform a small Lakshmi-Ganesh puja before initiating major changes.
              </div>
            </div>

            <div style="margin-top: 60px; text-align: center; font-size: 12px; color: #665E55;">
              Verified by Pt. Vidyadhar Shastri • Sampurnanand Sanskrit University<br />
              © CosmicTantra 2026 • Chitra Paksha (Lahiri) Sidereal Mathematics
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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
            onClick={handleDownload}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#8E6F1D] text-white font-semibold text-sm"
          >
            <Download className="w-4 h-4" /> DOWNLOAD PRINT-READY PDF
          </button>
          <button 
            onClick={handleDownload}
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

'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import CosmicTantraShell from '@/components/layout/CosmicTantraShell';
import { getActiveProfile } from '@/lib/profileStore';
import { getSmartUpayaRecommendations } from '@/lib/upayaEngine';

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
    const muted = '#665E55';

    let currentY = 18;

    // === 1. HEADER (Latin / Transliterated text to guarantee zero WinAnsi mojibake) ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(gold);
    doc.text('SHRI KASHI VISHWANATHO VIJAYATE', 105, currentY, { align: 'center' });
    currentY += 8;

    doc.setFontSize(24);
    doc.setTextColor(dark);
    doc.text('CosmicTantra', 105, currentY, { align: 'center' });
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(muted);
    doc.text('Lahiri Sidereal Ephemeris • Verified Scholarly Written Folio', 105, currentY, { align: 'center' });
    currentY += 5;

    doc.setDrawColor(gold);
    doc.setLineWidth(0.6);
    doc.line(20, currentY, 190, currentY);
    currentY += 8;

    // === 2. SEEKER & FOLIO IDENTIFIERS ===
    doc.setFontSize(9.5);
    doc.setTextColor(dark);
    doc.text(`Seeker: ${profile?.name || 'Priya Sharma'}`, 20, currentY);
    doc.text(`Cosmic ID: ${profile?.cosmicId || 'CT-4821'}`, 190, currentY, { align: 'right' });
    currentY += 6;

    doc.text(`Folio ID: CT-2026-0825-001`, 20, currentY);
    doc.text(`Date: 25 August 2026`, 190, currentY, { align: 'right' });
    currentY += 10;

    // === 3. QUESTION SECTION ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(gold);
    doc.text('FOCUSED QUESTION FOR SCHOLAR:', 20, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(dark);
    const questionText = 'Will changing my business direction in the next six months be favourable for my long-term financial growth?';
    const qLines = doc.splitTextToSize(questionText, 170);
    doc.text(qLines, 20, currentY);
    currentY += qLines.length * 5 + 8;

    // === 4. KUNDALI SUMMARY ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(gold);
    doc.text('JANMA PATRIKA SUMMARY', 20, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(dark);
    doc.text('Lagna: Vrishabha (Taurus)   |   Moon: Rohini Nakshatra   |   Active: Moon Mahadasha (42%)', 20, currentY);
    currentY += 10;

    // === 5. SCHOLARLY SYNTHESIS BOX (Dynamic Height Cursor) ===
    const synthesis = 'Your current Moon Mahadasha supports nurturing and creative ventures. The upcoming Jupiter Antardasha (starting November 2026) brings strong expansion energy in the 10th and 11th houses. This represents a highly auspicious window for strategic pivots. The 7th and 11th house connections indicate positive outcomes in partnerships and gains.';
    const synthLines = doc.splitTextToSize(synthesis, 160);
    const synthBoxHeight = synthLines.length * 5 + 24;

    doc.setFillColor(250, 247, 242);
    doc.rect(20, currentY, 170, synthBoxHeight, 'F');
    doc.setDrawColor(gold);
    doc.setLineWidth(0.4);
    doc.rect(20, currentY, 170, synthBoxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(gold);
    doc.text('SCHOLARLY SYNTHESIS & COUNSEL (VIDWAT VIVECHANA)', 25, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(dark);
    doc.text(synthLines, 25, currentY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(gold);
    doc.text('Recommended Action: Perform small Lakshmi-Ganesh puja before major agreements.', 25, currentY + synthBoxHeight - 4);
    currentY += synthBoxHeight + 10;

    // === 6. RECOMMENDED VEDIC UPAYA ===
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(gold);
    doc.text('RECOMMENDED SATTVIC UPAYA (PLANETARY REMEDIES)', 20, currentY);
    currentY += 6;

    const smartUpayas = getSmartUpayaRecommendations(
      'Vrishabha',
      'Rohini',
      'Moon Mahadasha',
      questionText
    );

    smartUpayas.slice(0, 2).forEach((u) => {
      doc.setFillColor(250, 247, 242);
      doc.rect(20, currentY, 170, 16, 'F');
      doc.setDrawColor(gold);
      doc.rect(20, currentY, 170, 16);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(dark);
      doc.text(`${u.type}: ${u.name}`, 24, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(muted);
      doc.text(`${u.reason} • ${u.priceRange}`, 24, currentY + 12);
      currentY += 20;
    });

    currentY += 4;

    // === 7. PROVENANCE & REVIEW METADATA ===
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(muted);
    doc.text('Reviewed and approved by Pt. Vidyanand Shastri • Kashi Vidwat Parishad Tradition', 105, 275, { align: 'center' });
    doc.text('© CosmicTantra 2026 • Chitra Paksha (Lahiri) Sidereal Ephemeris • Verified Folio', 105, 280, { align: 'center' });

    doc.save('CosmicTantra-Written-Folio-CT-4821.pdf');
  };

  return (
    <CosmicTantraShell>
      <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto print:max-w-none print:p-0">
        {/* Header */}
        <div className="text-center mb-8 print:hidden">
          <div className="inline-block px-3.5 py-1 rounded-full bg-[#8E6F1D]/15 dark:bg-[#D4AF37]/20 text-[#8E6F1D] dark:text-[#F0C968] text-xs font-mono-data font-bold tracking-[2px]">
            WRITTEN FOLIO PREVIEW
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-[#1C1917] dark:text-[#FFFFFF] mt-3 tracking-tight">
            Vedic Decision Synthesis
          </h1>
          <p className="text-sm font-mono-data text-[#696256] dark:text-[#B3ADA3] mt-2">
            Permanent Archival Written Counsel • Approved by Senior Jyotishi
          </p>
        </div>

        {/* Archival Folio Sheet */}
        <div className="rounded-3xl border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-white dark:bg-[#0E101D] p-6 sm:p-10 shadow-2xl print:shadow-none print:border print:rounded-none print:p-8 print:max-w-[210mm] transition-colors">
          {/* Top Inscription Header */}
          <div className="text-center border-b border-black/10 dark:border-white/10 pb-8 print:pb-6">
            <div className="text-xs font-mono-data tracking-[4px] text-[#8E6F1D] dark:text-[#F0C968] font-bold">
              श्री काशी विश्वनाथो विजयते
            </div>
            <div className="font-editorial text-3xl sm:text-4xl text-[#1C1917] dark:text-[#FFFFFF] mt-2 font-bold tracking-wide">
              CosmicTantra
            </div>
            <div className="text-xs font-mono-data text-[#696256] dark:text-[#9E988D] mt-1">
              Lahiri Ephemeris • Verified Scholarly Written Folio
            </div>
          </div>

          {/* Seeker Info Row */}
          <div className="mt-8 text-xs sm:text-sm font-mono-data print:mt-6">
            <div className="flex justify-between text-[#696256] dark:text-[#B3ADA3] border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div><strong className="text-[#1C1917] dark:text-white">Seeker:</strong> Priya Sharma</div>
              <div><strong className="text-[#1C1917] dark:text-white">Folio ID:</strong> CT-2026-0825-001</div>
            </div>
            <div className="mt-4 text-[#1C1917] dark:text-[#FFFFFF]">
              <strong className="text-[#8E6F1D] dark:text-[#D4AF37]">Focused Question:</strong> Will changing my business direction in the next six months be favourable for my long-term financial growth?
            </div>
          </div>

          {/* Scholarly Synthesis Box */}
          <div className="mt-8 p-6 sm:p-8 border border-[#8E6F1D]/30 dark:border-[#D4AF37]/40 bg-[#FAF7F2] dark:bg-[#070912] rounded-2xl print:mt-6 print:p-6 print:bg-white">
            <div className="font-editorial text-lg font-bold text-[#8E6F1D] dark:text-[#F0C968]">
              विद्वत्-विवेचना (Scholarly Synthesis)
            </div>
            <p className="mt-4 text-sm sm:text-base text-[#1C1917] dark:text-[#E7E5E4] leading-relaxed">
              Your current Moon Mahadasha (42% complete) supports nurturing and creative ventures. 
              The upcoming Jupiter Antardasha (starting November 2026) brings strong expansion energy 
              in the 10th and 11th houses. This is an auspicious window for strategic pivots...
            </p>
            <div className="mt-6 text-sm font-mono-data font-semibold text-[#8E6F1D] dark:text-[#F0C968] pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
              Recommended Action: Perform a small Lakshmi-Ganesh puja before initiating major changes.
            </div>
          </div>

          {/* Provenance Stamp */}
          <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono-data text-[#696256] dark:text-[#8E877B]">
            <div>Reviewed and approved by <strong>Pt. Vidyanand Shastri</strong> (Varanasi)</div>
            <div>Approved at 25 Aug 2026 • Calculation Engine v2.4</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
          <button 
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#8E6F1D] dark:bg-[#D4AF37] text-white dark:text-[#060709] font-mono-data font-bold text-sm hover:bg-[#A35C15] dark:hover:bg-[#E5C378] transition-all shadow-xl"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD FOLIO PDF</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-[#8E6F1D]/40 dark:border-[#D4AF37]/50 text-xs font-mono-data font-bold text-[#1C1917] dark:text-[#FFFFFF] hover:border-[#8E6F1D] transition-all bg-white/70 dark:bg-white/5"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT FOLIO</span>
          </button>
        </div>

        <p className="text-center text-xs font-mono-data text-[#696256] dark:text-[#9E988D] mt-6 print:hidden">
          This document carries the dignity of a traditional written counsel. Keep it safely.
        </p>
      </div>
    </CosmicTantraShell>
  );
}


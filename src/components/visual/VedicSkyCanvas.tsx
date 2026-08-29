'use client';

import React, { useRef, useEffect, useState } from 'react';

interface PlanetPos {
  id: string;
  name: string;
  nameHi: string;
  symbol: string;
  color: string;
  longitude: number; // 0 to 360 deg
  speed: number;
  isRetrograde?: boolean;
  isCombust?: boolean;
  declination: number; // -23.5 to +23.5
}

interface VedicSkyCanvasProps {
  planets: PlanetPos[];
  julianDay: number;
  lstHours: number; // Local Sidereal Time in hours (0 to 24)
  latitude: number;
  activePlanetId: string | null;
  onSelectPlanet: (id: string) => void;
}

const RASHIS = [
  { name: 'Aries', nameHi: 'मेष', symbol: '♈', startDeg: 0, lord: 'Mars' },
  { name: 'Taurus', nameHi: 'वृषभ', symbol: '♉', startDeg: 30, lord: 'Venus' },
  { name: 'Gemini', nameHi: 'मिथुन', symbol: '♊', startDeg: 60, lord: 'Mercury' },
  { name: 'Cancer', nameHi: 'कर्क', symbol: '♋', startDeg: 90, lord: 'Moon' },
  { name: 'Leo', nameHi: 'सिंह', symbol: '♌', startDeg: 120, lord: 'Sun' },
  { name: 'Virgo', nameHi: 'कन्या', symbol: '♍', startDeg: 150, lord: 'Mercury' },
  { name: 'Libra', nameHi: 'तुला', symbol: '♎', startDeg: 180, lord: 'Venus' },
  { name: 'Scorpio', nameHi: 'वृश्चिक', symbol: '♏', startDeg: 210, lord: 'Mars' },
  { name: 'Sagittarius', nameHi: 'धनु', symbol: '♐', startDeg: 240, lord: 'Jupiter' },
  { name: 'Capricorn', nameHi: 'मकर', symbol: '♑', startDeg: 270, lord: 'Saturn' },
  { name: 'Aquarius', nameHi: 'कुम्भ', symbol: '♒', startDeg: 300, lord: 'Saturn' },
  { name: 'Pisces', nameHi: 'मीन', symbol: '♓', startDeg: 330, lord: 'Jupiter' }
];

const NAKSHATRAS = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'अश्लेषा',
  'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
  'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपद', 'उत्तराभाद्रपद', 'रेवती'
];

export default function VedicSkyCanvas({
  planets,
  julianDay,
  lstHours,
  latitude,
  activePlanetId,
  onSelectPlanet
}: VedicSkyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredPlanet, setHoveredPlanet] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI retina screens
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(centerX, centerY) - 24;
    const innerRadius = outerRadius * 0.72;
    const coreRadius = outerRadius * 0.35;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Deep space radial background
    const spaceGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, outerRadius);
    spaceGrad.addColorStop(0, '#0F1226');
    spaceGrad.addColorStop(0.6, '#080A14');
    spaceGrad.addColorStop(1, '#030408');
    ctx.fillStyle = spaceGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fill();

    // Background Stars (Deterministic distribution)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 90; i++) {
      const starAngle = (i * 137.5 * Math.PI) / 180;
      const starDist = Math.sqrt(i / 90) * (outerRadius - 10);
      const sx = centerX + Math.cos(starAngle) * starDist;
      const sy = centerY + Math.sin(starAngle) * starDist;
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3 === 0 ? 1.2 : 0.7), 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. Draw 12 Rashi Sectors (Zodiac Wheels)
    const lstDeg = (lstHours * 15) % 360;
    const rotationOffset = (-lstDeg * Math.PI) / 180 - Math.PI / 2;

    for (let i = 0; i < 12; i++) {
      const startAngle = (i * 30 * Math.PI) / 180 + rotationOffset;
      const endAngle = ((i + 1) * 30 * Math.PI) / 180 + rotationOffset;

      // Outer Rashi Ring Band
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.stroke();

      // Divider lines
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(startAngle) * innerRadius, centerY + Math.sin(startAngle) * innerRadius);
      ctx.lineTo(centerX + Math.cos(startAngle) * outerRadius, centerY + Math.sin(startAngle) * outerRadius);
      ctx.stroke();

      // Rashi Label & Icon
      const midAngle = startAngle + (15 * Math.PI) / 180;
      const labelDist = (outerRadius + innerRadius) / 2;
      const lx = centerX + Math.cos(midAngle) * labelDist;
      const ly = centerY + Math.sin(midAngle) * labelDist;

      ctx.fillStyle = '#D4AF37';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${RASHIS[i].symbol} ${RASHIS[i].nameHi}`, lx, ly);
    }

    // 2. Draw 27 Nakshatra Inner Ring (13° 20' each)
    const nakshatraRadius = innerRadius;
    const nakshatraInner = innerRadius - 20;

    for (let j = 0; j < 27; j++) {
      const nStart = (j * (360 / 27) * Math.PI) / 180 + rotationOffset;
      const nEnd = ((j + 1) * (360 / 27) * Math.PI) / 180 + rotationOffset;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, nakshatraRadius, nStart, nEnd);
      ctx.stroke();

      // Tick mark
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(nStart) * nakshatraInner, centerY + Math.sin(nStart) * nakshatraInner);
      ctx.lineTo(centerX + Math.cos(nStart) * nakshatraRadius, centerY + Math.sin(nStart) * nakshatraRadius);
      ctx.stroke();

      // Alternate label for readability
      if (j % 2 === 0) {
        const nMid = nStart + ((360 / 54) * Math.PI) / 180;
        const nx = centerX + Math.cos(nMid) * (nakshatraInner - 8);
        const ny = centerY + Math.sin(nMid) * (nakshatraInner - 8);
        ctx.fillStyle = 'rgba(209, 201, 191, 0.6)';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(NAKSHATRAS[j], nx, ny);
      }
    }

    // 3. Draw Cardinal Horizon Axes (Lagna / Asta / Zenith / Nadir)
    // Eastern Horizon (Lagna) = Left (9 o'clock)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX - outerRadius, centerY);
    ctx.lineTo(centerX + outerRadius, centerY);
    ctx.stroke();

    // Meridian (Zenith/Nadir) = Top/Bottom
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - outerRadius);
    ctx.lineTo(centerX, centerY + outerRadius);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis Labels
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#10B981';
    ctx.fillText('EAST • लग्न (Lagna)', centerX - outerRadius + 45, centerY - 8);
    ctx.fillText('WEST • अस्त (Asta)', centerX + outerRadius - 45, centerY - 8);
    ctx.fillStyle = '#F59E0B';
    ctx.fillText('SOUTH • दशम (Midheaven)', centerX, centerY - outerRadius + 14);
    ctx.fillText('NORTH • चतुर्थ (Nadir)', centerX, centerY + outerRadius - 14);

    // 4. Center Earth Sphere
    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#FAF7F2';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('🌍', centerX, centerY);

    // 5. Draw 9 Navagraha Positions along their ecliptic longitude
    planets.forEach((p) => {
      const pAngle = (p.longitude * Math.PI) / 180 + rotationOffset;
      // Distance based on inner zone
      const pDist = innerRadius * 0.78;
      const px = centerX + Math.cos(pAngle) * pDist;
      const py = centerY + Math.sin(pAngle) * pDist;

      const isSelected = activePlanetId === p.id;
      const isHovered = hoveredPlanet === p.id;

      // Glow halo
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}33`;
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Planet Orbit connector to Earth
      ctx.strokeStyle = `${p.color}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Planet Circle
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.strokeStyle = '#FAF7F2';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Planet Glyph / Symbol
      ctx.fillStyle = '#060709';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.symbol, px, py);

      // Planet Sanskrit Name Callout
      ctx.fillStyle = '#FAF7F2';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(p.nameHi, px, py + 16);
    });

  }, [planets, julianDay, lstHours, latitude, activePlanetId, hoveredPlanet]);

  return (
    <div className="relative w-full aspect-square max-w-[580px] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-[#8E6F1D]/40 bg-[#06070B]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
      />
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-mono-data text-amber-400 font-bold flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>दृग्-गणित प्रत्यक्ष वेधशाला • Real-Time Sidereal Ephemeris</span>
      </div>
    </div>
  );
}

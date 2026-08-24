import React, { useRef, useEffect, useState } from 'react';
import { Orbit, RotateCw } from 'lucide-react';
import { NAKSHATRA_NAMES } from '../lib/astrologyEngine';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

export default function SwargaLok({ lang = 'en', theme = 'dark' }) {
  const canvasRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const t = TRANSLATIONS[lang]?.swargaLok || TRANSLATIONS.en.swargaLok;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 380;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rx = Math.min(canvas.width * 0.40, 260);
      const ry = rx * 0.42;

      const isLight = theme === 'light';

      // Fixed background stars
      ctx.fillStyle = isLight ? '#1C1917' : '#ffffff';
      for (let i = 0; i < 35; i++) {
        const sx = (cx + Math.sin(i * 137 + angle * 0.05) * (canvas.width * 0.45)) % canvas.width;
        const sy = (cy + Math.cos(i * 93 + angle * 0.05) * 160) % canvas.height;
        ctx.globalAlpha = isLight ? 0.12 : 0.2 + (Math.sin(i + angle * 1.5) * 0.1);
        ctx.fillRect(sx, sy, 1.3, 1.3);
      }

      // Ecliptic Circle (Gold)
      ctx.globalAlpha = isLight ? 0.6 : 0.45;
      ctx.strokeStyle = isLight ? '#8E6F1D' : '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.12, 0, Math.PI * 2);
      ctx.stroke();

      // Equator Circle (Indigo)
      ctx.strokeStyle = isLight ? '#4848A8' : '#8B8BF5';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * 0.78, ry * 0.78, -0.08, 0, Math.PI * 2);
      ctx.stroke();

      // 27 Nakshatras
      NAKSHATRA_NAMES.forEach((nak, i) => {
        const theta = (i * (Math.PI * 2) / 27) + angle;
        const px = cx + rx * Math.cos(theta);
        const py = cy + ry * Math.sin(theta);
        const isBehind = Math.sin(theta) < 0;

        ctx.globalAlpha = isBehind ? 0.25 : 0.95;
        
        ctx.fillStyle = i % 2 === 0 ? (isLight ? '#8E6F1D' : '#D4AF37') : (isLight ? '#C26E22' : '#E29A48');
        ctx.beginPath();
        ctx.arc(px, py, isBehind ? 2 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Node labels
        if (!isBehind && i % 3 === 0) {
          ctx.fillStyle = isLight ? '#1C1917' : '#EFECE6';
          ctx.font = '10px "JetBrains Mono"';
          ctx.fillText(nak, px + 7, py + 3);
        }
      });

      if (autoRotate) {
        angle += 0.0025;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [autoRotate, theme]);

  return (
    <section id="swarga-lok-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] observatory-varanasi-bg relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="text-[11px] font-mono-data text-[#8E6F1D] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
            <Orbit className="w-3.5 h-3.5 text-[#E29A48]" />
            <span>{t.tag}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1917] dark:text-[#EFECE6]">
            {t.heading}
          </h2>
          <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#AAA49A] font-mono-data mt-2">
            {t.subheading}
          </p>
        </div>

        {/* 3D Celestial Sky Canvas */}
        <div className="rounded-2xl bg-[#FFFFFF]/90 dark:bg-[#060810]/85 backdrop-blur-xl border border-black/[0.08] dark:border-[#D4AF37]/35 p-5 sm:p-7 shadow-2xl transition-colors duration-300">
          
          <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3 mb-2 text-xs font-mono-data text-[#857E74] dark:text-[#736E67]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E29A48] animate-pulse" />
              <span>{t.canvasTag}</span>
            </span>

            <button
              onClick={() => {
                chitiSensory.playTick();
                setAutoRotate(!autoRotate);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#0E1120] border border-black/[0.08] dark:border-[#D4AF37]/30 text-[#1C1917] dark:text-[#EFECE6] hover:border-[#D4AF37] transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>{autoRotate ? t.pause : t.resume}</span>
            </button>
          </div>

          <div className="w-full relative flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full max-w-4xl" />
          </div>

          {/* Overlay Info Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-black/[0.08] dark:border-white/[0.08] text-xs font-mono-data">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0B0E1C] border border-black/[0.06] dark:border-[#D4AF37]/20 text-center">
              <div className="text-[#8E6F1D] dark:text-[#D4AF37] font-semibold">{t.mansions}</div>
              <div className="text-[10px] text-[#857E74] dark:text-[#736E67] mt-0.5">{t.mansionsSub}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0B0E1C] border border-black/[0.06] dark:border-[#D4AF37]/20 text-center">
              <div className="text-[#4848A8] dark:text-[#8B8BF5] font-semibold">{t.ayanamshaPlane}</div>
              <div className="text-[10px] text-[#857E74] dark:text-[#736E67] mt-0.5">{t.ayanamshaSub}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0B0E1C] border border-black/[0.06] dark:border-[#D4AF37]/20 text-center">
              <div className="text-[#C26E22] dark:text-[#E29A48] font-semibold">{t.orbits}</div>
              <div className="text-[10px] text-[#857E74] dark:text-[#736E67] mt-0.5">{t.orbitsSub}</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

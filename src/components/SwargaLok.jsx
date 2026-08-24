import React, { useState, useEffect, useRef } from 'react';
import { Orbit, RotateCw, Play, Pause, Sparkles, X, Shield, Info, Compass } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

const NAVAGRAHA = [
  {
    id: 'sun',
    name: 'Sun',
    sanskrit: 'Surya (सूर्य)',
    deity: 'Aditya Dev',
    symbol: '☀️',
    distance: 0,
    size: 28,
    color: '#FF9933',
    lightColor: '#D97706',
    speed: 0,
    element: 'Fire (Agni)',
    day: 'Sunday (Ravivar)',
    gemstone: 'Ruby (Manikya)',
    mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    category: 'LUMINARY',
    meaning: 'The Cosmic Soul (Atman). Governs core identity, vitality, father, authority, leadership, and divine illumination.',
    qualities: ['Soul', 'Authority', 'Vitality', 'Dharma'],
  },
  {
    id: 'moon',
    name: 'Moon',
    sanskrit: 'Chandra (चन्द्र)',
    deity: 'Soma Dev',
    symbol: '☽',
    distance: 65,
    size: 14,
    color: '#E0E7FF',
    lightColor: '#4F46E5',
    speed: 0.022,
    element: 'Water (Jala)',
    day: 'Monday (Somvar)',
    gemstone: 'Pearl (Moti)',
    mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    category: 'LUMINARY',
    meaning: 'The Cosmic Mind (Manas). Governs emotions, mother, peace, memory, intuition, and subconscious energy.',
    qualities: ['Mind', 'Emotions', 'Intuition', 'Nurturing'],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    sanskrit: 'Budha (बुध)',
    deity: 'Vishnu Dev',
    symbol: '☿',
    distance: 105,
    size: 13,
    color: '#34D399',
    lightColor: '#059669',
    speed: 0.016,
    element: 'Earth (Prithvi)',
    day: 'Wednesday (Budhvar)',
    gemstone: 'Emerald (Panna)',
    mantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    category: 'BENEFIC',
    meaning: 'The Cosmic Messenger. Governs intellect (Buddhi), speech, mathematics, commerce, trade, and analytical logic.',
    qualities: ['Intellect', 'Speech', 'Commerce', 'Logic'],
  },
  {
    id: 'venus',
    name: 'Venus',
    sanskrit: 'Shukra (शुक्र)',
    deity: 'Mahalakshmi',
    symbol: '♀',
    distance: 145,
    size: 16,
    color: '#F472B6',
    lightColor: '#DB2777',
    speed: 0.012,
    element: 'Water (Jala)',
    day: 'Friday (Shukravar)',
    gemstone: 'Diamond (Heera)',
    mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    category: 'BENEFIC',
    meaning: 'The Cosmic Beloved. Great benefic governing love, beauty, refinement, luxury, relationships, and devotion.',
    qualities: ['Love', 'Beauty', 'Harmony', 'Prosperity'],
  },
  {
    id: 'mars',
    name: 'Mars',
    sanskrit: 'Mangala (मंगल)',
    deity: 'Kartikeya',
    symbol: '♂',
    distance: 185,
    size: 15,
    color: '#F87171',
    lightColor: '#DC2626',
    speed: 0.009,
    element: 'Fire (Agni)',
    day: 'Tuesday (Mangalvar)',
    gemstone: 'Red Coral (Moonga)',
    mantra: 'Om Kraam Kreem Kraum Sah Bhaumaaya Namah',
    category: 'MALEFIC',
    meaning: 'The Cosmic Warrior. Governs courage, physical energy, passion, landed property, siblings, and decisive action.',
    qualities: ['Courage', 'Action', 'Energy', 'Property'],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    sanskrit: 'Guru / Brihaspati (गुरु)',
    deity: 'Lord Brahma / Dakshinamurthy',
    symbol: '♃',
    distance: 235,
    size: 22,
    color: '#FBBF24',
    lightColor: '#D97706',
    speed: 0.006,
    element: 'Ether (Akasha)',
    day: 'Thursday (Guruvar)',
    gemstone: 'Yellow Sapphire (Pukhraj)',
    mantra: 'Om Graam Greem Graum Sah Guruve Namah',
    category: 'BENEFIC',
    meaning: 'The Cosmic Teacher. Supreme benefic governing higher wisdom, dharma, spiritual grace, children, and expansion.',
    qualities: ['Wisdom', 'Dharma', 'Grace', 'Expansion'],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    sanskrit: 'Shani (शनि)',
    deity: 'Lord Yama / Hanuman',
    symbol: '♄',
    distance: 285,
    size: 19,
    color: '#60A5FA',
    lightColor: '#2563EB',
    speed: 0.004,
    element: 'Air (Vayu)',
    day: 'Saturday (Shanivar)',
    gemstone: 'Blue Sapphire (Neelam)',
    mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    category: 'MALEFIC',
    meaning: 'The Cosmic Judge. Governs Karma, discipline, perseverance, longevity, structure, delays, and spiritual realization.',
    qualities: ['Karma', 'Discipline', 'Longevity', 'Patience'],
  },
  {
    id: 'rahu',
    name: 'Rahu',
    sanskrit: 'Rahu (राहु)',
    deity: 'Durga Devi',
    symbol: '☊',
    distance: 330,
    size: 14,
    color: '#C084FC',
    lightColor: '#7C3AED',
    speed: -0.005,
    element: 'Air (Vayu)',
    day: 'Saturday (Shadow)',
    gemstone: 'Hessonite (Gomed)',
    mantra: 'Om Bhram Bhreem Bhraum Sah Rahave Namah',
    category: 'NODE',
    meaning: 'The North Shadow Node. Governs worldly ambition, innovation, foreign lands, technology, and karmic desire.',
    qualities: ['Ambition', 'Innovation', 'Foreign', 'Desire'],
  },
  {
    id: 'ketu',
    name: 'Ketu',
    sanskrit: 'Ketu (केतु)',
    deity: 'Ganesha Dev',
    symbol: '☋',
    distance: 360,
    size: 14,
    color: '#F97316',
    lightColor: '#C2410C',
    speed: -0.005,
    element: 'Fire (Agni)',
    day: 'Tuesday (Shadow)',
    gemstone: "Cat's Eye (Lehsunia)",
    mantra: 'Om Shraam Shreem Shraum Sah Ketave Namah',
    category: 'NODE',
    meaning: 'The South Shadow Node. Governs Moksha, spiritual liberation, intuition, past-life mastery, and detachment.',
    qualities: ['Moksha', 'Intuition', 'Detachment', 'Past Karma'],
  },
];

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export default function SwargaLok({ lang = 'en', theme = 'dark', kundaliData = null }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState(NAVAGRAHA[0]);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [rotationAngle, setRotationAngle] = useState(0);

  // Touch Drag State for Mobile Swipe Orbit Rotation
  const touchStartXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const t = TRANSLATIONS[lang]?.swargaLok || TRANSLATIONS.en.swargaLok;

  // Interactive 3D Ecliptic Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let angle = rotationAngle;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const isMobile = parent.clientWidth < 640;
        canvas.width = parent.clientWidth;
        canvas.height = isMobile ? Math.min(parent.clientWidth * 0.72, 340) : Math.min(parent.clientWidth * 0.52, 460);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const isMobile = canvas.width < 640;
      
      const rx = Math.min(canvas.width * (isMobile ? 0.45 : 0.42), 380);
      const ry = rx * (isMobile ? 0.42 : 0.38);
      const isLight = theme === 'light';

      // 1. Starfield Cosmic Background
      ctx.fillStyle = isLight ? '#1C1917' : '#FFFFFF';
      for (let i = 0; i < (isMobile ? 35 : 60); i++) {
        const sx = (cx + Math.sin(i * 137.5 + angle * 0.03) * (canvas.width * 0.48)) % canvas.width;
        const sy = (cy + Math.cos(i * 93.1 + angle * 0.03) * (canvas.height * 0.48)) % canvas.height;
        ctx.globalAlpha = isLight ? 0.08 : 0.18 + Math.sin(i + angle * 1.2) * 0.12;
        ctx.fillRect(Math.abs(sx), Math.abs(sy), i % 3 === 0 ? 2 : 1.2, i % 3 === 0 ? 2 : 1.2);
      }

      // 2. Outer 27 Nakshatra Sidereal Ring
      ctx.globalAlpha = isLight ? 0.35 : 0.28;
      ctx.strokeStyle = isLight ? '#826315' : '#D4AF37';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0.08, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw 27 Nakshatra Nodes along Ecliptic Ring
      NAKSHATRA_NAMES.forEach((nak, i) => {
        const theta = (i * (Math.PI * 2) / 27) + angle;
        const px = cx + rx * Math.cos(theta);
        const py = cy + ry * Math.sin(theta);
        const isBehind = Math.sin(theta) < 0;

        ctx.globalAlpha = isBehind ? 0.18 : 0.85;
        ctx.fillStyle = i % 2 === 0 ? (isLight ? '#826315' : '#D4AF37') : (isLight ? '#A6461D' : '#E29A48');
        ctx.beginPath();
        ctx.arc(px, py, isBehind ? 1.5 : (isMobile ? 2 : 2.5), 0, Math.PI * 2);
        ctx.fill();

        if (!isBehind && i % (isMobile ? 4 : 3) === 0) {
          ctx.fillStyle = isLight ? '#1C1917' : '#EFECE6';
          ctx.font = isMobile ? '8px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
          ctx.fillText(nak, px + 4, py + 3);
        }
      });

      // 3. Planetary Orbits & Graha Bodies
      NAVAGRAHA.forEach((planet, idx) => {
        const isSelected = selectedPlanet?.id === planet.id;
        const isFilteredOut = filterCategory !== 'ALL' && planet.category !== filterCategory && planet.id !== 'sun';

        if (planet.distance > 0) {
          const orbitRx = (planet.distance / 360) * rx;
          const orbitRy = orbitRx * (isMobile ? 0.42 : 0.38);

          // Orbit Line
          ctx.globalAlpha = isSelected ? (isLight ? 0.95 : 0.9) : isFilteredOut ? 0.06 : (isLight ? 0.28 : 0.22);
          ctx.strokeStyle = isSelected ? planet.color : (isLight ? '#826315' : '#D4AF37');
          ctx.lineWidth = isSelected ? 2.5 : 1;
          ctx.beginPath();
          ctx.ellipse(cx, cy, orbitRx, orbitRy, 0.08, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Calculate Graha Position
        let px = cx;
        let py = cy;

        if (planet.distance > 0) {
          const theta = angle * (planet.speed * 80) + idx * 0.78;
          const orbitRx = (planet.distance / 360) * rx;
          const orbitRy = orbitRx * (isMobile ? 0.42 : 0.38);
          px = cx + orbitRx * Math.cos(theta);
          py = cy + orbitRy * Math.sin(theta);
        }

        ctx.globalAlpha = isFilteredOut ? 0.18 : 1;
        const sizeRadius = (planet.size / 2) * (isMobile ? 0.85 : 1);

        // Active Pulse Halo Ring on Selection
        if (isSelected) {
          ctx.strokeStyle = planet.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, sizeRadius + (isMobile ? 5 : 7), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Planet Body Fill & Glow
        ctx.fillStyle = isLight ? planet.lightColor : planet.color;
        ctx.beginPath();
        ctx.arc(px, py, sizeRadius, 0, Math.PI * 2);
        ctx.fill();

        // Saturn Ring Detail
        if (planet.id === 'saturn') {
          ctx.strokeStyle = isLight ? '#2563EB' : '#93C5FD';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(px, py, sizeRadius * 1.8, sizeRadius * 0.6, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Graha Symbol Label
        ctx.fillStyle = planet.id === 'sun' ? '#030108' : (isLight ? '#1C1917' : '#FFFFFF');
        ctx.font = planet.id === 'sun' ? (isMobile ? '12px sans-serif' : '14px sans-serif') : (isMobile ? '9px sans-serif' : '10px sans-serif');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(planet.symbol, px, py);

        // Graha Name Tag (Always visible on mobile for clarity)
        if (isSelected || planet.id === 'sun' || !isMobile || idx % 2 === 0) {
          ctx.fillStyle = isSelected ? (isLight ? '#826315' : '#D4AF37') : (isLight ? '#4A443B' : '#C4BEB3');
          ctx.font = isSelected ? 'bold 10px "JetBrains Mono"' : (isMobile ? '8px "JetBrains Mono"' : '9px "JetBrains Mono"');
          ctx.fillText(planet.name, px, py - (sizeRadius + (isMobile ? 8 : 10)));
        }
      });

      if (isPlaying) {
        angle += 0.0018;
        setRotationAngle(angle);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, selectedPlanet, filterCategory, theme, rotationAngle]);

  // Click & Touch Position Locator for Selecting Graha Node
  const handleInteractionSelect = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const isMobile = canvas.width < 640;
    const rx = Math.min(canvas.width * (isMobile ? 0.45 : 0.42), 380);

    let closestPlanet = null;
    let minDistance = isMobile ? 45 : 35; // Touch-friendly hit target area

    NAVAGRAHA.forEach((planet, idx) => {
      let px = cx;
      let py = cy;

      if (planet.distance > 0) {
        const theta = rotationAngle * (planet.speed * 80) + idx * 0.78;
        const orbitRx = (planet.distance / 360) * rx;
        const orbitRy = orbitRx * (isMobile ? 0.42 : 0.38);
        px = cx + orbitRx * Math.cos(theta);
        py = cy + orbitRy * Math.sin(theta);
      }

      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist < minDistance) {
        minDistance = dist;
        closestPlanet = planet;
      }
    });

    if (closestPlanet) {
      chitiSensory.playTick();
      setSelectedPlanet(closestPlanet);
    }
  };

  const handleCanvasClick = (e) => {
    handleInteractionSelect(e.clientX, e.clientY);
  };

  // Touch Swipe Drag Orbit Handler
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      isDraggingRef.current = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = e.touches[0].clientX;
    setRotationAngle(prev => prev + deltaX * 0.006);
  };

  const handleTouchEnd = (e) => {
    isDraggingRef.current = false;
    if (e.changedTouches.length === 1) {
      handleInteractionSelect(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  };

  return (
    <section id="swarga-lok-section" className="py-20 lg:py-28 border-b border-black/[0.08] dark:border-white/[0.08] observatory-varanasi-bg relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Section Header with Increased Breathing Space */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-2.5 max-w-2xl">
            <div className="text-[11px] font-mono-data text-[#826315] dark:text-[#D4AF37] uppercase tracking-[0.26em] flex items-center gap-2 font-bold">
              <Orbit className="w-4 h-4 text-[#E29A48] animate-pulse" />
              <span>॥ नवग्रह ब्रह्मांड • 3D NAVAGRAHA OBSERVATORY ॥</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#181512] dark:text-[#F5F2EB] leading-tight">
              See the sky behind the numbers.
            </h2>
            <p className="text-sm sm:text-base text-[#4A443B] dark:text-[#C4BEB3] font-mono-data leading-relaxed">
              Inspired by the 18th-century stone Jantar Mantar at Man Singh Observatory overlooking the sacred Ganges at Varanasi.
            </p>
          </div>

          {/* Touch-Friendly Graha Category Pills */}
          <div className="flex flex-wrap items-center gap-2 font-mono-data text-xs pt-2 md:pt-0">
            {['ALL', 'LUMINARY', 'BENEFIC', 'MALEFIC', 'NODE'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  chitiSensory.playTick();
                  setFilterCategory(cat);
                }}
                className={`px-3.5 py-2 min-h-[40px] rounded-xl border text-[11px] uppercase font-bold transition-all ${
                  filterCategory === cat
                    ? 'bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#826315] dark:border-[#D4AF37] shadow-sm'
                    : 'bg-[#FFFFFF]/90 dark:bg-[#0D0F18]/90 border-black/[0.1] dark:border-white/[0.1] text-[#4A443B] dark:text-[#C4BEB3] hover:border-[#826315] dark:hover:border-[#D4AF37]'
                }`}
              >
                {cat === 'ALL' ? 'All 9 Grahas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* 3D Celestial Sky Canvas Stage */}
          <div className={`${selectedPlanet ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} transition-all duration-300 rounded-3xl bg-[#FFFFFF]/95 dark:bg-[#070914]/94 backdrop-blur-2xl border border-black/[0.1] dark:border-[#D4AF37]/35 p-5 sm:p-7 shadow-2xl space-y-5`}>
            
            {/* Top Interactive Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4 gap-3 text-xs font-mono-data">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E29A48] animate-pulse shrink-0" />
                <span className="font-bold text-[#181512] dark:text-[#F5F2EB] uppercase tracking-wider text-[11px] sm:text-xs">
                  3D Sidereal Coordinate Sphere (27 Nakshatras & 9 Orbits)
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    setIsPlaying(!isPlaying);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF7F2] dark:bg-[#101322] border border-black/[0.1] dark:border-[#D4AF37]/30 text-[#181512] dark:text-[#F5F2EB] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all font-bold text-xs"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#A6461D] dark:text-[#F0A554]" /> : <Play className="w-3.5 h-3.5 text-[#34D399]" />}
                  <span>{isPlaying ? 'Pause Motion' : 'Resume Rotation'}</span>
                </button>
              </div>
            </div>

            {/* Canvas Container with Touch Swipe Support */}
            <div className="relative w-full overflow-hidden flex items-center justify-center rounded-2xl bg-[#FAF7F2] dark:bg-[#04050A] border border-black/[0.06] dark:border-white/[0.05] p-2">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-full cursor-pointer touch-none"
              />

              {/* Bottom Interactive Hint Badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#FFFFFF]/95 dark:bg-[#090B16]/95 backdrop-blur-md border border-black/[0.1] dark:border-[#D4AF37]/40 text-[11px] font-mono-data text-[#826315] dark:text-[#E5C378] font-bold shadow-md flex items-center gap-2 pointer-events-none text-center max-w-[90%] sm:max-w-none">
                <Sparkles className="w-3.5 h-3.5 text-[#E29A48] animate-spin shrink-0" />
                <span>Tap any Graha in sky or drag horizontally to rotate view</span>
              </div>
            </div>

            {/* Graha Selector Pills Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 font-mono-data">
              {NAVAGRAHA.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    chitiSensory.playTick();
                    setSelectedPlanet(p);
                  }}
                  className={`px-3 py-2 min-h-[38px] rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                    selectedPlanet?.id === p.id
                      ? 'bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#826315] dark:border-[#D4AF37] font-bold shadow-sm'
                      : 'bg-[#FAF7F2] dark:bg-[#0D0F1A] border-black/[0.08] dark:border-white/[0.08] text-[#4A443B] dark:text-[#C4BEB3] hover:border-[#826315] dark:hover:border-[#D4AF37]'
                  }`}
                >
                  <span>{p.symbol}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

          </div>

          {/* Selected Graha Parashari Wisdom Drawer */}
          {selectedPlanet && (
            <div className="lg:col-span-5 xl:col-span-4 rounded-3xl bg-[#FFFFFF]/95 dark:bg-[#070914]/96 backdrop-blur-2xl border border-black/[0.12] dark:border-[#D4AF37]/35 p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm shrink-0"
                    style={{ backgroundColor: theme === 'light' ? selectedPlanet.lightColor : selectedPlanet.color, color: selectedPlanet.id === 'sun' ? '#000' : '#fff' }}
                  >
                    {selectedPlanet.symbol}
                  </div>
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[#181512] dark:text-[#F5F2EB]">
                      {selectedPlanet.name}
                    </h3>
                    <span className="text-[11px] font-mono-data text-[#826315] dark:text-[#E5C378] font-bold uppercase block mt-0.5">
                      {selectedPlanet.sanskrit} • {selectedPlanet.deity}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlanet(null)}
                  className="p-2 rounded-xl border border-black/[0.1] dark:border-white/[0.1] text-[#696256] dark:text-[#8E887E] hover:text-[#181512] dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Natal Position Callout (If Active Birth Profile exists) */}
              {kundaliData?.planets?.[selectedPlanet.name] ? (
                <div className="p-4 rounded-2xl bg-[#E3F5EC] dark:bg-[#081810] border border-[#0D5A37] dark:border-[#10b981]/50 text-xs font-mono-data space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-[#0D5A37] dark:text-[#34d399] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Your Natal Chart Placement:
                  </div>
                  <div className="text-[#181512] dark:text-[#F5F2EB]">
                    Rasi: <strong>{kundaliData.planets[selectedPlanet.name].rasiName}</strong> ({kundaliData.planets[selectedPlanet.name].longitude.toFixed(2)}°)
                  </div>
                  <div className="text-[#181512] dark:text-[#F5F2EB]">
                    House: <strong>Bhava {kundaliData.planets[selectedPlanet.name].house}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0D0F1C] border border-black/[0.08] dark:border-white/[0.08] text-xs font-mono-data text-[#696256] dark:text-[#8E887E] flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-[#826315] dark:text-[#E5C378] shrink-0" />
                  <span>Enter your birth details in <strong>Section 06</strong> to map your personal natal chart onto this sky model.</span>
                </div>
              )}

              {/* Parashari Core Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono-data">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0E1A] border border-black/[0.06] dark:border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-[#696256] dark:text-[#8E887E] font-bold">Tattva (Element)</div>
                  <div className="font-bold text-[#181512] dark:text-[#F5F2EB] mt-0.5">{selectedPlanet.element}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0E1A] border border-black/[0.06] dark:border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-[#696256] dark:text-[#8E887E] font-bold">Vara (Sacred Day)</div>
                  <div className="font-bold text-[#181512] dark:text-[#F5F2EB] mt-0.5">{selectedPlanet.day}</div>
                </div>
              </div>

              {/* Parashari Cosmic Significance */}
              <div className="space-y-1.5 font-mono-data text-xs">
                <span className="text-[10px] uppercase font-bold text-[#826315] dark:text-[#E5C378] tracking-wider">Parashari Significance</span>
                <p className="text-[#4A443B] dark:text-[#C4BEB3] leading-relaxed text-xs sm:text-sm">
                  {selectedPlanet.meaning}
                </p>
              </div>

              {/* Beered Beej Mantra */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.08] dark:border-[#D4AF37]/30 space-y-1.5 font-mono-data">
                <span className="text-[10px] uppercase font-bold text-[#A6461D] dark:text-[#E2825B] tracking-wider">Sacred Beej Mantra</span>
                <div className="text-xs sm:text-sm font-bold text-[#826315] dark:text-[#E5C378] italic">
                  "{selectedPlanet.mantra}"
                </div>
                <div className="text-[11px] text-[#696256] dark:text-[#8E887E] pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  Vedic Gemstone: <strong className="text-[#181512] dark:text-[#F5F2EB]">{selectedPlanet.gemstone}</strong>
                </div>
              </div>

              {/* Qualities Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedPlanet.qualities.map((q, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-[#FAF7F2] dark:bg-[#101322] border border-black/[0.08] dark:border-[#D4AF37]/30 text-[11px] font-mono-data font-bold text-[#826315] dark:text-[#E5C378]"
                  >
                    ✦ {q}
                  </span>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}

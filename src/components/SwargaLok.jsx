import React, { useState, useEffect, useRef } from 'react';
import { Orbit, RotateCw, Play, Pause, Sparkles, X, Shield, Info } from 'lucide-react';
import { TRANSLATIONS } from '../lib/translations';
import { chitiSensory } from '../lib/chitiAudio';

const NAVAGRAHA = [
  {
    id: 'sun',
    name: 'Sun',
    sanskrit: 'Surya (सूर्य)',
    deity: 'Aditya',
    symbol: '☀️',
    distance: 0,
    size: 26,
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
    deity: 'Soma',
    symbol: '☽',
    distance: 65,
    size: 13,
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
    size: 12,
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
    size: 15,
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
    size: 14,
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
    size: 20,
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
    size: 18,
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
    size: 13,
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
    size: 13,
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
        canvas.width = parent.clientWidth;
        canvas.height = Math.min(parent.clientWidth * 0.55, 460);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rx = Math.min(canvas.width * 0.42, 380);
      const ry = rx * 0.38;
      const isLight = theme === 'light';

      // 1. Cosmic Starfield Background
      ctx.fillStyle = isLight ? '#1C1917' : '#FFFFFF';
      for (let i = 0; i < 60; i++) {
        const sx = (cx + Math.sin(i * 137.5 + angle * 0.03) * (canvas.width * 0.48)) % canvas.width;
        const sy = (cy + Math.cos(i * 93.1 + angle * 0.03) * (canvas.height * 0.48)) % canvas.height;
        ctx.globalAlpha = isLight ? 0.08 : 0.18 + Math.sin(i + angle * 1.2) * 0.12;
        ctx.fillRect(Math.abs(sx), Math.abs(sy), i % 3 === 0 ? 2 : 1.2, i % 3 === 0 ? 2 : 1.2);
      }

      // 2. Outer 27 Nakshatra Sidereal Band
      ctx.globalAlpha = isLight ? 0.3 : 0.25;
      ctx.strokeStyle = isLight ? '#826315' : '#D4AF37';
      ctx.lineWidth = 1;
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

        ctx.globalAlpha = isBehind ? 0.2 : 0.85;
        ctx.fillStyle = i % 2 === 0 ? (isLight ? '#826315' : '#D4AF37') : (isLight ? '#A6461D' : '#E29A48');
        ctx.beginPath();
        ctx.arc(px, py, isBehind ? 1.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (!isBehind && i % 3 === 0) {
          ctx.fillStyle = isLight ? '#1C1917' : '#EFECE6';
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillText(nak, px + 5, py + 3);
        }
      });

      // 3. Planetary Orbits & Graha Bodies
      NAVAGRAHA.forEach((planet, idx) => {
        const isSelected = selectedPlanet?.id === planet.id;
        const isFilteredOut = filterCategory !== 'ALL' && planet.category !== filterCategory && planet.id !== 'sun';

        if (planet.distance > 0) {
          const orbitRx = (planet.distance / 360) * rx;
          const orbitRy = orbitRx * 0.38;

          // Orbit Line
          ctx.globalAlpha = isSelected ? (isLight ? 0.9 : 0.85) : isFilteredOut ? 0.08 : (isLight ? 0.25 : 0.2);
          ctx.strokeStyle = isSelected ? planet.color : (isLight ? '#826315' : '#D4AF37');
          ctx.lineWidth = isSelected ? 2 : 1;
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
          const orbitRy = orbitRx * 0.38;
          px = cx + orbitRx * Math.cos(theta);
          py = cy + orbitRy * Math.sin(theta);
        }

        ctx.globalAlpha = isFilteredOut ? 0.2 : 1;

        // Active Pulse Halo Ring on Selection
        if (isSelected) {
          ctx.strokeStyle = planet.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, planet.size / 2 + 6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Planet Body Fill & Glow
        ctx.fillStyle = isLight ? planet.lightColor : planet.color;
        ctx.beginPath();
        ctx.arc(px, py, planet.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Saturn Ring Detail
        if (planet.id === 'saturn') {
          ctx.strokeStyle = isLight ? '#2563EB' : '#93C5FD';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(px, py, planet.size * 0.9, planet.size * 0.35, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Graha Symbol Label
        ctx.fillStyle = planet.id === 'sun' ? '#030108' : (isLight ? '#1C1917' : '#FFFFFF');
        ctx.font = planet.id === 'sun' ? '14px sans-serif' : '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(planet.symbol, px, py);

        // Graha Name Tag
        if (isSelected || planet.id === 'sun' || idx % 2 === 0) {
          ctx.fillStyle = isSelected ? (isLight ? '#826315' : '#D4AF37') : (isLight ? '#4A443B' : '#C4BEB3');
          ctx.font = isSelected ? 'bold 11px "JetBrains Mono"' : '10px "JetBrains Mono"';
          ctx.fillText(planet.name, px, py - (planet.size / 2 + 10));
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

  // Click handler to select planet from Canvas position
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const rx = Math.min(canvas.width * 0.42, 380);

    // Find nearest planet to click coordinates
    let closestPlanet = null;
    let minDistance = 35; // Click radius target

    NAVAGRAHA.forEach((planet, idx) => {
      let px = cx;
      let py = cy;

      if (planet.distance > 0) {
        const theta = rotationAngle * (planet.speed * 80) + idx * 0.78;
        const orbitRx = (planet.distance / 360) * rx;
        const orbitRy = orbitRx * 0.38;
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

  return (
    <section id="swarga-lok-section" className="py-16 lg:py-24 border-b border-black/[0.08] dark:border-white/[0.08] relative overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[11px] font-mono-data text-[#826315] dark:text-[#D4AF37] uppercase tracking-[0.24em] mb-1.5 flex items-center gap-2 font-bold">
              <Orbit className="w-3.5 h-3.5 text-[#E29A48] animate-pulse" />
              <span>॥ नवग्रह ब्रह्मांड • 3D NAVAGRAHA OBSERVATORY ॥</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#181512] dark:text-[#F5F2EB]">
              See the sky behind the numbers.
            </h2>
            <p className="text-xs sm:text-sm text-[#4A443B] dark:text-[#C4BEB3] font-mono-data mt-1.5 max-w-xl">
              Inspired by the 18th-century stone Jantar Mantar at Man Singh Observatory overlooking the sacred Ganges.
            </p>
          </div>

          {/* Graha Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono-data text-xs">
            {['ALL', 'LUMINARY', 'BENEFIC', 'MALEFIC', 'NODE'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  chitiSensory.playTick();
                  setFilterCategory(cat);
                }}
                className={`px-3 py-1.5 rounded-lg border text-[11px] uppercase font-bold transition-all ${
                  filterCategory === cat
                    ? 'bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#826315] dark:border-[#D4AF37] shadow-xs'
                    : 'bg-[#FFFFFF] dark:bg-[#0D0F18] border-black/[0.1] dark:border-white/[0.1] text-[#4A443B] dark:text-[#C4BEB3] hover:border-[#826315] dark:hover:border-[#D4AF37]'
                }`}
              >
                {cat === 'ALL' ? 'All 9 Grahas' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Interactive Stage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Center 3D Observatory Canvas */}
          <div className={`${selectedPlanet ? 'lg:col-span-8' : 'lg:col-span-12'} transition-all duration-300 rounded-2xl bg-[#FFFFFF] dark:bg-[#080A12]/92 backdrop-blur-xl border border-black/[0.12] dark:border-[#D4AF37]/35 p-5 sm:p-6 shadow-2xl space-y-4`}>
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3 text-xs font-mono-data text-[#696256] dark:text-[#8E887E]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E29A48] animate-pulse" />
                <span className="font-bold text-[#181512] dark:text-[#F5F2EB] uppercase tracking-wider">
                  3D Sidereal Coordinate Sphere (27 Nakshatras & 9 Orbits)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    chitiSensory.playTick();
                    setIsPlaying(!isPlaying);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#101322] border border-black/[0.1] dark:border-[#D4AF37]/30 text-[#181512] dark:text-[#F5F2EB] hover:border-[#826315] dark:hover:border-[#D4AF37] transition-all font-bold"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#A6461D] dark:text-[#F0A554]" /> : <Play className="w-3.5 h-3.5 text-[#34D399]" />}
                  <span>{isPlaying ? 'Pause Motion' : 'Resume Rotation'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas Container */}
            <div className="relative w-full overflow-hidden flex items-center justify-center rounded-xl bg-[#FAF7F2] dark:bg-[#04050A] border border-black/[0.06] dark:border-white/[0.05] p-2">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="w-full cursor-pointer touch-none"
              />

              {/* Bottom Interactive Hint Overlay */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#FFFFFF]/90 dark:bg-[#090B16]/90 backdrop-blur-md border border-black/[0.1] dark:border-[#D4AF37]/40 text-[11px] font-mono-data text-[#826315] dark:text-[#E5C378] font-bold shadow-md flex items-center gap-1.5 pointer-events-none">
                <Sparkles className="w-3.5 h-3.5 text-[#E29A48] animate-spin" />
                <span>Click any Graha node in sky to inspect Parashari wisdom</span>
              </div>
            </div>

            {/* Graha Quick Selector Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 font-mono-data">
              {NAVAGRAHA.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    chitiSensory.playTick();
                    setSelectedPlanet(p);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                    selectedPlanet?.id === p.id
                      ? 'bg-[#826315] dark:bg-[#D4AF37] text-white dark:text-[#060709] border-[#826315] dark:border-[#D4AF37] font-bold shadow-xs'
                      : 'bg-[#FAF7F2] dark:bg-[#0D0F1A] border-black/[0.08] dark:border-white/[0.08] text-[#4A443B] dark:text-[#C4BEB3] hover:border-[#826315] dark:hover:border-[#D4AF37]'
                  }`}
                >
                  <span>{p.symbol}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>

          </div>

          {/* Right Selected Graha Parashari Wisdom Drawer */}
          {selectedPlanet && (
            <div className="lg:col-span-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#080A12]/95 backdrop-blur-xl border border-black/[0.12] dark:border-[#D4AF37]/35 p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
              
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] pb-3">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold shadow-xs"
                    style={{ backgroundColor: theme === 'light' ? selectedPlanet.lightColor : selectedPlanet.color, color: selectedPlanet.id === 'sun' ? '#000' : '#fff' }}
                  >
                    {selectedPlanet.symbol}
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-[#181512] dark:text-[#F5F2EB]">
                      {selectedPlanet.name}
                    </h3>
                    <span className="text-[10px] font-mono-data text-[#826315] dark:text-[#E5C378] font-bold uppercase block">
                      {selectedPlanet.sanskrit} • {selectedPlanet.deity}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlanet(null)}
                  className="p-1.5 rounded-lg border border-black/[0.1] dark:border-white/[0.1] text-[#696256] dark:text-[#8E887E] hover:text-[#181512] dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Natal Kundali Position Callout (If Active Birth Profile exists) */}
              {kundaliData?.planets?.[selectedPlanet.name] ? (
                <div className="p-3.5 rounded-xl bg-[#E3F5EC] dark:bg-[#081810] border border-[#0D5A37] dark:border-[#10b981]/50 text-xs font-mono-data space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#0D5A37] dark:text-[#34d399] flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Your Natal Chart Placement:
                  </div>
                  <div className="text-[#181512] dark:text-[#F5F2EB]">
                    Rasi: <strong>{kundaliData.planets[selectedPlanet.name].rasiName}</strong> ({kundaliData.planets[selectedPlanet.name].longitude.toFixed(2)}°)
                  </div>
                  <div className="text-[#181512] dark:text-[#F5F2EB]">
                    House: <strong>Bhava {kundaliData.planets[selectedPlanet.name].house}</strong>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#0D0F1C] border border-black/[0.08] dark:border-white/[0.08] text-[11px] font-mono-data text-[#696256] dark:text-[#8E887E] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#826315] dark:text-[#E5C378] shrink-0" />
                  <span>Enter your birth details in <strong>Section 06</strong> to map your personal natal chart onto this sky model.</span>
                </div>
              )}

              {/* Parashari Core Attributes */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-data">
                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#0B0E1A] border border-black/[0.06] dark:border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-[#696256] dark:text-[#8E887E] font-bold">Tattva (Element)</div>
                  <div className="font-bold text-[#181512] dark:text-[#F5F2EB] mt-0.5">{selectedPlanet.element}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#0B0E1A] border border-black/[0.06] dark:border-white/[0.06]">
                  <div className="text-[9px] uppercase tracking-wider text-[#696256] dark:text-[#8E887E] font-bold">Vara (Sacred Day)</div>
                  <div className="font-bold text-[#181512] dark:text-[#F5F2EB] mt-0.5">{selectedPlanet.day}</div>
                </div>
              </div>

              {/* Cosmic Meaning */}
              <div className="space-y-1.5 font-mono-data text-xs">
                <span className="text-[10px] uppercase font-bold text-[#826315] dark:text-[#E5C378]">Parashari Significance</span>
                <p className="text-[#4A443B] dark:text-[#C4BEB3] leading-relaxed text-xs">
                  {selectedPlanet.meaning}
                </p>
              </div>

              {/* Beered Beej Mantra */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#05060A] border border-black/[0.08] dark:border-[#D4AF37]/30 space-y-1 font-mono-data">
                <span className="text-[9px] uppercase font-bold text-[#A6461D] dark:text-[#E2825B]">Sacred Beej Mantra</span>
                <div className="text-xs font-bold text-[#826315] dark:text-[#E5C378] italic">
                  "{selectedPlanet.mantra}"
                </div>
                <div className="text-[10px] text-[#696256] dark:text-[#8E887E] pt-1 border-t border-black/[0.06] dark:border-white/[0.06]">
                  Vedic Gemstone: <strong className="text-[#181512] dark:text-[#F5F2EB]">{selectedPlanet.gemstone}</strong>
                </div>
              </div>

              {/* Qualities Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedPlanet.qualities.map((q, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-[#FAF7F2] dark:bg-[#101322] border border-black/[0.08] dark:border-[#D4AF37]/30 text-[10px] font-mono-data font-bold text-[#826315] dark:text-[#E5C378]"
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

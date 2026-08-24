'use client';

import React, { useState, useEffect } from 'react';

const NAVAGRAHA = [
  { name: 'Sun',     distance: 0,   size: 26, color: '#FF9933', sanskrit: 'Surya',   deity: 'Surya Dev',   element: 'Fire',  day: 'Sunday'   },
  { name: 'Moon',    distance: 45,  size: 12, color: '#C8D8F0', sanskrit: 'Chandra', deity: 'Chandra Dev', element: 'Water', day: 'Monday'   },
  { name: 'Mercury', distance: 75,  size: 10, color: '#C8B890', sanskrit: 'Budha',   deity: 'Budha Dev',   element: 'Earth', day: 'Wednesday'},
  { name: 'Venus',   distance: 105, size: 14, color: '#FFE0B0', sanskrit: 'Shukra',  deity: 'Shukra Dev',  element: 'Water', day: 'Friday'   },
  { name: 'Mars',    distance: 135, size: 12, color: '#FF4444', sanskrit: 'Mangala', deity: 'Karttikeya',  element: 'Fire',  day: 'Tuesday'  },
  { name: 'Jupiter', distance: 170, size: 20, color: '#E8C49A', sanskrit: 'Guru',    deity: 'Brihaspati',  element: 'Ether', day: 'Thursday' },
  { name: 'Saturn',  distance: 205, size: 18, color: '#E8D9AA', sanskrit: 'Shani',   deity: 'Shani Dev',   element: 'Air',   day: 'Saturday' },
  { name: 'Rahu',    distance: 235, size: 11, color: '#AA44FF', sanskrit: 'Rahu',    deity: 'Rahu Graha',  element: 'Air',   day: 'Saturday' },
  { name: 'Ketu',    distance: 235, size: 11, color: '#CC8844', sanskrit: 'Ketu',    deity: 'Ketu Graha',  element: 'Fire',  day: 'Tuesday'  },
];

const PLANET_WISDOM = {
  Sun: {
    mantra: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    meaning: 'The cosmic soul — representing your ego, vitality, father, authority and divine light.',
    gemstone: 'Ruby (Manikya)',
    qualities: ['Soul', 'Vitality', 'Authority', 'Ego'],
  },
  Moon: {
    mantra: 'Om Shraam Shreem Shraum Sah Chandraya Namah',
    meaning: 'The cosmic mind — governing emotions, mother, home, intuition and the subconscious.',
    gemstone: 'Pearl (Moti)',
    qualities: ['Mind', 'Emotions', 'Mother', 'Intuition'],
  },
  Mars: {
    mantra: 'Om Kraam Kreem Kraum Sah Bhaumaaya Namah',
    meaning: 'The cosmic warrior — governing courage, energy, siblings, property and physical strength.',
    gemstone: 'Red Coral (Moonga)',
    qualities: ['Courage', 'Energy', 'Passion', 'Strength'],
  },
  Mercury: {
    mantra: 'Om Braam Breem Braum Sah Budhaya Namah',
    meaning: 'The cosmic messenger — governing intellect, communication, business and learning.',
    gemstone: 'Emerald (Panna)',
    qualities: ['Intellect', 'Speech', 'Trade', 'Logic'],
  },
  Jupiter: {
    mantra: 'Om Graam Greem Graum Sah Guruve Namah',
    meaning: 'The cosmic teacher — great benefic governing wisdom, dharma, children, and grace.',
    gemstone: 'Yellow Sapphire (Pukhraj)',
    qualities: ['Wisdom', 'Dharma', 'Prosperity', 'Grace'],
  },
  Venus: {
    mantra: 'Om Draam Dreem Draum Sah Shukraya Namah',
    meaning: 'The cosmic beloved — governing love, beauty, luxury, arts, marriage and harmony.',
    gemstone: 'Diamond (Heera)',
    qualities: ['Love', 'Beauty', 'Arts', 'Marriage'],
  },
  Saturn: {
    mantra: 'Om Praam Preem Praum Sah Shanaischaraya Namah',
    meaning: 'The cosmic judge — governing karma, discipline, longevity, delays and liberation.',
    gemstone: 'Blue Sapphire (Neelam)',
    qualities: ['Karma', 'Discipline', 'Longevity', 'Patience'],
  },
  Rahu: {
    mantra: 'Om Bhram Bhreem Bhraum Sah Rahave Namah',
    meaning: 'The cosmic obsession — shadow planet governing ambition, foreign lands, and innovation.',
    gemstone: 'Hessonite (Gomed)',
    qualities: ['Ambition', 'Illusion', 'Foreign', 'Innovation'],
  },
  Ketu: {
    mantra: 'Om Shraam Shreem Shraum Sah Ketave Namah',
    meaning: 'The cosmic liberation — shadow planet governing spirituality, detachment and moksha.',
    gemstone: "Cat's Eye (Lehsunia)",
    qualities: ['Liberation', 'Past life', 'Spirituality', 'Moksha'],
  },
};

export default function SwargaLok({ kundali }) {
  const [selected, setSelected] = useState(null);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicks(t => (t + 1) % 3600);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[450px] rounded-2xl bg-gradient-to-b from-[#0D0A2E] to-[#030108] border border-purple-500/30 overflow-hidden shadow-[0_8px_40px_rgba(124,58,237,0.25)] flex items-center justify-center p-4">
      {/* Background Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black opacity-80 pointer-events-none" />

      {/* Interactive Canvas Orbit System */}
      <svg className="w-full h-full max-w-[500px] max-h-[500px]" viewBox="-270 -270 540 540">
        {/* Orbits */}
        {NAVAGRAHA.filter(p => p.distance > 0).map(p => (
          <circle
            key={p.name}
            cx="0"
            cy="0"
            r={p.distance}
            fill="none"
            stroke={selected?.name === p.name ? p.color : 'rgba(124,58,237,0.2)'}
            strokeWidth={selected?.name === p.name ? '1.5' : '0.8'}
            strokeDasharray={selected?.name === p.name ? 'none' : '4,4'}
          />
        ))}

        {/* Center Sun */}
        <g onClick={() => setSelected(NAVAGRAHA[0])} className="cursor-pointer">
          <circle cx="0" cy="0" r="24" fill="#FF9933" filter="drop-shadow(0 0 16px #FF9933)" />
          <text x="0" y="4" textAnchor="middle" fontSize="12" fill="#030108" fontWeight="bold">☀️</text>
        </g>

        {/* Planets */}
        {NAVAGRAHA.filter(p => p.distance > 0).map((planet, idx) => {
          const speed = (idx + 1) * 0.008;
          const angle = ticks * speed + idx * 0.7;
          const x = Math.cos(angle) * planet.distance;
          const y = Math.sin(angle) * planet.distance;
          const isSel = selected?.name === planet.name;

          return (
            <g key={planet.name} transform={`translate(${x}, ${y})`} onClick={() => setSelected(planet)} className="cursor-pointer">
              {isSel && (
                <circle cx="0" cy="0" r={planet.size + 6} fill="none" stroke={planet.color} strokeWidth="1.5" className="animate-ping" />
              )}
              <circle cx="0" cy="0" r={planet.size / 2 + 2} fill={planet.color} filter={`drop-shadow(0 0 8px ${planet.color})`} />
              <text x="0" y="-12" textAnchor="middle" fontSize="10" fill={isSel ? '#FFFFFF' : '#9CA3AF'} fontWeight="bold">
                {planet.sanskrit}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Selected Planet Drawer */}
      {selected && (
        <div className="absolute top-0 right-0 bottom-0 w-72 bg-[#0D0A1E]/95 backdrop-blur-md border-l border-purple-500/30 p-5 overflow-y-auto z-20 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-purple-500/20 pb-3">
            <div>
              <span className="text-xl font-bold text-white">{selected.name}</span>
              <span className="text-xs text-[#A78BFA] block font-mono">{selected.sanskrit} ({selected.deity})</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-xs text-[#9CA3AF] hover:text-white px-2 py-1 bg-white/10 rounded-full">✕</button>
          </div>

          {kundali?.planets?.[selected.name] && (
            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs space-y-1">
              <div className="text-[10px] font-bold text-[#F59E0B] uppercase">Your Natal Chart Position:</div>
              <div>Rasi: <strong className="text-white">{kundali.planets[selected.name].rasiName}</strong></div>
              <div>House: <strong className="text-white">House {kundali.planets[selected.name].house}</strong></div>
              <div>Status: <strong className="text-[#6EE7B7]">{kundali.planets[selected.name].status}</strong></div>
            </div>
          )}

          {PLANET_WISDOM[selected.name] && (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-[#7C3AED] uppercase block mb-1">Sacred Meaning</span>
                <p className="text-[#D1D5DB] leading-relaxed">{PLANET_WISDOM[selected.name].meaning}</p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[10px] font-bold text-[#F59E0B] uppercase block mb-1">Sacred Mantra</span>
                <p className="text-[#A78BFA] font-mono italic text-[11px]">{PLANET_WISDOM[selected.name].mantra}</p>
                <span className="text-[10px] text-[#9CA3AF] block mt-1">Gemstone: <strong>{PLANET_WISDOM[selected.name].gemstone}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hint overlay */}
      {!selected && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-500/30 text-[11px] text-[#A78BFA] pointer-events-none">
          ✨ Click any planet to reveal its sacred Vedic wisdom
        </div>
      )}
    </div>
  );
}
